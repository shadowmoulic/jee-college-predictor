import { getInstituteId } from "@/app/data";
import { getCutoffGuides } from "./cutoff-guides";
import { getJosaa2026Data } from "./josaa-2026";
import { getJosaaData } from "./josaa-data";

export type YearComparison = {
  path: string;
  group: string;
  program: string;
  branch: string;
  quota: string;
  round: number;
  rows: { id: string; college: string; rank2025: number; rank2026: number }[];
};

let comparisons: Map<string, YearComparison> | undefined;

const slug = (value: string) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function getYearComparisons() {
  if (comparisons) return comparisons;
  const oldRows = getJosaaData().filter(row => row.year === 2025);
  const newRows = getJosaa2026Data();
  const oldRounds = new Set(oldRows.map(row => row.round));
  const round = Math.max(0, ...new Set(newRows.map(row => row.round).filter(round => oldRounds.has(round))));
  const oldByKey = new Map<string, number>();
  for (const row of oldRows) {
    if (row.round !== round || row.seatType !== "OPEN" || row.gender !== "Gender-Neutral" ||
        !/^(4 years?,\s*)?bachelor of technology$/i.test(row.degree.trim())) continue;
    const key = [getInstituteId(row.institute), slug(row.program), row.quota, row.instituteType].join("|");
    if (!oldByKey.has(key)) oldByKey.set(key, row.closingRank);
  }

  comparisons = new Map();
  for (const guide of getCutoffGuides().values()) {
    if (guide.kind !== "comparison" || guide.year !== 2026) continue;
    const [, , , group, program] = guide.path.split("/");
    const path = `/cutoffs/2025-vs-2026/${group}/${program}`;
    const rows: YearComparison["rows"] = [];
    const seen = new Set<string>();
    for (const row of newRows) {
      if (row.round !== round || row.instituteType !== guide.groupType || row.quota !== guide.quota ||
          row.gender !== "Gender-Neutral" || row.seatType !== "OPEN" || slug(row.program) !== program ||
          !/^(4 years?,\s*)?bachelor of technology$/i.test(row.degree.trim())) continue;
      const id = getInstituteId(row.institute);
      const rank2025 = oldByKey.get([id, program, row.quota, row.instituteType].join("|"));
      if (!rank2025 || rank2025 < 1 || seen.has(id)) continue;
      seen.add(id);
      rows.push({ id, college: row.instituteShort || row.institute, rank2025, rank2026: row.closingRank });
    }
    if (rows.length < 3) continue;
    rows.sort((a, b) => a.rank2026 - b.rank2026 || a.college.localeCompare(b.college));
    comparisons.set(path, { path, group: guide.group, program, branch: guide.branch, quota: guide.quota, round, rows });
  }
  return comparisons;
}
