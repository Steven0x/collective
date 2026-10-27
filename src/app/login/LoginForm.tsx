"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginForm({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(null);
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }
  if (sent) return <p className="mono text-green">CHECK YOUR EMAIL. THE LINK SIGNS YOU IN ON THIS DEVICE.</p>;
  return (
    <form onSubmit={submit} className="space-y-3 mono">
      <input name="email" type="email" required placeholder="EMAIL" className="w-full bg-bg border border-line p-3" />
      {err && <div className="text-orange">ERR: {err}</div>}
      <button className="btn btn-green w-full" disabled={busy}>{busy ? "Sending…" : "Send magic link"}</button>
    </form>
  );
}
