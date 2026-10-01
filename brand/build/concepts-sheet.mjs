import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BUILD, C as COL, componentsCount, probePixel } from './lib.mjs';
import { concepts, horizontal, markSvg } from './marks.mjs';

const wm = JSON.parse(fs.readFileSync(path.join(BUILD, 'wordmark.json'), 'utf8'));

const schemes = {
  light: { text: COL.ink, a: COL.ink, b: COL.blue },
  dark:  { text: COL.white, a: COL.white, b: COL.blueDark },
};

// ---- sheet: 3 concepts × (light row + dark row) ----
let rows = '';
let y = 40;
const LABELS = { A: 'A — SPLIT D', B: 'B — KAPU', C: 'C — SAROK' };
for (const key of ['A', 'B', 'C']) {
  const { build, name } = concepts[key];
  for (const sch of ['light', 'dark']) {
    const { svg: lock, width, height } = horizontal(build, schemes[sch], wm, 36);
    const scale = 640 / width;
    rows += `<g transform="translate(60 ${y}) scale(${scale})">${lock.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
    rows += `<text x="60" y="${y - 14}" font-family="monospace" font-size="15" fill="${sch === 'light' ? '#888' : '#666'}">${LABELS[key]} · ${sch}</text>`;
    y += height * scale + 56;
  }
}
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${y}" width="800" height="${y}">
<rect width="800" height="${y / 2}" fill="#ffffff"/><rect y="${y / 2}" width="800" height="${y / 2}" fill="${COL.bgDark}"/>
${rows}</svg>`;
fs.writeFileSync(path.join(BUILD, 'concepts-sheet.svg'), sheet);
await sharp(Buffer.from(sheet), { density: 144 }).png().toFile(path.join(BUILD, 'concepts-sheet.png'));
console.log('sheet rendered', 800, y);

// ---- QA concept A geometry ----
const markLight = markSvg(concepts.A.build, schemes.light);
const n128 = await componentsCount(markLight, 128, 0.002);
const n32 = await componentsCount(markLight, 32, 0.02);
const seam = await probePixel(markLight, 74 / 200, 0.5);      // seam gap → must be background
const counter = await probePixel(markLight, 120 / 200, 0.5);  // counter → background
const stem = await probePixel(markLight, 30 / 200, 0.5);      // left stem → ink
const bowl = await probePixel(markLight, 160 / 200, 0.35);    // bowl wall → blue
console.log('A: components@128 =', n128, '(expect 2) | components@32 =', n32, '(expect 2)');
console.log('A: seam alpha =', seam[3], '(expect 0) | counter alpha =', counter[3], '(expect 0)');
console.log('A: stem =', stem, '| bowl =', bowl);
console.log('contrast ink/white =', 0, 'blue/white ok if >3');
