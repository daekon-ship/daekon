/* =========================================================================
   Logo.tsx — the DAEKON identity as inline SVG components.
   The Split-D mark and the horizontal lockup (mark + full DAEKON
   wordmark) rendered from the same vector source as the brand asset set,
   so the site logo is pixel-identical to the exports.
   ========================================================================= */
import { WORDMARK } from "./wordmark";

const MARK_LEFT =
  "M 16 10 L 71 10 L 71 44 L 50 44 L 50 156 L 71 156 L 71 190 L 16 190 Z";
const MARK_RIGHT =
  "M 77 10 L 110 10 A 66 66 0 0 1 176 76 L 176 124 A 66 66 0 0 1 110 190 " +
  "L 77 190 L 77 156 L 104 156 A 38 38 0 0 0 142 118 L 142 82 " +
  "A 38 38 0 0 0 104 44 L 77 44 Z";

/** Standalone Split-D mark. */
export function LogoMark({
  size = 28,
  stem = "#14161B",
  bowl = "#1636E7",
  className,
}: {
  size?: number;
  stem?: string;
  bowl?: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d={MARK_LEFT} fill={stem} />
      <path d={MARK_RIGHT} fill={bowl} />
    </svg>
  );
}

/**
 * Horizontal lockup: Split-D mark (cap ≈ 100) + gap + full DAEKON wordmark,
 * exactly the brand's horizontal() construction, with an optional subtle
 * drop-shadow for premium display contexts.
 */
export function LogoLockup({
  height = 28,
  stem = "#14161B",
  bowl = "#1636E7",
  text = "#14161B",
  className,
  label = "DAEKON",
  shadow = false,
}: {
  height?: number;
  stem?: string;
  bowl?: string;
  text?: string;
  className?: string;
  label?: string;
  shadow?: boolean;
}) {
  const s = 100 / 200; // mark cap ≈ 100
  const textX = 100 + 36;
  const W = textX + WORDMARK.width;
  return (
    <svg
      className={className}
      viewBox={`-8 -8 ${W + 16} 116`}
      height={height}
      role="img"
      aria-label={label}
      style={{
        height,
        width: "auto",
        display: "block",
        filter: shadow ? "drop-shadow(0 6px 18px rgba(22, 54, 231, 0.18))" : undefined,
      }}
    >
      <g transform={`scale(${s})`}>
        <path d={MARK_LEFT} fill={stem} />
        <path d={MARK_RIGHT} fill={bowl} />
      </g>
      <g transform={`translate(${textX} 0)`}>
        {WORDMARK.glyphs.map((g, i) => (
          <path key={i} d={g.d} fill={text} />
        ))}
      </g>
    </svg>
  );
}
