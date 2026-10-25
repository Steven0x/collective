import Link from "next/link";
import { notFound } from "next/navigation";
import { allArtists, allWorks, artistBySlug, worksBy, contributionsBy, earningsFor, ledgerBy, licensesForWorks } from "@/lib/data";
import { Art, Window, CraftTag, byId } from "@/components/ui";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await allArtists()).map((a) => ({ slug: a.slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await artistBySlug(slug);
  if (!a) notFound();
  const [owned, allCredits, earnings, recent, artists, works] = await Promise.all([
    worksBy(a.id), contributionsBy(a.id), earningsFor(a.id), ledgerBy(a.id), allArtists(), allWorks(),
  ]);
  const credits = allCredits.filter((c) => !owned.some((w) => w.id === c.work_id));
  const myLicenses = await licensesForWorks(owned.map((w) => w.id));
  const A = byId(artists);
  const W = byId(works);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-4">
        <Art seed={a.id} className="aspect-[4/5]" />
        <h1 className="display text-4xl riso">{a.name}</h1>
        <div className="mono text-muted">{a.city.toUpperCase()}, {a.country.toUpperCase()} · {a.lat.toFixed(4)}, {a.lng.toFixed(4)}</div>
        <div className="flex gap-2 flex-wrap">{a.roles.map((r) => <span key={r} className="mono border border-line px-1.5 py-0.5">{r.replace("_", " ").toUpperCase()}</span>)}</div>
        <p className="text-muted">{a.bio}</p>
        <div className="mono space-y-1 border-t border-line pt-3">
          <div className="flex justify-between"><span>AVAILABILITY</span><span className={a.availability === "open" ? "text-green" : "text-orange"}>{a.availability.toUpperCase()}</span></div>
          <div className="flex justify-between"><span>DEFAULT LICENSE</span><span>{a.default_license.replace("_", " + ").toUpperCase()}</span></div>
          <div className="flex justify-between"><span>JOINED</span><span>{a.joined_at}</span></div>
          <div className="flex justify-between"><span>IG</span><span>{a.socials?.instagram}</span></div>
        </div>
        <div className="flex gap-2">
          <Link href={`/map`} className="btn btn-green flex-1 text-center">View on map</Link>
          <Link href={`/collaborate?with=${a.slug}`} className="btn flex-1 text-center">Commission</Link>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <Window title={`WORKS // ${owned.length}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {owned.map((w) => (
              <Link key={w.id} href={w.type === "garment" ? `/shop/${w.slug}` : `/map`} className="win hover:border-magenta">
                <Art seed={w.id} className="aspect-square" />
                <div className="p-2">
                  <div className="mono truncate">{w.title}</div>
                  <div className="mono text-muted">{w.type.toUpperCase()} · {w.year}</div>
                </div>
              </Link>
            ))}
          </div>
        </Window>

        <Window title={`CREDITS RECEIVED // ${credits.length}`}>
          <table className="w-full mono">
            <tbody>
              {credits.map((c) => {
                const w = W[c.work_id];
                const owner = w ? A[w.owner_id] : undefined;
                return (
                  <tr key={c.id} className="border-t border-line">
                    <td className="py-2"><CraftTag craft={c.role} /></td>
                    <td className="py-2"><Link href={`/shop/${w?.slug}`} className="hover:text-yellow">{w?.title}</Link></td>
                    <td className="py-2 text-muted">{owner?.name} · {w?.city.toUpperCase()}</td>
                    <td className="py-2 text-right">{c.split_pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Window>

        <div className="grid md:grid-cols-2 gap-6">
          <Window title="EARNINGS LEDGER">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><div className="mono text-muted">PAID</div><div className="display text-3xl text-green">${earnings.paid.toFixed(0)}</div></div>
              <div><div className="mono text-muted">ACCRUED</div><div className="display text-3xl text-orange">${earnings.accrued.toFixed(0)}</div></div>
            </div>
            <table className="w-full mono">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-1 text-muted">{r.created_at}</td>
                    <td className="py-1">{W[r.work_id]?.title}</td>
                    <td className="py-1 text-right">${Number(r.amount_usd).toFixed(2)}</td>
                    <td className={`py-1 pl-2 text-right ${r.status === "paid" ? "text-green" : "text-orange"}`}>{r.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Window>
          <Window title={`OPEN LICENSES // ${myLicenses.length}`}>
            {myLicenses.length === 0 ? <p className="mono text-muted">NO LICENSES ISSUED YET.</p> : (
              <ul className="space-y-2 mono">
                {myLicenses.map((l) => (
                  <li key={l.id} className="border-t border-line pt-2">
                    <div className="flex justify-between"><span>{W[l.source_work_id]?.title}</span><span className={l.status === "signed" ? "text-green" : "text-orange"}>{l.status.toUpperCase()}</span></div>
                    <div className="text-muted">→ {A[l.licensee_id]?.name} · {l.scope} · {l.royalty_pct}%</div>
                  </li>
                ))}
              </ul>
            )}
          </Window>
        </div>
      </div>
    </div>
  );
}
