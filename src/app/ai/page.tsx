"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AICounselorPanel from "@/components/ai/AICounselorPanel";
import styles from "./page.module.css";
import Navbar from "@/components/layout/Navbar";

export default function AIPage() {
  const router = useRouter();
  const [contextData, setContextData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("nexus_ai_context");
    if (stored) {
      try {
        setContextData(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse stored context", err);
      }
    }
  }, []);

  if (!isMounted) return null;

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
