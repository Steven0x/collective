import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@/lib/supabase-server";
import { stripe, stripeEnabled } from "@/lib/stripe";

// Stripe Connect Express onboarding for payouts. Creates the account once, then returns a fresh onboarding link.
export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "stripe_disabled" }, { status: 503 });
  const { sb, user, profile } = await currentUser();
  if (!user || !profile?.artist_id) return NextResponse.json({ error: "artist only" }, { status: 403 });
  const { data: a } = await sb.from("artists").select("id, name, stripe_account_id, country_code").eq("id", profile.artist_id).single();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  let acct = a?.stripe_account_id;
  if (!acct) {
    const created = await stripe().accounts.create({ type: "express", email: profile.email, country: a?.country_code ?? undefined, metadata: { artist_id: a!.id } });
    acct = created.id;
    await admin.from("artists").update({ stripe_account_id: acct }).eq("id", a!.id);
  }
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = await stripe().accountLinks.create({ account: acct, type: "account_onboarding", refresh_url: `${origin}/me/studio?connect=refresh`, return_url: `${origin}/me/studio?connect=done` });
  return NextResponse.json({ url: link.url });
}
