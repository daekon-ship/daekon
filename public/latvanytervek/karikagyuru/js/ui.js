/* Közös UI-segédek: rajzolt gyűrű, képek, ár-animáció, toast, modal. */
import { ft } from './engine.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const M = () => window.Motion || null;

const METAL = {
  sarga: ['#FBEDC4', '#E2BD6E', '#B08337', '#7E5A22', '#F0D693'],
  feher: ['#FFFFFF', '#E3E5E6', '#B4B9BC', '#7F858A', '#F1F2F2'],
  rose:  ['#FBE3D6', '#E2AE95', '#B37760', '#7F4D3B', '#EFC6B2'],
  ezust: ['#FFFFFF', '#DDE0E2', '#A9AFB3', '#737A80', '#ECEEEF'],
};
const BI = { ketszinu: ['feher', 'sarga'], feherrose: ['feher', 'rose'], sargarose: ['sarga', 'rose'] };
export const metalSwatch = (c) => {
  if (BI[c]) { const a = METAL[BI[c][0]], b = METAL[BI[c][1]]; return `linear-gradient(135deg, ${a[0]} 0%, ${a[2]} 49%, ${b[1]} 51%, ${b[2]} 100%)`; }
  const m = METAL[c] || METAL.sarga;
  return `linear-gradient(135deg, ${m[0]} 0%, ${m[1]} 38%, ${m[2]} 70%, ${m[4]} 100%)`;
};

let gid = 0;
/** Programból rajzolt gyűrű(pár) – ha nincs fotó, és a színminta-nézethez. */
export function ringSVG({ color = 'sarga', pair = true, stones = 0, label = '' } = {}) {
  const id = 'r' + (++gid);
  const c1 = BI[color] ? BI[color][0] : color;
  const c2 = BI[color] ? BI[color][1] : color;
  const grad = (k, c) => {
    const m = METAL[c] || METAL.sarga;
    return `<linearGradient id="${id}${k}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${m[0]}"/><stop offset=".28" stop-color="${m[1]}"/>
      <stop offset=".55" stop-color="${m[2]}"/><stop offset=".72" stop-color="${m[3]}"/>
      <stop offset="1" stop-color="${m[4]}"/></linearGradient>`;
  };
  const ring = (cx, cy, rx, ry, rot, k, w, gems) => {
    let g = '';
    if (gems) {
      const n = Math.min(gems, 11);
      for (let i = 0; i < n; i++) {
        const t = Math.PI * (0.18 + (0.64 * i) / Math.max(1, n - 1));
        const x = cx + rx * Math.cos(t), y = cy + ry * Math.sin(t) - w * 0.15;
        g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(w * 0.24).toFixed(1)}" fill="url(#${id}gem)" stroke="#9aa3ab" stroke-width=".5"/>`;
      }
    }
    return `<g transform="rotate(${rot} ${cx} ${cy})">
      <ellipse cx="${cx}" cy="${cy + w * 0.35}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(60,40,20,.10)" stroke-width="${w * 1.1}" transform="translate(0 ${w * 0.6})"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#${id}${k})" stroke-width="${w}"/>
      <ellipse cx="${cx}" cy="${cy - w * 0.22}" rx="${rx - w * 0.3}" ry="${ry - w * 0.3}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="${w * 0.12}" stroke-dasharray="${rx * 1.2} ${rx * 4}" stroke-dashoffset="${rx * 0.4}"/>
      ${g}</g>`;
  };
  const one = ring(150, 112, 78, 30, -16, 'a', 15, pair ? stones : stones);
  const two = pair ? ring(182, 128, 88, 33, 12, 'b', 18, 0) : '';
  return `<svg class="ring-svg" viewBox="0 0 320 240" role="img" aria-label="${esc(label || 'Rajzolt gyűrű – színminta')}">
    <defs>${grad('a', c1)}${grad('b', c2)}
      <radialGradient id="${id}gem" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#e6ecf1"/><stop offset="1" stop-color="#aab4bd"/></radialGradient>
    </defs>
    ${pair ? two + one : one}
  </svg>`;
}

/* Melyik távoli (karikagyuru.com-ról töltődő) fotó nem érhető el – ezeket a gyűrűket elrejtjük. */
export const photos = { missing: new Set(), checked: false };
export function checkPhotos(products, onDone) {
  const remote = products.filter((p) => p.img && /^https?:/.test(p.img));
  if (!remote.length) { photos.checked = true; onDone?.(); return; }
  let left = remote.length;
  const fin = () => { if (--left === 0) { photos.checked = true; onDone?.(); } };
  remote.forEach((p) => {
    const im = new Image();
    const t = setTimeout(() => { photos.missing.add(p.id); im.src = ''; fin(); }, 6000);
    im.onload = () => { clearTimeout(t); if (!im.naturalWidth) photos.missing.add(p.id); fin(); };
    im.onerror = () => { clearTimeout(t); photos.missing.add(p.id); fin(); };
    im.src = p.img;
  });
}
export const hasPhoto = (p) => !!p.img && !photos.missing.has(p.id);

