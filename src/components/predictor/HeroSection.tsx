import Link from "next/link";
import styles from "@/app/page.module.css";

export default function HeroSection() {
  return (
    <div className={styles.heroLeft}>
      <div className={styles.heroBadge}>
        <span className={styles.badgeHighlight}>2025 Data</span>
        <span className={styles.badgeText}>Historical JoSAA opening and closing ranks</span>
      </div>
      <h1>JEE College Predictor 2027</h1>
      <p className={styles.heroSub}>
        Estimate your IIT options with a JEE Advanced rank and your NIT, IIIT and GFTI options with a JEE Main rank. Results use historical cutoffs to help you shortlist programs for JoSAA counselling.
      </p>
      <p className={styles.heroSub}>
        <a href="https://josaa.nic.in/document-category/business-rule/" style={{ textDecoration: "underline" }}>Official JoSAA counselling rules</a>{" · "}
        <Link href="/cutoffs" style={{ textDecoration: "underline" }}>Explore historical cutoffs</Link>
      </p>
      <div className={styles.featuresList}>
        {[
          "Completely FREE to use",
          "Based on official JoSAA 2025 data — IITs, NITs & IIITs",
          "Explore branch cutoffs and available placement figures",
        ].map((feature) => (
          <div className={styles.featureItem} key={feature}>
            <div className={styles.checkIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}
