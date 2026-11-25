import { siteUrl } from "@/lib/site";
import Link from "next/link";
import styles from "@/app/page.module.css"; // Reuse general styles if necessary

export const metadata = {
  alternates: { canonical: siteUrl("/terms") },
  title: "Terms and Conditions | Nexus Predictor",
  description: "Terms and conditions for using Nexus Predictor.",
};

export default function TermsPage() {
  return (
    <main className={styles.main} style={{ padding: "80px 24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>Terms and Conditions</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Last Updated: {new Date().toLocaleDateString()}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "var(--text)" }}>
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Nexus Predictor, you accept and agree to be bound by the terms and provision of this agreement. 
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>2. Educational Purpose Only</h2>
          <p>
            The predictions and historical data provided by this tool are for informational and educational purposes only. They are based on past JoSAA counseling data and DO NOT guarantee actual admission into any institute or branch.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>3. Data Accuracy</h2>
          <p>
            While we strive to keep the data accurate and up to date, we make no warranties regarding the completeness, reliability, or accuracy of the information presented. The official JoSAA website is the final authority for all counseling matters.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>4. Limitation of Liability</h2>
          <p>
            Nexus Predictor and its developers shall not be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever arising out of or in connection with the use of the service.
          </p>
        </section>
      </div>

      <div style={{ marginTop: "3rem" }}>
        <Link href="/" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>
          &larr; Back to Predictor
        </Link>
      </div>
    </main>
  );
}
