/* ==========================================================================
   Adminfelület – nagy gombok, egyértelmű magyar feliratok, kevés lépés.
   Szerveroldali mentés és bejelentkezés: services/karikagyuru-api (bekötés: js/api.js).
   ========================================================================== */
import { api, onApi, login, logout, settle, uploadPhoto } from './api.js';
import { store } from './store.js';
import { COLORS, STYLES, SITES, SRC_LABEL, EXAMPLE_WEIGHTS } from './data.js';
import { readiness, optionValues, optionReason, priceProduct, priceAll, diffPrices, defaultConfig, composition, ft, num, dec, pct, METALS, METAL_ORDER, isGold, diamond, refPrice, refWeight, exampleRing, allowedCats, sizeSfx, ctFmt, sizeRange } from './engine.js';
import { $, $$, esc, productMedia, toast as uiToast, modal, M, reduced, dateHu, dayHu } from './ui.js';
/* Szerver módban a „Mentve” csak a szerver visszaigazolása után igaz: addig „Mentés folyamatban”. */
const toast = (html, o) => uiToast(api.mode === 'server' && api.admin && /^Mentve/.test(html) ? html.replace(/^Mentve:?/, 'Mentés folyamatban:') : html, o);
import { configText } from './views-public.js';

const S = () => store.get();
/** Adatforrás-jelölés: jóváhagyott / ügyfél példája / megerősítendő / demó. */
export const srcBadge = (src) => src ? `<span class="src src--${src}" title="Adatforrás">${SRC_LABEL[src] || src}</span>` : '';
const ROUND_OPTS = [1, 10, 100, 500, 1000];
const roundSelect = (v) => `<select class="input input--lg" data-s="roundTo" data-round>${ROUND_OPTS.map((x) => `<option value="${x}" ${v === x ? 'selected' : ''}>${x === 1 ? 'nincs kerekítés (egész forint)' : 'felfelé ' + num(x) + ' Ft-ra'}</option>`).join('')}</select>`;
const roundLabel = (v) => (v > 1 ? `felfelé ${num(v)} Ft-ra` : 'nincs kerekítés');
/** Nyers számított ár és kerekített végső ár külön sorban. */
const rawRows = (r, roundTo, row) => r.final === null ? '' : `${row('Számított ár (nyers)', r.raw, 'sum')}${row(`Kerekítés: ${roundLabel(roundTo)}`, r.calculated - r.raw, 'rnd')}${row('Kerekített ár', r.calculated, 'sum')}`;
const msrc = (M, path) => { const m = /^diamonds\.(\d+)\./.exec(path); return m ? M.diamonds[+m[1]]?.src : (M.src || {})[path]; };
const fresh = (el) => { const n = el.cloneNode(false); el.replaceWith(n); return n; };
const clone = (o) => JSON.parse(JSON.stringify(o));
const parseNum = (v) => { const n = Number(String(v).replace(/\s| | /g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };

export const MENU = [
  ['attekintes', 'Főmenü'],
  ['alapanyag', 'Árak'],
  ['gyuruk', 'Gyűrűk'],
  ['fotok', 'Fotók'],
  ['szabalyok', 'Szabályok'],
  ['erdeklodesek', 'Érdeklődések'],
];
export const MENU_EXTRA = [
  ['sorban', 'Jóváhagyás sorban'],
  ['arszamitas', 'Árszámítás'],
  ['keplet', 'Felárak és munkadíjak'],
  ['elozmenyek', 'Árváltozások naplója'],
  ['jovahagyas', 'Jóváhagyásra vár'],
  ['beallitasok', 'Beállítások'],
];
const ALLMENU = MENU.concat(MENU_EXTRA);

/* ---------- Szerver mód: mentésjelző, belépés, kilépés ---------- */
function syncText() {
  if (api.save === 'pending') return '<span class="sync sync--wait">Mentés folyamatban…</span>';
  if (api.save === 'error') return `<span class="sync sync--err">${esc(api.error)}</span>`;
  if (api.save === 'saved' && api.savedAt) return `<span class="sync sync--ok">Mentve a szerverre ${api.savedAt.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>`;
  return `<span class="sync">Szerveres mentés bekapcsolva · ${api.version}. változat</span>`;
}
let lastSave = 'idle';
onApi(() => {
  $$('[data-sync]').forEach((n) => { n.innerHTML = syncText(); });
  if (api.save === 'error' && lastSave !== 'error') uiToast(`<b>Nincs mentve.</b> ${esc(api.error)}`, { ms: 12000 });
  if (api.save === 'saved' && lastSave === 'pending') uiToast('<b>Mentve a szerverre.</b>', { ms: 3500 });
  lastSave = api.save;
});
document.addEventListener('click', async (e) => {
  if (!e.target.closest('[data-logout]')) return;
  await settle(); await logout(); toast('Kilépett.'); location.hash = '#/';
});

export function blockedView(el, msg) {
  el.innerHTML = `<div class="login"><div class="login__box login__box--err" data-blocked role="alert">
    <img src="img/logo-jel.png" alt="" width="88" height="64">
    <h1>A kezelőfelület most nem használható</h1>
    <p>${esc(msg || 'A szerver nem érhető el, ezért a módosítások nem menthetők.')}</p>
    <p>Amit most lát a weboldalon, az a szerveren utoljára sikeresen mentett állapot.</p>
    <button class="abtn abtn--gold abtn--xl" type="button" onclick="location.reload()">Újratöltés</button>
    <a class="adm__site" href="#/">← Vissza a weboldalra</a>
  </div></div>`;
}

export function loginView(el, done, msg = '') {
  el.innerHTML = `<div class="login"><form class="login__box" data-login novalidate>
    <img src="img/logo-jel.png" alt="" width="88" height="64">
    <h1>Kezelőfelület</h1>
    ${msg ? `<p class="form__err" data-lmsg role="alert">${esc(msg)}</p>` : ''}
    <p>Lépjen be a jelszavával.</p>
    <label class="field"><span>Jelszó</span><input class="input input--lg" type="password" name="pw" autocomplete="current-password" required></label>
    <p class="form__err" data-lerr hidden></p>
    <button class="abtn abtn--gold abtn--xl" type="submit">Belépés</button>
    <a class="adm__site" href="#/">← Vissza a weboldalra</a>
  </form></div>`;
  const f = $('[data-login]', el); $('input', f).focus();
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = $('button', f), er = $('[data-lerr]', f);
    b.disabled = true; er.hidden = true;
    const r = await login(f.pw.value);
    b.disabled = false;
    if (!r.ok) { er.textContent = r.error; er.hidden = false; f.pw.select(); return; }
    done();
  });
}

export function adminShell(el, page, arg) {
  const newInq = S().inquiries.filter((q) => q.status === 'uj').length;
  el.innerHTML = `
  <div class="adm">
    <aside class="adm__nav" aria-label="Admin menü">
      <a class="adm__site" href="#/">← Vissza a weboldalra</a>
      <p class="adm__brand"><img src="img/logo-jel.png" alt="" width="176" height="127">Karikagyuru.com<span>Kezelőfelület</span></p>
      ${api.mode === 'server' && api.admin ? `<p class="adm__sync" data-sync aria-live="polite">${syncText()}</p><button class="adm__logout" type="button" data-logout>Kilépés</button>` : ''}
      <nav><ol>${MENU.map(([k, t]) => `<li><a href="#/admin/${k}" ${page === k || (page === 'gyuru' && k === 'gyuruk') ? 'aria-current="page"' : ''}>${t}${k === 'erdeklodesek' && newInq ? `<em>${newInq}</em>` : ''}</a></li>`).join('')}</ol>
        <p class="adm__navx">További</p>
        <ul class="adm__navsub">${MENU_EXTRA.map(([k, t]) => `<li><a href="#/admin/${k}" ${page === k ? 'aria-current="page"' : ''}>${t}</a></li>`).join('')}</ul></nav>
    </aside>
    <main class="adm__main" id="adm-main">
      ${api.mode === 'server' && api.admin ? `<div class="adm__syncm"><p class="adm__sync adm__sync--m" data-sync aria-live="polite">${syncText()}</p><button class="adm__logout adm__logout--m" type="button" data-logout>Kilépés</button></div>` : ''}
      <div class="adm__mbar">${page === 'attekintes' ? '<span class="adm__mtitle">Főmenü</span><a class="adm__site adm__site--m" href="#/">Weboldal →</a>' : `<a class="adm__back" href="#/admin/attekintes">← Főmenü</a><span class="adm__mtitle">${(ALLMENU.find(([k]) => k === (page === 'gyuru' ? 'gyuruk' : page)) || ['', ''])[1]}</span>`}</div>
      <div data-page></div>
    </main>
  </div>`;
  const P = $('[data-page]', el);
  ({ attekintes: overview, alapanyag: materials, arszamitas: priceCalc, gyuruk: products, gyuru: productEdit, keplet: formula,
     erdeklodesek: inquiries, elozmenyek: history, beallitasok: settings, jovahagyas: approvals, fotok: photos, szabalyok: rulesPage, sorban: queue }[page] || overview)(P, arg);
  if (M() && !reduced()) M().animate(P, { opacity: [0, 1], y: [10, 0] }, { duration: 0.35 });
}

/* ---------- 1. Áttekintés ---------- */
const MENU_HELP = {
  sorban: 'Gyűrűnként átnézi és jóváhagyja az adatokat. Jóváhagyás után működik rajta az online árszámítás.',
  alapanyag: 'Itt írja át az arany árát. Minden gyűrű ára magától frissül.',
  gyuruk: 'Gyűrűk listája, egyedi ár, árlista nyomtatása.',
  keplet: 'Felár, munkadíj, ÁFA. Ritkán kell hozzányúlni.',
  erdeklodesek: 'Akik a weboldalon érdeklődtek vagy időpontot kértek.',
  elozmenyek: 'Mikor, mit változtatott. Itt vissza is állíthatja.',
  beallitasok: 'Kerekítés, védelem, adattárolás, alapállapot.',
};
function pendingCount(st) {
  const M = st.materials, Sx = st.settings;
  return Object.keys(MAT_LABEL).filter((k) => (M.src || {})[k] !== 'jovahagyott').length
    + M.diamonds.filter((d) => d.src !== 'jovahagyott').length
    + Object.keys(SET_LABEL).filter((k) => (Sx.src || {})[k] !== 'jovahagyott').length
    + st.products.filter((p) => !p.approved).length;
}
function overview(el) {
  el = fresh(el);
  const st = S();
  const newInq = st.inquiries.filter((q) => q.status === 'uj').length;
  const tile = (href, title, value, help, cls = '') => `<a class="bigtile ${cls}" href="${href}"><b>${title}</b><span class="bigtile__v">${value}</span><small>${help}</small></a>`;
  el.innerHTML = `
    <h1 class="adm__h1">Jó napot kívánok!</h1>
    <p class="adm__lead">Mit szeretne csinálni?</p>
    <div class="bigtiles bigtiles--5">
      ${tile('#/admin/alapanyag', '1. Árak módosítása', st.settings.pricingMode === 'gramm' ? `${ft(st.materials.sellPerGram.au14)}<i>/g · 14K</i>` : `${ft(st.materials.gold24)}<i>/g</i>`, 'Átírja a grammárat, és minden gyűrű ára frissül.', 'bigtile--gold')}
      ${tile('#/admin/gyuruk', '2. Gyűrűk', `${st.products.length} db`, 'Megnézés, szerkesztés, új gyűrű.')}
      ${tile('#/admin/fotok', '3. Fotók', `${st.products.filter((p) => !p.img).length ? st.products.filter((p) => !p.img).length + ' kép hiányzik' : 'képek cseréje'}`, 'Új fénykép feltöltése egy gyűrűhöz.')}
      ${tile('#/admin/sorban', '4. Gyűrűk jóváhagyása', `${st.products.filter((p) => p.approved).length} / ${st.products.length} jóváhagyva`, 'Sorban, egyenként: a jóváhagyott gyűrűn működik az online árszámítás.')}
      ${tile('#/admin/erdeklodesek', '5. Érdeklődések', newInq ? `${newInq} új` : 'nincs új', 'Akik írtak vagy időpontot kértek.', newInq ? 'bigtile--alert' : '')}
    </div>
    <div class="smalltiles">
      ${tile('#/admin/arszamitas', 'Árszámítás', 'Mennyibe kerül?', 'Ha valaki telefonon kérdezi.')}
      ${tile('#/admin/keplet', 'Felárak és díjak', st.settings.pricingMode === 'gramm' ? 'grammár szerint' : `${dec(st.settings.markupMetal)}% felár`, 'Számítási mód, kerekítés, díjak.')}
      ${tile('#/admin/elozmenyek', 'Árváltozások naplója', `${st.history.length} bejegyzés`, 'Mikor, mit változtatott. Visszaállítható.')}
      ${tile('#/admin/jovahagyas', 'Jóváhagyásra vár', `${pendingCount(st)} adat`, 'Még nem végleges értékek.', pendingCount(st) ? 'smalltile--warn' : '')}
      ${tile('#/admin/beallitasok', 'Beállítások', st.settings.roundTo > 1 ? `${num(st.settings.roundTo)} Ft-ra kerekít` : 'nincs kerekítés', 'Védelem, adattárolás.')}
    </div>
    <div class="ovcols">
      <section class="ovbox"><h2>Legutóbbi árváltozások</h2>
        <ul>${st.history.slice(0, 4).map((h) => `<li><span>${dayHu(h.at)}</span><b>${esc(h.title)}</b>${h.count ? `<small>${h.count} gyűrű ára változott</small>` : ''}</li>`).join('')}</ul>
        <a class="linkbtn" href="#/admin/elozmenyek">Összes változás</a></section>
      <section class="ovbox"><h2>Legutóbbi érdeklődések</h2>
        ${st.inquiries.length ? `<ul>${st.inquiries.slice(0, 4).map((q) => `<li><span>${dayHu(q.at)}${q.status === 'uj' ? ' · <em>új</em>' : ''}</span><b>${esc(q.name)}</b>${q.code ? `<small>${esc(q.code)}${q.estimate ? ' · ' + ft(q.lockedPrice || q.estimate) : ''}</small>` : ''}</li>`).join('')}</ul>`
          : '<p class="hint">Még nincs érdeklődés. A vásárlói oldalon a gyűrűknél lévő „Érdeklődés” gombbal küldhető.</p>'}
        <a class="linkbtn" href="#/admin/erdeklodesek">Összes érdeklődés</a></section>
    </div>
    ${store.goldSeries().length > 2 ? `<section class="ovbox ovbox--chart"><h2>A 24K arany ára az itt rögzített változások szerint</h2>${goldChart(store.goldSeries(), st.materials.gold24, st.materials.gold24)}</section>` : ''}`;
}

