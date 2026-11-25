import Link from "next/link";
import { Breadcrumbs } from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/site";
import { tools } from "./tools";
import styles from "../cutoffs/cutoffs.module.css";

const title = "Compare JEE College Predictors";
export const metadata = { title, description: "Compare free JEE rank tools, cutoff transparency and counselling support.", alternates: { canonical: siteUrl("/predictor-comparisons") } };

export default function Page() {
  return <main className={styles.main}>
    <Breadcrumbs items={[["Home", "/"], [title, "/predictor-comparisons"]]} />
    <h1>{title}</h1>
    <p>Use these comparisons to choose a tool for the job you have in mind. A rank estimate gives you a starting list. A round-specific cutoff table helps you see which historical seat allocation supports a particular choice.</p>
    <ul className={styles.grid}>{Object.entries(tools).map(([id, tool]) => <li key={id}><Link href={`/predictor-comparisons/${id}`}>JEE College Predictor vs {tool.name}</Link></li>)}</ul>
    <p><Link href="/">Try our free JEE Main and Advanced predictor</Link></p>
  </main>;
}
