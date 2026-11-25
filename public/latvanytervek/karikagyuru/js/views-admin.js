/* ==========================================================================
   Adminfelület – nagy gombok, egyértelmű magyar feliratok, kevés lépés.
   Szerveroldali mentés és bejelentkezés: services/karikagyuru-api (bekötés: js/api.js).
   ========================================================================== */
import { api, onApi, login, logout, settle, uploadPhoto, mailStatus, mailTest, inquiryFileUrl, deleteInquiry, loadInquiries } from './api.js';
import { store } from './store.js';
import { COLORS, STYLES, SITES, SRC_LABEL } from './data.js';
import { approvalCheck, readiness, optionValues, optionReason, priceProduct, shownPrice, priceAll, diffPrices, defaultConfig, composition, ft, num, dec, pct, METALS, METAL_ORDER, isGold, diamond, refPrice, refWeight, exampleRing, allowedCats, sizeSfx, ctFmt, sizeRange } from './engine.js';
import { $, $$, esc, productMedia, toast as uiToast, modal, M, reduced, dateHu, dayHu, checkPhotos, photos as probe } from './ui.js';
/* Szerver módban a „Mentve” csak a szerver visszaigazolása után igaz: addig „Mentés folyamatban”. */
const toast = (html, o) => uiToast(api.mode === 'server' && api.admin && /^Mentve/.test(html) ? html.replace(/^Mentve:?/, 'Mentés folyamatban:') : html, o);
import { configText } from './views-public.js';
import { DECISION_GROUPS, DECISION_STATUS, decisionOf, decisionCounts } from './decisions.js';

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

/* V5.9 – legfeljebb hat főmenüpont; a korábbi külön oldalak a megfelelő munkafolyamatba kerültek (fülek). */
export const MENU = [
  ['attekintes', 'Áttekintés'],
  ['gyuruk', 'Gyűrűk'],
  ['arak', 'Árak'],
  ['munkak', 'Műhelymunkák'],
  ['erdeklodesek', 'Érdeklődések'],
  ['beallitasok', 'Beállítások'],
];
/** Fülek a főmenüpontokon belül: [útvonal-rész, felirat]. */
export const TABS = {
  gyuruk: [['', 'Gyűrűk listája'], ['ellenorzes', 'Adatok ellenőrzése'], ['fotok', 'Fotók kezelése']],
  arak: [['', 'Árak módosítása'], ['kiprobalas', 'Ár kipróbálása'], ['korabbi', 'Korábbi árak'], ['arlista', 'Árlista']],
  beallitasok: [['', 'Általános'], ['halado', 'Haladó árképzés'], ['jovahagyas', 'Árelemek jóváhagyása']],
};
/** Régi (V5.8) címek → új helyük. Csak a belépés-ellenőrzés UTÁN fut (app.js), így nem kerülhető meg vele. */
export const LEGACY = { alapanyag: 'arak', arszamitas: 'arak/kiprobalas', keplet: 'beallitasok/halado', elozmenyek: 'arak/korabbi',
  jovahagyas: 'beallitasok/jovahagyas', sorban: 'gyuruk/ellenorzes', szabalyok: 'gyuruk', fotok: 'gyuruk/fotok', gyuru: null };
const ALLMENU = MENU;
/** Fejlesztői nézet: CSAK helyi (böngészős) módban, a #/admin/fejleszto címmel kapcsolható be erre a böngészőlapra.
    Ez nem biztonsági határ – a GitHub Pages-en futó helyi admin nem védett. Szerver módban soha nem aktív. */
export const devMode = () => api.mode === 'local' && (() => { try { return sessionStorage.getItem('kg-fejleszto') === '1'; } catch { return false; } })();
const tabsBar = (page, cur) => (TABS[page] ? `<nav class="atabs" aria-label="${(MENU.find(([k]) => k === page) || ['', ''])[1]} – részek">${TABS[page].map(([k, t]) =>
  `<a href="#/admin/${page}${k ? '/' + k : ''}" ${cur !== null && k === (cur || '') ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>` : '');

/* ---------- Szerver mód: mentésjelző, belépés, kilépés ---------- */
function syncText() {
  if (api.save === 'pending') return '<span class="sync sync--wait">Mentés folyamatban…</span>';
  if (api.save === 'error') return `<span class="sync sync--err">${esc(api.error)}</span>`;
  if (api.save === 'saved' && api.savedAt) return `<span class="sync sync--ok">Mentve a szerverre ${api.savedAt.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>`;
  return '<span class="sync">A változások a szerverre mentődnek.</span>';
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

export function adminShell(el, page, arg, arg2) {
  // V5.9: régi címek átirányítása az új helyükre (a belépés ellenőrzése után vagyunk).
  if (page in LEGACY && LEGACY[page] !== null) {
    const to = LEGACY[page].split('/');
    const rest = [arg, arg2].filter(Boolean);
    window.history.replaceState(null, '', `#/admin/${[...to, ...rest].join('/')}`);
    [page, arg, arg2] = [to[0], to[1] || rest.shift(), to[1] ? rest[0] : rest[1]];
  }
  if (page === 'fejleszto' && api.mode === 'local') { try { sessionStorage.setItem('kg-fejleszto', '1'); } catch { /* */ } window.history.replaceState(null, '', '#/admin/beallitasok'); page = 'beallitasok'; arg = ''; }
  const top = page === 'gyuru' ? 'gyuruk' : page;
  const newInq = S().inquiries.filter((q) => q.status === 'uj').length;
  const title = (MENU.find(([k]) => k === top) || ['', page === 'kozpont' ? 'Fejlesztői nyilvántartás' : 'Kezelőfelület'])[1];
  const nav = `<ol>${MENU.map(([k, t]) => `<li><a href="#/admin/${k}" ${top === k ? 'aria-current="page"' : ''}>${t}${k === 'erdeklodesek' && newInq ? `<em aria-label="${newInq} új">${newInq}</em>` : ''}</a></li>`).join('')}</ol>`;
  el.innerHTML = `
  <div class="adm">
    <aside class="adm__nav" aria-label="Admin menü">
      <a class="adm__site" href="#/">← Vissza a weboldalra</a>
      <p class="adm__brand"><img src="img/logo-jel.png" alt="" width="176" height="127">Karikagyuru.com<span>Kezelőfelület</span></p>
      ${api.mode === 'server' && api.admin ? `<p class="adm__sync" data-sync aria-live="polite">${syncText()}</p><button class="adm__logout" type="button" data-logout>Kilépés</button>` : ''}
      <nav data-anav>${nav}</nav>
    </aside>
    <main class="adm__main" id="adm-main">
      ${api.mode === 'server' && api.admin ? `<div class="adm__syncm"><p class="adm__sync adm__sync--m" data-sync aria-live="polite">${syncText()}</p><button class="adm__logout adm__logout--m" type="button" data-logout>Kilépés</button></div>` : ''}
      <div class="adm__mbar" data-mbar-admin>
        <button class="adm__mmenu" type="button" data-amenu aria-expanded="false" aria-controls="adm-mnav">Menü</button>
        <span class="adm__mtitle">${title}</span>
        <a class="adm__site adm__site--m" href="#/">Weboldal</a>
      </div>
      <nav class="adm__mnav" id="adm-mnav" data-amnav hidden aria-label="Admin menü">${nav}</nav>
      ${tabsBar(top, top === page ? (arg || '') : null)}
      <div data-page></div>
    </main>
  </div>`;
  const mb = $('[data-amenu]', el), mn = $('[data-amnav]', el);
  mb.addEventListener('click', () => { const open = mn.hidden; mn.hidden = !open; mb.setAttribute('aria-expanded', String(open)); if (open) mn.querySelector('a')?.focus(); });
  mn.addEventListener('keydown', (e) => { if (e.key === 'Escape') { mn.hidden = true; mb.setAttribute('aria-expanded', 'false'); mb.focus(); } });
  const P = $('[data-page]', el);
  const pages = {
    attekintes: overview,
    gyuruk: (x) => (arg === 'ellenorzes' ? queue(x, arg2) : arg === 'fotok' ? photos(x) : products(x)),
    gyuru: (x) => productEdit(x, arg),
    arak: (x) => (arg === 'kiprobalas' ? priceCalc(x) : arg === 'korabbi' ? history(x) : arg === 'arlista' ? priceLists(x) : materials(x)),
    munkak: (x) => worksAdmin(x, arg),
    erdeklodesek: inquiries,
    beallitasok: (x) => (arg === 'halado' ? formula(x) : arg === 'jovahagyas' ? approvals(x) : settings(x)),
    kozpont: (x) => (devMode() ? decisionsPage(x) : devOnly(x)),
  };
  (pages[page] || overview)(P);
  if (M() && !reduced()) M().animate(P, { opacity: [0, 1], y: [10, 0] }, { duration: 0.35 });
}

/** A fejlesztői nyilvántartás (ügyféldöntések) nem része a tulajdonosi kezelőfelületnek. */
function devOnly(el) {
  el.innerHTML = `<h1 class="adm__h1">Ez az oldal nem érhető el</h1>
    <p class="adm__lead" data-devonly>Ez a fejlesztő belső nyilvántartása, a kezelőfelületen nem jelenik meg. A munkához nincs rá szükség.</p>
    <p><a class="abtn abtn--gold abtn--xl" href="#/admin/attekintes">Vissza az áttekintéshez</a></p>`;
}

/* ---------- V5.8 – Ügyféljóváhagyási központ ----------
   Csak rögzít: a válasz nem módosít árat, termékszabályt vagy jogi szöveget. Az átvezetés külön lépés. */
function decisionsPage(el) {
  el = fresh(el);
  const draw = () => {
    const st = S();
    const c = decisionCounts(st);
    el.innerHTML = `
      <h1 class="adm__h1">Ügyféljóváhagyások</h1>
      <p class="adm__lead">Minden kérdés, amit az ötvösnek kell eldöntenie. Írja be a választ, és mentse.</p>
      <div class="dec__rules" role="note"><p><b>Fontos:</b> a beírt válasz <b>nem írja át</b> magától az árakat, a gyűrűk szabályait vagy a jogi szövegeket. A döntést utána a megadott menüpontban kell átvezetni, és csak ezután jelölhető „Átvezetve”-nek.</p></div>
      <p class="dec__sum" data-dec-sum><span data-dec-n="nyitott">${c.nyitott} nyitott</span> · <span data-dec-n="valasz">${c.valasz} válasz rögzítve</span> · <span data-dec-n="atvezetve">${c.atvezetve} átvezetve</span>
        <button class="abtn dec__print" type="button" data-dec-print>Nyomtatás</button></p>
      ${DECISION_GROUPS.map((g) => `<section class="dec__grp" data-dec-group="${g.id}"><h2>${esc(g.title)}</h2>
        ${g.items.map((it) => { const d = decisionOf(st, it.id); const now = typeof it.now === 'function' ? it.now(st) : it.now;
          return `<article class="dec dec--${d.status}" data-dec="${it.id}">
            <header><h3>${esc(it.label)}</h3><span class="dec__st" data-dec-status>${DECISION_STATUS[d.status]}</span></header>
            <dl><div><dt>Most az oldalon</dt><dd>${esc(now)}</dd></div><div><dt>Forrás</dt><dd>${esc(it.source)}</dd></div><div><dt>Kérdés</dt><dd><b>${esc(it.question)}</b></dd></div></dl>
            <label class="efield"><span>Az ügyfél válasza</span><textarea class="input" rows="2" maxlength="2000" data-dec-answer>${esc(d.answer || '')}</textarea></label>
            <p class="dec__act">
              <button class="abtn abtn--gold" type="button" data-dec-save>Válasz mentése</button>
              ${d.status === 'valasz' ? `<button class="abtn" type="button" data-dec-apply>Átvezettem${it.where ? '' : ' (nincs külön menüpont)'}</button>` : ''}
              ${d.status !== 'nyitott' ? '<button class="abtn" type="button" data-dec-reopen>Vissza nyitottra</button>' : ''}
              ${it.where && it.where !== '#/admin/kozpont' ? `<a class="linkbtn" href="${it.where}">Átvezetés helye →</a>` : ''}
            </p>
            <p class="dec__saved" data-dec-saved aria-live="polite">${d.at ? `Mentve: ${esc(dateHu(d.at))}` : 'Még nincs mentve.'}</p>
          </article>`; }).join('')}</section>`).join('')}`;
  };
  draw();
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-dec-print]')) { window.print(); return; }
    const card = e.target.closest('[data-dec]'); if (!card) return;
    const id = card.dataset.dec;
    const answer = $('[data-dec-answer]', card).value;
    const out = (res, msg) => {
      if (!res.ok) { const s = $('[data-dec-saved]', card); s.textContent = res.error; s.classList.add('dec__err'); return; }
      if (res.saved === false) { draw(); const s = $(`[data-dec="${id}"] [data-dec-saved]`, el); s.textContent = 'Nem sikerült tartósan menteni (a böngésző nem engedi). Az oldal újratöltése után elveszhet.'; s.classList.add('dec__err'); return; }
      draw(); toast(msg);
    };
    if (e.target.closest('[data-dec-save]')) out(store.saveDecision(id, { status: 'valasz', answer }), 'Mentve: a válasz rögzítve. Az árak és szabályok nem változtak.');
    else if (e.target.closest('[data-dec-reopen]')) out(store.saveDecision(id, { status: 'nyitott', answer }), 'Mentve: a tétel újra nyitott.');
    else if (e.target.closest('[data-dec-apply]')) {
      modal(`<h2>Biztosan átvezette?</h2><p>Csak akkor jelölje, ha a döntést már beírta a megfelelő menüpontban (például az Árak oldalon), és ott el is mentette. Ez a gomb maga semmit nem módosít.</p>
        <p class="dec__act"><button class="abtn abtn--gold" type="button" data-ok>Igen, átvezettem</button> <button class="abtn" type="button" data-no>Mégsem</button></p>`,
        { label: 'Megerősítés', onMount: (box, close) => { box.querySelector('[data-ok]').onclick = () => { close(); out(store.saveDecision(id, { status: 'atvezetve', answer }), 'Mentve: átvezetettként jelölve.'); }; box.querySelector('[data-no]').onclick = close; } });
    }
  });
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
  kozpont: 'Az ötvösnek feltett kérdések és a válaszai. Semmit nem ír át magától.',
};
/* V5.6 – Tisztázandó kérdések: a bizonytalan értékek jól látható figyelmeztetése az adminban.
   Forrás: a beállításokba írt nyitott kérdések (csak a szerveren / adminban – a nyilvános nézet nem kapja meg)
   + minden „megerősítendő” jelölésű árelem. Amíg nyitottak, a rendszer a jóváhagyott képlettel számol, ezekkel nem. */
