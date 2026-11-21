/* Vásárlói felület: kezdőoldal, kollekció, termékoldal + konfigurátor, kapcsolat. */
import { store } from './store.js';
import { BUSINESS, COLORS, STYLES, FEATURED, BICOLOR, TERMS, CURRENT_SITE } from './data.js';
import { priceProduct, normalizeConfig, optionValues, optionReason, sizeRange, allowedCats, sizeSfx, ctFmt, defaultConfig, ft, num, dec, diamond, ringSplit, encodeCfg, decodeCfg, METALS, METAL_ORDER, isGold } from './engine.js';
import { api } from './api.js';
import { $, $$, esc, productMedia, ringSketch, hasPhoto, metalSwatch, animatePrice, modal, reveal, toast, M, reduced } from './ui.js';

const S = () => store.get();
const fresh = (el) => { const n = el.cloneNode(false); el.replaceWith(n); return n; };
const price = (p, cfg) => priceProduct(p, cfg, S().materials, S().settings);
/** Visszajelzés: szerver módban „megérkezett”, helyi módban az, ami igaz. */
const sentNote = (server, local) => (api.mode === 'server' && api.online ? server : local);
const demoMark = (txt = 'demó') => S().settings.showDemoMarks ? `<span class="demo-chip" title="Kitalált bemutató-alapanyagárakból számolva">${txt}</span>` : '';

const colorLabel = (c) => COLORS[c]?.label || c;
const metalLabel = (cfg) => (isGold(cfg.metal) && cfg.color ? `${colorLabel(cfg.color)}, ` : '') + `${METALS[cfg.metal].label} (${METALS[cfg.metal].stamp})`;
const metalShort = (cfg) => (isGold(cfg.metal) && cfg.color ? `${colorLabel(cfg.color)} · ` : '') + METALS[cfg.metal].short;
const stamp = (m) => `<span class="stamp" aria-label="Fémjel ${METALS[m].stamp}">${METALS[m].stamp}</span>`;
const hasStones = (p) => p.rings.some((r) => r.stoneRule);
const canBePlain = (p) => p.rings.every((r) => !r.stoneRule || r.stoneRule.allowNone);
/** Megjelenik-e a termék ezen az oldalon (admin: látható + ehhez a domainhez rendelve + van fotó). */
export const listed = (p) => p.visible !== false && (!p.sites || p.sites.includes(CURRENT_SITE)) && (hasPhoto(p) || (p.added && !p.img));   // adminban felvett gyűrű kép nélkül is megjelenik („Fotó hamarosan”)

/* ---------- Kártya ---------- */
function card(p, { metal } = {}) {
  const cfg = defaultConfig(p);
  if (metal && p.metals.includes(metal)) { cfg.metal = metal; if (!isGold(metal)) cfg.color = null; }
  if (p.priceOnRequest) return cardOnRequest(p);
  const r = price(p, cfg);
  const lc = S().lastChange;
  const old = lc && lc.old[p.id];
  const changed = old && r.final && old !== r.final && !metal && Date.now() - new Date(lc.at).getTime() < 1000 * 60 * 60 * 6;
  return `<article class="card" data-id="${p.id}">
    <a class="card__link" href="#/gyuru/${p.id}" aria-label="${esc(p.name)} – részletek">
      <div class="card__media">${productMedia(p)}${stamp(cfg.metal)}</div>
      <div class="card__body">
        <p class="card__code">${esc(p.code)}</p>
        <h3 class="card__name">${esc(p.name)}</h3>
        <p class="card__meta">${metalShort(cfg)}${hasStones(p) ? ' · gyémánttal' : ''}</p>
        <div class="card__price">
          <span class="card__label">Becsült indulóár ${demoMark()}</span>
          ${r.final === null ? '<strong class="price price--req">egyedi ajánlat</strong>' : `<strong class="price" data-price="${p.id}" data-value="${changed ? old : r.final}">${ft(changed ? old : r.final)}</strong>`}
          ${changed ? `<span class="card__was">korábban ${ft(old)}</span>` : ''}
        </div>
        <span class="btn-text">Részletek</span>
      </div>
    </a>
  </article>`;
}

function cardOnRequest(p) {
  return `<article class="card" data-id="${p.id}">
    <a class="card__link" href="#/gyuru/${p.id}" aria-label="${esc(p.name)} – részletek">
      <div class="card__media">${productMedia(p)}</div>
      <div class="card__body">
        <p class="card__code">${esc(p.code)}</p>
        <h3 class="card__name">${esc(p.name)}</h3>
        <p class="card__meta">${p.unknownColor ? 'Szín és anyag egyeztetés alapján' : colorLabel(p.baseColor)}</p>
        <div class="card__price"><span class="card__label">Ár</span><strong class="price price--req">egyeztetés alapján</strong></div>
        <span class="btn-text">Részletek</span>
      </div>
    </a>
  </article>`;
}