function priceCalc(el) {
  el = fresh(el);
  el.innerHTML = `<h1 class="adm__h1">Árszámítás</h1><p class="adm__lead">Válassza ki a gyűrűt, és állítsa be, amit az ügyfél kér.</p><div class="qcalc" data-qcalc></div>
    <div class="xwrap" data-examples></div>`;
  quickCalc($('[data-qcalc]', el));
  goldsmithExamples($('[data-examples]', el));
}

/* ---------- Jóváhagyásra vár: mi ügyfélpélda, mi demó, mi jóváhagyott ---------- */
const MAT_LABEL = { gold24: '24K arany alapanyagára', platinum: 'Platina alapanyagára', palladium: 'Palládium alapanyagára', titanium: 'Titán alapanyagára',
  'sellPerGram.au14': '14K kész gyűrű grammára', 'sellPerGram.au18': '18K kész gyűrű grammára', 'sellPerGram.pt': 'Platina kész gyűrű grammára',
  'sellPerGram.pd': 'Palládium kész gyűrű grammára', 'sellPerGram.ti': 'Titán: munkaalapú ár (nem grammár) – szabály kell' };
const SET_LABEL = { pricingMode: 'Árképzési mód (grammár szerint)', sizeMethod: 'Méret hatása (tömeg arányos a mérettel)', density: 'Tömegarányok anyagonként (4,8 / 5,4 / 6,9 / 4,0 / 1,5 g)',
  stonesGross: 'A kő darabára végső ár (nincs rá felár)', settingPerStone: 'Kőfoglalás díja', engravingPrice: 'Gravírozás díja', boxCost: 'Díszdoboz', certCost: 'Kőtanúsítvány',
  roundTo: 'Kerekítés', vatPct: 'ÁFA', stoneEdgeMm: 'Kő és gyűrűszél közti perem', stoneGapMm: 'Kövek közti hely körbe foglalásnál',
  lossPct: 'Gyártási veszteség (költségalapú mód)', laborFactor: 'Munkadíj-szorzók (költségalapú mód)', markupMetal: 'Felár fémre (költségalapú mód)', markupStones: 'Felár kövekre (költségalapú mód)' };
const valOf = (o, path) => path.split('.').reduce((x, k) => x?.[k], o);
function approvals(el) {
  el = fresh(el);
  const st = S();
  const M = st.materials, Sx = st.settings;
  const fmtSet = (k) => { const v = Sx[k]; if (typeof v === 'object') return Object.entries(v).map(([m, x]) => `${METALS[m]?.short || m}: ${dec(Math.round(x * 1000) / 1000)}`).join(' · ');
    if (k === 'pricingMode') return v === 'gramm' ? 'grammár szerint' : 'költség szerint'; if (k === 'sizeMethod') return v === 'tomeg' ? 'tömeg szerint' : 'árarányos';
    if (k === 'stonesGross') return v === false ? 'nem' : 'igen'; if (/Mm$/.test(k)) return dec(v) + ' mm'; if (/Pct|^markup/.test(k)) return dec(v) + '%'; return ft(v); };
  const row = (kind, key, label, value, src, note = '') => `<li class="aprow aprow--${src}"><span class="aprow__l"><b>${label}</b><small>${value}${note ? ` · ${note}` : ''}</small></span>${srcBadge(src)}
    ${src === 'jovahagyott' ? '' : `<button class="abtn" type="button" data-appr="${kind}|${key}" data-lab="${esc(label)}" ${src === 'bizonytalan' && kind === 'diamond' ? 'disabled title="Előbb adjon meg árat az Árak oldalon"' : ''}>Jóváhagyom</button>`}</li>`;
  const mats = Object.keys(MAT_LABEL).map((k) => row('materials', k, MAT_LABEL[k], valOf(M, k) == null ? 'nincs ár' : ft(valOf(M, k)) + '/g', (M.src || {})[k] || 'demo'));
  const dias = M.diamonds.map((d) => row('diamond', d.id, `${d.name} (${d.quality})`, d.price == null ? 'nincs ár → egyedi ajánlat' : ft(d.price) + '/db', d.src || 'demo', d.note ? esc(d.note) : ''));
  const sets = Object.keys(SET_LABEL).map((k) => row('settings', k, SET_LABEL[k], fmtSet(k), (Sx.src || {})[k] || 'demo'));
  const prods = st.products.filter((p) => !p.approved);
  const count = (arr) => arr.filter((h) => !h.includes('aprow--jovahagyott')).length;
  el.innerHTML = `
    <h1 class="adm__h1">Jóváhagyásra vár</h1>
    <p class="adm__lead">Itt látszik, melyik adat jóváhagyott, melyik az ügyfél jegyzetéből vett példa, és melyik ideiglenes érték, amit még meg kell erősíteni. Amit a tulajdonos maga átír, az automatikusan jóváhagyottá válik.</p>
    <p class="srclegend">${['jovahagyott', 'pelda', 'bizonytalan', 'demo'].map(srcBadge).join(' ')}</p>
    ${(() => { const rd = readiness(st); const G = { arak: 'grammár', gyemant: 'gyémántár', szabalyok: 'számítási szabály (kerekítés, ÁFA, gravír…)', gyuruk: 'gyűrű tömeg- és kőadata' };
      return `<section class="golive ${rd.ready ? 'golive--ok' : 'golive--no'}" data-golive-box>
        <h2>Élesítési ellenőrzés</h2>
        <p class="golive__state" data-golive-state>${rd.ready ? 'Az előzetes ellenőrzés szerint minden adat érvényes és jóváhagyott.' : `<b>Nem élesíthető:</b> ${rd.unapproved} adat nincs jóváhagyva${rd.invalid ? `, ${rd.invalid} adat hiányzik vagy hibás` : ''}.`}</p>
        <p class="golive__pre" data-golive-pre><b>Ez csak előzetes ellenőrzés.</b> Valódi élesítéshez szerveroldali ellenőrzés és bejelentkezéshez kötött kezelőfelület szükséges.</p>
        ${rd.invalid ? `<ul class="golive__list golive__list--bad" data-golive-bad>${rd.blockers.filter((b) => b.kind === 'ervenytelen').slice(0, 8).map((b) => `<li>${esc(b.label)}</li>`).join('')}${rd.invalid > 8 ? `<li>… és még ${rd.invalid - 8}</li>` : ''}</ul>` : ''}
        ${rd.ready ? '' : `<ul class="golive__list">${Object.entries(rd.byGroup).map(([g, c]) => `<li><b>${c}</b> ${G[g]}</li>`).join('')}</ul>`}
        <p class="hint">A vásárló csak ott lát számolt árat, ahol a gyűrű és minden felhasznált árelem (grammár, kőár, számítási szabály) jóváhagyott. Máshol a mostani listaárat (alapváltozat) vagy „egyedi ajánlat”-ot lát.</p>
        <button class="abtn abtn--gold abtn--xl" type="button" data-golive ${rd.ready ? '' : 'disabled'}>Élesítésre kész jelölés</button>
      </section>`; })()}
    <section class="ebox"><h2>Árak – alapanyag és grammár <small>${count(mats)} vár</small></h2><ul class="aplist">${mats.join('')}</ul></section>
    <section class="ebox"><h2>Természetes gyémántok <small>${count(dias)} vár</small></h2><ul class="aplist">${dias.join('')}</ul>
      <p class="hint">A 0,04 és 0,05 ct ára ellentmondásos/hiányzik, ezért ezeknél a vásárló „Egyedi árajánlat szükséges” feliratot lát. <a href="#/admin/alapanyag">Ár megadása</a></p></section>
    <section class="ebox"><h2>Számítási szabályok <small>${count(sets)} vár</small></h2><ul class="aplist">${sets.join('')}</ul></section>
    <section class="ebox"><h2>Gyűrűk adatai <small>${prods.length} / ${st.products.length} vár</small></h2>
      <p class="hint">A gyűrűk tömege most becslés: a weboldalon látható árból visszaszámolva. A kőszámok és kőméretek a fotók alapján becsültek.</p>
      <p><a class="abtn abtn--gold abtn--xl" href="#/admin/sorban">Jóváhagyás sorban →</a></p></section>`;
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-golive]')) { if (readiness(S()).ready) toast('Minden adat jóváhagyott. Ez előzetes ellenőrzés – az élesítéshez a szerveroldali mentés is kell.'); return; }
    const b = e.target.closest('[data-appr]');
    if (!b || b.disabled) return;
    const [kind, key] = b.dataset.appr.split('|');
    store.approve(kind, key, b.dataset.lab);
    toast('Jóváhagyva.'); approvals(el);
  });
}

/* ---------- Az ötvös számítási példái (Árszámítás oldal) ---------- */
function goldsmithExamples(box) {
  const st = S();
  const M = st.materials, Sx = st.settings;
  const s = { metal: 'pt', weight: EXAMPLE_WEIGHTS.pt, size: 60, stones: 0, cat: 'd01' };
  const R1 = { ...Sx, roundTo: 1 };
  const ex = (metal, size, s0 = R1) => exampleRing({ metal, weight: EXAMPLE_WEIGHTS[metal], size }, M, { ...s0, pricingMode: 'gramm' });
  const gp = (m) => M.sellPerGram?.[m];
  const line = (m, size) => { const r = ex(m, size, Sx); const g = gp(m);
    return `<tr><td><b>${METALS[m].short}, ${sizeSfx(size)}</b><small>${dec(EXAMPLE_WEIGHTS[m])} g${size !== 54 ? ` × ${size}/54` : ''} × ${g ? ft(g) : '–'}</small></td><td>${r.final === null ? 'nincs grammár' : ft(r.raw)}</td><td><b>${r.final === null ? '–' : ft(r.final)}</b></td></tr>`; };
  const paint = () => {
    const r = exampleRing({ metal: s.metal, weight: s.weight, size: s.size, stones: s.stones ? { count: s.stones, cat: s.cat } : null }, M, { ...Sx, pricingMode: 'gramm' });
    const part = r.parts[0] || {}, d = diamond(M, s.cat);
    const steps = r.final === null && !part.grams ? `<p class="warn">${esc(r.reason || '')}</p>` : `<ol class="xsteps">
      <li><span>Tömeg 54-es méretben</span><b>${dec(s.weight)} g</b></li>
      ${s.size !== 54 ? `<li><span>Méret: × ${s.size}/54</span><b>${dec(Math.round(part.gramsExact * 100) / 100)} g</b></li>` : ''}
      <li><span>× eladási grammár ${srcBadge((M.src || {})[`sellPerGram.${s.metal}`] || 'demo')}</span><b>${ft(gp(s.metal))}/g</b></li>
      <li><span>= a gyűrű ára kő nélkül</span><b>${ft(part.gramSell)}</b></li>
      ${s.stones ? `<li><span>+ ${s.stones} × ${d.name} ${srcBadge(d.src)}</span><b>${d.price == null ? 'nincs ár' : ft(d.price * s.stones)}</b></li>` : ''}
      ${s.stones && Sx.settingPerStone ? `<li><span>+ kőfoglalás ${s.stones} × ${ft(Sx.settingPerStone)}</span><b>${ft(Sx.settingPerStone * s.stones)}</b></li>` : ''}
      ${s.stones && Sx.certCost ? `<li><span>+ kőtanúsítvány</span><b>${ft(Sx.certCost)}</b></li>` : ''}
      ${Sx.boxCost ? `<li><span>+ díszdoboz</span><b>${ft(Sx.boxCost)}</b></li>` : ''}
      ${r.final !== null ? `<li><span>Számított ár (nyers)</span><b>${ft(r.raw)}</b></li>
      <li><span>Kerekítés: ${roundLabel(Sx.roundTo)} ${srcBadge((Sx.src || {}).roundTo || 'demo')}</span><b>+${ft(r.calculated - r.raw)}</b></li>` : ''}
      <li class="xsteps__sum"><span>Megjelenő ár (bruttó)</span><b>${r.final === null ? 'Egyedi árajánlat szükséges' : ft(r.final)}</b></li>
      ${part.materialCost ? `<li class="xsteps__info"><span>Tájékoztató: anyagköltség (${ft(part.refPrice)}/g alapanyagár)</span><b>${ft(part.materialCost)}</b></li>` : ''}
    </ol>${r.final === null && r.reason ? `<p class="warn">${esc(r.reason)}</p>` : ''}`;
    box.innerHTML = `
      <section class="ebox xbox"><h2>Az ötvös számítási módja <small>az ügyfél jegyzetének példái</small></h2>
        <p class="hint">Ár = tömeg × eladási grammár; más méretnél a tömeg arányosan változik (× méret / 54). A kövek darabára és a külön díjak ehhez adódnak hozzá, felár és ÁFA nem kerül rá még egyszer.</p>
        <div class="xtable"><table><thead><tr><th>Példa</th><th>Számított</th><th>Megjelenő</th></tr></thead><tbody>
          ${line('au14', 54)}${line('pt', 54)}${line('pt', 48)}${line('pt', 60)}
        </tbody></table></div>
        <p class="hint">Számított = nyers eredmény. Megjelenő = kerekítve (${roundLabel(Sx.roundTo)}) ${srcBadge((Sx.src || {}).roundTo || 'demo')} – a kerekítést az ügyféllel egyeztetjük.</p>
        <p class="note-warn">A kézzel írt jegyzetben a 60-as platina gyűrűnél 442 000 Ft szerepel. A lineáris számítás ${ft(ex('pt', 60).final)}-ot ad, a különbség ${ft(442000 - (ex('pt', 60).final || 0))}. A lineáris számítás szerint a 442 valószínűleg elírás (422). Nem állítottuk be – egyeztetendő, hogy nagyobb méretnél más a tömegnövekedés, vagy más szélességgel számolt.</p>
      </section>
      <section class="ebox xbox"><h2>Próbaszámítás <small>tetszőleges tömeggel</small></h2>
        <div class="xform">
          <label class="efield"><span>Anyag</span><select class="input input--lg" data-xm>${METAL_ORDER.map((m) => `<option value="${m}" ${m === s.metal ? 'selected' : ''}>${METALS[m].short}</option>`).join('')}</select></label>
          <label class="efield"><span>Tömeg 54-es méretben</span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-xw value="${dec(s.weight)}"><i>g</i></span></label>
          <label class="efield"><span>Gyűrűméret</span><span class="efield__in"><input class="input input--lg" inputmode="numeric" data-xs value="${s.size}"><i>mm</i></span></label>
          <label class="efield"><span>Kövek</span><span class="efield__in"><input class="input input--lg" inputmode="numeric" data-xn value="${s.stones}"><i>db</i></span></label>
          <label class="efield"><span>Kőméret</span><select class="input input--lg" data-xc>${M.diamonds.map((x) => `<option value="${x.id}" ${x.id === s.cat ? 'selected' : ''}>${x.name} – ${x.price == null ? 'nincs ár' : ft(x.price)}</option>`).join('')}</select></label>
        </div>
        ${steps}
      </section>`;
  };
  box.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-xm]')) { s.metal = t.value; s.weight = EXAMPLE_WEIGHTS[t.value]; }
    if (t.matches('[data-xc]')) s.cat = t.value;
    if (t.matches('[data-xw],[data-xs],[data-xn]')) {
      const v = parseNum(t.value);
      if (Number.isFinite(v) && v >= 0) { if (t.matches('[data-xw]')) s.weight = v; if (t.matches('[data-xs]')) s.size = Math.min(80, Math.max(40, Math.round(v))); if (t.matches('[data-xn]')) s.stones = Math.min(80, Math.round(v)); }
    }
    paint();
  });
  paint();
}


