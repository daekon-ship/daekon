import type { ReactNode } from "react";
import "./Panel.css";

export type StatusTone = "ready" | "pending" | "neutral" | "error";

interface PanelProps {
  eyebrow: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  timestamp?: string;
  /** extra node rendered in the header, after the status chip (e.g. a badge) */
  headerExtra?: ReactNode;
  dimmed?: boolean;
  calm?: boolean;
  proseContent?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Shared "instrument panel" chrome: eyebrow / status chip / timestamp header
 * plus a content region. Reused by the work, services, about and contact
 * sections — genuinely repeated chrome, not speculative abstraction.
 */
export function Panel({
  eyebrow,
  statusLabel,
  statusTone = "neutral",
  timestamp,
  headerExtra,
  dimmed = false,
  calm = false,
  proseContent = false,
  className,
  children,
}: PanelProps) {
  const classes = ["panel", "panel--wide"];
  if (dimmed) classes.push("panel--dimmed");
  if (calm) classes.push("panel--calm");
  if (className) classes.push(className);

  return (
    <div className={classes.join(" ")}>
      <header className="panel__header">
        <span className="panel__eyebrow">{eyebrow}</span>
        {statusLabel && (
          <span className={`statuschip statuschip--${statusTone}`}>{statusLabel}</span>
        )}
        {headerExtra}
        {timestamp && <span className="panel__timestamp">{timestamp}</span>}
      </header>
      <div className={proseContent ? "panel__content panel__content--prose" : "panel__content"}>
        {children}
      </div>
    </div>
  );
}
