import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { get2025BranchCutoffs } from "@/lib/josaa-data";
import { CATEGORY_TO_SEAT_TYPE } from "../../data";

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

const getProbLabel = (
  rank: number,
  openingRank: number,
  closingRank: number,
): "high" | "medium" | "low" => {
  if (rank > closingRank) return "low";
  if (rank <= openingRank) return "high";
  const window = closingRank - openingRank;
  const safetyMargin = window > 0 ? (closingRank - rank) / window : 1;
  return safetyMargin >= 0.40 ? "high" : "medium";
};

// Local prediction fetcher
function getLocalPredictions(
  rankNum: number,
  exam: string,
  category: string,
  domicileState: string,
  gender: string
): PredictedCollege[] {
  const allowedSeatTypes = CATEGORY_TO_SEAT_TYPE[category] || ["OPEN"];
  const allowedGenders =
    gender === "Female"
      ? ["Gender-Neutral", "Female-only"]
      : ["Gender-Neutral"];

  const getValidQuotas = (record: any): boolean => {
    if (record.instituteType === "IIT") return record.quota === "AI";
    if (record.quota === "AI") return true;
    if (record.quota === "HS") return record.state === domicileState;
    if (record.quota === "OS") return record.state !== domicileState;
    return false;
  };

  const allRecords = get2025BranchCutoffs();
  const validRecords = allRecords.filter((r: any) => {
    if (exam === "JEE Advanced" && r.instituteType !== "IIT") return false;
    if (exam === "JEE Main" && r.instituteType === "IIT") return false;
    if (!allowedSeatTypes.includes(r.seatType)) return false;
    if (!allowedGenders.includes(r.gender)) return false;
    if (!getValidQuotas(r)) return false;
    return true;
  });

  const instituteMap = new Map<string, any[]>();
  for (const r of validRecords) {
    if (!instituteMap.has(r.institute)) instituteMap.set(r.institute, []);
    instituteMap.get(r.institute)!.push(r);
  }

  const resultColleges: PredictedCollege[] = [];
  for (const [instituteName, records] of instituteMap) {
    const eligible = records.filter((r) => rankNum <= r.closingRank * 1.15);
    if (eligible.length === 0) continue;

    const branches: PredictedBranch[] = eligible.map((r) => ({
      name: r.program,
      degree: r.degree,
      prob: getProbLabel(rankNum, r.openingRank, r.closingRank),
      openingRank: r.openingRank,
      closingRank: r.closingRank,
      quota: r.quota,
      seatType: r.seatType,
    }));

    branches.sort((a, b) => {
      const PROB_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const tierDiff = (PROB_RANK[a.prob] ?? 3) - (PROB_RANK[b.prob] ?? 3);
      return tierDiff !== 0 ? tierDiff : a.closingRank - b.closingRank;
    });

    resultColleges.push({
      college: instituteName,
      instituteType: records[0].instituteType,
      state: records[0].state,
      branches,
    });
  }

  const typeOrder: Record<string, number> = { IIT: 0, NIT: 1, IIIT: 2, GFTI: 3 };
  const bestTier = (branches: PredictedBranch[]): number => {
    const PROB_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return branches.reduce((best, b) => Math.min(best, PROB_RANK[b.prob] ?? 3), 3);
  };

  resultColleges.sort((a, b) => {
    const typeDiff = (typeOrder[a.instituteType ?? ""] ?? 4) - (typeOrder[b.instituteType ?? ""] ?? 4);
    if (typeDiff !== 0) return typeDiff;
    const tierDiff = bestTier(a.branches) - bestTier(b.branches);
    if (tierDiff !== 0) return tierDiff;
    return a.branches[0].closingRank - b.branches[0].closingRank;
  });

  return resultColleges;
}

