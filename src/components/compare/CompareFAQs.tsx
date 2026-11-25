"use client";

import { FaqJsonLd } from "@/components/seo/JsonLd";
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
      answer: `${c1Short} reports an average salary package of ${avgPackage1 || "N/A"} with the highest package reaching ${highestPackage1 || "N/A"}${placementRate1 ? ` and a placement rate of ${placementRate1}` : ""}. In comparison, ${c2Short} has an average package of ${avgPackage2 || "N/A"} and a highest package of ${highestPackage2 || "N/A"}${placementRate2 ? ` with a placement rate of ${placementRate2}` : ""}. Check the reporting year and compare the same placement metric. Branch-level outcomes can differ from institute-wide figures.`,
    },
    {
      question: `How do the B.Tech fees compare between ${c1Short} and ${c2Short}?`,
      answer: `${c1Short}: ${fee1 ? `₹${fee1} per year` : "annual fee unavailable"}. ${c2Short}: ${fee2 ? `₹${fee2} per year` : "annual fee unavailable"}. Total cost of attendance may vary depending on hostel facilities, mess options, and local living expenses at each campus.`,
    },
    {
      question: `Which institute has tougher JoSAA cutoff ranks: ${c1Short} or ${c2Short}?`,
      answer: `The lower numerical closing rank indicates the more selective option for a matching program, year, round, quota, seat category and gender pool. Use the cutoff tables to compare those settings for your preferred branch.`,
    },
  ];

  return (
    <>
      <FaqJsonLd items={faqItems} />
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
