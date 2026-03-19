import { ArrowRight, Github, Sparkles } from "lucide-react";
import Link from "next/link";
import styles from "./Landing.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={`${styles.heroContent} animate-slide-up`}>
          <div className={styles.teamBadge}>
            <Sparkles size={16} />
            <span>Created by Team Paradox</span>
          </div>
          <h1 className={styles.heroTitle}>
            The Pulse of <br />
            <span className="text-gradient">Developer Community</span>
          </h1>
          <p className={styles.heroDescription}>
            Explore, connect, and build with developers worldwide. 
            OpenPulse is the social layer for your digital craft.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signin" className="btn-primary">
              Launch Platform <ArrowRight size={18} />
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <Github size={18} /> View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
