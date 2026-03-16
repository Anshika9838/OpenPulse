"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import FeedCard from "@/components/FeedCard/FeedCard";
import styles from "./page.module.css";

type UserData = { id: string; name: string | null; image: string | null; bio: string | null };
type Post = {
    id: string; title?: string; description?: string; url?: string;
    tags?: string[]; type: "REPOSITORY" | "PITCH"; createdAt: string;
    author: { id: string; name: string | null; image: string | null };
    _count: { stars: number; comments: number };
};

export default function UserPage() {
    const { id } = useParams<{ id: string }>();
    const { data: session } = useSession();
    const [user, setUser] = useState<UserData | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [starredPosts, setStarredPosts] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Fetch all posts, then filter by this user
        fetch("/api/posts").then(r => r.json()).then((all: Post[]) => {
            const userPosts = all.filter(p => p.author.id === id);
            if (userPosts.length > 0) {
                const a = userPosts[0].author;
                setUser({ id: a.id, name: a.name, image: a.image, bio: null });
            }
            setPosts(userPosts);
            setLoading(false);
        });
    }, [id]);

    const handleStar = useCallback(async (postId: string) => {
        if (!session) return;
        const res = await fetch(`/api/posts/${postId}/star`, { method: "POST" });
        const data = await res.json();
        setStarredPosts(prev => { const n = new Set(prev); data.starred ? n.add(postId) : n.delete(postId); return n; });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, _count: { ...p._count, stars: p._count.stars + (data.starred ? 1 : -1) } } : p));
    }, [session]);

    const isOwnProfile = session?.user?.id === id;

    return (
        <div className={styles.page}>
            {user && (
                <div className={styles.profileHeader}>
                    <div className={styles.avatar}>
                        {user.image
                            ? <Image src={user.image} alt={user.name || ""} fill style={{ objectFit: "cover" }} />
                            : <span>{user.name?.[0] || "?"}</span>
                        }
                    </div>
                    <h1 className={styles.name}>{user.name || "Developer"}</h1>
                    {!isOwnProfile && session && (
                        <Link href={`/messages?with=${id}`} className={styles.dmBtn}>
                            <MessageCircle size={16} /> Message
                        </Link>
                    )}
                </div>
            )}
            <div className={styles.posts}>
                {loading ? <p className={styles.loading}>Loading…</p> : posts.map(p => (
                    <FeedCard key={p.id} id={p.id} title={p.title} description={p.description} url={p.url}
                        tags={p.tags} type={p.type} author={p.author} starsCount={p._count.stars}
                        commentsCount={p._count.comments} createdAt={p.createdAt}
                        starredByMe={starredPosts.has(p.id)} onStar={handleStar} />
                ))}
            </div>
        </div>
    );
}
