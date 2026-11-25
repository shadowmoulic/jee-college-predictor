import { getInstituteId, type JoSAARecord } from "@/app/data";
import { getJosaaData } from "@/lib/josaa-data";

const branches = new Map([
  ["computer-science-and-engineering", "Computer Science and Engineering"],
  ["electronics-and-communication-engineering", "Electronics and Communication Engineering"],
  ["electrical-engineering", "Electrical Engineering"],
  ["mechanical-engineering", "Mechanical Engineering"],
  ["civil-engineering", "Civil Engineering"],
  ["chemical-engineering", "Chemical Engineering"],
  ["engineering-physics", "Engineering Physics"],
  ["mathematics-and-computing", "Mathematics and Computing"],
  ["artificial-intelligence", "Artificial Intelligence"],
  ["information-technology", "Information Technology"],
]);

type CutoffRow = {
  collegeId: string;
  college: string;
  year: number;
  round: number;
  openingRank: number;
  closingRank: number;
};

export type CutoffGuide = {
  path: string;
  title: string;
  branch: string;
  group: string;
  kind: "comparison" | "history";
  quota: "AI" | "OS";
  rows: CutoffRow[];
};

let cached: Map<string, CutoffGuide> | undefined;

function normalize(text: string) {
  return text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function baselineQuota(type: JoSAARecord["instituteType"]) {
  if (type === "NIT") return "OS";
  if (type === "IIT" || type === "IIIT" || type === "GFTI") return "AI";
}

export function getCutoffGuides() {
  if (cached) return cached;

  const comparisons = new Map<string, CutoffGuide>();
  const histories = new Map<string, CutoffGuide>();
  const latestByCollege = new Map<string, number>();
  const latestByGroup = new Map<string, { year: number; round: number }>();
  const records = getJosaaData();

  for (const record of records) {
    const quota = baselineQuota(record.instituteType);
    if (!quota || record.quota !== quota || record.seatType !== "OPEN" || record.gender !== "Gender-Neutral") continue;
    const key = `${record.institute}|${record.year}`;
    latestByCollege.set(key, Math.max(latestByCollege.get(key) ?? 0, record.round));
    const group = latestByGroup.get(record.instituteType);
    if (!group || record.year > group.year || (record.year === group.year && record.round > group.round)) {
      latestByGroup.set(record.instituteType, { year: record.year, round: record.round });
    }
  }

  for (const record of records) {
    const quota = baselineQuota(record.instituteType);
    if (!quota || record.quota !== quota || record.seatType !== "OPEN" || record.gender !== "Gender-Neutral") continue;
    if (!/^(4 years?,\s*)?bachelor of technology$/i.test(record.degree.trim())) continue;
    if (record.openingRank < 1 || record.closingRank < record.openingRank) continue;

    const slug = normalize(record.program);
    const branch = branches.get(slug);
    if (!branch) continue;

    const collegeId = getInstituteId(record.institute);
    const college = record.instituteShort || record.institute;
    const row = { collegeId, college, year: record.year, round: record.round, openingRank: record.openingRank, closingRank: record.closingRank };

    if (record.round === latestByCollege.get(`${record.institute}|${record.year}`)) {
      const path = `/cutoffs/${collegeId}/${slug}`;
      const history = histories.get(path) ?? {
        path, title: `${college} ${branch} Cutoff History`, branch, group: college, kind: "history", quota, rows: [],
      };
      if (!history.rows.some(previous => previous.year === row.year)) history.rows.push(row);
      histories.set(path, history);
    }

    const group = latestByGroup.get(record.instituteType);
    if (record.year === group?.year && record.round === group.round) {
      const groupName = `${record.instituteType}s`;
      const path = `/cutoffs/${record.instituteType.toLowerCase()}/${slug}`;
      const comparison = comparisons.get(path) ?? {
        path, title: `${branch} Cutoffs Across ${groupName}`, branch, group: groupName, kind: "comparison", quota, rows: [],
      };
      if (!comparison.rows.some(previous => previous.collegeId === collegeId)) comparison.rows.push(row);
      comparisons.set(path, comparison);
    }
  }

  const guides = new Map<string, CutoffGuide>();
  for (const guide of comparisons.values()) {
    if (guide.rows.length < 3) continue;
    guide.rows.sort((a, b) => a.closingRank - b.closingRank || a.college.localeCompare(b.college));
    guides.set(guide.path, guide);
  }
  const comparisonColleges = new Set([...guides.values()].flatMap(guide =>
    guide.rows.map(row => `/cutoffs/${row.collegeId}/${guide.path.split("/").at(-1)}`),
  ));
  for (const guide of histories.values()) {
    if (guide.rows.length < 2 || !comparisonColleges.has(guide.path)) continue;
    guide.rows.sort((a, b) => b.year - a.year);
    guides.set(guide.path, guide);
  }

  if (guides.size) cached = guides;
  return guides;
}