function openQuestions(st) {
  const qs = (st.settings.openQuestions || []).filter((x) => String(x).trim());
  const unsure = [
    ...st.materials.diamonds.filter((d) => d.src === 'bizonytalan').map((d) => `${d.name}: az ár megerősítendő${d.note && !/megerősítendő/i.test(d.note) ? ` (${d.note})` : ''} – addig „egyedi ajánlat”.`),
    ...Object.entries(st.materials.src || {}).filter(([, v]) => v === 'bizonytalan').map(([k]) => `${k === 'sellPerGram.ti' ? 'Titán: nincs grammár, munkaalapú egyedi ajánlat' : k} – megerősítendő.`),
  ];
  return { qs, unsure, all: [...qs, ...unsure] };
}
function openQuestionsBox(st, { edit = false } = {}) {
  const { qs, all } = openQuestions(st);
  if (!all.length && !edit) return '';
  return `<section class="openq" data-openq role="note">
    <h2>Tisztázandó az ötvössel${all.length ? ` <span class="openq__n">${all.length}</span>` : ''}</h2>
    ${all.length ? `<ul>${all.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>Nincs nyitott kérdés.</p>'}
    <p class="hint">Amíg ezek nyitottak, a rendszer a jóváhagyott képlettel számol, és a bizonytalan értékek nem kerülnek a vásárlóhoz.</p>
    ${edit ? `<label class="efield"><span>Nyitott kérdések<small>soronként egy; ha tisztázódott, törölje a sort</small></span><textarea class="input" rows="4" data-openq-edit>${esc(qs.join('\n'))}</textarea></label>
    <button class="abtn" type="button" data-openq-save>Kérdések mentése</button>` : ''}
  </section>`;
}

/* V5.9 – egyszerű kezdőképernyő: négy fő teendő, a legutóbbi érdeklődések, működési hiba csak ha valóban van. */
function overview(el) {
  el = fresh(el);
  const st = S();
  const newInq = st.inquiries.filter((q) => q.status === 'uj').length;
  const err = api.mode === 'server' && api.save === 'error' ? api.error : '';
  const act = (href, title, help, extra = '') => `<a class="homeact" href="${href}"><b>${title}</b><small>${help}</small>${extra}</a>`;
  el.innerHTML = `
    <h1 class="adm__h1">Jó napot kívánok!</h1>
    <p class="adm__lead">Mit szeretne ma elintézni?</p>
    ${err ? `<p class="warnbox" role="alert" data-home-err><b>Figyelem:</b> ${esc(err)}</p>` : ''}
    <div class="homeacts" data-homeacts>
      ${act('#/admin/gyuruk', 'Gyűrűk kezelése', 'Gyűrű adatai, fénykép, új gyűrű.')}
      ${act('#/admin/arak', 'Árak módosítása', 'Grammárak és gyémántárak.')}
      ${act('#/admin/erdeklodesek', 'Érdeklődések megtekintése', 'Akik ajánlatot vagy időpontot kértek.', newInq ? `<em class="homeact__n" data-home-new>${newInq} új</em>` : '')}
      ${act('#/admin/munkak', 'Műhelymunkák', 'Egyedi, korábban elkészült gyűrűk.')}
    </div>
    <section class="homeinq" data-homeinq><h2>Legutóbbi érdeklődések</h2>
      ${st.inquiries.length ? `<ul>${st.inquiries.slice(0, 3).map((q) => `<li><a href="#/admin/erdeklodesek"><span>${dayHu(q.at)}${q.status === 'uj' ? ' · <em>új</em>' : ''}</span><b>${esc(q.name)}</b>${q.code ? `<small>${esc(q.code)}</small>` : ''}</a></li>`).join('')}</ul>`
        : '<p class="hint">Még nem érkezett érdeklődés.</p>'}
      ${st.inquiries.length > 3 ? '<a class="linkbtn" href="#/admin/erdeklodesek">Összes érdeklődés</a>' : ''}
    </section>
    <p class="homemore"><a href="#/admin/beallitasok">További beállítások</a></p>`;
}

function priceCalc(el) {
  el = fresh(el);
  el.innerHTML = `<h1 class="adm__h1">Ár kipróbálása</h1><p class="adm__lead">Ha valaki telefonon kérdezi: válassza ki a gyűrűt, és állítsa be, amit kér. Itt semmi nem változik a weboldalon.</p><div class="qcalc" data-qcalc></div>
    <div class="xwrap" data-examples></div>`;
  quickCalc($('[data-qcalc]', el));
  goldsmithExamples($('[data-examples]', el));
}

/* ---------- Jóváhagyásra vár: mi ügyfélpélda, mi demó, mi jóváhagyott ---------- */
const MAT_LABEL = { gold24: '24K arany alapanyagára', platinum: 'Platina alapanyagára', palladium: 'Palládium alapanyagára', titanium: 'Titán alapanyagára',
  'sellPerGram.au14': '14K kész gyűrű grammára', 'sellPerGram.au18': '18K kész gyűrű grammára', 'sellPerGram.pt': 'Platina kész gyűrű grammára',
  'sellPerGram.pd': 'Palládium kész gyűrű grammára', 'sellPerGram.ti': 'Titán: munkaalapú ár (nem grammár) – szabály kell' };
const SET_LABEL = { pricingMode: 'Árképzési mód (grammár szerint)', sizeMethod: 'Méret hatása (tömeg arányos a mérettel)', density: 'Tömegarányok anyagonként (a 14K-hoz képest)',
  stonesGross: 'A kő darabára végső ár (nincs rá felár)', settingPerStone: 'Kőfoglalás díja', engravingPrice: 'Gravírozás díja', boxCost: 'Díszdoboz', certCost: 'Kőtanúsítvány',
  roundTo: 'Kerekítés', vatPct: 'ÁFA', stoneEdgeMm: 'Kő és gyűrűszél közti perem', stoneGapMm: 'Kövek közti hely körbe foglalásnál',
  lossPct: 'Gyártási veszteség (költségalapú mód)', laborFactor: 'Munkadíj-szorzók (költségalapú mód)', markupMetal: 'Felár fémre (költségalapú mód)', markupStones: 'Felár kövekre (költségalapú mód)' };
const valOf = (o, path) => path.split('.').reduce((x, k) => x?.[k], o);
function approvals(el) {
  el = fresh(el);
  const st = S();
  const M = st.materials, Sx = st.settings;
  const fmtSet = (k) => { const v = Sx[k]; if (v == null) return 'nincs megadva'; if (typeof v === 'object') return Object.entries(v).map(([m, x]) => `${METALS[m]?.short || m}: ${dec(Math.round(x * 1000) / 1000)}`).join(' · ');
    if (k === 'pricingMode') return v === 'gramm' ? 'grammár szerint' : 'költség szerint'; if (k === 'sizeMethod') return v === 'tomeg' ? 'tömeg szerint' : 'árarányos';
    if (k === 'stonesGross') return v === false ? 'nem' : 'igen'; if (/Mm$/.test(k)) return dec(v) + ' mm'; if (/Pct|^markup/.test(k)) return dec(v) + '%'; return ft(v); };
  // Üres értéket nem lehet jóváhagyni (pl. nincs megadva grammár vagy kőár)
  const row = (kind, key, label, value, src, note = '', empty = false) => `<li class="aprow aprow--${src}"><span class="aprow__l"><b>${label}</b><small>${value}${note ? ` · ${note}` : ''}</small></span>${srcBadge(src)}
    ${src === 'jovahagyott' ? '' : `<button class="abtn" type="button" data-appr="${kind}|${key}" data-lab="${esc(label)}" ${empty ? 'disabled title="Előbb adjon meg értéket az Árak vagy a Beállítások oldalon"' : ''}>Jóváhagyom</button>`}</li>`;
  const mats = Object.keys(MAT_LABEL).map((k) => row('materials', k, MAT_LABEL[k], valOf(M, k) == null ? 'nincs ár' : ft(valOf(M, k)) + '/g', (M.src || {})[k] || 'demo', '', valOf(M, k) == null && k !== 'sellPerGram.ti'));
  const dias = M.diamonds.map((d) => row('diamond', d.id, `${d.name} (${d.quality})`, d.price == null ? 'nincs ár → egyedi ajánlat' : ft(d.price) + '/db', d.src || 'demo', d.note ? esc(d.note) : '', d.price == null));
  const sets = Object.keys(SET_LABEL).map((k) => row('settings', k, SET_LABEL[k], fmtSet(k), (Sx.src || {})[k] || 'demo', '', Sx[k] == null));
  const prods = st.products.filter((p) => !p.approved);
  const count = (arr) => arr.filter((h) => !h.includes('aprow--jovahagyott')).length;
  el.innerHTML = `
    <h1 class="adm__h1">Árelemek jóváhagyása</h1>
    <p class="adm__lead">A vásárló csak akkor lát árat, ha a felhasznált árelem jóvá van hagyva. Amit Ön maga átír az „Árak” vagy a „Haladó árképzés” oldalon, az automatikusan jóváhagyottá válik. Nem kell mindent most eldönteni.</p>
    <p class="srclegend">${['jovahagyott', 'pelda', 'bizonytalan', 'demo'].map(srcBadge).join(' ')}</p>
    ${devMode() ? openQuestionsBox(st, { edit: true }) : ''}
    ${(() => { const rd = readiness(st); const G = { arak: 'grammár', gyemant: 'gyémántár', szabalyok: 'számítási szabály (kerekítés, ÁFA, gravír…)', gyuruk: 'gyűrű tömeg- és kőadata' };
      return `<section class="golive ${rd.ready ? 'golive--ok' : 'golive--no'}" data-golive-box>
        <h2>Összesítés</h2>
        <p class="golive__state" data-golive-state>${rd.ready ? 'Minden árelem és gyűrűadat jóváhagyott.' : `<b>Még nincs minden jóváhagyva:</b> ${rd.unapproved} adat${rd.invalid ? `, és ${rd.invalid} adat hiányzik vagy hibás` : ''}.`}</p>
        <p class="golive__pre" data-golive-pre>Tájékoztató összesítés. A hiányzó elemeknél a vásárló „Egyedi árajánlat”-ot lát – ez nem hiba.</p>
        ${rd.invalid ? `<ul class="golive__list golive__list--bad" data-golive-bad>${rd.blockers.filter((b) => b.kind === 'ervenytelen').slice(0, 8).map((b) => `<li>${esc(b.label)}</li>`).join('')}${rd.invalid > 8 ? `<li>… és még ${rd.invalid - 8}</li>` : ''}</ul>` : ''}
        ${rd.ready ? '' : `<ul class="golive__list">${Object.entries(rd.byGroup).map(([g, c]) => `<li><b>${c}</b> ${G[g]}</li>`).join('')}</ul>`}
        <p class="hint">A vásárló csak ott lát számolt árat, ahol a gyűrű és minden felhasznált árelem (grammár, kőár, számítási szabály) jóváhagyott. Máshol „Egyedi árajánlat”-ot lát; a régi listaár csak itt, az adminban szerepel összehasonlításra.</p>

      </section>`; })()}
    <section class="ebox"><h2>Árak – alapanyag és grammár <small>${count(mats)} vár</small></h2><ul class="aplist">${mats.join('')}</ul></section>
    <section class="ebox"><h2>Természetes gyémántok <small>${count(dias)} vár</small></h2><ul class="aplist">${dias.join('')}</ul>
      <p class="hint">Ahol nincs jóváhagyott kőár, ott a vásárló „Egyedi árajánlat” feliratot lát. <a href="#/admin/arak">Ár megadása</a></p></section>
    <section class="ebox"><h2>Számítási szabályok <small>${count(sets)} vár</small></h2><ul class="aplist">${sets.join('')}</ul></section>
    <section class="ebox"><h2>Gyűrűk adatai <small>${prods.length} / ${st.products.length} vár</small></h2>
      <p class="hint">A gyűrűk adatait a „Gyűrűk” menüben, egyenként lehet ellenőrizni.</p>
      <p><a class="abtn abtn--xl" href="#/admin/gyuruk/ellenorzes">Gyűrűk → Adatok ellenőrzése</a></p></section>`;
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-openq-save]')) {
      const lines = ($('[data-openq-edit]', el).value || '').split('\n').map((x) => x.trim()).filter(Boolean);
      store.updateSettings({ openQuestions: lines }, 'Tisztázandó kérdések frissítve');
      savedToast(lines.length ? `Mentve: ${lines.length} nyitott kérdés.` : 'Mentve: nincs nyitott kérdés.');
      approvals(el); return;
    }
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
  // Az ötvös példatömegei nem részei a nyilvános kódnak: a szerveren tárolt beállításból (vagy fejlesztői adatkészletből) jönnek.
  const EXAMPLE_WEIGHTS = Sx.exampleWeights;
  if (!EXAMPLE_WEIGHTS || !Object.values(M.sellPerGram || {}).some((x) => x)) {
    box.innerHTML = '<p class="hint" data-noexamples>Még nincs megadva példatömeg és grammár, ezért itt nincs számolt példa. Az „Árak” oldalon megadott grammárak után a gyűrűk oldalán látszanak a számolt árak.</p>';
    return;
  }
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
      <section class="ebox xbox"><h2>Az ötvös számítási módja <small>példák</small></h2>
        <p class="hint">Ár = tömeg × eladási grammár; más méretnél a tömeg arányosan változik (× méret / 54). A kövek darabára és a külön díjak ehhez adódnak hozzá, felár és ÁFA nem kerül rá még egyszer.</p>
        <div class="xtable"><table><thead><tr><th>Példa</th><th>Számított</th><th>Megjelenő</th></tr></thead><tbody>
          ${line('au14', 54)}${line('pt', 54)}${line('pt', 48)}${line('pt', 60)}
        </tbody></table></div>
        <p class="hint">Számított = nyers eredmény. Megjelenő = kerekítve (${roundLabel(Sx.roundTo)}) ${srcBadge((Sx.src || {}).roundTo || 'demo')} – a kerekítést az ügyféllel egyeztetjük.</p>
        ${Sx.exampleNote ? `<p class="note-warn">${esc(Sx.exampleNote)}</p>` : ''}
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
/** V5.9: fájltípus és méret ellenőrzése feltöltés előtt (ugyanaz a korlát, mint a szerveren). null = rendben. */
export function checkImageFile(file) {
  if (!file) return 'Nincs kiválasztott fájl.';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'csak JPG, PNG vagy WebP kép tölthető fel.';
  if (file.size > 8_000_000) return `a kép túl nagy (${(file.size / 1e6).toFixed(1).replace('.', ',')} MB, legfeljebb 8 MB).`;
  if (file.size < 20) return 'a fájl üres vagy sérült.';
  return null;
}
function readImage(file, done, fail) {
  const im = new Image(), url = URL.createObjectURL(file);
  im.onload = () => {
    const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); done(c.toDataURL('image/jpeg', 0.82));
  };
  im.onerror = () => { URL.revokeObjectURL(url); if (fail) fail(new Error('Ezt a képet nem sikerült megnyitni.')); else toast('Ezt a képet nem sikerült megnyitni.'); };
  im.src = url;
}

/* ---------- Fotók: minden gyűrű képe egy helyen, gyors cserével ---------- */
function photos(el) {
  el = fresh(el);
  const st = S();
  let only = false;
  let checking = false, report = '';
  const kindOf = (p) => !p.img ? ['nincs', 'nincs kép'] : (probe.checked && probe.missing.has(p.id)) ? ['nincs', 'nem tölt be'] : /^data:/.test(p.img) ? ['sajat', 'itt feltöltött kép'] : /^https?:/.test(p.img) ? ['web', 'a régi weboldalról töltődik'] : ['helyi', 'helyben tárolt fotó'];
  const counts = () => {
    const P = st.products, ext = P.filter((p) => /^https?:/.test(p.img || '')).length, none = P.filter((p) => !p.img).length;
    const local = P.length - ext - none;
    const miss = probe.checked ? P.filter((p) => p.img && probe.missing.has(p.id)).length : null;
    return `${P.length} gyűrű · ${local} helyi fotó · ${ext} külső fotó · ${none} kép nélkül${miss === null ? '' : ` · <b data-pmissing>${miss} nem tölt be</b> ebben a böngészőben`}`;
  };
  const runCheck = () => {
    checking = true; probe.missing.clear(); probe.checked = false; paint();
    checkPhotos(st.products, () => {
      checking = false;
      const rows = st.products.map((p) => ({ code: p.code, img: p.img ? (p.img.startsWith('data:') ? '(feltöltött kép)' : p.img) : null,
        status: !p.img ? 'hianyzik' : probe.missing.has(p.id) ? 'nem_tolt_be' : /^https?:/.test(p.img) ? 'kulso_elerheto' : 'helyi' }));
      const c = (k) => rows.filter((r) => r.status === k).length;
      const rep = { generated: new Date().toISOString(), forras: 'böngészős ellenőrzés (admin → Fotók)', osszes_termek: rows.length,
        helyi_foto: c('helyi'), kulso_foto_elerheto: c('kulso_elerheto'), nem_tolt_be: c('nem_tolt_be'), hianyzo_foto: c('hianyzik'), termekek: rows };
      if (report) URL.revokeObjectURL(report);
      report = URL.createObjectURL(new Blob([JSON.stringify(rep, null, 2)], { type: 'application/json' }));
      paint();
    }, { all: true });
  };
  el.addEventListener('click', (e) => { if (e.target.closest('[data-pcheckrun]') && !checking) runCheck(); });
  const paint = () => {
    const list = st.products.filter((p) => !only || !p.img).sort((a, b) => (b.added ? 1 : 0) - (a.added ? 1 : 0) || a.code.localeCompare(b.code));
    el.innerHTML = `
      <h1 class="adm__h1">Fotók kezelése</h1>
      <p class="adm__lead">Minden gyűrű képe egy helyen. Egy-egy gyűrű képét a gyűrű saját oldalán is cserélheti („Megnyitás” → Fénykép).</p>
      <p class="hint">${api.mode === 'server' ? 'A feltöltött képből a szerver optimalizált JPEG-et készít (legfeljebb 2400 képpont, a helyadat és egyéb rejtett adat nélkül). Az eredeti fájl nem marad meg – azt őrizze meg a saját gépén.' : 'A képek most kicsinyítve (900 képpont), ebben a böngészőben tárolódnak.'}</p>
      <div class="ptools"><label class="check check--lg"><input type="checkbox" data-only ${only ? 'checked' : ''}><span>Csak ahol nincs kép</span></label>
        <div class="ptools__btns"><a class="abtn abtn--gold" href="#/admin/gyuru/uj">+ Új gyűrű felvitele</a></div></div>
      <div class="pcheck" data-pcheck>
        <p><b>Fotóellenőrzés:</b> ${counts()}</p>
        <p class="ptools__btns"><button class="abtn" data-pcheckrun>${checking ? 'Ellenőrzés folyamatban…' : 'Képek betöltésének ellenőrzése'}</button>${report ? ' <a class="linkbtn" data-pcheckdl download="katalogus-fotojelentes.json" href="' + report + '">Jelentés letöltése (JSON)</a>' : ''}</p>
        <p class="hint">Kép nélküli gyűrű is megjelenik a vásárlói oldalon, „Fotó hamarosan” jelzéssel – kereshető és megnyitható.</p>
      </div>
      <p class="hint">${list.length} gyűrű</p>
      <div class="photogrid">${list.map((p) => { const [k, t] = kindOf(p); return `<div class="photocard" data-pc="${p.id}">
        <div class="photocard__img">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span>nincs kép</span>'}</div>
        <b>${esc(p.code)}</b><small class="photocard__k photocard__k--${k}">${t}</small>
        <label class="abtn photocard__btn">Kép cseréje<input type="file" accept="image/jpeg,image/png,image/webp" data-photo="${p.id}" hidden></label>
        <a class="linkbtn" href="#/admin/gyuru/${p.id}">Adatok</a></div>`; }).join('')}</div>`;
  };
  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-only]')) { only = t.checked; paint(); return; }
    if (t.dataset.photo && t.files[0]) {
      const id = t.dataset.photo, code = store.product(id).code;
      const bad = checkImageFile(t.files[0]);
      if (bad) { uiToast(`<b>${esc(code)}: ez a fájl nem használható</b> – ${esc(bad)}`, { ms: 9000 }); t.value = ''; return; }
      const apply = async (src) => {
        store.updateProduct(id, (x) => { x.img = src; }, `${code}: új fénykép`);
        const r = await serverSaved();
        st.products = S().products; paint();
        uiToast(r.ok ? `<b>${esc(code)}</b>: az új fénykép mentve, már látszik a weboldalon.` : `<b>${esc(code)}: a fénykép NEM lett mentve.</b> ${esc(r.error)}`, { ms: r.ok ? 4000 : 12000 });
      };
      if (api.mode === 'server' && api.admin) {
        toast(`Feltöltés: <b>${esc(code)}</b>…`);
        uploadPhoto(t.files[0]).then(apply, (err) => toast(`<b>A kép nem került fel.</b> ${esc(err.message)}`, { ms: 12000 }));
      } else readImage(t.files[0], apply);
    }
  });
  paint();
}

/* ---------- V5.6: Egyedi műhelymunkák (cikkszám és ár nélkül, nem újrarendelhető) ---------- */
function worksAdmin(el, id) {
  el = fresh(el);
  const list = () => S().works || [];
  if (!id) {
    const L = list();
    el.innerHTML = `
      <h1 class="adm__h1">Műhelymunkák</h1>
      <p class="adm__lead">Egyszeri, kézzel megmunkált darabok bemutatása. Nem katalógustermékek: nincs cikkszám, nincs ár, nem rendelhetők újra – a látogató személyes konzultációt kérhet. A főoldalon külön szakasz mutatja őket.</p>
      <p><a class="abtn abtn--gold abtn--xl" href="#/admin/munkak/uj" data-wnew>+ Új műhelymunka</a></p>
      <p class="hint">${L.filter((w) => !(w.photos || []).length).length} munkához még fotóra várunk az ötvöstől.</p>
      <div data-wlist>${L.map((w) => `<div class="wadm__row" data-wrow="${esc(w.id)}">
        <span><b>${esc(w.title)}</b><br><small>${(w.photos || []).length ? `${w.photos.length} fotó` : '<em class="tag tag--warn">fotóra vár</em>'}${w.video ? ' · videó' : ''}${w.visible === false ? ' · rejtve' : ''}</small></span>
        <a class="abtn" href="#/admin/munkak/${esc(w.id)}">Szerkesztés</a></div>`).join('') || '<p>Még nincs műhelymunka.</p>'}</div>`;
    return;
  }
  const isNew = id === 'uj';
  const orig = isNew ? { id: '', title: '', text: '', photos: [], video: '', visible: true } : list().find((w) => w.id === id);
  if (!orig) { el.innerHTML = '<p>Nincs ilyen műhelymunka.</p><p><a class="abtn" href="#/admin/munkak">Vissza</a></p>'; return; }
  const w = JSON.parse(JSON.stringify(orig));
  const render = () => {
    el.innerHTML = `
      <p class="crumbs"><a href="#/admin/munkak">← Vissza a műhelymunkákhoz</a></p>
      <h1 class="adm__h1">${isNew ? 'Új műhelymunka' : esc(w.title)}</h1>
      <section class="ebox">
        <label class="efield"><span>Cím</span><input class="input input--lg" data-wt="title" value="${esc(w.title)}" placeholder="pl. Kalapált felületű gyűrűpár"></label>
        <label class="efield"><span>Leírás<small>mi különleges benne – ahogy az ötvös elmondaná</small></span><textarea class="input" rows="4" data-wt="text">${esc(w.text || '')}</textarea></label>
        <p class="efield__lab">Fotók <small>(több is lehet; csak saját, valódi fotó)</small></p>
        <div class="wadm__ph" data-wphotos>${(w.photos || []).map((src, i) => `<figure><img src="${esc(src)}" alt=""><button class="linkbtn" type="button" data-wdel="${i}">Kép törlése</button></figure>`).join('') || '<p class="warn">Még nincs fotó – a látogatói oldalon szövegesen jelenik meg, „Ezekről még nincs fotó” jelzéssel.</p>'}</div>
        <label class="abtn">Fotók hozzáadása<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-wfiles hidden></label>
        <label class="efield"><span>Videó (később is megadható)<small>https:// kezdetű link, pl. YouTube vagy Facebook</small></span><input class="input" data-wt="video" value="${esc(w.video || '')}" placeholder="https://…"></label>
        <p class="form__err" data-werr hidden></p>
        <div class="checks"><label class="check check--lg"><input type="checkbox" data-wvis ${w.visible !== false ? 'checked' : ''}><span>Megjelenik a látogatói oldalon</span></label></div>
      </section>
      <div class="edit__btns">
        ${isNew ? '' : '<button class="abtn abtn--xl" type="button" data-wremove>Törlés</button>'}
        <a class="abtn abtn--xl" href="#/admin/munkak">Mégsem</a>
        <button class="abtn abtn--gold abtn--xl" type="button" data-wsave>Mentés</button>
      </div>`;
  };
  el.addEventListener('input', (e) => { const k = e.target.dataset.wt; if (k) w[k] = e.target.value; });
  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-wvis]')) w.visible = t.checked;
    if (t.matches('[data-wfiles]') && t.files.length) {
      const files = [...t.files].slice(0, 12 - (w.photos || []).length);
      const add = (src) => { w.photos = [...(w.photos || []), src]; render(); };
      if (api.mode === 'server' && api.admin) {
        toast(`Feltöltés: ${files.length} kép…`);
        files.reduce((pr, f) => pr.then(() => uploadPhoto(f).then(add)), Promise.resolve()).catch((err) => toast(`<b>A kép nem került fel.</b> ${esc(err.message)}`, { ms: 12000 }));
      } else files.forEach((f) => readImage(f, add));
    }
  });
  el.addEventListener('click', (e) => {
    const d = e.target.closest('[data-wdel]'); if (d) { w.photos.splice(+d.dataset.wdel, 1); render(); return; }
    if (e.target.closest('[data-wremove]')) {
      modal(`<div class="form"><h2>Törli ezt a műhelymunkát?</h2><p>${esc(w.title)}</p><div class="impact__btns"><button class="abtn abtn--xl" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" data-ok>Igen, törlöm</button></div></div>`,
        { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); store.deleteWork(w.id); savedToast('Mentve: a műhelymunka törölve.'); location.hash = '#/admin/munkak'; } });
      return;
    }
    if (e.target.closest('[data-wsave]')) {
      const err = $('[data-werr]', el);
      w.title = (w.title || '').trim(); w.video = (w.video || '').trim();
      if (!w.title) { err.hidden = false; err.textContent = 'Adjon címet a műhelymunkának.'; return; }
      if (w.video && !/^https:\/\/\S{4,}$/.test(w.video)) { err.hidden = false; err.textContent = 'A videó linkje https:// kezdetű webcím legyen.'; return; }
      if (isNew) w.id = (w.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'munka') + '-' + Math.random().toString(36).slice(2, 6);
      store.saveWork(w);
      savedToast(`Mentve: <b>${esc(w.title)}</b>${(w.photos || []).length ? '' : ' – fotó nélkül, „fotóra vár” jelöléssel'}.`);
      location.hash = '#/admin/munkak';
    }
  });
  render();
}

