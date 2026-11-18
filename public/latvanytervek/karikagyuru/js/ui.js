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

/** Termékkép: a valódi fotó a karikagyuru.com-ról; ha nem tölt be, rajzolt színminta. */
export function productMedia(p, { color, eager = false } = {}) {
  const art = ringSVG({ color: color || p.baseColor, pair: p.kind === 'p', stones: p.rings[0].stones ? p.rings[0].stones.count : 0, label: p.name });
  if (!p.img) return `<div class="media media--art">${art}<span class="media__tag">Rajzolt demókép</span></div>`;
  return `<div class="media" data-fallback>
    <img src="${esc(p.img)}" alt="${esc(p.name + ', ' + p.code)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
      onerror="this.closest('.media').classList.add('is-fallback')">
    <div class="media__art" aria-hidden="true">${art}<span class="media__tag">Fotó hamarosan</span></div>
  </div>`;
}

/** Ár-animáció: a régi értékről finoman az újra számol. */
export function animatePrice(el, to) {
  if (!el) return;
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
