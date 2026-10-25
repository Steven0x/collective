import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@/lib/supabase-server";
import { emails } from "@/lib/email";

// Client components call this after an RPC succeeds. Server re-derives recipients from the DB,
// so a caller can only trigger emails about rows they are actually party to.
export async function POST(req: Request) {
  const { sb, user, profile } = await currentUser();
  if (!user || !profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { event, id } = await req.json();
  const admin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : sb;

  if (event === "profile_submitted" && profile.artist_id) {
    const { data: a } = await sb.from("artists").select("name").eq("id", profile.artist_id).single();
    await emails.profileSubmitted(profile.email, a?.name ?? profile.display_name);
  } else if (event === "profile_approved" && profile.role === "curator") {
    const { data: a } = await admin.from("artists").select("name, slug, user_id").eq("id", id).single();
    const { data: p } = a?.user_id ? await admin.from("profiles").select("email").eq("user_id", a.user_id).single() : { data: null };
    if (p?.email) await emails.profileApproved(p.email, a!.name, a!.slug);
  } else if (event === "credit_accepted" && profile.artist_id) {
    const { data: c } = await admin.from("contributions").select("role, work_id, works(title, owner_id), artists:contributor_id(name)").eq("id", id).eq("contributor_id", profile.artist_id).single();
    const owner = c ? await admin.from("artists").select("user_id").eq("id", (c as any).works.owner_id).single() : null;
    const p = owner?.data?.user_id ? await admin.from("profiles").select("email").eq("user_id", owner.data.user_id).single() : null;
    if (p?.data?.email && c) await emails.creditAccepted(p.data.email, (c as any).artists.name, c.role, (c as any).works.title);
  } else if (event === "work_published" && profile.artist_id) {
    const { data: cs } = await admin.from("contributions").select("role, split_pct, contributor_id, works(title), artists:contributor_id(name, user_id)").eq("work_id", id).eq("status", "pending");
    const { data: me } = await sb.from("artists").select("name").eq("id", profile.artist_id).single();
    for (const c of cs ?? []) {
      const uid = (c as any).artists?.user_id; if (!uid) continue;
      const { data: p } = await admin.from("profiles").select("email").eq("user_id", uid).single();
      if (p?.email) await emails.credited(p.email, (c as any).artists.name, me?.name ?? "An artist", c.role, Number(c.split_pct), (c as any).works.title);
    }
  }
  return NextResponse.json({ ok: true });
}