/** Frissült árak finom felszámolása a kártyákon. */
function animateCards(root) {
  const lc = S().lastChange;
  if (!lc) return;
  $$('[data-price]', root).forEach((el) => {
    const p = store.product(el.dataset.price);
    if (!p || p.priceOnRequest) return;
    const now = price(p).final;
    if (now !== null && Number(el.dataset.value) !== now) {
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
  const teaserIds = ['maz-81170-81171-y', 'maz-81184-81185-w', 'maz-81202-81203-wy', 'maz-79016-79017', 'maz-81163-81164-y', 'maz-79014-w'].filter((id) => store.product(id));
  const shown = st.products.filter(listed);
  const localPick = (fn) => shown.find((p) => !/^https?:/.test(p.img) && fn(p)) || shown.find(fn);

  // „A kevesebb is lehet pont tökéletes”: ugyanaz a modell három valóban elkészíthető változatban (élő árak)
  const lp = store.product('maz-81184-81185-w');
  const lrule = lp && lp.rings[0].stoneRule;
  const less = [];
  if (lp && lrule && lrule.mode === 'free' && lrule.allowNone && !lp.priceOnRequest) {
    const mk = (title, text, fn) => { const c = defaultConfig(lp); fn(c); const r = price(lp, c); if (r.final !== null) less.push({ title, text, v: r.final, href: `#/gyuru/${lp.id}?k=${encodeCfg(r.cfg)}` }); };
    mk('Kő nélkül', 'Tiszta forma, semmi más.', (c) => (c.rings[0].stones = null));
    mk('Egy kővel', 'Egy apró természetes gyémánt.', (c) => (c.rings[0].stones = { count: 1, cat: lrule.defCat }));
    mk(`${lrule.def} kővel`, 'Ahogy a fotón látod.', () => {});
  }
  const pairs = shown.filter((p) => p.kind === 'p').map((p) => price(p).final).filter((v) => v);
  const fromPrice = pairs.length ? Math.min(...pairs) : null;

  // Inspiráció: a katalógus valódi fotói, irány szerint (nem kitalált egyedi megrendelések)
  const insp = [
    ['Körbekövezve', 'Gyémántok a gyűrű teljes kerületén.', localPick((p) => p.rings.some((r) => r.stoneRule?.mode === 'perSize'))],
    ['Több kő, sorban', 'Kötött sorban foglalt kövek.', localPick((p) => p.rings.some((r) => r.stoneRule?.mode === 'fixed'))],
    ['Két szín egy gyűrűben', 'Fehér és sárga, vagy rozéval.', localPick((p) => !!BICOLOR[p.baseColor])],
    ['Megmunkált felület', 'Matt, csiszolt, mintás.', localPick((p) => p.style === 'modern' && !hasStones(p))],
  ].filter((x) => x[2]);

  el.innerHTML = `
  <section class="hero hero--v3">
    <div class="wrap hero__grid">
      <div class="hero__text">
        <p class="eyebrow" data-hero><span>Karikagyűrűk Budapestről · ötvössel együtt tervezve</span></p>
        <h1 data-hero>Nem kell beérned azzal, ami a vitrinben van.</h1>
        <p class="lead" data-hero>Válassz egy modellt, alakítsd a saját ízlésedre, vagy tervezzünk együtt valami teljesen újat. A gyűrűdnek nem kell hasonlítania senki máséra.</p>
        <div class="hero__cta" data-hero>
          <a class="btn btn--dark" href="#/kollekcio">Alakítsd a sajátodra</a>
          <a class="btn btn--line" href="#/sajat">Van egy saját ötletem</a>
        </div>
        <p class="hero__note" data-hero>Egy ötvössel ülsz le, aki harmincvalahány éve csinálja. Addig alakítjátok, amíg ki nem találjátok, milyen legyen.</p>
      </div>
      <figure class="hero__stage hero__stage--photo">
        <a class="hero__photo" href="#/gyuru/${hero.id}" aria-label="${esc(hero.name)} megnyitása">${productMedia(hero, { eager: true, large: true })}</a>
        <figcaption class="hero__cap">
          <a href="#/gyuru/${hero.id}"><span>${esc(hero.code)}</span><b>${esc(hero.name)}</b>
          <em>Így: <span class="price" data-hero-price data-value="${heroPrice}">${ft(heroPrice)}</span> ${demoMark()} – innen alakítható</em></a>
        </figcaption>
      </figure>
    </div>
    <div class="wrap"><ul class="hero__facts" aria-label="Röviden">
      <li><b>Rendelésre készül</b><span>a te méretedre</span></li>
      <li><b>Természetes gyémánt</b><span>csak valódi kő</span></li>
      <li><b>Ötvössel tervezed</b><span>személyes konzultáció</span></li>
      <li><b>Budapest, VIII.</b><span>hétvégén is, előre egyeztetve</span></li>
    </ul></div>
  </section>

  <section class="sec paths-sec" id="utak">
    <div class="wrap">
      <div class="paths">
        <a class="path path--a" href="#/kollekcio" data-reveal data-path="a">
          <span class="path__tag">1. út</span>
          <h2>Alakítsd a sajátodra</h2>
          <p>Kiválasztasz egy gyűrűt, és beállítod rajta, amit az a modell enged.</p>
          <ul><li>anyag és szín</li><li>női és férfi méret külön</li><li>természetes gyémánt: mennyi és mekkora</li><li>gravírozás</li><li>ami ezen túl van, azt külön megbeszéljük</li></ul>
          <span class="path__go">Megnézem a gyűrűket <i aria-hidden="true">→</i></span>
        </a>
        <a class="path path--b" href="#/sajat" data-reveal=".08" data-path="b">
          <span class="path__tag">2. út</span>
          <h2>Saját elképzelés alapján</h2>
          <p>Van egy ötleted, egy rajzod vagy egy fotód? Abból indulunk ki.</p>
          <ul><li>leírod, mit szeretnél</li><li>mutathatsz képet vagy rajzot</li><li>megbeszéljük, hogyan készíthető el</li><li>az árat személyesen mondjuk meg</li></ul>
          <span class="path__go">Elmondom az ötletem <i aria-hidden="true">→</i></span>
        </a>
      </div>
      <p class="paths__note" data-reveal>Bármelyiket választod, a végén személyesen ülsz le egy tapasztalt ötvössel. Ő mondja meg, mi készíthető el, és hogyan.</p>
    </div>
  </section>

  <section class="sec sec--paper">
    <div class="wrap">
      <header class="sec__head sec__head--row" data-reveal>
        <div><h2>Innen el lehet indulni</h2><p class="sec__lead">Kész modellek. Hogy melyiken mit lehet változtatni, az a gyűrű oldalán látszik.</p></div>
        <a class="btn btn--line" href="#/kollekcio">Mind a ${shown.length} gyűrű</a>
      </header>
      <div class="grid grid--dense grid--featured" data-reveal>${FEATURED.map((id) => store.product(id)).filter((p) => p && listed(p)).map((p) => card(p)).join('')}</div>
    </div>
  </section>

  <section class="sec" id="arkalkulator">
    <div class="wrap calc">
      <div class="calc__text" data-reveal>
        <h2>Próbáld ki, mennyi lenne</h2>
        <p>Válassz modellt, anyagot és színt – az ár azonnal változik. A gyűrű oldalán a méretet, a köveket és a gravírozást is beállíthatod. Az arany színe nem változtat az árat.</p>
        <p class="fine">Tájékoztató ár. A véglegeset személyesen mondjuk meg.</p>
      </div>
      <div class="calc__box" data-reveal=".1">
        <p class="calc__step"><span>1</span>Válassz modellt</p>
        <div class="calc__models" role="tablist" aria-label="Modell">${teaserIds.map((id, i) => { const tp = store.product(id); return `<button role="tab" aria-selected="${i === 0}" data-tid="${id}" aria-label="${esc(tp.code)}"><span class="calc__thumb">${productMedia(tp)}</span><small>${esc(tp.code)}</small></button>`; }).join('')}</div>
        <div class="calc__media" data-tmedia></div>
        <p class="calc__step"><span>2</span>Állítsd be</p>
        <div class="calc__row"><span>Anyag</span><div class="seg seg--wrap" data-tmetal></div></div>
        <div class="calc__row" data-tcolorrow><span>Szín</span><div class="swatches" data-tcolor></div></div>
        <div class="calc__row" data-tstonerow hidden><span>Kövek</span><div class="seg" data-tstones><button data-st="1" aria-pressed="true">Gyémánttal</button><button data-st="0" aria-pressed="false">Kő nélkül</button></div></div>
        <div class="calc__price"><span>Becsült ár ${demoMark()}</span><strong class="price" data-tprice></strong></div>
        <a class="btn btn--dark btn--full" data-tlink href="#">Tovább: méret, kövek, gravírozás</a>
      </div>
    </div>
  </section>

  ${less.length === 3 ? `<section class="sec sec--sand" id="kevesebb">
    <div class="wrap lessis">
      <div class="lessis__txt" data-reveal>
        <h2>A kevesebb is lehet pont tökéletes.</h2>
        <p>Egy gyűrű nem attól lesz a tiéd, hogy mennyi kő van benne. Ugyanaz a modell kő nélkül, egy kővel vagy többel is jó döntés – az számít, melyiket hordanád szívesen minden nap.</p>
        ${fromPrice ? `<p class="lessis__from">Gyűrűpár most <b>${ft(fromPrice)}</b>-tól ${demoMark()}</p>` : ''}
      </div>
      <div class="lessis__cards" data-reveal=".08">
        <div class="lessis__model"><div class="lessis__img">${productMedia(lp)}</div><div><b>${esc(lp.code)}</b><small>ugyanaz a pár, három változatban</small></div></div>
        ${less.map((x) => `<a class="lesscard" href="${x.href}"><span><b>${x.title}</b><small>${x.text}</small></span><strong>${ft(x.v)}</strong></a>`).join('')}
        <p class="fine">Csak olyan változat szerepel, ami ebből a modellből valóban elkészíthető. ${demoMark('demó kőszabály')}</p>
      </div>
    </div>
  </section>` : ''}

  ${insp.length ? `<section class="sec" id="inspiracio">
    <div class="wrap">
      <header class="sec__head" data-reveal>
        <h2>Merre lehet elvinni egy gyűrűt?</h2>
        <p class="sec__lead">Néhány irány ötletnek. Ha egyik sem az, amit keresel, az nem baj – azt találjuk ki együtt. Van olyan darab, amit kétszer ugyanúgy nem is lehet elkészíteni.</p>
      </header>
      <div class="insp">
        ${insp.map(([t, d, p], i) => `<a class="insp__tile" href="#/gyuru/${p.id}" data-reveal="${i * 0.06}"><div class="insp__media">${productMedia(p)}</div><div class="insp__txt"><h3>${t}</h3><p>${d}</p><span class="btn-text">Ebből indulnék ki</span></div></a>`).join('')}
        <a class="insp__own" href="#/sajat" data-reveal=".24"><h3>Egészen más jár a fejedben?</h3><p>Különleges foglalás, szokatlan forma, saját minta. Mondd el – megnézzük, megvalósítható-e.</p><span class="btn btn--dark">Van egy saját ötletem</span></a>
      </div>
      <div class="made" data-reveal>
        <h3>Készült már ilyen is</h3>
        <ul>
          <li><b>Kétsoros, körbekövezett gyűrű</b> – a kövek úgy ülnek, hogy végigsimítva szinte nem érezni őket.</li>
          <li><b>Három karikából álló gyűrű</b> – két szín, a karikák között átlátszik az ujj.</li>
          <li><b>Kalapált, reszelt felület</b> – ebből nincs két egyforma, a pár két gyűrűje sem teljesen azonos.</li>
          <li><b>Háromszög alakú kő</b> gyűrűbe foglalva.</li>
        </ul>
        <p class="fine">Ezekről még nincs fotó az oldalon. ${S().settings.showDemoMarks ? '<span class="demo-chip">fotók és pontos leírás: az ötvöstől várjuk</span>' : ''}</p>
      </div>
      <p class="fine insp__note">A képek a katalógus saját fotói. ${S().settings.showDemoMarks ? '<span class="demo-chip">korábbi egyedi munkák fotói: az ügyféltől várjuk</span>' : ''}</p>
    </div>
  </section>` : ''}

  <section class="sec sec--ink otvos" id="otvos">
    <div class="wrap otvos__grid">
      <div class="otvos__lead" data-reveal>
        <h2>Akivel a gyűrűdet kitalálod</h2>
        <p>Nem eladóval beszélsz, hanem ötvössel, aki harmincvalahány éve csinálja. Leül veled, és addig alakítjátok, amíg ki nem találjátok, milyen legyen. Ő felel azért, ami elkészül – ha egy munkához az kell, szakmai kollégát is bevon.</p>
        <p>Nála lehet kísérletezni. Szokatlan ötletre is kapható, és megpróbálja megcsinálni. Ha valami nem működne vagy csúnya lenne, azt előre megmondja.</p>
        <a class="btn btn--gold" href="#/kapcsolat">Időpontot kérek</a>
        ${S().settings.showDemoMarks ? '<p class="fine"><span class="demo-chip">portré és műhelyfotó: az ügyféltől várjuk</span></p>' : ''}
      </div>
      <ul class="otvos__list">
        <li data-reveal><h3>Kéz és eszterga</h3><p>A gyűrű kézzel indul: nyújtás, hajlítás, forrasztás. A pontos formát eszterga adja, a végső felületet megint a kéz.</p></li>
        <li data-reveal=".06"><h3>Közösen döntötök</h3><p>Felpróbálod a mintagyűrűket, megnézed a színeket a saját kezeden, és ott helyben alakul a terv.</p></li>
        <li data-reveal=".12"><h3>Platina, palládium, titán</h3><p>Ezekkel kevés műhely dolgozik – itt igen. Fontos tudni: platinából és palládiumból csak fehér gyűrű készül.</p></li>
        <li data-reveal=".18"><h3>Csak természetes gyémánt</h3><p>Ha kő kerül a gyűrűbe, az valódi, természetes gyémánt.</p></li>
      </ul>
    </div>
  </section>

  <section class="sec" id="egyedi">
    <div class="wrap">
      <header class="sec__head" data-reveal>
        <h2>Így megy</h2>
        <p class="sec__lead">Online kitalálod, személyesen véglegesítjük. Fizetni és rendelni itt nem lehet – az a műhelyben történik.</p>
      </header>
      <ol class="steps">
        ${[
          ['Kitalálod', 'Összeállítod a gyűrűt itt az oldalon, vagy leírod a saját ötleted. Elküldöd, mi visszahívunk.'],
          ['Találkozunk', 'Felpróbálod a mintagyűrűket, megmérjük az ujjad, megbeszéljük a részleteket.'],
          ['Megkapod az árat', 'Írásos ajánlat az aznapi nemesfémárral. Előleg: az ár fele.'],
          ['Elkészül', 'Szólunk, ha kész. Átvételkor felpróbálod, és kifizeted a maradékot.'],
        ].map(([t, d], i) => `<li data-reveal="${i * 0.08}"><span class="steps__n">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="sec sec--paper" id="rendeles">
    <div class="wrap">
      <header class="sec__head" data-reveal>
        <h2>Rendelés, előleg, garancia</h2>
        <p class="sec__lead">Az ÁSZF lényege röviden.</p>
      </header>
      <ol class="terms">${TERMS.map(([t, d], i) => `<li data-reveal="${(i % 3) * 0.06}"><span class="terms__n">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    </div>
  </section>

  ${contactBlock()}
  `;

  // Kalkulátor-előzetes
  const t = { id: teaserIds[0], metal: 'au14', color: null, stones: true };
  const TM = ['au14', 'au18', 'pt'];
  const paint = () => {
    const p = store.product(t.id);
    const cfg = defaultConfig(p);
    if (p.metals.includes(t.metal)) cfg.metal = t.metal; else t.metal = cfg.metal;
    cfg.color = isGold(cfg.metal) ? (t.color && p.colors.includes(t.color) ? t.color : p.baseColor) : null;
    const plainOk = hasStones(p) && canBePlain(p);
    if (plainOk && !t.stones) cfg.rings.forEach((r) => (r.stones = null));
    $('[data-tstonerow]', el).hidden = !plainOk;
    $('[data-tcolorrow]', el).hidden = !isGold(cfg.metal) || p.colors.length < 2;
    $('[data-tmetal]', el).innerHTML = TM.filter((m) => p.metals.includes(m)).map((m) => `<button data-m="${m}" aria-pressed="${m === cfg.metal}">${METALS[m].short}</button>`).join('');
    $$('[data-st]', el).forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.st === '1') === t.stones)));
    $('[data-tmedia]', el).innerHTML = `<div class="calc__ring calc__ring--photo">${productMedia(p)}</div><p class="calc__name">${esc(p.name)}</p>${!cfg.color || cfg.color === p.baseColor ? '' : `<p class="colornote"><span class="sw sw--sm" style="--sw:${metalSwatch(cfg.color)}"></span>A fotón ${colorLabel(p.baseColor).toLowerCase()} – ${colorLabel(cfg.color).toLowerCase()} színben készül el.</p>`}`;
    $('[data-tcolor]', el).innerHTML = p.colors.map((c) => `<button class="sw" style="--sw:${metalSwatch(c)}" aria-pressed="${c === cfg.color}" data-c="${c}" title="${colorLabel(c)}"><span class="sr">${colorLabel(c)}</span></button>`).join('');
    animatePrice($('[data-tprice]', el), price(p, cfg).final);
    const def = JSON.stringify(cfg) === JSON.stringify(defaultConfig(p));
    $('[data-tlink]', el).href = `#/gyuru/${p.id}${def ? '' : '?k=' + encodeCfg(cfg)}`;
  };
  el.addEventListener('click', (e) => {
    const m = e.target.closest('[data-tid]'), k = e.target.closest('[data-m]'), c = e.target.closest('[data-c]');
    if (m) { t.id = m.dataset.tid; t.color = null; $$('[data-tid]', el).forEach((b) => b.setAttribute('aria-selected', b === m)); paint(); }
    if (k && !k.disabled) { t.metal = k.dataset.m; paint(); }
    if (c) { t.color = c.dataset.c; paint(); }
    const sb = e.target.closest('[data-st]');
    if (sb) { t.stones = sb.dataset.st === '1'; paint(); }
  });
  if (teaserIds.length) paint();
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
  if (!M() || reduced()) return;
  M().animate(items, { opacity: [0, 1], y: [18, 0] }, { duration: 0.9, delay: M().stagger(0.09), ease: [0.22, 1, 0.36, 1] });
  // A fotó lassan „kitisztul”: enyhe nagyításból a helyére, a felirat utána csúszik be
  const ph = $('.hero__photo img', el), cap = $('.hero__cap', el), facts = $$('.hero__facts li', el);
  if (ph) M().animate(ph, { opacity: [0, 1], scale: [1.06, 1] }, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
  if (cap) M().animate(cap, { opacity: [0, 1], y: [12, 0] }, { duration: 0.8, delay: 0.7 });
  if (facts.length) M().animate(facts, { opacity: [0, 1], y: [10, 0] }, { duration: 0.7, delay: M().stagger(0.07, { startDelay: 0.5 }) });
}

/* ---------- Kollekció ---------- */
const F = { szin: 'mind', anyag: 'au14', ko: 'mind', stilus: 'mind', szel: 'mind', tipus: 'mind', min: '', max: '', rend: 'ajanlott', q: '' };

export function catalog(el, query) {
  el = fresh(el);
  if (query) {
    Object.assign(F, { szin: 'mind', ko: 'mind', stilus: 'mind', szel: 'mind', tipus: 'mind' });
    for (const [k, v] of query) if (k in F) F[k] = v;
  }
  const all = S().products;
  const widths = [...new Set(all.flatMap((p) => p.widths))].sort((a, b) => a - b);
  const chip = (group, val, label) => `<button type="button" class="chip" data-f="${group}" data-v="${val}" aria-pressed="${String(F[group]) === String(val)}">${label}</button>`;

  el.innerHTML = `
  <section class="page-head">
    <div class="wrap">
      <p class="crumbs"><a href="#/">Kezdőlap</a> / Gyűrűk</p>
      <h1>Gyűrűk</h1>
      <p class="sec__lead">Mindegyik rendelésre készül, a te méretedre. A gyűrű oldalán látod, mit állíthatsz rajta magad – ami azon túl van, azt külön megbeszéljük. Az ár az alapbeállításra szól.</p>
<label class="csearch"><span class="sr">Keresés</span><input class="input" type="search" data-q value="${esc(F.q)}" placeholder="Keresés cikkszámra vagy névre, pl. 81184" autocomplete="off"></label>
      <p class="page-head__alt">Nem találod, amit keresel? <a href="#/sajat">Mondd el a saját ötleted</a></p>
    </div>
  </section>
  <section class="wrap shop">
    <button class="btn btn--line shop__open" type="button" data-open-filters>Szűrés és rendezés <span data-fcount></span></button>
    <aside class="filters" data-filters aria-label="Szűrők">
      <div class="filters__head"><h2>Szűrés</h2><button class="filters__close" type="button" data-close-filters aria-label="Szűrők bezárása">×</button></div>
      <fieldset><legend>Arany színe</legend><div class="chips">${chip('szin', 'mind', 'Mind')}${chip('szin', 'sarga', 'Sárga')}${chip('szin', 'feher', 'Fehér')}${chip('szin', 'rose', 'Rozé')}${chip('szin', 'ketszinu', 'Kétszínű')}</div></fieldset>
      <fieldset><legend>Anyag – ezzel számolt árak</legend><div class="chips">${METAL_ORDER.map((m) => chip('anyag', m, METALS[m].short)).join('')}</div></fieldset>
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
        <div class="density" role="group" aria-label="Gyűrűk száma egy sorban"><span>Egy sorban:</span><span data-density></span></div>
        <label class="select"><span>Rendezés</span><select data-sort>
          <option value="ajanlott">Ajánlott</option><option value="ar-fel">Ár szerint növekvő</option><option value="ar-le">Ár szerint csökkenő</option><option value="cikkszam">Cikkszám</option>
        </select></label></div>
      <div class="grid" data-results></div>
    </div>
  </section>`;

  $('[data-sort]', el).value = F.rend;
  const results = $('[data-results]', el);
  let limit = 48;
  // Sűrűség: hány gyűrű legyen egy sorban (asztalon 4/5/6/8, telefonon 2/3/4) – megjegyzi a böngésző
  const mq = matchMedia('(max-width: 640px)');
  const opts = () => (mq.matches ? [2, 3, 4] : [4, 5, 6, 8]);
  const key = () => (mq.matches ? 'kg-cols-m' : 'kg-cols-d');
  const getCols = () => { let v = 0; try { v = Number(localStorage.getItem(key())); } catch {} return opts().includes(v) ? v : (mq.matches ? 3 : 6); };
  const applyCols = () => {
    const c = getCols();
    results.style.setProperty('--cols', c);
    results.classList.toggle('grid--dense', mq.matches ? c >= 3 : c >= 5);
    results.classList.toggle('grid--tiny', mq.matches ? c >= 4 : c >= 8);
    $('[data-density]', el).innerHTML = opts().map((n) => `<button type="button" data-cols="${n}" aria-pressed="${n === c}">${n}</button>`).join('');
  };
  mq.addEventListener?.('change', applyCols);
  applyCols();

  const paint = () => {
    const k = F.anyag;
    let list = all.filter((p) => {
      if (!listed(p)) return false;
      if (!p.metals.includes(k)) return false;
      if (F.q && !`${p.code} ${p.name}`.toLowerCase().includes(F.q.toLowerCase())) return false;
      if (F.szin !== 'mind' && !isGold(k)) return false;
      if (F.szin !== 'mind') {
        if (F.szin === 'rose') { if (!p.colors.includes('rose') && !(BICOLOR[p.baseColor] || []).includes('rose')) return false; }
        else if (F.szin === 'ketszinu') { if (!BICOLOR[p.baseColor]) return false; }
        else if (p.baseColor !== F.szin) return false;
      }
      const stones = hasStones(p);
      if (F.ko === 'koves' && !stones) return false;
      if (F.ko === 'nelkul' && stones && !canBePlain(p)) return false;
      if (F.stilus !== 'mind' && p.style !== F.stilus) return false;
      if (F.tipus !== 'mind' && p.kind !== F.tipus) return false;
      if (F.szel !== 'mind' && !p.widths.includes(Number(F.szel))) return false;
      return true;
    }).map((p) => {
      const cfg = defaultConfig(p);
      cfg.metal = k; if (!isGold(k)) cfg.color = null;
      if (F.szin === 'rose' && p.colors.includes('rose')) cfg.color = 'rose';
      if (F.ko === 'nelkul') cfg.rings.forEach((r) => (r.stones = null));
      return { p, cfg, v: p.priceOnRequest ? null : price(p, cfg).final };
    });
    const min = Number(String(F.min).replace(/\D/g, '')) || 0;
    const max = Number(String(F.max).replace(/\D/g, '')) || Infinity;
    const priced = min > 0 || max !== Infinity;
    list = list.filter((x) => (x.v === null || x.v === undefined) ? !priced : x.v >= min && x.v <= max);
    const pv = (x, d) => (x.v === null || x.v === undefined ? d : x.v);
    if (F.rend === 'ar-fel') list.sort((a, b) => pv(a, Infinity) - pv(b, Infinity));
    if (F.rend === 'ar-le') list.sort((a, b) => pv(b, -1) - pv(a, -1));
    if (F.rend === 'cikkszam') list.sort((a, b) => a.p.code.localeCompare(b.p.code));
    if (F.rend === 'ajanlott') {
      // ajánlott sorrend: kiemelt modellek, majd a rozé és a párok, a szürke hátterű egyedi gyűrűk a végén
      const rank = (p) => { const f = FEATURED.indexOf(p.id); return f >= 0 ? f : 10 + (p.kind === 'p' ? 0 : 50) + (p.imgFill ? 30 : 0); };
      list.sort((a, b) => rank(a.p) - rank(b.p) || a.p.code.localeCompare(b.p.code));
    }
    $('[data-count]', el).textContent = `${list.length} modell`;
    const active = ['szin', 'ko', 'stilus', 'tipus', 'szel'].filter((g) => F[g] !== 'mind').length + (F.anyag !== 'au14' ? 1 : 0) + (min || max !== Infinity ? 1 : 0);
    $('[data-fcount]', el).textContent = active ? `(${active})` : '';
    const shown = list.slice(0, limit);
    results.innerHTML = list.length ? shown.map(({ p, cfg }) => cardFor(p, cfg)).join('')
      + (list.length > limit ? `<div class="more"><button class="btn btn--line" type="button" data-more>Továbbiak mutatása (még ${list.length - limit})</button></div>` : '')
      : `<div class="empty"><p>Ezekkel a feltételekkel nincs modell.</p><button class="btn btn--line" type="button" data-clear>Szűrők törlése</button></div>`;
    animateCards(results);
    if (M() && !reduced()) M().animate($$('.card', results), { opacity: [0, 1], y: [12, 0] }, { duration: 0.5, delay: M().stagger(0.03) });
  };

  const cardFor = (p, cfg) => {
    const html = card(p, { metal: cfg.metal !== 'au14' ? cfg.metal : null });
    if (p.priceOnRequest) return html;
    const def = defaultConfig(p);
    if (cfg.color === def.color && cfg.metal === def.metal && cfg.rings.every((r, i) => !!r.stones === !!def.rings[i].stones)) return html;
    // Rozé, más anyagú vagy kő nélküli változat ára és linkje
    const v = price(p, cfg).final;
    const link = `href="#/gyuru/${p.id}?k=${encodeCfg(cfg)}"`;
    return (v === null ? html : html.replace(/data-value="\d+">[^<]+</, `data-value="${v}">${ft(v)}<`)).replace(`href="#/gyuru/${p.id}"`, link);
  };

  el.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { F.q = e.target.value.trim(); limit = 48; paint(); } });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-more]')) { limit += 48; paint(); return; }
    const dc = e.target.closest('[data-cols]');
    if (dc) { try { localStorage.setItem(key(), dc.dataset.cols); } catch {} applyCols(); return; }
    const c = e.target.closest('[data-f]');
    if (c) {
      limit = 48;
      F[c.dataset.f] = c.dataset.v;
      $$(`[data-f="${c.dataset.f}"]`, el).forEach((b) => b.setAttribute('aria-pressed', b === c));
      paint();
    }
    if (e.target.closest('[data-clear]')) { Object.assign(F, { szin: 'mind', ko: 'mind', stilus: 'mind', szel: 'mind', tipus: 'mind', min: '', max: '', anyag: 'au14', q: '' }); catalog(el); }
    if (e.target.closest('[data-open-filters]')) { $('[data-filters]', el).classList.add('is-open'); document.documentElement.classList.add('no-scroll'); }
    if (e.target.closest('[data-close-filters]')) { $('[data-filters]', el).classList.remove('is-open'); document.documentElement.classList.remove('no-scroll'); }
  });
  el.addEventListener('input', (e) => { const f = e.target.dataset.fn; if (f) { F[f] = e.target.value; paint(); } });
  $('[data-sort]', el).addEventListener('change', (e) => { F.rend = e.target.value; limit = 48; paint(); });
  paint();
}

