import { allArtists } from "@/lib/data";
import { ArtistCard } from "@/components/ui";

export const metadata = { title: "Artists — COLLECTIVE" };

export default async function Artists({ searchParams }: { searchParams: Promise<{ craft?: string }> }) {
  const { craft } = await searchParams;
  const artists = await allArtists();
  const list = craft ? artists.filter((a) => a.primary_craft === craft) : artists;
  const crafts = ["design", "textile", "photo", "sound", "make"];
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h1 className="display text-5xl riso">ARTISTS<span className="text-magenta">.</span>{list.length}</h1>
        <nav className="nav text-xs flex gap-4">
          <a href="/artists" className={!craft ? "text-green" : "hover:text-yellow"}>All</a>
          {crafts.map((c) => (
            <a key={c} href={`/artists?craft=${c}`} className={craft === c ? "text-green" : "hover:text-yellow"}>{c}</a>
          ))}
        </nav>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {list.map((a) => <ArtistCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}
