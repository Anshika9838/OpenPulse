import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import BottomNav from "@/components/BottomNav/BottomNav";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: { default: "DevPulse", template: "%s | DevPulse" },
  description: "A PWA platform for developers — share repos, pitch ideas, and connect with the community.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>
          <div className="appShell">
            <Sidebar />
            <main className="mainContent">
              {children}
            </main>
            <BottomNav />
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
