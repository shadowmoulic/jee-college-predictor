import Shortlist from "./Shortlist";
import styles from "../cutoffs/cutoffs.module.css";

export const metadata = { title: "Your private college shortlist", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ college?: string }> }) {
  const { college } = await searchParams;
  return <main className={styles.main}>
    <h1>Your private college shortlist</h1>
    <p>Save colleges to revisit on another device. Cutoffs, comparisons, and the rank predictor are free to browse without signing in.</p>
    <Shortlist college={typeof college === "string" ? college : undefined} />
  </main>;
}