/* ---------- Termékoldal + konfigurátor ---------- */
const FONTS = ['Egyenes', 'Írott'];

export function product(el, id, query) {
  el = fresh(el);
  const p = store.product(id);
  if (!p) { el.innerHTML = `<section class="wrap page-head"><h1>A gyűrű nem található</h1><p><a class="btn btn--line" href="#/kollekcio">Vissza a gyűrűkhöz</a></p></section>`; return; }
  const onReq = !!p.priceOnRequest && p.override?.type !== 'fixed';   // ár nélküli modell: beállítható, de az ár egyedi ajánlat
  let cfg = (query?.get('k') && decodeCfg(query.get('k'), p)) || defaultConfig(p);
  const qc = query?.get('szin');
  if (!query?.get('k') && qc && p.colors.includes(qc)) cfg.color = qc;
  let view = 'foto', shownView = '';
  const sketch = () => ringSketch({ metal: cfg.metal, color: cfg.color || p.baseColor, rings: p.rings.map((rg, i) => {
    const rc = cfg.rings[i], dd = rc.stones && diamond(S().materials, rc.stones.cat);
    return { label: rg.label, size: rc.size, sizeText: rc.sizeUnknown ? 'méret később' : sizeSfx(rc.size), width: rc.width,
      stones: rc.stones ? { count: rc.stones.count, mm: dd?.mm, around: rg.stoneRule.mode === 'perSize' } : null };
  }) });
  let lastWarn = '';
  const pair = p.kind === 'p';
  const golds = p.metals.filter(isGold), others = p.metals.filter((m) => !isGold(m));
  const anyStones = hasStones(p);

  el.innerHTML = `
  <section class="wrap pdp">
    <p class="crumbs"><a href="#/">Kezdőlap</a> / <a href="#/kollekcio">Gyűrűk</a> / ${esc(p.code)}</p>
    <div class="pdp__grid">
      <div class="pdp__gallery">
        <div class="pdp__stage" data-stage></div>
        <div class="pdp__thumbs" role="tablist" aria-label="Nézet">
          ${p.img ? `<button role="tab" data-view="foto" aria-selected="true"><span class="pdp__thumb">${productMedia(p)}</span>Fotó</button>` : ''}
          <button role="tab" data-view="abra" aria-selected="false"><span class="pdp__thumb pdp__thumb--abra" data-minisketch></span>A te változatod</button>
          ${p.img ? `<button role="tab" data-view="nagy" aria-selected="false"><span class="pdp__thumb pdp__thumb--zoom">${productMedia(p)}</span>Nagyítás</button>` : ''}
        </div>
        <div class="pdp__dock" data-dock>
          <div><span>${onReq ? 'Ár' : 'Becsült ár, a beállításaiddal'}</span><strong class="price" data-dprice></strong></div>
          <button class="btn btn--dark" type="button" data-inquire="erdeklodes">${onReq ? 'Árajánlatot kérek' : 'Érdekel ez a gyűrű'}</button>
        </div>
        <p class="fine" data-stagenote></p>
        <p class="colornote" data-colornote hidden></p>
        <div class="pdp__trust">
          <p><b>Rendelésre készül</b><span>A te méretedre, egyeztetés után.</span></p>
          <p><b>Természetes gyémánt</b><span>Csak valódi, természetes kővel dolgozunk.</span></p>
          <p><b>Hétvégén is</b><span>Időpont-egyeztetéssel.</span></p>
        </div>
      </div>

      <div class="pdp__panel" data-panel>
        <p class="card__code">${esc(p.code)} ${p.real ? '' : demoMark('demótermék')}</p>
        <h1 class="pdp__title">${esc(p.name)}</h1>
        ${anyStones ? '<p class="natural">Természetes gyémánttal</p>' : ''}
        <div class="pdp__price" data-pricebox>
          <span>${onReq ? 'Ár' : `Becsült ár a választott beállítással ${demoMark()}`}</span>
          <strong class="price price--big" data-cprice></strong>
          <p class="pdp__quote" data-quote hidden></p>
          ${pair ? '<p class="pdp__split" data-split></p>' : ''}
          <small data-pnote>Bruttó, ÁFA-val. Rendelésre készül.</small>
        </div>
        <p class="cfg__warn" data-warn role="status" hidden></p>
        <div class="scope scope--ok"><h2>Amit itt te állíthatsz</h2><p>${onReq ? 'Ennél a modellnél ezek a lehetőségek adottak. Árat itt nem számolunk – a beállításaid az ajánlatkérésbe kerülnek.' : 'Ennél a modellnél ezek a lehetőségek adottak. Az ár mindegyiknél azonnal változik.'}</p></div>
        <ol class="cfg" data-steps></ol>
        <div class="summary" data-summary></div>
        <div class="pdp__ctas">
          <button class="btn btn--dark btn--full" type="button" data-inquire="erdeklodes">${onReq ? 'Árajánlatot kérek erre a gyűrűre' : 'Érdekel ez a gyűrű'}</button>
          <button class="btn btn--line btn--full" type="button" data-inquire="konzultacio">Személyes konzultációt kérek</button>
          <div class="pdp__tools">
            <button type="button" class="linkbtn" data-share>Konfiguráció linkjének másolása</button>
            <button type="button" class="linkbtn" data-resetcfg>Alapbeállítás</button>
          </div>
          <a class="pdp__phone" href="${BUSINESS.phoneHref}">vagy hívj: <b>${BUSINESS.phone}</b></a>
        </div>
        <div class="other">
          <p class="other__tag">Amit külön egyeztetünk</p>
          <h2>Másképp képzelted el?</h2>
          <p>Keskenyebb vagy szélesebb, más forma, más felület, másfajta foglalás, nagyobb vagy más minőségű kő, kő oda is, ahol itt nem választható? Ezekre itt nem tudunk árat és igent mondani – az ötvös nézi meg, megvalósítható-e. A mostani beállításaidat visszük tovább.</p>
          ${(p.consult || []).length ? `<ul class="other__list" data-consult>${p.consult.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
          <a class="btn btn--line" href="#" data-custom-link>Egyedi változtatást kérek</a>
        </div>
        <p class="notice">Tájékoztató ár. A véglegeset személyesen mondjuk meg, a pontos méret és az aznapi nemesfémár alapján.</p>
      </div>
    </div>

    <section class="specs" data-specs></section>
  </section>
  <div class="mbar" data-mbar>
    <div><span>Becsült ár</span><strong class="price" data-mprice></strong></div>
    <button class="btn btn--dark" type="button" data-inquire="erdeklodes">Érdeklődöm</button>
  </div>`;

  const sizes = (i) => sizeRange(p.rings[i]);
  const with_ = (fn) => { const c = JSON.parse(JSON.stringify(cfg)); fn(c); return c; };
  const delta = (cur, fn) => {
    if (onReq) return '';
    const v = price(p, with_(fn)).final;
    if (v === null) return '<em class="delta delta--q">egyedi ajánlat</em>';
    if (cur === null) return `<em class="delta">${ft(v)}</em>`;
    const d = v - cur;
    if (!d) return '<em class="delta delta--0">ugyanannyi</em>';
    return `<em class="delta ${d > 0 ? 'delta--up' : 'delta--down'}">${d > 0 ? '+' : '−'}${ft(Math.abs(d))}</em>`;
  };
  const cur_ = '<em class="delta delta--cur">kiválasztva</em>';

  const syncUrl = () => {
    const def = JSON.stringify(defaultConfig(p)) === JSON.stringify(cfg);
    const h = `#/gyuru/${p.id}${def ? '' : '?k=' + encodeCfg(cfg)}`;
    if (location.hash !== h) history.replaceState(null, '', h);
  };

  const paintInfo = (r) => {
    $('[data-summary]', el).innerHTML = `<h2 class="opt__label">Összefoglaló</h2><dl>
      <div><dt>Anyag</dt><dd>${metalLabel(cfg)}</dd></div>
      ${p.rings.map((rg, i) => `<div><dt>${esc(rg.label)}</dt><dd>${ringLine(p, cfg, i)}</dd></div>`).join('')}
      ${r.grams ? `<div><dt>Becsült tömeg</dt><dd>${dec(r.grams)} g ${demoMark('demóadat')}</dd></div>` : ''}
      <div><dt>Becsült ár</dt><dd><b>${r.final === null ? 'Egyedi árajánlat szükséges' : ft(r.final)}</b></dd></div></dl>`;
    $('[data-specs]', el).innerHTML = specs(p, cfg, r);
  };

  const engravePreview = (rc) => {
    const key = !isGold(cfg.metal) ? 'feher' : (BICOLOR[cfg.color] ? 'ketszinu' : cfg.color);
    const m = { sarga: ['#F3DA9B', '#C99B4C'], feher: ['#F4F5F6', '#BFC4C8'], rose: ['#F5D3C1', '#C98C72'], ketszinu: ['#F4F5F6', '#C99B4C'] }[key] || ['#eee', '#bbb'];
    const txt = rc.engraving || 'Ide kerül a szöveged';
    const style = rc.font ? `font-family:'Libre Baskerville',serif;font-style:italic;font-weight:400;font-size:17px` : `font-family:Manrope,sans-serif;font-weight:600;font-size:15px;letter-spacing:.5px`;
    const gid = 'eg' + Math.random().toString(36).slice(2, 7);
    return `<svg class="engrave" viewBox="0 0 360 64" role="img" aria-label="Gravírozás előnézete">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m[1]}"/><stop offset=".35" stop-color="${m[0]}"/><stop offset=".7" stop-color="${m[0]}"/><stop offset="1" stop-color="${m[1]}"/></linearGradient></defs>
      <rect x="1" y="6" width="358" height="52" rx="26" fill="url(#${gid})" stroke="rgba(0,0,0,.12)"/>
      <text x="180" y="38" text-anchor="middle" fill="${rc.engraving ? 'rgba(40,30,20,.72)' : 'rgba(40,30,20,.35)'}" style="${style}">${esc(txt)}</text>
    </svg>`;
  };

  /* --- Lépések: csak a releváns lépések jelennek meg --- */
  const stepMetal = (cur) => {
    const opts = [];
    if (golds.length) opts.push(['gold', 'Arany', golds.length > 1 ? '14 vagy 18 karát' : METALS[golds[0]].short, isGold(cfg.metal), (x) => { x.metal = golds.includes('au14') ? 'au14' : golds[0]; x.color = x.color || p.baseColor; }]);
    for (const m of others) opts.push([m, METALS[m].label, { pt: 'nehéz, tartós – csak fehér', pd: 'könnyebb – csak fehér', ti: 'nagyon könnyű – ára egyedi' }[m], cfg.metal === m, (x) => { x.metal = m; x.color = null; }]);
    // ami ennél a modellnél nem készül, az látszik, de nem választható – okkal együtt
    const off = ['pt', 'pd', 'ti'].filter((m) => !p.metals.includes(m)).map((m) => [m, METALS[m].label, (p.metalNotes && p.metalNotes[m]) || (BICOLOR[p.baseColor] ? 'két szín csak aranyból készülhet' : 'ennél a modellnél nem készül')]);
    if (opts.length < 2 && !off.length) return '';
    const offHtml = off.map(([k, l, why]) => `<button type="button" class="kopt kopt--off" disabled data-metal-off="${k}"><b>${l}</b><span>${esc(why)}</span><em class="delta delta--q">nem választható</em></button>`).join('');
    return ['Anyag', isGold(cfg.metal) ? 'Arany' : METALS[cfg.metal].short, `<div class="cfg__cards cfg__cards--metal">${opts.map(([k, l, d, on, fn]) =>
      `<button type="button" class="kopt" data-metal="${k}" aria-pressed="${on}"><b>${l}</b><span>${d}</span>${on ? cur_ : delta(cur, fn)}</button>`).join('')}${offHtml}</div>`];
  };
  const stepKarat = (cur) => {
    if (!isGold(cfg.metal) || golds.length < 2) return '';
    const info = { au14: '58,5% színarany · keményebb, a mindennapokat jól bírja', au18: '75% színarany · telítettebb szín, kicsit puhább és nehezebb' };
    return ['Finomság', METALS[cfg.metal].short.replace(' arany', ''), `<div class="cfg__cards">${golds.map((m) =>
      `<button type="button" class="kopt" data-karat="${m}" aria-pressed="${m === cfg.metal}"><span class="stamp">${METALS[m].stamp}</span><b>${METALS[m].short.replace(' arany', '')}</b><span>${info[m]}</span>${m === cfg.metal ? cur_ : delta(cur, (x) => (x.metal = m))}</button>`).join('')}</div>
      <p class="hint">A 24 karátos (színarany) csak számítási alap, gyűrűhöz túl puha.</p>`];
  };
  const stepColor = () => {
    if (!isGold(cfg.metal) || p.colors.length < 2) return '';
    return ['Arany színe', colorLabel(cfg.color), `<div class="cfg__colors">${p.colors.map((c) => `<button type="button" class="copt" data-color="${c}" aria-pressed="${c === cfg.color}">
      <span class="sw" style="--sw:${metalSwatch(c)}"></span><b>${colorLabel(c)}</b>${c === cfg.color ? cur_ : '<em class="delta delta--0">ugyanannyi</em>'}</button>`).join('')}</div>
      <p class="hint">Azonos karátnál a szín nem változtat az árat.</p>`];
  };
  const wv = optionValues(p, 'width'), tv = optionValues(p, 'thickness');
  const stepSize = (cur) => ['Méret' + (pair ? ' – női és férfi' : '') + (wv ? ', szélesség' : ''), '', `<div class="rings2">${p.rings.map((ring, i) => {
    const rc = cfg.rings[i], [lo, hi] = sizes(i);
    return `<div class="ringbox"><h3 class="ringbox__t">${esc(ring.label)}</h3>
      <div class="stepper ${rc.sizeUnknown ? 'is-off' : ''}"><button type="button" data-size="${i}|-1" aria-label="${esc(ring.label)}: kisebb méret" ${rc.sizeUnknown || rc.size <= lo ? 'disabled' : ''}>−</button><output aria-live="polite">${rc.sizeUnknown ? '?' : rc.size}</output><button type="button" data-size="${i}|1" aria-label="${esc(ring.label)}: nagyobb méret" ${rc.sizeUnknown || rc.size >= hi ? 'disabled' : ''}>+</button></div>
      <label class="check"><input type="checkbox" data-unknown="${i}" ${rc.sizeUnknown ? 'checked' : ''}><span>Még nem tudom</span></label>
      <button type="button" class="linkbtn" data-sizehelp="${i}">Méretsegítő</button>
      ${wv ? `<div class="dimopt"><span>Szélesség</span><div class="cfg__seg cfg__seg--sm" role="group" aria-label="${esc(ring.label)} szélessége">${wv.map((w) => `<button type="button" data-width="${i}|${w}" aria-pressed="${w === rc.width}"><b>${dec(w)} mm</b>${w === rc.width ? '' : delta(cur, (x) => (x.rings[i].width = w))}</button>`).join('')}</div></div>`
        : `<p class="dimfix" data-width-fixed><span>Szélesség</span><b>${dec(rc.width)} mm ${demoMark('demóadat')}</b><small>online nem választható – ${optionReason(p, 'width')}. Más szélesség egyeztetéssel.</small></p>`}
      ${tv && rc.thick ? `<div class="dimopt"><span>Vastagság</span><div class="cfg__seg cfg__seg--sm" role="group" aria-label="${esc(ring.label)} vastagsága">${tv.map((v) => `<button type="button" data-thick="${i}|${v}" aria-pressed="${v === rc.thick}"><b>${dec(v)} mm</b>${v === rc.thick ? '' : delta(cur, (x) => (x.rings[i].thick = v))}</button>`).join('')}</div></div>`
        : (ring.thickness ? `<p class="dimfix"><span>Vastagság</span><b>${dec(ring.thickness)} mm</b><small>nem választható – ${optionReason(p, 'thickness')}</small></p>` : '')}
    </div>`; }).join('')}</div>
    ${wv || tv ? '<p class="hint">A választható szélességet és vastagságot az ötvös ehhez a modellhez hagyta jóvá. Hogy a te kezeden melyik a kényelmes, az a konzultáción, felpróbálva derül ki.</p>' : ''}
    <p class="hint">Belső kerület mm-ben (${p.rings.map((r, i) => `${esc(r.label.split(' ')[0].toLowerCase())}: ${sizes(i)[0]}–${sizes(i)[1]}`).join(', ')}). Nagyobb méret = több nemesfém. ${cfg.rings.some((r) => r.sizeUnknown) ? '· Az ismeretlen méretet átlagos mérettel számoljuk, a konzultáción megmérjük.' : ''}</p>`];
  const stepStones = (cur) => {
    if (!anyStones) return '';
    const Mx = S().materials;
    return ['Gyémánt', 'természetes', `<div class="rings2">${p.rings.map((ring, i) => {
      const rule = ring.stoneRule, rc = cfg.rings[i];
      if (!rule) return `<div class="ringbox"><h3 class="ringbox__t">${esc(ring.label)}</h3><p class="hint">Ezen a modellen ez a gyűrű kő nélkül szerepel.</p><p class="hint">Kővel képzelted el? Megoldható lehet – <a href="#" data-custom-link>kérd egyedi egyeztetéssel</a>.</p></div>`;
      const st = rc.stones;
      const dia = st && diamond(Mx, st.cat);
      let body = '';
      if (rule.allowNone) body += `<div class="cfg__seg cfg__seg--sm"><button type="button" data-stones="${i}|0" aria-pressed="${!st}"><b>Kő nélkül</b>${!st ? '' : delta(cur, (x) => (x.rings[i].stones = null))}</button><button type="button" data-stones="${i}|1" aria-pressed="${!!st}"><b>Gyémánttal</b>${st ? '' : delta(cur, (x) => (x.rings[i].stones = { count: Math.max(1, rule.def), cat: rule.defCat }))}</button></div>`;
      if (rule.mode === 'quote') body += '<p class="hint">Ez a kőváltozat egyedi árajánlattal készül.</p>';
      if (st) {
        if (rule.mode === 'free') {
          const lo = Math.max(1, rule.min || 0);
          body += `<div class="stonecount"><span>Kövek száma</span><div class="stepper stepper--sm"><button type="button" data-scount="${i}|-1" aria-label="Kevesebb kő" ${st.count <= lo ? 'disabled' : ''}>−</button><output aria-live="polite">${st.count}</output><button type="button" data-scount="${i}|1" aria-label="Több kő" ${st.count >= rule.max ? 'disabled' : ''}>+</button></div>
            <small>${lo}–${rule.max} db${st.count < rule.max ? ` · +1 kő: ${delta(cur, (x) => (x.rings[i].stones.count += 1))}` : ''}</small></div>`;
        } else if (rule.mode === 'fixed') body += `<p class="hint"><b>${st.count} kő</b> – a modell kialakítása miatt a kőszám kötött.</p>`;
        else if (rule.mode === 'perSize') body += `<p class="hint"><b>${st.count} kő</b> körbe foglalva – a kőszám a gyűrű méretétől függ.</p><p class="hint">Jó tudni: a körbekövezett gyűrű méretén utólag csak kőnyi lépésekben és sok munkával lehet változtatni. A pontos méretet ezért a konzultáción mérjük meg.</p>`;
        const fit = allowedCats(rule, rc.width, Mx, S().settings);
        if (rule.cats.length > 1) body += `<div class="stonecats" role="group" aria-label="Kőméret">${rule.cats.map((c) => { const d = diamond(Mx, c); if (!d) return '';
          const no = !fit.includes(c);
          return `<button type="button" data-scat="${i}|${c}" aria-pressed="${c === st.cat}" ${no ? `disabled title="${dec(rc.width)} mm szélességen nem fér el"` : ''}><b>${ctFmt(d.ct)} ct</b><span>${esc(d.quality)}</span>${no ? '<em class="delta delta--q">nem fér el</em>' : c === st.cat ? '' : (d.price == null ? '<em class="delta delta--q">egyedi ajánlat</em>' : delta(cur, (x) => (x.rings[i].stones.cat = c)))}</button>`; }).join('')}</div>`;
        body += `<p class="hint">${st.count} × ${dia ? esc(dia.name) + ', ' + esc(dia.quality) : ''} természetes gyémánt${dia && dia.price == null ? ' · <b>Egyedi árajánlat szükséges</b>' : ''}</p>`;
      }
      if (rule.demo) body += `<p class="fine">${demoMark('demó kőszabály')} A kőszámot és a kőméreteket az ötvösmester hagyja jóvá.</p>`;
      return `<div class="ringbox"><h3 class="ringbox__t">${esc(ring.label)}</h3>${body}</div>`; }).join('')}</div>`];
  };
  const stepEngrave = () => ['Gravírozás', `+${ft(S().settings.engravingPrice)} / gyűrű`, `<div class="rings2">${p.rings.map((ring, i) => {
    const rc = cfg.rings[i];
    return `<div class="ringbox"><h3 class="ringbox__t">${esc(ring.label)}</h3>
      <input class="input" maxlength="24" data-engrave="${i}" value="${esc(rc.engraving)}" placeholder="pl. Anna & Bence · 2027. 06. 12." aria-label="${esc(ring.label)} gravírozása">
      <div class="cfg__seg cfg__seg--sm">${FONTS.map((f, k) => `<button type="button" data-font="${i}|${k}" aria-pressed="${(rc.font || 0) === k}"><b>${f}</b></button>`).join('')}</div>
      <div data-engrave-prev="${i}">${engravePreview(rc)}</div></div>`; }).join('')}</div>
    <p class="hint">A gyűrű belsejébe, legfeljebb 24 karakter. Üresen hagyva nem számoljuk.</p>`];

  const paint = (first) => {
    let r = price(p, cfg);
    cfg = r.cfg;                                   // érvényesített (lehetetlen összeállítás nem marad)
    const cur = r.final;
    const stage = $('[data-stage]', el);
    if (!p.img && view === 'foto') view = 'abra';
    const sk = sketch();
    $('[data-minisketch]', el).innerHTML = sk;
    if (view !== shownView || view === 'abra') {
      stage.className = `pdp__stage pdp__stage--${view}`;
      stage.innerHTML = view === 'abra' ? `${sk}<p class="sketch__tag">Szemléltető ábra – nem fotó</p>` : `${productMedia(p, { eager: true, large: true })}<p class="sketch__tag sketch__tag--foto">Valódi modellfotó</p>`;
      shownView = view;
    }
    $('[data-stagenote]', el).innerHTML = view === 'abra'
      ? 'Az ábra a beállításaidat követi: anyag, szín, arányok, a kövek száma és mérete. Nem a kész gyűrű pontos képe – a kövek helyét és a felületet az ötvös alakítja ki.'
      : 'Valódi fotó az eredeti modellről (karikagyuru.com) – nem változik a beállításaiddal. Azokat „A te változatod” ábra mutatja.';
    const cn = $('[data-colornote]', el);
    const showNote = isGold(cfg.metal) ? cfg.color !== p.baseColor : true;
    cn.hidden = !showNote;
    cn.innerHTML = isGold(cfg.metal)
      ? `<span class="sw sw--sm" style="--sw:${metalSwatch(cfg.color)}"></span>A fotón ${colorLabel(p.baseColor).toLowerCase()} látható – a tiéd ${colorLabel(cfg.color).toLowerCase()} színben készül el.`
      : `A fotón aranyból készült változat látható – a tiéd ${METALS[cfg.metal].label.toLowerCase()}ból készül${cfg.metal === 'ti' ? '' : ', ami csak fehér színben létezik'}.`;
    $$('[data-view]', el).forEach((b) => b.setAttribute('aria-selected', b.dataset.view === view));

    const steps = [stepMetal(cur), stepKarat(cur), stepColor(), stepSize(cur), stepStones(cur), stepEngrave()].filter(Boolean);
    $('[data-steps]', el).innerHTML = steps.map(([t, v, body], i) => `<li class="cfg__step"><header><span class="cfg__n">${i + 1}</span><h2>${t}</h2>${v ? `<span class="cfg__val">${v}</span>` : ''}</header>${body}</li>`).join('');

    const q = $('[data-quote]', el);
    q.hidden = cur !== null;
    q.textContent = cur === null ? (onReq ? 'Ennél a modellnél az árat személyesen mondjuk meg. Állítsd be, amit szeretnél, és kérj ajánlatot.' : (r.reason || 'Ehhez az összeállításhoz nincs megbízható ár.') + ' Kérj ajánlatot, és személyesen kiszámoljuk.') : '';
    if (pair) {
      const sp = cur === null ? null : ringSplit(p, cfg, r, S().settings);
      $('[data-split]', el).innerHTML = sp ? p.rings.map((rg, i) => `<span>${esc(rg.label)} <b>kb. ${ft(sp[i])}</b></span>`).join('') : '';
    }
    const w = $('[data-warn]', el);
    w.hidden = !lastWarn; w.textContent = lastWarn; lastWarn = '';
    paintInfo(r);
    const st0 = S(), rt = st0.settings.roundTo;
    $('[data-pnote]', el).innerHTML = cur === null ? 'Rendelésre készül. Az árat személyesen mondjuk meg.' : `Bruttó, ÁFA-val${rt > 1 ? `, ${num(rt)} Ft-ra kerekítve` : ''}. Rendelésre készül.${(st0.materials.src || {})[`sellPerGram.${cfg.metal}`] === 'demo' && st0.settings.pricingMode === 'gramm' ? ` ${demoMark(`${METALS[cfg.metal].short}: demó grammár`)}` : ''}`;
    animatePrice($('[data-cprice]', el), cur);
    animatePrice($('[data-mprice]', el), cur); animatePrice($('[data-dprice]', el), cur);
    if (!first) { const pb = $('[data-pricebox]', el); pb.classList.remove('is-flash'); void pb.offsetWidth; pb.classList.add('is-flash'); }
    syncUrl();
  };

  const pick = (t, attr) => { const b = t.closest(`[data-${attr}]`); return b && !b.disabled ? b.dataset[attr].split('|') : null; };
  el.addEventListener('click', (e) => {
    const t = e.target;
    let a;
    if ((a = pick(t, 'metal'))) {
      if (a[0] === 'gold') { if (!isGold(cfg.metal)) { cfg.metal = golds.includes('au14') ? 'au14' : golds[0]; cfg.color = p.baseColor; } }
      else { cfg.metal = a[0]; cfg.color = null; }
    }
    else if ((a = pick(t, 'karat'))) cfg.metal = a[0];
    else if ((a = pick(t, 'color'))) cfg.color = a[0];
    else if ((a = pick(t, 'size'))) { const i = +a[0], [lo, hi] = sizes(i); cfg.rings[i].size = Math.min(hi, Math.max(lo, cfg.rings[i].size + Number(a[1]))); }
    else if ((a = pick(t, 'width'))) cfg.rings[+a[0]].width = Number(a[1]);
    else if ((a = pick(t, 'thick'))) cfg.rings[+a[0]].thick = Number(a[1]);
    else if ((a = pick(t, 'stones'))) { const i = +a[0], rule = p.rings[i].stoneRule; cfg.rings[i].stones = a[1] === '1' ? { count: Math.max(1, rule.def), cat: rule.defCat } : null; }
    else if ((a = pick(t, 'scount'))) cfg.rings[+a[0]].stones.count += Number(a[1]);
    else if ((a = pick(t, 'scat'))) cfg.rings[+a[0]].stones.cat = a[1];
    else if ((a = pick(t, 'font'))) cfg.rings[+a[0]].font = Number(a[1]);
    else if (t.closest('[data-custom-link]')) { e.preventDefault(); location.hash = `#/sajat?modell=${p.id}&k=${encodeCfg(cfg)}`; return; }
    else if ((a = pick(t, 'view'))) { if (a[0] === 'nagy') { zoom(p); return; } view = a[0]; }
    else if ((a = pick(t, 'inquire'))) { inquiry(p, cfg, a[0]); return; }
    else if ((a = pick(t, 'sizehelp'))) { const i = +a[0]; sizeHelp(sizes(i), (n) => { cfg.rings[i].size = n; cfg.rings[i].sizeUnknown = false; paint(); }); return; }
    else if (t.closest('[data-share]')) { share(); return; }
    else if (t.closest('[data-resetcfg]')) { cfg = defaultConfig(p); }
    else if (t.closest('.pdp__stage--foto')) { zoom(p); return; }
    else return;
    lastWarn = normalizeConfig(p, cfg, S().materials, S().settings).warnings.join(' ');
    paint();
  });
  el.addEventListener('change', (e) => {
    const u = e.target.dataset.unknown;
    if (u !== undefined) { const rc = cfg.rings[+u]; rc.sizeUnknown = e.target.checked; if (rc.sizeUnknown) rc.size = p.rings[+u].refSize; paint(); }
  });
  el.addEventListener('input', (e) => {
    const i = e.target.dataset.engrave;
    if (i === undefined) return;
    const rc = cfg.rings[+i];
    rc.engraving = e.target.value;
    $(`[data-engrave-prev="${i}"]`, el).innerHTML = engravePreview(rc);
    const r = price(p, cfg);
    animatePrice($('[data-cprice]', el), r.final);
    animatePrice($('[data-mprice]', el), r.final); animatePrice($('[data-dprice]', el), r.final);
    clearTimeout(e.target._t);
    e.target._t = setTimeout(() => {
      const r2 = price(p, cfg);
      paintInfo(r2); syncUrl();
      if (pair && r2.final !== null) { const sp = ringSplit(p, cfg, r2, S().settings); $('[data-split]', el).innerHTML = p.rings.map((rg, k) => `<span>${esc(rg.label)} <b>kb. ${ft(sp[k])}</b></span>`).join(''); }
    }, 220);
  });

  const share = async () => {
    syncUrl();
    const url = location.href;
    try { await navigator.clipboard.writeText(url); toast('A link kimásolva – küldd el a párodnak, vagy térj vissza később ehhez a beállításhoz.'); }
    catch { modal(`<div class="form"><h2>A konfiguráció linkje</h2><input class="input" readonly value="${esc(url)}" onfocus="this.select()"><p class="fine">Másold ki, és küldd el a párodnak.</p></div>`, { label: 'Link' }); }
  };

  paint(true);
  if (M() && !reduced()) M().animate([$('.pdp__gallery', el), $('.pdp__panel', el)], { opacity: [0, 1], y: [16, 0] }, { duration: 0.7, delay: M().stagger(0.1) });
}


