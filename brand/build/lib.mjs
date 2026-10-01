import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BUILD = __dirname;
export const SVG_DIR = path.join(__dirname, '..', 'svg');
export const PNG_DIR = path.join(__dirname, '..', 'png');
export const DEMO_DIR = path.join(__dirname, '..', 'demo');
for (const d of [SVG_DIR, PNG_DIR, DEMO_DIR]) fs.mkdirSync(d, { recursive: true });

const wm = JSON.parse(fs.readFileSync(path.join(BUILD, 'wordmark.json'), 'utf8'));
export const WORDMARK = wm;

// --- palette ---
export const C = {
  ink: '#14161B',      // graphite
  blue: '#1636E7',     // daekon blue (light bg)
  blueDark: '#2B50FF', // brighter blue for dark bg
  bgDark: '#0E1013',
  white: '#FFFFFF',
};

// --- svg assembly ---
export function svgDoc(inner, vb, { w, h } = {}) {
  const [x, y, W, H] = vb;
  const wh = w && h ? ` width="${w}" height="${h}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${W} ${H}"${wh} role="img" aria-label="DAEKON">${inner}</svg>`;
}

export function wordmarkPaths(fill) {
  return wm.glyphs.map(g => `<path d="${g.d}" fill="${fill}"/>`).join('');
}

// horizontal lockup: mark (cap 100) + gap + wordmark
export function horizontalLockup(markInner, markVB, { textFill, gap = 36, mono = false }) {
  // markVB: [x,y,200,200] drawn at scale s so its height = 100
  const s = 100 / 200;
  const mx = -markVB[0] * s;
  const my = -markVB[1] * s;
  const textX = 200 * s + gap;
  const W = textX + wm.width;
  const inner =
    `<g transform="translate(0 0) scale(${s}) translate(${mx} ${my})">${markInner}</g>` +
    `<g transform="translate(${textX} 0)">${wordmarkPaths(textFill)}</g>`;
  return { inner, vb: [-6, -6, W + 12, 112], W: W + 12, H: 112 };
}

// stacked lockup: mark centered above wordmark
export function stackedLockup(markInner, markVB, { textFill, gap = 30 }) {
  const s = 1; // mark at full 200
  const textScale = 200 / 2.05 / 100; // wordmark width ≈ 195*... width = 704.93 * ts ≤ ~166? use 150
  const ts = 150 / wm.width;
  const tx = (200 - wm.width * ts) / 2;
  const inner =
    `<g transform="translate(0 0) scale(${s})">${markInner}</g>` +
    `<g transform="translate(${tx} ${200 + gap}) scale(${ts})">${wordmarkPaths(textFill)}</g>`;
  const H = 200 + gap + 100 * ts;
  return { inner, vb: [-6, -6, 212, H + 12], W: 212, H: H + 12 };
}

// --- render ---
export async function renderPng(svgString, outPath, { width, height, background } = {}) {
  let img = sharp(Buffer.from(svgString), { density: 96 });
  if (width || height) img = img.resize({ width, height, fit: 'fill' });
  if (background) img = img.flatten({ background });
  await img.png().toFile(outPath);
}

// --- QA helpers ---
export async function componentsCount(svgString, width, minAreaFrac = 0.004) {
  // render binary mask, count 4-connected components (letters/shapes that stay separate)
  const { data, info } = await sharp(Buffer.from(svgString))
    .resize({ width, fit: 'fill' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = data[i * 4 + 3] > 128 ? 1 : 0;
  const seen = new Uint8Array(W * H);
  let count = 0;
  const stack = [];
  for (let i = 0; i < W * H; i++) {
    if (mask[i] && !seen[i]) {
      count++; let area = 0; stack.push(i); seen[i] = 1;
      while (stack.length) {
        const p = stack.pop(); area++;
        const x = p % W, y = (p / W) | 0;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const q = ny * W + nx;
          if (mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
        }
      }
      if (area < W * H * minAreaFrac) count--; // ignore specks
    }
  }
  return count;
}

export async function probePixel(svgString, normX, normY) {
  // returns [r,g,b,a] at normalized coords
  const { data, info } = await sharp(Buffer.from(svgString))
    .resize({ width: 256, height: 256, fit: 'fill' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const x = Math.min(255, Math.max(0, Math.round(normX * 255)));
  const y = Math.min(255, Math.max(0, Math.round(normY * 255)));
  const i = (y * info.width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

export function contrast(hex1, hex2) {
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  };
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

export const b64 = (p) => fs.readFileSync(p).toString('base64');