/* ---------- Jóváhagyás sorban: egy gyűrű egyszerre, nagy gombokkal ---------- */
function queue(el, startId) {
  el = fresh(el);
  let st = S();
  const pending = () => st.products.filter((p) => !p.approved).sort((a, b) => a.code.localeCompare(b.code));
  let cur = (startId && st.products.find((p) => p.id === startId)) || pending()[0] || null;
  let skipped = new Set();
  let lastApproved = null;   // az imént jóváhagyott gyűrű – visszavonható, ha mellényomta
  const ruleTxt = (r) => { const x = r.stoneRule; if (!x) return 'nincs kő';
    const cats = (x.cats || []).map((c) => { const d = diamond(st.materials, c); return d ? `${ctFmt(d.ct)} ct` : c; }).join(', ');
    return ({ free: `${x.min}–${x.max} db, alapból ${x.def}`, fixed: `${x.def} db (kötött)`, perSize: 'körbe foglalt, mérettől függ', quote: 'csak egyedi ajánlattal' }[x.mode]) + (cats ? ` · méret: ${cats}` : '') + (x.allowNone ? ' · kő nélkül is' : ''); };
  const paint = () => {
    st = S();
    const total = st.products.length, ok = st.products.filter((p) => p.approved).length, pct_ = Math.round((ok / total) * 100);
    if (!cur) {
      el.innerHTML = `<h1 class="adm__h1">Adatok ellenőrzése</h1>
        <div class="qdone"><b>${ok} / ${total} gyűrű adatai jóváhagyva.</b><p>${ok === total ? 'Minden gyűrű jóváhagyva.' : 'Ebben a körben nincs több. A kihagyottakhoz bármikor visszatérhet.'}</p>
        <a class="abtn abtn--xl" href="#/admin/gyuruk">Vissza a gyűrűkhöz</a></div>`;
      return;
    }
    const p = cur, cfg = defaultConfig(p), r = priceProduct(p, cfg, st.materials, st.settings);
    const wv = optionValues(p, 'width'), tv = optionValues(p, 'thickness');
    const ac = approvalCheck(p, st.materials, st.settings);
    const diff = p.listaAr && r.final ? r.final - p.listaAr : null;
    el.innerHTML = `
      <h1 class="adm__h1">Adatok ellenőrzése</h1>
      <div class="qbar"><span style="width:${pct_}%"></span></div>
      <p class="qbar__t"><b>${ok} / ${total}</b> jóváhagyva · még ${total - ok}</p>
      ${lastApproved ? `<p class="qundo" data-qundo role="status"><span>Jóváhagyva: <b>${esc(lastApproved.code)}</b></span><button class="abtn" type="button" data-undo>Visszavonás</button></p>` : ''}
      <p class="adm__lead">Egyszerre egy gyűrű. Ha az adatok rendben vannak, hagyja jóvá – ha nem, nyomja meg a „Javítani kell” gombot. Nem kell mindet most elvégezni: amíg egy gyűrű nincs jóváhagyva, a katalógusban marad „Egyedi árajánlat” jelöléssel.</p>
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
              <span>Tömeg 54-es méretre: <b>${rg.weight ? dec(rg.weight) + ' g' : 'nincs megadva'}</b> <small>(${p.real && !rg.weightChecked ? 'becslés – a régi listaárból visszaszámolva' : 'megadott érték'})</small></span>
              <span>Szélesség: <b>${dec(rg.refWidth)} mm</b>${rg.thickness ? ` · vastagság: <b>${dec(rg.thickness)} mm</b>` : ''}</span>
              <span>Méretek: <b>${lo}–${hi}</b></span>
              <span>Kő: <b>${ruleTxt(rg)}</b></span></dd></div>`; }).join('')}
            <div><dt>Szélesség választható?</dt><dd>${wv ? `igen, ${dec(wv[0])}–${dec(wv[wv.length - 1])} mm` : 'nem'}</dd></div>
            <div><dt>Vastagság választható?</dt><dd>${tv ? `igen: ${tv.map(dec).join(', ')} mm` : 'nem'}</dd></div>
            <div><dt>Egyeztetést igényel</dt><dd>${(p.consult || []).length ? p.consult.map(esc).join('; ') : '–'}</dd></div>
            <div><dt>Belső számított ár</dt><dd>${r.final === null ? 'nem számolható' : `<b>${ft(r.final)}</b> <small>(nem végleges)</small>`}${p.listaAr ? ` <small>· régi weboldali listaár (nem igazolt, a vásárló nem látja): ${ft(p.listaAr)}${diff ? ` (${diff > 0 ? '+' : '−'}${ft(Math.abs(diff))})` : ''}</small>` : ''}</dd></div>
            <div><dt>Jóváhagyás után a weboldalon</dt><dd data-qafter>${(() => { const k = priceKinds({ ...p, approved: true }, null, st.materials, st.settings); return k.visible !== null ? `<b>${ft(k.visible)}</b>` : `Egyedi árajánlat – ${esc(k.reason || '')}`; })()}</dd></div>
          </dl>
          <section class="qcheck ${ac.ok ? 'qcheck--ok' : 'qcheck--bad'}" data-qcheck>
            <h3>Szakmai ellenőrzés</h3>
            ${ac.missing.length ? `<p class="warn">Hiányzó kötelező adat – így nem hagyható jóvá. Adja meg a „Javítani kell – szerkesztés” gombbal:</p><ul data-qmissing>${ac.missing.map((m) => `<li>${esc(m.label)}</li>`).join('')}</ul>` : '<p>Minden kötelező adat meg van adva (referenciaméret, szélesség, vastagság, tömeg, anyagok, kőszabály).</p>'}
            ${ac.estimated.length && !p.approved ? `<p>Becsült adatok – nézze át, megfelelnek-e:</p><ul data-qestimated>${ac.estimated.map((m) => `<li>${esc(m.label)}</li>`).join('')}</ul>
              ${ac.ok ? '<label class="check check--lg"><input type="checkbox" data-qconfirm><span>Ellenőriztem a becsült adatokat, megfelelnek</span></label>' : ''}` : ''}
          </section>
          <p class="hint">A weboldalon csak akkor jelenik meg ár, ha a gyűrű adatai és a felhasznált árak (grammár, kőár) is jóváhagyottak. Az árak az „Árak” menüben hagyhatók jóvá.</p>
          <div class="qbtns">
            ${p.approved
              ? `<button class="abtn abtn--xl" type="button" data-unapprove>Jóváhagyás visszavonása</button>`
              : `<button class="abtn abtn--gold abtn--xl" type="button" data-approve ${!ac.ok || ac.estimated.length ? 'disabled' : ''}>Rendben, jóváhagyom</button>`}
            <a class="abtn abtn--xl" href="#/admin/gyuru/${p.id}">Javítani kell – szerkesztés</a>
            <button class="abtn abtn--xl" type="button" data-skip>Később</button>
          </div>
        </div>
      </article>`;
  };
  el.addEventListener('change', (e) => { if (e.target.matches('[data-qconfirm]')) { const b = $('[data-approve]', el); if (b && approvalCheck(cur, S().materials, S().settings).ok) b.disabled = !e.target.checked; } });
  const next = () => { skipped.add(cur.id); cur = pending().find((p) => !skipped.has(p.id)) || null; paint(); window.scrollTo(0, 0); };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-approve]')) {
      const code = cur.code;
      const res = store.approve('product', cur.id, `${code} – gyűrű adatai`, { confirmEstimated: !!$('[data-qconfirm]', el)?.checked });
      if (!res.ok) { toast(res.missing ? `<b>${esc(code)}</b> nem hagyható jóvá: hiányzik ${esc(res.missing.map((m) => m.label).join(', '))}.` : 'Előbb jelölje be, hogy ellenőrizte a becsült adatokat.', { ms: 7000 }); return; }
      lastApproved = { id: cur.id, code };
      savedToast(`Mentve: <b>${esc(code)}</b> jóváhagyva.`);
      next();
    } else if (e.target.closest('[data-unapprove]')) {
      store.unapprove(cur.id, `${cur.code} – jóváhagyás visszavonva`);
      savedToast(`Mentve: <b>${esc(cur.code)}</b> jóváhagyása visszavonva – a vásárló ennél a gyűrűnél újra egyedi ajánlatot kér.`);
      paint();
    } else if (e.target.closest('[data-undo]') && lastApproved) {
      const { id, code } = lastApproved;
      store.unapprove(id, `${code} – jóváhagyás visszavonva`);
      lastApproved = null; skipped.delete(id);
      cur = st.products.find((p) => p.id === id) || cur;
      savedToast(`Mentve: <b>${esc(code)}</b> jóváhagyása visszavonva.`);
      paint(); window.scrollTo(0, 0);
    } else if (e.target.closest('[data-skip]')) { lastApproved = null; next(); }
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
      ${(() => { const k = priceKinds(p, cfg, st.materials, st.settings); return `
      <div class="qcalc__price" data-qprice><span>A weboldalon látható ár</span><b data-qvisible>${k.visible !== null ? ft(k.visible) : 'Egyedi árajánlat'}</b>
        <small>${k.visible !== null ? `jóváhagyott ár · bruttó · ${dec(r.grams)} g, ${METALS[cfg.metal].short}` : esc(k.reason || '')}</small></div>
      ${k.visible === null && r.final !== null ? `<p class="qcalc__int" data-qinternal>Belső számított ár: <b>${ft(r.final)}</b> – <b>nem végleges</b>, nem jóváhagyott adatokból. Ügyfélnek ne mondja ki végleges árként.</p>` : ''}`; })()}
      <button class="abtn abtn--xl qcalc__save" type="button" data-qsave>Felírom az érdeklődők közé</button>`;
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
      const k = priceKinds(p, cfg, st.materials, st.settings);
      const r = { final: k.visible };   // rögzíteni csak jóváhagyott, a weboldalon is látható árat lehet
      modal(`<form class="form" data-qf><h2>Érdeklődő felírása</h2><p><b>${esc(p.code)}</b> – ${r.final === null ? 'egyedi árajánlat: az árat később, egyeztetés után adja meg' : `jóváhagyott ár: ${ft(r.final)}`}</p>
        <label class="field"><span>Ügyfél neve</span><input class="input input--lg" name="nev" required></label>
        <label class="field"><span>Telefonszáma</span><input class="input input--lg" name="tel" type="tel"></label>
        <div class="impact__btns"><button class="abtn abtn--xl" type="button" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" type="submit">Felírom</button></div></form>`, {
        onMount: (mb, close) => mb.querySelector('[data-qf]').addEventListener('submit', (ev) => {
          ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
          if (!d.nev.trim()) return;
          store.addInquiry({ type: 'telefon', name: d.nev, phone: d.tel, productId: p.id, code: p.code, config: clone(cfg), summary: configText(p, cfg), estimate: r.final,
            status: 'uj', lockedPrice: r.final, lockedAt: r.final === null ? null : new Date().toISOString() }).then((res) => {
            if (!res.ok) { toast(`<b>Nem sikerült felírni:</b> ${esc(res.error)}`); return; }
            close(); toast(r.final === null ? 'Felírva az érdeklődők közé – az árat egyeztetés után kell megadni.' : 'Felírva az érdeklődők közé, a jóváhagyott árral.');
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

/* ---------- V5.9: közös – valós mentési visszaigazolás ----------
   Szerver módban csak akkor „sikeres”, ha a szerver visszaigazolta a mentést; helyi módban, ha a böngésző el tudta tárolni. */
export function serverSaved(ms = 2e4) {
  if (api.mode !== 'server') return Promise.resolve(store.persistOk() ? { ok: true } : { ok: false, error: 'A böngésző nem tudta tárolni a változást (betelt a tárhely vagy privát ablak).' });
  if (api.save === 'error') return Promise.resolve({ ok: false, error: api.error });
  if (api.save !== 'pending') return Promise.resolve({ ok: false, error: 'A mentés nem indult el – lépjen be újra.' });
  return new Promise((res) => {
    const t = setTimeout(() => { off(); res({ ok: false, error: 'A szerver nem igazolta vissza a mentést. Töltse újra az oldalt, és nézze meg, megvan-e a változás.' }); }, ms);
    const off = onApi(() => {
      if (api.save === 'saved') { clearTimeout(t); off(); res({ ok: true }); }
      else if (api.save === 'error') { clearTimeout(t); off(); res({ ok: false, error: api.error }); }
    });
  });
}

/** V5.10: „Mentve” csak akkor, ha a változás tényleg megmaradt (szerver módban: a szerver visszaigazolta). */
export function savedToast(html, opts) {
  if (api.mode === 'server') uiToast('Mentés folyamatban…', { ms: 1500 });
  return serverSaved().then((r) => r.ok ? uiToast(html, opts) : uiToast(`<b>A módosítás NEM lett mentve.</b> ${esc(r.error || '')}`, { ms: 12000 }));
}

/** A háromféle ár: belső számított (motor, akár becsült adatból) · jóváhagyott · a weboldalon látható (a vásárló ezt látja). */
export function priceKinds(p, cfg, M, Sx) {
  const r = priceProduct(p, cfg, M, Sx);
  const sp = shownPrice(p, cfg, M, Sx);
  const visible = p.visible !== false && sp.kind !== 'quote' ? sp.final : null;
  return { internal: r.final, approved: sp.kind !== 'quote', visible, reason: sp.kind === 'quote' ? sp.reason : '', r, sp };
}
/** Mentés utáni anyagár-állapot: amit a tulajdonos átírt, az jóváhagyottá válik (ugyanúgy, mint a valódi mentésnél). */
function approvedDraft(cur, draft) {
  const d = clone(draft);
  for (const c of changedPaths(cur, draft)) {
    const m = /^diamonds\.(\d+)\./.exec(c.path);
    if (m) d.diamonds[+m[1]].src = 'jovahagyott'; else d.src = { ...(d.src || {}), [c.path]: 'jovahagyott' };
  }
  return d;
}
/** A weboldalon látható árak változása (a valós motorból): hol változik, hol lesz új ár, hol marad egyedi ajánlat. */
function visibleDiff(products, M0, M1, S0, S1 = S0) {
  const out = { changed: [], appear: [], vanish: [], quote: [], reasons: {} };
  for (const p of products) {
    if (p.visible === false) continue;
    const a = priceKinds(p, null, M0, S0), b = priceKinds(p, null, M1, S1);
    if (b.visible === null) { out.quote.push(p); out.reasons[b.reason || 'egyedi ajánlat'] = (out.reasons[b.reason || 'egyedi ajánlat'] || 0) + 1; }
    if (a.visible === null && b.visible !== null) out.appear.push({ p, now: b.visible });
    else if (a.visible !== null && b.visible === null) out.vanish.push({ p, old: a.visible });
    else if (a.visible !== null && a.visible !== b.visible) out.changed.push({ p, old: a.visible, now: b.visible });
  }
  return out;
}
const MAIN_LBL = { 'sellPerGram.au14': '14 karátos arany', 'sellPerGram.au18': '18 karátos arany', 'sellPerGram.pt': 'Platina', 'sellPerGram.pd': 'Palládium',
  gold24: '24 karátos arany – beszerzési ár', platinum: 'Platina – beszerzési ár', palladium: 'Palládium – beszerzési ár', titanium: 'Titán – beszerzési ár' };

/** Korábbi árak visszaállítása – előtte a pontos következmények. Visszaigazolás után jelez sikert. */
function confirmRevert(entryId, after) {
  const st = S();
  const h = st.history.find((x) => x.id === entryId);
  if (!h || !h.before) return;
  const ch = changedPaths(st.materials, h.before);
  const d = diffPrices(st.products, st.materials, h.before, st.settings);
  const vd = visibleDiff(st.products, st.materials, h.before, st.settings);
  modal(`<div class="form" data-revconfirm><h2>Korábbi árak visszaállítása</h2>
    <p>A „${esc(h.title)}” előtti árak állnak vissza.</p>
    ${ch.length ? `<ul class="impact__chg">${ch.map((c) => `<li><span>${esc(c.label)}</span><b>${c.from == null ? 'nincs ár' : num(c.from)} → ${c.to == null ? 'nincs ár' : num(c.to)} ${c.unit}</b></li>`).join('')}</ul>` : '<p>Az árak nem változnak.</p>'}
    <p><b>${d.count} gyűrű</b> belső számított ára változik; <b>${vd.changed.length + vd.appear.length + vd.vanish.length}</b> gyűrűnél változik a weboldalon látható ár.</p>
    <p class="hint">Ez maga is bekerül a korábbi árak közé, tehát később ez is visszavonható.</p>
    <div class="impact__btns"><button class="abtn abtn--xl" type="button" data-close>Mégsem</button><button class="abtn abtn--gold abtn--xl" type="button" data-ok>Visszaállítom</button></div></div>`,
    { label: 'Visszaállítás', onMount: (box, close) => { box.querySelector('[data-ok]').onclick = async () => {
      close(); store.revert(entryId);
      const r = await serverSaved();
      uiToast(r.ok ? '<b>A korábbi árak visszaálltak, és mentve.</b>' : `<b>A visszaállítás NEM lett mentve.</b> ${esc(r.error)}`, { ms: r.ok ? 4000 : 12000 });
      after && after(r);
    }; } });
}

/* ---------- Árak módosítása – az árkezelés fő képernyője (V5.9) ---------- */
function materials(el) {
  el = fresh(el);
  const st = S();
  const cur = clone(st.materials);
  const draft = clone(st.materials);
  const versions = st.history.filter((h) => (h.kind === 'materials' || h.kind === 'start') && !h.demo);
  const lastM = versions[0] || st.history[0];
  const gm = st.settings.pricingMode === 'gramm';
  const MAIN = gm ? ['au14', 'au18', 'pt', 'pd'].map((m) => `sellPerGram.${m}`) : ['gold24', 'platinum', 'palladium'];
  const nv = (v) => (v === null || v === undefined ? '' : num(v));
  let confirmBig = false, moreOpen = false, busy = false;

  const field = (path, label, unit, step, sub = '') => {
    const src = msrc(cur, path), val = get(cur, path);
    const kind = path.startsWith('diamonds.') ? 'diamond' : 'materials';
    const key = kind === 'diamond' ? cur.diamonds[+path.split('.')[1]].id : path;
    return `
    <div class="mfield" data-mfield="${path}">
      <label for="f-${path.replace(/\./g, '-')}"><b>${label}</b> ${srcBadge(src)}${sub ? `<small>${sub}</small>` : ''}</label>
      <div class="mfield__ctl">
        <button type="button" class="mbtn" data-step="-${step}" aria-label="${label} csökkentése ${num(step)} forinttal">−</button>
        <div class="mfield__input"><input id="f-${path.replace(/\./g, '-')}" inputmode="numeric" data-path="${path}" value="${nv(get(draft, path))}" placeholder="nincs ár" autocomplete="off"><span>${unit}</span></div>
        <button type="button" class="mbtn" data-step="${step}" aria-label="${label} növelése ${num(step)} forinttal">+</button>
      </div>
      <p class="mfield__was" data-was="${path}">Most: ${val == null ? 'nincs ár → a vásárló egyedi árajánlatot kér' : num(val) + ' ' + unit}</p>
      ${src !== 'jovahagyott' && val != null ? `<p class="mfield__appr"><button class="abtn" type="button" data-appr="${kind}|${key}" data-lab="${esc(label)}">Ez az ár helyes – jóváhagyom</button><small>Amíg nincs jóváhagyva, ezzel az árral a vásárló nem lát összeget.</small></p>` : ''}
    </div>`;
  };

  el.innerHTML = `
    <h1 class="adm__h1">Árak módosítása</h1>
    <p class="adm__lead">Itt módosíthatja a gyűrűk és a gyémántok árát. Mentés előtt megmutatjuk, mi változik a weboldalon.</p>
    <p class="adm__meta" data-pver>Érvényes ${dateHu(lastM.at)} óta${versions.length > 1 ? ' · <a href="#" data-verlist>korábbi árak</a>' : ''}</p>
    <div class="mat mat--simple">
      <section class="ebox" data-mainprices><h2>${gm ? 'Eladási grammár' : 'Alapanyagárak'} <small>${gm ? 'bruttó, 1 gramm kész gyűrű – benne a fém, a munka és az árrés' : 'költségalapú árszámítás van bekapcsolva'}</small></h2>
        ${MAIN.map((k) => field(k, MAIN_LBL[k], 'Ft/g', 500, gm ? '' : '')).join('')}
        <p class="hint">Titán: nincs grammár – a titángyűrű ára mindig egyedi árajánlat.</p>
      </section>
      <section class="ebox" data-diamonds><h2>Természetes gyémántok <small>darabár · üresen hagyva: egyedi árajánlat</small></h2>
        ${st.materials.diamonds.map((d, i) => field(`diamonds.${i}.price`, `${d.name} · ${d.quality}`, 'Ft/db', 1000, `${d.note ? esc(d.note) + ' · ' : ''}${st.products.filter((p) => p.rings.some((r) => r.stoneRule && r.stoneRule.cats.includes(d.id))).length} gyűrűnél választható`)).join('')}
      </section>
      <section class="impact" data-impact aria-live="polite"></section>
      <div class="mimpact" data-mimpact hidden><span data-mimpact-t></span><button type="button" data-goimpact>Ellenőrzés</button></div>
      <details class="mat__more" data-advprices>
        <summary>Haladó: beszerzési árak és grafikon <small>ritkán kell – ${gm ? 'az eladási árat nem változtatja' : 'ebből számolódik az ár'}</small></summary>
        <p class="hint">Grammáras árszámításnál a beszerzési (alapanyag-) ár csak a belső anyagköltség-kimutatáshoz kell. Az árszámítás módja és a díjak: <a href="#/admin/beallitasok/halado">Beállítások → Haladó árképzés</a>.</p>
        ${gm ? field('gold24', MAIN_LBL.gold24, 'Ft/g', 500, 'ebből: 14K = ×0,585, 18K = ×0,75') : ''}
        <p class="hint" data-derived></p>
        ${(gm ? ['platinum', 'palladium', 'titanium'] : ['titanium']).map((k) => field(k, MAIN_LBL[k], 'Ft/g', k === 'titanium' ? 10 : 500)).join('')}
        <div class="goldcard__chart"><h3>A 24 karátos arany beszerzési ára az itt mentett változások szerint</h3><div data-chart></div></div>
      </details>
    </div>`;

  const impact = $('[data-impact]', el);
  const series = store.goldSeries();

  const paint = () => {
    $('[data-chart]', el).innerHTML = goldChart(series, cur.gold24, draft.gold24);
    const changes = changedPaths(cur, draft);
    const dv = $('[data-derived]', el);
    if (dv) dv.innerHTML = `Ebből számolva: <b>14K ${ft(refPrice('au14', draft))}/g</b> · <b>18K ${ft(refPrice('au18', draft))}/g</b> beszerzési ár`;
    $$('[data-mfield]', el).forEach((f) => f.classList.toggle('is-changed', changes.some((c) => c.path === f.dataset.mfield)));
    $$('[data-appr]', el).forEach((b) => { b.disabled = changes.length > 0; b.title = changes.length ? 'Előbb mentse vagy vesse el a módosítást.' : ''; });
    const mi = $('[data-mimpact]', el);
    mi.hidden = !changes.length;
    document.body.classList.toggle('has-mimpact', !!changes.length);
    if (!changes.length) {
      impact.className = 'impact impact--idle';
      impact.innerHTML = '<p>Írja át a fenti számot, vagy használja a + / − gombot. Mentés előtt itt jelenik meg, mi változik.</p>';
      return;
    }
    const after = approvedDraft(cur, draft);
    const d = diffPrices(st.products, cur, draft, st.settings);
    const vd = visibleDiff(st.products, cur, after, st.settings);
    const visCount = vd.changed.length + vd.appear.length + vd.vanish.length;
    $('[data-mimpact-t]', el).innerHTML = `<b>${changes.length}</b> ár módosítva · <b>${visCount}</b> gyűrűnél változik a weboldal`;
    const big = changes.filter((c) => c.pct !== null && Math.abs(c.pct) >= st.settings.bigChangePct);
    const reasons = Object.entries(vd.reasons).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const ex = [...vd.changed, ...vd.appear].slice(0, 3);
    impact.className = 'impact impact--on';
    impact.innerHTML = `
      <h2>Változtatások ellenőrzése</h2>
      <ul class="impact__chg" data-changes>${changes.map((c) => `<li><span>${esc(c.label)}</span><b>${c.from == null ? 'nincs ár' : num(c.from)} → ${c.to == null ? 'nincs ár' : num(c.to)} ${c.unit}</b>${c.pct === null ? '' : `<em class="${c.pct > 0 ? 'up' : 'down'}">${pct(c.pct)}</em>`}</li>`).join('')}</ul>
      <ul class="impact__facts">
        <li data-imp-internal><b>${d.count} gyűrű</b> belső számított ára változik${d.count ? `, átlagosan ${pct(d.avgPct)}` : ''}.</li>
        <li data-imp-visible><b>${visCount} gyűrűnél</b> változik a weboldalon látható ár${vd.appear.length ? ` (ebből ${vd.appear.length} gyűrűnél most jelenik meg először ár)` : ''}${vd.vanish.length ? `; ${vd.vanish.length} gyűrűnél eltűnik az ár` : ''}.</li>
        <li data-imp-quote><b>${vd.quote.length} gyűrűnél</b> továbbra is „Egyedi árajánlat” látszik${reasons.length ? ` – leggyakoribb ok: ${esc(reasons[0][0].replace(/\.$/, ''))}` : ''}.</li>
      </ul>
      ${ex.length ? `<ul class="impact__few">${ex.map((x) => `<li><span>${esc(x.p.code)}</span>${x.old != null ? `<s>${ft(x.old)}</s>` : '<s>egyedi ajánlat</s>'}<b>${ft(x.now)}</b></li>`).join('')}</ul>` : ''}
      ${d.lost.length ? `<p class="impact__warn"><b>${d.lost.length} gyűrűnek nem lesz számolható ára</b> (pl. ${esc(d.lost[0].code)}) – ott „Egyedi árajánlat” jelenik meg.</p>` : ''}
      ${big.length ? `<label class="confirm"><input type="checkbox" data-confirm ${confirmBig ? 'checked' : ''}><span><b>Nagy változás (${pct(big[0].pct)}).</b> Ellenőriztem, jó a szám.</span></label>` : ''}
      <div class="impact__btns">
        <button class="abtn abtn--xl" type="button" data-cancel>Mégsem</button>
        <button class="abtn abtn--gold abtn--xl" type="button" data-apply ${big.length && !confirmBig ? 'disabled' : ''}>Árak mentése</button>
      </div>
      <details class="impact__more">
        <summary>Részletek</summary>
        ${vd.quote.length ? `<p class="hint" data-imp-quote-list><b>Egyedi árajánlat marad:</b> ${vd.quote.slice(0, 12).map((p) => esc(p.code)).join(', ')}${vd.quote.length > 12 ? ` és még ${vd.quote.length - 12}` : ''}.</p>
          ${reasons.length ? `<ul class="hint">${reasons.map(([r, n]) => `<li>${n} gyűrű: ${esc(r)}</li>`).join('')}</ul>` : ''}` : ''}
        <button type="button" class="linkbtn" data-all>Mind a ${d.count} gyűrű belső számított ára (előtte – utána)</button>
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
    modal(`<div class="form"><p class="kicker">Előnézet – még nincs mentve</p><h2>Belső számított árak (${d.count} gyűrű)</h2>
      <p class="hint">Belső számítás: a weboldalon csak a jóváhagyott gyűrűknél jelenik meg ár.</p>
      <div class="alltable"><table><thead><tr><th>Cikkszám</th><th>Most</th><th>Utána</th><th>Változás</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><b>${esc(r.code)}</b><small>${esc(r.name)}</small></td><td>${ft(r.old)}</td><td><b>${ft(r.now)}</b></td><td class="${r.delta > 0 ? 'up' : 'down'}">${r.delta > 0 ? '+' : '−'}${ft(Math.abs(r.delta))}<small>${pct(r.pct)}</small></td></tr>`).join('')}
      </tbody></table></div></div>`, { label: 'Belső számított árak', wide: true });
  };

  const apply = async () => {
    if (busy) return; busy = true;
    const valid = $('[data-valid]', el)?.value;
    const after = approvedDraft(cur, draft);
    const vd = visibleDiff(st.products, cur, after, st.settings);
    const changes = changedPaths(cur, draft);
    const d = store.applyMaterials(after, { validFrom: valid ? new Date(valid).toISOString() : undefined });
    const entry = S().history[0];
    document.body.classList.remove('has-mimpact');
    el.innerHTML = '<div class="done"><p class="adm__lead" data-saving>Mentés folyamatban…</p></div>';
    const r = await serverSaved();
    busy = false;
    if (!r.ok) {
      el.innerHTML = `<div class="done done--err" data-save-failed role="alert">
        <h1 class="adm__h1">Az árak NEM lettek mentve</h1>
        <p class="adm__lead">${esc(r.error)}</p>
        <p>A képernyőn most a ténylegesen tárolt árak látszanak. Próbálja újra, ha a kapcsolat helyreállt.</p>
        <div class="done__btns"><a class="abtn abtn--gold abtn--xl" href="#/admin/arak" data-retry>Vissza az árakhoz</a></div></div>`;
      return;
    }
    el.innerHTML = `<div class="done" data-saved-ok>
      <p class="done__mark" aria-hidden="true">✓</p>
      <h1 class="adm__h1">Az árak sikeresen mentve.</h1>
      <ul class="impact__chg">${changes.map((c) => `<li><span>${esc(c.label)}</span><b>${c.from == null ? 'nincs ár' : num(c.from)} → ${c.to == null ? 'nincs ár' : num(c.to)} ${c.unit}</b></li>`).join('')}</ul>
      <p class="adm__lead">${d.count} gyűrű belső számított ára frissült. A weboldalon <b>${vd.changed.length + vd.appear.length + vd.vanish.length}</b> gyűrűnél változott a látható ár.</p>
      <div class="done__btns">
        <a class="abtn abtn--gold abtn--xl" href="#/kollekcio" data-to-customer>Megnézem a weboldalon</a>
        <button class="abtn abtn--xl" type="button" data-undo="${entry.id}">Mégis a korábbi árak kellenek</button>
        <a class="abtn" href="#/admin/arak">Újabb módosítás</a>
      </div></div>`;
    window.scrollTo({ top: 0 });
    if (M() && !reduced()) M().animate($('.done__mark', el), { scale: [0.6, 1], opacity: [0, 1] }, { type: 'spring', bounce: 0.4, duration: 0.6 });
  };

  el.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]');
    if (s) { const path = s.closest('[data-mfield]').dataset.mfield; setVal(path, (get(draft, path) || 0) + Number(s.dataset.step)); }
    if (e.target.closest('[data-all]')) allList();
    if (e.target.closest('[data-goimpact]')) impact.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    if (e.target.closest('[data-cancel]')) { document.body.classList.remove('has-mimpact'); materials(el); toast('A módosítást elvetettük – az árak nem változtak.'); }
    if (e.target.closest('[data-apply]')) apply();
    const ap = e.target.closest('[data-appr]');
    if (ap && !ap.disabled) {
      const [kind, key] = ap.dataset.appr.split('|');
      store.approve(kind, key, ap.dataset.lab);
      serverSaved().then((r) => { uiToast(r.ok ? `<b>Jóváhagyva és mentve:</b> ${esc(ap.dataset.lab)}` : `<b>Nem lett mentve.</b> ${esc(r.error)}`, { ms: r.ok ? 3500 : 12000 }); materials(el); });
    }
    if (e.target.closest('[data-verlist]')) {
      e.preventDefault();
      modal(`<div class="form"><h2>Korábbi árak</h2><p class="hint">Minden árváltozás megmarad. Egy korábbi állapot visszaállítható – előtte megmutatjuk, mi változik.</p>
        <ol class="verlist">${versions.map((h, i) => `<li><span><b>${dateHu(h.at)}</b>${i === 0 ? ' <em class="tag tag--blue">most érvényes</em>' : ''}<small>${esc(h.title)}${h.count ? ` · ${h.count} gyűrű ára változott` : ''}</small></span>
          ${h.before ? `<button class="abtn" type="button" data-verrev="${h.id}">Az ez előtti árak visszaállítása</button>` : ''}</li>`).join('')}</ol>
        <div class="impact__btns"><button class="abtn abtn--xl" data-close>Bezárás</button></div></div>`, {
        onMount: (box, close) => box.addEventListener('click', (ev) => { const b = ev.target.closest('[data-verrev]'); if (b) { close(); confirmRevert(b.dataset.verrev, () => materials(el)); } }) });
      return;
    }
    const u = e.target.closest('[data-undo]');
    if (u) confirmRevert(u.dataset.undo, () => materials(el));
  });
  el.addEventListener('input', (e) => {
    if (e.target.matches('[data-path]')) {
      const path = e.target.dataset.path;
      if (!e.target.value.trim() && path.startsWith('diamonds.')) { set(draft, path, null); paint(); return; }   // üres kőár = egyedi ajánlat
      const v = parseNum(e.target.value);
      e.target.toggleAttribute('aria-invalid', !(Number.isFinite(v) && v > 0) && !!e.target.value.trim());
      if (Number.isFinite(v) && v > 0) { set(draft, path, Math.round(v)); paint(); }
    }
    if (e.target.matches('[data-confirm]')) { confirmBig = e.target.checked; paint(); }
  });
  el.addEventListener('focusout', (e) => { if (e.target.matches('[data-path]')) { e.target.value = nv(get(draft, e.target.dataset.path)); e.target.removeAttribute('aria-invalid'); } });
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

/* ---------- Gyűrűk listája (V5.9) – a weboldalon látható ár és a belső számítás külön ---------- */
const PFILTERS = [['mind', 'Mind'], ['ellenorzes', 'Ellenőrzésre vár'], ['jovahagyott', 'Jóváhagyva'], ['nincsfoto', 'Nincs fotó'], ['koves', 'Köves'], ['rejtett', 'Rejtett']];
function products(el) {
  el = fresh(el);
  const st = S();
  const K = Object.fromEntries(st.products.map((p) => [p.id, priceKinds(p, null, st.materials, st.settings)]));
  let q = '', f = 'mind', limit = 30;
  const waiting = st.products.filter((p) => !p.approved).length;
  el.innerHTML = `
    <h1 class="adm__h1">Gyűrűk</h1>
    <p class="adm__lead">Válassza ki a gyűrűt a módosításhoz vagy a fénykép cseréjéhez. Mentés után a változás a weboldalon is látszik.</p>
    <div class="ptools">
      <label class="field field--search"><span>Keresés cikkszámra vagy névre</span><input class="input input--lg" data-q placeholder="pl. 81184" inputmode="search"></label>
      <div class="ptools__btns"><a class="abtn abtn--gold" href="#/admin/gyuru/uj" data-newprod>+ Új gyűrű</a><a class="abtn" href="#/admin/arak/arlista">Árlista</a></div>
    </div>
    ${waiting ? `<p class="hint" data-pwait>${waiting} gyűrű adatai ellenőrzésre várnak – ezeknél a vásárló „Egyedi árajánlat”-ot lát. <a href="#/admin/gyuruk/ellenorzes">Ellenőrzés egyenként →</a></p>` : ''}
    <div class="pfilter" role="group" aria-label="Szűrés">${PFILTERS.map(([k, l]) => `<button type="button" data-pf="${k}" aria-pressed="${k === f}">${l}</button>`).join('')}</div>
    <p class="adm__meta" data-pcount></p>
    <div class="plist" data-list></div>`;
  const rows = () => st.products.filter((p) => (p.code + ' ' + p.name).toLowerCase().includes(q)).filter((p) =>
    f === 'mind' || (f === 'ellenorzes' && !p.approved) || (f === 'jovahagyott' && p.approved) || (f === 'nincsfoto' && !p.img)
    || (f === 'koves' && p.rings.some((r) => r.stoneRule)) || (f === 'rejtett' && p.visible === false));
  const paint = () => {
    let list = rows();
    $('[data-pcount]', el).textContent = `${list.length} gyűrű`;
    list = [...list.filter((p) => p.added), ...list.filter((p) => !p.added)];   // az újonnan felvett gyűrűk elöl
    $('[data-list]', el).innerHTML = list.slice(0, limit).map((p) => {
      const k = K[p.id];
      return `<a class="prow" href="#/admin/gyuru/${p.id}" data-prow="${p.id}">
        <span class="prow__img">${productMedia(p)}</span>
        <span class="prow__txt"><b>${esc(p.code)}</b><span>${esc(p.name)}</span>
          <span class="prow__tags">${p.approved ? '<em class="tag tag--ok">adatai jóváhagyva</em>' : '<em class="tag tag--warn">ellenőrzésre vár</em>'}${p.visible === false ? '<em class="tag">rejtett</em>' : ''}${!p.img ? '<em class="tag">nincs fotó</em>' : ''}${p.added ? '<em class="tag tag--blue">itt felvett</em>' : ''}</span></span>
        <span class="prow__price"><small>A weboldalon:</small><b data-pvis>${k.visible !== null ? ft(k.visible) : 'Egyedi árajánlat'}</b>
          ${k.visible === null && k.internal !== null ? `<small data-pint>belső számítás: ${ft(k.internal)} – nem végleges</small>` : ''}</span>
        <span class="abtn">Megnyitás</span></a>`;
    }).join('') + (list.length > limit ? `<button class="abtn abtn--xl plist__more" type="button" data-pmore>Továbbiak mutatása (még ${list.length - limit})</button>` : '') || '<p>Nincs találat.</p>';
  };
  el.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { q = e.target.value.toLowerCase().trim(); limit = 30; paint(); } });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-pmore]')) { limit += 30; paint(); return; }
    const b = e.target.closest('[data-pf]');
    if (b) { limit = 30; f = b.dataset.pf; $$('[data-pf]', el).forEach((x) => x.setAttribute('aria-pressed', x === b)); paint(); }
  });
  paint();
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
      ${rule ? '' : '<p class="hint">Ennél a gyűrűnél nincs kő. A „Gyémántok” résznél kapcsolható be.</p>'}
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

  // V5.6/V5.9: szakmai jóváhagyás – érthető állapot, tételes hiány/becslés ott, ahol a jóváhagyás történik, és a következmény.
  const checkBox = () => {
    const ac = approvalCheck(p, Mx, st.settings);
    const can = ac.ok || p.approved;
    const after = priceKinds({ ...p, approved: true }, null, Mx, st.settings);
    const w = (k) => ac.missing.some((m) => m.key.endsWith(k));
    const head = p.approved ? 'A gyűrű adatai jóváhagyva.' : ac.missing.length ? (w('weight') && ac.missing.length === 1 ? 'Hiányzik a pontos tömeg.' : 'Az adatok ellenőrzésre várnak.') : 'Az adatok ellenőrzésre várnak.';
    return `<h2 data-estate>${head}</h2>
      ${ac.missing.length ? `<p>Ezek nélkül nem hagyható jóvá (a „Részletes gyűrűbeállítások” alatt adhatók meg):</p><ul class="echeck__miss" data-emissing>${ac.missing.map((m) => `<li>Hiányzik: ${esc(m.label)}</li>`).join('')}</ul>` : p.approved ? '' : '<p class="hint" data-eok>Minden kötelező szakmai adat meg van adva.</p>'}
      ${ac.estimated.length && !p.approved ? `<p>Becsült adat – jóváhagyás előtt ellenőrizze:</p><ul class="echeck__est" data-eestimated>${ac.estimated.map((m) => `<li>${esc(m.label)}</li>`).join('')}</ul>` : ''}
      ${p.approved ? '<p class="hint">Ha a tömeget, a méreteket vagy a kőszabályt módosítja, a jóváhagyás magától visszavonódik, és újra jóvá kell hagyni.</p>'
        : `<p class="echeck__then" data-ethen><b>Jóváhagyás után:</b> a vásárló a megadott keretek között beállíthatja a gyűrűt, és ${after.visible !== null ? `a weboldalon <b>${ft(after.visible)}</b> jelenik meg (alapváltozat).` : `továbbra is „Egyedi árajánlat” látszik, mert: ${esc(after.reason || 'nincs jóváhagyott ár')}`}</p>`}
      <div class="checks">${can
        ? chk('approved', ac.estimated.length && !p.approved ? 'Ellenőriztem a fenti becsült adatokat, és jóváhagyom ezt a gyűrűt' : 'A gyűrű szakmai adatai rendben vannak – jóváhagyom', !!p.approved)
        : '<label class="check check--lg is-disabled"><input type="checkbox" disabled data-approve-blocked><span>Jóváhagyás – előbb adja meg a hiányzó adatokat</span></label>'}</div>`;
  };

  // V5.9: a részletes beállítások nyitott/zárt állapota a szerkesztés alatt megmarad (újrarajzoláskor sem csukódik be).
  let advOpen = (() => { try { return sessionStorage.getItem('kg-edit-adv') === '1'; } catch { return false; } })();
  const ringSummary = (r) => { const x = r.stoneRule; if (!x) return 'kő nélkül';
    const cats = (x.cats || []).map((c) => { const d = diamond(Mx, c); return d ? `${ctFmt(d.ct)} ct` : c; }).join(', ');
    return ({ free: `${x.min}–${x.max} kő, alapból ${x.def}`, fixed: `${x.def} kő`, perSize: 'körbe foglalva, mérettől függ', quote: 'kő csak egyedi ajánlattal' }[x.mode] || '') + (cats ? ` · ${cats}` : '') + (x.allowNone ? ' · kő nélkül is kérhető' : ''); };
  const photoBox = () => `<section class="ebox" data-photobox><h2>Fénykép</h2>
    <div class="imgpick">
      <figure class="imgpick__cur"><div class="imgpick__prev" data-imgprev>${p.img ? `<img src="${esc(p.img)}" alt="A gyűrű jelenlegi fényképe" referrerpolicy="no-referrer">` : '<span>Még nincs kép</span>'}</div><figcaption>${isNew ? 'Kiválasztott kép' : 'Jelenlegi kép'}</figcaption></figure>
      ${isNew ? '' : '<figure class="imgpick__new" data-imgnewbox hidden><div class="imgpick__prev" data-imgnew></div><figcaption>Új kép – előnézet, még nincs mentve</figcaption></figure>'}
      <div class="imgpick__ctl">
        <label class="abtn imgpick__file">${isNew ? 'Kép kiválasztása' : 'Fénykép cseréje'}<input type="file" accept="image/jpeg,image/png,image/webp" data-imgfile hidden></label>
        ${isNew ? '' : '<button class="abtn abtn--gold" type="button" data-imgsave hidden>Új fénykép mentése</button><button class="abtn" type="button" data-imgdrop hidden>Mégsem</button>'}
        <p class="hint">JPG, PNG vagy WebP, legfeljebb 8 MB. Csak saját, valódi fotó.</p>
        <p class="imgpick__msg" data-imgmsg aria-live="polite"></p>
      </div>
    </div></section>`;

  const render = () => {
    const gm = st.settings.pricingMode === 'gramm';
    el.innerHTML = `
    <p class="crumbs"><a href="#/admin/gyuruk">← Vissza a gyűrűkhöz</a></p>
    <h1 class="adm__h1">${isNew ? 'Új gyűrű' : esc(p.code)}</h1>
    <div class="edit">
      <div class="edit__form">
        <section class="ebox"><h2>Alapadatok</h2>
          <div class="egrid">
            <label class="efield"><span>Cikkszám</span><input class="input input--lg" data-t="code" value="${esc(p.code)}"></label>
            <label class="efield"><span>A gyűrű neve</span><input class="input input--lg" data-t="name" value="${esc(p.name)}"></label>
          </div>
          ${isNew ? `<p class="efield__lab">Típus</p><div class="seg seg--lg seg--wrap"><button type="button" data-kind="p" aria-pressed="${p.kind === 'p'}">Gyűrűpár (női + férfi)</button><button type="button" data-kind="s" aria-pressed="${p.kind === 's'}">Egy gyűrű</button></div>` : ''}
          <div class="checks">${chk('visible', 'Látható a weboldalon', p.visible !== false)}</div>
        </section>
        ${photoBox()}
        <section class="ebox"><h2>Anyagok és színek</h2>
          <p class="efield__lab">Elérhető anyagok</p>
          <div class="checks">${METAL_ORDER.map((m) => arr('metals', m, METALS[m].short, p.metals.includes(m))).join('')}</div>
          <p class="efield__lab">Színek <small>amiből kérhető</small></p>
          <div class="checks">${['sarga', 'feher', 'rose'].map((c) => arr('colors', c, COLORS[c].label, p.colors.includes(c))).join('')}</div>
          <label class="efield"><span>A fotón látható szín</span><select class="input input--lg" data-t="baseColor">${p.colors.map((c) => `<option value="${c}" ${p.baseColor === c ? 'selected' : ''}>${COLORS[c]?.label || c}</option>`).join('')}</select></label>
        </section>
        <section class="ebox"><h2>Méretek</h2>
          <div class="egrid">${p.rings.map((r, i) => `${n(`rings.${i}.sizeMin`, `${esc(r.label)} – legkisebb`, 'mm', `üresen: ${r.refSize < 60 ? 44 : 54}`)}${n(`rings.${i}.sizeMax`, `${esc(r.label)} – legnagyobb`, 'mm', `üresen: ${r.refSize < 60 ? 64 : 76}`)}`).join('')}</div>
        </section>
        <section class="ebox"><h2>Gyémántok <small>csak természetes gyémánt</small></h2>
          ${p.rings.map((r, i) => `<div class="ringstone"><label class="efield"><span>${esc(r.label)}<small>${esc(ringSummary(r))}</small></span>
            <select class="input input--lg" data-rulemode="${i}">${RULE_MODES.map(([k, l]) => `<option value="${k}" ${k === (r.stoneRule ? r.stoneRule.mode : 'none') ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>`).join('')}
          <p class="hint">A kőszám, a kőméretek és a kő nélküli kérés a „Részletes gyűrűbeállítások” alatt állítható.</p>
        </section>
        <section class="ebox"><h2>Ár típusa</h2>
          <div class="seg seg--lg seg--wrap" data-ov>
            <button type="button" data-ovt="nincs" aria-pressed="${ov() === 'nincs'}">Számolt ár (tömeg × grammár)</button>
            <button type="button" data-ovt="pct" aria-pressed="${ov() === 'pct'}">Számolt ár ± százalék</button>
            <button type="button" data-ovt="fixed" aria-pressed="${ov() === 'fixed'}">Rögzített ár</button>
          </div>
          <div data-ovfield></div>
          <div class="checks">${chk('priceOnRequest', 'Mindig egyedi árajánlat (a weboldalon nincs ár)', !!p.priceOnRequest)}</div>
        </section>
        <section class="ebox ${p.approved ? 'ebox--ok' : 'ebox--todo'}" data-echeck>${checkBox()}</section>
        <details class="ebox ebox--adv" data-adv ${advOpen ? 'open' : ''}>
          <summary><h2>Részletes gyűrűbeállítások</h2><small>tömeg, szélesség, vastagság, kőszabályok, korlátozások, minimumár</small></summary>
          ${p.rings.map((r, i) => `<section class="ebox__sub"><h3 class="ebox__h3">${esc(r.label)}</h3>
            <div class="egrid">
              ${n(`rings.${i}.refSize`, 'Referenciaméret', 'mm', 'ehhez a mérethez tartozik a tömeg')}
              ${n(`rings.${i}.weight`, 'Tömeg 14K-ban', 'g', `${sizeSfx(r.refSize)} méretben – ${p.real && !r.weightChecked ? 'becsült, még nem mért' : 'megadott érték'}`)}
              ${n(`rings.${i}.refWidth`, 'Szélesség', 'mm', 'a vásárló online nem választhat mást')}
              ${n(`rings.${i}.thickness`, 'Vastagság', 'mm', 'ha ismert')}
              ${gm ? '' : n(`rings.${i}.labor`, 'Munkadíj', 'Ft', 'csak költségalapú számításnál') + n(`rings.${i}.other`, 'Egyéb költség', 'Ft')}
            </div>
            <p class="hint" data-wline="${i}"></p>${ruleBox(r, i)}</section>`).join('')}
          <section class="ebox__sub" data-optsbox><h3 class="ebox__h3">Mit állíthat a vásárló?</h3>
            <p class="hint">Amit nem engedélyez és nem hagy jóvá, azt a vásárló nem tudja átállítani – ott a „személyes egyeztetés” jelenik meg.</p>
            <div class="checks">${chk('opts.width.enabled', 'A vásárló választhat szélességet', p.opts.width.enabled)}</div>
            ${p.opts.width.enabled ? `<div class="egrid">${n('opts.width.min', 'Legkeskenyebb', 'mm')}${n('opts.width.max', 'Legszélesebb', 'mm')}${n('opts.width.step', 'Lépésköz', 'mm', 'jellemzően 0,5')}</div>
              <div class="checks">${chk('opts.width.approved', 'Jóváhagyom ezeket a szélességhatárokat ennél a gyűrűnél', p.opts.width.approved)}</div>
              <p class="hint" data-wstate></p>` : ''}
            <div class="checks">${chk('opts.thickness.enabled', 'A vásárló választhat vastagságot', p.opts.thickness.enabled)}</div>
            ${p.opts.thickness.enabled ? `<label class="efield"><span>Választható vastagságok<small>mm, pontosvesszővel elválasztva</small></span><input class="input input--lg" data-tvals value="${esc((p.opts.thickness.values || []).map((v) => String(v).replace('.', ',')).join('; '))}" placeholder="pl. 1,6; 1,8; 2"></label>
              <div class="checks">${chk('opts.thickness.approved', 'Jóváhagyom ezeket a vastagságokat ennél a gyűrűnél', p.opts.thickness.approved)}</div>` : ''}
            <div class="optwarn" data-optwarn></div>
            <label class="efield"><span>Amihez személyes egyeztetés kell<small>soronként egy; a gyűrű oldalán jelenik meg</small></span><textarea class="input" rows="3" data-consult placeholder="pl. kő a férfigyűrűbe&#10;más felület">${esc(p.consult.join('\n'))}</textarea></label>
          </section>
          <section class="ebox__sub"><h3 class="ebox__h3">Egyéb</h3>
            <div class="egrid">
              ${n('minPrice', 'Minimumár', 'Ft', 'ennél olcsóbban sosem jelenik meg az ár; 0 = nincs')}
              <label class="efield"><span>Stílus</span><select class="input input--lg" data-t="style">${Object.entries(STYLES).map(([k, v]) => `<option value="${k}" ${p.style === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            </div>
            <p class="efield__lab">Melyik weboldalon jelenjen meg?</p>
            <div class="checks">${Object.entries(SITES).map(([k, v]) => arr('sites', k, v, (p.sites || []).includes(k))).join('')}</div>
            <label class="efield"><span>A kép webcíme <small>ha nem feltöltött képet használ</small></span><input class="input input--lg" data-imgurl placeholder="https://…" value="${esc(/^https?:/.test(p.img || '') ? p.img : '')}"></label>
            ${p.listaAr ? `<p class="hint" data-legacy>Régi weboldali listaár (nem igazolt, a vásárló nem látja): <b>${ft(p.listaAr)}</b>. Ha ezt szeretné, adja meg „Rögzített ár”-ként.</p>` : ''}
          </section>
          ${devMode() ? `<section class="ebox__sub" data-m3dbox><h3 class="ebox__h3">3D-modellek <small>fejlesztői nézet – később</small></h3>
            <div class="m3d" data-m3d>${p.models3d.map((m, k) => `<div class="m3d__row"><input class="input" data-m3="${k}|label" value="${esc(m.label || '')}" placeholder="megnevezés"><input class="input" data-m3="${k}|url" value="${esc(m.url || '')}" placeholder="fájl webcíme (.glb)"><button type="button" class="abtn" data-m3del="${k}">Törlés</button></div>`).join('')}</div>
            <button type="button" class="abtn" data-m3add>+ 3D-modell</button></section>` : ''}
          <section class="ebox__sub"><h3 class="ebox__h3">Számítási részletek</h3><div data-calcdetail></div></section>
        </details>
        <div class="edit__btns">
          <a class="abtn abtn--xl" href="#/admin/gyuruk">Mégsem</a>
          <button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button>
        </div>
      </div>
      <aside class="edit__calc" data-calc aria-live="polite"></aside>
    </div>`;
    const adv = $('[data-adv]', el); adv.addEventListener('toggle', () => { advOpen = adv.open; try { sessionStorage.setItem('kg-edit-adv', adv.open ? '1' : '0'); } catch { /* */ } });
    ovField(); calc();
  };

  const ovField = () => {
    const t = ov();
    $('[data-ovfield]', el).innerHTML = t === 'pct' ? n('override.value', 'Eltérés a számolt ártól', '%', 'pl. −5 vagy 10')
      : t === 'fixed' ? n('override.value', 'Rögzített bruttó ár', 'Ft', 'a grammár változása nem írja felül') : '';
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
    p.rings.forEach((rg, i) => { const w = $(`[data-wline="${i}"]`, el); if (w) w.innerHTML = 'Tömeg anyagonként ' + sizeSfx(rg.refSize) + ' méretben: ' + p.metals.map((m) => `${METALS[m].short} <b>${dec(Math.round((refWeight(rg, m, st.settings) || 0) * 100) / 100)} g</b>`).join(' · '); });
    const cfg0 = defaultConfig(p);
    const r = priceProduct(p, cfg0, st.materials, st.settings);
    const k = priceKinds(p, cfg0, st.materials, st.settings);
    const b = r.breakdown, s = st.settings;
    // V5.9: a háromféle ár egyértelműen külön
    $('[data-calc]', el).innerHTML = `<h2>Ár <small>alapváltozat${r.cfg ? `, ${METALS[r.cfg.metal].short}` : ''}</small></h2>
      <div class="calc-final" data-evisible><span>A weboldalon látható ár</span><b>${k.visible !== null ? ft(k.visible) : 'Egyedi árajánlat'}</b></div>
      ${k.visible === null ? `<p class="hint" data-ereason>${esc(k.reason || (p.visible === false ? 'A gyűrű rejtett.' : ''))}</p>` : '<p class="hint">Jóváhagyott ár – a vásárló ezt látja.</p>'}
      <div class="calc-int" data-einternal><span>Belső számított ár</span><b>${r.final === null ? 'nem számolható' : ft(r.final)}</b><small>${k.approved ? 'jóváhagyott adatokból' : 'nem végleges – a vásárló nem látja'}</small></div>
      ${r.final === null && r.reason ? `<p class="warn">${esc(r.reason)}</p>` : ''}
      <p class="hint">A számítás részletei: „Részletes gyűrűbeállítások” → Számítási részletek.</p>`;
    const det = $('[data-calcdetail]', el);
    if (!det) return;
    if (!b) { det.innerHTML = `<p class="warn">${esc(r.reason || 'Ennél a gyűrűnél nincs számolható ár.')}</p>`; return; }
    const line = (l, v, cls = '') => `<div class="${cls}"><dt>${l}</dt><dd>${ft(v)}</dd></div>`;
    const gm = b.mode === 'gramm';
    det.innerHTML = `<p class="hint">${dec(r.grams)} g ${gm ? `× ${ft(st.materials.sellPerGram[r.cfg.metal])}/g grammár` : `ötvözet · ebből ${dec(r.pure)} g színarany × ${ft(st.materials.gold24)}/g`} · belső számítás</p>
      <dl class="calc-dl">
        ${gm ? r.parts.map((x, i) => line(`${esc(p.rings[i].label)}: ${dec(x.grams)} g × ${ft(x.sellPerGram)}/g`, x.gramSell)).join('') : `${line('Nemesfém (veszteséggel)', b.metal)}${line('Munkadíj', b.labor)}`}
        ${b.stones ? line('Természetes gyémántok (darabár)', gm ? b.stonesGross : b.stones) : ''}${b.setting ? line('Kőfoglalás', b.setting) : ''}${b.other ? line('Doboz, tanúsítvány, egyéb', b.other) : ''}
        ${gm ? '' : line('Önköltség összesen', b.cost, 'sum')}
        ${gm ? '' : line(`Felár (fém, munka ${s.markupMetal}% · kő ${s.markupStones}%)`, b.net - b.cost)}
        ${gm ? `${line('Bruttó összesen', b.gross, 'sum')}${line(`ebből ÁFA ${s.vatPct}%`, b.gross - b.net)}` : `${line('Nettó ár', b.net)}${line(`ÁFA ${s.vatPct}%`, b.gross - b.net)}`}
        ${rawRows(r, s.roundTo, line)}
      </dl>
      ${b.materialCost ? `<p class="hint">Tájékoztató anyagköltség (beszerzési árral): <b>${ft(b.materialCost)}</b></p>` : ''}
      ${r.marginPct === null ? '' : `<p class="${r.lowMargin ? 'warn' : 'ok'}">Árrés (a nyereség aránya az árban): ${dec(Math.round(r.marginPct * 10) / 10)}% ${r.lowMargin ? `– kisebb, mint a beállított ${s.minMarginPct}% minimum!` : ''}</p>`}
      ${r.minHit ? '<p class="warn">A minimumár lépett életbe.</p>' : ''}
      ${r.warnings.length ? `<p class="warn">${esc(r.warnings.join(' '))}</p>` : ''}`;
  };

  // V5.9 – fénykép cseréje a gyűrű adatlapján: előnézet → ellenőrzés → feltöltés → mentés. A régi kép a sikeres mentésig marad.
  let pendingFile = null, pendingUrl = '';
  const imgMsg = (html, bad = false) => { const m = $('[data-imgmsg]', el); if (m) { m.innerHTML = html; m.classList.toggle('is-err', bad); } };
  const dropPending = () => { if (pendingUrl) URL.revokeObjectURL(pendingUrl); pendingFile = null; pendingUrl = '';
    const nb = $('[data-imgnewbox]', el); if (nb) nb.hidden = true; ['[data-imgsave]', '[data-imgdrop]'].forEach((q) => { const x = $(q, el); if (x) x.hidden = true; }); };
  const pickPhoto = (file) => {
    const bad = checkImageFile(file);
    if (bad) { imgMsg(`<b>Ez a fájl nem használható:</b> ${esc(bad)}`, true); return; }
    if (isNew) {      // új gyűrűnél a kép a gyűrűvel együtt mentődik
      imgMsg('Kép feldolgozása…');
      const done = (src) => { p.img = src; $('[data-imgprev]', el).innerHTML = `<img src="${esc(src)}" alt="">`; imgMsg('A kép a gyűrű mentésekor kerül a weboldalra.'); };
      if (api.mode === 'server' && api.admin) uploadPhoto(file).then(done, (err) => imgMsg(`<b>A kép nem került fel.</b> ${esc(err.message)}`, true));
      else readImage(file, done);
      return;
    }
    dropPending();
    pendingFile = file; pendingUrl = URL.createObjectURL(file);
    $('[data-imgnew]', el).innerHTML = `<img src="${pendingUrl}" alt="Az új fénykép előnézete">`;
    $('[data-imgnewbox]', el).hidden = false; $('[data-imgsave]', el).hidden = false; $('[data-imgdrop]', el).hidden = false;
    imgMsg('Nézze meg az előnézetet. Ha jó, nyomja meg az „Új fénykép mentése” gombot.');
  };
  const savePhoto = async () => {
    if (!pendingFile) return;
    const btn = $('[data-imgsave]', el); btn.disabled = true;
    imgMsg('Feltöltés és mentés…');
    let src;
    try { src = api.mode === 'server' && api.admin ? await uploadPhoto(pendingFile) : await new Promise((res, rej) => readImage(pendingFile, res, rej)); }
    catch (err) { btn.disabled = false; imgMsg(`<b>A fénykép nem került fel, a régi kép maradt.</b> ${esc(err?.message || 'Ismeretlen hiba.')}`, true); return; }
    store.updateProduct(id, (x) => { x.img = src; }, `${p.code}: új fénykép`);
    const r = await serverSaved();
    btn.disabled = false;
    if (!r.ok) { imgMsg(`<b>A fénykép NEM lett mentve, a régi kép maradt.</b> ${esc(r.error)}`, true); return; }
    p.img = src; dropPending();
    $('[data-imgprev]', el).innerHTML = `<img src="${esc(src)}" alt="A gyűrű jelenlegi fényképe">`;
    imgMsg('<b>A fénykép mentve</b> – már ez látszik a weboldalon.');
  };

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ovt]');
    if (e.target.closest('[data-imgsave]')) { savePhoto(); return; }
    if (e.target.closest('[data-imgdrop]')) { dropPending(); imgMsg('Az új képet elvetettük, a régi maradt.'); return; }
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
        savedToast(saved ? `Felvéve: <b>${esc(p.code)}</b>. ${p.visible !== false ? 'Megjelent a katalógusban „Egyedi árajánlat” jelöléssel – az adatai ellenőrzésre várnak.' : 'Rejtve van.'}`
          : 'Felvéve, de a böngésző tárhelye betelt (túl nagy kép) – frissítés után elveszhet. Használjon kisebb képet vagy webcímet.');
        location.hash = '#/admin/gyuruk'; return;
      }
      const r = priceProduct(p, null, st.materials, st.settings);
      const go = () => {
        const res = store.updateProduct(id, (x) => { for (const k of Object.keys(x)) delete x[k]; Object.assign(x, clone(p)); }, `${p.code} adatai módosítva`);
        if (res.blocked) { savedToast(`Mentve, de <b>${esc(p.code)}</b> nincs jóváhagyva: hiányzik ${esc(res.blocked.map((m) => m.label).join(', '))}.`, { ms: 9000 }); location.hash = '#/admin/gyuruk'; return; }
        savedToast(res.revoked
          ? `Mentve. <b>${esc(p.code)}</b> szakmai adatai változtak, ezért a korábbi jóváhagyás visszavonva – a vásárló újra egyedi ajánlatot kér, amíg újra jóvá nem hagyja.`
          : `Mentve. ${esc(p.code)} a weboldalon: <b>${(() => { const k = priceKinds(store.product(id), null, S().materials, S().settings); return k.visible !== null ? ft(k.visible) : 'Egyedi árajánlat'; })()}</b>`, { ms: res.revoked ? 9000 : 3500 });
        location.hash = '#/admin/gyuruk';
      };
      if (r.lowMargin) {
        modal(`<div class="form"><h2>Alacsony árrés</h2><p>Ennél a gyűrűnél az árrés ${dec(Math.round(r.marginPct * 10) / 10)}%, kevesebb a beállított ${st.settings.minMarginPct}%-os minimumnál. Biztosan menti?</p>
          <div class="impact__btns"><button class="abtn abtn--xl" data-close>Vissza</button><button class="abtn abtn--gold abtn--xl" data-ok>Igen, mentem</button></div></div>`,
          { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); go(); } });
      } else go();
    }
  });
  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-imgfile]') && t.files[0]) { pickPhoto(t.files[0]); t.value = ''; return; }
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
    const wm = t.dataset.p && /^rings\.(\d+)\.weight$/.exec(t.dataset.p); if (wm && p.rings[+wm[1]]) p.rings[+wm[1]].weightChecked = true;   // az ötvös maga adta meg
    calc();
    const box = $('[data-echeck]', el); if (box && !box.contains(document.activeElement)) box.innerHTML = checkBox();
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
    ['gramm', 'Grammár szerint (tömeg × eladási grammár) – az ötvös módszere', 'Kész tömeg × eladási grammár (benne a fém, a munka, az árrés és az ÁFA). Pl. 5 g × 45 000 Ft/g = 225 000 Ft (szemléltető számok). Ehhez csak a kövek darabára és a külön díjak adódnak – munkadíj, felár és ÁFA nem számolódik még egyszer.'],
    ['koltseg', 'Költségalapú (beszerzési ár + munkadíj + felár) – csak összehasonlításnak', 'Alapanyagár (14K = 24K × 0,585) × tömeg + munkadíj + kövek, erre felár és ÁFA. Az alapanyagár változása csak a fém részt mozgatja.'],
  ],
  sizeMethod: [
    ['tomeg', 'Tömeg szerint', 'A tömeg arányos a mérettel: 60-as = 54-es × 60/54. Pl. 200 000 Ft × 60/54 ≈ 222 222 Ft (szemléltető számok). A kövek és díjak nem változnak a mérettel.'],
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
    <h1 class="adm__h1">Haladó árképzés</h1>
    <p class="adm__lead">Itt állítható, hogyan számolja a rendszer az árat, és milyen díjak adódnak hozzá. <b>Ritkán kell hozzányúlni</b> – a módosítás minden gyűrű árát érinti, mentés előtt a jobb oldalon látszik a hatása. A napi teendő az <a href="#/admin/arak">Árak</a> menü.</p>
    <div class="formula">
      <p class="formula__eq" data-eq></p>
      <p class="hint">Színarany-tartalom: 14K = 58,5%, 18K = 75%. A szín azonos karátnál nem változtat az árat. A gyémánt darabár × kőszám, nem grammra számolódik – és csak egyszer.</p>
    </div>
    <div class="edit">
      <div class="edit__form">
        ${modeBox('pricingMode', 'Az árszámítás módja')}
        ${modeBox('sizeMethod', 'Méret hatása az árra')}
        <section class="ebox"><h2>Külön felszámított díjak <small>bruttó, a gyűrű árához adódnak</small></h2><div class="egrid">
          ${f('settingPerStone', 'Kőfoglalás', 'Ft/kő', 'Ha a kő darabára már tartalmazza, maradjon 0.')}${f('engravingPrice', 'Gravírozás', 'Ft/gyűrű')}
          ${f('boxCost', 'Díszdoboz', 'Ft/termék')}${f('certCost', 'Kőtanúsítvány', 'Ft/köves termék')}
          ${f('vatPct', 'ÁFA', '%', 'Grammáras számításnál a grammár már tartalmazza – nem adódik hozzá újra.')}
        </div>
        <label class="check check--lg"><input type="checkbox" data-sb="stonesGross" ${d.stonesGross !== false ? 'checked' : ''}><span>A gyémánt darabára végső ár (grammáras módban nincs rá felár és ÁFA) ${srcBadge((st.settings.src || {}).stonesGross || 'demo')}</span></label></section>
        <section class="ebox"><h2>Tömegarány anyagonként ${srcBadge((st.settings.src || {}).density || 'demo')}</h2>
          <p class="hint">Ugyanaz a modell az adott anyagból ennyiszer nehezebb, mint 14K aranyból. Pl. ha egy 14K gyűrű 5 g, és a szorzó 1,4, akkor ugyanaz platinából 7 g.</p>
          <div class="egrid">${['au18', 'pt', 'pd', 'ti'].map((m) => f(`density.${m}`, `${METALS[m].short}`, '×', `5 g → ${dec(Math.round(5 * (get(d, `density.${m}`) || 0) * 100) / 100)} g`)).join('')}</div>
        </section>
        <section class="ebox"><h2>Kövek – fizikai korlát</h2>
          <p class="hint">A vásárló csak olyan kőméretet választhat, ami elfér: a kő átmérője ≤ gyűrűszélesség − perem. Körbe foglalásnál a kőszám legfeljebb a kerület ÷ (kőátmérő + hézag).</p>
          <div class="egrid">${f('stoneEdgeMm', 'Perem', 'mm')}${f('stoneGapMm', 'Hézag kövek között', 'mm')}</div>
        </section>
        <details class="ebox ebox--fold"><summary><h2>Csak költségalapú számításnál</h2><small>felár = amennyit a költségre rátesz; veszteség = öntésnél elvesző fém</small></summary>
          <div class="egrid">
          ${f('markupMetal', 'Felár a fémre és munkára', '%')}${f('markupStones', 'Felár a kövekre', '%')}${f('lossPct', 'Gyártási veszteség', '%')}
          ${['pt', 'pd', 'ti'].map((m) => f(`laborFactor.${m}`, `${METALS[m].short} – munkadíj-szorzó`, '×', '')).join('')}</div>
        </details>
        <section class="ebox"><h2>Kerekítés és árrés</h2><div class="egrid">
          <label class="efield"><span>Árak kerekítése ${srcBadge((st.settings.src || {}).roundTo || 'demo')}<small>Pl. 100 Ft-ra: 302 933 → 303 000 Ft.</small></span>${roundSelect(d.roundTo)}</label>
          ${f('minMarginPct', 'Legkisebb árrés', '%', 'Árrés = a nyereség aránya az árban. Ha egy gyűrűnél ennél kisebb, mentéskor figyelmeztetünk (csak költségalapú számításnál).')}
        </div></section>
        <div class="edit__btns"><a class="abtn abtn--xl" href="#/admin/beallitasok">Mégsem</a><button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button></div>
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
    if (e.target.closest('[data-save]')) { store.updateSettings(d, 'Árszámítás és díjak módosítva'); serverSaved().then((r) => { uiToast(r.ok ? '<b>Mentve.</b> Az árak újraszámolódtak.' : `<b>Nem lett mentve.</b> ${esc(r.error)}`, { ms: r.ok ? 3500 : 12000 }); formula(el); }); }
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
        { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); store.updateMany(x.ids, (p) => p.rings.forEach((r) => (r.labor = v)), `Munkadíj (${x.label.toLowerCase()}): ${ft(v)}/gyűrű`); toast(`${n} gyűrű ára frissült.${store.lastRevoked ? ` ${store.lastRevoked} korábban jóváhagyott gyűrű jóváhagyása visszavonva.` : ''}`); formula(el); } });
    }
  });
  calc();
}

