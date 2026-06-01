/**
 * Clears the in-memory JoSAA data cache by hitting the internal cache-bust endpoint.
 * Run this after scraping to force the Next.js server to reload fresh 2025 data.
 *
 * Usage:  npx tsx scripts/scrape2025/clear-cache.ts
 */

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function main() {
  const url = `${BASE}/api/predict?rank=1&category=OPEN&gender=Gender-Neutral&clearCache=true`;
  console.log(`Clearing cache via ${url} …`);
  const res = await fetch(url).catch((err: Error) => {
    console.error("Request failed:", err.message);
    console.error("Is the dev server running? (npm run dev)");
    process.exit(1);
  });
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    console.log("✅  Cache cleared — next prediction request will reload 2025 round data.");
  } else {
    console.warn("⚠  Unexpected status — check the server logs.");
  }
}

main();
