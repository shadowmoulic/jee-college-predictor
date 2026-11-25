import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { getCutoffGuides, type CutoffGuide } from "@/lib/cutoff-guides";
import { siteUrl } from "@/lib/site";
import styles from "../../cutoffs.module.css";

type Props = { params: Promise<{ group: string; program: string }> };

export function generateStaticParams() {
  return [];
}

async function loadGuide({ params }: Props) {
  const { group, program } = await params;
  const guide = getCutoffGuides().get(`/cutoffs/${group}/${program}`);
  if (!guide) notFound();
  return { guide, program };
}

function description(guide: CutoffGuide) {
  const latest = guide.rows[0];
  return guide.kind === "history"
    ? `Track ${guide.branch} JoSAA opening and closing ranks at ${guide.group} across ${guide.rows.length} years, through ${latest.year}.`
    : `Compare ${guide.branch} opening and closing ranks at ${guide.rows.length} ${guide.group} in JoSAA ${latest.year} round ${latest.round}.`;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { guide } = await loadGuide(props);
  const title = guide.title;
  const summary = description(guide);
  const url = siteUrl(guide.path);
  return { title, description: summary, alternates: { canonical: url }, openGraph: { title, description: summary, url } };
}

const rank = new Intl.NumberFormat("en-IN");

export default async function CutoffGuidePage(props: Props) {
  const { guide, program } = await loadGuide(props);
  const all = getCutoffGuides();
  const latest = guide.rows[0];
  const oldest = guide.rows[guide.rows.length - 1];
  const history = guide.kind === "history";
  const related = [...all.values()].filter(item => item.kind === "comparison" && item.path.endsWith("/" + program) && item.path !== guide.path);
  const pool = guide.quota === "OS" ? "Other State (OS)" : "All India (AI)";

  return (
    <main className={styles.main}>
      <Breadcrumbs items={[["Home", "/"], ["JoSAA Cutoff Explorer", "/cutoffs"], [guide.title, guide.path]]} />
      <JsonLd data={{
        "@type": "WebPage",
        "@id": siteUrl(guide.path) + "#webpage",
        url: siteUrl(guide.path),
        name: guide.title,
        description: description(guide),
        isPartOf: { "@id": siteUrl() + "#website" },
      }} />
      <Link href="/cutoffs">← JoSAA Cutoff Explorer</Link>
      <h1>{guide.title}</h1>
      {history ? (
        <p>The closing rank was <strong>{rank.format(latest.closingRank)}</strong> in {latest.year} round {latest.round}. In {oldest.year} round {oldest.round}, it was {rank.format(oldest.closingRank)}. Each row uses the last round available for this campus and seat pool in that year.</p>
      ) : (
        <p>In {latest.year} round {latest.round}, closing ranks ranged from <strong>{rank.format(latest.closingRank)}</strong> at {latest.college} to <strong>{rank.format(oldest.closingRank)}</strong> at {oldest.college} across {guide.rows.length} listed campuses.</p>
      )}
      <p><strong>Seat pool:</strong> OPEN, gender-neutral, {pool}. The ranks are historical JoSAA allotments. For 2027, seat availability and candidate preferences can shift the cutoff.</p>
      <div className={styles.table} role="region" aria-label="JoSAA cutoff data" tabIndex={0}>
        <table>
          <caption>{history ? "Opening and closing ranks by year" : "Campuses sorted by closing rank"}</caption>
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
              const historyPath = `/cutoffs/${row.collegeId}/${program}`;
              return (
                <tr key={`${row.collegeId}-${row.year}`}>
                  {!history && <th scope="row"><Link href={all.has(historyPath) ? historyPath : `/college/${row.collegeId}`}>{row.college}</Link></th>}
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
      <h2>How to read these ranks</h2>
      <p>A lower numerical closing rank means the program filled at a more competitive rank in that round. Compare the same quota and seat pool. NIT Home State cutoffs and reserved-category ranks can differ from this table.</p>
      <div className={styles.links}>
        <Link href="/">Check options with your JEE rank</Link>
        {history && <Link href={`/college/${latest.collegeId}`}>All programs at {latest.college}</Link>}
        <a href="https://josaa.nic.in/">Official JoSAA data and rules</a>
      </div>
      {related.length > 0 && (
        <section>
          <h2>Compare this branch across campuses</h2>
          <ul className={styles.grid}>{related.map(item => <li key={item.path}><Link href={item.path}>{item.title}</Link></li>)}</ul>
        </section>
      )}
    </main>
  );
}
