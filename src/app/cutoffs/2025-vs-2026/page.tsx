import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/JsonLd";
import { getYearComparisons } from "@/lib/cutoff-year-comparisons";
import { siteUrl } from "@/lib/site";
import styles from "../cutoffs.module.css";

const title = "JoSAA 2025 vs 2026 Cutoffs by Branch";
const path = "/cutoffs/2025-vs-2026";
export const metadata = { title, description: "See the rank and percentage change between matched 2025 and 2026 JoSAA cutoffs.", alternates: { canonical: siteUrl(path) } };

export default function Page() {
  const comparisons = [...getYearComparisons().values()];
  return <main className={styles.main}>
    <Breadcrumbs items={[["Home", "/"], ["JoSAA Cutoff Explorer", "/cutoffs"], ["2025 vs 2026", path]]} />
    <h1>{title}</h1>
    <p>Pick a branch to compare OPEN closing ranks for the same campus, quota, gender pool and counselling round. Each table shows the underlying ranks and both measures of change.</p>
    <ul className={styles.grid}>{comparisons.map(guide => <li key={guide.path}><Link href={guide.path}>{guide.branch} at {guide.group}<small>{guide.rows.length} matched campuses · Round {guide.round}</small></Link></li>)}</ul>
    <p><Link href="/cutoffs/2026">Browse all 2026 cutoff guides</Link></p>
  </main>;
}
