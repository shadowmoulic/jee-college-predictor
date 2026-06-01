import Link from "next/link";
import styles from "@/app/page.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.navLogo} style={{ textDecoration: "none" }}>
        <div className={styles.logoMark}>N</div>
        <span className={styles.logoText}>Nexus Predictor</span>
      </Link>
      <div className={styles.navLinks}>
        <Link href="/">Tools</Link>
        <Link href="/colleges">Colleges</Link>
        <Link href="/ai" style={{ color: "var(--brand)", fontWeight: 700 }}>Nexus AI ✨</Link>
        <a href="#">JEE Prep</a>
        <a href="#">About</a>
      </div>
      <button className={styles.signInBtn}>Sign In</button>
    </nav>
  );
}
