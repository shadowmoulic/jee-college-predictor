# JEE College Predictor 2027

A full-stack Next.js application that predicts college admission chances for JEE Advanced and JEE Main aspirants using official JoSAA cutoff data, real placement statistics, and multi-year trend analysis.

---

## Features

- **Rank-based prediction** — enter your rank, category, domicile state, and gender; get a filtered, probability-ranked list of eligible colleges and branches
- **Real placement data** — avg package, median package, highest package, placement rate, and total offers sourced from `data/placement_fees.json` (130 colleges)
- **Multi-year round history** — click any branch to see a year × round closing-rank table pulled live from the full JoSAA dataset (288 K+ records, 2020–2025)
- **Smart filtering** — probability (high / medium / low), duration (4 yr / 5 yr), degree type, branch search, state search, quick filters (Top 5, Top 10, CS, Core, Home State)
- **College detail pages** — full cutoff table with placement hero panel for every participating institute
- **Colleges directory** — searchable listing of all 130+ institutes with live placement badges

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 6 |
| Styling | CSS Modules + CSS custom properties (zero UI libraries) |
| Font | Plus Jakarta Sans (Google Fonts) |
| Data scraper | TypeScript + Playwright + Cheerio |
| Runtime | Node.js |

---

## Project Structure

```
├── data/
│   ├── josaa_data.csv          # Full scraped dataset (288 K+ rows, gitignored)
│   └── placement_fees.json     # Placement & fee data for 130 colleges
│
├── public/
│   └── josaa_data.json         # ~200-row curated fallback (ships with repo)
│
├── scripts/
│   ├── scrape-josaa.ts         # JoSAA scraper (ASP.NET WebForms)
│   └── fetch-placement-fees.ts # Placement data fetcher
│
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── predict/        # Core prediction engine
    │   │   ├── colleges/       # College listing + [id] detail
    │   │   ├── branches/       # Unique programs / degrees / states
    │   │   └── branch-history/ # Year × round historical cutoffs
    │   ├── college/[id]/       # Per-institute detail page
    │   ├── colleges/           # Full college directory
    │   ├── data.ts             # Canonical types + domain constants
    │   ├── globals.css         # CSS custom properties (design tokens)
    │   └── page.module.css     # All component styles
    │
    ├── components/
    │   ├── layout/Navbar.tsx
    │   ├── predictor/
    │   │   ├── HeroSection.tsx
    │   │   ├── PredictorForm.tsx
    │   │   └── ResultsView.tsx
    │   └── results/
    │       ├── CollegeCard.tsx
    │       ├── BranchModal.tsx
    │       └── FiltersPanel.tsx
    │
    └── lib/
        ├── josaa-data.ts       # Centralized data loader (CSV → JSON fallback)
        ├── placement-data.ts   # placement_fees.json loader
        └── csv-parser.ts       # JoSAA CSV parser
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <repo-url>
cd JEE_College_predicter
npm install
```

### Run in development

```bash
# Start frontend (Next.js) on http://localhost:3000
npm run dev

# Start backend (Predictor API) on http://localhost:4000
cd nexus-predictor
npm run dev
```

The frontend works out of the box using the bundled `public/josaa_data.json` (curated ~200-record sample covering major IITs). Run the scraper to get the full 288 K-row dataset. To start the python prediction pipeline, make sure you configure the local virtual environment in the `nexus-predictor` directory.

---

## Data Setup

### Full JoSAA dataset (recommended)

```bash
# Scrape all years (2020–2025), final round only — takes ~10–20 min
npm run scrape

# Scrape only 2025 data
npm run scrape:2025

# Scrape all 6 rounds per year (288 K+ rows) — needed for round-history feature
npm run scrape:all-rounds
```

Output is written to `data/josaa_data.csv`. The server reads this file on startup and caches it in memory. The predictor and branch-history features work with real multi-year data only when this file is present.

### Placement & fee data

`data/placement_fees.json` is already populated with curated data for 130 colleges. To refresh it:

```bash
npm run fetch-placement
```

### Data sources and fallback chain

