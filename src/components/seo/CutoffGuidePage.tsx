import { getYearComparisons } from "@/lib/cutoff-year-comparisons";
import { get2026RoundLabel } from "@/lib/josaa-2026";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { getCutoffGuides, hasHistoricalCollege, type CutoffGuide } from "@/lib/cutoff-guides";
import { siteUrl } from "@/lib/site";
import styles from "@/app/cutoffs/cutoffs.module.css";
import { AdmissionGuide } from "@/components/seo/AdmissionGuide";

type Props = { params: Promise<{ group: string; program: string }> };

async function loadGuide({ params }: Props, year?: 2026) {
  const { group, program } = await params;
  const guide = getCutoffGuides().get(`/cutoffs/${year ? "2026/" : ""}${group}/${program}`);
  if (!guide) notFound();
  return { guide, program };
}

function description(guide: CutoffGuide) {
  const latest = guide.rows[0];
  if (guide.kind === "rounds") return `See ${guide.group} ${guide.branch} JoSAA 2026 opening and closing ranks through round ${latest.round}.`;
  return guide.kind === "history"
    ? `Track ${guide.branch} JoSAA opening and closing ranks at ${guide.group} across ${guide.rows.length} years, through ${latest.year}.`
    : `Compare ${guide.branch} opening and closing ranks at ${guide.rows.length} ${guide.group} in JoSAA ${latest.year} round ${latest.round}.`;
}

export async function cutoffMetadata(props: Props, year?: 2026): Promise<Metadata> {
  const { guide } = await loadGuide(props, year);
  const title = guide.title;
  const summary = description(guide);
  const url = siteUrl(guide.path);
  return { title, description: summary, alternates: { canonical: url }, openGraph: { title, description: summary, url } };
}

const rank = new Intl.NumberFormat("en-IN");

export async function renderCutoffGuide(props: Props, year?: 2026) {
  const { guide, program } = await loadGuide(props, year);
  const all = getCutoffGuides();
  const latest = guide.rows[0];
  const oldest = guide.rows[guide.rows.length - 1];
  const history = guide.kind !== "comparison";
  const rounds = guide.kind === "rounds";
  const base = year ? "/cutoffs/2026" : "/cutoffs";
  const alternate = all.get(year ? guide.path.replace("/2026/", "/") : guide.path.replace("/cutoffs/", "/cutoffs/2026/"));
  const campusLinks = history ? [...all.values()].filter(item => item.year === year && item.kind !== "comparison" && item.rows[0].collegeId === latest.collegeId && item.path !== guide.path).slice(0, 4) : [];
  const change = getYearComparisons().get(`/cutoffs/2025-vs-2026/${guide.groupType?.toLowerCase()}/${program}`);
  const related = [...all.values()].filter(item => item.year === year && item.kind === "comparison" && item.path.endsWith("/" + program) && item.path !== guide.path);
  const pool = guide.quota === "OS" ? "Other State (OS)" : "All India (AI)";

  return (
    <main className={styles.main}>
      <Breadcrumbs items={[["Home", "/"], ["JoSAA Cutoff Explorer", "/cutoffs"], ...(year ? [["JoSAA 2026", base] as [string, string]] : []), [guide.title, guide.path]]} />
      <JsonLd data={{
        "@type": "WebPage",
        "@id": siteUrl(guide.path) + "#webpage",
        url: siteUrl(guide.path),
        name: guide.title,
        description: description(guide),
        isPartOf: { "@id": siteUrl() + "#website" },
      }} />
      <Link href={base}>← {year ? "JoSAA 2026 Cutoffs" : "JoSAA Cutoff Explorer"}</Link>
      <h1>{guide.title}</h1>
      {rounds ? (
        <p>In JoSAA 2026 Round {latest.round}, the closing rank was <strong>{rank.format(latest.closingRank)}</strong>, compared with {rank.format(oldest.closingRank)} in Round {oldest.round}. This dataset covers {get2026RoundLabel()}.</p>
      ) : history ? (
        <p>The closing rank was <strong>{rank.format(latest.closingRank)}</strong> in {latest.year} round {latest.round}. In {oldest.year} round {oldest.round}, it was {rank.format(oldest.closingRank)}. Each row uses the last round available for this campus and seat pool in that year.</p>
      ) : (
        <p>In {latest.year} round {latest.round}, closing ranks ranged from <strong>{rank.format(latest.closingRank)}</strong> at {latest.college} to <strong>{rank.format(oldest.closingRank)}</strong> at {oldest.college} across {guide.rows.length} listed campuses.</p>
      )}
      <p><strong>Seat pool:</strong> OPEN, gender-neutral, {pool}. {year ? ` The 2026 files cover ${get2026RoundLabel()}.` : " This table covers historical allotments through 2025."} For 2027, seat availability and candidate preferences can shift the cutoff.</p>
      <div className={styles.table} role="region" aria-label="JoSAA cutoff data" tabIndex={0}>
        <table>
          <caption>{rounds ? "Opening and closing ranks by round" : history ? "Opening and closing ranks by year" : "Campuses sorted by closing rank"}</caption>
          <thead>
            <tr>
              {!history && <th scope="col">Campus</th>}
              <th scope="col">Year</th>
              <th scope="col">Round</th>
              <th scope="col">Opening rank</th>
              <th scope="col">Closing rank</th>
            </tr>
          </thead>
          <tbody>
            {guide.rows.map(row => {
              const historyPath = `${base}/${row.collegeId}/${program}`;
              const campusPath = all.has(historyPath) ? historyPath : hasHistoricalCollege(row.collegeId) ? `/college/${row.collegeId}` : null;
              return (
                <tr key={`${row.collegeId}-${row.year}-${row.round}`}>
                  {!history && <th scope="row">{campusPath ? <Link href={campusPath}>{row.college}</Link> : row.college}</th>}
                  {history ? <th scope="row">{row.year}</th> : <td>{row.year}</td>}
                  <td>{row.round}</td>
                  <td>{rank.format(row.openingRank)}</td>
                  <td>{rank.format(row.closingRank)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AdmissionGuide name={guide.group} type={guide.groupType} branch={guide.branch} mode={guide.kind}
        links={[...(change ? [{ path: change.path, title: `${guide.branch} ranks in 2025 vs 2026` }] : []), ...(alternate ? [alternate] : []), ...campusLinks, ...related.slice(0, 4)]} />
      <h2>How to read these ranks</h2>
      <p>A lower numerical closing rank means the program filled at a more competitive rank in that round. Compare the same quota and seat pool. NIT Home State cutoffs and reserved-category ranks can differ from this table.</p>
      <div className={styles.links}>
        <Link href="/">Check options with your JEE rank</Link>
        {history && hasHistoricalCollege(latest.collegeId) && <Link href={`/college/${latest.collegeId}`}>All programs at {latest.college}</Link>}
        <Link href="/compare">Compare college fees and placements</Link>
        <a href="https://josaa.nic.in/">Official JoSAA data and rules</a>
      </div>
    </main>
  );
}
