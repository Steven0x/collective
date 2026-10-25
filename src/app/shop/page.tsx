import { garments, allDrops, allOrders, allArtists, fundingMap } from "@/lib/data";
import { GarmentCard, Progress, byId } from "@/components/ui";

export const metadata = { title: "Shop — COLLECTIVE" };
export const revalidate = 300;

export default async function Shop() {
  const [g, drops, orders, artists] = await Promise.all([garments(), allDrops(), allOrders(), allArtists()]);
  const funding = await fundingMap(g.map((w) => w.id));
  const A = byId(artists);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
      {drops.slice().reverse().map((d) => {
        const items = g.filter((w) => w.drop_id === d.id);
        const units = orders.filter((o) => o.drop_id === d.id).reduce((s, o) => s + o.qty, 0);
        return (
          <section key={d.id}>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <div className={`mono ${d.status === "preorder_open" ? "text-orange" : "text-muted"}`}>
                  {d.status.replace("_", " ").toUpperCase()} · {d.opens} → {d.closes}
                </div>
                <h2 className="display text-4xl riso">{d.name.toUpperCase()}</h2>
              </div>
              <div className="w-64"><Progress value={units} max={d.goal_units} /></div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((w) => <GarmentCard key={w.id} w={w} owner={A[w.owner_id]} funding={funding[w.id] ?? { units: 0, goal: 0 }} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
