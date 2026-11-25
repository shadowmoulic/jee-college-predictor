import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nexus AI Counsellor",
  description: "Ask follow-up questions about your JEE college shortlist after using the predictor.",
  alternates: { canonical: "/ai" },
  robots: { index: false, follow: true },
};

export default function AILayout({ children }: { children: React.ReactNode }) {
  return children;
}
