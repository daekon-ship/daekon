/* ==========================================================================
   Adminfelület – nagy gombok, egyértelmű magyar feliratok, kevés lépés.
   Bemutató: nincs bejelentkezés és szerveroldali jogosultság (külön fejlesztési szakasz).
   ========================================================================== */
import { store } from './store.js';
import { COLORS, STYLES } from './data.js';
import { priceProduct, priceAll, diffPrices, defaultConfig, ft, num, dec, pct, FINENESS } from './engine.js';
import { $, $$, esc, productMedia, toast, modal, M, reduced, dateHu, dayHu } from './ui.js';
import { configText } from './views-public.js';

const S = () => store.get();
const fresh = (el) => { const n = el.cloneNode(false); el.replaceWith(n); return n; };
const clone = (o) => JSON.parse(JSON.stringify(o));
const parseNum = (v) => { const n = Number(String(v).replace(/\s| | /g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };

export const MENU = [
  ['attekintes', 'Áttekintés'],
  ['alapanyag', 'Alapanyagárak'],
  ['gyuruk', 'Gyűrűk kezelése'],
  ['keplet', 'Árképletek és munkadíjak'],
  ['erdeklodesek', 'Érdeklődések'],
  ['elozmenyek', 'Árváltozási előzmények'],
  ['beallitasok', 'Beállítások'],
];

export function adminShell(el, page, arg) {
  const newInq = S().inquiries.filter((q) => q.status === 'uj').length;
  el.innerHTML = `
  <div class="adm">
    <aside class="adm__nav" aria-label="Admin menü">
      <p class="adm__brand"><img src="img/logo-jel.png" alt="" width="176" height="127">Karikagyuru.com<span>Kezelőfelület</span></p>
      <nav><ol>${MENU.map(([k, t], i) => `<li><a href="#/admin/${k}" ${page === k || (page === 'gyuru' && k === 'gyuruk') ? 'aria-current="page"' : ''}><span>${i + 1}</span>${t}${k === 'erdeklodesek' && newInq ? `<em>${newInq}</em>` : ''}</a></li>`).join('')}</ol></nav>
    </aside>
    <main class="adm__main" id="adm-main">
      <p class="adm__banner"><b>Bemutató adminfelület.</b> Nem éles rendszer: az adatok csak ebben a böngészőben tárolódnak, minden alapanyagár kitalált demóérték.</p>
      <div data-page></div>
    </main>
  </div>`;
  const P = $('[data-page]', el);
  ({ attekintes: overview, alapanyag: materials, gyuruk: products, gyuru: productEdit, keplet: formula,
     erdeklodesek: inquiries, elozmenyek: history, beallitasok: settings }[page] || overview)(P, arg);
  if (M() && !reduced()) M().animate(P, { opacity: [0, 1], y: [10, 0] }, { duration: 0.35 });
}

/* ---------- 1. Áttekintés ---------- */
function overview(el) {
  el = fresh(el);
  const st = S();
  const last = st.history.find((h) => h.kind === 'materials') || st.history[st.history.length - 1];
  const newInq = st.inquiries.filter((q) => q.status === 'uj').length;
  el.innerHTML = `
    <h1 class="adm__h1">Jó napot kívánok!</h1>
    <p class="adm__lead">Ha változik az arany ára, elég egyetlen számot átírni – az összes gyűrű ára magától újraszámolódik.</p>
    <a class="abtn abtn--gold abtn--xl" href="#/admin/alapanyag">Arany árának módosítása →</a>
    <div class="tiles">
      <div class="tile"><span>24 karátos színarany</span><b>${ft(st.materials.gold24)}/g</b><small>demóérték</small></div>
      <div class="tile"><span>Ezüst</span><b>${ft(st.materials.silver)}/g</b><small>demóérték</small></div>
      <div class="tile"><span>Gyűrűk a katalógusban</span><b>${st.products.length} db</b><small>${st.products.filter((p) => p.override).length} egyedi árral</small></div>
      <a class="tile tile--link" href="#/admin/erdeklodesek"><span>Új érdeklődés</span><b>${newInq} db</b><small>megnyitás →</small></a>
    </div>
    <h2 class="adm__h2">Utolsó változás</h2>
    <div class="note-card"><p><b>${esc(last.title)}</b></p><p>${dateHu(last.at)} · ${esc(last.by)}${last.count ? ` · ${last.count} gyűrű ára változott` : ''}</p>
      <a class="abtn" href="#/admin/elozmenyek">Összes változás</a></div>`;
}

/* ---------- 2. Alapanyagárak – a bemutató fő képernyője ---------- */
function materials(el) {
  el = fresh(el);
  const st = S();
  const cur = clone(st.materials);
  const draft = clone(st.materials);
  const lastM = st.history.find((h) => h.kind === 'materials' || h.kind === 'start');

  const field = (key, label, unit, step, sub = '', path = key) => `
    <div class="mfield" data-mfield="${path}">
      <label for="f-${path}"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</label>
      <div class="mfield__ctl">
        <button type="button" class="mbtn" data-step="-${step}" aria-label="${label} csökkentése ${num(step)} Ft-tal">−</button>
        <div class="mfield__input"><input id="f-${path}" inputmode="numeric" data-path="${path}" value="${num(get(draft, path))}" autocomplete="off"><span>${unit}</span></div>
        <button type="button" class="mbtn" data-step="${step}" aria-label="${label} növelése ${num(step)} Ft-tal">+</button>
      </div>
      <p class="mfield__was" data-was="${path}">Jelenleg: ${num(get(cur, path))} ${unit}</p>
    </div>`;

  el.innerHTML = `
    <h1 class="adm__h1">Alapanyagárak</h1>
    <p class="adm__lead">Írja át az árat, és nézze meg, mi változna. Semmi sem végleges, amíg meg nem nyomja az <b>„Új árak alkalmazása”</b> gombot.</p>
    <p class="adm__meta">Utoljára módosítva: ${dateHu(lastM.at)} · ${esc(lastM.by)}</p>
    <div class="mat">
      <div class="mat__fields">
        ${field('gold24', '24 karátos színarany referenciaára', 'Ft/g', 500, 'Ebből számol minden 14K (58,5%) és 18K (75%) gyűrű.')}
        ${field('silver', 'Ezüst referenciaára', 'Ft/g', 50, 'Az ezüst demótermékekre hat.')}
      </div>
      <aside class="impact" data-impact aria-live="polite"></aside>
      <div class="mat__fields mat__fields--more">
        <details class="mat__more" open>
          <summary>Gyémántok egységára</summary>
          ${st.materials.diamonds.map((d, i) => field('', `${d.name} · ${d.quality}`, 'Ft/db', 1000, '', `diamonds.${i}.price`)).join('')}
        </details>
        <details class="mat__more">
          <summary>Ötvözőanyagok</summary>
          ${field('', 'Sárgaarany ötvözet', 'Ft/g', 50, '', 'alloy.sarga')}
          ${field('', 'Fehérarany ötvözet', 'Ft/g', 100, 'palládiumtartalmú', 'alloy.feher')}
          ${field('', 'Rozéarany ötvözet', 'Ft/g', 50, '', 'alloy.rose')}
        </details>
      </div>
    </div>`;

  const impact = $('[data-impact]', el);
  let confirmBig = false;

  const paint = () => {
    const d = diffPrices(st.products, cur, draft, st.settings);
    const changes = changedPaths(cur, draft);
    $$('[data-mfield]', el).forEach((f) => f.classList.toggle('is-changed', changes.some((c) => c.path === f.dataset.mfield)));
    if (!changes.length) {
      impact.className = 'impact impact--idle';
      impact.innerHTML = `<h2>Mi változna?</h2><p>Írjon át egy árat – itt azonnal látja, hány gyűrűt érint, és mennyi lesz az új áruk.</p>
        <p class="impact__tip">Tipp a bemutatóhoz: írja át az arany árát <b>39 000</b>-ről <b>45 000</b>-re.</p>
        <button class="abtn" type="button" data-demo-gold>Kipróbálom: 45 000 Ft/g</button>`;
      return;
    }
    const big = changes.filter((c) => Math.abs(c.pct) >= st.settings.bigChangePct);
    const examples = [...d.rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5);
    impact.className = 'impact impact--on';
    impact.innerHTML = `
      <h2>A változás hatása</h2>
      <ul class="impact__chg">${changes.map((c) => `<li><span>${esc(c.label)}</span><b>${num(c.from)} → ${num(c.to)} ${c.unit}</b><em class="${c.pct > 0 ? 'up' : 'down'}">${pct(c.pct)}</em></li>`).join('')}</ul>
      <div class="impact__big">
        <div><span>Érintett gyűrű</span><b>${d.count} db</b></div>
        <div><span>Átlagos árváltozás</span><b class="${d.avgPct >= 0 ? 'up' : 'down'}">${pct(d.avgPct)}</b></div>
      </div>
      ${examples.length ? `<h3>Példák – régi és új ár</h3>
      <ul class="impact__ex">${examples.map((r) => `<li><span class="impact__code">${esc(r.code)}</span><span class="impact__old">${ft(r.old)}</span><span class="impact__arrow">→</span><b>${ft(r.now)}</b><em class="${r.delta > 0 ? 'up' : 'down'}">${r.delta > 0 ? '+' : ''}${ft(r.delta)}</em></li>`).join('')}</ul>` : '<p>Ez a változás egyik gyűrű árát sem módosítja (pl. rögzített egyedi ár miatt).</p>'}
      <label class="field"><span>Érvényes ettől a naptól</span><input class="input input--lg" type="date" data-valid value="${new Date().toISOString().slice(0, 10)}"></label>
      ${big.length ? `<label class="confirm"><input type="checkbox" data-confirm ${confirmBig ? 'checked' : ''}><span><b>Szokatlanul nagy változás (${pct(big[0].pct)}).</b> Ellenőriztem, az összeg helyes.</span></label>` : ''}
      <div class="impact__btns">
        <button class="abtn abtn--xl" type="button" data-cancel>Mégsem</button>
        <button class="abtn abtn--gold abtn--xl" type="button" data-apply ${big.length && !confirmBig ? 'disabled' : ''}>Új árak alkalmazása</button>
      </div>`;
  };

  const setVal = (path, v) => {
    if (!Number.isFinite(v) || v < 0) return;
    set(draft, path, Math.round(v));
    const inp = $(`[data-path="${CSS.escape(path)}"]`, el);
    if (inp && document.activeElement !== inp) inp.value = num(get(draft, path));
    paint();
  };

  el.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]');
    if (s) { const path = s.closest('[data-mfield]').dataset.mfield; setVal(path, get(draft, path) + Number(s.dataset.step)); }
    if (e.target.closest('[data-demo-gold]')) { setVal('gold24', 45000); $('#f-gold24', el).value = num(45000); $('#f-gold24', el).focus(); }
    if (e.target.closest('[data-cancel]')) { materials(el); toast('A módosítást elvetettük – az árak nem változtak.'); }
    if (e.target.closest('[data-apply]')) {
      const valid = $('[data-valid]', el)?.value;
      const d = store.applyMaterials(draft, { validFrom: valid ? new Date(valid).toISOString() : undefined });
      const entry = S().history[0];
      el.innerHTML = `<div class="done">
        <p class="done__mark" aria-hidden="true">✓</p>
        <h1 class="adm__h1">Az új árak érvényben vannak</h1>
        <p class="adm__lead">${d.count} gyűrű ára frissült. Átlagos változás: <b>${pct(d.avgPct)}</b>.</p>
        <div class="done__btns">
          <a class="abtn abtn--gold abtn--xl" href="#/kollekcio" data-to-customer>Megnézem a katalógusban</a>
          <button class="abtn abtn--xl" type="button" data-undo="${entry.id}">Visszaállítom a korábbi árakat</button>
          <a class="abtn" href="#/admin/alapanyag">Újabb módosítás</a>
        </div></div>`;
      if (M() && !reduced()) M().animate($('.done__mark', el), { scale: [0.6, 1], opacity: [0, 1] }, { type: 'spring', bounce: 0.4, duration: 0.6 });
    }
    const u = e.target.closest('[data-undo]');
    if (u) { store.revert(u.dataset.undo); toast('A korábbi árak visszaálltak.'); materials(el); }
  });
  el.addEventListener('input', (e) => {
    if (e.target.matches('[data-path]')) { const v = parseNum(e.target.value); if (Number.isFinite(v)) { set(draft, e.target.dataset.path, Math.round(v)); paint(); } }
    if (e.target.matches('[data-confirm]')) { confirmBig = e.target.checked; paint(); }
  });
  el.addEventListener('focusout', (e) => { if (e.target.matches('[data-path]')) e.target.value = num(get(draft, e.target.dataset.path)); });
  paint();
}

