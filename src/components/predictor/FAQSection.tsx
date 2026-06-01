"use client";

import { useState } from "react";
import styles from "./FAQSection.module.css";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is the JEE Advanced College Predictor 2026?",
    answer: "The JEE Advanced College Predictor is a data-driven planning tool for Indian engineering aspirants. It analyzes your JEE rank to predict your admission chances at premium Indian Institutes of Technology (IITs), National Institutes of Technology (NITs), Indian Institutes of Information Technology (IIITs), and Government Funded Technical Institutes (GFTIs) based on historical JoSAA cutoff trends.",
  },
  {
    question: "How accurate are the JoSAA college predictions?",
    answer: "Our engine uses official, authenticated JoSAA 2025 closing and opening ranks across all rounds. While this gives a highly reliable projection, the exact cutoffs for 2026 will vary depending on candidate preferences, changes in seat matrices, and individual category lists.",
  },
  {
    question: "Which rank should I enter: Category Rank or CRL?",
    answer: "If you belong to a reserved category (OBC-NCL, SC, ST, EWS, or PwD) and want to check reserved seat options, you must enter your Category Rank. Our predictor is designed to automatically map your category rank to the corresponding reserved seat cutoff data. If you want to check open seats, enter your Common Rank List (CRL) rank.",
  },
  {
    question: "How does the Home State Domicile option impact my results?",
    answer: "For NITs and GFTIs, 50% of the seats are reserved under the Home State (HS) quota for students who completed their Class 12th in that state. The other 50% fall under the Other State (OS) quota. Entering your correct Class 12th Domicile State allows the tool to accurately apply home state quotas, which frequently have much lower cutoff ranks.",
  },
  {
    question: "Is this predictor free to use?",
    answer: "Yes, our JoSAA College Predictor is 100% free with no hidden charges. Our mission is to democratize high-quality, analytical tools for Indian students during the stressful counseling phase.",
  },
  {
    question: "Can I get personalized guidance from an AI counselor?",
    answer: "Yes, absolutely! We feature an integrated Nexus AI Counselor. After running your rank prediction, you can click 'Ask AI Counsellor' or access 'Nexus AI' from the navbar to ask specific questions about branch comparisons, placement statistics, fees, and state-wise quotas.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.faqSection} id="faqs">
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
