import styles from "@/app/page.module.css";

export default function HeroSection() {
  return (
    <div className={styles.heroLeft}>
      <div className={styles.heroBadge}>
        <span className={styles.badgeHighlight}>2025 Data</span>
        <span className={styles.badgeText}>Based on latest 2025 JoSAA cutoffs like none other</span>
      </div>
      <h1>JEE Advanced College Predictor 2026 (JoSAA)</h1>
      <p className={styles.heroSub}>
        JEE Advanced College Predictor 2026 tool helps you predict your admission
        chances into premium IITs, NITs, and IIITs based on your JEE Advanced 2026 rank.
      </p>
      <div className={styles.featuresList}>
        {[
          "Completely FREE to use",
          "Based on official JoSAA 2025 data — IITs, NITs & IIITs",
          "Get details like placement ratios, packages, campus videos",
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
