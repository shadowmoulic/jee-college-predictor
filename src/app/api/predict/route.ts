import { NextRequest, NextResponse } from "next/server";
import {
  JoSAARecord,
  College,
  Branch,
  CATEGORY_TO_SEAT_TYPE,
  TOP_5_IITS,
  TOP_10_IITS,
  PACKAGE_ESTIMATES,
  getInstituteId,
  isProgramCS,
  isProgramCore,
} from "../../data";
import { get2025BranchCutoffs } from "@/lib/josaa-data";
import { getPlacementForCollege } from "@/lib/placement-data";

/**
 * Three-tier admission probability using both Opening and Closing rank.
 *
 * LOW    — rank > closingRank (worse than the 2025 cutoff; shown only within
 *          the 1.15× outer filter because seat expansion makes it a stretch)
 * HIGH   — rank ≤ openingRank (better than every student who got this seat
 *          in 2025 → virtually guaranteed)
 *          OR safety cushion ≥ 15 % of closingRank (comfortably within cutoff)
 * MEDIUM — between OR and CR with safety cushion < 15 % (inside but near edge)
 */
const getProbLabel = (
  rank: number,
  openingRank: number,
  closingRank: number,
): "high" | "medium" | "low" => {
  if (rank > closingRank) return "low";
  if (rank <= openingRank) return "high";
  // Safety margin: fraction of the OR→CR window still below the user's rank
  const window = closingRank - openingRank;
  const safetyMargin = window > 0 ? (closingRank - rank) / window : 1;
  return safetyMargin >= 0.15 ? "high" : "medium";
};

interface BranchWithProb extends Branch {
  prob: "high" | "medium" | "low";
}

interface CollegeWithFilteredBranches extends Omit<College, "branches"> {
  branches: BranchWithProb[];
}

