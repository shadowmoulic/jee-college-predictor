import { NextResponse } from "next/server";
import { getJosaaData, getAvailableYears } from "@/lib/josaa-data";

export async function GET() {
  const records = getJosaaData();
  const branches = [...new Set(records.map((r) => r.program))].sort();
  const degrees = [...new Set(records.map((r) => r.degree))].sort();
  const states = [...new Set(records.map((r) => r.state))].sort();
  const years = getAvailableYears();

  return NextResponse.json({
    branches,
    degrees,
    states,
    years,
    total: records.length,
    lastUpdated: years.length > 0 ? `JoSAA ${years[0]}` : "JoSAA 2024",
  });
}
