"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PreorderButton({ workId, price, status }: { workId: string; price: number; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ order_id: string; total_usd: number; ledger_rows: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (status !== "preorder_open") {
    return (
      <button className="btn w-full mt-4 opacity-60 cursor-not-allowed" disabled>
        {status === "in_production" ? "Sold out · in production" : "Archive · join waitlist"}
      </button>
    );
  }
  if (result) {
    return (
      <div className="mt-4 mono border border-green p-3 text-green">
        ORDER {result.order_id.toUpperCase()} CONFIRMED · ${result.total_usd}<br />
        <span className="text-muted">{result.ledger_rows} LEDGER ROWS ACCRUED TO CONTRIBUTORS. (MOCK CHECKOUT — NO CHARGE.)</span>
      </div>
    );
  }
  if (!open) return <button className="btn btn-green w-full mt-4" onClick={() => setOpen(true)}>Preorder · ${price}</button>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = JSON.stringify({ workId, qty, email: fd.get("email"), name: fd.get("name"), city: fd.get("city") });
    // Stripe first; if keys aren't configured, fall back to the mock checkout.
    const co = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: payload });
    if (co.ok) { const { url } = await co.json(); location.href = url; return; }
    const res = await fetch("/api/preorder", { method: "POST", headers: { "content-type": "application/json" }, body: payload });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(j.error ?? "failed"); return; }
    setResult(j); router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 mono space-y-2 border-t border-line pt-3">
      <div className="flex justify-between text-muted"><span>CHECKOUT</span><span>STRIPE IF CONFIGURED · ELSE MOCK</span></div>
      <input name="name" required placeholder="NAME" className="w-full bg-bg border border-line p-2" />
      <input name="email" type="email" required placeholder="EMAIL" className="w-full bg-bg border border-line p-2" />
      <input name="city" placeholder="CITY" className="w-full bg-bg border border-line p-2" />
      <div className="flex items-center gap-2">
        <span>QTY</span>
        <button type="button" className="border border-line px-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
        <span>{qty}</span>
        <button type="button" className="border border-line px-2" onClick={() => setQty(Math.min(5, qty + 1))}>+</button>
        <span className="ml-auto">TOTAL ${price * qty}</span>
      </div>
      {err && <div className="text-orange">ERR: {err}</div>}
      <button className="btn btn-green w-full" disabled={busy}>{busy ? "Placing…" : `Confirm preorder · $${price * qty}`}</button>
    </form>
  );
}