```
data/josaa_data.csv  →  (missing)  →  public/josaa_data.json
data/placement_fees.json  →  (missing)  →  fields omitted from API response
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NVIDIA_NIM_API_KEY` | For AI chat | NVIDIA NIM API key for the `/api/ai-chat` endpoint |
| `NVIDIA_NIM_MODEL` | Optional | Defaults to `meta/llama-3.3-70b-instruct` |
| `NEXT_PUBLIC_APP_URL` | Optional | Public origin used by canonical URLs, the sitemap and structured data. Defaults to the live Vercel hostname. Localhost overrides apply in development. |

Create a `.env.local` for local overrides:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NVIDIA_NIM_API_KEY=your_key_here
```

---

## API Reference

API endpoints are under `/api/`. College detail pages and their API endpoint read the same local JoSAA and placement data.

### `GET /api/predict`

Core prediction engine. Returns colleges and branches filtered to the user's rank and eligibility.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `rank` | number | JEE rank (required) |
| `exam` | string | `JEE Advanced` or `JEE Main` |
| `category` | string | `General (CRL)`, `OBC-NCL`, `SC`, `ST`, `EWS`, `PwD` |
| `domicileState` | string | Class 12 state (for HS/OS quota logic) |
| `gender` | string | `Male` or `Female` |
| `searchQuery` | string | Free-text search across college + branch names |
| `activeProbFilter` | string | `high`, `medium`, or `low` |
| `durationFilters` | string | Comma-separated: `4 years`, `5 years` |
| `degreeFilters` | string | Comma-separated: `B.Tech + M.Tech`, `B.Sc.`, `B.E.` |
| `branchSearch` | string | Filter by branch name substring |
| `stateSearch` | string | Filter by college state substring |
| `quickFilter` | string | `all`, `top5`, `top10`, `cs`, `core`, `domicile` |
| `instituteType` | string | `all`, `IIT`, `NIT`, `IIIT`, `GFTI` |

**Probability logic:**

| Label | Condition |
|---|---|
| `high` | `rank ≤ closingRank × 0.65` |
| `medium` | `rank ≤ closingRank × 1.15` |
| `low` | `rank > closingRank × 1.15` (excluded from results) |

**Response shape:**
```json
{
  "colleges": [
    {
      "id": "indian-institute-of-technology-bombay",
      "name": "Indian Institute of Technology Bombay",
      "state": "Maharashtra",
      "instituteType": "IIT",
      "courseFee": "2.5 Lakh",
      "avgPackage": "25 LPA",
      "medianPackage": "22 LPA",
      "highestPackage": "2.2 Crore",
      "placementRate": "84%",
      "totalOffers": 1602,
      "placementYear": 2024,
      "top5": true,
      "top10": true,
      "branches": [
        {
          "name": "Computer Science and Engineering",
          "degree": "4 Years, Bachelor of Technology",
          "quota": "AI",
          "seatType": "OPEN",
          "gender": "Gender-Neutral",
          "opening": 2,
          "closing": 66,
          "prob": "high",
          "isCS": true,
          "isCore": false,
          "package": "25 LPA"
        }
      ]
    }
  ],
  "totalCollegesCount": 23,
  "totalBranchesCount": 258,
  "dataSource": "JoSAA 2025 Round 5"
}
```

---

### `GET /api/branch-history`

Returns the full year × round closing-rank history for a specific branch/seat combination.

**Query parameters:** `institute`, `program`, `seatType`, `gender`, `quota`

**Response:**
```json
{
  "history": [
    { "year": 2020, "round": 1, "opening": 2, "closing": 63 },
    { "year": 2020, "round": 6, "opening": 2, "closing": 66 },
    { "year": 2024, "round": 5, "opening": 2, "closing": 66 }
  ],
  "years": [2020, 2021, 2022, 2023, 2024],
  "rounds": [1, 2, 3, 4, 5, 6]
}
```

---

### `GET /api/colleges`

Returns all institutes with metadata and placement data.

---

### `GET /api/colleges/[id]`

Returns full cutoff data + placement info for a single institute.

**Response:**
```json
{
  "id": "indian-institute-of-technology-bombay",
  "name": "Indian Institute of Technology Bombay",
  "state": "Maharashtra",
  "instituteType": "IIT",
  "dataYear": 2025,
  "dataRound": 5,
  "totalPrograms": 189,
  "cutoffs": [ ... ],
  "placement": {
    "avgPackage": "25 LPA",
    "medianPackage": "22 LPA",
    "highestPackage": "2.2 Crore",
    "placementRate": "84%",
    "totalOffers": 1602,
    "annualFee": "2.5 Lakh",
    "dataYear": 2024
  }
}
```

---

### `GET /api/branches`

Returns unique branch names, degree types, states, and available years.

---

## Prediction Logic (detailed)

Filters are applied in this order inside `/api/predict`:

1. **Exam type** — JEE Advanced → IITs only; JEE Main → NITs, IIITs, GFTIs only
2. **Rank buffer** — records where `closingRank × 1.15 < rank` are excluded (the 15% buffer gives a generous low-probability zone)
3. **Seat type** — mapped from category via `CATEGORY_TO_SEAT_TYPE` in `data.ts`
4. **Gender** — Male → Gender-Neutral seats only; Female → Gender-Neutral + Female-only
5. **Quota** — IITs: AI only; NITs/IIITs/GFTIs: AI (all) + HS (home state match) + OS (other state)
6. **UI filters** — quickFilter, stateSearch, branchSearch, searchQuery, probability, duration, degree type

Results are sorted: IIT → NIT → IIIT → GFTI, then by minimum closing rank within each group.

---

## Data Architecture

```
scripts/scrape-josaa.ts
    ↓  writes
