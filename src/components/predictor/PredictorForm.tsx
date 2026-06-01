"use client";

import { FormEvent, useMemo } from "react";
import styles from "@/app/page.module.css";
import { PredictorFormValues } from "@/types/predictor";

const STEPS = [
  { label: "Exam type",   key: "exam" },
  { label: "Your rank",   key: "rank" },
  { label: "Category",    key: "category" },
  { label: "Home state",  key: "domicileState" },
  { label: "Gender",      key: "gender" },
  { label: "Your name",   key: "name" },
];

function useCompletion(values: PredictorFormValues) {
  return useMemo(() => {
    const done = STEPS.filter(({ key }) => {
      const v = values[key as keyof PredictorFormValues];
      return typeof v === "string" ? v.trim().length > 0 : !!v;
    });
    const pct = Math.round((done.length / STEPS.length) * 100);
    const next = STEPS.find(({ key }) => {
      const v = values[key as keyof PredictorFormValues];
      return typeof v === "string" ? v.trim().length === 0 : !v;
    });
    return { pct, doneCount: done.length, total: STEPS.length, nextStep: next?.label ?? null };
  }, [values]);
}

const STATES = [
  "Andhra Pradesh","Assam","Bihar","Chandigarh","Delhi","Gujarat","Haryana",
  "Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Meghalaya","Manipur","Odisha","Punjab",
  "Rajasthan","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Other"
];

interface Props {
  values: PredictorFormValues;
  onChange: (key: keyof PredictorFormValues, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function PredictorForm({ values, onChange, onSubmit }: Props) {
  const { pct, doneCount, total, nextStep } = useCompletion(values);

  return (
    <div className={styles.formCard}>
      {/* ── Completion bar ─────────────────────────────────── */}
      <div className={styles.completionWrap}>
        <div className={styles.completionHeader}>
          <span className={styles.completionLabel}>
            {pct === 100 ? "All set — ready to predict!" : nextStep ? `Next: ${nextStep}` : "Almost there!"}
          </span>
          <span className={styles.completionCount}>{doneCount}/{total}</span>
        </div>
        <div className={styles.completionTrack}>
          <div
            className={styles.completionFill}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <h2 className={styles.formTitle}>Enter details to predict college</h2>
      <form onSubmit={onSubmit}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Full Name</label>
          <input
            id="predictor-name"
            className={styles.formInput}
            type="text"
            placeholder="Enter your name"
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Email</label>
          <input
            id="predictor-email"
            className={styles.formInput}
            type="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Exam Type</label>
          <div className={styles.genderRow}>
            <div
              className={`${styles.genderOpt} ${values.exam === "JEE Advanced" ? styles.selectedOpt : ""}`}
              onClick={() => onChange("exam", "JEE Advanced")}
            >
              <div className={styles.radioCircle}></div>JEE Advanced (IITs)
            </div>
            <div
              className={`${styles.genderOpt} ${values.exam === "JEE Main" ? styles.selectedOpt : ""}`}
              onClick={() => onChange("exam", "JEE Main")}
            >
              <div className={styles.radioCircle}></div>JEE Main (NITs/IIITs)
            </div>
          </div>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>{values.exam} Rank</label>
          <input
            id="predictor-rank"
            className={styles.formInput}
            type="number"
            placeholder="e.g. 2900"
            min="1"
            required
            value={values.rank}
            onChange={(e) => onChange("rank", e.target.value)}
          />
          <div className={styles.hintRed}>
            Note: Enter CRL rank for General. For OBC, SC, ST, PwD and EWS enter Category Rank.
          </div>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Category</label>
          <select
            id="predictor-category"
            className={styles.formSelect}
            value={values.category}
            onChange={(e) => onChange("category", e.target.value)}
          >
            <option>General (CRL)</option>
            <option>OBC-NCL</option>
            <option>SC</option>
            <option>ST</option>
            <option>EWS</option>
            <option>PwD</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Class 12th Domicile State</label>
          <select
            id="predictor-state"
            className={styles.formSelect}
            value={values.domicileState}
            onChange={(e) => onChange("domicileState", e.target.value)}
          >
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Gender</label>
          <div className={styles.genderRow}>
            <div
              className={`${styles.genderOpt} ${values.gender === "Male" ? styles.selectedOpt : ""}`}
              onClick={() => onChange("gender", "Male")}
            >
              <div className={styles.radioCircle}></div>Male
            </div>
            <div
              className={`${styles.genderOpt} ${values.gender === "Female" ? styles.selectedOpt : ""}`}
              onClick={() => onChange("gender", "Female")}
            >
              <div className={styles.radioCircle}></div>Female
            </div>
          </div>
        </div>
        <button id="predictor-submit" type="submit" className={styles.submitBtn}>
          Predict My College
        </button>
      </form>
      <div className={styles.formFooter}>
        <div className={styles.avatarGroup}>
          <div className={`${styles.avatar} ${styles.avatar1}`}>A</div>
          <div className={`${styles.avatar} ${styles.avatar2}`}>R</div>
          <div className={`${styles.avatar} ${styles.avatar3}`}>P</div>
        </div>
        <span>
          <strong>67,227</strong> students have already predicted their college
        </span>
      </div>
    </div>
  );
}
