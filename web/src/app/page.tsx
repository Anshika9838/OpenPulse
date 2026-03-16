"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import FeedCard from "@/components/FeedCard/FeedCard";
import TrendingCard from "@/components/TrendingCard/TrendingCard";
import { TrendingUp, Rss, Plus } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

type Post = {
  id: string; title?: string; description?: string; url?: string;
  tags?: string; type: "REPOSITORY" | "PITCH"; createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  _count: { stars: number; comments: number };
};
type TrendingRepo = { id: number; fullName: string; description?: string; url: string; stars: number; forks: number; language?: string; owner: { login: string; avatar: string }; ogImage: string };

type Tab = "trending" | "feed";

export default function HomePage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("trending");
  const [trending, setTrending] = useState<TrendingRepo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [starredPosts, setStarredPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tab === "trending") {
      setLoading(true);
      fetch("/api/trending").then(r => r.json()).then(d => { setTrending(d); setLoading(false); });
    } else {
      setLoading(true);
      fetch("/api/posts?type=REPOSITORY").then(r => r.json()).then(d => { setPosts(d); setLoading(false); });
    }
  }, [tab]);

  const handleStar = useCallback(async (postId: string) => {
    if (!session) return;
    const res = await fetch(`/api/posts/${postId}/star`, { method: "POST" });
    const data = await res.json();
    setStarredPosts(prev => {
      const next = new Set(prev);
      data.starred ? next.add(postId) : next.delete(postId);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, _count: { ...p._count, stars: p._count.stars + (data.starred ? 1 : -1) } } : p));
  }, [session]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.title}>
          <span className="text-gradient">DevPulse</span>
        </div>
        {session && (
          <Link href="/post/new" className={styles.newPostBtn}>
            <Plus size={18} /> Post
          </Link>
        )}
      </header>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "trending" ? styles.activeTab : ""}`} onClick={() => setTab("trending")}>
          <TrendingUp size={16} /> Trending
        </button>
        <button className={`${styles.tab} ${tab === "feed" ? styles.activeTab : ""}`} onClick={() => setTab("feed")}>
          <Rss size={16} /> Feed
        </button>
      </div>

      <div className={styles.feed}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : tab === "trending" ? (
          <div className={styles.trendingGrid}>
            {trending.map(repo => <TrendingCard key={repo.id} {...repo} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <p>No posts yet.</p>
            {session && <Link href="/post/new" className="btn-primary">Be the first!</Link>}
            {!session && <Link href="/signin" className="btn-primary">Sign in to get started</Link>}
          </div>
        ) : (
          posts.map(post => (
            <FeedCard
              key={post.id}
              id={post.id}
              title={post.title}
              description={post.description}
              url={post.url}
              tags={post.tags}
              type={post.type}
              author={post.author}
              starsCount={post._count.stars}
              commentsCount={post._count.comments}
              createdAt={post.createdAt}
              starredByMe={starredPosts.has(post.id)}
              onStar={handleStar}
            />
          ))
        )}
      </div>
    </div>
  );
}
