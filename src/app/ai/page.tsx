"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AICounselorPanel from "@/components/ai/AICounselorPanel";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";

export default function AIPage() {
  const router = useRouter();
  const [contextData, setContextData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasContext, setHasContext] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("nexus_ai_context");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContextData(parsed);
        if (parsed?.filters?.rank && parsed.filters.rank !== "0") {
          setHasContext(true);
        }
      } catch (err) {
        console.error("Failed to parse stored context", err);
      }
    }
  }, []);

  if (!isMounted) return null;

  if (!hasContext) {
    return (
      <main className={styles.aiPageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: "var(--surface)", padding: "40px", borderRadius: "16px", maxWidth: "500px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
          <div style={{ marginBottom: "20px" }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" style={{ margin: "0 auto" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "15px", color: "var(--text)" }}>
            Profile Required
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "30px", lineHeight: 1.6 }}>
            To give you personalized admission counseling and accurate college recommendations, Nexus AI needs your JEE details first.
          </p>
          <Link 
            href="/"
            style={{ display: "inline-block", background: "var(--brand)", color: "#fff", textDecoration: "none", padding: "12px 30px", borderRadius: "8px", fontWeight: 700 }}
          >
            Go to Predictor
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.aiPageContainer}>
      <div className={styles.aiPanelWrapper}>
        <AICounselorPanel
          rank={contextData?.filters?.rank || "0"}
          category={contextData?.filters?.category || "General"}
          exam={contextData?.filters?.exam || "JEE Main"}
          domicileState={contextData?.filters?.domicileState || "Unknown"}
          gender={contextData?.filters?.gender || "Male"}
          contextCollege={null}
          onClose={() => router.push("/")}
          isMobile={false}
          resultsContext={contextData?.resultsContext || null}
        />
      </div>
    </main>
  );
}
