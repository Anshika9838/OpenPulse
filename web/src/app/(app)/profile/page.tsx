"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import FeedCard from "@/components/FeedCard/FeedCard";
import { MessageCircle, Settings, LogOut, Star } from "lucide-react";
import styles from "./page.module.css";

type Post = {
    id: string; title?: string; description?: string; url?: string; mediaUrl?: string;
    tags?: string[]; type: "REPOSITORY" | "PITCH"; createdAt: string;
    author: { id: string; name: string | null; image: string | null };
    _count: { stars: number; comments: number };
};

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/signin");
    }, [status]);

    useEffect(() => {
        if (session?.user?.id) {
            fetch(`/api/posts`).then(r => r.json()).then((all: Post[]) => {
                setPosts(all.filter(p => p.author.id === session.user.id));
                setLoading(false);
            });
        }
    }, [session]);

    if (!session) return null;

    const totalStars = posts.reduce((acc, p) => acc + p._count.stars, 0);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Profile</h1>
                <button onClick={() => signOut({ callbackUrl: "/signin" })} className={styles.signOutBtn}>
                    <LogOut size={18} />
                </button>
            </header>

            <div className={styles.profileCard}>
                <div className={styles.avatar}>
                    {session.user.image ? (
                        <Image src={session.user.image} alt={session.user.name || ""} fill style={{ objectFit: "cover" }} />
                    ) : (
                        <span>{session.user.name?.[0] || "?"}</span>
                    )}
                </div>
                <div className={styles.info}>
                    <h2 className={styles.name}>{session.user.name}</h2>
                    <p className={styles.email}>{session.user.email}</p>
                </div>
            </div>

            {/* Analytics */}
            <div className={styles.analyticsRow}>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{posts.length}</span>
                    <span className={styles.statLabel}>Posts</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{totalStars}</span>
                    <span className={styles.statLabel}>Stars Received</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{posts.filter(p => p.type === "PITCH").length}</span>
                    <span className={styles.statLabel}>Pitches</span>
                </div>
            </div>

            <div className={styles.postsSection}>
                <h3 className={styles.sectionTitle}>Your Posts</h3>
                {loading ? (
                    <p className={styles.loading}>Loading…</p>
                ) : posts.length === 0 ? (
                    <div className={styles.empty}>
                        <p>You haven&apos;t posted anything yet.</p>
                        <Link href="/post/new" className="btn-primary">Share a Repo</Link>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {posts.map(p => (
                            <FeedCard key={p.id} id={p.id} title={p.title} description={p.description} url={p.url}
                                tags={p.tags} type={p.type} author={p.author} starsCount={p._count.stars}
                                commentsCount={p._count.comments} createdAt={p.createdAt} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
