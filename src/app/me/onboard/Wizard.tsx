"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Window } from "@/components/ui";
import { ROLES, OPEN_TO, RATE_BASIS, HERITAGE_RELATION, LICENSES, CURRENCIES, STEPS } from "@/lib/profile-options";

type Geo = { place: string; city?: string; country?: string; country_code?: string; lat: number; lng: number };
type Influence = { place: string; lat: number; lng: number; era?: string; note?: string };
type Props = { artist: any; influences: any[]; agreement: { version: string; title: string; body: string } | null; email: string };

const input = "w-full bg-bg border border-line p-2 mono";
const Chip = ({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`mono border px-2 py-1 ${on ? "bg-magenta text-ink border-magenta" : "border-line hover:border-yellow"}`}>{children}</button>
);
const Tags = ({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder: string }) => {
  const [t, setT] = useState("");
  const add = () => { const v = t.trim(); if (v && !value.includes(v)) onChange([...value, v]); setT(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">{value.map((v) => <span key={v} className="mono border border-line px-1.5 py-0.5">{v} <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="text-muted hover:text-orange">×</button></span>)}</div>
      <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add} placeholder={placeholder} className={input} />
    </div>
  );
};

async function geocode(q: string): Promise<Geo[]> {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
  const j = await r.json();
  return j.map((h: any) => ({
    place: h.display_name.split(", ").slice(0, 2).join(", "),
    city: h.address?.city || h.address?.town || h.address?.village || h.address?.county || h.display_name.split(", ")[0],
    country: h.address?.country, country_code: h.address?.country_code?.toUpperCase(), lat: +h.lat, lng: +h.lon,
  }));
}

function PlaceSearch({ onPick, placeholder }: { onPick: (g: Geo) => void; placeholder: string }) {
  const [q, setQ] = useState(""); const [hits, setHits] = useState<Geo[]>([]);
  return (
    <div className="relative">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter") { e.preventDefault(); setHits(await geocode(q)); } }} placeholder={placeholder} className={input} />
        <button type="button" onClick={async () => setHits(await geocode(q))} className="btn py-1">Find</button>
      </div>
      {hits.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 border border-line bg-bg2">
          {hits.map((h, i) => <li key={i}><button type="button" className="mono w-full text-left px-2 py-1.5 hover:bg-magenta" onClick={() => { onPick(h); setHits([]); setQ(""); }}>{h.place}{h.country ? `, ${h.country}` : ""}</button></li>)}
        </ul>
      )}
    </div>
  );
}

