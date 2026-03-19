import type { Metadata, Viewport } from "next";
import "../globals.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import BottomNav from "@/components/BottomNav/BottomNav";

export const metadata: Metadata = {
  title: { default: "OpenPulse", template: "%s | OpenPulse" },
  description: "The social platform for developers to share, connect, and grow.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="appShell">
      <Sidebar />
      <main className="mainContent">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