data/josaa_data.csv   ←──────────┐
                                 │ CSV parse + cache
src/lib/josaa-data.ts ───────────┘
    ↓  getJosaaData()            getLatestCutoffData()   getAvailableYears()
    ↓
/api/predict, /api/colleges, /api/branches, /api/branch-history, /api/colleges/[id]

data/placement_fees.json
    ↓
src/lib/placement-data.ts  →  getPlacementForCollege(name)
    ↓
enriches every college object in /api/predict and /api/colleges/[id]
```

Both loaders maintain a module-level in-memory cache that lives for the lifetime of the server process. Call `clearDataCache()` from `josaa-data.ts` after a fresh scrape to force a reload on the next request.

---

## Scraper Notes

`scripts/scrape-josaa.ts` scrapes `josaa.nic.in` (ASP.NET WebForms):

- Fetches a fresh `__VIEWSTATE` token before every POST to avoid session expiry
- Covered institute types: IIT, NIT, IIIT, GFTI, SPA
- Years: 2020–2025
- Deduplicates against existing CSV rows by a composite key — safe to re-run incrementally
- With `SCRAPE_ALL_ROUNDS=true`, scrapes all 6 rounds per year (required for the branch-history feature)

---

## Content Security Policy

`src/middleware.ts` (currently using deprecated `middleware` filename — rename to `proxy.ts` to silence the Next.js warning) enforces a strict CSP in production. When adding new external resources (fonts, APIs, CDNs), update both the dev and production CSP branches.

---

## Development Notes

### Adding a new filter

1. Add the parameter to `FilterState` in `src/types/predictor.ts`
2. Wire it through `page.tsx` state + the `fetchPredictions` URL builder
3. Apply the filter inside `/api/predict/route.ts`
4. Render the filter control in `FiltersPanel.tsx`

### Adding a new data field

1. Add the field to `College` (or `Branch`) in `src/app/data.ts`
2. Populate it in `/api/predict/route.ts` when building the `filtered` array
3. The field automatically flows to `CollegeWithFilteredBranches` via the `Omit` + extension in `src/types/predictor.ts`
4. Consume it in `CollegeCard.tsx` or `BranchModal.tsx`

### CSS conventions

All styling lives in `src/app/page.module.css` using CSS Modules. Design tokens (colors, radius, shadows) are defined as CSS custom properties in `globals.css`:

```css
--brand: #1a56db;
--surface, --surface-2, --surface-3   /* backgrounds */
--text, --text-secondary, --text-muted
--high-bg / --high-text               /* green probability */
--med-bg  / --med-text                /* amber probability */
--low-bg  / --low-text                /* red probability */
```

No external UI libraries are used — add new styles to the CSS module file and reference them as `styles.className`.

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (default port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run scrape` | Scrape all years, final round only |
| `npm run scrape:2025` | Scrape 2025 data only |
| `npm run scrape:all-rounds` | Scrape all rounds (required for history feature) |
| `npm run fetch-placement` | Refresh placement_fees.json |
| `npm run fetch-placement:skip-nirf` | Refresh placement data, skip NIRF fetch |

---

## License

Private repository — not licensed for redistribution.
