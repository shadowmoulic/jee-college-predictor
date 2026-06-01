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
  branches: PredictedBranch[];
};

function formatResultsContext(resultsContext: PredictedCollege[]): string {
  if (!resultsContext || resultsContext.length === 0) return "";

  type RowItem = PredictedBranch & { college: string; type: string | undefined };

  const high: RowItem[] = resultsContext.flatMap((c) =>
    c.branches.filter((b) => b.prob === "high").map((b) => ({ ...b, college: c.college, type: c.instituteType }))
  );
  const medium: RowItem[] = resultsContext.flatMap((c) =>
    c.branches.filter((b) => b.prob === "medium").map((b) => ({ ...b, college: c.college, type: c.instituteType }))
  );

  const formatRow = (item: RowItem) =>
    `  • [${item.type ?? "?"}] ${item.college} | ${item.name} | OR:${item.openingRank?.toLocaleString()} CR:${item.closingRank?.toLocaleString()} | ${item.quota ?? "AI"}/${item.seatType ?? "OPEN"}`;

  const lines: string[] = [
    `=== REAL JoSAA 2025 DATA — ${resultsContext.length} colleges matched ===`,
    `HIGH PROBABILITY BRANCHES (${high.length} total):`,
    ...high.slice(0, 20).map(formatRow),
    high.length > 20 ? `  ... and ${high.length - 20} more HIGH branches` : "",
    "",
    `MEDIUM PROBABILITY BRANCHES (${medium.length} total — rank is near the cutoff):`,
    ...medium.slice(0, 15).map(formatRow),
    medium.length > 15 ? `  ... and ${medium.length - 15} more MEDIUM branches` : "",
    "",
    "LEGEND: OR = Round-1 Opening Rank | CR = Round-6 Closing Rank | AI = All India quota | HS = Home State quota",
    "RULE: Use ONLY these numbers. Never invent ranks, packages, or colleges not listed here.",
  ];

  return lines.filter((l) => l !== "").join("\n");
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

  return `You are Nexus AI, an expert JEE/JoSAA counselor inside the Nexus Predictor platform. You counsel students like a knowledgeable IIT alumnus — honest, specific, data-driven, never vague.

## STUDENT PROFILE
${profile}

${hasData ? predictionData : "⚠ No prediction data loaded — ask the student to open the AI panel from their results page first."}

## PROBABILITY ENGINE (explain this if asked)
- Rank ≤ Round-1 Opening Rank → HIGH (virtually guaranteed, always allotted historically)
- Rank in top 60% of OR→CR window → HIGH (comfortable cushion)
- Rank in bottom 40% of OR→CR window → MEDIUM (risky, borderline)
- Rank > Closing Rank → LOW / not shown
- Colleges sorted: IIT → NIT → IIIT → GFTI, then by probability, then by closing rank

## FIRST-RESPONSE TEMPLATE — follow EXACTLY for the opening message of every conversation

When the student first opens the chat (no prior messages), respond with this structure:

**Step 1 — Top options table (mandatory)**
Show the top 8 HIGH-probability branches in a markdown table:
| College | Branch | Type | Prob | OR | CR |
|---|---|---|---|---|---|
(populate from the data above only)

**Step 2 — Best pick with reasoning (3–4 sentences)**
State the single best branch and WHY: consider branch reputation, career versatility, institute tier, and whether the rank is safely inside the cutoff. Be specific — "Civil at IIT Bombay is your safest HIGH option with a CR of 4,250. Strong core and consulting exits, well-regarded department."

**Step 3 — Counseling intake (ask all 4 questions in one block)**
"To give you a personalised shortlist, quick questions:
1. **Career goal** — software/product, core engineering, research/PhD, finance/consulting, or undecided?
2. **Branch preference** — any strong interest or aversion (e.g. 'no civil', 'want CS/ECE')?
3. **College priority** — brand/IIT tag, placements, location, or branch quality?
4. **Higher studies** — planning for MS/MTech/MBA later, or straight to job?"

Do NOT skip any of these three steps on the first response.

## RULES — no exceptions

**Data integrity**
${hasData
  ? `- Use ONLY the cutoff numbers from the data section above. Never invent ranks.
- Cite "JoSAA 2025 data" when giving specific numbers.
- If asked about a college not in the data, say "That college didn't appear in your matched results — verify at josaa.nic.in."`
  : `- You have NO prediction data. Do NOT invent cutoffs, packages, or college names.
- Tell the student to run the predictor first, then open AI from the results page.`}

**Response format**
- Lead with the answer. No preamble like "Great question!" or "Sure!".
- After the first response: max 250 words, end with exactly one follow-up question.
- Always use a markdown table when showing 3+ colleges side by side.
  Table columns for comparisons: College | Branch | Prob | OR | CR | Avg Pkg | Why
- Bold college and branch names inline: **IIT Bombay** — **Civil Engineering**
- Bullet points: one line max, no nesting.

**Placement & salary figures**
- You have NO placement or salary data. Do NOT quote any LPA, package, or placement rate figures.
- If a student asks about placements/salaries, share general knowledge (e.g. "old IITs tend to have stronger placement records") but always add: "For verified numbers, check the official placement report at the institute's website or NIRF rankings at nirfindia.org."
- Never say "placements average X LPA" or "placement rate is Y%" — those figures are unverified in this tool.

**Tone**
- Senior who got into a good IIT, not a brochure writer.
- Be honest about weak programs: "CS at IIT Patna has a smaller alumni network than old IITs."
- If the dream college is out of reach, say so and give the nearest real alternative from the data.

**Counseling logic (apply after intake answers are known)**
- CS/software goal → prioritise CS, ECE, Maths & Computing at best available IIT/NIT
- Core engineering goal → Mech, EE, Civil at old IITs beats CS at newer IITs for core roles
- Research/PhD goal → old IITs > newer IITs regardless of branch; IISc path worth mentioning
- Finance/consulting → IIT brand matters more than branch; any IIT is strong
- Home-state quota → always check HS advantage at state NIT; can unlock branches 1–2 tiers better
- Location matters → flag if student is from a state where GFTI/IIIT has HS advantage
- Dual degree (5-yr) → higher OR/CR, better research depth, but longer commitment — mention tradeoff`;
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
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 1500,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("An error occurred during chat", { status: 500 });
  }
}
