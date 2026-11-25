"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import styles from "@/app/page.module.css";
import HeroSection from "@/components/predictor/HeroSection";
import PredictorForm from "@/components/predictor/PredictorForm";
import ResultsView from "@/components/predictor/ResultsView";
import FAQSection from "@/components/predictor/FAQSection";
import { CollegeWithFilteredBranches, PredictorFormValues, FilterState } from "@/types/predictor";

export default function PredictorPage() {
  const [formValues, setFormValues] = useState<PredictorFormValues>({
    name: "",
    email: "",
    exam: "JEE Advanced",
    rank: "",
    category: "General (CRL)",
    domicileState: "West Bengal",
    gender: "Male",
  });

  // ─── Navigation / UI State ────────────────────────────────────────────────
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [collapsedColleges, setCollapsedColleges] = useState<Record<string, boolean>>({});
  const [showSearchAlert, setShowSearchAlert] = useState(false);

  // ─── Results from API ─────────────────────────────────────────────────────
  const [colleges, setColleges] = useState<CollegeWithFilteredBranches[]>([]);
  const [totalBranchesCount, setTotalBranchesCount] = useState(0);
  const [totalCollegesCount, setTotalCollegesCount] = useState(0);

  // ─── Filter State ─────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    activeProbFilter: null,
    durationFilters: [],
    degreeFilters: [],
    branchSearch: "",
    stateSearch: "",
    quickFilter: "all",
  });

  // ─── Fetch predictions from API ───────────────────────────────────────────
  const fetchPredictions = useCallback(async () => {
    if (!formValues.rank) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const params = new URLSearchParams({
        exam: formValues.exam,
        rank: formValues.rank,
        category: formValues.category,
        domicileState: formValues.domicileState,
        gender: formValues.gender,
        searchQuery: filters.searchQuery,
        branchSearch: filters.branchSearch,
        stateSearch: filters.stateSearch,
        quickFilter: filters.quickFilter,
      });

      if (filters.activeProbFilter) params.append("activeProbFilter", filters.activeProbFilter);
      if (filters.durationFilters.length > 0) params.append("durationFilters", filters.durationFilters.join(","));
      if (filters.degreeFilters.length > 0) params.append("degreeFilters", filters.degreeFilters.join(","));

      const res = await fetch(`/api/predict?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch predictions");
      }

      const data = await res.json();
      setColleges(data.colleges || []);
      setTotalBranchesCount(data.totalBranchesCount || 0);
      setTotalCollegesCount(data.totalCollegesCount || 0);

      const initialCollapse: Record<string, boolean> = {};
      (data.colleges || []).forEach((c: CollegeWithFilteredBranches) => {
        initialCollapse[c.id] = false;
      });
      setCollapsedColleges(initialCollapse);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while fetching predictions.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [formValues, filters]);

  // Re-fetch on filter changes (debounced)
  useEffect(() => {
    if (!isSubmitted) return;
    const timer = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timer);
  }, [isSubmitted, filters, fetchPredictions]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleFormChange = (key: keyof PredictorFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formValues.rank || !formValues.category || !formValues.domicileState) {
      alert("Please fill in your rank, category, and domicile state.");
      return;
    }
    setIsSubmitted(true);
    fetchPredictions();
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Show the AI & WhatsApp alert
    setShowSearchAlert(true);
  };

  const handleEditDetails = () => {
    setIsSubmitted(false);
    setColleges([]);
    setTotalBranchesCount(0);
    setTotalCollegesCount(0);
    setErrorMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDurationFilter = (d: string) => {
    setFilters((prev) => ({
      ...prev,
      durationFilters: prev.durationFilters.includes(d)
        ? prev.durationFilters.filter((x) => x !== d)
        : [...prev.durationFilters, d],
    }));
  };

  const toggleDegreeFilter = (d: string) => {
    setFilters((prev) => ({
      ...prev,
      degreeFilters: prev.degreeFilters.includes(d)
        ? prev.degreeFilters.filter((x) => x !== d)
        : [...prev.degreeFilters, d],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: "",
      activeProbFilter: null,
      durationFilters: [],
      degreeFilters: [],
      branchSearch: "",
      stateSearch: "",
      quickFilter: "all",
    });
  };

  const toggleCollegeCollapse = (id: string) => {
    setCollapsedColleges((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className={styles.container}>
      {!isSubmitted ? (
        /* ─── FORM VIEW ─── */
        <>
          <div className={styles.heroSection}>
            <div className={styles.heroInner}>
              <HeroSection />
              <PredictorForm
                values={formValues}
                onChange={handleFormChange}
                onSubmit={handleFormSubmit}
              />
            </div>
          </div>
          <FAQSection />
        </>
      ) : (
        /* ─── RESULTS VIEW ─── */
        <ResultsView
          exam={formValues.exam}
          rank={formValues.rank}
          category={formValues.category}
          domicileState={formValues.domicileState}
          gender={formValues.gender}
          colleges={colleges}
          totalBranchesCount={totalBranchesCount}
          totalCollegesCount={totalCollegesCount}
          loading={loading}
          errorMsg={errorMsg}
          filters={filters}
          collapsedColleges={collapsedColleges}
          onProbFilter={(p) => updateFilter("activeProbFilter", p)}
          onDurationFilter={toggleDurationFilter}
          onDegreeFilter={toggleDegreeFilter}
          onBranchSearch={(q) => updateFilter("branchSearch", q)}
          onStateSearch={(q) => updateFilter("stateSearch", q)}
          onSearchQuery={(q) => updateFilter("searchQuery", q)}
          onQuickFilter={(q) => updateFilter("quickFilter", q)}
          onClearAll={clearAllFilters}
          onToggleCollapse={toggleCollegeCollapse}
          onEditDetails={handleEditDetails}
        />
      )}
      {/* The AI & WhatsApp Alert Popup */}
      {showSearchAlert && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", padding: "30px", borderRadius: "16px", maxWidth: "450px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ marginBottom: "15px" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" style={{ margin: "0 auto" }}>
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "10px", color: "var(--text)" }}>Pro Tip!</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.5 }}>
              Check out the new <strong>Nexus AI</strong> page from the navbar for personalized admission counseling. <br/><br/>
              Also, don't forget to join our{" "}
              <a 
                href="https://chat.whatsapp.com/JuENcC26gOTDVIgdyMiG6X" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: "var(--brand)", textDecoration: "underline", fontWeight: 700 }}
              >
                WhatsApp Group
              </a>{" "}
              for free mentorship!
            </p>
            <button 
              onClick={() => setShowSearchAlert(false)}
              style={{ background: "var(--brand)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
