/* ==========================================================================
   Közös bemutató-állapot (vásárlói és admin nézet ugyanezt használja).
   Csak ebben a böngészőben tárolódik (localStorage) – NEM éles adatbázis.
   Az éles rendszerben szerveroldali adatbázis és jogosultságkezelés lesz.
   ========================================================================== */
import { DEMO_MATERIALS, DEMO_SETTINGS, buildDemoProducts } from './data.js';
import { seedWeights, priceAll, diffPrices } from './engine.js';

const KEY = 'karikagyuru-demo-v1';
const clone = (o) => JSON.parse(JSON.stringify(o));
const listeners = new Set();

function fresh() {
  const materials = clone(DEMO_MATERIALS);
  const settings = clone(DEMO_SETTINGS);
  const products = seedWeights(buildDemoProducts(), materials, settings);
  const now = new Date().toISOString();
  return {
    v: 1,
    materials, settings, products,
    history: [{
      id: uid(), at: now, validFrom: now, by: 'Rendszer (demó)', kind: 'start',
      title: 'Kezdő demó alapanyagárak beállítva',
      before: null, after: clone(materials), count: 0, total: 0,
    }],
    inquiries: [],
    lastChange: null,       // { at, old: {id: ár} } – a katalógus „Frissült ár” jelzéséhez
  };
}

function uid() { return Math.random().toString(36).slice(2, 9); }

let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || null; } catch { state = null; }
if (!state || state.v !== 1) state = fresh();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* privát mód: memóriában marad */ }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  product: (id) => state.products.find((p) => p.id === id),

  reset() { state = fresh(); persist(); },

  /** Új alapanyagárak véglegesítése (csak jóváhagyás után hívjuk). */
  applyMaterials(next, { validFrom, note } = {}) {
    const before = clone(state.materials);
    const d = diffPrices(state.products, before, next, state.settings);
    const oldPrices = priceAll(state.products, before, state.settings);
    state.materials = clone(next);
    const at = new Date().toISOString();
    state.history.unshift({
      id: uid(), at, validFrom: validFrom || at, by: 'Tulajdonos (demó)', kind: 'materials',
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
    state.settings = { ...state.settings, ...next };
    const now = priceAll(state.products, state.materials, state.settings);
    const count = Object.keys(now).filter((k) => now[k] !== old[k]).length;
    state.history.unshift({ id: uid(), at: new Date().toISOString(), validFrom: new Date().toISOString(),
      by: 'Tulajdonos (demó)', kind: 'settings', title: title || 'Árképlet-beállítás módosítva',
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
      by: 'Tulajdonos (demó)', kind: 'product', title: title || `${p.code} adatai módosítva`,
      count: old !== now ? 1 : 0, total: now - old, oldPrice: old, newPrice: now });
    persist();
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
  if (a.gold24 !== b.gold24) out.push(`24K színarany: ${fmt(a.gold24)} → ${fmt(b.gold24)} Ft/g`);
  if (a.silver !== b.silver) out.push(`Ezüst: ${fmt(a.silver)} → ${fmt(b.silver)} Ft/g`);
  for (const k of Object.keys(a.alloy)) if (a.alloy[k] !== b.alloy[k]) out.push(`Ötvözet (${k}): ${fmt(a.alloy[k])} → ${fmt(b.alloy[k])} Ft/g`);
  a.diamonds.forEach((d, i) => { const n = b.diamonds[i]; if (n && n.price !== d.price) out.push(`${d.name}: ${fmt(d.price)} → ${fmt(n.price)} Ft/db`); });
  return out.join(' · ') || 'Alapanyagárak (változás nélkül)';
}
const fmt = (n) => new Intl.NumberFormat('hu-HU').format(n).replace(/\s/g, ' ');
