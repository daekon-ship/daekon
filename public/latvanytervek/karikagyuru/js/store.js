/* ==========================================================================
   Közös bemutató-állapot (vásárlói és admin nézet ugyanezt használja).
   Csak ebben a böngészőben tárolódik (localStorage) – NEM éles adatbázis.
   Az éles rendszerben szerveroldali adatbázis és jogosultságkezelés lesz.
   ========================================================================== */
import { DEMO_MATERIALS, DEMO_SETTINGS, buildDemoProducts } from './data.js';
import { seedWeights, priceAll, diffPrices } from './engine.js';

const KEY = 'karikagyuru-demo-v3';
const clone = (o) => JSON.parse(JSON.stringify(o));
const listeners = new Set();
const fmt = (n) => new Intl.NumberFormat('hu-HU').format(n).replace(/\s/g, ' ');

function fresh() {
  const materials = clone(DEMO_MATERIALS);
  const settings = clone(DEMO_SETTINGS);
  const products = seedWeights(buildDemoProducts(), materials, settings);
  const now = new Date().toISOString();
  return {
    v: 3,
    materials, settings, products,
    history: [{
      id: uid(), at: now, validFrom: now, by: 'Rendszer (demó)', kind: 'start',
      title: 'Bemutató indítása – kezdő demó alapanyagárak',
      before: null, after: clone(materials), count: 0, total: 0,
    }, ...demoGoldHistory(materials, products, settings)],
    inquiries: [],
    lastChange: null,       // { at, old: {id: ár} } – a katalógus „Frissült ár” jelzéséhez
  };
}

/**
 * Kitalált, egyértelműen jelölt korábbi aranyár-változások, hogy a grafikon és
 * a napló ne legyen üres a bemutatón. Nem valós piaci adatok.
 */
function demoGoldHistory(M, products, S) {
  const steps = [[160, 35400], [112, 36300], [71, 37100], [34, 38200]];
  const out = [];
  for (let i = 0; i < steps.length; i++) {
    const [daysAgo, from] = steps[i];
    const to = i + 1 < steps.length ? steps[i + 1][1] : M.gold24;
    const before = { ...clone(M), gold24: from }, after = { ...clone(M), gold24: to };
    const d = diffPrices(products, before, after, S);
    const at = new Date(Date.now() - daysAgo * 864e5).toISOString();
    out.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos (demó előzmény)', kind: 'materials',
      title: `24K színarany: ${fmt(from)} → ${fmt(to)} Ft/g`, before, after, count: d.count, total: d.total, demo: true });
  }
  return out;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || null; } catch { state = null; }
if (!state || state.v !== 3) state = fresh();

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

  /** Több gyűrű egyszerre (pl. munkadíj stílusonként) – egy naplóbejegyzés. */
  updateMany(ids, mutate, title) {
    const set = state.products.filter((p) => ids.includes(p.id));
    const old = priceAll(set, state.materials, state.settings);
    set.forEach(mutate);
    const now = priceAll(set, state.materials, state.settings);
    const changed = set.filter((p) => old[p.id] !== now[p.id]);
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos (demó)', kind: 'product', title,
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
