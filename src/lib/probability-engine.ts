/**
 * Probability Engine — calculates admission probability (0–100%)
 *
 * DATA SOURCE: Uses 2025 JoSAA data exclusively.
 * Falls back to 2024 if 2025 data is not available for a branch.
 *
 * CATEGORY MATCHING: seatType (e.g. OBC-NCL, OPEN, SC, ST, EWS) is
 * strictly matched — we never mix categories when computing probability.
 *
 * Opening Rank = Round 1 of the year (first allotment — who got in first)
 * Closing Rank = Final round of the year (last cutoff rank)
 *
 * Logic:
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

/** Filter all records for a key+year */
function getYearRecords(
  key: BranchKey,
  allRecords: JoSAARecord[],
  year: number
): JoSAARecord[] {
  return allRecords.filter(
    (r) =>
      r.year === year &&
      r.institute === key.institute &&
      r.program === key.program &&
      r.degree === key.degree &&
      r.quota === key.quota &&
      r.seatType === key.seatType &&
      r.gender === key.gender
  );
}

/**
 * Get Opening Rank (Round 1) and Closing Rank (final round) for a year.
 * - Opening Rank: from the earliest round available for that year
 * - Closing Rank: from the latest round available for that year
 */
function getORCR(
  key: BranchKey,
  allRecords: JoSAARecord[],
  year: number
): { openingRank: number; closingRank: number } | null {
  const recs = getYearRecords(key, allRecords, year);
  if (recs.length === 0) return null;

  const minRound = recs.reduce((m, r) => (r.round < m ? r.round : m), Infinity);
  const maxRound = recs.reduce((m, r) => (r.round > m ? r.round : m), 0);

  const round1 = recs.find((r) => r.round === minRound);
  const roundFinal = recs.find((r) => r.round === maxRound);

  if (!round1 || !roundFinal) return null;

  return {
    openingRank: round1.openingRank,   // Round 1 — first allotment
    closingRank: roundFinal.closingRank, // Final round — last cutoff
  };
}

/**
 * Calculate admission probability (0–100) for a branch.
 *
 * Uses 2025 data (Round 1 OR + final-round CR). Falls back to 2024.
 *
 * @param userRank   - User's rank
 * @param key        - Branch identifier (includes seatType = category)
 * @param allRecords - All JoSAA records (all years)
 * @returns probability 0–100, or null if no data found
 */
export function calculateProbability(
  userRank: number,
  key: BranchKey,
  allRecords: JoSAARecord[]
): number | null {
  // Try 2025 first
  const orcr2025 = getORCR(key, allRecords, 2025);
  if (orcr2025) {
    const p = probForRecord(userRank, orcr2025.openingRank, orcr2025.closingRank);
    return Math.round(Math.max(0, Math.min(100, p)));
  }

  // Fallback: 2024
  const orcr2024 = getORCR(key, allRecords, 2024);
  if (orcr2024) {
    const p = probForRecord(userRank, orcr2024.openingRank, orcr2024.closingRank);
    return Math.round(Math.max(0, Math.min(100, p)));
  }

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

