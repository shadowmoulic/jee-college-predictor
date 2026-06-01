import { JoSAARecord } from "@/app/data";

// ─── Helpers (shared with 2025 parser) ─────────────────────────────────────

const FEE_MAP: Record<string, string> = {
  IIT: "8.5 Lakh", NIT: "1.65 Lakh", IIIT: "1.5 Lakh",
  GFTI: "1.2 Lakh", SPA: "1.2 Lakh",
};

const STATE_FRAGS: [string, string][] = [
  ["Bombay","Maharashtra"],["Delhi","Delhi"],["Madras","Tamil Nadu"],
  ["Kanpur","Uttar Pradesh"],["Kharagpur","West Bengal"],["Roorkee","Uttarakhand"],
  ["Guwahati","Assam"],["Hyderabad","Telangana"],["Indore","Madhya Pradesh"],
  ["BHU","Uttar Pradesh"],["Varanasi","Uttar Pradesh"],["Jodhpur","Rajasthan"],
  ["Gandhinagar","Gujarat"],["Patna","Bihar"],["Mandi","Himachal Pradesh"],
  ["Bhubaneswar","Odisha"],["Tirupati","Andhra Pradesh"],["Dharwad","Karnataka"],
  ["Jammu","Jammu and Kashmir"],["Bhilai","Chhattisgarh"],["Palakkad","Kerala"],
  ["Goa","Goa"],["Surat","Gujarat"],["Allahabad","Uttar Pradesh"],
  ["Calicut","Kerala"],["Durgapur","West Bengal"],["Hamirpur","Himachal Pradesh"],
  ["Jaipur","Rajasthan"],["Kurukshetra","Haryana"],["Nagpur","Maharashtra"],
  ["Raipur","Chhattisgarh"],["Rourkela","Odisha"],["Silchar","Assam"],
  ["Srinagar","Jammu and Kashmir"],["Surathkal","Karnataka"],
  ["Tiruchirappalli","Tamil Nadu"],["Warangal","Telangana"],["Agartala","Tripura"],
  ["Manipur","Manipur"],["Meghalaya","Meghalaya"],["Mizoram","Mizoram"],
  ["Nagaland","Nagaland"],["Puducherry","Puducherry"],["Uttarakhand","Uttarakhand"],
  ["Punjab","Punjab"],["Bhopal","Madhya Pradesh"],["Jalandhar","Punjab"],
  ["Kozhikode","Kerala"],["Trichy","Tamil Nadu"],["Jabalpur","Madhya Pradesh"],
];

function inferState(name: string): string {
  for (const [f, s] of STATE_FRAGS) if (name.includes(f)) return s;
  return "India";
}

function inferShortName(name: string): string {
  return name
    .replace(/Indian Institute of Technology\b/g, "IIT")
    .replace(/National Institute of Technology\b/g, "NIT")
    .replace(/Indian Institute of Information Technology\b/g, "IIIT")
    .replace(/School of Planning and Architecture\b/g, "SPA")
    .replace(/Visvesvaraya National Institute of Technology\b/g, "VNIT")
    .replace(/Motilal Nehru National Institute of Technology\b/g, "MNNIT")
    .replace(/Maulana Azad National Institute of Technology\b/g, "MANIT")
    .replace(/Sardar Vallabhbhai National Institute of Technology\b/g, "SVNIT")
    .replace(/Indian Institute of Engineering Science and Technology\b/g, "IIEST")
    .trim();
}

function inferInstType(name: string): JoSAARecord["instituteType"] {
  const l = name.toLowerCase();
  if (l.includes("indian institute of technology") && !l.includes("information")) return "IIT";
  if (l.includes("national institute of technology") || l.includes("vnit") ||
      l.includes("mnnit") || l.includes("manit") || l.includes("svnit") ||
      l.includes("indian institute of engineering science")) return "NIT";
  if (l.includes("indian institute of information technology")) return "IIIT";
  if (l.includes("school of planning and architecture")) return "SPA";
  return "GFTI";
}

