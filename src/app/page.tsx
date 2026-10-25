import Link from "next/link";
import { allArtists, garments, allDrops, workById, contributionsFor, fundingMap } from "@/lib/data";
import { Art, GarmentCard, Window, Credits, byId } from "@/components/ui";
import { KenteStrip, AdinkraGrid, GlyphColumn, NeonSign, RisoSun, Tunnel, Stars } from "@/components/motifs";

export const revalidate = 300;

export default async function Home() {
  const [artists, g, drops, hero] = await Promise.all([allArtists(), garments(), allDrops(), workById("wrk_g01")]);
  const openDrop = drops.find((d) => d.status === "preorder_open");
  const dropGarments = g.filter((w) => w.drop_id === openDrop?.id);
  const featured = [...dropGarments, ...g.filter((w) => w.drop_id !== openDrop?.id)].slice(0, 4);
  const [funding, heroCredits] = await Promise.all([fundingMap(featured.map((w) => w.id)), hero ? contributionsFor(hero.id) : Promise.resolve([])]);
  const A = byId(artists);
  const ticker = artists.map((a) => `${a.name.toUpperCase()} · ${a.city.toUpperCase()}`);

  return (
    <div>
      {/* ticker on kente band */}
      <div className="relative overflow-hidden h-9">
        <KenteStrip className="absolute inset-0 w-full h-full opacity-90" />
        <div className="absolute inset-0 bg-bg/70" />
        <div className="marquee gap-8 mono text-ink relative py-2.5">
          {[...ticker, ...ticker].map((t, i) => <span key={i}>{t} ///</span>)}
        </div>
      </div>

      {/* ===== HERO: cosmic collage ===== */}
      <section className="relative overflow-hidden border-b border-line" style={{ minHeight: "88vh" }}>
        <Stars className="absolute inset-0 w-full h-full" />
        <Tunnel className="absolute -right-40 -top-40 w-[700px] h-[700px] opacity-30" />
        <RisoSun className="absolute -left-24 top-1/3 w-[420px] h-[420px] opacity-80 halftone" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/60 to-transparent" />

        {/* glyph columns left + right */}
        <GlyphColumn className="absolute left-4 md:left-10 top-0 h-full w-8 md:w-12 opacity-90" seed={0} />
        <GlyphColumn className="absolute right-4 md:right-10 top-0 h-full w-8 md:w-12 opacity-90" seed={3} />

        {/* neon signs cluster */}
        <div className="absolute right-20 md:right-32 top-16 hidden md:flex gap-3 items-start">
          <NeonSign text="한국식당" color="yellow" />
          <NeonSign text="日本全国" color="magenta" className="mt-10" />
          <NeonSign text="KUMASI" color="cyan" className="mt-4" />
          <NeonSign text="LAGOS 市" color="yellow" className="mt-16" />
        </div>

        <div className="relative mx-auto max-w-7xl px-16 md:px-24 pt-24 pb-20">
          <div className="mono text-yellow mb-5">SYS.READY — {artists.length} ARTISTS · {g.length} GARMENTS · 6 CONTINENTS · ONE MAP</div>
          <h1 className="display text-5xl sm:text-7xl lg:text-[7.5rem] riso max-w-5xl">
            CULTURE
            <br />IS THE
            <br /><span className="riso-yellow">PATTERN.</span>
          </h1>
          <p className="mt-8 max-w-xl text-ink/80 text-lg md:text-xl">
            An artist-owned ecosystem for fashion. Kente to Kreuzberg, Kyoto indigo to Johannesburg
            upcycle — every garment carries its lineage, every hand gets paid.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/map" className="btn btn-green">Explore the map</Link>
            <Link href="/shop" className="btn">Shop the drop</Link>
          </div>
        </div>

        {/* bottom adinkra band */}
        <div className="absolute inset-x-0 bottom-0 h-16 opacity-50">
          <AdinkraGrid className="w-full h-full" rows={1} cols={28} />
        </div>
      </section>

      {/* ===== featured lineage ===== */}
      {hero && (
        <section className="mx-auto max-w-7xl px-4 py-16 grid lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 relative min-h-[420px] overflow-hidden border border-line halftone">
            <Art seed={hero.id} className="absolute inset-0 border-0" />
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-bg to-transparent">
              <div className="mono text-yellow">LINEAGE // {hero.id}</div>
              <h2 className="display text-4xl riso mt-1">{hero.title.toUpperCase()}</h2>
              <p className="mono text-muted mt-1">{A[hero.owner_id]?.name.toUpperCase()} · {hero.city.toUpperCase()} · {hero.year}</p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <Window title="FIVE CITIES · ONE JACKET" right={<Link href={`/map?work=${hero.id}`} className="text-yellow">OPEN ON MAP →</Link>}>
              <p className="text-ink/80 mb-4">
                A strip pattern from Kumasi, cut in Berlin, shot in Mexico City, scored in Tokyo, sewn in Dakar —
                then licensed to Johannesburg for an upcycled second life. Every contributor below has a split in the public ledger.
              </p>
              <Credits rows={heroCredits} artists={A} />
            </Window>
          </div>
        </section>
      )}

      {/* ===== pillars on kente ===== */}
      <section className="relative py-16 overflow-hidden">
        <KenteStrip className="absolute inset-0 w-full h-full opacity-25" seed={4} />
        <div className="relative mx-auto max-w-7xl px-4 grid md:grid-cols-3 gap-4">
          {[
            ["01 // CREATIVE COMMONS", "Artists share patterns, motifs and techniques for reinterpretation. Every reuse is attributed on the map and in the ledger."],
            ["02 // MULTIDISCIPLINARY", "Designers, weavers, photographers, musicians and makers collaborate on paid commissions with transparent credit."],
            ["03 // CIRCULAR", "Preorders fund limited runs. Garments are repaired, upcycled and re-licensed, and contributors get a contractual share."],
          ].map(([t, d]) => (
            <Window key={t} title={t} right="◆"><p className="text-ink/80">{d}</p></Window>
          ))}
        </div>
      </section>

      {/* ===== current drop ===== */}
      {openDrop && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="mono text-magenta">PREORDER OPEN · CLOSES {openDrop.closes}</div>
              <h2 className="display text-5xl riso mt-1">{openDrop.name.toUpperCase()}</h2>
            </div>
            <Link href="/shop" className="nav text-xs hover:text-yellow">All garments →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((w) => <GarmentCard key={w.id} w={w} owner={A[w.owner_id]} funding={funding[w.id] ?? { units: 0, goal: 0 }} />)}
          </div>
        </section>
      )}

      {/* ===== join ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="relative overflow-hidden border border-magenta p-8 md:p-14">
          <Stars className="absolute inset-0 w-full h-full opacity-60" seed={11} />
          <RisoSun className="absolute -right-20 -bottom-24 w-72 h-72 opacity-70" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="display text-5xl riso">ARE YOU A MAKER?</h2>
              <p className="text-ink/80 mt-3 max-w-md">Designers, weavers, shoemakers, photographers, musicians, ateliers. Put your pin on the map.</p>
            </div>
            <Link href="/me" className="btn btn-green">Apply to the collective</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
