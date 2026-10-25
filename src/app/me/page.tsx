import Link from "next/link";
import { redirect } from "next/navigation";
import { Window } from "@/components/ui";
import { currentUser } from "@/lib/supabase-server";
import { useSupabase } from "@/lib/supabase";
import BecomeArtistForm from "./BecomeArtistForm";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

export default async function Me() {
  if (!useSupabase()) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><Window title="AUTH // DISABLED"><p className="mono text-muted">DATA_SOURCE=json — accounts need Supabase.</p></Window></div>;
  }
  const { sb, user, profile } = await currentUser();
  if (!user) redirect("/login?next=/me");
  if (!profile) return <div className="mx-auto max-w-3xl px-4 py-16 mono text-orange">PROFILE NOT CREATED — CHECK THE on_auth_user_created TRIGGER.</div>;

  const artist = profile.artist_id ? (await sb.from("artists").select("*").eq("id", profile.artist_id).maybeSingle()).data : null;
  // Orders are keyed by email hash until collectors.user_id is linked at checkout.
  const collectorId = "usr_" + createHash("md5").update(profile.email.toLowerCase()).digest("hex").slice(0, 10);
  const { data: orders } = await sb.from("orders").select("*, works(title, slug)").eq("collector_id", collectorId).order("placed_at", { ascending: false }).limit(20);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="mono text-yellow">{profile.role.toUpperCase()} · {profile.email}</div>
          <h1 className="display text-5xl mt-1">{profile.display_name.toUpperCase()}</h1>
        </div>
        <div className="flex gap-2">
          {profile.role === "curator" && <Link href="/admin" className="btn btn-green">Curator admin</Link>}
          {artist && <Link href="/me/studio" className="btn btn-green">Studio</Link>}
          <form action="/auth/signout" method="post"><button className="btn">Sign out</button></form>
        </div>
      </div>

      {artist ? (
        <Window title={`ARTIST PROFILE // ${artist.id}`} right={<span className={artist.status === "live" ? "text-green" : "text-orange"}>{artist.status.toUpperCase()}</span>}>
          <div className="grid md:grid-cols-2 gap-4 mono">
            <div><div className="text-muted">NAME</div>{artist.name}</div>
            <div><div className="text-muted">PIN</div>{artist.city}, {artist.country} · {artist.lat}, {artist.lng}</div>
            <div><div className="text-muted">ROLES</div>{artist.roles.join(" · ")}</div>
            <div><div className="text-muted">DEFAULT LICENSE</div>{artist.default_license}</div>
          </div>
          {artist.status === "pending" && <p className="mono text-orange mt-4">A CURATOR WILL REVIEW YOUR PROFILE BEFORE IT GOES LIVE ON THE MAP. YOU CAN STILL BROWSE AND PREORDER.</p>}
          <Link href={`/artists/${artist.slug}`} className="btn mt-4">Public profile →</Link>
        </Window>
      ) : (
        <Window title="BECOME AN ARTIST // 5 STEPS" right="OPTIONAL">
          <p className="text-muted mb-4">Designers, weavers, shoemakers, photographers, musicians, ateliers. Your city becomes your pin on the map.</p>
          <BecomeArtistForm />
        </Window>
      )}

      <Window title={`ORDERS // ${orders?.length ?? 0}`}>
        {!orders?.length ? <p className="mono text-muted">NO ORDERS YET. <Link href="/shop" className="text-green">SHOP THE DROP →</Link></p> : (
          <table className="w-full mono">
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="py-2 text-muted">{o.placed_at}</td>
                  <td className="py-2"><Link href={`/shop/${o.works?.slug}`} className="hover:text-yellow">{o.works?.title}</Link></td>
                  <td className="py-2">×{o.qty}</td>
                  <td className="py-2 text-right">${o.total_usd}</td>
                  <td className="py-2 pl-2 text-right text-green">{o.status.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Window>
    </div>
  );
}