function changedPaths(a, b) {
  const out = [];
  const push = (path, label, unit) => { const f = get(a, path), t = get(b, path); if (f !== t) out.push({ path, label, unit, from: f, to: t, pct: f ? ((t - f) / f) * 100 : 100 }); };
  push('gold24', '24K színarany', 'Ft/g');
  push('silver', 'Ezüst', 'Ft/g');
  a.diamonds.forEach((d, i) => push(`diamonds.${i}.price`, d.name, 'Ft/db'));
  push('alloy.sarga', 'Sárga ötvözet', 'Ft/g'); push('alloy.feher', 'Fehér ötvözet', 'Ft/g'); push('alloy.rose', 'Rozé ötvözet', 'Ft/g');
  return out;
}
const get = (o, path) => path.split('.').reduce((x, k) => x?.[k], o);
const set = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };

/* ---------- 3. Gyűrűk kezelése ---------- */
function products(el) {
  el = fresh(el);
  const st = S();
  const prices = priceAll(st.products, st.materials, st.settings);
  let q = '';
  el.innerHTML = `
    <h1 class="adm__h1">Gyűrűk kezelése</h1>
    <p class="adm__lead">Az árak a képletből számolódnak. Egy gyűrűnél rögzíthet egyedi árat is – azt az aranyár változása nem írja felül.</p>
    <label class="field field--search"><span>Keresés cikkszámra vagy névre</span><input class="input input--lg" data-q placeholder="pl. 81184"></label>
    <div class="plist" data-list></div>`;
  const paint = () => {
    const list = st.products.filter((p) => (p.code + ' ' + p.name).toLowerCase().includes(q));
    $('[data-list]', el).innerHTML = list.map((p) => `
      <a class="prow" href="#/admin/gyuru/${p.id}">
        <span class="prow__img">${productMedia(p)}</span>
        <span class="prow__txt"><b>${esc(p.code)}</b><span>${esc(p.name)}</span></span>
        <span class="prow__price"><b>${ft(prices[p.id])}</b>
          <small>${p.override ? (p.override.type === 'fixed' ? 'rögzített egyedi ár' : `képlet ${pct(p.override.value)}`) : 'képletből'}${p.listaAr ? ` · mostani weboldalon: ${ft(p.listaAr)}` : ''}</small></span>
        <span class="abtn">Szerkesztés</span>
      </a>`).join('') || '<p>Nincs találat.</p>';
  };
  el.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { q = e.target.value.toLowerCase().trim(); paint(); } });
  paint();
}

