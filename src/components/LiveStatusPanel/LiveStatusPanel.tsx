import { useRef } from "react";
import { useClock } from "../../hooks/useClock";
import { useScrollTelemetry } from "../../hooks/useScrollTelemetry";
import "./LiveStatusPanel.css";

const SECTION_LABELS: Record<string, string> = {
  hero: "Nyitó",
  work: "Munkák",
  services: "Szolgáltatások",
  process: "Folyamat",
  velemenyek: "Vélemények",
  gyik: "GYIK",
  about: "Rólam",
  offer: "Ajánlat",
  quote: "Árajánlat",
  contact: "Kapcsolat",
};

interface LiveStatusPanelProps {
  currentSectionId: string;
}

/**
 * Hero "live page state" telemetry — real, browser-read values only
 * (local time, scroll %, scroll velocity, viewport size, current section).
 * Not a decorative animation; this is the concept the whole page proves.
 */
export function LiveStatusPanel({ currentSectionId }: LiveStatusPanelProps) {
  const clock = useClock();
  const { scrollPercent, scrollVelocity, viewport } = useScrollTelemetry();
  const ref = useRef<HTMLElement>(null);

  return (
    <aside
      className="telemetry"
      ref={ref}
      aria-label="Élő oldalállapot (tájékoztató jellegű)"
      onPointerEnter={(e) => {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          e.currentTarget.style.borderColor = "var(--border-strong)";
        }
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
    >
      <div className="telemetry__head">
        <span className="telemetry__title">OLDALÁLLAPOT</span>
        <span className="telemetry__live">élő</span>
      </div>
      <dl className="telemetry__rows">
        <div className="telemetry__row">
          <dt>Helyi idő</dt>
          <dd>{clock}</dd>
        </div>
        <div className="telemetry__row">
          <dt>Görgetés</dt>
          <dd>{scrollPercent}%</dd>
        </div>
        <div className="telemetry__row">
          <dt>Görgetési sebesség</dt>
          <dd>{scrollVelocity} px/s</dd>
        </div>
        <div className="telemetry__row">
          <dt>Nézetméret</dt>
          <dd>{viewport.width}×{viewport.height}</dd>
        </div>
        <div className="telemetry__row">
          <dt>Aktuális szakasz</dt>
          <dd>{SECTION_LABELS[currentSectionId] ?? "—"}</dd>
        </div>
      </dl>
      <p className="telemetry__note">Ezek valós, a böngésződből olvasott értékek — nem díszítő animáció.</p>
    </aside>
  );
}
