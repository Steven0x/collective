import Link from "next/link";
import { redirect } from "next/navigation";
import { Window, Art } from "@/components/ui";
import { currentUser } from "@/lib/supabase-server";
import CreditInbox from "./CreditInbox";

export const dynamic = "force-dynamic";

export default async function Studio() {
  const { sb, user, profile } = await currentUser();
  if (!user) redirect("/login?next=/me/studio");
  if (!profile?.artist_id) redirect("/me");
  const [{ data: artist }, { data: works }, { data: inbox }, { data: earnings }, { data: outgoing }] = await Promise.all([
    sb.from("artists").select("*").eq("id", profile.artist_id).single(),
    sb.from("works").select("*").eq("owner_id", profile.artist_id).order("year", { ascending: false }),
    sb.from("my_pending_credits").select("*"),
    sb.from("artist_earnings").select("*").eq("artist_id", profile.artist_id).maybeSingle(),
    sb.from("contributions").select("*, artists:contributor_id(name), works:work_id(title, owner_id)").eq("status", "pending"),
  ]);
  const awaiting = (outgoing ?? []).filter((c: any) => c.works?.owner_id === profile.artist_id && c.contributor_id !== profile.artist_id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="mono text-yellow">STUDIO · {artist?.id} · <span className={artist?.status === "live" ? "text-green" : "text-orange"}>{artist?.status?.toUpperCase()}</span></div>
          <h1 className="display text-5xl mt-1">{artist?.name?.toUpperCase()}</h1>
        </div>
        <Link href="/me/studio/new" className={`btn btn-green ${artist?.status !== "live" ? "opacity-50 pointer-events-none" : ""}`}>+ Publish a work</Link>
      </div>
      {artist?.status !== "live" && <p className="mono text-orange">PUBLISHING UNLOCKS WHEN A CURATOR APPROVES YOUR PROFILE.</p>}

      <div className="grid md:grid-cols-3 gap-4">
        <Window title="EARNINGS"><div className="grid grid-cols-2 gap-2"><div><div className="mono text-muted">PAID</div><div className="display text-3xl text-green">${Number(earnings?.paid ?? 0).toFixed(0)}</div></div><div><div className="mono text-muted">ACCRUED</div><div className="display text-3xl text-orange">${Number(earnings?.accrued ?? 0).toFixed(0)}</div></div></div></Window>
        <Window title={`CREDITS TO CONFIRM // ${inbox?.length ?? 0}`} right="INBOX">
          {!inbox?.length ? <p className="mono text-muted">NOTHING PENDING.</p> : <CreditInbox rows={inbox as any} />}
        </Window>
        <Window title={`AWAITING OTHERS // ${awaiting.length}`}>
          {!awaiting.length ? <p className="mono text-muted">ALL YOUR DECLARED CREDITS ARE CONFIRMED.</p> : (
            <ul className="mono space-y-1">{awaiting.map((c: any) => <li key={c.id}>{c.artists?.name} · {c.role} · {c.split_pct}% on {c.works?.title}</li>)}</ul>
          )}
        </Window>
      </div>

      <Window title={`WORKS // ${works?.length ?? 0}`}>
        {!works?.length ? <p className="mono text-muted">NO WORKS YET.</p> : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {works.map((w: any) => (
              <Link key={w.id} href={w.type === "garment" ? `/shop/${w.slug}` : `/map`} className="win hover:border-magenta">
                <Art seed={w.id} src={w.media?.[0]?.startsWith("http") ? w.media[0] : undefined} className="aspect-square" />
                <div className="p-2"><div className="mono truncate">{w.title}</div><div className="mono text-muted">{w.type.toUpperCase()} · {w.year}</div></div>
              </Link>
            ))}
          </div>
        )}
      </Window>
    </div>
  );
}
