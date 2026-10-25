// JSON seed fallback (used when DATA_SOURCE=json or no Supabase env).
import artistsJson from "@/data/artists.json";
import worksJson from "@/data/works.json";
import contributionsJson from "@/data/contributions.json";
import influencesJson from "@/data/influences.json";
import timelineJson from "@/data/timeline_events.json";
import dropsJson from "@/data/drops.json";
import ordersJson from "@/data/orders.json";
import ledgerJson from "@/data/royalty_ledger.json";
import licensesJson from "@/data/licenses.json";
import pinsJson from "@/data/map_pins.json";
import lineageJson from "@/data/map_lineage.json";
import type { Artist, Work, Contribution, Influence, TimelineEvent, Drop, Order, LedgerRow, License, Pin, Lineage } from "./types";

export const artists = artistsJson as Artist[];
export const works = worksJson as Work[];
export const contributions = contributionsJson as Contribution[];
export const influences = influencesJson as Influence[];
export const timeline = timelineJson as TimelineEvent[];
export const drops = dropsJson as Drop[];
export const orders = ordersJson as Order[];
export const ledger = ledgerJson as LedgerRow[];
export const licenses = licensesJson as License[];
export const pins = pinsJson as Pin[];
export const lineages = lineageJson as unknown as Record<string, Lineage>;
