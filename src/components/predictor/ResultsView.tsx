"use client";

import styles from "@/app/page.module.css";
import { CollegeWithFilteredBranches, BranchWithProb, FilterState } from "@/types/predictor";
import { College } from "@/app/data";
import FiltersPanel from "@/components/results/FiltersPanel";
import CollegeCard from "@/components/results/CollegeCard";
import BranchModal from "@/components/results/BranchModal";
import AICounselorPanel, { CollegeContext } from "@/components/ai/AICounselorPanel";
import { useState, useEffect, useCallback } from "react";

interface Props {
  exam: string;
  rank: string;
  category: string;
  domicileState: string;
  gender: string;
  colleges: CollegeWithFilteredBranches[];
  totalBranchesCount: number;
  totalCollegesCount: number;
  loading: boolean;
  errorMsg: string;
  filters: FilterState;
  collapsedColleges: Record<string, boolean>;
  onProbFilter: (prob: "high" | "medium" | "low" | null) => void;
  onDurationFilter: (d: string) => void;
  onDegreeFilter: (d: string) => void;
  onBranchSearch: (q: string) => void;
  onStateSearch: (q: string) => void;
  onSearchQuery: (q: string) => void;
  onQuickFilter: (q: string) => void;
  onClearAll: () => void;
  onToggleCollapse: (id: string) => void;
  onEditDetails: () => void;
}

