"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Video, MessageCircle, User, Code2 } from "lucide-react";
import styles from "./Sidebar.module.css";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/pitch", icon: Video, label: "Pitch" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
];

export default function Sidebar() {
    const pathname = usePathname();
    return (
        <aside className={styles.sidebar}>
            <Link href="/" className={styles.logo}>
                <Code2 size={28} />
                <span>DevPulse</span>
            </Link>
            <nav className={styles.nav}>
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href} className={`${styles.item} ${active ? styles.active : ""}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
