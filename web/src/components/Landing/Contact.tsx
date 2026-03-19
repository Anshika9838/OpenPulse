'use client';

import styles from "./Landing.module.css";

export default function Contact() {
  return (
    <section id="contact" className="section-padding" style={{ background: "var(--bg-secondary)" }}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Get in <span className="text-gradient">Touch</span></h2>
        <p className={styles.sectionSubtitle}>
          Have questions or want to collaborate? The Team Paradox is here to help.
        </p>
        
        <div className={styles.contactWrapper}>
          <form className={`${styles.contactForm} glass-panel`} style={{ padding: "var(--space-8)" }} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" className={styles.input} placeholder="Your name" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" className={styles.input} placeholder="your@email.com" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="message">Message</label>
              <textarea id="message" className={`${styles.input} ${styles.textarea}`} placeholder="How can we help?"></textarea>
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}
