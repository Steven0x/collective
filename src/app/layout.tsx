import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/supabase-server";
import { useSupabase } from "@/lib/supabase";


export const metadata: Metadata = {
  title: "COLLECTIVE — artist-owned fashion ecosystem",
  description:
    "Where culture inspires collaboration, garments are made with intention, and every contributor shares in the value they create.",
};

const NAV = [
  ["/map", "Map"],
  ["/artists", "Artists"],
  ["/collaborate", "Collaborate"],
  ["/shop", "Shop"],
  ["/about", "About"],
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = useSupabase() ? (await currentUser()).profile : null;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=Space+Grotesk:wght@400;500&family=Noto+Sans+KR:wght@700&family=Noto+Sans+JP:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-magenta/40 sticky top-0 z-40 bg-bg/85 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="display text-xl tracking-tight">
              COLLECTIVE<span className="text-magenta">_</span>
            </Link>
            <nav className="nav text-xs flex gap-6">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-yellow">
                  {label}
                </Link>
              ))}
              {profile ? (
                <Link href={profile.role === "curator" ? "/admin" : profile.artist_id ? "/me/studio" : "/me"} className="text-yellow hover:text-ink">
                  [ {profile.role === "curator" ? "curator" : profile.artist_id ? "studio" : "account"} ]
                </Link>
              ) : (
                <Link href="/login" className="text-muted hover:text-ink">[ login ]</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-7xl px-4 py-8 flex flex-wrap gap-6 justify-between mono text-muted">
            <span>© 2026 COLLECTIVE · ARTIST-OWNED · V0.4</span>
            <span className="flex gap-4">
              <Link href="/about#licensing">LICENSING</Link>
              <Link href="/about#faq">FAQ</Link>
              <span>TERMS</span>
              <span>PRIVACY</span>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
