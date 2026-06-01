"use client";

import styles from "@/app/page.module.css";
import { FilterState } from "@/types/predictor";

interface Props {
  filters: FilterState;
  onProbFilter: (prob: "high" | "medium" | "low" | null) => void;
  onDurationFilter: (duration: string) => void;
  onDegreeFilter: (degree: string) => void;
  onBranchSearch: (q: string) => void;
  onStateSearch: (q: string) => void;
  onClearAll: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function FiltersPanel({
  filters,
  onProbFilter,
  onDurationFilter,
  onDegreeFilter,
  onBranchSearch,
  onStateSearch,
  onClearAll,
  isMobile,
  onClose,
}: Props) {
  const { activeProbFilter, durationFilters, degreeFilters, branchSearch, stateSearch } = filters;

  return (
    <>
      <div className={styles.filtersHeader}>
        <div className={styles.filtersHeaderLeft}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={isMobile ? 18 : undefined} height={isMobile ? 18 : undefined}>
            <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Filters
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button className={styles.clearAllBtn} onClick={onClearAll}>CLEAR ALL</button>
          {isMobile && onClose && (
            <button className={styles.filterModalClose} onClick={onClose}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Probability */}
      <div className={styles.filterSection}>
        <div className={styles.filterSectionTitle}>Probability</div>
        <div className={styles.filterChips}>
          {(["high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              id={`filter-prob-${p}`}
              className={`${styles.filterChipPill} ${styles[`prob${p.charAt(0).toUpperCase() + p.slice(1)}`] || styles[`prob${p}`]} ${activeProbFilter === p ? styles[`selected${p.charAt(0).toUpperCase() + p.slice(1)}`] || styles.selectedHigh : ""}`}
              onClick={() => onProbFilter(activeProbFilter === p ? null : p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Course Duration */}
      <div className={styles.filterSection}>
        <div className={styles.filterSectionTitle}>Course Duration</div>
        <div className={styles.filterChips}>
          {["4 years", "5 years"].map((d) => (
            <button
              key={d}
              id={`filter-duration-${d.replace(" ", "-")}`}
              className={`${styles.filterChipPill} ${durationFilters.includes(d) ? styles.selectedChip : ""}`}
              onClick={() => onDurationFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Degree */}
      <div className={styles.filterSection}>
        <div className={styles.filterSectionTitle}>Degree</div>
        <div className={styles.filterChips}>
          {["B.Tech + M.Tech", "B.Sc.", "B.E."].map((d) => (
            <button
              key={d}
              id={`filter-degree-${d.replace(/\s+/g, "-").replace(/\./g, "")}`}
              className={`${styles.filterChipPill} ${degreeFilters.includes(d) ? styles.selectedChip : ""}`}
              onClick={() => onDegreeFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Branch Search */}
      <div className={styles.filterSection}>
        <div className={styles.filterSectionTitle}>Branch Types</div>
        <div className={styles.filterSearchWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="filter-branch-search"
            className={styles.filterSearch}
            placeholder="Search branch types"
            value={branchSearch}
            onChange={(e) => onBranchSearch(e.target.value)}
          />
        </div>
      </div>

      {/* State Search */}
      <div className={styles.filterSection}>
        <div className={styles.filterSectionTitle}>College State</div>
        <div className={styles.filterSearchWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="filter-state-search"
            className={styles.filterSearch}
            placeholder="Search state"
            value={stateSearch}
            onChange={(e) => onStateSearch(e.target.value)}
          />
        </div>
      </div>

      {isMobile && (
        <button className={styles.submitBtn} style={{ marginTop: "1rem" }} onClick={onClose}>
          Apply Filters
        </button>
      )}
    </>
  );
}