/** Termékkép: csak valódi fotó. Ha nem tölt be, semleges „nincs fotó” mező – rajzolt gyűrű nincs. */
export function productMedia(p, { eager = false, large = false } = {}) {
  const local = !!p.img && !/^(https?:|data:)/.test(p.img);   // data: = adminban feltöltött kép (csak a böngészőben)
  if (!p.img) return `<div class="media media--none"><span>Fotó hamarosan</span></div>`;
  return `<div class="media${p.imgFill ? ' media--fill' : ''}">
    <img src="${esc(local ? p.img.replace('.jpg', '-800.jpg') : p.img)}"${local ? ` srcset="${esc(p.img.replace('.jpg', '-800.jpg'))} 800w, ${esc(p.img)} 1600w" sizes="${large ? '(max-width: 960px) 90vw, 560px' : '(max-width: 640px) 34vw, 220px'}"` : ''} alt="${esc(p.name + ', ' + p.code)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
      onerror="this.closest('.media').classList.add('is-fallback')">
    <div class="media__none" aria-hidden="true"><span>A fotó nem érhető el</span></div>
  </div>`;
}

/** Ár-animáció: a régi értékről finoman az újra számol. */
export function animatePrice(el, to) {
  if (!el) return;
  if (to === null || to === undefined) { el.dataset.value = ''; el.textContent = 'Egyedi árajánlat szükséges'; el.classList.add('price--quote'); return; }
  el.classList.remove('price--quote');
  const from = Number(el.dataset.value || to);
  el.dataset.value = to;
  if (from === to || reduced() || !M()) { el.textContent = ft(to); return; }
  M().animate(from, to, {
    duration: 0.7, ease: [0.22, 1, 0.36, 1],
    onUpdate: (v) => { el.textContent = ft(Math.round(v / 10) * 10); },
    onComplete: () => { el.textContent = ft(to); },
  });
  M().animate(el, { opacity: [0.55, 1], y: [to > from ? 6 : -6, 0] }, { duration: 0.45 });
}

