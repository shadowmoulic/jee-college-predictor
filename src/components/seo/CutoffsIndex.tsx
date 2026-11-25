import { get2026RoundLabel } from "@/lib/josaa-2026";
import Link from "next/link";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { getCutoffGuides } from "@/lib/cutoff-guides";
import { siteUrl } from "@/lib/site";
import styles from "@/app/cutoffs/cutoffs.module.css";

const title = "JoSAA Cutoff Explorer by Branch and College";
const description = "Compare historical JoSAA opening and closing ranks by engineering branch and track how cutoffs changed at individual campuses.";
const path = "/cutoffs";

export function CutoffsIndex({ year }: { year?: 2026 }) {
  const guides = [...getCutoffGuides().values()].filter(guide => guide.kind === "comparison" && guide.year === year);
  return (
    <main className={styles.main}>
      <Breadcrumbs items={[["Home", "/"], ["JoSAA Cutoff Explorer", path], ...(year ? [["JoSAA 2026", "/cutoffs/2026"] as [string, string]] : [])]} />
      <JsonLd data={{ "@type": "CollectionPage", name: year ? "JoSAA 2026 Cutoffs" : title, description: year ? `Opening and closing ranks from JoSAA 2026 ${get2026RoundLabel()}.` : description, url: siteUrl(year ? "/cutoffs/2026" : path) }} />
      <h1>{year ? "JoSAA 2026 Opening and Closing Ranks" : "JoSAA Cutoff Explorer"}</h1>
      {year ? <p>Compare the latest available tables or open a campus page to see how its ranks moved across {get2026RoundLabel()}. <Link href="/cutoffs">Compare with earlier years</Link>.</p>
        : <p><Link href="/cutoffs/2026">Browse JoSAA 2026 round-by-round cutoffs</Link>.</p>}
      <p>See which campuses offered your preferred B.Tech branch and compare the closing ranks from the same round. Open a campus history to see how its cutoff moved over time.</p>
      <p><Link href="/cutoffs/2025-vs-2026">Calculate JoSAA rank changes from 2025 to 2026</Link>{" · "}<Link href="/colleges">Browse all colleges in the supplied JoSAA data</Link></p>
      <p>These pages use historical OPEN, gender-neutral ranks. Each table identifies its quota and data year. For reserved categories or other seat pools, use the <Link href="/">JEE College Predictor</Link>.</p>
      {["IITs", "NITs", "IIITs", "GFTIs"].map(group => {
        const matches = guides.filter(guide => guide.group === group).sort((a, b) => a.branch.localeCompare(b.branch));
        if (!matches.length) return null;
        return (
          <section key={group}>
            <h2>{group}</h2>
            <ul className={styles.grid}>
              {matches.map(guide => (
                <li key={guide.path}>
                  <Link href={guide.path}>
                    {guide.branch}
                    <small>{guide.rows.length} campuses · {guide.rows[0].year} round {guide.rows[0].round}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
