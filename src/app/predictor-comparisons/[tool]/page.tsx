import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { SITE_CREATOR, siteUrl } from "@/lib/site";
import { tools, type ToolId } from "../tools";
import styles from "../../cutoffs/cutoffs.module.css";

type Props = { params: Promise<{ tool: string }> };

export function generateStaticParams() { return Object.keys(tools).map(tool => ({ tool })); }

async function getComparison({ params }: Props) {
  const { tool } = await params;
  if (!Object.hasOwn(tools, tool)) notFound();
  const item = tools[tool as ToolId];
  const title = `JEE College Predictor vs ${item.name}`;
  const path = `/predictor-comparisons/${tool}`;
  const description = `Compare ${item.name} and JEE College Predictor 2027 on exam coverage, free access, and how to check the JoSAA ranks behind your shortlist.`;
  return { item, title, path, description, tool };
}

export async function generateMetadata(props: Props) {
  const { title, path, description } = await getComparison(props);
  return { title, description, alternates: { canonical: siteUrl(path) }, openGraph: { title, description, url: siteUrl(path) } };
}

export default async function Page(props: Props) {
  const { item, title, path, description, tool } = await getComparison(props);
  return <main className={styles.main}>
    <Breadcrumbs items={[["Home", "/"], ["Compare JEE Predictors", "/predictor-comparisons"], [title, path]]} />
    <JsonLd data={{ "@type": "WebPage", url: siteUrl(path), name: title, description, citation: item.href }} />
    <h1>{title}</h1>
    <p>If your goal is to build a JEE shortlist, start by deciding whether you want a broad list of possibilities or a way to check a specific college and branch against official cutoffs. You can use both tools on the same rank and use the JoSAA data to investigate any differences before you fill your choices.</p>
    <h2>Exam coverage and access</h2>
    <p>{item.scope} {item.cost} <a href={item.href}>Read {item.name}’s own predictor page</a>.</p>
    <p>JEE College Predictor 2027 covers JEE Main and JEE Advanced and is free to use without signing in. Its <Link href="/cutoffs/2026">JoSAA 2026 explorer</Link> shows the available rounds and seat pools used on each page. The <Link href="/cutoffs/2025-vs-2026">2025 vs 2026 tables</Link> show the original closing ranks and explain the arithmetic behind changes.</p>
    <h2>How to compare results on your rank</h2>
    <p>{item.use} Copy the college and exact degree title before trying to reconcile results. An engineering branch can have more than one degree duration, and a campus may list similar program names for different seat allocations. Once those match, compare the same exam, quota, category, gender pool and round.</p>
    <p>If one tool suggests a campus that the other leaves out, open the relevant cutoff table and check whether the input is an OPEN common rank or a reserved-category rank. For NITs, look up the applicable Home State or Other State quota. A different row can explain a large gap without either result being directly comparable.</p>
    <h2>Which next step is useful?</h2>
    <p>Use the free <Link href="/">rank predictor</Link> to get a first pass, then open the <Link href="/colleges">college directory</Link> and shortlist the branches you would actually accept. Use the <Link href="/compare">college comparison tool</Link> when two options are close and you want to check fees and placements alongside the cutoffs.</p>
    <p>Sayak Moulic, an IIT Kharagpur student, publishes JEE guidance and campus content on <a href={SITE_CREATOR.profile}>his YouTube channel</a>. If you want to talk through your own choice order, see <Link href="/mentorship">one-on-one counselling with Sayak</Link>. Check official JoSAA rules and seat data before you submit anything.</p>
    <p>{Object.entries(tools).filter(([id]) => id !== tool).map(([id, alternative]) => <Link key={id} href={`/predictor-comparisons/${id}`}>Also compare with {alternative.name}</Link>)}</p>
  </main>;
}
