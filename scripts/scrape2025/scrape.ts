/**
 * JoSAA 2025 Per-Round Scraper
 *
 * Scrapes all 6 rounds of JoSAA 2025 opening/closing ranks from the official
 * archive site and writes one CSV per round to data/2025_round{N}.csv.
 *
 * Output format (7 columns, matching parse2025RoundCSV):
 *   Institute, Academic Program Name, Quota, Seat Type, Gender, Opening Rank, Closing Rank
 *
 * Usage:
 *   npx tsx scripts/scrape2025/scrape.ts
 *   npx tsx scripts/scrape2025/scrape.ts --rounds 1,3,6   # specific rounds only
 *   npx tsx scripts/scrape2025/scrape.ts --dry-run         # print counts, no file writes
 *
 * Prerequisites: npx playwright install chromium
 */

import { chromium, Browser, Page } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ─── Config ────────────────────────────────────────────────────────────────────

const ARCHIVE_URL =
  "https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx";

const YEAR = 2025;
const ALL_ROUNDS = [1, 2, 3, 4, 5, 6];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const roundsArg = args.find((a) => a.startsWith("--rounds=") || a.startsWith("--rounds"));
let targetRounds = ALL_ROUNDS;
if (roundsArg) {
  const val = roundsArg.includes("=") ? roundsArg.split("=")[1] : args[args.indexOf(roundsArg) + 1];
  targetRounds = val.split(",").map(Number).filter((n) => n >= 1 && n <= 6);
}

const OUT_DIR = join(process.cwd(), "data");
const NAV_TIMEOUT = 90_000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── CSV header ────────────────────────────────────────────────────────────────

const CSV_HEADER = "Institute,Academic Program Name,Quota,Seat Type,Gender,Opening Rank,Closing Rank";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function q(val: string): string {
  return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
}

type SelectOption = { v: string; t: string };

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
    if (!msg.includes("context was destroyed") && !msg.includes("Execution context")) throw err;
  }
  await page.waitForLoadState("load", { timeout: NAV_TIMEOUT }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT }).catch(() => {});
  await sleep(800);
}

async function waitForOptions(page: Page, name: string): Promise<void> {
  await page
    .waitForFunction(
      (n) => {
        const el = document.querySelector(`select[name="${n}"]`) as HTMLSelectElement | null;
        return el && el.options.length > 1;
      },
      name,
      { timeout: 12_000 }
    )
    .catch(() => {});
}

function pickAll(opts: SelectOption[]): SelectOption | undefined {
  return opts.find((o) => o.t === "ALL" || o.v === "ALL") ?? opts[1];
}

// ─── Parse result table ─────────────────────────────────────────────────────────

interface RawRecord {
  institute: string;
  program: string;
  quota: string;
  seatType: string;
  gender: string;
  openingRank: number;
  closingRank: number;
}

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

function normalizeGender(raw: string): string {
  return raw.toLowerCase().includes("female") ? "Female-only (including Supernumerary)" : "Gender-Neutral";
}

async function parseTable(page: Page): Promise<RawRecord[]> {
  const rows = await page
    .evaluate(() => {
      const pnl =
        document.querySelector("#ctl00_ContentPlaceHolder1_pnlDisplayDetails") ?? document;
      return Array.from(pnl.querySelectorAll("table tr")).map((tr) =>
        Array.from(tr.querySelectorAll("td")).map((td) => (td as HTMLElement).innerText.trim())
      );
    })
    .catch(() => [] as string[][]);

  const records: RawRecord[] = [];
  for (const cells of rows) {
    if (cells.length < 7) continue;
    const [institute, programCell, quota, seatTypeRaw, genderRaw, openStr, closeStr] = cells;
    if (!institute || institute.toLowerCase().includes("institute name")) continue;

    const openingRank = parseInt(openStr.replace(/,/g, ""), 10);
    const closingRank = parseInt(closeStr.replace(/,/g, ""), 10);
    if (isNaN(openingRank) || isNaN(closingRank)) continue;

    records.push({
      institute,
      program: programCell,
      quota,
      seatType: SEAT_TYPE_MAP[seatTypeRaw] ?? seatTypeRaw,
      gender: normalizeGender(genderRaw),
      openingRank,
      closingRank,
    });
  }
  return records;
}

// ─── Scrape one round ───────────────────────────────────────────────────────────

