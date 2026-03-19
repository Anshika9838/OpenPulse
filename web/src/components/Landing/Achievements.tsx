import styles from "./Landing.module.css";

const stats = [
  { value: "10k+", label: "Developers" },
  { value: "50k+", label: "Projects" },
  { value: "100k+", label: "Interactions" },
  { value: "500+", label: "Communities" }
];

export default function Achievements() {
  return (
    <section id="achievements" className="section-padding" style={{ background: "var(--bg-secondary)" }}>
      <div className={styles.container}>
        <div className={styles.stats}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statItem}>
              <span className={`${styles.statValue} text-gradient`}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
