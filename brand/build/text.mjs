// =====================================================================
// text.mjs — string → SVG path helper (Archivo variable font, OFL 1.1)
// Normalizes to cap height = 100 units, baseline at y = 100.
// =====================================================================
import * as fontkit from 'fontkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.join(__dirname, 'fonts', 'Archivo-Var.ttf');

const font = fontkit.openSync(FONT);
const inst = font.getVariation ? font.getVariation({ wdth: 100, wght: 640 }) : font;

const CAP_FONT_UNITS = inst.glyphForCodePoint('D'.codePointAt(0)).bbox.maxY;
const S = 100 / CAP_FONT_UNITS;

// small absolute-command d transformer (M L H V Q C Z)
function transformD(d, m) {
  if (!d) return '';
  const tok = d.match(/[MLHVQCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  let i = 0, out = '', cmd, nums = [];
  const emit = () => {
    if (!cmd) return;
    const p = [];
    let k = 0;
    switch (cmd) {
      case 'M': case 'L':
        for (; k < nums.length; k += 2) p.push(f(nums[k], nums[k + 1]));
        break;
      case 'H':
        for (; k < nums.length; k += 1) { const [x, y] = cur(k); p.push(f(x, y)); }
        break;
      case 'V':
        for (; k < nums.length; k += 1) { const [x, y] = curV(k); p.push(f(x, y)); }
        break;
      case 'Q':
        for (; k < nums.length; k += 4) p.push(f(nums[k], nums[k + 1]), f(nums[k + 2], nums[k + 3]));
        break;
      case 'C':
        for (; k < nums.length; k += 6) p.push(f(nums[k], nums[k + 1]), f(nums[k + 2], nums[k + 3]), f(nums[k + 4], nums[k + 5]));
        break;
      case 'Z': break;
    }
    out += cmd + p.join(' ');
    nums = [];
  };
  let cx = 0, cy = 0;
  const cur = (k) => [nums[k], cy];
  const curV = (k) => [cx, nums[k]];
  const f = (x, y) => {
    const X = m.a * x + m.c * y + m.dx;
    const Y = m.b * x + m.d * y + m.f;
    cx = X; cy = Y;
    return (Math.round(X * 100) / 100) + ' ' + (Math.round(Y * 100) / 100);
  };
  for (; i < tok.length; i++) {
    const t = tok[i];
    if (/[MLHVQCZ]/i.test(t) && t.length === 1) { emit(); cmd = t.toUpperCase(); }
    else nums.push(parseFloat(t));
  }
  emit();
  return out;
}

/**
 * Lay out a string as vector paths.
 * @param {string} str     text to render (uppercase recommended)
 * @param {number} track   extra tracking in cap units (default 6)
 * @returns {{ paths: string[], width: number, cap: number }}
 */
export function textPaths(str, track = 6) {
  const run = inst.layout(str);
  let x = 0;
  const paths = [];
  for (let i = 0; i < run.glyphs.length; i++) {
    const g = run.glyphs[i];
    const adv = run.positions[i].xAdvance;
    const d = transformD(g.path.toSVG(), { a: S, b: 0, c: 0, d: -S, dx: x, f: 100 });
    if (d) paths.push(d);
    x += adv * S + track;
  }
  return { paths, width: Math.round((x - track) * 100) / 100, cap: 100 };
}
