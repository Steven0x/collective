import Link from "next/link";
import { allArtists, allLicenses, allWorks } from "@/lib/data";
import { Art, Window, CraftTag, byId } from "@/components/ui";

export const metadata = { title: "Collaborate — COLLECTIVE" };

const CRAFT_LABEL: Record<string, string> = {
  designer: "Garment designer", textile_artist: "Textile artist", pattern_maker: "Pattern maker",
  maker: "Maker / atelier", photographer: "Photographer", stylist: "Stylist", musician: "Musician / sound",
};

// Fake open requests for the board
const REQUESTS = [
  { id: "req_01", from: "art_018", wants: "textile_artist", brief: "Jacquard knit motif for a modular overcoat. 60 units. Attribution + 20% royalty.", city: "Seoul", budget: "$1,200 + royalty" },
  { id: "req_02", from: "art_011", wants: "photographer", brief: "Campaign for Adire Cargo. Lagos or remote. Digicam / flash aesthetic.", city: "Lagos", budget: "$900" },
  { id: "req_03", from: "art_007", wants: "maker", brief: "Overdye partner for 40 reclaimed trousers. Natural dyes only.", city: "Johannesburg", budget: "$1,800" },
  { id: "req_04", from: "art_002", wants: "musician", brief: "90-second runway track, breakbeat, loom samples welcome.", city: "Berlin", budget: "$600" },
];

export default async function Collaborate({ searchParams }: { searchParams: Promise<{ role?: string; with?: string }> }) {
  const { role, with: withSlug } = await searchParams;
  const [artists, licenses, works] = await Promise.all([allArtists(), allLicenses(), allWorks()]);
  const A = byId(artists); const W = byId(works);
  const list = role ? artists.filter((a) => a.roles.includes(role)) : artists;
  const target = withSlug ? artists.find((a) => a.slug === withSlug) : undefined;
  const openLicenses = licenses.filter((l) => l.status !== "signed");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-10">
      <div>
        <div className="mono text-yellow">LIKE AIRBNB, FOR HANDS</div>
        <h1 className="display text-5xl mt-1">FIND A COLLABORATOR<span className="text-magenta">.</span></h1>
        <p className="text-muted mt-3 max-w-2xl">Browse by craft and city. Request a commission, offer a license, or answer an open request. Every collaboration lands on the map with credit and a split.</p>
      </div>

      {target && (
        <Window title={`COMMISSION REQUEST → ${target.name.toUpperCase()}`} right="DRAFT">
          <form className="grid md:grid-cols-2 gap-3 mono">
            <label className="flex flex-col gap-1">WHAT DO YOU NEED<input className="bg-bg border border-line p-2" placeholder="e.g. 40cm jacquard motif" /></label>
            <label className="flex flex-col gap-1">BUDGET (USD)<input className="bg-bg border border-line p-2" placeholder="1200" /></label>
            <label className="flex flex-col gap-1">LICENSE<select className="bg-bg border border-line p-2"><option>attribution + royalty</option><option>attribution</option><option>work for hire</option></select></label>
            <label className="flex flex-col gap-1">PROPOSED SPLIT %<input className="bg-bg border border-line p-2" placeholder="20" /></label>
            <label className="md:col-span-2 flex flex-col gap-1">BRIEF<textarea className="bg-bg border border-line p-2 h-24" /></label>
            <button type="button" className="btn btn-green md:col-span-2">Send request (demo)</button>
          </form>
        </Window>
      )}

      <section>
        <div className="nav text-xs flex gap-4 flex-wrap mb-4">
          <Link href="/collaborate" className={!role ? "text-green" : "hover:text-yellow"}>All</Link>
          {Object.entries(CRAFT_LABEL).map(([k, v]) => (
            <Link key={k} href={`/collaborate?role=${k}`} className={role === k ? "text-green" : "hover:text-yellow"}>{v}</Link>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a) => (
            <div key={a.id} className="win flex gap-3 p-3">
              <Art seed={a.id} className="w-24 h-28 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="nav text-sm truncate">{a.name}</div>
                <div className="mono text-muted">{a.city.toUpperCase()}</div>
                <div className="mono mt-1">{a.roles.map((r) => CRAFT_LABEL[r]).join(" · ")}</div>
                <div className="mono mt-1 flex justify-between">
                  <CraftTag craft={a.primary_craft} />
                  <span className={a.availability === "open" ? "text-green" : "text-orange"}>{a.availability.toUpperCase()}</span>
                </div>
                <Link href={`/collaborate?with=${a.slug}`} className="btn mt-2 text-[10px] py-1.5 px-3">Request</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Window title={`OPEN REQUESTS // ${REQUESTS.length}`}>
          <ul className="space-y-3">
            {REQUESTS.map((r) => {
              const a = A[r.from]!;
              return (
                <li key={r.id} className="border-t border-line pt-3">
                  <div className="flex justify-between mono"><span className="text-orange">WANTS: {CRAFT_LABEL[r.wants].toUpperCase()}</span><span>{r.budget}</span></div>
                  <p className="text-sm mt-1">{r.brief}</p>
                  <div className="mono text-muted mt-1">FROM {a.name.toUpperCase()} · {r.city.toUpperCase()}</div>
                </li>
              );
            })}
          </ul>
        </Window>
        <Window title={`LICENSE REQUESTS // ${openLicenses.length}`}>
          <ul className="space-y-3 mono">
            {openLicenses.map((l) => (
              <li key={l.id} className="border-t border-line pt-3">
                <div className="flex justify-between"><span>{W[l.source_work_id]?.title}</span><span className="text-orange">{l.status.toUpperCase()}</span></div>
                <div className="text-muted">{A[l.licensee_id]?.name} wants: {l.scope} · {l.royalty_pct}% royalty</div>
              </li>
            ))}
          </ul>
        </Window>
      </div>
    </div>
  );
}
