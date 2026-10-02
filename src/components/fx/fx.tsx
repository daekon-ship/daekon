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