function productEdit(el, id) {
  el = fresh(el);
  const st = S();
  const orig = store.product(id);
  if (!orig) { el.innerHTML = '<p>A gyűrű nem található.</p>'; return; }
  const p = clone(orig);
  const ov = () => p.override?.type || 'nincs';
  const n = (path, label, unit, step = 1, hint = '') => `<label class="efield"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-p="${path}" value="${esc(String(get(p, path) ?? '').replace('.', ','))}"><i>${unit}</i></span></label>`;

  el.innerHTML = `
    <p class="crumbs"><a href="#/admin/gyuruk">← Vissza a gyűrűkhöz</a></p>
    <h1 class="adm__h1">${esc(p.code)}</h1>
    <div class="edit">
      <div class="edit__form">
        <section class="ebox"><h2>Alapadatok</h2>
          <label class="efield"><span>Megnevezés</span><input class="input input--lg" data-t="name" value="${esc(p.name)}"></label>
          <label class="efield"><span>Stílus</span><select class="input input--lg" data-t="style">${Object.entries(STYLES).map(([k, v]) => `<option value="${k}" ${p.style === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          ${p.listaAr ? `<p class="hint">A karikagyuru.com-on jelenleg feltüntetett ár: <b>${ft(p.listaAr)}</b> (valós, összehasonlításhoz).</p>` : ''}
        </section>
        ${p.rings.map((r, i) => `<section class="ebox"><h2>${esc(r.label)}</h2>
          <div class="egrid">
            ${n(`rings.${i}.weight`, 'Tömeg 14K-ban', 'g', 0.1, `${r.refSize}-es méretben – demóadat`)}
            ${n(`rings.${i}.labor`, 'Munkadíj', 'Ft', 1000, 'nem függ az arany árától')}
            ${n(`rings.${i}.other`, 'Egyéb költség', 'Ft', 500)}
            ${r.stones ? n(`rings.${i}.stones.count`, 'Kövek száma', 'db', 1) : ''}
            ${r.stones ? `<label class="efield"><span>Kő kategóriája</span><select class="input input--lg" data-p="rings.${i}.stones.cat">${st.materials.diamonds.map((d) => `<option value="${d.id}" ${r.stones.cat === d.id ? 'selected' : ''}>${d.name} · ${d.quality} – ${ft(d.price)}/db</option>`).join('')}</select></label>` : ''}
          </div></section>`).join('')}
        <section class="ebox"><h2>Egyedi ár</h2>
          <div class="seg seg--lg seg--wrap" data-ov>
            <button type="button" data-ovt="nincs" aria-pressed="${ov() === 'nincs'}">Képlet szerint</button>
            <button type="button" data-ovt="pct" aria-pressed="${ov() === 'pct'}">Képlet ± százalék</button>
            <button type="button" data-ovt="fixed" aria-pressed="${ov() === 'fixed'}">Rögzített ár</button>
          </div>
          <div data-ovfield></div>
          ${n('minPrice', 'Minimumár (védelem)', 'Ft', 1000, 'ennél olcsóbban sosem jelenik meg; 0 = nincs')}
        </section>
        <div class="edit__btns">
          <a class="abtn abtn--xl" href="#/admin/gyuruk">Mégsem</a>
          <button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button>
        </div>
      </div>
      <aside class="edit__calc" data-calc aria-live="polite"></aside>
    </div>`;

  const ovField = () => {
    const t = ov();
    $('[data-ovfield]', el).innerHTML = t === 'pct' ? n('override.value', 'Eltérés a képlettől', '%', 1, 'pl. −5 vagy 10')
      : t === 'fixed' ? n('override.value', 'Rögzített bruttó ár', 'Ft', 1000, 'az aranyár változása nem írja felül') : '';
  };
  const calc = () => {
    const r = priceProduct(p, defaultConfig(p), st.materials, st.settings);
    const b = r.breakdown, s = st.settings;
    const line = (l, v, cls = '') => `<div class="${cls}"><dt>${l}</dt><dd>${ft(v)}</dd></div>`;
    $('[data-calc]', el).innerHTML = `<h2>Árkalkuláció <small>alapkonfiguráció, 14K</small></h2>
      <p class="hint">${dec(r.grams)} g ötvözet · ebből ${dec(r.pure)} g színarany × ${ft(st.materials.gold24)}/g</p>
      <dl class="calc-dl">
        ${line('Nemesfém (veszteséggel)', b.metal)}${line('Ötvözőanyag', b.alloy)}${line('Drágakövek', b.stones)}
        ${line('Munkadíj', b.labor)}${b.setting ? line('Kőfoglalás', b.setting) : ''}${line('Doboz, tanúsítvány, egyéb', b.other)}
        ${line('Önköltség összesen', b.cost, 'sum')}
        ${line(`Felár (fém, munka ${s.markupMetal}% · kő ${s.markupStones}%)`, b.net - b.cost)}
        ${line('Nettó ár', b.net)}${line(`ÁFA ${s.vatPct}%`, b.gross - b.net)}
        ${line(`Kalkulált ár (kerekítve ${num(s.roundTo)} Ft-ra)`, r.calculated, 'sum')}
      </dl>
      <div class="calc-final"><span>Megjelenő ár${r.source !== 'keplet' ? (r.source === 'rogzitett' ? ' – rögzített' : ' – módosított') : ''}</span><b>${ft(r.final)}</b></div>
      <p class="${r.lowMargin ? 'warn' : 'ok'}">Árrés: ${dec(Math.round(r.marginPct * 10) / 10)}% ${r.lowMargin ? `– kisebb, mint a beállított ${s.minMarginPct}% minimum!` : ''}</p>
      ${r.minHit ? '<p class="warn">A minimumár lépett életbe.</p>' : ''}`;
  };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ovt]');
    if (b) {
      const t = b.dataset.ovt;
      p.override = t === 'nincs' ? null : { type: t, value: t === 'fixed' ? priceProduct(p, null, st.materials, st.settings, { applyOverride: false }).final : 0 };
      $$('[data-ovt]', el).forEach((x) => x.setAttribute('aria-pressed', x === b));
      ovField(); calc();
    }
    if (e.target.closest('[data-save]')) {
      const r = priceProduct(p, null, st.materials, st.settings);
      const go = () => { store.updateProduct(id, (x) => Object.assign(x, clone(p)), `${p.code} adatai módosítva`); toast(`Mentve. ${p.code} új ára: <b>${ft(r.final)}</b>`); location.hash = '#/admin/gyuruk'; };
      if (r.lowMargin) {
        modal(`<div class="form"><h2>Alacsony árrés</h2><p>Ennél a gyűrűnél az árrés ${dec(Math.round(r.marginPct * 10) / 10)}%, kevesebb a beállított ${st.settings.minMarginPct}%-os minimumnál. Biztosan menti?</p>
          <div class="impact__btns"><button class="abtn abtn--xl" data-close>Vissza</button><button class="abtn abtn--gold abtn--xl" data-ok>Igen, mentem</button></div></div>`,
          { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); go(); } });
      } else go();
    }
  });
  el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.t) p[t.dataset.t] = t.value;
    if (t.dataset.p) {
      const v = t.tagName === 'SELECT' ? t.value : parseNum(t.value);
      if (t.tagName === 'SELECT' || Number.isFinite(v)) set(p, t.dataset.p, v);
    }
    calc();
  });
  ovField(); calc();
}

/* ---------- 4. Árképletek és munkadíjak ---------- */
function formula(el) {
  el = fresh(el);
  const st = S();
  const d = clone(st.settings);
  const sample = store.product('maz-81184-81185-w');
  const f = (k, label, unit, hint = '') => `<label class="efield"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="${k}" value="${String(d[k]).replace('.', ',')}"><i>${unit}</i></span></label>`;
  el.innerHTML = `
    <h1 class="adm__h1">Árképletek és munkadíjak</h1>
    <div class="formula">
      <p class="formula__eq"><span>Nemesfém</span>+<span>ötvözőanyag</span>+<span>drágakövek</span>+<span>munkadíj</span>+<span>egyéb</span>+<span>felár</span>+<span>ÁFA</span>=<b>kalkulált ár</b></p>
      <p class="hint">Színarany-tartalom: 14K = 58,5%, 18K = 75%. A munkadíj fix összeg, az arany árától nem változik. A gyémánt darabár × kőszám alapján számolódik, nem grammra.</p>
    </div>
    <div class="edit">
      <div class="edit__form">
        <section class="ebox"><h2>Felárak és adó</h2><div class="egrid">
          ${f('markupMetal', 'Felár a fémre és munkára', '%')}${f('markupStones', 'Felár a kövekre', '%')}
          ${f('vatPct', 'ÁFA', '%')}${f('lossPct', 'Gyártási veszteség', '%', 'a fém tömegére')}
        </div></section>
        <section class="ebox"><h2>Fix díjak</h2><div class="egrid">
          ${f('settingPerStone', 'Kőfoglalás', 'Ft/kő')}${f('engravingPrice', 'Gravírozás', 'Ft/gyűrű')}
          ${f('boxCost', 'Díszdoboz', 'Ft/termék')}${f('certCost', 'Kőtanúsítvány', 'Ft/köves termék')}
          ${f('density18', '18K tömegszorzó', '×', 'ugyanaz a modell 18K-ban ennyivel nehezebb')}
        </div></section>
        <p class="hint">A gyűrűnkénti munkadíj a „Gyűrűk kezelése” menüben, gyűrűnként állítható.</p>
        <div class="edit__btns"><a class="abtn abtn--xl" href="#/admin/attekintes">Mégsem</a><button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button></div>
      </div>
      <aside class="edit__calc" data-calc></aside>
    </div>`;
  const calc = () => {
    const old = priceAll(st.products, st.materials, st.settings);
    const now = priceAll(st.products, st.materials, d);
    const changed = Object.keys(now).filter((k) => now[k] !== old[k]);
    const r = priceProduct(sample, null, st.materials, d);
    $('[data-calc]', el).innerHTML = `<h2>Hatás</h2>
      <p class="impact__n"><b>${changed.length}</b> gyűrű ára változna.</p>
      <h3>Példa: ${esc(sample.code)}</h3>
      <dl class="calc-dl"><div><dt>Most</dt><dd>${ft(old[sample.id])}</dd></div><div class="sum"><dt>Új beállítással</dt><dd>${ft(r.final)}</dd></div>
      <div><dt>Árrés</dt><dd>${dec(Math.round(r.marginPct * 10) / 10)}%</dd></div></dl>`;
  };
  el.addEventListener('input', (e) => { const k = e.target.dataset.s; if (k) { const v = parseNum(e.target.value); if (Number.isFinite(v)) { d[k] = v; calc(); } } });
  el.addEventListener('click', (e) => { if (e.target.closest('[data-save]')) { store.updateSettings(d, 'Árképlet és munkadíjak módosítva'); toast('Az árképlet mentve, az árak újraszámolódtak.'); formula(el); } });
  calc();
}

/* ---------- 5. Érdeklődések ---------- */
const STATUS = { uj: 'Új', visszahivva: 'Visszahívva', elfogadva: 'Ajánlat elfogadva', lezarva: 'Lezárva' };
function inquiries(el) {
  el = fresh(el);
  const st = S();
  el.innerHTML = `<h1 class="adm__h1">Érdeklődések</h1>
    <p class="adm__lead">A weboldalon küldött kérések. A termékoldalról érkezőkben a cikkszám és a választott beállítás is benne van.</p>
    ${st.inquiries.length ? st.inquiries.map((q) => {
      const p = q.productId && store.product(q.productId);
      const nowPrice = p && q.config ? priceProduct(p, q.config, st.materials, st.settings).final : null;
      return `<article class="inq inq--${q.status}">
        <header><b>${esc(q.name)}</b><span class="badge">${STATUS[q.status]}</span><span class="hint">${dateHu(q.at)} · ${q.type === 'konzultacio' ? 'időpontot kér' : 'érdeklődés'}${q.day ? ` · ${dayHu(q.day)}` : ''}</span></header>
        <p><a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>${q.email ? ` · <a href="mailto:${esc(q.email)}">${esc(q.email)}</a>` : ''}</p>
        ${q.summary ? `<pre>${esc(q.summary)}</pre>` : ''}
        ${q.message ? `<p class="inq__msg">„${esc(q.message)}”</p>` : ''}
        ${q.lockedPrice ? `<p class="ok">Rögzített ajánlati ár: <b>${ft(q.lockedPrice)}</b> (${dayHu(q.lockedAt)}) – az aranyár változása nem érinti.${nowPrice && nowPrice !== q.lockedPrice ? ` A mai kalkulált ár: ${ft(nowPrice)}.` : ''}</p>`
          : nowPrice ? `<p>Becsült ár a küldéskor: ${ft(q.estimate)} · ma: <b>${ft(nowPrice)}</b></p>` : ''}
        <div class="inq__btns">
          ${q.status === 'uj' ? `<button class="abtn" data-st="visszahivva" data-id="${q.id}">Visszahívtam</button>` : ''}
          ${nowPrice && !q.lockedPrice ? `<button class="abtn abtn--gold" data-lock="${q.id}">Ajánlat elfogadva – ár rögzítése (${ft(nowPrice)})</button>` : ''}
          ${q.status !== 'lezarva' ? `<button class="abtn" data-st="lezarva" data-id="${q.id}">Lezárás</button>` : ''}
        </div></article>`;
    }).join('') : `<div class="note-card"><p>Még nincs érdeklődés.</p><p class="hint">Próbálja ki: a vásárlói nézetben nyisson meg egy gyűrűt, és nyomja meg az „Érdeklődés erről a gyűrűről” gombot.</p></div>`}`;
  el.addEventListener('click', (e) => {
    const s = e.target.closest('[data-st]'), l = e.target.closest('[data-lock]');
    if (s) { store.updateInquiry(s.dataset.id, { status: s.dataset.st }); inquiries(el); }
    if (l) {
      const q = S().inquiries.find((x) => x.id === l.dataset.lock);
      const p = store.product(q.productId);
      store.updateInquiry(q.id, { status: 'elfogadva', lockedPrice: priceProduct(p, q.config, S().materials, S().settings).final, lockedAt: new Date().toISOString() });
      toast('Az ajánlati ár rögzítve.'); inquiries(el);
    }
  });
}

/* ---------- 6. Árváltozási előzmények ---------- */
function history(el) {
  el = fresh(el);
  const st = S();
  const kind = { start: 'Kezdés', materials: 'Alapanyagár', settings: 'Árképlet', product: 'Gyűrű' };
  el.innerHTML = `<h1 class="adm__h1">Árváltozási előzmények</h1>
    <p class="adm__lead">Minden módosítás ide kerül: ki, mikor, mit változtatott. Egy alapanyagár-változás egy gombnyomással visszaállítható.</p>
    <ol class="hist">${st.history.map((h, i) => `<li>
      <div class="hist__when"><b>${dateHu(h.at)}</b><span>${esc(h.by)}</span>${h.validFrom && h.validFrom.slice(0, 10) !== h.at.slice(0, 10) ? `<span>érvényes: ${dayHu(h.validFrom)}</span>` : ''}</div>
      <div class="hist__what"><span class="badge">${kind[h.kind]}</span><p>${esc(h.title)}</p>
        ${h.count ? `<small>${h.count} gyűrű ára változott${h.total ? `, összesen ${h.total > 0 ? '+' : ''}${ft(h.total)}` : ''}</small>` : ''}</div>
      ${h.kind === 'materials' && h.before ? `<button class="abtn" data-rev="${h.id}">Visszaállítás az ez előtti árakra</button>` : ''}
    </li>`).join('')}</ol>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rev]');
    if (!b) return;
    const h = st.history.find((x) => x.id === b.dataset.rev);
    const d = diffPrices(st.products, st.materials, h.before, st.settings);
    modal(`<div class="form"><h2>Visszaállítás</h2><p>Visszaállítja a „${esc(h.title)}” előtti alapanyagárakat? <b>${d.count} gyűrű</b> ára változik.</p>
      <div class="impact__btns"><button class="abtn abtn--xl" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" data-ok>Visszaállítom</button></div></div>`,
      { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); store.revert(h.id); toast('A korábbi árak visszaálltak.'); history(el); } });
  });
}

