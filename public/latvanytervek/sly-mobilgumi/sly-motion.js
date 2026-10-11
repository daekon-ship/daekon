/* SLY — 3. kör: filmszerű görgetős jelenetek (GSAP + ScrollTrigger, helyben) */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ---- szavanként kigyúló kijelentés: szöveg felbontása (mozgás nélkül is olvasható) ---- */
  var lit = d.getElementById('lit'), words = [];
  if (lit && !reduce) {
    var HL = { 'menned,': 1, 'várnod.': 1, 'odaáll': 1, 'hozzád': 1, 'áll.': 1 };
    lit.innerHTML = lit.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="w' + (HL[w] ? ' hl' : '') + '">' + w + '</span>';
    }).join(' ');
    words = Array.prototype.slice.call(lit.querySelectorAll('.w'));
  }

  if (!window.gsap || !window.ScrollTrigger || reduce) {
    words.forEach(function (w) { w.classList.add('on'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* kigyúló szavak */
  if (words.length) {
    ScrollTrigger.create({
      trigger: lit, start: 'top 82%', end: 'bottom 42%', scrub: true,
      onUpdate: function (s) {
        var n = Math.round(s.progress * words.length);
        for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
      }
    });
  }

  /* lebegő fotók parallaxa */
  d.querySelectorAll('.float').forEach(function (f) {
    var k = parseFloat(f.dataset.speed || 0);
    gsap.fromTo(f, { y: -k * 260 }, { y: k * 260, ease: 'none', scrollTrigger: { trigger: '.say2', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  var mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', function () {
    /* ---- HERO: a kerék ablaka kitágul, a fotó kitölti a képernyőt ---- */
    var pin = d.getElementById('hxPin'), photo = d.getElementById('hxPhoto'), tyre = d.getElementById('hxTyre');
    var copy = d.getElementById('hxCopy'), say = d.getElementById('hxSay'), cue = d.getElementById('hxCue');
    var st = { p: 0 };
    function render() {
      var p = st.p, W = pin.clientWidth, H = pin.clientHeight;
      var ts = Math.min(H * .84, W * .54), r0 = ts * .303, cx = W * .71, cy = H * .55;
      var rEnd = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.02;
      var e = ease(clamp(p / .62, 0, 1));
      var pcx = cx + (W * .5 - cx) * e, pcy = cy + (H * .5 - cy) * e;
      rEnd = Math.hypot(Math.max(pcx, W - pcx), Math.max(pcy, H - pcy)) * 1.02;
      photo.style.setProperty('--cx', pcx.toFixed(1) + 'px');
      photo.style.setProperty('--cy', pcy.toFixed(1) + 'px');
      photo.style.setProperty('--r', (r0 + (rEnd - r0) * e).toFixed(1) + 'px');
      photo.style.setProperty('--g', e.toFixed(3));
      photo.style.setProperty('--tone', (e * .82).toFixed(3));
      photo.style.setProperty('--dots', (e * .85).toFixed(3));
      tyre.style.transform = 'scale(' + (1 + e * 2.4).toFixed(3) + ')';
      tyre.style.opacity = (1 - clamp(e * 1.35, 0, 1)).toFixed(3);
      var c = clamp(p / .28, 0, 1);
      copy.style.opacity = (1 - c).toFixed(3);
      copy.style.transform = 'translateY(' + (-46 * c).toFixed(1) + 'px)';
      copy.style.pointerEvents = c > .6 ? 'none' : '';
      var q = clamp((p - .58) / .3, 0, 1);
      say.style.opacity = q.toFixed(3);
      say.style.transform = 'translateY(' + ((1 - q) * 34).toFixed(1) + 'px)';
      cue.style.opacity = (1 - clamp(p / .1, 0, 1)).toFixed(3);
    }
    photo.style.animation = 'none';
    var tw = gsap.to(st, {
      p: 1, ease: 'none', onUpdate: render,
      scrollTrigger: { trigger: pin, start: 'top top', end: '+=140%', pin: true, scrub: .7, anticipatePin: 1, onRefresh: render }
    });
    render();

    /* ---- MUNKÁINK: függőleges görgetés → vízszintes sín ---- */
    var strip = d.getElementById('strip'), track = d.getElementById('stripTrack'), works = d.getElementById('munkaink');
    strip.classList.add('is-pinned'); works.classList.add('has-pin'); strip.scrollLeft = 0;
    var cnt = d.getElementById('stripN'), n = track.children.length;
    var dist = function () { return Math.max(0, track.scrollWidth - strip.clientWidth); };
    var tw2 = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: strip, start: 'center center', end: function () { return '+=' + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (s) { if (cnt) cnt.textContent = ('0' + (Math.round(s.progress * (n - 1)) + 1)).slice(-2); } }
    });
    gsap.utils.toArray('.strip__i img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.closest('figure'), containerAnimation: tw2, start: 'left right', end: 'right 40%', scrub: true } });
    });

    return function () {
      strip.classList.remove('is-pinned'); works.classList.remove('has-pin');
      ['--r', '--g', '--tone', '--dots', '--cx', '--cy'].forEach(function (k) { photo.style.removeProperty(k); });
      [tyre, copy, say, cue].forEach(function (el) { el.removeAttribute('style'); });
      photo.style.animation = ''; track.style.transform = '';
      tw.kill(); tw2.kill();
    };
  });

  /* képek betöltése után újramérés */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
