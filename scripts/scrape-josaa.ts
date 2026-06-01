/**
 * JoSAA Multi-Year Scraper (Playwright-based)
 *
 * Drives josaa.admissions.nic.in with a real headless browser to handle
 * the 5-level ASP.NET cascade dropdowns and dynamic SeatType codes.
 *
 * Cascade order: Year → Round → InstType → Institute → Program → SeatType → Submit
 *
 * Years: 2020–2025, Round 6 (fallback to highest available per year).
 * Set env  SCRAPE_ALL_ROUNDS=true  for all 6 rounds per year.
 * Set env  JOSAA_YEARS=2024,2025   to restrict years.
 *
 * Usage:  npx tsx scripts/scrape-josaa.ts
 * Output: data/josaa_data.csv  (merged; existing rows are skipped)
 */

import { chromium, Browser, Page } from "playwright";
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

// ─── Config ────────────────────────────────────────────────────────────────────
const ALL_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
const YEARS: number[] = process.env.JOSAA_YEARS
  ? process.env.JOSAA_YEARS.split(",").map(Number)
  : ALL_YEARS;
const ALL_ROUNDS = process.env.SCRAPE_ALL_ROUNDS === "true";
const TARGET_ROUND = 6;
const NAV_TIMEOUT = 90_000;
const DELAY_MS = 1500;
// Override via JOSAA_CURRENT_YEAR when the calendar year has rolled over
// but JoSAA's "current" page still holds last year's final data.
const CURRENT_COUNSELLING_YEAR = process.env.JOSAA_CURRENT_YEAR
  ? parseInt(process.env.JOSAA_CURRENT_YEAR, 10)
  : new Date().getFullYear();

const ARCHIVE_URL =
  "https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx";
const CURRENT_URL =
  "https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx";

const OUT_DIR = join(process.cwd(), "data");
const OUT_PATH = join(OUT_DIR, "josaa_data.csv");
const CSV_HEADER =
  "institute,instituteShort,instituteType,state,program,degree,quota,seatType,gender,openingRank,closingRank,year,round,courseFee";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface JoSAARecord {
  institute: string;
  instituteShort: string;
  instituteType: "IIT" | "NIT" | "IIIT" | "GFTI" | "SPA";
  state: string;
  program: string;
  degree: string;
  quota: "AI" | "HS" | "OS";
  seatType: string;
  gender: "Gender-Neutral" | "Female-only";
  openingRank: number;
  closingRank: number;
  year: number;
  round: number;
  courseFee: string;
}

type SelectOption = { v: string; t: string };

// ─── Seat type code → canonical label mapping ──────────────────────────────────
// Codes observed: OPNO, BCNO, SCNO, STNO, EWNO, OPPH, BCPH, SCPH, STPH, EWPH
const SEAT_TYPE_MAP: Record<string, string> = {
  OPNO: "OPEN",
  BCNO: "OBC-NCL",
  SCNO: "SC",
  STNO: "ST",
  EWNO: "EWS",
  OPPH: "OPEN (PwD)",
  BCPH: "OBC-NCL (PwD)",
  SCPH: "SC (PwD)",
  STPH: "ST (PwD)",
  EWPH: "EWS (PwD)",
};

// Institute type code → canonical label
const INST_TYPE_MAP: Record<string, "IIT" | "NIT" | "IIIT" | "GFTI" | "SPA"> = {
  IIT:  "IIT",
  NIT:  "NIT",
  "3IT": "IIIT",
  CFI:  "GFTI",
  SPA:  "SPA",
};

// ─── Metadata helpers ───────────────────────────────────────────────────────────
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

function inferInstType(name: string): "IIT" | "NIT" | "IIIT" | "GFTI" | "SPA" {
  const lower = name.toLowerCase();
  if (lower.includes("indian institute of technology") && !lower.includes("information")) return "IIT";
  if (lower.includes("national institute of technology") || lower.includes("indian institute of engineering science and technology") || lower.includes("vnit") || lower.includes("mnnit") || lower.includes("manit") || lower.includes("svnit")) return "NIT";
  if (lower.includes("indian institute of information technology")) return "IIIT";
  if (lower.includes("school of planning and architecture")) return "SPA";
  return "GFTI";
}

/**
 * The program cell contains "Program Name (Duration, Degree)".
 * Split into clean program name + degree.
 */
