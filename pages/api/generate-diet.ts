import { run } from "@openai/agents";
import { dietAgent } from "@/agents/dietAgent";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json(); // { form, interviewData, ... }

  const result = await run(
    dietAgent,
    body, // to zostaje przekazane do narzędzia przez agenta
    {
      // możesz dodać context, jeśli potrzebujesz
    }
  );

  return new Response(result.finalOutput, {
    headers: { "Content-Type": "application/json" },
  });
}