/* ---------- Közös: kép beolvasása és kicsinyítése (helyi módban a böngészőben tárolódik) ---------- */
function readImage(file, done) {
  const im = new Image(), url = URL.createObjectURL(file);
  im.onload = () => {
    const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); done(c.toDataURL('image/jpeg', 0.82));
  };
  im.onerror = () => { URL.revokeObjectURL(url); toast('Ezt a képet nem sikerült megnyitni.'); };
  im.src = url;
}

/* ---------- Fotók: minden gyűrű képe egy helyen, gyors cserével ---------- */
function photos(el) {
  el = fresh(el);
  const st = S();
  let only = false;
  const kindOf = (p) => !p.img ? ['nincs', 'nincs kép'] : /^data:/.test(p.img) ? ['sajat', 'itt feltöltött kép'] : /^https?:/.test(p.img) ? ['web', 'a mostani weboldalról'] : ['helyi', 'a mostani weboldalról'];
  const paint = () => {
    const list = st.products.filter((p) => !only || !p.img).sort((a, b) => (b.added ? 1 : 0) - (a.added ? 1 : 0) || a.code.localeCompare(b.code));
    el.innerHTML = `
      <h1 class="adm__h1">Fotók</h1>
      <p class="adm__lead">Itt cserélheti a gyűrűk képét. Válassza ki a fényképet a gépéről vagy a telefonjáról, és azonnal megjelenik a vásárlói oldalon.</p>
      <p class="hint">${api.mode === 'server' ? 'A feltöltött képből a szerver optimalizált JPEG-et készít (legfeljebb 2400 képpont, a helyadat és egyéb rejtett adat nélkül). Az eredeti fájl nem marad meg – azt őrizze meg a saját gépén.' : 'A képek most kicsinyítve (900 képpont), ebben a böngészőben tárolódnak.'}</p>
      <div class="ptools"><label class="check check--lg"><input type="checkbox" data-only ${only ? 'checked' : ''}><span>Csak ahol nincs kép</span></label>
        <div class="ptools__btns"><a class="abtn abtn--gold" href="#/admin/gyuru/uj">+ Új gyűrű felvitele</a></div></div>
      <p class="hint">${list.length} gyűrű</p>
      <div class="photogrid">${list.map((p) => { const [k, t] = kindOf(p); return `<div class="photocard" data-pc="${p.id}">
        <div class="photocard__img">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span>nincs kép</span>'}</div>
        <b>${esc(p.code)}</b><small class="photocard__k photocard__k--${k}">${t}</small>
        <label class="abtn photocard__btn">Kép cseréje<input type="file" accept="image/*" data-photo="${p.id}" hidden></label>
        <a class="linkbtn" href="#/admin/gyuru/${p.id}">Adatok</a></div>`; }).join('')}</div>`;
  };
  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-only]')) { only = t.checked; paint(); return; }
    if (t.dataset.photo && t.files[0]) {
      const id = t.dataset.photo, code = store.product(id).code;
      const apply = (src) => {
        store.updateProduct(id, (x) => { x.img = src; }, `${code}: új fénykép`);
        st.products = S().products; paint();
        toast(`Mentve: <b>${esc(code)}</b> új képe már látszik a vásárlói oldalon.`);
      };
      if (api.mode === 'server' && api.admin) {
        toast(`Feltöltés: <b>${esc(code)}</b>…`);
        uploadPhoto(t.files[0]).then(apply, (err) => toast(`<b>A kép nem került fel.</b> ${esc(err.message)}`, { ms: 12000 }));
      } else readImage(t.files[0], apply);
    }
  });
  paint();
}

/* ---------- Szabályok: gyűrűnként mit állíthat a vásárló ---------- */
function rulesPage(el) {
  el = fresh(el);
  const st = S();
  let only = false;
  const ruleTxt = (r) => { const x = r.stoneRule; if (!x) return 'nincs kő';
    return ({ free: `${x.min}–${x.max} kő`, fixed: `${x.def} kő (kötött)`, perSize: 'körbe foglalt', quote: 'kő csak ajánlattal' }[x.mode]) + (x.allowNone ? ', elhagyható' : ''); };
  const paint = () => {
    const list = st.products.filter((p) => !only || !p.approved).sort((a, b) => a.code.localeCompare(b.code));
    const ok = st.products.filter((p) => p.approved).length;
    el.innerHTML = `
      <h1 class="adm__h1">Szabályok gyűrűnként</h1>
      <p class="adm__lead">Minden gyűrűnél Ön dönti el, mit állíthat át rajta a vásárló: miből készülhet, milyen méretben, hány és mekkora kővel, választható-e a szélesség. Amit nem enged, ahhoz személyes egyeztetés kell.</p>
      <p class="rules__sum"><b>${ok}</b> gyűrűt hagyott jóvá a ${st.products.length}-ből. ${ok < st.products.length ? 'A többinél a vásárló nem állíthat semmit, és csak a mostani listaárat vagy „egyedi ajánlat”-ot lát.' : ''}</p>
      <p><a class="abtn abtn--gold abtn--xl" href="#/admin/sorban">Jóváhagyás sorban →</a></p>
      <div class="ptools"><label class="check check--lg"><input type="checkbox" data-only ${only ? 'checked' : ''}><span>Csak ami jóváhagyásra vár</span></label></div>
      <ul class="rules">${list.slice(0, 60).map((p) => { const wv = optionValues(p, 'width');
        return `<li><a class="rules__row" href="#/admin/gyuru/${p.id}">
          <span class="prow__img">${productMedia(p)}</span>
          <span class="rules__main"><b>${esc(p.code)}</b>
            <small>${p.metals.map((m) => METALS[m].short).join(', ')}</small>
            <small>${p.rings.map((r) => `${esc(r.label.split(' ')[0])}: ${ruleTxt(r)}`).join(' · ')}</small>
            <small>Szélesség: ${wv ? `választható ${dec(wv[0])}–${dec(wv[wv.length - 1])} mm` : 'nem választható'}${p.priceOnRequest ? ' · csak egyedi ajánlat' : ''}</small></span>
          ${p.approved ? '<em class="tag tag--ok">jóváhagyva</em>' : '<em class="tag tag--warn">jóváhagyásra vár</em>'}
          <span class="rules__go">Szerkesztés</span></a></li>`; }).join('')}</ul>
      ${list.length > 60 ? `<p class="hint">Az első 60 látszik a ${list.length}-ből. A többit a Gyűrűk menüben, keresővel éri el.</p>` : ''}`;
  };
  el.addEventListener('change', (e) => { if (e.target.matches('[data-only]')) { only = e.target.checked; paint(); } });
  paint();
}

/* ---------- Jóváhagyás sorban: egy gyűrű egyszerre, nagy gombokkal ---------- */
function queue(el, startId) {
  el = fresh(el);
  let st = S();
  const pending = () => st.products.filter((p) => !p.approved).sort((a, b) => a.code.localeCompare(b.code));
  let cur = (startId && st.products.find((p) => p.id === startId)) || pending()[0] || null;
  let skipped = new Set();
  const ruleTxt = (r) => { const x = r.stoneRule; if (!x) return 'nincs kő';
    const cats = (x.cats || []).map((c) => { const d = diamond(st.materials, c); return d ? `${ctFmt(d.ct)} ct` : c; }).join(', ');
    return ({ free: `${x.min}–${x.max} db, alapból ${x.def}`, fixed: `${x.def} db (kötött)`, perSize: 'körbe foglalt, mérettől függ', quote: 'csak egyedi ajánlattal' }[x.mode]) + (cats ? ` · méret: ${cats}` : '') + (x.allowNone ? ' · kő nélkül is' : ''); };
  const paint = () => {
    st = S();
    const total = st.products.length, ok = st.products.filter((p) => p.approved).length, pct_ = Math.round((ok / total) * 100);
    if (!cur) {
      el.innerHTML = `<h1 class="adm__h1">Gyűrűk jóváhagyása</h1>
        <div class="qdone"><b>${ok} / ${total} gyűrű jóváhagyva.</b><p>${ok === total ? 'Minden gyűrű jóváhagyva.' : 'Ebben a körben nincs több. A kihagyottakhoz bármikor visszatérhet.'}</p>
        <a class="abtn abtn--xl" href="#/admin/szabalyok">Áttekintés</a></div>`;
      return;
    }
    const p = cur, cfg = defaultConfig(p), r = priceProduct(p, cfg, st.materials, st.settings);
    const wv = optionValues(p, 'width'), tv = optionValues(p, 'thickness');
    const diff = p.listaAr && r.final ? r.final - p.listaAr : null;
    el.innerHTML = `
      <h1 class="adm__h1">Gyűrűk jóváhagyása</h1>
      <div class="qbar"><span style="width:${pct_}%"></span></div>
      <p class="qbar__t"><b>${ok} / ${total}</b> jóváhagyva · még ${total - ok}</p>
      <p class="adm__lead">Nézze át a gyűrű adatait. Ha rendben vannak, hagyja jóvá: ettől kezdve a vásárló online beállíthatja ezt a gyűrűt (csak az itt látható keretek között), és jóváhagyott árak mellett számolt árat lát. Amíg nincs jóváhagyva, a gyűrű a katalógusban marad, de csak a mostani listaárat vagy „egyedi ajánlat”-ot mutat.</p>
      <article class="qcard" data-qcard="${p.id}">
        <div class="qcard__img">${productMedia(p, { large: true })}</div>
        <div class="qcard__body">
          <p class="qcard__code">${esc(p.code)} ${p.approved ? '<em class="tag tag--ok">jóváhagyva</em>' : '<em class="tag tag--warn">jóváhagyásra vár</em>'}</p>
          <h2>${esc(p.name)}</h2>
          <dl class="qfacts">
            <div><dt>Anyagok</dt><dd>${p.metals.map((m) => METALS[m].short).join(', ')}</dd></div>
            <div><dt>Színek</dt><dd>${p.colors.map((c) => (COLORS[c] || { label: c }).label).join(', ') || '–'}</dd></div>
            ${p.rings.map((rg) => { const [lo, hi] = sizeRange(rg); return `
            <div class="qfacts__ring"><dt>${esc(rg.label)}</dt><dd>
              <span>Tömeg 54-es méretre: <b>${rg.weight ? dec(rg.weight) + ' g' : 'nincs megadva'}</b> <small>(${p.real ? 'a mostani listaárból visszaszámolt becslés' : 'megadott érték'})</small></span>
              <span>Szélesség: <b>${dec(rg.refWidth)} mm</b>${rg.thickness ? ` · vastagság: <b>${dec(rg.thickness)} mm</b>` : ''}</span>
              <span>Méretek: <b>${lo}–${hi}</b></span>
              <span>Kő: <b>${ruleTxt(rg)}</b></span></dd></div>`; }).join('')}
            <div><dt>Szélesség választható?</dt><dd>${wv ? `igen, ${dec(wv[0])}–${dec(wv[wv.length - 1])} mm` : 'nem'}</dd></div>
            <div><dt>Vastagság választható?</dt><dd>${tv ? `igen: ${tv.map(dec).join(', ')} mm` : 'nem'}</dd></div>
            <div><dt>Egyeztetést igényel</dt><dd>${(p.consult || []).length ? p.consult.map(esc).join('; ') : '–'}</dd></div>
            <div><dt>Számolt ár (alapváltozat)</dt><dd>${r.final === null ? 'egyedi ajánlat' : `<b>${ft(r.final)}</b>`}${p.listaAr ? ` <small>· mostani listaár: ${ft(p.listaAr)}${diff ? ` (${diff > 0 ? '+' : '−'}${ft(Math.abs(diff))})` : ''}</small>` : ''}</dd></div>
          </dl>
          <p class="hint">A számolt ár a mostani grammárakkal és kőárakkal készül. Azokat az „Árak” és a „Jóváhagyásra vár” oldalon kell külön jóváhagyni – amíg nincsenek jóváhagyva, a vásárló ennél a gyűrűnél sem lát számolt árat.</p>
          <div class="qbtns">
            ${p.approved
              ? `<button class="abtn abtn--xl" type="button" data-unapprove>Jóváhagyás visszavonása</button>`
              : `<button class="abtn abtn--gold abtn--xl" type="button" data-approve>Rendben, jóváhagyom</button>`}
            <a class="abtn abtn--xl" href="#/admin/gyuru/${p.id}">Javítani kell – szerkesztés</a>
            <button class="abtn abtn--xl" type="button" data-skip>Később</button>
          </div>
        </div>
      </article>`;
  };
  const next = () => { skipped.add(cur.id); cur = pending().find((p) => !skipped.has(p.id)) || null; paint(); window.scrollTo(0, 0); };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-approve]')) {
      const code = cur.code;
      store.approve('product', cur.id, `${code} – gyűrű adatai`);
      toast(`Mentve: <b>${esc(code)}</b> jóváhagyva.`);
      next();
    } else if (e.target.closest('[data-unapprove]')) {
      store.unapprove(cur.id, `${cur.code} – jóváhagyás visszavonva`);
      toast(`Mentve: <b>${esc(cur.code)}</b> jóváhagyása visszavonva – a vásárló ennél a gyűrűnél újra egyedi ajánlatot kér.`);
      paint();
    } else if (e.target.closest('[data-skip]')) next();
  });
  paint();
}

