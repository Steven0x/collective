export type Craft = "design" | "textile" | "photo" | "sound" | "make";

export interface Artist {
  id: string;
  slug: string;
  name: string;
  roles: string[];
  primary_craft: Craft;
  city: string;
  country: string;
  lat: number;
  lng: number;
  bio: string;
  availability: "open" | "limited" | "booked";
  default_license: "closed" | "attribution" | "attribution_royalty";
  portrait: string;
  joined_at: string;
  socials: { instagram: string };
}

export interface Work {
  id: string;
  slug: string;
  type: "garment" | "pattern" | "technique" | "photo" | "track";
  title: string;
  owner_id: string;
  lat: number;
  lng: number;
  city: string;
  year: number;
  description: string;
  media: string[];
  price_usd: number | null;
  drop_id: string | null;
  license: string;
}

export interface Contribution {
  id: string;
  work_id: string;
  contributor_id: string;
  role: string;
  source_work_id: string | null;
  split_pct: number;
  status: "confirmed" | "pending" | "declined";
  confirmed_at: string;
}

export interface Influence {
  id: string;
  work_id: string;
  place: string;
  lat: number;
  lng: number;
  era: string;
  tradition: string;
  note: string;
}

export interface TimelineEvent {
  id: string;
  work_id: string;
  stage: string;
  date: string;
  city: string;
  lat: number;
  lng: number;
  contribution_id: string | null;
  media: string | null;
}

export interface Drop {
  id: string;
  name: string;
  opens: string;
  closes: string;
  status: "fulfilled" | "in_production" | "preorder_open";
  goal_units: number;
}

export interface Order {
  id: string;
  collector_id: string;
  work_id: string;
  drop_id: string;
  qty: number;
  unit_price_usd: number;
  total_usd: number;
  status: string;
  placed_at: string;
}

export interface LedgerRow {
  id: string;
  contribution_id: string;
  artist_id: string;
  work_id: string;
  order_id: string | null;
  license_id: string | null;
  amount_usd: number;
  currency: string;
  status: "paid" | "accrued";
  created_at: string;
}

export interface License {
  id: string;
  source_work_id: string;
  licensee_id: string;
  scope: string;
  royalty_pct: number;
  status: string;
  signed_at: string | null;
}

export interface Pin {
  artist_id: string;
  name: string;
  craft: Craft;
  city: string;
  lat: number;
  lng: number;
  work_count: number;
}

export interface LineageNode {
  contribution_id?: string;
  influence_id?: string;
  artist_id?: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  split_pct?: number;
  source_work_id?: string | null;
  era?: string;
  place?: string;
}

export interface LineageArc {
  from: [number, number];
  to: [number, number];
  type: string;
  contribution_id?: string;
  influence_id?: string;
}

export interface Lineage {
  work_id: string;
  nodes: LineageNode[];
  arcs: LineageArc[];
  timeline: TimelineEvent[];
  derivatives: string[];
}
