/* Vásárlói felület: kezdőoldal, kollekció, termékoldal + konfigurátor, kapcsolat. */
import { store } from './store.js';
import { BUSINESS, COLORS, STYLES, FEATURED } from './data.js';
import { priceProduct, defaultConfig, ft, dec, diamond } from './engine.js';
import { $, $$, esc, productMedia, ringSVG, metalSwatch, animatePrice, modal, reveal, M, reduced } from './ui.js';

const S = () => store.get();
const fresh = (el) => { const n = el.cloneNode(false); el.replaceWith(n); return n; };
const price = (p, cfg) => priceProduct(p, cfg, S().materials, S().settings);
const demoMark = (txt = 'demó') => S().settings.showDemoMarks ? `<span class="demo-chip" title="Kitalált bemutató-alapanyagárakból számolva">${txt}</span>` : '';

const colorLabel = (c) => c === 'ketszinu' ? 'Fehér–sárga arany' : COLORS[c].label;
const karatLabel = (k) => k === 925 ? 'Ezüst 925' : `${k} karát (${k === 14 ? '585' : '750'})`;
const stamp = (k) => `<span class="stamp" aria-label="Fémjel ${k}">${k === 925 ? '925' : k === 18 ? '750' : '585'}</span>`;

/* ---------- Kártya ---------- */
function card(p, { karat } = {}) {
  const cfg = defaultConfig(p);
  if (karat && p.karats.includes(karat)) cfg.karat = karat;
  const r = price(p, cfg);
  const lc = S().lastChange;
  const old = lc && lc.old[p.id];
  const changed = old && old !== r.final && !karat && Date.now() - new Date(lc.at).getTime() < 1000 * 60 * 60 * 6;
  return `<article class="card" data-id="${p.id}">
    <a class="card__link" href="#/gyuru/${p.id}" aria-label="${esc(p.name)} – részletek">
      <div class="card__media">${productMedia(p)}${stamp(cfg.karat)}</div>
      <div class="card__body">
        <p class="card__code">${esc(p.code)}</p>
        <h3 class="card__name">${esc(p.name)}</h3>
        <p class="card__meta">${colorLabel(cfg.color)} · ${cfg.karat === 925 ? 'ezüst' : cfg.karat + 'K'}${p.rings[0].stones ? ' · gyémánttal' : ''}</p>
        <div class="card__price">
          <span class="card__label">Becsült indulóár ${demoMark()}</span>
          <strong class="price" data-price="${p.id}" data-value="${changed ? old : r.final}">${ft(changed ? old : r.final)}</strong>
          ${changed ? `<span class="card__was">korábban ${ft(old)}</span>` : ''}
        </div>
        <span class="btn-text">Részletek megtekintése</span>
      </div>
    </a>
  </article>`;
}

/** Frissült árak finom felszámolása a kártyákon (bemutató 7. lépés). */
function animateCards(root) {
  const lc = S().lastChange;
  if (!lc) return;
  $$('[data-price]', root).forEach((el) => {
    const p = store.product(el.dataset.price);
    const now = price(p).final;
    if (Number(el.dataset.value) !== now) {
      setTimeout(() => { animatePrice(el, now); el.closest('.card')?.classList.add('is-updated'); }, 450);
    }
  });
}

