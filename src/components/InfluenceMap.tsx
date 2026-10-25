"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
// Serve the worker from /public so the bundler never has to resolve its URL.
if (typeof window !== "undefined") maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
import Link from "next/link";
import type { Pin, Lineage, Artist, Work, LineageArc } from "@/lib/types";
import { CRAFT_COLOR, ROLE_COLOR } from "@/lib/colors";

// Free dark raster tiles for the scaffold. Swap for a MapTiler/Protomaps style JSON later.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto", paint: { "raster-saturation": -0.6, "raster-contrast": 0.25, "raster-hue-rotate": 230, "raster-brightness-max": 0.75 } }],
};

type Props = {
  pins: Pin[];
  artists: Artist[];
  works: Work[];
  lineages: Record<string, Lineage>;
  initialWork?: string;
};

// Great-circle interpolation so arcs curve instead of cutting straight.
function arcCoords(from: [number, number], to: [number, number], n = 48): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const [lon1, lat1] = [toRad(from[0]), toRad(from[1])];
  const [lon2, lat2] = [toRad(to[0]), toRad(to[1])];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2));
  if (d === 0) return [from, to];
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    pts.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
  }
  return pts;
}

export default function InfluenceMap({ pins, artists, works, lineages, initialWork }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [workId, setWorkId] = useState<string | null>(initialWork ?? null);
  const [stageIdx, setStageIdx] = useState<number>(-1);
  const [trail, setTrail] = useState<string[]>([]);
  const [filterCraft, setFilterCraft] = useState<string | null>(null);

  const artist = artists.find((a) => a.id === artistId) ?? null;
  const work = works.find((w) => w.id === workId) ?? null;
  const lineage = workId ? lineages[workId] : null;

  // ---- init map ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [10, 20],
      zoom: 1.6,
      minZoom: 1,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
    map.on("load", () => {
      map.addSource("pins", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("arcs", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("nodes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      map.addLayer({
        id: "arcs-glow", type: "line", source: "arcs",
        paint: { "line-color": ["get", "color"], "line-width": 6, "line-opacity": 0.18, "line-blur": 4 },
      });
      map.addLayer({
        id: "arcs", type: "line", source: "arcs",
        paint: { "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": ["case", ["get", "active"], 1, 0.25] },
      });
      map.addLayer({
        id: "nodes-glow", type: "circle", source: "nodes",
        paint: { "circle-radius": 14, "circle-color": ["get", "color"], "circle-opacity": 0.25, "circle-blur": 1 },
      });
      map.addLayer({
        id: "nodes", type: "circle", source: "nodes",
        paint: { "circle-radius": 5, "circle-color": ["get", "color"], "circle-stroke-color": "#0b0a1a", "circle-stroke-width": 1.5 },
      });
      map.addLayer({
        id: "pins", type: "circle", source: "pins",
        paint: {
          "circle-radius": ["+", 4, ["*", 1.2, ["get", "work_count"]]],
          "circle-color": ["get", "color"],
          "circle-opacity": ["case", ["get", "dim"], 0.25, 0.9],
          "circle-stroke-color": "#0b0a1a",
          "circle-stroke-width": 1.5,
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
      map.on("mouseenter", "pins", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Pin;
        popup.setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(`${p.name.toUpperCase()}<br/><span style="color:#8a877f">${p.craft.toUpperCase()} · ${p.city.toUpperCase()}</span>`)
          .addTo(map);
      });
      map.on("mouseleave", "pins", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
      map.on("click", "pins", (e) => {
        const p = e.features?.[0]?.properties as Pin | undefined;
        if (p) { setArtistId(p.artist_id); setWorkId(null); setStageIdx(-1); setTrail((t) => [...t, p.name]); }
      });
      map.on("click", "nodes", (e) => {
        const n = e.features?.[0]?.properties as { artist_id?: string; name: string } | undefined;
        if (n?.artist_id) { setArtistId(n.artist_id); setWorkId(null); setStageIdx(-1); setTrail((t) => [...t, n.name]); }
      });
      map.on("mouseenter", "nodes", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "nodes", () => (map.getCanvas().style.cursor = ""));
      map.resize();
      setReady(true);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ---- pins ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("pins") as maplibregl.GeoJSONSource;
    src.setData({
      type: "FeatureCollection",
      features: pins
        .filter((p) => !filterCraft || p.craft === filterCraft)
        .map((p) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
          properties: { ...p, color: CRAFT_COLOR[p.craft], dim: !!workId },
        })),
    });
  }, [pins, ready, filterCraft, workId]);

  // ---- lineage arcs + nodes ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const arcsSrc = map.getSource("arcs") as maplibregl.GeoJSONSource;
    const nodesSrc = map.getSource("nodes") as maplibregl.GeoJSONSource;
    if (!lineage || !work) {
      arcsSrc.setData({ type: "FeatureCollection", features: [] });
      nodesSrc.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const activeStage = stageIdx >= 0 ? lineage.timeline[stageIdx] : null;
    const activeDate = activeStage?.date ?? "9999";
    // arcs active if their contribution was confirmed before the scrubbed stage
    const isActive = (a: LineageArc) => {
      if (stageIdx < 0) return true;
      if (a.type === "influence") return true;
      const ev = lineage.timeline.find((t) => t.contribution_id === a.contribution_id);
      return ev ? ev.date <= activeDate : true;
    };
    arcsSrc.setData({
      type: "FeatureCollection",
      features: lineage.arcs.map((a) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates: arcCoords(a.from, a.to) },
        properties: { color: ROLE_COLOR[a.type] ?? "#888", active: isActive(a) },
      })),
    });
    nodesSrc.setData({
      type: "FeatureCollection",
      features: [
        ...lineage.nodes.map((n) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [n.lng, n.lat] },
          properties: { ...n, color: ROLE_COLOR[n.role] ?? "#888" },
        })),
        { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [work.lng, work.lat] }, properties: { name: work.title, role: "home", color: "#f4ecd8" } },
      ],
    });
    const b = new maplibregl.LngLatBounds();
    lineage.nodes.forEach((n) => b.extend([n.lng, n.lat]));
    b.extend([work.lng, work.lat]);
    map.fitBounds(b, { padding: { top: 60, bottom: 140, left: 60, right: 440 }, duration: 900, maxZoom: 4 });
  }, [lineage, work, ready, stageIdx]);

  // fly to artist
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !artist || workId) return;
    map.flyTo({ center: [artist.lng, artist.lat], zoom: Math.max(map.getZoom(), 3), duration: 700 });
  }, [artist, workId]);

  const artistWorks = useMemo(() => {
    if (!artist) return [];
    const owned = works.filter((w) => w.owner_id === artist.id);
    const credited = Object.values(lineages)
      .filter((l) => l.nodes.some((n) => n.artist_id === artist.id))
      .map((l) => works.find((w) => w.id === l.work_id)!)
      .filter((w) => w && !owned.includes(w));
    return [...owned, ...credited];
  }, [artist, works, lineages]);

  const selectWork = (id: string) => { setWorkId(id); setStageIdx(-1); };
  const close = () => { setArtistId(null); setWorkId(null); setStageIdx(-1); setTrail([]); };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* filter rail */}
      <div className="absolute top-3 left-3 win">
        <div className="win-bar"><span>FILTER // CRAFT</span><span>▾</span></div>
        <div className="p-2 flex flex-col gap-1">
          {["design", "textile", "photo", "sound", "make"].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCraft(filterCraft === c ? null : c)}
              className={`mono text-left px-2 py-1 flex items-center gap-2 ${filterCraft === c ? "bg-magenta text-ink" : "hover:text-yellow"}`}
            >
              <span className="w-2 h-2 inline-block" style={{ background: CRAFT_COLOR[c] }} />
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* legend */}
      <div className="absolute bottom-3 left-14 mono text-muted flex gap-3 bg-bg/80 px-2 py-1">
        {Object.entries(ROLE_COLOR).filter(([k]) => ["designer", "pattern", "photography", "soundtrack", "production", "influence"].includes(k)).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1"><span className="w-2 h-[2px] inline-block" style={{ background: v }} />{k.toUpperCase()}</span>
        ))}
      </div>

      {/* sidebar */}
      <aside
        className={`absolute top-3 right-3 bottom-3 w-[400px] max-w-[92vw] win overflow-hidden flex flex-col transition-transform duration-200 ${artist || work ? "translate-x-0" : "translate-x-[110%]"}`}
      >
        <div className="win-bar">
          <span className="truncate">{work ? `GARMENT // ${work.id}` : artist ? `ARTIST // ${artist.id}` : ""}</span>
          <button onClick={close} className="hover:text-yellow">[x]</button>
        </div>
        {trail.length > 1 && (
          <div className="mono text-muted px-3 py-1 border-b border-line truncate">
            {trail.map((t) => t.toUpperCase()).join(" → ")}
          </div>
        )}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {work && lineage ? (
            <>
              <button onClick={() => { setWorkId(null); setStageIdx(-1); }} className="mono text-muted hover:text-ink">← BACK TO ARTIST</button>
              <div className="art aspect-[4/3]" />
              <div>
                <h2 className="display text-2xl">{work.title}</h2>
                <div className="mono text-muted mt-1">{work.city.toUpperCase()} · {work.year} · ${work.price_usd}</div>
              </div>
              <p className="text-sm text-muted">{work.description}</p>
              <div>
                <div className="mono text-muted mb-2">CONTRIBUTORS // {lineage.nodes.filter((n) => n.artist_id).length}</div>
                <ul className="space-y-1">
                  {lineage.nodes.map((n, i) => (
                    <li key={i} className="flex items-center justify-between mono">
                      <button
                        className="flex items-center gap-2 hover:text-yellow text-left"
                        onClick={() => n.artist_id && (setArtistId(n.artist_id), setWorkId(null), setTrail((t) => [...t, n.name]))}
                      >
                        <span className="w-2 h-2 inline-block" style={{ background: ROLE_COLOR[n.role] ?? "#888" }} />
                        {n.name}
                      </button>
                      <span className="text-muted">{n.role.toUpperCase()}{n.split_pct != null ? ` · ${n.split_pct}%` : n.era ? ` · ${n.era}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {lineage.derivatives.length > 0 && (
                <div>
                  <div className="mono text-muted mb-1">TRACE FORWARD // DERIVATIVES</div>
                  {lineage.derivatives.map((d) => {
                    const dw = works.find((w) => w.id === d);
                    return dw ? (
                      <button key={d} onClick={() => selectWork(d)} className="mono text-orange hover:underline block">→ {dw.title}</button>
                    ) : null;
                  })}
                </div>
              )}
              <Link href={`/shop/${work.slug}`} className="btn btn-green w-full text-center">Preorder · ${work.price_usd}</Link>
            </>
          ) : artist ? (
            <>
              <div className="flex gap-3">
                <div className="art w-20 h-24 shrink-0" />
                <div>
                  <h2 className="display text-2xl leading-tight">{artist.name}</h2>
                  <div className="mono text-muted mt-1">{artist.city.toUpperCase()}, {artist.country.toUpperCase()}</div>
                  <div className="mono mt-1 flex gap-2 flex-wrap">
                    {artist.roles.map((r) => <span key={r} className="border border-line px-1">{r.replace("_", " ").toUpperCase()}</span>)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted">{artist.bio}</p>
              <div className="mono flex justify-between">
                <span>AVAILABILITY</span>
                <span className={artist.availability === "open" ? "text-yellow" : artist.availability === "limited" ? "text-orange" : "text-muted"}>{artist.availability.toUpperCase()}</span>
              </div>
              <div className="mono flex justify-between">
                <span>DEFAULT LICENSE</span><span>{artist.default_license.replace("_", " + ").toUpperCase()}</span>
              </div>
              <div>
                <div className="mono text-muted mb-2">GALLERY // {artistWorks.length}</div>
                <div className="grid grid-cols-2 gap-2">
                  {artistWorks.map((w) => (
                    <button
                      key={w.id}
                      disabled={w.type !== "garment"}
                      onClick={() => selectWork(w.id)}
                      className={`win text-left ${w.type === "garment" ? "hover:border-green" : "opacity-70"}`}
                    >
                      <div className="art aspect-square" />
                      <div className="p-2">
                        <div className="mono truncate">{w.title}</div>
                        <div className="mono text-muted">{w.type.toUpperCase()}{w.type === "garment" ? " · LIGHT UP ↗" : ""}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Link href={`/artists/${artist.slug}`} className="btn w-full text-center">Full profile</Link>
            </>
          ) : null}
        </div>
      </aside>

      {/* timeline scrubber */}
      {work && lineage && lineage.timeline.length > 0 && (
        <div className="absolute bottom-3 left-3 right-[420px] max-md:right-3 win">
          <div className="win-bar">
            <span>PROCESS TIMELINE // {work.title.toUpperCase()}</span>
            <span>{stageIdx >= 0 ? lineage.timeline[stageIdx].date : "ALL STAGES"}</span>
          </div>
          <div className="p-3">
            <input
              type="range"
              min={-1}
              max={lineage.timeline.length - 1}
              value={stageIdx}
              onChange={(e) => setStageIdx(Number(e.target.value))}
              className="w-full accent-[#ff2d95]"
            />
            <div className="flex justify-between mt-1 gap-1 overflow-x-auto">
              {lineage.timeline.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setStageIdx(i === stageIdx ? -1 : i)}
                  className={`mono whitespace-nowrap ${i === stageIdx ? "text-yellow" : i < stageIdx ? "text-ink" : "text-muted"}`}
                  title={`${t.date} · ${t.city}`}
                >
                  {t.stage.replace("_", " ").toUpperCase()}
                  <span className="block text-[9px] text-muted">{t.city.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
