// =====================================================================
// emit-wordmark-ts.mjs — wordmark.json → src/brand/wordmark.ts
// Keeps the site's rendered logo identical to the brand vector source.
// Run:  cd daekon/brand/build && node emit-wordmark-ts.mjs
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { BUILD } from './lib.mjs';

const wm = JSON.parse(fs.readFileSync(path.join(BUILD, 'wordmark.json'), 'utf8'));

const out = `// AUTO-GENERATED from brand/build/wordmark.json — do not edit by hand.
// Regenerate: cd brand/build && node emit-wordmark-ts.mjs
export interface WordmarkGlyph {
  ch: string;
  x: number;
  d: string;
}

export const WORDMARK = {
  width: ${wm.width},
  cap: ${wm.cap},
  track: ${wm.track},
  glyphs: [
${wm.glyphs
  .map((g) => `    { ch: ${JSON.stringify(g.ch)}, x: ${g.x}, d: ${JSON.stringify(g.d)} },`)
  .join('\n')}
  ] as WordmarkGlyph[],
} as const;
`;

const target = path.join(BUILD, '..', '..', 'src', 'brand', 'wordmark.ts');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out);
console.log('written:', target, Math.round(out.length / 1024) + ' KB');
