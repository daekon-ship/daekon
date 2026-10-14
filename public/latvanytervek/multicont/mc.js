/* MultiCont Center — közös szkript (12. kör)
   Minden tartalom a tartalom.js-ből (window.MC) jön. */
(function () {
  'use strict';
  var d = document, MC = window.MC || {};
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var esc = function (t) { var x = d.createElement('div'); x.textContent = t == null ? '' : String(t); return x.innerHTML; };
  var url = function (u) { return /^(https?:|mailto:|tel:|dok\/|#|[a-z0-9-]+\.html)/.test(u || '') ? u : '#'; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HO = ['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'];
  var HOR = ['jan.','febr.','márc.','ápr.','máj.','jún.','júl.','aug.','szept.','okt.','nov.','dec.'];
  var pd = function (s) { var p = (s || '').split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; };
  var dLong = function (s) { if (!s) return ''; var x = pd(s); return x.y + '. ' + HO[x.m] + ' ' + x.d + '.'; };
  var dShort = function (s) { if (!s) return ''; var x = pd(s); return x.y + '. ' + String(x.m + 1).padStart(2, '0') + '. ' + String(x.d).padStart(2, '0') + '.'; };
  var cikkek = (MC.cikkek || []).slice().sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });
  var byId = function (id) { for (var i = 0; i < cikkek.length; i++) if (cikkek[i].id === id) return cikkek[i]; return null; };
  var artUrl = function (a) { return 'cikk.html?id=' + encodeURIComponent(a.id); };
  var qs = new URLSearchParams(location.search);

  var ev = $('#ev'); if (ev) ev.textContent = new Date().getFullYear();

  /* ---------- Fejléc: „ragadt” állapot ---------- */
  var hdr = $('.hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('stuck', window.scrollY > 130 || (innerWidth <= 1100 && scrollY > 4)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Mobilmenü ---------- */
  var burger = $('#burger'), drawer = $('#drawer');
  function setDrawer(open) {
    if (!burger) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    if (open) { drawer.hidden = false; requestAnimationFrame(function () { drawer.classList.add('open'); }); d.body.style.overflow = 'hidden'; }
    else { drawer.classList.remove('open'); d.body.style.overflow = ''; setTimeout(function () { if (burger.getAttribute('aria-expanded') === 'false') drawer.hidden = true; }, reduce ? 0 : 260); }
  }
  if (burger) {
    burger.addEventListener('click', function () { setDrawer(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setDrawer(false); burger.focus(); } });
    addEventListener('resize', function () { if (innerWidth > 1100) setDrawer(false); });
  }

  /* ---------- Megjelenés görgetéskor ---------- */
  var rv = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(function (e) { e.classList.add('in'); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' }); rv.forEach(function (e) { io.observe(e); }); }

  /* ---------- Párbeszédablakok ---------- */
  $$('[data-dlg]').forEach(function (b) { b.addEventListener('click', function () { var x = d.getElementById('dlg-' + b.getAttribute('data-dlg')); if (x && x.showModal) x.showModal(); }); });
  $$('dialog').forEach(function (x) {
    $$('[data-close]', x).forEach(function (c) { c.addEventListener('click', function () { x.close(); }); });
    x.addEventListener('click', function (e) { if (e.target === x) x.close(); });
  });

  /* ---------- Főoldali modulok ---------- */
  var m;
  if ((m = $('[data-mod="featured"]'))) {
    var f = cikkek.filter(function (a) { return a.kiemelt; })[0] || cikkek[0];
    if (f) {
      m.href = artUrl(f);
      m.innerHTML = '<span class="f-k"><span class="cat">' + esc(f.kategoria) + '</span><span class="date">' + dShort(f.datum) + '</span></span>' +
        '<h2>' + esc(f.cim) + '</h2><p>' + esc(f.osszefoglalo) + '</p>' +
        (f.statusz ? '<p><span class="badge badge-plan">' + esc(f.statusz) + '</span></p>' : '') +
        '<span class="link-arrow">Elolvasom</span>';
    }
  }
  $$('[data-mod="news-mini"]').forEach(function (m) {
    var n = +m.getAttribute('data-n') || 4;
    var cats = (m.getAttribute('data-cats') || '').split('|').filter(Boolean);
    var list = cikkek.filter(function (a) { return !cats.length || cats.indexOf(a.kategoria) > -1; }).slice(0, n);
    m.innerHTML = list.map(function (a) {
      return '<li><a href="' + artUrl(a) + '"><span class="meta"><span class="cat">' + esc(a.kategoria) + '</span><span class="date">' + dShort(a.datum) + '</span></span><h3>' + esc(a.cim) + '</h3></a></li>';
    }).join('');
  });
  $$('[data-mod="deadlines"]').forEach(function (m) {
    m.innerHTML = (MC.hataridok || []).slice(0, +m.getAttribute('data-n') || 5).map(function (h) {
      var x = pd(h.datum);
      return '<li><span class="dd" aria-hidden="true"><b>' + x.d + '</b><small>' + HOR[x.m] + '</small></span><span><span class="vh">' + dLong(h.datum) + ': </span><span class="t">' + esc(h.cim) + '</span><span class="s"> · ' + esc(h.leiras) + '</span></span></li>';
    }).join('');
  });
  if ((m = $('[data-mod="timeline"]'))) {
    m.innerHTML = (MC.valtozasok || []).map(function (v) {
      return '<li' + (v.tervezet ? ' class="plan"' : '') + '><span class="y">' + esc(v.ev) + '</span><a href="cikk.html?id=' + encodeURIComponent(v.cikk) + '">' + esc(v.cim) + (v.tervezet ? '<span class="plan-note">' + esc(v.leiras) + '</span>' : '') + '</a></li>';
    }).join('');
  }
  if ((m = $('[data-mod="docs-mini"]'))) {
    m.innerHTML = (MC.dokumentumok || []).filter(function (x) { return x.tipus === 'pdf' && x.statusz !== 'visszavont'; }).map(function (x) {
      return '<li><a href="' + esc(url(x.fajl)) + '" download><span class="ftype">PDF</span><span><b>' + esc(x.cim) + '</b><small>' + dShort(x.datum) + (x.statusz === 'minta' ? ' · minta' : '') + '</small></span></a></li>';
    }).join('');
  }
  if ((m = $('[data-mod="forms-mini"]'))) {
    m.innerHTML = (MC.dokumentumok || []).filter(function (x) { return x.tipus === 'link'; }).slice(0, 4).map(function (x) {
      return '<li><a href="' + esc(url(x.fajl)) + '" target="_blank" rel="noopener">' + esc(x.cim) + '</a></li>';
    }).join('');
  }
  $$('[data-mod="links"]').forEach(function (m) {
    m.innerHTML = (MC.linkek || []).map(function (l) { return '<li><a href="' + esc(url(l.url)) + '" target="_blank" rel="noopener">' + esc(l.nev) + '</a></li>'; }).join('');
  });

  /* ---------- Fejléc-keresők → Szakmai hírek ---------- */
  $$('form.search[data-go]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('input', f).value.trim();
      location.href = f.getAttribute('data-go') + (q ? '?q=' + encodeURIComponent(q) : '');
    });
  });

  /* ---------- Szakmai hírek: magazin ---------- */
  var mag = $('#mag-list');
  if (mag) {
    var state = { kat: qs.get('kat') || '', q: qs.get('q') || '' };
    var chips = $('#mag-filters'), inp = $('#mag-q'), cnt = $('#mag-count'), lead = $('#mag-lead');
    inp.value = state.q;
    var kats = MC.kategoriak || [];
    var count = function (k) { return cikkek.filter(function (a) { return a.kategoria === k; }).length; };
    chips.innerHTML = '<button class="chip" type="button" data-k="">Összes <small>' + cikkek.length + '</small></button>' +
      kats.map(function (k) { return '<button class="chip" type="button" data-k="' + esc(k) + '">' + esc(k) + ' <small>' + count(k) + '</small></button>'; }).join('');
    var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    function render() {
      $$('.chip', chips).forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-k') === state.kat ? 'true' : 'false'); });
      var q = norm(state.q);
      var res = cikkek.filter(function (a) {
        if (state.kat && a.kategoria !== state.kat) return false;
        if (!q) return true;
        return norm(a.cim + ' ' + a.osszefoglalo + ' ' + (a.torzs || []).join(' ') + ' ' + a.kategoria).indexOf(q) > -1;
      });
      cnt.textContent = res.length + ' cikk';
      var first = null;
      if (!state.kat && !q) { var ki = res.filter(function (a) { return a.kiemelt; })[0] || res[0]; if (ki) { first = ki; res.splice(res.indexOf(ki), 1); } }
      lead.hidden = !first;
      if (first) {
        lead.href = artUrl(first);
        lead.innerHTML = '<div><p class="kicker">Kiemelt · ' + esc(first.kategoria) + '</p><h2>' + esc(first.cim) + '</h2><p>' + esc(first.osszefoglalo) + '</p></div>' +
          '<div class="side"><p class="date">' + dLong(first.datum) + '</p>' + (first.statusz ? '<p style="margin-top:8px"><span class="badge badge-plan">' + esc(first.statusz) + '</span></p>' : '') + '<p style="margin-top:12px"><span class="link-arrow">Elolvasom</span></p></div>';
      }
      mag.innerHTML = res.length ? res.map(function (a) {
        return '<li><a class="art" href="' + artUrl(a) + '"><span class="when"><span class="cat">' + esc(a.kategoria) + '</span><span class="date">' + dShort(a.datum) + '</span></span><span><h3>' + esc(a.cim) + '</h3><p>' + esc(a.osszefoglalo) + '</p></span></a></li>';
      }).join('') : (first ? '' : '<li class="empty">' + (state.kat && !count(state.kat) ? 'Ebben a kategóriában még nincs közzétett cikk.' : 'Nincs találat. Próbáljon más kifejezést.') + '</li>');
      var p = new URLSearchParams(); if (state.kat) p.set('kat', state.kat); if (state.q) p.set('q', state.q);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    }
    chips.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; state.kat = b.getAttribute('data-k'); render(); });
    inp.addEventListener('input', function () { state.q = inp.value.trim(); render(); });
    $('#mag-search').addEventListener('submit', function (e) { e.preventDefault(); });
    render();
  }

  /* ---------- Cikk részletes nézet ---------- */
  var art = $('#article');
  if (art) {
    var a = byId(qs.get('id')) || cikkek[0];
    d.title = a.cim + ' – Szakmai hírek – MultiCont Center Kft.';
    $('#crumb-cikk').textContent = a.kategoria;
    art.innerHTML =
      '<p class="kicker">' + esc(a.kategoria) + '</p>' +
      '<h1>' + esc(a.cim) + '</h1>' +
      '<div class="art-meta"><span>Megjelent: <b>' + dLong(a.datum) + '</b></span><span>Forrás ellenőrizve: ' + esc(MC.ellenorizve) + '</span>' + (a.statusz ? '<span class="badge badge-plan">' + esc(a.statusz) + '</span>' : '') + '</div>' +
      '<div class="art-body">' + (a.torzs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<aside class="sources" aria-label="Források"><h2>Források</h2><ul>' + (a.forrasok || []).map(function (s) {
        return '<li><a class="ext" href="' + esc(url(s.url)) + '" target="_blank" rel="noopener">' + esc(s.nev) + '</a><small>Megjelenés / megtekintés: ' + esc(s.datum) + '</small></li>';
      }).join('') + '</ul></aside>' +
      '<p class="disclaimer">Tájékoztató összefoglaló, nem minősül adótanácsadásnak. Az irányadó a hivatalos jogszabály és a NAV közleménye. Kérdés esetén hívjon minket: <a href="tel:+36204337811">+36 20 433 7811</a>.</p>';
    var rel = (a.kapcsolodo || []).map(byId).filter(Boolean);
    cikkek.forEach(function (x) { if (rel.length < 3 && x.id !== a.id && x.kategoria === a.kategoria && rel.indexOf(x) < 0) rel.push(x); });
    cikkek.forEach(function (x) { if (rel.length < 3 && x.id !== a.id && rel.indexOf(x) < 0) rel.push(x); });
    $('#related').innerHTML = rel.map(function (x) {
      return '<li><a class="art" href="' + artUrl(x) + '"><span class="when"><span class="cat">' + esc(x.kategoria) + '</span><span class="date">' + dShort(x.datum) + '</span></span><span><h3>' + esc(x.cim) + '</h3><p>' + esc(x.osszefoglalo) + '</p></span></a></li>';
    }).join('');
  }

  /* ---------- Kalkulátorok (2026, forrás: TaxHungary, Financera) ---------- */
  var fmt = function (v) { return Math.round(v).toLocaleString('hu-HU') + ' Ft'; };
  var num = function (el) { var v = parseInt(String(el.value).replace(/[^\d]/g, ''), 10); return isNaN(v) ? 0 : v; };
  var pretty = function (el) { el.addEventListener('blur', function () { var v = num(el); el.value = v ? v.toLocaleString('hu-HU') : ''; }); };
  var set = function (id, v) { var e = d.getElementById(id); if (e) e.textContent = v; };
  var ber = function (b, mentes) { var szja = mentes ? 0 : b * 0.15, tb = b * 0.185, szo = b * 0.13; return { szja: szja, tb: tb, netto: b - szja - tb, szocho: szo, koltseg: b + szo }; };

  function bind(id, fn) { var e = d.getElementById(id); if (!e) return; e.addEventListener('input', fn); if (e.type !== 'checkbox' && e.type !== 'number') pretty(e); }
  if ($('#q-brutto')) { var qf = function () { var r = ber(num($('#q-brutto')), false); set('q-netto', fmt(r.netto)); set('q-koltseg', fmt(r.koltseg)); }; bind('q-brutto', qf); qf(); }
  if ($('#b-brutto')) {
    var bf = function () { var r = ber(num($('#b-brutto')), $('#b-mentes').checked); set('b-szja', fmt(r.szja)); set('b-tb', fmt(r.tb)); set('b-netto', fmt(r.netto)); set('b-szocho', fmt(r.szocho)); set('b-koltseg', fmt(r.koltseg)); };
    bind('b-brutto', bf); $('#b-mentes').addEventListener('change', bf); bf();
  }
  if ($('#mk-brutto')) {
    var mf = function () {
      var b = num($('#mk-brutto')), budget = num($('#mk-keret'));
      set('mk-szocho', fmt(b * 0.13)); set('mk-ossz', fmt(b * 1.13));
      set('mk-maxbrutto', budget ? fmt(Math.floor(budget / 1.13)) : '–');
    };
    bind('mk-brutto', mf); bind('mk-keret', mf); mf();
  }
  if ($('#k-bevetel')) {
    var kf = function () {
      var bev = num($('#k-bevetel')), teteles = 600000, felett = Math.max(0, bev - 18000000) * 0.4;
      set('k-teteles', fmt(teteles)); set('k-felett', fmt(felett)); set('k-ossz', fmt(teteles + felett));
      $('#k-felett').parentNode.classList.toggle('warn', felett > 0);
    };
    bind('k-bevetel', kf); kf();
  }
  if ($('#a-osszeg')) {
    var af = function () {
      var v = num($('#a-osszeg')), k = +$('input[name="a-kulcs"]:checked').value / 100, br = $('input[name="a-irany"]:checked').value === 'brutto';
      var net = br ? v / (1 + k) : v, bru = br ? v : v * (1 + k);
      set('a-netto', fmt(net)); set('a-afa', fmt(bru - net)); set('a-brutto', fmt(bru));
    };
    bind('a-osszeg', af); $$('input[name="a-kulcs"],input[name="a-irany"]').forEach(function (r) { r.addEventListener('change', af); }); af();
  }
  $$('[data-set]').forEach(function (b) {
    b.addEventListener('click', function () { var e = d.getElementById(b.getAttribute('data-set')); e.value = (+b.getAttribute('data-val')).toLocaleString('hu-HU'); e.dispatchEvent(new Event('input')); });
  });

  /* ---------- Fülek ---------- */
  $$('[role="tablist"]').forEach(function (tl) {
    var tabs = $$('[role="tab"]', tl);
    function sel(t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; d.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) { var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (k) { e.preventDefault(); sel(tabs[(i + k + tabs.length) % tabs.length], true); } });
    });
    var want = location.hash && $('[role="tab"][data-hash="' + location.hash.slice(1) + '"]', tl);
    if (want) sel(want);
  });

  /* ---------- Dokumentumtár ---------- */
  var dl = $('#doclib');
  if (dl) {
    var dq = $('#doc-q'), dg = $('#doc-group'), dw = $('#doc-withdrawn'), dc = $('#doc-count');
    var docs = MC.dokumentumok || [];
    var groups = []; docs.forEach(function (x) { if (groups.indexOf(x.csoport) < 0) groups.push(x.csoport); });
    dg.innerHTML = '<option value="">Minden csoport</option>' + groups.map(function (g) { return '<option>' + esc(g) + '</option>'; }).join('');
    var norm2 = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    function drender() {
      var q = norm2(dq.value), g = dg.value, showW = dw.checked, total = 0;
      dl.innerHTML = groups.filter(function (x) { return !g || x === g; }).map(function (grp) {
        var items = docs.filter(function (x) { return x.csoport === grp && (showW || x.statusz !== 'visszavont') && (!q || norm2(x.cim + ' ' + x.leiras).indexOf(q) > -1); });
        total += items.length;
        if (!items.length) return '';
        return '<section class="doc-group"><h3>' + esc(grp) + ' <small class="muted" style="letter-spacing:0;text-transform:none;font-weight:600">' + items.length + ' tétel</small></h3>' + items.map(function (x) {
          var isPdf = x.tipus === 'pdf';
          var badge = x.statusz === 'visszavont' ? '<span class="badge badge-sample">Visszavonva</span>' : x.statusz === 'minta' ? '<span class="badge badge-sample">Minta</span>' : '';
          return '<div class="doc-row' + (x.statusz === 'visszavont' ? ' withdrawn' : '') + '"><span class="ftype">' + (isPdf ? 'PDF' : 'WEB') + '</span><span><b>' + esc(x.cim) + '</b><small>' + esc(x.leiras) + '</small> ' + badge + '</span>' +
            '<span class="when">' + (x.datum ? 'Közzétéve: ' + dShort(x.datum) : 'Hivatalos oldal') + '</span>' +
            '<span class="act">' + (x.statusz === 'visszavont' ? '' : isPdf ? '<a class="btn btn-line btn-sm" href="' + esc(url(x.fajl)) + '" download>Letöltés</a>' : '<a class="btn btn-line btn-sm ext" href="' + esc(url(x.fajl)) + '" target="_blank" rel="noopener">Megnyitás</a>') + '</span></div>';
        }).join('') + '</section>';
      }).join('') || '<p class="empty">Nincs a keresésnek megfelelő dokumentum.</p>';
      dc.textContent = total + ' tétel';
    }
    [dq, dg, dw].forEach(function (e) { e.addEventListener('input', drender); e.addEventListener('change', drender); });
    drender();
  }

  /* ---------- Partnerek ---------- */
  var pg = $('#p-grid');
  if (pg) {
    var pk = $('#p-kat'), pq = $('#p-q');
    pk.innerHTML = '<option value="">Minden kategória</option>' + (MC.partnerKategoriak || []).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('');
    var normP = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    function prender() {
      var k = pk.value, q = normP(pq.value);
      var res = (MC.partnerek || []).filter(function (p) { return (!k || p.kategoria === k) && (!q || normP(p.nev + ' ' + p.leiras + ' ' + p.kategoria).indexOf(q) > -1); });
      pg.innerHTML = res.length ? res.map(function (p) {
        return '<article class="p-card"><span class="p-logo">' + (p.minta ? 'Partner&shy;logó' : esc(p.nev.slice(0, 2))) + '</span><h3>' + esc(p.nev) + '</h3><span class="cat">' + esc(p.kategoria) + '</span><p>' + esc(p.leiras) + '</p>' +
          '<div class="foot"><span class="muted">' + esc(p.varos) + '</span>' + (p.minta ? '<span class="badge badge-sample">Minta</span>' : '<a class="link-arrow" href="' + esc(url(p.url)) + '" target="_blank" rel="noopener">Weboldal</a>') + '</div></article>';
      }).join('') : '<p class="empty" style="grid-column:1/-1">' + (q ? 'Nincs a keresésnek megfelelő partner.' : 'Ebben a kategóriában még nincs partner.') + '</p>';
    }
    pk.addEventListener('change', prender); pq.addEventListener('input', prender); prender();
  }

  /* ---------- Ajánlói kód: ?ajanlo=KOD → űrlap (valóban működik) ---------- */
  var ref = qs.get('ajanlo');
  try { if (ref) sessionStorage.setItem('mc-ajanlo', ref.slice(0, 40)); else ref = sessionStorage.getItem('mc-ajanlo'); } catch (e) {}
  $$('input[name="ajanlo"]').forEach(function (i) { if (ref && !i.value) i.value = ref; });
  if (qs.get('tema')) $$('select[name="szolgaltatas"]').forEach(function (s) { $$('option', s).forEach(function (o) { if (o.textContent === qs.get('tema')) s.value = o.value || o.textContent; }); });

  /* ---------- Űrlapok: ellenőrzés + e-mail-piszkozat ---------- */
  var rules = {
    nev: function (v) { return v.trim().length >= 2 ? '' : 'Kérjük, adja meg a nevét.'; },
    ceg: function (v) { return v.trim().length >= 2 ? '' : 'Kérjük, adja meg a cég nevét.'; },
    email: function (v) { return !v.trim() ? 'Kérjük, adja meg az e-mail-címét.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Ez nem tűnik érvényes e-mail-címnek.'; },
    telefon: function (v, req) { if (!v.trim()) return req ? 'Visszahíváshoz adja meg a telefonszámát.' : ''; var n = v.replace(/\D/g, ''); return /^[+\d\s()\/-]+$/.test(v.trim()) && n.length >= 8 && n.length <= 15 ? '' : 'Kérjük, ellenőrizze a telefonszámot.'; },
    weboldal: function (v) { return !v.trim() || /^https?:\/\/\S+\.\S+/.test(v.trim()) ? '' : 'A címet https://-sel kezdje.'; },
    select: function (v) { return v ? '' : 'Kérjük, válasszon.'; },
    uzenet: function (v) { return v.trim().length >= 10 ? '' : 'Kérjük, írjon néhány szót (legalább 10 karakter).'; },
    hozzajarul: function (v, r, el) { return el.checked ? '' : 'A továbbításhoz kérjük, fogadja el.'; }
  };
  $$('form[data-mail]').forEach(function (form) {
    var fields = $$('[data-rule]', form), done = $('.done', form), last = '';
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
      el.addEventListener('blur', function () { if (el.value || (el.closest('.f') || {}).classList && el.closest('.f') && el.closest('.f').classList.contains('err')) check(el); });
      el.addEventListener('change', function () { if (el.tagName === 'SELECT' || el.type === 'checkbox') check(el); });
      el.addEventListener('input', function () { var b = el.closest('.f'); if (b && b.classList.contains('err')) check(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null; fields.forEach(function (el) { if (!check(el) && !bad) bad = el; });
      if (bad) { bad.focus(); if (done) done.hidden = true; return; }
      var lines = $$('[data-label]', form).filter(function (el) { return el.type !== 'checkbox' || el.checked; }).map(function (el) { return el.getAttribute('data-label') + ': ' + (el.type === 'checkbox' ? 'igen' : (el.value.trim() || '–')); });
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

  /* ---------- Szolgáltatások: aktív tartalomjegyzék ---------- */
  var toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var tio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) toc.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); }); }, { rootMargin: '-30% 0px -60% 0px' });
    toc.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) tio.observe(t); });
  }

  /* ---------- Kezelőfelület (látványterv) ---------- */
  var adm = $('#admin');
  if (adm) {
    var views = $$('[data-view]', adm), navs = $$('[data-nav]', adm);
    function show(v) { views.forEach(function (x) { x.hidden = x.getAttribute('data-view') !== v; }); navs.forEach(function (n) { n.setAttribute('aria-current', n.getAttribute('data-nav') === v ? 'page' : 'false'); }); }
    navs.forEach(function (n) { n.addEventListener('click', function () { show(n.getAttribute('data-nav')); }); });
    var tb = $('#adm-news');
    if (tb) tb.innerHTML = cikkek.map(function (a) { return '<tr><td><b>' + esc(a.cim) + '</b></td><td>' + esc(a.kategoria) + '</td><td>' + dShort(a.datum) + '</td><td>' + (a.statusz ? '<span class="badge badge-plan">Tervezet</span>' : '<span class="badge badge-live">Közzétéve</span>') + '</td><td class="a-act"><button type="button" class="btn btn-line btn-sm" data-demo>Szerkesztés</button></td></tr>'; }).join('');
    var td = $('#adm-docs');
    if (td) td.innerHTML = (MC.dokumentumok || []).map(function (x) { return '<tr><td><b>' + esc(x.cim) + '</b></td><td>' + esc(x.csoport) + '</td><td>' + (x.datum ? dShort(x.datum) : '–') + '</td><td>' + (x.statusz === 'minta' ? '<span class="badge badge-sample">Minta</span>' : '<span class="badge badge-live">Aktív</span>') + '</td><td class="a-act"><button type="button" class="btn btn-line btn-sm" data-demo>Visszavonás</button></td></tr>'; }).join('');
    var tp = $('#adm-partners');
    if (tp) tp.innerHTML = (MC.partnerek || []).map(function (p) { return '<tr><td><b>' + esc(p.nev) + '</b></td><td>' + esc(p.kategoria) + '</td><td><span class="badge badge-sample">Minta</span></td><td class="a-act"><button type="button" class="btn btn-line btn-sm" data-demo>Jóváhagyás</button></td></tr>'; }).join('');
    adm.addEventListener('click', function (e) {
      var b = e.target.closest('[data-demo]'); if (!b) return;
      var t = $('#adm-toast'); t.hidden = false; clearTimeout(t._t); t._t = setTimeout(function () { t.hidden = true; }, 3200);
    });
    show('hirek');
  }
})();
