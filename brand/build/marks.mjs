// =====================================================================
// DAEKON mark geometry — all in a 200×200 box (y grows downward).
// Wordmark: cap height 100, baseline y=100 (from wordmark.json).
// =====================================================================

// ---------------------------------------------------------------
// CONCEPT A — "SPLIT D"  (the developed direction)
// A bold, squarish D cut by a vertical seam into two interlocking
// halves: graphite stem-half + blue bowl-half. Reads as a D, a
// door opening, and a system split into two precise parts.
// ---------------------------------------------------------------
const A = {
  left: 'M 16 10 L 71 10 L 71 44 L 50 44 L 50 156 L 71 156 L 71 190 L 16 190 Z',
  right: 'M 77 10 L 110 10 A 66 66 0 0 1 176 76 L 176 124 A 66 66 0 0 1 110 190 ' +
         'L 77 190 L 77 156 L 104 156 A 38 38 0 0 0 142 118 L 142 82 ' +
         'A 38 38 0 0 0 104 44 L 77 44 Z',
};

// ---------------------------------------------------------------
// CONCEPT B — "KAPU" (portal/arch with hidden A crossbar)
// ---------------------------------------------------------------
const B = {
  arch: 'M 20 180 L 20 60 A 40 40 0 0 1 60 20 L 140 20 A 40 40 0 0 1 180 60 L 180 180 Z',
  hole: 'M 70 180 L 70 90 A 30 30 0 0 1 130 90 L 130 180 Z',
  bar: 'M 70 94 L 130 94 L 130 110 L 70 110 Z',
};

// ---------------------------------------------------------------
// CONCEPT C — "SAROK" (interwoven corner brackets)
// ---------------------------------------------------------------
const C = {
  br: 'M 172 172 L 42 172 L 42 142 L 142 142 L 142 28 L 172 28 Z',
  tl: 'M 28 28 L 158 28 L 158 58 L 58 58 L 58 172 L 28 172 Z',
};

// ---- mark SVG inner builders (for 200×200 box) ----
// scheme: { a, b } two fills; mono → a === b
export function markAInner({ a, b }) {
  return `<path d="${A.left}" fill="${a}"/><path d="${A.right}" fill="${b}"/>`;
}
export function markBInner({ a, b }) {
  return `<path d="${B.arch}" fill-rule="evenodd" fill="${a}"/><path d="${B.bar}" fill="${b}"/>`;
}
export function markCInner({ a, b }) {
  return `<path d="${C.br}" fill="${b}"/><path d="${C.tl}" fill="${a}"/>`;
}

// ---------------------------------------------------------------
// Final SVG documents
// ---------------------------------------------------------------
function svg(vb, inner, label = 'DAEKON') {
  const [x, y, w, h] = vb;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;
}

export const markVB = [0, 0, 200, 200];

/** Standalone mark, tight 200×200 box. */
export function markSvg(build, scheme) {
  return svg(markVB, build(scheme));
}

/** Standalone mark with breathing room (favicon / app icon). pad in units of 200. */
export function markPaddedSvg(build, scheme, pad = 16) {
  return svg([-pad, -pad, 200 + 2 * pad, 200 + 2 * pad], build(scheme));
}

/**
 * Horizontal lockup: mark (cap≈100) + gap + DAEKON wordmark (cap 100).
 * Returns { svg, width, height }.
 */
export function horizontal(build, scheme, wordmark, gap = 36) {
  const s = 100 / 200;
  const markW = 200 * s;                       // 100
  const textX = markW + gap;
  const W = textX + wordmark.width;
  const inner =
    `<g transform="scale(${s})">${build(scheme)}</g>` +
    `<g transform="translate(${textX} 0)">${wordmark.glyphs.map(g => `<path d="${g.d}" fill="${scheme.text}"/>`).join('')}</g>`;
  const vb = [-6, -6, W + 12, 112];
  return { svg: svg(vb, inner), width: W + 12, height: 112 };
}

/** Stacked lockup: mark 200 + gap + wordmark scaled to 150 wide, centered. */
export function stacked(build, scheme, wordmark, gap = 30, textW = 150) {
  const ts = textW / wordmark.width;
  const textH = 100 * ts;
  const tx = (200 - textW) / 2;
  const H = 200 + gap + textH;
  const inner =
    build(scheme) +
    `<g transform="translate(${tx} ${200 + gap}) scale(${ts})">${wordmark.glyphs.map(g => `<path d="${g.d}" fill="${scheme.text}"/>`).join('')}</g>`;
  const vb = [-6, -6, 212, H + 12];
  return { svg: svg(vb, inner), width: 212, height: H + 12 };
}

export const concepts = { A: { build: markAInner, name: 'SPLIT D' }, B: { build: markBInner, name: 'KAPU' }, C: { build: markCInner, name: 'SAROK' } };
