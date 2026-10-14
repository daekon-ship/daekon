/* MultiCont Center Kft. — látványterv, interakciók
   Fejléc, mobilmenü, finom megjelenések, visszafogott parallax, űrlap (e-mail-piszkozat), ablakok. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var ev = $('#ev'); if (ev) ev.textContent = new Date().getFullYear();

  /* ---------- Fejléc ---------- */
  var hdr = $('#hdr');
  var mbar = $('#mbar');
  var hero = $('#kezdolap');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    hdr.classList.toggle('is-scrolled', y > 24);
    if (mbar && hero) {
      var on = y > hero.offsetHeight * 0.55;
      if (on !== mbar.classList.contains('is-on')) {
        mbar.classList.toggle('is-on', on);
        mbar.setAttribute('aria-hidden', on ? 'false' : 'true');
        $$('a', mbar).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
      }
    }
    parallax(y);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- Visszafogott parallax a hero kompozíción (csak asztalon) ---------- */
  var layers = $$('.folio [data-depth]');
  var wide = window.matchMedia('(min-width: 961px)');
  function parallax(y) {
    if (reduce || !wide.matches) return;
    var h = window.innerHeight;
    if (y > h * 1.2) return;
    var p = Math.min(y / h, 1.2);
    layers.forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-depth')) || 0;
      el.style.transform = 'translate3d(0,' + (p * d * 1.6).toFixed(2) + 'px,0)';
    });
  }
  wide.addEventListener && wide.addEventListener('change', function () {
    if (!wide.matches) layers.forEach(function (el) { el.style.transform = ''; });
  });

  /* ---------- Mobilmenü ---------- */
  var burger = $('#burger');
  var mnav = $('#mnav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    if (open) {
      mnav.hidden = false;
      requestAnimationFrame(function () { mnav.classList.add('is-open'); });
      doc.body.style.overflow = 'hidden';
      var first = $('a', mnav); if (first) first.focus({ preventScroll: true });
    } else {
      mnav.classList.remove('is-open');
      doc.body.style.overflow = '';
      setTimeout(function () { if (burger.getAttribute('aria-expanded') === 'false') mnav.hidden = true; }, reduce ? 0 : 400);
    }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1060 && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
  });

  /* ---------- Aktív menüpont ---------- */
  var navLinks = $$('.nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ---------- Megjelenések ---------- */
  // Lépcsőzés a testvérelemek között
  $$('.marks, .cards, .who-list, .close-kinds').forEach(function (group) {
    $$('.rv', group).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09) + 's'); });
  });
  $$('.why-list li').forEach(function (el, i) { el.style.setProperty('--d', ((i % 2) * 0.12) + 's'); });

  var revealEls = $$('.rv, .folio, .books, .why-list li');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Szolgáltatás előválasztása a gombokról ---------- */
  var szolg = $('#f-szolg');
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-service');
      $$('option', szolg).forEach(function (o) { if (o.textContent === v) szolg.value = o.value || o.textContent; });
      clearErr(szolg);
    });
  });

  /* ---------- Űrlap: valódi ellenőrzés, majd e-mail-piszkozat ---------- */
  var form = $('#form');
  var done = $('#f-done');
  var TO = 'konyvelde@gmail.com';
  var lastBody = '';

  var rules = {
    'f-nev':    { err: 'e-nev',    test: function (v) { return v.trim().length >= 2 ? '' : 'Kérjük, adja meg a nevét.'; } },
    'f-mail':   { err: 'e-mail',   test: function (v) {
                    if (!v.trim()) return 'Kérjük, adja meg az e-mail-címét.';
                    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Ez nem tűnik érvényes e-mail-címnek.';
                  } },
    'f-tel':    { err: 'e-tel',    test: function (v) {
                    if (!v.trim()) return '';
                    var digits = v.replace(/\D/g, '');
                    return (/^[+\d\s()\/-]+$/.test(v.trim()) && digits.length >= 8 && digits.length <= 15) ? '' : 'Kérjük, ellenőrizze a telefonszámot.';
                  } },
    'f-tipus':  { err: 'e-tipus',  test: function (v) { return v ? '' : 'Kérjük, válassza ki a vállalkozás típusát.'; } },
    'f-szolg':  { err: 'e-szolg',  test: function (v) { return v ? '' : 'Kérjük, válassza ki, mi érdekli.'; } },
    'f-uzenet': { err: 'e-uzenet', test: function (v) { return v.trim().length >= 10 ? '' : 'Kérjük, írjon néhány szót (legalább 10 karakter).'; } }
  };

  function setErr(input, msg) {
    var r = rules[input.id]; if (!r) return;
    var box = doc.getElementById(r.err);
    var f = input.closest('.f');
    box.textContent = msg;
    f.classList.toggle('has-err', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) input.setAttribute('aria-describedby', r.err); else input.removeAttribute('aria-describedby');
  }
  function clearErr(input) { setErr(input, ''); }
  function check(input) { var r = rules[input.id]; var m = r ? r.test(input.value) : ''; setErr(input, m); return !m; }

  Object.keys(rules).forEach(function (id) {
    var el = doc.getElementById(id);
    el.addEventListener('blur', function () { if (el.value || el.closest('.f').classList.contains('has-err')) check(el); });
    el.addEventListener('input', function () { if (el.closest('.f').classList.contains('has-err')) check(el); });
    el.addEventListener('change', function () { if (el.tagName === 'SELECT') check(el); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (id) {
      var el = doc.getElementById(id);
      if (!check(el) && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); done.hidden = true; return; }

    var v = function (id) { return doc.getElementById(id).value.trim(); };
    var subject = 'Érdeklődés a weboldalról – ' + v('f-szolg');
    lastBody =
      'Tisztelt Horváth Mária!\n\n' +
      v('f-uzenet') + '\n\n' +
      '— Adatok —\n' +
      'Név: ' + v('f-nev') + '\n' +
      'E-mail: ' + v('f-mail') + '\n' +
      'Telefon: ' + (v('f-tel') || '–') + '\n' +
      'Vállalkozás típusa: ' + v('f-tipus') + '\n' +
      'Érdeklődés: ' + v('f-szolg') + '\n';

    window.location.href = 'mailto:' + TO +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lastBody);

    done.hidden = false;
  });

  var copyBtn = $('#f-copy');
  copyBtn.addEventListener('click', function () {
    var txt = 'Címzett: ' + TO + '\n\n' + lastBody;
    var ok = function () { copyBtn.textContent = 'Kimásolva'; setTimeout(function () { copyBtn.textContent = 'Üzenet másolása'; }, 2400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = doc.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand('copy'); ok(); } catch (err) { /* nincs vágólap */ }
      doc.body.removeChild(ta);
    }
  });

  /* ---------- Párbeszédablakok ---------- */
  $$('[data-dlg]').forEach(function (b) {
    b.addEventListener('click', function () {
      var d = doc.getElementById('dlg-' + b.getAttribute('data-dlg'));
      if (d && d.showModal) d.showModal(); else if (d) d.setAttribute('open', '');
    });
  });
  $$('.dlg').forEach(function (d) {
    $$('[data-close]', d).forEach(function (x) { x.addEventListener('click', function () { d.close ? d.close() : d.removeAttribute('open'); }); });
    d.addEventListener('click', function (e) { if (e.target === d && d.close) d.close(); });
  });

  onScroll();
})();

