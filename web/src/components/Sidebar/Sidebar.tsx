"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Video, MessageCircle, User, Code2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./Sidebar.module.css";

const navItems = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/pitch", icon: Video, label: "Pitch" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    return (
        <aside className={styles.sidebar}>
            <Link href="/feed" className={styles.logo}>
                <Code2 size={28} />
                <span>OpenPulse</span>
            </Link>
            <nav className={styles.nav}>
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || (href === "/feed" && pathname === "/");
                    return (
                        <Link key={href} href={href} className={`${styles.item} ${active ? styles.active : ""}`} title={label}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
            <button className={styles.themeToggle} onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? (
                    <Sun size={20} />
                ) : (
                    <Moon size={20} />
                )}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
        </aside>
    );
}
