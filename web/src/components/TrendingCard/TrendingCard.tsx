"use client";
import Image from "next/image";
import { Star, GitFork, ExternalLink } from "lucide-react";
import styles from "./TrendingCard.module.css";

interface TrendingOwner {
    login: string;
    avatar: string;
}

interface TrendingCardProps {
    id: number;
    fullName: string;
    description?: string | null;
    url: string;
    stars: number;
    forks: number;
    language?: string | null;
    owner: TrendingOwner;
    ogImage: string;
}

const langColors: Record<string, string> = {
    TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3572A5",
    Go: "#00add8", Rust: "#dea584", Java: "#b07219", "C++": "#f34b7d",
    Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF", default: "#4b5563",
};

export default function TrendingCard({ fullName, description, url, stars, forks, language, owner, ogImage }: TrendingCardProps) {
    return (
        <article className={styles.card}>
            <div className={styles.ogImage}>
                <Image
                    src={ogImage}
                    alt={fullName}
                    width={600}
                    height={360}
                    style={{ width: "100%", height: "auto", objectFit: "contain", objectPosition: "center" }}
                    sizes="(max-width: 600px) 100vw, 600px"
                />
                <div className={styles.overlay} />
            </div>
            <div className={styles.content}>
                <div className={styles.authorRow}>
                    <Image src={owner.avatar} alt={owner.login} width={22} height={22} className={styles.ownerAvatar} />
                    <span className={styles.ownerName}>{owner.login}</span>
                    {language && (
                        <span className={styles.language} style={{ background: langColors[language] || langColors.default }}>
                            {language}
                        </span>
                    )}
                </div>
                <h2 className={styles.repoName}>{fullName.split("/")[1]}</h2>
                {description && <p className={styles.description}>{description}</p>}
                <div className={styles.stats}>
                    <span className={styles.stat}><Star size={14} /> {stars.toLocaleString()}</span>
                    <span className={styles.stat}><GitFork size={14} /> {forks.toLocaleString()}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                        <ExternalLink size={14} /> View Repo
                    </a>
                </div>
            </div>
        </article>
    );
}
