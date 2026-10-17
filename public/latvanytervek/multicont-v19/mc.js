/* MultiCont Center — közös szkript (14. kör)
   Minden tartalom a tartalom.js-ből (window.MC) jön. */
(function () {
  'use strict';
  var d = document, MC = window.MC || {};
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var esc = function (t) { var x = d.createElement('div'); x.textContent = t == null ? '' : String(t); return x.innerHTML; };
  var url = function (u) { return /^(https?:|mailto:|tel:|dok\/|#|[a-z0-9-]+\.html)/.test(u || '') ? u : '#'; };
  var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HO = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var HOR = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
  var pd = function (s) { var p = (s || '').split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; };
  var dLong = function (s) { if (!s) return ''; var x = pd(s); return x.y + '. ' + HO[x.m] + ' ' + x.d + '.'; };
  var dShort = function (s) { if (!s) return ''; var x = pd(s); return x.y + '. ' + String(x.m + 1).padStart(2, '0') + '. ' + String(x.d).padStart(2, '0') + '.'; };
  var now = new Date(), TODAY = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  var qs = new URLSearchParams(location.search);
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var sstore = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  var cikkek = (MC.cikkek || []).filter(function (a) { return a.statusz !== 'piszkozat'; })
    .map(function (a, i) { a._i = i; return a; })
    .sort(function (a, b) { return a.datum === b.datum ? a._i - b._i : (a.datum < b.datum ? 1 : -1); });
  var byId = function (id) { for (var i = 0; i < cikkek.length; i++) if (cikkek[i].id === id) return cikkek[i]; return null; };
  var artUrl = function (a) { return 'cikk.html?id=' + encodeURIComponent(a.id); };
  var temaUrl = function (t) { return 'tudastar.html?tema=' + encodeURIComponent(t); };
  var partnerek = (MC.partnerek || []).filter(function (p) { return p.allapot === 'jovahagyva'; });
  var pById = function (id) { for (var i = 0; i < partnerek.length; i++) if (partnerek[i].id === id) return partnerek[i]; return null; };
  var ajanlatok = (MC.ajanlatok || []).filter(function (o) { return o.allapot === 'jovahagyva' && o.lejarat >= TODAY && pById(o.partner); });
  var hataridok = (MC.hataridok || []).filter(function (h) { return h.datum >= TODAY; });

  var ev = $('#ev'); if (ev) ev.textContent = now.getFullYear();

  /* ---------- Toast ---------- */
  var toastEl = $('#toast');
  function toast(t) { if (!toastEl) return; toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.hidden = true; }, 3600); }

  /* ---------- Fejléc: görgetéskor háttérváltás ---------- */
  var nav = $('#nav');
  var onScroll = function () { if (nav) nav.classList.toggle('stuck', window.scrollY > 40); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.activeElement && d.activeElement.closest('.has-sub')) d.activeElement.blur(); });

  /* ---------- Mobilmenü ---------- */
  var burger = $('#burger'), drawer = $('#drawer');
  function setDrawer(open) {
    if (!burger) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    if (open) {
      drawer.style.setProperty('--dtop', Math.max(0, nav.getBoundingClientRect().bottom) + 'px');
      drawer.hidden = false; requestAnimationFrame(function () { drawer.classList.add('open'); }); d.body.style.overflow = 'hidden';
    } else { drawer.classList.remove('open'); d.body.style.overflow = ''; setTimeout(function () { if (burger.getAttribute('aria-expanded') === 'false') drawer.hidden = true; }, reduce ? 0 : 240); }
  }
  if (burger) {
    burger.addEventListener('click', function () { setDrawer(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setDrawer(false); burger.focus(); } });
    addEventListener('resize', function () { if (innerWidth > 1180) setDrawer(false); });
  }

  /* ---------- Párbeszédablakok, sütik ---------- */
  $$('[data-dlg]').forEach(function (b) { b.addEventListener('click', function () { var x = d.getElementById('dlg-' + b.getAttribute('data-dlg')); if (x && x.showModal) x.showModal(); }); });
  $$('dialog').forEach(function (x) {
    $$('[data-close]', x).forEach(function (c) { c.addEventListener('click', function () { x.close(); }); });
    x.addEventListener('click', function (e) { if (e.target === x) x.close(); });
  });
  var cMaps = $('#c-maps'); if (cMaps) cMaps.checked = store.get('mc-maps') === '1';
  var mapBox = $('#map');
  function loadMap() {
    if (!mapBox || $('iframe', mapBox)) return;
    var f = d.createElement('iframe'); f.title = 'Térkép: 2040 Budaörs, Meredek utca 2.'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = mapBox.getAttribute('data-src'); var ph = $('.map-ph', mapBox); mapBox.replaceChild(f, ph);
  }
  var cSave = $('#c-save');
  if (cSave) cSave.addEventListener('click', function () { store.set('mc-maps', cMaps.checked ? '1' : '0'); $('#dlg-suti').close(); toast('Beállítások mentve.'); if (cMaps.checked) loadMap(); });
  if (mapBox) { if (store.get('mc-maps') === '1') loadMap(); var ml = $('#map-load'); if (ml) ml.addEventListener('click', loadMap); }

  /* ---------- Megjelenés görgetéskor ---------- */
  var rv = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(function (e) { e.classList.add('in'); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' }); rv.forEach(function (e) { io.observe(e); }); }

  /* ---------- Modulok ---------- */
  var newsSimple = function (a) { return '<li><a href="' + artUrl(a) + '"><span class="date">' + dShort(a.datum) + '</span><b>' + esc(a.cim) + '</b></a></li>'; };
  var newsLi = function (a) {
    return '<li><a href="' + artUrl(a) + '"><span class="m"><span class="tag' + (a.tervezet ? ' demo' : '') + '">' + esc(a.tervezet ? 'Tervezet' : a.temak[0]) + '</span><span class="date">' + dShort(a.datum) + '</span></span><b>' + esc(a.cim) + '</b></a></li>';
  };
  /* dátumsáv: mai nap + következő határidő (valós adatból) */
  $$('[data-mod="dateline"]').forEach(function (m) {
    var NAP = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
    var h = hataridok[0], html = '<span class="dl-day">' + now.getFullYear() + '. ' + HO[now.getMonth()] + ' ' + now.getDate() + '., ' + NAP[now.getDay()] + '</span>';
    if (h) {
      var x = pd(h.datum), diff = Math.round((new Date(x.y, x.m, x.d) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
      html += '<span class="dl-sep" aria-hidden="true"></span><span class="dl-next">Következő adóhatáridő: <b>' + HO[x.m] + ' ' + x.d + '.</b> – ' + esc(h.cim) + ' <span class="dl-cnt">' + (diff === 0 ? 'ma' : diff + ' nap') + '</span></span>';
    }
    var hk = cikkek.filter(function (a) { return a.kiemelt; })[0];
    if (hk) html += '<a class="dl-hot" href="' + artUrl(hk) + '">' + esc(hk.temak[0]) + '-változások 2027 →</a>';
    m.innerHTML = html;
  });
  $$('[data-mod="checked"]').forEach(function (m) { m.textContent = 'ellenőrizve: ' + dShort(MC.ellenorizve).slice(6); });
  var hot = cikkek.filter(function (a) { return a.kiemelt; })[0];
  $$('[data-mod="hot"]').forEach(function (m) {
    if (!hot) { m.hidden = true; return; }
    m.href = artUrl(hot);
    m.innerHTML = '<span class="k"><span>' + esc(hot.temak[0]) + '-változások</span>' + (hot.tervezet ? '<span class="tag demo">Tervezet</span>' : '') + '</span><b>' + esc(hot.cim) + '</b><p>' + esc(hot.osszefoglalo) + '</p><span class="date">' + dShort(hot.datum) + '</span> <span class="go">Részletek →</span>';
  });
  $$('[data-mod="news"]').forEach(function (m) { m.innerHTML = cikkek.filter(function (a) { return !(m.hasAttribute('data-skip-hot') && a === hot); }).slice(0, +m.getAttribute('data-n') || 4).map(m.hasAttribute('data-skip-hot') ? newsSimple : newsLi).join(''); });
  $$('[data-mod="art-one"]').forEach(function (m) { var a = byId(m.getAttribute('data-id')); if (a) m.innerHTML = newsLi(a); });
  $$('[data-mod="deadlines"]').forEach(function (m) {
    var list = hataridok.slice(0, +m.getAttribute('data-n') || 4);
    m.innerHTML = list.length ? list.map(function (h) {
      var x = pd(h.datum);
      return '<li><span class="dtile" aria-hidden="true"><b>' + x.d + '</b><small>' + HOR[x.m] + '</small></span><span><span class="vh">' + dLong(h.datum) + ': </span><span class="t">' + esc(h.cim) + '</span><span class="s">' + esc(h.leiras) + '</span></span></li>';
    }).join('') : '<li class="muted small">Nincs rögzített közelgő határidő.</li>';
  });
  $$('[data-mod="deadline-src"]').forEach(function (m) { var s = MC.hataridoForras; if (s) m.innerHTML = 'Forrás: <a href="' + esc(url(s.url)) + '" target="_blank" rel="noopener">' + esc(s.nev) + '</a> · ' + esc(s.datum); });
  $$('[data-mod="timeline"]').forEach(function (m) {
    m.innerHTML = (MC.valtozasok || []).map(function (v) {
      return '<li' + (v.tervezet ? ' class="plan"' : '') + '><span class="y">' + esc(v.ev) + '</span><a href="cikk.html?id=' + encodeURIComponent(v.cikk) + '">' + esc(v.cim) + '</a>' + (v.tervezet ? '<span class="pn">' + esc(v.leiras) + '</span>' : '') + '</li>';
    }).join('');
  });
  $$('[data-mod="topics-mini"]').forEach(function (m) {
    m.innerHTML = ['KATA', 'ÁFA', 'SZJA', 'Átalányadózás', 'Bérszámfejtés', 'TAO'].map(function (t) { return '<a href="' + temaUrl(t) + '">' + esc(t) + '</a>'; }).join('');
  });
  $$('[data-mod="links"]').forEach(function (m) {
    m.innerHTML = (MC.linkek || []).slice(0, +m.getAttribute('data-n') || 99).map(function (l) { return '<li><a href="' + esc(url(l.url)) + '" target="_blank" rel="noopener">' + esc(l.nev) + '</a></li>'; }).join('');
  });
  $$('[data-mod="docs"]').forEach(function (m) {
    var list = (MC.dokumentumok || []).filter(function (x) { return x.statusz !== 'archiv'; }).slice(0, +m.getAttribute('data-n') || 4);
    m.innerHTML = list.map(function (x) {
      var pdf = x.tipus === 'pdf';
      return '<li><a href="' + esc(url(x.fajl)) + '"' + (pdf ? ' download' : ' target="_blank" rel="noopener"') + '><span class="ft' + (pdf ? '' : ' web') + '">' + (pdf ? 'PDF' : 'WEB') + '</span><span><b>' + esc(x.cim) + '</b><small>' + (pdf ? 'v' + esc(x.verzio) + ' · ' + dShort(x.datum) + (x.statusz === 'minta' ? ' · minta' : '') : 'Hivatalos oldal') + '</small></span></a></li>';
    }).join('');
  });
  var offerHtml = function (o) {
    var p = pById(o.partner);
    return '<div class="offer"><p class="t">' + esc(o.cim) + '</p><p>' + esc(p ? p.nev : '') + ' · érvényes ' + dShort(o.lejarat) + '-ig</p><button class="code" type="button" data-code="' + esc(o.kod) + '" title="Kód másolása">' + esc(o.kod) + '</button></div>';
  };
  $$('[data-mod="offer"]').forEach(function (m) {
    var o = ajanlatok[0];
    m.innerHTML = o ? offerHtml(o) + '<p class="note">Minta: a partnerprogram indulásáig valódi kedvezmény nincs. <a href="partnerek.html#ajanlatok">Hogyan működik?</a></p>' : '<p class="muted small">Jelenleg nincs érvényes ajánlat.</p>';
  });
  $$('[data-mod="partners-mini"]').forEach(function (m) {
    m.innerHTML = partnerek.filter(function (p) { return p.kiemelt; }).slice(0, +m.getAttribute('data-n') || 3).map(function (p) {
      return '<a class="pmini" href="partner.html?id=' + encodeURIComponent(p.id) + '" style="text-decoration:none;color:inherit"><span class="plogo">' + esc(p.rov) + '</span><span><b>' + esc(p.nev) + '</b><small>' + esc(p.kategoria) + (p.minta ? ' · minta' : '') + '</small></span></a>';
    }).join('') + '<p class="note"><a href="partnerek.html#jelentkezes">Legyen Ön is partnerünk →</a></p>';
  });
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-code]'); if (!b) return;
    var c = b.getAttribute('data-code');
    if (navigator.clipboard) navigator.clipboard.writeText(c).then(function () { toast('A kuponkód kimásolva: ' + c); }, function () { toast('Kuponkód: ' + c); }); else toast('Kuponkód: ' + c);
  });

  /* ---------- Fülek (gyorskalkulátor, kalkulátorok, űrlapok) ---------- */
  $$('[role="tablist"]').forEach(function (tl) {
    var tabs = $$('[role="tab"]', tl);
    function sel(t, focus, push) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; var p = d.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      if (focus) t.focus();
      if (push && t.getAttribute('data-hash') && tl.classList.contains('clist')) history.replaceState(null, '', '#' + t.getAttribute('data-hash'));
      if (tl.classList.contains('clist') && innerWidth <= 960) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t, false, true); });
      t.addEventListener('keydown', function (e) {
        var k = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (k) { e.preventDefault(); sel(tabs[(i + k + tabs.length) % tabs.length], true, true); }
      });
    });
    function fromHash(scroll) {
      var want = location.hash && $('[role="tab"][data-hash="' + location.hash.slice(1) + '"]', tl);
      if (!want) return;
      sel(want);
      if (scroll) { var sec = tl.closest('section') || tl.parentNode; setTimeout(function () { sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }, 40); }
    }
    fromHash(!tl.classList.contains('clist') || innerWidth <= 960);
    addEventListener('hashchange', function () { fromHash(true); });
  });

  /* ---------- Kalkulátorok (2026: TaxHungary, Financera) ---------- */
  var SZJA = 0.15, TB = 0.185, SZOCHO = 0.13;
  var fmt = function (v) { return Math.round(v).toLocaleString('hu-HU') + ' Ft'; };
  var pct = function (v) { return isFinite(v) ? (Math.round(v * 10) / 10).toLocaleString('hu-HU') + '%' : '–'; };
  var num = function (el) { var v = parseInt(String(el.value).replace(/[^\d]/g, ''), 10); return isNaN(v) ? 0 : v; };
  var pretty = function (el) { el.addEventListener('blur', function () { var v = num(el); el.value = v ? v.toLocaleString('hu-HU') : ''; }); };
  var set = function (id, v) { var e = d.getElementById(id); if (e) e.textContent = v; };
  var steps = function (id, arr) { var e = d.getElementById(id); if (e) e.innerHTML = arr.map(function (s) { return '<li>' + s + '</li>'; }).join(''); };
  var ber = function (b, mentes) { var szja = mentes ? 0 : b * SZJA, tb = b * TB, szo = b * SZOCHO; return { b: b, szja: szja, tb: tb, netto: b - szja - tb, szocho: szo, koltseg: b + szo }; };
  var fromNet = function (n, mentes) { return Math.round(n / (1 - TB - (mentes ? 0 : SZJA))); };
  function bind(id, fn) { var e = d.getElementById(id); if (!e) return; e.addEventListener('input', fn); e.addEventListener('change', fn); if (e.type === 'text') pretty(e); }

  if ($('#q-brutto')) { var qf = function () { var r = ber(num($('#q-brutto'))); set('q-netto', fmt(r.netto)); set('q-koltseg', fmt(r.koltseg)); }; bind('q-brutto', qf); qf(); }
  if ($('#q-netto-in')) { var qn = function () { var b = fromNet(num($('#q-netto-in'))); set('q-nb-brutto', fmt(b)); set('q-nb-koltseg', fmt(b * (1 + SZOCHO))); }; bind('q-netto-in', qn); qn(); }
  if ($('#q-afa')) { var qa = function () { var v = num($('#q-afa')), k = +$('input[name="q-k"]:checked').value / 100; set('q-afa-v', fmt(v * k)); set('q-afa-b', fmt(v * (1 + k))); }; bind('q-afa', qa); $$('input[name="q-k"]').forEach(function (r) { r.addEventListener('change', qa); }); qa(); }

  if ($('#b-brutto')) {
    var bf = function () {
      var m = $('#b-mentes').checked, r = ber(num($('#b-brutto')), m);
      set('b-br', fmt(r.b)); set('b-szja', fmt(r.szja)); set('b-tb', fmt(r.tb)); set('b-netto', fmt(r.netto)); set('b-szocho', fmt(r.szocho)); set('b-koltseg', fmt(r.koltseg));
      steps('b-steps', ['SZJA: ' + fmt(r.b) + ' × ' + (m ? '0% (mentes)' : '15%') + ' = ' + fmt(r.szja), 'TB-járulék: ' + fmt(r.b) + ' × 18,5% = ' + fmt(r.tb), 'Nettó: bruttó − SZJA − TB-járulék = ' + fmt(r.netto), 'Munkáltató: bruttó + 13% szocho = ' + fmt(r.koltseg)]);
    };
    bind('b-brutto', bf); bind('b-mentes', bf); bf();
  }
  if ($('#n-netto')) {
    var nf = function () {
      var m = $('#n-mentes').checked, n = num($('#n-netto')), b = fromNet(n, m), r = ber(b, m), rate = 1 - TB - (m ? 0 : SZJA);
      set('n-brutto', fmt(b)); set('n-szja', fmt(r.szja)); set('n-tb', fmt(r.tb)); set('n-koltseg', fmt(r.koltseg));
      steps('n-steps', ['A nettó a bruttó ' + pct(rate * 100) + '-a (100% − 18,5%' + (m ? '' : ' − 15%') + ')', 'Bruttó: ' + fmt(n) + ' ÷ ' + rate.toLocaleString('hu-HU') + ' ≈ ' + fmt(b), 'Ellenőrzés: ebből a nettó ' + fmt(r.netto)]);
    };
    bind('n-netto', nf); bind('n-mentes', nf); nf();
  }
  if ($('#mk-brutto')) {
    var mf = function () {
      var b = num($('#mk-brutto')), budget = num($('#mk-keret'));
      set('mk-br', fmt(b)); set('mk-szocho', fmt(b * SZOCHO)); set('mk-ossz', fmt(b * (1 + SZOCHO))); set('mk-ev', fmt(b * (1 + SZOCHO) * 12));
      set('mk-maxbrutto', budget ? fmt(Math.floor(budget / (1 + SZOCHO))) : '–');
    };
    bind('mk-brutto', mf); bind('mk-keret', mf); mf();
  }
  if ($('#a-osszeg')) {
    var af = function () {
      var v = num($('#a-osszeg')), k = +$('input[name="a-kulcs"]:checked').value / 100, br = $('input[name="a-irany"]:checked').value === 'brutto';
      var net = br ? v / (1 + k) : v, bru = br ? v : v * (1 + k);
      set('a-netto', fmt(net)); set('a-afa', fmt(bru - net)); set('a-brutto', fmt(bru));
    };
    bind('a-osszeg', af); $$('input[name="a-kulcs"],input[name="a-irany"]').forEach(function (r) { r.addEventListener('change', af); }); af();
  }
  if ($('#k-bevetel')) {
    var kf = function () {
      var bev = num($('#k-bevetel')), h = Math.min(12, Math.max(1, num($('#k-honap')) || 12));
      var teteles = 50000 * h, hatar = 18000000 * h / 12, felett = Math.max(0, bev - hatar) * 0.4;
      set('k-teteles', fmt(teteles)); set('k-hatar', fmt(hatar)); set('k-felett', fmt(felett)); set('k-ossz', fmt(teteles + felett));
      $('#k-felett').parentNode.classList.toggle('warn', felett > 0);
      steps('k-steps', ['Tételes adó: ' + h + ' hónap × 50 000 Ft = ' + fmt(teteles), 'Bevételi határ: 18 000 000 Ft × ' + h + '/12 = ' + fmt(hatar), 'Határ feletti rész: ' + fmt(Math.max(0, bev - hatar)) + ' × 40% = ' + fmt(felett)]);
    };
    bind('k-bevetel', kf); bind('k-honap', kf); kf();
  }
  if ($('#e-bev')) {
    var ef = function () {
      var b = num($('#e-bev')), k = num($('#e-kia')), per = +$('input[name="e-per"]:checked').value, r = b - k;
      set('e-ered', fmt(r)); set('e-arany', b ? pct(k / b * 100) : '–'); set('e-margin', b ? pct(r / b * 100) : '–'); set('e-ev', fmt(r * (per === 1 ? 12 : 1)));
      $('#e-ered').parentNode.classList.toggle('warn', r < 0);
    };
    bind('e-bev', ef); bind('e-kia', ef); $$('input[name="e-per"]').forEach(function (r) { r.addEventListener('change', ef); }); ef();
  }
  var ctl = $('#ct-list');
  if (ctl) {
    var def = [['Könyvelési díj', 0], ['Irodabérlet', 0], ['Telefon, internet', 0], ['Szoftverek', 0]];
    var rows; try { rows = JSON.parse(sstore.get('mc-ct') || 'null'); } catch (e) { rows = null; }
    if (!Array.isArray(rows)) rows = def;
    var drawCt = function () {
      ctl.innerHTML = rows.map(function (r, i) {
        return '<li><label class="vh" for="ct-n' + i + '">Megnevezés</label><input id="ct-n' + i + '" data-i="' + i + '" data-k="0" value="' + esc(r[0]) + '" placeholder="Megnevezés"><label class="vh" for="ct-v' + i + '">Havi összeg (Ft)</label><input class="num" id="ct-v' + i + '" data-i="' + i + '" data-k="1" inputmode="numeric" value="' + (r[1] ? (+r[1]).toLocaleString('hu-HU') : '') + '" placeholder="0"><button class="rm" type="button" data-rm="' + i + '" aria-label="Sor törlése">×</button></li>';
      }).join('');
    };
    var calcCt = function () {
      var vals = rows.map(function (r) { return +r[1] || 0; }), sum = vals.reduce(function (a, b) { return a + b; }, 0), mx = -1, mi = -1;
      vals.forEach(function (v, i) { if (v > mx) { mx = v; mi = i; } });
      set('ct-n', rows.length + ' db'); set('ct-ho', fmt(sum)); set('ct-ev', fmt(sum * 12)); set('ct-max', mx > 0 ? rows[mi][0] + ' (' + fmt(mx) + ')' : '–');
      sstore.set('mc-ct', JSON.stringify(rows));
    };
    ctl.addEventListener('input', function (e) { var t = e.target, i = +t.getAttribute('data-i'); if (isNaN(i)) return; rows[i][+t.getAttribute('data-k')] = t.getAttribute('data-k') === '1' ? num(t) : t.value; calcCt(); });
    ctl.addEventListener('focusout', function (e) { if (e.target.classList.contains('num')) { var v = num(e.target); e.target.value = v ? v.toLocaleString('hu-HU') : ''; } });
    ctl.addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (!b) return; rows.splice(+b.getAttribute('data-rm'), 1); drawCt(); calcCt(); });
    $('#ct-add').addEventListener('click', function () { rows.push(['', 0]); drawCt(); calcCt(); var l = $$('input[data-k="0"]', ctl).pop(); if (l) l.focus(); });
    drawCt(); calcCt();
  }
  $$('[data-set]').forEach(function (b) {
    b.addEventListener('click', function () { var e = d.getElementById(b.getAttribute('data-set')); e.value = (+b.getAttribute('data-val')).toLocaleString('hu-HU'); e.dispatchEvent(new Event('input')); });
  });

  /* ---------- Tudástár ---------- */
  var kbList = $('#kb-list');
  if (kbList) {
    var temak = MC.temak || [];
    var st = { tema: qs.get('tema') || '', q: qs.get('q') || '', rend: qs.get('rend') || 'uj' };
    if (temak.indexOf(st.tema) < 0) st.tema = '';
    var cnt = function (t) { return cikkek.filter(function (a) { return a.temak.indexOf(t) > -1; }).length; };
    var tb = $('#kb-topics'), tsel = $('#kb-tema'), q = $('#kb-q'), so = $('#kb-sort'), feat = $('#kb-feat');
    tb.innerHTML = '<button type="button" data-t="">Összes téma <small>' + cikkek.length + '</small></button>' + temak.map(function (t) { return '<button type="button" data-t="' + esc(t) + '">' + esc(t) + ' <small>' + cnt(t) + '</small></button>'; }).join('');
    tsel.innerHTML = '<option value="">Összes téma (' + cikkek.length + ')</option>' + temak.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + ' (' + cnt(t) + ')</option>'; }).join('');
    q.value = st.q; so.value = st.rend;
    var row = function (a) {
      return '<li><a class="arow" href="' + artUrl(a) + '"><span class="when"><span class="date">' + dShort(a.datum) + '</span>' + (a.tervezet ? '<span class="tag demo">Tervezet</span>' : '') + '</span><span><h3>' + esc(a.cim) + '</h3><p>' + esc(a.osszefoglalo) + '</p><span class="tags">' + a.temak.map(function (t) { return '<span class="tag n">' + esc(t) + '</span>'; }).join('') + '<span class="tag t">' + esc(a.hataly.split('.')[0].replace(/^Tervezet: /, '')) + '</span></span></span></a></li>';
    };
    var render = function () {
      $$('button', tb).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-t') === st.tema ? 'true' : 'false'); });
      tsel.value = st.tema;
      var nq = norm(st.q);
      var res = cikkek.filter(function (a) {
        if (st.tema && a.temak.indexOf(st.tema) < 0) return false;
        return !nq || norm(a.cim + ' ' + a.osszefoglalo + ' ' + a.torzs.join(' ') + ' ' + a.temak.join(' ')).indexOf(nq) > -1;
      });
      if (st.rend === 'regi') res.reverse();
      if (st.rend === 'frissitett') res.sort(function (a, b) { return a.frissitve < b.frissitve ? 1 : a.frissitve > b.frissitve ? -1 : 0; });
      var f = null;
      if (!st.tema && !nq) { f = res.filter(function (a) { return a.kiemelt; })[0]; if (f) res.splice(res.indexOf(f), 1); }
      feat.hidden = !f;
      if (f) {
        feat.href = artUrl(f);
        feat.innerHTML = '<div style="position:relative;z-index:1"><p class="eyebrow l">Kiemelt · ' + esc(f.temak[0]) + '</p><h2>' + esc(f.cim) + '</h2><p>' + esc(f.osszefoglalo) + '</p></div><div class="side"><span class="date">' + dLong(f.datum) + '</span>' + (f.tervezet ? '<span class="tag demo">Tervezet – még nem jogszabály</span>' : '') + '<span class="arrow" style="color:#fff">Elolvasom</span></div>';
      }
      $('#kb-count').textContent = (res.length + (f ? 1 : 0)) + ' cikk' + (st.tema ? ' · ' + st.tema : '') + (st.q ? ' · „' + st.q + '”' : '');
      kbList.innerHTML = res.length ? res.map(row).join('') : (f ? '' : '<li class="empty">' + (st.tema && !cnt(st.tema) ? 'Ebben a témában még nincs közzétett cikk. A cikkek a kezelőfelületen, forrással együtt kerülnek fel.' : 'Nincs találat. Próbáljon más kifejezést, vagy válasszon másik témát.') + '</li>');
      var p = new URLSearchParams(); if (st.tema) p.set('tema', st.tema); if (st.q) p.set('q', st.q); if (st.rend !== 'uj') p.set('rend', st.rend);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    };
    tb.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; st.tema = b.getAttribute('data-t'); render(); });
    tsel.addEventListener('change', function () { st.tema = tsel.value; render(); });
    q.addEventListener('input', function () { st.q = q.value.trim(); render(); });
    so.addEventListener('change', function () { st.rend = so.value; render(); });
    $('#kb-form').addEventListener('submit', function (e) { e.preventDefault(); });
    render();
  }

  /* ---------- Cikk ---------- */
  var art = $('#article');
  if (art) {
    var a = byId(qs.get('id')) || cikkek[0];
    var link = location.origin + location.pathname + '?id=' + encodeURIComponent(a.id);
    d.title = a.cim + ' – Tudástár – MultiCont Center Kft.';
    var md = $('meta[name="description"]'); if (md) md.setAttribute('content', a.osszefoglalo);
    $('#crumb-cikk').textContent = a.temak[0];
    art.innerHTML =
      '<p class="eyebrow">' + a.temak.map(esc).join(' · ') + '</p>' +
      '<h1>' + esc(a.cim) + '</h1>' +
      '<div class="ameta"><span>Közzétéve: <b>' + dLong(a.datum) + '</b></span><span>Utoljára ellenőrizve: <b>' + dLong(a.frissitve) + '</b></span><span>Forrás: <b>' + a.forrasok.length + ' db</b></span></div>' +
      '<p class="scope' + (a.tervezet ? ' plan' : '') + '"><span>' + (a.tervezet ? '⚠' : '◷') + '</span><span><b>Melyik időszakra vonatkozik?</b> ' + esc(a.hataly) + '</span></p>' +
      '<div class="abody">' + a.torzs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<aside class="sources" aria-label="Források"><h2>Források</h2><ul>' + a.forrasok.map(function (s) {
        return '<li><a class="ext" href="' + esc(url(s.url)) + '" target="_blank" rel="noopener">' + esc(s.nev) + '</a><small>Megjelenés / megtekintés: ' + esc(s.datum) + '</small></li>';
      }).join('') + '</ul></aside>' +
      '<div class="share"><span>Megosztás:</span><button class="btn btn-o btn-s" type="button" id="sh-copy">Link másolása</button>' +
      '<a class="btn btn-o btn-s" href="mailto:?subject=' + encodeURIComponent(a.cim) + '&body=' + encodeURIComponent(link) + '">E-mail</a>' +
      '<a class="btn btn-o btn-s" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link) + '" target="_blank" rel="noopener">Facebook</a>' +
      '<a class="btn btn-o btn-s" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(link) + '" target="_blank" rel="noopener">LinkedIn</a>' +
      '<button class="btn btn-n btn-s" type="button" id="sh-read" aria-pressed="false">Olvasó mód</button></div>' +
      '<p class="disc">Tájékoztató összefoglaló, nem minősül adótanácsadásnak. Az irányadó a hivatalos jogszabály és a NAV közleménye. Kérdés esetén hívjon minket: <a href="tel:+36204337811">+36 20 433 7811</a>.</p>';
    $('#sh-copy').addEventListener('click', function () { if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { toast('A cikk linkje kimásolva.'); }); });
    var rb = $('#sh-read');
    rb.addEventListener('click', function () {
      var on = !d.body.classList.contains('reading'); d.body.classList.toggle('reading', on);
      rb.setAttribute('aria-pressed', on ? 'true' : 'false'); rb.textContent = on ? 'Kilépés az olvasó módból' : 'Olvasó mód';
      if (on) art.scrollIntoView({ behavior: 'auto' });
    });
    var rel = (a.kapcsolodo || []).map(byId).filter(Boolean);
    cikkek.forEach(function (x) { if (rel.length < 3 && x !== a && rel.indexOf(x) < 0 && x.temak.some(function (t) { return a.temak.indexOf(t) > -1; })) rel.push(x); });
    cikkek.forEach(function (x) { if (rel.length < 3 && x !== a && rel.indexOf(x) < 0) rel.push(x); });
    $('#related').innerHTML = rel.map(function (x) {
      return '<li><a class="arow" href="' + artUrl(x) + '"><span class="when"><span class="date">' + dShort(x.datum) + '</span></span><span><h3>' + esc(x.cim) + '</h3><p>' + esc(x.osszefoglalo) + '</p></span></a></li>';
    }).join('');
  }

  /* ---------- Dokumentumtár ---------- */
  var dl = $('#doclib');
  if (dl) {
    var dq = $('#doc-q'), dk = $('#doc-kat'), da = $('#doc-arch'), docs = MC.dokumentumok || [], kats = MC.dokKategoriak || [];
    dk.innerHTML = '<option value="">Minden kategória</option>' + kats.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('');
    if (qs.get('kat')) dk.value = qs.get('kat');
    var drender = function () {
      var nq = norm(dq.value), k = dk.value, arch = da.checked, total = 0;
      dl.innerHTML = kats.filter(function (x) { return !k || x === k; }).map(function (grp) {
        var items = docs.filter(function (x) { return x.kategoria === grp && (arch || x.statusz !== 'archiv') && (!nq || norm(x.cim + ' ' + x.leiras).indexOf(nq) > -1); });
        total += items.length;
        if (!items.length) return '';
        return '<section class="dgroup"><h2>' + esc(grp) + ' <small class="muted" style="letter-spacing:0;text-transform:none;font-weight:600">' + items.length + ' tétel</small></h2>' + items.map(function (x) {
          var pdf = x.tipus === 'pdf', ar = x.statusz === 'archiv';
          var badge = ar ? ' <span class="tag n">Archivált</span>' : x.statusz === 'minta' ? ' <span class="tag demo">Minta</span>' : '';
          var act = ar ? '<span class="muted small">Nem letölthető</span>' : pdf ? '<a class="btn btn-o btn-s" href="' + esc(url(x.fajl)) + '" download>Letöltés</a>' : '<a class="btn btn-o btn-s" href="' + esc(url(x.fajl)) + '" target="_blank" rel="noopener">Megnyitás ↗</a>';
          return '<div class="drow' + (ar ? ' arch' : '') + '"><span class="ft' + (pdf ? '' : ' web') + '">' + (pdf ? 'PDF' : 'WEB') + '</span><span><b>' + esc(x.cim) + '</b><small>' + esc(x.leiras) + '</small>' + badge + '</span>' +
            '<span class="c">' + (pdf ? 'Verzió: v' + esc(x.verzio) : 'Hivatalos oldal') + '</span><span class="c">' + (x.datum ? dShort(x.datum) : '–') + '</span><span class="act">' + act + '</span></div>';
        }).join('') + '</section>';
      }).join('') || '<p class="empty">Nincs a keresésnek megfelelő dokumentum.</p>';
      $('#doc-count').textContent = total + ' tétel';
    };
    [dq, dk, da].forEach(function (e) { e.addEventListener('input', drender); e.addEventListener('change', drender); });
    drender();
  }

  /* ---------- Partnerek ---------- */
  var pCard = function (p) {
    return '<a class="pcard" href="partner.html?id=' + encodeURIComponent(p.id) + '">' + (p.minta ? '<span class="tag demo">Minta</span>' : '') + '<span class="top"><span class="plogo">' + esc(p.rov) + '</span><span><h3>' + esc(p.nev) + '</h3><span class="tag n" style="margin-top:4px">' + esc(p.kategoria) + '</span></span></span><p>' + esc(p.leiras) + '</p><span class="foot"><span class="muted">' + esc(p.varos) + '</span><span class="arrow">Részletek</span></span></a>';
  };
  var pg = $('#p-grid');
  if (pg) {
    var pk = $('#p-kat'), pq = $('#p-q');
    pk.innerHTML = '<option value="">Minden kategória</option>' + (MC.partnerKategoriak || []).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('');
    var prender = function () {
      var k = pk.value, nq = norm(pq.value);
      var res = partnerek.filter(function (p) { return (!k || p.kategoria === k) && (!nq || norm(p.nev + ' ' + p.leiras + ' ' + p.kategoria + ' ' + p.szolg.join(' ')).indexOf(nq) > -1); });
      pg.innerHTML = res.length ? res.map(pCard).join('') : '<p class="empty" style="grid-column:1/-1">' + (nq ? 'Nincs a keresésnek megfelelő partner.' : 'Ebben a kategóriában még nincs partner.') + '</p>';
    };
    pk.addEventListener('change', prender); pq.addEventListener('input', prender); prender();
    $('#o-grid').innerHTML = ajanlatok.length ? ajanlatok.map(function (o) {
      var p = pById(o.partner);
      return '<div class="pcard"><span class="tag demo">Minta</span><span class="top"><span class="plogo">' + esc(p.rov) + '</span><span><h3>' + esc(o.cim) + '</h3><span class="muted small">' + esc(p.nev) + '</span></span></span><p>' + esc(o.leiras) + '</p>' +
        '<span class="foot"><button class="btn btn-o btn-s" type="button" data-code="' + esc(o.kod) + '">Kód: ' + esc(o.kod) + '</button><span class="date">Lejár: ' + dShort(o.lejarat) + '</span></span></div>';
    }).join('') : '<p class="empty" style="grid-column:1/-1">Jelenleg nincs érvényes ajánlat.</p>';
    var aps = $('#aj-p');
    aps.innerHTML = '<option value="">Válasszon…</option>' + partnerek.map(function (p) { return '<option value="' + esc(p.nev) + '"' + (qs.get('partner') === p.id ? ' selected' : '') + '>' + esc(p.nev) + (p.minta ? ' (minta)' : '') + '</option>'; }).join('');
  }
  var pdet = $('#pdet');
  if (pdet) {
    var p = pById(qs.get('id'));
    if (!p) {
      pdet.innerHTML = '<h1 class="h2">A partner nem található</h1><p style="margin-top:10px">Lehet, hogy a partner még jóváhagyásra vár, vagy már nem szerepel a listán.</p><p style="margin-top:16px"><a class="arrow" href="partnerek.html">Vissza a partnerlistához</a></p>';
      $('#crumb-p').textContent = 'Nem található';
    } else {
      d.title = p.nev + ' – Partnereink – MultiCont Center Kft.';
      $('#crumb-p').textContent = p.nev;
      var offs = ajanlatok.filter(function (o) { return o.partner === p.id; });
      pdet.innerHTML = (p.minta ? '<p class="notice w" style="margin-bottom:20px"><b>Minta partneroldal.</b> A szerkezetet mutatja; valódi cég és ajánlat nincs mögötte.</p>' : '') +
        '<div class="pd-head"><span class="plogo">' + esc(p.rov) + '</span><div><span class="tag n">' + esc(p.kategoria) + '</span><h1 class="h2" style="margin-top:6px">' + esc(p.nev) + '</h1><p class="muted">' + esc(p.varos) + '</p></div></div>' +
        '<section class="sd-sec" style="margin-top:28px"><h2>Bemutatkozás</h2><p class="lead">' + esc(p.leiras) + '</p></section>' +
        '<section class="sd-sec"><h2>Szolgáltatások</h2><ul class="targets">' + p.szolg.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></section>' +
        (p.miert ? '<section class="sd-sec"><h2>Miért ajánljuk?</h2><blockquote class="quote"><p>' + esc(p.miert) + '</p><footer>MultiCont Center</footer></blockquote></section>' : '') +
        '<section class="sd-sec"><h2>Ajánlatok ügyfeleinknek</h2>' + (offs.length ? offs.map(function (o) { return '<div class="offer" style="margin-bottom:12px"><p class="t">' + esc(o.cim) + '</p><p>' + esc(o.leiras) + ' Érvényes: ' + dShort(o.lejarat) + '-ig.</p><button class="code" type="button" data-code="' + esc(o.kod) + '">' + esc(o.kod) + '</button></div>'; }).join('') : '<p class="muted">Jelenleg nincs érvényes ajánlat.</p>') + '</section>';
      $('#pside').innerHTML = '<div class="tool"><div class="tool-h"><h2>Kapcsolat a partnerrel</h2></div><div class="tool-b"><p class="muted small">Az ajánlatkérés a MultiCont Centeren keresztül érkezik, így ajánlói kód nélkül is látjuk, honnan jött.</p>' +
        '<a class="btn btn-p btn-b" style="margin-top:12px" href="partnerek.html?partner=' + encodeURIComponent(p.id) + '#ajanlatkeres">Ajánlatot kérek</a>' +
        (p.url ? '<a class="btn btn-o btn-b" style="margin-top:8px" href="' + esc(url(p.url)) + '" target="_blank" rel="noopener">Weboldal ↗</a>' : '<p class="note">Weboldal: a partner adja meg.</p>') + '</div></div>' +
        '<div class="tool"><div class="tool-h"><h2>További partnerek</h2></div><div class="tool-b">' + partnerek.filter(function (x) { return x !== p; }).slice(0, 3).map(function (x) { return '<a class="pmini" href="partner.html?id=' + encodeURIComponent(x.id) + '" style="text-decoration:none;color:inherit"><span class="plogo">' + esc(x.rov) + '</span><span><b>' + esc(x.nev) + '</b><small>' + esc(x.kategoria) + '</small></span></a>'; }).join('') + '</div></div>';
    }
  }

  /* ---------- Ajánlói kód: ?ajanlo=KOD → űrlapok ---------- */
  var ref = qs.get('ajanlo');
  if (ref) sstore.set('mc-ajanlo', ref.slice(0, 40)); else ref = sstore.get('mc-ajanlo');
  $$('input[name="ajanlo"]').forEach(function (i) { if (ref && !i.value) i.value = ref; });
  if (qs.get('tema')) $$('select[name="szolgaltatas"]').forEach(function (s) { $$('option', s).forEach(function (o) { if (o.textContent === qs.get('tema')) s.value = o.value || o.textContent; }); });

  /* ---------- Űrlapok: ellenőrzés, spamvédelem, e-mail-piszkozat ---------- */
  var rules = {
    nev: function (v) { return v.trim().length >= 2 ? '' : 'Kérjük, adja meg a nevét.'; },
    ceg: function (v) { return v.trim().length >= 2 ? '' : 'Kérjük, adja meg a cég nevét.'; },
    email: function (v) { return !v.trim() ? 'Kérjük, adja meg az e-mail-címét.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Ez nem tűnik érvényes e-mail-címnek.'; },
    telefon: function (v, req) { if (!v.trim()) return req ? 'Visszahíváshoz adja meg a telefonszámát.' : ''; var n = v.replace(/\D/g, ''); return /^[+\d\s()\/-]+$/.test(v.trim()) && n.length >= 8 && n.length <= 15 ? '' : 'Kérjük, ellenőrizze a telefonszámot.'; },
    weboldal: function (v) { return !v.trim() || /^https?:\/\/\S+\.\S+/.test(v.trim()) ? '' : 'A címet https://-sel kezdje.'; },
    telkell: function (v) { var n = v.replace(/\D/g, ''); return !v.trim() ? 'Kérjük, adja meg a telefonszámát.' : /^[+\d\s()\/-]+$/.test(v.trim()) && n.length >= 8 && n.length <= 15 ? '' : 'Kérjük, ellenőrizze a telefonszámot.'; },
    select: function (v) { return v ? '' : 'Kérjük, válasszon.'; },
    uzenet: function (v) { return v.trim().length >= 10 ? '' : 'Kérjük, írjon néhány szót (legalább 10 karakter).'; },
    hozzajarul: function (v, r, el) { return el.checked ? '' : 'A továbbításhoz kérjük, fogadja el.'; }
  };
  $$('form[data-mail]').forEach(function (form) {
    var fields = $$('[data-rule]', form), done = $('.done', form), last = '', born = Date.now();
    function check(el) {
      var cb = form.querySelector('[name="visszahivas"]');
      var msg = rules[el.getAttribute('data-rule')](el.value, cb && cb.checked, el);
      var box = el.closest('.f') || el.closest('.check');
      if (box) box.classList.toggle('err', !!msg);
      var out = box && $('.msg', box); if (out) out.textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }
    fields.forEach(function (el) {
      el.addEventListener('blur', function () { var b = el.closest('.f'); if (el.value || (b && b.classList.contains('err'))) check(el); });
      el.addEventListener('change', function () { if (el.tagName === 'SELECT' || el.type === 'checkbox') check(el); });
      el.addEventListener('input', function () { var b = el.closest('.f'); if (b && b.classList.contains('err')) check(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (done) done.hidden = true;
      var hp = form.querySelector('[name="web2"]');
      if (hp && hp.value) return; // robot: csendben eldobjuk, sikert nem jelzünk
      var bad = null; fields.forEach(function (el) { if (!check(el) && !bad) bad = el; });
      if (bad) { bad.focus(); return; }
      if (Date.now() - born < 3000) { toast('Kérjük, ellenőrizze az adatokat, és küldje el újra.'); born = Date.now() - 2000; return; }
      var lines = $$('[data-label]', form).filter(function (el) { return el.name !== 'hozzajarul' && (el.type !== 'checkbox' || el.checked); }).map(function (el) { return el.getAttribute('data-label') + ': ' + (el.type === 'checkbox' ? 'igen' : (el.value.trim() || '–')); });
      last = lines.join('\n');
      var subj = form.getAttribute('data-subject') + (form.elements.szolgaltatas && form.elements.szolgaltatas.value ? ' – ' + form.elements.szolgaltatas.value : '');
      location.href = 'mailto:' + form.getAttribute('data-mail') + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(last + '\n');
      if (done) done.hidden = false;
    });
    var cp = $('[data-copy]', form);
    if (cp) cp.addEventListener('click', function () {
      var t = 'Címzett: ' + form.getAttribute('data-mail') + '\n\n' + last;
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { cp.textContent = 'Kimásolva'; });
    });
  });
})();
