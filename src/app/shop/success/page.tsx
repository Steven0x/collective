import Link from "next/link";
import { Window } from "@/components/ui";
export default async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <h1 className="display text-5xl mb-6">PREORDER<br />CONFIRMED<span className="text-magenta">_</span></h1>
      <Window title="RECEIPT" right="STRIPE">
        <p className="mono text-green">PAYMENT RECEIVED. YOUR ORDER APPEARS IN YOUR ACCOUNT ONCE STRIPE'S WEBHOOK LANDS (SECONDS).</p>
        {session_id && <p className="mono text-muted mt-2">SESSION {session_id.slice(0, 24)}…</p>}
        <p className="mono text-muted mt-2">EVERY CONFIRMED CONTRIBUTOR ON THIS GARMENT JUST ACCRUED THEIR SPLIT IN THE PUBLIC LEDGER.</p>
        <div className="flex gap-2 mt-4"><Link href="/me" className="btn btn-green">My account</Link><Link href="/map" className="btn">Back to the map</Link></div>
      </Window>
    </div>
  );
}
