"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Window } from "@/components/ui";

type Artist = { id: string; name: string; city: string; country: string; roles: string[]; bio: string; joined_at: string };
type Credit = { id: string; role: string; split_pct: number; artists: { name: string }; works: { title: string; slug: string } };
type Drop = { id: string; name: string; opens: string; closes: string; status: string; goal_units: number };
type Accrued = { artist_id: string; accrued: number; artists: { name: string; city: string } };

export default function AdminActions({ pendingArtists, pendingCredits, drops, accrued }: { pendingArtists: Artist[]; pendingCredits: Credit[]; drops: Drop[]; accrued: Accrued[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function rpc(name: string, args: Record<string, unknown>, key: string) {
    setBusy(key); setMsg(null);
    const { data, error } = await supabaseBrowser().rpc(name, args);
    setBusy(null);
    if (error) setMsg(`ERR: ${error.message}`); else { setMsg(`OK ${name}${data != null ? ` → ${JSON.stringify(data)}` : ""}`); router.refresh(); }
  }
  async function saveDrop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await rpc("curator_set_drop", { p_drop_id: fd.get("id") || null, p_name: fd.get("name"), p_opens: fd.get("opens"), p_closes: fd.get("closes"), p_status: fd.get("status"), p_goal: Number(fd.get("goal")) }, "drop");
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      {msg && <div className={`mono ${msg.startsWith("ERR") ? "text-orange" : "text-green"}`}>{msg}</div>}

      <div className="grid lg:grid-cols-2 gap-6">
        <Window title={`ARTIST APPLICATIONS // ${pendingArtists.length}`}>
          {!pendingArtists.length ? <p className="mono text-muted">QUEUE EMPTY.</p> : (
            <ul className="space-y-3 mono">
              {pendingArtists.map((a) => (
                <li key={a.id} className="border-t border-line pt-2">
                  <div className="flex justify-between"><span>{a.name}</span><span className="text-muted">{a.city}, {a.country} · {a.joined_at}</span></div>
                  <div className="text-muted">{a.roles.join(" · ")}</div>
                  <p className="text-sm mt-1">{a.bio}</p>
                  <div className="flex gap-2 mt-2">
                    <button disabled={busy === a.id} onClick={() => rpc("curator_set_artist_status", { p_artist_id: a.id, p_status: "live" }, a.id)} className="btn btn-green py-1 px-2 text-[10px]">Approve → live</button>
                    <button disabled={busy === a.id} onClick={() => rpc("curator_set_artist_status", { p_artist_id: a.id, p_status: "paused" }, a.id)} className="btn py-1 px-2 text-[10px]">Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Window>

        <Window title={`PENDING CREDITS // ${pendingCredits.length}`} right="OVERRIDE">
          {!pendingCredits.length ? <p className="mono text-muted">ALL CREDITS CONFIRMED.</p> : (
            <ul className="space-y-2 mono">
              {pendingCredits.map((c) => (
                <li key={c.id} className="border-t border-line pt-2 flex justify-between items-center gap-2">
                  <span>{c.artists?.name} · {c.role} · {c.split_pct}% on <a className="text-green" href={`/shop/${c.works?.slug}`}>{c.works?.title}</a></span>
                  <span className="flex gap-1 shrink-0">
                    <button disabled={busy === c.id} onClick={() => rpc("curator_set_credit_status", { p_contribution_id: c.id, p_status: "confirmed" }, c.id)} className="btn btn-green py-1 px-2 text-[10px]">Confirm</button>
                    <button disabled={busy === c.id} onClick={() => rpc("curator_set_credit_status", { p_contribution_id: c.id, p_status: "declined" }, c.id)} className="btn py-1 px-2 text-[10px]">Decline</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Window>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Window title={`DROPS // ${drops.length}`}>
          <table className="w-full mono mb-4">
            <tbody>
              {drops.map((d) => (
                <tr key={d.id} className="border-t border-line">
                  <td className="py-1">{d.name}</td><td className="py-1 text-muted">{d.opens} → {d.closes}</td><td className="py-1">{d.goal_units}u</td>
                  <td className="py-1 text-right">
                    <select defaultValue={d.status} onChange={(e) => rpc("curator_set_drop", { p_drop_id: d.id, p_name: d.name, p_opens: d.opens, p_closes: d.closes, p_status: e.target.value, p_goal: d.goal_units }, d.id)} className="bg-bg border border-line p-1">
                      {["draft", "preorder_open", "funded", "in_production", "fulfilled"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={saveDrop} className="grid grid-cols-6 gap-2 mono">
            <input name="id" type="hidden" />
            <input name="name" required placeholder="NEW DROP NAME" className="col-span-3 bg-bg border border-line p-1.5" />
            <input name="goal" type="number" required placeholder="GOAL" className="col-span-1 bg-bg border border-line p-1.5" />
            <select name="status" className="col-span-2 bg-bg border border-line p-1.5"><option>draft</option><option>preorder_open</option></select>
            <input name="opens" type="date" required className="col-span-3 bg-bg border border-line p-1.5" />
            <input name="closes" type="date" required className="col-span-3 bg-bg border border-line p-1.5" />
            <button className="btn btn-green col-span-6 py-1">Create drop</button>
          </form>
        </Window>

        <Window title="PAYOUTS // ACCRUED BY ARTIST" right="MARK PAID AFTER TRANSFER">
          {!accrued.length ? <p className="mono text-muted">NOTHING ACCRUED.</p> : (
            <table className="w-full mono">
              <tbody>
                {accrued.map((r) => (
                  <tr key={r.artist_id} className="border-t border-line">
                    <td className="py-1">{r.artists?.name}</td><td className="py-1 text-muted">{r.artists?.city}</td>
                    <td className="py-1 text-right text-orange">${Number(r.accrued).toFixed(2)}</td>
                    <td className="py-1 text-right">
                      <button disabled={busy === r.artist_id} onClick={() => rpc("curator_mark_paid", { p_artist_id: r.artist_id, p_through: new Date().toISOString().slice(0, 10) }, r.artist_id)} className="btn btn-green py-1 px-2 text-[10px]">Mark paid</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Window>
      </div>
    </div>
  );
}