export default function ResultsView({
  exam,
  rank,
  category,
  domicileState,
  gender,
  colleges,
  totalBranchesCount,
  totalCollegesCount,
  loading,
  errorMsg,
  filters,
  collapsedColleges,
  onProbFilter,
  onDurationFilter,
  onDegreeFilter,
  onBranchSearch,
  onStateSearch,
  onSearchQuery,
  onQuickFilter,
  onClearAll,
  onToggleCollapse,
  onEditDetails,
}: Props) {
  const [modalData, setModalData] = useState<{ college: College; branch: BranchWithProb } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // AI panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [contextCollege, setContextCollege] = useState<CollegeContext | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobileScreen(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // When a college is expanded, make it the AI context
  const handleToggleCollapse = useCallback(
    (id: string) => {
      const isCurrentlyCollapsed = collapsedColleges[id] ?? false;
      onToggleCollapse(id);
      if (isCurrentlyCollapsed) {
        // It will expand — set as AI context
        const college = colleges.find((c) => c.id === id);
        if (college) {
          setContextCollege({
            id: college.id,
            name: college.name,
            shortName: college.logo, // college.logo holds short name in some datasets; use name fallback
            instituteType: college.instituteType,
            avgPackage: college.avgPackage,
            placementRate: college.placementRate,
          });
        }
      }
    },
    [collapsedColleges, colleges, onToggleCollapse]
  );

  // When branch is clicked, set that college as AI context
  const handleBranchClick = useCallback(
    (col: College, branch: BranchWithProb) => {
      setModalData({ college: col, branch });
      const enriched = colleges.find((c) => c.id === col.id);
      if (enriched) {
        setContextCollege({
          id: enriched.id,
          name: enriched.name,
          instituteType: enriched.instituteType,
          avgPackage: enriched.avgPackage,
          placementRate: enriched.placementRate,
        });
      }
    },
    [colleges]
  );

  const filterProps = {
    filters,
    onProbFilter,
    onDurationFilter,
    onDegreeFilter,
    onBranchSearch,
    onStateSearch,
    onClearAll,
  };

  const bodyClass = [
    styles.resultsBody,
    aiPanelOpen && !isMobileScreen ? styles.resultsBodyWithAI : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.resultsPage}>
      {/* ── Results Hero Bar ── */}
      <div className={styles.resultsHero}>
        <div className={styles.resultsHeroLogo}>
          <div className={styles.logoMark}>N</div>
          <span className={styles.resultsHeroLogoText}>Nexus Predictor</span>
        </div>
        <h1 className={styles.resultsTitle}>JoSAA 2026 College Predictor</h1>

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          {[
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              ),
              iconStyle: styles.rankIcon,
              label: `${exam} Rank`,
              value: parseInt(rank).toLocaleString(),
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              iconStyle: styles.catIcon,
              label: "Category",
              value: category,
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
              iconStyle: styles.stateIcon,
              label: "Domicile State",
              value: domicileState,
            },
            {
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 10-16 0" />
                </svg>
              ),
              iconStyle: styles.genderIcon,
              label: "Gender",
              value: gender,
            },
          ].map((card) => (
            <div className={styles.summaryCard} key={card.label}>
              <div className={`${styles.summaryIcon} ${card.iconStyle}`}>{card.icon}</div>
              <div className={styles.summaryCardContent}>
                <div className={styles.summaryCardLabel}>{card.label}</div>
                <div className={styles.summaryCardValue}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className={styles.heroBtnRow}>
          <button className={styles.editDetailsBtn} onClick={onEditDetails}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Details
          </button>

          <button
            className={`${styles.editDetailsBtn} ${aiPanelOpen ? styles.askAIActive : styles.askAIBtn}`}
            onClick={() => setAiPanelOpen((v) => !v)}
            aria-pressed={aiPanelOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {aiPanelOpen ? "Close AI" : "Ask AI Counsellor"}
          </button>
        </div>
      </div>

      {/* ── Results Body (3-col when AI open on desktop) ── */}
      <div className={bodyClass}>
        {/* Desktop filter sidebar */}
        <aside className={styles.filtersSidebar}>
          <FiltersPanel {...filterProps} />
        </aside>

        {/* Main content */}
        <main className={styles.resultsMain}>
          {/* Search + mobile filters toggle */}
          <div className={styles.resultsSearchWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="results-search"
              className={styles.resultsSearch}
              placeholder="Search by college or branch"
              value={filters.searchQuery}
              onChange={(e) => onSearchQuery(e.target.value)}
            />
            <button
              className={styles.mobileFilterBtn}
              onClick={() => setMobileFiltersOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
              </svg>
              Filters
            </button>
          </div>

          {/* Quick Filters */}
          <div className={styles.quickFiltersTitle}>Quick Filters</div>
          <div className={styles.quickFilters}>
            {[
              { id: "all", label: "All Results" },
              { id: "top5", label: "Top 5 IITs" },
              { id: "top10", label: "Top 10 IITs" },
              { id: "cs", label: "CS & IT Branches" },
              { id: "core", label: "Core Branches" },
              { id: "domicile", label: "Near My Domicile State" },
            ].map(({ id, label }) => (
              <button
                key={id}
                id={`quick-filter-${id}`}
                className={`${styles.quickChip} ${filters.quickFilter === id ? styles.activeQuick : ""}`}
                onClick={() => onQuickFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Notes Banner */}
          <div className={styles.notesBlock}>
            <div className={styles.notesTitle}>Important Notes:</div>
            <ul className={styles.notesList}>
              <li>
                Closing Ranks are based on <strong>JoSAA 2024 — Round 6</strong>{" "}
                (Opening Ranks from Round 1)
              </li>
              <li>
                OPEN seat ranks represent CRL. EWS, OBC-NCL, SC, ST represent respective
                category ranks.
              </li>
              <li>
                Based on your rank, you are eligible for{" "}
                <strong className={styles.highlightText}>{totalBranchesCount}</strong> branches
                across{" "}
                <strong className={styles.highlightText}>{totalCollegesCount}</strong> colleges.
              </li>
              <li>
                Package details are sourced from publicly available data and may contain
                inaccuracies.
              </li>
            </ul>
          </div>

          {/* BITSAT Promo */}
          <div className={styles.bitsatBanner}>
            <div className={styles.bitsatBannerText}>
              Join our Whatsapp group for free JEE mentorship !!!! Limited seats
            </div>
            <button className={styles.bitsatBannerBtn}>Join Now</button>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className={styles.noResults} style={{ borderColor: "var(--danger)" }}>
              <strong style={{ color: "var(--danger)" }}>Error Loading Predictions</strong>
              {errorMsg}
            </div>
          )}

          {/* Loading / Results */}
          {loading ? (
            <div className={styles.noResults}>
              <div className={styles.spinner}></div>
              <strong style={{ color: "var(--brand)", marginTop: "1rem" }}>
                Analyzing JoSAA 2024 Admission Datasets...
              </strong>
              <span>Applying rank algorithms and localized filters</span>
            </div>
          ) : (
            <div className={styles.collegeTableWrap}>
              {/* Table headers are now rendered per-college in CollegeCard */}

              {colleges.length === 0 ? (
                <div className={styles.noResults}>
                  <strong>No results found</strong>
                  Try adjusting your filters or search terms.
                </div>
              ) : (
                colleges.map((college) => (
                  <CollegeCard
                    key={college.id}
                    college={college}
                    domicileState={domicileState}
                    collapsed={collapsedColleges[college.id] ?? false}
                    onToggle={() => handleToggleCollapse(college.id)}
                    onBranchClick={handleBranchClick}
                  />
                ))
              )}
            </div>
          )}
        </main>

        {/* Desktop AI panel (sticky column) */}
        {aiPanelOpen && !isMobileScreen && (
          <div className={`${styles.aiPanelColumn} pt-2 pb-6 pr-6 pl-2`}>
            <AICounselorPanel
              rank={rank}
              category={category}
              exam={exam}
              domicileState={domicileState}
              gender={gender}
              contextCollege={contextCollege}
              onClose={() => setAiPanelOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Mobile AI bottom-sheet */}
      {aiPanelOpen && isMobileScreen && (
        <div
          className={styles.aiMobileBackdrop}
          onClick={() => setAiPanelOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%" }}>
            <AICounselorPanel
              rank={rank}
              category={category}
              exam={exam}
              domicileState={domicileState}
              gender={gender}
              contextCollege={contextCollege}
              onClose={() => setAiPanelOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}

      {/* Branch Details Modal */}
      <BranchModal
        modalData={modalData}
        rank={rank}
        onClose={() => setModalData(null)}
      />

      {/* Mobile Filter bottom-sheet */}
      {mobileFiltersOpen && (
        <div
          className={`${styles.filterModal} ${styles.openFilter}`}
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div className={styles.filterModalPanel} onClick={(e) => e.stopPropagation()}>
            <FiltersPanel
              {...filterProps}
              isMobile
              onClose={() => setMobileFiltersOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
