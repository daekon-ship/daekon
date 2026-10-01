// =====================================================================
// export4k.mjs — premium 4K renders of the DAEKON identity
// Outputs (brand/png/4k/ + Desktop DAEKON_logo/png/4k/):
//   daekon-4k-horizontal-light.png      3840 px wide, transparent
//   daekon-4k-horizontal-dark.png       3840 px wide, transparent
//   daekon-4k-horizontal-light-poster.png   3840×2160, night background
//   daekon-4k-horizontal-dark-poster.png    3840×2160, graphite background
//   daekon-4k-mark-dark.png             3840×3840 transparent mark
//   daekon-4k-mark-tile.png             3840×3840 dark tile with mark
//   daekon-4k-stacked-light/dark.png    2560 px wide, transparent
//   daekon-4k-social-1080.png           1080×1080 social post
// Run:  cd daekon/brand/build && node export4k.mjs
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BUILD, PNG_DIR, C as COL } from './lib.mjs';
import { horizontal, stacked, markSvg, markVB, concepts } from './marks.mjs';
import { textPaths } from './text.mjs';

const wm = JSON.parse(fs.readFileSync(path.join(BUILD, 'wordmark.json'), 'utf8'));
const buildA = concepts.A.build;

const OUT4K = path.join(PNG_DIR, '4k');
fs.mkdirSync(OUT4K, { recursive: true });

// Desktop package (user-facing): C:/Users/octop/OneDrive/Asztali gép/DAEKON_logo/png/4k
const DESKTOP = path.join(process.env.USERPROFILE || 'C:/Users/octop', 'OneDrive', 'Asztali gép', 'DAEKON_logo', 'png', '4k');
let desktopOk = false;
try { fs.mkdirSync(DESKTOP, { recursive: true }); desktopOk = true; } catch { /* no Desktop pkg */ }

const LIGHT = { text: COL.ink, a: COL.ink, b: COL.blue };
const DARK = { text: COL.white, a: COL.white, b: COL.blueDark };

const jobs = [];
async function png(svgStr, name, { width, height, background, density } = {}) {
  const meta = await sharp(Buffer.from(svgStr)).metadata();
  const vbW = meta.width ?? 200;
  const d = density ?? 72 * ((width ?? vbW) / vbW);
  let img = sharp(Buffer.from(svgStr), { density: Math.min(d, 20000) });
  if (width || height) img = img.resize({ width, height, fit: 'fill' });
  if (background) img = img.flatten({ background });
  const p = path.join(OUT4K, name);
  await img.png({ compressionLevel: 9 }).toFile(p);
  jobs.push(name);
  if (desktopOk) fs.copyFileSync(p, path.join(DESKTOP, name));
}

// ---- 1. transparent banners, 3840 px wide (logotype + mark) ----
await png(horizontal(buildA, LIGHT, wm, 36).svg, 'daekon-4k-horizontal-light.png', { width: 3840 });
await png(horizontal(buildA, DARK, wm, 36).svg, 'daekon-4k-horizontal-dark.png', { width: 3840 });
await png(markSvg(buildA, DARK), 'daekon-4k-mark-dark.png', { width: 3840, height: 3840 });
await png(stacked(buildA, LIGHT, wm, 30, 150).svg, 'daekon-4k-stacked-light.png', { width: 2560 });
await png(stacked(buildA, DARK, wm, 30, 150).svg, 'daekon-4k-stacked-dark.png', { width: 2560 });

// ---- 2. 4K posters 3840×2160 with oversized mark bleeding right ----
async function poster(name, bg, scheme, strap) {
  const W = 3840, H = 2160;
  // oversized mark: 1700 tall, right side, half-off canvas
  const mS = 1700 / 200;
  const markInner =
    `<g transform="translate(2290 -430) scale(${mS})">${buildA(scheme)}</g>`;
  const head = textPaths('EGYEDI SZOFTVERFEJLESZTÉS', 10);
  const sub = textPaths(strap, 7);
  // headline: cap 96, baseline y 1140, left margin 240
  const hS = 96 / 100;
  const sS = 34 / 100;
  const inner = `
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${markInner}
  <g transform="translate(240 1140) scale(${hS})">${head.paths.map(d => `<path d="${d}" fill="${scheme.text}"/>`).join('')}</g>
  <rect x="242" y="1196" width="220" height="7" fill="${scheme.b}"/>
  <g transform="translate(240 1300) scale(${sS})">${sub.paths.map(d => `<path d="${d}" fill="${scheme.b}"/>`).join('')}</g>
  <g transform="translate(240 ${H - 340}) scale(${(140 / wm.width) * (100 / 100) * 1})">${wm.glyphs.map(g => `<path d="${g.d}" fill="${scheme.text}"/>`).join('')}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${inner}</svg>`;
  await png(svg, name, { width: W, height: H, background: bg });
}
await poster('daekon-4k-horizontal-light-poster.png', COL.bgDark, DARK, 'PRECÍZÍRÁS. TERVEZÉS. MEGVALÓSÍTÁS.');
await poster('daekon-4k-horizontal-dark-poster.png', COL.ink, DARK, 'PRECÍZÍRÁS. TERVEZÉS. MEGVALÓSÍTÁS.');

// ---- 3. 3840×3840 dark tile (mark, generous padding) ----
{
  const W = 3840, pad = 760;
  const s = (W - 2 * pad) / 200;
  const inner = `<rect width="${W}" height="${W}" fill="${COL.bgDark}"/>
  <g transform="translate(${pad} ${pad}) scale(${s})">${buildA(DARK)}</g>`;
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">${inner}</svg>`,
    'daekon-4k-mark-tile.png', { width: W, height: W, background: COL.bgDark });
}

// ---- 4. 1080×1080 social post (stacked lockup, night bg) ----
{
  const W = 1080;
  const S = stacked(buildA, DARK, wm, 30, 150);
  // stacked svg viewBox is [-6,-6,212,H+12]; scale to fit ~62% width
  const vbW = 212, vbH = S.height;
  const s = (W * 0.62) / vbW;
  const tx = (W - vbW * s) / 2 + 6 * s;
  const ty = (W - vbH * s) / 2 + 6 * s;
  const inner = `<rect width="${W}" height="${W}" fill="${COL.bgDark}"/>
  <g transform="translate(${tx} ${ty}) scale(${s})">${S.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">${inner}</svg>`,
    'daekon-4k-social-1080.png', { width: W, height: W, background: COL.bgDark });
}

console.log('4K renders done:', jobs.length, 'files →', OUT4K);
if (desktopOk) console.log('copied to Desktop:', DESKTOP);
