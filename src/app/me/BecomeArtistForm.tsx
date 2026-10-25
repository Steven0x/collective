"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ROLES = [["designer", "Garment designer"], ["textile_artist", "Textile artist"], ["pattern_maker", "Pattern maker"],
  ["maker", "Maker / atelier"], ["photographer", "Photographer"], ["stylist", "Stylist"], ["musician", "Musician / sound"]];

export default function BecomeArtistForm() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [geo, setGeo] = useState<{ city: string; country: string; lat: number; lng: number } | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search() {
    if (!q) return;
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
    setHits(await r.json());
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(null);
    if (!roles.length) return setErr("pick at least one role");
    if (!geo) return setErr("pin your city");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabaseBrowser().rpc("become_artist", {
      p_name: fd.get("name"), p_roles: roles, p_city: geo.city, p_country: geo.country, p_lat: geo.lat, p_lng: geo.lng,
      p_bio: fd.get("bio"), p_license: fd.get("license"),
    });
    setBusy(false);
    if (error) return setErr(error.message);
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4 mono">
      <div>
        <div className="text-muted mb-1">01 ROLE(S)</div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(([k, v]) => (
            <button type="button" key={k} onClick={() => setRoles(roles.includes(k) ? roles.filter((r) => r !== k) : [...roles, k])}
              className={`border px-2 py-1 ${roles.includes(k) ? "bg-ink text-bg border-ink" : "border-line hover:border-green"}`}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-muted mb-1">02 PIN YOUR CITY</div>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="CITY, COUNTRY" className="flex-1 bg-bg border border-line p-2" />
          <button type="button" onClick={search} className="btn py-1">Search</button>
        </div>
        {hits.length > 0 && (
          <ul className="border border-line mt-1">
            {hits.map((h) => (
              <li key={h.place_id}>
                <button type="button" className="w-full text-left px-2 py-1 hover:bg-ink hover:text-bg"
                  onClick={() => { const parts = h.display_name.split(", "); setGeo({ city: parts[0], country: parts.at(-1), lat: +h.lat, lng: +h.lon }); setHits([]); }}>
                  {h.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {geo && <div className="text-green mt-1">PIN: {geo.city}, {geo.country} · {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}</div>}
      </div>
      <div>
        <div className="text-muted mb-1">03 NAME + BIO</div>
        <input name="name" required placeholder="STUDIO / ARTIST NAME" className="w-full bg-bg border border-line p-2 mb-2" />
        <textarea name="bio" required placeholder="ONE OR TWO LINES. WHAT YOU MAKE, HOW." className="w-full bg-bg border border-line p-2 h-20" />
      </div>
      <div>
        <div className="text-muted mb-1">04 DEFAULT LICENSE FOR YOUR WORK</div>
        <select name="license" className="w-full bg-bg border border-line p-2">
          <option value="attribution_royalty">Attribution + negotiated royalty (recommended)</option>
          <option value="attribution">Attribution only</option>
          <option value="closed">Closed — no reuse</option>
        </select>
      </div>
      <div className="text-muted">05 CURATOR REVIEW — WE'LL EMAIL YOU WHEN YOUR PIN IS LIVE.</div>
      {err && <div className="text-orange">ERR: {err}</div>}
      <button className="btn btn-green w-full" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</button>
    </form>
  );
}
