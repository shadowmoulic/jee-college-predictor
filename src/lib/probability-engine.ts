/**
 * Probability Engine — calculates admission probability (0–100%)
 *
 * DATA SOURCE: Uses 2025 JoSAA data exclusively (final round).
 * Falls back to 2024 if 2025 data is not available for a branch.
 *
 * CATEGORY MATCHING: seatType (e.g. OBC-NCL, OPEN, SC, ST, EWS) is
 * strictly matched — we never mix categories when computing probability.
 *
 * Logic for a single year's OR/CR:
 *   rank ≤ openingRank                  → 95% (historically always allotted)
 *   openingRank < rank ≤ closingRank    → linear 95% → 20%
 *   rank > closingRank                  → exponential decay below 20%
 */

import { JoSAARecord } from "@/app/data";

// Unique key for one branch slot
export interface BranchKey {
  institute: string;
  program: string;
  degree: string;
  quota: string;
  seatType: string; // category — strictly matched (OPEN, OBC-NCL, SC, ST, EWS…)
  gender: string;
}

/** Probability for a single OR/CR pair */
function probForRecord(userRank: number, or: number, cr: number): number {
  if (userRank <= or) return 95;

  if (userRank <= cr) {
    // Linear interpolation: 95% at OR → 20% at CR
    const t = (userRank - or) / (cr - or);
    return 95 - t * 75; // 95 → 20
  }

  // Beyond CR: exponential decay
  // Tuned so that rank = 1.15 * CR → ~10%, rank = 1.3 * CR → ~2%
  const excess = (userRank - cr) / cr;
  return 20 * Math.exp(-14 * excess);
}

/** Get the final-round record for a given year matching the branch key */
function getFinalRecord(
  key: BranchKey,
  allRecords: JoSAARecord[],
  year: number
): JoSAARecord | null {
  const yearRecords = allRecords.filter(
    (r) =>
      r.year === year &&
      r.institute === key.institute &&
      r.program === key.program &&
      r.degree === key.degree &&
      r.quota === key.quota &&
      r.seatType === key.seatType && // strict category match
      r.gender === key.gender
  );

  if (yearRecords.length === 0) return null;

  // Pick the highest round (final allotment)
  const maxRound = yearRecords.reduce((m, r) => (r.round > m ? r.round : m), 0);
  return yearRecords.find((r) => r.round === maxRound) ?? null;
}

/**
 * Calculate admission probability (0–100) for a branch.
 *
 * Uses 2025 data exclusively. Falls back to 2024 if 2025 is not present.
 *
 * @param userRank - User's rank
 * @param key      - Branch identifier (includes seatType = category)
 * @param allRecords - All JoSAA records (all years)
 * @returns probability 0–100, or null if no data found for 2025 or 2024
 */
export function calculateProbability(
  userRank: number,
  key: BranchKey,
  allRecords: JoSAARecord[]
): number | null {
  // Try 2025 first (primary source)
  const record2025 = getFinalRecord(key, allRecords, 2025);
  if (record2025) {
    const p = probForRecord(userRank, record2025.openingRank, record2025.closingRank);
    return Math.round(Math.max(0, Math.min(100, p)));
  }

  // Fallback: 2024
  const record2024 = getFinalRecord(key, allRecords, 2024);
  if (record2024) {
    const p = probForRecord(userRank, record2024.openingRank, record2024.closingRank);
    return Math.round(Math.max(0, Math.min(100, p)));
  }

  // No data for 2025 or 2024
  return null;
}

/**
 * Convert numeric probability to a HIGH / MEDIUM / LOW label.
 *   ≥ 70% → HIGH
 *   ≥ 30% → MEDIUM
 *   < 30% → LOW
 */
export function probToLabel(prob: number): "high" | "medium" | "low" {
  if (prob >= 70) return "high";
  if (prob >= 30) return "medium";
  return "low";
}

