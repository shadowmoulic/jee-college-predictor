"use client";

import styles from "@/app/page.module.css";
import { CollegeWithFilteredBranches, BranchWithProb } from "@/types/predictor";
import { College } from "@/app/data";

interface Props {
  college: CollegeWithFilteredBranches;
  domicileState: string;
  collapsed: boolean;
  onToggle: () => void;
  onBranchClick: (college: College, branch: BranchWithProb) => void;
}

export default function CollegeCard({ college, domicileState, collapsed, onToggle, onBranchClick }: Props) {
  const highCount = college.branches.filter((b) => b.prob === "high").length;
  const isHome = college.state === domicileState;

  return (
    <>
      <div className={styles.desktopViewOnly}>
        <div className={styles.collegeTableWrapper}>
          <table className={styles.collegeTable}>
            <thead>
              <tr>
                <th style={{ width: "260px" }}>College</th>
                <th>Branch</th>
                <th style={{ width: "100px" }}>Avg Package</th>
                <th style={{ width: "90px" }}>Placement</th>
                <th style={{ width: "100px" }}>Probability</th>
                <th style={{ width: "90px" }}>Opening Rank</th>
                <th style={{ width: "90px" }}>Closing Rank</th>
                <th style={{ width: "110px" }}>Round Details</th>
              </tr>
            </thead>
            <tbody>
              {college.branches.map((b, idx) => (
                <tr key={`${b.name}-${b.seatType}-${b.gender}-${idx}`}>
                  {idx === 0 && (
                    <td rowSpan={college.branches.length} className={styles.collegeCellSpan}>
                      <div className={styles.collegeSpanContent}>
                        <div className={styles.collegeNameHeader}>
                          <div className={styles.collegeLogoSmall}>
                            <img src="/college.png" alt="college logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          </div>
                          <div className={styles.collegeNameText}>{college.name}</div>
                        </div>
                        
                        <div className={styles.collegeDetailRow}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{college.state}{isHome ? " (Home State)" : ""}</span>
                        </div>
                        
                        <div className={styles.collegeDetailRow}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                          </svg>
                          <strong>{highCount} High Probability Branch{highCount === 1 ? "" : "es"}</strong>
                        </div>

                        <div className={styles.collegeDetailRow}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="6" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                          <strong>Course fee: {college.courseFee || "N/A"}</strong>
                        </div>

                        <div className={styles.collegeDetailRow}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                          </svg>
                          <strong>Highest Package: {college.highestPackage || "N/A"}</strong>
                        </div>

                        {/* Placeholder for Campus Image */}
                        <div 
                          className={styles.campusImagePlaceholder}
                          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=600&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }}
                        >
                           <div className={styles.playIconWrapper}>
                             <svg viewBox="0 0 24 24" fill="currentColor">
                               <path d="M8 5v14l11-7z" />
                             </svg>
                           </div>
                        </div>
                      </div>
                    </td>
                  )}
                  
                  <td className={styles.branchCellSpan} data-label="Branch">
                    <div className={styles.branchName}>{b.name}</div>
                    <div className={styles.branchDegree}>
                      {b.degree.replace(/^\d+\s+Years?,\s*/i, "")}
                    </div>
                  </td>
                  
                  <td className={styles.centerCell} data-label="Avg Package">{college.avgPackage || "-"}</td>
                  
                  <td className={styles.centerCell} data-label="Placement">
                    {college.placementRate || "N/A"}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: 14, height: 14, marginLeft: 4, verticalAlign: "middle", color: "var(--text-muted)"}}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </td>
                  
                  <td className={styles.centerCell} data-label="Probability">
                    <span className={`${styles.probPill} ${styles[b.prob]}`}>
                      {b.prob.toUpperCase()}
                    </span>
                  </td>
                  
                  <td className={styles.centerCell} data-label="Opening Rank">{b.opening.toLocaleString()}</td>
                  <td className={styles.centerCell} data-label="Closing Rank">{b.closing.toLocaleString()}</td>
                  <td className={styles.centerCell} data-label="Details">
                    <span className={styles.roundDetailsLink} onClick={() => onBranchClick(college as unknown as College, b)}>
                      Round-wise Details
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.mobileViewOnly}>
        <div className={styles.accordionCard}>
          <div className={styles.accordionHeader} onClick={onToggle}>
            <div className={styles.accordionTitleRow}>
              <div className={styles.collegeLogoSmall}>
                <img src="/college.png" alt="college logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.collegeNameText}>{college.name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
                  {college.state}{isHome ? " (Home State)" : ""}
                </div>
              </div>
              <div className={styles.groupChevron}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '12px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              <div style={{ background: "var(--high-bg)", color: "var(--high-text)", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>
                {highCount} High Prob Branches
              </div>
              {college.avgPackage && (
                <div style={{ background: "var(--surface-2)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>
                  Avg: <span style={{ color: "var(--text)" }}>{college.avgPackage}</span>
                </div>
              )}
            </div>
          </div>
          
          {!collapsed && (
            <div className={styles.accordionBody}>
              {college.branches.map((b, idx) => (
                <div className={styles.mobileBranchCard} key={idx} onClick={() => onBranchClick(college as unknown as College, b)}>
                  <div className={styles.mobileBranchTop} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                    <span className={`${styles.probPill} ${styles[b.prob]}`} style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "12px", letterSpacing: "0.5px" }}>
                      {b.prob.toUpperCase()}
                    </span>
                    <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 800, background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.85, marginRight: '3px' }}>OR</span> 
                        {b.opening}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 800, background: '#fee2e2', padding: '2px 8px', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.85, marginRight: '3px' }}>CR</span> 
                        {b.closing}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px', lineHeight: 1.3 }}>{b.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{b.degree.replace(/^\d+\s+Years?,\s*/i, "")}</div>
                  
                  <div style={{ marginTop: '16px', padding: "8px", borderRadius: "8px", background: "var(--brand-soft)", textAlign: 'center', fontSize: '0.85rem', color: 'var(--brand)', fontWeight: 700, transition: "background 0.2s" }}>
                    View Round-wise Details →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
