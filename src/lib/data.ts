// Data access layer. Every function is async and reads Supabase when
// NEXT_PUBLIC_SUPABASE_URL is set (and DATA_SOURCE != "json"); otherwise it
// reads the JSON seed in src/data. Pages only ever import from here.
import { supabase, useSupabase } from "./supabase";
import * as J from "./json";
import type {
  Artist, Work, Contribution, Influence, TimelineEvent, Drop, Order,
  LedgerRow, License, Pin, Lineage,
} from "./types";

export { CRAFT_COLOR, ROLE_COLOR } from "./colors";

type Earnings = { paid: number; accrued: number };
type Funding = { units: number; goal: number; status: string };

async function rows<T>(table: string, build?: (q: any) => any): Promise<T[]> {
  let q: any = supabase().from(table).select("*");
  if (build) q = build(q);
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as T[];
}
async function one<T>(table: string, build: (q: any) => any): Promise<T | undefined> {
  const { data, error } = await build(supabase().from(table).select("*")).maybeSingle();
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? undefined) as T | undefined;
}

// ---------- collections ----------
export const allArtists = (): Promise<Artist[]> =>
  useSupabase() ? rows<Artist>("artists", (q) => q.order("name")) : Promise.resolve(J.artists);
export const allWorks = (): Promise<Work[]> =>
  useSupabase() ? rows<Work>("works") : Promise.resolve(J.works);
export const garments = (): Promise<Work[]> =>
  useSupabase() ? rows<Work>("works", (q) => q.eq("type", "garment")) : Promise.resolve(J.works.filter((w) => w.type === "garment"));
export const allDrops = (): Promise<Drop[]> =>
  useSupabase() ? rows<Drop>("drops", (q) => q.order("opens")) : Promise.resolve(J.drops);
export const allLicenses = (): Promise<License[]> =>
  useSupabase() ? rows<License>("licenses") : Promise.resolve(J.licenses);
export const allOrders = (): Promise<Order[]> =>
  useSupabase() ? rows<Order>("orders") : Promise.resolve(J.orders);

// ---------- lookups ----------
export const artistById = (id: string) =>
  useSupabase() ? one<Artist>("artists", (q) => q.eq("id", id)) : Promise.resolve(J.artists.find((a) => a.id === id));
export const artistBySlug = (slug: string) =>
  useSupabase() ? one<Artist>("artists", (q) => q.eq("slug", slug)) : Promise.resolve(J.artists.find((a) => a.slug === slug));
export const workById = (id: string) =>
  useSupabase() ? one<Work>("works", (q) => q.eq("id", id)) : Promise.resolve(J.works.find((w) => w.id === id));
export const workBySlug = (slug: string) =>
  useSupabase() ? one<Work>("works", (q) => q.eq("slug", slug)) : Promise.resolve(J.works.find((w) => w.slug === slug));
export const dropById = (id: string) =>
  useSupabase() ? one<Drop>("drops", (q) => q.eq("id", id)) : Promise.resolve(J.drops.find((d) => d.id === id));

// ---------- relations ----------
export const contributionsFor = (workId: string): Promise<Contribution[]> =>
  useSupabase() ? rows("contributions", (q) => q.eq("work_id", workId).order("split_pct", { ascending: false }))
    : Promise.resolve(J.contributions.filter((c) => c.work_id === workId));
export const contributionsBy = (artistId: string): Promise<Contribution[]> =>
  useSupabase() ? rows("contributions", (q) => q.eq("contributor_id", artistId))
    : Promise.resolve(J.contributions.filter((c) => c.contributor_id === artistId));
export const worksBy = (artistId: string): Promise<Work[]> =>
  useSupabase() ? rows("works", (q) => q.eq("owner_id", artistId)) : Promise.resolve(J.works.filter((w) => w.owner_id === artistId));
export const timelineFor = (workId: string): Promise<TimelineEvent[]> =>
  useSupabase() ? rows("timeline_events", (q) => q.eq("work_id", workId).order("date"))
    : Promise.resolve(J.timeline.filter((t) => t.work_id === workId).sort((a, b) => a.date.localeCompare(b.date)));
