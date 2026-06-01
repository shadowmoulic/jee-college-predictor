import Link from "next/link";
import styles from "@/app/page.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.navLogo} style={{ textDecoration: "none" }}>
        <div className={styles.logoMark}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className={styles.logoText}>Nexus Predictor</span>
      </Link>
      <div className={styles.navLinks}>
        <Link href="/">Tools</Link>
        <Link href="/colleges">Colleges</Link>
        <a href="#">JEE Prep</a>
        <a href="#">About</a>
      </div>
      <button className={styles.signInBtn}>Sign In</button>
    </nav>
  );
}