/* ---------- Kezdőoldal ---------- */
export function home(el) {
  el = fresh(el);
  const st = S();
  const hero = store.product('maz-79016-79017');
  const heroPrice = price(hero).final;
  const count = (fn) => st.products.filter((p) => p.real && fn(p)).length;
  const teaserIds = ['maz-81170-81171-y', 'maz-81184-81185-w', 'maz-81202-81203-wy'];

  el.innerHTML = `
  <section class="hero">
    <div class="wrap hero__grid">
      <div class="hero__text">
        <p class="eyebrow" data-hero>${stamp(14)}${stamp(18)}<span>Karikagyűrűk és leánykérő gyűrűk · Budapest</span></p>
        <h1 data-hero>Egy életre szóló választás.</h1>
        <p class="lead" data-hero>Karikagyűrűk sárga-, fehér- és rozéaranyból, akár saját terv alapján. Minden pár rendelésre, az Önök méretére készül – a végső formát személyesen, nyugodt körülmények között beszéljük meg.</p>
        <div class="hero__cta" data-hero>
          <a class="btn btn--dark" href="#/kollekcio">Fedezze fel kollekciónkat</a>
          <a class="btn btn--line" href="#/kapcsolat">Személyes konzultáció</a>
        </div>
        <p class="hero__note" data-hero>${esc(BUSINESS.hours)}</p>
      </div>
      <figure class="hero__stage">
        <div class="hero__ring">
          <svg class="hero__orbit" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="196" pathLength="1"/><circle class="hero__orbit2" cx="200" cy="200" r="172" pathLength="1"/></svg>
          <div class="hero__disc">${productMedia(hero, { eager: true })}</div>
        </div>
        <figcaption class="hero__cap">
          <a href="#/gyuru/${hero.id}"><span>${esc(hero.code)}</span><b>${esc(hero.name)}</b>
          <em>Becsült ár: <span class="price" data-hero-price data-value="${heroPrice}">${ft(heroPrice)}</span> ${demoMark()}</em></a>
        </figcaption>
      </figure>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <header class="sec__head" data-reveal>
        <p class="kicker">Kollekciók</p>
        <h2>Három aranyszín, egy közös mérce: hogy egy életen át jól essen viselni.</h2>
      </header>
      <div class="coll">
        ${collTile('feher', 'Fehérarany', 'Hűvös, tiszta fény – a leggyakrabban választott szín a gyémántok mellé.', count((p) => p.baseColor === 'feher'), store.product('maz-79014-w'), 'coll__a')}
        ${collTile('sarga', 'Sárgaarany', 'A klasszikus karikagyűrű színe, meleg tónussal és időtálló formákkal.', count((p) => p.baseColor === 'sarga'), store.product('maz-81161-81162-y'), 'coll__b')}
        ${collTile('ketszinu', 'Kétszínű arany', 'Fehér- és sárgaarany egy gyűrűben, finom határvonallal.', count((p) => p.baseColor === 'ketszinu'), store.product('maz-81200-81201-wy'), 'coll__c')}
        ${collTile('koves', 'Gyémánttal', 'Természetes gyémántok, egy kővel vagy körbe foglalva.', count((p) => !!p.rings.some((r) => r.stones)), store.product('maz-79010-w'), 'coll__d')}
        <a class="coll__rose" href="#/kollekcio?szin=rose" data-reveal>
          <div class="coll__rose-art">${productMedia(store.product('maz-79016-79017'))}</div>
          <div><p class="kicker">Rozéarany</p><p>Bármelyik modell elkészülhet rozéaranyból is – a konfigurátorban egy kattintással megnézheti az árát.</p></div>
          <span class="btn-text">Rozéarany árak</span>
        </a>
      </div>
    </div>
  </section>

  <section class="sec sec--paper">
    <div class="wrap">
      <header class="sec__head sec__head--row" data-reveal>
        <div><p class="kicker">Kiemelt modellek</p><h2>A kollekcióból válogattuk</h2></div>
        <a class="btn btn--line" href="#/kollekcio">Mind a ${st.products.filter((p) => p.real).length} modell</a>
      </header>
      <div class="grid" data-reveal>${FEATURED.map((id) => card(store.product(id))).join('')}</div>
    </div>
  </section>

  <section class="sec" id="egyedi">
    <div class="wrap">
      <header class="sec__head" data-reveal>
        <p class="kicker">Egyedi készítés</p>
        <h2>A rajztól a kész gyűrűig – négy nyugodt lépésben</h2>
        <p class="sec__lead">Meglévő modellt is átalakítunk, de saját elképzelés vagy egy fénykép alapján is elkészítjük a gyűrűt. A karikagyűrűk mellett platinából, palládiumból, titánból és acélból is dolgozunk.</p>
      </header>
      <ol class="steps">
        ${[
          ['Időpont', 'Telefonon vagy üzenetben egyeztetünk – akár munkaidő után vagy hétvégén is.'],
          ['Konzultáció', 'Felpróbálják a mintagyűrűket, megmérjük a pontos méretet, kiválasztják a színt, a szélességet és a felületet.'],
          ['Ajánlat és terv', 'Az aznapi alapanyagár alapján írásos ajánlatot kapnak; egyedi tervnél a rajzot is együtt véglegesítjük.'],
          ['Elkészítés', 'A gyűrűk rendelésre, az Önök méretére készülnek. Átvételkor még egyszer felpróbálják őket.'],
        ].map(([t, d], i) => `<li data-reveal="${i * 0.08}"><span class="steps__n">${['I', 'II', 'III', 'IV'][i]}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="sec sec--sand">
    <div class="wrap why">
      <div class="why__quote" data-reveal>
        <p class="kicker">Miért személyesen?</p>
        <h2>A karikagyűrűt nem a képernyőn hordják, hanem a kezükön.</h2>
      </div>
      <ul class="why__list">
        <li data-reveal><h3>A méret az ujjon dől el</h3><p>Egy széles gyűrű szorosabbnak érződik, mint egy keskeny, ugyanabban a méretben. A mintagyűrűkkel ezt pár perc alatt kipróbálják.</p></li>
        <li data-reveal=".08"><h3>Az arany színe a fényben más</h3><p>A fehér-, sárga- és rozéarany árnyalata bőrszínnel és nappali fényben mutatja meg igazán magát.</p></li>
        <li data-reveal=".16"><h3>Kettőjüknek egyszerre</h3><p>A pár két gyűrűje eltérő szélességgel, kővel vagy anélkül is összeillhet – ezt együtt könnyebb eldönteni.</p></li>
      </ul>
    </div>
  </section>

  <section class="sec" id="arkalkulator">
    <div class="wrap calc">
      <div class="calc__text" data-reveal>
        <p class="kicker">Árkalkulátor</p>
        <h2>Az ár azonnal követi, amit választ</h2>
        <p>Minden modellnél kiválaszthatja az arany színét és finomságát, a két gyűrű méretét, a köveket és a gravírozást – a becsült ár közben folyamatosan frissül. Az árak az aktuális alapanyagárból számolódnak, így mindig naprakész becslést lát.</p>
        <p class="fine">A kalkulátor tájékoztató árat mutat. A végleges ajánlat személyes egyeztetés során készül.</p>
      </div>
      <div class="calc__box" data-reveal=".1">
        <div class="calc__models" role="tablist" aria-label="Modell">${teaserIds.map((id, i) => `<button role="tab" aria-selected="${i === 0}" data-tid="${id}">${esc(store.product(id).code)}</button>`).join('')}</div>
        <div class="calc__media" data-tmedia></div>
        <div class="calc__row"><span>Finomság</span><div class="seg" data-tkarat><button data-k="14" aria-pressed="true">14K · 585</button><button data-k="18" aria-pressed="false">18K · 750</button></div></div>
        <div class="calc__row"><span>Szín</span><div class="swatches" data-tcolor></div></div>
        <div class="calc__price"><span>Becsült ár ${demoMark()}</span><strong class="price" data-tprice></strong></div>
        <a class="btn btn--dark btn--full" data-tlink href="#">Részletes konfigurátor</a>
      </div>
    </div>
  </section>

  ${contactBlock()}
  `;

  // Kalkulátor-előzetes
  const t = { id: teaserIds[0], karat: 14, color: null };
  const paint = () => {
    const p = store.product(t.id);
    const cfg = defaultConfig(p);
    cfg.karat = t.karat; cfg.color = t.color && p.colors.includes(t.color) ? t.color : p.baseColor;
    $('[data-tmedia]', el).innerHTML = `<div class="calc__ring">${ringSVG({ color: cfg.color, pair: p.kind === 'p', stones: p.rings[0].stones?.count || 0 })}</div><p class="calc__name">${esc(p.name)}</p>`;
    $('[data-tcolor]', el).innerHTML = p.colors.map((c) => `<button class="sw" style="--sw:${metalSwatch(c === 'ketszinu' ? 'feher' : c)}" aria-pressed="${c === cfg.color}" data-c="${c}" title="${colorLabel(c)}"><span class="sr">${colorLabel(c)}</span></button>`).join('');
    animatePrice($('[data-tprice]', el), price(p, cfg).final);
    $('[data-tlink]', el).href = `#/gyuru/${p.id}`;
  };
  el.addEventListener('click', (e) => {
    const m = e.target.closest('[data-tid]'), k = e.target.closest('[data-k]'), c = e.target.closest('[data-c]');
    if (m) { t.id = m.dataset.tid; t.color = null; $$('[data-tid]', el).forEach((b) => b.setAttribute('aria-selected', b === m)); paint(); }
    if (k) { t.karat = Number(k.dataset.k); $$('[data-k]', el).forEach((b) => b.setAttribute('aria-pressed', b === k)); paint(); }
    if (c) { t.color = c.dataset.c; paint(); }
  });
  paint();
  bindContact(el);
  heroIn(el);
  reveal(el);
  animateCards(el);
}

