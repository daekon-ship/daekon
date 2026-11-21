/* ==========================================================================
   Szerveroldali mentés bekötése (services/karikagyuru-api).
   Ha az index.html <meta name="kg-api"> üres (pl. GitHub Pages), minden a
   böngészőben marad, mint eddig. Ha ki van töltve (pl. "api/"), az oldal a
   szerverről tölti az árakat, a kezelőfelület bejelentkezést kér, és minden
   mentés a szerverre megy, változatkezelten.
   ========================================================================== */
import { store } from './store.js';

const BASE = document.querySelector('meta[name="kg-api"]')?.content?.trim() || '';
export const api = { mode: BASE ? 'server' : 'local', online: false, admin: false, csrf: null, version: 0, save: 'idle', savedAt: null, error: '',
  /** Szerver módban, ha nem lehet menteni: 'offline' | 'session' (lejárt belépés) | 'error'. Ilyenkor a kezelőfelület nem szerkeszthető. */
  blocked: null };
const subs = new Set();
const emit = () => subs.forEach((fn) => fn(api));
export const onApi = (fn) => { subs.add(fn); return () => subs.delete(fn); };

async function call(method, path, body, { raw = false } = {}) {
  const headers = {};
  if (body !== undefined && !raw) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && api.csrf) headers['X-CSRF-Token'] = api.csrf;
  let r;
  try { r = await fetch(BASE + path, { method, credentials: 'same-origin', cache: 'no-store', headers, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) }); }
  catch { return { ok: false, status: 0, data: { error: 'Nincs kapcsolat a szerverrel.' } }; }
  let data = {};
  try { data = await r.json(); } catch { /* nem JSON */ }
  return { ok: r.ok, status: r.status, data };
}

/** Indulás: szerver módban betölti a mentett állapotot. Helyi módban azonnal kész. */
export async function initApi() {
  if (api.mode !== 'server') return api;
  // Szerver módban SOHA nem mentünk a böngészőbe: ha a szerver nem érhető el, a mentés és az érdeklődés is hibát ad.
  store.setHooks({ save: scheduleSave, inquiry: sendInquiry, inquiryUpdate: updateInquiry });
  const h = await call('GET', 'health');
  api.online = h.ok && h.data.ok === true;
  const s = api.online ? await call('GET', 'state') : null;
  if (!api.online || !s.ok) {
    api.online = false; api.blocked = 'offline';
    api.error = 'A szerver most nem érhető el. A kezelőfelület ezért nem használható – a módosítások nem menthetők.';
    emit(); return api;
  }
  api.version = s.data.version || 0;
  if (s.data.state) store.load(s.data.state); else store.loadFresh();
  const me = await call('GET', 'me');
  api.admin = !!me.data.admin; api.csrf = me.data.csrf || null;
  emit();
  return api;
}

/** Látogatói oldalon: ha a fül újra előtérbe kerül és legalább egy perce töltöttünk, frissíti az árakat. */
let lastFetch = Date.now();
export async function refreshState() {
  if (api.mode !== 'server' || !api.online || api.admin || Date.now() - lastFetch < 60000) return false;
  lastFetch = Date.now();
  const s = await call('GET', 'state');
  if (s.ok && s.data.state && s.data.version !== api.version) { api.version = s.data.version; store.load(s.data.state); return true; }
  return false;
}

export async function login(password) {
  const r = await call('POST', 'login', { password });
  if (r.ok) {
    api.admin = true; api.csrf = r.data.csrf; api.error = '';
    // A látogató csak a nyilvános (szűkített) nézetet kapta – belépés után MINDIG a teljes állapot töltődik be,
    // különben egy mentés a hiányzó belső adatokat felülírná.
    if (!(await reloadFromServer()) || store.get().public) {
      api.admin = false; api.csrf = null; await call('POST', 'logout', {});
      emit(); return { ok: false, error: 'A teljes adat nem töltődött be a szerverről. Próbálja újra később.' };
    }
    if (api.blocked === 'session') { api.blocked = null; api.save = 'idle'; }
    emit(); return { ok: true };
  }
  return { ok: false, error: r.data.error || 'A belépés nem sikerült.' };
}