async function scrapeRound(page: Page, round: number): Promise<RawRecord[]> {
  console.log(`\n━━━ Round ${round} ━━━`);

  await page.goto(ARCHIVE_URL, { timeout: NAV_TIMEOUT, waitUntil: "domcontentloaded" });
  await sleep(1_500);

  // Year
  const yearOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlYear");
  if (!yearOpts.find((o) => o.v === String(YEAR))) {
    console.log(`  ✗  Year ${YEAR} not found in archive dropdown`);
    return [];
  }
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlYear", String(YEAR));
  await waitForOptions(page, "ctl00$ContentPlaceHolder1$ddlroundno");

  // Round
  const roundOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlroundno");
  if (!roundOpts.find((o) => o.v === String(round))) {
    console.log(`  ✗  Round ${round} not available (options: ${roundOpts.map((o) => o.v).join(", ")})`);
    return [];
  }
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlroundno", String(round));
  await waitForOptions(page, "ctl00$ContentPlaceHolder1$ddlInstype");

  // Institute type → ALL
  const instTypeOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlInstype");
  const allInstType = pickAll(instTypeOpts.filter((o) => o.v !== "0" && o.v !== "" && o.t !== "--Select--"));
  if (!allInstType) {
    console.log(`  ✗  No institute type options`);
    return [];
  }
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstype", allInstType.v);
  await waitForOptions(page, "ctl00$ContentPlaceHolder1$ddlInstitute");

  // Institute → ALL
  const instOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlInstitute");
  const allInst = pickAll(instOpts);
  if (!allInst) {
    console.log(`  ✗  No institute options`);
    return [];
  }
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlInstitute", allInst.v);
  await waitForOptions(page, "ctl00$ContentPlaceHolder1$ddlBranch");

  // Program → ALL
  const progOpts = await getOptions(page, "ctl00$ContentPlaceHolder1$ddlBranch");
  const allProg = pickAll(progOpts);
  if (!allProg) {
    console.log(`  ✗  No program options`);
    return [];
  }
  await chosenSet(page, "ctl00$ContentPlaceHolder1$ddlBranch", allProg.v);

  // Seat type → ALL (field name varies between pages)
  const SEAT_NAME = await page
    .evaluate(
      () =>
        (
          document.querySelector('select[name*="ddlSeat"]') as HTMLSelectElement | null
        )?.getAttribute("name") ?? "ctl00$ContentPlaceHolder1$ddlSeatType"
    )
    .catch(() => "ctl00$ContentPlaceHolder1$ddlSeatType");
  await waitForOptions(page, SEAT_NAME);
  const seatOpts = await getOptions(page, SEAT_NAME);
  const allSeat = pickAll(seatOpts);
  if (allSeat) {
    await page
      .evaluate(
        ({ name, v }) => {
          const el = document.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
          if (el) el.value = v;
        },
        { name: SEAT_NAME, v: allSeat.v }
      )
      .catch(() => {});
    await sleep(300);
  }

  // Submit
  process.stdout.write(`  Submitting … `);
  await Promise.all([
    page.waitForLoadState("load", { timeout: NAV_TIMEOUT }).catch(() => {}),
    page
      .click('input[name="ctl00$ContentPlaceHolder1$btnSubmit"]')
      .catch(() => page.click("#ctl00_ContentPlaceHolder1_btnSubmit")),
  ]);
  await page.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT }).catch(() => {});
  await sleep(1_500);

  const records = await parseTable(page);
  console.log(`${records.length} records`);
  return records;
}

// ─── Write round CSV ────────────────────────────────────────────────────────────

function writeRoundCSV(round: number, records: RawRecord[]): void {
  const outPath = join(OUT_DIR, `2025_round${round}.csv`);
  const rows = records.map((r) =>
    [
      q(r.institute),
      q(r.program),
      r.quota,
      q(r.seatType),
      q(r.gender),
      r.openingRank,
      r.closingRank,
    ].join(",")
  );
  writeFileSync(outPath, [CSV_HEADER, ...rows].join("\n") + "\n", "utf-8");
  console.log(`  → Wrote ${records.length} rows to data/2025_round${round}.csv`);
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  JoSAA 2025 Per-Round Scraper                    ║");
  console.log(`║  Rounds : ${targetRounds.join(", ").padEnd(41)}║`);
  console.log(`║  Mode   : ${dryRun ? "DRY RUN (no writes)".padEnd(41) : "LIVE (writes to data/)".padEnd(41)}║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  mkdirSync(OUT_DIR, { recursive: true });

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const summary: { round: number; count: number }[] = [];

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    for (const round of targetRounds) {
      try {
        const records = await scrapeRound(page, round);
        summary.push({ round, count: records.length });

        if (records.length > 0 && !dryRun) {
          writeRoundCSV(round, records);
        } else if (records.length === 0) {
          console.log(`  ⚠  No records for Round ${round} — file not written`);
        }
      } catch (err) {
        console.warn(`  ✗  Round ${round} failed: ${(err as Error).message.split("\n")[0]}`);
        summary.push({ round, count: -1 });
      }
      await sleep(1_000);
    }

    await context.close();
  } finally {
    await browser.close();
  }

  console.log("\n─── Summary ───────────────────────────────────────");
  for (const { round, count } of summary) {
    if (count === -1) console.log(`  Round ${round}: ✗ FAILED`);
    else if (count === 0) console.log(`  Round ${round}: ⚠ 0 records`);
    else console.log(`  Round ${round}: ✓ ${count} records${dryRun ? " (dry run)" : ""}`);
  }

  const allOk = summary.every((s) => s.count > 0);
  if (allOk) {
    console.log(`\n✅  All ${targetRounds.length} rounds scraped successfully.`);
    if (!dryRun) {
      console.log("   Run: npx tsx scripts/scrape2025/clear-cache.ts  to reload data.");
    }
  } else {
    console.log("\n⚠  Some rounds failed or returned 0 records. Check the log above.");
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  process.exit(1);
});
