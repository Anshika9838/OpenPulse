"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, Link as LinkIcon, Tag, FileVideo } from "lucide-react";
import styles from "./page.module.css";

export default function NewPitchPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({ title: "", description: "", url: "", tags: "" });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    if (!session) { router.push("/signin"); return null; }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        setError("");
        try {
            let mediaUrl = "";
            if (videoFile) {
                const fd = new FormData();
                fd.append("file", videoFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
                mediaUrl = uploadData.url;
            }

            const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, tags, mediaUrl, type: "PITCH" }),
            });
            if (!res.ok) throw new Error("Failed to create pitch");
            router.push("/pitch");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}><h1 className={styles.title}>New Pitch 🎯</h1></header>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.videoUpload}>
                    <label className={styles.videoLabel} htmlFor="video">
                        {videoFile ? (
                            <span className={styles.fileName}><FileVideo size={18} /> {videoFile.name}</span>
                        ) : (
                            <span className={styles.uploadPlaceholder}><Upload size={24} />Upload pitch video (optional)</span>
                        )}
                    </label>
                    <input id="video" type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} hidden />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Title</label>
                    <input className={styles.input} type="text" placeholder="Your pitch title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Description</label>
                    <textarea className={styles.textarea} rows={4} placeholder="Describe your pitch…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}><LinkIcon size={14} /> GitHub / Demo URL</label>
                    <input className={styles.input} type="url" placeholder="https://github.com/…" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}><Tag size={14} /> Tags (comma-separated)</label>
                    <input className={styles.input} type="text" placeholder="React, AI, Open Source" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>

                {error && <p className={styles.error}>{error}</p>}
                <button type="submit" className={styles.submitBtn} disabled={uploading}>
                    {uploading ? "Uploading…" : "Post Pitch"}
                </button>
            </form>
        </div>
    );
}
