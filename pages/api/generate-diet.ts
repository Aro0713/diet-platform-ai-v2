import { run } from "@openai/agents";
import { dietAgent } from "@/agents/dietAgent";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📨 DOSTAŁEM BODY:", JSON.stringify(body, null, 2));

    const result = await run(dietAgent, body);

    console.log("📤 WYNIK Z AGENTA:", result);
    console.log("🧾 ZAWARTOŚĆ finalOutput:", result?.finalOutput);

    return new Response(result?.finalOutput || "", {
      headers: { "Content-Type": "text/plain" }
    });

  } catch (err) {
    console.error("❌ BŁĄD W API generate-diet.ts:", err);
    return new Response("Błąd serwera przy generowaniu diety.", { status: 500 });
  }
}
