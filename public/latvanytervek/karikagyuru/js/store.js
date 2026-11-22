/* ==========================================================================
   Közös állapot (vásárlói oldal és kezelőfelület ugyanezt használja).
   Helyi módban a böngészőben (localStorage), szerver módban az api.js-en át
   a szerveren tárolódik (lásd services/karikagyuru-api).
   ========================================================================== */
import { BASE_MATERIALS, BASE_SETTINGS, buildDemoProducts, WORKS_SEED } from './data.js';
import { seedWeights, priceAll, diffPrices, approvalLoss, approvalCheck } from './engine.js';

const KEY = 'karikagyuru-v15';
const clone = (o) => JSON.parse(JSON.stringify(o));
const listeners = new Set();
const fmt = (n) => new Intl.NumberFormat('hu-HU').format(n).replace(/\s/g, ' ');

function fresh() {
  const materials = clone(BASE_MATERIALS);
  const settings = clone(BASE_SETTINGS);
  const products = seedWeights(buildDemoProducts(), materials, settings);
  const now = new Date().toISOString();
  return {
    v: 15,
    materials, settings, products,
    history: [{
      id: uid(), at: now, validFrom: now, by: 'Rendszer', kind: 'start',
      title: 'Kiinduló adatok betöltve – a mostani weboldal katalógusa, árak nélkül',
      before: null, after: clone(materials), count: 0, total: 0,
    }],
    inquiries: [],
    works: JSON.parse(JSON.stringify(WORKS_SEED)),
    clientDecisions: {},    // V5.8 – ügyféljóváhagyási központ (csak admin; alapból minden nyitott)
    lastChange: null,       // { at, old: {id: ár} } – a katalógus „Frissült ár” jelzéséhez
  };
}


function uid() { return Math.random().toString(36).slice(2, 9); }

let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || null; } catch { state = null; }
if (!state || state.v !== 15) state = fresh();
if (!Array.isArray(state.works)) state.works = JSON.parse(JSON.stringify(WORKS_SEED));   // V5.6: korábbi mentésből hiányzik

/** Jóváhagyott gyűrű szakmai változásakor a jóváhagyás (és az érintett opció-jóváhagyás) elvész. */
function revokeIfChanged(before, p) {
  const loss = approvalLoss(before, p);
  if (loss.width && p.opts?.width) p.opts.width.approved = false;
  if (loss.thickness && p.opts?.thickness) p.opts.thickness.approved = false;
  if (loss.product) { p.approved = false; return true; }
  return false;
}

/** Szerver módban az api.js állítja be: mentés, érdeklődés küldése, érdeklődés módosítása. */
let hooks = { save: null, inquiry: null, inquiryUpdate: null };

