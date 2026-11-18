/* ==========================================================================
   Adminfelület – nagy gombok, egyértelmű magyar feliratok, kevés lépés.
   Bemutató: nincs bejelentkezés és szerveroldali jogosultság (külön fejlesztési szakasz).
   ========================================================================== */
import { store } from './store.js';
import { COLORS, STYLES } from './data.js';
import { priceProduct, priceAll, diffPrices, defaultConfig, composition, ft, num, dec, pct, FINENESS } from './engine.js';
import { $, $$, esc, productMedia, toast, modal, M, reduced, dateHu, dayHu } from './ui.js';
import { configText } from './views-public.js';

const S = () => store.get();
const fresh = (el) => { const n = el.cloneNode(false); el.replaceWith(n); return n; };
const clone = (o) => JSON.parse(JSON.stringify(o));
const parseNum = (v) => { const n = Number(String(v).replace(/\s| | /g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };

export const MENU = [
  ['attekintes', 'Áttekintés'],
  ['alapanyag', 'Arany ára'],
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
      <div class="adm__mbar">${page === 'attekintes' ? '<span class="adm__mtitle">Főmenü</span>' : `<a class="adm__back" href="#/admin/attekintes">← Főmenü</a><span class="adm__mtitle">${(MENU.find(([k]) => k === (page === 'gyuru' ? 'gyuruk' : page)) || ['', ''])[1]}</span>`}</div>
      <p class="adm__banner"><b>Bemutató.</b> Az árak kitalált demóértékek, az adatok csak ebben a böngészőben maradnak.</p>
      <div data-page></div>
    </main>
  </div>`;
  const P = $('[data-page]', el);
  ({ attekintes: overview, alapanyag: materials, gyuruk: products, gyuru: productEdit, keplet: formula,
     erdeklodesek: inquiries, elozmenyek: history, beallitasok: settings }[page] || overview)(P, arg);
  if (M() && !reduced()) M().animate(P, { opacity: [0, 1], y: [10, 0] }, { duration: 0.35 });
}

/* ---------- 1. Áttekintés ---------- */
const MENU_HELP = {
  alapanyag: 'Itt írja át az arany árát. Minden gyűrű ára magától frissül.',
  gyuruk: 'Gyűrűk listája, egyedi ár, árlista nyomtatása.',
  keplet: 'Felár, munkadíj, ÁFA. Ritkán kell hozzányúlni.',
  erdeklodesek: 'Akik a weboldalon érdeklődtek vagy időpontot kértek.',
  elozmenyek: 'Mikor, mit változtatott. Itt vissza is állíthatja.',
  beallitasok: 'Kerekítés, védelem, demó visszaállítása.',
};
function overview(el) {
  el = fresh(el);
  const st = S();
  const last = st.history.find((h) => h.kind === 'materials') || st.history[st.history.length - 1];
  const newInq = st.inquiries.filter((q) => q.status === 'uj').length;
  el.innerHTML = `
    <h1 class="adm__h1">Jó napot kívánok!</h1>
    <a class="goldnow" href="#/admin/alapanyag">
      <span class="goldnow__l">Az arany ára most <small>24 karátos, grammonként</small></span>
      <b class="goldnow__v">${ft(st.materials.gold24)}</b>
      <span class="goldnow__m">Utoljára: ${dayHu(last.at)}</span>
      <span class="abtn abtn--gold abtn--xl goldnow__btn">Arany árának módosítása</span>
    </a>
    <h2 class="adm__h2">Mit szeretne csinálni?</h2>
    <div class="menutiles">${MENU.filter(([k]) => k !== 'attekintes' && k !== 'alapanyag').map(([k, t], i) => `
      <a class="menutile" href="#/admin/${k}"><span class="menutile__n">${MENU.findIndex(([x]) => x === k) + 1}</span>
        <span class="menutile__t"><b>${t}${k === 'erdeklodesek' && newInq ? ` <em>${newInq} új</em>` : ''}</b><small>${MENU_HELP[k]}</small></span><span class="menutile__go" aria-hidden="true">›</span></a>`).join('')}
    </div>
    <h2 class="adm__h2">Gyors árszámítás <small>ha valaki telefonon kérdez</small></h2>
    <div class="qcalc" data-qcalc></div>
    <h2 class="adm__h2">Az arany ára az elmúlt hónapokban</h2>
    <div class="note-card note-card--chart">${goldChart(store.goldSeries(), st.materials.gold24, st.materials.gold24)}<p class="hint">Demó előzmények – kitalált adatok a bemutatóhoz.</p></div>`;
  quickCalc($('[data-qcalc]', el));
}

/* Gyors árszámítás: gyűrű kiválasztása, szín, finomság, méret → ár, és rögzíthető ajánlatként. */
function quickCalc(box) {
  const st = S();
  const list = st.products.filter((p) => !p.priceOnRequest).sort((a, b) => a.code.localeCompare(b.code));
  let p = store.product('maz-81184-81185-w') || list[0];
  let cfg = defaultConfig(p);
  const CL = { sarga: 'Sárga', feher: 'Fehér', rose: 'Rozé', ketszinu: 'Fehér–sárga', feherrose: 'Fehér–rozé', sargarose: 'Sárga–rozé' };
  const paint = () => {
    const r = priceProduct(p, cfg, st.materials, st.settings);
    box.innerHTML = `
      <label class="efield"><span>Melyik gyűrű?</span><select class="input input--lg" data-qp>${list.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.code)} – ${esc(x.name)}</option>`).join('')}</select></label>
      <div class="qcalc__row">
        <span class="qcalc__img">${productMedia(p)}</span>
        <div class="qcalc__opts">
          ${p.colors.length > 1 ? `<div><span class="qcalc__lab">Szín</span><div class="qseg">${p.colors.map((c) => `<button type="button" data-qc="${c}" aria-pressed="${c === cfg.color}">${CL[c] || c}</button>`).join('')}</div></div>` : ''}
          <div><span class="qcalc__lab">Finomság</span><div class="qseg">${p.karats.map((k) => `<button type="button" data-qk="${k}" aria-pressed="${k === cfg.karat}">${k} karát</button>`).join('')}</div></div>
          ${p.rings.map((rg, i) => `<div><span class="qcalc__lab">${esc(rg.label)} mérete</span><div class="qstep"><button type="button" data-qs="${i}|-1" aria-label="kisebb">−</button><output>${cfg.rings[i].size}</output><button type="button" data-qs="${i}|1" aria-label="nagyobb">+</button></div></div>`).join('')}
        </div>
      </div>
      <div class="qcalc__price"><span>Ár</span><b>${ft(r.final)}</b><small>bruttó · ebből arany: ${dec(r.pure)} g színarany</small></div>
      <button class="abtn abtn--xl qcalc__save" type="button" data-qsave>Felírom ajánlatnak</button>`;
  };
  box.addEventListener('change', (e) => { if (e.target.matches('[data-qp]')) { p = store.product(e.target.value); cfg = defaultConfig(p); paint(); } });
  box.addEventListener('click', (e) => {
    const c = e.target.closest('[data-qc]'), k = e.target.closest('[data-qk]'), sz = e.target.closest('[data-qs]');
    if (c) cfg.color = c.dataset.qc;
    else if (k) cfg.karat = Number(k.dataset.qk);
    else if (sz) { const [i, d] = sz.dataset.qs.split('|').map(Number); cfg.rings[i].size = Math.min(76, Math.max(44, cfg.rings[i].size + d)); }
    else if (e.target.closest('[data-qsave]')) {
      const r = priceProduct(p, cfg, st.materials, st.settings);
      modal(`<form class="form" data-qf><h2>Ajánlat felírása</h2><p><b>${esc(p.code)}</b> – ${ft(r.final)}</p>
        <label class="field"><span>Ügyfél neve</span><input class="input input--lg" name="nev" required></label>
        <label class="field"><span>Telefonszáma</span><input class="input input--lg" name="tel" type="tel"></label>
        <div class="impact__btns"><button class="abtn abtn--xl" type="button" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" type="submit">Felírom</button></div></form>`, {
        onMount: (mb, close) => mb.querySelector('[data-qf]').addEventListener('submit', (ev) => {
          ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
          if (!d.nev.trim()) return;
          store.addInquiry({ type: 'telefon', name: d.nev, phone: d.tel, productId: p.id, code: p.code, config: clone(cfg), summary: configText(p, cfg), estimate: r.final, status: 'elfogadva', lockedPrice: r.final, lockedAt: new Date().toISOString() });
          close(); toast('Felírva az Érdeklődések közé, rögzített árral.');
        }) });
      return;
    } else return;
    paint();
  });
  paint();
}

