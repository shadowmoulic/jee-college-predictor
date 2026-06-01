"use client";

import { useState } from "react";
import styles from "../predictor/FAQSection.module.css";

interface CompareFAQsProps {
  c1Short: string;
  c2Short: string;
  c1Name: string;
  c2Name: string;
  fee1?: string;
  fee2?: string;
  avgPackage1?: string;
  avgPackage2?: string;
  highestPackage1?: string;
  highestPackage2?: string;
  placementRate1?: string;
  placementRate2?: string;
}

export default function CompareFAQs({
  c1Short,
  c2Short,
  c1Name,
  c2Name,
  fee1,
  fee2,
  avgPackage1,
  avgPackage2,
  highestPackage1,
  highestPackage2,
  placementRate1,
  placementRate2,
}: CompareFAQsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: `Which is better for placements: ${c1Short} or ${c2Short}?`,
      answer: `${c1Short} reports an average salary package of ${avgPackage1 || "N/A"} with the highest package reaching ${highestPackage1 || "N/A"}${placementRate1 ? ` and a placement rate of ${placementRate1}` : ""}. In comparison, ${c2Short} has an average package of ${avgPackage2 || "N/A"} and a highest package of ${highestPackage2 || "N/A"}${placementRate2 ? ` with a placement rate of ${placementRate2}` : ""}. Both are premium institutions, but branch-specific packages may vary.`,
    },
    {
      question: `How do the B.Tech fees compare between ${c1Short} and ${c2Short}?`,
      answer: `The annual course fee at ${c1Short} is approximately ₹${fee1 || "N/A"}/year. Meanwhile, the course fee at ${c2Short} is about ₹${fee2 || "N/A"}/year. Total cost of attendance may vary depending on hostel facilities, mess options, and local living expenses at each campus.`,
    },
    {
      question: `Which institute has tougher JoSAA cutoff ranks: ${c1Short} or ${c2Short}?`,
      answer: `Cutoff ranks are branch and category dependent. For elite branches like Computer Science & Engineering (CSE), both institutions have extremely high cutoff ranks (low closing ranks). You can compare their branch-wise opening and closing ranks side-by-side in the tables above to see which institute has higher demand for your preferred engineering branch.`,
    },
  ];

  // FAQ Schema (JSON-LD)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className={styles.faqSection} style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", borderRadius: "20px", padding: "3rem 2rem", marginTop: "3rem", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ marginBottom: "2rem" }}>
          <span className={styles.badge}>FAQs</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginTop: "10px", marginBottom: "8px" }}>
            Frequently Asked Questions: {c1Short} vs {c2Short}
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0 }}>
            Compare key placement, fee, and admission cutoff facts between {c1Short} and {c2Short}.
          </p>
        </div>

        <div className={styles.faqList}>
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}
              >
                <button
                  className={styles.faqHeader}
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.questionText}>{item.question}</span>
                  <div className={styles.iconWrapper}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`${styles.icon} ${isOpen ? styles.iconRotate : ""}`}
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </button>
                <div
                  className={styles.faqBody}
                  style={{
                    maxHeight: isOpen ? "200px" : "0",
                    opacity: isOpen ? "1" : "0",
                  }}
                >
                  <p className={styles.answerText}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
