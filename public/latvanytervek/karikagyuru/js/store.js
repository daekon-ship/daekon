/* ==========================================================================
   Közös bemutató-állapot (vásárlói és admin nézet ugyanezt használja).
   Csak ebben a böngészőben tárolódik (localStorage) – NEM éles adatbázis.
   Az éles rendszerben szerveroldali adatbázis és jogosultságkezelés lesz.
   ========================================================================== */
import { DEMO_MATERIALS, DEMO_SETTINGS, buildDemoProducts } from './data.js';
import { seedWeights, priceAll, diffPrices } from './engine.js';

const KEY = 'karikagyuru-demo-v14';
const clone = (o) => JSON.parse(JSON.stringify(o));
const listeners = new Set();
const fmt = (n) => new Intl.NumberFormat('hu-HU').format(n).replace(/\s/g, ' ');

function fresh() {
  const materials = clone(DEMO_MATERIALS);
  const settings = clone(DEMO_SETTINGS);
  const products = seedWeights(buildDemoProducts(), materials, settings);
  const now = new Date().toISOString();
  return {
    v: 14,
    materials, settings, products,
    history: [{
      id: uid(), at: now, validFrom: now, by: 'Rendszer', kind: 'start',
      title: 'Kiinduló árak betöltve – a mostani weboldal és az ötvös jegyzete alapján',
      before: null, after: clone(materials), count: 0, total: 0,
    }],
    inquiries: [],
    lastChange: null,       // { at, old: {id: ár} } – a katalógus „Frissült ár” jelzéséhez
  };
}


function uid() { return Math.random().toString(36).slice(2, 9); }

let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || null; } catch { state = null; }
if (!state || state.v !== 13) state = fresh();