// Single source of truth for probability tier ordering (lower = better)
const PROB_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // ─── Parse core parameters ─────────────────────────────────────────────
    const rankStr = searchParams.get("rank");
    const exam = searchParams.get("exam") || "JEE Advanced";
    const category = searchParams.get("category") || "General (CRL)";
    const domicileState = searchParams.get("domicileState") || "West Bengal";
    const gender = searchParams.get("gender") || "Male";

    // ─── Parse filters ─────────────────────────────────────────────────────
    const searchQuery = searchParams.get("searchQuery") || "";
    const activeProbFilter = searchParams.get("activeProbFilter");
    const durationFiltersStr = searchParams.get("durationFilters");
    const degreeFiltersStr = searchParams.get("degreeFilters");
    const branchSearch = searchParams.get("branchSearch") || "";
    const stateSearch = searchParams.get("stateSearch") || "";
    const quickFilter = searchParams.get("quickFilter") || "all";
    const instituteType = searchParams.get("instituteType") || "all";

    if (!rankStr) {
      return NextResponse.json(
        { error: "Missing required parameter: rank" },
        { status: 400 }
      );
    }

    const rank = parseInt(rankStr, 10);
    if (isNaN(rank) || rank <= 0) {
      return NextResponse.json(
        { error: "Invalid rank parameter: must be a positive integer" },
        { status: 400 }
      );
    }

    const durationFilters = durationFiltersStr ? durationFiltersStr.split(",") : [];
    const degreeFilters = degreeFiltersStr ? degreeFiltersStr.split(",") : [];

    // ─── Map category to JoSAA seat types ──────────────────────────────────
    const allowedSeatTypes = CATEGORY_TO_SEAT_TYPE[category] || ["OPEN"];

    // ─── Map gender to JoSAA gender field ──────────────────────────────────
    // Male candidates can apply to Gender-Neutral seats
    // Female candidates can apply to Gender-Neutral AND Female-only seats
    const allowedGenders =
      gender === "Female"
        ? ["Gender-Neutral", "Female-only"]
        : ["Gender-Neutral"];

    // ─── Determine valid quotas based on institute type and domicile ────────
    // IITs: only AI quota (all-India)
    // NITs/IIITs/GFTIs: AI + HS (if home state) + OS (if not home state)
    const getValidQuotas = (record: JoSAARecord): boolean => {
      if (record.instituteType === "IIT") {
        return record.quota === "AI";
      }
      // For NITs/IIITs/GFTIs - AI seats are open to all
      // HS seats only for home state students
      // OS seats for students outside state
      if (record.quota === "AI") return true;
      if (record.quota === "HS") return record.state === domicileState;
      if (record.quota === "OS") return record.state !== domicileState;
      return false;
    };

    // ─── Load records — 2025 final round, deduplicated ────────────────────
    const allRecords = get2025BranchCutoffs();

    // Step 1: Filter records that match category/gender/quota/exam (ignore rank for now)
    const validRecords = allRecords.filter((r: JoSAARecord) => {
      // Filter by Exam Type (IITs only accept JEE Advanced, others accept JEE Main)
      if (exam === "JEE Advanced" && r.instituteType !== "IIT") return false;
      if (exam === "JEE Main" && r.instituteType === "IIT") return false;

      // Category must match
      if (!allowedSeatTypes.includes(r.seatType)) return false;

      // Gender must match
      if (!allowedGenders.includes(r.gender)) return false;

      // Quota must be valid for domicile state
      if (!getValidQuotas(r)) return false;

      return true;
    });

    // Step 2: Group by institute
    const instituteMap = new Map<string, JoSAARecord[]>();
    for (const r of validRecords) {
      const key = r.institute;
      if (!instituteMap.has(key)) instituteMap.set(key, []);
      instituteMap.get(key)!.push(r);
    }

    // Step 3: Build colleges with filtered branches and apply UI filters
    let totalBranchesCount = 0;
    let totalCollegesCount = 0;

    const filtered: CollegeWithFilteredBranches[] = [];

    for (const [instituteName, records] of instituteMap) {
      // Institute type filter
      const instType = records[0].instituteType;
      if (instituteType !== "all" && instType !== instituteType) continue;

      // Quick filter by category
      if (quickFilter === "top5" && !TOP_5_IITS.has(instituteName)) continue;
      if (quickFilter === "top10" && !TOP_10_IITS.has(instituteName)) continue;

      // State filter
      const instState = records[0].state;
      if (quickFilter === "domicile" && instState !== domicileState) continue;
      if (stateSearch && !instState.toLowerCase().includes(stateSearch.toLowerCase())) continue;

      // Filter records by rank for this institute
      const eligibleBranchesForInst = records.filter(r => rank <= r.closingRank * 1.15);
      const ineligibleBranchesForInst = records.filter(r => rank > r.closingRank * 1.15);

      // Only show this college if they have at least one eligible branch
      if (eligibleBranchesForInst.length === 0) continue;

      let reachBranch: JoSAARecord | null = null;
      if (ineligibleBranchesForInst.length > 0) {
        // Find the ineligible branch with the highest closing rank (the "easiest" one they missed)
        reachBranch = ineligibleBranchesForInst.reduce((prev, current) =>
          prev.closingRank < current.closingRank ? prev : current
        );
      }

      const finalRecordsForInst = [...eligibleBranchesForInst];
      if (reachBranch) {
        finalRecordsForInst.push(reachBranch);
      }

      // Build branches with HIGH / MEDIUM / LOW label from 2025 closing rank
      let branches: BranchWithProb[] = finalRecordsForInst.map((r) => ({
        name: r.program,
        degree: r.degree,
        package: isProgramCS(r.program) ? (PACKAGE_ESTIMATES[records[0].instituteShort] ?? null) : null,
        opening: r.openingRank,
        closing: r.closingRank,
        isCS: isProgramCS(r.program),
        isCore: isProgramCore(r.program, r.degree),
        quota: r.quota,
        seatType: r.seatType,
        gender: r.gender,
        prob: getProbLabel(rank, r.openingRank, r.closingRank),
      }));

      // Probability filter
      if (activeProbFilter) {
        branches = branches.filter((b) => b.prob === activeProbFilter);
      }

      // Duration filter
      if (durationFilters.length > 0) {
        branches = branches.filter((b) => {
          const isFiveYears =
            b.degree.toLowerCase().includes("dual") ||
            b.degree.toLowerCase().includes("integrated") ||
            b.name.toLowerCase().includes("integrated");
          if (durationFilters.includes("5 years") && isFiveYears) return true;
          if (durationFilters.includes("4 years") && !isFiveYears) return true;
          return false;
        });
      }

      // Degree type filter
      if (degreeFilters.length > 0) {
        branches = branches.filter((b) => {
          if (degreeFilters.includes("B.Tech + M.Tech") && b.degree.toLowerCase().includes("dual")) return true;
          if (degreeFilters.includes("B.Sc.") && b.degree.toLowerCase().includes("science")) return true;
          if (degreeFilters.includes("B.E.") && b.degree.toLowerCase().includes("engineering") && !b.degree.toLowerCase().includes("dual")) return true;
          return false;
        });
      }

      // Branch search filter
      if (branchSearch) {
        branches = branches.filter((b) =>
          b.name.toLowerCase().includes(branchSearch.toLowerCase())
        );
      }

      // CS / Core quick filter
      if (quickFilter === "cs") {
        branches = branches.filter((b) => b.isCS);
      } else if (quickFilter === "core") {
        branches = branches.filter((b) => b.isCore);
      }

      // Search query (college name or branch name)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const collegeMatch = instituteName.toLowerCase().includes(q) ||
          records[0].instituteShort.toLowerCase().includes(q);
        branches = branches.filter(
          (b) => collegeMatch || b.name.toLowerCase().includes(q)
        );
      }

      if (branches.length === 0) continue;

      // Sort branches: HIGH first, then MEDIUM, then LOW; closing rank ascending within each tier
      branches.sort((a, b) => {
        const tierDiff = (PROB_RANK[a.prob] ?? 3) - (PROB_RANK[b.prob] ?? 3);
        return tierDiff !== 0 ? tierDiff : a.closing - b.closing;
      });

      const shortName = records[0].instituteShort;
      const pkgEstimate = PACKAGE_ESTIMATES[shortName] ?? undefined;
      const placement = getPlacementForCollege(instituteName);

      totalBranchesCount += branches.length;
      totalCollegesCount++;

      filtered.push({
        id: getInstituteId(instituteName),
        name: instituteName,
        logo: shortName.split(" ").slice(0, 2).join(" ").toUpperCase().substring(0, 8),
        state: instState,
        courseFee: placement?.annualFee ?? records[0].courseFee,
        annualFee: placement?.annualFee,
        medianPackage: placement?.medianPackage,
        avgPackage: placement?.avgPackage ?? pkgEstimate,
        highestPackage: placement?.highestPackage ?? pkgEstimate,
        placementRate: placement?.placementRate,
        totalOffers: placement?.totalOffers,
        placementYear: placement?.dataYear,
        top5: TOP_5_IITS.has(instituteName),
        top10: TOP_10_IITS.has(instituteName),
        instituteType: instType,
        branches,
      });
    }

    // Sort colleges:
    //   Primary   — institute type (IIT → NIT → IIIT → GFTI)
    //   Secondary — best probability tier available (college with any HIGH branch beats one with only MEDIUM)
    //   Tertiary  — closing rank of the best branch ascending (lower rank = more competitive = better)
    const typeOrder: Record<string, number> = { IIT: 0, NIT: 1, IIIT: 2, GFTI: 3 };

    const TOP_IIT_ORDER: Record<string, number> = {
      'Indian Institute of Technology Bombay': 1,
      'Indian Institute of Technology Madras': 2,
      'Indian Institute of Technology Delhi': 3,
      'Indian Institute of Technology Kanpur': 4,
      'Indian Institute of Technology Kharagpur': 5,
      'Indian Institute of Technology Roorkee': 6,
      'Indian Institute of Technology Guwahati': 7,
    };

    const bestTier = (branches: BranchWithProb[]): number =>
      branches.reduce((best, b) => Math.min(best, PROB_RANK[b.prob] ?? 3), 3);

    filtered.sort((a, b) => {
      const typeDiff = (typeOrder[a.instituteType] ?? 4) - (typeOrder[b.instituteType] ?? 4);
      if (typeDiff !== 0) return typeDiff;

      // Sort by specific Top IITs order
      if (a.instituteType === "IIT" && b.instituteType === "IIT") {
        const aOrder = TOP_IIT_ORDER[a.name] ?? 999;
        const bOrder = TOP_IIT_ORDER[b.name] ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
      }

      const tierDiff = bestTier(a.branches) - bestTier(b.branches);
      if (tierDiff !== 0) return tierDiff;
      // Within same tier: college whose best HIGH/MEDIUM branch has the lowest closing rank first
      return a.branches[0].closing - b.branches[0].closing;
    });

    return NextResponse.json({
      colleges: filtered,
      totalBranchesCount,
      totalCollegesCount,
      dataSource: allRecords.length > 0 ? "JoSAA 2025 (R1 OR → R6 CR)" : "JoSAA (sample data)",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Prediction API error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
