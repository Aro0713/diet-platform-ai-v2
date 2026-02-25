// pages/api/robot-programs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function mustString(v: unknown, name: string): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`Missing ${name}`);
  return v.trim();
}
function optString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function optInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabaseUrl = mustString(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = mustString(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // accessToken: z query (GET) albo z body (DELETE)
    const accessToken =
      optString(req.query.accessToken) ||
      optString((req.body ?? {}).accessToken);

    if (!accessToken) return res.status(401).json({ error: "MISSING_ACCESS_TOKEN" });

    const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
    const userId = userData?.user?.id;
    if (userErr || !userId) return res.status(401).json({ error: "UNAUTHORIZED" });

    // GET: lista / latest
    if (req.method === "GET") {
      const latest = String(req.query.latest || "").toLowerCase() === "true";
      const limitRaw = optInt(req.query.limit) ?? (latest ? 1 : 5);
      const limit = Math.min(Math.max(limitRaw, 1), 25);

      const q = admin
        .from("patient_robot_programs")
        .select("id, robot_model, robot_serial, robot_profile, program_json, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      const { data, error } = await q;
      if (error) return res.status(500).json({ error: "PROGRAMS_FETCH_ERROR", details: error.message });

      return res.status(200).json({
        latest,
        items: data || []
      });
    }

    // DELETE: usuń program po id (opcjonalnie – ale produkcyjnie warto)
    if (req.method === "DELETE") {
      const id = optString(req.query.id) || optString((req.body ?? {}).id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      const { error } = await admin
        .from("patient_robot_programs")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);

      if (error) return res.status(500).json({ error: "PROGRAM_DELETE_ERROR", details: error.message });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e: any) {
    console.error("❌ /api/robot-programs:", e);
    return res.status(500).json({ error: "INTERNAL_ERROR", details: e?.message || "UNKNOWN" });
  }
}