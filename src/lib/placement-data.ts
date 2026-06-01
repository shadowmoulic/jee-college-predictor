import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface PlacementInfo {
  courseFee: string;
  annualFee: string;
  medianPackage: string;
  avgPackage: string;
  highestPackage: string;
  placementRate: string;
  totalOffers: number;
  dataYear: number;
  source: string;
}

let _cache: Record<string, PlacementInfo> | null = null;

export function getPlacementData(): Record<string, PlacementInfo> {
  if (_cache) return _cache;
  const filePath = join(process.cwd(), "data", "placement_fees.json");
  if (!existsSync(filePath)) {
    _cache = {};
    return _cache;
  }
  try {
    _cache = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, PlacementInfo>;
    console.log(`[Placement] Loaded ${Object.keys(_cache).length} placement records`);
    return _cache;
  } catch {
    _cache = {};
    return _cache;
  }
}

export function getPlacementForCollege(instituteName: string): PlacementInfo | null {
  const data = getPlacementData();
  return data[instituteName] ?? null;
}