/* Gyors árszámítás: gyűrű, anyag, szín, méret, kő → ár, és rögzíthető ajánlatként. */
function quickCalc(box) {
  const st = S();
  const list = st.products.filter((p) => !p.priceOnRequest).sort((a, b) => a.code.localeCompare(b.code));
  let p = store.product('maz-81184-81185-w') || list[0];
  let cfg = defaultConfig(p);
  const CL = { sarga: 'Sárga', feher: 'Fehér', rose: 'Rozé', ketszinu: 'Fehér–sárga', feherrose: 'Fehér–rozé', sargarose: 'Sárga–rozé' };
  const paint = () => {
    const r = priceProduct(p, cfg, st.materials, st.settings);
    cfg = r.cfg;
    box.innerHTML = `
      <label class="efield"><span>Melyik gyűrű?</span><select class="input input--lg" data-qp>${list.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.code)} – ${esc(x.name)}</option>`).join('')}</select></label>
      <div class="qcalc__row">
        <span class="qcalc__img">${productMedia(p)}</span>
        <div class="qcalc__opts">
          <div><span class="qcalc__lab">Anyag</span><div class="qseg">${p.metals.map((m) => `<button type="button" data-qm="${m}" aria-pressed="${m === cfg.metal}">${METALS[m].short}</button>`).join('')}</div></div>
          ${isGold(cfg.metal) && p.colors.length > 1 ? `<div><span class="qcalc__lab">Szín <small>(az árat nem változtatja)</small></span><div class="qseg">${p.colors.map((c) => `<button type="button" data-qc="${c}" aria-pressed="${c === cfg.color}">${CL[c] || c}</button>`).join('')}</div></div>` : ''}
          ${p.rings.map((rg, i) => `<div><span class="qcalc__lab">${esc(rg.label)} mérete</span><div class="qstep"><button type="button" data-qs="${i}|-1" aria-label="kisebb">−</button><output>${cfg.rings[i].size}</output><button type="button" data-qs="${i}|1" aria-label="nagyobb">+</button></div></div>`).join('')}
          ${p.rings.map((rg, i) => rg.stoneRule && rg.stoneRule.allowNone ? `<div><span class="qcalc__lab">${esc(rg.label)} – kő</span><div class="qseg"><button type="button" data-qst="${i}|1" aria-pressed="${!!cfg.rings[i].stones}">Gyémánttal</button><button type="button" data-qst="${i}|0" aria-pressed="${!cfg.rings[i].stones}">Kő nélkül</button></div></div>` : '').join('')}
        </div>
      </div>
      <div class="qcalc__price"><span>Ár</span><b>${r.final === null ? 'Egyedi ajánlat' : ft(r.final)}</b><small>${r.final === null ? esc(r.reason || '') : `bruttó · ${dec(r.grams)} g, ${METALS[cfg.metal].short}${r.calculated !== r.raw ? ` · számított ${ft(r.raw)}, ${roundLabel(st.settings.roundTo)} kerekítve` : ''}${(st.materials.src || {})[`sellPerGram.${cfg.metal}`] === 'demo' ? ` · <b>a ${METALS[cfg.metal].short} grammár még nincs jóváhagyva</b>` : ''}`}</small></div>
      <button class="abtn abtn--xl qcalc__save" type="button" data-qsave>Felírom ajánlatnak</button>`;
  };
  box.addEventListener('change', (e) => { if (e.target.matches('[data-qp]')) { p = store.product(e.target.value); cfg = defaultConfig(p); paint(); } });
  box.addEventListener('click', (e) => {
    const g = (a) => e.target.closest(`[data-${a}]`)?.dataset[a];
    let v;
    if ((v = g('qm'))) { cfg.metal = v; cfg.color = isGold(v) ? (cfg.color || p.baseColor) : null; }
    else if ((v = g('qc'))) cfg.color = v;
    else if ((v = g('qs'))) { const [i, d] = v.split('|').map(Number); cfg.rings[i].size = Math.min(76, Math.max(44, cfg.rings[i].size + d)); }
    else if ((v = g('qst'))) { const [i, on] = v.split('|').map(Number); const rule = p.rings[i].stoneRule; cfg.rings[i].stones = on ? { count: Math.max(1, rule.def), cat: rule.defCat } : null; }
    else if (e.target.closest('[data-qsave]')) {
      const r = priceProduct(p, cfg, st.materials, st.settings);
      modal(`<form class="form" data-qf><h2>Ajánlat felírása</h2><p><b>${esc(p.code)}</b> – ${r.final === null ? 'egyedi ajánlat, az árat később adja meg' : ft(r.final)}</p>
        <label class="field"><span>Ügyfél neve</span><input class="input input--lg" name="nev" required></label>
        <label class="field"><span>Telefonszáma</span><input class="input input--lg" name="tel" type="tel"></label>
        <div class="impact__btns"><button class="abtn abtn--xl" type="button" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" type="submit">Felírom</button></div></form>`, {
        onMount: (mb, close) => mb.querySelector('[data-qf]').addEventListener('submit', (ev) => {
          ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
          if (!d.nev.trim()) return;
          store.addInquiry({ type: 'telefon', name: d.nev, phone: d.tel, productId: p.id, code: p.code, config: clone(cfg), summary: configText(p, cfg), estimate: r.final,
            status: r.final === null ? 'uj' : 'elfogadva', lockedPrice: r.final, lockedAt: r.final === null ? null : new Date().toISOString() }).then((res) => {
            if (!res.ok) { toast(`<b>Nem sikerült felírni:</b> ${esc(res.error)}`); return; }
            close(); toast(r.final === null ? 'Felírva az Érdeklődések közé – az árat egyedileg kell megadni.' : 'Felírva az Érdeklődések közé, rögzített árral.');
          });
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
  if (!rOld || rOld.final === null) return '<p class="hint">Ennél a gyűrűnél nincs kalkulált ár (egyedi ajánlat).</p>';
  if (rNew && rNew.final === null) rNew = null;
  const a = composition(rOld, Sx), b = rNew ? composition(rNew, SxNew) : null;
  const max = Math.max(rOld.final, rNew ? rNew.final : 0);
  const bar = (c, r, label) => `<div class="comp__row"><span class="comp__lab">${label}</span>
    <div class="comp__track"><div class="comp__bar" style="width:${(r.final / max) * 100}%">${SEG.map(([k]) => c[k] > 0.5 ? `<i class="comp__s comp__s--${k}" style="flex:${c[k].toFixed(0)}"></i>` : '').join('')}</div></div>
    <b class="comp__sum">${ft(r.final)}</b></div>`;
  return `<div class="comp">
    ${bar(a, rOld, b ? 'Most' : 'Ár')}${b ? bar(b, rNew, 'Új') : ''}
    <ul class="comp__legend">${SEG.filter(([k]) => a[k] > 0.5 || (b && b[k] > 0.5)).map(([k, l0, n0]) => {
      const gmode = (rNew || rOld).breakdown?.mode === 'gramm';
      const [l, n] = gmode && k === 'metal' ? ['Gyűrű (tömeg × grammár)', 'változik a grammárral'] : gmode && k === 'labor' ? ['Kőfoglalás', 'fix összeg'] : [l0, n0];
      const dv = b ? b[k] - a[k] : 0;
      return `<li><i class="comp__s comp__s--${k}"></i><span>${l}<small>${n}</small></span><b>${ft(b ? b[k] : a[k])}${b ? (Math.abs(dv) >= 1 ? ` <em class="${dv > 0 ? 'up' : 'down'}">${dv > 0 ? '+' : '−'}${ft(Math.abs(dv))}</em>` : ' <em class="same">változatlan</em>') : ''}</b></li>`;
    }).join('')}</ul>
    <p class="comp__note">${(rNew || rOld).breakdown?.mode === 'gramm' ? 'Bruttó összegek – a grammár tartalmazza a munkát, az árrést és az ÁFA-t.' : 'A felár és az ÁFA arányosan benne van az egyes részekben.'}</p>
  </div>`;
}

/* ---------- 2. Alapanyagárak – az árkezelés fő képernyője ---------- */
function materials(el) {
  el = fresh(el);
  const st = S();
  const cur = clone(st.materials);
  const draft = clone(st.materials);
  const lastM = st.history.find((h) => h.kind === 'materials' || h.kind === 'start');
  const versions = st.history.filter((h) => (h.kind === 'materials' || h.kind === 'start') && !h.demo);            // minden árváltozás egy árverzió
  const missing = readiness(st).blockers.filter((b) => b.kind === 'ervenytelen' && (b.group === 'arak' || b.group === 'gyemant'));
  let selEx = null;
  const gm = st.settings.pricingMode === 'gramm';
  const P0 = gm ? 'sellPerGram.au14' : 'gold24';              // a fő mező a választott árképzési módtól függ
  const nv = (v) => (v === null || v === undefined ? '' : num(v));

  const field = (key, label, unit, step, sub = '', path = key) => `
    <div class="mfield" data-mfield="${path}">
      <label for="f-${path.replace(/\./g, '-')}"><b>${label} ${srcBadge(msrc(cur, path))}</b>${sub ? `<small>${sub}</small>` : ''}</label>
      <div class="mfield__ctl">
        <button type="button" class="mbtn" data-step="-${step}" aria-label="${label} csökkentése ${num(step)} Ft-tal">−</button>
        <div class="mfield__input"><input id="f-${path.replace(/\./g, '-')}" inputmode="numeric" data-path="${path}" value="${nv(get(draft, path))}" placeholder="nincs ár" autocomplete="off"><span>${unit}</span></div>
        <button type="button" class="mbtn" data-step="${step}" aria-label="${label} növelése ${num(step)} Ft-tal">+</button>
      </div>
      <p class="mfield__was" data-was="${path}">Jelenleg: ${get(cur, path) == null ? 'nincs ár → egyedi ajánlat' : num(get(cur, path)) + ' ' + unit}</p>
    </div>`;

  el.innerHTML = `
    <h1 class="adm__h1">Árak: grammár, arany, gyémánt</h1>
    <p class="adm__meta" data-pver><b>${versions.length}. árverzió</b> · érvényes ${dateHu(lastM.at)} óta${versions.length > 1 ? ' · <a href="#" data-verlist>korábbi verziók</a>' : ''}</p>
    ${missing.length ? `<div class="missbox" data-missing><b>Hiányzó adat (${missing.length}):</b><ul>${missing.slice(0, 6).map((b) => `<li>${esc(b.label)}</li>`).join('')}</ul><p class="hint">Amíg ezek hiányoznak, az érintett gyűrűknél a vásárló „Egyedi árajánlat szükséges” feliratot lát.</p></div>` : ''}
    <p class="modebar">Alkalmazott árazás: <b>${gm ? 'grammár szerint – tömeg × eladási grammár (az ötvös módszere)' : 'költség szerint – alapanyagár + munkadíj + felár'}</b> <a href="#/admin/keplet">Módosítás</a></p>
    <p class="srclegend">Adatforrás: ${['jovahagyott', 'pelda', 'bizonytalan', 'demo'].map(srcBadge).join(' ')} <a href="#/admin/jovahagyas">Mi vár jóváhagyásra?</a></p>
    <div class="mat mat--simple">
      <section class="goldcard">
        ${gm ? field('', '1 gramm 14 karátos kész gyűrű eladási ára', 'Ft', 500, 'bruttó – benne a fém, a munka és az árrés', P0) : field('gold24', '1 gramm 24 karátos arany (alapanyag)', 'Ft', 500, 'ebből: 14K = ×0,585, 18K = ×0,75')}
        <div class="quick" role="group" aria-label="Gyors módosítás">
          ${[-3, -1, 1, 3, 5].map((v) => `<button type="button" class="qbtn" data-quick="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)}%</button>`).join('')}
        </div>
      </section>
      <section class="impact" data-impact aria-live="polite"></section>
      <div class="mimpact" data-mimpact hidden><span data-mimpact-t></span><button type="button" data-goimpact></button></div>
      <details class="mat__more" ${gm ? 'open' : ''}>
        <summary>Késztermék eladási grammára <small>${gm ? 'ebből számolódik az ár' : 'grammáras módban használt'}</small></summary>
        <p class="hint">Titán: nincs grammár. A titángyűrű ára a munkából adódik, ezért ott mindig egyedi árajánlat jelenik meg.</p>
        ${(gm ? ['au18', 'pt', 'pd'] : METAL_ORDER.filter((m) => m !== 'ti')).map((m) => field('', `1 g ${METALS[m].label.toLowerCase()} kész gyűrű`, 'Ft', 500, 'bruttó', `sellPerGram.${m}`)).join('')}
      </details>
      <details class="mat__more" ${gm ? '' : 'open'}>
        <summary>Alapanyag-referenciaárak <small>${gm ? 'beszerzés – az eladási árat nem változtatja, csak az anyagköltséget mutatja' : 'ebből számolódik az ár'}</small></summary>
        ${gm ? field('gold24', '1 g 24 karátos arany', 'Ft', 500, 'ebből: 14K = ×0,585, 18K = ×0,75') : ''}
        <p class="hint" data-derived></p>
        ${field('', 'Platina', 'Ft/g', 500, '', 'platinum')}${field('', 'Palládium', 'Ft/g', 500, '', 'palladium')}${field('', 'Titán', 'Ft/g', 10, '', 'titanium')}
      </details>
      <details class="mat__more">
        <summary>A 24K arany ára az elmúlt hónapokban</summary>
        <div class="goldcard__chart"><div data-chart></div><p class="hint">Csak az itt mentett változásokból rajzolódik.</p></div>
      </details>
      <details class="mat__more" open>
        <summary>Természetes gyémántok ára <small>darabár · üresen hagyva: egyedi ajánlat</small></summary>
        ${st.materials.diamonds.map((d, i) => field('', `${d.name} · ${d.quality}`, 'Ft/db', 1000, `${d.note ? esc(d.note) + ' · ' : ''}${st.products.filter((p) => p.rings.some((r) => r.stoneRule && r.stoneRule.cats.includes(d.id))).length} gyűrűnél választható`, `diamonds.${i}.price`)).join('')}
      </details>
    </div>`;

  const impact = $('[data-impact]', el);
  let confirmBig = false, moreOpen = false;
  const series = store.goldSeries();

  const paint = () => {
    $('[data-chart]', el).innerHTML = goldChart(series, cur.gold24, draft.gold24);
    $$('[data-quick]', el).forEach((b) => b.setAttribute('aria-pressed', String(Math.round(get(cur, P0) * (1 + Number(b.dataset.quick) / 100) / 100) * 100 === get(draft, P0))));
    const d = diffPrices(st.products, cur, draft, st.settings);
    const changes = changedPaths(cur, draft);
    const dv = $('[data-derived]', el);
    if (dv) dv.innerHTML = `Számolt alapanyagár: <b>14K ${ft(refPrice('au14', draft))}/g</b> · <b>18K ${ft(refPrice('au18', draft))}/g</b> (a 24K árából)`;
    $$('[data-mfield]', el).forEach((f) => f.classList.toggle('is-changed', changes.some((c) => c.path === f.dataset.mfield)));
    const mi = $('[data-mimpact]', el);
    mi.hidden = !changes.length;
    document.body.classList.toggle('has-mimpact', !!changes.length);
    if (changes.length) $('[data-mimpact-t]', el).innerHTML = `<b>${d.count} gyűrű</b> ára változna, átlagosan <b>${pct(d.avgPct)}</b>`;
    if (!changes.length) {
      const sample = store.product('maz-81184-81185-w');
      impact.className = 'impact impact--idle';
      impact.innerHTML = `<p>Írja át a fenti számot, vagy nyomja meg a + / − gombot. Mentés előtt itt megmutatjuk, mi változik.</p>
`;
      return;
    }
    const big = changes.filter((c) => c.pct !== null && Math.abs(c.pct) >= st.settings.bigChangePct);
    const examples = [...d.rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5);
    const pref = d.rows.find((x) => x.id === 'maz-81184-81185-w');
    if (pref && !examples.some((x) => x.id === pref.id)) examples.unshift(pref);
    if (!examples.some((x) => x.id === selEx)) selEx = (pref || examples[0])?.id || null;
    const sp = selEx && store.product(selEx);
    impact.className = 'impact impact--on';
    const ex = examples.find((x) => x.id === selEx) || examples[0];
    const gold = changes.find((c) => c.path === P0);
    impact.innerHTML = `
      ${gold ? `<p class="impact__new">Új ár: <b>${num(gold.to)} Ft</b> <em class="${gold.pct > 0 ? 'up' : 'down'}">${pct(gold.pct)}</em></p>` : ''}
      ${d.count ? `<p class="impact__say"><b>${d.count} gyűrű</b> ára változik, átlagosan <b class="${d.avgPct >= 0 ? 'up' : 'down'}">${pct(d.avgPct)}</b>.</p>`
        : `<p class="impact__say">Az eladási árak <b>nem változnak</b>${gm ? ' – grammáras módban az alapanyagár csak a részletes kalkulációban látható anyagköltséget módosítja' : ''}.</p>`}
      ${d.lost.length ? `<p class="impact__warn"><b>${d.lost.length} gyűrű alapára ár nélkül marad</b> (pl. ${esc(d.lost[0].code)}) – ott „Egyedi árajánlat szükséges” jelenik meg.</p>` : ''}
      ${examples.length ? `<ul class="impact__few">${[...d.rows].sort((a, b) => (a.id === 'maz-81184-81185-w' ? -1 : b.id === 'maz-81184-81185-w' ? 1 : Math.abs(a.old - 300000) - Math.abs(b.old - 300000))).slice(0, 3).map((r) => `<li><span>${esc(r.code)}</span><s>${ft(r.old)}</s><b>${ft(r.now)}</b></li>`).join('')}</ul>` : ''}
      ${big.length ? `<label class="confirm"><input type="checkbox" data-confirm ${confirmBig ? 'checked' : ''}><span><b>Nagy változás (${pct(big[0].pct)}).</b> Ellenőriztem, jó a szám.</span></label>` : ''}
      <div class="impact__btns">
        <button class="abtn abtn--xl" type="button" data-cancel>Mégsem</button>
        <button class="abtn abtn--gold abtn--xl" type="button" data-apply ${big.length && !confirmBig ? 'disabled' : ''}>Új árak alkalmazása</button>
      </div>
      <details class="impact__more">
        <summary>Részletek</summary>
        <ul class="impact__chg">${changes.map((c) => `<li><span>${esc(c.label)}</span><b>${c.from == null ? 'nincs ár' : num(c.from)} → ${c.to == null ? 'nincs ár' : num(c.to)} ${c.unit}</b>${c.pct === null ? '' : `<em class="${c.pct > 0 ? 'up' : 'down'}">${pct(c.pct)}</em>`}</li>`).join('')}</ul>
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
    if (inp && document.activeElement !== inp) inp.value = nv(get(draft, path));
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
    if (s) { const path = s.closest('[data-mfield]').dataset.mfield; setVal(path, (get(draft, path) || 0) + Number(s.dataset.step)); }
    const q = e.target.closest('[data-quick]');
    const pin = () => $(`[data-path="${P0}"]`, el);
    if (q) { const v = Math.round(get(cur, P0) * (1 + Number(q.dataset.quick) / 100) / 100) * 100; setVal(P0, v); pin().value = num(v); }
    const ex = e.target.closest('[data-ex]');
    if (ex) { selEx = ex.dataset.ex; paint(); }
    if (e.target.closest('[data-all]')) allList();
    if (e.target.closest('[data-goimpact]')) impact.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    if (e.target.closest('[data-cancel]')) { document.body.classList.remove('has-mimpact'); materials(el); toast('A módosítást elvetettük – az árak nem változtak.'); }
    if (e.target.closest('[data-apply]')) {
      const valid = $('[data-valid]', el)?.value;
      const sp = selEx && store.product(selEx);
      const before = sp && priceProduct(sp, null, cur, st.settings);
      for (const c of changedPaths(cur, draft)) {               // amit a tulajdonos maga írt be, az jóváhagyott adat
        const m = /^diamonds\.(\d+)\./.exec(c.path);
        if (m) draft.diamonds[+m[1]].src = 'jovahagyott'; else draft.src = { ...(draft.src || {}), [c.path]: 'jovahagyott' };
      }
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
    if (e.target.closest('[data-verlist]')) {
      e.preventDefault();
      modal(`<div class="form"><h2>Árverziók</h2><p class="hint">Minden árváltozás új verzió. Egy korábbi verzió egy gombbal visszaállítható – a gyűrűk ára azonnal ahhoz igazodik.</p>
        <ol class="verlist">${versions.map((h, i) => `<li><span><b>${versions.length - i}. verzió</b>${i === 0 ? ' <em class="tag tag--blue">érvényben</em>' : ''}<small>${dateHu(h.at)} · ${esc(h.title)}${h.count ? ` · ${h.count} gyűrű ára változott` : ''}</small></span>
          ${h.before ? `<button class="abtn" type="button" data-verrev="${h.id}">Visszaállítás az ez előttire</button>` : ''}</li>`).join('')}</ol>
        <div class="impact__btns"><button class="abtn abtn--xl" data-close>Bezárás</button></div></div>`, {
        onMount: (box, close) => box.addEventListener('click', (ev) => { const b = ev.target.closest('[data-verrev]'); if (b) { store.revert(b.dataset.verrev); close(); toast('A korábbi árverzió visszaállt, a gyűrűk ára frissült.'); materials(el); } }) });
      return;
    }
    const u = e.target.closest('[data-undo]');
    if (u) { store.revert(u.dataset.undo); toast('A korábbi árak visszaálltak.'); materials(el); }
  });
  el.addEventListener('input', (e) => {
    if (e.target.matches('[data-path]')) {
      const path = e.target.dataset.path;
      if (!e.target.value.trim() && path.startsWith('diamonds.')) { set(draft, path, null); paint(); return; }   // üres kőár = egyedi ajánlat
      const v = parseNum(e.target.value); if (Number.isFinite(v) && v >= 0) { set(draft, path, Math.round(v)); paint(); }
    }
    if (e.target.matches('[data-confirm]')) { confirmBig = e.target.checked; paint(); }
  });
  el.addEventListener('focusout', (e) => { if (e.target.matches('[data-path]')) e.target.value = nv(get(draft, e.target.dataset.path)); });
  paint();
}

