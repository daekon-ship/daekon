/* Lizó Pizzéria – vásárlói felület (látványterv). Motion: motion.dev 11.18 (vendor). */
(function () {
  'use strict';
  const L = window.LIZO, S = window.LizoStore, fmt = S.fmt;
  const M = window.Motion || null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = [0.22, 1, 0.36, 1];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const anim = (el, kf, opt) => (M && !reduced && el) ? M.animate(el, kf, Object.assign({ duration: .5, ease }, opt)) : null;
  const AMM = 'Ammerlander klasszikus sajt';
  const baseKey = { 'paradicsomos alap': 'p', 'tejfölös alap': 't', 'BBQ alap': 'b', 'tzatziki alap': 'z' };
  const baseName = { p: 'paradicsomos alap', t: 'tejfölös alap', b: 'BBQ alap', z: 'tzatziki alap' };
  const chili = '<svg class="chili" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12c3 1 7-1 8-6 .3-1.5-.6-2.4-1.6-2.2C9 4.2 9 7 6.6 8.6 5 9.7 3.4 9.8 3 10.6c-.3.6.2 1.1 1 1.4ZM11 3.8c0-1 .5-1.8 1.5-2.3"/></svg>';
  const plusIco = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12"/></svg>';
  const arrow = '<svg class="cats__arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg>';

  let off = S.unavailable();
  const byCat = id => L.products.filter(p => p.cat === id);

  /* ---------- nyitvatartás ---------- */
  const days = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  function openState(now = new Date()) {
    const d = now.getDay(), h = L.restaurant.hours[d], m = now.getHours() * 60 + now.getMinutes();
    if (m >= toMin(h[0]) && m < toMin(h[1])) return { open: true, text: `Most nyitva · ${h[1]}-ig` };
    if (m < toMin(h[0])) return { open: false, text: `Zárva · ma ${h[0]}-tól`, next: `ma ${h[0]}` };
    const t = L.restaurant.hours[(d + 1) % 7];
    return { open: false, text: `Zárva · holnap ${t[0]}-tól`, next: `holnap ${t[0]}` };
  }
  function renderHours() {
    const st = openState(), el = $('[data-status]');
    el.classList.toggle('is-open', st.open); el.classList.toggle('is-closed', !st.open);
    $('[data-status-text]').textContent = st.text;
    const today = new Date().getDay(), h = L.restaurant.hours[today];
    $('[data-today-hours]').textContent = `${h[0]}–${h[1]}`;
    const order = [1, 2, 3, 4, 5, 6, 0];
    $('[data-hours] tbody').innerHTML = order.map(d => {
      const x = L.restaurant.hours[d];
      return `<tr class="${d === today ? 'is-today' : ''}"><td>${days[d][0].toUpperCase() + days[d].slice(1)}</td><td>${x[0]}–${x[1]}</td></tr>`;
    }).join('');
  }
  function renderMin() { $$('[data-min-order]').forEach(e => e.textContent = fmt(S.settings().minOrder)); }

  /* ---------- kategóriakártyák + fülek ---------- */
  function fromPrice(cat) {
    const ps = byCat(cat).map(p => p.sizes ? p.sizes[0].price : p.price);
    return Math.min(...ps);
  }
  function renderCats() {
    $('[data-cat-cards]').innerHTML = L.categories.map((c, i) => {
      const n = byCat(c.id).length;
      return `<li><a href="#cat-${c.id}" data-jump="${c.id}"><span class="cats__no">${String(i + 1).padStart(2, '0')}</span><span><span class="cats__name">${c.name}</span><span class="cats__sub">${n} tétel · ${fmt(fromPrice(c.id))}-tól${c.note ? ' · ' + c.note : ''}</span></span>${arrow}</a></li>`;
    }).join('');
    $('[data-tabs]').innerHTML = '<span class="tab__pill" data-pill aria-hidden="true"></span>' +
      L.categories.map(c => `<button class="tab" type="button" data-tab="${c.id}"><span>${c.short}</span></button>`).join('');
  }

  /* ---------- burger-rétegek ---------- */
  const layerOf = ing => {
    const i = ing.toLowerCase();
    if (i === 'buci') return null;
    if (i.includes('csirkehúspogácsa')) return 'chick';
    if (i.includes('húspogácsa')) return 'meat';
    if (i === 'káposztasaláta') return 'slaw';
    if (i.includes('saláta')) return 'green';
    if (i === 'paradicsom') return 'tomato';
    if (i === 'lilahagyma') return 'onion';
    if (i === 'kígyóuborka') return 'cucu';
    if (i.includes('sajt')) return 'cheese';
    if (i === 'bacon') return 'bacon';
    if (i === 'tükörtojás') return 'egg';
    if (i.includes('szósz')) return 'sauce';
    if (i === 'jalapeño') return 'jal';
    if (i === 'csalamádé') return 'pickle';
    return null;
  };
  const order = ['sauce', 'green', 'slaw', 'pickle', 'jal', 'tomato', 'onion', 'cucu', 'egg', 'bacon', 'cheese', 'meat', 'chick'];
  function stackHTML(p, removed = new Set()) {
    const layers = [];
    p.items.filter(i => !removed.has(i)).forEach(i => {
      const l = layerOf(i); if (!l) return;
      layers.push(l); if (/dupla/.test(i)) layers.push(l);
      if (l === 'cheese' && /trappista/.test(i)) {/* külön szelet */ }
    });
    layers.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return `<span class="stack" aria-hidden="true"><i class="l-bun-t"></i>${layers.map(l => `<i class="l-${l}"></i>`).join('')}<i class="l-bun-b"></i></span>`;
  }

  /* ---------- étlap ---------- */
  function showIng(p) {
    if (p.cat === 'pizza') return p.items.filter(i => i !== AMM && !baseKey[i]);
    if (p.burger) return p.items.filter(i => i !== 'buci');
    return p.items;
  }
  function priceHTML(p) {
    if (p.sizes && p.sizes.length > 1) return `<span class="prices">${p.sizes.map(s => `<span><small>${s.label}</small>${fmt(s.price)}</span>`).join('')}</span>`;
    const v = p.sizes ? p.sizes[0].price : p.price;
    return `<span class="prices"><span>${p.sizes ? `<small>${p.sizes[0].label}</small>` : ''}${fmt(v)}</span></span>`;
  }
  function rowHTML(p) {
    const isOff = off.has(p.id);
    const ing = showIng(p);
    const dot = p.base ? `<span class="dot dot--${p.base}" title="${baseName[p.base]}" aria-hidden="true"></span>` : '';
    const sub = p.base ? `${baseName[p.base]}${ing.length ? ', ' + ing.join(', ') : ''}` : ing.join(', ');
    return `<li class="mitem${isOff ? ' is-off' : ''}" data-pid="${p.id}" data-search="${esc(norm(p.name + ' ' + p.items.join(' ') + ' ' + (p.variants || []).join(' ')))}">
      <button class="mrow" type="button" data-open="${p.id}" ${isOff ? 'aria-disabled="true"' : ''} aria-label="${esc(p.name)} – részletek és kosárba">
        <span class="mrow__name">${dot}${esc(p.name)}${p.hot ? ` <span class="tag">${chili}csípős</span>` : ''}</span>
        <span class="mrow__ing">${isOff ? '<span class="offnote">Most nem rendelhető</span> · ' : ''}${esc(sub)}${p.variants ? ' · ' + esc(p.variants.join(', ')) : ''}</span>
        <span class="mrow__right">${priceHTML(p)}<span class="plus">${plusIco}</span></span>
      </button></li>`;
  }
  function cardHTML(p) {
    const isOff = off.has(p.id);
    return `<li class="bcard${isOff ? ' is-off' : ''}" data-pid="${p.id}" data-search="${esc(norm(p.name + ' ' + p.items.join(' ')))}">
      <button type="button" data-open="${p.id}" ${isOff ? 'aria-disabled="true"' : ''} aria-label="${esc(p.name)} – részletek és kosárba">
        ${stackHTML(p)}
        <span><h4>${esc(p.name)}${p.hot ? ` <span class="tag">${chili}csípős</span>` : ''}</h4><p>${isOff ? '<span class="offnote">Most nem rendelhető</span> · ' : ''}${esc(showIng(p).join(', '))}</p><span class="price">${fmt(p.price)}</span></span>
      </button></li>`;
  }
  function renderMenu() {
    $('[data-menu]').innerHTML = L.categories.map(c => {
      const ps = byCat(c.id);
      const isCards = c.id === 'hamburger' || c.id === 'smash';
      const legend = c.id === 'pizza' ? `<div class="legend" aria-label="Pizzaalapok"><span><i class="dot dot--p"></i>paradicsomos</span><span><i class="dot dot--t"></i>tejfölös</span><span><i class="dot dot--b"></i>BBQ</span><span><i class="dot dot--z"></i>tzatziki alap</span></div>` : '';
      const foot = c.id === 'pizza' ? `<p class="foot-note">Minden pizzán Ammerlander klasszikus sajt.</p>` : '';
      return `<section class="mcat" id="cat-${c.id}" data-cat="${c.id}" aria-labelledby="h-${c.id}">
        <div class="mcat__head"><h3 id="h-${c.id}">${c.name}</h3><p>${ps.length} tétel${c.note ? ' · ' + c.note : ''}</p></div>
        ${legend}
        <ul class="${isCards ? 'blist' : 'mlist'}">${ps.map(isCards ? cardHTML : rowHTML).join('')}</ul>${foot}
      </section>`;
    }).join('');
  }

  /* ---------- keresés ---------- */
  function doSearch(q) {
    const n = norm(q.trim());
    let any = false;
    $$('.mcat').forEach(sec => {
      let hit = 0;
      $$('[data-pid]', sec).forEach(li => { const ok = !n || li.dataset.search.includes(n); li.hidden = !ok; if (ok) hit++; });
      sec.hidden = hit === 0; if (hit) any = true;
    });
    $('[data-empty]').hidden = any;
    $$('[data-tab]').forEach(t => { t.hidden = $('#cat-' + t.dataset.tab).hidden; });
    placePill(true);
  }

  /* ---------- fülek: követés + mozgó jelölő ---------- */
  let current = 'pizza', spyLock = 0;
  function placePill(instant) {
    const t = $(`[data-tab="${current}"]`), pill = $('[data-pill]'); if (!t || !pill) return;
    $$('[data-tab]').forEach(b => b.classList.toggle('is-on', b === t));
    const x = t.offsetLeft, w = t.offsetWidth;
    if (instant || !M || reduced) { pill.style.transform = `translateX(${x}px)`; pill.style.width = w + 'px'; pill.style.left = '0'; }
    else { pill.style.left = '0'; M.animate(pill, { transform: `translateX(${x}px)`, width: w + 'px' }, { type: 'spring', stiffness: 420, damping: 36 }); }
    const box = t.parentElement, target = x - box.clientWidth / 2 + w / 2;
    box.scrollTo({ left: target, behavior: instant || reduced ? 'auto' : 'smooth' });
  }
  function setCurrent(id, instant) { if (id === current && !instant) return; current = id; placePill(instant); }
  function spy() {
    if (Date.now() < spyLock) return;
    const line = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barh')) + 80;
    let id = current;
    $$('.mcat:not([hidden])').forEach(s => { if (s.getBoundingClientRect().top - line <= 0) id = s.dataset.cat; });
    setCurrent(id);
  }
  function jump(id) {
    const el = $('#cat-' + id); if (!el) return;
    spyLock = Date.now() + 900; setCurrent(id);
    const top = el.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barh')) + 60);
    scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- termék lap ---------- */
  const sheet = $('[data-sheet]'), scrim = $('[data-scrim]'), drawer = $('[data-drawer]');
  let st = null, lastFocus = null;
  const mobile = () => matchMedia('(max-width:720px)').matches;

  function sheetPrice() { return S.unitPrice({ id: st.p.id, size: st.size }) * st.qty; }
  function renderSheet() {
    const p = st.p, cat = L.categories.find(c => c.id === p.cat);
    const hint = p.hint ? `<p class="hintline">${esc(p.hint)}</p>` : '';
    let html = `<p class="sh__kicker">${p.base ? `<span class="dot dot--${p.base}"></span>${baseName[p.base]} · ` : ''}${cat.name}</p>
      <h3 class="sh__title" id="sheet-title">${esc(p.name)}</h3>`;
    if (p.burger) html += `<div class="sh__vis" data-vis>${stackHTML(p, st.removed)}</div>`;
    if (p.sizes && p.sizes.length > 1) {
      html += `<div class="sh__block"><p class="sh__label">Méret</p><div class="seg" role="radiogroup" aria-label="Méret">${p.sizes.map(s =>
        `<label><input type="radio" name="size" value="${s.k}" ${s.k === st.size ? 'checked' : ''}><span><b>${s.label}</b><em>${fmt(s.price)}</em></span></label>`).join('')}</div>
        <p class="hintline">Az 50 cm-es kb. 2,4-szer akkora felület.</p></div>`;
    }
    if (p.variants) {
      html += `<div class="sh__block"><p class="sh__label">Fajta</p><div class="seg" role="radiogroup" aria-label="Fajta">${p.variants.map(v =>
        `<label><input type="radio" name="variant" value="${esc(v)}" ${v === st.variant ? 'checked' : ''}><span><b>${esc(v)}</b></span></label>`).join('')}</div></div>`;
    }
    if (p.menu) {
      html += `<div class="sh__block"><p class="sh__label">Üdítő a menühöz</p><div class="chips" role="radiogroup" aria-label="Üdítő">${L.menuDrinks.map(d =>
        `<button type="button" class="chip" role="radio" aria-checked="${d === st.drink}" data-drink="${esc(d)}" style="${d === st.drink ? 'background:var(--ink);color:var(--paper)' : ''}">${esc(d)}</button>`).join('')}</div></div>`;
    }
    const removable = p.items.filter(i => !(p.locked || []).includes(i) && !p.menu && i !== '3 db');
    if (p.items.length && !p.menu && !p.variants) {
      html += `<div class="sh__block"><p class="sh__label">Összetevők <small>${removable.length ? 'koppints, amit nem kérsz' : ''}</small></p><div class="chips">${p.items.map(i => {
        const lock = !removable.includes(i);
        const rm = st.removed.has(i);
        return lock ? `<span class="chip chip--lock">${esc(i)}</span>`
          : `<button type="button" class="chip" aria-pressed="${rm}" data-ing="${esc(i)}" aria-label="${esc(i)}${rm ? ' – nem kérem' : ''}">${rm ? '' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>'}${esc(i)}</button>`;
      }).join('')}</div>${st.removed.size ? `<p class="hintline">Nem kéred: ${[...st.removed].map(esc).join(', ')}. Az ár ettől nem változik.</p>` : ''}</div>`;
    } else if (p.menu) {
      html += `<p class="sh__desc">${esc(p.items.join(', '))}</p>`;
    }
    html += `<div class="sh__block"><label class="field"><span>Megjegyzés a tételhez <i>(nem kötelező)</i></span><textarea rows="2" data-note maxlength="160" placeholder="Pl. jól átsütve">${esc(st.note)}</textarea></label>${hint}</div>`;
    $('[data-sheet-body]').innerHTML = html;
    updateSheetFoot();
  }
  function updateSheetFoot() {
    $('[data-qty-out]').textContent = st.qty;
    $('[data-add-price]').textContent = fmt(sheetPrice());
    $('[data-add-label]').textContent = st.editKey ? 'Módosítás mentése' : 'Kosárba';
  }
  function openSheet(id, preset = {}) {
    const p = S.byId[id]; if (!p || off.has(id)) return;
    st = { p, size: preset.size || (p.sizes ? p.sizes[0].k : null), removed: new Set(preset.removed || []), qty: preset.qty || 1, note: preset.note || '',
      drink: preset.drink || (p.menu ? L.menuDrinks[0] : null), variant: preset.variant || (p.variants ? p.variants[0] : null), editKey: preset.editKey || null };
    renderSheet();
    lastFocus = document.activeElement;
    showLayer(sheet);
    anim(sheet, mobile() ? { transform: ['translateY(100%)', 'translateY(0)'] } : { opacity: [0, 1], transform: ['translate(-50%,-46%) scale(.98)', 'translate(-50%,-50%) scale(1)'] }, { duration: .45 });
    setTimeout(() => $('.x', sheet).focus(), 30);
  }
  function showLayer(el) {
    scrim.hidden = false; el.hidden = false; document.body.classList.add('lock');
    anim(scrim, { opacity: [0, 1] }, { duration: .25 });
  }
  function closeLayer(el, cb) {
    const done = () => { el.hidden = true; if (sheet.hidden && drawer.hidden) { scrim.hidden = true; document.body.classList.remove('lock'); } cb && cb(); };
    const a = anim(el, el === sheet ? (mobile() ? { transform: 'translateY(100%)' } : { opacity: 0 }) : (mobile() ? { transform: 'translateY(100%)' } : { transform: 'translateX(100%)' }), { duration: .28, ease: [0.4, 0, 1, 1] });
    if (sheet.hidden || drawer.hidden) anim(scrim, { opacity: 0 }, { duration: .25 });
    if (a) a.finished.then(() => { done(); el.style.transform = ''; el.style.opacity = ''; }); else done();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  sheet.addEventListener('click', e => {
    const ing = e.target.closest('[data-ing]');
    if (ing) { const i = ing.dataset.ing; st.removed.has(i) ? st.removed.delete(i) : st.removed.add(i); st.note = $('[data-note]').value; renderSheet(); const b = $(`[data-ing="${CSS.escape(i)}"]`); b && b.focus(); return; }
    const dr = e.target.closest('[data-drink]');
    if (dr) { st.drink = dr.dataset.drink; st.note = $('[data-note]').value; renderSheet(); return; }
    const q = e.target.closest('[data-qty]');
    if (q) { st.qty = Math.max(1, Math.min(20, st.qty + Number(q.dataset.qty))); updateSheetFoot(); anim($('[data-qty-out]'), { transform: ['scale(1.25)', 'scale(1)'] }, { duration: .25 }); return; }
    if (e.target.closest('[data-add]')) { addFromSheet(e.target.closest('[data-add]')); return; }
    if (e.target.closest('[data-close]')) closeLayer(sheet);
  });
  sheet.addEventListener('change', e => {
    if (e.target.name === 'size') { st.size = e.target.value; updateSheetFoot(); anim($('[data-add-price]'), { opacity: [.3, 1] }, { duration: .3 }); }
    if (e.target.name === 'variant') st.variant = e.target.value;
  });
  sheet.addEventListener('input', e => { if (e.target.matches('[data-note]')) st.note = e.target.value; });

  /* ---------- kosár ---------- */
  let cart = S.cart();
  function addFromSheet(btn) {
    if (btn.dataset.busy) return; btn.dataset.busy = '1'; setTimeout(() => delete btn.dataset.busy, 400);
    const line = { id: st.p.id, size: st.size, removed: [...st.removed], drink: st.drink, variant: st.variant, note: (st.note || '').trim(), qty: st.qty };
    if (st.editKey) cart = cart.filter(l => S.lineKey(l) !== st.editKey);
    const k = S.lineKey(line), ex = cart.find(l => S.lineKey(l) === k);
    if (ex) ex.qty = Math.min(20, ex.qty + line.qty); else cart.push(line);
    S.saveCart(cart);
    const wasEdit = !!st.editKey;
    closeLayer(sheet, () => { if (wasEdit) openDrawer('cart'); });
    renderCart(true);
    if (!wasEdit) { toast(`${st.qty} × ${st.p.name} a kosárban`); flyToCart(btn); }
  }
  function flyToCart(from) {
    if (!M || reduced) return;
    const target = mobile() ? $('[data-cartbar]') : $('.cartbtn'); if (!target || target.hidden) return;
    const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.style.cssText = `position:fixed;z-index:90;left:${a.left + a.width / 2 - 9}px;top:${a.top + a.height / 2 - 9}px;width:18px;height:18px;border-radius:50%;background:var(--tomato);pointer-events:none`;
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    M.animate(dot, { transform: ['translate(0,0) scale(1)', `translate(${dx * .5}px,${dy - 80}px) scale(1.1)`, `translate(${dx}px,${dy}px) scale(.4)`] }, { duration: .6, ease: [0.5, 0, 0.3, 1] })
      .finished.then(() => { dot.remove(); M.animate(target, { transform: ['scale(1)', 'scale(1.12)', 'scale(1)'] }, { duration: .35 }); });
  }
  function lineDesc(l) {
    const p = S.byId[l.id], bits = [];
    if (p.sizes && p.sizes.length > 1) bits.push(p.sizes.find(s => s.k === l.size).label);
    if (l.variant) bits.push(esc(l.variant));
    if (l.drink) bits.push('üdítő: ' + esc(l.drink));
    if (l.removed && l.removed.length) bits.push('nélküle: <s>' + l.removed.map(esc).join(', ') + '</s>');
    if (l.note) bits.push('„' + esc(l.note) + '”');
    return bits.join(' · ');
  }
  function renderCart(bump) {
    cart = cart.filter(l => S.byId[l.id] && !off.has(l.id));
    const n = cart.reduce((s, l) => s + l.qty, 0), sub = S.subtotal(cart);
    $$('[data-cart-count]').forEach(e => { e.textContent = n; e.toggleAttribute('data-zero', n === 0); });
    $('[data-cart-total]').textContent = fmt(sub);
    $('[data-cartbar]').hidden = n === 0;
    document.body.classList.toggle('has-cart', n > 0);
    if (bump && n) anim($('[data-cartbar]'), { transform: ['translateY(8px)', 'translateY(0)'] }, { duration: .3 });
    $('[data-lines]').innerHTML = cart.map((l, i) => {
      const p = S.byId[l.id], u = S.unitPrice(l);
      return `<li class="line" data-i="${i}">
        <span class="line__name">${esc(p.name)}</span>
        <span class="line__price">${fmt(u * l.qty)}</span>
        <span class="line__meta">${lineDesc(l) || fmt(u) + ' / db'}</span>
        <span class="line__ctl"><span class="qty" role="group" aria-label="${esc(p.name)} mennyisége"><button type="button" data-lq="-1" aria-label="Eggyel kevesebb">−</button><output>${l.qty}</output><button type="button" data-lq="1" aria-label="Eggyel több">+</button></span>
        <button type="button" class="line__rm" data-ledit>Módosítás</button><button type="button" class="line__rm" data-lrm style="margin-left:0">Törlés</button></span>
      </li>`;
    }).join('');
    $('[data-view="cart"]').classList.toggle('is-empty', n === 0);
    $('[data-subtotal]').textContent = fmt(sub);
    updateFoot();
  }
  function mode() { const r = $('[name="mode"]:checked'); return r ? r.value : 'delivery'; }
  function updateFoot() {
    const sub = S.subtotal(cart), min = S.settings().minOrder, view = drawerView;
    const del = mode() === 'delivery';
    $('[data-fee-row]').hidden = !del;
    const short = del && sub < min && sub > 0;
    const w = $('[data-minwarn]');
    w.hidden = !short; if (short) w.textContent = `Kiszállításhoz legalább ${fmt(min)} kell – még ${fmt(min - sub)} hiányzik. Átvételnél nincs minimum.`;
    const next = $('[data-next]');
    $('[data-next-total]').textContent = fmt(sub);
    if (view === 'cart') { $('[data-next-label]').textContent = 'Tovább az adatokhoz'; next.disabled = cart.length === 0; }
    if (view === 'checkout') {
      const o = openState();
      $('[data-next-label]').textContent = o.open ? 'Rendelés leadása' : 'Előrendelés leadása';
      next.disabled = cart.length === 0 || short;
    }
  }
  $('[data-lines]').addEventListener('click', e => {
    const li = e.target.closest('.line'); if (!li) return; const i = +li.dataset.i, l = cart[i];
    const q = e.target.closest('[data-lq]');
    if (q) { l.qty = Math.max(0, Math.min(20, l.qty + Number(q.dataset.lq))); if (!l.qty) cart.splice(i, 1); S.saveCart(cart); renderCart(); return; }
    if (e.target.closest('[data-lrm]')) {
      const a = anim(li, { opacity: 0, transform: 'translateX(24px)' }, { duration: .22 });
      const go = () => { cart.splice(i, 1); S.saveCart(cart); renderCart(); };
      a ? a.finished.then(go) : go(); return;
    }
    if (e.target.closest('[data-ledit]')) {
      const key = S.lineKey(l);
      closeLayer(drawer, () => openSheet(l.id, Object.assign({}, l, { editKey: key })));
    }
  });

  /* ---------- fiók / pénztár ---------- */
  let drawerView = 'cart';
  function setView(v) {
    drawerView = v;
    $$('[data-view]', drawer).forEach(x => x.hidden = x.dataset.view !== v);
    $('[data-back]').hidden = v !== 'checkout';
    $('[data-drawer-title]').textContent = v === 'cart' ? 'Kosár' : v === 'checkout' ? 'Adatok' : 'Visszaigazolás';
    $$('[data-steps] li').forEach((li, i) => li.classList.toggle('is-on', i === ['cart', 'checkout', 'done'].indexOf(v)));
    $('[data-drawer-foot]').hidden = v === 'done';
    $('[data-formerr]').hidden = true;
    updateFoot();
    const cur = $(`[data-view="${v}"]`, drawer); cur.scrollTop = 0;
    anim(cur, { opacity: [0, 1], transform: ['translateX(12px)', 'translateX(0)'] }, { duration: .3 });
  }
  function openDrawer(v = 'cart') {
    clearTimeout(tt); $('[data-toast]').style.opacity = 0;
    lastFocus = document.activeElement;
    const last = sessionStorage.getItem('lizo.last');
    if (v === 'cart' && !cart.length && last) { v = 'done'; renderDone(+last); }
    setView(v); showLayer(drawer);
    anim(drawer, { transform: mobile() ? ['translateY(100%)', 'translateY(0)'] : ['translateX(100%)', 'translateX(0)'] }, { duration: .42 });
    setTimeout(() => $('.x', drawer).focus(), 30);
  }
  $$('[data-open-cart]').forEach(b => b.addEventListener('click', () => openDrawer('cart')));
  drawer.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeLayer(drawer); return; }
    if (e.target.closest('[data-back]')) { setView('cart'); return; }
    if (e.target.closest('[data-new-order]')) { sessionStorage.removeItem('lizo.last'); setView('cart'); return; }
  });
  $('[data-next]').addEventListener('click', () => { if (drawerView === 'cart') setView('checkout'); else if (drawerView === 'checkout') submit(); });
  const form = $('[data-view="checkout"]');
  form.addEventListener('change', e => {
    if (e.target.name === 'mode') {
      const del = mode() === 'delivery';
      $('[data-addr]').hidden = !del; $('[data-pickup]').hidden = del;
      updateFoot();
    }
  });
  form.addEventListener('submit', e => { e.preventDefault(); submit(); });
  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });

  function validate() {
    const f = form.elements, errs = [], del = mode() === 'delivery';
    const bad = (el, msg) => { el.setAttribute('aria-invalid', 'true'); errs.push([el, msg]); };
    $$('[aria-invalid]', form).forEach(x => x.removeAttribute('aria-invalid'));
    if (f.name.value.trim().length < 2) bad(f.name, 'Add meg a neved.');
    const digits = f.phone.value.replace(/\D/g, '');
    if (!/^(36|06)\d{8,9}$/.test(digits)) bad(f.phone, 'A telefonszám formátuma: +36 30 123 4567.');
    if (del) {
      if (!f.area.value) bad(f.area, 'Válaszd ki a települést.');
      if (f.street.value.trim().length < 4) bad(f.street, 'Add meg az utcát és a házszámot.');
    }
    if (!f.terms.checked) bad(f.terms, 'A rendeléshez fogadd el az ÁSZF-et és az adatkezelési tájékoztatót.');
    return errs;
  }
  let submitting = false;
  function submit() {
    if (submitting) return;
    const errs = validate(), box = $('[data-formerr]');
    if (errs.length) { box.textContent = errs[0][1]; box.hidden = false; errs[0][0].focus(); anim(box, { transform: ['translateX(-6px)', 'translateX(6px)', 'translateX(0)'] }, { duration: .3 }); return; }
    const sub = S.subtotal(cart);
    if (mode() === 'delivery' && sub < S.settings().minOrder) { updateFoot(); return; }
    submitting = true; $('[data-next]').disabled = true;
    const f = form.elements, o = openState();
    const no = S.nextOrderNo();
    const order = {
      no, created: new Date().toISOString(), mode: mode(), preorder: !o.open,
      name: f.name.value.trim(), phone: f.phone.value.trim(),
      area: mode() === 'delivery' ? f.area.value : '', street: mode() === 'delivery' ? f.street.value.trim() : '', door: mode() === 'delivery' ? f.door.value.trim() : '',
      note: f.note.value.trim(), pay: 'atvetelkor',
      // az árat a terméktörzsből számoljuk, nem a kosárban tárolt adatból
      lines: cart.map(l => { const p = S.byId[l.id], u = S.unitPrice(l); return { id: l.id, name: p.name, size: l.size, sizeLabel: p.sizes && p.sizes.length > 1 ? p.sizes.find(s => s.k === l.size).label : '', removed: l.removed, drink: l.drink, variant: l.variant, note: l.note, qty: l.qty, unit: u, total: u * l.qty }; }),
      subtotal: sub, status: 'new', history: [{ s: 'new', t: Date.now() }]
    };
    const all = S.orders(); all.push(order); S.saveOrders(all);
    sessionStorage.setItem('lizo.last', String(no));
    cart = []; S.saveCart(cart); renderCart();
    form.reset(); $('[data-addr]').hidden = false; $('[data-pickup]').hidden = true;
    renderDone(no); setView('done');
    setTimeout(() => { submitting = false; }, 600);
  }

  const STEPS = { delivery: [['new', 'Beérkezett'], ['accepted', 'Elfogadva'], ['cooking', 'Készül'], ['ready', 'Futárnál, úton'], ['done', 'Kiszállítva']], pickup: [['new', 'Beérkezett'], ['accepted', 'Elfogadva'], ['cooking', 'Készül'], ['ready', 'Átvehető'], ['done', 'Átvéve']] };
  function renderDone(no) {
    const o = S.orders().find(x => x.no === no), box = $('[data-done]');
    if (!o) { box.innerHTML = ''; return; }
    const steps = STEPS[o.mode], idx = steps.findIndex(s => s[0] === o.status);
    const tl = o.status === 'rejected'
      ? `<li class="is-done"><i></i>Beérkezett</li><li class="is-bad"><i></i>Az étterem nem tudja teljesíteni – hívd őket: <a href="tel:+36303887099">+36 30 388 7099</a></li>`
      : steps.map((s, i) => `<li class="${i < idx || o.status === 'done' ? 'is-done' : i === idx ? 'is-now' : ''}"><i></i>${s[1]}</li>`).join('');
    const firstTime = !box.dataset.no || box.dataset.no !== String(no);
    box.dataset.no = no;
    box.innerHTML = `
      <svg class="done__seal" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="32" pathLength="1"/><path d="m22 37 9 9 19-20" pathLength="1"/></svg>
      <h3>${o.preorder ? 'Előrendelés rögzítve' : 'Rendelés rögzítve'}</h3>
      <p class="done__id">Rendelésszám: <b>#${o.no}</b> · ${o.mode === 'delivery' ? `kiszállítás ide: ${esc(o.area)}, ${esc(o.street)}` : 'személyes átvétel a Balassa Bálint utcában'}</p>
      ${o.preorder ? `<p class="done__id">Most zárva vagyunk, a rendelés nyitáskor kerül sorra.</p>` : ''}
      <ol class="timeline" aria-label="Rendelés állapota">${tl}</ol>
      <div class="receipt">${o.lines.map(l => `<div><span>${l.qty} × ${esc(l.name)}${l.sizeLabel ? ' (' + l.sizeLabel + ')' : ''}</span><b>${fmt(l.total)}</b></div>`).join('')}
        <div><span>Részösszeg</span><b>${fmt(o.subtotal)}</b></div>
        ${o.mode === 'delivery' ? '<div><span>Kiszállítási díj</span><span class="muted">a cím alapján</span></div>' : ''}
        <div><span>Fizetés</span><span>átvételkor</span></div></div>
      <p class="ribbon">Látványterv: ez a rendelés csak ebben a böngészőben létezik, az étteremhez nem jutott el. Az állapotát a <a href="admin.html" target="_blank" rel="noopener">konyhai felületen</a> lehet léptetni.</p>
      <p style="margin-top:18px"><button class="btn btn--line" type="button" data-new-order>Új rendelés</button></p>`;
    if (firstTime && M && !reduced) {
      $$('.done__seal circle, .done__seal path', box).forEach((p, i) => { p.style.strokeDasharray = '1'; M.animate(p, { strokeDashoffset: [1, 0] }, { duration: .6, delay: .1 + i * .35, ease }); });
    }
  }
  function refreshDone() { const no = +($('[data-done]').dataset.no || 0); if (no && drawerView === 'done' && !drawer.hidden) renderDone(no); }
  addEventListener('storage', e => {
    if (e.key === S.K.orders) refreshDone();
    if (e.key === S.K.off) { off = S.unavailable(); renderMenu(); doSearch($('[data-search]').value); renderCart(); }
    if (e.key === S.K.settings) { renderMin(); updateFoot(); }
  });
  setInterval(refreshDone, 4000);

  /* ---------- méret-összehasonlító ---------- */
  const A32 = Math.PI * 16 * 16, A50 = Math.PI * 25 * 25;
  function renderSize(id) {
    const p = S.byId[id], [s32, s50] = p.sizes;
    $('[data-sz32]').textContent = fmt(s32.price); $('[data-sz50]').textContent = fmt(s50.price);
    const u32 = s32.price / A32 * 100, u50 = s50.price / A50 * 100;
    $('[data-sz32u]').textContent = `${Math.round(u32)} Ft / 100 cm²`; $('[data-sz50u]').textContent = `${Math.round(u50)} Ft / 100 cm²`;
    const pct = Math.round((1 - u50 / u32) * 100);
    $('[data-sz-verdict]').innerHTML = `${esc(p.name)}: az 50 cm-es <strong>${fmt(s50.price - s32.price)}-tal</strong> drágább, de négyzetcentiméterre vetítve <strong>${pct}%-kal olcsóbb</strong>.`;
    $('[data-sz-order]').textContent = `${p.name} 50 cm-ben`;
    $('[data-sz-order]').dataset.pid = id;
    $$('[data-size-card] .size__price').forEach(e => anim(e, { opacity: [.2, 1], transform: ['translateY(6px)', 'translateY(0)'] }, { duration: .35 }));
  }
  function initSize() {
    const sel = $('[data-size-select]');
    sel.innerHTML = byCat('pizza').map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    sel.value = 'sonkas';
    sel.addEventListener('change', () => renderSize(sel.value));
    $('[data-sz-order]').addEventListener('click', e => openSheet(e.currentTarget.dataset.pid, { size: '50' }));
    renderSize('sonkas');
  }

  /* ---------- toast ---------- */
  let tt;
  function toast(msg) {
    const t = $('[data-toast]'); t.textContent = msg; clearTimeout(tt);
    if (M && !reduced) M.animate(t, { opacity: [0, 1], transform: ['translateX(-50%) translateY(16px)', 'translateX(-50%) translateY(0)'] }, { duration: .3 });
    else t.style.opacity = 1;
    tt = setTimeout(() => { if (M && !reduced) M.animate(t, { opacity: 0 }, { duration: .3 }); else t.style.opacity = 0; }, 2200);
  }

  /* ---------- globális események ---------- */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { openSheet(o.dataset.open); return; }
    const j = e.target.closest('[data-jump]'); if (j) { e.preventDefault(); jump(j.dataset.jump); return; }
    const t = e.target.closest('[data-tab]'); if (t) { jump(t.dataset.tab); return; }
  });
  scrim.addEventListener('click', () => { if (!sheet.hidden) closeLayer(sheet); else if (!drawer.hidden) closeLayer(drawer); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (!sheet.hidden) closeLayer(sheet); else if (!drawer.hidden) closeLayer(drawer); }
    if (e.key === 'Tab') {
      const layer = !sheet.hidden ? sheet : !drawer.hidden ? drawer : null; if (!layer) return;
      const f = $$('button:not([disabled]):not([hidden]),a[href],input:not([type=hidden]),select,textarea', layer).filter(x => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let sq; $('[data-search]').addEventListener('input', e => { clearTimeout(sq); sq = setTimeout(() => doSearch(e.target.value), 120); });
  addEventListener('scroll', () => requestAnimationFrame(spy), { passive: true });
  addEventListener('resize', () => placePill(true));

  /* ---------- belépő animációk ---------- */
  function intro() {
    if (!M || reduced) return;
    const { animate, stagger, inView } = M;
    animate('[data-hero]', { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] }, { duration: .7, delay: stagger(.08, { startDelay: .1 }), ease });
    animate('.hero__logo', { opacity: [0, 1], transform: ['translate(-50%,-50%) scale(.94)', 'translate(-50%,-50%) scale(1)'] }, { duration: .9, ease });
    $$('.ring--32,.ring--50b').forEach(c => { c.setAttribute('pathLength', '1'); c.style.strokeDasharray = '1'; });
    animate('.ring--32', { strokeDashoffset: [1, 0] }, { duration: 1.2, delay: .2, ease });
    animate('.ring--50b', { strokeDashoffset: [1, 0] }, { duration: 1.4, delay: .35, ease });
    animate('.ring--50', { opacity: [0, 1], transform: ['rotate(-8deg)', 'rotate(0)'] }, { duration: 1.4, delay: .3, ease });
    animate('.ring--hatch', { opacity: [0, 1] }, { duration: .8, delay: .9 });
    animate('.ring__label', { opacity: [0, 1] }, { duration: .6, delay: 1.1 });
    const tgt = x => (x && x.target) ? x.target : x;
    const reveal = (sel, opts = {}) => inView(sel, en => { const el = tgt(en); animate(el.children.length && opts.kids ? [...el.children] : el, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { duration: .6, ease, delay: opts.kids ? stagger(.05) : 0 }); }, { margin: '0px 0px -10% 0px' });
    reveal('.cats__list', { kids: true }); reveal('.size__card'); reveal('.ocard'); reveal('.contact__in > div');
    inView('.mcat', en => { const el = tgt(en); animate($$('.mlist > li, .blist > li', el).slice(0, 14), { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] }, { duration: .45, delay: stagger(.03), ease }); }, { margin: '0px 0px -15% 0px' });
    inView('.size__card', () => { $$('.size__disc circle').forEach(c => { c.setAttribute('pathLength', '1'); c.style.strokeDasharray = '1'; }); animate('.size__disc circle', { strokeDashoffset: [1, 0] }, { duration: 1, delay: stagger(.2), ease }); });
  }

  /* ---------- indulás ---------- */
  renderHours(); renderMin(); renderCats(); renderMenu(); initSize(); renderCart();
  placePill(true);
  setInterval(renderHours, 60000);
  intro();
})();
