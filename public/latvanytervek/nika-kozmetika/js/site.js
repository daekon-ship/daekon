/* Nika Kozmetika – látványterv (DAEKON)
   Interakciók + Motion (motion.dev) animációk. Csökkentett mozgásnál minden azonnal látszik. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnim = !!M && !reduce && doc.classList.contains('anim');
  if (!canAnim) doc.classList.remove('anim');
  var ease = [0.22, 0.7, 0.2, 1];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // díszvonalak és jelölők kirajzolódásához
  if (canAnim) $$('.done__mark *').forEach(function (p) { p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); });

  /* ---------- fejléc, haladásjelző, mobil CTA ---------- */
  var hdr = $('#fejlec'), mcta = $('#mcta'), hero = $('#kezdolap'), book = $('#idopont'), ftr = $('.ftr');
  var bar = $('.progress span');
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('is-scrolled', y > 24);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar && !reduce) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (mcta) {
      var vh = window.innerHeight;
      var past = hero.getBoundingClientRect().bottom < 90;
      var inBook = book.getBoundingClientRect().top < vh * 0.85 && book.getBoundingClientRect().bottom > 0;
      var inFtr = ftr.getBoundingClientRect().top < vh - 20;
      var drawerOpen = !$('#drawer').hidden;
      var on = past && !inBook && !inFtr && !drawerOpen;
      mcta.classList.toggle('is-on', on);
      mcta.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a,button', mcta).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // aktív menüpont
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        if (id === 'idopont') id = 'velemenyek';
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(function (s) { io.observe(s); });
  }

  /* ---------- fókuszcsapda segéd ---------- */
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input,select,textarea', container).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function lock(on) { document.body.style.overflow = on ? 'hidden' : ''; }

  /* ---------- mobil menü ---------- */
  var burger = $('.burger'), menu = $('#menu');
  function openMenu() {
    menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Menü bezárása'); lock(true);
    if (canAnim) {
      M.animate(menu, { opacity: [0, 1] }, { duration: 0.35 });
      M.animate($$('nav a', menu), { opacity: [0, 1], y: [18, 0] }, { delay: M.stagger(0.05, { startDelay: 0.08 }), duration: 0.55, ease: ease });
      M.animate($('.menu__foot', menu), { opacity: [0, 1] }, { delay: 0.4, duration: 0.5 });
    }
    setTimeout(function () { var a = $('nav a', menu); a && a.focus(); }, 60);
  }
  function closeMenu(focusBurger) {
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menü megnyitása'); lock(false);
    if (canAnim) M.animate(menu, { opacity: 0 }, { duration: 0.25 }).then(function () { menu.hidden = true; menu.style.opacity = ''; });
    else menu.hidden = true;
    if (focusBurger) burger.focus();
  }
  burger.addEventListener('click', function () { menu.hidden ? openMenu() : closeMenu(true); });
  $$('nav a', menu).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
  menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); trap(menu, e); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1060 && !menu.hidden) closeMenu(false); });

  /* ---------- időpontkérő panel ---------- */
  var drawer = $('#drawer'), panel = $('.drawer__panel', drawer), form = $('#bookForm'), done = $('#done'), err = $('#formErr');
  var lastFocus = null;
  function openDrawer(topic) {
    if (!menu.hidden) closeMenu(false);
    lastFocus = document.activeElement;
    form.hidden = false; done.hidden = true; err.hidden = true;
    if (topic) {
      var sel = $('#tema');
      $$('option', sel).forEach(function (o) { if (o.textContent === topic) sel.value = o.value; });
    }
    drawer.hidden = false; lock(true); onScroll();
    if (canAnim) {
      M.animate($('.drawer__bg', drawer), { opacity: [0, 1] }, { duration: 0.4 });
      M.animate(panel, { x: ['100%', '0%'] }, { duration: 0.6, ease: ease });
      M.animate($$('.drawer__call, .form > *', drawer), { opacity: [0, 1], y: [12, 0] }, { delay: M.stagger(0.035, { startDelay: 0.2 }), duration: 0.45 });
    }
    setTimeout(function () { var x = $('input[name=nev]', form); x && x.focus({ preventScroll: true }); }, canAnim ? 320 : 30);
  }
  function closeDrawer() {
    var fin = function () { drawer.hidden = true; lock(false); onScroll(); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); };
    if (canAnim) {
      M.animate($('.drawer__bg', drawer), { opacity: 0 }, { duration: 0.3 });
      M.animate(panel, { x: '100%' }, { duration: 0.4, ease: [0.4, 0, 1, 1] }).then(fin);
    } else fin();
  }
  $$('[data-book]').forEach(function (b) { b.addEventListener('click', function () { openDrawer(b.getAttribute('data-book')); }); });
  $$('[data-close]', drawer).forEach(function (b) { b.addEventListener('click', closeDrawer); });
  drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); trap(panel, e); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form), bad = [];
    $$('.is-bad', form).forEach(function (x) { x.classList.remove('is-bad'); });
    var nev = (d.get('nev') || '').trim(), tel = (d.get('tel') || '').trim();
    if (!nev) { bad.push('a neved'); form.nev.classList.add('is-bad'); }
    if (tel.replace(/\D/g, '').length < 8) { bad.push('egy elérhető telefonszám'); form.tel.classList.add('is-bad'); }
    if (!form.ok.checked) { bad.push('az adatkezelési hozzájárulás'); form.ok.closest('.consent').classList.add('is-bad'); }
    if (bad.length) {
      err.textContent = 'Még hiányzik: ' + bad.join(', ') + '.';
      err.hidden = false;
      if (canAnim) M.animate(err, { x: [0, -6, 6, -3, 0] }, { duration: 0.4 });
      (form.querySelector('.is-bad input, input.is-bad') || form.nev).focus();
      return;
    }
    err.hidden = true;
    var lines = [
      'Kedves Nika Kozmetika!', '',
      'Időpontot szeretnék kérni.', '',
      'Név: ' + nev,
      'Telefon: ' + tel,
      d.get('email') ? 'E-mail: ' + d.get('email') : null,
      'Érdeklődés: ' + d.get('tema'),
      'Napszak: ' + d.get('napszak') + (d.get('nap') ? ' · nap: ' + d.get('nap') : ''),
      d.get('uzenet') ? '' : null,
      d.get('uzenet') ? 'Üzenet: ' + d.get('uzenet') : null,
      '', 'Köszönöm!'
    ].filter(function (l) { return l !== null; });
    var href = 'mailto:vanyoanyo2@gmail.com?subject=' + encodeURIComponent('Időpontkérés – ' + nev) + '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
    form.hidden = true; done.hidden = false;
    if (canAnim) {
      var mk = $$('.done__mark *', done);
      M.animate(mk, { strokeDashoffset: [1, 0] }, { duration: 0.8, delay: M.stagger(0.25) });
      M.animate($$('.done > *:not(svg)', done), { opacity: [0, 1], y: [10, 0] }, { delay: M.stagger(0.06, { startDelay: 0.3 }) });
    }
    $('.done .btn', done).focus({ preventScroll: true });
  });

  /* ---------- térkép (kattintásra töltődik) ---------- */
  $('#mapLoad').addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Szeged, Szabadkai út 9/C') + '&z=16&output=embed';
    f.title = 'Nika Kozmetika a térképen – 6725 Szeged, Szabadkai út 9/C';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    var map = $('.map'); map.appendChild(f); $('#mapPh').remove();
    if (canAnim) M.animate(f, { opacity: [0, 1] }, { duration: 0.6 });
  });

  /* ---------- jogi oldalak helye ---------- */
  var legal = $('#legal');
  $$('[data-legal]').forEach(function (b) {
    b.addEventListener('click', function () {
      $('#legalT').textContent = b.getAttribute('data-legal');
      if (legal.showModal) legal.showModal(); else alert('Ez az oldal élesítéskor készül el.');
    });
  });

  /* ================= MOTION ================= */
  if (!canAnim) return;
  var animate = M.animate, scroll = M.scroll, stagger = M.stagger;
  // Motion 11: a visszahívás IntersectionObserverEntry-t kap, újabb verziók elemet – mindkettőt kezeljük
  var inView = function (sel, fn, opt) { return M.inView(sel, function (a, b) { return fn(a && a.target ? a.target : a, b); }, opt); };

  // Hero – betöltéskor
  animate('.hero .kicker', { opacity: [0, 1], x: [-12, 0] }, { duration: 0.7, delay: 0.15, ease: ease });
  animate('.h1 .ln > span', { y: ['105%', '0%'] }, { duration: 1.05, delay: stagger(0.12, { startDelay: 0.25 }), ease: ease });
  animate('.hero [data-h]:not(.kicker)', { opacity: [0, 1], y: [16, 0] }, { duration: 0.8, delay: stagger(0.1, { startDelay: 0.65 }), ease: ease });
  animate('.visit', { opacity: [0, 1], y: [40, 0], clipPath: ['inset(30% 0 0 0 round 240px 240px 22px 22px)', 'inset(0% 0 0 0 round 240px 240px 22px 22px)'] }, { duration: 1.3, delay: 0.45, ease: [0.7, 0, 0.2, 1] });
  animate('.visit > *', { opacity: [0, 1], y: [14, 0] }, { duration: 0.7, delay: stagger(0.08, { startDelay: 1.0 }), ease: ease });
  animate('.hero__bg', { x: [0, 22], y: [0, -14], scale: [1, 1.05] }, { duration: 14, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' });

  // Szakaszok: lépcsőzetes felúszás
  inView('main > section:not(.hero)', function (sec) {
    var els = $$('[data-r]', sec);
    animate(els, { opacity: [0, 1], y: [26, 0] }, { duration: 0.9, delay: stagger(0.08), ease: ease });
  }, { amount: 0.12 });

})();
