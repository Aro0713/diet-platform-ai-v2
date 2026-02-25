// pages/api/generate-robot-program.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { generateRoboRecipes } from "@/agents/roboAgent";

function mustString(v: unknown, name: string): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`Missing ${name}`);
  return v.trim();
}
function optString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// Stabilne stringify do hash (usuwa __meta i porządkuje klucze)
function stableStringify(value: any): string {
  const seen = new WeakSet();

  const clean = (v: any): any => {
    if (v === null || v === undefined) return v;
    if (typeof v !== "object") return v;
    if (seen.has(v)) return null;
    seen.add(v);

    if (Array.isArray(v)) return v.map(clean);

    const out: Record<string, any> = {};
    const keys = Object.keys(v)
      .filter(k => !String(k).startsWith("__")) // usuń meta/techniczne
      .sort();

    for (const k of keys) out[k] = clean(v[k]);
    return out;
  };

  return JSON.stringify(clean(value));
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const supabaseUrl = mustString(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = mustString(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const body = (req.body ?? {}) as any;

    const accessToken = optString(body.accessToken);
    if (!accessToken) return res.status(401).json({ error: "MISSING_ACCESS_TOKEN" });

    // ✅ weryfikacja użytkownika
    const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
    const userId = userData?.user?.id;
    if (userErr || !userId) return res.status(401).json({ error: "UNAUTHORIZED" });

    const dietPlan = body.dietPlan;
    const lang = optString(body.lang) || "pl";
    const robot = body.robot ?? {};

    if (!dietPlan || typeof dietPlan !== "object") {
      return res.status(400).json({ error: "MISSING_DIET_PLAN" });
    }

    // 🔎 pacjent = źródło prawdy
    const { data: patient, error: patientError } = await admin
      .from("patients")
      .select(
        "user_id, has_kitchen_robot, kitchen_robot_model, kitchen_robot_serial, kitchen_robot_profile, model, goal, cuisine"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (patientError) return res.status(500).json({ error: "PATIENT_FETCH_ERROR", details: patientError.message });
    if (!patient) return res.status(404).json({ error: "PATIENT_NOT_FOUND" });

    if (!patient.has_kitchen_robot) return res.status(400).json({ error: "ROBOT_NOT_DECLARED" });
    if (!patient.kitchen_robot_model || !patient.kitchen_robot_serial) {
      return res.status(400).json({ error: "ROBOT_CONFIG_INCOMPLETE" });
    }

    // (opcjonalnie) zgodność requestu z DB
    const requestedModel = optString(robot.model);
    const requestedSerial = optString(robot.serial);
    if (requestedModel && requestedModel !== patient.kitchen_robot_model) {
      return res.status(400).json({ error: "ROBOT_MODEL_MISMATCH" });
    }
    if (requestedSerial && requestedSerial !== patient.kitchen_robot_serial) {
      return res.status(400).json({ error: "ROBOT_SERIAL_MISMATCH" });
    }

    const robotProfile = optString(robot.profile) || patient.kitchen_robot_profile || "cobbo-tuya-v0";

    // ✅ diet_hash (deduplikacja)
    const dietHash = sha256(stableStringify(dietPlan));

    // 1) Spróbuj zwrócić istniejący program
    const { data: existing, error: existingErr } = await admin
      .from("patient_robot_programs")
      .select("id, diet_hash, robot_model, robot_serial, robot_profile, program_json, created_at")
      .eq("user_id", userId)
      .eq("diet_hash", dietHash)
      .eq("robot_serial", patient.kitchen_robot_serial)
      .maybeSingle();

    if (existingErr) {
      // nie przerywamy — tylko log
      console.warn("⚠️ patient_robot_programs lookup error:", existingErr.message);
    }

    if (existing?.program_json) {
      return res.status(200).json({
        profile: existing.robot_profile,
        cached: true,
        recipes: (existing.program_json as any)?.recipes ?? []
      });
    }

    // 2) Generuj nowy program
    const result = await generateRoboRecipes({
      lang,
      dietPlan,
      modelKey: patient.model || "",
      goal: patient.goal || "",
      cuisine: patient.cuisine || ""
      // profile: domyślny cobboProfileV0 w roboAgencie
    });

    const program = {
      recipes: result.recipes ?? []
    };

    // 3) Zapis do DB (programy)
    const { error: insErr } = await admin
      .from("patient_robot_programs")
      .insert({
        user_id: userId,
        diet_hash: dietHash,
        robot_model: patient.kitchen_robot_model,
        robot_serial: patient.kitchen_robot_serial,
        robot_profile: robotProfile,
        program_json: program
      });

    if (insErr) {
      // jeśli konflikt (unikalny index), to w praktyce ktoś kliknął 2x – zwróć to co jest
      console.warn("⚠️ insert patient_robot_programs:", insErr.message);

      const { data: existing2 } = await admin
        .from("patient_robot_programs")
        .select("robot_profile, program_json")
        .eq("user_id", userId)
        .eq("diet_hash", dietHash)
        .eq("robot_serial", patient.kitchen_robot_serial)
        .maybeSingle();

      if (existing2?.program_json) {
        return res.status(200).json({
          profile: existing2.robot_profile,
          cached: true,
          recipes: (existing2.program_json as any)?.recipes ?? []
        });
      }
      // w ostateczności idziemy dalej i zwracamy świeżo wygenerowane
    }

    // (opcjonalnie) update profilu w patients
    if (robotProfile && robotProfile !== patient.kitchen_robot_profile) {
      await admin
        .from("patients")
        .update({ kitchen_robot_profile: robotProfile, kitchen_robot_linked_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return res.status(200).json({
      profile: robotProfile,
      cached: false,
      recipes: program.recipes
    });
  } catch (e: any) {
    console.error("❌ /api/generate-robot-program:", e);
    return res.status(500).json({ error: "ROBOT_PROGRAM_FAILED", details: e?.message || "UNKNOWN" });
  }
}