function stoneText(rg, c, sep) {
  if (!rg.stoneRule) return '';
  if (!c.stones) return `${sep}kő nélkül`;
  const d = diamond(S().materials, c.stones.cat);
  return `${sep}${c.stones.count} db ${d ? ctFmt(d.ct) + ' ct' : ''} természetes gyémánt`;
}

function ringLine(p, cfg, i) {
  const rg = p.rings[i], c = cfg.rings[i];
  return `${c.sizeUnknown ? 'méret: konzultáción' : sizeSfx(c.size) + ' méret'} · ${dec(c.width)} mm${stoneText(rg, c, ' · ')}${c.engraving ? ` · gravír (${FONTS[c.font || 0].toLowerCase()}): „${esc(c.engraving)}”` : ''}`;
}

function sizeHelp([lo, hi], onPick) {
  const rows = [];
  for (let n = lo; n <= hi; n += 2) rows.push(n);
  modal(`<div class="form sizehelp"><p class="kicker">Méretsegítő</p><h2>Melyik a jó méret?</h2>
    <p>A magyar gyűrűméret a gyűrű <b>belső kerülete milliméterben</b>. Ha van egy jól illő gyűrűd, mérd meg vonalzóval a belső átmérőjét, és keresd meg a táblázatban.</p>
    <table class="sizetable"><thead><tr><th>Méret (kerület)</th><th>Belső átmérő</th><th></th></tr></thead><tbody>
      ${rows.map((n) => `<tr><td><b>${n}</b> mm</td><td>${dec(Math.round((n / Math.PI) * 10) / 10)} mm</td><td><button type="button" class="linkbtn" data-pick="${n}">Ezt választom</button></td></tr>`).join('')}
    </tbody></table>
    <ul class="tips"><li>Este és meleg időben az ujj kicsit vastagabb – akkor érdemes mérni.</li><li>Széles (5 mm feletti) gyűrűnél gyakran fél–egy mérettel nagyobb kell.</li><li>A pontos méretet a konzultáción mintagyűrűkkel vesszük fel, így nem kell biztosra tudnod.</li></ul>
  </div>`, { label: 'Méretsegítő', onMount: (box, close) => box.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) { close(); onPick(Number(b.dataset.pick)); } }) });
}

