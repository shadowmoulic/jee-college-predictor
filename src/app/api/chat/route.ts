import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 4000;

function isValidMessages(value: unknown): value is { role: string; content: string }[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return false;
  return value.every(
    (m) =>
      m !== null &&
      typeof m === "object" &&
      typeof m.role === "string" &&
      ["user", "assistant", "system"].includes(m.role) &&
      typeof m.content === "string" &&
      m.content.length > 0 &&
      m.content.length <= MAX_CONTENT_LENGTH
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !isValidMessages(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages must be a non-empty array of {role, content} objects (max 50 messages, 4000 chars each)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: `You are an expert academic counselor for JEE Advanced and JoSAA counseling.
      You are part of the 'Nexus Predictor' platform.
      Help students understand their admission chances, college details, and answer their queries
      about various IITs, NITs, and IIITs in India. Be supportive, concise, and informative.`,
      messages: body.messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("An error occurred during chat", { status: 500 });
  }
}
