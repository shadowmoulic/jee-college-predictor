/**
 * Centralized JoSAA data loader.
 *
 * Loads data in this priority order:
 * 1. 2025 round CSVs  — data/2025_round*.csv  (raw JoSAA export, all rounds)
 * 2. Main CSV         — data/josaa_data.csv    (scraped full dataset, 2020–2024)
 * 3. Fallback JSON    — public/josaa_data.json (curated sample data)
 *
 * All sources are merged. Module-level cache — loaded once per server boot.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { JoSAARecord } from "@/app/data";
import { parseJosaaCSV, parse2025RoundCSV } from "./csv-parser";

let _cache: JoSAARecord[] | null = null;
let _dataSource = "unknown";

/** Load and merge all 2025_round*.csv files from the data directory */
function load2025RoundFiles(): JoSAARecord[] {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) return [];

  const roundFiles = readdirSync(dataDir)
    .filter((f) => /^2025_round\d+.*\.csv$/i.test(f))
    .sort(); // sort so round1 < round2 < ... < round6

  const records: JoSAARecord[] = [];
  for (const file of roundFiles) {
    // Extract round number from filename e.g. "2025_round6.csv" → 6
    const match = file.match(/round(\d+)/i);
    const round = match ? parseInt(match[1], 10) : 0;
    if (isNaN(round) || round === 0) continue;

    try {
      const raw = readFileSync(join(dataDir, file), "utf-8");
      const parsed = parse2025RoundCSV(raw, round);
      Array.prototype.push.apply(records, parsed); // avoid stack overflow
      console.log(`[JoSAA] Loaded ${parsed.length} records from ${file} (round ${round})`);
    } catch (err) {
      console.warn(`[JoSAA] Failed to load ${file}:`, err);
    }
  }

  return records;
}

export function getJosaaData(): JoSAARecord[] {
  if (_cache) return _cache;

  const all: JoSAARecord[] = [];

  // ── 1. Load 2025 round CSVs ─────────────────────────────────────────────
  const records2025 = load2025RoundFiles();
  if (records2025.length > 0) {
    all.push(...records2025);
    console.log(`[JoSAA] 2025 data: ${records2025.length} records total`);
  }

  // ── 2. Load main josaa_data.csv (2020–2024) ─────────────────────────────
  const csvPath = join(process.cwd(), "data", "josaa_data.csv");
  if (existsSync(csvPath)) {
    try {
      const raw = readFileSync(csvPath, "utf-8");
      const parsed = parseJosaaCSV(raw);
      if (parsed.length > 0) {
        // Chunked push — push.apply also overflows stack with 288k records
        const CHUNK = 10_000;
        for (let i = 0; i < parsed.length; i += CHUNK) {
          Array.prototype.push.apply(all, parsed.slice(i, i + CHUNK));
        }
        console.log(`[JoSAA] Main CSV: ${parsed.length} records`);
      }
    } catch (err) {
      console.warn("[JoSAA] Main CSV load failed:", err);
    }
  }

  // ── 3. Fallback JSON (only if no data at all) ────────────────────────────
  if (all.length === 0) {
    const jsonPath = join(process.cwd(), "public", "josaa_data.json");
    try {
      const raw = readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(raw) as JoSAARecord[];
      all.push(...parsed);
      console.log(`[JoSAA] Fallback JSON: ${parsed.length} records`);
    } catch (err) {
      console.error("[JoSAA] Failed to load fallback JSON:", err);
    }
  }

  if (all.length === 0) {
    // Don't cache an empty result — let the next request retry the data sources
    // rather than permanently poisoning the module-level cache with [].
    console.error("[JoSAA] No records loaded from any source. Cache not set; will retry on next request.");
    return [];
  }

  _cache = all;
  _dataSource = `JoSAA merged (${all.length} records — ${records2025.length} from 2025)`;
  console.log(`[JoSAA] Total cached: ${all.length} records`);
  return _cache;
}

export function getDataSource(): string {
  return _dataSource;
}

/** Clear cache — used after a fresh scrape so new data is loaded on next request */
export function clearDataCache(): void {
  _cache = null;
  _dataSource = "unknown";
}

/**
 * Returns deduplicated records for the latest year's final round only.
 *
 * Why deduplication is necessary:
 * Both data/2025_round*.csv files and data/josaa_data.csv can contain the
 * same 2025 data.  Without deduplication, the same (institute, program,
 * degree, quota, seatType, gender) tuple appears twice in the output, causing
 * duplicate branch rows in the UI (e.g. two "Civil Engineering" entries).
 *
 * The 2025_round*.csv files are loaded first in getJosaaData(), so their
 * records win the deduplication race — the scraped CSV records are dropped
 * when they cover the same slot.
 */
export function getLatestCutoffData(): JoSAARecord[] {
  const all = getJosaaData();
  if (all.length === 0) return [];

  const latestYear = all.reduce((max, r) => (r.year > max ? r.year : max), 0);
  const inYear     = all.filter((r) => r.year === latestYear);
  const latestRound = inYear.reduce((max, r) => (r.round > max ? r.round : max), 0);

  // Deduplicate: one record per (institute, program, degree, quota, seatType, gender)
  const seen    = new Set<string>();
  const deduped: JoSAARecord[] = [];
  for (const r of inYear) {
    if (r.round !== latestRound) continue;
    const key = `${r.institute}|${r.program}|${r.degree}|${r.quota}|${r.seatType}|${r.gender}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }
  return deduped;
}

/**
 * Returns all years present in the dataset, sorted descending.
 */
export function getAvailableYears(): number[] {
  const all = getJosaaData();
  const yearSet = new Set<number>();
  for (const r of all) yearSet.add(r.year);
  return [...yearSet].sort((a, b) => b - a);
}

