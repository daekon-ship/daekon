/* ==========================================================================
   BB motion-fx — animációk a Motion könyvtárral (https://motion.dev)
   --------------------------------------------------------------------------
   A Motion 11.18.2 (vanilla, window.Motion) HELYBEN van: js/vendor/.
   Ha nem töltődik be, vagy a látogató csökkentett mozgást kért, ez a fájl
   semmit nem csinál, és a CSS-alapú tartalék animációk maradnak.

   Mit használ a Motionből: animate (rugó, kulcskocka, végtelen ismétlés),
   stagger, inView, scroll (scroll-linked + sebesség), pathLength (SVG-rajzolás).

   Effektek:
    1. Logó: a fejléc-logó kinyílik; a Rólam-részben a teljes logó
       (vektorizált SVG) vonalanként megrajzolódik, majd kitöltődik.
    2. Címek: szavanként, maszk mögül, elmosásból úsznak be.
    3. Ikonok: minden ikon „megrajzolódik", hoverre újrarajzolódik.
    4. Nyitókép: rétegzett fotók belépése, egérkövető mélység, görgetéses
       parallaxis, lebegő virág.
    5. Futó fotószalag: a görgetés sebességére gyorsul és megdől.
    6. Mágneses gombok, 3D-ben billenő kártyák fényfolttal, saját kurzorgyűrű.
    7. Csúszó szűrő-jelölő, rugós GYIK-lenyitás, nagyító a bélyegképből nyílik.
    8. Megjelenés görgetésre, lépcsőzve; görgetés-előrehaladás csík.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!M || !M.animate || reduce) { window.BBFX = null; return; }
  var animate = M.animate, stagger = M.stagger, inView = M.inView, scroll = M.scroll;
  var EASE = [0.22, 0.7, 0.2, 1];
  var SPRING = { type: 'spring', stiffness: 260, damping: 26 };
  var SOFT = { type: 'spring', stiffness: 160, damping: 17, mass: 0.6 };
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  root.classList.add('has-motion');

  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { /* animáció nélkül is működjön */ } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  /* hover / press — natív eseményekkel, Motion-animációval */
  function onHover(el, start) {
    var end = null;
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'touch') return; end = start(e) || null; });
    el.addEventListener('pointerleave', function () { if (end) end(); end = null; });
  }
  function onPress(el, start) {
    var end = null;
    el.addEventListener('pointerdown', function () { end = start() || null; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { el.addEventListener(t, function () { if (end) { end(); end = null; } }); });
  }

  /* ---------- szavakra bontás a címekhez ---------- */
  function split(el) {
    if (el.__split) return el.__split; var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
            w.appendChild(i); frag.appendChild(w); words.push(i);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    })(el);
    el.classList.add('is-split'); el.__split = words; return words;
  }
  function wordsIn(words, delay) {
    return animate(words, { y: ['110%', '0%'], opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'], rotate: [4, 0] },
      { duration: 0.9, ease: EASE, delay: stagger(0.05, { startDelay: delay || 0 }) });
  }

  /* ---------- ikonok megrajzolása ---------- */
  function shapes(svg) { return $$('path, circle, rect, line, polyline', svg); }
  function drawIcon(svg, opts) {
    var s = shapes(svg); if (!s.length) return;
    safe(function () { animate(s, { pathLength: [0, 1], opacity: [0, 1] }, Object.assign({ duration: 0.9, ease: EASE, delay: stagger(0.08) }, opts || {})); });
  }
  function icons() {
    $$('svg.ico').forEach(function (svg) {
      if (svg.closest('.lightbox, .mnav, .mbar, .hdr')) return;
      var host = svg.closest('.values > div, .perk, .cat, .contact, .btn, .link, .callout, .sumcard, .qb, section') || svg;
      safe(function () { inView(svg, function () { drawIcon(svg, { delay: stagger(0.08, { startDelay: 0.15 }) }); }, { margin: '0px 0px -6% 0px' }); });
      if (host !== svg && host.tagName !== 'SECTION') onHover(host, function () { drawIcon(svg, { duration: 0.6 }); });
    });
  }

  /* ---------- 1. logó ---------- */
  function logo() {
    var img = document.querySelector('.hdr .brand .logo');
    if (img) safe(function () {
      animate(img, { opacity: [0, 1], clipPath: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'], filter: ['blur(6px)', 'blur(0px)'] }, { duration: 1.3, ease: EASE, delay: 0.1 });
    });
    var hdr = document.querySelector('.hdr');
    if (hdr) safe(function () { animate($$('.nav > *, .hdr-cta, .hdr .btn', hdr), { opacity: [0, 1], y: [-10, 0] }, { duration: 0.6, ease: EASE, delay: stagger(0.05, { startDelay: 0.25 }) }); });

    $$('.logo-draw').forEach(function (svg) {
      var all = $$('path', svg); if (!all.length) return;
      svg.classList.add('is-drawing');
      all.forEach(function (p) {
        p.setAttribute('pathLength', '1'); p.setAttribute('stroke-dasharray', '0px 1px');
        p.setAttribute('fill-opacity', '0'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2.6'); p.setAttribute('stroke-linejoin', 'round');
      });
      safe(function () {
        inView(svg, function () {
          var em = $$('.lg-emblem path', svg), tx = $$('.lg-word path, .lg-sub path', svg);
          animate(em, { pathLength: [0, 1] }, { duration: 2.4, ease: [0.45, 0.05, 0.2, 1], delay: stagger(0.12) });
          animate(tx, { pathLength: [0, 1] }, { duration: 1.4, ease: EASE, delay: stagger(0.05, { startDelay: 0.9 }) });
          animate(0, 1, { duration: 1.2, ease: EASE, delay: 2.1, onUpdate: function (v) {
            all.forEach(function (p) { p.setAttribute('fill-opacity', v.toFixed(3)); p.setAttribute('stroke-opacity', (1 - v).toFixed(3)); });
          } });
          animate(svg, { scale: [0.94, 1], rotate: [-2, 0] }, { duration: 2.6, ease: EASE });
        }, { margin: '0px 0px -12% 0px' });
      });
    });
  }

  /* ---------- 2. nyitókép ---------- */
  function hero() {
    var h1 = document.querySelector('.hero h1, .page-hero h1');
    if (h1) safe(function () { h1.style.opacity = 1; h1.style.transform = 'none'; h1.classList.add('is-in'); wordsIn(split(h1), 0.15); });
    var items = $$('.hero-copy > *:not(h1), .page-hero-grid > div:first-child > *:not(h1)');
    if (items.length) safe(function () { animate(items, { opacity: [0, 1], y: [22, 0], filter: ['blur(4px)', 'blur(0px)'] }, { duration: 0.9, ease: EASE, delay: stagger(0.09, { startDelay: 0.35 }) }); });
    var qb = document.querySelector('.qb, .sumcard');
    if (qb) safe(function () {
      animate(qb, { opacity: [0, 1], y: [50, 0], scale: [0.96, 1] }, Object.assign({ delay: 0.5 }, SPRING));
      animate($$('.qb-svc, .sum-list li', qb), { opacity: [0, 1], x: [-14, 0] }, { duration: 0.55, ease: EASE, delay: stagger(0.06, { startDelay: 0.75 }) });
      animate($$('.qb-slot', qb), { opacity: [0, 1], y: [14, 0], scale: [0.9, 1] }, Object.assign({ delay: stagger(0.08, { startDelay: 1.0 }) }, SPRING));
    });
  }
  function stage() {
    var st = document.querySelector('.hero-stage'); if (!st) return;
    var main = st.querySelector('.hs-main'), sub = st.querySelector('.hs-sub'), mini = st.querySelector('.hs-mini'), fl = st.querySelector('.hs-ring'), glows = $$('.hs-glow', st), tag = st.querySelector('.hs-tag');
    safe(function () {
      animate(main, { opacity: [0, 1], clipPath: ['inset(100% 0% 0% 0% round 200px 200px 22px 22px)', 'inset(0% 0% 0% 0% round 200px 200px 22px 22px)'] }, { duration: 1.3, ease: EASE, delay: 0.1 });
      animate(main.querySelector('img'), { scale: [1.25, 1] }, { duration: 1.8, ease: EASE, delay: 0.1 });
      animate(sub, { opacity: [0, 1], y: [80, 0], rotate: [-8, 0] }, Object.assign({ delay: 0.6 }, SPRING));
      animate(mini, { opacity: [0, 1], scale: [0.3, 1], rotate: [-40, 0] }, Object.assign({ delay: 0.85 }, SPRING));
      animate(fl, { opacity: [0, 1], scale: [0.4, 1] }, Object.assign({ delay: 1.0 }, SPRING));
      animate(fl.querySelector('text'), { rotate: [0, 360] }, { duration: 26, ease: 'linear', repeat: Infinity });
      glows.forEach(function (g, i) {
        animate(g, { opacity: [0, 1], scale: [0.6, 1] }, { duration: 2, ease: EASE, delay: 0.2 + i * 0.3 }).then(function () {
          animate(g, { x: i ? [0, -30, 20, 0] : [0, 40, -20, 0], y: i ? [0, 25, -15, 0] : [0, -30, 20, 0], scale: [1, 1.12, 0.95, 1] }, { duration: 14 + i * 4, ease: 'easeInOut', repeat: Infinity });
        });
      });
      animate(tag, { opacity: [0, 1], x: [30, 0] }, Object.assign({ delay: 1.2 }, SPRING));
    });
    if (scroll) safe(function () {
      var o = { target: st, offset: ['start start', 'end start'] };
      scroll(animate(main, { y: [0, -80] }, { ease: 'linear' }), o);
      scroll(animate(sub, { y: [0, 60] }, { ease: 'linear' }), o);
      scroll(animate(mini, { y: [0, -120] }, { ease: 'linear' }), o);
    });
    /* egérkövető mélység — a CSS translate tulajdonságon, hogy ne ütközzön a Motion transformjával */
    if (FINE) {
      var layers = [[main, 14], [sub, 30], [mini, 42], [fl, 22], [tag, 20]], tx = 0, ty = 0, cx = 0, cy = 0, run = false;
      var hero = st.closest('.hero') || st;
      hero.addEventListener('pointermove', function (e) {
        var r = st.getBoundingClientRect(); tx = (e.clientX - (r.left + r.width / 2)) / r.width; ty = (e.clientY - (r.top + r.height / 2)) / r.height;
        if (!run) { run = true; requestAnimationFrame(tick); }
      });
      hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!run) { run = true; requestAnimationFrame(tick); } });
      function tick() {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        layers.forEach(function (l) { if (l[0]) l[0].style.translate = (cx * l[1]).toFixed(2) + 'px ' + (cy * l[1]).toFixed(2) + 'px'; });
        if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(tick); else run = false;
      }
    }
    [main, sub, mini].forEach(function (f) {
      if (!f) return; var im = f.querySelector('img');
      onHover(f, function () { animate(im, { scale: 1.08 }, { duration: 0.9, ease: EASE }); return function () { animate(im, { scale: 1 }, { duration: 0.9, ease: EASE }); }; });
    });
  }

  /* ---------- 3. futó fotószalag, görgetési sebességgel ---------- */
  function marquee() {
    $$('[data-marquee] .marquee-track').forEach(function (t) {
      safe(function () {
        var ctl = animate(t, { x: ['0%', '-50%'] }, { duration: 70, ease: 'linear', repeat: Infinity });
        var box = t.parentElement, hover = false, boost = 0, cur = 1;
        box.addEventListener('pointerenter', function () { hover = true; });
        box.addEventListener('pointerleave', function () { hover = false; });
        if (scroll) scroll(function (p, info) { var v = info && info.y ? info.y.velocity : 0; boost = Math.max(boost, Math.min(Math.abs(v) / 250, 6)); });
        (function loop() {
          boost *= 0.94;
          var target = hover ? 0.15 : 1 + boost; cur += (target - cur) * 0.08; ctl.speed = cur;
          t.style.setProperty('--skew', (-boost * 1.2).toFixed(2) + 'deg');
          requestAnimationFrame(loop);
        })();
        animate($$('.mq', t).slice(0, 8), { opacity: [0, 1], y: [40, 0], rotate: [3, 0] }, Object.assign({ delay: stagger(0.07, { startDelay: 0.2 }) }, SPRING));
      });
    });
    var flw = document.querySelector('.sec-glow');
    if (flw && scroll) safe(function () { scroll(animate(flw, { x: ['-20%', '20%'], scale: [0.8, 1.2] }, { ease: 'linear' }), { target: flw.parentElement }); });
  }

  /* ---------- 4. megjelenés görgetésre ---------- */
  function reveals() {
    var done = new WeakSet();
    $$('.sec-head h2.rv, .about h2.rv, .callout h2').forEach(function (h) { if (h.classList.contains('rv')) split(h); });
    $$('.rv, .rv-img').forEach(function (el) {
      if (el.closest('.hero-copy') || el.closest('.page-hero-grid > div:first-child') || el.matches('.qb, .sumcard')) return;
      safe(function () {
        inView(el.classList.contains('rv-img') ? el.parentElement : el, function () {
          if (done.has(el)) return; done.add(el);
          var sibs = el.parentElement ? $$(':scope > .rv', el.parentElement) : [el];
          var i = Math.max(0, sibs.indexOf(el));
          if (el.__split) { el.style.opacity = 1; el.style.transform = 'none'; wordsIn(el.__split, 0.05); }
          else if (el.classList.contains('rv-img')) {
            animate(el, { clipPath: ['inset(0% 0% 100% 0% round 14px)', 'inset(0% 0% 0% 0% round 14px)'] }, { duration: 1.1, ease: EASE, delay: Math.min(i, 4) * 0.07 });
            var im = el.querySelector('img'); if (im) animate(im, { scale: [1.2, 1] }, { duration: 1.5, ease: EASE, delay: Math.min(i, 4) * 0.07 });
          } else if (el.matches('.cat, .svc-card, .values > div, .perk, .price-row')) {
            animate(el, { opacity: [0, 1], y: [50, 0], rotateX: [14, 0], transformPerspective: 900 }, Object.assign({ delay: Math.min(i, 6) * 0.08 }, SPRING));
          } else {
            animate(el, { opacity: [0, 1], y: [26, 0], filter: ['blur(5px)', 'blur(0px)'] }, { duration: 0.85, ease: EASE, delay: Math.min(i, 5) * 0.07 });
          }
          $$('.dial-fg', el).forEach(function (c) {
            var full = 2 * Math.PI * 19;
            animate(c, { strokeDashoffset: [full, +c.getAttribute('data-off')] }, { duration: 1.4, ease: EASE, delay: 0.25 });
          });
        }, { margin: '0px 0px -8% 0px' });
      });
    });
    /* galéria: lépcsőzetes, enyhén elforduló belépés */
    var g = document.getElementById('gallery');
    if (g) safe(function () {
      inView(g, function () {
        $$('.g-item', g).forEach(function (it, i) {
          animate(it, { opacity: [0, 1], y: [60, 0], scale: [0.9, 1], rotate: [i % 2 ? 3 : -3, 0] }, Object.assign({ delay: i * 0.06 }, SPRING));
        });
      }, { margin: '0px 0px -10% 0px' });
    });
    /* szekciófejek finom parallaxisa */
    if (scroll && FINE) $$('.sec-head .eyebrow').forEach(function (e) {
      safe(function () { scroll(animate(e, { x: [-14, 14] }, { ease: 'linear' }), { target: e, offset: ['start end', 'end start'] }); });
    });
  }

  /* ---------- 5. görgetés-előrehaladás csík ---------- */
  function progress() {
    var hdr = document.querySelector('.hdr'); if (!hdr || !scroll) return;
    var bar = document.createElement('i'); bar.className = 'scroll-bar'; bar.setAttribute('aria-hidden', 'true');
    hdr.appendChild(bar);
    safe(function () { scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' })); });
  }

  /* ---------- 6. gesztusok: nyomás, mágnes, billenés, kurzor ---------- */
  function gestures() {
    $$('.btn, .qb-slot, .qb-svc, .chip, .slot, .pick, .cal-d, .g-item, .lb-btn').forEach(function (el) {
      onPress(el, function () {
        animate(el, { scale: 0.95 }, { duration: 0.12 });
        return function () { animate(el, { scale: 1 }, SPRING); };
      });
    });
    if (!FINE) return;
    /* mágneses gombok */
    $$('.btn:not(.btn--sm), .lb-btn, .hdr-burger').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        animate(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.32 }, SOFT);
      });
      el.addEventListener('pointerleave', function () { animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 300, damping: 12 }); });
    });
    /* 3D-ben billenő kártyák fényfolttal */
    $$('.cat, .svc-card, .values > div, .perk, .shot, .g-item, .qb-slot, .sumcard, .callout').forEach(function (el) {
      var amp = el.matches('.qb-slot') ? 10 : el.matches('.g-item, .shot') ? 7 : 5;
      el.classList.add('tilt');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        animate(el, { rotateY: (px - 0.5) * amp, rotateX: (0.5 - py) * amp, transformPerspective: 900, y: -4 }, { duration: 0.35, ease: 'easeOut' });
      });
      el.addEventListener('pointerleave', function () { animate(el, { rotateY: 0, rotateX: 0, y: 0 }, SPRING); });
    });
    cursor();
  }
  function cursor() {
    var ring = document.createElement('div'); ring.className = 'cursor'; ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<span class="cursor-ring"></span><span class="cursor-label"></span>';
    var dot = document.createElement('div'); dot.className = 'cursor-dot'; dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); document.body.appendChild(dot);
    var label = ring.querySelector('.cursor-label'), r = ring.querySelector('.cursor-ring'), state = '', shown = false, lx = -99, ly = -99;
    window.addEventListener('scroll', function () {
      if (!shown) return; var el = document.elementFromPoint(lx, ly); if (el) update(el);
    }, { passive: true });
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; animate([ring, dot], { opacity: 1 }, { duration: 0.3 }); }
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; lx = e.clientX; ly = e.clientY;
      animate(ring, { x: e.clientX, y: e.clientY }, { type: 'spring', stiffness: 600, damping: 40, mass: 0.5 });
      update(e.target);
    });
    function update(target) {
      var t = target.closest && target.closest('.g-item, .shot, .mq, .hero-stage figure, a, button, summary, [role=radio], label, input, select, textarea');
      var s = !t ? '' : t.matches('.g-item, .shot, .mq, .hero-stage figure') ? 'view' : t.matches('input, select, textarea') ? 'text' : 'link';
      if (s === state) return; state = s;
      label.textContent = s === 'view' ? (t.matches('.g-item') ? 'Nagyítás' : 'Nézd') : '';
      animate(r, { scale: s === 'view' ? 2.6 : s === 'link' ? 1.6 : s === 'text' ? 0.4 : 1, backgroundColor: s === 'view' ? 'rgba(42,31,37,.88)' : 'rgba(42,31,37,0)' }, SOFT);
      animate(label, { opacity: s === 'view' ? 1 : 0, scale: s === 'view' ? 1 : 0.6 }, SOFT);
      animate(dot, { scale: s ? 0 : 1 }, SOFT);
    }
    document.addEventListener('pointerleave', function () { shown = false; animate([ring, dot], { opacity: 0 }, { duration: 0.3 }); });
    root.classList.add('has-cursor');
  }

  /* ---------- 7. csúszó szűrő-jelölő, rugós GYIK ---------- */
  function chips() {
    $$('#priceChips, #galleryChips').forEach(function (box) {
      var ind = document.createElement('span'); ind.className = 'chip-ind'; ind.setAttribute('aria-hidden', 'true');
      box.insertBefore(ind, box.firstChild); box.classList.add('has-ind');
      function place(ch, anim) {
        var o = { x: ch.offsetLeft, width: ch.offsetWidth, height: ch.offsetHeight, y: ch.offsetTop };
        if (anim) animate(ind, o, { type: 'spring', stiffness: 380, damping: 30 }); else { ind.style.width = o.width + 'px'; ind.style.height = o.height + 'px'; ind.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)'; animate(ind, o, { duration: 0 }); }
      }
      var cur = box.querySelector('[aria-pressed="true"]'); if (cur) place(cur, false);
      box.addEventListener('click', function (e) { var ch = e.target.closest('.chip'); if (ch) place(ch, true); });
      window.addEventListener('resize', function () { var c = box.querySelector('[aria-pressed="true"]'); if (c) place(c, false); });
    });
  }
  function faq() {
    $$('.faq details').forEach(function (d) {
      var sum = d.querySelector('summary'), ans = d.querySelector('.ans'); if (!sum || !ans) return;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open) {
          animate(ans, { height: [ans.offsetHeight + 'px', '0px'], opacity: [1, 0] }, { duration: 0.35, ease: EASE }).then(function () { d.open = false; ans.style.height = ''; ans.style.opacity = ''; });
        } else {
          d.open = true; var h = ans.scrollHeight;
          animate(ans, { height: ['0px', h + 'px'], opacity: [0, 1] }, { type: 'spring', stiffness: 220, damping: 26 }).then(function () { ans.style.height = ''; });
          animate($$('.ans > *', d), { y: [10, 0], opacity: [0, 1] }, { duration: 0.5, ease: EASE, delay: stagger(0.05, { startDelay: 0.08 }) });
        }
        var pm = sum.querySelector('.pm'); if (pm) animate(pm, { rotate: d.open ? 0 : 180 }, SPRING);
      });
    });
  }

  /* ---------- nyilvános segédek (site.js, booking.js, admin.js hívja) ---------- */
  window.BBFX = {
    pop: function (els) {
      els = Array.prototype.slice.call(els || []).filter(function (e) { return e.offsetParent !== null; });
      if (!els.length) return;
      safe(function () { animate(els, { opacity: [0, 1], y: [14, 0], scale: [0.94, 1] }, Object.assign({ delay: stagger(0.04) }, SPRING)); });
    },
    step: function (host) {
      var kids = Array.prototype.slice.call(host.children);
      safe(function () { animate(kids, { opacity: [0, 1], x: [24, 0], filter: ['blur(4px)', 'blur(0px)'] }, { duration: 0.5, ease: EASE, delay: stagger(0.05) }); });
      $$('svg.ico', host).forEach(function (s) { drawIcon(s, { duration: 0.7 }); });
    },
    done: function (root) {
      var ring = root.querySelector('.done-ring'), tick = root.querySelector('.done-tick');
      safe(function () {
        if (ring) animate(ring, { strokeDashoffset: [226.2, 0] }, { duration: 1, ease: EASE });
        if (tick) animate(tick, { strokeDashoffset: [40, 0] }, { duration: 0.45, ease: EASE, delay: 0.75 });
        var t = root.querySelector('.ticket'); if (t) animate(t, { opacity: [0, 1], y: [30, 0], rotateX: [20, 0], transformPerspective: 800 }, Object.assign({ delay: 0.35 }, SPRING));
        confetti(root);
      });
    },
    count: function (els) {
      Array.prototype.slice.call(els || []).forEach(function (el) {
        var txt = el.textContent, m = txt.replace(/ /g, ' ').match(/^([\d ]+)(.*)$/);
        if (!m) return;
        var target = +m[1].replace(/ /g, ''), suffix = m[2];
        if (!isFinite(target) || target === 0) return;
        safe(function () {
          animate(0, target, {
            duration: 1.1, ease: EASE,
            onUpdate: function (v) { el.textContent = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + suffix; },
            onComplete: function () { el.textContent = txt; }
          });
        });
      });
    },
    modal: function (card) { safe(function () { animate(card, { opacity: [0, 1], y: [30, 0], scale: [0.96, 1] }, SPRING); }); },
    toast: function (el) { safe(function () { animate(el, { opacity: [0, 1], y: [24, 0], scale: [0.9, 1] }, SPRING); }); },
    /* nagyító: a kép a kattintott bélyegképből nyílik ki */
    lightbox: function (stage) {
      safe(function () {
        var from = document.activeElement && document.activeElement.closest && document.activeElement.closest('.g-item');
        var img = stage.querySelector('img');
        if (from && img) {
          var a = from.getBoundingClientRect(), b = img.getBoundingClientRect();
          if (b.width) {
            animate(img, { x: [a.left + a.width / 2 - (b.left + b.width / 2), 0], y: [a.top + a.height / 2 - (b.top + b.height / 2), 0], scale: [a.width / b.width, 1] }, { type: 'spring', stiffness: 200, damping: 25 });
            return;
          }
        }
        animate(stage, { opacity: [0, 1], scale: [0.94, 1] }, { duration: 0.45, ease: EASE });
      });
    }
  };
  /* sikeres foglalás: arany „konfetti" pontok */
  function confetti(host) {
    var box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    var cols = ['#C9849A', '#A596C2', '#E3C2CC', '#2A1F25'], bits = [];
    for (var i = 0; i < 28; i++) { var s = document.createElement('i'); s.style.background = cols[i % 4]; box.appendChild(s); bits.push(s); }
    var at = host.querySelector('.done-ring') ? host.querySelector('.done-ring').closest('svg').parentElement : host;
    if (getComputedStyle(at).position === 'static') at.style.position = 'relative';
    at.appendChild(box);
    bits.forEach(function (s, i) {
      var ang = (i / bits.length) * Math.PI * 2, dist = 70 + Math.random() * 90;
      animate(s, { x: [0, Math.cos(ang) * dist], y: [0, Math.sin(ang) * dist + 40], rotate: [0, Math.random() * 360], opacity: [1, 1, 0], scale: [0.4, 1, 0.6] }, { duration: 1.4, ease: [0.1, 0.6, 0.3, 1], delay: 0.6 + Math.random() * 0.15 });
    });
    setTimeout(function () { box.remove(); }, 2600);
  }

  function init() {
    logo(); hero(); stage(); marquee(); reveals(); icons(); progress(); gestures(); chips(); faq();
  }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
})();