export default function Wizard({ artist, influences: initialInf, agreement, email }: Props) {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [step, setStep] = useState<number>(Math.min(artist?.onboarding_step ?? 0, 4));
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [a, setA] = useState<any>({
    name: "", native_name: "", pronouns: "", roles: [], languages: [], bio: "", city: "", country: "", country_code: "", lat: null, lng: null,
    portrait: "", cover: "", links: {}, heritage_statement: "", heritage_relation: "", mentors: "",
    specialties: [], materials: [], techniques: [], capacity: {}, open_to: [], rate_basis: "", rate_range: "", availability: "open", booked_until: "",
    default_license: "attribution_royalty", currency: "USD", press: "", ...(artist ?? {}),
  });
  const [inf, setInf] = useState<Influence[]>(initialInf.map((i) => ({ place: i.place, lat: i.lat, lng: i.lng, era: i.era ?? "", note: i.note ?? "" })));
  const [agree, setAgree] = useState(!!artist?.agreement_version);
  const set = (k: string, v: any) => setA((s: any) => ({ ...s, [k]: v }));

  async function upload(file: File, kind: "portrait" | "cover") {
    setBusy(`Uploading ${kind}…`);
    const path = `profiles/${Date.now()}-${kind}-${file.name.replace(/[^a-z0-9.]+/gi, "-")}`;
    const { error } = await sb.storage.from("media").upload(path, file);
    setBusy(null);
    if (error) return setErr(error.message);
    set(kind, sb.storage.from("media").getPublicUrl(path).data.publicUrl);
  }

  async function save(nextStep: number, extra: Record<string, unknown> = {}) {
    setErr(null);
    if (step === 0) {
      if (!a.name) return setErr("name required");
      if (!a.roles?.length) return setErr("pick at least one role");
      if (a.lat == null) return setErr("pin your city");
    }
    setBusy("Saving…");
    const payload = { ...a, ...extra, onboarding_step: nextStep };
    delete payload.id; delete payload.slug; delete payload.status; delete payload.user_id; delete payload.joined_at; delete payload.socials; delete payload.primary_craft;
    delete payload.stripe_account_id; delete payload.verified_lineage; delete payload.agreement_accepted_at;
    if (!("agreement_version" in extra)) delete payload.agreement_version;
    Object.keys(payload).forEach((k) => { if (payload[k] === "" || payload[k] === null) delete payload[k]; });
    const { error } = await sb.rpc("upsert_my_artist", { p: payload });
    if (!error && step === 1) await sb.rpc("set_my_influences", { p: inf });
    setBusy(null);
    if (error) return setErr(error.message);
    if (nextStep >= 5) { fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: "profile_submitted" }) }).catch(() => {}); router.push("/me/studio"); router.refresh(); } else { setStep(nextStep); window.scrollTo(0, 0); }
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 mono">
        {STEPS.map((s, i) => <li key={s} className={`border px-2 py-1 ${i === step ? "border-yellow text-yellow" : i < step ? "border-line text-muted line-through" : "border-line text-muted"}`}>0{i + 1} {s.toUpperCase()}</li>)}
      </ol>

      {step === 0 && (
        <Window title="01 // IDENTITY" right="WHO YOU ARE">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="mono flex flex-col gap-1">STUDIO / ARTIST NAME *<input value={a.name} onChange={(e) => set("name", e.target.value)} className={input} /></label>
            <label className="mono flex flex-col gap-1">NAME IN YOUR OWN SCRIPT<input value={a.native_name ?? ""} onChange={(e) => set("native_name", e.target.value)} placeholder="e.g. 박대중 · أبينا" className={input} /><span className="text-muted">GOES ON THE NEON SIGNS</span></label>
            <label className="mono flex flex-col gap-1">PRONOUNS (OPTIONAL)<input value={a.pronouns ?? ""} onChange={(e) => set("pronouns", e.target.value)} className={input} /></label>
            <div className="mono flex flex-col gap-1">LANGUAGES<Tags value={a.languages ?? []} onChange={(v) => set("languages", v)} placeholder="Twi, English, … (enter)" /></div>
          </div>
          <div className="mono mt-4 mb-1">ROLES *</div>
          <div className="flex flex-wrap gap-2">{ROLES.map(([k, v]) => <Chip key={k} on={a.roles?.includes(k)} onClick={() => set("roles", a.roles.includes(k) ? a.roles.filter((r: string) => r !== k) : [...a.roles, k])}>{v}</Chip>)}</div>
          <div className="mono mt-4 mb-1">WHERE YOU WORK * — THIS IS YOUR PIN</div>
          <PlaceSearch placeholder="City, country" onPick={(g) => { set("city", g.city); set("country", g.country); set("country_code", g.country_code); set("lat", g.lat); set("lng", g.lng); }} />
          {a.lat != null && <div className="mono text-yellow mt-1">PIN: {a.city}, {a.country} · {Number(a.lat).toFixed(4)}, {Number(a.lng).toFixed(4)}</div>}
          <label className="mono flex flex-col gap-1 mt-4">BIO — TWO OR THREE LINES. WHAT YOU MAKE, HOW. *<textarea value={a.bio ?? ""} onChange={(e) => set("bio", e.target.value)} className={`${input} h-24`} /></label>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="mono">PORTRAIT (BECOMES YOUR MAP PIN)
              <div className="flex gap-3 items-center mt-1">{a.portrait && <img src={a.portrait} alt="" className="w-16 h-20 object-cover border border-line" />}<input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "portrait")} className="border border-line p-1.5 file:bg-ink file:text-bg file:border-0 file:px-2 file:mr-2 flex-1" /></div>
            </div>
            <div className="mono">COVER IMAGE
              <div className="flex gap-3 items-center mt-1">{a.cover && <img src={a.cover} alt="" className="w-24 h-14 object-cover border border-line" />}<input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} className="border border-line p-1.5 file:bg-ink file:text-bg file:border-0 file:px-2 file:mr-2 flex-1" /></div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {["instagram", "website", "other"].map((k) => <label key={k} className="mono flex flex-col gap-1">{k.toUpperCase()}<input value={a.links?.[k] ?? ""} onChange={(e) => set("links", { ...(a.links ?? {}), [k]: e.target.value })} className={input} /></label>)}
          </div>
        </Window>
      )}

      {step === 1 && (
        <Window title="02 // LINEAGE" right="WHERE IT COMES FROM">
          <p className="text-ink/80 mb-4">This is the part no other platform asks. It makes the map work, and it's how we handle cultural exchange honestly — in your words, not by rule.</p>
          <div className="mono mb-1">YOUR RELATIONSHIP TO THE TRADITION(S) YOU DRAW FROM</div>
          <div className="flex flex-col gap-1 mb-4">{HERITAGE_RELATION.map(([k, v]) => <Chip key={k} on={a.heritage_relation === k} onClick={() => set("heritage_relation", k)}>{v}</Chip>)}</div>
          <label className="mono flex flex-col gap-1">HERITAGE / GROUNDING STATEMENT<textarea value={a.heritage_statement ?? ""} onChange={(e) => set("heritage_statement", e.target.value)} placeholder="Where your visual language comes from. Family, place, community, study. Shown on your profile." className={`${input} h-28`} /></label>
          <label className="mono flex flex-col gap-1 mt-4">MENTORS / WHO TAUGHT YOU (OPTIONAL)<input value={a.mentors ?? ""} onChange={(e) => set("mentors", e.target.value)} className={input} /></label>
          <div className="mono mt-6 mb-1">INFLUENCE PLACES — 1 TO 5. THESE BECOME YOUR ARCS ON THE MAP.</div>
          <ul className="space-y-2 mb-2">
            {inf.map((i, idx) => (
              <li key={idx} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-4 mono truncate">{i.place}</span>
                <input value={i.era ?? ""} onChange={(e) => setInf(inf.map((x, j) => (j === idx ? { ...x, era: e.target.value } : x)))} placeholder="era / when" className={`${input} col-span-2`} />
                <input value={i.note ?? ""} onChange={(e) => setInf(inf.map((x, j) => (j === idx ? { ...x, note: e.target.value } : x)))} placeholder="one line: why this place" className={`${input} col-span-5`} />
                <button type="button" onClick={() => setInf(inf.filter((_, j) => j !== idx))} className="mono text-muted hover:text-orange">[x]</button>
              </li>
            ))}
          </ul>
          {inf.length < 5 && <PlaceSearch placeholder="Add a place: city, region, village…" onPick={(g) => setInf([...inf, { place: g.place, lat: g.lat, lng: g.lng, era: "", note: "" }])} />}
        </Window>
      )}

      {step === 2 && (
        <Window title="03 // CRAFT & TERMS" right="HOW YOU WORK">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="mono flex flex-col gap-1">SPECIALTIES<Tags value={a.specialties ?? []} onChange={(v) => set("specialties", v)} placeholder="jacquard, 35mm, welt…" /></div>
            <div className="mono flex flex-col gap-1">MATERIALS<Tags value={a.materials ?? []} onChange={(v) => set("materials", v)} placeholder="deadstock wool, hemp…" /></div>
            <div className="mono flex flex-col gap-1">TECHNIQUES<Tags value={a.techniques ?? []} onChange={(v) => set("techniques", v)} placeholder="resist dye, block print…" /></div>
          </div>
          {a.roles?.includes("maker") && (
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              {[["min_run", "MIN RUN (UNITS)"], ["max_run", "MAX RUN (UNITS)"], ["lead_time_weeks", "LEAD TIME (WEEKS)"]].map(([k, l]) => (
                <label key={k} className="mono flex flex-col gap-1">{l}<input type="number" value={a.capacity?.[k] ?? ""} onChange={(e) => set("capacity", { ...(a.capacity ?? {}), [k]: Number(e.target.value) })} className={input} /></label>
              ))}
            </div>
          )}
          <div className="mono mt-6 mb-1">OPEN TO</div>
          <div className="flex flex-wrap gap-2">{OPEN_TO.map(([k, v]) => <Chip key={k} on={a.open_to?.includes(k)} onClick={() => set("open_to", a.open_to.includes(k) ? a.open_to.filter((r: string) => r !== k) : [...a.open_to, k])}>{v}</Chip>)}</div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <label className="mono flex flex-col gap-1">RATE BASIS<select value={a.rate_basis ?? ""} onChange={(e) => set("rate_basis", e.target.value)} className={input}><option value="">—</option>{RATE_BASIS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="mono flex flex-col gap-1">RATE RANGE (PRIVATE, SHOWN TO REQUESTERS)<input value={a.rate_range ?? ""} onChange={(e) => set("rate_range", e.target.value)} placeholder="e.g. 400–900 / day" className={input} /></label>
            <label className="mono flex flex-col gap-1">CURRENCY<select value={a.currency ?? "USD"} onChange={(e) => set("currency", e.target.value)} className={input}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="mono flex flex-col gap-1">AVAILABILITY<select value={a.availability ?? "open"} onChange={(e) => set("availability", e.target.value)} className={input}><option value="open">Open</option><option value="limited">Limited</option><option value="booked">Booked</option></select></label>
            <label className="mono flex flex-col gap-1">BOOKED UNTIL<input type="date" value={a.booked_until ?? ""} onChange={(e) => set("booked_until", e.target.value)} className={input} /></label>
            <label className="mono flex flex-col gap-1">DEFAULT LICENSE FOR YOUR WORK<select value={a.default_license} onChange={(e) => set("default_license", e.target.value)} className={input}>{LICENSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          </div>
        </Window>
      )}

      {step === 3 && (
        <Window title="04 // WORK" right="WHAT YOU'VE MADE">
          <p className="text-ink/80">Works are published from your studio once a curator approves your profile — each with its own media, license and origin note. For now, tell us where to look.</p>
          <label className="mono flex flex-col gap-1 mt-4">PRESS, EXHIBITIONS, PAST COLLABORATIONS, PORTFOLIO LINKS<textarea value={a.press ?? ""} onChange={(e) => set("press", e.target.value)} className={`${input} h-32`} placeholder="One per line." /></label>
          <p className="mono text-muted mt-3">CURATORS READ THIS. IT DOES NOT APPEAR PUBLICLY UNLESS YOU WANT IT TO.</p>
        </Window>
      )}

      {step === 4 && agreement && (
        <Window title={`05 // ${agreement.title.toUpperCase()}`} right={agreement.version}>
          <pre className="whitespace-pre-wrap text-sm text-ink/80 font-body max-h-80 overflow-y-auto border border-line p-3">{agreement.body}</pre>
          <label className="mono flex items-start gap-2 mt-4"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" /> I, {a.name} ({email}), accept {agreement.title} ({agreement.version}).</label>
          <p className="mono text-muted mt-3">SUBMITTING SENDS YOUR PROFILE TO A CURATOR. YOU'LL GET AN EMAIL WHEN YOUR PIN IS LIVE.</p>
        </Window>
      )}

      {err && <div className="mono text-orange">ERR: {err}</div>}
      <div className="flex justify-between">
        <button type="button" disabled={step === 0 || !!busy} onClick={() => setStep(step - 1)} className="btn">← Back</button>
        {step < 4 ? (
          <button type="button" disabled={!!busy} onClick={() => save(step + 1)} className="btn btn-green">{busy ?? "Save & continue →"}</button>
        ) : (
          <button type="button" disabled={!!busy || !agree} onClick={() => save(5, { agreement_version: agreement?.version })} className="btn btn-green">{busy ?? "Submit for review"}</button>
        )}
      </div>
    </div>
  );
}
