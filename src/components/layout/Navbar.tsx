"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.navLogo} style={{ textDecoration: "none" }}>
        <div className={styles.logoMark}>J</div>
        <span className={styles.logoText}>JEE College Predictor</span>
      </Link>
      
      {/* Desktop Links */}
      <div className={styles.navLinks}>
        <Link href="/">Tools</Link>
        <Link href="/cutoffs">Cutoffs</Link>
        <Link href="/colleges">Colleges</Link>
        <Link href="/compare">Compare</Link>
        <Link href="/ai" style={{ color: "var(--brand)", fontWeight: 700 }}>AI Counsellor</Link>
      </div>

      <div className={styles.navActions}>
        <a 
          href="https://chat.whatsapp.com/JuENcC26gOTDVIgdyMiG6X" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.joinBtn}
        >
          Join our Group
        </a>
        <button 
          className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ""}`} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ""}`}>
        <Link href="/" onClick={() => setIsOpen(false)}>Tools</Link>
        <Link href="/cutoffs" onClick={() => setIsOpen(false)}>Cutoffs</Link>
        <Link href="/colleges" onClick={() => setIsOpen(false)}>Colleges</Link>
        <Link href="/compare" onClick={() => setIsOpen(false)}>Compare</Link>
        <Link href="/ai" onClick={() => setIsOpen(false)} style={{ color: "var(--brand)", fontWeight: 700 }}>AI Counsellor</Link>
        <a 
          href="https://chat.whatsapp.com/JuENcC26gOTDVIgdyMiG6X" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.mobileJoinBtn}
          onClick={() => setIsOpen(false)}
        >
          Join our Group
        </a>
      </div>
    </nav>
  );
}
