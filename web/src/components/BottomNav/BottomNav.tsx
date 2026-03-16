"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Video, MessageCircle, User } from "lucide-react";
import styles from "./BottomNav.module.css";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/pitch", icon: Video, label: "Pitch" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
    const pathname = usePathname();
    return (
        <nav className={styles.nav}>
            {navItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                    <Link key={href} href={href} className={`${styles.item} ${active ? styles.active : ""}`} aria-label={label}>
                        <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                        <span className={styles.label}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
