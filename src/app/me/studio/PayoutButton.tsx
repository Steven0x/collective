"use client";
import { useState } from "react";
export default function PayoutButton({ connected }: { connected: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function go() {
    const r = await fetch("/api/connect", { method: "POST" });
    const j = await r.json();
    if (r.ok) location.href = j.url; else setMsg(j.error === "stripe_disabled" ? "STRIPE NOT CONFIGURED YET — PAYOUTS RUN MANUALLY FROM THE LEDGER." : `ERR: ${j.error}`);
  }
  return (
    <div className="mt-3">
      <button onClick={go} className="btn py-1 text-[10px]">{connected ? "Update payout details" : "Set up payouts (Stripe)"}</button>
      {msg && <div className="mono text-muted mt-2">{msg}</div>}
    </div>
  );
}