function specs(p, cfg, r) {
  const rows = [
    ['Cikkszám', esc(p.code)],
    ['Megnevezés', esc(p.name) + (p.real ? ` <span class="hint">– ügyféllel egyeztetendő</span>` : '')],
    ['Típus', p.kind === 'p' ? 'Karikagyűrű pár (női és férfi gyűrű)' : 'Egy gyűrű'],
    ['Anyag', `${metalLabel(cfg)}${p.unknownColor ? ' <span class="hint">– a cikkszámban nincs színjelölés, egyeztetendő</span>' : ''}`],
    ['Stílus', STYLES[p.style] + ' ' + demoMark('demóadat')],
    ...(r.grams ? [['Becsült tömeg', `${dec(r.grams)} g${isGold(cfg.metal) ? `, ebből ${dec(r.pure)} g színarany` : ''} ${demoMark('demóadat')}`]] : []),
    ['Választható anyagok', p.metals.map((m) => METALS[m].short).join(', ')],
    ...(hasStones(p) ? [['Kövek', 'Kizárólag természetes gyémánt']] : []),
    ['Elkészítés', 'Nincs készleten, rendelésre elkészítjük'],
    ['Előleg', 'Egyedileg készülő gyűrűnél a termék árának fele, a személyes egyeztetésen'],
    ['Garancia', 'Az átadástól számított 1 év jótállás'],
  ];
  return `<h2>Részletek</h2><dl class="specs__dl">${rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>`;
}

