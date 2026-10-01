import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BUILD, SVG_DIR, C as COL, componentsCount, probePixel, contrast } from './lib.mjs';

const read = (n) => fs.readFileSync(path.join(SVG_DIR, n), 'utf8');
let fail = 0;
const check = (name, got, want, cmp = (a, b) => a === b) => {
  const ok = cmp(got, want);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: ${got}${ok ? '' : ' (want ' + want + ')'}`);
};

// 1) wordmark: 6 separate letters (D-A-E-K-O-N) at 256 and 64 px
for (const w of [256, 64]) {
  const n = await componentsCount(read('daekon-wordmark.svg'), w, 0.002);
  check(`wordmark letters @${w}px`, n, 6);
}

// 2) mark: 2 components at 128 / 32, all schemes
for (const f of ['daekon-mark.svg', 'daekon-mark-dark.svg', 'daekon-mark-mono-black.svg']) {
  for (const w of [128, 32]) {
    const n = await componentsCount(read(f), w, w === 32 ? 0.02 : 0.002);
    check(`${f} components @${w}px`, n, 2);
  }
}

// 3) mark probes: seam + counter open, stem/bowl correct colors (light)
const mark = read('daekon-mark.svg');
check('seam open (alpha=0)', (await probePixel(mark, 74 / 200, 0.5))[3], 0);
check('counter open (alpha=0)', (await probePixel(mark, 120 / 200, 0.5))[3], 0);
check('stem is ink', (await probePixel(mark, 0.15, 0.5))[0] < 40, true);
check('bowl is blue', (await probePixel(mark, 0.8, 0.35))[2] > 150, true);

// 4) horizontal lockup: 9 letters, seam open at global scale
const H = read('daekon-logo-horizontal.svg');
const nH = await componentsCount(H, 600, 0.001);
check('horizontal letters+mark parts', nH, 8); // 6 letters + 2 mark parts
const meta = await sharp(Buffer.from(H)).metadata();
const seamX = (37 - (-6)) / (meta.width); // mark seam at x=37 in vb, vb starts -6
check('horizontal seam open', (await probePixel(H, seamX, 0.5))[3], 0);

// 5) contrast
check('blue on white >= 3.0', contrast(COL.blue, '#FFFFFF') >= 3.0, true);
check('blueDark on bgDark >= 3.0', contrast(COL.blueDark, COL.bgDark) >= 3.0, true);
check('white on bgDark >= 4.5', contrast(COL.white, COL.bgDark) >= 4.5, true);
check('ink on white >= 4.5', contrast(COL.ink, '#FFFFFF') >= 4.5, true);
console.log('   ratios: blue/white =', contrast(COL.blue, '#FFFFFF').toFixed(2),
  '| blueDark/bgDark =', contrast(COL.blueDark, COL.bgDark).toFixed(2),
  '| white/bgDark =', contrast(COL.white, COL.bgDark).toFixed(2));

// 6) favicon 16px: tile visible (non-transparent bg + light pixels present)
const icoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
<rect width="16" height="16" fill="${COL.bgDark}"/>
<g transform="translate(1.6 1.6) scale(${13.6 / 232}) translate(16 16) scale(1)">${fs.readFileSync(path.join(SVG_DIR, 'daekon-mark-dark.svg'), 'utf8').match(/<path[^>]+>/g).join('')}</g>
</svg>`;
const { data } = await sharp(Buffer.from(icoSvg)).resize({ width: 16, height: 16, fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let light = 0, blue = 0;
for (let i = 0; i < 16 * 16; i++) {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
  if (a > 200 && r > 200 && g > 200 && b > 200) light++;
  if (a > 200 && b > 150 && r < 120) blue++;
}
check('favicon16 white px > 8', light > 8, true);
check('favicon16 blue px > 8', blue > 8, true);

console.log(fail === 0 ? '\nALL QA PASS' : `\n${fail} QA FAILURES`);
process.exit(fail === 0 ? 0 : 1);
