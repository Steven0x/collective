import Link from "next/link";
import { CRAFT_COLOR, ROLE_COLOR } from "@/lib/colors";
import type { Artist, Work, Contribution } from "@/lib/types";
import { FillBar } from "@/components/retro";

export function Window({
  title, children, className = "", right,
}: { title: string; children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <div className={`win ${className}`}>
      <div className="win-bar">
        <span>{title}</span>
        <span>{right ?? "[x]"}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Art({ seed, className = "", label, src }: { seed: string; className?: string; label?: string; src?: string }) {
  const colors = ["#ff2d95", "#ffd23f", "#3b2cff", "#38e8ff", "#e3b341", "#ff3d2e"];
  const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const c = colors[h % colors.length], c2 = colors[(h * 7 + 1) % colors.length], c3 = colors[(h * 13 + 2) % colors.length];
  return (
    <div className={`art ${className}`} style={{ "--c": c, "--c2": c2, "--c3": c3 } as React.CSSProperties}>
      {src?.startsWith("http") && <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      {label && <span className="absolute bottom-2 left-2 mono text-muted">{label}</span>}
    </div>
  );
}

export function CraftTag({ craft }: { craft: string }) {
  return (
    <span className="mono inline-flex items-center gap-1.5 uppercase">
      <span className="inline-block w-2 h-2" style={{ background: CRAFT_COLOR[craft] ?? ROLE_COLOR[craft] ?? "#888" }} />
      {craft}
    </span>
  );
}

export function ArtistCard({ a }: { a: Artist }) {
  return (
    <Link href={`/artists/${a.slug}`} className="win block hover:border-magenta transition-colors">
      <Art seed={a.id} className="aspect-[4/5]" />
      <div className="p-3 space-y-1">
        <div className="nav text-sm">{a.name}</div>
        <div className="flex justify-between">
          <CraftTag craft={a.primary_craft} />
          <span className="mono text-muted">{a.city.toUpperCase()}</span>
        </div>
      </div>
    </Link>
  );
}

export function GarmentCard({ w, owner, funding }: { w: Work; owner?: Artist; funding: { units: number; goal: number } }) {
  return (
    <Link href={`/shop/${w.slug}`} className="win block hover:border-magenta transition-colors shake">
      <Art seed={w.id} className="aspect-[3/4]" />
      <div className="p-3 space-y-2">
        <div className="nav text-sm">{w.title}</div>
        <div className="mono text-muted">{owner?.name.toUpperCase()} · {w.city.toUpperCase()}</div>
        <div className="flex justify-between items-center">
          <span className="mono">${w.price_usd}</span>
          <span className="mono text-yellow">{funding.units}/{funding.goal} FUNDED</span>
        </div>
        <Progress value={funding.units} max={funding.goal} />
      </div>
    </Link>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const cells = 20;
  const filled = Math.round((pct / 100) * cells);
  void filled; void cells;
  return (
    <div className="flex items-center gap-2" aria-label={`${pct}% funded`}>
      <FillBar pct={pct} className="flex-1" />
      <span className="mono text-yellow w-10 text-right">{pct}%</span>
    </div>
  );
}

export function Credits({ rows, artists }: { rows: Contribution[]; artists: Record<string, Artist> }) {
  return (
    <table className="w-full mono">
      <tbody>
        {rows.map((c) => {
          const a = artists[c.contributor_id];
          return (
            <tr key={c.id} className="border-t border-line">
              <td className="py-2 pr-2">
                <span className="inline-block w-2 h-2 mr-2" style={{ background: ROLE_COLOR[c.role] ?? "#888" }} />
                {c.role.toUpperCase()}
              </td>
              <td className="py-2 pr-2">
                <Link href={`/artists/${a?.slug}`} className="hover:text-yellow">{a?.name}</Link>
              </td>
              <td className="py-2 pr-2 text-muted">{a?.city.toUpperCase()}</td>
              <td className="py-2 text-right">{c.split_pct}%</td>
              <td className="py-2 pl-2 text-right text-muted">{c.status === "pending" ? "PENDING" : ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export const byId = <T extends { id: string }>(xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x])) as Record<string, T>;
