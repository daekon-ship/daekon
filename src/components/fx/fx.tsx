/* =========================================================================
   fx.tsx — animation toolkit (see styles/fx.css).
   Slow, weighted, cinematic motion; everything degrades gracefully under
   prefers-reduced-motion.
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
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ---- Reveal: fade+rise+deblur when scrolled into view ---- */
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

/* ---- Lines: display headlines rising out of overflow masks, line by line.
       Each entry: { text, className? } — className e.g. "dim" / "accent". */
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

/* ---- Parallax: gentle scroll-driven drift (speed in px at full viewport) ---- */
export function Parallax({
  children,
  speed = 40,
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
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5-ish
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

/* ---- ProcessProgress: fills the process spine (0→1) as it crosses the view ---- */
export function ProcessProgress({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty("--fill", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.78 - r.top) / (r.height || 1)));
      el.style.setProperty("--fill", p.toFixed(3));
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
  }, []);
  return (
    <div ref={ref} className="process">
      {children}
    </div>
  );
}

/* ---- Scramble: decode-in text effect (runs once, when visible) ---- */
const GLYPHS = "01<>[]{}/\\|=+*#ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function Scramble({ text, speed = 28 }: { text: string; speed?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(text);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (!inView) return;
    if (reduced.current) return; // keep static
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

/* ---- Magnetic: element leans toward the pointer ---- */
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
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.22}px)`;
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

/* ---- Marquee: quiet capability ticker ---- */
export function Marquee({ items }: { items: string[] }) {
  const row = items.map((item, i) => (
    <span className="marquee__item" key={i} aria-hidden={i > 0 || undefined}>
      {item}
    </span>
  ));
  return (
    <div className="marquee" aria-label="Képességek">
      <div className="marquee__track" role="presentation">
        {row}
        {items.map((item, i) => (
          <span className="marquee__item" key={`b-${i}`} aria-hidden="true">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- Words: word-by-word entrance for display headlines ---- */
export function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span className="words">
      {words.map((w, i) => (
        <span key={i} className="w" style={{ "--i": i } as CSSProperties}>
          {w}{" "}
        </span>
      ))}
    </span>
  );
}

/* ---- CursorGlow: cool studio light following the pointer (desktop only) ---- */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 3;
    let x = tx;
    let y = ty;
    let raf = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const loop = () => {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

/* ---- ScrollProgress: hairline electric progress bar ---- */
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
