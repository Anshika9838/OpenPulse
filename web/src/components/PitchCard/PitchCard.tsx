"use client";
import Image from "next/image";
import Link from "next/link";
import { Star, ExternalLink, Tag, Play } from "lucide-react";
import styles from "./PitchCard.module.css";

interface PitchCardProps {
    id: string;
    title?: string | null;
    description?: string | null;
    url?: string | null;
    mediaUrl?: string | null;
    tags?: string[];
    author: { id: string; name: string | null; image: string | null };
    starsCount: number;
    createdAt: string;
    starredByMe?: boolean;
    onStar?: (id: string) => void;
}

export default function PitchCard({ id, title, description, url, mediaUrl, tags, author, starsCount, createdAt, starredByMe = false, onStar }: PitchCardProps) {
    return (
        <article className={styles.card}>
            {/* Video Player */}
            {mediaUrl && (
                <div className={styles.videoWrapper}>
                    <video
                        src={mediaUrl}
                        controls
                        preload="metadata"
                        className={styles.video}
                        playsInline
                    />
                    <div className={styles.playOverlay}><Play size={36} fill="white" /></div>
                </div>
            )}

            <div className={styles.content}>
                <div className={styles.authorRow}>
                    <Link href={`/user/${author.id}`} className={styles.authorLink}>
                        <div className={styles.avatar}>
                            {author.image
                                ? <Image src={author.image} alt={author.name || ""} fill style={{ objectFit: "cover" }} />
                                : <span>{author.name?.[0] || "?"}</span>
                            }
                        </div>
                        <span className={styles.authorName}>{author.name}</span>
                    </Link>
                    <span className={styles.badge}>Pitch</span>
                </div>

                {title && <h2 className={styles.title}>{title}</h2>}
                {description && <p className={styles.description}>{description}</p>}

                {tags && tags.length > 0 && (
                    <div className={styles.tags}>
                        {tags.map((t) => <span key={t} className={styles.tag}><Tag size={10} /> {t}</span>)}
                    </div>
                )}

                <div className={styles.actions}>
                    <button className={`${styles.starBtn} ${starredByMe ? styles.starred : ""}`} onClick={() => onStar?.(id)}>
                        <Star size={17} fill={starredByMe ? "currentColor" : "none"} />
                        <span>{starsCount}</span>
                    </button>
                    <Link href={`/post/${id}`} className={styles.actionLink}>Comments</Link>
                    {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>
                            <ExternalLink size={14} /> Repo
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}
