/* =========================================================
   LIMIT PIZZA — admin (konyha) demó
   Beérkező rendelések állapotokkal, nyomtatás, elfogyott termékek.
   Minden adat csak ebben a böngészőben (localStorage) van;
   a weboldal bemutató-rendelései ide érkeznek.
   ========================================================= */
(function () {
  'use strict';
  var M = window.LIMIT_MENU; if (!M) return;
  var MO = window.Motion || null;
  var CAN_ANIM = !!(MO && MO.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ORDERS_KEY = 'limitpizza-demo-rendelesek-v1';
  var OUT_KEY = 'limitpizza-demo-elfogyott-v1';
  var SEEDED_KEY = 'limitpizza-demo-minta-v1';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ft = function (n) { return n.toLocaleString('hu-HU') + ' Ft'; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); };
  var anim = function (el, kf, o) { if (!CAN_ANIM || !el) return; try { MO.animate(el, kf, Object.assign({ ease: [0.2, 0.7, 0.2, 1] }, o || {})); } catch (e) {} };
  var hhmm = function (ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  var ago = function (ts) { var m = Math.round((Date.now() - ts) / 60000); if (m < 0) return ''; return m < 1 ? 'most' : m < 60 ? m + ' perce' : Math.floor(m / 60) + ' órája'; };

  var COLS = [
    { id: 'uj', name: 'Új', next: 'keszul', act: 'Elfogadom — sütjük' },
    { id: 'keszul', name: 'Készül', next: 'uton', act: 'Futárnak átadva' },
    { id: 'uton', name: 'Úton', next: 'kesz', act: 'Kiszállítva' },
    { id: 'kesz', name: 'Kiszállítva', next: null }
  ];
  var PAY = { kartya: 'Bankkártya a futárnál', szep: 'OTP SZÉP-kártya a futárnál', kp: 'Készpénz' };

  /* ---------- tárolás ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (e) { return []; } }
  function store(list) { try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); } catch (e) {} }
  function outList() { try { return JSON.parse(localStorage.getItem(OUT_KEY) || '[]'); } catch (e) { return []; } }

  /* ---------- minta rendelések (az étlap valódi áraival számolva) ---------- */
  var P = function (id) { return M.pizzas.find(function (p) { return p.id === id; }); };
  var D = function (id) { return M.drinks.find(function (d) { return d.id === id; }); };
  function pline(id, qty, plusz, extra, removed, note) {
    var p = P(id), unit = p.price + (plusz || []).length * 350 + (extra || []).length * 550, mods = [];
    if (removed && removed.length) mods.push('nélküle: ' + removed.join(', '));
    if (plusz && plusz.length) mods.push('plusz: ' + plusz.join(', '));
    if (extra && extra.length) mods.push('extra: ' + extra.join(', '));
    if (note) mods.push('megjegyzés: ' + note);
    return { qty: qty, no: p.no, name: cap(p.name), unit: unit, sum: unit * qty, mods: mods };
  }
  function dline(id, qty) { var d = D(id); return { qty: qty, no: null, name: d.name + ' ' + d.volume, unit: d.price, sum: d.price * qty, mods: [] }; }
  function feeOf(town) { var z = M.delivery.zones.find(function (z) { return z.towns.indexOf(town) > -1; }); return z ? z.fee : 0; }
  function mk(no, minAgo, status, name, town, addr, pay, lines, note) {
    var sub = lines.reduce(function (a, l) { return a + l.sum; }, 0), fee = feeOf(town);
    var pc = lines.filter(function (l) { return l.no; }).reduce(function (a, l) { return a + l.qty; }, 0);
    var base = new Date(); base.setHours(19, 40, 0, 0);   // minta: nyitvatartáson belüli időpontok
    return { no: no, ts: base.getTime() - minAgo * 60000, status: status, demo: true, sample: true,
      customer: { name: name, phone: '+36 30 000 0000', town: town, address: addr }, pay: pay, note: note || '',
      lines: lines, sub: sub, fee: fee, total: sub + fee, gift: pc >= 5 };
  }
  function seed() {
    return [
      mk(1036, 74, 'kesz', 'Minta Család', 'Bük', 'Minta utca 12.', 'szep', [pline('husimado', 2), pline('margherita', 1), dline('coca-cola-175', 1)]),
      mk(1037, 41, 'uton', 'Minta Péter', 'Csepreg', 'Minta tér 3.', 'kartya', [pline('magyaros', 1, [], ['bacon']), pline('songoku', 1, [], [], ['gomba'])], 'Kapucsengő: 4-es'),
      mk(1038, 22, 'keszul', 'Minta Anna', 'Bük', 'Minta köz 7.', 'kp', [pline('vega', 1, ['zöld olivabogyó']), pline('tonhalas', 1), dline('coca-cola-zero-05', 2)]),
      mk(1039, 6, 'uj', 'Minta Bence', 'Sajtoskál', 'Minta utca 41.', 'kartya', [pline('betyar', 2), pline('hawaii', 1, [], [], [], 'jól átsütve'), pline('kolbaszos', 2), dline('fanta-05', 1)])
    ];
  }
  function ensureSeed() {
    var list = load();
    var seeded = false; try { seeded = !!localStorage.getItem(SEEDED_KEY); } catch (e) {}
    if (!seeded) {
      list = seed().concat(list.filter(function (o) { return !o.sample; }));
      store(list); try { localStorage.setItem(SEEDED_KEY, '1'); } catch (e) {}
    }
  }

  /* ---------- hang (csak bekapcsolás után, felhasználói művelettel) ---------- */
  var soundOn = false, actx = null;
  function beep() {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18].forEach(function (t) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.0001, actx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.18, actx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.15);
        o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.16);
      });
    } catch (e) {}
  }
  $('[data-sound]').addEventListener('click', function () {
    soundOn = !soundOn; this.setAttribute('aria-pressed', soundOn);
    $('[data-sound-lbl]').textContent = soundOn ? 'Hang be' : 'Hang ki';
    if (soundOn) beep();
  });

  /* ---------- toast ---------- */
  var tEl = $('[data-toast]'), tT;
  function toast(m) { tEl.textContent = m; tEl.classList.add('is-on'); clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('is-on'); }, 2600); }

  /* ---------- rendelések ---------- */
  var activeCol = 'uj', confirmNo = null, flashNo = null;
  function card(o) {
    var col = COLS.find(function (c) { return c.id === o.status; });
    var lines = o.lines.map(function (l) {
      return '<li><span class="oq">' + l.qty + '×</span><span class="on">' + (l.no ? '<i>' + l.no + '.</i> ' : '') + esc(l.name) +
        (l.mods.length ? '<small>' + l.mods.map(esc).join('<br>') + '</small>' : '') + '</span><span class="os">' + ft(l.sum) + '</span></li>';
    }).join('');
    var acts = '';
    if (col.next) acts += '<button type="button" class="abtn abtn--go" data-next="' + o.no + '">' + col.act + '</button>';
    acts += '<button type="button" class="abtn abtn--line" data-print-no="' + o.no + '">Nyomtatás</button>';
    if (o.status === 'uj') {
      acts += confirmNo === o.no
        ? '<span class="rej">Biztosan elutasítod? <button type="button" class="linkbtn" data-reject="' + o.no + '">Igen</button> · <button type="button" class="linkbtn" data-reject-cancel>Mégse</button></span>'
        : '<button type="button" class="linkbtn rejl" data-reject-ask="' + o.no + '">Elutasítás</button>';
    }
    return '<article class="oc oc--' + o.status + (flashNo === o.no ? ' is-flash' : '') + '" id="r' + o.no + '" data-no="' + o.no + '">' +
      '<header class="oc__h"><b>#' + o.no + '</b><span>' + hhmm(o.ts) + ' · ' + ago(o.ts) + '</span>' + (o.sample ? '<em>minta</em>' : '<em class="is-web">weboldalról</em>') + '</header>' +
      '<div class="oc__who"><b>' + esc(o.customer.name) + '</b><span>' + esc(o.customer.town) + ', ' + esc(o.customer.address) + '</span><span>' + esc(o.customer.phone) + ' · ' + (PAY[o.pay] || o.pay) + '</span></div>' +
      '<ul class="oc__l">' + lines + '</ul>' +
      (o.note ? '<p class="oc__note">Futárnak: „' + esc(o.note) + '”</p>' : '') +
      (o.gift ? '<p class="oc__gift">Ajándék ' + M.delivery.gift.item + ' jár (5 pizza).</p>' : '') +
      '<div class="oc__t"><span>Kiszállítás ' + (o.fee ? ft(o.fee) : 'ingyenes') + '</span><b>' + ft(o.total) + '</b></div>' +
      '<div class="oc__a">' + acts + '</div>' +
    '</article>';
  }
  function render() {
    setTimeout(function () { $$('.oc.is-flash').forEach(function (x) { x.classList.remove('is-flash'); }); }, 1800);
    var list = load().filter(function (o) { return o.status !== 'elutasitva'; }).sort(function (a, b) { return b.ts - a.ts; });
    $('[data-colnav]').innerHTML = COLS.map(function (c) {
      var n = list.filter(function (o) { return o.status === c.id; }).length;
      return '<button type="button" class="cn' + (c.id === activeCol ? ' is-on' : '') + '" data-col="' + c.id + '" aria-pressed="' + (c.id === activeCol) + '">' + c.name + '<span>' + n + '</span></button>';
    }).join('');
    $('[data-board]').innerHTML = COLS.map(function (c) {
      var items = list.filter(function (o) { return o.status === c.id; });
      return '<section class="col col--' + c.id + (c.id === activeCol ? ' is-on' : '') + '" aria-label="' + c.name + '">' +
        '<h2 class="col__h">' + c.name + '<span>' + items.length + '</span></h2>' +
        (items.length ? items.map(card).join('') : '<p class="col__empty">Nincs itt rendelés.</p>') + '</section>';
    }).join('');
    // összesítő (elutasított nélkül)
    var all = load().filter(function (o) { return o.status !== 'elutasitva'; });
    var sum = all.reduce(function (a, o) { return a + o.total; }, 0);
    $('[data-st="count"]').textContent = all.length;
    $('[data-st="sum"]').textContent = ft(sum);
    $('[data-st="avg"]').textContent = all.length ? ft(Math.round(sum / all.length / 10) * 10) : '0 Ft';
    $('[data-st="open"]').textContent = all.filter(function (o) { return o.status === 'uj' || o.status === 'keszul'; }).length;
    var nNew = all.filter(function (o) { return o.status === 'uj'; }).length;
    document.title = (nNew ? '(' + nNew + ') ' : '') + 'Konyha · rendelések — Limit Pizza admin demó';
  }
  function update(no, fn) { var l = load(); var o = l.find(function (x) { return x.no === no; }); if (o) { fn(o); store(l); } return o; }

  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-next]'))) {
      var no = +t.getAttribute('data-next'), o = update(no, function (o) { o.status = COLS.find(function (c) { return c.id === o.status; }).next; });
      if (o) { activeCol = o.status; toast('#' + no + ' → ' + COLS.find(function (c) { return c.id === o.status; }).name); }
      flashNo = no; render(); anim($('#r' + no), { opacity: [0, 1], y: [10, 0] }, { duration: 0.3 }); flashNo = null;
    } else if ((t = e.target.closest('[data-reject-ask]'))) { confirmNo = +t.getAttribute('data-reject-ask'); render(); }
    else if (e.target.closest('[data-reject-cancel]')) { confirmNo = null; render(); }
    else if ((t = e.target.closest('[data-reject]'))) { var n = +t.getAttribute('data-reject'); update(n, function (o) { o.status = 'elutasitva'; }); confirmNo = null; render(); toast('#' + n + ' elutasítva'); }
    else if ((t = e.target.closest('[data-print-no]'))) { printOrder(+t.getAttribute('data-print-no')); }
    else if ((t = e.target.closest('[data-col]'))) { activeCol = t.getAttribute('data-col'); render(); }
    else if ((t = e.target.closest('[data-tab]'))) {
      var id = t.getAttribute('data-tab');
      $$('[data-tab]').forEach(function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      $('#p-rend').hidden = id !== 'rend'; $('#p-etlap').hidden = id !== 'etlap';
    } else if (e.target.closest('[data-reset]')) {
      store(seed()); try { localStorage.removeItem(OUT_KEY); } catch (x) {}
      activeCol = 'uj'; render(); renderAvail(); toast('Minta adatok visszaállítva');
    }
  });

  /* ---------- nyomtatás (konyhai cetli) ---------- */
  function printOrder(no) {
    var o = load().find(function (x) { return x.no === no; }); if (!o) return;
    var lines = o.lines.map(function (l) { return '<tr><td>' + l.qty + '×</td><td>' + (l.no ? l.no + '. ' : '') + esc(l.name) + (l.mods.length ? '<br><small>' + l.mods.map(esc).join('<br>') + '</small>' : '') + '</td><td>' + ft(l.sum) + '</td></tr>'; }).join('');
    $('[data-print]').innerHTML = '<h1>LIMIT PIZZA</h1><p>#' + o.no + ' · ' + hhmm(o.ts) + ' · BEMUTATÓ</p><p><b>' + esc(o.customer.name) + '</b><br>' + esc(o.customer.town) + ', ' + esc(o.customer.address) + '<br>' + esc(o.customer.phone) + '<br>' + (PAY[o.pay] || o.pay) + '</p>' +
      '<table>' + lines + '</table>' + (o.note ? '<p>Futárnak: ' + esc(o.note) + '</p>' : '') + (o.gift ? '<p>+ ajándék ' + M.delivery.gift.item + '</p>' : '') +
      '<p>Kiszállítás: ' + (o.fee ? ft(o.fee) : 'ingyenes') + '<br><b>Összesen: ' + ft(o.total) + '</b></p>';
    window.print();
  }

  /* ---------- elérhetőség ---------- */
  function renderAvail() {
    var out = outList();
    $('[data-avail]').innerHTML = '<h2 class="avail__h">Pizzák</h2><ul class="av">' + M.pizzas.map(function (p) {
      var on = out.indexOf(p.id) === -1;
      return '<li><span class="av__n"><i>' + p.no + '.</i> ' + esc(p.name) + '</span><span class="av__p">' + ft(p.price) + '</span>' +
        '<label class="sw sw--sm"><input type="checkbox" data-av="' + p.id + '"' + (on ? ' checked' : '') + '><span class="sw__track" aria-hidden="true"></span><span class="sw__lbl">' + (on ? 'Elérhető' : 'Ma elfogyott') + '</span></label></li>';
    }).join('') + '</ul>';
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-av]')) {
      var out = outList(), id = t.getAttribute('data-av');
      out = t.checked ? out.filter(function (x) { return x !== id; }) : out.concat([id]);
      try { localStorage.setItem(OUT_KEY, JSON.stringify(out)); } catch (x) {}
      renderAvail(); toast(cap(P(id).name) + ': ' + (t.checked ? 'újra elérhető' : 'ma elfogyott'));
    } else if (t.matches('[data-accepting]')) {
      $('[data-accepting-lbl]').textContent = t.checked ? 'Rendelést fogadunk' : 'Rendelésfelvétel szünetel';
      toast(t.checked ? 'A weboldal újra fogad rendelést (demó)' : 'A weboldalon szünetel a rendelésfelvétel (demó)');
    }
  });

  /* ---------- új rendelés érkezése a weboldalról (másik fül) ---------- */
  var known = load().map(function (o) { return o.no; });
  window.addEventListener('storage', function (e) {
    if (e.key === ORDERS_KEY) {
      var list = load(), fresh = list.filter(function (o) { return known.indexOf(o.no) === -1; });
      known = list.map(function (o) { return o.no; });
      if (fresh.length) {
        activeCol = 'uj'; flashNo = fresh[fresh.length - 1].no; render();
        anim($('#r' + flashNo), { scale: [0.97, 1], opacity: [0, 1] }, { duration: 0.4 }); flashNo = null;
        beep(); toast('Új rendelés: #' + fresh[fresh.length - 1].no);
      } else render();
    }
    if (e.key === OUT_KEY) renderAvail();
  });

  /* ---------- óra, frissítés ---------- */
  function clock() { $('[data-clock]').textContent = hhmm(Date.now()); }
  clock(); setInterval(function () { clock(); render(); }, 30000);

  ensureSeed(); known = load().map(function (o) { return o.no; });
  // a weboldalról érkező link (#r1042) az adott rendelést mutatja
  var m = location.hash.match(/^#r(\d+)$/);
  if (m) { var o = load().find(function (x) { return x.no === +m[1]; }); if (o) { activeCol = o.status; flashNo = o.no; } }
  render(); renderAvail();
  if (flashNo) { var el = $('#r' + flashNo); if (el) { el.scrollIntoView({ block: 'center' }); anim(el, { scale: [0.97, 1], opacity: [0, 1] }, { duration: 0.45 }); } flashNo = null; }
})();
