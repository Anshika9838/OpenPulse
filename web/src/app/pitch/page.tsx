"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PitchCard from "@/components/PitchCard/PitchCard";
import { Plus } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

type Post = {
    id: string; title?: string; description?: string; url?: string; mediaUrl?: string;
    tags?: string[]; type: "REPOSITORY" | "PITCH"; createdAt: string;
    author: { id: string; name: string | null; image: string | null };
    _count: { stars: number; comments: number };
};

export default function PitchPage() {
    const { data: session } = useSession();
    const [pitches, setPitches] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [starredPosts, setStarredPosts] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch("/api/posts?type=PITCH").then(r => r.json()).then(d => { setPitches(d); setLoading(false); });
    }, []);

    const handleStar = useCallback(async (postId: string) => {
        if (!session) return;
        const res = await fetch(`/api/posts/${postId}/star`, { method: "POST" });
        const data = await res.json();
        setStarredPosts(prev => { const n = new Set(prev); data.starred ? n.add(postId) : n.delete(postId); return n; });
        setPitches(prev => prev.map(p => p.id === postId ? { ...p, _count: { ...p._count, stars: p._count.stars + (data.starred ? 1 : -1) } } : p));
    }, [session]);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Pitches 🎯</h1>
                {session && (
                    <Link href="/pitch/new" className={styles.newBtn}>
                        <Plus size={16} /> New Pitch
                    </Link>
                )}
            </header>

            {loading ? (
                <p className={styles.loading}>Loading pitches…</p>
            ) : pitches.length === 0 ? (
                <div className={styles.empty}>
                    <p>No pitches yet. Be the first to pitch!</p>
                    {session && <Link href="/pitch/new" className="btn-primary">Create Pitch</Link>}
                </div>
            ) : (
                <div className={styles.list}>
                    {pitches.map(p => (
                        <PitchCard key={p.id} id={p.id} title={p.title} description={p.description} url={p.url}
                            mediaUrl={p.mediaUrl} tags={p.tags} author={p.author} starsCount={p._count.stars}
                            createdAt={p.createdAt} starredByMe={starredPosts.has(p.id)} onStar={handleStar} />
                    ))}
                </div>
            )}
        </div>
    );
}
