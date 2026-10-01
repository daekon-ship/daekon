/* =========================================================================
   fx.tsx — animation toolkit components (see styles/fx.css).
   All effects degrade gracefully under prefers-reduced-motion.
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

/* ---- Reveal: fade+rise when scrolled into view ---- */
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

/* ---- Marquee: infinite skill strip ---- */
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
          <span className="marquee__item" key={`b-${i}`}>
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

/* ---- CursorGlow: soft blue light following the pointer (desktop only) ---- */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
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

/* ---- ScrollProgress: top bar, gradient fill ---- */
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