function collTile(key, title, text, n, p, cls) {
  const q = key === 'koves' ? 'ko=koves' : `szin=${key}`;
  return `<a class="coll__tile ${cls}" href="#/kollekcio?${q}" data-reveal>
    <div class="coll__media">${productMedia(p)}</div>
    <div class="coll__txt"><h3>${title}</h3><p>${text}</p><span class="coll__n">${n} modell</span></div>
  </a>`;
}

function heroIn(el) {
  const items = $$('[data-hero]', el);
  const orbit = $$('.hero__orbit circle', el);
  if (!M() || reduced()) return;
  M().animate(items, { opacity: [0, 1], y: [18, 0] }, { duration: 0.9, delay: M().stagger(0.09), ease: [0.22, 1, 0.36, 1] });
  M().animate($('.hero__disc', el), { opacity: [0, 1], scale: [0.96, 1] }, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
  orbit.forEach((c, i) => M().animate(c, { pathLength: [0, 1] }, { duration: 2.2, delay: 0.3 + i * 0.25, ease: [0.65, 0, 0.35, 1] }));
  M().animate($('.hero__cap', el), { opacity: [0, 1], x: [16, 0] }, { duration: 0.8, delay: 0.9 });
}

/* ---------- Kollekció ---------- */
const F = { szin: 'mind', karat: 14, ko: 'mind', stilus: 'mind', szel: 'mind', tipus: 'mind', min: '', max: '', rend: 'ajanlott' };

export function catalog(el, query) {
  el = fresh(el);
  if (query) {
    Object.assign(F, { szin: 'mind', ko: 'mind', stilus: 'mind', szel: 'mind', tipus: 'mind' });
    for (const [k, v] of query) if (k in F) F[k] = k === 'karat' ? Number(v) : v;
  }
  const all = S().products;
  const widths = [...new Set(all.flatMap((p) => p.widths))].sort((a, b) => a - b);
  const chip = (group, val, label) => `<button type="button" class="chip" data-f="${group}" data-v="${val}" aria-pressed="${String(F[group]) === String(val)}">${label}</button>`;

  el.innerHTML = `
  <section class="page-head">
    <div class="wrap">
      <p class="crumbs"><a href="#/">Kezdőlap</a> / Kollekció</p>
      <h1>Kollekció</h1>
      <p class="sec__lead">Minden modell rendelésre készül. A feltüntetett árak becsült indulóárak az alapméretre – a pontos ár a választott paraméterektől függ.</p>
    </div>
  </section>
  <section class="wrap shop">
    <button class="btn btn--line shop__open" type="button" data-open-filters>Szűrés és rendezés <span data-fcount></span></button>
    <aside class="filters" data-filters aria-label="Szűrők">
      <div class="filters__head"><h2>Szűrés</h2><button class="filters__close" type="button" data-close-filters aria-label="Szűrők bezárása">×</button></div>
      <fieldset><legend>Arany színe</legend><div class="chips">${chip('szin', 'mind', 'Mind')}${chip('szin', 'sarga', 'Sárga')}${chip('szin', 'feher', 'Fehér')}${chip('szin', 'rose', 'Rozé')}${chip('szin', 'ketszinu', 'Kétszínű')}${chip('szin', 'ezust', 'Ezüst')}</div></fieldset>
      <fieldset><legend>Finomság – ezzel számolt árak</legend><div class="chips">${chip('karat', 14, '14K · 585')}${chip('karat', 18, '18K · 750')}</div></fieldset>
      <fieldset><legend>Kövek</legend><div class="chips">${chip('ko', 'mind', 'Mind')}${chip('ko', 'nelkul', 'Kő nélkül')}${chip('ko', 'koves', 'Köves')}</div></fieldset>
      <fieldset><legend>Stílus</legend><div class="chips">${chip('stilus', 'mind', 'Mind')}${Object.entries(STYLES).map(([k, v]) => chip('stilus', k, v)).join('')}</div></fieldset>
      <fieldset><legend>Típus</legend><div class="chips">${chip('tipus', 'mind', 'Mind')}${chip('tipus', 'p', 'Gyűrűpár')}${chip('tipus', 's', 'Egy gyűrű')}</div></fieldset>
      <fieldset><legend>Szélesség</legend><div class="chips">${chip('szel', 'mind', 'Mind')}${widths.map((w) => chip('szel', w, dec(w) + ' mm')).join('')}</div></fieldset>
      <fieldset><legend>Árintervallum (Ft)</legend>
        <div class="range"><label><span>min.</span><input inputmode="numeric" data-fn="min" value="${esc(F.min)}" placeholder="0"></label><label><span>max.</span><input inputmode="numeric" data-fn="max" value="${esc(F.max)}" placeholder="nincs"></label></div>
      </fieldset>
      <button class="btn btn--dark btn--full filters__done" type="button" data-close-filters>Találatok mutatása</button>
    </aside>
    <div class="shop__main">
      <div class="shop__bar"><p data-count></p>
        <label class="select"><span>Rendezés</span><select data-sort>
          <option value="ajanlott">Ajánlott</option><option value="ar-fel">Ár szerint növekvő</option><option value="ar-le">Ár szerint csökkenő</option><option value="cikkszam">Cikkszám</option>
        </select></label></div>
      <div class="grid" data-results></div>
    </div>
  </section>`;

  $('[data-sort]', el).value = F.rend;
  const results = $('[data-results]', el);

  const paint = () => {
    const k = F.karat;
    let list = all.filter((p) => {
      if (F.szin !== 'mind') {
        if (F.szin === 'rose') { if (!p.colors.includes('rose')) return false; }
        else if (p.baseColor !== F.szin) return false;
      }
      const stones = p.rings.some((r) => r.stones);
      if (F.ko === 'koves' && !stones) return false;
      if (F.ko === 'nelkul' && stones && !p.stoneOptional) return false;
      if (F.stilus !== 'mind' && p.style !== F.stilus) return false;
      if (F.tipus !== 'mind' && p.kind !== F.tipus) return false;
      if (F.szel !== 'mind' && !p.widths.includes(Number(F.szel))) return false;
      return true;
    }).map((p) => {
      const cfg = defaultConfig(p);
      if (p.karats.includes(k)) cfg.karat = k;
      if (F.szin === 'rose' && p.colors.includes('rose')) cfg.color = 'rose';
      if (F.ko === 'nelkul') cfg.rings.forEach((r) => (r.stones = false));
      return { p, cfg, v: price(p, cfg).final };
    });
    const min = Number(String(F.min).replace(/\D/g, '')) || 0;
    const max = Number(String(F.max).replace(/\D/g, '')) || Infinity;
    list = list.filter((x) => x.v >= min && x.v <= max);
    if (F.rend === 'ar-fel') list.sort((a, b) => a.v - b.v);
    if (F.rend === 'ar-le') list.sort((a, b) => b.v - a.v);
    if (F.rend === 'cikkszam') list.sort((a, b) => a.p.code.localeCompare(b.p.code));
    $('[data-count]', el).textContent = `${list.length} modell`;
    const active = ['szin', 'ko', 'stilus', 'tipus', 'szel'].filter((g) => F[g] !== 'mind').length + (F.karat === 18 ? 1 : 0) + (min || max !== Infinity ? 1 : 0);
    $('[data-fcount]', el).textContent = active ? `(${active})` : '';
    results.innerHTML = list.length ? list.map(({ p, cfg }) => cardFor(p, cfg)).join('')
      : `<div class="empty"><p>Ezekkel a feltételekkel nincs modell.</p><button class="btn btn--line" type="button" data-clear>Szűrők törlése</button></div>`;
    animateCards(results);
    if (M() && !reduced()) M().animate($$('.card', results), { opacity: [0, 1], y: [12, 0] }, { duration: 0.5, delay: M().stagger(0.03) });
  };

  const cardFor = (p, cfg) => {
    const html = card(p, { karat: cfg.karat !== p.baseKarat ? cfg.karat : null });
    if (cfg.color === p.baseColor && cfg.rings.every((r, i) => r.stones === !!p.rings[i].stones)) return html;
    // Rozé vagy kő nélküli változat ára
    const v = price(p, cfg).final;
    return html.replace(/data-value="\d+">[^<]+</, `data-value="${v}">${ft(v)}<`).replace(`href="#/gyuru/${p.id}"`, `href="#/gyuru/${p.id}?szin=${cfg.color}"`);
  };

  el.addEventListener('click', (e) => {
    const c = e.target.closest('[data-f]');
    if (c) {
      F[c.dataset.f] = c.dataset.f === 'karat' ? Number(c.dataset.v) : c.dataset.v;
      $$(`[data-f="${c.dataset.f}"]`, el).forEach((b) => b.setAttribute('aria-pressed', b === c));
      paint();
    }
    if (e.target.closest('[data-clear]')) { Object.assign(F, { szin: 'mind', ko: 'mind', stilus: 'mind', szel: 'mind', tipus: 'mind', min: '', max: '', karat: 14 }); catalog(el); }
    if (e.target.closest('[data-open-filters]')) { $('[data-filters]', el).classList.add('is-open'); document.documentElement.classList.add('no-scroll'); }
    if (e.target.closest('[data-close-filters]')) { $('[data-filters]', el).classList.remove('is-open'); document.documentElement.classList.remove('no-scroll'); }
  });
  el.addEventListener('input', (e) => { const f = e.target.dataset.fn; if (f) { F[f] = e.target.value; paint(); } });
  $('[data-sort]', el).addEventListener('change', (e) => { F.rend = e.target.value; paint(); });
  paint();
}

/* ---------- Termékoldal + konfigurátor ---------- */
export function product(el, id, query) {
  el = fresh(el);
  const p = store.product(id);
  if (!p) { el.innerHTML = `<section class="wrap page-head"><h1>A gyűrű nem található</h1><p><a class="btn btn--line" href="#/kollekcio">Vissza a kollekcióhoz</a></p></section>`; return; }
  const cfg = defaultConfig(p);
  const qc = query?.get('szin');
  if (qc && p.colors.includes(qc)) cfg.color = qc;
  let tab = 0, view = 'foto';
  const pair = p.kind === 'p';

  el.innerHTML = `
  <section class="wrap pdp">
    <p class="crumbs"><a href="#/">Kezdőlap</a> / <a href="#/kollekcio">Kollekció</a> / ${esc(p.code)}</p>
    <div class="pdp__grid">
      <div class="pdp__gallery">
        <div class="pdp__stage" data-stage></div>
        <div class="pdp__thumbs" role="tablist" aria-label="Nézet">
          ${p.img ? `<button role="tab" data-view="foto" aria-selected="true"><span class="pdp__thumb">${productMedia(p)}</span>Fotó</button>` : ''}
          <button role="tab" data-view="szin" aria-selected="${!p.img}"><span class="pdp__thumb pdp__thumb--art" data-thumb-art></span>Színminta</button>
          ${p.img ? `<button role="tab" data-view="nagy" aria-selected="false"><span class="pdp__thumb pdp__thumb--zoom">${productMedia(p)}</span>Nagyítás</button>` : ''}
        </div>
        <p class="fine">${p.real ? 'A karikagyuru.com saját fotója. A színminta programból rajzolt előnézet a választott aranyszínről, nem a modell pontos képe.' : 'Bemutató-termék: rajzolt kép, nem a karikagyuru.com katalógusából.'}</p>
      </div>

      <div class="pdp__panel" data-panel>
        <p class="card__code">${esc(p.code)} ${p.real ? '' : demoMark('demótermék')}</p>
        <h1 class="pdp__title">${esc(p.name)}</h1>
        <div class="pdp__price">
          <span>Becsült ár a választott beállítással ${demoMark()}</span>
          <strong class="price price--big" data-cprice></strong>
          <small>Bruttó, ÁFA-val. Rendelésre készül.</small>
        </div>

        <div class="opt">
          <h2 class="opt__label">Arany színe <span data-colorname></span></h2>
          <div class="swatches swatches--lg" data-colors>${p.colors.map((c) => `<button class="sw" type="button" data-color="${c}" style="--sw:${metalSwatch(c === 'ketszinu' ? 'feher' : c)}" aria-pressed="false" title="${colorLabel(c)}"><span class="sr">${colorLabel(c)}</span></button>`).join('')}</div>
        </div>
        ${p.karats.length > 1 ? `<div class="opt"><h2 class="opt__label">Finomság</h2>
          <div class="seg seg--lg" data-karats>${p.karats.map((k) => `<button type="button" data-karat="${k}" aria-pressed="false">${k}K <small>${k === 14 ? '585' : '750'}</small></button>`).join('')}</div></div>` : ''}

        ${pair ? `<div class="tabs" role="tablist" aria-label="Gyűrű">${p.rings.map((r, i) => `<button type="button" role="tab" data-tab="${i}" aria-selected="${i === 0}">${esc(r.label)}</button>`).join('')}</div>` : ''}
        <div data-ringopts></div>

        <div class="summary" data-summary></div>
        <div class="pdp__ctas">
          <button class="btn btn--dark btn--full" type="button" data-inquire="erdeklodes">Érdeklődés erről a gyűrűről</button>
          <button class="btn btn--line btn--full" type="button" data-inquire="konzultacio">Személyes konzultációt kérek</button>
          <a class="pdp__phone" href="${BUSINESS.phoneHref}">vagy hívjon: <b>${BUSINESS.phone}</b></a>
        </div>
        <p class="notice">Ez tájékoztató ár. A végleges ajánlat személyes egyeztetés során készül, a pontos méret, a kész tömeg és az aznapi alapanyagár alapján.</p>
      </div>
    </div>

    <section class="specs" data-specs></section>
  </section>
  <div class="mbar" data-mbar>
    <div><span>Becsült ár</span><strong class="price" data-mprice></strong></div>
    <button class="btn btn--dark" type="button" data-inquire="erdeklodes">Érdeklődöm</button>
  </div>`;

  const sizes = (i) => { const r = p.rings[i]; const lo = r.refSize < 60 ? 44 : 54, hi = r.refSize < 60 ? 64 : 76; return [lo, hi]; };

  const paintInfo = (r) => {
    $('[data-summary]', el).innerHTML = `<h2 class="opt__label">Választott paraméterek</h2><dl>
      <div><dt>Anyag</dt><dd>${colorLabel(cfg.color)}, ${karatLabel(cfg.karat)}</dd></div>
      ${p.rings.map((rg, i) => `<div><dt>${esc(rg.label)}</dt><dd>${cfg.rings[i].size}-es méret · ${dec(cfg.rings[i].width)} mm${rg.stones ? (cfg.rings[i].stones ? ` · ${rg.stones.count} gyémánt` : ' · kő nélkül') : ''}${cfg.rings[i].engraving ? ` · gravír: „${esc(cfg.rings[i].engraving)}”` : ''}</dd></div>`).join('')}
      <div><dt>Becsült tömeg</dt><dd>${dec(r.grams)} g ${demoMark('demóadat')}</dd></div></dl>`;
    $('[data-specs]', el).innerHTML = specs(p, cfg, r);
  };

  const paint = (first) => {
    const r = price(p, cfg);
    // stage
    const art = ringSVG({ color: cfg.color, pair, stones: cfg.rings[0].stones && p.rings[0].stones ? p.rings[0].stones.count : 0, label: `${p.name} – ${colorLabel(cfg.color)} színminta` });
    const stage = $('[data-stage]', el);
    stage.className = 'pdp__stage pdp__stage--' + view;
    if (first || stage.dataset.v !== view + cfg.color + cfg.rings[0].stones) {
      stage.dataset.v = view + cfg.color + cfg.rings[0].stones;
      stage.innerHTML = view === 'szin' || !p.img
        ? `<div class="pdp__art">${art}<span class="media__tag">Színminta – ${colorLabel(cfg.color)}</span></div>`
        : productMedia(p, { eager: true });
      if (M() && !reduced() && !first) M().animate(stage.firstElementChild, { opacity: [0, 1] }, { duration: 0.4 });
    }
    const ta = $('[data-thumb-art]', el); if (ta) ta.innerHTML = art;
    $$('[data-view]', el).forEach((b) => b.setAttribute('aria-selected', b.dataset.view === view));
    // options
    $$('[data-color]', el).forEach((b) => b.setAttribute('aria-pressed', b.dataset.color === cfg.color));
    $('[data-colorname]', el).textContent = '– ' + colorLabel(cfg.color);
    $$('[data-karat]', el).forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.karat) === cfg.karat));
    $$('[data-tab]', el).forEach((b) => b.setAttribute('aria-selected', Number(b.dataset.tab) === tab));
    const ring = p.rings[tab], rc = cfg.rings[tab], [lo, hi] = sizes(tab);
    $('[data-ringopts]', el).innerHTML = `
      <div class="opt"><h2 class="opt__label">${pair ? esc(ring.label) + ' – ' : ''}Gyűrűméret <span class="hint">belső kerület, mm</span></h2>
        <div class="stepper"><button type="button" data-size="-1" aria-label="Kisebb méret">−</button><output data-sizeval>${rc.size}</output><button type="button" data-size="1" aria-label="Nagyobb méret">+</button>
        <span class="hint">${lo}–${hi} között · pontos méretet a konzultáción veszünk</span></div></div>
      ${p.widths.length > 1 ? `<div class="opt"><h2 class="opt__label">Szélesség</h2><div class="seg">${p.widths.map((w) => `<button type="button" data-width="${w}" aria-pressed="${w === rc.width}">${dec(w)} mm</button>`).join('')}</div></div>`
        : `<div class="opt opt--static"><h2 class="opt__label">Szélesség</h2><p>${dec(rc.width)} mm ${demoMark('demóadat')}</p></div>`}
      ${ring.stones ? `<div class="opt"><h2 class="opt__label">Kövek</h2>
        ${p.stoneOptional ? `<div class="seg"><button type="button" data-stones="0" aria-pressed="${!rc.stones}">Kő nélkül</button><button type="button" data-stones="1" aria-pressed="${rc.stones}">Gyémánttal</button></div>` : ''}
        <p class="hint">${ring.stones.count} db ${esc(diamond(S().materials, ring.stones.cat)?.name || '')}, ${esc(diamond(S().materials, ring.stones.cat)?.quality || '')} természetes gyémánt ${demoMark('demóadat')}</p></div>` : ''}
      <div class="opt"><h2 class="opt__label">Gravírozás <span class="hint">a gyűrű belsejébe, max. 24 karakter</span></h2>
        <input class="input" maxlength="24" data-engrave value="${esc(rc.engraving)}" placeholder="pl. 2027. 06. 12. · Anna & Bence" aria-label="Gravírozás szövege">
        ${rc.engraving ? `<p class="engrave-preview">„${esc(rc.engraving)}”</p>` : ''}</div>`;
    paintInfo(r);
    animatePrice($('[data-cprice]', el), r.final);
    animatePrice($('[data-mprice]', el), r.final);
  };

  el.addEventListener('click', (e) => {
    const t = e.target;
    const c = t.closest('[data-color]'), k = t.closest('[data-karat]'), tb = t.closest('[data-tab]'), sz = t.closest('[data-size]'),
          w = t.closest('[data-width]'), s = t.closest('[data-stones]'), v = t.closest('[data-view]'), q = t.closest('[data-inquire]');
    if (c) { cfg.color = c.dataset.color; if (view === 'foto' && p.img && cfg.color !== p.baseColor) view = 'szin'; }
    else if (k) cfg.karat = Number(k.dataset.karat);
    else if (tb) tab = Number(tb.dataset.tab);
    else if (sz) { const [lo, hi] = sizes(tab); cfg.rings[tab].size = Math.min(hi, Math.max(lo, cfg.rings[tab].size + Number(sz.dataset.size))); }
    else if (w) cfg.rings[tab].width = Number(w.dataset.width);
    else if (s) cfg.rings[tab].stones = s.dataset.stones === '1';
    else if (v) { if (v.dataset.view === 'nagy') { zoom(p); return; } view = v.dataset.view; }
    else if (q) { inquiry(p, cfg, q.dataset.inquire); return; }
    else if (t.closest('.pdp__stage--foto')) { zoom(p); return; }
    else return;
    paint();
  });
  el.addEventListener('input', (e) => {
    if (e.target.matches('[data-engrave]')) {
      cfg.rings[tab].engraving = e.target.value;
      const r = price(p, cfg);
      let pv = e.target.parentElement.querySelector('.engrave-preview');
      if (!pv) { pv = document.createElement('p'); pv.className = 'engrave-preview'; e.target.after(pv); }
      pv.textContent = e.target.value ? `„${e.target.value}”` : '';
      animatePrice($('[data-cprice]', el), r.final);
      animatePrice($('[data-mprice]', el), r.final);
      clearTimeout(e.target._t);
      e.target._t = setTimeout(() => paintInfo(price(p, cfg)), 200);
    }
  });
  paint(true);
  if (M() && !reduced()) M().animate([$('.pdp__gallery', el), $('.pdp__panel', el)], { opacity: [0, 1], y: [16, 0] }, { duration: 0.7, delay: M().stagger(0.1) });
}

