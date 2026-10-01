import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { BUILD, SVG_DIR, PNG_DIR, C as COL } from './lib.mjs';
import { horizontal, stacked, markSvg, markPaddedSvg, markVB } from './marks.mjs';

const wm = JSON.parse(fs.readFileSync(path.join(BUILD, 'wordmark.json'), 'utf8'));
import { concepts } from './marks.mjs';
const buildA = concepts.A.build;

// ---------- color schemes ----------
const SCHEMES = {
  light:      { text: COL.ink,   a: COL.ink,      b: COL.blue,     tag: '' },
  dark:       { text: COL.white, a: COL.white,    b: COL.blueDark, tag: '-dark' },
  monoBlack:  { text: COL.ink,   a: COL.ink,      b: COL.ink,      tag: '-mono-black' },
  monoWhite:  { text: COL.white, a: COL.white,    b: COL.white,    tag: '-mono-white' },
};

const out = (dir, name) => path.join(dir, name);
const write = (p, s) => { fs.writeFileSync(p, s); return p; };

// ---------- SVG set ----------
const files = {};
for (const [key, sch] of Object.entries(SCHEMES)) {
  const tag = sch.tag;
  const H = horizontal(buildA, sch, wm, 36);
  const S = stacked(buildA, sch, wm, 30, 150);
  files[`daekon-logo-horizontal${tag}.svg`] = H.svg;
  files[`daekon-logo-stacked${tag}.svg`] = S.svg;
  files[`daekon-mark${tag}.svg`] = markSvg(buildA, sch);
  files[`daekon-mark-padded${tag}.svg`] = markPaddedSvg(buildA, sch, 16);
  const tw = 704.93, th = 100;
  files[`daekon-wordmark${tag}.svg`] =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 ${tw + 16} ${th + 16}" role="img" aria-label="DAEKON">` +
    wm.glyphs.map(g => `<path d="${g.d}" fill="${sch.text}"/>`).join('') + `</svg>`;
}
for (const [name, svgStr] of Object.entries(files)) write(out(SVG_DIR, name), svgStr);
console.log('SVG written:', Object.keys(files).length);

// ---------- PNG helper: rasterize SVG at exact target width ----------
async function png(svgStr, name, width, background) {
  const meta = await sharp(Buffer.from(svgStr)).metadata();
  const vbW = meta.width ?? 200;
  const density = 72 * (width / vbW);
  let img = sharp(Buffer.from(svgStr), { density }).resize({ width, fit: 'fill' });
  if (background) img = img.flatten({ background });
  await img.png().toFile(out(PNG_DIR, name));
}

for (const tag of ['', '-dark', '-mono-black', '-mono-white']) {
  await png(files[`daekon-logo-horizontal${tag}.svg`], `daekon-logo-horizontal${tag}.png`, 1200);
  await png(files[`daekon-logo-stacked${tag}.svg`], `daekon-logo-stacked${tag}.png`, 600);
  await png(files[`daekon-mark${tag}.svg`], `daekon-mark${tag}@512.png`, 512);
}
for (const size of [256, 64, 32]) {
  await png(files[`daekon-mark.svg`], `daekon-mark@${size}.png`, size);
  await png(files[`daekon-mark-dark.svg`], `daekon-mark-dark@${size}.png`, size);
}

// ---------- favicon + app icon (dark tile, centered padded mark) ----------
// padded mark viewBox: [-16,-16,232,232] → map into size box with pad fraction p
function tile(size, p) {
  const s = (size * (1 - 2 * p)) / 232;
  const tx = size * p + 32 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" fill="${COL.bgDark}"/>
<g transform="translate(${tx} ${tx}) scale(${s}) translate(-16 -16)">${buildA({ text: COL.white, a: COL.white, b: COL.blueDark })}</g>
</svg>`;
}

const favTmp = [];
for (const size of [48, 32, 16]) {
  const p = path.join(BUILD, `fav-${size}.png`);
  await sharp(Buffer.from(tile(size, 0.10)), { density: 300 })
    .resize({ width: size, height: size, fit: 'fill' }).png().toFile(p);
  favTmp.push(p);
}
const icoBuf = await pngToIco(favTmp);
fs.writeFileSync(out(PNG_DIR, 'favicon.ico'), icoBuf);
for (const p of favTmp) fs.unlinkSync(p);

for (const size of [512, 192]) {
  await sharp(Buffer.from(tile(size, 0.16)), { density: 300 })
    .resize({ width: size, height: size, fit: 'fill' }).png()
    .toFile(out(PNG_DIR, `daekon-app-icon-${size}.png`));
}

// ---------- Facebook profile 1024 ----------
const fb = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<rect width="1024" height="1024" fill="${COL.bgDark}"/>
<g transform="translate(232 232) scale(2.8)">${buildA({ text: COL.white, a: COL.white, b: COL.blueDark })}</g>
</svg>`;
await sharp(Buffer.from(fb), { density: 300 }).resize({ width: 1024, height: 1024, fit: 'fill' })
  .png().toFile(out(PNG_DIR, 'daekon-facebook-profile-1024.png'));

console.log('PNG set done');
