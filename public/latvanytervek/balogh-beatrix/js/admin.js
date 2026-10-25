/* ==========================================================================
   BB admin — BEMUTATÓ adminfelület
   Nincs bejelentkezés: élesben szerveroldali hitelesítés és jogosultság kell.
   Minden adat a böngésző helyi tárolójában (ugyanaz, amit a vendégoldal ír).
   ========================================================================== */
(function () {
  'use strict';
  var BB = window.BB, T = BB.t, esc = T.esc, UI = window.BBUI, icon = UI.icon;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var params = new URLSearchParams(location.search);

  var S = { tab: 'attekintes', view: 'week', cur: params.get('nap') || T.iso(T.today()), nfilter: 'all', q: '' };
  if (params.get('nap')) { S.tab = 'naptar'; S.view = 'day'; }
  var view, toast;

  var TABS = [
    ['attekintes', 'Áttekintés', 'grid'], ['naptar', 'Naptár', 'calendar'], ['szolgaltatasok', 'Szolgáltatások', 'list'],
    ['vendegek', 'Vendégek', 'users'], ['ertesitesek', 'Értesítések', 'bell'], ['beallitasok', 'Beállítások', 'sliders']
  ];

  /* ---------- segédek ---------- */
  function d() { return BB.db(); }
  function active(b) { return b.status !== 'cancelled'; }
  function svcName(id) { var s = BB.service(id); return s ? s.name : id; }
  function svcCat(id) { var s = BB.service(id); return s ? s.cat : ''; }
  function endT(b) { return T.fromMin(T.toMin(b.start) + b.mins); }
  function weekStart(iso) { var x = T.parseIso(iso); return T.addDays(x, -((x.getDay() + 6) % 7)); }
  function say(msg) { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('is-on'); }, 2600); }
  function ago(isoStr) {
    var m = Math.round((Date.now() - new Date(isoStr).getTime()) / 60000);
    if (m < 1) return 'most'; if (m < 60) return m + ' perce'; if (m < 1440) return Math.round(m / 60) + ' órája'; return Math.round(m / 1440) + ' napja';
  }
  function workMins(db, ds) { var p = BB.dayPlan(db, ds); if (p.closed) return 0; return p.close - p.open - p.breaks.reduce(function (a, b) { return a + (b.end - b.start); }, 0); }
  function bookedMins(db, ds) { return BB.bookingsOn(db, ds).reduce(function (a, b) { var s = BB.service(b.serviceId, db); return a + b.mins + (s ? s.buffer : 0); }, 0); }

  /* ---------- modális ---------- */
  var modal, lastFocus;
  function openModal(title, body, foot, onMount) {
    lastFocus = document.activeElement;
    modal.innerHTML = '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="modal-h"><h2 id="mTitle">' + title + '</h2><button type="button" class="icon-btn" data-close aria-label="Bezárás">' + icon('x') + '</button></div><div class="modal-b">' + body + '</div>' + (foot ? '<div class="modal-f">' + foot + '</div>' : '') + '</div>';
    modal.classList.add('is-open');
    var f = $('input, select, textarea, button:not([data-close])', modal) || $('[data-close]', modal); f && f.focus();
    onMount && onMount($('.modal-card', modal));
  }
  function closeModal() { modal.classList.remove('is-open'); modal.innerHTML = ''; lastFocus && lastFocus.focus && lastFocus.focus(); }

  /* ---------- keret ---------- */
  function renderTabs() {
    var n = d().notifications.filter(function (x) { return x.type === 'failed'; }).length;
    $('#admTabs').innerHTML = TABS.map(function (t) {
      return '<button type="button" role="tab" class="adm-tab" id="tab-' + t[0] + '" aria-controls="admView" aria-selected="' + (S.tab === t[0]) + '" data-tab="' + t[0] + '">' + icon(t[2]) + t[1] + (t[0] === 'ertesitesek' && n ? '<span class="badge" aria-label="' + n + ' hiba">' + n + '</span>' : '') + '</button>';
    }).join('');
  }
  function render() {
    renderTabs();
    view.setAttribute('aria-labelledby', 'tab-' + S.tab);
    ({ attekintes: overview, naptar: calendar, szolgaltatasok: services, vendegek: guests, ertesitesek: notices, beallitasok: settings })[S.tab]();
  }
  function top(title, sub, right) {
    return '<div class="adm-top"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>';
  }

  /* ================= ÁTTEKINTÉS ================= */
  function overview() {
    var db = d(), t0 = T.iso(T.today()), now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
    var todayB = db.bookings.filter(function (b) { return b.date === t0 && active(b); }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    var in7 = T.iso(T.addDays(T.today(), 7));
    var upcoming = db.bookings.filter(function (b) { return active(b) && (b.date > t0 || (b.date === t0 && T.toMin(b.start) >= nowM)) && b.date <= in7; })
      .sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
    var ws = weekStart(t0), wDays = []; for (var i = 0; i < 7; i++) wDays.push(T.iso(T.addDays(ws, i)));
    var weekB = db.bookings.filter(function (b) { return active(b) && wDays.indexOf(b.date) >= 0; });
    var wWork = wDays.reduce(function (a, x) { return a + workMins(db, x); }, 0), wBooked = wDays.reduce(function (a, x) { return a + bookedMins(db, x); }, 0);
    var free = wWork ? Math.max(0, Math.round((1 - wBooked / wWork) * 100)) : 0;
    var rev = weekB.reduce(function (a, b) { return a + (b.price || 0); }, 0);
    var nextToday = todayB.filter(function (b) { return T.toMin(b.start) >= nowM; })[0];

    view.innerHTML = top('Jó napot, Beatrix', T.fmtDate(t0, { weekday: true }) + ' · bemutató adatokkal',
      '<button type="button" class="btn btn--sm" data-new>' + icon('plus') + 'Új időpont</button>') +
      '<div class="adm-banner">' + icon('info') + '<span><b>Admin demó.</b> A számok kizárólag a bemutató mintafoglalásaiból és az itt rögzített adatokból számolódnak — nem valós üzleti eredmények. Nincs bejelentkezés: az éles rendszerben hitelesítés védi.</span></div>' +
      '<div class="kpis">' +
      kpi('Mai időpontok', todayB.length, nextToday ? 'Következő: ' + nextToday.start : 'Ma már nincs több') +
      kpi('Közelgő (7 nap)', upcoming.length, upcoming[0] ? 'Legközelebb: ' + T.fmtShort(upcoming[0].date) + ' ' + upcoming[0].start : '—') +
      kpi('Heti foglalások', weekB.length, T.fmtShort(wDays[0]) + ' – ' + T.fmtShort(wDays[6])) +
      kpi('Szabad kapacitás', free + '%', 'a heti munkaidőből', free) +
      kpi('Demó bevételi összesítő', T.fmtFt(rev), 'e heti foglalások listaárán, demóadatból') +
      '</div>' +
      '<div class="adm-cols">' +
      '<section class="panel"><div class="panel-h"><h2>Mai nap</h2><button type="button" class="link" data-goto-day="' + t0 + '">Napi nézet ' + icon('arrow') + '</button></div>' +
      (todayB.length ? '<ul class="tl">' + todayB.map(tlItem).join('') + '</ul>' : emptyBox('calendar', 'Mára nincs foglalás', BB.dayPlan(db, t0).closed ? (BB.dayPlan(db, t0).reason === 'Zárva' ? 'Ma nincs munkanap.' : 'Ma: ' + BB.dayPlan(db, t0).reason.toLowerCase() + '.') : 'Szabad nap — vegyél fel időpontot, ha valaki telefonon foglal.')) +
      '</section>' +
      '<section class="panel"><div class="panel-h"><h2>Értesítések</h2><button type="button" class="link" data-tab="ertesitesek">Összes ' + icon('arrow') + '</button></div>' +
      (db.notifications.length ? '<ul class="notes-list">' + db.notifications.slice(0, 5).map(noteItem).join('') + '</ul>' : emptyBox('bell', 'Nincs értesítés', '')) + '</section>' +
      '</div>' +
      '<section class="panel" style="margin-top:16px"><div class="panel-h"><h2>Közelgő foglalások</h2><span class="small muted">következő 7 nap</span></div>' +
      (upcoming.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Időpont</th><th>Vendég</th><th>Kezelés</th><th>Ár</th><th>Forrás</th><th></th></tr></thead><tbody>' +
        upcoming.slice(0, 10).map(function (b) {
          return '<tr><td>' + T.fmtShort(b.date) + ' ' + b.start + '</td><td>' + esc(b.name) + '</td><td>' + esc(svcName(b.serviceId)) + '</td><td>' + esc(T.fmtPrice(b)) + '</td><td>' + src(b) + '</td><td><button type="button" class="inline-link" data-open="' + b.id + '">Megnyitás</button></td></tr>';
        }).join('') + '</tbody></table></div>' : emptyBox('calendar', 'Nincs közelgő foglalás', 'A következő 7 napra még senki nem foglalt.')) +
      '</section>';
  }
  function kpi(l, v, s, pct) { return '<div class="kpi"><span>' + l + '</span><b>' + v + '</b><small>' + s + '</small>' + (pct != null ? '<div class="bar" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' : '') + '</div>'; }
  function src(b) { return { online: '<span class="pill pill--ok">Online</span>', admin: '<span class="pill">Admin</span>', seed: '<span class="pill pill--gold">Minta</span>' }[b.source] || ''; }
  function tlItem(b) { return '<li><time>' + b.start + '</time><span class="stripe ' + svcCat(b.serviceId) + '"></span><button type="button" data-open="' + b.id + '"><b>' + esc(b.name) + '</b><span>' + esc(svcName(b.serviceId)) + ' · ' + b.mins + ' perc · ' + b.start + '–' + endT(b) + '</span></button>' + src(b) + '</li>'; }
  var NI = { new: 'check', cancel: 'x', change: 'edit', reminder: 'bell', failed: 'alert' };
  function noteItem(n) { return '<li><span class="ni ' + n.type + '">' + icon(NI[n.type] || 'info') + '</span><div>' + esc(n.text) + '<small>' + ago(n.at) + ' · szimulált értesítés</small></div></li>'; }
  function emptyBox(ic, h, p) { return '<div class="empty">' + icon(ic) + '<h3>' + h + '</h3>' + (p ? '<p>' + p + '</p>' : '') + '</div>'; }

  /* ================= NAPTÁR ================= */
  function range() {
    var sc = BB.schedule(), lo = 24 * 60, hi = 0;
    for (var k in sc.days) { var x = sc.days[k]; if (x) { lo = Math.min(lo, T.toMin(x.open)); hi = Math.max(hi, T.toMin(x.close)); } }
    if (hi <= lo) { lo = 8 * 60; hi = 18 * 60; }
    return { start: Math.floor(lo / 60) * 60 - 60, end: Math.ceil(hi / 60) * 60 + 60 };
  }
  function calendar() {
    var label;
    if (S.view === 'day') label = T.fmtDate(S.cur, { weekday: true });
    else if (S.view === 'week') { var ws = weekStart(S.cur); label = T.fmtShort(ws) + ' – ' + T.fmtShort(T.addDays(ws, 6)) + ' ' + ws.getFullYear(); }
    else { var p = T.parseIso(S.cur); label = p.getFullYear() + '. ' + T.MONTHS[p.getMonth()]; }
    var tools = '<div class="cal-tools">' +
      '<div class="seg" role="group" aria-label="Nézet"><button type="button" data-view="day" aria-pressed="' + (S.view === 'day') + '">Nap</button><button type="button" data-view="week" aria-pressed="' + (S.view === 'week') + '">Hét</button><button type="button" data-view="month" aria-pressed="' + (S.view === 'month') + '">Hónap</button></div>' +
      '<button type="button" class="icon-btn" data-step="-1" aria-label="Előző">' + icon('chev-l') + '</button><button type="button" class="btn btn--ghost btn--sm" data-today>Ma</button><button type="button" class="icon-btn" data-step="1" aria-label="Következő">' + icon('chev-r') + '</button>' +
      '<span class="cal-label" aria-live="polite">' + label + '</span>' +
      '<div class="cal-actions"><button type="button" class="btn btn--sm" data-new>' + icon('plus') + 'Új időpont</button><button type="button" class="btn btn--ghost btn--sm" data-break>' + icon('pause') + 'Szünet</button><button type="button" class="btn btn--ghost btn--sm" data-close-day>' + icon('lock') + 'Lezárás / szabadság</button><button type="button" class="btn btn--ghost btn--sm" data-hours>' + icon('clock') + 'Munkaidő</button></div>' +
      '</div>';
    view.innerHTML = top('Foglalási naptár', 'Kattints egy foglalásra a módosításhoz, vagy a napi nézetben egy üres sávra új időponthoz.') + tools +
      (S.view === 'month' ? monthView() : timeGrid(S.view === 'day' ? [S.cur] : weekDays()));
  }
  function weekDays() { var ws = weekStart(S.cur), a = []; for (var i = 0; i < 7; i++) a.push(T.iso(T.addDays(ws, i))); return a; }

  function timeGrid(days) {
    var db = d(), R = range(), H = 54, px = function (m) { return (m - R.start) / 60 * H; }, height = px(R.end), t0 = T.iso(T.today());
    var now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
    var head = '<div class="tg-head"><div></div>' + days.map(function (ds) {
      var x = T.parseIso(ds), cnt = BB.bookingsOn(db, ds).length;
      return '<div class="' + (ds === t0 ? 'is-today' : '') + '"><button type="button" data-goto-day="' + ds + '"><b>' + T.DAYS_SHORT[x.getDay()] + ' ' + x.getDate() + '.</b><span class="muted">' + cnt + ' foglalás</span></button></div>';
    }).join('') + '</div>';
    var hours = '<div class="tg-hours" style="height:' + height + 'px">';
    for (var m = R.start + 60; m < R.end; m += 60) hours += '<span style="top:' + px(m) + 'px">' + T.fromMin(m) + '</span>';
    hours += '</div>';
    var cols = days.map(function (ds) {
      var plan = BB.dayPlan(db, ds);
      var inner = '';
      if (plan.closed) {
        inner += '<div class="tg-closedlbl"><span>' + icon(plan.reason === 'Szabadság' ? 'sun' : 'lock') + '<br>' + plan.reason + (plan.closure && plan.closure.note ? '<br><small>' + esc(plan.closure.note) + '</small>' : '') + '</span></div>';
      } else {
        inner += '<div class="tg-off" style="top:0;height:' + px(plan.open) + 'px"></div><div class="tg-off" style="top:' + px(plan.close) + 'px;bottom:0"></div>';
        plan.breaks.forEach(function (b) {
          inner += '<div class="tg-break" style="top:' + px(b.start) + 'px;height:' + (px(b.end) - px(b.start)) + 'px"><span>' + esc(b.note) + '</span>' + (b.id ? '<button type="button" data-del-break="' + b.id + '" aria-label="Szünet törlése">' + icon('x') + '</button>' : '') + '</div>';
        });
      }
      BB.bookingsOn(db, ds).forEach(function (b) {
        var s = BB.service(b.serviceId, db), buf = s ? s.buffer : 0, st = T.toMin(b.start), done = b.status === 'completed' || ds < t0;
        inner += '<button type="button" class="tg-ev ' + svcCat(b.serviceId) + (done ? ' is-done' : '') + '" style="top:' + px(st) + 'px;height:' + ((b.mins + buf) / 60 * H - 2) + 'px" data-open="' + b.id + '" aria-label="' + esc(b.name + ', ' + svcName(b.serviceId) + ', ' + b.start + '–' + endT(b)) + '">' +
          '<b>' + b.start + ' ' + esc(b.name) + '</b>' + esc(svcName(b.serviceId)) + '<span class="buf" style="height:' + (buf / (b.mins + buf) * 100) + '%" title="Pufferidő"></span></button>';
      });
      if (ds === t0 && nowM > R.start && nowM < R.end) inner += '<div class="tg-now" style="top:' + px(nowM) + 'px" aria-hidden="true"></div>';
      return '<div class="tg-col' + (plan.closed ? ' is-closed' : '') + '" style="height:' + height + 'px" data-col="' + ds + '">' + inner + '</div>';
    }).join('');
    var grid = '<div class="tg' + (days.length > 1 ? ' is-week' : '') + '" style="--cols:' + days.length + ';--h:' + H + 'px">' + head + hours + cols + '</div>';
    if (days.length > 1) {
      grid += '<div class="wk-list">' + days.map(function (ds) {
        var plan = BB.dayPlan(db, ds), list = BB.bookingsOn(db, ds).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
        return '<div class="wk-day"><h3><button type="button" class="inline-link" data-goto-day="' + ds + '">' + T.fmtDate(ds, { weekday: true }) + '</button><span class="small muted">' + (plan.closed ? plan.reason : list.length + ' foglalás') + '</span></h3>' +
          (list.length ? '<ul class="tl">' + list.map(tlItem).join('') + '</ul>' : '') + '</div>';
      }).join('') + '</div>';
    }
    return grid + '<p class="small muted" style="margin-top:12px">Csíkozott sáv a foglalás alján: pufferidő (előkészítés). Zöld csíkozás: szünet. A színek: arany = láb, zsálya = kéz.</p>';
  }

  function monthView() {
    var db = d(), p = T.parseIso(S.cur), first = new Date(p.getFullYear(), p.getMonth(), 1), start = T.addDays(first, -((first.getDay() + 6) % 7)), t0 = T.iso(T.today());
    var html = '<div class="month">' + ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'].map(function (x) { return '<div class="mh">' + x.slice(0, 3) + '</div>'; }).join('');
    for (var i = 0; i < 42; i++) {
      var x = T.addDays(start, i), ds = T.iso(x), plan = BB.dayPlan(db, ds), list = BB.bookingsOn(db, ds), w = workMins(db, ds), load = w ? Math.min(100, Math.round(bookedMins(db, ds) / w * 100)) : 0;
      html += '<button type="button" class="md' + (x.getMonth() !== p.getMonth() ? ' is-other' : '') + (ds === t0 ? ' is-today' : '') + (plan.closed ? ' is-closed' : '') + '" data-goto-day="' + ds + '" aria-label="' + T.fmtDate(ds, { weekday: true }) + ': ' + (plan.closed ? plan.reason : list.length + ' foglalás, ' + load + '% foglaltság') + '">' +
        '<b>' + x.getDate() + '</b>' + (plan.closed ? '<span class="cnt muted">' + plan.reason + '</span>' : (list.length ? '<span class="cnt">' + list.length + ' <span>foglalás</span></span>' : '')) +
        (plan.closed ? '' : '<span class="load" aria-hidden="true"><i style="width:' + load + '%"></i></span>') + '</button>';
    }
    return html + '</div>';
  }

  /* ---------- foglalás modál (új / szerkesztés) ---------- */
  function bookingModal(id, preset) {
    var b = id ? BB.getBooking(id) : null, svcs = BB.activeServices().filter(function (s) { return s.bookable; });
    preset = preset || {};
    var f = { serviceId: b ? b.serviceId : preset.serviceId || svcs[0].id, date: b ? b.date : preset.date || S.cur, start: b ? b.start : preset.start || '', name: b ? b.name : '', phone: b ? b.phone : '', email: b ? b.email : '', note: b ? b.note : '' };
    var ro = b && b.status === 'cancelled';
    var info = b ? '<dl class="kv"><dt>Azonosító</dt><dd>' + b.id + ' ' + src(b) + '</dd><dt>Állapot</dt><dd>' + (b.status === 'cancelled' ? '<span class="pill pill--x">Lemondva</span>' : b.status === 'completed' ? '<span class="pill">Lezajlott</span>' : '<span class="pill pill--ok">Visszaigazolva</span>') + '</dd>' +
      '<dt>Hírlevél</dt><dd>' + (b.marketing ? 'Hozzájárult' : 'Nem kért') + '</dd></dl>' : '';
    var body = info + '<form class="adm-form" id="bkf" novalidate>' +
      '<label class="full">Kezelés<select name="serviceId"' + (ro ? ' disabled' : '') + '>' + svcs.map(function (s) { return '<option value="' + s.id + '"' + (s.id === f.serviceId ? ' selected' : '') + '>' + esc(s.name) + ' — ' + s.mins + ' perc</option>'; }).join('') + '</select></label>' +
      '<label>Nap<input type="date" name="date" value="' + f.date + '"' + (ro ? ' disabled' : '') + '></label>' +
      '<label>Kezdés<select name="start"' + (ro ? ' disabled' : '') + '></select></label>' +
      '<label class="full">Vendég neve<input name="name" value="' + esc(f.name) + '" autocomplete="off"' + (ro ? ' disabled' : '') + '></label>' +
      '<label>Telefon<input name="phone" type="tel" value="' + esc(f.phone) + '" autocomplete="off"' + (ro ? ' disabled' : '') + '></label>' +
      '<label>E-mail <span class="muted">(nem kötelező)</span><input name="email" type="email" value="' + esc(f.email) + '" autocomplete="off"' + (ro ? ' disabled' : '') + '></label>' +
      '<label class="full">Megjegyzés<textarea name="note" rows="2" maxlength="300"' + (ro ? ' disabled' : '') + '>' + esc(f.note) + '</textarea></label>' +
      '<p class="full small muted" style="margin:0">Egészségügyi adatot ne rögzíts — a rendszer nem erre készült.</p>' +
      '<p class="form-err" id="bkfErr" role="alert"></p></form>';
    var foot = (b && !ro ? '<button type="button" class="btn danger btn--sm" data-cancel-bk>' + icon('trash') + 'Lemondás</button>' : '') +
      '<button type="button" class="btn btn--ghost btn--sm" data-close>' + (ro ? 'Bezárás' : 'Mégse') + '</button>' + (ro ? '' : '<button type="button" class="btn btn--sm" data-save-bk>' + (b ? 'Mentés' : 'Időpont rögzítése') + '</button>');
    openModal(b ? 'Foglalás — ' + esc(b.name) : 'Új időpont', body, foot, function (card) {
      var form = $('#bkf', card);
      function fill() {
        var sel = form.start, sid = form.serviceId.value, ds = form.date.value;
        if (!ds) { sel.innerHTML = '<option value="">Válassz napot</option>'; return; }
        var slots = BB.slots(ds, sid, { excludeId: id, ignoreLead: true, ignorePast: true });
        if (b && !ro && slots.indexOf(f.start) < 0 && ds === b.date && sid === b.serviceId) slots.unshift(f.start);
        var plan = BB.dayPlan(d(), ds);
        sel.innerHTML = slots.length ? slots.map(function (t) { return '<option' + (t === f.start ? ' selected' : '') + '>' + t + '</option>'; }).join('')
          : '<option value="">' + (plan.closed ? plan.reason + ' — nincs időpont' : 'Nincs szabad sáv') + '</option>';
      }
      fill();
      if (!ro) { form.serviceId.addEventListener('change', fill); form.date.addEventListener('change', function () { f.start = ''; fill(); }); }
      var save = $('[data-save-bk]', card);
      save && save.addEventListener('click', function () {
        var v = { serviceId: form.serviceId.value, date: form.date.value, start: form.start.value, name: form.name.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(), note: form.note.value.trim() };
        var err = $('#bkfErr', card);
        if (!v.start) { err.textContent = 'Válassz szabad kezdési időpontot.'; return; }
        if (v.name.length < 3) { err.textContent = 'Add meg a vendég nevét.'; form.name.focus(); return; }
        if (v.phone.replace(/\D/g, '').length < 9) { err.textContent = 'Adj meg érvényes telefonszámot.'; form.phone.focus(); return; }
        var r = b ? BB.updateBooking(id, v, { admin: true }) : BB.createBooking(v, { admin: true });
        if (!r.ok) { err.textContent = r.error === 'conflict' ? 'Ez az időpont ütközik egy másik foglalással vagy szünettel.' : r.error; return; }
        closeModal(); S.cur = v.date; render(); say(b ? 'Foglalás módosítva — értesítés szimulálva.' : 'Időpont rögzítve.');
      });
      var cb = $('[data-cancel-bk]', card);
      cb && cb.addEventListener('click', function () {
        if (cb.getAttribute('data-sure')) { BB.cancelBooking(id, 'admin'); closeModal(); render(); say('Foglalás lemondva — értesítés szimulálva.'); return; }
        cb.setAttribute('data-sure', '1'); cb.innerHTML = icon('alert') + 'Biztosan lemondod?';
      });
    });
  }

  /* ---------- szünet ---------- */
  function breakModal() {
    var body = '<form class="adm-form" id="brf"><label class="full">Nap<input type="date" name="date" value="' + S.cur + '"></label>' +
      '<label>Kezdete<input type="time" name="start" value="15:00" step="900"></label><label>Vége<input type="time" name="end" value="15:30" step="900"></label>' +
      '<label class="full">Megnevezés<input name="note" value="Szünet" maxlength="40"></label><p class="form-err" id="brErr" role="alert"></p></form>';
    openModal('Szünet beállítása', body, '<button type="button" class="btn btn--ghost btn--sm" data-close>Mégse</button><button type="button" class="btn btn--sm" id="brSave">Szünet mentése</button>', function (card) {
      $('#brSave', card).addEventListener('click', function () {
        var f = $('#brf', card), ds = f.date.value, s = T.toMin(f.start.value), e = T.toMin(f.end.value), err = $('#brErr', card), db = d();
        if (!ds || s == null || e == null || e <= s) { err.textContent = 'Adj meg érvényes kezdetet és véget.'; return; }
        var plan = BB.dayPlan(db, ds);
        if (plan.closed) { err.textContent = 'Ez a nap zárva van (' + plan.reason.toLowerCase() + ').'; return; }
        var hit = BB.bookingsOn(db, ds).filter(function (b) { var bs = T.toMin(b.start); return s < bs + b.mins && bs < e; });
        if (hit.length) { err.textContent = 'Ütközik: ' + hit.map(function (b) { return b.start + ' ' + b.name; }).join(', ') + '. Előbb tedd át ezt a foglalást.'; return; }
        db.extraBreaks.push({ id: 'b-' + Date.now(), date: ds, start: f.start.value, end: f.end.value, note: f.note.value || 'Szünet' });
        BB.save(db); closeModal(); S.cur = ds; if (S.view === 'month') S.view = 'day'; render(); say('Szünet rögzítve — erre a sávra nem lehet foglalni.');
      });
    });
  }

  /* ---------- lezárás / szabadság ---------- */
  function closureModal() {
    var db = d();
    var list = db.closures.slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; });
    var body = '<form class="adm-form" id="clf"><label class="full">Típus<select name="type"><option value="lezaras">Nap lezárása</option><option value="szabadsag">Szabadság</option></select></label>' +
      '<label>Ettől<input type="date" name="from" value="' + S.cur + '"></label><label>Eddig<input type="date" name="to" value="' + S.cur + '"></label>' +
      '<label class="full">Megjegyzés <span class="muted">(belső)</span><input name="note" maxlength="60" placeholder="pl. továbbképzés"></label><p class="form-err" id="clErr" role="alert"></p></form>' +
      '<h3 style="font-size:1rem;margin-top:18px">Rögzített lezárások</h3>' +
      (list.length ? '<ul class="closure-list">' + list.map(function (c) { return '<li><span>' + (c.type === 'szabadsag' ? 'Szabadság' : 'Lezárt nap') + ': ' + T.fmtShort(c.from) + (c.to !== c.from ? ' – ' + T.fmtShort(c.to) : '') + (c.note ? ' <span class="muted">· ' + esc(c.note) + '</span>' : '') + '</span><button type="button" class="inline-link" data-del-cl="' + c.id + '">Törlés</button></li>'; }).join('') + '</ul>' : '<p class="small muted">Még nincs.</p>');
    openModal('Lezárás és szabadság', body, '<button type="button" class="btn btn--ghost btn--sm" data-close>Bezárás</button><button type="button" class="btn btn--sm" id="clSave">Rögzítés</button>', function (card) {
      $('#clSave', card).addEventListener('click', function () {
        var f = $('#clf', card), err = $('#clErr', card), from = f.from.value, to = f.to.value || from, db2 = d();
        if (!from || to < from) { err.textContent = 'Adj meg érvényes időszakot.'; return; }
        var hit = db2.bookings.filter(function (b) { return active(b) && b.date >= from && b.date <= to; });
        if (hit.length) { err.textContent = 'Az időszakban ' + hit.length + ' aktív foglalás van (' + hit.slice(0, 3).map(function (b) { return T.fmtShort(b.date) + ' ' + b.start; }).join(', ') + (hit.length > 3 ? '…' : '') + '). Előbb tedd át vagy mondd le őket.'; return; }
        db2.closures.push({ id: 'c-' + Date.now(), from: from, to: to, type: f.type.value, note: f.note.value });
        BB.save(db2); closeModal(); render(); say(f.type.value === 'szabadsag' ? 'Szabadság rögzítve.' : 'Nap lezárva — online nem foglalható.');
      });
      card.addEventListener('click', function (e) {
        var x = e.target.closest('[data-del-cl]'); if (!x) return;
        var db3 = d(); db3.closures = db3.closures.filter(function (c) { return c.id !== x.getAttribute('data-del-cl'); }); BB.save(db3); closeModal(); closureModal(); render(); say('Lezárás törölve.');
      });
    });
  }

  /* ---------- munkaidő ---------- */
  function hoursModal() {
    var sc = JSON.parse(JSON.stringify(BB.schedule())), order = [1, 2, 3, 4, 5, 6, 0];
    var rows = order.map(function (wd) {
      var x = sc.days[wd] || { open: '09:00', close: '17:00', breakStart: '', breakEnd: '' }, on = !!sc.days[wd];
      return '<span>' + T.DAYS[wd].charAt(0).toUpperCase() + T.DAYS[wd].slice(1) + '</span><label class="switch"><input type="checkbox" data-wd="' + wd + '" name="on"' + (on ? ' checked' : '') + ' aria-label="' + T.DAYS[wd] + ' munkanap"></label>' +
        '<span class="hcell" style="display:contents"><input type="time" data-wd="' + wd + '" name="open" value="' + x.open + '" aria-label="' + T.DAYS[wd] + ' nyitás"><input type="time" data-wd="' + wd + '" name="close" value="' + x.close + '" aria-label="' + T.DAYS[wd] + ' zárás">' +
        '<input type="time" data-wd="' + wd + '" name="breakStart" value="' + (x.breakStart || '') + '" aria-label="' + T.DAYS[wd] + ' szünet kezdete"><input type="time" data-wd="' + wd + '" name="breakEnd" value="' + (x.breakEnd || '') + '" aria-label="' + T.DAYS[wd] + ' szünet vége"></span>';
    }).join('');
    var body = '<p class="small muted" style="margin-top:0">Bemutató munkarend — a valós beosztást Beatrix-szel egyeztetjük.</p><div class="hours-grid"><span class="hh">Nap</span><span class="hh">Nyitva</span><span class="hh">Kezdés</span><span class="hh">Zárás</span><span class="hh">Szünet</span><span class="hh">Szünet vége</span>' + rows + '</div>' +
      '<form class="adm-form" style="margin-top:18px;padding:0"><label class="wide">Kezdési időpontok lépésköze<select id="hStep"><option value="15"' + (sc.slotStep == 15 ? ' selected' : '') + '>15 perc</option><option value="30"' + (sc.slotStep == 30 ? ' selected' : '') + '>30 perc</option></select></label>' +
      '<label class="wide">Legkorábbi foglalás<select id="hLead"><option value="60"' + (sc.leadMinutes == 60 ? ' selected' : '') + '>1 órával előtte</option><option value="180"' + (sc.leadMinutes == 180 ? ' selected' : '') + '>3 órával előtte</option><option value="1440"' + (sc.leadMinutes == 1440 ? ' selected' : '') + '>1 nappal előtte</option></select></label></form>' +
      '<p class="form-err" id="hErr" role="alert"></p>';
    openModal('Munkaidő', body, '<button type="button" class="btn btn--ghost btn--sm" data-close>Mégse</button><button type="button" class="btn btn--sm" id="hSave">Mentés</button>', function (card) {
      $('#hSave', card).addEventListener('click', function () {
        var err = $('#hErr', card), days = {};
        for (var i = 0; i < 7; i++) {
          var on = $('input[name=on][data-wd="' + i + '"]', card).checked;
          if (!on) { days[i] = null; continue; }
          var g = function (n) { return $('input[name=' + n + '][data-wd="' + i + '"]', card).value; };
          var o = g('open'), c = g('close'), bs = g('breakStart'), be = g('breakEnd');
          if (!o || !c || o >= c) { err.textContent = T.DAYS[i] + ': a zárás legyen a nyitás után.'; return; }
          if ((bs && !be) || (!bs && be) || (bs && (bs >= be || bs < o || be > c))) { err.textContent = T.DAYS[i] + ': a szünet a munkaidőn belül legyen, kezdettel és véggel.'; return; }
          days[i] = { open: o, close: c, breakStart: bs || null, breakEnd: be || null };
        }
        var db = d();
        db.schedule = { days: days, slotStep: +$('#hStep', card).value, leadMinutes: +$('#hLead', card).value, horizonDays: BB.schedule().horizonDays };
        BB.save(db);
        /* figyelmeztetés: foglalások az új munkaidőn kívül */
        var t0 = T.iso(T.today()), out = db.bookings.filter(function (b) {
          if (!active(b) || b.date < t0) return false; var p = BB.dayPlan(db, b.date), s = T.toMin(b.start);
          return p.closed || s < p.open || s + b.mins > p.close;
        });
        closeModal(); render(); say(out.length ? 'Mentve. Figyelem: ' + out.length + ' meglévő foglalás kívül esik az új munkaidőn.' : 'Munkaidő mentve — a foglalás azonnal ehhez igazodik.');
      });
    });
  }

  /* ================= SZOLGÁLTATÁSOK ================= */
  function services() {
    var list = BB.services();
    view.innerHTML = top('Szolgáltatások', 'Név, leírás, ár, időtartam, pufferidő és foglalhatóság. A változás azonnal megjelenik a nyilvános oldalon és a foglalásban (ezen a böngészőn).') +
      '<div class="adm-banner">' + icon('info') + '<span>Kiindulás: a Notino-profil referenciaárai. A végleges árlistát Beatrix hagyja jóvá. A „Speciális lábápolás” telefonos egyeztetésű, online nem foglalható.</span></div>' +
      '<div class="svc-edit">' + list.map(function (s) {
        return '<details class="svc-row' + (s.active ? '' : ' is-off') + '" data-sid="' + s.id + '"><summary>' + UI.dial(s.mins) + '<div><b>' + esc(s.name) + '</b><span class="small muted">' + (s.active ? (s.bookable ? 'Aktív · online foglalható' : 'Aktív · csak telefonon') : 'Inaktív — nem látszik az oldalon') + '</span></div>' +
          '<span class="sv-price">' + esc(T.fmtPrice(s)) + '</span><span class="small muted">+' + s.buffer + ' p puffer</span><svg class="ico chev" aria-hidden="true"><use href="#i-chev"/></svg></summary>' +
          '<form class="adm-form" novalidate>' +
          '<label class="wide">Név<input name="name" value="' + esc(s.name) + '" maxlength="60"></label>' +
          '<label>Időtartam (perc)<input name="mins" type="number" min="15" max="240" step="5" value="' + (s.mins == null ? '' : s.mins) + '" placeholder="egyeztetés"></label>' +
          '<label>Pufferidő (perc)<input name="buffer" type="number" min="0" max="60" step="5" value="' + s.buffer + '"></label>' +
          '<label class="full">Rövid leírás<textarea name="desc" rows="2" maxlength="200">' + esc(s.desc) + '</textarea></label>' +
          '<label>Ár (Ft)<input name="price" type="number" min="0" step="100" value="' + (s.price == null ? '' : s.price) + '" placeholder="egyeztetés"></label>' +
          '<label>Ár felső értéke <span class="muted">(sáv)</span><input name="priceMax" type="number" min="0" step="100" value="' + (s.priceMax || '') + '"></label>' +
          '<label class="switch"><input type="checkbox" name="active"' + (s.active ? ' checked' : '') + '>Aktív</label>' +
          '<label class="switch"><input type="checkbox" name="bookable"' + (s.bookable ? ' checked' : '') + '>Online foglalható</label>' +
          '<p class="form-err" role="alert"></p>' +
          '<div class="row-acts"><button type="button" class="btn btn--ghost btn--sm" data-svc-reset>Alapérték</button><button type="button" class="btn btn--sm" data-svc-save>Mentés</button></div>' +
          '</form></details>';
      }).join('') + '</div>';
  }
  function saveService(row) {
    var id = row.getAttribute('data-sid'), f = $('form', row), err = $('.form-err', row);
    var num = function (n) { var v = f[n].value.trim(); return v === '' ? null : +v; };
    var o = { name: f.name.value.trim(), desc: f.desc.value.trim(), mins: num('mins'), buffer: num('buffer') || 0, price: num('price'), priceMax: num('priceMax'), active: f.active.checked, bookable: f.bookable.checked };
    if (o.name.length < 3) { err.textContent = 'A név túl rövid.'; return; }
    if (o.bookable && (o.mins == null || o.price == null)) { err.textContent = 'Online foglaláshoz időtartam és ár is kell. (Egyeztetéses kezelésnél kapcsold ki az online foglalhatóságot.)'; return; }
    if (o.mins != null && (o.mins < 15 || o.mins > 240)) { err.textContent = 'Az időtartam 15 és 240 perc között legyen.'; return; }
    if (o.priceMax != null && o.price != null && o.priceMax <= o.price) { err.textContent = 'A sáv felső értéke legyen nagyobb az árnál.'; return; }
    var base = BB.cfg.services.filter(function (s) { return s.id === id; })[0];
    o.phoneOnly = !o.bookable;
    if (!o.priceMax) o.priceMax = null;
    var db = d(); db.serviceOverrides[id] = o; BB.notify(db, 'change', 'Szolgáltatás módosítva: ' + o.name + ' (admin)'); BB.save(db);
    services(); say('Mentve — az árlista és a foglalás frissült.');
    var again = $('[data-sid="' + id + '"]'); again && (again.open = true);
    void base;
  }

  /* ================= VENDÉGEK ================= */
  function guestList() {
    var db = d(), map = {}, t0 = T.iso(T.today());
    db.bookings.forEach(function (b) {
      if (b.anonymized) return;
      var key = (b.phone || '').replace(/\D/g, '') || b.email || b.name;
      var g = map[key] || (map[key] = { key: key, name: b.name, phone: b.phone, email: b.email, ids: [], next: null, past: 0, total: 0 });
      g.ids.push(b.id); if (b.status === 'cancelled') return; g.total++;
      if (b.date >= t0) { if (!g.next || (b.date + b.start) < (g.next.date + g.next.start)) g.next = b; } else g.past++;
      if (b.email) g.email = b.email;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'hu'); });
  }
  function guests() {
    var all = guestList(), q = S.q.toLowerCase();
    var list = all.filter(function (g) { return !q || (g.name + ' ' + g.email + ' ' + g.phone).toLowerCase().indexOf(q) >= 0; });
    view.innerHTML = top('Vendégek', 'Csak a foglaláshoz szükséges adatok: név, e-mail, telefon. Egészségügyi előzményt a rendszer nem tárol.') +
      '<div class="cal-tools"><label class="search"><span class="sr-only">Keresés</span>' + icon('search') + '<input type="search" id="gq" placeholder="Keresés névre, e-mailre, telefonra" value="' + esc(S.q) + '"></label><span class="small muted">' + list.length + ' / ' + all.length + ' vendég</span></div>' +
      (list.length ? '<div class="panel" style="padding:0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Név</th><th>Elérhetőség</th><th>Következő időpont</th><th>Korábbi</th><th></th></tr></thead><tbody>' +
        list.map(function (g) {
          return '<tr><td><b>' + esc(g.name) + '</b></td><td>' + esc(g.phone) + '<br><span class="small muted">' + esc(g.email || '—') + '</span></td>' +
            '<td>' + (g.next ? '<button type="button" class="inline-link" data-open="' + g.next.id + '">' + T.fmtShort(g.next.date) + ' ' + g.next.start + '</button><br><span class="small muted">' + esc(svcName(g.next.serviceId)) + '</span>' : '<span class="muted">—</span>') + '</td>' +
            '<td>' + g.past + '</td><td style="white-space:nowrap"><button type="button" class="inline-link" data-g-edit="' + esc(g.key) + '">Helyesbítés</button> · <button type="button" class="inline-link" data-g-del="' + esc(g.key) + '" style="color:var(--err)">Adatok törlése</button></td></tr>';
        }).join('') + '</tbody></table></div></div>'
        : emptyBox('search', all.length ? 'Nincs találat' : 'Még nincs vendég', all.length ? 'Próbáld más kifejezéssel.' : 'Az első foglalással jelenik meg itt.')) +
      '<p class="small muted" style="margin-top:14px">Törlés: a vendég nevét és elérhetőségét minden foglalásnál anonimizálja (bemutató). Élesben a törlés és a helyesbítés naplózott, szerveroldali folyamat.</p>';
  }
  function guestEdit(key) {
    var g = guestList().filter(function (x) { return x.key === key; })[0]; if (!g) return;
    var body = '<form class="adm-form" id="gf"><label class="full">Név<input name="name" value="' + esc(g.name) + '"></label><label>Telefon<input name="phone" value="' + esc(g.phone) + '"></label><label>E-mail<input name="email" value="' + esc(g.email) + '"></label><p class="form-err" id="gErr" role="alert"></p></form><p class="small muted">A módosítás ' + g.ids.length + ' foglalásra vonatkozik.</p>';
    openModal('Adatok helyesbítése', body, '<button type="button" class="btn btn--ghost btn--sm" data-close>Mégse</button><button type="button" class="btn btn--sm" id="gSave">Mentés</button>', function (card) {
      $('#gSave', card).addEventListener('click', function () {
        var f = $('#gf', card); if (f.name.value.trim().length < 3) { $('#gErr', card).textContent = 'Add meg a nevet.'; return; }
        var db = d(); db.bookings.forEach(function (b) { if (g.ids.indexOf(b.id) >= 0) { b.name = f.name.value.trim(); b.phone = f.phone.value.trim(); b.email = f.email.value.trim(); } });
        BB.save(db); closeModal(); guests(); say('Vendégadatok helyesbítve.');
      });
    });
  }
  function guestDelete(key, btn) {
    if (!btn.getAttribute('data-sure')) { btn.setAttribute('data-sure', '1'); btn.textContent = 'Biztosan törlöd?'; return; }
    var g = guestList().filter(function (x) { return x.key === key; })[0]; if (!g) return;
    var db = d(); db.bookings.forEach(function (b) { if (g.ids.indexOf(b.id) >= 0) { b.name = 'Törölt vendég'; b.phone = ''; b.email = ''; b.note = ''; b.anonymized = true; } });
    BB.notify(db, 'change', 'Vendégadatok törölve (anonimizálva), ' + g.ids.length + ' foglalás'); BB.save(db); guests(); say('Vendégadatok törölve.');
  }

  /* ================= ÉRTESÍTÉSEK ================= */
  function notices() {
    var db = d(), f = S.nfilter, list = db.notifications.filter(function (n) { return f === 'all' || n.type === f; });
    var chips = [['all', 'Mind'], ['new', 'Új foglalás'], ['change', 'Módosítás'], ['cancel', 'Lemondás'], ['reminder', 'Emlékeztető'], ['failed', 'Sikertelen küldés']];
    view.innerHTML = top('Értesítések', 'Minden értesítés szimulált — a bemutató nem küld e-mailt vagy SMS-t.', '<button type="button" class="btn btn--ghost btn--sm" data-sim-rem>' + icon('bell') + 'Holnapi emlékeztetők szimulálása</button>') +
      '<div class="chips chips--scroll" role="group" aria-label="Szűrés">' + chips.map(function (c) { return '<button type="button" class="chip" data-nf="' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<section class="panel">' + (list.length ? '<ul class="notes-list">' + list.map(noteItem).join('') + '</ul>' : emptyBox('bell', 'Nincs ilyen értesítés', 'Ebben a kategóriában még nem történt semmi.')) + '</section>';
  }
  function simReminders() {
    var db = d(), tm = T.iso(T.addDays(T.today(), 1)), list = BB.bookingsOn(db, tm);
    if (!list.length) { say('Holnapra nincs foglalás — nincs mit kiküldeni.'); return; }
    list.forEach(function (b) {
      if (!b.email) BB.notify(db, 'failed', 'Emlékeztető nem ment ki: ' + b.name + ' (nincs e-mail-cím) — szimulált hiba');
      else BB.notify(db, 'reminder', 'Emlékeztető: ' + b.name + ' — ' + svcName(b.serviceId) + ', holnap ' + b.start + ' (szimulált küldés)');
    });
    BB.save(db); notices(); renderTabs(); say(list.length + ' emlékeztető szimulálva.');
  }

  /* ================= BEÁLLÍTÁSOK ================= */
  function settings() {
    var loc = BB.location(), C = BB.cfg;
    view.innerHTML = top('Beállítások', 'Üzleti adatok és a bemutató kezelése.') +
      '<section class="panel"><div class="panel-h"><h2>Helyszín</h2><span class="tag">Ügyféllel egyeztetendő</span></div>' +
      '<p class="small muted">Két nyilvános cím ismert, egyik sincs megerősítve. Az éles oldalon a cím a <code>js/config.js</code> fájlban állítható; itt kipróbálhatod, hogyan frissül mindenhol.</p>' +
      '<form class="adm-form" style="padding:0"><label class="wide">Megjelenített helyszín<select id="locSel">' + Object.keys(C.locations).map(function (k) { var l = C.locations[k]; return '<option value="' + k + '"' + (k === loc.key ? ' selected' : '') + '>' + l.line2 + ', ' + l.line1 + ' (' + l.source + ')</option>'; }).join('') + '</select></label></form></section>' +
      '<section class="panel"><div class="panel-h"><h2>Elérhetőség</h2></div><dl class="kv"><dt>Telefon</dt><dd>' + C.phone.display + '</dd><dt>E-mail</dt><dd><span class="muted">Ügyféltől bekérendő</span></dd><dt>Nyitvatartás</dt><dd>' + C.openingNote + '</dd></dl></section>' +
      '<section class="panel"><div class="panel-h"><h2>Foglalási szabályok</h2><button type="button" class="btn btn--ghost btn--sm" data-hours>' + icon('clock') + 'Munkaidő szerkesztése</button></div>' +
      '<dl class="kv"><dt>Lépésköz</dt><dd>' + BB.schedule().slotStep + ' perc</dd><dt>Előfoglalás</dt><dd>legalább ' + BB.schedule().leadMinutes / 60 + ' órával előtte</dd><dt>Előre</dt><dd>' + BB.schedule().horizonDays + ' napra</dd><dt>Puffer</dt><dd>kezelésenként, a Szolgáltatásoknál</dd></dl></section>' +
      '<section class="panel"><div class="panel-h"><h2>Bemutató adatok</h2></div><p class="small muted">A demó a böngésző helyi tárolóját használja — nem központi adatbázis.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn--ghost btn--sm" data-reset>' + icon('refresh') + 'Mintaadatok visszaállítása</button><button type="button" class="btn btn--ghost btn--sm danger" data-empty>Üres naptár kipróbálása</button></div></section>';
  }

  /* ---------- események ---------- */
  function bind() {
    $('#admTabs').addEventListener('click', function (e) { var t = e.target.closest('[data-tab]'); if (t) { S.tab = t.getAttribute('data-tab'); render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); } });
    $('#admTabs').addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
      e.preventDefault(); var tabs = $$('.adm-tab'), i = tabs.indexOf(document.activeElement), j = (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[j].focus();
    });
    view.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-tab]'))) { S.tab = t.getAttribute('data-tab'); render(); return; }
      if ((t = e.target.closest('[data-open]'))) { bookingModal(t.getAttribute('data-open')); return; }
      if ((t = e.target.closest('[data-new]'))) { bookingModal(null, { date: S.cur < T.iso(T.today()) ? T.iso(T.today()) : S.cur }); return; }
      if ((t = e.target.closest('[data-goto-day]'))) { S.cur = t.getAttribute('data-goto-day'); S.view = 'day'; S.tab = 'naptar'; render(); return; }
      if ((t = e.target.closest('[data-view]'))) { S.view = t.getAttribute('data-view'); render(); $('[data-view="' + S.view + '"]').focus(); return; }
      if ((t = e.target.closest('[data-step]'))) {
        var n = +t.getAttribute('data-step'), x = T.parseIso(S.cur);
        S.cur = S.view === 'day' ? T.iso(T.addDays(x, n)) : S.view === 'week' ? T.iso(T.addDays(x, 7 * n)) : T.iso(new Date(x.getFullYear(), x.getMonth() + n, 1));
        render(); $('[data-step="' + n + '"]').focus(); return;
      }
      if (e.target.closest('[data-today]')) { S.cur = T.iso(T.today()); render(); return; }
      if (e.target.closest('[data-break]')) { breakModal(); return; }
      if (e.target.closest('[data-close-day]')) { closureModal(); return; }
      if (e.target.closest('[data-hours]')) { hoursModal(); return; }
      if ((t = e.target.closest('[data-del-break]'))) { var db = d(); db.extraBreaks = db.extraBreaks.filter(function (b) { return b.id !== t.getAttribute('data-del-break'); }); BB.save(db); render(); say('Szünet törölve.'); return; }
      if ((t = e.target.closest('[data-svc-save]'))) { saveService(t.closest('.svc-row')); return; }
      if ((t = e.target.closest('[data-svc-reset]'))) { var id = t.closest('.svc-row').getAttribute('data-sid'), db2 = d(); delete db2.serviceOverrides[id]; BB.save(db2); services(); say('Alapértékek visszaállítva.'); return; }
      if ((t = e.target.closest('[data-g-edit]'))) { guestEdit(t.getAttribute('data-g-edit')); return; }
      if ((t = e.target.closest('[data-g-del]'))) { guestDelete(t.getAttribute('data-g-del'), t); return; }
      if ((t = e.target.closest('[data-nf]'))) { S.nfilter = t.getAttribute('data-nf'); notices(); $('[data-nf="' + S.nfilter + '"]').focus(); return; }
      if (e.target.closest('[data-sim-rem]')) { simReminders(); return; }
      if ((t = e.target.closest('[data-reset]'))) { if (!t.getAttribute('data-sure')) { t.setAttribute('data-sure', 1); t.textContent = 'Biztosan? Minden demóváltozás elvész'; return; } BB.reset(); render(); say('Mintaadatok visszaállítva.'); return; }
      if ((t = e.target.closest('[data-empty]'))) { var db3 = d(); db3.bookings = []; db3.notifications = []; BB.save(db3); render(); say('Minden foglalás törölve — üres állapot.'); return; }
      /* napi nézet: kattintás üres sávra → új időpont */
      if ((t = e.target.closest('.tg-col')) && S.view === 'day' && !e.target.closest('.tg-ev, .tg-break')) {
        var R = range(), y = e.clientY - t.getBoundingClientRect().top, m = R.start + Math.floor(y / 54 * 60 / 30) * 30;
        bookingModal(null, { date: t.getAttribute('data-col'), start: T.fromMin(m) });
      }
    });
    view.addEventListener('input', function (e) { if (e.target.id === 'gq') { S.q = e.target.value; var pos = e.target.selectionStart; guests(); var q = $('#gq'); q.focus(); q.setSelectionRange(pos, pos); } });
    view.addEventListener('change', function (e) {
      if (e.target.id === 'locSel') { var db = d(); db.location = e.target.value; BB.save(db); say('Helyszín frissítve — a nyilvános oldalon is.'); }
      if (e.target.closest('.svc-row') && e.target.type === 'checkbox') { /* csak mentéskor érvényes */ }
    });
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') {
        var f = $$('button, input, select, textarea, a[href]', modal).filter(function (x) { return !x.disabled && x.offsetParent !== null; }), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('storage', function () { render(); });
  }

  function init() {
    view = $('#admView'); toast = $('#admToast'); modal = $('#admModal');
    bind(); render();
  }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
