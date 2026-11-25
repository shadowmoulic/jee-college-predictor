import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/JsonLd";
import { AdmissionGuide } from "@/components/seo/AdmissionGuide";
import { getCutoffGuides, hasHistoricalCollege } from "@/lib/cutoff-guides";
import { getYearComparisons } from "@/lib/cutoff-year-comparisons";
import { siteUrl } from "@/lib/site";
import styles from "../../../cutoffs.module.css";

type Props = { params: Promise<{ group: string; program: string }> };

export function generateStaticParams() { return []; }

async function load({ params }: Props) {
  const { group, program } = await params;
  const guide = getYearComparisons().get(`/cutoffs/2025-vs-2026/${group}/${program}`);
  if (!guide) notFound();
  const title = `JoSAA 2025 vs 2026 ${guide.branch} Cutoffs Across ${guide.group}`;
  return { guide, group, title };
}

export async function generateMetadata(props: Props) {
  const { guide, title } = await load(props);
  const description = `Compare Round ${guide.round} closing ranks at ${guide.rows.length} ${guide.group} and see the rank and percentage changes from 2025 to 2026.`;
  const url = siteUrl(guide.path);
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };
}

const rank = new Intl.NumberFormat("en-IN");
const delta = new Intl.NumberFormat("en-IN", { signDisplay: "exceptZero" });
const percent = new Intl.NumberFormat("en-IN", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });

export default async function Page(props: Props) {
  const { guide, group, title } = await load(props);
  const example = guide.rows[0];
  const change = example.rank2026 - example.rank2025;
  const increased = guide.rows.filter(row => row.rank2026 > row.rank2025).length;
  const decreased = guide.rows.filter(row => row.rank2026 < row.rank2025).length;
  const base = `/${group}/${guide.program}`;
  const links = [`/cutoffs/2026${base}`, `/cutoffs${base}`].flatMap(path => {
    const related = getCutoffGuides().get(path);
    return related ? [related] : [];
  });

  return (
    <main className={styles.main}>
      <Breadcrumbs items={[["Home", "/"], ["JoSAA Cutoff Explorer", "/cutoffs"], ["2025 vs 2026", "/cutoffs/2025-vs-2026"], [title, guide.path]]} />
      <Link href="/cutoffs/2025-vs-2026">← All year-over-year comparisons</Link>
      <h1>{title}</h1>
      <p>Across {guide.rows.length} matched campuses, the numerical closing rank increased at {increased}, decreased at {decreased}, and stayed the same at {guide.rows.length - increased - decreased}. The table pairs Round {guide.round} in both years for OPEN, gender-neutral, {guide.quota === "OS" ? "Other State" : "All India"} seats in the same four-year B.Tech branch.</p>
      <h2>How the change is calculated</h2>
      <p>Rank change = 2026 closing rank − 2025 closing rank. Percentage change = rank change ÷ 2025 closing rank × 100. At {example.college}, {rank.format(example.rank2026)} − {rank.format(example.rank2025)} = <strong>{delta.format(change)} ranks</strong>, or {percent.format(change / example.rank2025)}. A positive value means the closing rank moved to a larger number. It is a change in rank position, independent of percentile or admission odds.</p>
      <div className={styles.table} role="region" tabIndex={0} aria-label="Matched year-over-year closing ranks">
        <table>
          <caption>Round {guide.round} closing ranks by campus</caption>
          <thead><tr><th scope="col">Campus</th><th scope="col">2025</th><th scope="col">2026</th><th scope="col">Rank change</th><th scope="col">Change (%)</th></tr></thead>
          <tbody>{guide.rows.map(row => {
            const path = `/cutoffs/2026/${row.id}/${guide.program}`;
            const href = getCutoffGuides().has(path) ? path : hasHistoricalCollege(row.id) ? `/college/${row.id}` : undefined;
            const change = row.rank2026 - row.rank2025;
            return <tr key={row.id}>
              <th scope="row">{href ? <Link href={href}>{row.college}</Link> : row.college}</th>
              <td>{rank.format(row.rank2025)}</td><td>{rank.format(row.rank2026)}</td>
              <td>{delta.format(change)}</td><td>{percent.format(change / row.rank2025)}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <p>A missing campus may have changed its program name or seat pool, or lack a supplied row in one year. Only matched records appear here. <a href="https://josaa.nic.in/or-cr/">Check official JoSAA opening and closing ranks</a>.</p>
      <AdmissionGuide name={guide.group} type={group.toUpperCase()} branch={guide.branch} mode="comparison" links={links} />
    </main>
  );
}