/* =========================================================
   Tartalom (tartalom.js), kalkulátorok, fülek
   ========================================================= */
(function () {
  'use strict';
  var doc = document;
  var T = window.TARTALOM || {};
  var $ = function (s) { return doc.querySelector(s); };
  var esc = function (t) { var d = doc.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
  var safeUrl = function (u) { return /^(https?:|mailto:|tel:|dok\/|#)/.test(u || '') ? u : '#'; };

  /* ---- Hírek ---- */
  var nl = $('#news-list');
  if (nl) {
    nl.innerHTML = (T.hirek || []).map(function (h, i) {
      return '<li class="news-item' + (i === 0 ? ' news-top' : '') + '">' +
        '<p class="ni-meta"><span class="ni-tag">' + esc(h.cimke) + '</span><time>' + esc(h.datum) + '</time></p>' +
        '<h3>' + esc(h.cim) + '</h3>' +
        '<p>' + esc(h.szoveg) + '</p>' +
        (h.link ? '<a class="ni-src" href="' + esc(safeUrl(h.link)) + '" target="_blank" rel="noopener">Forrás: ' + esc(h.forras) + ' ↗</a>' : '') +
        '</li>';
    }).join('');
  }

  /* ---- Saját dokumentumok ---- */
  var dl = $('#doc-own');
  if (dl) {
    var docs = T.dokumentumok || [];
    dl.innerHTML = docs.length ? docs.map(function (d) {
      return '<li><a href="' + esc(safeUrl(d.fajl)) + '" target="_blank" rel="noopener"><span class="dl-ico dl-own">DOK</span><span><b>' + esc(d.cim) + '</b><small>' + esc(d.leiras) + '</small></span></a></li>';
    }).join('') : '<li class="doc-empty"><p><b>Itt jelennek meg az iroda saját anyagai:</b> ügyfél-tájékoztatók, adatlapok, sablonok, ellenőrzőlisták.</p><p>Feltöltés után azonnal letölthetők lesznek.</p></li>';
  }

  /* ---- Partnerek ---- */
  var pl = $('#partner-list');
  if (pl) {
    var ps = T.partnerek || [];
    pl.innerHTML = ps.length ? ps.map(function (p) {
      return '<li><a href="' + esc(safeUrl(p.link)) + '" target="_blank" rel="noopener"><b>' + esc(p.nev) + '</b><span>' + esc(p.leiras) + '</span></a></li>';
    }).join('') : '<li class="partner-empty"><b>Partnereink hamarosan</b><span>Itt jelennek meg az együttműködő vállalkozások, linkkel az oldalukra.</span></li>';
  }

  /* ---- Kupon ---- */
  if (T.kupon) {
    var box = $('#kupon');
    if (box) {
      box.classList.add('is-live');
      $('#kupon-szoveg').textContent = T.kupon.szoveg;
      $('#kupon-kod').textContent = T.kupon.kod;
    }
  }

  /* ---- Számformázás ---- */
  var fmt = function (n) { return Math.round(n).toLocaleString('hu-HU').replace(/ /g, ' ') + ' Ft'; };
  var num = function (el) { var v = parseInt(String(el.value).replace(/[^\d]/g, ''), 10); return isNaN(v) ? 0 : v; };
  var pretty = function (el) {
    el.addEventListener('blur', function () { var v = num(el); el.value = v ? v.toLocaleString('hu-HU') : ''; });
  };

  /* ---- Bér (2026: SZJA 15%, TB 18,5%, szocho 13%) ---- */
  function ber(brutto, mentes) {
    var szja = mentes ? 0 : brutto * 0.15;
    var tb = brutto * 0.185;
    var szocho = brutto * 0.13;
    return { szja: szja, tb: tb, netto: brutto - szja - tb, szocho: szocho, koltseg: brutto + szocho };
  }
  var qb = $('#q-brutto');
  function quick() {
    var r = ber(num(qb), false);
    $('#q-netto').textContent = fmt(r.netto);
    $('#q-koltseg').textContent = fmt(r.koltseg);
  }
  if (qb) { qb.addEventListener('input', quick); pretty(qb); quick(); }

  var bb = $('#b-brutto'), bm = $('#b-mentes');
  function berCalc() {
    var r = ber(num(bb), bm.checked);
    $('#b-szja').textContent = fmt(r.szja);
    $('#b-tb').textContent = fmt(r.tb);
    $('#b-netto').textContent = fmt(r.netto);
    $('#b-szocho').textContent = fmt(r.szocho);
    $('#b-koltseg').textContent = fmt(r.koltseg);
  }
  if (bb) { bb.addEventListener('input', berCalc); bm.addEventListener('change', berCalc); pretty(bb); berCalc(); }

  /* ---- ÁFA ---- */
  var ao = $('#a-osszeg');
  function afaCalc() {
    var v = num(ao);
    var k = parseInt(doc.querySelector('input[name="a-kulcs"]:checked').value, 10) / 100;
    var bruttoIn = doc.querySelector('input[name="a-irany"]:checked').value === 'brutto';
    var netto = bruttoIn ? v / (1 + k) : v;
    var brutto = bruttoIn ? v : v * (1 + k);
    $('#a-netto').textContent = fmt(netto);
    $('#a-afa').textContent = fmt(brutto - netto);
    $('#a-brutto').textContent = fmt(brutto);
  }
  if (ao) {
    ao.addEventListener('input', afaCalc); pretty(ao);
    Array.prototype.forEach.call(doc.querySelectorAll('input[name="a-kulcs"], input[name="a-irany"]'), function (r) { r.addEventListener('change', afaCalc); });
    afaCalc();
  }

  /* ---- KATA 2026: 50 000 Ft/hó, 18 M Ft/év (havi 1,5 M arányosan), felette 40% ---- */
  var kb = $('#k-bevetel'), kh = $('#k-honap');
  function kataCalc() {
    var h = Math.min(12, Math.max(1, parseInt(kh.value, 10) || 12));
    var bev = num(kb);
    var teteles = 50000 * h;
    var keret = 1500000 * h;
    var felett = Math.max(0, bev - keret) * 0.40;
    $('#k-teteles').textContent = fmt(teteles);
    $('#k-keret').textContent = fmt(keret);
    $('#k-felett').textContent = fmt(felett);
    $('#k-ossz').textContent = fmt(teteles + felett);
    $('#k-felett').parentNode.classList.toggle('res-warn', felett > 0);
  }
  if (kb) { kb.addEventListener('input', kataCalc); kh.addEventListener('input', kataCalc); pretty(kb); kataCalc(); }

  /* ---- Gyors értékgombok ---- */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-set]'), function (b) {
    b.addEventListener('click', function () {
      var el = doc.getElementById(b.getAttribute('data-set'));
      el.value = parseInt(b.getAttribute('data-val'), 10).toLocaleString('hu-HU');
      el.dispatchEvent(new Event('input'));
    });
  });

  /* ---- Fülek (billentyűzettel is) ---- */
  var tabs = Array.prototype.slice.call(doc.querySelectorAll('[role="tab"]'));
  function select(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      doc.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var n = tabs[(i + d + tabs.length) % tabs.length];
      select(n); n.focus(); e.preventDefault();
    });
  });
})();
