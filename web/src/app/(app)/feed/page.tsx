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
type TrendingRepo = { id: number; fullName: string; description?: string; url: string; stars: number; forks: number; language?: string; owner: { login: string; avatar: string }; ogImage?: string | null };

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
  const [trendingPage, setTrendingPage] = useState(1);
  const [trendingHasMore, setTrendingHasMore] = useState(true);
  const [trendingLoadingMore, setTrendingLoadingMore] = useState(false);
  const [starredPosts, setStarredPosts] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const trendingSentinelRef = useRef<HTMLDivElement | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const nextPageRef = useRef(2);
  const latestCreatedAtRef = useRef<string | null>(null);
  const pageSize = 10;

  const loadTrendingPage = useCallback(async (pageToLoad: number, replace = false) => {
    if (pageToLoad === 1) {
      setLoading(true);
    } else {
      setTrendingLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/trending?page=${pageToLoad}&limit=10`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setTrending(prev => replace ? items : [...prev, ...items.filter((r: TrendingRepo) => !prev.some(p => p.id === r.id))]);
      setTrendingHasMore(Boolean(data?.hasMore));
    } catch {
      if (replace) setTrending([]);
      setTrendingHasMore(false);
    } finally {
      setLoading(false);
      setTrendingLoadingMore(false);
    }
  }, []);

  const loadPostsPage = useCallback(async (pageToLoad: number, replace = false) => {
    if (pageToLoad === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      if (replace) {
        seenIdsRef.current = new Set();
        nextPageRef.current = 2;
      }
      const startPage = pageToLoad;
      let currentPage = pageToLoad;
      let combined: Post[] = [];
      let lastBatchCount = 0;
      let attempts = 0;
      let looped = false;

      while (attempts < 50) {
        const res = await fetch(`/api/posts?type=REPOSITORY&page=${currentPage}&limit=${pageSize}`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        lastBatchCount = items.length;
        const filtered = await filterPostsWithImages(items);

        const unseen = filtered.filter(item => !seenIdsRef.current.has(item.id));
        combined = combined.concat(unseen);

        if (combined.length > 0) {
          break;
        }

        if (items.length < pageSize) {
          // End reached, wrap to page 1.
          if (currentPage === 1 || currentPage === startPage) {
            looped = true;
            break;
          }
          currentPage = 1;
          if (currentPage === startPage) {
            looped = true;
            break;
          }
        } else {
          currentPage += 1;
          if (currentPage === startPage) {
            looped = true;
            break;
          }
        }

        attempts += 1;
      }

      setPosts(prev => {
        const seen = seenIdsRef.current;
        const merged = replace ? [] : [...prev];
        for (const item of combined) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        const latest = getLatestCreatedAt(merged);
        if (latest) latestCreatedAtRef.current = latest;
        return merged;
      });

      // Compute next page for the next scroll tick.
      if (lastBatchCount < pageSize) {
        nextPageRef.current = 1;
      } else {
        nextPageRef.current = currentPage + 1;
      }

      if (combined.length === 0 && looped) {
        setHasMore(false);
      } else {
        setHasMore(true);
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
      setTrending([]);
      setTrendingPage(1);
      setTrendingHasMore(true);
      return;
    }
    setPosts([]);
    setPage(1);
    setHasMore(true);
    seenIdsRef.current = new Set();
    nextPageRef.current = 2;
    latestCreatedAtRef.current = null;
  }, [tab]);

  useEffect(() => {
    if (tab !== "trending") return;
    loadTrendingPage(trendingPage, trendingPage === 1);
  }, [tab, trendingPage, loadTrendingPage]);

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
          setPage(nextPageRef.current);
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, hasMore, loadingMore, loading]);

  useEffect(() => {
    if (tab !== "trending") return;
    const node = trendingSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && trendingHasMore && !trendingLoadingMore && !loading) {
          setTrendingPage(prev => prev + 1);
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [tab, trendingHasMore, trendingLoadingMore, loading]);

  useEffect(() => {
    if (tab !== "feed") return;
    const since = latestCreatedAtRef.current;
    const url = `/api/posts/stream?type=REPOSITORY${since ? `&since=${encodeURIComponent(since)}` : ""}`;
    const es = new EventSource(url);

    es.onmessage = async (event) => {
      try {
        const incoming = JSON.parse(event.data) as Post[];
        if (!Array.isArray(incoming) || incoming.length === 0) return;
        const filtered = await filterPostsWithImages(incoming);
        if (filtered.length === 0) return;
        setPosts(prev => {
          const seen = seenIdsRef.current;
          const merged = [...filtered, ...prev.filter(p => !filtered.some(n => n.id === p.id))];
          for (const item of filtered) {
            seen.add(item.id);
          }
          const latest = getLatestCreatedAt(merged);
          if (latest) latestCreatedAtRef.current = latest;
          return merged;
        });
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      es.close();
    };
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
          <div className={styles.loading}>Loading...</div>
        ) : tab === "trending" ? (
          <>
            <div className={styles.trendingGrid}>
              {trending.map(repo => <TrendingCard key={repo.id} {...repo} />)}
            </div>
            {trendingLoadingMore && <div className={styles.loadMore}>Loading more...</div>}
            <div ref={trendingSentinelRef} className={styles.sentinel} />
          </>
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

function getLatestCreatedAt(items: Post[]): string | null {
  if (items.length === 0) return null;
  let latest = items[0].createdAt;
  for (const item of items) {
    if (new Date(item.createdAt).getTime() > new Date(latest).getTime()) {
      latest = item.createdAt;
    }
  }
  return latest;
}
