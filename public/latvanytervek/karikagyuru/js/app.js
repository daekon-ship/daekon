/* Router + keret: bemutató-sáv (vásárlói ↔ admin nézet), fejléc, lábléc. */
import { store } from './store.js';
import { BUSINESS } from './data.js';
import * as pub from './views-public.js';
import { adminShell, resetDemo } from './views-admin.js';
import { $, $$, modal, M, reduced, checkPhotos, photos } from './ui.js';

const view = $('#view');
let lastCustomer = '#/', lastAdmin = '#/admin/alapanyag';

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

  if (admin) adminShell(el, parts[1] || 'attekintes', parts[2]);
  else if (parts[0] === 'kollekcio') pub.catalog(el, query.toString() ? query : null);
  else if (parts[0] === 'gyuru') pub.product(el, parts[1], query);
  else if (parts[0] === 'kapcsolat') pub.contact(el);
  else pub.home(el);

  $$('.nav > a:not([data-anchor])').forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#/' + (parts[0] || '')));
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (!admin && M() && !reduced()) M().animate(view, { opacity: [0.4, 1] }, { duration: 0.35 });
}

/* --- bemutató-sáv --- */
document.addEventListener('click', (e) => {
  const m = e.target.closest('[data-mode-btn]');
  if (m) {
    if (document.body.dataset.mode === 'customer') lastCustomer = location.hash || '#/';  // a konfigurátor a linkbe írja a beállítást
    else lastAdmin = location.hash;
    location.hash = m.dataset.modeBtn === 'admin' ? lastAdmin : lastCustomer;
  }
  if (e.target.closest('[data-reset-demo]')) resetDemo();
  if (e.target.closest('[data-script]')) script();
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

function script() {
  const steps = [
    ['Megnyitjuk a gyűrűkatalógust', '#/kollekcio'],
    ['Megnézzük egy gyűrű kalkulált árát', '#/gyuru/maz-81184-81185-w'],
    ['Átváltunk az adminnézetre', '#/admin/alapanyag'],
    ['Megváltoztatjuk az arany árát (pl. 39 000 → 45 000 Ft/g)', '#/admin/alapanyag'],
    ['Jóváhagyjuk: „Új árak alkalmazása”', '#/admin/alapanyag'],
    ['Visszalépünk a katalógusba', '#/kollekcio'],
    ['A gyűrű ára már az új értéket mutatja', '#/gyuru/maz-81184-81185-w'],
  ];
  modal(`<div class="form script"><p class="kicker">Bemutató forgatókönyv</p><h2>Hét lépés, kb. három perc</h2>
    <ol>${steps.map(([t, h], i) => `<li><a href="${h}" data-close><span>${i + 1}</span>${t}</a></li>`).join('')}</ol>
    <p class="fine">A két nézet ugyanazt az árállapotot használja. A felső sávban bármikor válthat, és a „Demóadatok visszaállítása” gombbal tiszta lappal kezdhet.</p></div>`, { label: 'Bemutató forgatókönyv' });
}

/* --- fejléc árnyék görgetéskor --- */
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { document.body.classList.toggle('is-scrolled', scrollY > 8); ticking = false; });
}, { passive: true });

$$('[data-phone]').forEach((a) => { a.href = BUSINESS.phoneHref; a.textContent = a.dataset.phone === 'short' ? 'Hívás' : BUSINESS.phone; });
$('[data-year]').textContent = new Date().getFullYear();

addEventListener('hashchange', route);
route();

// A karikagyuru.com-ról töltődő fotók ellenőrzése: amelyik nem érhető el, az a gyűrű nem jelenik meg.
checkPhotos(store.get().products, () => {
  const { parts } = parse();
  if (photos.missing.size && parts[0] !== 'admin' && (!parts[0] || parts[0] === 'kollekcio')) {
    const y = scrollY; route(); window.scrollTo(0, y);
  }
});
