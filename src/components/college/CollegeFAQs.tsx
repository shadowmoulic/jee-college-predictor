"use client";

import { FaqJsonLd } from "@/components/seo/JsonLd";
import { useState } from "react";
import styles from "../predictor/FAQSection.module.css";

interface CollegeFAQsProps {
  name: string;
  shortName: string;
  annualFee?: string;
  avgPackage?: string;
  medianPackage?: string;
  highestPackage?: string;
  placementRate?: string;
}

export default function CollegeFAQs({
  name,
  shortName,
  annualFee,
  avgPackage,
  medianPackage,
  highestPackage,
  placementRate,
}: CollegeFAQsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: `What are the average and highest placement packages at ${shortName}?`,
      answer: `The reported average salary package at ${name} is ${avgPackage || "not officially disclosed"}, and the median package is ${medianPackage || "N/A"}. The highest salary package recorded is ${highestPackage || "N/A"}${placementRate ? `, with an overall placement rate of approximately ${placementRate}` : ""}.`,
    },
    {
      question: `What is the annual B.Tech course fee at ${shortName}?`,
      answer: `${annualFee ? `The listed annual fee at ${name} is ₹${annualFee}.` : `Annual fee data for ${name} is unavailable here.`} Check the institute’s fee schedule for current tuition, hostel and mess charges, and eligibility for waivers.`,
    },
    {
      question: `How are the JoSAA cutoff ranks determined for ${shortName}?`,
      answer: `The JoSAA opening and closing ranks for ${name} are determined round-by-round based on candidate choices, rank distributions, and seat-type matrices. Compare the same round, quota, seat category and gender pool when reading opening and closing ranks.`,
    },
    {
      question: `How can I predict my chances of getting into ${shortName}?`,
      answer: `You can use the Nexus Predictor tool on our homepage. Enter your JEE rank, select your category, gender, and Class 12th domicile state to instantly see the probability (High, Medium, or Low) of securing a seat in any branch at ${shortName}.`,
    },
  ];

  return (
    <>
      <FaqJsonLd items={faqItems} />
      <section className={styles.faqSection} style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", borderRadius: "20px", padding: "3rem 2rem", marginTop: "3rem", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ marginBottom: "2rem" }}>
          <span className={styles.badge}>FAQs</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginTop: "10px", marginBottom: "8px" }}>
            Frequently Asked Questions about {shortName}
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0 }}>
            Get critical details about admission fees, cutoffs, and placements for {name}.
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
