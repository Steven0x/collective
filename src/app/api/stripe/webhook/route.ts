import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, stripeEnabled } from "@/lib/stripe";

// Stripe → place_preorder(). Idempotent: an order with this session id is never written twice.
export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "stripe_disabled" }, { status: 503 });
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event;
  try { event = stripe().webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return NextResponse.json({ error: `bad signature: ${(e as Error).message}` }, { status: 400 }); }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data: existing } = await admin.from("orders").select("id").eq("stripe_session_id", s.id).maybeSingle();
    if (!existing) {
      const m = s.metadata ?? {};
      const { error } = await admin.rpc("place_preorder", {
        p_work_id: m.work_id, p_qty: Number(m.qty ?? 1), p_email: s.customer_details?.email ?? s.customer_email,
        p_name: m.name || s.customer_details?.name || "Collector", p_city: m.city || null, p_stripe_session: s.id,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
