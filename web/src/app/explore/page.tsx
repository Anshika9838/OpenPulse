"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import TrendingCard from "@/components/TrendingCard/TrendingCard";
import FeedCard from "@/components/FeedCard/FeedCard";
import styles from "./page.module.css";

type Post = {
    id: string; title?: string; description?: string; url?: string;
    tags?: string[]; type: "REPOSITORY" | "PITCH"; createdAt: string;
    author: { id: string; name: string | null; image: string | null };
    _count: { stars: number; comments: number };
};
type TrendingRepo = { id: number; fullName: string; description?: string; url: string; stars: number; forks: number; language?: string; owner: { login: string; avatar: string }; ogImage: string };

export default function ExplorePage() {
    const [query, setQuery] = useState("");
    const [trending, setTrending] = useState<TrendingRepo[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/trending").then(r => r.json()),
            fetch("/api/posts").then(r => r.json()),
        ]).then(([t, p]) => {
            setTrending(t);
            setPosts(p);
            setLoading(false);
        });
    }, []);

    const filteredTrending = trending.filter(r =>
        r.fullName.toLowerCase().includes(query.toLowerCase()) ||
        r.description?.toLowerCase().includes(query.toLowerCase())
    );
    const filteredPosts = posts.filter(p =>
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
    );

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Explore</h1>
                <div className={styles.searchBar}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search repos, posts, tags…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className={styles.input}
                    />
                </div>
            </header>

            <div className={styles.content}>
                {loading ? (
                    <p className={styles.loading}>Loading…</p>
                ) : (
                    <>
                        {(query === "" || filteredTrending.length > 0) && (
                            <section>
                                <h2 className={styles.sectionTitle}>🔥 Trending on GitHub</h2>
                                <div className={styles.grid}>
                                    {filteredTrending.slice(0, 6).map(r => <TrendingCard key={r.id} {...r} />)}
                                </div>
                            </section>
                        )}
                        {(query === "" || filteredPosts.length > 0) && (
                            <section>
                                <h2 className={styles.sectionTitle}>🌐 Community Posts</h2>
                                <div className={styles.list}>
                                    {filteredPosts.map(p => (
                                        <FeedCard key={p.id} id={p.id} title={p.title} description={p.description} url={p.url} tags={p.tags} type={p.type}
                                            author={p.author} starsCount={p._count.stars} commentsCount={p._count.comments} createdAt={p.createdAt} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
