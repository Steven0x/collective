import { NextResponse } from "next/server";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { workById, fundingFor } from "@/lib/data";

// Creates a Stripe Checkout Session for a preorder. The order is only written when
// the webhook confirms payment (see /api/stripe/webhook). Without Stripe keys the
// client falls back to /api/preorder (mock).
export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "stripe_disabled" }, { status: 503 });
  const { workId, qty = 1, email, name, city } = await req.json();
  const [w, f] = await Promise.all([workById(workId), fundingFor(workId)]);
  if (!w || w.type !== "garment" || !w.price_usd) return NextResponse.json({ error: "unknown garment" }, { status: 400 });
  if (f.status !== "preorder_open") return NextResponse.json({ error: "preorder closed" }, { status: 400 });
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{ quantity: Math.min(5, Math.max(1, Number(qty))), price_data: {
      currency: "usd", unit_amount: Math.round(w.price_usd * 100),
      product_data: { name: w.title, description: `Preorder · ${w.city} · ships ~90 days after drop closes`, images: w.media?.filter((m) => m.startsWith("http")).slice(0, 1) },
    } }],
    metadata: { work_id: w.id, name: name ?? "", city: city ?? "", qty: String(qty) },
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/${w.slug}`,
  });
  return NextResponse.json({ url: session.url });
}
