import { Code, Globe, Zap } from "lucide-react";
import styles from "./Landing.module.css";

const highlights = [
  {
    icon: Code,
    title: "Project-Centric",
    description: "Built for developers to showcase their work, from snippets to full-scale applications."
  },
  {
    icon: Globe,
    title: "Global Network",
    description: "Connect with like-minded creators and find collaborators across the globe."
  },
  {
    icon: Zap,
    title: "Instant Interaction",
    description: "Real-time chat, DMs, and engagement features to keep the pulse of your community."
  }
];

export default function Overview() {
  return (
    <section id="overview" className="section-padding">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Built for the <span className="text-gradient">Modern Developer</span></h2>
        <p className={styles.sectionSubtitle}>
          OpenPulse bridges the gap between code and community, providing a space where your work speaks for itself.
        </p>
        
        <div className={styles.overviewGrid}>
          {highlights.map((item, i) => (
            <div key={i} className={`${styles.overviewCard} glass-panel animate-fade-in`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.cardIcon}>
                <item.icon size={24} />
              </div>
              <h3>{item.title}</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