function splitProgramCell(cell: string): { program: string; degree: string } {
  const m = cell.match(/^(.+?)\s*\((\d+\s+Years?,\s*[^)]+)\)\s*$/);
  if (m) return { program: m[1].trim(), degree: m[2].trim() };
  return { program: cell.trim(), degree: "Bachelor of Technology" };
}

function normalizeGender(raw: string): JoSAARecord["gender"] {
  if (raw.toLowerCase().includes("female")) return "Female-only";
  return "Gender-Neutral";
}

/**
 * Parse a 2025 JoSAA round CSV (7-column raw export format):
 * Institute, Academic Program Name, Quota, Seat Type, Gender, Opening Rank, Closing Rank
 *
 * @param csv    Raw CSV text
 * @param round  Round number (extracted from filename, e.g. 6 for "2025_round6.csv")
 */
export function parse2025RoundCSV(csv: string, round: number): JoSAARecord[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const records: JoSAARecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    if (fields.length < 7) continue;

    const [institute, programCell, quota, seatType, genderRaw, openStr, closeStr] = fields;
    // Skip blank rows or repeated header rows (exact match only — do NOT check
    // for the word 'institute' because IIT/NIT names contain it!)
    if (!institute || institute === "Institute" || institute === "Institute Name") continue;

    const openingRank = parseInt(openStr.replace(/,/g, ""), 10);
    const closingRank = parseInt(closeStr.replace(/,/g, ""), 10);
    if (isNaN(openingRank) || isNaN(closingRank)) continue;

    const { program, degree } = splitProgramCell(programCell);
    const gender = normalizeGender(genderRaw);
    const instType = inferInstType(institute);

    records.push({
      institute,
      instituteShort: inferShortName(institute),
      instituteType: instType,
      state: inferState(institute),
      program,
      degree,
      quota: quota as JoSAARecord["quota"],
      seatType: seatType as JoSAARecord["seatType"],
      gender,
      openingRank,
      closingRank,
      year: 2025,
      round,
      courseFee: FEE_MAP[instType] ?? "1.5 Lakh",
    });
  }

  return records;
}



/**
 * Parse a CSV string into JoSAARecord[].
 * Handles quoted fields (including commas inside quotes).
 */
export function parseJosaaCSV(csv: string): JoSAARecord[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Skip header row
  const records: JoSAARecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    if (fields.length < 14) continue;

    const [
      institute,
      instituteShort,
      instituteType,
      state,
      program,
      degree,
      quota,
      seatType,
      gender,
      openingRankStr,
      closingRankStr,
      yearStr,
      roundStr,
      courseFee,
    ] = fields;

    const openingRank = parseInt(openingRankStr, 10);
    const closingRank = parseInt(closingRankStr, 10);
    const year = parseInt(yearStr, 10);
    const round = parseInt(roundStr, 10);

    if (!institute || isNaN(openingRank) || isNaN(closingRank)) continue;

    records.push({
      institute,
      instituteShort,
      instituteType: instituteType as JoSAARecord["instituteType"],
      state,
      program,
      degree,
      quota: quota as JoSAARecord["quota"],
      seatType: seatType as JoSAARecord["seatType"],
      gender: gender as JoSAARecord["gender"],
      openingRank,
      closingRank,
      year: isNaN(year) ? 2024 : year,
      round: isNaN(round) ? 6 : round,
      courseFee,
    });
  }

  return records;
}

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let field = "";
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ",") i++;
    } else {
      // Unquoted field
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
  }

  return fields;
}

export function toCSV(records: JoSAARecord[]): string {
  const header =
    "institute,instituteShort,instituteType,state,program,degree,quota,seatType,gender,openingRank,closingRank,year,round,courseFee";

  const rows = records.map((r) =>
    [
      q(r.institute),
      q(r.instituteShort),
      q(r.instituteType),
      q(r.state),
      q(r.program),
      q(r.degree),
      q(r.quota),
      q(r.seatType),
      q(r.gender),
      r.openingRank,
      r.closingRank,
      r.year,
      r.round,
      q(r.courseFee),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}

function q(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