function specs(p, cfg, r) {
  const rows = [
    ['Cikkszám', esc(p.code)],
    ['Megnevezés', esc(p.name) + (p.real ? ` <span class="hint">– ügyféllel egyeztetendő</span>` : '')],
    ['Típus', p.kind === 'p' ? 'Karikagyűrű pár (női és férfi gyűrű)' : 'Egy gyűrű'],
    ['Nemesfém', `${colorLabel(cfg.color)}, ${karatLabel(cfg.karat)}`],
    ['Stílus', STYLES[p.style] + ' ' + demoMark('demóadat')],
    ['Becsült tömeg', `${dec(r.grams)} g, ebből ${dec(r.pure)} g ${cfg.color === 'ezust' ? 'színezüst' : 'színarany'} ${demoMark('demóadat')}`],
    ['Elkészítés', 'Nincs készleten, rendelésre elkészítjük'],
  ];
  return `<h2>Részletek</h2><dl class="specs__dl">${rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`;
}

function zoom(p) {
  modal(`<div class="zoom"><img src="${esc(p.img)}" alt="${esc(p.name)}" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('p'),{textContent:'A fotó most nem érhető el.'}))"><p class="fine">${esc(p.code)} · ${esc(p.name)}</p></div>`, { label: 'Nagyított fotó', wide: true });
}