// Extractor from conversation history
function extractProfileFromMessages(messages: any[], currentContext: any) {
  let rank = currentContext?.rank && currentContext.rank !== "0" ? currentContext.rank : null;
  let exam = currentContext?.exam && currentContext.exam !== "Unknown" ? currentContext.exam : null;
  let category = currentContext?.category && currentContext.category !== "Unknown" ? currentContext.category : null;
  let domicileState = currentContext?.domicileState && currentContext.domicileState !== "Unknown" ? currentContext.domicileState : null;
  let gender = currentContext?.gender && currentContext.gender !== "Unknown" ? currentContext.gender : null;

  const userTexts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase());

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
  ];

  for (const text of userTexts) {
    // Rank Match
    const rankMatch = text.match(/(?:rank|crl|crl rank|crl-rank|got|mark|my rank is|rank:?\s*)(\d{1,6})/i) 
      || text.match(/\b(\d{3,6})\b/);
    if (rankMatch) {
      rank = rankMatch[1];
    }

    // Exam Match
    if (text.includes("advanced") || text.includes("adv")) {
      exam = "JEE Advanced";
    } else if (text.includes("main") || text.includes("mains")) {
      exam = "JEE Main";
    }

    // Category Match
    if (text.includes("obc") || text.includes("ncl")) {
      category = "OBC-NCL";
    } else if (text.includes("sc")) {
      category = "SC";
    } else if (text.includes("st")) {
      category = "ST";
    } else if (text.includes("ews")) {
      category = "Gen-EWS";
    } else if (text.includes("general") || text.includes("crl") || text.includes("open")) {
      category = "General (CRL)";
    }

    // Gender Match
    if (text.includes("female") || text.includes("girl") || text.includes("woman")) {
      gender = "Female";
    } else if (text.includes("male") || text.includes("boy") || text.includes("man")) {
      gender = "Male";
    }

    // State Match
    for (const state of states) {
      if (text.includes(state.toLowerCase())) {
        domicileState = state;
        break;
      }
    }
  }

  return {
    rank: rank || "0",
    exam: exam || "JEE Advanced",
    category: category || "General (CRL)",
    domicileState: domicileState || "West Bengal",
    gender: gender || "Male",
    hasRank: !!rank,
    hasDomicile: !!domicileState,
    hasCategory: !!category,
    hasGender: !!gender,
    hasExam: !!exam
  };
}

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

