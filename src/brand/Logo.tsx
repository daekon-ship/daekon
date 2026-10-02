/* =========================================================================
   Logo.tsx — the DAEKON brand, 2026 "core" cut.
   A split-D monogram: a stem bar and an open C-bowl with a clean gap
   between them — system and opening in one — with a glowing core square
   floating in the counter. Two-tone cyan→cobalt→violet, no tile, so it
   sits on any surface and prints in one color too.
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
          id={`${id}-a`}
          x1="13"
          y1="11"
          x2="24.5"
          y2="53"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#62E6FF" />
          <stop offset="1" stopColor="#4D6BFF" />
        </linearGradient>
        <linearGradient
          id={`${id}-b`}
          x1="30"
          y1="11"
          x2="56"
          y2="53"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#4D6BFF" />
          <stop offset="1" stopColor="#8F7BFF" />
        </linearGradient>
      </defs>
      <rect x="13" y="11" width="11.5" height="42" rx="1.5" fill={`url(#${id}-a)`} />
      <path
        d="M30 11 H34.2 C47.4 11 56 20.2 56 32 C56 43.8 47.4 53 34.2 53 H30 V41 H35 C40.8 41 44.6 37.2 44.6 32 C44.6 26.8 40.8 23 35 23 H30 Z"
        fill={`url(#${id}-b)`}
      />
      <rect x="33.4" y="28.4" width="7.2" height="7.2" rx="1" fill="#7DEBFF" />
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
