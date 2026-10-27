/* Dr. Szedoglavits Réka – látványterv (DAEKON)
   Interakciók + Motion (motion.dev) animációk. Csökkentett mozgásnál minden azonnal látszik. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnim = !!M && !reduce && doc.classList.contains('anim');
  var ease = [0.22, 0.7, 0.2, 1];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // díszvonalak: egységnyi úthossz a rajzolódáshoz
  $$('.swash path, .post__cover svg path, .card__ic > *').forEach(function (p) {
    p.setAttribute('pathLength', '1');
    if (canAnim) { p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); }
  });

  /* ---------------- fejléc ---------------- */
  var hdr = $('#fejlec');
  var mcta = $('#mcta');
  var hero = $('#fooldal');
  var book = $('#konzultacio');
  var contact = $('#kapcsolat');
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('is-scrolled', y > 24);
    // mobil CTA: a hero után jelenik meg, a konzultáció/kapcsolat szakasznál eltűnik
    if (mcta) {
      var past = hero.getBoundingClientRect().bottom < 80;
      var bR = book.getBoundingClientRect(), cR = contact.getBoundingClientRect();
      var vh = window.innerHeight;
      var inBook = bR.top < vh * 0.8 && cR.bottom > 0;
      var on = past && !inBook;
      mcta.classList.toggle('is-on', on);
      mcta.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a', mcta).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // aktív menüpont
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        if (id === 'csaladjog' || id === 'folyamat') id = 'szakteruletek';
        if (id === 'konzultacio') id = 'kapcsolat';
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(function (s) { io.observe(s); });
  }

  /* ---------------- mobil menü ---------------- */
  var burger = $('.burger');
  var mnav = $('#mobilmenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      mnav.hidden = false;
      if (canAnim) {
        M.animate(mnav, { opacity: [0, 1] }, { duration: 0.3, ease: ease });
        M.animate($$('li, .mnav__foot > *', mnav), { opacity: [0, 1], y: [14, 0] }, { delay: M.stagger(0.04, { startDelay: 0.06 }), duration: 0.45, ease: ease });
      }
      var first = $('a', mnav); if (first) first.focus();
    } else {
      mnav.hidden = true;
    }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
  });
  // fókusz a menüben marad
  mnav.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = $$('a, button', mnav).concat([burger]);
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1080 && !mnav.hidden) setMenu(false); });

  /* ---------------- családjogi fülek ---------------- */
  var tabs = $$('[role="tab"]');
  function selectTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls'));
      p.hidden = !on;
      if (on && canAnim) {
        M.animate(p.children, { opacity: [0, 1], y: [10, 0] }, { delay: M.stagger(0.05), duration: 0.5, ease: ease });
      }
    });
    if (focus) t.focus();
    if (window.innerWidth < 720) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === 'Home') n = tabs[0];
      if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ---------------- részletek ablak ---------------- */
  var dlg = $('#dlg');
  var dlgBody = $('#dlg-body');
  var lastTrigger = null;
  function openDlg(id, trigger) {
    var tpl = document.getElementById(id);
    if (!tpl) return;
    dlgBody.innerHTML = '';
    dlgBody.appendChild(tpl.content.cloneNode(true));
    lastTrigger = trigger;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.body.classList.add('dlg-open');
    if (canAnim) {
      M.animate($('.dlg__box', dlg), { opacity: [0, 1], y: [24, 0], scale: [0.985, 1] }, { duration: 0.5, ease: ease });
      M.animate(dlgBody.children, { opacity: [0, 1], y: [10, 0] }, { delay: M.stagger(0.04, { startDelay: 0.12 }), duration: 0.45, ease: ease });
    }
  }
  function closeDlg() {
    if (dlg.open) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
  }
  dlg.addEventListener('close', function () {
    document.body.classList.remove('dlg-open');
    if (lastTrigger) lastTrigger.focus();
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) { closeDlg(); return; }
    var c = e.target.closest('[data-close]');
    if (c) {
      if (c.tagName === 'A') { lastTrigger = null; }
      closeDlg();
    }
  });
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () { openDlg(b.getAttribute('data-open'), b); });
  });

  /* ---------------- időpontkérő (demó, nem küld adatot) ---------------- */
  var form = $('#keres');
  var ok = $('#keres-ok');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = [];
    ['f-nev', 'f-eler', 'f-tema'].forEach(function (id) {
      var el = document.getElementById(id);
      var v = (el.value || '').trim();
      var inv = !v;
      el.setAttribute('aria-invalid', inv ? 'true' : 'false');
      if (inv) bad.push(el);
    });
    var chk = form.querySelector('[name="adat"]');
    chk.closest('.chk').classList.toggle('is-err', !chk.checked);
    if (!chk.checked) bad.push(chk);
    if (bad.length) {
      bad[0].focus();
      if (canAnim) M.animate(bad[0].closest('.fld') || bad[0].closest('.chk'), { x: [0, -6, 6, -3, 3, 0] }, { duration: 0.4 });
      return;
    }
    // e-mail piszkozat csak a nevet és a témát tartalmazza – részleteket nem
    var nev = document.getElementById('f-nev').value.trim();
    var tema = document.getElementById('f-tema').value;
    var ido = (form.querySelector('[name="ido"]:checked') || {}).value || 'Mindegy';
    var subj = encodeURIComponent('Konzultációs időpont – ' + tema);
    var body = encodeURIComponent('Tisztelt Ügyvédnő!\n\nKonzultációs időpontot szeretnék kérni (' + tema.toLowerCase() + ').\nVisszahívás: ' + ido.toLowerCase() + '.\n\nÜdvözlettel:\n' + nev);
    $('#mailto-draft').href = 'mailto:dr.szedoglavitsreka@gmail.com?subject=' + subj + '&body=' + body;
    form.hidden = true; ok.hidden = false; ok.focus();
    if (canAnim) M.animate(ok.children, { opacity: [0, 1], y: [12, 0] }, { delay: M.stagger(0.06), duration: 0.5, ease: ease });
  });
  $('#keres-vissza').addEventListener('click', function () { ok.hidden = true; form.hidden = false; document.getElementById('f-nev').focus(); });
  $$('#keres input, #keres select').forEach(function (el) {
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true' && el.value.trim()) el.setAttribute('aria-invalid', 'false'); });
    el.addEventListener('change', function () { if (el.type === 'checkbox') el.closest('.chk').classList.toggle('is-err', !el.checked); });
  });

  /* ---------------- térkép (kattintásra töltődik) ---------------- */
  $('#map-load').addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Békéscsaba, Kinizsi utca 4-6, 5600') + '&z=17&output=embed';
    f.title = 'Az iroda helye a térképen: Békéscsaba, Kinizsi utca 4–6.';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    var ph = $('#map-ph');
    ph.parentNode.appendChild(f);
    ph.remove();
  });

  /* ================= ANIMÁCIÓK ================= */
  if (!canAnim) {
    // lépések: mozgás nélkül mind aktív
    $$('[data-step]').forEach(function (s) { s.classList.add('is-on'); });
    var tr = $('.steps__track span'); if (tr) tr.style.transform = 'scaleY(1)';
    return;
  }
  var animate = M.animate, scroll = M.scroll, inView = M.inView, stagger = M.stagger;
  var desktop = window.matchMedia('(min-width: 900px)').matches;

  // görgetés-jelző
  scroll(animate('.progress span', { scaleX: [0, 1] }, { ease: 'linear' }));

  // hero belépés
  var heroImg = $('.pp__img img');
  animate('.hero__eyebrow', { opacity: [0, 1], y: [10, 0] }, { duration: 0.7, ease: ease, delay: 0.1 });
  animate('[data-hl]', { y: ['105%', '0%'] }, { duration: 1.05, ease: ease, delay: stagger(0.14, { startDelay: 0.2 }) });
  animate('.hero__swash path', { strokeDashoffset: [1, 0] }, { duration: 1.6, ease: [0.45, 0, 0.2, 1], delay: 0.75 });
  animate('.hero__text > [data-h]:not(.hero__eyebrow)', { opacity: [0, 1], y: [16, 0] }, { duration: 0.8, ease: ease, delay: stagger(0.1, { startDelay: 0.7 }) });
  animate('.pp__img', { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.3, ease: [0.7, 0, 0.2, 1], delay: 0.25 });
  animate(heroImg, { scale: [1.12, 1] }, { duration: 1.8, ease: ease, delay: 0.25 });
  animate('.pp__frame', { opacity: [0, 1], x: [14, 0], y: [-14, 0] }, { duration: 1.1, ease: ease, delay: 0.9 });
  animate('.pp__tag', { opacity: [0, 1], x: [-12, 0] }, { duration: 0.8, ease: ease, delay: 1.25 });

  // finom parallax a portrén (csak asztali nézetben)
  if (desktop) {
    scroll(animate('.pp__img picture', { y: [0, 40] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
    scroll(animate('.pp__frame', { y: [0, -18] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
  }

  // szakaszonkénti megjelenés
  $$('.sec').forEach(function (sec) {
    var items = $$('[data-r]', sec);
    if (!items.length) return;
    inView(sec, function () {
      animate(items, { opacity: [0, 1], y: [22, 0] }, { duration: 0.85, ease: ease, delay: stagger(0.07) });
    }, { amount: 0.12 });
  });
  // kártyák lépcsőzetesen + ikonrajzolás
  [['.areas__grid', '.card'], ['.kb__grid', '.post']].forEach(function (pair) {
    var wrap = $(pair[0]); if (!wrap) return;
    var cards = $$(pair[1], wrap);
    inView(wrap, function () {
      animate(cards, { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, ease: ease, delay: stagger(0.08) });
      var shapes = $$('.card__ic > *, .post__cover path', wrap);
      animate(shapes, { strokeDashoffset: [1, 0] }, { duration: 1.2, ease: ease, delay: stagger(0.05, { startDelay: 0.3 }) });
    }, { amount: 0.1 });
  });
  // a kártyák ikonja hoverre újrarajzolódik
  $$('.card').forEach(function (c) {
    c.addEventListener('mouseenter', function () {
      var sh = $$('.card__ic > *', c);
      animate(sh, { strokeDashoffset: [1, 0] }, { duration: 0.9, ease: ease, delay: stagger(0.06) });
    });
  });

  // folyamat: a vonal görgetésre telik, a lépések sorban kigyúlnak
  var list = $('.steps__list');
  var steps = $$('[data-step]');
  scroll(animate('.steps__track span', { scaleY: [0, 1] }, { ease: 'linear' }), { target: list, offset: ['start 70%', 'end 60%'] });
  scroll(function (p) {
    var n = Math.min(steps.length, Math.floor(p * (steps.length) + 0.25));
    steps.forEach(function (s, i) { s.classList.toggle('is-on', i < n); });
  }, { target: list, offset: ['start 70%', 'end 60%'] });
  steps.forEach(function (s) { s.style.opacity = '0'; });
  inView(list, function () {
    animate(steps, { opacity: [0, 1], x: [16, 0] }, { duration: 0.8, ease: ease, delay: stagger(0.12) });
  }, { amount: 0.15 });

  // családjogi szakasz: lágy fényfolt mozgása görgetésre
  scroll(animate('.family__light', { x: [60, -60], y: [-30, 30] }, { ease: 'linear' }), { target: $('#csaladjog') });
})();
