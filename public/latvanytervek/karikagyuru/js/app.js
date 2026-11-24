/* Router + keret: fejléc, lábléc, vásárlói oldal ↔ kezelőfelület. */
import { store } from './store.js';
import { BUSINESS } from './data.js';
import * as pub from './views-public.js';
import { adminShell, loginView, blockedView } from './views-admin.js';
import { api, initApi, loadInquiries, refreshState, onApi } from './api.js';
import { $, $$, modal, M, reduced } from './ui.js';

const view = $('#view');
let lastCustomer = '#/', lastAdmin = '#/admin/attekintes';
let inqLoaded = false;

function parse() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}

function route() {
  const { parts, query } = parse();
  const admin = parts[0] === 'admin';
  document.body.dataset.mode = admin ? 'admin' : 'customer';
  if (admin) lastAdmin = location.hash; else lastCustomer = location.hash || '#/';
  $$('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.modeBtn === 'admin') === admin)));
  closeMenu();
  document.body.classList.remove('has-mimpact');

  const el = document.createElement('div');
  el.className = 'view';
  view.replaceChildren(el);

  if (admin && api.mode === 'server' && (api.blocked === 'offline' || api.blocked === 'error')) blockedView(el, api.error);
  else if (admin && api.mode === 'server' && !api.admin) loginView(el, () => route(), api.blocked === 'session' ? api.error : '');
  else if (admin) {
    if (api.mode === 'server' && api.admin && !inqLoaded) { inqLoaded = true; loadInquiries().then(() => { if (parse().parts[0] === 'admin') route(); }); }
    adminShell(el, parts[1] || 'attekintes', parts[2], parts[3]);
  }
  else if (parts[0] === 'kollekcio') pub.catalog(el, query.toString() ? query : null);
  else if (parts[0] === 'gyuru') pub.product(el, parts[1], query);
  else if (parts[0] === 'kapcsolat') pub.contact(el);
  else if (parts[0] === 'sajat') pub.custom(el, query);
  else if (parts[0] === 'munkak') pub.works(el);
  else pub.home(el);

  markDemo();
  $$('.nav > a:not([data-anchor])').forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#/' + (parts[0] || '')));
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (!admin && M() && !reduced()) M().animate(view, { opacity: [0.4, 1] }, { duration: 0.35 });
}

/* Bemutató mintaadat (jelszóval védett bemutató): az oldal tetején egy sáv, az áraknál „szemléltető mintaár”. Éles állapotban nincs. */
function markDemo() {
  const demo = !!store.get().demo;
  document.body.classList.toggle('is-demo', demo);
  let n = document.querySelector('[data-demo-note]');
  if (!demo) { n?.remove(); return; }
  if (!n) {
    n = document.createElement('div'); n.className = 'demo-strip'; n.dataset.demoNote = ''; n.setAttribute('role', 'note');
    n.innerHTML = '<b>Zárt bemutató</b><span>Az árak szemléltető mintaadatok, nem az ötvös árai. E-mail nem megy ki.</span>';
    document.body.prepend(n);
  }
}

/* --- kattintások --- */
document.addEventListener('click', (e) => {
  const m = e.target.closest('[data-mode-btn]');
  if (m) {
    if (document.body.dataset.mode === 'customer') lastCustomer = location.hash || '#/';  // a konfigurátor a linkbe írja a beállítást
    else lastAdmin = location.hash;
    location.hash = m.dataset.modeBtn === 'admin' ? lastAdmin : lastCustomer;
  }
  if (e.target.closest('[data-menu]')) toggleMenu();
  if (e.target.closest('[data-anchor]')) {
    e.preventDefault();
    const id = e.target.closest('[data-anchor]').dataset.anchor;
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    if (parse().parts.length) { location.hash = '#/'; setTimeout(go, 80); } else go();
    closeMenu();
  }
});

function toggleMenu() {
  const open = document.body.classList.toggle('menu-open');
  $('[data-menu]').setAttribute('aria-expanded', open);
  if (open && M() && !reduced()) M().animate($$('.nav a, .nav__extra > *'), { opacity: [0, 1], y: [12, 0] }, { delay: M().stagger(0.05), duration: 0.4 });
}
function closeMenu() { document.body.classList.remove('menu-open'); $('[data-menu]')?.setAttribute('aria-expanded', 'false'); }


/* --- fejléc árnyék görgetéskor --- */
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { document.body.classList.toggle('is-scrolled', scrollY > 8); ticking = false; });
}, { passive: true });

$$('[data-phone]').forEach((a) => { a.href = BUSINESS.phoneHref; a.textContent = a.dataset.phone === 'short' ? 'Hívás' : BUSINESS.phone; });
$('[data-year]').textContent = new Date().getFullYear();

addEventListener('hashchange', route);
// Szerver módban előbb a mentett árak töltődnek be; helyi módban azonnal indul.
initApi().finally(route);
// Ha mentés közben hiba lesz (kiesés, lejárt belépés, ütközés), a kezelőfelület azonnal zárolódik.
let lastBlocked = null;
onApi(() => { if (api.blocked !== lastBlocked) { lastBlocked = api.blocked; if (parse().parts[0] === 'admin') route(); } });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshState().then((changed) => { if (changed && parse().parts[0] !== 'admin') { const y = scrollY; route(); window.scrollTo(0, y); } });
});