function buildSystemPrompt(contextProfile: any, predictionData: string, context: Record<string, unknown> | null): string {
  const profileStr = [
    `Rank: ${contextProfile.rank !== "0" ? contextProfile.rank : "Not Provided"} (${contextProfile.exam})`,
    `Category: ${contextProfile.category}`,
    `Home state: ${contextProfile.domicileState}`,
    `Gender: ${contextProfile.gender}`,
    context?.contextCollege ? `Currently viewing: ${(context.contextCollege as any).name}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const hasData = predictionData.length > 0;

  return `You are AI Counsellor, an expert JEE/JoSAA counselor inside the JEE College Predictor platform. You counsel students like a knowledgeable IIT alumnus — honest, specific, data-driven, never vague.

## STUDENT PROFILE
${profileStr}

${hasData ? predictionData : `⚠ Missing Profile Data: Currently we don't have predictions because JEE details are not fully set. 
- Ask the user in a friendly way for their Rank, Exam type (JEE Main or JEE Advanced), Category, Domicile State, or Gender if they are missing or if the rank is "Not Provided".
- If they have typed their details in the chat, explain that you have successfully predicted their colleges and display their options.
- ALWAYS encourage them to share these details right here in the chat so you can run the predictor dynamically!`}

## PROBABILITY ENGINE (explain this if asked)
- Rank ≤ Round-1 Opening Rank → HIGH (virtually guaranteed, always allotted historically)
- Rank in top 60% of OR→CR window → HIGH (comfortable cushion)
- Rank in bottom 40% of OR→CR window → MEDIUM (risky, borderline)
- Rank > Closing Rank → LOW / not shown
- Colleges sorted: IIT → NIT → IIIT → GFTI, then by probability, then by closing rank

## FIRST-RESPONSE TEMPLATE — follow EXACTLY for the opening message of every conversation
If the profile has a rank and prediction data:
**Step 1 — Top options table (mandatory)**
Show the top 8 HIGH-probability branches in a markdown table:
| College | Branch | Type | Prob | OR | CR |
|---|---|---|---|---|---|
(populate from the data above only)

**Step 2 — Best pick with reasoning (3–4 sentences)**
State the single best branch and WHY: consider branch reputation, career versatility, institute tier, and whether the rank is safely inside the cutoff.

**Step 3 — Counseling intake (ask all 4 questions in one block)**
"To give you a personalised shortlist, quick questions:
1. **Career goal** — software/product, core engineering, research/PhD, finance/consulting, or undecided?
2. **Branch preference** — any strong interest or aversion (e.g. 'no civil', 'want CS/ECE')?
3. **College priority** — brand/IIT tag, placements, location, or branch quality?
4. **Higher studies** — planning for MS/MTech/MBA later, or straight to job?"

If the profile has NO rank yet (e.g. "Not Provided"), respond warmly like:
"Welcome! I am AI Counsellor, your expert JoSAA counseling partner. 🎓
To fetch your custom JoSAA 2025 college recommendations and admission probabilities immediately, could you please tell me:
1. **Your JEE Rank** (CRL or Category Rank)
2. **Which exam** (JEE Main or JEE Advanced)
3. **Your category** (General, OBC-NCL, SC, ST, EWS)
4. **Your Home State** (for NIT/IIIT quotas)
5. **Your Gender** (for female-only supernumerary pool matching)

Just reply with these details and I will run the predictor on the fly!"

Do NOT skip this response flow.

## RULES — no exceptions

**Data integrity**
${hasData
  ? `- Use ONLY the cutoff numbers from the data section above. Never invent ranks.
- Cite "JoSAA 2025 data" when giving specific numbers.
- If asked about a college not in the data, say "That college didn't appear in your matched results — verify at josaa.nic.in."`
  : `- You have NO prediction data. Do NOT invent cutoffs, packages, or college names.
- Tell the student to share their details right here in the chat to predict.`}

**Response format**
- Lead with the answer. No preamble like "Great question!" or "Sure!".
- After the first response: max 250 words, end with exactly one follow-up question.
- Always use a markdown table when showing 3+ colleges side by side.
  Table columns for comparisons: College | Branch | Prob | OR | CR | Avg Pkg | Why
- Bold college and branch names inline: **IIT Bombay** — **Civil Engineering**
- Bullet points: one line max, no nesting.

**Placement & salary figures**
- You have NO placement or salary data. Do NOT quote any LPA, package, or placement rate figures.
- If a student asks about placements/salaries, share general knowledge but always add: "For verified numbers, check the official placement report."

**Tone**
- Senior who got into a good IIT, not a brochure writer.
- Be honest about weak programs.`;
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

    // ─── Extract user details dynamically from messages if not in context ───
    const contextProfile = extractProfileFromMessages(coreMessages, body.context ?? null);

    let predictionData = "";
    if (contextProfile.rank && contextProfile.rank !== "0") {
      const parsedRank = parseInt(contextProfile.rank, 10);
      if (!isNaN(parsedRank) && parsedRank > 0) {
        const localPreds = getLocalPredictions(
          parsedRank,
          contextProfile.exam,
          contextProfile.category,
          contextProfile.domicileState,
          contextProfile.gender
        );
        predictionData = formatResultsContext(localPreds);
      }
    } else if (body.context?.resultsContext) {
      predictionData = formatResultsContext(body.context.resultsContext as PredictedCollege[]);
    }

    const result = streamText({
      model: nim.chat("meta/llama-3.3-70b-instruct"),
      system: buildSystemPrompt(contextProfile, predictionData, body.context ?? null),
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