/* ---------- Érdeklődések (V5.9): négy csoport, egyértelmű gombok; az ajánlati ár és az állapot külön ---------- */
const STATUS = { uj: 'Új', hivando: 'Visszahívásra vár', visszahivva: 'Felkeresve', elfogadva: 'Felkeresve', lezarva: 'Lezárva' };
const INQ_GROUPS = [['uj', 'Új érdeklődések', ['uj']], ['hivando', 'Visszahívásra várnak', ['hivando']], ['felkeresett', 'Már felkeresett érdeklődők', ['visszahivva', 'elfogadva']], ['lezart', 'Lezárt ügyek', ['lezarva']]];
const INQ_TYPE = { konzultacio: 'időpontot kér', egyedi: 'saját elképzelés', telefon: 'telefonon felírva', erdeklodes: 'ajánlatot kér' };
function inquiries(el) {
  el = fresh(el);
  const card = (q, st) => {
    const p = q.productId && store.product(q.productId);
    // Rögzíteni csak jóváhagyott, a weboldalon is látható árat lehet – belső számítást nem
    const k = p && q.config ? priceKinds(p, q.config, st.materials, st.settings) : null;
    const nowPrice = k ? k.visible : null;
    const tel = String(q.phone || '').replace(/[^\d+]/g, '');
    return `<article class="inq inq--${q.status}" data-inqcard="${esc(q.id)}">
      <header><b>${esc(q.name)}</b><span class="badge" data-inqstatus>${STATUS[q.status] || q.status}</span></header>
      <p class="inq__meta">Beérkezett: ${dateHu(q.at)} · ${INQ_TYPE[q.type] || 'érdeklődés'}${q.day ? ` · kért nap: ${dayHu(q.day)}` : ''}</p>
      <p class="inq__contact">${q.phone ? `<a class="inq__tel" href="tel:${esc(tel)}">${esc(q.phone)}</a>` : '<span>nincs telefonszám</span>'}${q.email ? ` <a href="mailto:${esc(q.email)}">${esc(q.email)}</a>` : ''}</p>
      ${p ? `<p class="inq__ring">Gyűrű: <a href="#/gyuru/${esc(p.id)}" target="_blank" rel="noopener"><b>${esc(p.code)}</b> – ${esc(p.name)}</a></p>` : q.code ? `<p class="inq__ring">Gyűrű: <b>${esc(q.code)}</b></p>` : ''}
      ${q.summary ? `<details class="inq__cfg" open><summary>Kiválasztott változat</summary><pre>${esc(q.summary)}</pre></details>` : ''}
      ${q.message ? `<p class="inq__msg">„${esc(q.message)}”</p>` : ''}
      ${q.notify === 'hiba' ? '<p class="inq__notify inq__notify--err" data-notify="hiba">Az e-mail-értesítés erről nem ment el – az érdeklődés itt megvan.</p>' : q.notify === 'elkuldve' ? '<p class="inq__notify" data-notify="elkuldve">E-mail-értesítés elküldve.</p>' : ''}
      ${(q.files || []).length ? `<div class="inq__files" data-inqfiles>${q.files.map((f, i) => `<a href="${esc(inquiryFileUrl(q.id, f.file))}" target="_blank" rel="noopener"><img src="${esc(inquiryFileUrl(q.id, f.file))}" alt="Csatolt kép ${i + 1}" loading="lazy"></a>`).join('')}<p class="hint">Csatolt kép – csak itt, belépve látható.</p></div>`
        : q.images ? `<p class="hint">${q.images} kép volt kiválasztva, de nem töltődött fel – kérje el e-mailben.</p>` : ''}
      <div class="inq__price" data-inqprice>${q.lockedPrice ? `<p class="ok">Rögzített ajánlati ár: <b>${ft(q.lockedPrice)}</b> (${dayHu(q.lockedAt)}) – a későbbi árváltozás nem érinti.</p>`
        : nowPrice ? `<p>A weboldalon most látható ár ehhez a változathoz: <b>${ft(nowPrice)}</b></p><button class="abtn" type="button" data-lock="${esc(q.id)}">Ezt rögzítem ajánlati árként</button>`
        : p ? '<p class="hint">Ehhez a változathoz nincs jóváhagyott ár – az ajánlatot egyeztetés után adja meg.</p>' : ''}</div>
      <div class="inq__btns">
        ${q.phone && q.status !== 'lezarva' ? `<a class="abtn abtn--gold" href="tel:${esc(tel)}" data-call="${esc(q.id)}">Felhívom</a>` : ''}
        ${['uj', 'hivando'].includes(q.status) ? `<button class="abtn" type="button" data-st="visszahivva" data-id="${esc(q.id)}">Visszahívtam</button>` : ''}
        ${q.status !== 'lezarva' ? `<button class="abtn" type="button" data-st="lezarva" data-id="${esc(q.id)}">Lezárás</button>` : `<button class="abtn" type="button" data-st="hivando" data-id="${esc(q.id)}">Újranyitás</button>`}
      </div>
      ${api.mode === 'server' ? `<details class="inq__more"><summary>Törlés</summary><button class="abtn abtn--danger" type="button" data-inqdel="${esc(q.id)}">Végleges törlés</button></details>` : ''}
    </article>`;
  };
  const paint = () => {
    const st = S();
    el.innerHTML = `<h1 class="adm__h1">Érdeklődések</h1>
      <p class="adm__lead">A weboldalon küldött kérések. Hívja fel az érdeklődőt, majd jelölje: „Visszahívtam”. A „Felhívom” gomb csak tárcsáz – nem jelöli sikeresnek a hívást.</p>
      ${st.inquiries.length ? INQ_GROUPS.map(([k, title, sts]) => { const L = st.inquiries.filter((q) => sts.includes(q.status));
        const body = L.length ? L.map((q) => card(q, st)).join('') : '<p class="hint">Nincs ilyen.</p>';
        return k === 'lezart' ? `<details class="inqgrp" data-inqgrp="${k}"><summary><h2>${title} <small>${L.length}</small></h2></summary>${body}</details>`
          : `<section class="inqgrp" data-inqgrp="${k}"><h2>${title} <small>${L.length}</small></h2>${body}</section>`; }).join('')
        : '<div class="note-card"><p>Még nincs érdeklődés.</p><p class="hint">A vásárlói oldalon a gyűrűknél lévő „Ajánlatot kérek” gombbal érkeznek.</p></div>'}`;
  };
  el.addEventListener('click', (e) => {
    const s = e.target.closest('[data-st]'), l = e.target.closest('[data-lock]'), dl = e.target.closest('[data-inqdel]'), c = e.target.closest('[data-call]');
    if (c) { const q = S().inquiries.find((x) => x.id === c.dataset.call); if (q && q.status === 'uj') { store.updateInquiry(q.id, { status: 'hivando' }).then((ok) => { if (!ok) uiToast(`<b>NEM lett mentve.</b> ${esc(api.error || '')}`, { ms: 12000 }); paint(); }); setTimeout(paint, 0); } return; }   // a tárcsázás megy tovább (tel: link)
    if (dl) {
      const q = S().inquiries.find((x) => x.id === dl.dataset.inqdel);
      modal(`<div class="form"><h2>Érdeklődés végleges törlése</h2><p><b>${esc(q?.name || '')}</b> érdeklődése${(q?.files || []).length ? ` és ${q.files.length} csatolt képe` : ''} véglegesen törlődik. Nem vonható vissza.</p>
        <div class="impact__btns"><button class="abtn abtn--xl" data-close>Mégse</button><button class="abtn abtn--danger abtn--xl" data-ok>Törlöm</button></div></div>`,
        { onMount: (box, close) => box.querySelector('[data-ok]').onclick = async () => {
          close();
          const r = await deleteInquiry(dl.dataset.inqdel);
          if (!r.ok) { uiToast(`<b>Nem sikerült törölni.</b> ${esc(r.error)}`, { ms: 9000 }); return; }
          await loadInquiries(); uiToast('Törölve.'); paint();
        } });
      return;
    }
    if (s) {
      const msg = s.dataset.st === 'visszahivva' ? 'Jelölve: felkeresve.' : s.dataset.st === 'lezarva' ? 'Lezárva.' : 'Újranyitva – visszahívásra vár.';
      store.updateInquiry(s.dataset.id, { status: s.dataset.st }).then((ok) => { uiToast(ok ? msg : `<b>NEM lett mentve.</b> ${esc(api.error || 'Az érdeklődés állapota nem mentődött.')}`, ok ? undefined : { ms: 12000 }); paint(); });
      paint();
    }
    if (l) {
      const q = S().inquiries.find((x) => x.id === l.dataset.lock);
      const p = store.product(q.productId);
      const k = priceKinds(p, q.config, S().materials, S().settings);
      if (k.visible === null) { uiToast('Ehhez nincs jóváhagyott ár – nem rögzíthető.'); return; }
      store.updateInquiry(q.id, { status: q.status, lockedPrice: k.visible, lockedAt: new Date().toISOString() })   // az állapot nem változik
        .then((ok) => { uiToast(ok ? 'Az ajánlati ár rögzítve.' : `<b>NEM lett mentve.</b> ${esc(api.error || '')}`, ok ? undefined : { ms: 12000 }); paint(); });
      paint();
    }
  });
  paint();
}

