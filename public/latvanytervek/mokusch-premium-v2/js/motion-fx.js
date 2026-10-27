/* Mókusch – látványos Motion-réteg (DAEKON, 3. kör)
   Minden effekt a Motion (motion.dev) könyvtárral készül. Csökkentett mozgásnál semmi nem fut,
   érintőképernyőn a kurzorhoz kötött effektek (kurzor, mágneses gombok, döntés) kimaradnak. */
(function () {
  'use strict';
  var M = window.Motion;
  var doc = document.documentElement;
  if (!M || !doc.classList.contains('anim')) return;
  // visszafogott mód (csökkentett mozgást kérő eszköz): nincs parallax, hulló levél, futó szalag, görgetéshez kötött mozgás
  var SOFT = doc.classList.contains('anim-soft');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var spring = function (stiff, damp) { return { type: 'spring', stiffness: stiff || 220, damping: damp || 22 }; };
  var ease = [0.22, 0.7, 0.2, 1];

  /* ---------- 1. görgetésjelző csík a fejléc alatt ---------- */
  var bar = document.createElement('div');
  bar.className = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  M.scroll(M.animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));

  /* ---------- 2. szöveg betűnként / szavanként ---------- */
  function splitWords(el) {
    if (el.dataset.split) return [];
    el.dataset.split = '1';
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var out = [];
    (function walk(node, parent) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'fx-w'; o.setAttribute('aria-hidden', 'true');
            var i = document.createElement('span'); i.className = 'fx-wi'; i.textContent = w;
            o.appendChild(i); frag.appendChild(o); out.push(i);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return out;
  }

  // nyitócím: szavanként alulról, rugóval, elmosódásból élesedve
  var h1 = $('.hero h1');
  if (h1) {
    $$('.ln', h1).forEach(function (l) { l.style.opacity = 1; l.style.transform = 'none'; });
    var w = splitWords(h1);
    M.animate(w, { y: ['110%', '0%'], opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'] },
      { delay: M.stagger(0.07, { startDelay: 0.25 }), duration: 0.9, ease: [0.16, 1, 0.3, 1] });
  }

  // fejezetcímek: szavanként, amikor a képernyőre érnek
  $$('main h2, .sub-hero h1').forEach(function (h) {
    if (h.closest('.hero')) return;
    h.style.opacity = 1; h.style.transform = 'none';
    var ws = splitWords(h);
    $$('.fx-wi', h).forEach(function (x) { x.style.transform = 'translateY(110%)'; });
    M.inView(h, function () {
      M.animate(ws, { y: ['110%', '0%'], rotate: [4, 0] }, { delay: M.stagger(0.06), duration: 0.85, ease: [0.16, 1, 0.3, 1] });
    }, { amount: 0.6 });
  });

  // kézírásos fejezetszámok: „berajzolódnak” – balról kinyíló maszk + rugós billenés
  $$('.no').forEach(function (n) {
    M.inView(n, function () {
      M.animate(n, { opacity: [0, 1], y: [0, 0], clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'], rotate: [-8, 0] }, { duration: 0.9, ease: ease });
    });
  });

  /* ---------- 3. nyitókép: függöny, egérparallax, hulló levelek ---------- */
  var heroMedia = $('.hero__media');
  if (heroMedia) {
    M.animate(heroMedia, { clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'] }, { duration: 1.4, ease: [0.77, 0, 0.18, 1], delay: 0.1 });
    var heroImg = $('.pic', heroMedia);
    var seal = $('.seal', heroMedia);
    if (seal) M.animate(seal, { scale: [0, 1], rotate: [-120, 0] }, Object.assign({ delay: 1.1 }, spring(160, 14)));
    if (fine && heroImg && !SOFT) {
      var hx = M.motionValue(0), hy = M.motionValue(0);
      heroMedia.addEventListener('pointermove', function (e) {
        var r = heroMedia.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        M.animate(heroImg, { x: dx * -26, y: dy * -18 }, spring(90, 20));
        if (seal) M.animate(seal, { x: dx * 22, y: dy * 16 }, spring(120, 16));
      });
      heroMedia.addEventListener('pointerleave', function () {
        M.animate(heroImg, { x: 0, y: 0 }, spring(90, 20));
        if (seal) M.animate(seal, { x: 0, y: 0 }, spring(120, 16));
      });
    }
    // hulló levelek és szirmok a kép előtt
    var leafPaths = [
      'M10 1 C 16 6, 17 14, 10 19 C 3 14, 4 6, 10 1 Z M10 3 L10 18',
      'M3 10 C 6 3, 14 3, 17 10 C 14 17, 6 17, 3 10 Z',
      'M10 2 C 13 7, 13 13, 10 18 C 7 13, 7 7, 10 2 Z'
    ];
    var leafColors = ['#DCC6B9', '#A6B19A', '#C9AFA0', '#F6EFE4'];
    var layer = document.createElement('div'); layer.className = 'fx-leaves'; layer.setAttribute('aria-hidden', 'true');
    heroMedia.appendChild(layer);
    var N = SOFT ? 0 : (window.innerWidth < 700 ? 6 : 11);
    for (var i = 0; i < N; i++) (function (i) {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 20 20'); s.setAttribute('class', 'fx-leaf');
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', leafPaths[i % leafPaths.length]); p.setAttribute('fill', leafColors[i % leafColors.length]);
      s.appendChild(p); layer.appendChild(s);
      var size = 10 + Math.random() * 16; s.style.width = size + 'px'; s.style.left = (Math.random() * 100) + '%';
      var drift = (Math.random() - 0.5) * 160;
      M.animate(s, { y: ['-10vh', '110vh'], x: [0, drift, drift * 0.4], rotate: [0, 260 + Math.random() * 300], opacity: [0, 0.95, 0.95, 0] },
        { duration: 12 + Math.random() * 10, delay: i * 1.3 + Math.random() * 2, repeat: Infinity, ease: 'linear' });
    })(i);
  }

  /* ---------- 4. könyvlapok: irányított képfeltárás, lebegő betétkép, görgetésre mozduló szöveg ---------- */
  $$('.spread').forEach(function (sp, k) {
    var media = $('.spread__media', sp);
    var picEl = media && $('.pic', media);
    var flip = sp.classList.contains('spread--flip');
    if (picEl) {
      picEl.removeAttribute('data-reveal');
      picEl.style.clipPath = flip ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      M.inView(media, function () {
        M.animate(picEl, { clipPath: [picEl.style.clipPath, 'inset(0 0% 0 0%)'] }, { duration: 1.35, ease: [0.77, 0, 0.18, 1] });
        var im = $('img', picEl); if (im) M.animate(im, { scale: [1.25, 1] }, { duration: 2, ease: ease });
      }, { amount: 0.25 });
      // görgetésre a kép lassan nagyobbodik
      if (!SOFT) M.scroll(M.animate(picEl, { scale: [1, 1.06] }, { ease: 'linear' }), { target: sp, offset: ['start end', 'end start'] });
    }
    var ins = $('.inset', sp);
    if (ins) {
      ins.style.opacity = 0;
      M.inView(sp, function () {
        M.animate(ins, { opacity: [0, 1], y: [80, 0], rotate: [flip ? 8 : -8, flip ? -3 : 3] }, Object.assign({ delay: 0.7 }, spring(120, 14)));
      }, { amount: 0.3 });
      if (!SOFT) M.scroll(M.animate(ins, { y: [40, -40] }, { ease: 'linear' }), { target: sp, offset: ['start end', 'end start'] });
    }
    var txt = $('.spread__text', sp);
    if (txt && !SOFT && window.innerWidth >= 960) M.scroll(M.animate(txt, { y: [50, -50] }, { ease: 'linear' }), { target: sp, offset: ['start end', 'end start'] });
  });

  // címkék, gombok, portréovális: rugós, lépcsőzetes beugrás
  $$('.menu-idx, .trio, .pins, .btns').forEach(function (g) {
    var kids = Array.prototype.slice.call(g.children);
    kids.forEach(function (c) { c.style.opacity = 0; });
    M.inView(g, function () {
      M.animate(kids, { opacity: [0, 1], scale: [0.6, 1], y: [24, 0] }, Object.assign({ delay: M.stagger(0.07, { startDelay: 0.15 }) }, spring(260, 16)));
    }, { amount: 0.4 });
  });

  /* ---------- 5. futó szalag: görgetési sebességre gyorsul, irányt vált ---------- */
  var track = $('[data-marquee]');
  if (track && !SOFT) {
    track.getAnimations && track.getAnimations().forEach(function (a) { a.cancel(); });
    var x = 0, dir = -1, lastY = window.scrollY, boost = 0;
    var half = function () { return track.scrollWidth / 2; };
    M.frame.update(function tick() {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      if (dy !== 0) dir = dy > 0 ? -1 : 1;
      boost += (Math.min(Math.abs(dy), 60) * 0.25 - boost) * 0.08;
      x += dir * (0.6 + boost);
      var hw = half(); if (hw) { if (x <= -hw) x += hw; if (x > 0) x -= hw; }
      track.style.transform = 'translateX(' + x + 'px) skewX(' + (dir * -boost * 0.35) + 'deg)';
      M.frame.update(tick);
    });
  }

  /* ---------- 6. torta-finálé: háttér nagyítás, szív-konfetti a gombon ---------- */
  var fin = $('.finale');
  if (fin) {
    var bg = $('.finale__bg .pic', fin);
    if (bg && !SOFT) M.scroll(M.animate(bg, { scale: [1.25, 1], y: ['-6%', '6%'] }, { ease: 'linear' }), { target: fin, offset: ['start end', 'end start'] });
    $$('.steps3 li', fin).forEach(function (li) { li.style.opacity = 0; });
    M.inView(fin, function () {
      M.animate($$('.steps3 li', fin), { opacity: [0, 1], x: [-20, 0] }, { delay: M.stagger(0.25, { startDelay: 0.6 }), duration: 0.7, ease: ease });
    });
  }
  function burst(btn) {
    var r = btn.getBoundingClientRect();
    var shapes = ['♥', '✿', '•', '♥', '✦'];
    for (var i = 0; i < 14; i++) {
      var d = document.createElement('span');
      d.className = 'fx-spark'; d.textContent = shapes[i % shapes.length]; d.setAttribute('aria-hidden', 'true');
      d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height / 2) + 'px';
      d.style.color = ['#C9AFA0', '#793F49', '#DCC6B9', '#A6B19A'][i % 4];
      document.body.appendChild(d);
      var a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4, dist = 50 + Math.random() * 60;
      M.animate(d, { x: [0, Math.cos(a) * dist], y: [0, Math.sin(a) * dist - 20], scale: [0.4, 1.2, 0], opacity: [1, 1, 0], rotate: [0, (Math.random() - 0.5) * 180] },
        { duration: 0.9 + Math.random() * 0.4, ease: [0.2, 0.8, 0.3, 1] }).then((function (el) { return function () { el.remove(); }; })(d));
    }
  }
  $$('a[href$="tortarendeles/"]').forEach(function (b) {
    var last = 0;
    b.addEventListener('pointerenter', function () { var t = Date.now(); if (t - last > 900 && fine) { last = t; burst(b); } });
    b.addEventListener('click', function () { burst(b); });
  });

  /* ---------- 7. ikonok: mókusfarok-csóválás, gyertyaláng, nyilak ---------- */
  // a mókus farka minden logón lengedez, és rámutatáskor nagyot csóvál
  $$('svg.brand__mark, svg.ribbon__mark, svg.cake-cta__mark').forEach(function (svg, i) {
    var tail = svg.querySelector('g > path');
    if (!tail) return;
    tail.style.transformBox = 'fill-box'; tail.style.transformOrigin = '15% 95%';
    M.animate(tail, { rotate: [0, 4, -2, 0] }, { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 });
    var host = svg.closest('a') || svg.parentElement;
    host.addEventListener('pointerenter', function () {
      M.animate(tail, { rotate: [0, 16, -10, 8, 0] }, { duration: 0.9, ease: 'easeInOut' });
      M.animate(svg, { y: [0, -6, 0], rotate: [0, -4, 0] }, spring(300, 12));
    });
  });
  // a logó a betöltéskor rugóval beugrik
  var bm = $('.hdr .brand__mark'), bw = $('.hdr .brand__word');
  if (bm) M.animate(bm, { scale: [0, 1], rotate: [-25, 0] }, Object.assign({ delay: 0.15 }, spring(220, 12)));
  if (bw) M.animate(bw, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 1.1, delay: 0.35, ease: ease });
  // tortaikon: lobogó gyertyaláng
  $$('svg.cake').forEach(function (c) {
    var flame = c.querySelectorAll('path')[1];
    if (!flame) return;
    flame.style.transformBox = 'fill-box'; flame.style.transformOrigin = '50% 100%';
    M.animate(flame, { scaleY: [1, 1.35, 0.85, 1.2, 1], scaleX: [1, 0.85, 1.1, 0.9, 1], rotate: [0, 6, -5, 3, 0] }, { duration: 1.4, repeat: Infinity, ease: 'easeInOut' });
  });
  // a pecsét a görgetéssel forog (a nyitóban is)
  if (!SOFT) $$('.ftr__seal').forEach(function (s) { M.scroll(M.animate(s, { rotate: [0, 180] }, { ease: 'linear' })); });

  /* ---------- 8. kurzorhoz kötött élmények (csak egérrel) ---------- */
  if (fine) {
    // puha, rugós kurzorkör, amely képek és gombok fölött megnő
    var dot = document.createElement('div'); dot.className = 'fx-cursor'; dot.setAttribute('aria-hidden', 'true');
    var lbl = document.createElement('span'); dot.appendChild(lbl);
    document.body.appendChild(dot);
    var cx = M.motionValue(-100), cy = M.motionValue(-100);
    var shown = false;
    window.addEventListener('pointermove', function (e) {
      if (!shown) { shown = true; M.animate(dot, { opacity: 1 }, { duration: 0.3 }); }
      M.animate(dot, { x: e.clientX, y: e.clientY }, spring(500, 36));
    });
    document.addEventListener('pointerleave', function () { shown = false; M.animate(dot, { opacity: 0 }, { duration: 0.3 }); });
    function grow(sel, size, text, cls) {
      $$(sel).forEach(function (el) {
        el.addEventListener('pointerenter', function () { lbl.textContent = text || ''; dot.className = 'fx-cursor ' + (cls || ''); M.animate(dot, { width: size, height: size }, spring(300, 22)); });
        el.addEventListener('pointerleave', function () { lbl.textContent = ''; dot.className = 'fx-cursor'; M.animate(dot, { width: 14, height: 14 }, spring(300, 22)); });
      });
    }
    grow('.spread__media, .hero__media, .plate, .finale__bg', 86, 'mese', 'is-pic');
    grow('.btn, .nav a, .chip, .pin, .link, .contents a', 44, '', 'is-btn');

    // mágneses gombok
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        M.animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35 }, spring(260, 16));
      });
      b.addEventListener('pointerleave', function () { M.animate(b, { x: 0, y: 0 }, spring(260, 14)); });
    });

    // 3D-s döntés a képeken és kártyákon
    $$('.plate, .card, .inset, .pin').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        M.animate(el, { transformPerspective: 900, rotateY: px * 10, rotateX: py * -10, scale: 1.02 }, spring(200, 18));
      });
      el.addEventListener('pointerleave', function () { M.animate(el, { rotateY: 0, rotateX: 0, scale: 1 }, spring(200, 16)); });
    });
  }

  /* ---------- 9. aloldalak: rácsok, kártyák, galéria ---------- */
  $$('.cards, .gallery, .menu-list, .events, .timeline, .swatches, .brandboard, .type-spec').forEach(function (g) {
    var kids = Array.prototype.slice.call(g.children);
    kids.forEach(function (c) { c.style.opacity = 0; });
    M.inView(g, function () {
      M.animate(kids, { opacity: [0, 1], y: [50, 0], scale: [0.94, 1] }, Object.assign({ delay: M.stagger(0.08) }, spring(180, 20)));
    }, { amount: 0.15 });
  });

  // varázsló: a kiválasztott opció rugósan „kattan”
  $$('.choice input').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var sp = inp.nextElementSibling; if (sp) M.animate(sp, { scale: [0.92, 1.04, 1] }, spring(400, 14));
    });
  });
  var bar2 = $('.progress i');
  if (bar2) new MutationObserver(function () { M.animate(bar2, { scaleY: [1, 2.2, 1] }, { duration: 0.5 }); }).observe(bar2, { attributes: true, attributeFilter: ['style'] });
})();
