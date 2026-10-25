/* ==========================================================================
   BB core — demó adattár + foglalási motor
   --------------------------------------------------------------------------
   FONTOS: ez BEMUTATÓ. Az adatok csak ebben a böngészőben (localStorage)
   élnek, nincs központi adatbázis, nincs e-mail, nincs éles foglalás.
   Az éles rendszerben ugyanezt a logikát szerveroldalon, tranzakcióban
   (atomi ütközésvizsgálattal) kell futtatni — lásd ATADAS.md.
   ========================================================================== */
(function () {
  'use strict';
  var CFG = window.BB_CONFIG;
  var KEY = 'bb-demo-v1';
  var mem = null; /* tartalék, ha a localStorage nem elérhető */

  /* ---------- idő segédek (helyi idő; élesben Europe/Budapest a szerveren) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(hhmm) { if (!hhmm) return null; var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function fromMin(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }
  function today() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function nowMin() { var n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

  var HU_MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var HU_DAYS = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  var HU_DAYS_SHORT = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];
  function fmtDate(s, opts) {
    var d = typeof s === 'string' ? parseIso(s) : s;
    var str = d.getFullYear() + '. ' + HU_MONTHS[d.getMonth()] + ' ' + d.getDate() + '.';
    if (opts && opts.weekday) str += ', ' + HU_DAYS[d.getDay()];
    return str;
  }
  function fmtShort(s) { var d = typeof s === 'string' ? parseIso(s) : s; return HU_MONTHS[d.getMonth()].slice(0, 3) + '. ' + d.getDate() + '.'; }
  function fmtFt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; }
  function fmtPrice(s) {
    if (s.price == null) return 'Egyeztetés alapján';
    if (s.priceMax) return fmtFt(s.price).replace(' Ft', '') + '–' + fmtFt(s.priceMax);
    return fmtFt(s.price);
  }
  function fmtMins(m) { return m == null ? 'Egyeztetés szerint' : m + ' perc'; }

  /* ---------- determinisztikus „véletlen" a mintafoglalásokhoz ---------- */
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function newId() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = 'BB-';
    for (var i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }

  /* ---------- tárolás ---------- */
  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (raw) { try { return JSON.parse(raw); } catch (e) { /* sérült → újra */ } }
    return mem;
  }
  function save(db) {
    mem = db;
    try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* csak memóriában */ }
    try { window.dispatchEvent(new CustomEvent('bb:change')); } catch (e) { }
  }

  var GUESTS = [
    ['Minta Anna', 'minta.anna@pelda.hu', '+36 30 000 0101'],
    ['Példa Katalin', 'pelda.katalin@pelda.hu', '+36 20 000 0102'],
    ['Teszt Gábor', 'teszt.gabor@pelda.hu', '+36 70 000 0103'],
    ['Minta Éva', 'minta.eva@pelda.hu', '+36 30 000 0104'],
    ['Próba Júlia', 'proba.julia@pelda.hu', '+36 20 000 0105'],
    ['Példa Zsófia', 'pelda.zsofia@pelda.hu', '+36 70 000 0106'],
    ['Teszt Márta', 'teszt.marta@pelda.hu', '+36 30 000 0107'],
    ['Minta Péter', 'minta.peter@pelda.hu', '+36 20 000 0108']
  ];

  function freshDb() {
    return {
      version: 1,
      seededAt: new Date().toISOString(),
      bookings: [],
      serviceOverrides: {},
      schedule: null,     /* null = config szerinti */
      closures: [],       /* {id, from, to, type:'lezaras'|'szabadsag', note} */
      extraBreaks: [],    /* {id, date, start, end, note} */
      location: null,     /* null = config szerinti */
      notifications: []
    };
  }

  /* Mintafoglalások: −10 … +24 nap, hogy a naptárban legyen mit látni. */
  function seed(db) {
    var t = today();
    /* egy bemutató szabadság ~2 hét múlva */
    var vac = addDays(t, 13);
    while (!baseDay(vac.getDay())) vac = addDays(vac, 1);
    db.closures.push({ id: 'c-seed', from: iso(vac), to: iso(addDays(vac, 1)), type: 'szabadsag', note: 'Szabadság (bemutató)' });

    for (var off = -10; off <= 24; off++) {
      var d = addDays(t, off), ds = iso(d);
      if (!baseDay(d.getDay())) continue;
      if (isClosedRaw(db, ds)) continue;
      var r = rng(hash(ds)), count = 2 + Math.floor(r() * 3);
      /* telített nap a jövő héten, hogy a „betelt" állapot is látszódjon */
      if (off === 6 || off === 7) count = 9;
      var tries = 0;
      while (count > 0 && tries < 40) {
        tries++;
        var svc = activeServices(db).filter(function (s) { return s.bookable; });
        var s = svc[Math.floor(r() * svc.length)];
        var slots = computeSlots(db, ds, s.id, { ignoreLead: true, ignorePast: true });
        if (!slots.length) continue;
        var start = slots[Math.floor(r() * slots.length)];
        var g = GUESTS[Math.floor(r() * GUESTS.length)];
        db.bookings.push({
          id: 'BB-' + (hash(ds + tries).toString(36).toUpperCase() + 'XXXXXX').slice(0, 6),
          serviceId: s.id, date: ds, start: start, mins: s.mins, price: s.price, priceMax: s.priceMax || null,
          name: g[0], email: g[1], phone: g[2], note: '', marketing: false,
          status: off < 0 ? 'completed' : 'confirmed', source: 'seed', createdAt: new Date().toISOString()
        });
        count--;
      }
    }
    db.notifications.push(
      { id: 'n-s1', type: 'failed', text: 'Emlékeztető nem ment ki: Teszt Márta (hibás e-mail-cím) — szimulált hiba', at: new Date(Date.now() - 36e5 * 5).toISOString() },
      { id: 'n-s2', type: 'reminder', text: 'Holnapi emlékeztetők előkészítve (szimulált, nem kerültek kiküldésre)', at: new Date(Date.now() - 36e5 * 2).toISOString() }
    );
  }

  function db() {
    var d = load();
    if (!d || d.version !== 1) { d = freshDb(); seed(d); save(d); }
    return d;
  }

  /* ---------- összefésült beállítások ---------- */
  function services(d) {
    d = d || db();
    return CFG.services.map(function (s) {
      var o = d.serviceOverrides[s.id] || {};
      var m = {}; for (var k in s) m[k] = s[k]; for (var j in o) m[j] = o[j];
      return m;
    });
  }
  function activeServices(d) { return services(d).filter(function (s) { return s.active; }); }
  function service(id, d) { return services(d).filter(function (s) { return s.id === id; })[0] || null; }
  function schedule(d) { d = d || db(); return d.schedule || CFG.schedule; }
  function baseDay(wd, d) { var sc = d ? schedule(d) : CFG.schedule; return sc.days[wd] || null; }
  function location(d) {
    d = d || load() || {};
    var key = d.location || CFG.activeLocation;
    var loc = CFG.locations[key]; var out = { key: key };
    for (var k in loc) out[k] = loc[k];
    out.confirmed = CFG.addressConfirmed;
    return out;
  }

  function isClosedRaw(d, ds) {
    return d.closures.filter(function (c) { return ds >= c.from && ds <= c.to; })[0] || null;
  }

  /* Egy nap munkaideje, szünetekkel. null = zárva. */
  function dayPlan(d, ds) {
    var c = isClosedRaw(d, ds);
    if (c) return { closed: true, reason: c.type === 'szabadsag' ? 'Szabadság' : 'Lezárt nap', closure: c };
    var day = baseDay(parseIso(ds).getDay(), d);
    if (!day) return { closed: true, reason: 'Zárva' };
    var breaks = [];
    if (day.breakStart && day.breakEnd) breaks.push({ start: toMin(day.breakStart), end: toMin(day.breakEnd), note: 'Ebédszünet' });
    d.extraBreaks.forEach(function (b) { if (b.date === ds) breaks.push({ start: toMin(b.start), end: toMin(b.end), note: b.note || 'Szünet', id: b.id }); });
    return { closed: false, open: toMin(day.open), close: toMin(day.close), breaks: breaks };
  }

  function bookingsOn(d, ds, excludeId) {
    return d.bookings.filter(function (b) {
      return b.date === ds && b.status !== 'cancelled' && b.id !== excludeId;
    });
  }

  /* Szabad kezdési időpontok egy szolgáltatásra.
     Ütközik, ha [s, e + pufferC) metszi [bs, be + pufferB)-t, ha szünetbe lóg,
     ha a zárás után ér véget, vagy ha túl közel van a jelenhez. */
  function computeSlots(d, ds, serviceId, opt) {
    opt = opt || {};
    var s = service(serviceId, d); if (!s || s.mins == null) return [];
    var plan = dayPlan(d, ds); if (plan.closed) return [];
    var sc = schedule(d), step = sc.slotStep || 30;
    var t0 = today(), dd = parseIso(ds);
    if (!opt.ignorePast && dd < t0) return [];
    var minStart = -1;
    if (!opt.ignoreLead && iso(dd) === iso(t0)) minStart = nowMin() + (sc.leadMinutes || 0);
    else if (!opt.ignoreLead && sc.leadMinutes > 24 * 60) { /* hosszú előfutás kezelése */ }
    var taken = bookingsOn(d, ds, opt.excludeId).map(function (b) {
      var bs = service(b.serviceId, d); var buf = bs ? bs.buffer : 15;
      var st = toMin(b.start); return { start: st, end: st + b.mins + buf };
    });
    var out = [];
    for (var m = plan.open; m + s.mins <= plan.close; m += step) {
      if (m < minStart) continue;
      var e = m + s.mins, eb = e + (s.buffer || 0);
      var clash = taken.some(function (t) { return m < t.end && t.start < eb; }) ||
                  plan.breaks.some(function (b) { return m < b.end && b.start < e; });
      if (!clash) out.push(fromMin(m));
    }
    return out;
  }

  /* Nap állapota a naptárhoz egy adott szolgáltatásra. */
  function dayStatus(d, ds, serviceId, opt) {
    var t0 = today(), dd = parseIso(ds), sc = schedule(d);
    if (dd < t0) return { state: 'past', label: 'Elmúlt nap' };
    if (dd > addDays(t0, sc.horizonDays)) return { state: 'out', label: 'Még nem foglalható' };
    var plan = dayPlan(d, ds);
    if (plan.closed) return { state: 'closed', label: plan.reason };
    var n = computeSlots(d, ds, serviceId, opt).length;
    if (!n) return { state: 'full', label: 'Betelt' };
    if (n <= 2) return { state: 'few', label: 'Kevés szabad időpont', count: n };
    return { state: 'open', label: 'Van szabad időpont', count: n };
  }

  function nextAvailable(d, serviceId, fromIso, opt) {
    var start = fromIso ? parseIso(fromIso) : today();
    for (var i = 0; i < schedule(d).horizonDays + 1; i++) {
      var ds = iso(addDays(start, i));
      var st = dayStatus(d, ds, serviceId, opt);
      if (st.state === 'open' || st.state === 'few') return ds;
    }
    return null;
  }

  function notify(d, type, text) {
    d.notifications.unshift({ id: 'n-' + Date.now() + Math.floor(Math.random() * 999), type: type, text: text, at: new Date().toISOString() });
    if (d.notifications.length > 60) d.notifications.length = 60;
  }

  /* „Atomi" foglalás a demóban: írás előtt újraellenőrzi a szabad helyet. */
  function createBooking(input, opt) {
    opt = opt || {};
    var d = db();
    var s = service(input.serviceId, d);
    if (!s || !s.bookable || !s.active) return { ok: false, error: 'A kezelés jelenleg nem foglalható online.' };
    var slots = computeSlots(d, input.date, s.id, { ignoreLead: !!opt.admin, ignorePast: !!opt.admin });
    if (slots.indexOf(input.start) < 0) return { ok: false, error: 'conflict' };
    var b = {
      id: newId(), serviceId: s.id, date: input.date, start: input.start, mins: s.mins,
      price: s.price, priceMax: s.priceMax || null,
      name: input.name, email: input.email || '', phone: input.phone || '', note: input.note || '',
      marketing: !!input.marketing, status: 'confirmed', source: opt.admin ? 'admin' : 'online',
      createdAt: new Date().toISOString()
    };
    d.bookings.push(b);
    notify(d, 'new', 'Új foglalás: ' + b.name + ' — ' + s.name + ', ' + fmtShort(b.date) + ' ' + b.start + (opt.admin ? ' (adminból rögzítve)' : ' — visszaigazoló e-mail szimulálva'));
    save(d);
    return { ok: true, booking: b };
  }

  function updateBooking(id, changes, opt) {
    opt = opt || {};
    var d = db();
    var b = d.bookings.filter(function (x) { return x.id === id; })[0];
    if (!b) return { ok: false, error: 'Nem található foglalás.' };
    var next = {}; for (var k in b) next[k] = b[k]; for (var j in changes) next[j] = changes[j];
    var s = service(next.serviceId, d);
    if (!s) return { ok: false, error: 'Ismeretlen kezelés.' };
    next.mins = s.mins; next.price = s.price; next.priceMax = s.priceMax || null;
    var timeChanged = next.date !== b.date || next.start !== b.start || next.serviceId !== b.serviceId;
    if (timeChanged) {
      var slots = computeSlots(d, next.date, s.id, { excludeId: id, ignoreLead: !!opt.admin, ignorePast: !!opt.admin });
      if (slots.indexOf(next.start) < 0) return { ok: false, error: 'conflict' };
    }
    for (var m in next) b[m] = next[m];
    b.updatedAt = new Date().toISOString();
    notify(d, 'change', 'Módosítás: ' + b.name + ' — ' + s.name + ', új időpont: ' + fmtShort(b.date) + ' ' + b.start + ' (értesítő szimulálva)');
    save(d);
    return { ok: true, booking: b };
  }

  function cancelBooking(id, who) {
    var d = db();
    var b = d.bookings.filter(function (x) { return x.id === id; })[0];
    if (!b) return { ok: false };
    b.status = 'cancelled'; b.cancelledAt = new Date().toISOString();
    var s = service(b.serviceId, d);
    notify(d, 'cancel', 'Lemondás' + (who === 'admin' ? ' (admin)' : ' (vendég)') + ': ' + b.name + ' — ' + (s ? s.name : '') + ', ' + fmtShort(b.date) + ' ' + b.start);
    save(d);
    return { ok: true };
  }

  function getBooking(id) { return db().bookings.filter(function (b) { return b.id === id; })[0] || null; }

  /* „Saját foglalások ezen az eszközön" — csak az online demóban tett foglalások */
  var MINE = 'bb-demo-mine';
  function rememberMine(id) {
    try { var a = JSON.parse(localStorage.getItem(MINE) || '[]'); if (a.indexOf(id) < 0) a.unshift(id); localStorage.setItem(MINE, JSON.stringify(a.slice(0, 20))); } catch (e) { }
  }
  function mine() {
    var ids = []; try { ids = JSON.parse(localStorage.getItem(MINE) || '[]'); } catch (e) { }
    var d = db();
    return ids.map(function (id) { return d.bookings.filter(function (b) { return b.id === id; })[0]; }).filter(Boolean);
  }

  function reset() {
    try { localStorage.removeItem(KEY); localStorage.removeItem(MINE); } catch (e) { }
    mem = null; db();
    try { window.dispatchEvent(new CustomEvent('bb:change')); } catch (e) { }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.BB = {
    cfg: CFG, db: db, save: save, reset: reset,
    services: services, activeServices: activeServices, service: service,
    schedule: schedule, location: location, dayPlan: dayPlan, bookingsOn: bookingsOn,
    slots: function (ds, sid, opt) { return computeSlots(db(), ds, sid, opt); },
    dayStatus: function (ds, sid, opt) { return dayStatus(db(), ds, sid, opt); },
    nextAvailable: function (sid, from, opt) { return nextAvailable(db(), sid, from, opt); },
    createBooking: createBooking, updateBooking: updateBooking, cancelBooking: cancelBooking,
    getBooking: getBooking, rememberMine: rememberMine, mine: mine, notify: notify,
    t: { pad: pad, toMin: toMin, fromMin: fromMin, iso: iso, parseIso: parseIso, addDays: addDays, today: today,
         fmtDate: fmtDate, fmtShort: fmtShort, fmtFt: fmtFt, fmtPrice: fmtPrice, fmtMins: fmtMins,
         MONTHS: HU_MONTHS, DAYS: HU_DAYS, DAYS_SHORT: HU_DAYS_SHORT, esc: esc }
  };
})();