/* ---------- Árak → Korábbi árak (V5.9): árváltozások, visszaállítás következményekkel ---------- */
function history(el) {
  el = fresh(el);
  let all = false;
  const kind = { start: 'Kezdés', materials: 'Ár', settings: 'Árszámítás', product: 'Gyűrű', approve: 'Jóváhagyás', decision: 'Belső' };
  const paint = () => {
    const st = S();
    const list = st.history.filter((h) => all ? h.kind !== 'decision' : ['start', 'materials', 'settings'].includes(h.kind));
    el.innerHTML = `<h1 class="adm__h1">Korábbi árak</h1>
      <p class="adm__lead">Minden árváltozás megmarad. Ha tévedett, a „visszaállítás” gombbal visszatérhet egy korábbi állapothoz – előtte megmutatjuk, mi változik.</p>
      <label class="check check--lg"><input type="checkbox" data-histall ${all ? 'checked' : ''}><span>A gyűrűk és jóváhagyások változásait is mutassa</span></label>
      <ol class="hist" data-hist>${list.map((h) => `<li>
        <div class="hist__when"><b>${dateHu(h.at)}</b><span>${esc(h.by)}</span>${h.validFrom && h.validFrom.slice(0, 10) !== h.at.slice(0, 10) ? `<span>érvényes: ${dayHu(h.validFrom)}</span>` : ''}</div>
        <div class="hist__what"><span class="badge">${kind[h.kind] || h.kind}</span><p>${esc(h.title)}</p>
          ${h.count ? `<small>${h.count} gyűrű belső számított ára változott</small>` : ''}</div>
        ${h.kind === 'materials' && h.before ? `<button class="abtn" data-rev="${h.id}">Az ez előtti árak visszaállítása</button>` : ''}
      </li>`).join('')}</ol>`;
  };
  el.addEventListener('change', (e) => { if (e.target.matches('[data-histall]')) { all = e.target.checked; paint(); } });
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-rev]'); if (b) confirmRevert(b.dataset.rev, () => paint()); });
  paint();
}

