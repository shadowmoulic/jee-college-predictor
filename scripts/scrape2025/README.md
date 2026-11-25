# JoSAA 2025 Per-Round Scraper

Dedicated scraper for JoSAA 2025 all-round opening/closing rank data.

## What it does

Drives the official JoSAA archive at `josaa.admissions.nic.in` with Playwright,
selects **Year 2025** and each round 1–6 independently, and writes one CSV per round:

```
data/
  2025_round1.csv
  2025_round2.csv
  ...
  2025_round6.csv
```

Each CSV uses the 7-column raw format expected by `src/lib/csv-parser.ts`:
```
Institute, Academic Program Name, Quota, Seat Type, Gender, Opening Rank, Closing Rank
```

## Prerequisites

```bash
npx playwright install chromium
```

## Usage

```bash
# Scrape all 6 rounds (overwrites existing files)
npx tsx scripts/scrape2025/scrape.ts

# Scrape specific rounds only
npx tsx scripts/scrape2025/scrape.ts --rounds=1,3,6

# Dry run — print record counts without writing files
npx tsx scripts/scrape2025/scrape.ts --dry-run

# After scraping, clear the server cache so fresh data loads
npx tsx scripts/scrape2025/clear-cache.ts
```

Or via npm scripts (add to package.json if desired):
```bash
npm run scrape:2025rounds           # all rounds
npm run scrape:2025rounds -- --rounds=6   # round 6 only
```

## How it differs from the main scraper

| | `scripts/scrape-josaa.ts` | `scripts/scrape2025/scrape.ts` |
|---|---|---|
| Years | 2020–2025 configurable | 2025 only |
| Output | `data/josaa_data.csv` (append) | `data/2025_round{N}.csv` (one per round) |
| Format | 14-column full format | 7-column raw format |
| Purpose | Historical archive | Per-round 2025 data |

## Data pipeline

After scraping, the `src/lib/josaa-data.ts` loader automatically picks up the new files:
- `getJosaaData()` merges all `data/2025_round*.csv` + `data/josaa_data.csv`
- `getLatestCutoffData()` returns Round 6 cutoffs for the prediction engine
- `branch-history` API uses all rounds for the round-wise table in the modal
