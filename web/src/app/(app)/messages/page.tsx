"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Send } from "lucide-react";
import styles from "./page.module.css";

type ConvUser = { id: string; name: string | null; image: string | null };
type Msg = { id: string; content: string; senderId: string; createdAt: string; sender: ConvUser };

function MessagesContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const otherUserId = searchParams.get("with");
    const [messages, setMessages] = useState<Msg[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (!session) router.push("/signin"); }, [session, router]);

    useEffect(() => {
        if (!otherUserId) return;
        const load = () => fetch(`/api/messages?otherUserId=${otherUserId}`).then(r => r.json()).then(setMessages);
        load();
        const interval = setInterval(load, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [otherUserId]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMsg.trim() || !otherUserId) return;
        setSending(true);
        await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: otherUserId, content: newMsg.trim() }) });
        setNewMsg("");
        setSending(false);
        fetch(`/api/messages?otherUserId=${otherUserId}`).then(r => r.json()).then(setMessages);
    };

    if (!otherUserId) {
        return (
            <div className={styles.page}>
                <header className={styles.header}><h1 className={styles.title}>Messages</h1></header>
                <div className={styles.noConv}><p>Select a conversation from a user profile to start chatting.</p></div>
            </div>
        );
    }

    return (
        <div className={styles.chatPage}>
            <header className={styles.chatHeader}>
                <button onClick={() => router.back()} className={styles.back}>←</button>
                <span className={styles.chatTitle}>Chat</span>
            </header>
            <div className={styles.messages}>
                {messages.map(msg => (
                    <div key={msg.id} className={`${styles.bubble} ${msg.senderId === session?.user?.id ? styles.mine : styles.theirs}`}>
                        <p>{msg.content}</p>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className={styles.inputBar}>
                <input className={styles.msgInput} type="text" placeholder="Message…" value={newMsg} onChange={e => setNewMsg(e.target.value)} />
                <button type="submit" className={styles.sendBtn} disabled={sending || !newMsg.trim()}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className={styles.noConv}><p>Loading chat…</p></div>}>
            <MessagesContent />
        </Suspense>
    );
}
