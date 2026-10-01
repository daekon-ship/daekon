import * as fontkit from 'fontkit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.join(__dirname, 'fonts', 'Archivo-Var.ttf');

const font = fontkit.openSync(FONT);
console.log('family:', font.familyName, '| upem:', font.unitsPerEm,
  '| axes:', (font.variationAxes || {}).wght?.min, '-', (font.variationAxes || {}).wght?.max);

const WGHT = 640;
const inst = font.getVariation ? font.getVariation({ wdth: 100, wght: WGHT }) : font;

const CAP = 100;                 // normalized cap height
const TRACK = 16;                // extra tracking in cap units (tuned visually)
const WORD = 'DAEKON';

// cap height from 'D' bbox
const dglyph = inst.glyphForCodePoint('D'.codePointAt(0));
const capFontUnits = dglyph.bbox.maxY;
const s = CAP / capFontUnits;
console.log('capHeight(font units):', capFontUnits, 'scale:', s.toFixed(5));

// ---- small absolute-command d transformer (M L H V Q C Z) ----
function transformD(d, m) {
  // m = {a,b,c,d:e,f,dx,dy} maps (x,y) -> (a*x + c*y + dx, b*x + d*y + f)
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

// ---- layout glyphs ----
const run = inst.layout(WORD);
const upem = inst.unitsPerEm;
let x = 0;
const glyphs = [];
for (let i = 0; i < run.glyphs.length; i++) {
  const g = run.glyphs[i];
  const adv = run.positions[i].xAdvance;
  const dFont = g.path.toSVG();
  // map: font units -> cap units, y-flip, x offset; baseline at y=100
  const d = transformD(dFont, { a: s, b: 0, c: 0, d: -s, dx: x, f: CAP });
  glyphs.push({ ch: WORD[i], d, adv: Math.round(adv * s * 100) / 100, x: Math.round(x * 100) / 100 });
  x += adv * s + TRACK;
}
const totalW = Math.round((x - TRACK) * 100) / 100;
console.log('wordmark width (cap units):', totalW);

fs.writeFileSync(path.join(__dirname, 'wordmark.json'),
  JSON.stringify({ word: WORD, cap: CAP, width: totalW, track: TRACK, wght: WGHT, glyphs }, null, 1));

// ---- quick test render ----
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -14 ${totalW + 20} ${CAP + 28}">
<rect x="-10" y="-14" width="${totalW + 20}" height="${CAP + 28}" fill="#ffffff"/>
<g fill="#111318">${glyphs.map(g => `<path d="${g.d}"/>`).join('')}</g></svg>`;
fs.writeFileSync(path.join(__dirname, 'wordmark-test.svg'), svg);
await sharp(Buffer.from(svg), { density: 300 }).resize({ width: 1200 }).png()
  .toFile(path.join(__dirname, 'wordmark-test.png'));
console.log('rendered wordmark-test.png');
