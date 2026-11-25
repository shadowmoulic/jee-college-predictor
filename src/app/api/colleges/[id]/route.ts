import { NextRequest, NextResponse } from "next/server";
import { getCollegeDetail } from "@/lib/college-detail";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = getCollegeDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "College not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