export const ledgerFor = (workId: string): Promise<LedgerRow[]> =>
  useSupabase() ? rows("royalty_ledger", (q) => q.eq("work_id", workId)) : Promise.resolve(J.ledger.filter((l) => l.work_id === workId));
export const ledgerBy = (artistId: string, limit = 8): Promise<LedgerRow[]> =>
  useSupabase() ? rows("royalty_ledger", (q) => q.eq("artist_id", artistId).order("created_at", { ascending: false }).limit(limit))
    : Promise.resolve(J.ledger.filter((l) => l.artist_id === artistId).sort((x, y) => y.created_at.localeCompare(x.created_at)).slice(0, limit));
export const licensesForWorks = (workIds: string[]): Promise<License[]> =>
  workIds.length === 0 ? Promise.resolve([]) :
  useSupabase() ? rows("licenses", (q) => q.in("source_work_id", workIds)) : Promise.resolve(J.licenses.filter((l) => workIds.includes(l.source_work_id)));
export const influencesFor = (workId: string): Promise<Influence[]> =>
  useSupabase() ? rows("influences", (q) => q.eq("work_id", workId)) : Promise.resolve(J.influences.filter((i) => i.work_id === workId));

// ---------- aggregates ----------
export async function earningsFor(artistId: string): Promise<Earnings> {
  if (useSupabase()) {
    const r = await one<{ paid: number | null; accrued: number | null }>("artist_earnings", (q) => q.eq("artist_id", artistId));
    return { paid: Number(r?.paid ?? 0), accrued: Number(r?.accrued ?? 0) };
  }
  return J.ledger.filter((l) => l.artist_id === artistId).reduce(
    (acc, l) => ({ ...acc, [l.status]: acc[l.status] + l.amount_usd }), { paid: 0, accrued: 0 } as Earnings);
}
export async function fundingFor(workId: string): Promise<Funding> {
  if (useSupabase()) {
    const r = await one<{ units: number; goal: number | null; status: string | null }>("work_funding", (q) => q.eq("work_id", workId));
    return { units: Number(r?.units ?? 0), goal: r?.goal ?? 0, status: r?.status ?? "archive" };
  }
  const w = J.works.find((x) => x.id === workId);
  const d = w?.drop_id ? J.drops.find((x) => x.id === w.drop_id) : undefined;
  const units = J.orders.filter((o) => o.work_id === workId).reduce((s, o) => s + o.qty, 0);
  return { units, goal: d?.goal_units ?? 0, status: d?.status ?? "archive" };
}
export async function fundingMap(workIds: string[]): Promise<Record<string, Funding>> {
  const out: Record<string, Funding> = {};
  if (useSupabase()) {
    const rs = await rows<{ work_id: string; units: number; goal: number | null; status: string | null }>("work_funding", (q) => q.in("work_id", workIds));
    for (const r of rs) out[r.work_id] = { units: Number(r.units), goal: r.goal ?? 0, status: r.status ?? "archive" };
    return out;
  }
  for (const id of workIds) out[id] = await fundingFor(id);
  return out;
}

// ---------- map ----------
export const mapPins = (): Promise<Pin[]> =>
  useSupabase() ? rows<Pin>("map_pins") : Promise.resolve(J.pins);
export async function lineageFor(workId: string): Promise<Lineage | undefined> {
  if (useSupabase()) {
    const { data, error } = await supabase().rpc("lineage_json", { root: workId });
    if (error) throw new Error(`lineage_json: ${error.message}`);
    return data as Lineage;
  }
  return J.lineages[workId];
}
export async function allLineages(): Promise<Record<string, Lineage>> {
  if (!useSupabase()) return J.lineages;
  const gs = await garments();
  const entries = await Promise.all(gs.map(async (g) => [g.id, await lineageFor(g.id)] as const));
  return Object.fromEntries(entries.filter(([, l]) => l)) as Record<string, Lineage>;
}
