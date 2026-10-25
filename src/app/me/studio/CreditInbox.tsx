"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Row = { id: string; role: string; split_pct: number; work_title: string; work_slug: string; owner_name: string };

export default function CreditInbox({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  async function respond(id: string, accept: boolean) {
    setBusy(id);
    const { error } = await supabaseBrowser().rpc("respond_to_credit", { p_contribution_id: id, p_accept: accept });
    setBusy(null);
    if (error) alert(error.message); else router.refresh();
  }
  return (
    <ul className="mono space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="border-t border-line pt-2">
          <div>{r.owner_name} credits you as <span className="text-green">{r.role.toUpperCase()} · {r.split_pct}%</span></div>
          <div className="text-muted">on {r.work_title}</div>
          <div className="flex gap-2 mt-1">
            <button disabled={busy === r.id} onClick={() => respond(r.id, true)} className="btn btn-green py-1 px-2 text-[10px]">Accept</button>
            <button disabled={busy === r.id} onClick={() => respond(r.id, false)} className="btn py-1 px-2 text-[10px]">Decline</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
