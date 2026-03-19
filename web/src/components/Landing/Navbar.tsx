"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Code2 } from "lucide-react";
import styles from "./Landing.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
      <div className={styles.container}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            <Code2 size={32} className="text-gradient" />
            <span>OpenPulse</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#overview" className={styles.navLink}>Overview</a>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#achievements" className={styles.navLink}>Achievements</a>
            <Link href="/signin" className="btn-secondary">Sign In</Link>
            <Link href="/feed" className="btn-primary">Launch App</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
