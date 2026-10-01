import { useEffect, useState } from "react";

function formatNow(): string {
  return new Date().toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Real local time, ticking every second — used by the status bar clock and
 * the hero telemetry panel. Genuinely live, not a decorative animation. */
export function useClock(): string {
  const [time, setTime] = useState(formatNow);

  useEffect(() => {
    const id = window.setInterval(() => setTime(formatNow()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}
