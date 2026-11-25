import type { Metadata } from "next";
import { CutoffsIndex } from "@/components/seo/CutoffsIndex";
import { siteUrl } from "@/lib/site";

const title = "JoSAA Cutoff Explorer by Branch and College";
const description = "Compare historical JoSAA opening and closing ranks by branch and track how cutoffs changed at individual campuses.";
const url = siteUrl("/cutoffs");

export const metadata: Metadata = { title, description, alternates: { canonical: url }, openGraph: { title, description, url } };

export default function Page() {
  return <CutoffsIndex />;
}
