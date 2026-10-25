"use client";
import { useEffect, useRef, useState } from "react";

/** CRT boot sequence, once per session. */
export function BootScreen({ lines }: { lines: string[] }) {
  const [show, setShow] = useState(false);
  const [shown, setShown] = useState<string[]>([]);
  const [out, setOut] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem("booted")) return; sessionStorage.setItem("booted", "1"); } catch { return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShow(true);
    let i = 0;
    const t = setInterval(() => {
      i++; setShown(lines.slice(0, i));
      if (i >= lines.length) { clearInterval(t); setTimeout(() => setOut(true), 500); setTimeout(() => setShow(false), 950); }
    }, 140);
    return () => clearInterval(t);
  }, [lines]);
  if (!show) return null;
  return (
    <div className={`boot ${out ? "out" : "boot-in"}`} aria-hidden>
      <div>
        {shown.map((l, i) => <div key={i} className={i === shown.length - 1 ? "caret" : ""}>{l}</div>)}
      </div>
    </div>
  );
}

/** Types text in, mono readout style. */
export function Typewriter({ text, speed = 28, className = "" }: { text: string; speed?: number; className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(text.length); return; }
    setN(0);
    const t = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(t); return k; } return k + 1; }), speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return <span className={`${className} ${n < text.length ? "caret" : ""}`}>{text.slice(0, n)}</span>;
}

/** Bar that fills when scrolled into view. */
export function FillBar({ pct, className = "" }: { pct: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.style.setProperty("--p", `${Math.min(100, pct)}%`); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, [pct]);
  return <div ref={ref} className={`fill h-2 border border-line bg-bg ${className}`}><i /></div>;
}

/** Cursor spark trail — home page easter egg. */
export function Sparks() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) return;
    const colors = ["#ff2d95", "#ffd23f", "#38e8ff", "#e3b341"];
    let last = 0;
    const on = (e: MouseEvent) => {
      const now = performance.now(); if (now - last < 40) return; last = now;
      const s = document.createElement("span");
      s.className = "spark"; s.style.left = `${e.clientX}px`; s.style.top = `${e.clientY}px`;
      s.style.background = colors[(Math.random() * colors.length) | 0]; s.style.clipPath = "polygon(50% 0, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0 50%, 35% 35%)";
      document.body.appendChild(s); setTimeout(() => s.remove(), 720);
    };
    window.addEventListener("mousemove", on); return () => window.removeEventListener("mousemove", on);
  }, []);
  return null;
}

/** Numbers that count up when visible. */
export function CountUp({ to, className = "", prefix = "", suffix = "" }: { to: number; className?: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), dur = 900;
      const tick = (t: number) => { const k = Math.min(1, (t - t0) / dur); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el); return () => io.disconnect();
  }, [to]);
  return <span ref={ref} className={className}>{prefix}{v.toLocaleString()}{suffix}</span>;
}
