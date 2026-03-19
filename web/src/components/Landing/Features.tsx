import { Search, MessageSquare, Heart, Share2 } from "lucide-react";
import styles from "./Landing.module.css";

const features = [
  {
    icon: Search,
    title: "Explore Projects",
    description: "Discover innovative repositories and pitches from the community."
  },
  {
    icon: MessageSquare,
    title: "Direct DMs",
    description: "Chat and collaborate with other developers directly through secure messaging."
  },
  {
    icon: Heart,
    title: "Social Engagement",
    description: "Like, comment, and star projects to show your appreciation and provide feedback."
  },
  {
    icon: Share2,
    title: "Post & Share",
    description: "Share your ideas, posts, and repositories with the entire developer ecosystem."
  }
];

export default function Features() {
  return (
    <section id="features" className="section-padding">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Platform <span className="text-gradient">Features</span></h2>
        <p className={styles.sectionSubtitle}>
          Everything you need to grow your presence and network in the tech community.
        </p>
        
        <div className={styles.featuresGrid}>
          {features.map((feature, i) => (
            <div key={i} className={styles.featureCard}>
              <feature.icon size={48} className={styles.featureIcon} strokeWidth={1.5} />
              <h3>{feature.title}</h3>
              <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
