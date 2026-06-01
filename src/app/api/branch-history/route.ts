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

  const history = matches.map((r) => ({
    year: r.year,
    round: r.round,
    opening: r.openingRank,
    closing: r.closingRank,
  }));

  history.sort((a, b) => a.year !== b.year ? a.year - b.year : a.round - b.round);

  const years = [...new Set(history.map((h) => h.year))].sort((a, b) => a - b);
  const rounds = [...new Set(history.map((h) => h.round))].sort((a, b) => a - b);

  return NextResponse.json({ history, years, rounds });
}
