"use client";
import Image from "next/image";
import Link from "next/link";
import { Star, MessageSquare, ExternalLink, Tag } from "lucide-react";
import styles from "./FeedCard.module.css";

interface Author {
    id: string;
    name: string | null;
    image: string | null;
}

interface FeedCardProps {
    id: string;
    title?: string | null;
    description?: string | null;
    url?: string | null;
    tags?: string[];
    type: "REPOSITORY" | "PITCH";
    author: Author;
    starsCount: number;
    commentsCount: number;
    createdAt: string;
    starredByMe?: boolean;
    onStar?: (postId: string) => void;
}

export default function FeedCard({
    id, title, description, url, tags, type,
    author, starsCount, commentsCount, createdAt,
    starredByMe = false, onStar,
}: FeedCardProps) {
    const timeAgo = getTimeAgo(new Date(createdAt));

    return (
        <article className={styles.card}>
            <header className={styles.header}>
                <Link href={`/user/${author.id}`} className={styles.authorLink}>
                    <div className={styles.avatar}>
                        {author.image ? (
                            <Image src={author.image} alt={author.name || "User"} fill style={{ objectFit: "cover" }} />
                        ) : (
                            <span>{author.name?.[0] || "?"}</span>
                        )}
                    </div>
                    <div>
                        <p className={styles.authorName}>{author.name || "Unknown"}</p>
                        <p className={styles.meta}>{timeAgo}</p>
                    </div>
                </Link>
                {type === "REPOSITORY" && (
                    <span className={styles.badge}>Repo</span>
                )}
                {type === "PITCH" && (
                    <span className={`${styles.badge} ${styles.pitchBadge}`}>Pitch</span>
                )}
            </header>

            <div className={styles.body}>
                {title && <h2 className={styles.title}>{title}</h2>}
                {description && <p className={styles.description}>{description}</p>}
                {tags && tags.length > 0 && (
                    <div className={styles.tags}>
                        {tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                                <Tag size={11} /> {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <footer className={styles.actions}>
                <button
                    className={`${styles.actionBtn} ${starredByMe ? styles.starred : ""}`}
                    onClick={() => onStar?.(id)}
                >
                    <Star size={18} fill={starredByMe ? "currentColor" : "none"} />
                    <span>{starsCount}</span>
                </button>
                <Link href={`/post/${id}`} className={styles.actionBtn}>
                    <MessageSquare size={18} />
                    <span>{commentsCount}</span>
                </Link>
                {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                        <ExternalLink size={18} />
                        <span>View</span>
                    </a>
                )}
            </footer>
        </article>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
