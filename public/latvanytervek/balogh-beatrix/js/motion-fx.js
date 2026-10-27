/* ==========================================================================
   BB motion-fx — animációk a Motion könyvtárral (https://motion.dev)
   --------------------------------------------------------------------------
   A Motion (vanilla JS, window.Motion) a jsDelivr CDN-ről töltődik, rögzített
   verzióval. Ha nem töltődik be, vagy a látogató csökkentett mozgást kért,
   ez a fájl semmit nem csinál, és a CSS-alapú tartalék animációk maradnak.
   Kiváltók: betöltés (hero), görgetés (inView, scroll), interakció
   (hover, press, szűrés, lépésváltás, modális).
   ========================================================================== */
(function () {
  'use strict';
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!M || !M.animate || reduce) { window.BBFX = null; return; }
  var animate = M.animate, stagger = M.stagger, inView = M.inView, scroll = M.scroll;
  var EASE = [0.22, 0.7, 0.2, 1];
  var SPRING = { type: 'spring', stiffness: 260, damping: 26 };
  document.documentElement.classList.add('has-motion');

  /* Az .rv elemeket a CSS rejti; a Motion a végállapotot inline stílusként írja,
     így a késleltetés alatt sem villan fel semmi. */
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { /* animáció nélkül is működjön */ } }

  /* ---------- 1. Betöltés: hero ---------- */
  function hero() {
    var items = $$('.hero-copy > *');
    if (items.length) {
      safe(function () { animate(items, { opacity: [0, 1], y: [18, 0] }, { duration: 0.8, ease: EASE, delay: stagger(0.08, { startDelay: 0.05 }) }); });
    }
    var qb = document.querySelector('.qb, .sumcard');
    if (qb) {
      safe(function () { animate(qb, { opacity: [0, 1], y: [34, 0], scale: [0.97, 1] }, Object.assign({ delay: 0.25 }, SPRING)); });
      var rows = $$('.qb-svc, .sum-list li', qb);
      safe(function () { animate(rows, { opacity: [0, 1], x: [-10, 0] }, { duration: 0.5, ease: EASE, delay: stagger(0.05, { startDelay: 0.45 }) }); });
    }
  }

  /* ---------- 1/b. Nyitókép-fotók, parallax, futó szalag ---------- */
  function stage() {
    var st = document.querySelector('.hero-stage'); if (!st) return;
    var main = st.querySelector('.hs-main'), sub = st.querySelector('.hs-sub'), mini = st.querySelector('.hs-mini'), fl = st.querySelector('.hs-flower'), tag = st.querySelector('.hs-tag');
    safe(function () {
      animate(main, { opacity: [0, 1], clipPath: ['inset(100% 0% 0% 0% round 200px 200px 22px 22px)', 'inset(0% 0% 0% 0% round 200px 200px 22px 22px)'] }, { duration: 1.2, ease: EASE, delay: 0.1 });
      animate(main.querySelector('img'), { scale: [1.18, 1] }, { duration: 1.6, ease: EASE, delay: 0.1 });
      animate(sub, { opacity: [0, 1], y: [60, 0], rotate: [-4, 0] }, Object.assign({ delay: 0.55 }, SPRING));
      animate(mini, { opacity: [0, 1], scale: [0.6, 1] }, Object.assign({ delay: 0.75 }, SPRING));
      animate(fl, { opacity: [0, 0.55], rotate: [-18, 0], scale: [0.85, 1] }, { duration: 1.6, ease: EASE, delay: 0.4 });
      animate(tag, { opacity: [0, 1], x: [20, 0] }, { duration: 0.7, ease: EASE, delay: 1.0 });
    });
    if (scroll) safe(function () {
      var o = { target: st, offset: ['start start', 'end start'] };
      scroll(animate(main, { y: [0, -60] }, { ease: 'linear' }), o);
      scroll(animate(sub, { y: [0, 50] }, { ease: 'linear' }), o);
      scroll(animate(mini, { y: [0, -90] }, { ease: 'linear' }), o);
      scroll(animate(fl, { rotate: [0, 25] }, { ease: 'linear' }), o);
    });
    if (M.hover) [main, sub, mini].forEach(function (f) {
      safe(function () { M.hover(f, function () { animate(f.querySelector('img'), { scale: 1.06 }, { duration: 0.8, ease: EASE }); return function () { animate(f.querySelector('img'), { scale: 1 }, { duration: 0.8, ease: EASE }); }; }); });
    });
  }
  function marquee() {
    $$('[data-marquee] .marquee-track').forEach(function (t) {
      safe(function () {
        var ctl = animate(t, { x: ['0%', '-50%'] }, { duration: 60, ease: 'linear', repeat: Infinity });
        var box = t.parentElement;
        box.addEventListener('mouseenter', function () { ctl.speed = 0.2; });
        box.addEventListener('mouseleave', function () { ctl.speed = 1; });
      });
    });
    var flw = document.querySelector('.sec-flower');
    if (flw && scroll) safe(function () { scroll(animate(flw, { rotate: [-20, 20], y: [40, -40] }, { ease: 'linear' }), { target: flw.parentElement }); });
  }

  /* ---------- 2. Görgetés: megjelenés csoportonként, lépcsőzve ---------- */
  function reveals() {
    var done = new WeakSet();
    $$('.rv, .rv-img').forEach(function (el) {
      if (el.closest('.hero-copy') || el.matches('.qb, .sumcard')) return;
      safe(function () {
        inView(el.classList.contains('rv-img') ? el.parentElement : el, function () {
          if (done.has(el)) return; done.add(el);
          var sibs = el.parentElement ? $$(':scope > .rv', el.parentElement) : [el];
          var i = Math.max(0, sibs.indexOf(el));
          if (el.classList.contains('rv-img')) {
            animate(el, { clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 1.1, ease: EASE, delay: Math.min(i, 4) * 0.06 });
          } else {
            animate(el, { opacity: [0, 1], y: [22, 0] }, { duration: 0.75, ease: EASE, delay: Math.min(i, 5) * 0.07 });
          }
          $$('.dial-fg', el).forEach(function (c) {
            var full = 2 * Math.PI * 19;
            animate(c, { strokeDashoffset: [full, +c.getAttribute('data-off')] }, { duration: 1.2, ease: EASE, delay: 0.2 });
          });
        }, { margin: '0px 0px -8% 0px' });
      });
    });
  }

  /* ---------- 3. Görgetés-előrehaladás csík a fejlécben ---------- */
  function progress() {
    var hdr = document.querySelector('.hdr'); if (!hdr || !scroll) return;
    var bar = document.createElement('i'); bar.className = 'scroll-bar'; bar.setAttribute('aria-hidden', 'true');
    hdr.appendChild(bar);
    safe(function () { scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' })); });
  }

  /* ---------- 4. Hover és press ---------- */
  function gestures() {
    if (M.press) {
      $$('.btn, .qb-slot, .qb-svc, .chip, .slot, .pick, .cal-d, .g-item').forEach(function (el) {
        safe(function () {
          M.press(el, function () {
            animate(el, { scale: 0.97 }, { duration: 0.12 });
            return function () { animate(el, { scale: 1 }, SPRING); };
          });
        });
      });
    }
    if (M.hover) {
      $$('.cat, .price-row, .svc-card, .values > div, .faq details, .sumcard').forEach(function (el) {
        safe(function () {
          M.hover(el, function () {
            animate(el, { y: -3 }, SPRING);
            return function () { animate(el, { y: 0 }, SPRING); };
          });
        });
      });
    }
  }

  /* ---------- nyilvános segédek (site.js, booking.js, admin.js hívja) ---------- */
  window.BBFX = {
    /* rövid „felbukkanás" listaelemekre (időpontok, szűrt sorok) */
    pop: function (els) {
      els = Array.prototype.slice.call(els || []).filter(function (e) { return e.offsetParent !== null; });
      if (!els.length) return;
      safe(function () { animate(els, { opacity: [0, 1], y: [8, 0], scale: [0.98, 1] }, { duration: 0.4, ease: EASE, delay: stagger(0.035) }); });
    },
    /* foglalási lépésváltás */
    step: function (host) {
      var kids = Array.prototype.slice.call(host.children);
      safe(function () { animate(kids, { opacity: [0, 1], x: [16, 0] }, { duration: 0.45, ease: EASE, delay: stagger(0.04) }); });
    },
    /* sikeres foglalás: körív, pipa, jegy */
    done: function (root) {
      var ring = root.querySelector('.done-ring'), tick = root.querySelector('.done-tick');
      safe(function () {
        if (ring) animate(ring, { strokeDashoffset: [226.2, 0] }, { duration: 1, ease: EASE });
        if (tick) animate(tick, { strokeDashoffset: [40, 0] }, { duration: 0.45, ease: EASE, delay: 0.75 });
        var t = root.querySelector('.ticket'); if (t) animate(t, { opacity: [0, 1], y: [20, 0] }, Object.assign({ delay: 0.35 }, SPRING));
      });
    },
    /* számok felpörgetése (admin KPI) */
    count: function (els) {
      Array.prototype.slice.call(els || []).forEach(function (el) {
        var txt = el.textContent, m = txt.replace(/ /g, ' ').match(/^([\d ]+)(.*)$/);
        if (!m) return;
        var target = +m[1].replace(/ /g, ''), suffix = m[2];
        if (!isFinite(target) || target === 0) return;
        safe(function () {
          animate(0, target, {
            duration: 0.9, ease: EASE,
            onUpdate: function (v) { el.textContent = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + suffix; },
            onComplete: function () { el.textContent = txt; }
          });
        });
      });
    },
    /* modális és értesítés */
    modal: function (card) { safe(function () { animate(card, { opacity: [0, 1], y: [24, 0], scale: [0.98, 1] }, SPRING); }); },
    toast: function (el) { safe(function () { animate(el, { opacity: [0, 1], y: [16, 0] }, SPRING); }); },
    lightbox: function (el) { safe(function () { animate(el, { opacity: [0, 1], scale: [0.96, 1] }, { duration: 0.4, ease: EASE }); }); }
  };

  function init() { hero(); stage(); marquee(); reveals(); progress(); gestures(); }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
