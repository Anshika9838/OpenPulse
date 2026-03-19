"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Code2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./Landing.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
            <button className={styles.themeBtn} onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/signin" className="btn-secondary">Sign In</Link>
            <Link href="/feed" className="btn-primary">Launch App</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
