/* =========================================================================
   fx.tsx — motion toolkit for the editorial redesign.
   Custom cursor with hover labels, drift-in words, mouse parallax layers,
   line-mask reveals, magnetic buttons. Everything is transform/opacity
   only (rAF-lerped) and fully disabled under prefers-reduced-motion.
   ========================================================================= */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ---- useInView: one-shot intersection observer ---- */
export function useInView<T extends HTMLElement>(threshold = 0.18) {
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

/* ---------------------------------------------------------------------
   Cursor — minimal studio cursor: a dot + trailing ring. Elements with
   [data-cursor="label"] grow the ring and render the label inside it.
   The native cursor stays (usability), this is an additive layer.
   --------------------------------------------------------------------- */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;
    let tx = -100, ty = -100, rx = -100, ry = -100, raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const t = (e.target as HTMLElement)?.closest?.("[data-cursor]");
      const l = t?.getAttribute("data-cursor") ?? "";
      setLabel(l && l !== "true" ? l : "");
      setActive(!!t);
    };
    const loop = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate(${tx}px, ${ty}px)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={dot} className="cursor__dot" />
      <div ref={ring} className={`cursor__ring${active ? " is-active" : ""}`}>
        <span className="cursor__label">{label}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   DriftWords — each word drifts into place from an alternating
   direction (left / right / below) as the block enters the viewport.
   --------------------------------------------------------------------- */
export function DriftWords({
  text,
  className = "",
  as: Tag = "div",
}: {
  text: string;
  className?: string;
  as?: "div" | "h1" | "h2" | "p" | "span";
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.24);
  const dirs = ["l", "r", "b"] as const;
  let i = 0;
  return (
    <Tag
      ref={ref as never}
      className={`drift${inView ? " is-visible" : ""} ${className}`.trim()}
    >
      {text.split(" ").map((w, k) => {
        const dir = dirs[i++ % 3];
        return (
          <span className="drift__mask" key={k}>
            <span className="drift__word" data-dir={dir} style={{ "--d": `${k * 55}ms` } as CSSProperties}>
              {w}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

/* ---------------------------------------------------------------------
   MouseParallax — a layer that leans subtly toward/away from the cursor.
   strength: max px offset.
   --------------------------------------------------------------------- */
export function MouseParallax({
  children,
  strength = 22,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const move = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      tx = nx * strength;
      ty = ny * strength;
    };
    const loop = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return (
    <div ref={ref} className={`mpar ${className}`.trim()}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Reveal — quiet fade/rise for small elements (metadata, paragraphs)
   --------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------
   Lines — display headlines rising out of overflow masks, line by line.
   --------------------------------------------------------------------- */
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
          <span style={{ "--fx-delay": `${i * 110}ms` } as CSSProperties}>
            {l.text}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/* ---------------------------------------------------------------------
   Parallax — gentle vertical scroll drift for images/media.
   --------------------------------------------------------------------- */
export function Parallax({
  children,
  speed = 30,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(p * speed).toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);
  return (
    <div ref={ref} className={`parallax ${className}`.trim()}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Scramble — decode-in for mono metadata
   --------------------------------------------------------------------- */
const GLYPHS = "01<>[]{}/\\|=+*#ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function Scramble({ text, speed = 26 }: { text: string; speed?: number }) {
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

/* ---------------------------------------------------------------------
   Magnetic — element leans toward the pointer
   --------------------------------------------------------------------- */
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
      el.style.transform = `translate(${dx * 0.16}px, ${dy * 0.2}px)`;
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

/* ---------------------------------------------------------------------
   ScrollProgress — hairline top bar
   --------------------------------------------------------------------- */
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
