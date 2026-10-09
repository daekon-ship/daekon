/* Levendula Szépségszalon – 3. változat */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var desktop = window.matchMedia('(min-width:1001px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var ft = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; };

  /* ---------- the eye: almond ↔ rectangle path ---------- */
  var A = [[0,.5],[.12,.3],[.3,.06],[.5,.06],[.7,.06],[.88,.3],[1,.5],[.88,.7],[.7,.94],[.5,.94],[.3,.94],[.12,.7],[0,.5]];
  var R = [[0,.5],[0,0],[0,0],[.5,0],[1,0],[1,0],[1,.5],[1,1],[1,1],[.5,1],[0,1],[0,1],[0,.5]];
  var r3 = function (v) { return Math.round(v * 1000) / 1000; };
  var eyeD = function (morph, open) {
    var P = A.map(function (a, i) {
      var k = 1 + 0.22 * morph;
      var x = a[0] + (R[i][0] - a[0]) * morph;
      var y = a[1] + (R[i][1] - a[1]) * morph;
      x = 0.5 + (x - 0.5) * k;
      y = 0.5 + (y - 0.5) * open * k;
      return r3(x) + ',' + r3(y);
    });
    return 'M' + P[0] + ' C' + P[1] + ' ' + P[2] + ' ' + P[3] + ' C' + P[4] + ' ' + P[5] + ' ' + P[6] +
      ' C' + P[7] + ' ' + P[8] + ' ' + P[9] + ' C' + P[10] + ' ' + P[11] + ' ' + P[12] + ' Z';
  };
  var eyePath = $('#eyePath');
  var eyeState = { morph: 0, open: 1 };
  var drawEye = function () { if (eyePath) eyePath.setAttribute('d', eyeD(eyeState.morph, eyeState.open)); };

  var hero = $('.hero');
  var ready = function () { if (hero) hero.classList.add('is-ready'); };

  /* ---------- header ---------- */
  var hdr = $('.hdr'), mbar = $('.mbar');
  var heroEnd = function () { return hero ? hero.offsetTop + hero.offsetHeight - 80 : 200; };
  var pinExtra = 0;
  var onScroll = function () {
    var y = window.scrollY;
    hdr.classList.toggle('is-solid', y > heroEnd() + pinExtra);
    if (mbar) {
      var on = !desktop.matches && y > (hero ? hero.offsetHeight * 0.7 : 300);
      mbar.classList.toggle('is-on', on);
      mbar.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a,button', mbar).forEach(function (el) { el.tabIndex = on ? 0 : -1; });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  var burger = $('.burger'), mm = $('.mmenu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    mm.hidden = !open;
    hdr.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', mm).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mm.hidden) setMenu(false); });

  /* ---------- motion ---------- */
  if (hasG && !reduce) {
    gsap.registerPlugin(ScrollTrigger);

    requestAnimationFrame(ready);

    ScrollTrigger.matchMedia({
      '(min-width:1001px)': function () {
        /* services: horizontal ride */
        var track = $('.svc-track'), bar = $('.svc-progress i');
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        var h = gsap.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: '.svc', start: 'top top', end: function () { return '+=' + dist(); },
            pin: true, scrub: 0.8, invalidateOnRefresh: true,
            onUpdate: function (s) { gsap.set(bar, { scaleX: s.progress }); }
          }
        });
      },
      '(max-width:1000px)': function () {
        /* mobil: nincs képmozgatás */
      }
    });

    /* contact eye opens when it scrolls in */
    var p2 = $('#eyeClip2 path');
    if (p2) {
      var st2 = { open: 0.05 };
      var d2 = function () { p2.setAttribute('d', eyeD(0, st2.open)); };
      d2();
      gsap.to(st2, { open: 1, ease: 'none', onUpdate: d2, scrollTrigger: { trigger: '.contact-eye', start: 'top 85%', end: 'center 55%', scrub: 0.6 } });
    }

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else {
    ready();
  }
  onScroll();

  /* ---------- price tabs ---------- */
  var tabs = $$('.p-tab'), panels = $$('.p-panel');
  var showCat = function (cat, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.cat === cat;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) { p.hidden = p.dataset.cat !== cat; });
  };
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showCat(t.dataset.cat); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault();
      showCat(tabs[(i + d + tabs.length) % tabs.length].dataset.cat, true);
    });
  });
  $$('[data-goto]').forEach(function (a) { a.addEventListener('click', function () { showCat(a.dataset.goto); }); });

  /* ---------- lightbox ---------- */
  var lb = $('.lb'), lbImg = $('.lb img'), lbCap = $('.lb figcaption'), group = [], gi = 0, lbLast = null;
  var show = function () { var a = group[gi], im = $('img', a); lbImg.src = a.getAttribute('href'); lbImg.alt = im.alt; lbCap.textContent = a.dataset.cap || im.alt; };
  var openLb = function (set, i) { group = set; gi = i; lbLast = document.activeElement; show(); lb.hidden = false; document.documentElement.style.overflow = 'hidden'; $('.lb-x').focus(); };
  var closeLb = function () { lb.hidden = true; document.documentElement.style.overflow = ''; if (lbLast) lbLast.focus(); };
  ['.wi', '.cert'].forEach(function (sel) {
    var set = $$(sel);
    set.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); openLb(set, i); }); });
  });
  $('.lb-x').addEventListener('click', closeLb);
  $('.lb-prev').addEventListener('click', function () { gi = (gi - 1 + group.length) % group.length; show(); });
  $('.lb-next').addEventListener('click', function () { gi = (gi + 1) % group.length; show(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') $('.lb-prev').click();
    if (e.key === 'ArrowRight') $('.lb-next').click();
  });
})();