let toastT;
export function toast(html, { action, onAction, ms = 6000 } = {}) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.innerHTML = `<span>${html}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  t.classList.add('is-on');
  if (action) t.querySelector('button').onclick = () => { onAction?.(); t.classList.remove('is-on'); };
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('is-on'), ms);
}

export function modal(html, { onMount, label = 'Párbeszédablak', wide = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.innerHTML = `<div class="modal__scrim" data-close></div>
    <div class="modal__box ${wide ? 'modal__box--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(label)}">
      <button class="modal__x" type="button" data-close aria-label="Bezárás">×</button>${html}</div>`;
  document.body.append(wrap);
  document.documentElement.classList.add('no-scroll');
  const close = () => { wrap.remove(); document.documentElement.classList.remove('no-scroll'); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  const box = wrap.querySelector('.modal__box');
  if (M() && !reduced()) M().animate(box, { opacity: [0, 1], y: [24, 0] }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
  onMount?.(box, close);
  setTimeout(() => box.querySelector('input, textarea, select, button:not(.modal__x)')?.focus(), 60);
  return close;
}

/** Görgetésre finom előtűnés (Motion inView). */
export function reveal(root = document) {
  const els = $$('[data-reveal]', root);
  if (!M() || reduced()) { els.forEach((e) => (e.style.opacity = 1)); return; }
  els.forEach((el) => {
    el.style.opacity = 0;
    M().inView(el, () => {
      const d = Number(el.dataset.reveal || 0);
      M().animate(el, { opacity: [0, 1], y: [22, 0] }, { duration: 0.8, delay: d, ease: [0.22, 1, 0.36, 1] });
    }, { margin: '0px 0px -8% 0px' });
  });
}

export const dateHu = (iso) => new Date(iso).toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
export const dayHu = (iso) => new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });

/* ==========================================================================
   Szemléltető gyűrűábra (V3) – NEM fotó és nem a kész gyűrű pontos képe.
   A valós adatokból rajzol: anyag/szín, belső átmérő (a méretből), szélesség (mm),
   a kövek száma és átmérője (mm). A kövek pontos helyét az ötvös határozza meg.
   rings: [{ label, size, width, stones: { count, mm, around } | null }]
   ========================================================================== */
const SK = {
  sarga: ['#F7E6AE', '#DDB862', '#A67F2E'], feher: ['#FBFCFD', '#D3D9DD', '#98A1A8'], rose: ['#F9DFD0', '#DFA78C', '#AE705A'],
  pt: ['#F6F8F9', '#C8CFD4', '#8A949B'], pd: ['#F1F3F4', '#BFC6CB', '#848E95'], ti: ['#D5DADD', '#9099A0', '#59636A'],
};
export function ringSketch({ metal = 'au14', color = 'feher', rings = [] } = {}) {
  const id = 'sk' + (++gid);
  const gold = metal === 'au14' || metal === 'au18';
  const tones = gold ? (BI[color] ? BI[color].map((c) => SK[c]) : [SK[color] || SK.sarga]) : [SK[metal] || SK.pt];
  const S = 6.8;                                             // px / mm – minden méret arányos
  const n = rings.length, W = 400, H = 300;
  const grad = (k, t) => `<linearGradient id="${id}g${k}" x1="0" x2="1"><stop offset="0" stop-color="${t[2]}"/><stop offset=".3" stop-color="${t[1]}"/><stop offset=".52" stop-color="${t[0]}"/><stop offset=".78" stop-color="${t[1]}"/><stop offset="1" stop-color="${t[2]}"/></linearGradient>`;
  const one = (r, i) => {
    const cx = n === 1 ? W / 2 : (i === 0 ? 104 : 296);
    const R = (r.size / Math.PI / 2 + 0.9) * S, ry = R * 0.3, h = Math.max(6, r.width * S), y0 = 128 - h / 2, t = 1.7 * S;
    const wall = (yy, hh) => `M${cx - R},${yy} A${R},${ry} 0 0 0 ${cx + R},${yy} L${cx + R},${yy + hh} A${R},${ry} 0 0 1 ${cx - R},${yy + hh} Z`;
    let body = tones.length === 2
      ? `<path d="${wall(y0, h)}" fill="url(#${id}g1)"/><path d="${wall(y0, h / 2)}" fill="url(#${id}g0)"/>`
      : `<path d="${wall(y0, h)}" fill="url(#${id}g0)"/>`;
    body += `<path d="${wall(y0, h)}" fill="none" stroke="rgba(21,38,45,.28)" stroke-width="1"/>`;
    body += `<ellipse cx="${cx}" cy="${y0}" rx="${R}" ry="${ry}" fill="${tones[0][0]}" stroke="rgba(21,38,45,.28)"/>`;
    body += `<ellipse cx="${cx}" cy="${y0 + 1}" rx="${R - t}" ry="${ry * (R - t) / R}" fill="url(#${id}in)" stroke="rgba(21,38,45,.2)"/>`;
    let shown = 0;
    if (r.stones && r.stones.count > 0) {
      const d = (r.stones.mm || 1.3) * S, rr = Math.max(1.5, d / 2);
      const step = r.stones.around ? (2 * Math.PI) / r.stones.count : Math.max((d * 1.45) / R, 0.1);
      const total = r.stones.count, mid = (total - 1) / 2;
      for (let k = 0; k < total; k++) {
        const phi = (k - mid) * step;
        if (Math.abs(phi) > 1.42) continue;                   // csak az elöl látszó kövek
        const x = cx + R * Math.sin(phi), y = y0 + ry * Math.cos(phi) + h / 2, sx = Math.max(0.35, Math.cos(phi));
        body += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><ellipse rx="${(rr * sx).toFixed(2)}" ry="${rr.toFixed(2)}" fill="#fff" stroke="#6FB9CF" stroke-width=".9"/><ellipse rx="${(rr * sx * 0.45).toFixed(2)}" ry="${(rr * 0.45).toFixed(2)}" fill="none" stroke="#A9D8E6" stroke-width=".6"/></g>`;
        shown++;
      }
    }
    const lab = `<text x="${cx}" y="${H - 34}" text-anchor="middle" class="sk__t">${esc(r.label)}</text>
      <text x="${cx}" y="${H - 16}" text-anchor="middle" class="sk__s">${esc(r.sizeText)} · ${String(r.width).replace('.', ',')} mm${r.stones ? ` · ${r.stones.count} kő` : ''}</text>`;
    return `<g>${body}${lab}</g>`;
  };
  return `<svg class="sketch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Szemléltető ábra a beállított gyűrűről – nem fotó">
    <defs>${tones.map((t, k) => grad(k, t)).join('')}<linearGradient id="${id}in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tones[0][2]}"/><stop offset="1" stop-color="${tones[tones.length - 1][1]}"/></linearGradient></defs>
    ${rings.map(one).join('')}</svg>`;
}
