"use client";

import { FaqJsonLd } from "@/components/seo/JsonLd";
import { useState } from "react";
import styles from "./FAQSection.module.css";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Which JEE exam should I select?",
    answer: "Select JEE Advanced to check IIT options. Select JEE Main to check NIT, IIIT and other JoSAA options in the predictor.",
  },
  {
    question: "How does the JEE College Predictor estimate admission chances?",
    answer: "The predictor compares your rank with JoSAA 2025 opening and closing ranks from the latest available round for a matching program and seat pool. It uses 2024 data when 2025 data is unavailable for that match. Actual allotments depend on the current round, seat availability and candidate choices.",
  },
  {
    question: "Should I enter my category rank or CRL?",
    answer: "Enter your Common Rank List (CRL) rank for OPEN seats. Select the applicable reserved category and enter its category rank to check reserved seats.",
  },
  {
    question: "Which state should I enter for the Home State quota?",
    answer: "Use the state or union territory that applies to your JoSAA State Code of Eligibility. It is usually where you first appeared for the qualifying Class 12 exam. The state affects results for institutes with state-based quotas. Check JoSAA’s official rules for exceptions.",
  },
  {
    question: "Is the JEE College Predictor free?",
    answer: "Yes. You can use the rank-based college predictor for free.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.faqSection} id="faqs">
      <FaqJsonLd items={FAQ_ITEMS} />
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>FAQ</span>
          <h2 className={styles.title}>Frequently Asked Questions</h2>
          <p className={styles.subtitle}>
            Have questions about the JoSAA counseling process or how our predictor works? Find detailed answers below.
          </p>
        </div>

        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => {
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
                    maxHeight: isOpen ? "300px" : "0",
                    opacity: isOpen ? "1" : "0",
                  }}
                >
                  <p className={styles.answerText}>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
