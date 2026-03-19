import Link from "next/link";
import { Code2, Github, Twitter, Linkedin } from "lucide-react";
import styles from "./Landing.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <Code2 size={24} className="text-gradient" />
              <span>OpenPulse</span>
            </Link>
            <p className={styles.footerDesc}>
              The developer-first social network. Built by Team Paradox for the creators of tomorrow.
            </p>
            <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-6)" }}>
              <a href="#" className="btn-icon"><Github size={20} /></a>
              <a href="#" className="btn-icon"><Twitter size={20} /></a>
              <a href="#" className="btn-icon"><Linkedin size={20} /></a>
            </div>
          </div>
          
          <div className={styles.footerLinks}>
            <div>
              <span className={styles.footerColumnTitle}>Platform</span>
              <div className={styles.footerColumnLinks}>
                <Link href="/feed" className={styles.navLink}>Feed</Link>
                <Link href="/explore" className={styles.navLink}>Explore</Link>
                <Link href="/signin" className={styles.navLink}>Sign In</Link>
              </div>
            </div>
            <div>
              <span className={styles.footerColumnTitle}>Team Paradox</span>
              <div className={styles.footerColumnLinks}>
                <a href="#" className={styles.navLink}>Projects</a>
                <a href="#" className={styles.navLink}>Blog</a>
                <a href="#" className={styles.navLink}>Contact</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.footerCopyright}>
          © {new Date().getFullYear()} Team Paradox. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