function splitProgramCell(cell: string): { program: string; degree: string } {
  const m = cell.match(/^(.+?)\s*\((\d+\s+Years?,\s*[^)]+)\)\s*$/);
  if (m) return { program: m[1].trim(), degree: m[2].trim() };
  return { program: cell.trim(), degree: "Bachelor of Technology" };
}

function normalizeGender(raw: string): "Gender-Neutral" | "Female-only" {
  if (raw.toLowerCase().includes("female")) return "Female-only";
  return "Gender-Neutral";
}

// ─── CSV helpers ────────────────────────────────────────────────────────────────
function q(val: string): string {
  return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
}

function toCSVRow(r: JoSAARecord): string {
  return [
    q(r.institute), q(r.instituteShort), r.instituteType, q(r.state),
    q(r.program), q(r.degree), r.quota, q(r.seatType), q(r.gender),
    r.openingRank, r.closingRank, r.year, r.round, q(r.courseFee),
  ].join(",");
}

function loadExistingKeys(): Set<string> {
  if (!existsSync(OUT_PATH)) return new Set();
  const keys = new Set<string>();
  for (const line of readFileSync(OUT_PATH, "utf-8").split("\n").slice(1)) {
    if (!line.trim()) continue;
    const c = line.split(",");
    if (c.length >= 13)
      keys.add(`${c[0]}|${c[4]}|${c[6]}|${c[7]}|${c[8]}|${c[11]}|${c[12]}`);
  }
  return keys;
}

// ─── Browser helpers ────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Set a Chosen-wrapped <select> value and trigger the ASP.NET postback.
 * __doPostBack causes full page navigation — catch the "context destroyed" error.
 */
async function chosenSet(page: Page, name: string, val: string): Promise<void> {
  try {
    await page.evaluate(
      ({ n, v }) => {
        const el = document.querySelector<HTMLSelectElement>(`select[name="${n}"]`);
        if (!el) throw new Error(`Select not found: ${n}`);
        el.value = v;
        const dpb = (window as unknown as Record<string, unknown>)["__doPostBack"] as
          | ((t: string, a: string) => void)
          | undefined;
        if (dpb) dpb(n, "");
        else el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { n: name, v: val }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("context was destroyed") && !msg.includes("Execution context"))
      throw err;
    // Navigation started — expected, continue to waitForLoadState
  }
  await page.waitForLoadState("load", { timeout: NAV_TIMEOUT }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT }).catch(() => {});
  await sleep(800);
}

async function getOptions(page: Page, name: string): Promise<SelectOption[]> {
  return page
    .evaluate((n) => {
      const el = document.querySelector<HTMLSelectElement>(`select[name="${n}"]`);
      return Array.from(el?.options ?? []).map((o) => ({
        v: (o as HTMLOptionElement).value,
        t: o.text.trim(),
      }));
    }, name)
    .catch(() => [] as SelectOption[]);
}

async function waitForDropdownUpdate(page: Page, name: string) {
  await page.waitForFunction((n) => {
    const el = document.querySelector(`select[name="${n}"]`) as HTMLSelectElement;
    return el && el.options.length > 1;
  }, name, { timeout: 10000 }).catch(() => {});
}

function pickAll(opts: SelectOption[]): SelectOption | null {
  return opts.find((o) => o.t === "ALL" || o.v === "ALL") ?? opts[1] ?? null;
}

/**
 * Parse the result table after a successful submit.
 */
