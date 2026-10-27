/* Mókusch B-változat – a rajzolt jelenetek életre keltése a Motion (motion.dev) könyvtárral.
   Rétegparallax görgetésre és egérre, gőz, gyertyaláng, csóváló mókusfarok, rezgő nyuszifül,
   ringó palack, buborékoló üst. Csökkentett mozgásnál csak a halk, helyben maradó mozgások futnak. */
(function () {
  'use strict';
  var M = window.Motion;
  var doc = document.documentElement;
  if (!M || !doc.classList.contains('anim')) return;
  var SOFT = doc.classList.contains('anim-soft');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var sp = function (s, d) { return { type: 'spring', stiffness: s, damping: d }; };

  $$('svg.scene').forEach(function (svg) {
    var host = svg.closest('[data-stage], [data-stage-hero], .pic, .plate__img') || svg.parentElement;
    var layers = $$('.ly', svg);

    // 1) rétegek: görgetésre eltérő sebességgel úsznak (papírszínház-mélység)
    if (!SOFT) layers.forEach(function (ly) {
      var d = parseFloat(ly.getAttribute('data-d')) || 0.3;
      M.scroll(M.animate(ly, { y: [d * 60, d * -60] }, { ease: 'linear' }), { target: host, offset: ['start end', 'end start'] });
    });

    // 2) belépés: a rétegek alulról, egymás után „felállnak”, mint egy kihajtható könyv
    M.inView(host, function () {
      M.animate(layers, { opacity: [0, 1], y: [40, 0] }, { delay: M.stagger(0.09), duration: 0.9, ease: [0.22, 0.7, 0.2, 1] });
    }, { amount: 0.25 });

    // 3) egér: a rétegek mélység szerint elmozdulnak (csak egérrel, nagy jeleneteken)
    if (fine && !SOFT && host.matches('[data-stage-hero], [data-stage]')) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (ly) {
          var d = parseFloat(ly.getAttribute('data-d')) || 0.3;
          M.animate(ly, { x: dx * -50 * d }, sp(80, 18));
        });
      });
      host.addEventListener('pointerleave', function () { layers.forEach(function (ly) { M.animate(ly, { x: 0 }, sp(80, 18)); }); });
    }

    // 4) apró, folyamatos mozgások
    $$('.steam path', svg).forEach(function (p, i) {
      M.animate(p, { opacity: [0, 0.9, 0], y: [10, -30] }, { duration: 3.2, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' });
    });
    $$('.flame', svg).forEach(function (f) {
      f.style.transformBox = 'fill-box'; f.style.transformOrigin = '50% 100%';
      M.animate(f, { scaleY: [1, 1.3, 0.85, 1.15, 1], scaleX: [1, 0.85, 1.1, 0.9, 1] }, { duration: 1.3, repeat: Infinity, ease: 'easeInOut' });
    });
    $$('.sq-tail', svg).forEach(function (t, i) {
      t.style.transformBox = 'fill-box'; t.style.transformOrigin = '10% 95%';
      M.animate(t, { rotate: [0, 7, -3, 0] }, { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 });
    });
    $$('.ear', svg).forEach(function (e, i) {
      e.style.transformBox = 'fill-box'; e.style.transformOrigin = '50% 100%';
      M.animate(e, { rotate: [0, 0, -12, 0, 0] }, { duration: 4, repeat: Infinity, delay: i * 0.15 });
    });
    $$('.bubbles circle', svg).forEach(function (b, i) {
      M.animate(b, { y: [0, -14, 0], opacity: [1, 0.4, 1] }, { duration: 1.8 + i * 0.4, repeat: Infinity, ease: 'easeInOut' });
    });
    $$('.fire', svg).forEach(function (f) {
      f.style.transformBox = 'fill-box'; f.style.transformOrigin = '50% 100%';
      M.animate(f, { scaleY: [1, 1.12, 0.95, 1] }, { duration: 0.9, repeat: Infinity, ease: 'easeInOut' });
    });
    if (svg.classList.contains('scene--posta')) {
      var bottle = svg.querySelector('.ly:nth-of-type(3)');
      if (bottle) M.animate(bottle, { rotate: [-3, 3, -3], y: [0, -10, 0] }, { duration: 4.5, repeat: Infinity, ease: 'easeInOut' });
    }
  });

  // 5) nyitó mókus: a jelenet betöltésekor kiugrik a domb mögül
  var hs = document.querySelector('.hero-sq');
  if (hs && !SOFT) M.animate(hs, { y: [140, 0], opacity: [0, 1] }, Object.assign({ delay: 0.9 }, sp(140, 11)));

  // 6) nyitó- és finálékártya: rugós felemelkedés
  $$('.stage__card, .finale2__card').forEach(function (c) {
    c.style.opacity = 0;
    M.inView(c, function () { M.animate(c, { opacity: [0, 1], y: [50, 0], rotate: [-1.5, 0] }, sp(120, 16)); }, { amount: 0.2 });
  });

  // 7) fejezet-kártyák: lépcsőzetes beugrás, ikonok kirajzolódása
  var chips = $$('.chips li');
  chips.forEach(function (c) { c.style.opacity = 0; });
  if (chips.length) M.inView(chips[0].parentElement, function () {
    M.animate(chips, { opacity: [0, 1], y: [24, 0], scale: [0.92, 1] }, Object.assign({ delay: M.stagger(0.05) }, sp(220, 18)));
    $$('.chips .ic path, .chips .ic circle').forEach(function (p) { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; });
    M.animate($$('.chips .ic path, .chips .ic circle'), { strokeDashoffset: [1, 0] }, { delay: M.stagger(0.03, { startDelay: 0.2 }), duration: 0.9 });
  });

  // 8) jelenet-kártyák: enyhe 3D döntés az egér felé
  if (fine && !SOFT) $$('.stage-card').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      M.animate(el, { transformPerspective: 1100, rotateY: px * 6, rotateX: py * -6 }, sp(160, 18));
    });
    el.addEventListener('pointerleave', function () { M.animate(el, { rotateY: 0, rotateX: 0 }, sp(160, 16)); });
  });
})();