/* ---------- Árak → Árlista (V5.9): vásárlóknak adható és belső változat, egyértelműen elválasztva ---------- */
function priceRows(st) {
  return st.products.map((p) => ({ p, ...priceKinds(p, null, st.materials, st.settings) }));
}
function priceLists(el) {
  el = fresh(el);
  const st = S();
  const rows = priceRows(st);
  const pub = rows.filter((x) => x.p.visible !== false);
  const withPrice = pub.filter((x) => x.visible !== null).length;
  el.innerHTML = `<h1 class="adm__h1">Árlista</h1>
    <p class="adm__lead">Kétféle lista készülhet. Vásárlónak csak az elsőt adja ki.</p>
    <section class="ebox" data-publist><h2>Vásárlóknak adható árlista</h2>
      <p>Csak a weboldalon is látható, jóváhagyott árak. Ahol nincs jóváhagyott ár, ott „Egyedi árajánlat” áll.</p>
      <p class="hint"><b>${withPrice}</b> gyűrűnél van ár, <b>${pub.length - withPrice}</b> gyűrűnél „Egyedi árajánlat”. A rejtett gyűrűk nem kerülnek bele.</p>
      <div class="ptools__btns"><button class="abtn abtn--gold abtn--xl" type="button" data-print-pub>Nyomtatás</button><button class="abtn abtn--xl" type="button" data-csv-pub>Letöltés (Excel)</button></div>
    </section>
    <section class="ebox ebox--internal" data-intlist><h2>Belső kalkuláció <span class="tag tag--warn">Belső használatra – nem végleges árajánlat</span></h2>
      <p>A motor által számolt összegek minden gyűrűre – jóváhagyatlan és becsült adatokkal is. Ellenőrzéshez, nem az ügyfélnek.</p>
      <div class="ptools__btns"><button class="abtn abtn--xl" type="button" data-print-int>Nyomtatás</button><button class="abtn abtn--xl" type="button" data-csv-int>Letöltés (Excel)</button></div>
    </section>`;
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-print-pub]')) printList(st, 'pub');
    if (e.target.closest('[data-print-int]')) printList(st, 'int');
    if (e.target.closest('[data-csv-pub]')) priceCsv(st, 'pub');
    if (e.target.closest('[data-csv-int]')) priceCsv(st, 'int');
  });
}
const INT_MARK = 'BELSŐ HASZNÁLATRA – NEM VÉGLEGES ÁRAJÁNLAT';
/** A kész CSV-szöveg (tesztelhető); kind: 'pub' = vásárlóknak, 'int' = belső kalkuláció. */
export function priceCsvText(st, kind) {
  const sep = ';', q = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  const rows = priceRows(st);
  if (kind === 'pub') {
    const lines = [['Cikkszám', 'Megnevezés', 'Ár (bruttó, Ft)'].join(sep)];
    rows.filter((x) => x.p.visible !== false).forEach((x) => lines.push([x.p.code, x.p.name, x.visible !== null ? x.visible : 'Egyedi árajánlat'].map(q).join(sep)));
    return lines.join('\r\n');
  }
  const lines = [q(INT_MARK), ['Cikkszám', 'Megnevezés', 'Belső számított ár (Ft)', 'Weboldalon látható ár (Ft)', 'Gyűrű adatai', 'Tömeg', 'Miért nincs látható ár', 'Régi weboldali listaár (nem igazolt)'].join(sep)];
  rows.forEach((x) => lines.push([x.p.code, x.p.name, x.internal ?? 'nem számolható', x.visible ?? 'Egyedi árajánlat', x.p.approved ? 'jóváhagyva' : 'ellenőrzésre vár',
    x.p.rings.map((r) => (r.weight ? String(r.weight).replace('.', ',') + ' g' : '–') + (x.p.real && !r.weightChecked ? ' (becsült)' : '')).join(' / '), x.reason, x.p.listaAr || ''].map(q).join(sep)));
  return lines.join('\r\n');
}
function priceCsv(st, kind) {
  const blob = new Blob(['﻿' + priceCsvText(st, kind)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `karikagyuru-${kind === 'pub' ? 'arlista' : 'BELSO-kalkulacio'}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(kind === 'pub' ? 'A vásárlói árlista letöltve.' : 'A belső kalkuláció letöltve – nem adható ki az ügyfélnek.');
}
export function printList(st, kind = 'pub') {
  document.getElementById('printsheet')?.remove();
  const rows = priceRows(st).filter((x) => kind === 'int' || x.p.visible !== false);
  const d = document.createElement('div');
  d.id = 'printsheet'; d.dataset.kind = kind;
  if (kind === 'int') d.className = 'ps--int';
  d.innerHTML = kind === 'pub'
    ? `<header><img src="img/logo.png" alt="Karikagyuru.com" width="135"><div><h1>Árlista</h1><p>${dayHu(new Date().toISOString())}</p></div></header>
      <table><thead><tr><th>Cikkszám</th><th>Megnevezés</th><th>Ár (bruttó)</th></tr></thead><tbody>
      ${rows.map((x) => `<tr><td>${esc(x.p.code)}</td><td>${esc(x.p.name)}</td><td>${x.visible !== null ? ft(x.visible) : 'Egyedi árajánlat'}</td></tr>`).join('')}
      </tbody></table><p class="ps__note">Tájékoztató árak alapméretben. A végleges ár a személyes egyeztetésen készül.</p>`
    : `<p class="ps__intmark" data-intmark>${INT_MARK}</p>
      <header><div><h1>Belső kalkuláció</h1><p>${dayHu(new Date().toISOString())} · nem adható ki az ügyfélnek</p></div></header>
      <table><thead><tr><th colspan="5" class="ps__intrep">${INT_MARK}</th></tr><tr><th>Cikkszám</th><th>Belső számított ár</th><th>Weboldalon</th><th>Adatok</th><th>Megjegyzés</th></tr></thead><tbody>
      ${rows.map((x) => `<tr><td>${esc(x.p.code)}</td><td>${x.internal === null ? 'nem számolható' : ft(x.internal)}</td><td>${x.visible !== null ? ft(x.visible) : 'egyedi árajánlat'}</td><td>${x.p.approved ? 'jóváhagyva' : 'ellenőrzésre vár'}</td><td>${esc(x.reason || '')}</td></tr>`).join('')}
      </tbody></table>`;
  document.body.append(d);
  setTimeout(() => { window.print(); }, 50);
  addEventListener('afterprint', () => d.remove(), { once: true });
}

/* ---------- Beállítások (V5.9): egyszerű működési beállítások; a haladó árképzés külön fülön.
   A teljes adatállapot visszaállítása NEM tulajdonosi művelet: szerver módban nincs gomb (a szerver is tiltja),
   helyi (böngészős) bemutatóban csak a fejlesztői nézetben érhető el. ---------- */
function settings(el) {
  el = fresh(el);
  const st = S();
  const d = clone(st.settings);
  el.innerHTML = `<h1 class="adm__h1">Beállítások</h1>
    <p class="adm__lead">Ritkán kell ide jönni. Az árak a „Árak” menüben, a gyűrűk a „Gyűrűk” menüben módosíthatók.</p>
    <section class="ebox"><h2>Figyelmeztetések</h2><div class="egrid">
      <label class="efield"><span>Nagy árváltozás határa<small>ennél nagyobb grammár-változásnál külön megerősítést kérünk mentés előtt</small></span><span class="efield__in"><input class="input input--lg" inputmode="decimal" data-s="bigChangePct" value="${d.bigChangePct}"><i>%</i></span></label>
    </div>
    <div class="edit__btns"><button class="abtn abtn--gold abtn--xl" type="button" data-save>Mentés</button></div></section>
    ${api.mode === 'server' && api.admin ? `<section class="ebox" data-mailbox><h2>E-mail-értesítés új érdeklődésről</h2>
      <p class="hint" data-mailstate>Állapot betöltése…</p>
      <p class="hint">Az értesítési címet a fejlesztő állítja be a tárhelyen (nem itt).</p>
      <button class="abtn abtn--xl" type="button" data-mailtest hidden>Próbalevél küldése a beállított címre</button>
    </section>` : ''}
    <section class="ebox"><h2>Adatok tárolása</h2>
      <p class="hint" data-storage-note>${api.mode === 'server' && api.online ? 'Az adatok a szerveren tárolódnak. Minden mentés megmarad, és a korábbi árak visszaállíthatók („Árak” → „Korábbi árak”). A teljes adatbázisról a fejlesztő naponta biztonsági mentést készít.' : 'Ez a bemutató a böngészőben tárolja az adatokat: más gépen vagy böngészőben nem látszanak. A valódi, szerveres mentés a tárhelyre telepítés után működik.'}</p></section>
    <section class="ebox"><h2>Haladó árképzés</h2>
      <p>Az árszámítás módja, kerekítés, kőfoglalás, gravírozás, doboz, tömegarányok, árrés. <b>Ritkán kell hozzányúlni</b> – a módosítás minden gyűrű árát érinti.</p>
      <p><a class="abtn" href="#/admin/beallitasok/halado">Haladó árképzés megnyitása</a> <a class="abtn" href="#/admin/beallitasok/jovahagyas">Árelemek jóváhagyása</a></p></section>
    ${devMode() ? `<section class="ebox ebox--danger" data-devtools><h2>Fejlesztői eszközök <small>csak ebben a böngészős bemutatóban</small></h2>
      <p><a class="abtn" href="#/admin/kozpont">Belső nyilvántartás (ügyféldöntések)</a></p>
      <p>A bemutató adatainak visszaállítása a kiinduló állapotra – csak ebben a böngészőben.</p>
      <button class="abtn abtn--xl" type="button" data-reset>Bemutató visszaállítása</button></section>` : ''}`;
  el.addEventListener('input', (e) => { const k = e.target.dataset.s; if (k) { const v = parseNum(e.target.value); if (Number.isFinite(v)) d[k] = v; } });
  if ($('[data-mailbox]', el)) {
    mailStatus().then((m) => {
      const n = $('[data-mailstate]', el); if (!n) return;
      if (!m) { n.textContent = 'Az állapot nem kérdezhető le.'; return; }
      n.innerHTML = m.mode === 'off' ? '<b>Kikapcsolva.</b> Az érdeklődések itt, a kezelőfelületen gyűlnek; levél nem megy ki.'
        : m.ready ? `<b>Bekapcsolva</b> (${m.mode === 'file' ? 'csak fájlba ír – fejlesztői mód' : 'e-mail'}), címzett: ${esc(m.to)}`
        : `<b>Hiányos beállítás</b> – nem küld. Hiányzik: ${esc(m.missing.join(', '))}`;
      $('[data-mailtest]', el).hidden = !m.ready;
    });
  }
  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-save]')) { store.updateSettings({ bigChangePct: d.bigChangePct }, 'Figyelmeztetési határ módosítva'); const r = await serverSaved(); uiToast(r.ok ? '<b>Beállítások mentve.</b>' : `<b>Nem lett mentve.</b> ${esc(r.error)}`, { ms: r.ok ? 3500 : 12000 }); }
    if (e.target.closest('[data-reset]') && devMode()) resetDemo();
    const mt = e.target.closest('[data-mailtest]');
    if (mt) {
      mt.disabled = true;
      mailTest().then((r) => { mt.disabled = false; uiToast(r.ok ? '<b>Próbalevél elküldve.</b> Nézze meg a postafiókot (a levélszemétben is).' : `<b>A próbalevél nem ment el.</b> ${esc(r.error)}`, { ms: 9000 }); });
    }
  });
}

/** Csak helyi (böngészős) bemutatóban, fejlesztői nézetben. Szerver módban nem hívható: ott a szerver is elutasítaná. */
export function resetDemo() {
  if (!devMode()) return;
  modal(`<div class="form"><h2>Bemutató visszaállítása</h2><p>Ebben a böngészőben <b>minden</b> módosítás törlődik: árak, gyűrűk, fotók, műhelymunkák, érdeklődések, korábbi árak. A kiinduló bemutató-adatok töltődnek vissza.</p>
    <p class="hint">Más gépet, böngészőt vagy a szervert nem érinti.</p>
    <div class="impact__btns"><button class="abtn abtn--xl" data-close>Mégsem</button><button class="abtn abtn--danger abtn--xl" data-ok>Igen, visszaállítom</button></div></div>`,
    { onMount: (box, close) => box.querySelector('[data-ok]').onclick = () => { close(); store.reset(); uiToast('A bemutató visszaállt a kiinduló állapotra.'); window.dispatchEvent(new HashChangeEvent('hashchange')); } });
}
