import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CompareSelector from "@/components/compare/CompareSelector";
import { getJosaaData } from "@/lib/josaa-data";
import { getInstituteId, TOP_10_IITS } from "@/app/data";

export const metadata: Metadata = {
  title: "Compare IITs & NITs: Which College is Actually Better? (2026) | JEE College Predicter",
  description: "Compare JoSAA 2026 cutoffs, placement packages, and fees side-by-side. See which engineering college comes out on top for your rank.",
  keywords: ["JEE college predicter", "compare IITs", "IIT vs NIT", "compare engineering colleges", "JoSAA compare", "college versus"],
  openGraph: {
    title: "College Face-off: Compare Placements & Cutoffs",
    description: "Side-by-side comparison of IITs, NITs, and IIITs.",
  },
  alternates: {
    canonical: "/compare",
  },
};

export default function ComparePage() {
  const records = getJosaaData();
  const uniqueCollegesMap = new Map<string, string>();
  
  records.forEach(r => {
    uniqueCollegesMap.set(getInstituteId(r.institute), r.institute);
  });

  const colleges = Array.from(uniqueCollegesMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Generate some popular combos for SEO link juice
  const topIitNames = Array.from(TOP_10_IITS).slice(0, 5); // Top 5 IITs
  const topIits = topIitNames.map(name => ({ id: getInstituteId(name), name }));
  
  const popularComparisons = [];
  for (let i = 0; i < topIits.length; i++) {
    for (let j = i + 1; j < topIits.length; j++) {
      popularComparisons.push({
        c1: topIits[i],
        c2: topIits[j],
        slug: `${topIits[i].id}-vs-${topIits[j].id}`
      });
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
      <style>{`
        .compare-card-hover:hover {
          transform: translateY(-3px) !important;
          box-shadow: var(--shadow-md) !important;
        }
      `}</style>
      <Navbar />
      
      <div style={{
        background: "linear-gradient(135deg, #0f2b7a 0%, #1a56db 50%, #2563eb 100%)",
        padding: "clamp(3rem, 6vw, 5rem) clamp(1rem, 5vw, 2.5rem)",
        color: "#fff",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, margin: "0 0 1rem", lineHeight: 1.2 }}>
          College Face-Off
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 0" }}>
          Compare JoSAA colleges side-by-side. See cutoffs, placement rates, and fees to make the right choice for your future.
        </p>
      </div>

      <main style={{ maxWidth: 1200, margin: "-3rem auto 5rem", padding: "0 1.5rem", position: "relative", zIndex: 10 }}>
        <CompareSelector colleges={colleges} />

        <div style={{ marginTop: "4rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text)", textAlign: "center" }}>
            🔥 Popular Comparisons
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1rem",
          }}>
            {popularComparisons.map(comp => (
              <Link 
                key={comp.slug} 
                href={`/compare/${comp.slug}`}
                className="compare-card-hover"
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-sm)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
              >
                <div style={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", color: "var(--brand)", textAlign: "right" }}>
                  {comp.c1.name.replace("Indian Institute of Technology", "IIT")}
                </div>
                <div style={{ padding: "0 1rem", fontSize: "0.8rem", fontWeight: 800, color: "var(--text-muted)" }}>VS</div>
                <div style={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", textAlign: "left" }}>
                  {comp.c2.name.replace("Indian Institute of Technology", "IIT")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
