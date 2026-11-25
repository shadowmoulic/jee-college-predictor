import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Counsellor",
  description: "Ask follow-up questions about your JEE college shortlist after using the predictor.",
  alternates: { canonical: siteUrl("/ai") },
  robots: { index: false, follow: true },
};

export default function AILayout({ children }: { children: React.ReactNode }) {
  return children;
}
