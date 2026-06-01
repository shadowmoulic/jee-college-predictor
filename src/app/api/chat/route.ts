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

type PredictedBranch = {
  name: string;
  degree?: string;
  prob: "high" | "medium" | "low";
  openingRank: number;
  closingRank: number;
  quota?: string;
  seatType?: string;
};

type PredictedCollege = {
  college: string;
  instituteType?: string;
  state?: string;
  avgPackage?: string;
  branches: PredictedBranch[];
};

function formatResultsContext(resultsContext: PredictedCollege[]): string {
  if (!resultsContext || resultsContext.length === 0) return "";

  // Group by probability
  type RowItem = PredictedBranch & { college: string; type: string | undefined };
  const high: RowItem[] = resultsContext.flatMap((c) =>
    c.branches.filter((b) => b.prob === "high").map((b) => ({ ...b, college: c.college, type: c.instituteType }))
  );
  const medium: RowItem[] = resultsContext.flatMap((c) =>
    c.branches.filter((b) => b.prob === "medium").map((b) => ({ ...b, college: c.college, type: c.instituteType }))
  );

  const formatRow = (item: RowItem) =>
    `  • ${item.college} — ${item.name} | OR: ${item.openingRank?.toLocaleString()} | CR: ${item.closingRank?.toLocaleString()} | Quota: ${item.quota ?? "AI"} | Seat: ${item.seatType ?? "OPEN"}`;

  const lines: string[] = [
    `=== REAL JoSAA PREDICTION DATA FOR THIS STUDENT (${resultsContext.length} colleges matched) ===`,
    "",
    `HIGH PROBABILITY (${high.length} branches — student's rank is comfortably within closing rank):`,
    ...high.slice(0, 15).map(formatRow),
    high.length > 15 ? `  ... and ${high.length - 15} more high-prob branches` : "",
    "",
    `MEDIUM PROBABILITY (${medium.length} branches — rank is near the cutoff):`,
    ...medium.slice(0, 10).map(formatRow),
    medium.length > 10 ? `  ... and ${medium.length - 10} more medium-prob branches` : "",
    "",
    "IMPORTANT: These are REAL cutoffs from JoSAA 2025 data. Use ONLY these numbers. Never invent ranks.",
    "OR = Opening Rank (Round 1), CR = Closing Rank (Round 6), Quota AI = All India, HS = Home State",
  ];

  return lines.filter((l) => l !== undefined).join("\n");
}

function buildSystemPrompt(context: Record<string, unknown> | null): string {
  const profile = context
    ? [
        `Rank: ${context.rank} (${context.exam})`,
        `Category: ${context.category}`,
        `Home state: ${context.domicileState}`,
        `Gender: ${context.gender}`,
        context.contextCollege ? `Currently viewing: ${(context.contextCollege as any).name}` : null,
      ]
        .filter(Boolean)
        .join(" | ")
    : "Not provided";

  const predictionData = context?.resultsContext
    ? formatResultsContext(context.resultsContext as PredictedCollege[])
    : "";

  const hasData = predictionData.length > 0;

  return `You are Nexus AI, a sharp JEE/JoSAA counselor inside the Nexus Predictor platform.

## STUDENT PROFILE
${profile}

${hasData ? predictionData : "⚠ No prediction data loaded — ask the student to open the AI panel from their results page."}

## HOW NEXUS PREDICTOR RANKS COLLEGES
Nexus uses a custom probability engine built on official JoSAA data. Here is the exact logic — use this when a student asks how colleges are ranked or how probability is calculated:

**Data source:** JoSAA 2025 final-round cutoffs (Round 6 closing rank, Round 1 opening rank). Falls back to 2024 if 2025 data is missing for a branch.

**Category matching:** Strictly matches the student's category (OPEN, OBC-NCL, SC, ST, EWS) and quota (AI = All India, HS = Home State). No category mixing.

**Probability formula (per branch):**
- Rank ≤ Opening Rank → **95%** (historically always allotted)
- Opening Rank < Rank ≤ Closing Rank → **Linear interpolation: 95% → 20%** (the deeper into the range, the lower the chance)
- Rank > Closing Rank → **Exponential decay below 20%** (rank at 1.15× closing rank ≈ 10%, rank at 1.3× closing rank ≈ 2%)

**Probability labels:**
- ≥ 70% → **HIGH** (safe choice — rank comfortably inside the cutoff)
- 30–69% → **MEDIUM** (possible but risky — rank near the closing rank)
- < 30% → **LOW** (unlikely but not impossible)

**Ordering:** Colleges are sorted by probability score (highest first), then by institute type (IITs before NITs before IIITs).

## RULES — follow strictly, no exceptions

**Data integrity**
${hasData
  ? `- You have REAL JoSAA 2025 cutoff data above. Use ONLY those numbers. Never invent ranks.
- When citing ranks, always say "Based on JoSAA 2025 data" so the student knows it's real.
- If the student asks about a college NOT in the data above, say "That college didn't match your rank in our dataset — check josaa.nic.in directly."`
  : `- You have NO prediction data. Do NOT invent cutoffs or packages.
- Direct the student to use the predictor first, then open AI from the results page.`}

**Response format**
- Be direct. Lead with the answer, not a preamble.
- Max 300 words per response.
- Use **bold** for college and branch names.
- Use a markdown table when comparing colleges (columns: College | Branch | Probability | Closing Rank | Quota).
- Bullet points max 1 line each — no sub-bullets.
- End with exactly one follow-up question.

**Tone**
- Talk like a knowledgeable senior, not a brochure.
- Be honest: "CS at IIT BHU is good but placements lag behind old IITs."
- If rank is too low for a dream college, say so directly and offer the closest real alternative from the data.

**Counseling**
- Always mention home-state quota (HS) benefit when relevant — it can significantly change eligibility.
- Distinguish AI (All India) vs HS (Home State) quota clearly.
- Match suggestions to career goals if mentioned. If not, ask once.`;
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
            ? m.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
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
