/* =========================================================
   LIMIT PIZZA — konyhai admin demó (iPadre tervezve)
   · új rendelés: ismétlődő hang + vizuális riasztás, amíg el nem fogadják / el nem utasítják
   · elfogadás elkészítési idővel, elutasítás megerősítéssel
   · rendelésfogadás szüneteltetése, várható kiszállítási idő, elfogyott pizzák/feltétek
   · konyhai blokk (80 mm) előnézet + nyomtatás
   Állapot: js/demo-store.js (ugyanaz, amit a vevői oldal olvas). Semmi nem kerül elküldésre.
   ========================================================= */
(function () {
  'use strict';
  var M = window.LIMIT_MENU, D = window.LimitDemo;
  if (!M || !D) return;
  var MO = window.Motion || null;
  var CAN_ANIM = !!(MO && MO.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var PLUSZ = M.toppingGroups.find(function (g) { return g.id === 'plusz'; });
  var EXTRA = M.toppingGroups.find(function (g) { return g.id === 'extra'; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ft = function (n) { return n.toLocaleString('hu-HU') + ' Ft'; };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); };
  var anim = function (el, kf, o) { if (!CAN_ANIM || !el) return; try { MO.animate(el, kf, Object.assign({ ease: [0.2, 0.7, 0.2, 1] }, o || {})); } catch (e) {} };
  var hhmm = function (ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  var ago = function (ts) { var m = Math.round((Date.now() - ts) / 60000); if (m < 0) return ''; return m < 1 ? 'most' : m < 60 ? m + ' perce' : Math.floor(m / 60) + ' órája'; };

  var COLS = [
    { id: 'keszul', name: 'Készül', next: 'uton', act: 'Futárnak átadva' },
    { id: 'uton', name: 'Úton', next: 'kesz', act: 'Kiszállítva' },
    { id: 'kesz', name: 'Kiszállítva', next: null }
  ];
  var PAY = { kartya: 'Bankkártya a futárnál', szep: 'OTP SZÉP-kártya a futárnál', kp: 'Készpénz (egyeztetendő)' };
  var MODL = { alap: 'Alap', nelkule: 'NÉLKÜLE', plusz: '+ plusz', extra: '+ extra', megj: 'Megjegyzés' };
  var PREP = [15, 20, 30, 45, 60];
  var REASONS = ['Elfogyott alapanyag', 'Túl sok rendelés', 'Oda nem szállítunk', 'Egyéb'];

  /* ---------- toast ---------- */
  var tEl = $('[data-toast]'), tT;
  function toast(m) { tEl.textContent = m; tEl.classList.add('is-on'); clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('is-on'); }, 2600); }

  /* =========================================================
     Minta rendelések (az étlap valódi áraival; nincs köztük „új”, hogy a riasztás csak valódi bemutató-rendelésre induljon)
     ========================================================= */
  var P = function (id) { return M.pizzas.find(function (p) { return p.id === id; }); };
  function pline(id, qty, o) {
    o = o || {}; var p = P(id), plusz = o.plusz || [], extra = o.extra || [], mods = [];
    (o.removed || []).forEach(function (t) { mods.push({ k: 'nelkule', v: t }); });
    plusz.forEach(function (t) { mods.push({ k: 'plusz', v: t }); });
    extra.forEach(function (t) { mods.push({ k: 'extra', v: t }); });
    if (o.note) mods.push({ k: 'megj', v: o.note });
    var unit = p.price + plusz.length * PLUSZ.price + extra.length * EXTRA.price;
    return { qty: qty, no: p.no, name: cap(p.name), unit: unit, sum: unit * qty, mods: mods };
  }
  function dline(id, qty) { var d = M.drinks.find(function (x) { return x.id === id; }); return { qty: qty, no: null, name: d.name + ' ' + d.volume, unit: d.price, sum: d.price * qty, mods: [] }; }
  function feeOf(town) { var z = M.delivery.zones.find(function (z) { return z.towns.indexOf(town) > -1; }); return z ? z.fee : 0; }
  function mk(no, ts, status, name, town, addr, pay, lines, note, prep) {
    var sub = lines.reduce(function (a, l) { return a + l.sum; }, 0), fee = feeOf(town);
    var pc = lines.filter(function (l) { return l.no; }).reduce(function (a, l) { return a + l.qty; }, 0);
    return { no: no, ts: ts, status: status, demo: true, sample: true, prepMin: prep || null, acceptedAt: prep ? ts + 60000 : null,
      customer: { name: name, phone: '+36 30 000 0000', town: town, address: addr }, pay: pay, note: note || '',
      lines: lines, sub: sub, fee: fee, total: sub + fee, gift: pc >= 5 };
  }
  function seed() {
    var b = new Date(); b.setHours(19, 40, 0, 0); var t = function (m) { return b.getTime() - m * 60000; };
    return [
      mk(1037, t(74), 'kesz', 'Minta Család', 'Bük', 'Minta utca 12.', 'szep', [pline('husimado', 2), pline('margherita', 1), dline('coca-cola-175', 1)], '', 30),
      mk(1038, t(41), 'uton', 'Minta Péter', 'Csepreg', 'Minta tér 3.', 'kartya', [pline('magyaros', 1, { extra: ['bacon'] }), pline('songoku', 1, { removed: ['gomba'] })], 'Kapucsengő: 4-es', 30),
      mk(1039, t(22), 'keszul', 'Minta Anna', 'Bük', 'Minta köz 7.', 'kp', [pline('vega', 1, { plusz: ['zöld olivabogyó'] }), pline('tonhalas', 1), dline('coca-cola-zero-05', 2)], '', 20)
    ];
  }
  var SIMS = [
    function (ts) { return mk(0, ts, 'uj', 'Minta Bence', 'Sajtoskál', 'Minta utca 41.', 'kartya', [pline('betyar', 2), pline('hawaii', 1, { note: 'jól átsütve' }), pline('kolbaszos', 2), dline('fanta-05', 1)]); },
    function (ts) { return mk(0, ts, 'uj', 'Minta Kata', 'Bük', 'Minta sor 5.', 'szep', [pline('kedvenc', 1, { removed: ['lilahagyma'], plusz: ['gomba'] }), dline('coca-cola-05', 1)]); },
    function (ts) { return mk(0, ts, 'uj', 'Minta Gábor', 'Gór', 'Minta út 18.', 'kartya', [pline('inyenc', 1, { extra: ['füstölt sajt'] }), pline('margherita', 1)], 'Hívjon, ha megérkezett'); }
  ];
  var simI = 0;
  try {
    if (!localStorage.getItem('limitpizza-demo-minta-v2')) {
      D.setOrders(seed().concat(D.getOrders().filter(function (o) { return !o.sample; })));
      localStorage.setItem('limitpizza-demo-minta-v2', '1');
    }
  } catch (e) {}

  /* =========================================================
     Hang + riasztás
     · AudioContext csak felhasználói koppintás után indulhat (iPadOS/Safari szabály)
     · amíg van „uj” rendelés: 2,6 mp-enként ismétlődő hármas hang + villogó sáv
     ========================================================= */
  var actx = null, soundWanted = false, wake = null;
  function audioOk() { return !!(actx && actx.state === 'running'); }
  function chime() {
    if (!audioOk()) return false;
    var t0 = actx.currentTime;
    [[0, 988], [0.16, 1319], [0.32, 988]].forEach(function (n) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = n[1]; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, t0 + n[0]);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + n[0] + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n[0] + 0.14);
      o.start(t0 + n[0]); o.stop(t0 + n[0] + 0.15);
    });
    return true;
  }
  function enableSound() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var p = actx.resume ? actx.resume() : null;
      soundWanted = true;
      (p && p.then ? p : Promise.resolve()).then(function () { chime(); renderSound(); });
    } catch (e) { toast('Ez a böngésző nem engedi a hangot.'); }
    requestWake();
    renderSound();
  }
  function disableSound() { soundWanted = false; if (actx && actx.suspend) actx.suspend(); renderSound(); }
  function requestWake() {
    if (!('wakeLock' in navigator)) { $('[data-wake]').textContent = 'Ez a böngésző nem tudja ébren tartani a kijelzőt — állítsd az iPad automatikus zárolását „Soha” értékre, amíg a konyhai felület fut.'; return; }
    navigator.wakeLock.request('screen').then(function (w) { wake = w; $('[data-wake]').textContent = 'A kijelző ébren tartása bekapcsolva (amíg ez a lap előtérben van).'; })
      .catch(function () { $('[data-wake]').textContent = 'A kijelző ébren tartását a böngésző most nem engedte.'; });
  }
  function renderSound() {
    var on = soundWanted && audioOk(), b = $('[data-sound]');
    b.setAttribute('aria-pressed', on);
    $('[data-sound-lbl]').textContent = on ? 'Hang bekapcsolva' : soundWanted ? 'Hang újraindítása' : 'Hang bekapcsolása';
    $('[data-sound-fix]').hidden = on;
  }
  $('[data-sound]').addEventListener('click', function () { (soundWanted && audioOk()) ? disableSound() : enableSound(); });
  $('[data-sound-fix]').addEventListener('click', enableSound);
  $('[data-test-sound]').addEventListener('click', function () { if (!audioOk()) enableSound(); else chime(); toast('Teszthang'); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (soundWanted && actx && actx.state !== 'running' && actx.resume) actx.resume().then(renderSound, renderSound);
    if (soundWanted && !wake) requestWake();
    refresh();
  });

  var alarmTimer = null, baseTitle = document.title, blink = false;
  function newOrders() { return D.getOrders().filter(function (o) { return o.status === 'uj'; }).sort(function (a, b) { return a.ts - b.ts; }); }
  function alarmTick() {
    var n = newOrders().length;
    if (!n) { stopAlarm(); return; }
    chime();
    blink = !blink;
    document.title = (blink ? '● ÚJ RENDELÉS (' + n + ')' : '(' + n + ') ' + baseTitle);
    var bar = $('[data-alarm]'); bar.classList.toggle('is-blink', blink);
  }
  function syncAlarm() {
    var n = newOrders().length, bar = $('[data-alarm]');
    bar.hidden = !n; $('[data-alarm-n]').textContent = n;
    document.body.classList.toggle('has-alarm', !!n);
    if (n && !alarmTimer) { alarmTick(); alarmTimer = setInterval(alarmTick, 2600); }
    if (!n) stopAlarm();
  }
  function stopAlarm() {
    clearInterval(alarmTimer); alarmTimer = null;
    document.title = baseTitle; $('[data-alarm]').hidden = true; document.body.classList.remove('has-alarm');
  }
  window.__limitAlarm = function () { return { active: !!alarmTimer, count: newOrders().length }; };   // csak a teszteknek

  /* =========================================================
     Rendelések
     ========================================================= */
  var activeCol = 'keszul', flashNo = null;
  function modsHtml(mods) {
    if (!mods.length) return '';
    return '<ul class="mods">' + mods.map(function (m) {
      if (typeof m === 'string') return '<li>' + esc(m) + '</li>';
      return '<li class="m-' + m.k + '"><span>' + MODL[m.k] + ':</span> ' + esc(m.v) + '</li>';
    }).join('') + '</ul>';
  }
  function linesHtml(o) {
    return '<ul class="oc__l">' + o.lines.map(function (l) {
      return '<li><span class="oq">' + l.qty + '×</span><span class="on">' + (l.no ? '<i>' + l.no + '.</i> ' : '') + esc(l.name) + modsHtml(l.mods) + '</span><span class="os">' + ft(l.sum) + '</span></li>';
    }).join('') + '</ul>';
  }
  function head(o) {
    return '<header class="oc__h"><b>#' + o.no + '</b><span>' + hhmm(o.ts) + (ago(o.ts) ? ' · ' + ago(o.ts) : '') + '</span>' + (o.sample ? '<em>minta</em>' : '<em class="is-web">weboldalról · bemutató</em>') + '</header>' +
      '<div class="oc__who"><b>' + esc(o.customer.name) + '</b><span>' + esc(o.customer.town) + ', ' + esc(o.customer.address) + '</span><span>' + esc(o.customer.phone) + ' · ' + (PAY[o.pay] || esc(o.pay)) + '</span></div>';
  }
  function foot(o) {
    return (o.note ? '<p class="oc__note">Futárnak: „' + esc(o.note) + '”</p>' : '') +
      (o.gift ? '<p class="oc__gift">Ajándék ' + M.delivery.gift.item + ' jár (5 pizza).</p>' : '') +
      '<div class="oc__t"><span>Kiszállítás ' + (o.fee ? ft(o.fee) : 'ingyenes') + '</span><b>' + ft(o.total) + '</b></div>';
  }
  function newCard(o) {
    return '<article class="oc oc--uj' + (flashNo === o.no ? ' is-flash' : '') + '" id="r' + o.no + '" data-no="' + o.no + '">' +
      '<div class="oc__body">' + head(o) + linesHtml(o) + foot(o) + '</div>' +
      '<div class="oc__side"><p class="oc__sum">' + ft(o.total) + '</p>' +
        '<div class="oc__a oc__a--new">' +
          '<button type="button" class="abtn abtn--go abtn--xl" data-accept="' + o.no + '">Elfogadás</button>' +
          '<button type="button" class="abtn abtn--line abtn--xl" data-reject="' + o.no + '">Elutasítás</button>' +
          '<button type="button" class="abtn abtn--line" data-slip-no="' + o.no + '">Blokk</button>' +
        '</div></div></article>';
  }
  function card(o) {
    var col = COLS.find(function (c) { return c.id === o.status; });
    var leave = o.prepMin && o.acceptedAt ? '<p class="oc__prep">Indul kb. <b>' + hhmm(o.acceptedAt + o.prepMin * 60000) + '</b> (' + o.prepMin + ' perc)</p>' : '';
    return '<article class="oc oc--' + o.status + (flashNo === o.no ? ' is-flash' : '') + '" id="r' + o.no + '" data-no="' + o.no + '">' + head(o) + (o.status === 'keszul' ? leave : '') + linesHtml(o) + foot(o) +
      '<div class="oc__a">' + (col.next ? '<button type="button" class="abtn abtn--go abtn--lg" data-next="' + o.no + '">' + col.act + '</button>' : '') +
      '<button type="button" class="abtn abtn--line" data-slip-no="' + o.no + '">Blokk</button></div></article>';
  }
  function render() {
    var all = D.getOrders().sort(function (a, b) { return b.ts - a.ts; });
    var nw = newOrders();
    $('[data-new-wrap]').classList.toggle('is-empty', !nw.length);
    $('[data-new-list]').innerHTML = nw.length ? nw.map(newCard).join('') : '<p class="col__empty">Nincs elfogadásra váró rendelés.</p>';
    $('[data-colnav]').innerHTML = COLS.map(function (c) {
      var n = all.filter(function (o) { return o.status === c.id; }).length;
      return '<button type="button" class="cn' + (c.id === activeCol ? ' is-on' : '') + '" data-col="' + c.id + '" aria-pressed="' + (c.id === activeCol) + '">' + c.name + '<span>' + n + '</span></button>';
    }).join('');
    $('[data-board]').innerHTML = COLS.map(function (c) {
      var items = all.filter(function (o) { return o.status === c.id; });
      return '<section class="col col--' + c.id + (c.id === activeCol ? ' is-on' : '') + '" aria-label="' + c.name + '">' +
        '<h2 class="col__h">' + c.name + '<span>' + items.length + '</span></h2>' +
        (items.length ? items.map(card).join('') : '<p class="col__empty">Nincs itt rendelés.</p>') + '</section>';
    }).join('');
    var rej = all.filter(function (o) { return o.status === 'elutasitva'; });
    $('[data-rejected-n]').textContent = rej.length;
    $('[data-rejected-wrap]').hidden = !rej.length;
    $('[data-rejected]').innerHTML = rej.map(function (o) { return '<p class="rj"><b>#' + o.no + '</b> ' + hhmm(o.ts) + ' · ' + esc(o.customer.name) + ' · ' + ft(o.total) + (o.rejectReason ? ' · ' + esc(o.rejectReason) : '') + '</p>'; }).join('');
    $('[data-tab-n]').textContent = nw.length ? nw.length : '';
    setTimeout(function () { $$('.oc.is-flash').forEach(function (x) { x.classList.remove('is-flash'); }); }, 2200);
    flashNo = null;
    syncAlarm();
  }

  /* ---------- elfogadás ---------- */
  var accDlg = $('#acc-dlg'), rejDlg = $('#rej-dlg'), prnDlg = $('#prn-dlg'), pendingNo = null, busy = false;
  function openAccept(no) {
    pendingNo = no; $('[data-acc-no]').textContent = '#' + no;
    var def = 30;
    $('[data-prep]').innerHTML = PREP.map(function (m) { return '<label class="pc"><input type="radio" name="prep" value="' + m + '"' + (m === def ? ' checked' : '') + '><span>' + m + ' perc</span></label>'; }).join('');
    $('[data-prep-own]').value = ''; $('[data-prep-err]').hidden = true;
    accDlg.showModal();
  }
  $('[data-prep-own]').addEventListener('input', function () { if (this.value) $$('input[name="prep"]').forEach(function (r) { r.checked = false; }); });
  $('[data-prep]').addEventListener('change', function () { $('[data-prep-own]').value = ''; });
  $('[data-acc-form]').addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return;
    var own = $('[data-prep-own]').value.trim(), r = $('input[name="prep"]:checked'), min;
    if (own) { min = Math.round(+own); if (!(min >= 5 && min <= 180)) { var er = $('[data-prep-err]'); er.textContent = '5 és 180 perc közötti értéket adj meg.'; er.hidden = false; return; } }
    else if (r) min = +r.value; else { $('[data-prep-err]').textContent = 'Válassz időt.'; $('[data-prep-err]').hidden = false; return; }
    busy = true;
    var no = pendingNo, o = D.updateOrder(no, function (o) { if (o.status === 'uj') { o.status = 'keszul'; o.prepMin = min; o.acceptedAt = Date.now(); } });
    accDlg.close(); busy = false;
    if (o) { activeCol = 'keszul'; flashNo = no; render(); toast('#' + no + ' elfogadva · ' + min + ' perc'); }
  });

  /* ---------- elutasítás (csak megerősítéssel) ---------- */
  function openReject(no) {
    pendingNo = no; $('[data-rej-no]').textContent = '#' + no;
    $('[data-rej-reasons]').innerHTML = REASONS.map(function (r) { return '<label class="pc"><input type="radio" name="reason" value="' + r + '"><span>' + r + '</span></label>'; }).join('');
    rejDlg.showModal();
    $('[data-sheet-cancel]', rejDlg).focus();
  }
  $('[data-rej-form]').addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return; busy = true;
    var no = pendingNo, r = $('input[name="reason"]:checked');
    D.updateOrder(no, function (o) { if (o.status === 'uj') { o.status = 'elutasitva'; o.rejectReason = r ? r.value : ''; } });
    rejDlg.close(); busy = false; render(); toast('#' + no + ' elutasítva');
  });
  $$('[data-sheet-cancel]').forEach(function (b) { b.addEventListener('click', function () { b.closest('dialog').close(); }); });

  /* ---------- konyhai blokk ---------- */
  function slipHtml(o) {
    var lines = o.lines.map(function (l) {
      return '<tr><td class="q">' + l.qty + '×</td><td>' + (l.no ? l.no + '. ' : '') + esc(l.name) +
        (l.mods.length ? '<div class="sm">' + l.mods.map(function (m) { return typeof m === 'string' ? esc(m) : (m.k === 'nelkule' ? '<b>— NÉLKÜLE: ' + esc(m.v) + '</b>' : m.k === 'megj' ? '» ' + esc(m.v) : MODL[m.k] + ': ' + esc(m.v)); }).join('<br>') + '</div>' : '') +
        '</td><td class="r">' + ft(l.sum) + '</td></tr>';
    }).join('');
    return '<p class="c b">LIMIT PIZZA</p><p class="c">Házhozszállítás · Bük</p><p class="c">*** BEMUTATÓ — NEM ÉLES ***</p><hr>' +
      '<p class="big">#' + o.no + '</p><p>Leadva: ' + new Date(o.ts).toLocaleString('hu-HU', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</p>' +
      (o.prepMin ? '<p>Indul kb.: ' + hhmm((o.acceptedAt || o.ts) + o.prepMin * 60000) + ' (' + o.prepMin + ' perc)</p>' : '') + '<hr>' +
      '<table>' + lines + '</table><hr>' +
      '<p><b>' + esc(o.customer.name) + '</b> (minta)</p><p>' + esc(o.customer.town) + ', ' + esc(o.customer.address) + '</p><p>' + esc(o.customer.phone) + '</p>' +
      (o.note ? '<p>Futárnak: ' + esc(o.note) + '</p>' : '') + '<hr>' +
      '<p>Fizetés: ' + (PAY[o.pay] || esc(o.pay)) + '</p>' + (o.gift ? '<p>+ AJÁNDÉK: ' + M.delivery.gift.item + '</p>' : '') +
      '<table><tr><td>Részösszeg</td><td class="r">' + ft(o.sub) + '</td></tr><tr><td>Kiszállítás</td><td class="r">' + (o.fee ? ft(o.fee) : 'ingyenes') + '</td></tr>' +
      '<tr class="tot"><td>ÖSSZESEN</td><td class="r">' + ft(o.total) + '</td></tr></table>';
  }
  function openSlip(no) {
    var o = D.getOrders().find(function (x) { return x.no === no; }); if (!o) return;
    $('[data-slip]', prnDlg).innerHTML = slipHtml(o); $('[data-print]').innerHTML = slipHtml(o);
    prnDlg.showModal();
  }
  $('[data-do-print]').addEventListener('click', function () { window.print(); });

  /* ---------- kattintások ---------- */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-accept]'))) openAccept(+t.getAttribute('data-accept'));
    else if ((t = e.target.closest('[data-reject]'))) openReject(+t.getAttribute('data-reject'));
    else if ((t = e.target.closest('[data-next]'))) {
      if (t.disabled) return; t.disabled = true;
      var no = +t.getAttribute('data-next');
      var o = D.updateOrder(no, function (o) { var c = COLS.find(function (c) { return c.id === o.status; }); if (c && c.next) o.status = c.next; });
      if (o) { activeCol = o.status; flashNo = no; render(); toast('#' + no + ' → ' + COLS.find(function (c) { return c.id === o.status; }).name); }
    }
    else if ((t = e.target.closest('[data-slip-no]'))) openSlip(+t.getAttribute('data-slip-no'));
    else if ((t = e.target.closest('[data-col]'))) { activeCol = t.getAttribute('data-col'); render(); }
    else if ((t = e.target.closest('[data-tab]'))) {
      var id = t.getAttribute('data-tab');
      $$('[data-tab]').forEach(function (b) { var on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      $('#p-rend').hidden = id !== 'rend'; $('#p-beall').hidden = id !== 'beall';
    } else if (e.target.closest('[data-simulate]')) {
      D.addOrder(SIMS[simI++ % SIMS.length](Date.now()));
      refresh(); toast('Minta rendelés érkezett');
    } else if (e.target.closest('[data-reset]')) {
      D.setOrders(seed()); D.setSettings({ accepting: true, eta: { id: '45-60' }, soldOut: { pizzas: [], toppings: [] } });
      activeCol = 'keszul'; refresh(); toast('Minta adatok visszaállítva');
    } else if (e.target.closest('[data-accepting]')) {
      var s = D.getSettings(); D.setSettings({ accepting: !s.accepting }); renderSettings();
      toast(!s.accepting ? 'Újra fogadunk rendelést' : 'Rendelésfelvétel szünetel — új rendelés nem adható le');
    } else if ((t = e.target.closest('[data-eta-id]'))) {
      D.setSettings({ eta: { id: t.getAttribute('data-eta-id') } }); renderSettings(); toast('Várható idő: ' + D.etaLabel(D.getSettings().eta));
    }
  });

  /* ---------- beállítások ---------- */
  $('[data-eta-own]').addEventListener('submit', function (e) {
    e.preventDefault();
    var mn = Math.round(+$('[data-eta-min]').value), mx = Math.round(+$('[data-eta-max]').value), er = $('[data-eta-err]');
    if (!(mn >= 10 && mx <= 240 && mx > mn)) { er.textContent = 'Adj meg két időt 10 és 240 perc között, a második legyen nagyobb.'; er.hidden = false; return; }
    er.hidden = true; D.setSettings({ eta: { id: 'egyedi', min: mn, max: mx } }); renderSettings(); toast('Várható idő: ' + mn + '–' + mx + ' perc');
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-out-p], [data-out-t]')) {
      var s = D.getSettings(), so = { pizzas: s.soldOut.pizzas.slice(), toppings: s.soldOut.toppings.slice() };
      var list = t.matches('[data-out-p]') ? so.pizzas : so.toppings, id = t.getAttribute(t.matches('[data-out-p]') ? 'data-out-p' : 'data-out-t');
      var i = list.indexOf(id);
      if (!t.checked && i === -1) list.push(id); if (t.checked && i > -1) list.splice(i, 1);
      D.setSettings({ soldOut: so }); renderSettings();
      var nm = t.matches('[data-out-p]') ? cap(P(id).name) : id;
      toast(nm + ': ' + (t.checked ? 'újra elérhető' : 'ma elfogyott'));
    }
  });
  function sw(attr, id, on, label, sub) {
    return '<li><span class="av__n">' + label + '</span>' + (sub ? '<span class="av__p">' + sub + '</span>' : '<span></span>') +
      '<label class="sw"><input type="checkbox" ' + attr + '="' + esc(id) + '"' + (on ? ' checked' : '') + '><span class="sw__track" aria-hidden="true"></span><span class="sw__lbl">' + (on ? 'Van' : 'Elfogyott') + '</span></label></li>';
  }
  function renderSettings() {
    var s = D.getSettings();
    var b = $('[data-accepting]');
    b.setAttribute('aria-pressed', s.accepting); b.classList.toggle('is-off', !s.accepting);
    $('[data-accepting-txt]').textContent = s.accepting ? 'Rendelést fogadunk' : 'Rendelésfelvétel szünetel';
    $('[data-eta-top]').textContent = s.accepting ? 'várható: ' + D.etaLabel(s.eta) : 'szünetel';
    $('[data-etas]').innerHTML = D.ETA_PRESETS.map(function (p) {
      var on = s.eta.id === p.id;
      return '<button type="button" role="radio" aria-checked="' + on + '" class="eta' + (on ? ' is-on' : '') + '" data-eta-id="' + p.id + '">' + p.min + '–' + p.max + ' perc</button>';
    }).join('') + (s.eta.id === 'egyedi' ? '<span class="eta is-on" role="radio" aria-checked="true">Egyedi: ' + D.etaLabel(s.eta) + '</span>' : '');
    if (s.eta.id === 'egyedi') { $('[data-eta-min]').value = s.eta.min; $('[data-eta-max]').value = s.eta.max; }
    $('[data-avail]').innerHTML =
      '<h3 class="avail__h">Pizzák</h3><ul class="av">' + M.pizzas.map(function (p) { return sw('data-out-p', p.id, s.soldOut.pizzas.indexOf(p.id) === -1, '<i>' + p.no + '.</i> ' + esc(p.name), ft(p.price)); }).join('') + '</ul>' +
      M.toppingGroups.map(function (g) {
        return '<h3 class="avail__h">' + g.name + ' <small>' + ft(g.price) + '</small></h3><ul class="av">' + g.items.map(function (t) { return sw('data-out-t', t, s.soldOut.toppings.indexOf(t) === -1, esc(t)); }).join('') + '</ul>';
      }).join('');
  }

  /* ---------- más fülről érkező változás ---------- */
  var known = D.getOrders().map(function (o) { return o.no; });
  function refresh() {
    var list = D.getOrders(), fresh = list.filter(function (o) { return known.indexOf(o.no) === -1 && o.status === 'uj'; });
    known = list.map(function (o) { return o.no; });
    if (fresh.length) { flashNo = fresh[fresh.length - 1].no; toast('Új rendelés: #' + flashNo); }
    render(); renderSettings();
    if (fresh.length) { var el = $('#r' + fresh[fresh.length - 1].no); anim(el, { scale: [0.97, 1], opacity: [0, 1] }, { duration: 0.4 }); }
  }
  D.subscribe(function () { refresh(); });

  /* ---------- óra ---------- */
  function clock() { $('[data-clock]').textContent = hhmm(Date.now()); }
  clock(); setInterval(function () { clock(); render(); }, 30000);

  // a weboldalról érkező link (#r1042) az adott rendelést mutatja
  var m = location.hash.match(/^#r(\d+)$/);
  if (m) { var o = D.getOrders().find(function (x) { return x.no === +m[1]; }); if (o) { if (o.status !== 'uj') activeCol = o.status === 'elutasitva' ? 'keszul' : o.status; flashNo = o.no; } }
  render(); renderSettings(); renderSound();
  if (m) { var el = $('#r' + m[1]); if (el) el.scrollIntoView({ block: 'center' }); }
})();