function changedPaths(a, b) {
  const out = [];
  const push = (path, label, unit) => { const f = get(a, path), t = get(b, path); if (f !== t) out.push({ path, label, unit, from: f, to: t, pct: f && t != null ? ((t - f) / f) * 100 : null }); };
  push('gold24', '24K színarany', 'Ft/g');
  push('platinum', 'Platina', 'Ft/g'); push('palladium', 'Palládium', 'Ft/g'); push('titanium', 'Titán', 'Ft/g');
  push('alloyAll', 'Aranyötvözet', 'Ft/g');
  for (const m of METAL_ORDER) push(`sellPerGram.${m}`, `Grammár – ${METALS[m].short}`, 'Ft/g');
  a.diamonds.forEach((d, i) => push(`diamonds.${i}.price`, d.name, 'Ft/db'));
  return out;
}
const get = (o, path) => path.split('.').reduce((x, k) => x?.[k], o);
const set = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };

/* ---------- 3. Gyűrűk kezelése ---------- */
const PFILTERS = [['mind', 'Mind'], ['egyedi', 'Egyedi áras'], ['koves', 'Köves'], ['pár', 'Gyűrűpár'], ['arres', 'Alacsony árrés'], ['arnelkul', 'Ár nélkül'], ['rejtett', 'Rejtett']];
function products(el) {
  el = fresh(el);
  const st = S();
  const all = Object.fromEntries(st.products.map((p) => [p.id, priceProduct(p, null, st.materials, st.settings)]));
  const res = Object.fromEntries(Object.entries(all).map(([k, r]) => [k, r.final === null ? null : r]));
  let q = '', f = 'mind', sort = 'cikkszam';
  el.innerHTML = `
    <h1 class="adm__h1">Gyűrűk kezelése</h1>
    <p class="adm__lead">Az árak a képletből számolódnak. Egy gyűrűnél rögzíthet egyedi árat is – azt az aranyár változása nem írja felül.</p>
    <div class="ptools">
      <label class="field field--search"><span>Keresés cikkszámra vagy névre</span><input class="input input--lg" data-q placeholder="pl. 81184"></label>
      <div class="ptools__btns"><a class="abtn abtn--gold" href="#/admin/gyuru/uj" data-newprod>+ Új gyűrű felvitele</a><button class="abtn" type="button" data-print>Árlista nyomtatása</button><button class="abtn" type="button" data-csv>Árlista letöltése (Excel)</button></div>
    </div>
    <div class="pfilter" role="group" aria-label="Szűrés">${PFILTERS.map(([k, l]) => `<button type="button" data-pf="${k}" aria-pressed="${k === f}">${l}</button>`).join('')}
      <label class="pfilter__sort"><span>Sorrend</span><select class="input" data-psort><option value="cikkszam">Cikkszám</option><option value="ar-le">Ár (drágább elöl)</option><option value="ar-fel">Ár (olcsóbb elöl)</option><option value="elteres">Eltérés a mostani weboldali ártól</option></select></label></div>
    <p class="adm__meta" data-pcount></p>
    <div class="plist" data-list></div>`;
  const rows = () => {
    let list = st.products.filter((p) => (p.code + ' ' + p.name).toLowerCase().includes(q)).filter((p) =>
      f === 'mind' || (f === 'egyedi' && (p.override || p.minPrice)) || (f === 'koves' && p.rings.some((r) => r.stoneRule)) || (f === 'pár' && p.kind === 'p') || (f === 'arres' && res[p.id]?.lowMargin) || (f === 'arnelkul' && !res[p.id]) || (f === 'rejtett' && p.visible === false));
    const fv = (p, d) => res[p.id] ? res[p.id].final : d;
    const dev = (p) => p.listaAr && res[p.id] ? (res[p.id].final - p.listaAr) / p.listaAr : 0;
    if (sort === 'ar-le') list.sort((a, b) => fv(b, -1) - fv(a, -1));
    if (sort === 'ar-fel') list.sort((a, b) => fv(a, Infinity) - fv(b, Infinity));
    if (sort === 'elteres') list.sort((a, b) => Math.abs(dev(b)) - Math.abs(dev(a)));
    return list;
  };
  const paint = () => {
    let list = rows();
    $('[data-pcount]', el).textContent = `${list.length} gyűrű`;
    if (sort === 'cikkszam') list = [...list.filter((p) => p.added), ...list.filter((p) => !p.added)];   // az újonnan felvett gyűrűk elöl
    $('[data-list]', el).innerHTML = list.slice(0, limit).map((p) => {
      const r = res[p.id];
      if (!r) return `<a class="prow" href="#/admin/gyuru/${p.id}">
        <span class="prow__img">${productMedia(p)}</span>
        <span class="prow__txt"><b>${esc(p.code)}</b><span>${esc(p.name)}</span><span class="prow__tags"><em class="tag tag--warn">${p.priceOnRequest ? 'az eredeti oldalon nincs ár' : 'nincs megbízható ár'}</em>${p.visible === false ? '<em class="tag">rejtett</em>' : ''}</span></span>
        <span class="prow__price"><b>egyedi ajánlat</b><small>${esc(all[p.id].reason || '')}</small></span>
        <span class="abtn">Szerkesztés</span></a>`;
      const dv = p.listaAr ? ((r.final - p.listaAr) / p.listaAr) * 100 : null;
      return `<a class="prow" href="#/admin/gyuru/${p.id}">
        <span class="prow__img">${productMedia(p)}</span>
        <span class="prow__txt"><b>${esc(p.code)}</b><span>${esc(p.name)}</span>
          <span class="prow__tags">${p.override ? `<em class="tag tag--blue">${p.override.type === 'fixed' ? 'rögzített ár' : `képlet ${pct(p.override.value)}`}</em>` : '<em class="tag tag--formula">képletből</em>'}${r.lowMargin ? '<em class="tag tag--warn">alacsony árrés</em>' : ''}${p.minPrice ? '<em class="tag">minimumár</em>' : ''}${p.visible === false ? '<em class="tag">rejtett</em>' : ''}${p.added ? '<em class="tag tag--blue">új, itt felvéve</em>' : p.approved ? '<em class="tag tag--ok">jóváhagyott adat</em>' : '<em class="tag">becsült tömeg</em>'}</span></span>
        <span class="prow__price"><b>${ft(r.final)}</b>
          <small>${p.listaAr ? `weboldalon most: ${ft(p.listaAr)}${Math.abs(dv) >= 0.5 ? ` (${pct(dv)})` : ''}` : 'új gyűrű'}</small></span>
        <span class="abtn">Szerkesztés</span>
      </a>`;
    }).join('') + (list.length > limit ? `<button class="abtn abtn--xl plist__more" type="button" data-pmore>Továbbiak mutatása (még ${list.length - limit})</button>` : '') || '<p>Nincs találat.</p>';
  };
  let limit = 30;
  const csv = () => {
    const sep = ';';
    const lines = [['Cikkszám', 'Megnevezés', 'Kalkulált ár (Ft)', 'Árforrás', 'Becsült tömeg (g)', 'Weboldali ár most (Ft)'].join(sep)];
    st.products.forEach((p) => { const r = res[p.id]; lines.push([p.code, p.name, r ? r.final : 'egyedi ajánlat', r ? (r.source === 'keplet' ? 'képlet' : r.source === 'rogzitett' ? 'rögzített' : 'módosított') : '', r ? String(r.grams).replace('.', ',') : '', p.listaAr || ''].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(sep)); });
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
  d.innerHTML = `<header><img src="img/logo.png" alt="Karikagyuru.com" width="135"><div><h1>Árlista</h1><p>${dayHu(new Date().toISOString())} · ${st.settings.pricingMode === 'gramm' ? `14K grammár: ${ft(st.materials.sellPerGram.au14)}/g` : `24K színarany: ${ft(st.materials.gold24)}/g`}</p></div></header>
    <table><thead><tr><th>Cikkszám</th><th>Megnevezés</th><th>Anyag</th><th>Ár (bruttó)</th></tr></thead><tbody>
    ${st.products.map((p) => `<tr><td>${esc(p.code)}</td><td>${esc(p.name)}</td><td>${(COLORS[p.baseColor]?.label || '') + ', 14K'}${p.rings.some((r) => r.stoneRule) ? ', természetes gyémánttal' : ''}</td><td>${res[p.id] ? ft(res[p.id].final) : 'egyedi ajánlat'}</td></tr>`).join('')}
    </tbody></table><p class="ps__note">Tájékoztató árak alapméretben. A végleges ár a személyes egyeztetésen készül.</p>`;
  document.body.append(d);
  setTimeout(() => { window.print(); }, 50);
  addEventListener('afterprint', () => d.remove(), { once: true });
}

const RULE_MODES = [['none', 'Nincs kő'], ['free', 'Választható kőszám'], ['fixed', 'Kötött kőszám'], ['perSize', 'Körbe foglalt (mérettől függ)'], ['quote', 'Csak egyedi ajánlattal']];
function productEdit(el, id) {
  el = fresh(el);
  const st = S();
  const isNew = id === 'uj';
  const blankRing = (label, refSize, share) => ({ label, refSize, refWidth: 4, share, weight: 0, labor: 0, other: 0, stoneRule: null });
  const orig = isNew ? { id: '', code: '', name: '', real: false, added: true, listaAr: null, img: '', priceOnRequest: false, kind: 'p', baseColor: 'sarga', colors: ['sarga', 'feher', 'rose'],
    metals: ['au14', 'au18'], style: 'klasszikus', visible: true, sites: ['karikagyuru', 'budapest'], widths: [4],
    rings: [blankRing('Női gyűrű', 54, 0.43), blankRing('Férfi gyűrű', 64, 0.57)], approved: false, override: null, minPrice: 0 } : store.product(id);
  if (!orig) { el.innerHTML = '<p>A gyűrű nem található.</p>'; return; }
  const p = clone(orig);
  p.opts = { width: { enabled: false, min: null, max: null, step: 0.5, approved: false, ...(p.opts?.width || {}) }, thickness: { enabled: false, values: [], approved: false, ...(p.opts?.thickness || {}) } };
  p.consult = p.consult || []; p.models3d = p.models3d || [];
  const ov = () => p.override?.type || 'nincs';
  const n = (path, label, unit, hint = '') => `<label class="efield"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-p="${path}" value="${esc(String(get(p, path) ?? '').replace('.', ','))}"><i>${unit}</i></span></label>`;
  const chk = (path, label, on) => `<label class="check check--lg"><input type="checkbox" data-b="${path}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
  const arr = (key, val, label, on) => `<label class="check"><input type="checkbox" data-arr="${key}" value="${val}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
  const Mx = st.materials;

  const ruleBox = (r, i) => {
    const rule = r.stoneRule, mode = rule ? rule.mode : 'none';
    return `<div class="rulebox">
      <label class="efield"><span>Kövek<small>Csak természetes gyémánt. Lehetetlen összeállítást a vásárlói oldal nem enged.</small></span>
        <select class="input input--lg" data-rulemode="${i}">${RULE_MODES.map(([k, l]) => `<option value="${k}" ${k === mode ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${rule ? `<div class="egrid">
        ${mode === 'free' || mode === 'perSize' ? n(`rings.${i}.stoneRule.min`, 'Legkevesebb kő', 'db') + n(`rings.${i}.stoneRule.max`, 'Legtöbb kő', 'db') : ''}
        ${n(`rings.${i}.stoneRule.def`, mode === 'perSize' ? `Kőszám ${sizeSfx(r.refSize)} méretben` : mode === 'fixed' ? 'Kőszám' : 'Alapértelmezett kőszám', 'db')}
        <label class="efield"><span>Alap kőméret</span><select class="input input--lg" data-p="rings.${i}.stoneRule.defCat">${rule.cats.map((c) => { const d = diamond(Mx, c); return d ? `<option value="${c}" ${c === rule.defCat ? 'selected' : ''}>${d.name} – ${d.price == null ? 'nincs ár' : ft(d.price) + '/db'}</option>` : ''; }).join('')}</select></label>
      </div>
      <p class="efield__lab">Választható kőméretek</p>
      <div class="checks">${Mx.diamonds.map((d) => arr(`rings.${i}.stoneRule.cats`, d.id, `${ctFmt(d.ct)} ct ${d.price == null ? '<small>(nincs ár → ajánlat)</small>' : ''}`, rule.cats.includes(d.id))).join('')}</div>
      <div class="checks">${chk(`rings.${i}.stoneRule.allowNone`, 'Kő nélkül is kérhető', rule.allowNone)}${chk(`rings.${i}.stoneRule.demo`, 'Ideiglenes szabály – ötvösmesterrel egyeztetendő', rule.demo)}</div>` : ''}
    </div>`;
  };

  const render = () => {
    const todo = p.approved ? [] : [
      p.rings.some((r) => r.stoneRule?.demo) && 'kőszám és kőméretek (a fotó alapján becsült szabály)',
      'tömeg 14K-ban (a weboldali árból visszaszámolt becslés), referenciaméret és -szélesség',
      p.real && 'megnevezés (a cikkszámból képzett)',
      p.unknownColor && 'alapszín (a cikkszámban nincs színjelölés)',
    ].filter(Boolean);
    el.innerHTML = `
    <p class="crumbs"><a href="#/admin/gyuruk">← Vissza a gyűrűkhöz</a></p>
    <h1 class="adm__h1">${isNew ? 'Új gyűrű felvitele' : esc(p.code)}</h1>

    <div class="edit">
      <div class="edit__form">
        <section class="ebox"><h2>Alapadatok</h2>
          <div class="egrid">
            <label class="efield"><span>Cikkszám</span><input class="input input--lg" data-t="code" value="${esc(p.code)}"></label>
            <label class="efield"><span>Megnevezés</span><input class="input input--lg" data-t="name" value="${esc(p.name)}"></label>
            <label class="efield"><span>Stílus</span><select class="input input--lg" data-t="style">${Object.entries(STYLES).map(([k, v]) => `<option value="${k}" ${p.style === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>

          </div>
          ${isNew ? `<p class="efield__lab">Típus</p><div class="seg seg--lg seg--wrap"><button type="button" data-kind="p" aria-pressed="${p.kind === 'p'}">Gyűrűpár (női + férfi)</button><button type="button" data-kind="s" aria-pressed="${p.kind === 's'}">Egy gyűrű</button></div>` : ''}
          <p class="efield__lab">Fénykép <small>saját fotó a gyűrűről</small></p>
          <div class="imgpick">
            <div class="imgpick__prev" data-imgprev>${p.img ? `<img src="${esc(p.img)}" alt="">` : '<span>Még nincs kép</span>'}</div>
            <div class="imgpick__ctl">
              <label class="abtn imgpick__file">Kép kiválasztása<input type="file" accept="image/*" data-imgfile hidden></label>
              <label class="efield"><span>vagy a kép webcíme</span><input class="input input--lg" data-imgurl placeholder="https://…" value="${esc(/^https?:/.test(p.img || '') ? p.img : '')}"></label>
              <p class="hint">A kép kicsinyítve tárolódik.</p>
            </div>
          </div>
          <p class="efield__lab">Aranyszínek <small>amiből kérhető</small></p>
          <div class="checks">${['sarga', 'feher', 'rose'].map((c) => arr('colors', c, COLORS[c].label, p.colors.includes(c))).join('')}</div>
          <label class="efield"><span>A fotón látható szín</span><select class="input input--lg" data-t="baseColor">${p.colors.map((c) => `<option value="${c}" ${p.baseColor === c ? 'selected' : ''}>${COLORS[c]?.label || c}</option>`).join('')}</select></label>
          <div class="checks">${chk('visible', 'Megjelenik a weboldalon', p.visible !== false)}${chk('priceOnRequest', 'Csak egyedi ajánlattal (ár nélkül)', !!p.priceOnRequest)}</div>
          <p class="efield__lab">Melyik weboldalon? <small>közös termék- és áradminisztráció</small></p>
          <div class="checks">${Object.entries(SITES).map(([k, v]) => arr('sites', k, v, (p.sites || []).includes(k))).join('')}</div>
          <p class="efield__lab">Választható anyagok</p>
          <div class="checks">${METAL_ORDER.map((m) => arr('metals', m, METALS[m].short, p.metals.includes(m))).join('')}</div>
          ${p.listaAr ? `<p class="hint">A karikagyuru.com-on jelenleg feltüntetett ár: <b>${ft(p.listaAr)}</b> (valós, összehasonlításhoz).</p>` : `<p class="warn">Ennél a modellnél az eredeti oldalon nincs ár, ezért „egyedi ajánlat” szerepel. Adja meg a tömeget, vagy rögzített árat.</p>`}
        </section>
        ${p.rings.map((r, i) => `<section class="ebox"><h2>${esc(r.label)}</h2>
          <div class="egrid">
            ${n(`rings.${i}.refSize`, 'Referenciaméret', 'mm', 'ehhez a mérethez tartozik a tömeg')}
            ${n(`rings.${i}.weight`, 'Tömeg 14K-ban', 'g', `${sizeSfx(r.refSize)} méretben – ${p.approved ? 'jóváhagyott' : 'becslés'}`)}
            ${n(`rings.${i}.refWidth`, 'Szélesség', 'mm', 'a vásárló online nem választhat mást; eltérő szélesség személyes egyeztetéssel')}
            ${n(`rings.${i}.labor`, 'Munkadíj', 'Ft', st.settings.pricingMode === 'gramm' ? 'grammáras módban nem számít bele (a grammár tartalmazza)' : 'nem függ az arany árától')}
            ${n(`rings.${i}.other`, 'Egyéb költség', 'Ft')}
          </div>
          <p class="hint" data-wline="${i}"></p>${ruleBox(r, i)}</section>`).join('')}
        <section class="ebox ebox--opts" data-optsbox><h2>Mit állíthat a vásárló ezen a gyűrűn?</h2>
          <p class="hint">Itt gyűrűnként szabhatja meg a határokat. Amit nem engedélyez és nem hagy jóvá, azt a vásárló nem tudja átállítani – ott a „személyes egyeztetés” jelenik meg. A program számszaki ellenőrzése nem helyettesíti az Ön szakmai döntését.</p>
          <h3 class="ebox__h3">Méretek</h3>
          <div class="egrid">${p.rings.map((r, i) => `${n(`rings.${i}.sizeMin`, `${esc(r.label)} – legkisebb méret`, 'mm', `üresen: ${r.refSize < 60 ? 44 : 54}`)}${n(`rings.${i}.sizeMax`, `${esc(r.label)} – legnagyobb méret`, 'mm', `üresen: ${r.refSize < 60 ? 64 : 76}`)}`).join('')}</div>
          <h3 class="ebox__h3">Szélesség</h3>
          <div class="checks">${chk('opts.width.enabled', 'A vásárló választhat szélességet', p.opts.width.enabled)}</div>
          ${p.opts.width.enabled ? `<div class="egrid">${n('opts.width.min', 'Legkeskenyebb', 'mm')}${n('opts.width.max', 'Legszélesebb', 'mm')}${n('opts.width.step', 'Lépésköz', 'mm', 'jellemzően 0,5')}</div>
            <div class="checks">${chk('opts.width.approved', 'Jóváhagyom ezeket a szélességhatárokat ennél a gyűrűnél', p.opts.width.approved)}</div>
            <p class="hint" data-wstate></p>` : '<p class="hint">Kikapcsolva: a vásárló a gyűrű saját szélességét látja, mást személyes egyeztetéssel kérhet.</p>'}
          <h3 class="ebox__h3">Vastagság</h3>
          <div class="egrid">${p.rings.map((r, i) => n(`rings.${i}.thickness`, `${esc(r.label)} – vastagság`, 'mm', 'ha ismert')).join('')}</div>
          <div class="checks">${chk('opts.thickness.enabled', 'A vásárló választhat vastagságot', p.opts.thickness.enabled)}</div>
          ${p.opts.thickness.enabled ? `<label class="efield"><span>Választható vastagságok<small>mm, pontosvesszővel elválasztva</small></span><input class="input input--lg" data-tvals value="${esc((p.opts.thickness.values || []).map((v) => String(v).replace('.', ',')).join('; '))}" placeholder="pl. 1,6; 1,8; 2"></label>
            <div class="checks">${chk('opts.thickness.approved', 'Jóváhagyom ezeket a vastagságokat ennél a gyűrűnél', p.opts.thickness.approved)}</div>` : ''}
          <div class="optwarn" data-optwarn></div>
          <h3 class="ebox__h3">Amihez személyes egyeztetés kell</h3>
          <label class="efield"><span>Soronként egy<small>a gyűrű oldalán az „Amit külön egyeztetünk” részben jelenik meg</small></span><textarea class="input" rows="3" data-consult placeholder="pl. kő a férfigyűrűbe&#10;más felület">${esc(p.consult.join('\n'))}</textarea></label>
          <h3 class="ebox__h3">3D-modellek <small>előkészítve – megjelenítő még nincs</small></h3>
          <p class="hint">Ide kerülnek majd a gyűrű webes 3D-fájljai (.glb), anyag- és kőváltozatonként. Az eredeti tervfájlokat (.3dm) ne ide töltse fel.</p>
          <div class="m3d" data-m3d>${p.models3d.map((m, k) => `<div class="m3d__row"><input class="input" data-m3="${k}|label" value="${esc(m.label || '')}" placeholder="megnevezés (pl. 14K, 3 kővel)"><input class="input" data-m3="${k}|url" value="${esc(m.url || '')}" placeholder="fájl webcíme (.glb)"><button type="button" class="abtn" data-m3del="${k}">Törlés</button></div>`).join('')}</div>
          <button type="button" class="abtn" data-m3add>+ 3D-modell hozzáadása</button>
        </section>
        <section class="ebox"><h2>Egyedi ár</h2>
          <div class="seg seg--lg seg--wrap" data-ov>
            <button type="button" data-ovt="nincs" aria-pressed="${ov() === 'nincs'}">Képlet szerint</button>
            <button type="button" data-ovt="pct" aria-pressed="${ov() === 'pct'}">Képlet ± százalék</button>
            <button type="button" data-ovt="fixed" aria-pressed="${ov() === 'fixed'}">Rögzített ár</button>
          </div>
          <div data-ovfield></div>
          ${n('minPrice', 'Minimumár (védelem)', 'Ft', 'ennél olcsóbban sosem jelenik meg; 0 = nincs')}
        </section>
        <section class="ebox ${p.approved ? 'ebox--ok' : 'ebox--todo'}"><h2>Adatok állapota ${srcBadge(p.approved ? 'jovahagyott' : 'demo')}</h2>
          ${todo.length ? `<ul>${todo.map((t) => `<li>${t}</li>`).join('')}</ul><p class="hint">Ezeket az ötvösmesternek kell megerősítenie, mielőtt az árak élesek lesznek.</p>` : '<p class="hint">Az ötvös jóváhagyta a tömeg- és kőadatokat.</p>'}
          <div class="checks">${chk('approved', 'Az ötvös jóváhagyta ennek a gyűrűnek a tömeg- és kőadatait', !!p.approved)}</div></section>
        <div class="edit__btns">
          <a class="abtn abtn--xl" href="#/admin/gyuruk">Mégsem</a>
          <button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button>
        </div>
      </div>
      <aside class="edit__calc" data-calc aria-live="polite"></aside>
    </div>`;
    ovField(); calc();
  };

  const ovField = () => {
    const t = ov();
    $('[data-ovfield]', el).innerHTML = t === 'pct' ? n('override.value', 'Eltérés a képlettől', '%', 'pl. −5 vagy 10')
      : t === 'fixed' ? n('override.value', 'Rögzített bruttó ár', 'Ft', 'az aranyár változása nem írja felül') : '';
  };
  const calc = () => {
    const ws = $('[data-wstate]', el);
    if (ws) { const v = optionValues(p, 'width'); ws.innerHTML = v ? `A vásárló ezekből választhat: <b>${v.map((x) => dec(x)).join(' · ')} mm</b>` : `Most még nem választható: ${optionReason(p, 'width')}.`; }
    const ow = $('[data-optwarn]', el);
    if (ow) {
      const w = [];
      const plainGold = !p.rings.some((r) => r.stoneRule);
      if (p.opts.width.enabled && Number.isFinite(p.opts.width.min) && p.opts.width.min < 3.5 && plainGold) w.push('A legkeskenyebb érték 3,5 mm alatt van. Hagyományos, kő nélküli gyűrűnél ez az Ön iránymutatása szerint kerülendő.');
      const ts = [...(p.opts.thickness.enabled ? p.opts.thickness.values || [] : []), ...p.rings.map((r) => r.thickness)].filter((x) => Number.isFinite(x));
      if (ts.some((x) => x <= 1.3)) w.push('1,3 mm vagy az alatti vastagság szerepel. Ilyen vékonyan a gyűrű elveszítheti a tartását.');
      ow.innerHTML = w.length ? `<p class="warn">${w.join('<br>')}</p><p class="hint">Ezek figyelmeztetések, nem tiltások – a határ a gyűrű szerkezetétől függ, a döntés az Öné.</p>` : '';
    }
    p.rings.forEach((rg, i) => { const w = $(`[data-wline="${i}"]`, el); if (w) w.innerHTML = 'Tömeg anyagonként ' + sizeSfx(rg.refSize) + ' méretben: ' + p.metals.map((m) => `${METALS[m].short} <b>${dec(Math.round((refWeight(rg, m, st.settings) || 0) * 100) / 100)} g</b>`).join(' · ') + ' <small>(az ügyfél példatömegeinek arányával)</small>'; });
    const r = priceProduct(p, defaultConfig(p), st.materials, st.settings);
    const b = r.breakdown, s = st.settings;
    if (!b) { $('[data-calc]', el).innerHTML = `<h2>Árkalkuláció</h2><div class="calc-final"><span>Megjelenő ár</span><b>Egyedi ajánlat</b></div><p class="warn">${esc(r.reason || '')}</p>`; return; }
    const line = (l, v, cls = '') => `<div class="${cls}"><dt>${l}</dt><dd>${ft(v)}</dd></div>`;
    const gm = b.mode === 'gramm';
    $('[data-calc]', el).innerHTML = `<h2>Árkalkuláció <small>alapkonfiguráció, ${METALS[r.cfg.metal].short}</small></h2>
      <p class="hint">${dec(r.grams)} g ${gm ? `× ${ft(st.materials.sellPerGram[r.cfg.metal])}/g grammár` : `ötvözet · ebből ${dec(r.pure)} g színarany × ${ft(st.materials.gold24)}/g`}</p>
      <dl class="calc-dl">
        ${gm ? r.parts.map((x, i) => line(`${esc(p.rings[i].label)}: ${dec(x.grams)} g × ${ft(x.sellPerGram)}/g`, x.gramSell)).join('') : `${line('Nemesfém (veszteséggel)', b.metal)}${line('Munkadíj', b.labor)}`}
        ${b.stones ? line('Természetes gyémántok (darabár)', gm ? b.stonesGross : b.stones) : ''}${b.setting ? line('Kőfoglalás', b.setting) : ''}${b.other ? line('Doboz, tanúsítvány, egyéb', b.other) : ''}
        ${gm ? '' : line('Önköltség összesen', b.cost, 'sum')}
        ${gm ? '' : line(`Felár (fém, munka ${s.markupMetal}% · kő ${s.markupStones}%)`, b.net - b.cost)}
        ${gm ? `${line('Bruttó összesen', b.gross, 'sum')}${line(`ebből ÁFA ${s.vatPct}%`, b.gross - b.net)}` : `${line('Nettó ár', b.net)}${line(`ÁFA ${s.vatPct}%`, b.gross - b.net)}`}
        ${rawRows(r, s.roundTo, line)}
      </dl>
      <p class="hint">Kerekítés ${srcBadge((s.src || {}).roundTo || 'demo')} – a Felárak és munkadíjak oldalon állítható.</p>
      <div class="calc-final"><span>Megjelenő ár${r.source !== 'keplet' ? (r.source === 'rogzitett' ? ' – rögzített' : ' – módosított') : ''}</span><b>${ft(r.final)}</b></div>
      ${b.materialCost ? `<p class="hint">Tájékoztató anyagköltség (alapanyagárral): <b>${ft(b.materialCost)}</b>${gm ? ` – a fennmaradó ${ft(b.gross - b.materialCost - (b.stonesGross || 0))} fedezi a munkát, a díjakat, az árrést és az ÁFA-t.` : ''}</p>` : ''}
      ${r.marginPct === null ? '' : `<p class="${r.lowMargin ? 'warn' : 'ok'}">Árrés: ${dec(Math.round(r.marginPct * 10) / 10)}% ${r.lowMargin ? `– kisebb, mint a beállított ${s.minMarginPct}% minimum!` : ''}</p>`}
      ${r.minHit ? '<p class="warn">A minimumár lépett életbe.</p>' : ''}
      ${r.warnings.length ? `<p class="warn">${esc(r.warnings.join(' '))}</p>` : ''}`;
  };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ovt]');
    if (b) {
      const t = b.dataset.ovt;
      p.override = t === 'nincs' ? null : { type: t, value: t === 'fixed' ? (priceProduct({ ...p, priceOnRequest: false }, null, st.materials, st.settings, { applyOverride: false }).final || 0) : 0 };
      $$('[data-ovt]', el).forEach((x) => x.setAttribute('aria-pressed', x === b));
      ovField(); calc();
    }
    if (e.target.closest('[data-m3add]')) { p.models3d.push({ id: 'm' + Date.now().toString(36), label: '', url: '', metals: [], stones: 'any' }); render(); return; }
    const md = e.target.closest('[data-m3del]');
    if (md) { p.models3d.splice(+md.dataset.m3del, 1); render(); return; }
    const kb = e.target.closest('[data-kind]');
    if (kb && isNew) {
      p.kind = kb.dataset.kind;
      p.rings = p.kind === 'p' ? [blankRing('Női gyűrű', 54, 0.43), blankRing('Férfi gyűrű', 64, 0.57)] : [blankRing('Gyűrű', 54, 1)];
      render(); return;
    }
    if (e.target.closest('[data-save]')) {
      if (!p.metals.length) { toast('Legalább egy anyagot jelöljön be.'); return; }
      if (!p.colors.length) { toast('Legalább egy aranyszínt jelöljön be.'); return; }
      if (!p.colors.includes(p.baseColor)) p.baseColor = p.colors[0];
      p.widths = [...new Set(p.rings.map((r) => r.refWidth))];              // gyűrűnként egy szélesség; online nem választható
      if (isNew) {
        if (!p.code.trim() || !p.name.trim()) { toast('Adja meg a cikkszámot és a megnevezést.'); return; }
        const base = 'uj-' + p.code.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let nid = base, k = 2; while (store.product(nid)) nid = `${base}-${k++}`;
        p.id = nid;
        const r0 = priceProduct(p, null, st.materials, st.settings);
        const saved = store.addProduct(clone(p));
        toast(saved ? `Felvéve: <b>${esc(p.code)}</b> – ${r0.final === null ? 'egyedi ajánlattal' : ft(r0.final)}. ${p.visible !== false ? 'Megjelent a vásárlói katalógusban.' : 'Rejtve van.'}`
          : 'Felvéve, de a böngésző tárhelye betelt (túl nagy kép) – frissítés után elveszhet. Használjon kisebb képet vagy webcímet.');
        location.hash = '#/admin/gyuruk'; return;
      }
      const r = priceProduct(p, null, st.materials, st.settings);
      const go = () => { store.updateProduct(id, (x) => { for (const k of Object.keys(x)) delete x[k]; Object.assign(x, clone(p)); }, `${p.code} adatai módosítva`); toast(`Mentve. ${esc(p.code)} ára: <b>${ft(r.final)}</b>`); location.hash = '#/admin/gyuruk'; };
      if (r.lowMargin) {
        modal(`<div class="form"><h2>Alacsony árrés</h2><p>Ennél a gyűrűnél az árrés ${dec(Math.round(r.marginPct * 10) / 10)}%, kevesebb a beállított ${st.settings.minMarginPct}%-os minimumnál. Biztosan menti?</p>
          <div class="impact__btns"><button class="abtn abtn--xl" data-close>Vissza</button><button class="abtn abtn--gold abtn--xl" data-ok>Igen, mentem</button></div></div>`,
          { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); go(); } });
      } else go();
    }
  });
  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-imgfile]') && t.files[0] && api.mode === 'server' && api.admin) {
      $('[data-imgprev]', el).innerHTML = '<span>Feltöltés…</span>';
      uploadPhoto(t.files[0]).then((u) => { p.img = u; $('[data-imgprev]', el).innerHTML = `<img src="${esc(u)}" alt="">`; $('[data-imgurl]', el).value = ''; },
        (err) => { $('[data-imgprev]', el).innerHTML = '<span>Még nincs kép</span>'; toast(`<b>A kép nem került fel.</b> ${esc(err.message)}`, { ms: 12000 }); });
      return;
    }
    if (t.matches('[data-imgfile]') && t.files[0]) {
      const im = new Image(), url = URL.createObjectURL(t.files[0]);
      im.onload = () => {                                   // kicsinyítés: a böngésző tárhelye szűk
        const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        p.img = c.toDataURL('image/jpeg', 0.82); URL.revokeObjectURL(url);
        $('[data-imgprev]', el).innerHTML = `<img src="${p.img}" alt="">`; $('[data-imgurl]', el).value = '';
      };
      im.onerror = () => toast('Ezt a képet nem sikerült megnyitni.');
      im.src = url; return;
    }
    if (t.dataset.t === 'baseColor') { p.baseColor = t.value; return; }
    if (t.dataset.arr === 'colors') { const next = t.checked ? [...new Set([...p.colors, t.value])] : p.colors.filter((x) => x !== t.value); p.colors = next; if (!next.includes(p.baseColor) && next.length) p.baseColor = next[0]; render(); return; }
    if (t.dataset.rulemode !== undefined) {
      const i = +t.dataset.rulemode, ring = p.rings[i], m = t.value;
      if (m === 'none') ring.stoneRule = null;
      else {
        const first = Mx.diamonds.find((d) => d.price != null)?.id || Mx.diamonds[0].id;
        ring.stoneRule = { ...(ring.stoneRule || { min: 0, max: 3, def: 1, cats: [first], defCat: first, allowNone: true, demo: true }), mode: m };
        if (m === 'perSize') Object.assign(ring.stoneRule, { min: Math.max(1, ring.stoneRule.min), allowNone: false });
      }
      render(); return;
    }
    if (t.dataset.b && t.dataset.b.startsWith('opts.')) { set(p, t.dataset.b, t.checked); render(); return; }
    if (t.dataset.b) { set(p, t.dataset.b, t.checked); if (t.dataset.b === 'approved') { if (t.checked) p.rings.forEach((x) => x.stoneRule && (x.stoneRule.demo = false)); render(); return; } calc(); return; }
    if (t.dataset.arr) {
      const list = get(p, t.dataset.arr) || [];
      const next = t.checked ? [...new Set([...list, t.value])] : list.filter((x) => x !== t.value);
      set(p, t.dataset.arr, next);
      if (t.dataset.arr.endsWith('.cats')) { const rule = get(p, t.dataset.arr.replace(/\.cats$/, '')); if (!next.includes(rule.defCat) && next.length) rule.defCat = next[0]; render(); return; }
      calc(); return;
    }
    if (t.tagName === 'SELECT' && t.dataset.p) { set(p, t.dataset.p, t.value); calc(); }
  });
  el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.t) p[t.dataset.t] = t.value;
    if (t.matches('[data-consult]')) { p.consult = t.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12); return; }
    if (t.matches('[data-tvals]')) { p.opts.thickness.values = t.value.split(/[;\s]+/).map(parseNum).filter((x) => Number.isFinite(x) && x > 0); calc(); return; }
    if (t.dataset.m3) { const [k, f] = t.dataset.m3.split('|'); p.models3d[+k][f] = t.value.trim(); return; }
    if (t.dataset.p && !t.value.trim() && /(sizeMin|sizeMax|thickness|opts\.width\.(min|max))$/.test(t.dataset.p)) { set(p, t.dataset.p, null); calc(); return; }
    if (t.matches('[data-imgurl]')) { const u = t.value.trim(); if (/^https?:\/\//.test(u) || !u) { p.img = u; $('[data-imgprev]', el).innerHTML = u ? `<img src="${esc(u)}" alt="" referrerpolicy="no-referrer">` : '<span>Még nincs kép</span>'; } return; }
    if (t.matches('[data-widths]')) { const ws = t.value.split(/[;\s]+/).map(parseNum).filter((x) => Number.isFinite(x) && x > 0); if (ws.length) { p.widths = ws; p.rings.forEach((r) => { if (!ws.includes(r.refWidth)) r.refWidth = ws[0]; }); } }
    if (t.dataset.p && t.tagName !== 'SELECT') { const v = parseNum(t.value); if (Number.isFinite(v)) set(p, t.dataset.p, v); }
    calc();
  });
  render();
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
};
const MODES = {
  pricingMode: [
    ['gramm', 'Grammár szerint – az ötvös módszere', 'Kész tömeg × eladási grammár (benne a fém, a munka, az árrés és az ÁFA). Pl. 4,8 g × 47 000 = 225 600 Ft. Ehhez csak a kövek darabára és a külön díjak adódnak – munkadíj, felár és ÁFA nem számolódik még egyszer.'],
    ['koltseg', 'Költség szerint – összehasonlításnak', 'Alapanyagár (14K = 24K × 0,585) × tömeg + munkadíj + kövek, erre felár és ÁFA. Az alapanyagár változása csak a fém részt mozgatja.'],
  ],
  sizeMethod: [
    ['tomeg', 'Tömeg szerint', 'A tömeg arányos a mérettel: 60-as = 54-es × 60/54. Platina: 379 500 × 60/54 ≈ 421 667 Ft. A kövek és díjak nem változnak a mérettel.'],
    ['ar', 'Egyszerű árarányosítás', 'A kő nélküli rész teljes ára arányosan nő a mérettel. Egyszerűbb, de a munkadíjat is arányosítja.'],
  ],
};
function formula(el) {
  el = fresh(el);
  const st = S();
  const d = clone(st.settings);
  let sampleId = 'maz-81184-81185-w';
  const f = (k, label, unit, help = HELP[k] || '') => `<label class="efield"><span>${label} ${srcBadge((st.settings.src || {})[k.split('.')[0]] || 'demo')}<small>${help}</small></span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="${k}" value="${String(get(d, k)).replace('.', ',')}"><i>${unit}</i></span></label>`;
  const modeBox = (key, title) => `<section class="ebox"><h2>${title} ${srcBadge((st.settings.src || {})[key] || 'demo')}</h2><div class="modes">${MODES[key].map(([v, l, t]) =>
    `<label class="modecard"><input type="radio" name="${key}" value="${v}" data-mode="${key}" ${d[key] === v ? 'checked' : ''}><span><b>${l}${st.settings[key] === v ? ' <em class="tag tag--blue">most aktív</em>' : ''}</b><small>${t}</small></span></label>`).join('')}</div></section>`;
  // munkadíj stílusonként: a leggyakoribb érték
  const byStyle = Object.keys(STYLES).map((k) => {
    const ps = st.products.filter((p) => p.style === k);
    const vals = ps.flatMap((p) => p.rings.map((r) => r.labor));
    const mode = vals.sort((a, b) => vals.filter((x) => x === b).length - vals.filter((x) => x === a).length)[0] || 0;
    return { k, label: STYLES[k], ids: ps.map((p) => p.id), labor: mode };
  }).filter((x) => x.ids.length);

  el.innerHTML = `
    <h1 class="adm__h1">Árképletek és munkadíjak</h1>
    <p class="adm__lead">Itt állítható, milyen módszerrel számol a kalkulátor, és milyen díjak adódnak a gyűrű árához. Ritkán kell hozzányúlni – a mindennapi teendő az <a href="#/admin/alapanyag">Árak</a> menü.</p>
    <div class="formula">
      <p class="formula__eq" data-eq></p>
      <p class="hint">Színarany-tartalom: 14K = 58,5%, 18K = 75%. A szín azonos karátnál nem változtat az árat. A gyémánt darabár × kőszám, nem grammra számolódik – és csak egyszer.</p>
    </div>
    <div class="edit">
      <div class="edit__form">
        ${modeBox('pricingMode', 'Árképzési mód')}
        ${modeBox('sizeMethod', 'Méret hatása az árra')}
        <section class="ebox"><h2>Külön felszámított díjak <small>bruttó, a gyűrű árához adódnak</small></h2><div class="egrid">
          ${f('settingPerStone', 'Kőfoglalás', 'Ft/kő', 'Ha a kő darabára már tartalmazza, maradjon 0.')}${f('engravingPrice', 'Gravírozás', 'Ft/gyűrű')}
          ${f('boxCost', 'Díszdoboz', 'Ft/termék')}${f('certCost', 'Kőtanúsítvány', 'Ft/köves termék')}
          <label class="efield"><span>Kerekítés ${srcBadge((st.settings.src || {}).roundTo || 'demo')}<small>Pl. 100 Ft-ra: 337 333 → 337 400 Ft. Jóváhagyásig ideiglenes.</small></span>${roundSelect(d.roundTo)}</label>${f('vatPct', 'ÁFA', '%', 'Grammáras módban a grammár már tartalmazza – nem adódik hozzá újra.')}
        </div>
        <label class="check check--lg"><input type="checkbox" data-sb="stonesGross" ${d.stonesGross !== false ? 'checked' : ''}><span>A gyémánt darabára végső ár (grammáras módban nincs rá felár és ÁFA) ${srcBadge((st.settings.src || {}).stonesGross || 'demo')}</span></label></section>
        <section class="ebox"><h2>Tömeg anyagonként ${srcBadge((st.settings.src || {}).density || 'demo')}</h2>
          <p class="hint">Ugyanaz a modell az adott anyagból ennyiszer nehezebb, mint 14K aranyból. Az ügyfél példája 54-es méretre: 14K 4,8 g · 18K 5,4 g · platina 6,9 g · palládium 4,0 g · titán 1,5 g.</p>
          <div class="egrid">${['au18', 'pt', 'pd', 'ti'].map((m) => f(`density.${m}`, `${METALS[m].short}`, '×', `4,8 g → ${dec(Math.round(4.8 * get(d, `density.${m}`) * 100) / 100)} g`)).join('')}</div>
        </section>
        <section class="ebox"><h2>Kövek – fizikai korlát</h2>
          <p class="hint">A vásárló csak olyan kőméretet választhat, ami elfér: a kő átmérője ≤ gyűrűszélesség − perem. Körbe foglalásnál a kőszám legfeljebb a kerület ÷ (kőátmérő + hézag).</p>
          <div class="egrid">${f('stoneEdgeMm', 'Perem', 'mm')}${f('stoneGapMm', 'Hézag kövek között', 'mm')}</div>
        </section>
        <details class="ebox ebox--fold"><summary><h2>Csak költségalapú módban</h2></summary>
          <div class="egrid">
          ${f('markupMetal', 'Felár a fémre és munkára', '%')}${f('markupStones', 'Felár a kövekre', '%')}${f('lossPct', 'Gyártási veszteség', '%')}
          ${['pt', 'pd', 'ti'].map((m) => f(`laborFactor.${m}`, `${METALS[m].short} – munkadíj-szorzó`, '×', '')).join('')}</div>
        </details>
        <div class="edit__btns"><a class="abtn abtn--xl" href="#/admin/attekintes">Mégsem</a><button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button></div>
        <section class="ebox" ${st.settings.pricingMode === 'gramm' ? 'hidden' : ''}><h2>Munkadíj stílusonként <small>csak költségalapú módban</small></h2>
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
    const gm = d.pricingMode === 'gramm';
    $('[data-eq]', el).innerHTML = gm
      ? '<span>Tömeg × grammár</span>+<span>kövek darabára</span>+<span>kőfoglalás, gravír, doboz</span>=<b>számított ár</b>'
      : '<span>Nemesfém</span>+<span>ötvözőanyag</span>+<span>drágakövek</span>+<span>munkadíj</span>+<span>egyéb</span>+<span>felár</span>+<span>ÁFA</span>=<b>kalkulált ár</b>';
    const step = (l, v, cls = '') => `<div class="${cls}"><dt>${l}</dt><dd>${ft(v)}</dd></div>`;
    const dd = diffPrices(st.products, st.materials, st.materials, st.settings, d);
    if (!b) { $('[data-calc]', el).innerHTML = `<h2>Hatás és példa</h2><p class="impact__n"><b>${changed.length}</b> gyűrű ára változna.</p><p class="warn">${esc(r1.reason || 'Ennél a gyűrűnél nincs ár.')}</p>`; return; }
    $('[data-calc]', el).innerHTML = `<h2>Hatás és példa</h2>
      <p class="impact__n"><b>${changed.length}</b> gyűrű ára változna${changed.length ? `, átlagosan ${pct(dd.avgPct)}` : ' – nincs módosítás'}.</p>
      ${dd.lost.length ? `<p class="warn">${dd.lost.length} gyűrű ár nélkül maradna (hiányzó grammár vagy adat).</p>` : ''}
      <label class="efield"><span>Példa gyűrű</span><select class="input input--lg" data-sample>${st.products.map((p) => `<option value="${p.id}" ${p.id === sampleId ? 'selected' : ''}>${esc(p.code)}</option>`).join('')}</select></label>
      ${compBar(r0, JSON.stringify(d) !== JSON.stringify(st.settings) ? r1 : null, st.settings, d)}
      <h3>Lépésről lépésre</h3>
      <dl class="calc-dl calc-dl--steps">
        ${gm ? step(`${dec(r1.grams)} g × ${ft(st.materials.sellPerGram[r1.cfg.metal])}/g (bruttó grammár)`, b.gramSell)
          : `${step(`Színarany: ${dec(r1.pure)} g × ${ft(st.materials.gold24)}/g + ${dec(d.lossPct)}% veszteség`, b.metal)}${step('Ötvözőanyag', b.alloy)}${step('Munkadíj', b.labor)}`}
        ${b.stones ? step(gm ? (d.stonesGross === false ? `+ gyémántok (darabár + ${dec(d.markupStones)}% felár + ÁFA)` : '+ gyémántok darabára') : 'Természetes gyémántok', gm ? b.stonesGross : b.stones) : ''}
        ${b.setting ? step('+ kőfoglalás', b.setting) : ''}${b.other + b.engraving ? step('+ doboz, tanúsítvány, gravír', b.other + b.engraving) : ''}
        ${gm ? '' : step('Önköltség', b.cost, 'sum')}
        ${gm ? '' : step(`+ felár (${dec(d.markupMetal)}% / kő ${dec(d.markupStones)}%)`, b.net - b.cost)}
        ${gm ? '' : step(`+ ÁFA ${dec(d.vatPct)}%`, b.gross - b.net)}
        ${rawRows(r1, d.roundTo, step)}
        ${gm ? step(`ebből ÁFA ${dec(d.vatPct)}% (a grammár már tartalmazza)`, r1.calculated - r1.calculated / (1 + d.vatPct / 100), 'rnd') : ''}
      </dl>
      ${r1.marginPct === null ? '<p class="hint">Grammáras módban az árrés nem számolható.</p>' : `<p class="${r1.lowMargin ? 'warn' : 'ok'}">Árrés: ${dec(Math.round(r1.marginPct * 10) / 10)}%${r1.lowMargin ? ` – kevesebb a ${d.minMarginPct}%-os minimumnál!` : ''}</p>`}`;
  };
  el.addEventListener('input', (e) => { const k = e.target.dataset.s; if (k && !e.target.matches('[data-round]')) { const v = parseNum(e.target.value); if (Number.isFinite(v)) { set(d, k, v); calc(); } } });
  el.addEventListener('change', (e) => {
    if (e.target.matches('[data-sample]')) { sampleId = e.target.value; calc(); }
    if (e.target.dataset.mode) { d[e.target.dataset.mode] = e.target.value; calc(); }
    if (e.target.dataset.sb) { d[e.target.dataset.sb] = e.target.checked; calc(); }
    if (e.target.matches('[data-round]')) { d.roundTo = Number(e.target.value); calc(); }
  });
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
      const avg = tmp.reduce((a, p) => a + (old[p.id] ? (now[p.id] - old[p.id]) / old[p.id] : 0), 0) / tmp.length * 100;
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
        <header><b>${esc(q.name)}</b><span class="badge">${STATUS[q.status]}</span><span class="hint">${dateHu(q.at)} · ${q.type === 'konzultacio' ? 'időpontot kér' : q.type === 'egyedi' ? 'saját elképzelés' : q.type === 'telefon' ? 'telefonos ajánlat' : 'érdeklődés'}${q.day ? ` · ${dayHu(q.day)}` : ''}</span></header>
        <p><a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>${q.email ? ` · <a href="mailto:${esc(q.email)}">${esc(q.email)}</a>` : ''}</p>
        ${q.summary ? `<pre>${esc(q.summary)}</pre>` : ''}
        ${q.message ? `<p class="inq__msg">„${esc(q.message)}”</p>` : ''}
        ${q.images ? `<p class="hint">Kiválasztott kép: ${q.images} db – a képeket az ügyfél a személyes egyeztetésre hozza, vagy e-mailben küldi.</p>` : ''}
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
      <label class="efield"><span>Árak kerekítése ${srcBadge((d.src || {}).roundTo || 'demo')}<small>jóváhagyásig ideiglenes beállítás</small></span>${roundSelect(d.roundTo)}</label>
      <label class="efield"><span>Minimális árrés<small>alatta figyelmeztet</small></span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="minMarginPct" value="${d.minMarginPct}"><i>%</i></span></label>
      <label class="efield"><span>Nagy változás határa<small>e fölött külön megerősítés kell</small></span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="bigChangePct" value="${d.bigChangePct}"><i>%</i></span></label>
    </div></section>
    <div class="edit__btns"><button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button></div>
    <section class="ebox"><h2>Adattárolás</h2>
      <p class="hint" data-storage-note>${api.mode === 'server' && api.online ? `Az adatok a szerveren tárolódnak, minden mentés külön változat (most: ${api.version}.).` : 'Az adatok most ebben a böngészőben tárolódnak. A szerveres mentés bejelentkezéssel a tárhelyre telepítés után kapcsolható be.'}</p></section>
    <section class="ebox ebox--danger"><h2>Alapállapot visszaállítása</h2>
      <p>Minden árat, gyűrűt, előzményt és érdeklődést visszaállít a kiinduló állapotra.</p>
      <button class="abtn abtn--xl" type="button" data-reset>Alapállapot visszaállítása</button>
    </section>`;
  el.addEventListener('input', (e) => { const k = e.target.dataset.s; if (k && !e.target.matches('[data-round]')) { const v = parseNum(e.target.value); if (Number.isFinite(v)) d[k] = v; } });
  el.addEventListener('change', (e) => { if (e.target.dataset.s === 'roundTo') d.roundTo = Number(e.target.value); });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-save]')) { store.updateSettings(d, 'Beállítások módosítva'); toast('Beállítások mentve.'); }
    if (e.target.closest('[data-reset]')) resetDemo();
  });
}

export function resetDemo() {
  modal(`<div class="form"><h2>Alapállapot visszaállítása</h2><p>Minden módosítás törlődik, és a kiinduló árakkal, gyűrűkkel indul újra.</p>
    <div class="impact__btns"><button class="abtn abtn--xl" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" data-ok>Visszaállítom</button></div></div>`,
    { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); store.reset(); toast('Visszaállt az alapállapot.'); window.dispatchEvent(new HashChangeEvent('hashchange')); } });
}
