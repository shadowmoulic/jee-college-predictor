import { getJosaaColleges } from "@/lib/josaa-colleges";
import Link from "next/link";
import { Breadcrumbs, JsonLd } from "@/components/seo/JsonLd";
import { collegeEntity, siteUrl } from "@/lib/site";
import type { Metadata } from "next";
import { getPlacementForCollege } from "@/lib/placement-data";
import { TOP_5_IITS, TOP_10_IITS } from "../data";

export const metadata: Metadata = {
  title: "JoSAA College Directory: Cutoffs, Fees & Placements",
  description:
    "Browse IITs, NITs, IIITs and GFTIs in our JoSAA data. Find historical opening and closing ranks and available fee and placement figures.",
  openGraph: {
    url: siteUrl("/colleges"),
    title: "JoSAA College Directory: Cutoffs & Placements",
    description:
      "Browse historical JoSAA cutoffs and available placement and fee figures.",
  },
  alternates: {
    canonical: siteUrl("/colleges"),
  },
};

interface CollegeEntry {
  id: string;
  name: string;
  shortName: string;
  state: string;
  instituteType: string;
  courseFee: string;
  annualFee?: string;
  avgPackage?: string;
  placementRate?: string;
  top5: boolean;
  top10: boolean;
  programCount: number;
}

async function getColleges(): Promise<CollegeEntry[]> {
  try {
    const instituteMap = getJosaaColleges();

    const colleges: CollegeEntry[] = [];

    for (const [id, instRecords] of instituteMap) {
      const r = instRecords[0];
      const institute = r.institute;
      const programs = [...new Set(instRecords.map((rec) => rec.program))];
      const placement = getPlacementForCollege(institute);

      colleges.push({
        id,
        name: r.institute,
        shortName: r.instituteShort,
        state: r.state,
        instituteType: r.instituteType,
        courseFee: placement?.annualFee ?? r.courseFee,
        annualFee: placement?.annualFee,
        avgPackage: placement?.avgPackage,
        placementRate: placement?.placementRate,
        top5: TOP_5_IITS.has(r.institute),
        top10: TOP_10_IITS.has(r.institute),
        programCount: programs.length,
      });
    }

    const typeOrder: Record<string, number> = { IIT: 0, NIT: 1, IIIT: 2, GFTI: 3 };
    colleges.sort((a, b) => {
      const t = (typeOrder[a.instituteType] ?? 4) - (typeOrder[b.instituteType] ?? 4);
      if (t !== 0) return t;
      return a.name.localeCompare(b.name);
    });

    return colleges;
  } catch (error) {
    console.error("Failed to load colleges:", error);
    return [];
  }
}

const TYPE_ACCENT: Record<string, { border: string; badge: string; text: string; label: string }> = {
  IIT:  { border: "var(--brand)",  badge: "var(--brand-soft)",  text: "var(--brand)",  label: "IIT" },
  NIT:  { border: "#0ea5e9",       badge: "#e0f2fe",            text: "#0369a1",        label: "NIT" },
  IIIT: { border: "#10b981",       badge: "#d1fae5",            text: "#065f46",        label: "IIIT" },
  GFTI: { border: "#f59e0b",       badge: "#fef3c7",            text: "#92400e",        label: "GFTI" },
  SPA:  { border: "#a855f7",       badge: "#f3e8ff",            text: "#6b21a8",        label: "SPA" },
};

