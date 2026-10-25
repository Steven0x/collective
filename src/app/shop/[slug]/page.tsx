import Link from "next/link";
import { notFound } from "next/navigation";
import { garments, workBySlug, allArtists, allWorks, contributionsFor, timelineFor, ledgerFor, fundingFor, dropById, lineageFor } from "@/lib/data";
import { Art, Window, Credits, Progress, byId } from "@/components/ui";
import PreorderButton from "@/components/PreorderButton";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await garments()).map((w) => ({ slug: w.slug }));
}

export default async function GarmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await workBySlug(slug);
  if (!w || w.type !== "garment") notFound();
  const [credits, tl, led, f, drop, lin, artists, works] = await Promise.all([
    contributionsFor(w.id), timelineFor(w.id), ledgerFor(w.id), fundingFor(w.id),
    w.drop_id ? dropById(w.drop_id) : Promise.resolve(undefined), lineageFor(w.id), allArtists(), allWorks(),
  ]);
  const A = byId(artists);
  const W = byId(works);
  const owner = A[w.owner_id];
  const paid = led.filter((l) => l.status === "paid").reduce((s, l) => s + Number(l.amount_usd), 0);
  const accrued = led.filter((l) => l.status === "accrued").reduce((s, l) => s + Number(l.amount_usd), 0);
  const sourceWorks = credits.filter((c) => c.source_work_id).map((c) => W[c.source_work_id!]).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 grid grid-cols-2 gap-2">
        <Art seed={w.id} className="aspect-[3/4] col-span-2" label="CAMPAIGN 01" />
        <Art seed={w.id + "a"} className="aspect-square" label="DETAIL" />
        <Art seed={w.id + "b"} className="aspect-square" label="FLAT" />
      </div>

      <div className="lg:col-span-5 space-y-5">
        <div>
          <div className="mono text-muted">{drop?.name.toUpperCase()} · {w.id}</div>
          <h1 className="display text-4xl mt-1">{w.title}</h1>
          <div className="mono mt-2">
            BY <Link href={`/artists/${owner?.slug}`} className="text-green hover:underline">{owner?.name.toUpperCase()}</Link> · {w.city.toUpperCase()} · {w.year}
          </div>
        </div>
        <p className="text-muted">{w.description}</p>

        <Window title="PREORDER" right={<span className={f.status === "preorder_open" ? "text-orange" : ""}>{f.status.replace("_", " ").toUpperCase()}</span>}>
          <div className="flex items-end justify-between mb-2">
            <span className="display text-3xl">${w.price_usd}</span>
            <span className="mono text-green">{f.units} OF {f.goal} FUNDED</span>
          </div>
          <Progress value={f.units} max={f.goal} />
          <div className="mono text-muted mt-2">CLOSES {drop?.closes} · SHIPS ~90 DAYS AFTER CLOSE</div>
          <PreorderButton workId={w.id} price={w.price_usd ?? 0} status={f.status} />
        </Window>

        <Window title={`CREDITS // ${credits.length} CONTRIBUTORS`} right={<Link href={`/map?work=${w.id}`} className="text-green">MAP →</Link>}>
          <Credits rows={credits} artists={A} />
          {sourceWorks.length > 0 && (
            <div className="mono text-muted mt-3">REUSES: {sourceWorks.map((s) => s!.title).join(" · ")}</div>
          )}
        </Window>

        <Window title="PUBLIC ROYALTY LEDGER" right="APPEND-ONLY">
          <div className="grid grid-cols-3 gap-2 mono">
            <div><div className="text-muted">ORDERS</div><div className="text-xl">{new Set(led.map((l) => l.order_id)).size}</div></div>
            <div><div className="text-muted">PAID OUT</div><div className="text-xl text-green">${paid.toFixed(0)}</div></div>
            <div><div className="text-muted">ACCRUED</div><div className="text-xl text-orange">${accrued.toFixed(0)}</div></div>
          </div>
          <p className="mono text-muted mt-3">10% PLATFORM FEE. SPLITS ABOVE APPLY TO NET. EVERY ROW IS VISIBLE TO EVERY CONTRIBUTOR.</p>
        </Window>

        <Window title="CARE · REPAIR · UPCYCLE">
          <ul className="mono space-y-1 text-muted">
            <li>→ FREE REPAIR FOR 5 YEARS VIA PRODUCTION PARTNER</li>
            <li>→ RETURN FOR UPCYCLE: 15% CREDIT TOWARD NEXT DROP</li>
            <li>→ RESALE: NO ROYALTY OWED. DERIVATIVE DESIGNS: OPT-IN LICENSE, SEE ABOUT</li>
          </ul>
          {lin?.derivatives?.length ? (
            <div className="mono mt-3">
              DERIVATIVES: {lin.derivatives.map((d) => { const dw = W[d]; return dw ? <Link key={d} href={`/shop/${dw.slug}`} className="text-orange hover:underline">{dw.title}</Link> : null; })}
            </div>
          ) : null}
        </Window>
      </div>

      <div className="lg:col-span-12">
        <Window title={`PROCESS TIMELINE // ${tl.length} EVENTS`}>
          <ol className="grid md:grid-cols-4 lg:grid-cols-8 gap-3">
            {tl.map((t, i) => (
              <li key={t.id} className="border-l border-line pl-3">
                <div className="mono text-yellow">{String(i + 1).padStart(2, "0")}</div>
                <div className="nav text-xs mt-1">{t.stage.replace("_", " ")}</div>
                <div className="mono text-muted mt-1">{t.date}<br />{t.city.toUpperCase()}</div>
              </li>
            ))}
          </ol>
        </Window>
      </div>
    </div>
  );
}
