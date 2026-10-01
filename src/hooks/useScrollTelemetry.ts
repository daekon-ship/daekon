import { useEffect, useRef, useState } from "react";

export interface ScrollTelemetry {
  scrollPercent: number;
  scrollVelocity: number;
  viewport: { width: number; height: number };
}

/** Real, browser-read values — scroll position, scroll speed, viewport size.
 * Not a decorative animation; drives the hero "live page state" readout. */
export function useScrollTelemetry(): ScrollTelemetry {
  const [state, setState] = useState<ScrollTelemetry>(() => ({
    scrollPercent: 0,
    scrollVelocity: 0,
    viewport: {
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
    },
  }));

  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const lastScrollT = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const ticking = useRef(false);

  useEffect(() => {
    function updateScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight || 1;
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));

      const now = performance.now();
      const dt = Math.max(1, now - lastScrollT.current);
      const dy = window.scrollY - lastScrollY.current;
      const velocity = Math.round(Math.abs(dy) / (dt / 1000));

      lastScrollY.current = window.scrollY;
      lastScrollT.current = now;
      ticking.current = false;

      setState((prev) => ({ ...prev, scrollPercent: Math.round(pct), scrollVelocity: velocity }));
    }

    function onScroll() {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(updateScroll);
      }
    }

    function onResize() {
      setState((prev) => ({
        ...prev,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      }));
    }

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return state;
}
