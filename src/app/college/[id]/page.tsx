import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { getJosaaData } from "@/lib/josaa-data";
import { getInstituteId } from "@/app/data";
import { getPlacementForCollege } from "@/lib/placement-data";
import CollegeCutoffTable from "@/components/college/CollegeCutoffTable";

interface CutoffRecord {
  program: string;
  degree: string;
  quota: string;
  seatType: string;
  gender: string;
  openingRank: number;
  closingRank: number;
}

interface PlacementInfo {
  courseFee: string;
  annualFee: string;
  medianPackage: string;
  avgPackage: string;
  highestPackage: string;
  placementRate: string;
  totalOffers: number;
  dataYear: number;
}

interface CollegeDetail {
  id: string;
  name: string;
  shortName: string;
  state: string;
  instituteType: string;
  courseFee: string;
  cutoffs: CutoffRecord[];
  placement: PlacementInfo | null;
  dataYear: number;
  dataRound: number;
  totalPrograms: number;
}

async function getCollegeDetail(id: string): Promise<CollegeDetail | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://your-app.vercel.app"
        : "http://localhost:3001");
    const res = await fetch(`${baseUrl}/api/colleges/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getCollegeDetail(id);
  const name = data?.name ?? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Is ${name} Worth It? Placements, Cutoffs & Fees (2026)`,
    description: `Don't join ${name} without reading this. Discover branch-wise JoSAA 2026 cutoff ranks, hidden placement data, seat matrix, and total fees.`,
    keywords: [`${name} cutoff`, `${name} JoSAA`, `${name} placements`, "JoSAA 2026 cutoff", "JEE Main", "JEE Advanced"],
    openGraph: {
      title: `${name} 2026 Cutoffs & Placement Review`,
      description: `Complete breakdown of JoSAA 2026 admission data and package statistics for ${name}.`,
    },
    alternates: {
      canonical: `/college/${id}`,
    },
  };
}

const TYPE_COLOR: Record<string, string> = {
  IIT: "var(--brand)",
  NIT: "#0ea5e9",
  IIIT: "#10b981",
  GFTI: "#f59e0b",
  SPA: "#a855f7",
};

const SEAT_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "var(--high-bg)", text: "var(--high-text)" },
  "OBC-NCL": { bg: "#fef3e2", text: "#b25e02" },
  SC: { bg: "#fee5e6", text: "#b71f1f" },
  ST: { bg: "#fce7f3", text: "#9d174d" },
  EWS: { bg: "var(--brand-soft)", text: "var(--brand)" },
};

export default async function CollegeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCollegeDetail(id);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
        <Navbar />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--text)" }}>
            College not found
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            This college may not be in our database yet.
          </p>
          <Link
            href="/colleges"
            style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "underline" }}
          >
            ← Browse all colleges
          </Link>
        </main>
      </div>
    );
  }

  const { placement } = data;
  const typeColor = TYPE_COLOR[data.instituteType] ?? "var(--brand)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0f2b7a 0%, #1a56db 50%, #2563eb 100%)",
        padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 5vw, 2.5rem)",
        color: "#fff",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/colleges" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}>
              ← All Colleges
            </Link>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
            <span style={{
              fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px",
              background: "rgba(255,255,255,0.15)", borderRadius: 20, letterSpacing: "0.05em",
              color: "#fff",
            }}>
              {data.instituteType}
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, lineHeight: 1.2, margin: "0 0 0.5rem" }}>
            {data.name}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", margin: 0 }}>
            {data.state} · JoSAA {data.dataYear} Round {data.dataRound} · {data.totalPrograms} programs
          </p>

          {/* Placement stats */}
          {placement && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "1rem",
              marginTop: "2rem",
              maxWidth: 800,
            }}>
              {[
                { label: "Avg Package", value: placement.avgPackage },
                { label: "Median Package", value: placement.medianPackage },
                { label: "Highest Package", value: placement.highestPackage },
                { label: "Placement Rate", value: placement.placementRate },
                { label: "Total Offers", value: placement.totalOffers?.toLocaleString() },
                { label: "Annual Fee", value: `₹${placement.annualFee}` },
              ].filter(s => s.value).map(({ label, value }) => (
                <div key={label} style={{
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 14, padding: "0.875rem 1rem", backdropFilter: "blur(8px)",
                }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cutoffs table */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text)" }}>
          Opening &amp; Closing Ranks — {data.dataYear} Round {data.dataRound}
        </h2>

        <CollegeCutoffTable cutoffs={data.cutoffs} typeColor={typeColor} />

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
              color: "#fff", borderRadius: 12, padding: "12px 28px",
              fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
              boxShadow: "0 4px 12px rgba(26,86,219,0.25)",
            }}
          >
            Predict My College →
          </Link>
        </div>
      </main>
    </div>
  );
}