async function parseTable(page: Page, year: number, round: number, instTypeCode: string): Promise<JoSAARecord[]> {
  const rows = await page
    .evaluate(() => {
      const pnl =
        document.querySelector("#ctl00_ContentPlaceHolder1_pnlDisplayDetails") ??
        document;
      return Array.from(pnl.querySelectorAll("table tr")).map((tr) =>
        Array.from(tr.querySelectorAll("td")).map(
          (td) => (td as HTMLElement).innerText.trim()
        )
      );
    })
    .catch(() => [] as string[][]);

  const records: JoSAARecord[] = [];

  for (const cells of rows) {
    if (cells.length < 7) continue;
    const [institute, programCell, quota, seatTypeCode, genderRaw, openStr, closeStr] = cells;
    if (!institute || institute.toLowerCase().includes("institute name")) continue;

    const openingRank = parseInt(openStr.replace(/,/g, ""), 10);
    const closingRank = parseInt(closeStr.replace(/,/g, ""), 10);
    if (isNaN(openingRank) || isNaN(closingRank)) continue;

    const { program, degree } = splitProgramCell(programCell);
    const seatType = SEAT_TYPE_MAP[seatTypeCode] ?? seatTypeCode;
    const gender = normalizeGender(genderRaw);
    const instType = inferInstType(institute);

    records.push({
      institute,
      instituteShort: inferShortName(institute),
      instituteType: instType,
      state: inferState(institute),
      program,
      degree,
      quota: quota as "AI" | "HS" | "OS",
      seatType,
      gender,
      openingRank,
      closingRank,
      year,
      round,
      courseFee: FEE_MAP[instType] ?? "1.5 Lakh",
    });
  }

  return records;
}

