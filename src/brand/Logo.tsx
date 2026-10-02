/* =========================================================================
   Logo.tsx — the DAEKON brand, 2026 cut.
   A pure typographic mark: black caps, tight tracking, and a cobalt
   square period. No curves, no tricks — it prints like a stamp.
   ========================================================================= */

export function BrandMark({
  size = 20,
  inverted = false,
  className = "",
}: {
  size?: number;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`brandmark${inverted ? " brandmark--inverted" : ""} ${className}`.trim()}
      style={{ fontSize: size }}
    >
      DAEKON
      <span className="brandmark__sq" aria-hidden="true" />
    </span>
  );
}