/* ---------- Érdeklődés / konzultáció ---------- */
export function configText(p, cfg) {
  const lines = [`${p.code} – ${p.name}`, `Anyag: ${colorLabel(cfg.color)}, ${karatLabel(cfg.karat)}`];
  p.rings.forEach((r, i) => {
    const c = cfg.rings[i];
    lines.push(`${r.label}: ${c.size}-es méret, ${dec(c.width)} mm${r.stones ? (c.stones ? `, ${r.stones.count} gyémánt` : ', kő nélkül') : ''}${c.engraving ? `, gravírozás: „${c.engraving}”` : ''}`);
  });
  return lines.join('\n');
}

export function inquiry(p, cfg, type = 'erdeklodes') {
  const r = p ? price(p, cfg) : null;
  const summary = p ? configText(p, cfg) : '';
  modal(`
    <form class="form" data-inq novalidate>
      <p class="kicker">${type === 'konzultacio' ? 'Személyes konzultáció' : 'Érdeklődés'}</p>
      <h2>${p ? 'Érdeklődés erről a gyűrűről' : 'Időpont-egyeztetés'}</h2>
      ${p ? `<div class="form__cfg"><pre>${esc(summary)}</pre><p>Becsült ár: <b>${ft(r.final)}</b> ${demoMark()}</p></div>` : ''}
      <div class="seg seg--lg" role="radiogroup" aria-label="Kérés típusa">
        <button type="button" data-type="erdeklodes" aria-pressed="${type === 'erdeklodes'}">Kérdésem van</button>
        <button type="button" data-type="konzultacio" aria-pressed="${type === 'konzultacio'}">Időpontot kérek</button>
      </div>
      <label class="field"><span>Név</span><input class="input" name="nev" autocomplete="name" required></label>
      <div class="field-row">
        <label class="field"><span>Telefonszám</span><input class="input" name="tel" type="tel" autocomplete="tel" required></label>
        <label class="field"><span>E-mail <i>(nem kötelező)</i></span><input class="input" name="email" type="email" autocomplete="email"></label>
      </div>
      <label class="field" data-datefield ${type === 'konzultacio' ? '' : 'hidden'}><span>Melyik nap lenne jó?</span><input class="input" name="nap" type="date"></label>
      <label class="field"><span>Üzenet</span><textarea class="input" name="uzenet" rows="3" placeholder="Pl. az esküvő időpontja, kérdés a méretről vagy egyedi tervről"></textarea></label>
      <p class="form__err" data-err hidden>Kérjük, adja meg a nevét és a telefonszámát.</p>
      <button class="btn btn--dark btn--full" type="submit">Elküldöm</button>
      <p class="fine">Bemutató: az üzenet nem kerül elküldésre, csak a bemutató adminfelületének „Érdeklődések” menüjében jelenik meg.</p>
    </form>`, {
    label: 'Érdeklődés',
    onMount(box, close) {
      const f = $('[data-inq]', box);
      let t = type;
      f.addEventListener('click', (e) => {
        const b = e.target.closest('[data-type]');
        if (b) { t = b.dataset.type; $$('[data-type]', f).forEach((x) => x.setAttribute('aria-pressed', x === b)); $('[data-datefield]', f).hidden = t !== 'konzultacio'; }
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(f));
        if (!d.nev.trim() || !d.tel.trim()) { $('[data-err]', f).hidden = false; return; }
        store.addInquiry({ type: t, name: d.nev, phone: d.tel, email: d.email, day: d.nap, message: d.uzenet,
          productId: p?.id || null, code: p?.code || null, config: p ? JSON.parse(JSON.stringify(cfg)) : null, summary, estimate: r?.final || null });
        box.innerHTML = `<div class="form form--done"><p class="kicker">Köszönjük</p><h2>Megkaptuk – hamarosan visszahívjuk.</h2>
          <p>Bemutató módban az üzenet nem került elküldésre. Az adminfelület „Érdeklődések” menüjében most már látható, a kiválasztott cikkszámmal és konfigurációval együtt.</p>
          <button class="btn btn--line" type="button" data-close>Rendben</button></div>`;
      });
    },
  });
}

