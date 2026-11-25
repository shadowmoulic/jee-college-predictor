import Link from "next/link";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { collegeEntity, siteUrl } from "@/lib/site";
import { Metadata } from "next";
import { getJosaaData, getPopularCompareSlugs } from "@/lib/josaa-data";
import { getInstituteId } from "@/app/data";
import { getLatestCutoffs } from "@/lib/college-detail";
import { getPlacementForCollege } from "@/lib/placement-data";
import { notFound } from "next/navigation";
import CollegeCutoffTable from "@/components/college/CollegeCutoffTable";
import CompareFAQs from "@/components/compare/CompareFAQs";

export async function generateStaticParams() {
  const slugs = getPopularCompareSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return { title: "College Comparison" };

  const [id1, id2] = parts;
  const all = getJosaaData();
  
  const c1Record = all.find(r => getInstituteId(r.institute) === id1);
  const c2Record = all.find(r => getInstituteId(r.institute) === id2);

  if (!c1Record || !c2Record) return { title: "College Comparison" };

  const name1 = c1Record.instituteShort || c1Record.institute.replace("Indian Institute of Technology", "IIT");
  const name2 = c2Record.instituteShort || c2Record.institute.replace("Indian Institute of Technology", "IIT");

  return {
    title: `${name1} vs ${name2}: Cutoffs, Fees & Placements`,
    description: `Compare historical JoSAA opening and closing ranks and available placement and fee figures for ${name1} and ${name2}.`,
    openGraph: {
      url: siteUrl(`/compare/${slug}`),
      title: `${name1} vs ${name2}: Cutoffs, Fees & Placements`,
      description: `Side-by-side analysis of ${name1} and ${name2} for JEE aspirants.`,
    },
    alternates: {
      canonical: siteUrl(`/compare/${slug}`),
    }
  };
}

export default async function CompareSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parts = slug.split("-vs-");
  
  if (parts.length !== 2) {
    notFound();
  }

  const [id1, id2] = parts;
  const all = getJosaaData();

  const records1 = all.filter(r => getInstituteId(r.institute) === id1);
  const records2 = all.filter(r => getInstituteId(r.institute) === id2);

  if (records1.length === 0 || records2.length === 0) {
    notFound();
  }

  const c1Info = records1[0];
  const c2Info = records2[0];

  const placement1 = getPlacementForCollege(c1Info.institute);
  const placement2 = getPlacementForCollege(c2Info.institute);

  const { cutoffs: cutoffs1, dataYear: year1, dataRound: round1 } = getLatestCutoffs(records1);
  const { cutoffs: cutoffs2, dataYear: year2, dataRound: round2 } = getLatestCutoffs(records2);

  const c1Name = c1Info.institute;
  const c2Name = c2Info.institute;
  const c1Short = c1Info.instituteShort || c1Name.replace("Indian Institute of Technology", "IIT");
  const c2Short = c2Info.instituteShort || c2Name.replace("Indian Institute of Technology", "IIT");

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
      <Breadcrumbs items={[["Home", "/"], ["All Comparisons", "/compare"], [`${c1Short} vs ${c2Short}`, `/compare/${slug}`]]} />
      <JsonLd data={{
        "@type": "WebPage",
        url: siteUrl(`/compare/${slug}`),
        name: `${c1Short} vs ${c2Short}`,
        about: [collegeEntity(id1, c1Name, c1Short), collegeEntity(id2, c2Name, c2Short)],
      }} />

      <div style={{
        background: "linear-gradient(135deg, #0f2b7a 0%, #1a56db 50%, #2563eb 100%)",
        padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 5vw, 2.5rem)",
        color: "#fff",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
            <Link href="/compare" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}>
              ← All Comparisons
            </Link>
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 800, lineHeight: 1.2, margin: "0" }}>
            <span style={{ color: "#93c5fd" }}>{c1Short}</span> <span style={{ opacity: 0.6 }}>vs</span> <span style={{ color: "#fca5a5" }}>{c2Short}</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", margin: "1rem 0 0" }}>
            In-depth analysis of placements, JoSAA cutoffs, and fees.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
        
        {/* Head-to-head Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem",
          background: "#fff", padding: "2rem", borderRadius: "20px",
          boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
          marginBottom: "3rem", alignItems: "center"
        }}>
          {/* College 1 */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--brand)", background: "var(--brand-soft)", display: "inline-block", padding: "4px 10px", borderRadius: "10px", marginBottom: "0.5rem" }}>{c1Info.instituteType}</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--text)" }}>{c1Short}</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{c1Info.state}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Avg Package</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>{placement1?.avgPackage || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Highest Package</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>{placement1?.highestPackage || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Course Fee</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>₹{c1Info.courseFee}/yr</div>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div style={{ width: "1px", height: "100%", background: "var(--border)", position: "relative" }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              background: "var(--surface)", padding: "10px", borderRadius: "50%",
              fontWeight: 800, color: "var(--text-muted)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)"
            }}>VS</div>
          </div>

          {/* College 2 */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#f59e0b", background: "#fef3c7", display: "inline-block", padding: "4px 10px", borderRadius: "10px", marginBottom: "0.5rem" }}>{c2Info.instituteType}</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--text)" }}>{c2Short}</h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{c2Info.state}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Avg Package</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>{placement2?.avgPackage || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Highest Package</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>{placement2?.highestPackage || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Course Fee</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>₹{c2Info.courseFee}/yr</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Cutoffs */}
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text)" }}>{c1Short} JoSAA {year1} Cutoffs (Round {round1})</h2>
        <div style={{ marginBottom: "3rem" }}>
          <CollegeCutoffTable cutoffs={cutoffs1} typeColor="#2563eb" />
        </div>

        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text)" }}>{c2Short} JoSAA {year2} Cutoffs (Round {round2})</h2>
        <div style={{ marginBottom: "3rem" }}>
          <CollegeCutoffTable cutoffs={cutoffs2} typeColor="#ea580c" />
        </div>

        <CompareFAQs 
          c1Short={c1Short}
          c2Short={c2Short}
          c1Name={c1Name}
          c2Name={c2Name}
          fee1={c1Info.courseFee}
          fee2={c2Info.courseFee}
          avgPackage1={placement1?.avgPackage}
          avgPackage2={placement2?.avgPackage}
          highestPackage1={placement1?.highestPackage}
          highestPackage2={placement2?.highestPackage}
          placementRate1={placement1?.placementRate}
          placementRate2={placement2?.placementRate}
        />
      </main>
    </div>
  );
}
