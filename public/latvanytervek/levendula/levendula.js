/* Levendula Szépségszalon – 3. változat */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var desktop = window.matchMedia('(min-width:1001px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var hero = $('.hero');
  var ready = function () { if (hero) hero.classList.add('is-ready'); };

  /* ---------- header ---------- */
  var hdr = $('.hdr'), mbar = $('.mbar');
  var heroEnd = function () { return hero ? hero.offsetTop + hero.offsetHeight - 80 : 200; };
  var pinExtra = 0;
  var onScroll = function () {
    var y = window.scrollY;
    hdr.classList.toggle('is-solid', y > heroEnd() + pinExtra);
    hdr.classList.toggle('is-scrolled', y > 8);
    if (mbar) {
      var on = !desktop.matches && y > (hero ? hero.offsetHeight * 0.7 : 300);
      mbar.classList.toggle('is-on', on);
      mbar.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a,button', mbar).forEach(function (el) { el.tabIndex = on ? 0 : -1; });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* keep Tab inside an open dialog/menu */
  var trap = function (box, extra) {
    return function (e) {
      if (e.key !== 'Tab') return;
      var f = (extra ? [extra] : []).concat($$('a[href],button:not([disabled])', box)).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
  };

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
  var mmTrap = trap(mm, burger);
  document.addEventListener('keydown', function (e) {
    if (mm.hidden) return;
    if (e.key === 'Escape') { setMenu(false); burger.focus(); return; }
    mmTrap(e);
  });

  /* ---------- motion ---------- */
  if (hasG && !reduce) {
    gsap.registerPlugin(ScrollTrigger);

    requestAnimationFrame(ready);

    ScrollTrigger.matchMedia({
      '(min-width:1001px)': function () {
        /* services: horizontal ride */
        var track = $('.svc-track'), bar = $('.svc-progress i');
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        var steps = Math.max(1, track.children.length - 1);
        var h = gsap.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: '.svc', start: 'top top', end: function () { return '+=' + Math.round(dist() * 0.7); },
            pin: true, scrub: 0.6, invalidateOnRefresh: true,
            /* megálláskor mindig egy teljes kezelés-panel álljon be */
            snap: { snapTo: 1 / steps, inertia: false, duration: { min: 0.25, max: 0.6 }, delay: 0.12, ease: 'power2.inOut' },
            onUpdate: function (s) { gsap.set(bar, { scaleX: s.progress }); }
          }
        });
      },
      '(max-width:1000px)': function () {
        /* mobil: nincs képmozgatás */
      }
    });

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
      if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); showCat(tabs[e.key === 'Home' ? 0 : tabs.length - 1].dataset.cat, true); return; }
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault();
      showCat(tabs[(i + d + tabs.length) % tabs.length].dataset.cat, true);
    });
  });
  $$('[data-count]').forEach(function (a) {
    var p = $('.p-panel[data-cat="' + a.dataset.goto + '"]');
    if (p) a.textContent = 'Mind a ' + $$('.mi', p).length + ' tétel és ár';
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
  var lbTrap = trap(lb);
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    lbTrap(e);
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') $('.lb-prev').click();
    if (e.key === 'ArrowRight') $('.lb-next').click();
  });
})();