function persist() {
  let saved = true;
  if (!hooks.save) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { saved = false; /* privát mód vagy betelt tárhely: memóriában marad */ }
  } else hooks.save(state);
  listeners.forEach((fn) => fn(state));
  return saved;
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  product: (id) => state.products.find((p) => p.id === id),

  reset() { state = fresh(); persist(); },
  /** Mentés változtatás nélkül (pl. tesztek előkészítése után). */
  persistNow() { return persist(); },

  /** Adat jóváhagyása (forrás → „jóváhagyott”). kind: 'materials' | 'settings' | 'diamond' | 'product'. */
  approve(kind, key, label, { confirmEstimated = false } = {}) {
    if (kind === 'product') {
      // V5.6: hiányzó kötelező szakmai adattal nem hagyható jóvá; becsült adattal csak kifejezett megerősítéssel.
      const p0 = state.products.find((x) => x.id === key);
      const chk = p0 ? approvalCheck(p0, state.materials, state.settings) : { ok: false, missing: [{ label: 'ismeretlen gyűrű' }], estimated: [] };
      if (!chk.ok) return { ok: false, missing: chk.missing };
      if (chk.estimated.length && !confirmEstimated) return { ok: false, needConfirm: chk.estimated };
      p0.rings.forEach((r) => { r.weightChecked = true; });
    }
    if (kind === 'materials') state.materials.src = { ...(state.materials.src || {}), [key]: 'jovahagyott' };
    if (kind === 'settings') state.settings.src = { ...(state.settings.src || {}), [key]: 'jovahagyott' };
    if (kind === 'diamond') { const d = state.materials.diamonds.find((x) => x.id === key); if (d) d.src = 'jovahagyott'; }
    if (kind === 'product') { const p = state.products.find((x) => x.id === key); if (p) { p.approved = true; p.rings.forEach((r) => r.stoneRule && (r.stoneRule.demo = false)); } }
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'approve', title: `Jóváhagyva: ${label || key}`, count: 0, total: 0 });
    persist();
    return { ok: true };
  },

  /** Gyűrű jóváhagyásának visszavonása: a vásárló ennél a gyűrűnél újra csak egyedi ajánlatot kér. */
  unapprove(id, label) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    p.approved = false;
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'approve', title: label || `Jóváhagyás visszavonva: ${p.code}`, count: 0, total: 0 });
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

  /**
   * Gyűrű módosítása. Ha egy JÓVÁHAGYOTT gyűrű szakmai adata változik (ár, tömeg, méret, vastagság,
   * kőszabály, választható szélesség stb.), a jóváhagyás automatikusan visszavonódik – újra jóvá kell hagyni.
   * Fotócsere és szöveges módosítás nem érinti. Visszatér: { revoked: bool }.
   */
  updateProduct(id, mutate, title) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return { revoked: false };
    const before = JSON.parse(JSON.stringify(p));
    const old = priceAll([p], state.materials, state.settings)[id];
    mutate(p);
    const revoked = revokeIfChanged(before, p);
    // V5.6: a szerkesztőből sem adható jóváhagyás hiányzó kötelező szakmai adattal.
    let blocked = null;
    if (p.approved && !before.approved) {
      const chk = approvalCheck(p, state.materials, state.settings);
      if (!chk.ok) { p.approved = false; blocked = chk.missing; } else p.rings.forEach((r) => { r.weightChecked = true; });
    }
    const now = priceAll([p], state.materials, state.settings)[id];
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at,
      by: 'Tulajdonos', kind: 'product', title: title || `${p.code} adatai módosítva`,
      count: old !== now ? 1 : 0, total: old !== undefined && now !== undefined ? now - old : 0, oldPrice: old ?? null, newPrice: now ?? null });
    if (revoked) state.history.unshift({ id: uid(), at, validFrom: at, by: 'Rendszer', kind: 'approve', title: `Jóváhagyás automatikusan visszavonva: ${p.code} – módosultak a szakmai adatai`, count: 0, total: 0 });
    persist();
    return { revoked, blocked };
  },

  /** Több gyűrű egyszerre (pl. munkadíj stílusonként) – egy naplóbejegyzés. */
  updateMany(ids, mutate, title) {
    const set = state.products.filter((p) => ids.includes(p.id));
    const old = priceAll(set, state.materials, state.settings);
    const befores = Object.fromEntries(set.map((p) => [p.id, JSON.parse(JSON.stringify(p))]));
    set.forEach(mutate);
    const revoked = set.filter((p) => revokeIfChanged(befores[p.id], p));
    const now = priceAll(set, state.materials, state.settings);
    const changed = set.filter((p) => old[p.id] !== now[p.id]);
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'product', title,
      count: changed.length, total: changed.reduce((a, p) => a + now[p.id] - old[p.id], 0) });
    if (changed.length) state.lastChange = { at, old: { ...priceAll(state.products, state.materials, state.settings), ...old } };
    if (revoked.length) state.history.unshift({ id: uid(), at, validFrom: at, by: 'Rendszer', kind: 'approve', title: `Jóváhagyás automatikusan visszavonva ${revoked.length} gyűrűnél – módosultak a szakmai adataik: ${revoked.map((p) => p.code).join(', ')}`, count: 0, total: 0 });
    persist();
    this.lastRevoked = revoked.length;
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
  /** V5.6 – egyedi műhelymunka mentése (új vagy meglévő). Nem termék: nincs ára, cikkszáma, nem rendelhető újra. */
  saveWork(w) {
    if (!Array.isArray(state.works)) state.works = [];
    const i = state.works.findIndex((x) => x.id === w.id);
    const at = new Date().toISOString();
    if (i >= 0) state.works[i] = w; else state.works.push(w);
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'product', title: `Műhelymunka ${i >= 0 ? 'módosítva' : 'felvéve'}: ${w.title}`, count: 0, total: 0 });
    return persist();
  },
  deleteWork(id) {
    const w = (state.works || []).find((x) => x.id === id); if (!w) return;
    state.works = state.works.filter((x) => x.id !== id);
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'product', title: `Műhelymunka törölve: ${w.title}`, count: 0, total: 0 });
    persist();
  },

  /** V5.8 – ügyféldöntés rögzítése a jóváhagyási központban. NEM módosít árat, terméket vagy jogi szöveget.
      „Átvezetve” csak rögzített válasz után, külön megerősítéssel jelölhető. Visszaad: { ok, error?, saved? }. */
  saveDecision(id, { status, answer = '' }) {
    if (!/^[a-z0-9-]{1,40}$/.test(id)) return { ok: false, error: 'Ismeretlen tétel.' };
    if (!['nyitott', 'valasz', 'atvezetve'].includes(status)) return { ok: false, error: 'Ismeretlen állapot.' };
    const text = String(answer).trim().slice(0, 2000);
    if (status !== 'nyitott' && !text) return { ok: false, error: 'Előbb írja be az ügyfél válaszát.' };
    // a szerver (PHP) az üres objektumot üres tömbként adja vissza – tömbre írt kulcs a mentésből kimaradna
    if (!state.clientDecisions || typeof state.clientDecisions !== 'object' || Array.isArray(state.clientDecisions)) state.clientDecisions = { ...(state.clientDecisions || {}) };
    const prev = state.clientDecisions[id] || { status: 'nyitott', answer: '' };
    if (status === 'atvezetve' && prev.status === 'nyitott') return { ok: false, error: 'Előbb mentse a választ, és vezesse át a megfelelő menüpontban.' };
    const at = new Date().toISOString();
    state.clientDecisions[id] = { status, answer: text, at };
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'decision', title: `Ügyféldöntés (${id}): ${status === 'nyitott' ? 'visszaállítva nyitottra' : status === 'valasz' ? 'válasz rögzítve' : 'átvezetve'}`, count: 0, total: 0 });
    return { ok: true, saved: persist() };
  },

  addProduct(p) {
    if (p.approved && !approvalCheck(p, state.materials, state.settings).ok) p.approved = false;   // V5.6: hiányos adattal nem
    state.products.push(p);
    const at = new Date().toISOString();
    state.history.unshift({ id: uid(), at, validFrom: at, by: 'Tulajdonos', kind: 'product', title: `Új gyűrű felvéve: ${p.code}`, count: 0, total: 0 });
    return persist();
  },

  /** Helyi módban a böngészőbe ír; szerver módban elküldi. Promise-t ad vissza: { ok, error }. */
  addInquiry(inq, files = []) {
    if (hooks.inquiry) return hooks.inquiry(inq, files);
    state.inquiries.unshift({ id: uid(), at: new Date().toISOString(), status: 'uj', ...inq });
    if (!persist()) { state.inquiries.shift(); return Promise.resolve({ ok: false, error: 'Az érdeklődést nem sikerült rögzíteni.' }); }
    return Promise.resolve({ ok: true });
  },

  updateInquiry(id, patch) {
    const q = state.inquiries.find((x) => x.id === id);
    if (!q) return;
    Object.assign(q, patch);
    if (hooks.inquiryUpdate) { hooks.inquiryUpdate(id, patch); listeners.forEach((fn) => fn(state)); }
    else persist();
  },

  /* --- szerver mód --- */
  setHooks(h) { hooks = { ...hooks, ...h }; },
  /** A szerveren mentett állapot betöltése (érdeklődések nélkül – azok külön jönnek). */
  load(remote) {
    if (!remote || !Array.isArray(remote.products)) return;
    state = { ...fresh(), ...remote, v: 15, inquiries: state.inquiries || [] };
    if (!remote.public) delete state.public;
    else state.history = [];   // a nyilvános nézetben nincs árnapló
    if (!Array.isArray(state.history)) state.history = [];
    listeners.forEach((fn) => fn(state));
  },
  /** Szerver mód, még nincs mentett változat: a beépített kiinduló adatok (a böngésző régi helyi adata nem számít). */
  loadFresh() { const inq = state.inquiries || []; state = fresh(); state.inquiries = inq; listeners.forEach((fn) => fn(state)); },
  setInquiries(list) { state.inquiries = list; listeners.forEach((fn) => fn(state)); },

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
