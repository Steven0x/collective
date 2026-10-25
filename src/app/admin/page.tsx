import Link from "next/link";
import { redirect } from "next/navigation";
import { Window } from "@/components/ui";
import { currentUser } from "@/lib/supabase-server";
import AdminActions from "./AdminActions";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const { sb, user, profile } = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (profile?.role !== "curator") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Window title="ADMIN // CURATORS ONLY">
          <p className="mono text-muted">YOUR ROLE IS {profile?.role?.toUpperCase()}. TO BECOME A CURATOR, RUN IN THE SUPABASE SQL EDITOR:</p>
          <pre className="mono mt-2 p-2 border border-line overflow-x-auto">{`update profiles set role = 'curator' where email = '${profile?.email}';`}</pre>
        </Window>
      </div>
    );
  }
  const [{ data: pendingArtists }, { data: pendingCredits }, { data: drops }, { data: accrued }, { data: liveArtists }] = await Promise.all([
    sb.from("artists").select("*").eq("status", "pending").order("joined_at"),
    sb.from("contributions").select("*, artists:contributor_id(name), works:work_id(title, slug)").eq("status", "pending"),
    sb.from("drops").select("*").order("opens", { ascending: false }),
    sb.from("artist_earnings").select("artist_id, accrued, artists(name, city)").gt("accrued", 0).order("accrued", { ascending: false }),
    sb.from("artists").select("id, name, status").eq("status", "live").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <h1 className="display text-5xl riso">CURATOR<span className="text-magenta">_</span></h1>
        <a href="/api/admin/ledger" className="btn">Export accrued royalties CSV</a>
      </div>

      <AdminActions
        pendingArtists={pendingArtists ?? []}
        pendingCredits={(pendingCredits ?? []) as any}
        drops={drops ?? []}
        accrued={(accrued ?? []) as any}
      />

      <Window title={`LIVE ARTISTS // ${liveArtists?.length ?? 0}`}>
        <div className="mono flex flex-wrap gap-2">
          {liveArtists?.map((a: any) => <Link key={a.id} href={`/artists/${a.id}`} className="border border-line px-2 py-0.5 hover:border-magenta">{a.name}</Link>)}
        </div>
      </Window>
    </div>
  );
}