function zoom(p) {
  modal(`<div class="zoom"><img src="${esc(p.img)}" alt="${esc(p.name)}" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('p'),{textContent:'A fotó most nem érhető el.'}))"><p class="fine">${esc(p.code)} · ${esc(p.name)}</p></div>`, { label: 'Nagyított fotó', wide: true });
}

/* ---------- Érdeklődés / konzultáció ---------- */
export function configText(p, cfg) {
  const lines = [`${p.code} – ${p.name}`, `Anyag: ${metalLabel(cfg)}`];
  p.rings.forEach((r, i) => {
    const c = cfg.rings[i];
    lines.push(`${r.label}: ${c.sizeUnknown ? 'méret a konzultáción' : sizeSfx(c.size) + ' méret'}, ${dec(c.width)} mm${c.thick && optionValues(p, 'thickness') ? `, ${dec(c.thick)} mm vastag` : ''}${stoneText(r, c, ', ')}${c.engraving ? `, gravírozás (${FONTS[c.font || 0].toLowerCase()} betű): „${c.engraving}”` : ''}`);
  });
  return lines.join('\n');
}

export function inquiry(p, cfg, type = 'erdeklodes', onRequest = false) {
  const r = p && !onRequest ? price(p, cfg) : null;
  const summary = p ? (onRequest ? `${p.code} – ${p.name}` : configText(p, cfg)) : '';
  modal(`
    <form class="form" data-inq novalidate>
      <p class="kicker">${type === 'konzultacio' ? 'Személyes konzultáció' : 'Érdeklődés'}</p>
      <h2>${p ? 'Érdekel ez a gyűrű?' : 'Időpontkérés'}</h2>
      ${p ? `<div class="form__cfg"><pre>${esc(summary)}</pre>${r && r.final !== null ? `<p>Becsült ár: <b>${ft(r.final)}</b> ${demoMark()}</p>` : '<p>Ár: egyedi árajánlat szükséges</p>'}</div>` : ''}
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
      <p class="form__err" data-err hidden>Add meg a neved és a telefonszámod.</p>
      <button class="btn btn--dark btn--full" type="submit">Elküldöm</button>

    </form>`, {
    label: 'Érdeklődés',
    onMount(box, close) {
      const f = $('[data-inq]', box);
      let t = type;
      f.addEventListener('click', (e) => {
        const b = e.target.closest('[data-type]');
        if (b) { t = b.dataset.type; $$('[data-type]', f).forEach((x) => x.setAttribute('aria-pressed', x === b)); $('[data-datefield]', f).hidden = t !== 'konzultacio'; }
      });
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(f));
        if (!d.nev.trim() || !d.tel.trim()) { $('[data-err]', f).hidden = false; return; }
        const btn = $('button[type="submit"]', f); btn.disabled = true;
        const res = await store.addInquiry({ type: t, name: d.nev, phone: d.tel, email: d.email, day: d.nap, message: d.uzenet,
          productId: p?.id || null, code: p?.code || null, config: p && !onRequest ? JSON.parse(JSON.stringify(cfg)) : null, summary, estimate: r?.final || null });
        btn.disabled = false;
        if (!res.ok) { const er = $('[data-err]', f); er.hidden = false; er.textContent = `${res.error} Telefon: +36 30 984 3090`; return; }
        box.innerHTML = `<div class="form form--done"><p class="kicker">Megvan</p><h2>Köszi, hamarosan hívunk.</h2>
          <p>${sentNote('Az érdeklődésed megérkezett hozzánk, a kiválasztott gyűrű adataival együtt.', 'Az érdeklődés bekerült a kezelőfelület „Érdeklődések” menüjébe, a kiválasztott cikkszámmal és beállításokkal együtt.')} Ha sürgős, hívj: <a href="tel:+36309843090">+36 30 984 3090</a>.</p>
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
        
        <h2>Gyere el, nézd meg élőben</h2>
        <p>${esc(BUSINESS.hours)}</p>
        <dl class="contact__dl">
          <div><dt>Telefon</dt><dd><a href="${BUSINESS.phoneHref}">${BUSINESS.phone}</a></dd></div>
          <div><dt>E-mail</dt><dd><a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a></dd></div>
          <div><dt>Cím</dt><dd><a href="${BUSINESS.map}" target="_blank" rel="noopener">${esc(BUSINESS.address)}</a></dd></div>
        </dl>
      </div>
      <div class="contact__card" data-reveal=".1">
        <h3>Időpontot kérek</h3>
        <p>Add meg a neved és a telefonszámod, visszahívunk.</p>
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
    <p class="sec__lead">Felpróbálod a mintagyűrűket, megmérjük az ujjad, és megbeszéljük a részleteket. Előtte egyeztessünk időpontot.</p></div></section>${contactBlock()}`;
  bindContact(el);
  reveal(el);
}

/* ---------- Saját gyűrűt szeretnék (egyedi elképzelés) ---------- */
const C_TIPUS = [['par', 'Karikagyűrű pár'], ['egy', 'Egy karikagyűrű'], ['eljegyzesi', 'Eljegyzési gyűrű'], ['mas', 'Valami más']];
const C_ANYAG = [['au14', '14K arany'], ['au18', '18K arany'], ['pt', 'Platina'], ['pd', 'Palládium'], ['ti', 'Titán'], ['nemtudom', 'Még nem tudom']];
const C_GYEMANT = [['igen', 'Igen, természetes gyémánttal'], ['nem', 'Kő nélkül'], ['nemtudom', 'Még nem tudom']];
const C_KERET = [['', 'Nem adom meg'], ['250 ezer Ft alatt', '250 ezer Ft alatt'], ['250–400 ezer Ft', '250–400 ezer Ft'], ['400–700 ezer Ft', '400–700 ezer Ft'], ['700 ezer Ft felett', '700 ezer Ft felett']];
const C_KEY = 'kg-sajat-v1';
let customFiles = [];                       // a kiválasztott képek csak a böngészőben élnek (nincs feltöltés)
const lab = (list, v) => (list.find((x) => x[0] === v) || [])[1] || '';

export function custom(el, query) {
  el = fresh(el);
  const blank = { tipus: 'par', anyag: 'nemtudom', gyemant: 'nemtudom', keret: '', leiras: '', nev: '', tel: '', email: '', konz: true, nap: '', modell: '', k: '' };
  let d = { ...blank };
  try { d = { ...blank, ...JSON.parse(sessionStorage.getItem(C_KEY) || '{}') }; } catch { /* nincs mentett vázlat */ }
  if (query?.get('modell')) { d.modell = query.get('modell'); d.k = query.get('k') || ''; }
  const p = d.modell ? store.product(d.modell) : null;
  const cfg = p ? ((d.k && decodeCfg(d.k, p)) || defaultConfig(p)) : null;
  if (p && cfg && !query?.get('keep')) { if (isGold(cfg.metal) || METALS[cfg.metal]) d.anyag = cfg.metal; d.tipus = p.kind === 'p' ? 'par' : 'egy'; if (cfg.rings.some((r) => r.stones)) d.gyemant = 'igen'; }
  const save = () => { try { sessionStorage.setItem(C_KEY, JSON.stringify(d)); } catch { /* privát mód */ } };
  const chips = (key, list) => `<div class="cchips" role="radiogroup">${list.map(([v, l]) => `<button type="button" role="radio" data-cf="${key}|${v}" aria-checked="${d[key] === v}">${l}</button>`).join('')}</div>`;

  el.innerHTML = `
  <section class="page-head page-head--custom">
    <div class="wrap">
      <p class="crumbs"><a href="#/">Kezdőlap</a> / Saját ötlet</p>
      <h1>Saját gyűrűt szeretnék</h1>
      <p class="sec__lead">Mondd el, mi jár a fejedben. Nem kell pontosan tudnod – egy mondat, egy fotó vagy egy rajz is elég kiindulásnak. A részleteket személyesen találjuk ki, és az ötvös megmondja, mi valósítható meg.</p>
    </div>
  </section>
  <section class="wrap custom">
    <form class="custom__form" data-custom novalidate>
      ${p ? `<div class="cmodel" data-cmodel>
        <div class="cmodel__img">${productMedia(p)}</div>
        <div><p class="kicker">Ebből a gyűrűből indulunk ki</p><p><b>${esc(p.code)}</b> · ${esc(p.name)}</p>
          ${cfg ? `<pre>${esc(configText(p, cfg).split('\n').slice(1).join('\n'))}</pre>` : ''}
          <button type="button" class="linkbtn" data-cnomodel>Inkább modell nélkül</button></div>
      </div>` : ''}
      <ol class="cfg cfg--custom">
        <li class="cfg__step"><header><span class="cfg__n">1</span><h2>${p ? 'Mit változtatnál rajta?' : 'Mit szeretnél?'}</h2></header>
          <textarea class="input" name="leiras" rows="5" placeholder="${p ? 'Pl. legyen keskenyebb, a férfigyűrűbe is kerüljön egy kő, más legyen a felülete…' : 'Pl. két szín egy gyűrűben, körben apró kövekkel. Vagy: láttam egy gyűrűt, olyasmit szeretnék, csak laposabbat…'}">${esc(d.leiras)}</textarea>
        </li>
        <li class="cfg__step"><header><span class="cfg__n">2</span><h2>Milyen gyűrű lenne?</h2></header>${chips('tipus', C_TIPUS)}</li>
        <li class="cfg__step"><header><span class="cfg__n">3</span><h2>Miből?</h2></header>${chips('anyag', C_ANYAG)}<p class="hint">Aranynál a színt (sárga, fehér, rozé, akár kettő együtt) a konzultáción választod ki – a kezeden látszik igazán.</p></li>
        <li class="cfg__step"><header><span class="cfg__n">4</span><h2>Legyen benne gyémánt?</h2></header>${chips('gyemant', C_GYEMANT)}</li>
        <li class="cfg__step"><header><span class="cfg__n">5</span><h2>Van kép vagy rajz?</h2><span class="cfg__val">nem kötelező</span></header>
          <label class="cfile"><input type="file" accept="image/*" multiple data-cfile hidden><span class="btn btn--line">Kép kiválasztása</span><small>Fotó egy gyűrűről, ami tetszik, vagy egy saját rajz. Legfeljebb 3 kép.</small></label>
          <div class="cprev" data-cprev></div>
          <p class="hint" data-cfilenote hidden>A kép csak itt jelenik meg előnézetként, az oldal nem tölti fel. Hozd el az egyeztetésre, vagy küldd el e-mailben: <a href="mailto:info@karikagyuru.com">info@karikagyuru.com</a>.</p>
        </li>
        <li class="cfg__step"><header><span class="cfg__n">6</span><h2>Mennyit szánnál rá?</h2><span class="cfg__val">nem kötelező</span></header>${chips('keret', C_KERET)}
          <p class="hint">Ha megadod, olyan megoldást keresünk, ami belefér. ${demoMark('demó sávok')}</p></li>
        <li class="cfg__step"><header><span class="cfg__n">7</span><h2>Hol érünk el?</h2></header>
          <div class="field-row"><label class="field"><span>Név</span><input class="input" name="nev" autocomplete="name" value="${esc(d.nev)}" required></label>
            <label class="field"><span>Telefonszám</span><input class="input" name="tel" type="tel" autocomplete="tel" value="${esc(d.tel)}" required></label></div>
          <label class="field"><span>E-mail <i>(nem kötelező)</i></span><input class="input" name="email" type="email" autocomplete="email" value="${esc(d.email)}"></label>
          <label class="check"><input type="checkbox" name="konz" ${d.konz ? 'checked' : ''}><span>Személyes konzultációt kérek</span></label>
          <label class="field" data-cnap ${d.konz ? '' : 'hidden'}><span>Melyik nap lenne jó?</span><input class="input" name="nap" type="date" value="${esc(d.nap)}"></label>
        </li>
      </ol>
      <p class="form__err" data-cerr hidden></p>
      <button class="btn btn--dark btn--full" type="submit">Elküldöm az ötletem</button>

    </form>
    <aside class="custom__side">
      <div class="csum" data-csummary aria-live="polite"></div>
      <div class="csum csum--how"><h2>Mi történik ezután?</h2>
        <ol><li>Visszahívunk, és egyeztetünk egy időpontot.</li><li>Az ötvös megnézi, hogyan készíthető el – ha valami nem működne, mond helyette mást.</li><li>Árat akkor mondunk, amikor már tudjuk, pontosan mi készül.</li></ol></div>
    </aside>
  </section>`;

  const paintSum = () => {
    const rows = [
      ['Gyűrű', lab(C_TIPUS, d.tipus)], ['Anyag', lab(C_ANYAG, d.anyag)], ['Gyémánt', lab(C_GYEMANT, d.gyemant)],
      ...(d.keret ? [['Keret', d.keret]] : []), ...(customFiles.length ? [['Kép', `${customFiles.length} db kiválasztva`]] : []),
      ...(p ? [['Kiindulás', p.code]] : []),
    ];
    $('[data-csummary]', el).innerHTML = `<h2>Amit eddig megadtál</h2>
      <dl>${rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
      ${d.leiras.trim() ? `<p class="csum__txt">„${esc(d.leiras.trim().slice(0, 180))}${d.leiras.trim().length > 180 ? '…' : ''}”</p>` : ''}
      <p class="csum__price"><span>Ár</span><b>Személyes egyeztetés alapján</b></p>
      <p class="fine">Egyedi tervnél nem számolunk automatikus árat – az félrevezető lenne.</p>`;
  };
  const paintFiles = () => {
    $('[data-cprev]', el).innerHTML = customFiles.map((f, i) => `<figure><img src="${f.url}" alt="Kiválasztott kép ${i + 1}"><button type="button" data-cdel="${i}" aria-label="Kép eltávolítása">×</button><figcaption>${esc(f.name.slice(0, 22))}</figcaption></figure>`).join('');
    $('[data-cfilenote]', el).hidden = !customFiles.length;
  };
  const form = $('[data-custom]', el);
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cf]');
    if (b) { const [k, v] = b.dataset.cf.split('|'); d[k] = v || ''; $$(`[data-cf^="${k}|"]`, form).forEach((x) => x.setAttribute('aria-checked', x === b)); save(); paintSum(); }
    const del = e.target.closest('[data-cdel]');
    if (del) { const [f] = customFiles.splice(+del.dataset.cdel, 1); if (f) URL.revokeObjectURL(f.url); paintFiles(); paintSum(); }
    if (e.target.closest('[data-cnomodel]')) { d.modell = ''; d.k = ''; save(); location.hash = '#/sajat'; if (!query?.get('modell')) custom(el, null); }
  });
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'konz') { d.konz = t.checked; $('[data-cnap]', form).hidden = !d.konz; }
    else if (t.name && t.name in d) d[t.name] = t.value;
    save(); if (t.name === 'leiras') paintSum();
  });
  form.addEventListener('change', (e) => {
    if (!e.target.matches('[data-cfile]')) return;
    for (const f of e.target.files) if (customFiles.length < 3 && /^image\//.test(f.type)) customFiles.push({ name: f.name, url: URL.createObjectURL(f) });
    e.target.value = ''; paintFiles(); paintSum();
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('[data-cerr]', form);
    const miss = !d.nev.trim() || !d.tel.trim() ? 'Add meg a neved és a telefonszámod, hogy vissza tudjunk hívni.'
      : (!d.leiras.trim() && !customFiles.length && !p) ? 'Írj pár szót arról, mit szeretnél – vagy válassz ki egy képet.' : '';
    err.hidden = !miss; err.textContent = miss;
    if (miss) { err.scrollIntoView({ block: 'center' }); return; }
    const summary = [
      'SAJÁT ELKÉPZELÉS', `Gyűrű: ${lab(C_TIPUS, d.tipus)}`, `Anyag: ${lab(C_ANYAG, d.anyag)}`, `Gyémánt: ${lab(C_GYEMANT, d.gyemant)}`,
      ...(d.keret ? [`Keret: ${d.keret}`] : []), ...(p ? ['', 'Kiindulási modell:', cfg ? configText(p, cfg) : `${p.code} – ${p.name}`] : []),
    ].join('\n');
    const n = customFiles.length;
    const res = await store.addInquiry({ type: 'egyedi', name: d.nev, phone: d.tel, email: d.email, day: d.konz ? d.nap : '', message: d.leiras.trim(), images: n,
      productId: p?.id || null, code: p?.code || null, config: cfg ? JSON.parse(JSON.stringify(cfg)) : null, summary, estimate: null });
    if (!res.ok) { err.hidden = false; err.textContent = `${res.error} Telefon: +36 30 984 3090`; err.scrollIntoView({ block: 'center' }); return; }
    customFiles.forEach((f) => URL.revokeObjectURL(f.url)); customFiles = [];
    try { sessionStorage.removeItem(C_KEY); } catch { /* privát mód */ }
    $('.custom', el).innerHTML = `<div class="form form--done custom--done"><p class="kicker">Megvan</p><h2>Köszi, ${esc(d.nev.trim().split(' ').pop())}! Hamarosan hívunk.</h2>
      <pre>${esc(summary)}</pre>${d.leiras.trim() ? `<p class="csum__txt">„${esc(d.leiras.trim())}”</p>` : ''}
      <p><b>Ár:</b> személyes egyeztetés alapján.</p>
      <p class="fine">${sentNote(`Az ötleted megérkezett hozzánk${p ? ', a kiindulási gyűrű adataival együtt' : ''}.`, `Az ötleted bekerült a kezelőfelület „Érdeklődések” menüjébe${p ? ', a kiindulási gyűrű cikkszámával és beállításaival együtt' : ''}.`)}${n ? ` A kiválasztott ${n} kép nem töltődött fel – hozd el az egyeztetésre, vagy küldd el e-mailben.` : ''} Ha sürgős, hívj: <a href="tel:+36309843090">+36 30 984 3090</a>.</p>
      <a class="btn btn--line" href="#/kollekcio">Megnézem a gyűrűket</a></div>`;
    window.scrollTo({ top: 0 });
  });
  paintFiles(); paintSum(); save();
  reveal(el);
}