// ─── Core scrape for one year+round ─────────────────────────────────────────────
async function scrapeYearRound(
  page: Page,
  url: string,
  year: number,
  round: number,
  isCurrentYear: boolean,
  existingKeys: Set<string>
): Promise<JoSAARecord[]> {
  // effectiveUrl may switch to CURRENT_URL if archive doesn't have this year yet
  let effectiveUrl = url;
  let effectiveIsCurrent = isCurrentYear;

  await page.goto(effectiveUrl, { timeout: NAV_TIMEOUT, waitUntil: "domcontentloaded" });
  await sleep(1500);

  // ── Year (archive only) ──────────────────────────────────────────────────
  if (!effectiveIsCurrent) {
    const yearOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlYear");
    if (!yearOpts.find((o) => o.v === String(year))) {
      // Archive doesn't have this year yet — try the current-year URL as fallback
      console.log(`    ⚠  Year ${year} not in archive — retrying with current-year URL`);
      effectiveUrl = CURRENT_URL;
      effectiveIsCurrent = true;
      await page.goto(effectiveUrl, { timeout: NAV_TIMEOUT, waitUntil: "domcontentloaded" });
      await sleep(1500);
    } else {
      await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlYear", String(year));
      await waitForDropdownUpdate(page, "ctl00$ContentPlaceHolder1$ddlroundno");
    }
  }

  // ── Round ────────────────────────────────────────────────────────────────
  const roundOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlroundno");
  if (roundOpts.length <= 1) {
    console.log(`    ⚠  Round dropdown empty`);
    return [];
  }
  let actualRound = round;
  if (!roundOpts.find((o) => o.v === String(round))) {
    const nums = roundOpts.map((o) => parseInt(o.v, 10)).filter((n) => !isNaN(n) && n > 0);
    actualRound = Math.max(...nums);
    console.log(`    ℹ  Round ${round} not available — using Round ${actualRound}`);
  }
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlroundno", String(actualRound));
  await waitForDropdownUpdate(page, "ctl00$ContentPlaceHolder1$ddlInstype");

  // ── Institute types ──────────────────────────────────────────────────────
  const instTypeOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlInstype");
  let realInstTypes = instTypeOpts.filter(
    (o) => o.v !== "0" && o.v !== "" && o.t !== "--Select--"
  );
  if (realInstTypes.length === 0) {
    console.log(`    ⚠  No institute types populated`);
    return [];
  }
  
  const allInstType = pickAll(realInstTypes);
  if (allInstType) {
    realInstTypes = [allInstType]; // Only use 'ALL' to speed up scraping
  }

  const allNew: JoSAARecord[] = [];

  for (const instOpt of realInstTypes) {
    process.stdout.write(`    ${year}|R${actualRound}|${instOpt.t.substring(0, 5)} … `);

    // Re-navigate and redo Year + Round before each insttype iteration
    await page.goto(effectiveUrl, { timeout: NAV_TIMEOUT, waitUntil: "domcontentloaded" });
    await sleep(1200);

    if (!effectiveIsCurrent) {
      await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlYear", String(year));
      await waitForDropdownUpdate(page, "ctl00$ContentPlaceHolder1$ddlroundno");
    }
    await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlroundno", String(actualRound));
    await waitForDropdownUpdate(page, "ctl00$ContentPlaceHolder1$ddlInstype");
    await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstype", instOpt.v);
    await waitForDropdownUpdate(page, "ctl00$ContentPlaceHolder1$ddlInstitute");

    // Institute → ALL
    const instNameOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlInstitute");
    const allInst = pickAll(instNameOpts);
    if (!allInst) { process.stdout.write("no institutes\n"); continue; }
    await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstitute", allInst.v);
    await waitForDropdownUpdate(page, "ctl00$ContentPlaceHolder1$ddlBranch");

    // Program → ALL
    const progOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlBranch");
    const allProg = pickAll(progOpts);
    if (!allProg) { process.stdout.write("no programs\n"); continue; }
    await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlBranch", allProg.v);

    // SeatType → ALL  (name differs between archive "ddlSeatType" and current "ddlSeattype")
    const SEAT_NAME = await page.evaluate(() =>
      (document.querySelector('select[name*="ddlSeat"]') as HTMLSelectElement | null)
        ?.getAttribute("name") ?? "ctl00$ContentPlaceHolder1$ddlSeatType"
    ).catch(() => "ctl00$ContentPlaceHolder1$ddlSeatType");

    await waitForDropdownUpdate(page, SEAT_NAME);
    const seatOpts = await getOptions(page, SEAT_NAME);
    const allSeat = pickAll(seatOpts);
    if (allSeat) {
      await page
        .evaluate(({ name, v }) => {
          const el = document.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
          if (el) el.value = v;
        }, { name: SEAT_NAME, v: allSeat.v })
        .catch(() => {});
      await sleep(300);
    }

    // Submit
    await Promise.all([
      page.waitForLoadState("load", { timeout: NAV_TIMEOUT }).catch(() => {}),
      page.click('input[name="ctl00$ContentPlaceHolder1$btnSubmit"]').catch(() =>
        page.click("#ctl00_ContentPlaceHolder1_btnSubmit")
      ),
    ]);
    await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT }).catch(() => {});
    await sleep(1500);

    const records = await parseTable(page, year, actualRound, instOpt.v);
    const novel = records.filter((r) => {
      const key = `${q(r.institute)}|${q(r.program)}|${r.quota}|${q(r.seatType)}|${q(r.gender)}|${r.year}|${r.round}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    allNew.push(...novel);
    process.stdout.write(`${novel.length} new\n`);
    if (novel.length > 0) {
      appendFileSync(OUT_PATH, novel.map(toCSVRow).join("\n") + "\n", "utf-8");
    }
    await sleep(DELAY_MS);
  }

  return allNew;
}

// ─── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  JoSAA Multi-Year Scraper (Playwright)           ║");
  console.log(`║  Years : ${YEARS.join(", ").padEnd(41)}║`);
  console.log(`║  Rounds: ${ALL_ROUNDS ? "1–6 (all)" : "6 only (final round)"}${" ".repeat(ALL_ROUNDS ? 33 : 24)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(OUT_PATH)) writeFileSync(OUT_PATH, `${CSV_HEADER}\n`, "utf-8");
  const existingKeys = loadExistingKeys();
  console.log(`📂 Existing records: ${existingKeys.size}\n`);

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const allNew: JoSAARecord[] = [];
  const maxYear = Math.max(...YEARS);

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    for (const year of YEARS) {
      const rounds = ALL_ROUNDS ? [1, 2, 3, 4, 5, 6] : [TARGET_ROUND];
      const isCurrentYear = year === CURRENT_COUNSELLING_YEAR;
      const url = isCurrentYear ? CURRENT_URL : ARCHIVE_URL;

      for (const round of rounds) {
        console.log(`\n━━━ Year ${year} · Round ${round} ━━━`);
        try {
          const records = await scrapeYearRound(
            page, url, year, round, isCurrentYear, existingKeys
          );
          allNew.push(...records);
        } catch (err) {
          console.warn(`  ⚠  ${(err as Error).message.split("\n")[0]}`);
        }
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }

  if (allNew.length === 0) {
    console.log("\n⚠  No new records scraped.");
    console.log(existingKeys.size > 0 ? "   CSV already up-to-date." : "   Check connectivity.");
  } else {
    console.log(`\n✅  Done — ${allNew.length} new records → data/josaa_data.csv`);
  }
  console.log(`ℹ   Prediction API auto-uses ${maxYear} Round 6 cutoffs at runtime.`);
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
