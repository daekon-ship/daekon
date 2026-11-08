/* =========================================================
   LIMIT PIZZA — közös demó-állapot (vevői oldal + konyhai admin)
   Egyetlen forrás, ugyanabban a böngészőben:
     · limitpizza-demo-rendelesek-v1   → rendelések (tömb)
     · limitpizza-demo-beallitasok-v1  → rendelésfogadás, várható idő, elfogyott pizzák/feltétek
   Fülek közötti értesítés: BroadcastChannel (ha van) + „storage” esemény.
   Két külön eszköz között NEM szinkronizál — ahhoz valódi backend kell.
   Semmi nem kerül elküldésre; valódi vendégadat nincs.
   ========================================================= */
(function () {
  'use strict';
  var KEYS = { orders: 'limitpizza-demo-rendelesek-v1', settings: 'limitpizza-demo-beallitasok-v1' };
  var LEGACY_OUT = 'limitpizza-demo-elfogyott-v1';

  var ETA_PRESETS = [
    { id: '30-45', min: 30, max: 45 },
    { id: '45-60', min: 45, max: 60 },
    { id: '60-90', min: 60, max: 90 },
    { id: '90-120', min: 90, max: 120 }
  ];
  var DEFAULTS = { accepting: true, eta: { id: '45-60', min: 45, max: 60 }, soldOut: { pizzas: [], toppings: [] }, rev: 0 };

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }
  var strArr = function (a) { return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }) : []; };
  var int = function (n, lo, hi) { n = Math.round(+n); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };

  /* ---------- beállítások (hibás/sérült adatnál alapértékre áll vissza) ---------- */
  function cleanEta(e) {
    if (!e || typeof e !== 'object') return Object.assign({}, DEFAULTS.eta);
    var p = ETA_PRESETS.find(function (x) { return x.id === e.id; });
    if (p) return { id: p.id, min: p.min, max: p.max };
    var mn = int(e.min, 10, 240), mx = int(e.max, 10, 240);
    if (mn === null || mx === null || mx <= mn) return Object.assign({}, DEFAULTS.eta);
    return { id: 'egyedi', min: mn, max: mx };
  }
  function getSettings() {
    var s = read(KEYS.settings);
    if (!s || typeof s !== 'object') {
      s = JSON.parse(JSON.stringify(DEFAULTS));
      var legacy = read(LEGACY_OUT);                     // korábbi kör „elfogyott” kulcsa → átvétel
      if (legacy) { s.soldOut.pizzas = strArr(legacy); try { localStorage.removeItem(LEGACY_OUT); } catch (e) {} }
      write(KEYS.settings, s);
    }
    return {
      accepting: s.accepting !== false,
      eta: cleanEta(s.eta),
      soldOut: { pizzas: strArr(s.soldOut && s.soldOut.pizzas), toppings: strArr(s.soldOut && s.soldOut.toppings) },
      rev: +s.rev || 0
    };
  }
  function setSettings(patch) {
    var s = getSettings();
    if ('accepting' in patch) s.accepting = !!patch.accepting;
    if ('eta' in patch) s.eta = cleanEta(patch.eta);
    if ('soldOut' in patch) s.soldOut = { pizzas: strArr(patch.soldOut.pizzas), toppings: strArr(patch.soldOut.toppings) };
    s.rev++;
    write(KEYS.settings, s); notify('settings');
    return s;
  }

  /* ---------- rendelések ---------- */
  var STATUSES = ['uj', 'keszul', 'uton', 'kesz', 'elutasitva'];
  function validOrder(o) {
    return o && typeof o === 'object' && isFinite(o.no) && isFinite(o.ts) && STATUSES.indexOf(o.status) > -1 &&
      Array.isArray(o.lines) && o.customer && typeof o.customer === 'object' && isFinite(o.total);
  }
  function getOrders() { var l = read(KEYS.orders); return Array.isArray(l) ? l.filter(validOrder) : []; }
  function setOrders(list) { write(KEYS.orders, list.filter(validOrder)); notify('orders'); }
  function addOrder(o) {
    var list = getOrders();
    o.no = list.reduce(function (m, x) { return Math.max(m, x.no); }, 1040) + 1;
    list.push(o); setOrders(list); return o;
  }
  function updateOrder(no, fn) {
    var list = getOrders(), o = list.find(function (x) { return x.no === no; });
    if (!o) return null;
    fn(o); setOrders(list); return o;
  }

  /* ---------- értesítés más füleknek ---------- */
  var bc = null, subs = [];
  try { bc = new BroadcastChannel('limitpizza-demo'); } catch (e) {}
  function notify(what) { if (bc) try { bc.postMessage(what); } catch (e) {} }
  function emit(what) { subs.forEach(function (fn) { try { fn(what); } catch (e) {} }); }
  /* A „storage” esemény akkor fut, amikor az új érték már olvasható — ez az elsődleges jelzés.
     A BroadcastChannel üzenete megelőzheti a localStorage átvitelét, ezért arra kis késleltetéssel olvasunk újra
     (a megjelenítés idempotens, a dupla jelzés nem okoz gondot). */
  if (bc) bc.onmessage = function (e) { var w = e.data; setTimeout(function () { emit(w); }, 150); };
  window.addEventListener('storage', function (e) {
    if (e.key === KEYS.orders) emit('orders');
    if (e.key === KEYS.settings) emit('settings');
  });

  window.LimitDemo = {
    KEYS: KEYS, ETA_PRESETS: ETA_PRESETS,
    getSettings: getSettings, setSettings: setSettings,
    getOrders: getOrders, setOrders: setOrders, addOrder: addOrder, updateOrder: updateOrder,
    subscribe: function (fn) { subs.push(fn); },
    etaLabel: function (eta) { return eta.min + '–' + eta.max + ' perc'; }
  };
})();
