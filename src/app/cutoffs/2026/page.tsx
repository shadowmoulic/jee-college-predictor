import type { Metadata } from "next";
import { CutoffsIndex } from "@/components/seo/CutoffsIndex";
import { siteUrl } from "@/lib/site";

const title = "JoSAA 2026 Cutoffs by Branch and College";
const description = "Compare JoSAA 2026 opening and closing ranks and follow campus cutoffs across the available counselling rounds.";
const url = siteUrl("/cutoffs/2026");

export const metadata: Metadata = { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };

export default function Page() {
  return <CutoffsIndex year={2026} />;
}