export default async function CollegesPage() {
  const colleges = await getColleges();

  const groups: Record<string, CollegeEntry[]> = {};
  for (const c of colleges) {
    const type = c.instituteType;
    if (!groups[type]) groups[type] = [];
    groups[type].push(c);
  }

  const sectionOrder = ["IIT", "NIT", "IIIT", "GFTI", "SPA"];
  const sections = sectionOrder.filter((t) => groups[t]?.length);

  const sectionTitles: Record<string, string> = {
    IIT:  "Indian Institutes of Technology (IITs)",
    NIT:  "National Institutes of Technology (NITs)",
    IIIT: "Indian Institutes of Information Technology (IIITs)",
    GFTI: "Government Funded Technical Institutes (GFTIs)",
    SPA:  "Schools of Planning and Architecture (SPAs)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)" }}>
      <Breadcrumbs items={[["Home", "/"], ["All Colleges", "/colleges"]]} />
      <JsonLd data={{
        "@type": "CollectionPage",
        url: siteUrl("/colleges"),
        name: "JoSAA College Directory",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: sections.flatMap(type => groups[type]).map((college, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: collegeEntity(college.id, college.name, college.shortName, college.state),
          })),
        },
      }} />
      <style>{`
        .college-card-hover:hover {
          transform: translateY(-3px) !important;
          box-shadow: var(--shadow-md) !important;
          border-color: var(--hover-border) !important;
        }
      `}</style>
      {/* Page hero */}
      <div style={{
        background: "linear-gradient(135deg, #104332 0%, #176044 50%, #1a7350 100%)",
        padding: "clamp(2.5rem, 6vw, 4rem) clamp(1rem, 5vw, 2.5rem)",
        color: "#fff",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, margin: "0 0 0.75rem", lineHeight: 1.2 }}>
          JoSAA Participating Institutes
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1rem", margin: "0 0 2rem" }}>
          {colleges.length} institutes with official cutoff data, placement stats &amp; fees
        </p>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", maxWidth: 700, margin: "0 auto",
        }}>
          {sectionOrder.filter((t) => groups[t]?.length).map((type) => {
            const acc = TYPE_ACCENT[type];
            return (
              <div key={type} style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 12, padding: "0.75rem 1.5rem", minWidth: 90,
              }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{groups[type].length}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{acc.label}s</div>
              </div>
            );
          })}
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
        {sections.map((type) => {
          const acc = TYPE_ACCENT[type];
          return (
            <section key={type} style={{ marginBottom: "3rem" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                marginBottom: "1.25rem", paddingBottom: "0.75rem",
                borderBottom: `2px solid ${acc.border}22`,
              }}>
                <div style={{ width: 5, height: 24, background: acc.border, borderRadius: 3 }} />
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
                  {sectionTitles[type]}
                </h2>
                <span style={{
                  marginLeft: "auto", fontSize: "0.78rem", fontWeight: 700,
                  background: acc.badge, color: acc.text, padding: "3px 10px", borderRadius: 20,
                }}>
                  {groups[type].length} colleges
                </span>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
              }}>
                {groups[type].map((college) => (
                  <Link
                    key={college.id}
                    href={`/college/${college.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div 
                      className="college-card-hover"
                      style={{
                        background: "#fff", border: "1px solid var(--border)",
                        borderRadius: 16, padding: "1.25rem 1.5rem",
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.2s ease",
                        cursor: "pointer", height: "100%",
                        display: "flex", flexDirection: "column", gap: "0.75rem",
                        "--hover-border": `${acc.border}66`
                      } as React.CSSProperties}
                    >
                      {/* Top row: badge + name + tag */}
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                          background: acc.badge, border: `1px solid ${acc.border}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.65rem", fontWeight: 800, color: acc.text,
                        }}>
                          {acc.label}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.35,
                            color: "var(--text)", marginBottom: 2,
                          }} title={college.name}>
                            {college.shortName || college.name}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                            {college.state}
                          </div>
                        </div>
                        {(college.top5 || college.top10) && (
                          <span style={{
                            fontSize: "0.65rem", fontWeight: 800, whiteSpace: "nowrap",
                            padding: "3px 8px", background: "var(--brand-soft)",
                            color: "var(--brand)", borderRadius: 20, flexShrink: 0,
                          }}>
                            {college.top5 ? "Top 5" : "Top 10"}
                          </span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "0.72rem", color: "var(--text-secondary)",
                          background: "var(--surface-3)", padding: "3px 10px",
                          borderRadius: 20, fontWeight: 600,
                        }}>
                          {college.programCount} programs
                        </span>
                        <span style={{
                          fontSize: "0.72rem", color: "var(--text-secondary)",
                          background: "var(--surface-3)", padding: "3px 10px",
                          borderRadius: 20, fontWeight: 600,
                        }}>
                          ₹{college.courseFee}/yr
                        </span>
                        {college.avgPackage && (
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            background: "var(--high-bg)", color: "var(--high-text)",
                            padding: "3px 10px", borderRadius: 20,
                          }}>
                            Avg {college.avgPackage}
                          </span>
                        )}
                        {college.placementRate && (
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            background: "var(--brand-soft)", color: "var(--brand)",
                            padding: "3px 10px", borderRadius: 20,
                          }}>
                            {college.placementRate} placed
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
