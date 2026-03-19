"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import FeedCard from "@/components/FeedCard/FeedCard";
import TrendingCard from "@/components/TrendingCard/TrendingCard";
import { TrendingUp, Rss, Plus, Sun, Moon } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";
import { useTheme } from "@/components/ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("trending");
  const [trending, setTrending] = useState<TrendingRepo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [starredPosts, setStarredPosts] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 10;

  const loadTrending = useCallback(() => {
    setLoading(true);
    fetch("/api/trending")
      .then(r => r.json())
      .then(d => { 
        setTrending(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        setTrending([]);
        setLoading(false);
      });
  }, []);

  const loadPostsPage = useCallback(async (pageToLoad: number, replace = false) => {
    if (pageToLoad === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let currentPage = pageToLoad;
      let combined: Post[] = [];
      let lastBatchCount = 0;
      let attempts = 0;

      while (attempts < 5) {
        const res = await fetch(`/api/posts?type=REPOSITORY&page=${currentPage}&limit=${pageSize}`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        lastBatchCount = items.length;
        const filtered = await filterPostsWithImages(items);
        combined = combined.concat(filtered);

        if (combined.length > 0 || items.length < pageSize) {
          break;
        }

        currentPage += 1;
        attempts += 1;
      }

      setPosts(prev => {
        if (replace) return combined;
        if (allowDuplicates) return [...prev, ...combined];
        const seen = new Set(prev.map(p => p.id));
        const merged = [...prev];
        for (const item of combined) {
          if (!seen.has(item.id)) {
            merged.push(item);
          }
        }
        return merged;
      });

      if (lastBatchCount === pageSize) {
        setHasMore(true);
      } else {
        // Circular fetch: wrap to page 1 after reaching the end.
        setAllowDuplicates(true);
        setHasMore(true);
        if (pageToLoad !== 1) {
          setPage(1);
        }
      }

      if (currentPage !== pageToLoad) {
        setPage(currentPage);
      }
    } catch {
      if (replace) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "trending") {
      loadTrending();
      return;
    }
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setAllowDuplicates(false);
  }, [tab, loadTrending]);

  useEffect(() => {
    if (tab !== "feed") return;
    loadPostsPage(page, page === 1);
  }, [tab, page, loadPostsPage]);

  useEffect(() => {
    if (tab !== "feed") return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, hasMore, loadingMore, loading]);

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
          <span className="text-gradient">OpenPulse</span>
        </div>
        <div className={styles.headerActions}>
          {session && (
            <Link href="/post/new" className={styles.newPostBtn}>
              <Plus size={18} /> Post
            </Link>
          )}
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
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
          <>
            {posts.map(post => (
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
            ))}
            {loadingMore && <div className={styles.loadMore}>Loading more…</div>}
            <div ref={sentinelRef} className={styles.sentinel} />
          </>
        )}
      </div>
    </div>
  );
}

function filterPostsWithImages(items: Post[]) {
  return Promise.all(items.map(async (post) => {
    if (!post.author?.image) return null;
    const ok = await loadImage(post.author.image);
    return ok ? post : null;
  })).then(list => list.filter((p): p is Post => p !== null));
}

function loadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    const img = new Image();
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = src;
    if (img.complete) finish(true);
  });
}
