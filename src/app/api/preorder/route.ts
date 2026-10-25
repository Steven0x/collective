import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { useSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { emails } from "@/lib/email";
import { workById } from "@/lib/data";

// Mock checkout. When Stripe lands, this becomes: create Checkout Session → redirect;
// and the webhook handler calls the same place_preorder RPC with the session id.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { workId, qty = 1, email, name, city } = body ?? {};
  if (!workId || !email || !name) return NextResponse.json({ error: "workId, email, name required" }, { status: 400 });
  if (!useSupabase()) return NextResponse.json({ error: "Preorders need Supabase (DATA_SOURCE=json is read-only)" }, { status: 503 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 503 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc("place_preorder", {
    p_work_id: workId, p_qty: Number(qty), p_email: email, p_name: name, p_city: city ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/shop"); revalidatePath("/");
  const w = await workById(workId);
  emails.orderConfirmed(email, name, w?.title ?? workId, Number(qty), Number(data.total_usd), data.order_id).catch(() => {});
  return NextResponse.json(data);
}
