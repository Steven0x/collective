import { currentUser } from "@/lib/supabase-server";

// Monthly payout export: one row per accrued ledger entry, grouped by artist in the sheet.
export async function GET() {
  const { sb, profile } = await currentUser();
  if (profile?.role !== "curator") return new Response("curators only", { status: 403 });
  const { data, error } = await sb.from("royalty_ledger")
    .select("id, created_at, artist_id, artists(name, city, country), work_id, works(title), contribution_id, order_id, amount_usd, currency, status")
    .eq("status", "accrued").order("artist_id").order("created_at");
  if (error) return new Response(error.message, { status: 500 });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["ledger_id", "date", "artist_id", "artist", "city", "country", "work", "contribution_id", "order_id", "amount_usd", "currency", "status"];
  const rows = (data ?? []).map((r: any) => [r.id, r.created_at, r.artist_id, r.artists?.name, r.artists?.city, r.artists?.country, r.works?.title, r.contribution_id, r.order_id, r.amount_usd, r.currency, r.status].map(esc).join(","));
  const csv = [head.join(","), ...rows].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": `attachment; filename="royalties-accrued-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
