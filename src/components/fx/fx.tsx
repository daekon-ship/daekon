/* =========================================================================
   fx.tsx — motion toolkit (print-brutalist).
   Fast, snappy, honest: mask reveals, a proper ticker, magnetic buttons.
   All disabled under prefers-reduced-motion.
   ========================================================================= */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LogoMark } from "../../brand/Logo";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* Reveal — quick pop into place */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "figure" | "p" | "h2" | "h3";
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={`fx-reveal${inView ? " is-visible" : ""} ${className}`.trim()}
      style={{ "--fx-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/* Lines — headlines rise out of masks, line by line */
export function Lines({
  lines,
  className = "",
  as: Tag = "div",
}: {
  lines: { text: string; className?: string }[];
  className?: string;
  as?: "div" | "h1" | "h2" | "p";
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <Tag
      ref={ref as never}
      className={`fx-lines${inView ? " is-visible" : ""} ${className}`.trim()}
    >
      {lines.map((l, i) => (
        <span className={`line-mask ${l.className ?? ""}`.trim()} key={i}>
          <span style={{ "--fx-delay": `${i * 90}ms` } as CSSProperties}>
            {l.text}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/* Marquee — the ticker. Duplicate track, CSS loop, pauses on hover. */
export function Marquee({ items, dark = false }: { items: string[]; dark?: boolean }) {
  const row = items.map((item, i) => (
    <span className="ticker__item" key={i} aria-hidden={i > 0 || undefined}>
      {item}
    </span>
  ));
  return (
    <div className={`ticker${dark ? " ticker--dark" : ""}`} aria-label="Szolgáltatások">
      <div className="ticker__track" role="presentation">
        {row}
        {items.map((item, i) => (
          <span className="ticker__item" key={`b-${i}`} aria-hidden="true">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Magnetic — button leans toward the pointer */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced.current) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.12}px, ${dy * 0.16}px)`;
    };
    const reset = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <span ref={ref} className="magnetic">
      {children}
    </span>
  );
}

/* Scramble — decode-in for mono metadata */
const GLYPHS = "01<>[]{}/\\|=+*#ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function Scramble({ text, speed = 24 }: { text: string; speed?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(text);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (!inView) return;
    if (reduced.current) return;
    let frame = 0;
    let raf = 0;
    const total = text.length;
    const tick = () => {
      frame++;
      const settled = Math.floor(frame / 2);
      let out = "";
      for (let i = 0; i < total; i++) {
        if (i < settled || text[i] === " ") out += text[i];
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setDisplay(out);
      if (settled <= total) raf = window.setTimeout(tick, speed);
    };
    tick();
    return () => window.clearTimeout(raf);
  }, [inView, text, speed]);

  return (
    <span ref={ref} className="scramble" aria-label={text} role="text">
      {display}
    </span>
  );
}

/* ScrollProgress — thin ink bar */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setP(max > 0 ? doc.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      className="scroll-progress"
      style={{ "--p": `${Math.round(p * 100)}%` } as CSSProperties}
      aria-hidden="true"
    />
  );
}

/* Tilt — 3D lean toward the pointer (cards, panels) */
export function Tilt({
  children,
  className = "",
  max = 5,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced.current) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-2px)`;
    };
    const reset = () => {
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
    };
  }, [max]);

  return (
    <div ref={ref} className={`tilt ${className}`.trim()}>
      {children}
    </div>
  );
}

/* Cursor — glow dot + trailing ring (fine pointers only) */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = prefersReducedMotion();
    if (!fine || reduced) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
      const t = e.target as Element | null;
      const labelEl =
        t && typeof t.closest === "function"
          ? t.closest<HTMLElement>("[data-cursor-label]")
          : null;
      const hot = !!(
        t && typeof t.closest === "function" && t.closest("a, button, [data-cursor]")
      );
      ring.classList.toggle("is-hot", hot && !labelEl);
      ring.classList.toggle("is-label", !!labelEl);
      if (labelEl) {
        ring.dataset.label = labelEl.dataset.cursorLabel ?? "";
      } else {
        delete ring.dataset.label;
      }
    };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}

/* AuroraFX — living neon light-field behind the whole page.
   Four additive color blobs drift on sine paths; composite 'lighter'
   gives the Lusion-style bloom. Pauses off-screen and on hidden tabs. */
const AURORA_COLORS: [string, number][] = [
  ["0,245,255", 0.5],
  ["63,108,255", 0.6],
  ["160,107,255", 0.5],
  ["255,92,225", 0.42],
];

export function AuroraFX() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let t = 0;
    type Blob = {
      bx: number; by: number; r: number;
      sx: number; sy: number; ph: number;
      col: [string, number];
    };
    let blobs: Blob[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 700 ? 4 : 7;
      blobs = Array.from({ length: n }, (_, i) => ({
        bx: Math.random(),
        by: Math.random(),
        r: 0.22 + Math.random() * 0.3,
        sx: 0.00016 + Math.random() * 0.0004,
        sy: 0.00014 + Math.random() * 0.00038,
        ph: Math.random() * Math.PI * 2,
        col: AURORA_COLORS[i % AURORA_COLORS.length],
      }));
    };

    const step = () => {
      if (!running) {
        raf = 0;
        return;
      }
      t += 16;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const x = (b.bx + Math.sin(t * b.sx + b.ph) * 0.3) * w;
        const y = (b.by + Math.cos(t * b.sy + b.ph * 1.3) * 0.26) * h;
        const rr = b.r * Math.max(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, `rgba(${b.col[0]},${b.col[1]})`);
        g.addColorStop(1, `rgba(${b.col[0]},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      raf = requestAnimationFrame(step);
    };

    resize();
    raf = requestAnimationFrame(step);
    window.addEventListener("resize", resize);
    const io = new IntersectionObserver((entries) => {
      running = entries[0]?.isIntersecting ?? true;
      if (running && !raf) raf = requestAnimationFrame(step);
    });
    io.observe(canvas);
    const onVis = () => {
      running = !document.hidden;
      if (running && !raf) raf = requestAnimationFrame(step);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="fx-aurora" aria-hidden="true" />;
}

/* Particles — constellation field, pauses off-screen and when idle */
export function Particles({ density = 64 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    if (prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
    let pts: P[] = [];

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(density, Math.round((w * h) / 17000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.6,
        hue: [185, 226, 275, 310][Math.floor(Math.random() * 4)],
      }));
    };

    const step = () => {
      if (!running) {
        raf = 0;
        return;
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -12) p.x = w + 12;
        else if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12;
        else if (p.y > h + 12) p.y = -12;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 12100) {
            const alpha = (1 - Math.sqrt(d2) / 110) * 0.16;
            ctx.strokeStyle = `hsla(${a.hue}, 100%, 72%, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `hsla(${p.hue}, 100%, 74%, 0.55)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };

    resize();
    raf = requestAnimationFrame(step);
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    const io = new IntersectionObserver((entries) => {
      running = entries[0]?.isIntersecting ?? true;
      if (running && !raf) raf = requestAnimationFrame(step);
    });
    io.observe(canvas);
    const onVis = () => {
      running = !document.hidden;
      if (running && !raf) raf = requestAnimationFrame(step);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  return <canvas ref={ref} className="fx-particles" aria-hidden="true" />;
}

/* Preloader — brand + counter boot screen, then fade */
export function Preloader() {
  const [gone, setGone] = useState(false);
  const [fade, setFade] = useState(false);
  const [n, setN] = useState(0);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (reduced.current) {
      setGone(true);
      return;
    }
    const start = performance.now();
    const dur = 950;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        document.documentElement.classList.add("is-booted");
        setFade(true);
        window.setTimeout(() => setGone(true), 520);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (gone) return null;
  return (
    <div className={`preloader${fade ? " is-done" : ""}`} aria-hidden="true">
      <div className="preloader__inner">
        <LogoMark size={58} className="preloader__logo" />
        <span className="preloader__word">DAEKON</span>
        <span className="preloader__num">{n}%</span>
        <span className="preloader__bar">
          <i style={{ width: `${n}%` }} />
        </span>
      </div>
    </div>
  );
}

/* CountUp — number eases up when scrolled into view */
export function CountUp({
  to,
  suffix = "",
  duration = 1100,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [v, setV] = useState(0);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (!inView) return;
    if (reduced.current) {
      setV(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {v}
      {suffix}
    </span>
  );
}

/* BackToTop — floating glass button after scrolling */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`backtotop${show ? " is-show" : ""}`}
      aria-label="Vissza a tetejére"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: reduced.current ? "auto" : "smooth" })
      }
    >
      ↑
    </button>
  );
}
