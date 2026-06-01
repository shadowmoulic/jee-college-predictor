import { NextResponse } from "next/server";
import { getJosaaData } from "@/lib/josaa-data";
import { getPlacementForCollege } from "@/lib/placement-data";
import { getInstituteId, TOP_5_IITS, TOP_10_IITS } from "../../data";

export async function GET() {
  const records = getJosaaData();

  // Build institute → records map once (O(N)) to avoid O(N²) inner filters
  const instituteMap = new Map<string, typeof records>();
  for (const r of records) {
    const bucket = instituteMap.get(r.institute);
    if (bucket) {
      bucket.push(r);
    } else {
      instituteMap.set(r.institute, [r]);
    }
  }

  const colleges = [];

  for (const [institute, instRecords] of instituteMap) {
    const r = instRecords[0];
    const programs = [...new Set(instRecords.map((rec) => rec.program))];
    const placement = getPlacementForCollege(institute);

    colleges.push({
      id: getInstituteId(r.institute),
      name: r.institute,
      shortName: r.instituteShort,
      state: r.state,
      instituteType: r.instituteType,
      courseFee: placement?.annualFee ?? r.courseFee,
      annualFee: placement?.annualFee,
      avgPackage: placement?.avgPackage,
      medianPackage: placement?.medianPackage,
      highestPackage: placement?.highestPackage,
      placementRate: placement?.placementRate,
      totalOffers: placement?.totalOffers,
      top5: TOP_5_IITS.has(r.institute),
      top10: TOP_10_IITS.has(r.institute),
      programCount: programs.length,
      programs,
    });
  }

  const typeOrder: Record<string, number> = { IIT: 0, NIT: 1, IIIT: 2, GFTI: 3 };
  colleges.sort((a, b) => {
    const t = (typeOrder[a.instituteType] ?? 4) - (typeOrder[b.instituteType] ?? 4);
    if (t !== 0) return t;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ colleges, total: colleges.length });
}
