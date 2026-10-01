// =====================================================================
// gallery4k.mjs — self-contained HTML gallery of the 4K renders
// Writes brand/4k-gallery.html and copies it to the Desktop package.
// Run:  cd daekon/brand/build && node gallery4k.mjs
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { PNG_DIR } from './lib.mjs';

const SRC = path.join(PNG_DIR, '4k');
const OUT = path.join(PNG_DIR, '..', '4k-gallery.html');

const ORDER = [
  'daekon-4k-horizontal-light-poster.png',
  'daekon-4k-horizontal-dark-poster.png',
  'daekon-4k-horizontal-light.png',
  'daekon-4k-horizontal-dark.png',
  'daekon-4k-mark-dark.png',
  'daekon-4k-mark-tile.png',
  'daekon-4k-stacked-light.png',
  'daekon-4k-stacked-dark.png',
  'daekon-4k-social-1080.png',
];

const LABELS = {
  'daekon-4k-horizontal-light-poster.png': ['Poszter — éjszaka', '3840×2160'],
  'daekon-4k-horizontal-dark-poster.png': ['Poszter — grafit', '3840×2160'],
  'daekon-4k-horizontal-light.png': ['Vízszintes logó — világos', '3840 px széles, átlátszó'],
  'daekon-4k-horizontal-dark.png': ['Vízszintes logó — sötét', '3840 px széles, átlátszó'],
  'daekon-4k-mark-dark.png': ['Logójel — nagy', '3840×3840, átlátszó'],
  'daekon-4k-mark-tile.png': ['Logójel — app csempe', '3840×3840'],
  'daekon-4k-stacked-light.png': ['Függőleges logó — világos', '2560 px széles, átlátszó'],
  'daekon-4k-stacked-dark.png': ['Függőleges logó — sötét', '2560 px széles, átlátszó'],
  'daekon-4k-social-1080.png': ['Közösségi poszt', '1080×1080'],
};

const cards = [];
for (const f of ORDER) {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) { console.error('missing:', f); continue; }
  const b64 = fs.readFileSync(p).toString('base64');
  const [title, sub] = LABELS[f] ?? [f, ''];
  const dark = f.includes('light') && !f.includes('light-poster');
  cards.push(`
  <section class="card${dark ? '' : ' on-dark'}">
    <div class="imgwrap${f.includes('poster') || f.includes('tile') || f.includes('social') ? ' flat' : ' checker'}">
      <img id="img-${f.replace(/\.png$/, '').replace(/[^a-z0-9-]/g, '')}" src="data:image/png;base64,${b64}" alt="${title}">
    </div>
    <div class="meta"><strong>${title}</strong><span>${sub} · ${f}</span></div>
  </section>`);
}

const html = `<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DAEKON — 4K logó galéria</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0E1013; color: #EDEFF4; font-family: system-ui, 'Segoe UI', sans-serif; padding: 40px clamp(16px, 4vw, 64px) 80px; }
  header { max-width: 1400px; margin: 0 auto 40px; }
  h1 { font-size: clamp(28px, 4vw, 44px); letter-spacing: .04em; }
  h1 b { color: #2B50FF; }
  header p { color: #9BA3B4; margin-top: 10px; max-width: 720px; line-height: 1.5; }
  main { max-width: 1400px; margin: 0 auto; display: grid; gap: 36px; }
  .card { border: 1px solid #23262E; border-radius: 16px; overflow: hidden; background: #14161B; }
  .card.on-dark { background: #F5F6F8; border-color: #E2E4EA; }
  .imgwrap { display: flex; align-items: center; justify-content: center; padding: clamp(12px, 2.5vw, 32px); }
  .imgwrap img { max-width: 100%; height: auto; display: block; }
  .flat { background: transparent; }
  .checker { background:
      conic-gradient(#2A2E38 25%, #22252D 0 50%, #2A2E38 0 75%, #22252D 0) 0 0/28px 28px; }
  .card.on-dark .checker { background:
      conic-gradient(#E3E5EB 25%, #D8DAE1 0 50%, #E3E5EB 0 75%, #D8DAE1 0) 0 0/28px 28px; }
  .meta { padding: 14px 20px 16px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; border-top: 1px solid #23262E; }
  .card.on-dark .meta { border-top-color: #E2E4EA; }
  .meta strong { letter-spacing: .02em; }
  .meta span { color: #8B93A5; font-size: 13px; }
  .card.on-dark .meta span { color: #6A7180; }
</style>
</head>
<body>
<header>
  <h1>DAEKON <b>4K</b> — logógaléria</h1>
  <p>Nyolc prémium render a DAEKON arculatból: transzparens banner és logójel 3840 px-en, két 4K poszter, app csempe és közösségi poszt. Minden kép a Desktop <b>DAEKON_logo/png/4k</b> mappában is megvan.</p>
</header>
<main>
${cards.join('\n')}
</main>
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.log('gallery written:', OUT, Math.round(html.length / 1024) + ' KB');

const DESKTOP = path.join(process.env.USERPROFILE || 'C:/Users/octop', 'OneDrive', 'Asztali gép', 'DAEKON_logo', 'DAEKON-4k-galeria.html');
try { fs.copyFileSync(OUT, DESKTOP); console.log('copied to Desktop:', DESKTOP); } catch { /* skip */ }