/* ---------- Kapcsolat ---------- */
function contactBlock() {
  return `<section class="sec sec--ink" id="kapcsolat">
    <div class="wrap contact">
      <div data-reveal>
        <p class="kicker">Kapcsolat és időpont</p>
        <h2>Jöjjenek el, és próbálják fel nyugodtan.</h2>
        <p>${esc(BUSINESS.hours)}</p>
        <dl class="contact__dl">
          <div><dt>Telefon</dt><dd><a href="${BUSINESS.phoneHref}">${BUSINESS.phone}</a></dd></div>
          <div><dt>E-mail</dt><dd><a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a></dd></div>
          <div><dt>Cím</dt><dd><a href="${BUSINESS.map}" target="_blank" rel="noopener">${esc(BUSINESS.address)}</a></dd></div>
        </dl>
      </div>
      <div class="contact__card" data-reveal=".1">
        <h3>Időpontot kérek</h3>
        <p>Hagyja meg a nevét és a telefonszámát, és visszahívjuk egy kényelmes időpont miatt.</p>
        <button class="btn btn--gold btn--full" type="button" data-book>Időpont-egyeztetés</button>
        <a class="btn btn--ghost btn--full" href="${BUSINESS.phoneHref}">Hívás: ${BUSINESS.phone}</a>
      </div>
    </div>
  </section>`;
}
function bindContact(el) { el.addEventListener('click', (e) => { if (e.target.closest('[data-book]')) inquiry(null, null, 'konzultacio'); }); }

export function contact(el) {
  el = fresh(el);
  el.innerHTML = `<section class="page-head"><div class="wrap"><p class="crumbs"><a href="#/">Kezdőlap</a> / Kapcsolat</p><h1>Személyes konzultáció</h1>
    <p class="sec__lead">A gyűrűválasztás nálunk beszélgetéssel kezdődik: felpróbálják a mintagyűrűket, megmérjük a méretet, és megbeszéljük, mitől lesz a sajátjuk.</p></div></section>${contactBlock()}`;
  bindContact(el);
  reveal(el);
}
