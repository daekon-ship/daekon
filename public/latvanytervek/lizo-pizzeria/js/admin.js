/* Lizó – konyhai felület (látványterv, tablet-first). */
(function () {
  'use strict';
  const L = window.LIZO, S = window.LizoStore, fmt = S.fmt, M = window.Motion;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const anim = (el, kf, o) => (M && !reduced && el) ? M.animate(el, kf, Object.assign({ duration: .35, ease: [0.22, 1, 0.36, 1] }, o)) : null;

  const COLS = [['new', 'Új'], ['accepted', 'Elfogadva'], ['cooking', 'Készül'], ['ready', 'Kész / úton']];
  const NEXT = { new: ['accepted', 'Elfogad'], accepted: ['cooking', 'Készítés indul'], cooking: ['ready', 'Elkészült'], ready: ['done', 'Átadva'] };
  const t = iso => new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const ago = ms => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? 'most' : m < 60 ? `${m} perce` : `${Math.floor(m / 60)} ó ${m % 60} p`; };

  function card(o) {
    const nx = NEXT[o.status];
    return `<article class="ord" data-no="${o.no}">
      <header><b>#${o.no}</b><span class="ord__mode ord__mode--${o.mode}">${o.mode === 'delivery' ? 'Kiszállítás' : 'Átvétel'}</span>${o.preorder ? '<span class="ord__pre">Előrendelés</span>' : ''}<time>${t(o.created)} · ${ago(o.history[o.history.length - 1].t)}</time></header>
      <ul>${o.lines.map(l => `<li><b>${l.qty}×</b> ${esc(l.name)}${l.sizeLabel ? ` <em>${l.sizeLabel}</em>` : ''}${l.variant ? ` · ${esc(l.variant)}` : ''}${l.drink ? ` · ${esc(l.drink)}` : ''}${l.extras && l.extras.length ? `<span class="xt">+ extra: ${l.extras.map(esc).join(', ')}</span>` : ''}${l.removed && l.removed.length ? `<span class="rm">nélküle: ${l.removed.map(esc).join(', ')}</span>` : ''}${l.note ? `<span class="nt">„${esc(l.note)}”</span>` : ''}</li>`).join('')}</ul>
      <dl><div><dt>Vevő</dt><dd>${esc(o.name)} · <a href="tel:${esc(o.phone.replace(/\s/g, ''))}">${esc(o.phone)}</a></dd></div>
      ${o.mode === 'delivery' ? `<div><dt>Cím</dt><dd>${esc(o.area)}, ${esc(o.street)}${o.door ? ', ' + esc(o.door) : ''}</dd></div>` : ''}
      ${o.note ? `<div><dt>Megj.</dt><dd>${esc(o.note)}</dd></div>` : ''}
      <div><dt>Összesen</dt><dd><b>${fmt(o.subtotal)}</b> · átvételkor${o.mode === 'delivery' ? ' + kiszállítási díj' : ''}</dd></div></dl>
      <footer>${o.status === 'new' ? `<button class="btn btn--line" data-act="rejected">Elutasít</button>` : ''}${nx ? `<button class="btn btn--tomato" data-act="${nx[0]}">${nx[1]}</button>` : ''}</footer>
    </article>`;
  }
  function renderBoard() {
    const all = S.orders(), live = all.filter(o => COLS.some(c => c[0] === o.status));
    $('[data-board]').innerHTML = COLS.map(([k, n]) => {
      const list = live.filter(o => o.status === k).sort((a, b) => a.no - b.no);
      return `<section class="col col--${k}"><h2>${n} <span>${list.length}</span></h2>${list.length ? list.map(card).join('') : '<p class="col__empty">Nincs ilyen rendelés.</p>'}</section>`;
    }).join('');
    const nNew = live.filter(o => o.status === 'new').length;
    $('[data-new-count]').textContent = nNew ? nNew : '';
    const hist = all.filter(o => o.status === 'done' || o.status === 'rejected').sort((a, b) => b.no - a.no);
    $('[data-history]').innerHTML = hist.length ? `<table class="htable"><thead><tr><th>Szám</th><th>Idő</th><th>Mód</th><th>Vevő</th><th>Tételek</th><th>Összeg</th><th>Állapot</th></tr></thead><tbody>${hist.map(o => `<tr><td>#${o.no}</td><td>${t(o.created)}</td><td>${o.mode === 'delivery' ? 'Kiszállítás' : 'Átvétel'}</td><td>${esc(o.name)}</td><td>${o.lines.reduce((s, l) => s + l.qty, 0)} db</td><td>${fmt(o.subtotal)}</td><td>${o.status === 'done' ? 'Teljesítve' : 'Elutasítva'}</td></tr>`).join('')}</tbody></table>` : '<p class="col__empty">Még nincs lezárt rendelés.</p>';
  }
  $('[data-board]').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; b.disabled = true;
    const no = +b.closest('[data-no]').dataset.no, all = S.orders(), o = all.find(x => x.no === no);
    if (!o) return;
    o.status = b.dataset.act; o.history.push({ s: o.status, t: Date.now() }); S.saveOrders(all);
    const a = anim(b.closest('.ord'), { opacity: 0, transform: 'scale(.97)' }, { duration: .2 });
    a ? a.finished.then(renderBoard) : renderBoard();
  });

  /* termékek */
  function renderProducts(q = '') {
    const off = S.unavailable(), n = q.toLowerCase();
    $('[data-products]').innerHTML = L.categories.map(c => {
      const ps = L.products.filter(p => p.cat === c.id && (!n || p.name.toLowerCase().includes(n)));
      if (!ps.length) return '';
      return `<section class="pcat"><h3>${c.name}</h3><ul>${ps.map(p => `<li><span>${esc(p.name)}</span><span class="pp">${p.sizes ? p.sizes.map(s => fmt(s.price)).join(' / ') : fmt(p.price)}</span>
        <label class="sw"><input type="checkbox" data-pid="${p.id}" ${off.has(p.id) ? '' : 'checked'}><span aria-hidden="true"></span><em>${off.has(p.id) ? 'Elfogyott' : 'Rendelhető'}</em><b class="vh">${esc(p.name)} rendelhető</b></label></li>`).join('')}</ul></section>`;
    }).join('');
  }
  $('[data-products]').addEventListener('change', e => {
    const id = e.target.dataset.pid; if (!id) return;
    const off = S.unavailable(); e.target.checked ? off.delete(id) : off.add(id); S.setUnavailable(off);
    e.target.parentElement.querySelector('em').textContent = e.target.checked ? 'Rendelhető' : 'Elfogyott';
  });
  $('[data-psearch]').addEventListener('input', e => renderProducts(e.target.value));

  /* beállítások */
  function renderSettings() {
    $('[data-minform]').elements.min.value = S.settings().minOrder;
    const d = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    $('[data-ahours] tbody').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(i => `<tr><td>${d[i]}</td><td>${L.restaurant.hours[i].join('–')}</td></tr>`).join('');
    $('[data-areas]').innerHTML = L.restaurant.areas.map(a => `<li>${esc(a)}</li>`).join('');
  }
  $('[data-minform]').addEventListener('submit', e => {
    e.preventDefault(); const v = Math.max(0, Math.round(+e.target.elements.min.value || 0));
    S.saveSettings(Object.assign(S.settings(), { minOrder: v })); $('[data-minsaved]').hidden = false;
  });

  /* fülek */
  $$('[data-pane]').forEach(b => b.addEventListener('click', () => {
    $$('[data-pane]').forEach(x => x.setAttribute('aria-selected', x === b));
    $$('[data-pane-id]').forEach(p => { p.hidden = p.dataset.paneId !== b.dataset.pane; if (!p.hidden) anim(p, { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0)'] }); });
  }));

  const clock = () => { $('[data-clock]').textContent = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }); };
  addEventListener('storage', e => { if (e.key === S.K.orders) renderBoard(); if (e.key === S.K.off) renderProducts($('[data-psearch]').value); });
  setInterval(() => { renderBoard(); clock(); }, 20000);
  renderBoard(); renderProducts(); renderSettings(); clock();
  if (M && !reduced) M.animate('.col', { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] }, { delay: M.stagger(.06), duration: .45 });
})();
