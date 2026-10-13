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
