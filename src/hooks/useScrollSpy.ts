import { useEffect, useRef, useState } from "react";

interface ScrollSpyResult {
  currentId: string;
  visited: Set<string>;
}

/** Drives nav "current section" state (desktop status bar, mobile bottom
 * nav, and the hero telemetry "current section" readout) from a single
 * IntersectionObserver — one source of truth, as in the prototype. */
export function useScrollSpy(sectionIds: string[], initialId: string): ScrollSpyResult {
  const [currentId, setCurrentId] = useState(initialId);
  const visitedRef = useRef<Set<string>>(new Set([initialId]));
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!elements.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
          }
        }
        if (best) {
          const id = best.target.id;
          setCurrentId(id);
          if (!visitedRef.current.has(id)) {
            visitedRef.current.add(id);
            forceRender((n) => n + 1);
          }
        }
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sectionIds]);

  return { currentId, visited: visitedRef.current };
}
