"use client";

import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";
import { College } from "@/app/data";
import { BranchWithProb } from "@/types/predictor";

interface HistoryEntry {
  year: number;
  round: number;
  opening: number;
  closing: number;
}

interface HistoryData {
  history: HistoryEntry[];
  years: number[];
  rounds: number[];
}

interface Props {
  modalData: { college: College; branch: BranchWithProb } | null;
  rank: string;
  onClose: () => void;
}

export default function BranchModal({ modalData, rank, onClose }: Props) {
  const [historyState, setHistoryState] = useState<{ loading: boolean; data: HistoryData | null }>({
    loading: false,
    data: null,
  });

  useEffect(() => {
    if (!modalData) return;
    const { college, branch } = modalData;
    const params = new URLSearchParams({
      institute: college.name,
      program: branch.name,
      seatType: branch.seatType,
      gender: branch.gender,
      quota: branch.quota,
    });
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setHistoryState({ loading: true, data: null }); })
      .then(() => fetch(`/api/branch-history?${params.toString()}`))
      .then((r) => r.json() as Promise<HistoryData>)
      .then((data) => { if (!cancelled) setHistoryState({ loading: false, data }); })
      .catch(() => { if (!cancelled) setHistoryState({ loading: false, data: null }); });
    return () => { cancelled = true; };
  }, [modalData]);

  if (!modalData) return null;
  const { college, branch } = modalData;

  const { loading: historyLoading, data: historyData } = historyState;

  const getCell = (year: number, round: number): HistoryEntry | undefined =>
    historyData?.history.find((h: HistoryEntry) => h.year === year && h.round === round);

  const displayYears: number[] = historyData?.years ?? [];
  const displayRounds: number[] = historyData?.rounds ?? [];

  // Years where all rounds share the same closing rank — only show value in the last round
  const finalOnlyYears = new Set<number>(
    displayYears.filter((year) => {
      const yearCells = displayRounds.map((r) => getCell(year, r)).filter(Boolean) as HistoryEntry[];
      if (yearCells.length < 2) return false;
      const first = yearCells[0].closing;
      return yearCells.every((c) => c.closing === first);
    })
  );
  const lastRound = displayRounds.length > 0 ? Math.max(...displayRounds) : null;

  return (
    <div
      className={`${styles.modalOverlay} ${styles.openModal}`}
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHandle}></div>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <div className={styles.modalChancesTitle}>JEE Advance Admission Chances</div>
              <div className={styles.modalProbPillLargeWrapper}>
                <span className={`${styles.probPillLarge} ${styles[branch.prob]}`}>
                  {branch.prob.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalRankRow}>
            <div className={styles.modalRankCol}>
              <div className={styles.modalRankLabel}>OPENING RANK</div>
              <div className={styles.modalRankValue}>{branch.opening.toLocaleString()}</div>
            </div>
            <div className={styles.modalRankDivider}></div>
            <div className={styles.modalRankCol}>
              <div className={styles.modalRankLabel}>CLOSING RANK</div>
              <div className={styles.modalRankValue}>{branch.closing.toLocaleString()}</div>
            </div>
          </div>

          <div className={styles.modalCourseInfo}>
            <div className={styles.modalBranchNameLarge}>{branch.name}</div>
            <div className={styles.modalCollegeNameMedium}>{college.name}</div>
            <div className={styles.modalDegreeTags}>
              <span>{branch.degree.replace(/^\d+\s+Years?,\s*/i, "")}</span>
              <span className={styles.dotSeparator}>•</span>
              <span>{branch.seatType}</span>
              <span className={styles.dotSeparator}>•</span>
              <span>{branch.gender}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.modalActions}>
            <button className={styles.placementBtn}>
              Check Placement Statistics
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Historical rounds table */}
          <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "14px", marginTop: "1rem", color: "var(--text)" }}>
            Round-wise Cutoffs
          </div>
          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
              <div className={styles.spinner} style={{ width: 32, height: 32, borderWidth: 3 }}></div>
              <div style={{ marginTop: 8, fontSize: "0.85rem" }}>Loading history...</div>
            </div>
          ) : !historyData || historyData.history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.88rem", background: "var(--surface-3)", borderRadius: 12 }}>
              No historical data available for this branch combination.
            </div>
          ) : (
            <div className={styles.roundsTableWrap}>
              <table className={styles.roundsTable}>
                <thead>
                  <tr>
                    <th>Round</th>
                    {displayYears.map((y) => (
                      <th key={y}>&apos;{String(y).slice(2)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRounds.map((round) => (
                    <tr key={round}>
                      <td>{round}</td>
                      {displayYears.map((year) => {
                        const cell = getCell(year, round);
                        const isFinalOnly = finalOnlyYears.has(year);
                        const showValue = cell && (!isFinalOnly || round === lastRound);
                        return (
                          <td key={year} style={isFinalOnly && round !== lastRound ? { color: "var(--text-muted, #aaa)" } : undefined}>
                            {showValue ? cell.closing.toLocaleString() : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
