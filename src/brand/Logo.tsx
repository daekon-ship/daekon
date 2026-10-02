/* =========================================================================
   Logo.tsx — the DAEKON brand, 2026 aurora cut.
   A gradient "split-D" monogram: cobalt→cyan→violet tile, white geometric
   D with one diagonal seam — system, cut open. Scales from favicon to
   poster. Uses useId so multiple marks never share gradient ids.
   ========================================================================= */
import { useId } from "react";

export function LogoMark({
  size = 26,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={id}
          x1="6"
          y1="4"
          x2="58"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#62E6FF" />
          <stop offset="0.5" stopColor="#4D6BFF" />
          <stop offset="1" stopColor="#8F7BFF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="15" fill={`url(#${id})`} />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="14.25"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      <path
        fillRule="evenodd"
        d="M17 11 H31.5 C44.6 11 53.5 19.7 53.5 32 C53.5 44.3 44.6 53 31.5 53 H17 Z M26 20.6 H31.4 C39.2 20.6 44.2 25.2 44.2 32 C44.2 38.8 39.2 43.4 31.4 43.4 H26 Z"
        fill="#F4F6FF"
      />
      <path
        d="M41.5 5 L26 59"
        stroke="rgba(6, 7, 13, 0.45)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
      <LogoMark size={Math.round(size * 1.3)} className="brandmark__logo" />
      <span className="brandmark__word">DAEKON</span>
    </span>
  );
}