function persist() {
  let saved = true;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { saved = false; /* privát mód vagy betelt tárhely: memóriában marad */ }
  listeners.forEach((fn) => fn(state));
  return saved;
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  product: (id) => state.products.find((p) => p.id === id),

  reset() { state = fresh(); persist(); },

  /** Adat jóváhagyása (forrás → „jóváhagyott”). kind: 'materials' | 'settings' | 'diamond' | 'product'. */
  approve(kind, key, label) {
    if (kind === 'materials') state.materials.src = { ...(state.materials.src || {}), [key]: 'jovahagyott' };
    if (kind === 'settings') state.settings.src = { ...(state.settings.src || {}), [key]: 'jovahagyott' };
    if (kind === 'diamond') { const d = state.materials.diamonds.find((x) => x.id === key); if (d) d.src = 'jovahagyott'; }
    if (kind === 'product') { const p = state.products.find((x) => x.id === key); if (p) { p.approved = true; p.rings.forEach((r) => r.stoneRule && (r.stoneRule.demo = false)); } }
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'approve', title: `Jóváhagyva: ${label || key}`, count: 0, total: 0 });
    persist();
  },

  /** Új alapanyagárak véglegesítése (csak jóváhagyás után hívjuk). */
  applyMaterials(next, { validFrom, note } = {}) {
    const before = clone(state.materials);
    const d = diffPrices(state.products, before, next, state.settings);
    const oldPrices = priceAll(state.products, before, state.settings);
    state.materials = clone(next);
    const at = new Date().toISOString();
    state.history.unshift({
      id: uid(), at, validFrom: validFrom || at, by: 'Tulajdonos', kind: 'materials',
      title: note || describeMaterialChange(before, next),
      before, after: clone(next), count: d.count, total: d.total,
    });
    state.lastChange = { at, old: oldPrices };
    persist();
    return d;
  },

  /** Egy korábbi bejegyzés előtti árak visszaállítása – maga is naplózódik. */
  revert(entryId) {
    const e = state.history.find((h) => h.id === entryId);
    if (!e || !e.before) return null;
    return this.applyMaterials(e.before, { note: `Visszaállítás: „${e.title}” előtti árak` });
  },

  updateSettings(next, title) {
    const old = priceAll(state.products, state.materials, state.settings);
    const before = clone(state.settings);
    const src = { ...(state.settings.src || {}) };
    // a tulajdonos által átírt érték jóváhagyottá válik – kivéve a kerekítést: az az ügyfél kifejezett jóváhagyásáig demó marad
    for (const k of Object.keys(next)) if (k !== 'src' && k !== 'roundTo' && JSON.stringify(next[k]) !== JSON.stringify(state.settings[k])) src[k] = 'jovahagyott';
    state.settings = { ...state.settings, ...next, src };
    const now = priceAll(state.products, state.materials, state.settings);
    const count = Object.keys(now).filter((k) => now[k] !== old[k]).length;
    state.history.unshift({ id: uid(), at: new Date().toISOString(), validFrom: new Date().toISOString(),
      by: 'Tulajdonos', kind: 'settings', title: title || 'Árképlet-beállítás módosítva',
      settingsBefore: before, settingsAfter: clone(state.settings), count, total: 0 });
    if (count) state.lastChange = { at: new Date().toISOString(), old };
    persist();
  },

  updateProduct(id, mutate, title) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    const old = priceAll([p], state.materials, state.settings)[id];
    mutate(p);
    const now = priceAll([p], state.materials, state.settings)[id];
    state.history.unshift({ id: uid(), at: new Date().toISOString(), validFrom: new Date().toISOString(),
      by: 'Tulajdonos', kind: 'product', title: title || `${p.code} adatai módosítva`,
      count: old !== now ? 1 : 0, total: old !== undefined && now !== undefined ? now - old : 0, oldPrice: old ?? null, newPrice: now ?? null });
    persist();
  },

  /** Több gyűrű egyszerre (pl. munkadíj stílusonként) – egy naplóbejegyzés. */
  updateMany(ids, mutate, title) {
    const set = state.products.filter((p) => ids.includes(p.id));
    const old = priceAll(set, state.materials, state.settings);
    set.forEach(mutate);
    const now = priceAll(set, state.materials, state.settings);
    const changed = set.filter((p) => old[p.id] !== now[p.id]);
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'product', title,
      count: changed.length, total: changed.reduce((a, p) => a + now[p.id] - old[p.id], 0) });
    if (changed.length) state.lastChange = { at, old: { ...priceAll(state.products, state.materials, state.settings), ...old } };
    persist();
    return changed.length;
  },

  /** Aranyár-idősor a grafikonhoz (régi → új). */
  goldSeries() {
    const pts = state.history.filter((h) => h.kind === 'materials' && h.before && h.after)
      .map((h) => ({ at: h.validFrom || h.at, v: h.after.gold24, from: h.before.gold24 })).reverse();
    const series = [];
    if (pts.length) series.push({ at: new Date(new Date(pts[0].at).getTime() - 30 * 864e5).toISOString(), v: pts[0].from });
    pts.forEach((x) => series.push({ at: x.at, v: x.v }));
    if (!series.length || series[series.length - 1].v !== state.materials.gold24) series.push({ at: new Date().toISOString(), v: state.materials.gold24 });
    return series;
  },

  /** Új gyűrű felvitele (demó: csak ebben a böngészőben tárolódik). Visszaadja, sikerült-e tartósan menteni. */
  addProduct(p) {
    state.products.push(p);
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'product', title: `Új gyűrű felvéve: ${p.code}`, count: 0, total: 0 });
    return persist();
  },

  addInquiry(inq) {
    state.inquiries.unshift({ id: uid(), at: new Date().toISOString(), status: 'uj', ...inq });
    persist();
  },

  updateInquiry(id, patch) {
    const q = state.inquiries.find((x) => x.id === id);
    if (q) { Object.assign(q, patch); persist(); }
  },

  silentSave: persist,
};

function describeMaterialChange(a, b) {
  const out = [];
  const f = (v) => (v == null ? 'nincs ár' : fmt(v));
  const one = (label, x, y, unit) => { if (x !== y) out.push(`${label}: ${f(x)} → ${f(y)} ${unit}`); };
  one('24K színarany', a.gold24, b.gold24, 'Ft/g');
  one('Platina', a.platinum, b.platinum, 'Ft/g');
  one('Palládium', a.palladium, b.palladium, 'Ft/g');
  one('Titán', a.titanium, b.titanium, 'Ft/g');
  one('Ötvözőanyag', a.alloyAll, b.alloyAll, 'Ft/g');
  const SP = { au14: '14K', au18: '18K', pt: 'platina', pd: 'palládium', ti: 'titán' };
  for (const k of Object.keys({ ...(a.sellPerGram || {}), ...(b.sellPerGram || {}) })) one(`Grammár (${SP[k] || k})`, a.sellPerGram?.[k], b.sellPerGram?.[k], 'Ft/g');
  (a.diamonds || []).forEach((d, i) => { const n = (b.diamonds || [])[i]; if (n) one(d.name, d.price, n.price, 'Ft/db'); });
  return out.join(' · ') || 'Alapanyagárak (változás nélkül)';
}
