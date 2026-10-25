import { redirect } from "next/navigation";
import { Window } from "@/components/ui";
import { currentUser } from "@/lib/supabase-server";
import NewWorkForm from "./NewWorkForm";

export const dynamic = "force-dynamic";

export default async function NewWork() {
  const { sb, user, profile } = await currentUser();
  if (!user) redirect("/login?next=/me/studio/new");
  if (!profile?.artist_id) redirect("/me");
  const [{ data: artists }, { data: sources }, { data: drops }] = await Promise.all([
    sb.from("artists").select("id, name, city, roles").eq("status", "live").order("name"),
    sb.from("works").select("id, title, type, owner_id, license").neq("type", "garment").order("title"),
    sb.from("drops").select("*").neq("status", "fulfilled").order("opens", { ascending: false }),
  ]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
      <h1 className="display text-5xl riso">PUBLISH A WORK<span className="text-magenta">_</span></h1>
      <Window title="NEW WORK" right="DRAFT → LIVE">
        <NewWorkForm me={profile.artist_id} artists={artists ?? []} sources={sources ?? []} drops={drops ?? []} />
      </Window>
    </div>
  );
}
