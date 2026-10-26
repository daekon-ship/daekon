/* ==========================================================================
   BB foglalás — vendégoldali, 6 lépéses folyamat (BEMUTATÓ)
   ========================================================================== */
(function () {
  'use strict';
  var BB = window.BB, T = BB.t, esc = T.esc, UI = window.BBUI;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STEPS = ['Kezelés', 'Nap', 'Időpont', 'Adatok', 'Összesítés', 'Kész'];
  var params = new URLSearchParams(location.search);
  var st = {
    step: 0, reached: 0, cat: params.get('kategoria') || 'all', serviceId: null,
    month: null, date: null, time: null, modifyId: null, done: null,
    form: { name: '', email: '', phone: '', note: '', privacy: false, marketing: false }, errors: {}
  };

  var host, live, sumEl, navBack, navNext, mSum;

  function svc() { return st.serviceId ? BB.service(st.serviceId) : null; }
  function endTime(start, mins) { return T.fromMin(T.toMin(start) + mins); }
  function announce(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }

  /* ---------- lépésjelző ---------- */
  function renderStepper() {
    $('#bkSteps').innerHTML = STEPS.map(function (s, i) {
      var state = i === st.step ? 'current' : (i < st.step || i <= st.reached) && st.step !== 5 && i < 5 ? 'done' : 'todo';
      var can = i <= st.reached && i !== st.step && st.step !== 5 && i < 5;
      return '<li class="is-' + state + '">' + (can
        ? '<button type="button" data-goto="' + i + '"><span class="n">' + (i + 1) + '</span><span class="l">' + s + '</span></button>'
        : '<span' + (i === st.step ? ' aria-current="step"' : '') + '><span class="n">' + (i < st.step ? '✓' : i + 1) + '</span><span class="l">' + s + '</span></span>') + '</li>';
    }).join('');
    $('#bkProgress').style.setProperty('--p', (st.step / 5));
  }

  /* ---------- összesítő oldalsáv ---------- */
  function renderSummary() {
    var s = svc(), loc = BB.location();
    var rows = [
      ['Kezelés', s ? esc(s.name) : '<span class="muted">Még nincs kiválasztva</span>'],
      ['Nap', st.date ? T.fmtDate(st.date, { weekday: true }) : '<span class="muted">—</span>'],
      ['Időpont', st.time && s ? st.time + ' – ' + endTime(st.time, s.mins) : '<span class="muted">—</span>'],
      ['Időtartam', s ? T.fmtMins(s.mins) : '<span class="muted">—</span>'],
      ['Ár', s ? esc(T.fmtPrice(s)) + (s.priceMax ? '<small>egyeztetéstől függ</small>' : '') : '<span class="muted">—</span>'],
      ['Helyszín', esc(loc.line2 + ', ' + loc.line1) + (loc.confirmed ? '' : '<small>egyeztetés alatt</small>')]
    ];
    sumEl.innerHTML = '<div class="sum-head">' + (s ? UI.dial(s.mins, 'lg') : UI.dial(null, 'lg')) + '<div><p class="eyebrow eyebrow--plain">' + (st.modifyId ? 'Foglalás módosítása' : 'A foglalásod') + '</p><b>' + (s ? esc(s.name) : 'Válassz kezelést') + '</b></div></div>' +
      '<dl>' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
      '<p class="sum-note">' + UI.icon('info') + '<span>Bemutató — valódi időpont nem kerül rögzítésre.</span></p>';
    /* mobil alsó sáv */
    var bits = [];
    if (s) bits.push(esc(s.name));
    if (st.date) bits.push(T.fmtShort(st.date));
    if (st.time) bits.push(st.time);
    mSum.innerHTML = bits.length ? bits.join(' · ') : 'Válassz kezelést';
  }

  /* ---------- 1. kezelés ---------- */
  function stepService() {
    var cats = [['all', 'Mind'], ['pedikur', 'Pedikűr és láb'], ['manikur', 'Manikűr és kéz'], ['specialis', 'Speciális']];
    var list = BB.activeServices().filter(function (s) { return st.cat === 'all' || s.cat === st.cat; });
    var html = '<h2 tabindex="-1">Melyik kezelést választod?</h2><p class="muted">Ár és időtartam minden kezelésnél — később is módosíthatod.</p>' +
      '<div class="chips chips--scroll" role="group" aria-label="Szűrés">' + cats.map(function (c) {
        return '<button type="button" class="chip" data-cat="' + c[0] + '" aria-pressed="' + (st.cat === c[0]) + '">' + c[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="pick-list" role="radiogroup" aria-label="Kezelések">' + (list.length ? list.map(function (s) {
        var on = st.serviceId === s.id;
        return '<button type="button" role="radio" aria-checked="' + on + '" class="pick' + (on ? ' is-on' : '') + '" data-svc="' + s.id + '">' +
          UI.dial(s.mins) + '<span class="pick-body"><b>' + esc(s.name) + '</b><span>' + esc(s.desc) + '</span></span>' +
          '<span class="pick-meta"><b>' + esc(T.fmtPrice(s)) + '</b><span>' + (s.phoneOnly ? 'telefonos egyeztetés' : s.mins + ' perc') + '</span></span>' +
          '<span class="pick-check" aria-hidden="true">' + UI.icon('check') + '</span></button>';
      }).join('') : '<p class="empty">Ebben a kategóriában most nincs foglalható kezelés.</p>') + '</div>';
    var s = svc();
    if (s && s.priceMax) html += '<p class="note">' + UI.icon('info') + '<span>' + esc(s.priceNote) + '</span></p>';
    if (s && s.phoneOnly) {
      html += '<div class="phone-panel">' + UI.icon('phone') + '<div><h3>Ezt a kezelést telefonon egyeztetjük</h3><p>Online nem kérünk egészségügyi adatot, ezért a speciális lábápolást előbb személyesen beszéljük át. Az időpontot is ekkor egyeztetjük.</p>' +
        '<a class="btn" data-tel href="tel:' + BB.cfg.phone.tel + '">' + UI.icon('phone') + BB.cfg.phone.display + '</a></div></div>';
    }
    return html;
  }

  /* ---------- 2. nap ---------- */
  function stepDate() {
    var s = svc(), t0 = T.today();
    if (!st.month) { var base = st.date ? T.parseIso(st.date) : (BB.nextAvailable(s.id, null, { excludeId: st.modifyId }) ? T.parseIso(BB.nextAvailable(s.id, null, { excludeId: st.modifyId })) : t0); st.month = new Date(base.getFullYear(), base.getMonth(), 1); }
    var m = st.month, first = new Date(m.getFullYear(), m.getMonth(), 1);
    var lead = (first.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    var minMonth = new Date(t0.getFullYear(), t0.getMonth(), 1);
    var maxD = T.addDays(t0, BB.schedule().horizonDays), maxMonth = new Date(maxD.getFullYear(), maxD.getMonth(), 1);
    var cells = '';
    for (var i = 0; i < lead; i++) cells += '<span class="cal-pad" aria-hidden="true"></span>';
    for (var d = 1; d <= days; d++) {
      var ds = T.iso(new Date(m.getFullYear(), m.getMonth(), d));
      var stt = BB.dayStatus(ds, s.id, { excludeId: st.modifyId });
      var ok = stt.state === 'open' || stt.state === 'few';
      var cls = 'cal-d is-' + stt.state + (ds === T.iso(t0) ? ' is-today' : '') + (ds === st.date ? ' is-sel' : '');
      var lbl = T.fmtDate(ds, { weekday: true }) + ' — ' + stt.label + (ds === T.iso(t0) ? ', ma' : '');
      cells += '<button type="button" class="' + cls + '" data-date="' + ds + '" aria-label="' + lbl + '"' + (ok ? '' : ' aria-disabled="true"') + (ds === st.date ? ' aria-pressed="true"' : '') + ' tabindex="-1">' +
        '<span>' + d + '</span>' + (stt.state === 'few' ? '<i aria-hidden="true"></i>' : '') + '</button>';
    }
    var next = BB.nextAvailable(s.id, null, { excludeId: st.modifyId });
    return '<h2 tabindex="-1">Melyik napon?</h2><p class="muted">' + esc(s.name) + ' · ' + s.mins + ' perc. A halvány napokon nincs olyan szabad sáv, amelybe a kezelés belefér.</p>' +
      '<div class="cal">' +
      '<div class="cal-head"><button type="button" class="cal-nav" data-month="-1" aria-label="Előző hónap"' + (m <= minMonth ? ' disabled' : '') + '>' + UI.icon('chev-l') + '</button>' +
      '<h3 aria-live="polite">' + m.getFullYear() + '. ' + T.MONTHS[m.getMonth()] + '</h3>' +
      '<button type="button" class="cal-nav" data-month="1" aria-label="Következő hónap"' + (m >= maxMonth ? ' disabled' : '') + '>' + UI.icon('chev-r') + '</button></div>' +
      '<div class="cal-wd" aria-hidden="true"><span>H</span><span>K</span><span>Sze</span><span>Cs</span><span>P</span><span>Szo</span><span>V</span></div>' +
      '<div class="cal-grid" role="group" aria-label="Napok — a nyilakkal is lépkedhetsz">' + cells + '</div>' +
      '<div class="cal-legend"><span><i class="lg-open"></i>Van szabad időpont</span><span><i class="lg-few"></i>Kevés hely</span><span><i class="lg-full"></i>Betelt</span><span><i class="lg-closed"></i>Zárva / szabadság</span></div>' +
      '</div>' +
      (next ? '<p class="note">' + UI.icon('calendar') + '<span>Legközelebbi szabad nap: <button type="button" class="inline-link" data-date-jump="' + next + '">' + T.fmtDate(next, { weekday: true }) + '</button></span></p>'
        : '<p class="note">' + UI.icon('alert') + '<span>A következő ' + BB.schedule().horizonDays + ' napban nincs szabad hely erre a kezelésre — hívj, hátha akad megoldás.</span></p>');
  }

  /* ---------- 3. időpont ---------- */
  function stepTime() {
    var s = svc(), slots = BB.slots(st.date, s.id, { excludeId: st.modifyId });
    var groups = [['Délelőtt', 0, 720], ['Kora délután', 720, 900], ['Késő délután', 900, 1440]];
    var html = '<h2 tabindex="-1">Mikor kezdjünk?</h2><p class="muted">' + T.fmtDate(st.date, { weekday: true }) + ' · <button type="button" class="inline-link" data-goto="1">másik nap</button></p>';
    if (!slots.length) {
      var nx = BB.nextAvailable(s.id, T.iso(T.addDays(T.parseIso(st.date), 1)), { excludeId: st.modifyId });
      return html + '<div class="empty">' + UI.icon('calendar') + '<h3>Erre a napra már nincs szabad időpont</h3><p>Közben valaki lefoglalhatta, vagy a kezelés már nem fér bele a nap hátralévő részébe.</p>' +
        (nx ? '<button type="button" class="btn btn--ghost btn--sm" data-date-jump="' + nx + '">Legközelebbi: ' + T.fmtShort(nx) + '</button>' : '') + '</div>';
    }
    groups.forEach(function (g) {
      var items = slots.filter(function (t) { var m = T.toMin(t); return m >= g[1] && m < g[2]; });
      if (!items.length) return;
      html += '<div class="slot-group"><h3>' + g[0] + '</h3><div class="slots" role="radiogroup" aria-label="' + g[0] + ' időpontok">' + items.map(function (t) {
        var on = st.time === t;
        return '<button type="button" role="radio" aria-checked="' + on + '" class="slot' + (on ? ' is-on' : '') + '" data-time="' + t + '" aria-label="' + t + ' kezdés, vége ' + endTime(t, s.mins) + '"><b>' + t + '</b><span>– ' + endTime(t, s.mins) + '</span></button>';
      }).join('') + '</div></div>';
    });
    html += '<p class="note">' + UI.icon('clock') + '<span>Csak olyan kezdést kínálunk, amelybe a teljes kezelés és ' + s.buffer + ' perc előkészítés belefér, és nem ütközik más foglalással vagy szünettel. <b>A szabad időpontok bemutató adatok.</b></span></p>';
    return html;
  }

  /* ---------- 4. adatok ---------- */
  function field(id, label, type, attrs, help) {
    var err = st.errors[id];
    return '<div class="fld' + (err ? ' has-err' : '') + '"><label for="f-' + id + '">' + label + '</label>' +
      '<input id="f-' + id + '" name="' + id + '" type="' + type + '" value="' + esc(st.form[id]) + '" ' + attrs + (err ? ' aria-invalid="true"' : '') + ' aria-describedby="' + (help ? 'h-' + id + ' ' : '') + 'e-' + id + '">' +
      (help ? '<small id="h-' + id + '">' + help + '</small>' : '') + '<p class="err" id="e-' + id + '">' + (err || '') + '</p></div>';
  }
  function stepForm() {
    var keys = Object.keys(st.errors);
    return '<h2 tabindex="-1">Kinek foglaljuk?</h2><p class="muted">Csak a foglaláshoz szükséges adatokat kérjük. Regisztráció nem kell.</p>' +
      (keys.length ? '<div class="err-sum" role="alert" tabindex="-1" id="errSum"><b>Kérjük, javítsd a következőket:</b><ul>' + keys.map(function (k) { return '<li><a href="#f-' + k + '">' + esc(st.errors[k]) + '</a></li>'; }).join('') + '</ul></div>' : '') +
      '<form id="bkForm" novalidate>' +
      field('name', 'Teljes név', 'text', 'autocomplete="name" required maxlength="80"') +
      '<div class="fld-row">' + field('email', 'E-mail-cím', 'email', 'autocomplete="email" required inputmode="email" maxlength="120"', 'Ide küldenénk a visszaigazolást.') +
      field('phone', 'Telefonszám', 'tel', 'autocomplete="tel" required inputmode="tel" maxlength="20" placeholder="+36 30 123 4567"', 'Csak a foglalással kapcsolatban hívunk.') + '</div>' +
      '<div class="fld"><label for="f-note">Megjegyzés <span class="muted">(nem kötelező)</span></label><textarea id="f-note" name="note" rows="3" maxlength="300" aria-describedby="h-note">' + esc(st.form.note) + '</textarea>' +
      '<small id="h-note">Pl. „géllakk van a körmömön”. Kérjük, egészségügyi adatot ne írj ide — speciális igény esetén inkább <a data-tel href="tel:' + BB.cfg.phone.tel + '">hívj</a>.</small></div>' +
      '<div class="chk' + (st.errors.privacy ? ' has-err' : '') + '"><input type="checkbox" id="f-privacy" name="privacy"' + (st.form.privacy ? ' checked' : '') + ' aria-describedby="e-privacy"' + (st.errors.privacy ? ' aria-invalid="true"' : '') + '><label for="f-privacy">Elolvastam az <a href="adatkezeles.html" target="_blank" rel="noopener">adatkezelési tájékoztatót</a>, és hozzájárulok, hogy a foglaláshoz megadott adataimat erre a célra kezeljék. <span class="req">*</span></label><p class="err" id="e-privacy">' + (st.errors.privacy || '') + '</p></div>' +
      '<div class="chk"><input type="checkbox" id="f-marketing" name="marketing"' + (st.form.marketing ? ' checked' : '') + '><label for="f-marketing">Kérek időnként hírt az újdonságokról és akciókról e-mailben. <span class="muted">(Nem kötelező, bármikor visszavonható.)</span></label></div>' +
      '<p class="small muted">A * jelölésű mezők kötelezők. Születési dátumot vagy egészségügyi adatot nem kérünk.</p>' +
      '</form>';
  }

  function validate() {
    var f = st.form, e = {};
    if (f.name.trim().length < 3) e.name = 'Add meg a teljes neved.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Adj meg egy érvényes e-mail-címet (pl. nev@pelda.hu).';
    var digits = f.phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 13) e.phone = 'Adj meg egy érvényes telefonszámot, körzetszámmal.';
    if (!f.privacy) e.privacy = 'A foglaláshoz el kell fogadnod az adatkezelési tájékoztatót.';
    st.errors = e;
    return !Object.keys(e).length;
  }

  /* ---------- 5. összesítés ---------- */
  function stepReview() {
    var s = svc(), loc = BB.location();
    var rows = [
      ['Kezelés', esc(s.name), 0], ['Nap', T.fmtDate(st.date, { weekday: true }), 1],
      ['Kezdés', st.time + ' <span class="muted">(vége kb. ' + endTime(st.time, s.mins) + ')</span>', 2],
      ['Időtartam', s.mins + ' perc', 0], ['Ár', esc(T.fmtPrice(s)) + (s.priceNote ? '<br><small class="muted">' + esc(s.priceNote) + '</small>' : ''), 0],
      ['Helyszín', esc(loc.line2 + ', ' + loc.line1) + (loc.confirmed ? '' : ' <span class="tag">Egyeztetés alatt</span>'), null],
      ['Név', esc(st.form.name), 3], ['Elérhetőség', esc(st.form.email) + '<br>' + esc(st.form.phone), 3]
    ];
    if (st.form.note) rows.push(['Megjegyzés', esc(st.form.note), 3]);
    return '<h2 tabindex="-1">Minden rendben?</h2><p class="muted">Nézd át, és ha kell, módosíts bármelyik sort.</p>' +
      '<dl class="review">' + rows.map(function (r) {
        return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>' + (r[2] != null ? '<button type="button" class="inline-link" data-goto="' + r[2] + '" aria-label="' + r[0] + ' módosítása">Módosítás</button>' : '<span></span>') + '</div>';
      }).join('') + '</dl>' +
      '<p class="note">' + UI.icon('info') + '<span>A lemondási és módosítási szabályok egyeztetés alatt — <a href="feltetelek.html" target="_blank" rel="noopener">feltételek</a>. Fizetés a helyszínen.</span> <span class="tag">Megerősítendő</span></p>' +
      '<div class="demo-box">' + UI.icon('alert') + '<p><b>Bemutató foglalás.</b> A gomb megnyomásával nem kerül rögzítésre valódi időpont, és nem megy ki üzenet. Az adat csak ebben a böngészőben marad.</p></div>' +
      '<p id="reviewErr" class="err" role="alert"></p>';
  }

  /* ---------- 6. kész ---------- */
  function stepDone() {
    var b = st.done, s = BB.service(b.serviceId), loc = BB.location();
    return '<div class="done">' +
      '<div class="done-mark" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="none" stroke="var(--line-2)" stroke-width="1"/><circle class="done-ring" cx="40" cy="40" r="36" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round"/><path class="done-tick" d="M27 41l9 9 17-19" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<p class="eyebrow eyebrow--plain">' + (st.modifyId ? 'Foglalás módosítva' : 'Foglalás elküldve') + '</p>' +
      '<h2 tabindex="-1">Köszönöm, <em>' + esc(b.name.split(' ').slice(-1)[0]) + '</em>!</h2>' +
      '<p class="demo-flag" role="status">' + UI.icon('alert') + '<b>Bemutató foglalás – valódi időpont nem került rögzítésre.</b></p>' +
      '<div class="ticket"><div class="ticket-top"><span>Foglalási azonosító</span><b>' + b.id + '</b></div>' +
      '<dl><dt>Kezelés</dt><dd>' + esc(s.name) + '</dd><dt>Időpont</dt><dd>' + T.fmtDate(b.date, { weekday: true }) + ', ' + b.start + '–' + endTime(b.start, b.mins) + '</dd>' +
      '<dt>Ár</dt><dd>' + esc(T.fmtPrice(s)) + '</dd><dt>Helyszín</dt><dd>' + esc(loc.line2 + ', ' + loc.line1) + '</dd></dl></div>' +
      '<div class="done-acts">' +
      '<button type="button" class="btn btn--ghost btn--sm" id="icsBtn">' + UI.icon('download') + 'Naptárfájl (.ics)</button>' +
      '<a class="btn btn--ghost btn--sm" href="foglalas.html?foglalas=' + b.id + '#kezeles">' + UI.icon('edit') + 'Módosítás vagy lemondás</a>' +
      '<a class="btn btn--sm" href="admin.html?nap=' + b.date + '">Megnézem az admin demóban</a></div>' +
      '<div class="planned"><h3>Az éles rendszerben ezután:</h3><ul>' +
      '<li>' + UI.icon('mail') + 'visszaigazoló e-mail a foglalási azonosítóval</li><li>' + UI.icon('calendar') + 'naptármeghívó csatolva</li>' +
      '<li>' + UI.icon('bell') + 'emlékeztető a kezelés előtt</li><li>' + UI.icon('edit') + 'biztonságos, egyedi link a módosításhoz és lemondáshoz</li></ul></div>' +
      '</div>';
  }

  /* ---------- rajzolás ---------- */
  var RENDER = [stepService, stepDate, stepTime, stepForm, stepReview, stepDone];
  function canNext() {
    var s = svc();
    switch (st.step) {
      case 0: return !!(s && s.bookable && !s.phoneOnly);
      case 1: return !!st.date;
      case 2: return !!st.time;
      default: return true;
    }
  }
  function render(focus) {
    renderStepper(); renderSummary();
    host.innerHTML = RENDER[st.step]();
    host.setAttribute('data-step', st.step);
    if (!reduce) { if (window.BBFX) BBFX.step(host); else { host.classList.remove('is-anim'); void host.offsetWidth; host.classList.add('is-anim'); } }
    var last = st.step === 5;
    $('#bkNav').hidden = last;
    $('#bkMobile').hidden = last;
    navBack.hidden = st.step === 0;
    var nl = st.step === 4 ? (st.modifyId ? 'Módosítás mentése (bemutató)' : 'Foglalás véglegesítése (bemutató)') : st.step === 3 ? 'Tovább az összesítéshez' : 'Tovább';
    [navNext, $('#bkMNext')].forEach(function (b) { b.textContent = nl; b.setAttribute('aria-disabled', canNext() ? 'false' : 'true'); });
    $('#bkMNext').textContent = st.step === 4 ? 'Véglegesítés' : 'Tovább';
    /* naptár: roving tabindex */
    var sel = $('.cal-d.is-sel', host) || $('.cal-d.is-open, .cal-d.is-few', host);
    if (sel) sel.tabIndex = 0;
    window.BBArt && window.BBArt.mount(host);
    if (st.step === 5 && !reduce) { if (window.BBFX) BBFX.done($('.done', host)); else $('.done', host).classList.add('is-anim'); }
    if (focus !== false) {
      var h = st.step === 3 && $('#errSum', host) ? $('#errSum', host) : $('h2', host);
      if (h) h.focus({ preventScroll: true });
      var top = $('.bk-head').getBoundingClientRect().bottom;
      if (top < 0 || $('#bkMain').getBoundingClientRect().top < 0) $('#bkMain').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function go(n) {
    st.step = n; st.reached = Math.max(st.reached, n);
    render();
    announce(n + 1 + '. lépés: ' + STEPS[n]);
  }

  function readForm() {
    var f = $('#bkForm'); if (!f) return;
    st.form.name = f.name.value; st.form.email = f.email.value; st.form.phone = f.phone.value;
    st.form.note = f.note.value; st.form.privacy = f.privacy.checked; st.form.marketing = f.marketing.checked;
  }

  function next() {
    if (!canNext()) {
      var msg = st.step === 0 ? 'Válassz egy online foglalható kezelést.' : st.step === 1 ? 'Válassz egy napot.' : 'Válassz egy kezdési időpontot.';
      announce(msg); flash(msg); return;
    }
    if (st.step === 3) {
      readForm();
      if (!validate()) { render(); announce('A foglaláshoz javítani kell néhány mezőt.'); return; }
    }
    if (st.step === 4) return submit();
    go(st.step + 1);
  }

  function flash(msg) {
    var n = $('#bkFlash'); n.textContent = msg; n.classList.add('is-on'); if (window.BBFX) BBFX.toast(n);
    clearTimeout(flash.t); flash.t = setTimeout(function () { n.classList.remove('is-on'); }, 2600);
  }

  function submit() {
    var payload = { serviceId: st.serviceId, date: st.date, start: st.time, name: st.form.name.trim(), email: st.form.email.trim(), phone: st.form.phone.trim(), note: st.form.note.trim(), marketing: st.form.marketing };
    var r = st.modifyId ? BB.updateBooking(st.modifyId, payload) : BB.createBooking(payload);
    if (!r.ok) {
      if (r.error === 'conflict') {
        st.time = null; st.reached = 2; go(2);
        flash('Ezt az időpontot közben lefoglalták — kérjük, válassz másikat.');
        announce('Ez az időpont már nem szabad. Válassz másikat.');
      } else { $('#reviewErr').textContent = r.error; }
      return;
    }
    if (!st.modifyId) BB.rememberMine(r.booking.id);
    st.done = r.booking; st.reached = 5; go(5);
    renderMine();
    history.replaceState(null, '', 'foglalas.html?foglalas=' + r.booking.id);
  }

  function ics(b) {
    var s = BB.service(b.serviceId), loc = BB.location();
    var dt = function (d, t) { return d.replace(/-/g, '') + 'T' + t.replace(':', '') + '00'; };
    var txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DAEKON//BB demo//HU', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      'UID:' + b.id + '@bb-demo', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;TZID=Europe/Budapest:' + dt(b.date, b.start), 'DTEND;TZID=Europe/Budapest:' + dt(b.date, endTime(b.start, b.mins)),
      'SUMMARY:' + s.name + ' — Balogh Beatrix (BEMUTATÓ)', 'LOCATION:' + loc.line2 + '\\, ' + loc.line1,
      'DESCRIPTION:Bemutató foglalás – valódi időpont nem került rögzítésre. Azonosító: ' + b.id, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
    a.download = 'balogh-beatrix-' + b.id + '.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- foglalásaim / kezelés ---------- */
  function bookingCard(b, big) {
    var s = BB.service(b.serviceId), past = b.date < T.iso(T.today());
    var status = b.status === 'cancelled' ? '<span class="pill pill--x">Lemondva</span>' : past ? '<span class="pill">Lezajlott</span>' : '<span class="pill pill--ok">Aktív</span>';
    return '<article class="mine' + (big ? ' mine--big' : '') + '" data-id="' + b.id + '">' +
      '<div class="mine-top">' + UI.dial(b.mins) + '<div><b>' + esc(s ? s.name : '') + '</b><span>' + T.fmtDate(b.date, { weekday: true }) + ', ' + b.start + '–' + endTime(b.start, b.mins) + '</span></div>' + status + '</div>' +
      '<p class="small muted">Azonosító: ' + b.id + ' · ' + esc(b.name) + '</p>' +
      (b.status !== 'cancelled' && !past ? '<div class="mine-acts"><button type="button" class="btn btn--ghost btn--sm" data-mod="' + b.id + '">' + UI.icon('edit') + 'Időpont módosítása</button><button type="button" class="btn btn--ghost btn--sm" data-cancel="' + b.id + '">' + UI.icon('x') + 'Lemondás</button></div>' : '') +
      '<div class="confirm" hidden><p>Biztosan lemondod ezt az időpontot?</p><button type="button" class="btn btn--sm" data-cancel-yes="' + b.id + '">Igen, lemondom</button><button type="button" class="btn btn--ghost btn--sm" data-cancel-no>Mégsem</button></div>' +
      '</article>';
  }
  function renderMine() {
    var el = $('#mineList'); if (!el) return;
    var list = BB.mine();
    el.innerHTML = list.length ? list.map(function (b) { return bookingCard(b); }).join('')
      : '<div class="empty">' + UI.icon('calendar') + '<h3>Még nincs bemutató foglalásod</h3><p>Ha végigmész a foglaláson, itt kipróbálhatod a módosítást és a lemondást is.</p></div>';
    var mg = $('#kezeles');
    var id = params.get('foglalas');
    if (mg) {
      var b = id ? BB.getBooking(id) : null;
      mg.hidden = !b;
      if (b) $('#kezelesCard').innerHTML = bookingCard(b, true);
    }
  }

  function startModify(id) {
    var b = BB.getBooking(id); if (!b) return;
    st.modifyId = id; st.serviceId = b.serviceId; st.date = b.date; st.time = b.start; st.month = null;
    st.form = { name: b.name, email: b.email, phone: b.phone, note: b.note || '', privacy: true, marketing: !!b.marketing };
    st.reached = 4; st.cat = 'all';
    $('#bkTitle').innerHTML = 'Időpont <em>módosítása</em>';
    go(1);
    document.getElementById('bkMain').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- események ---------- */
  function bind() {
    host.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-cat]'))) { st.cat = t.getAttribute('data-cat'); render(false); $('[data-cat="' + st.cat + '"]', host).focus(); return; }
      if ((t = e.target.closest('[data-svc]'))) {
        var id = t.getAttribute('data-svc');
        if (st.serviceId !== id) { st.serviceId = id; st.date = null; st.time = null; st.month = null; st.reached = 0; }
        render(false); var b = $('[data-svc="' + id + '"]', host); b && b.focus();
        var s = svc(); announce(s.name + ' kiválasztva' + (s.phoneOnly ? ' — telefonos egyeztetés szükséges' : ''));
        return;
      }
      if ((t = e.target.closest('[data-month]'))) { st.month = new Date(st.month.getFullYear(), st.month.getMonth() + (+t.getAttribute('data-month')), 1); render(false); var nb = $('[data-month="' + t.getAttribute('data-month') + '"]', host); (nb && !nb.disabled ? nb : $('.cal-nav:not([disabled])', host)).focus(); return; }
      if ((t = e.target.closest('[data-date-jump]'))) { var dj = t.getAttribute('data-date-jump'); st.date = dj; st.time = null; var pd = T.parseIso(dj); st.month = new Date(pd.getFullYear(), pd.getMonth(), 1); st.reached = Math.max(st.reached, 1); go(2); return; }
      if ((t = e.target.closest('.cal-d'))) {
        if (t.getAttribute('aria-disabled') === 'true') { flash(t.getAttribute('aria-label').split(' — ')[1] + ' — válassz másik napot.'); return; }
        if (st.date !== t.getAttribute('data-date')) st.time = null;
        st.date = t.getAttribute('data-date'); st.reached = Math.max(st.reached, 1);
        go(2); return;
      }
      if ((t = e.target.closest('[data-time]'))) { st.time = t.getAttribute('data-time'); render(false); $('[data-time="' + st.time + '"]', host).focus(); announce(st.time + ' kiválasztva'); return; }
      if ((t = e.target.closest('[data-goto]'))) { if (st.step === 3) readForm(); go(+t.getAttribute('data-goto')); return; }
      if (e.target.closest('#icsBtn')) { ics(st.done); return; }
    });
    /* naptár: nyilas léptetés */
    host.addEventListener('keydown', function (e) {
      var cur = e.target.closest('.cal-d'); if (!cur) return;
      var map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (e.key === 'Home' || e.key === 'End') map[e.key] = 0;
      if (!(e.key in map)) return;
      e.preventDefault();
      var all = $$('.cal-d', host), i = all.indexOf(cur), d = map[e.key], j = i + d;
      if (e.key === 'Home') j = 0; if (e.key === 'End') j = all.length - 1;
      j = Math.max(0, Math.min(all.length - 1, j));
      all.forEach(function (b) { b.tabIndex = -1; }); all[j].tabIndex = 0; all[j].focus();
    });
    /* űrlap: élő tisztítás */
    host.addEventListener('input', function (e) {
      if (!e.target.form) return; readForm();
      var k = e.target.name; if (st.errors[k]) { delete st.errors[k]; var fld = e.target.closest('.fld, .chk'); fld && fld.classList.remove('has-err'); e.target.removeAttribute('aria-invalid'); var er = $('#e-' + k); if (er) er.textContent = ''; }
    });
    host.addEventListener('submit', function (e) { e.preventDefault(); next(); });

    $('#bkSteps').addEventListener('click', function (e) { var b = e.target.closest('[data-goto]'); if (b) { if (st.step === 3) readForm(); go(+b.getAttribute('data-goto')); } });
    navNext.addEventListener('click', next); $('#bkMNext').addEventListener('click', next);
    navBack.addEventListener('click', function () { if (st.step === 3) readForm(); if (st.step > 0) go(st.step - 1); });

    document.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-mod]'))) { startModify(t.getAttribute('data-mod')); return; }
      if ((t = e.target.closest('[data-cancel]'))) { var c = t.closest('.mine'); $('.confirm', c).hidden = false; $('.mine-acts', c).hidden = true; $('[data-cancel-yes]', c).focus(); return; }
      if ((t = e.target.closest('[data-cancel-no]'))) { var c2 = t.closest('.mine'); $('.confirm', c2).hidden = true; $('.mine-acts', c2).hidden = false; $('[data-cancel]', c2).focus(); return; }
      if ((t = e.target.closest('[data-cancel-yes]'))) { BB.cancelBooking(t.getAttribute('data-cancel-yes'), 'guest'); renderMine(); announce('A bemutató foglalás lemondva.'); flash('Lemondva — az admin demóban is látszik.'); return; }
    });
  }

  function init() {
    host = $('#bkStep'); live = $('#bkLive'); sumEl = $('#bkSum'); navBack = $('#bkBack'); navNext = $('#bkNext'); mSum = $('#bkMSum');
    bind();
    var pre = params.get('kezeles');
    if (pre && BB.service(pre) && BB.service(pre).active) { st.serviceId = pre; st.cat = BB.service(pre).cat; }
    var mod = params.get('modosit');
    if (mod && BB.getBooking(mod)) { startModify(mod); }
    else if (pre && BB.service(pre) && BB.service(pre).bookable && params.get('nap') && BB.slots(params.get('nap'), pre).indexOf(params.get('ido')) >= 0) {
      st.date = params.get('nap'); st.time = params.get('ido'); var pd0 = T.parseIso(st.date); st.month = new Date(pd0.getFullYear(), pd0.getMonth(), 1);
      st.reached = 3; go(3); history.replaceState(null, '', 'foglalas.html?kezeles=' + pre); $('h2', host).blur();
    }
    else if (pre && BB.service(pre) && BB.service(pre).bookable) { st.reached = 1; go(1); history.replaceState(null, '', 'foglalas.html?kezeles=' + pre); $('h2', host).blur(); }
    else render(false);
    renderMine();
    window.addEventListener('bb:change', renderMine);
  }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
