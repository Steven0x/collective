// Procedural cultural motifs. All are abstractions in the collective's palette —
// gestures toward traditions (strip weaving, adinkra, glyph columns, signage),
// not reproductions of any specific pattern. Replace with artists' real work as it arrives.

const M = "#ff2d95", Y = "#ffd23f", I = "#3b2cff", C = "#38e8ff", G = "#e3b341", R = "#ff3d2e", K = "#0b0a1a";

/** Strip-weave band: alternating warp blocks, kente-inspired geometry. */
export function KenteStrip({ className = "", seed = 1 }: { className?: string; seed?: number }) {
  const cols = 14, pal = [Y, M, I, G, R, C];
  return (
    <svg viewBox={`0 0 ${cols * 20} 60`} preserveAspectRatio="none" className={className} aria-hidden>
      {Array.from({ length: cols }).map((_, i) => {
        const c = pal[(i * 7 + seed) % pal.length];
        const alt = pal[(i * 3 + seed + 2) % pal.length];
        return (
          <g key={i}>
            <rect x={i * 20} y={0} width={20} height={60} fill={c} />
            <rect x={i * 20} y={i % 2 ? 10 : 30} width={20} height={20} fill={alt} />
            <rect x={i * 20 + 4} y={i % 2 ? 42 : 2} width={12} height={4} fill={K} opacity={0.7} />
            <rect x={i * 20 + 4} y={i % 2 ? 50 : 10} width={12} height={4} fill={K} opacity={0.7} />
          </g>
        );
      })}
    </svg>
  );
}

/** Adinkra-style symbol grid: concentric circles, spirals, crosses on a tile. */
export function AdinkraGrid({ className = "", color = Y, rows = 3, cols = 6 }: { className?: string; color?: string; rows?: number; cols?: number }) {
  const sym = (i: number, x: number, y: number) => {
    const k = i % 4;
    if (k === 0) return <g key={i}><circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth={2} /><circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth={2} /><circle cx={x} cy={y} r={2.5} fill={color} /></g>;
    if (k === 1) return <path key={i} d={`M${x} ${y - 14}v28M${x - 14} ${y}h28M${x - 9} ${y - 9}l18 18M${x - 9} ${y + 9}l18 -18`} stroke={color} strokeWidth={2} fill="none" />;
    if (k === 2) return <path key={i} d={`M${x - 12} ${y} a12 12 0 1 1 24 0 a8 8 0 1 0 -16 0 a4 4 0 1 1 8 0`} stroke={color} strokeWidth={2} fill="none" />;
    return <g key={i}><rect x={x - 12} y={y - 12} width={24} height={24} fill="none" stroke={color} strokeWidth={2} transform={`rotate(45 ${x} ${y})`} /><rect x={x - 5} y={y - 5} width={10} height={10} fill={color} /></g>;
  };
  return (
    <svg viewBox={`0 0 ${cols * 40} ${rows * 40}`} className={className} aria-hidden>
      {Array.from({ length: rows * cols }).map((_, i) => sym(i + Math.floor(i / cols), (i % cols) * 40 + 20, Math.floor(i / cols) * 40 + 20))}
    </svg>
  );
}

/** Glyph column: tall panel of abstract pictograms in gold on indigo, hieroglyphic in rhythm. */
export function GlyphColumn({ className = "", seed = 0 }: { className?: string; seed?: number }) {
  const rows = 18;
  const glyph = (i: number, y: number) => {
    const k = (i + seed) % 6, x = 10;
    switch (k) {
      case 0: return <path key={i} d={`M${x} ${y}h20v6h-20zM${x + 4} ${y + 10}h12v4h-12z`} fill={G} />;
      case 1: return <circle key={i} cx={x + 10} cy={y + 7} r={6} fill="none" stroke={G} strokeWidth={2} />;
      case 2: return <path key={i} d={`M${x + 2} ${y + 14}l8 -14l8 14z`} fill={G} />;
      case 3: return <path key={i} d={`M${x} ${y + 2}h20M${x} ${y + 7}h20M${x} ${y + 12}h20`} stroke={G} strokeWidth={2} />;
      case 4: return <path key={i} d={`M${x + 10} ${y}v14M${x + 3} ${y + 5}l7 -5l7 5`} stroke={G} strokeWidth={2} fill="none" />;
      default: return <rect key={i} x={x + 4} y={y + 1} width={12} height={12} fill="none" stroke={G} strokeWidth={2} transform={`rotate(45 ${x + 10} ${y + 7})`} />;
    }
  };
  return (
    <svg viewBox="0 0 40 420" preserveAspectRatio="none" className={className} aria-hidden>
      <rect width="40" height="420" fill={I} />
      <rect x="2" y="2" width="36" height="416" fill="none" stroke={G} strokeWidth="1.5" />
      {Array.from({ length: rows }).map((_, i) => glyph(i, 14 + i * 22))}
    </svg>
  );
}

/** Vertical neon sign with stacked characters. */
export function NeonSign({ text, color = "magenta", className = "" }: { text: string; color?: "magenta" | "yellow" | "cyan"; className?: string }) {
  return (
    <div className={`vertical nav text-xl md:text-2xl neon neon-${color} flicker border-2 border-current px-2 py-3 rounded-sm ${className}`}
      style={{ boxShadow: "0 0 12px currentColor, inset 0 0 12px currentColor" }}>
      {text}
    </div>
  );
}

/** Halftone riso sun with rays. */
export function RisoSun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <defs>
        <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.6" fill={K} /></pattern>
        <radialGradient id="sun"><stop offset="0" stopColor={Y} /><stop offset="0.7" stopColor={M} /><stop offset="1" stopColor={R} /></radialGradient>
      </defs>
      {Array.from({ length: 24 }).map((_, i) => (
        <line key={i} x1="200" y1="200" x2={200 + 260 * Math.cos((i / 24) * Math.PI * 2)} y2={200 + 260 * Math.sin((i / 24) * Math.PI * 2)} stroke={Y} strokeWidth={i % 2 ? 2 : 6} opacity="0.45" />
      ))}
      <circle cx="200" cy="200" r="120" fill="url(#sun)" />
      <circle cx="200" cy="200" r="120" fill="url(#dots)" opacity="0.5" />
      <rect x="80" y="196" width="240" height="4" fill={K} opacity="0.4" />
      <rect x="80" y="214" width="240" height="4" fill={K} opacity="0.4" />
      <rect x="80" y="232" width="240" height="4" fill={K} opacity="0.4" />
    </svg>
  );
}

/** Concentric rings, Kongkee-style perspective tunnel. */
export function Tunnel({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="none" className={className} aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={20 * i} y={20 * i} width={400 - 40 * i} height={400 - 40 * i} fill="none" stroke={i % 2 ? M : Y} strokeWidth="6" opacity={0.9 - i * 0.08} />
      ))}
    </svg>
  );
}

/** Starfield for cosmic backgrounds. */
export function Stars({ className = "", n = 90, seed = 3 }: { className?: string; n?: number; seed?: number }) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return (
    <svg viewBox="0 0 800 400" preserveAspectRatio="none" className={className} aria-hidden>
      {Array.from({ length: n }).map((_, i) => <circle key={i} cx={rnd() * 800} cy={rnd() * 400} r={rnd() * 1.6 + 0.3} fill={i % 7 ? "#fff" : G} opacity={0.4 + rnd() * 0.6} />)}
      <circle cx={680} cy={70} r={22} fill={Y} /><circle cx={672} cy={64} r={22} fill={K} opacity={0.85} />
    </svg>
  );
}
