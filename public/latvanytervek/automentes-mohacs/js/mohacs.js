/* NON-STOP AUTÓMENTÉS MOHÁCS — interakciók és mozgás.
   Mozgás: Motion 11.18.2 (motion.dev), helyben: js/vendor/motion-11.18.2.min.js.
   Ha a Motion nem tölt be, vagy a látogató csökkentett mozgást kér, natív tartalék fut. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  root.classList.add('js');
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* Motion elérhető? */
  var M = (!reduce && w.Motion && typeof w.Motion.animate === 'function') ? w.Motion : null;
  var EASE = [0.2, 0.7, 0.2, 1];
  function fx(fn) { if (!M) return; try { fn(M); } catch (e) { if (w.console) console.warn('[motion]', e); } }

  var hero = $('.hero'), truck = $('#truck'), dock = $('.dock'), hdr = $('#fejlec'), contact = $('#kapcsolat');

  /* ---- Ügyeleti óra (budapesti idő) ---- */
  var ora = $('#ora');
  function tick() {
    if (!ora) return;
    try {
      ora.textContent = new Intl.DateTimeFormat('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' }).format(new Date());
    } catch (e) { ora.textContent = '0–24'; }
  }
  tick(); setInterval(tick, 20000);

  /* ==================================================================
     HERO + MEGJELENÉSEK: Motion vagy natív tartalék
     ================================================================== */
  var motionOn = false;
  if (M) {
    try { motionFX(M); motionOn = true; }
    catch (e) {
      if (w.console) console.warn('[motion] tartalék', e);
      root.classList.remove('fx');
      $$('[data-reveal], [data-hero], #truck').forEach(function (el) { el.style.opacity = ''; el.style.transform = ''; });
    }
  }
  if (!motionOn) { nativeHero(); nativeReveal(); }

  function motionFX(Mo) {
    var animate = Mo.animate, inView = Mo.inView, scroll = Mo.scroll, stagger = Mo.stagger;
    root.classList.add('fx');

    /* 1. Hero szöveg: sorról sorra, rövid lépcsővel */
    var bits = $$('[data-hero]');
    animate(bits, { opacity: [0, 1], y: [18, 0] }, { duration: 0.6, delay: stagger(0.07, { startDelay: 0.05 }), ease: EASE });

    /* 2. A mentő rugós fizikával begördül és megáll; a szállított autó a fékezésnél előrebillen */
    if (truck && hero) {
      var fromX = -(truck.getBoundingClientRect().right + 80);
      truck.style.transform = 'translateX(' + fromX + 'px)';
      hero.classList.add('is-ready', 'is-arriving');
      truck.classList.add('is-driving');
      var drive = animate(truck, { x: [fromX, 0] }, { type: 'spring', duration: 1.5, bounce: 0.14, delay: 0.2 });
      var car = $('.car', truck);
      if (car) animate(car, { x: [0, 9, -2, 0] }, { duration: 0.9, delay: 1.05, ease: 'easeOut' });
      setTimeout(function () { hero.classList.remove('is-arriving'); }, 1150);
      drive.then(function () { truck.classList.remove('is-driving'); });

      /* görgetésre a mentő továbbgördül a képből */
      var fig = $('.hero__truck');
      if (fig) scroll(animate(fig, { x: [0, 220] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
    }

    /* 3. Szekcióelemek: csoportonként, rugós beúszással */
    var groups = [];
    $$('[data-reveal]').forEach(function (el) {
      var g = groups.filter(function (x) { return x.p === el.parentNode; })[0];
      if (!g) groups.push(g = { p: el.parentNode, items: [] });
      g.items.push(el);
    });
    groups.forEach(function (g) {
      inView(g.p, function () {
        g.items.forEach(function (el, i) {
          animate(el, { opacity: [0, 1], y: [30, 0] }, {
            y: { type: 'spring', stiffness: 150, damping: 22, delay: i * 0.08 },
            opacity: { duration: 0.45, delay: i * 0.08, ease: 'easeOut' }
          });
        });
      }, { margin: '0px 0px -8% 0px', amount: 0.05 });
    });

    /* 4. A mentés menete: az út vonala görgetéssel együtt rajzolódik ki */
    var steps = $('#steps'), draw = $('.steps__draw');
    if (steps && draw) {
      draw.setAttribute('stroke-dashoffset', '1000');
      scroll(animate(draw, { strokeDashoffset: [1000, 0] }, { ease: 'linear' }), { target: steps, offset: ['start 85%', 'end 60%'] });
    }

    /* 5. Térkép: az autópályák kirajzolódnak, Mohács tűje leesik */
    var map = $('.map');
    if (map) {
      var roads = $$('.map__mw', map), pin = $('.map__pin', map);
      roads.forEach(function (p) {
        var L = Math.ceil(p.getTotalLength());
        p.setAttribute('stroke-dasharray', L); p.setAttribute('stroke-dashoffset', L);
      });
      if (pin) pin.setAttribute('opacity', '0');
      inView(map, function () {
        roads.forEach(function (p, i) {
          var L = parseFloat(p.getAttribute('stroke-dasharray'));
          animate(p, { strokeDashoffset: [L, 0] }, { duration: 1.1, delay: 0.15 + i * 0.25, ease: EASE });
        });
        if (pin) animate(pin, { opacity: [0, 1], y: [-46, 0] }, {
          y: { type: 'spring', stiffness: 260, damping: 13, delay: 0.75 },
          opacity: { duration: 0.2, delay: 0.75 }
        });
      }, { amount: 0.35 });
    }

    /* 6. Mobil hívássáv: rugós ki-be */
    if (dock) animate(dock, { y: '140%' }, { duration: 0 });

    /* 7. Hívógombok: tapintható visszajelzés nyomásra */
    $$('.btn--call, .hdr__call, .dock').forEach(function (b) {
      var down = function () { animate(b, { scale: 0.96 }, { type: 'spring', stiffness: 700, damping: 30 }); };
      var up = function () { animate(b, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 18 }); };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
    });

    /* 8. GYIK: a válasz finoman becsúszik nyitáskor */
    $$('.faq details').forEach(function (det) {
      det.addEventListener('toggle', function () {
        if (!det.open) return;
        var p = $('p', det);
        if (p) animate(p, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.35, ease: EASE });
      });
    });
  }

  function nativeHero() {
    root.classList.add('hero-safe');
    if (hero) hero.classList.add('is-ready');
    if (!truck || !hero || reduce || !truck.animate) return;
    hero.classList.add('is-arriving');
    truck.classList.add('is-driving');
    var anim = truck.animate(
      [{ transform: 'translateX(-70vw)' }, { transform: 'translateX(1.5%)', offset: 0.82 }, { transform: 'translateX(0)' }],
      { duration: 1700, easing: 'cubic-bezier(.16,.8,.25,1)', fill: 'both' }
    );
    setTimeout(function () { hero.classList.remove('is-arriving'); }, 1100);
    anim.onfinish = function () { truck.classList.remove('is-driving'); };
  }

  function nativeReveal() {
    var revs = $$('[data-reveal]');
    if ('IntersectionObserver' in w && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target, sibs = $$('[data-reveal]', el.parentNode);
          el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 70 + 'ms';
          el.classList.add('in'); io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      revs.forEach(function (el) { io.observe(el); });
    } else { revs.forEach(function (el) { el.classList.add('in'); }); }

    var steps = $('#steps');
    if (steps && 'IntersectionObserver' in w) {
      var so = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { steps.classList.add('is-in'); so.disconnect(); }
      }, { threshold: 0.3 });
      so.observe(steps);
    } else if (steps) steps.classList.add('is-in');
  }

  /* ==================================================================
     FEJLÉC + MOBIL HÍVÁSSÁV
     ================================================================== */
  var contactVisible = false, dockOn = false;
  function setDock(on) {
    if (!dock || on === dockOn) return;
    dockOn = on;
    dock.classList.toggle('is-on', on);
    if (motionOn) fx(function (Mo) {
      Mo.animate(dock, { y: on ? '0%' : '140%' }, on
        ? { type: 'spring', stiffness: 380, damping: 28 }
        : { duration: 0.25, ease: 'easeIn' });
    });
  }
  function onScroll() {
    var y = w.scrollY;
    if (hdr) hdr.classList.toggle('is-stuck', y > 10);
    if (dock && hero) setDock(y > hero.offsetHeight * 0.55 && !contactVisible);
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if ('IntersectionObserver' in w && contact) {
    new IntersectionObserver(function (en) {
      contactVisible = en[0].isIntersecting; onScroll();
    }, { threshold: 0.25 }).observe(contact);
  }

  /* ==================================================================
     MOBIL MENÜ
     ================================================================== */
  var burger = $('#burger'), menu = $('#mobilmenu');
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    d.body.classList.remove('menu-open');
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 300);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') return closeMenu();
      menu.hidden = false; void menu.offsetWidth;
      menu.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      d.body.classList.add('menu-open');
      if (motionOn) fx(function (Mo) {
        Mo.animate($$('nav a, .btn', menu), { opacity: [0, 1], x: [-14, 0] }, { duration: 0.35, delay: Mo.stagger(0.035, { startDelay: 0.05 }), ease: EASE });
      });
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    w.addEventListener('resize', function () { if (w.innerWidth >= 1080) closeMenu(); });
  }

  /* ==================================================================
     GALÉRIA: az ügyfél saját képei a jelenlegi oldaláról
     ================================================================== */
  var gal = $('#galeria'), fb = $('#gal-fallback');
  if (gal) {
    var base = gal.getAttribute('data-src'), n = +gal.getAttribute('data-count') || 0;
    var loaded = [], pending = n;
    var done = function () {
      if (--pending > 0) return;
      if (!loaded.length) { gal.hidden = true; if (fb) fb.hidden = false; }
    };
    var startGal = function () {
      for (var i = 1; i <= n; i++) {
        (function (i) {
          var src = base + (i < 10 ? '0' + i : i) + '.webp';
          var btn = d.createElement('button');
          btn.className = 'gal__item'; btn.type = 'button';
          btn.setAttribute('aria-label', 'Referenciakép ' + i + ' nagyítása');
          var img = new Image();
          img.decoding = 'async';
          img.alt = 'Non-Stop Autómentés Mohács – referenciakép ' + i;
          btn.dataset.i = i;
          img.onload = function () {
            loaded.push(src); btn.dataset.src = src;
            var after = $$('.gal__item', gal).filter(function (b) { return +b.dataset.i > i; })[0];
            gal.insertBefore(btn, after || null);
            if (motionOn) fx(function (Mo) { Mo.animate(btn, { opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.5, ease: EASE }); });
            done();
          };
          img.onerror = function () { done(); };
          img.src = src;
          btn.appendChild(img);
          btn.addEventListener('click', function () { openLb(src); });
        })(i);
      }
    };
    if ('IntersectionObserver' in w) {
      var go = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { go.disconnect(); startGal(); }
      }, { rootMargin: '600px 0px' });
      go.observe(gal);
    } else startGal();
    if (!n && fb) { gal.hidden = true; fb.hidden = false; }
  }

  /* ---- Nagyító ---- */
  var lb, lbImg, cur = 0;
  function list() { return $$('.gal__item').slice(0, 9).map(function (b) { return b.dataset.src; }).filter(Boolean); }
  function showImg(src) {
    lbImg.src = src;
    if (motionOn) fx(function (Mo) { Mo.animate(lbImg, { opacity: [0, 1], scale: [0.96, 1] }, { type: 'spring', stiffness: 260, damping: 26 }); });
  }
  function openLb(src) {
    if (!lb) {
      lb = d.createElement('div'); lb.className = 'lb'; lb.hidden = true;
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Képnézegető');
      lb.innerHTML = '<img alt=""><button class="lb__x" aria-label="Bezárás">×</button><button class="lb__p" aria-label="Előző kép">‹</button><button class="lb__n" aria-label="Következő kép">›</button>';
      d.body.appendChild(lb); lbImg = $('img', lb);
      $('.lb__x', lb).onclick = closeLb;
      $('.lb__p', lb).onclick = function () { step(-1); };
      $('.lb__n', lb).onclick = function () { step(1); };
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
      d.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      });
    }
    var l = list(); cur = Math.max(0, l.indexOf(src));
    lbImg.alt = 'Referenciakép ' + (cur + 1);
    lb.hidden = false; d.body.classList.add('menu-open'); $('.lb__x', lb).focus();
    showImg(src);
  }
  function step(dir) { var l = list(); if (!l.length) return; cur = (cur + dir + l.length) % l.length; showImg(l[cur]); }
  function closeLb() { lb.hidden = true; d.body.classList.remove('menu-open'); }
})();