/* ---------- 7. Beállítások ---------- */
function settings(el) {
  el = fresh(el);
  const st = S();
  const d = clone(st.settings);
  el.innerHTML = `<h1 class="adm__h1">Beállítások</h1>
    <section class="ebox"><h2>Kerekítés és védelem</h2><div class="egrid">
      <label class="efield"><span>Árak kerekítése felfelé</span><select class="input input--lg" data-s="roundTo">${[1, 100, 500, 1000, 5000].map((v) => `<option value="${v}" ${d.roundTo === v ? 'selected' : ''}>${v === 1 ? 'nincs kerekítés' : num(v) + ' Ft-ra'}</option>`).join('')}</select></label>
      <label class="efield"><span>Minimális árrés<small>alatta figyelmeztet</small></span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="minMarginPct" value="${d.minMarginPct}"><i>%</i></span></label>
      <label class="efield"><span>Nagy változás határa<small>e fölött külön megerősítés kell</small></span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="bigChangePct" value="${d.bigChangePct}"><i>%</i></span></label>
    </div></section>
    <section class="ebox"><h2>Bemutató</h2>
      <label class="confirm"><input type="checkbox" data-marks ${d.showDemoMarks ? 'checked' : ''}><span>„Demó” jelölések mutatása az árak mellett</span></label>
      <div class="edit__btns"><button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button></div>
    </section>
    <section class="ebox ebox--danger"><h2>Demóadatok visszaállítása</h2>
      <p>Minden árat, gyűrűt, előzményt és érdeklődést visszaállít a bemutató kezdőállapotára.</p>
      <button class="abtn abtn--xl" type="button" data-reset>Demóadatok visszaállítása</button>
    </section>
    <section class="ebox"><h2>Az éles rendszerben</h2>
      <p class="hint">Bejelentkezés és jogosultságok, szerveroldali adatbázis, minden ármódosítás szerveren naplózva, mentés és visszaállítás – ezek a következő fejlesztési szakasz részei, ebben a bemutatóban nem működnek.</p></section>`;
  el.addEventListener('input', (e) => { const k = e.target.dataset.s; if (k) { const v = parseNum(e.target.value); if (Number.isFinite(v)) d[k] = v; } if (e.target.matches('[data-marks]')) d.showDemoMarks = e.target.checked; });
  el.addEventListener('change', (e) => { if (e.target.dataset.s === 'roundTo') d.roundTo = Number(e.target.value); });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-save]')) { store.updateSettings(d, 'Beállítások módosítva'); toast('Beállítások mentve.'); }
    if (e.target.closest('[data-reset]')) resetDemo();
  });
}

export function resetDemo() {
  modal(`<div class="form"><h2>Demóadatok visszaállítása</h2><p>Minden módosítás törlődik, és a bemutató a kezdő demóárakkal indul újra.</p>
    <div class="impact__btns"><button class="abtn abtn--xl" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" data-ok>Visszaállítom</button></div></div>`,
    { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); store.reset(); toast('A demóadatok visszaálltak.'); window.dispatchEvent(new HashChangeEvent('hashchange')); } });
}
