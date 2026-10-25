import { redirect } from "next/navigation";
import { currentUser } from "@/lib/supabase-server";
import Wizard from "./Wizard";

export const dynamic = "force-dynamic";

export default async function Onboard() {
  const { sb, user, profile } = await currentUser();
  if (!user) redirect("/login?next=/me/onboard");
  const artist = profile?.artist_id ? (await sb.from("artists").select("*").eq("id", profile.artist_id).maybeSingle()).data : null;
  const influences = profile?.artist_id ? (await sb.from("artist_influences").select("*").eq("artist_id", profile.artist_id)).data ?? [] : [];
  const { data: agreement } = await sb.from("agreements").select("*").order("published_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mono text-yellow">ARTIST ONBOARDING</div>
      <h1 className="display text-5xl riso mt-1 mb-8">PUT YOUR PIN<br />ON THE MAP<span className="text-magenta">_</span></h1>
      <Wizard artist={artist} influences={influences} agreement={agreement} email={profile?.email ?? user.email ?? ""} />
    </div>
  );
}