/* ---------- Közös vizuális elemek: aranyár-grafikon, árösszetétel-sáv ---------- */
const MON = (iso) => new Date(iso).toLocaleDateString('hu-HU', { month: 'short' }).replace('.', '') + '.';

function goldChart(series, current, draft) {
  const now = Date.now();
  const pts = series.map((x) => ({ t: new Date(x.at).getTime(), v: x.v }));
  if (!pts.length || now - pts[pts.length - 1].t > 864e5) pts.push({ t: now, v: current, today: true });
  const t0 = pts[0].t, t1 = now, span = Math.max(1, t1 - t0);
  const hasDraft = draft !== current;
  const vals = pts.map((x) => x.v).concat(hasDraft ? [draft] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(500, (hi - lo) * 0.18); lo -= pad; hi += pad;
  const W = 560, H = 200, L = 14, R = hasDraft ? 96 : 40, T = 26, B = 30;
  const X = (t) => L + ((t - t0) / span) * (W - L - R);
  const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  // lépcsős vonal: az ár a következő változásig érvényes
  let d = `M${X(pts[0].t).toFixed(1)},${Y(pts[0].v).toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += ` H${X(pts[i].t).toFixed(1)} V${Y(pts[i].v).toFixed(1)}`;
  const area = d + ` V${H - B} H${X(pts[0].t).toFixed(1)} Z`;
  const last = pts[pts.length - 1];
  const dx = W - R + 40;
  return `<svg class="gchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Az arany referenciaárának alakulása">
    <path d="${area}" class="gchart__area"/>
    <path d="${d}" class="gchart__line"/>
    ${(() => { let lastX = -999; const shown = pts.filter((x) => !x.today); return shown.map((x, i) => {
      // a túl közeli feliratokat kihagyjuk (mobilon nem csúsznak egymásra); az utolsó mindig látszik
      const cx = X(x.t), lab = cx - lastX >= 64 || i === shown.length - 1; if (lab) lastX = cx;
      return `<circle cx="${cx.toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="3.5" class="gchart__dot"/>
      ${lab ? `<text x="${cx.toFixed(1)}" y="${(Y(x.v) - 10).toFixed(1)}" class="gchart__v" text-anchor="${i === 0 ? 'start' : 'middle'}">${num(x.v)}</text>
      <text x="${cx.toFixed(1)}" y="${H - 10}" class="gchart__d" text-anchor="${i === 0 ? 'start' : 'middle'}">${MON(new Date(x.t).toISOString())}</text>` : ''}`; }).join(''); })()}
    <text x="${X(t1).toFixed(1)}" y="${H - 10}" class="gchart__d" text-anchor="middle">ma</text>
    ${hasDraft ? `<path d="M${X(last.t).toFixed(1)},${Y(last.v).toFixed(1)} L${dx},${Y(draft).toFixed(1)}" class="gchart__draft"/>
      <circle cx="${dx}" cy="${Y(draft).toFixed(1)}" r="7" class="gchart__new"/>
      <text x="${dx}" y="${(Y(draft) + (draft > last.v ? -14 : 24)).toFixed(1)}" class="gchart__nv" text-anchor="middle">${num(draft)}</text>
      <text x="${dx}" y="${H - 10}" class="gchart__d gchart__d--new" text-anchor="middle">új ár</text>` : `<circle cx="${X(t1).toFixed(1)}" cy="${Y(current).toFixed(1)}" r="5" class="gchart__now"/>`}
  </svg>`;
}

const SEG = [
  ['metal', 'Arany (nemesfém + ötvözet)', 'változik az aranyárral'],
  ['stones', 'Gyémántok', 'a kőáraktól függ'],
  ['labor', 'Munkadíj, kőfoglalás', 'fix összeg'],
  ['other', 'Doboz, tanúsítvány, gravír', 'fix összeg'],
];
/** Árösszetétel-sáv: régi és új ár egymás alatt, ugyanazon a léptéken. */
function compBar(rOld, rNew, Sx, SxNew = Sx) {
  const a = composition(rOld, Sx), b = rNew ? composition(rNew, SxNew) : null;
  const max = Math.max(rOld.final, rNew ? rNew.final : 0);
  const bar = (c, r, label) => `<div class="comp__row"><span class="comp__lab">${label}</span>
    <div class="comp__track"><div class="comp__bar" style="width:${(r.final / max) * 100}%">${SEG.map(([k]) => c[k] > 0.5 ? `<i class="comp__s comp__s--${k}" style="flex:${c[k].toFixed(0)}"></i>` : '').join('')}</div></div>
    <b class="comp__sum">${ft(r.final)}</b></div>`;
  return `<div class="comp">
    ${bar(a, rOld, b ? 'Most' : 'Ár')}${b ? bar(b, rNew, 'Új') : ''}
    <ul class="comp__legend">${SEG.filter(([k]) => a[k] > 0.5 || (b && b[k] > 0.5)).map(([k, l, n]) => {
      const dv = b ? b[k] - a[k] : 0;
      return `<li><i class="comp__s comp__s--${k}"></i><span>${l}<small>${n}</small></span><b>${ft(b ? b[k] : a[k])}${b ? (Math.abs(dv) >= 1 ? ` <em class="${dv > 0 ? 'up' : 'down'}">${dv > 0 ? '+' : '−'}${ft(Math.abs(dv))}</em>` : ' <em class="same">változatlan</em>') : ''}</b></li>`;
    }).join('')}</ul>
    <p class="comp__note">A felár és az ÁFA arányosan benne van az egyes részekben.</p>
  </div>`;
}

/* ---------- 2. Alapanyagárak – a bemutató fő képernyője ---------- */
function materials(el) {
  el = fresh(el);
  const st = S();
  const cur = clone(st.materials);
  const draft = clone(st.materials);
  const lastM = st.history.find((h) => h.kind === 'materials' || h.kind === 'start');
  let selEx = null;

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
    <h1 class="adm__h1">Arany ára</h1>
    <p class="adm__meta">Utoljára módosítva: ${dateHu(lastM.at)}</p>
    <div class="mat mat--simple">
      <section class="goldcard">
        ${field('gold24', '1 gramm 24 karátos arany', 'Ft', 500, '')}
        <div class="quick" role="group" aria-label="Gyors módosítás">
          ${[-3, -1, 1, 3, 5].map((v) => `<button type="button" class="qbtn" data-quick="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)}%</button>`).join('')}
        </div>
      </section>
      <section class="impact" data-impact aria-live="polite"></section>
      <div class="mimpact" data-mimpact hidden><span data-mimpact-t></span><button type="button" data-goimpact></button></div>
      <details class="mat__more">
        <summary>Az arany ára az elmúlt hónapokban</summary>
        <div class="goldcard__chart"><div data-chart></div><p class="hint">Demó előzmények – kitalált adatok.</p></div>
      </details>
      <details class="mat__more">
        <summary>Gyémántok ára <small>darabár</small></summary>
        ${st.materials.diamonds.map((d, i) => field('', `${d.name} · ${d.quality}`, 'Ft/db', 1000, `${st.products.filter((p) => p.rings.some((r) => r.stones && r.stones.cat === d.id)).length} gyűrűben`, `diamonds.${i}.price`)).join('')}
      </details>
      <details class="mat__more">
        <summary>Ötvözőanyagok ára <small>ritkán változik</small></summary>
        ${field('', 'Sárgaarany ötvözet', 'Ft/g', 50, '', 'alloy.sarga')}
        ${field('', 'Fehérarany ötvözet', 'Ft/g', 100, 'palládiumtartalmú', 'alloy.feher')}
        ${field('', 'Rozéarany ötvözet', 'Ft/g', 50, '', 'alloy.rose')}
      </details>
    </div>`;

  const impact = $('[data-impact]', el);
  let confirmBig = false, moreOpen = false;
  const series = store.goldSeries();

  const paint = () => {
    $('[data-chart]', el).innerHTML = goldChart(series, cur.gold24, draft.gold24);
    $$('[data-quick]', el).forEach((b) => b.setAttribute('aria-pressed', String(Math.round(cur.gold24 * (1 + Number(b.dataset.quick) / 100) / 100) * 100 === draft.gold24)));
    const d = diffPrices(st.products, cur, draft, st.settings);
    const changes = changedPaths(cur, draft);
    $$('[data-mfield]', el).forEach((f) => f.classList.toggle('is-changed', changes.some((c) => c.path === f.dataset.mfield)));
    const mi = $('[data-mimpact]', el);
    mi.hidden = !changes.length;
    document.body.classList.toggle('has-mimpact', !!changes.length);
    if (changes.length) $('[data-mimpact-t]', el).innerHTML = `<b>${d.count} gyűrű</b> ára változna, átlagosan <b>${pct(d.avgPct)}</b>`;
    if (!changes.length) {
      const sample = store.product('maz-81184-81185-w');
      impact.className = 'impact impact--idle';
      impact.innerHTML = `<p>Írja át a fenti számot, vagy nyomja meg a + / − gombot. Mentés előtt itt megmutatjuk, mi változik.</p>
        <button class="abtn" type="button" data-demo-gold>Bemutatóhoz: 45 000 Ft</button>`;
      return;
    }
    const big = changes.filter((c) => Math.abs(c.pct) >= st.settings.bigChangePct);
    const examples = [...d.rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5);
    const pref = d.rows.find((x) => x.id === 'maz-81184-81185-w');
    if (pref && !examples.some((x) => x.id === pref.id)) examples.unshift(pref);
    if (!examples.some((x) => x.id === selEx)) selEx = (pref || examples[0])?.id || null;
    const sp = selEx && store.product(selEx);
    impact.className = 'impact impact--on';
    const ex = examples.find((x) => x.id === selEx) || examples[0];
    const gold = changes.find((c) => c.path === 'gold24');
    impact.innerHTML = `
      ${gold ? `<p class="impact__new">Új ár: <b>${num(gold.to)} Ft</b> <em class="${gold.pct > 0 ? 'up' : 'down'}">${pct(gold.pct)}</em></p>` : ''}
      <p class="impact__say"><b>${d.count} gyűrű</b> ára változik, átlagosan <b class="${d.avgPct >= 0 ? 'up' : 'down'}">${pct(d.avgPct)}</b>.</p>
      ${examples.length ? `<ul class="impact__few">${[...d.rows].sort((a, b) => (a.id === 'maz-81184-81185-w' ? -1 : b.id === 'maz-81184-81185-w' ? 1 : Math.abs(a.old - 300000) - Math.abs(b.old - 300000))).slice(0, 3).map((r) => `<li><span>${esc(r.code)}</span><s>${ft(r.old)}</s><b>${ft(r.now)}</b></li>`).join('')}</ul>` : ''}
      ${big.length ? `<label class="confirm"><input type="checkbox" data-confirm ${confirmBig ? 'checked' : ''}><span><b>Nagy változás (${pct(big[0].pct)}).</b> Ellenőriztem, jó a szám.</span></label>` : ''}
      <div class="impact__btns">
        <button class="abtn abtn--xl" type="button" data-cancel>Mégsem</button>
        <button class="abtn abtn--gold abtn--xl" type="button" data-apply ${big.length && !confirmBig ? 'disabled' : ''}>Új árak alkalmazása</button>
      </div>
      <details class="impact__more">
        <summary>Részletek</summary>
        <ul class="impact__chg">${changes.map((c) => `<li><span>${esc(c.label)}</span><b>${num(c.from)} → ${num(c.to)} ${c.unit}</b><em class="${c.pct > 0 ? 'up' : 'down'}">${pct(c.pct)}</em></li>`).join('')}</ul>
        ${examples.length ? `<ul class="impact__ex">${examples.map((r) => `<li><button type="button" data-ex="${r.id}" aria-pressed="${r.id === selEx}"><span class="impact__code">${esc(r.code)}</span><span class="impact__old">${ft(r.old)}</span><span class="impact__arrow">→</span><b>${ft(r.now)}</b><em class="${r.delta > 0 ? 'up' : 'down'}">${r.delta > 0 ? '+' : '−'}${ft(Math.abs(r.delta))}</em></button></li>`).join('')}</ul>
        <button type="button" class="linkbtn" data-all>Mind a ${d.count} gyűrű régi és új ára</button>
        ${sp ? `<h3>Mitől változik? <span>${esc(sp.code)}</span></h3>${compBar(priceProduct(sp, null, cur, st.settings), priceProduct(sp, null, draft, st.settings), st.settings)}` : ''}` : ''}
        <label class="field"><span>Érvényes ettől a naptól</span><input class="input input--lg" type="date" data-valid value="${new Date().toISOString().slice(0, 10)}"></label>
      </details>`;
    const mo = impact.querySelector('.impact__more'); if (mo && moreOpen) mo.open = true;
    mo?.addEventListener('toggle', () => { moreOpen = mo.open; });
  };

  const setVal = (path, v) => {
    if (!Number.isFinite(v) || v < 0) return;
    set(draft, path, Math.round(v));
    const inp = $(`[data-path="${CSS.escape(path)}"]`, el);
    if (inp && document.activeElement !== inp) inp.value = num(get(draft, path));
    paint();
  };

  const allList = () => {
    const d = diffPrices(st.products, cur, draft, st.settings);
    const rows = [...d.rows].sort((a, b) => b.pct - a.pct);
    modal(`<div class="form"><p class="kicker">Előnézet – még nincs alkalmazva</p><h2>Mind a ${d.count} érintett gyűrű</h2>
      <div class="alltable"><table><thead><tr><th>Cikkszám</th><th>Most</th><th>Új</th><th>Változás</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><b>${esc(r.code)}</b><small>${esc(r.name)}</small></td><td>${ft(r.old)}</td><td><b>${ft(r.now)}</b></td><td class="${r.delta > 0 ? 'up' : 'down'}">${r.delta > 0 ? '+' : '−'}${ft(Math.abs(r.delta))}<small>${pct(r.pct)}</small></td></tr>`).join('')}
      </tbody></table></div>
      <p class="fine">Összesen ${d.total > 0 ? '+' : '−'}${ft(Math.abs(d.total))} a katalógus alapáraiban.</p></div>`, { label: 'Érintett gyűrűk', wide: true });
  };

  el.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]');
    if (s) { const path = s.closest('[data-mfield]').dataset.mfield; setVal(path, get(draft, path) + Number(s.dataset.step)); }
    const q = e.target.closest('[data-quick]');
    if (q) { const v = Math.round(cur.gold24 * (1 + Number(q.dataset.quick) / 100) / 100) * 100; setVal('gold24', v); $('#f-gold24', el).value = num(v); }
    const ex = e.target.closest('[data-ex]');
    if (ex) { selEx = ex.dataset.ex; paint(); }
    if (e.target.closest('[data-all]')) allList();
    if (e.target.closest('[data-goimpact]')) impact.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    if (e.target.closest('[data-demo-gold]')) { setVal('gold24', 45000); $('#f-gold24', el).value = num(45000); $('#f-gold24', el).focus(); }
    if (e.target.closest('[data-cancel]')) { document.body.classList.remove('has-mimpact'); materials(el); toast('A módosítást elvetettük – az árak nem változtak.'); }
    if (e.target.closest('[data-apply]')) {
      const valid = $('[data-valid]', el)?.value;
      const sp = selEx && store.product(selEx);
      const before = sp && priceProduct(sp, null, cur, st.settings);
      const d = store.applyMaterials(draft, { validFrom: valid ? new Date(valid).toISOString() : undefined });
      const entry = S().history[0];
      el.innerHTML = `<div class="done">
        <p class="done__mark" aria-hidden="true">✓</p>
        <h1 class="adm__h1">Az új árak érvényben vannak</h1>
        <p class="adm__lead">${d.count} gyűrű ára frissült, átlagosan <b>${pct(d.avgPct)}</b>-kal. A vásárlói oldalon már az új árak látszanak, és bekerült a naplóba is.</p>
        ${sp ? `<div class="done__comp"><h3>${esc(sp.code)}</h3>${compBar(before, priceProduct(sp, null, S().materials, S().settings), S().settings)}</div>` : ''}
        <div class="done__btns">
          <a class="abtn abtn--gold abtn--xl" href="#/kollekcio" data-to-customer>Megnézem a katalógusban</a>
          <button class="abtn abtn--xl" type="button" data-undo="${entry.id}">Visszaállítom a korábbi árakat</button>
          <a class="abtn" href="#/admin/alapanyag">Újabb módosítás</a>
        </div></div>`;
      window.scrollTo({ top: 0 });
      document.body.classList.remove('has-mimpact');
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
const PFILTERS = [['mind', 'Mind'], ['egyedi', 'Egyedi áras'], ['koves', 'Köves'], ['pár', 'Gyűrűpár'], ['arres', 'Alacsony árrés'], ['arnelkul', 'Ár nélkül']];
function products(el) {
  el = fresh(el);
  const st = S();
  const res = Object.fromEntries(st.products.map((p) => [p.id, p.priceOnRequest ? null : priceProduct(p, null, st.materials, st.settings)]));
  let q = '', f = 'mind', sort = 'cikkszam';
  el.innerHTML = `
    <h1 class="adm__h1">Gyűrűk kezelése</h1>
    <p class="adm__lead">Az árak a képletből számolódnak. Egy gyűrűnél rögzíthet egyedi árat is – azt az aranyár változása nem írja felül.</p>
    <div class="ptools">
      <label class="field field--search"><span>Keresés cikkszámra vagy névre</span><input class="input input--lg" data-q placeholder="pl. 81184"></label>
      <div class="ptools__btns"><button class="abtn" type="button" data-print>Árlista nyomtatása</button><button class="abtn" type="button" data-csv>Árlista letöltése (Excel)</button></div>
    </div>
    <div class="pfilter" role="group" aria-label="Szűrés">${PFILTERS.map(([k, l]) => `<button type="button" data-pf="${k}" aria-pressed="${k === f}">${l}</button>`).join('')}
      <label class="pfilter__sort"><span>Sorrend</span><select class="input" data-psort><option value="cikkszam">Cikkszám</option><option value="ar-le">Ár (drágább elöl)</option><option value="ar-fel">Ár (olcsóbb elöl)</option><option value="elteres">Eltérés a mostani weboldali ártól</option></select></label></div>
    <p class="adm__meta" data-pcount></p>
    <div class="plist" data-list></div>`;
  const rows = () => {
    let list = st.products.filter((p) => (p.code + ' ' + p.name).toLowerCase().includes(q)).filter((p) =>
      f === 'mind' || (f === 'egyedi' && (p.override || p.minPrice)) || (f === 'koves' && p.rings.some((r) => r.stones)) || (f === 'pár' && p.kind === 'p') || (f === 'arres' && res[p.id]?.lowMargin) || (f === 'arnelkul' && p.priceOnRequest));
    const fv = (p, d) => res[p.id] ? res[p.id].final : d;
    const dev = (p) => p.listaAr && res[p.id] ? (res[p.id].final - p.listaAr) / p.listaAr : 0;
    if (sort === 'ar-le') list.sort((a, b) => fv(b, -1) - fv(a, -1));
    if (sort === 'ar-fel') list.sort((a, b) => fv(a, Infinity) - fv(b, Infinity));
    if (sort === 'elteres') list.sort((a, b) => Math.abs(dev(b)) - Math.abs(dev(a)));
    return list;
  };
  const paint = () => {
    const list = rows();
    $('[data-pcount]', el).textContent = `${list.length} gyűrű`;
    $('[data-list]', el).innerHTML = list.slice(0, limit).map((p) => {
      const r = res[p.id];
      if (!r) return `<a class="prow" href="#/admin/gyuru/${p.id}">
        <span class="prow__img">${productMedia(p)}</span>
        <span class="prow__txt"><b>${esc(p.code)}</b><span>${esc(p.name)}</span><span class="prow__tags"><em class="tag tag--warn">az eredeti oldalon nincs ár</em></span></span>
        <span class="prow__price"><b>egyeztetés</b><small>rögzített árral bekapcsolható</small></span>
        <span class="abtn">Szerkesztés</span></a>`;
      const dv = p.listaAr ? ((r.final - p.listaAr) / p.listaAr) * 100 : null;
      return `<a class="prow" href="#/admin/gyuru/${p.id}">
        <span class="prow__img">${productMedia(p)}</span>
        <span class="prow__txt"><b>${esc(p.code)}</b><span>${esc(p.name)}</span>
          <span class="prow__tags">${p.override ? `<em class="tag tag--blue">${p.override.type === 'fixed' ? 'rögzített ár' : `képlet ${pct(p.override.value)}`}</em>` : '<em class="tag tag--formula">képletből</em>'}${r.lowMargin ? '<em class="tag tag--warn">alacsony árrés</em>' : ''}${p.minPrice ? '<em class="tag">minimumár</em>' : ''}</span></span>
        <span class="prow__price"><b>${ft(r.final)}</b>
          <small>${p.listaAr ? `weboldalon most: ${ft(p.listaAr)}${Math.abs(dv) >= 0.5 ? ` (${pct(dv)})` : ''}` : 'demótermék'}</small></span>
        <span class="abtn">Szerkesztés</span>
      </a>`;
    }).join('') + (list.length > limit ? `<button class="abtn abtn--xl plist__more" type="button" data-pmore>Továbbiak mutatása (még ${list.length - limit})</button>` : '') || '<p>Nincs találat.</p>';
  };
  let limit = 30;
  const csv = () => {
    const sep = ';';
    const lines = [['Cikkszám', 'Megnevezés', 'Kalkulált ár (Ft)', 'Árforrás', 'Becsült tömeg (g)', 'Weboldali ár most (Ft)'].join(sep)];
    st.products.forEach((p) => { const r = res[p.id]; lines.push([p.code, p.name, r ? r.final : 'egyeztetés', r ? (r.source === 'keplet' ? 'képlet' : r.source === 'rogzitett' ? 'rögzített' : 'módosított') : '', r ? String(r.grams).replace('.', ',') : '', p.listaAr || ''].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(sep)); });
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `karikagyuru-arlista-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Az árlista letöltve – Excelben megnyitható.');
  };
  el.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { q = e.target.value.toLowerCase().trim(); paint(); } });
  el.addEventListener('change', (e) => { if (e.target.matches('[data-psort]')) { sort = e.target.value; paint(); } });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-pmore]')) { limit += 30; paint(); return; }
    const b = e.target.closest('[data-pf]');
    if (b) { limit = 30; f = b.dataset.pf; $$('[data-pf]', el).forEach((x) => x.setAttribute('aria-pressed', x === b)); paint(); }
    if (e.target.closest('[data-csv]')) csv();
    if (e.target.closest('[data-print]')) printList(st, res);
  });
  paint();
}

function printList(st, res) {
  document.getElementById('printsheet')?.remove();
  const d = document.createElement('div');
  d.id = 'printsheet';
  d.innerHTML = `<header><img src="img/logo.png" alt="Karikagyuru.com" width="135"><div><h1>Árlista</h1><p>${dayHu(new Date().toISOString())} · 24K színarany: ${ft(st.materials.gold24)}/g (demó)</p></div></header>
    <table><thead><tr><th>Cikkszám</th><th>Megnevezés</th><th>Anyag</th><th>Ár (bruttó)</th></tr></thead><tbody>
    ${st.products.map((p) => `<tr><td>${esc(p.code)}</td><td>${esc(p.name)}</td><td>${p.baseKarat === 925 ? 'ezüst 925' : (COLORS[p.baseColor]?.label || '') + ', 14K'}${p.rings.some((r) => r.stones) ? ', gyémánttal' : ''}</td><td>${res[p.id] ? ft(res[p.id].final) : 'egyeztetés'}</td></tr>`).join('')}
    </tbody></table><p class="ps__note">Tájékoztató árak alapméretben. A végleges ár a személyes egyeztetésen készül. Bemutató – kitalált alapanyagárakból számolva.</p>`;
  document.body.append(d);
  setTimeout(() => { window.print(); }, 50);
  addEventListener('afterprint', () => d.remove(), { once: true });
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
          ${p.listaAr ? `<p class="hint">A karikagyuru.com-on jelenleg feltüntetett ár: <b>${ft(p.listaAr)}</b> (valós, összehasonlításhoz).</p>` : `<p class="warn">Ennél a modellnél az eredeti oldalon nincs ár, ezért a vásárlói oldalon „egyedi ajánlat” szerepel. Adja meg a tömeget, vagy rögzített árat – mentés után megjelenik az ár.</p>`}
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
      if (p.priceOnRequest && (p.override?.type === 'fixed' || p.rings.some((r) => r.weight > 0))) p.priceOnRequest = false;
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
const HELP = {
  markupMetal: 'Ennyi százalékot tesz rá a fém, a munkadíj és a fix díjak összegére.',
  markupStones: 'A gyémántok beszerzési árára tett felár.',
  vatPct: 'Az árak bruttóban jelennek meg.',
  lossPct: 'Öntésnél, csiszolásnál elvesző fém – ennyivel több aranyat számol.',
  settingPerStone: 'A kövek befoglalásának díja kövenként.',
  engravingPrice: 'Gyűrűnként, ha a vásárló kér gravírozást.',
  boxCost: 'Minden termékhez egyszer.',
  certCost: 'Csak a köves termékekhez, egyszer.',
  density18: 'Ugyanaz a modell 18 karátban ennyiszer nehezebb (a 18K arany sűrűbb).',
};
function formula(el) {
  el = fresh(el);
  const st = S();
  const d = clone(st.settings);
  let sampleId = 'maz-81184-81185-w';
  const f = (k, label, unit) => `<label class="efield"><span>${label}<small>${HELP[k] || ''}</small></span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="${k}" value="${String(d[k]).replace('.', ',')}"><i>${unit}</i></span></label>`;
  // munkadíj stílusonként: a leggyakoribb érték
  const byStyle = Object.keys(STYLES).map((k) => {
    const ps = st.products.filter((p) => p.style === k);
    const vals = ps.flatMap((p) => p.rings.map((r) => r.labor));
    const mode = vals.sort((a, b) => vals.filter((x) => x === b).length - vals.filter((x) => x === a).length)[0] || 0;
    return { k, label: STYLES[k], ids: ps.map((p) => p.id), labor: mode };
  }).filter((x) => x.ids.length);

  el.innerHTML = `
    <h1 class="adm__h1">Árképletek és munkadíjak</h1>
    <p class="adm__lead">Itt állítható, hogyan lesz az alapanyagárból eladási ár. Ritkán kell hozzányúlni – a mindennapi teendő az <a href="#/admin/alapanyag">Alapanyagárak</a> menü.</p>
    <div class="formula">
      <p class="formula__eq"><span>Nemesfém</span>+<span>ötvözőanyag</span>+<span>drágakövek</span>+<span>munkadíj</span>+<span>egyéb</span>+<span>felár</span>+<span>ÁFA</span>=<b>kalkulált ár</b></p>
      <p class="hint">Színarany-tartalom: 14K = 58,5%, 18K = 75%. A munkadíj fix összeg, az arany árától nem változik. A gyémánt darabár × kőszám alapján számolódik, nem grammra.</p>
    </div>
    <div class="edit">
      <div class="edit__form">
        <section class="ebox"><h2>Felárak és adó</h2><div class="egrid">
          ${f('markupMetal', 'Felár a fémre és munkára', '%')}${f('markupStones', 'Felár a kövekre', '%')}
          ${f('vatPct', 'ÁFA', '%')}${f('lossPct', 'Gyártási veszteség', '%')}
        </div></section>
        <section class="ebox"><h2>Fix díjak</h2><div class="egrid">
          ${f('settingPerStone', 'Kőfoglalás', 'Ft/kő')}${f('engravingPrice', 'Gravírozás', 'Ft/gyűrű')}
          ${f('boxCost', 'Díszdoboz', 'Ft/termék')}${f('certCost', 'Kőtanúsítvány', 'Ft/köves termék')}
          ${f('density18', '18K tömegszorzó', '×')}
        </div></section>
        <div class="edit__btns"><a class="abtn abtn--xl" href="#/admin/attekintes">Mégsem</a><button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button></div>
        <section class="ebox"><h2>Munkadíj stílusonként</h2>
          <p class="hint">Egy mozdulattal átírja az adott stílusú összes gyűrű munkadíját (gyűrűnként). Az egyes gyűrűk utána is külön állíthatók.</p>
          <div class="labor">${byStyle.map((x) => `<div class="labor__row" data-style="${x.k}">
            <span class="labor__name"><b>${x.label}</b><small>${x.ids.length} termék · most jellemzően ${ft(x.labor)}/gyűrű</small></span>
            <span class="efield__in"><input class="input input--lg" inputmode="numeric" data-labor="${x.k}" value="${num(x.labor)}"><i>Ft</i></span>
            <button class="abtn" type="button" data-apply-labor="${x.k}">Alkalmazás</button></div>`).join('')}</div>
        </section>
      </div>
      <aside class="edit__calc" data-calc></aside>
    </div>`;

  const calc = () => {
    const old = priceAll(st.products, st.materials, st.settings);
    const now = priceAll(st.products, st.materials, d);
    const changed = Object.keys(now).filter((k) => now[k] !== old[k]);
    const sample = store.product(sampleId);
    const r0 = priceProduct(sample, null, st.materials, st.settings), r1 = priceProduct(sample, null, st.materials, d);
    const b = r1.breakdown;
    const step = (l, v, cls = '') => `<div class="${cls}"><dt>${l}</dt><dd>${ft(v)}</dd></div>`;
    $('[data-calc]', el).innerHTML = `<h2>Hatás és példa</h2>
      <p class="impact__n"><b>${changed.length}</b> gyűrű ára változna${changed.length ? '' : ' – nincs módosítás'}.</p>
      <label class="efield"><span>Példa gyűrű</span><select class="input input--lg" data-sample>${st.products.map((p) => `<option value="${p.id}" ${p.id === sampleId ? 'selected' : ''}>${esc(p.code)}</option>`).join('')}</select></label>
      ${compBar(r0, JSON.stringify(d) !== JSON.stringify(st.settings) ? r1 : null, st.settings, d)}
      <h3>Lépésről lépésre</h3>
      <dl class="calc-dl calc-dl--steps">
        ${step(`Színarany: ${dec(r1.pure)} g × ${ft(st.materials.gold24)}/g + ${dec(d.lossPct)}% veszteség`, b.metal)}
        ${step('Ötvözőanyag', b.alloy)}${b.stones ? step('Gyémántok', b.stones) : ''}
        ${step('Munkadíj' + (b.setting ? ' + kőfoglalás' : ''), b.labor + b.setting)}${step('Doboz, tanúsítvány, gravír', b.other + b.engraving)}
        ${step('Önköltség', b.cost, 'sum')}
        ${step(`+ felár (${dec(d.markupMetal)}% / kő ${dec(d.markupStones)}%)`, b.net - b.cost)}
        ${step(`+ ÁFA ${dec(d.vatPct)}%`, b.gross - b.net)}
        ${step(`Kalkulált ár, ${num(d.roundTo)} Ft-ra kerekítve`, r1.calculated, 'sum')}
      </dl>
      <p class="${r1.lowMargin ? 'warn' : 'ok'}">Árrés: ${dec(Math.round(r1.marginPct * 10) / 10)}%${r1.lowMargin ? ` – kevesebb a ${d.minMarginPct}%-os minimumnál!` : ''}</p>`;
  };
  el.addEventListener('input', (e) => { const k = e.target.dataset.s; if (k) { const v = parseNum(e.target.value); if (Number.isFinite(v)) { d[k] = v; calc(); } } });
  el.addEventListener('change', (e) => { if (e.target.matches('[data-sample]')) { sampleId = e.target.value; calc(); } });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-save]')) { store.updateSettings(d, 'Árképlet és díjak módosítva'); toast('Az árképlet mentve, az árak újraszámolódtak.'); formula(el); }
    const al = e.target.closest('[data-apply-labor]');
    if (al) {
      const x = byStyle.find((y) => y.k === al.dataset.applyLabor);
      const v = parseNum($(`[data-labor="${x.k}"]`, el).value);
      if (!Number.isFinite(v) || v < 0) return;
      const old = priceAll(st.products.filter((p) => x.ids.includes(p.id)), st.materials, st.settings);
      const tmp = st.products.filter((p) => x.ids.includes(p.id)).map((p) => { const c = clone(p); c.rings.forEach((r) => (r.labor = v)); return c; });
      const now = priceAll(tmp, st.materials, st.settings);
      const n = tmp.filter((p) => now[p.id] !== old[p.id]).length;
      const avg = tmp.reduce((a, p) => a + (now[p.id] - old[p.id]) / old[p.id], 0) / tmp.length * 100;
      modal(`<div class="form"><h2>${x.label} gyűrűk munkadíja</h2><p>Mind a ${x.ids.length} „${x.label.toLowerCase()}” gyűrű munkadíja <b>${ft(v)}</b> lesz gyűrűnként. <b>${n} gyűrű</b> ára változik, átlagosan <b>${pct(avg)}</b>.</p>
        <div class="impact__btns"><button class="abtn abtn--xl" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" data-ok>Alkalmazom</button></div></div>`,
        { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); store.updateMany(x.ids, (p) => p.rings.forEach((r) => (r.labor = v)), `Munkadíj (${x.label.toLowerCase()}): ${ft(v)}/gyűrű`); toast(`${n} gyűrű ára frissült.`); formula(el); } });
    }
  });
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
        <header><b>${esc(q.name)}</b><span class="badge">${STATUS[q.status]}</span><span class="hint">${dateHu(q.at)} · ${q.type === 'konzultacio' ? 'időpontot kér' : q.type === 'telefon' ? 'telefonos ajánlat' : 'érdeklődés'}${q.day ? ` · ${dayHu(q.day)}` : ''}</span></header>
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
