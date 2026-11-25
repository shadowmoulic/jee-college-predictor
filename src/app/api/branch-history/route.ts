import { NextRequest, NextResponse } from "next/server";
import { getJosaaData } from "@/lib/josaa-data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const institute = searchParams.get("institute");
  const program = searchParams.get("program");
  const seatType = searchParams.get("seatType");
  const gender = searchParams.get("gender");
  const quota = searchParams.get("quota");

  if (!institute || !program) {
    return NextResponse.json({ error: "Missing required params: institute, program" }, { status: 400 });
  }

  const all = getJosaaData();
  const matches = all.filter(
    (r) =>
      r.institute === institute &&
      r.program === program &&
      (!seatType || r.seatType === seatType) &&
      (!gender || r.gender === gender) &&
      (!quota || r.quota === quota)
  );

  // Build per-year summary: OR from Round 1, CR from final round
  // Also expose full round-by-round detail for the history table
  const history = matches.map((r) => ({
    year: r.year,
    round: r.round,
    opening: r.openingRank,
    closing: r.closingRank,
  }));

  history.sort((a, b) => a.year !== b.year ? a.year - b.year : a.round - b.round);

  const years = [...new Set(history.map((h) => h.year))].sort((a, b) => a - b);
  const rounds = [...new Set(history.map((h) => h.round))].sort((a, b) => a - b);

  // Per-year summary using Round 1 OR and final-round CR
  const yearSummary = years.map((year) => {
    const yearRecs = history.filter((h) => h.year === year);
    const minRound = Math.min(...yearRecs.map((h) => h.round));
    const maxRound = Math.max(...yearRecs.map((h) => h.round));
    const round1 = yearRecs.find((h) => h.round === minRound);
    const roundFinal = yearRecs.find((h) => h.round === maxRound);
    return {
      year,
      openingRank: round1?.opening ?? null,   // Round 1 — first allotment
      closingRank: roundFinal?.closing ?? null, // Final round — last cutoff
      rounds: yearRecs.length,
    };
  });

  return NextResponse.json({ history, years, rounds, yearSummary });
}
