"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Link as LinkIcon, Tag } from "lucide-react";
import styles from "./page.module.css";

export default function NewPostPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({ title: "", description: "", url: "", tags: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!session) { router.push("/signin"); return null; }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
            const res = await fetch("/api/posts", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, tags, type: "REPOSITORY" }),
            });
            if (!res.ok) throw new Error("Failed to create post");
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}><h1 className={styles.title}>Share a Repo</h1></header>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                    <label className={styles.label}>Repository Name</label>
                    <input className={styles.input} type="text" placeholder="my-awesome-project" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <textarea className={styles.textarea} rows={4} placeholder="What does this project do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}><LinkIcon size={14} /> GitHub URL</label>
                    <input className={styles.input} type="url" placeholder="https://github.com/user/repo" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}><Tag size={14} /> Tags</label>
                    <input className={styles.input} type="text" placeholder="React, TypeScript, Open Source" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? "Posting…" : "Post Repository"}
                </button>
            </form>
        </div>
    );
}