export async function logout() {
  await call('POST', 'logout', {});
  api.admin = false; api.csrf = null; emit();
}

/* --- mentés: rövid várakozás után egyben, az utolsó ismert változatra építve --- */
let timer = null, inflight = null, again = false;
function scheduleSave() {
  if (!api.admin || api.blocked || store.get().public) return;
  api.save = 'pending'; emit();
  clearTimeout(timer);
  timer = setTimeout(flush, 350);
}
async function flush() {
  if (inflight) { again = true; return; }
  const st = store.get();
  const state = { ...st }; delete state.inquiries;
  inflight = call('PUT', 'state', { baseVersion: api.version, state, note: (st.history[0] || {}).title || '' });
  const r = await inflight; inflight = null;
  if (r.ok) { api.version = r.data.version; api.save = 'saved'; api.savedAt = new Date(); api.error = ''; }
  else {
    api.save = 'error';
    api.error = r.status === 401 ? 'Lejárt a belépés. A legutóbbi módosítás NEM került mentésre. Lépjen be újra, és végezze el még egyszer.'
      : r.status === 409 ? 'Közben máshol is mentettek. A legutóbbi módosítás NEM került mentésre. Töltse újra az oldalt, és végezze el még egyszer.'
      : r.status === 0 ? 'Megszakadt a kapcsolat a szerverrel. A legutóbbi módosítás NEM került mentésre.'
      : (r.data.error || 'A mentés nem sikerült.') + ' A legutóbbi módosítás NEM került mentésre.';
    if (r.status === 401) { api.admin = false; api.csrf = null; api.blocked = 'session'; }
    else api.blocked = 'error';
    again = false;
    // A képernyőn ne maradjon el nem mentett adat: visszatöltjük, ami ténylegesen a szerveren van.
    await reloadFromServer();
  }
  emit();
  if (again) { again = false; flush(); }
}
async function reloadFromServer() {
  const s = await call('GET', 'state');
  if (s.ok) { api.version = s.data.version || 0; if (s.data.state) store.load(s.data.state); else store.loadFresh(); return true; }
  return false;
}

/** Megvárja, amíg minden függő mentés lefut (pl. kilépés előtt). */
export async function settle() { clearTimeout(timer); if (api.save === 'pending') await flush(); else if (inflight) await inflight; }

/* --- érdeklődések --- */
async function sendInquiry(inq) {
  const r = await call('POST', 'inquiry', inq);
  return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'Az üzenet nem ment el. Kérjük, hívjon telefonon.' };
}
export async function loadInquiries() {
  if (!api.admin) return;
  const r = await call('GET', 'inquiries');
  if (r.ok) store.setInquiries(r.data.inquiries || []);
}
async function updateInquiry(id, patch) {
  const r = await call('POST', 'inquiry-status', { id, ...patch });
  if (!r.ok) { api.error = r.data.error || 'Az érdeklődés állapota nem mentődött.'; emit(); }
  return r.ok;
}

/* --- képfeltöltés: a fájl felmegy, a szerver optimalizált JPEG-et készít belőle (max. 2400 px); az eredeti nem marad meg --- */
export async function uploadPhoto(file) {
  const fd = new FormData(); fd.append('photo', file);
  const r = await call('POST', 'photo', fd, { raw: true });
  if (!r.ok) throw new Error(r.data.error || 'A kép feltöltése nem sikerült.');
  return r.data.url;
}

/* --- e-mail-értesítés (csak admin) --- */
export async function mailStatus() { const r = await call('GET', 'mail-status'); return r.ok ? r.data.mail : null; }
export async function mailTest() { const r = await call('POST', 'mail-test', {}); return r.ok ? { ok: true } : { ok: false, error: r.data.error || 'Ismeretlen hiba.' }; }
