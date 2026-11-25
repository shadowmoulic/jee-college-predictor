import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { getCutoffGuides } from "@/lib/cutoff-guides";
import { siteUrl } from "@/lib/site";
import styles from "./cutoffs.module.css";

const title = "JoSAA Cutoff Explorer by Branch and College";
const description = "Compare historical JoSAA opening and closing ranks by engineering branch and track how cutoffs changed at individual campuses.";
const path = "/cutoffs";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: siteUrl(path) },
  openGraph: { title, description, url: siteUrl(path) },
};

export default function CutoffsPage() {
  const guides = [...getCutoffGuides().values()].filter(guide => guide.kind === "comparison");
  return (
    <main className={styles.main}>
      <Breadcrumbs items={[["Home", "/"], ["JoSAA Cutoff Explorer", path]]} />
      <JsonLd data={{ "@type": "CollectionPage", name: title, description, url: siteUrl(path) }} />
      <h1>JoSAA Cutoff Explorer</h1>
      <p>See which campuses offered your preferred B.Tech branch and compare the closing ranks from the same round. Open a campus history to see how its cutoff moved over time.</p>
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
