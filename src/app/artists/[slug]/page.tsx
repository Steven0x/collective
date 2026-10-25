import Link from "next/link";
import { notFound } from "next/navigation";
import { allArtists, allWorks, artistBySlug, worksBy, contributionsBy, earningsFor, ledgerBy, licensesForWorks, artistInfluences } from "@/lib/data";
import { Art, Window, CraftTag, byId } from "@/components/ui";
import { Stars, GlyphColumn } from "@/components/motifs";
import { OPEN_TO, HERITAGE_RELATION, RATE_BASIS } from "@/lib/profile-options";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await allArtists()).map((a) => ({ slug: a.slug }));
}

const label = (list: readonly (readonly [string, string])[], k?: string | null) => list.find(([x]) => x === k)?.[1];

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a: any = await artistBySlug(slug);
  if (!a) notFound();
  const [owned, allCredits, earnings, recent, artists, works, influences] = await Promise.all([
    worksBy(a.id), contributionsBy(a.id), earningsFor(a.id), ledgerBy(a.id), allArtists(), allWorks(), artistInfluences(a.id),
  ]);
  const credits = allCredits.filter((c) => !owned.some((w) => w.id === c.work_id) && c.status !== "declined");
  const myLicenses = await licensesForWorks(owned.map((w) => w.id));
  const A = byId(artists); const W = byId(works);
  const links: Record<string, string> = a.links ?? {};

  return (
    <div>
      {/* cover */}
      <section className="relative h-72 md:h-96 overflow-hidden border-b border-line">
        {a.cover ? <img src={a.cover} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <Stars className="absolute inset-0 w-full h-full" seed={a.id.length * 3} />}
        <GlyphColumn className="absolute left-0 top-0 h-full w-8 md:w-12" seed={a.id.charCodeAt(5) % 6} />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="absolute right-6 md:right-16 top-6 vertical nav text-2xl md:text-4xl neon neon-yellow flicker hidden sm:block">{a.native_name || a.city}</div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 flex items-end gap-5">
            <Art seed={a.id} src={a.portrait || undefined} className="w-28 h-36 md:w-40 md:h-52 shrink-0 halftone" />
            <div className="min-w-0">
              <div className="mono text-yellow flex flex-wrap gap-x-3">{a.roles.map((r: string) => <span key={r}>{r.replace("_", " ").toUpperCase()}</span>)}{a.verified_lineage && <span className="text-magenta">◆ VERIFIED LINEAGE</span>}</div>
              <h1 className="display text-4xl md:text-6xl riso truncate">{a.name}</h1>
              <div className="mono text-muted">{a.city?.toUpperCase()}, {a.country?.toUpperCase()} · {Number(a.lat).toFixed(3)}, {Number(a.lng).toFixed(3)}{a.pronouns ? ` · ${a.pronouns}` : ""}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-5">
          <p className="text-ink/85 text-lg">{a.bio}</p>
          <div className="mono space-y-1 border-t border-line pt-3">
            <div className="flex justify-between"><span>AVAILABILITY</span><span className={a.availability === "open" ? "text-yellow" : "text-orange"}>{a.availability.toUpperCase()}{a.booked_until ? ` UNTIL ${a.booked_until}` : ""}</span></div>
            <div className="flex justify-between"><span>DEFAULT LICENSE</span><span>{a.default_license.replace("_", " + ").toUpperCase()}</span></div>
            {a.rate_basis && <div className="flex justify-between"><span>RATE BASIS</span><span>{label(RATE_BASIS, a.rate_basis)?.toUpperCase()}</span></div>}
            {a.languages?.length > 0 && <div className="flex justify-between"><span>LANGUAGES</span><span>{a.languages.join(" · ")}</span></div>}
            <div className="flex justify-between"><span>JOINED</span><span>{a.joined_at}</span></div>
            {Object.entries(links).filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex justify-between"><span>{k.toUpperCase()}</span><a href={v.startsWith("http") ? v : `https://${v}`} target="_blank" className="text-yellow truncate max-w-[60%]">{v.replace(/^https?:\/\//, "")}</a></div>)}
          </div>
          {a.open_to?.length > 0 && (
            <div><div className="mono text-muted mb-1">OPEN TO</div><div className="flex flex-wrap gap-1">{a.open_to.map((k: string) => <span key={k} className="mono border border-magenta px-1.5 py-0.5">{label(OPEN_TO, k)}</span>)}</div></div>
          )}
          {(a.specialties?.length || a.materials?.length || a.techniques?.length) ? (
            <div className="mono space-y-2">
              {a.specialties?.length > 0 && <div><span className="text-muted">SPECIALTIES </span>{a.specialties.join(" · ")}</div>}
              {a.materials?.length > 0 && <div><span className="text-muted">MATERIALS </span>{a.materials.join(" · ")}</div>}
              {a.techniques?.length > 0 && <div><span className="text-muted">TECHNIQUES </span>{a.techniques.join(" · ")}</div>}
              {a.capacity?.max_run && <div><span className="text-muted">CAPACITY </span>{a.capacity.min_run ?? "?"}–{a.capacity.max_run} units · {a.capacity.lead_time_weeks ?? "?"} wk lead</div>}
            </div>
          ) : null}
          <div className="flex gap-2">
            <Link href={`/map?artist=${a.id}`} className="btn btn-green flex-1 text-center">View on map</Link>
            <Link href={`/collaborate?with=${a.slug}`} className="btn flex-1 text-center">Commission</Link>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {(a.heritage_statement || influences.length > 0) && (
            <Window title="LINEAGE" right={label(HERITAGE_RELATION, a.heritage_relation)?.toUpperCase() ?? ""}>
              {a.heritage_statement && <p className="text-ink/85 whitespace-pre-line">{a.heritage_statement}</p>}
              {a.mentors && <p className="mono text-muted mt-2">TAUGHT BY: {a.mentors}</p>}
              {influences.length > 0 && (
                <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                  {influences.map((i: any) => (
                    <li key={i.id} className="border-l-2 border-red pl-3">
                      <div className="nav text-xs">{i.place}</div>
                      <div className="mono text-muted">{i.era}{i.note ? ` — ${i.note}` : ""}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Window>
          )}

          <Window title={`WORKS // ${owned.length}`}>
            {owned.length === 0 ? <p className="mono text-muted">NOTHING PUBLISHED YET.</p> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {owned.map((w: any) => (
                  <Link key={w.id} href={w.type === "garment" ? `/shop/${w.slug}` : `/map`} className="win hover:border-magenta">
                    <Art seed={w.id} src={w.media?.[0]?.startsWith("http") ? w.media[0] : undefined} className="aspect-square" />
                    <div className="p-2"><div className="mono truncate">{w.title}</div><div className="mono text-muted">{w.type.toUpperCase()} · {w.year}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </Window>

          {credits.length > 0 && (
            <Window title={`CREDITS RECEIVED // ${credits.length}`}>
              <table className="w-full mono"><tbody>
                {credits.map((c) => { const w = W[c.work_id]; const owner = w ? A[w.owner_id] : undefined; return (
                  <tr key={c.id} className="border-t border-line">
                    <td className="py-2"><CraftTag craft={c.role} /></td>
                    <td className="py-2"><Link href={`/shop/${w?.slug}`} className="hover:text-yellow">{w?.title}</Link></td>
                    <td className="py-2 text-muted">{owner?.name} · {w?.city.toUpperCase()}</td>
                    <td className="py-2 text-right">{c.split_pct}%</td>
                  </tr>); })}
              </tbody></table>
            </Window>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Window title="EARNINGS LEDGER" right="PUBLIC">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><div className="mono text-muted">PAID</div><div className="display text-3xl text-green">${earnings.paid.toFixed(0)}</div></div>
                <div><div className="mono text-muted">ACCRUED</div><div className="display text-3xl text-orange">${earnings.accrued.toFixed(0)}</div></div>
              </div>
              <table className="w-full mono"><tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-1 text-muted">{r.created_at}</td><td className="py-1">{W[r.work_id]?.title}</td>
                    <td className="py-1 text-right">${Number(r.amount_usd).toFixed(2)}</td>
                    <td className={`py-1 pl-2 text-right ${r.status === "paid" ? "text-green" : "text-orange"}`}>{r.status.toUpperCase()}</td>
                  </tr>))}
              </tbody></table>
            </Window>
            <Window title={`LICENSES // ${myLicenses.length}`}>
              {myLicenses.length === 0 ? <p className="mono text-muted">NO LICENSES ISSUED YET.</p> : (
                <ul className="space-y-2 mono">
                  {myLicenses.map((l) => (
                    <li key={l.id} className="border-t border-line pt-2">
                      <div className="flex justify-between"><span>{W[l.source_work_id]?.title}</span><span className={l.status === "signed" ? "text-green" : "text-orange"}>{l.status.toUpperCase()}</span></div>
                      <div className="text-muted">→ {A[l.licensee_id]?.name} · {l.scope} · {l.royalty_pct}%</div>
                    </li>))}
                </ul>
              )}
            </Window>
          </div>
        </div>
      </div>
    </div>
  );
}
