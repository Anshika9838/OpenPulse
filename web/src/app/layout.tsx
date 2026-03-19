import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: { default: "OpenPulse", template: "%s | OpenPulse" },
  description: "A developer-oriented social media platform by Team Paradox. Explore projects, chat, and connect.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0e27",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SessionWrapper>
            {children}
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
