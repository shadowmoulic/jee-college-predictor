"use client";

import { useState } from "react";
import styles from "../predictor/FAQSection.module.css";

interface CollegeFAQsProps {
  name: string;
  shortName: string;
  state: string;
  instituteType: string;
  annualFee?: string;
  avgPackage?: string;
  medianPackage?: string;
  highestPackage?: string;
  placementRate?: string;
}

export default function CollegeFAQs({
  name,
  shortName,
  state,
  instituteType,
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
      answer: `Placements at ${name} are highly competitive. The average salary package is ${avgPackage || "not officially disclosed"}, and the median package is ${medianPackage || "N/A"}. The highest salary package recorded is ${highestPackage || "N/A"}${placementRate ? `, with an overall placement rate of approximately ${placementRate}` : ""}.`,
    },
    {
      question: `What is the annual B.Tech course fee at ${shortName}?`,
      answer: `${name} has an annual academic course fee of approximately ₹${annualFee || "not specified"}/year. Please note that this fee does not include hostel charges, mess fees, or refundable deposits. Tuition fee waivers or concessions are applicable for SC, ST, and economically weaker section (EWS) candidates as per Government of India guidelines.`,
    },
    {
      question: `How are the JoSAA cutoff ranks determined for ${shortName}?`,
      answer: `The JoSAA opening and closing ranks for ${name} are determined round-by-round based on candidate choices, rank distributions, and seat-type matrices. Highly sought-after programs like Computer Science & Engineering (CSE) close at much higher ranks compared to core or dual-degree branches.`,
    },
    {
      question: `How can I predict my chances of getting into ${shortName}?`,
      answer: `You can use the Nexus Predictor tool on our homepage. Enter your JEE rank, select your category, gender, and Class 12th domicile state to instantly see the probability (High, Medium, or Low) of securing a seat in any branch at ${shortName}.`,
    },
  ];

  // Structured Data (JSON-LD)
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

  const collegeSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `https://nexuspredictor.in/college/${shortName.toLowerCase().replace(/\s+/g, "-")}`,
    "name": name,
    "alternateName": shortName,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": state,
      "addressCountry": "India",
    },
  };

  return (
    <>
      {/* Schema Script Insertion */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collegeSchema) }}
      />

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
