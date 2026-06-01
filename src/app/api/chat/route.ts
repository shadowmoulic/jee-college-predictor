import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

const MAX_MESSAGES = 50;

const nim = createOpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_NIM_API_KEY ?? "",
});

function isValidMessages(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return false;
  return value.every(
    (m) => m !== null && typeof m === "object" && ["user", "assistant", "system", "data"].includes((m as any).role)
  );
}

function buildSystemPrompt(context: Record<string, unknown> | null): string {
  const profile = context
    ? [
        `- Rank: ${context.rank} (${context.exam})`,
        `- Category: ${context.category}`,
        `- Home state: ${context.domicileState}`,
        `- Gender: ${context.gender}`,
        context.contextCollege ? `- Currently viewing: ${(context.contextCollege as any).name}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "Not provided — ask the student for rank, exam, and category before giving specific predictions.";

  return `You are Nexus AI, a sharp and concise JEE/JoSAA counselor built into the Nexus Predictor platform.

## STUDENT PROFILE
${profile}

## STRICT RULES — follow every rule, no exceptions

**No hallucination**
- NEVER invent cutoff ranks, placement packages, fees, or branch availability.
- If you don't know a specific number, say "Check josaa.nic.in for exact cutoffs" instead of guessing.
- Only mention colleges and branches you are confident are real and offered by that institution.

**Response format**
- Be direct. Start with the answer, not a preamble.
- Max 250 words for general questions. Max 400 words for "suggest colleges" type questions.
- Use **bold** for college/branch names.
- Use a markdown table when comparing 3+ options (columns: College | Branch | Why | Approx. Rank Needed).
- Use short bullet points for pros/cons — 1 line each, no sub-bullets.
- NEVER use numbered lists inside numbered lists.
- End with one focused follow-up question to narrow down the student's preferences.

**Tone**
- Talk like a knowledgeable senior, not a brochure.
- Be honest about trade-offs ("CS at IIT BHU is good but placement is weaker than old IITs").
- If the student's rank is too low for their dream college, say so clearly and redirect.

**Counseling focus**
- Always factor in home-state quota benefit when relevant.
- Distinguish JEE Main vs JEE Advanced colleges clearly.
- When suggesting branches, match to career goals if the student mentioned any.
- If career goals are unknown, ask once — don't assume.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !isValidMessages(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const coreMessages = (body.messages as any[])
      .filter((m) => ["user", "assistant", "system"].includes(m.role))
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content:
          typeof m.content === "string"
            ? m.content
            : Array.isArray(m.parts)
            ? m.parts
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("")
            : "",
      }))
      .filter((m) => m.content.length > 0);

    const result = streamText({
      model: nim.chat("meta/llama-3.3-70b-instruct"),
      system: buildSystemPrompt(body.context ?? null),
      messages: coreMessages,
      temperature: 0.2,
      topP: 0.7,
      maxOutputTokens: 1024,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("An error occurred during chat", { status: 500 });
  }
}
