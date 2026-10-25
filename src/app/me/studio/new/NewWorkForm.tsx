"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type A = { id: string; name: string; city: string; roles: string[] };
type S = { id: string; title: string; type: string; owner_id: string; license: string };
type D = { id: string; name: string; status: string };
type Credit = { contributor_id: string; role: string; source_work_id: string; split_pct: number };

const ROLES = ["designer", "pattern", "technique", "photography", "styling", "soundtrack", "production", "maker"];
const TYPES = [["garment", "Garment (sellable, needs credits + splits)"], ["pattern", "Pattern / motif"], ["technique", "Technique"], ["photo", "Photo series"], ["track", "Track / sound"]];

export default function NewWorkForm({ me, artists, sources, drops }: { me: string; artists: A[]; sources: S[]; drops: D[] }) {
  const router = useRouter();
  const [type, setType] = useState("garment");
  const [credits, setCredits] = useState<Credit[]>([{ contributor_id: me, role: "designer", source_work_id: "", split_pct: 60 }]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const total = useMemo(() => credits.reduce((s, c) => s + Number(c.split_pct || 0), 0), [credits]);

  const set = (i: number, k: keyof Credit, v: string | number) => setCredits(credits.map((c, j) => (j === i ? { ...c, [k]: v } : c)));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(null);
    if (type === "garment" && total !== 100) return setErr(`splits total ${total}%, must be 100%`);
    const sb = supabaseBrowser();
    const fd = new FormData(e.currentTarget);
    // 1. upload media
    setBusy("Uploading media…");
    const media: string[] = [];
    for (const f of files) {
      const path = `${me}/${Date.now()}-${f.name.replace(/[^a-z0-9.]+/gi, "-")}`;
      const { error } = await sb.storage.from("media").upload(path, f, { upsert: false });
      if (error) { setBusy(null); return setErr(`upload: ${error.message}`); }
      media.push(sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    }
    // 2. submit work + credits in one RPC
    setBusy("Publishing…");
    const { data, error } = await sb.rpc("submit_work", {
      p_type: type, p_title: fd.get("title"), p_description: fd.get("description"), p_year: Number(fd.get("year")),
      p_media: media, p_price: type === "garment" ? Number(fd.get("price")) : null,
      p_drop_id: type === "garment" ? (fd.get("drop") || null) : null, p_license: fd.get("license"),
      p_credits: type === "garment" ? credits.map((c) => ({ ...c, source_work_id: c.source_work_id || null })) : [],
    });
    setBusy(null);
    if (error) return setErr(error.message);
    router.push("/me/studio"); router.refresh();
    void data;
  }

  return (
    <form onSubmit={submit} className="space-y-5 mono">
      <div>
        <div className="text-muted mb-1">TYPE</div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(([k, v]) => <button type="button" key={k} onClick={() => setType(k)} className={`border px-2 py-1 ${type === k ? "bg-ink text-bg border-ink" : "border-line hover:border-green"}`}>{v}</button>)}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <input name="title" required placeholder="TITLE" className="md:col-span-2 bg-bg border border-line p-2" />
        <input name="year" type="number" defaultValue={new Date().getFullYear()} className="bg-bg border border-line p-2" />
      </div>
      <textarea name="description" required placeholder="DESCRIPTION — MATERIALS, PROCESS, ORIGIN OF ANY MOTIF" className="w-full bg-bg border border-line p-2 h-24" />
      <div className="grid md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">LICENSE
          <select name="license" className="bg-bg border border-line p-2">
            <option value="attribution_royalty">attribution + royalty</option><option value="attribution">attribution</option><option value="closed">closed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">MEDIA (IMAGES / AUDIO)
          <input type="file" multiple accept="image/*,audio/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="border border-line p-1.5 file:bg-ink file:text-bg file:border-0 file:px-2 file:mr-2" />
        </label>
      </div>

      {type === "garment" && (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">PRICE (USD)<input name="price" type="number" required min={1} className="bg-bg border border-line p-2" /></label>
            <label className="flex flex-col gap-1">DROP
              <select name="drop" className="bg-bg border border-line p-2">
                <option value="">— none yet —</option>
                {drops.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
              </select>
            </label>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-muted">CREDITS + SPLITS (OF NET AFTER 10% PLATFORM FEE)</span>
              <span className={total === 100 ? "text-green" : "text-orange"}>TOTAL {total}%</span>
            </div>
            <div className="space-y-2">
              {credits.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <select value={c.contributor_id} onChange={(e) => set(i, "contributor_id", e.target.value)} className="col-span-4 bg-bg border border-line p-1.5">
                    {artists.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.city}</option>)}
                  </select>
                  <select value={c.role} onChange={(e) => set(i, "role", e.target.value)} className="col-span-2 bg-bg border border-line p-1.5">
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <select value={c.source_work_id} onChange={(e) => set(i, "source_work_id", e.target.value)} className="col-span-4 bg-bg border border-line p-1.5">
                    <option value="">— no source work —</option>
                    {sources.filter((s) => s.owner_id === c.contributor_id).map((s) => <option key={s.id} value={s.id}>{s.title} ({s.type}, {s.license})</option>)}
                  </select>
                  <input type="number" value={c.split_pct} onChange={(e) => set(i, "split_pct", Number(e.target.value))} className="col-span-1 bg-bg border border-line p-1.5" />
                  <button type="button" onClick={() => setCredits(credits.filter((_, j) => j !== i))} className="col-span-1 text-muted hover:text-orange">[x]</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setCredits([...credits, { contributor_id: artists[0]?.id ?? me, role: "production", source_work_id: "", split_pct: 0 }])} className="btn py-1 mt-2">+ Add contributor</button>
            <p className="text-muted mt-2">EACH CONTRIBUTOR MUST ACCEPT THEIR CREDIT BEFORE IT EARNS. A SOURCE WORK LINKS THE INFLUENCE ARC ON THE MAP.</p>
          </div>
        </>
      )}
      {err && <div className="text-orange">ERR: {err}</div>}
      <button className="btn btn-green w-full" disabled={!!busy}>{busy ?? "Publish"}</button>
    </form>
  );
}
