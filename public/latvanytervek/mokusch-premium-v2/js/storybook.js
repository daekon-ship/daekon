/* Mókusch V2 – mesekönyves réteg (DAEKON)
   1) Görgetéses út: a ragadós (sticky) jelenetkivágást a natív görgetés előrehaladása mozgatja –
      nincs scroll-jacking, visszafelé is pontosan ugyanúgy működik, újratöltéskor a pillanatnyi
      állásból indul.
   2) Szentjánosbogarak / tündérfények: canvas, eltérő méret, lassú szabálytalan lebegés,
      pislákolás, időnként eltűnnek és újra feltűnnek. Csak látható állapotban fut.
   3) Festett lapok: görgetésre lassú közeledés (zoom) és festékfolt-parallax.
   4) Színvilág-választó (bemutató).
   Mód: .anim-full = minden; .anim-soft (csökkentett mozgás) = csak áttűnések, álló fények;
   animáció kikapcsolva = állókép. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var M = window.Motion;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ANIM = !!M && doc.classList.contains('anim');
  var FULL = ANIM && doc.classList.contains('anim-full');
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var isMobile = function () { return window.innerWidth < 900; };

  /* ---------------- színvilág (bemutató) ---------------- */
  var palBtns = $$('[data-palette-set]');
  function markPalette() {
    var cur = doc.getAttribute('data-palette') || 'erdei';
    palBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-palette-set') === cur)); });
  }
  palBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-palette-set');
      if (k === 'erdei') doc.removeAttribute('data-palette'); else doc.setAttribute('data-palette', k);
      try { localStorage.setItem('mokusch-palette', k); } catch (e) {}
      markPalette();
      flies.forEach(function (f) { f.recolor(); if (!f.loop) f.drawStatic(); });
    });
  });
  markPalette();

  /* ---------------- szentjánosbogarak ---------------- */
  var flies = [];
  function Fireflies(canvas, kind) {
    this.c = canvas; this.kind = kind; this.ctx = canvas.getContext('2d');
    this.level = 1; this.visible = false; this.loop = false; this.raf = 0; this.last = 0; this.t = Math.random() * 100;
    this.recolor(); this.resize();
    var self = this;
    if ('ResizeObserver' in window) new ResizeObserver(function () { self.resize(); if (!self.loop) self.drawStatic(); }).observe(canvas);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; self.update(); }, { rootMargin: '80px' }).observe(canvas);
    } else { this.visible = true; }
    document.addEventListener('visibilitychange', function () { self.update(); });
    if (!FULL) this.drawStatic();
  }
  Fireflies.prototype.recolor = function () {
    var v = getComputedStyle(doc).getPropertyValue(this.kind === 'warm' ? '--c-glow-warm' : '--c-glow').trim() || '255,226,150';
    var s = document.createElement('canvas'); s.width = s.height = 64;
    var g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,253,240,1)');
    gr.addColorStop(0.12, 'rgba(' + v + ',0.95)');
    gr.addColorStop(0.35, 'rgba(' + v + ',0.32)');
    gr.addColorStop(1, 'rgba(' + v + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this.sprite = s;
  };
  Fireflies.prototype.resize = function () {
    var w = this.c.clientWidth, h = this.c.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 1.75);
    this.w = w; this.h = h;
    this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = this.kind === 'warm' ? (w < 500 ? 9 : 15) : clamp(Math.round(w * h / 24000), 14, w < 600 ? 20 : 46);
    if (!this.p || this.p.length !== n) this.seed(n);
  };
  Fireflies.prototype.seed = function (n) {
    var R = Math.random, P = [];
    for (var i = 0; i < n; i++) {
      var big = R() < 0.22;
      P.push({
        x: R(), y: this.kind === 'warm' ? 0.08 + R() * 0.84 : 0.18 + Math.pow(R(), 0.8) * 0.8,
        s: big ? 15 + R() * 13 : 6 + R() * 9,                 // sprite-méret px
        ax: 14 + R() * 46, ay: 10 + R() * 34,                  // lebegés amplitúdója
        fx: (0.05 + R() * 0.11) * 6.283, fy: (0.04 + R() * 0.1) * 6.283,
        px: R() * 6.283, py: R() * 6.283,
        vx: (R() - 0.5) * 7, vy: -1.5 - R() * 4.5,             // lassú vándorlás (inkább felfelé)
        tw: (0.25 + R() * 0.9) * 6.283, tp: R() * 6.283,       // pislákolás
        on: R() < 0.8, until: R() * 8, fade: 0                 // időnként eltűnik / felbukkan
      });
    }
    this.p = P;
  };
  Fireflies.prototype.frame = function (t, dt) {
    var ctx = this.ctx, w = this.w, h = this.h, L = this.level;
    ctx.clearRect(0, 0, w, h);
    if (L <= 0.01) return;
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.p.length; i++) {
      var q = this.p[i];
      if (dt) {
        q.x += q.vx * dt / w; q.y += q.vy * dt / h;
        if (q.y < -0.05) { q.y = 1.03; q.x = Math.random(); }
        if (q.x < -0.05) q.x = 1.04; else if (q.x > 1.05) q.x = -0.04;
        q.until -= dt;
        if (q.until <= 0) { q.on = !q.on; q.until = q.on ? 4 + Math.random() * 10 : 1.2 + Math.random() * 5; }
        q.fade = clamp(q.fade + (q.on ? dt : -dt) / 1.1, 0, 1);
      } else { q.fade = q.on ? 1 : 0; }
      var ox = Math.sin(t * q.fx + q.px) * q.ax + Math.sin(t * q.fx * 0.37 + q.px * 1.7) * q.ax * 0.45;
      var oy = Math.cos(t * q.fy + q.py) * q.ay + Math.sin(t * q.fy * 0.53 + q.py * 2.3) * q.ay * 0.4;
      var tw = 0.55 + 0.45 * Math.sin(t * q.tw + q.tp);
      var a = tw * tw * ease(q.fade) * L;
      if (a < 0.02) continue;
      var x = q.x * w + ox, y = q.y * h + oy, s = q.s * (0.85 + tw * 0.25);
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(this.sprite, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };
  Fireflies.prototype.drawStatic = function () { if (this.p && this.w) this.frame(this.t, 0); };
  Fireflies.prototype.update = function () {
    var want = FULL && this.visible && !document.hidden && this.level > 0.01;
    if (want && !this.loop) {
      this.loop = true; this.last = 0;
      var self = this;
      var tick = function (now) {
        if (!self.loop) return;
        var dt = self.last ? Math.min((now - self.last) / 1000, 0.05) : 0;
        self.last = now; self.t += dt;
        self.frame(self.t, dt);
        self.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    } else if (!want && this.loop) {
      this.loop = false; cancelAnimationFrame(this.raf);   // erőforrás felszabadítása, amíg nem látszik
      if (this.level <= 0.01) this.ctx.clearRect(0, 0, this.w, this.h);
    }
  };
  Fireflies.prototype.setLevel = function (l) {
    var was = this.level; this.level = l;
    if ((was > 0.01) !== (l > 0.01)) this.update();
    if (!this.loop && Math.abs(was - l) > 0.01) this.drawStatic();
  };
  $$('canvas[data-fireflies]').forEach(function (c) {
    var f = new Fireflies(c, c.getAttribute('data-fireflies'));
    flies.push(f); c._ff = f;
  });

  /* ---------------- 1. görgetéses út ---------------- */
  var J = $('[data-journey]');
  if (J && ANIM) {
    var scenes = $$('[data-jscene]', J), atmo = $$('[data-atmo]', J), beats = $$('[data-beat]', J);
    var light = $('[data-jlight]', J), hint = $('[data-jhint]', J);
    var jff = $('canvas[data-fireflies]', J); jff = jff && jff._ff;
    var beatWin = [[-1, -1, 0.10, 0.18], [0.20, 0.26, 0.38, 0.44], [0.54, 0.60, 0.70, 0.76], [0.86, 0.92, 2, 3]];

    var setBeat = function (el, o) {
      el.style.opacity = o.toFixed(3);
      el.style.setProperty('--by', ((1 - o) * 18).toFixed(1) + 'px');
      var on = o > 0.02;
      if (on !== el._on) { el._on = on; el.style.visibility = on ? 'visible' : 'hidden'; el.classList.toggle('is-on', on); }
    };
    var render = function (p) {
      var mob = isMobile();
      var Z = FULL ? (mob ? 0.7 : 1) : 0.12;       // a közeledés mértéke (csökkentett mozgásnál alig)
      var o0 = 1 - ease(seg(p, 0.40, 0.55));
      var o1 = ease(seg(p, 0.40, 0.55)) * (1 - ease(seg(p, 0.74, 0.86)));
      var o2 = ease(seg(p, 0.74, 0.86));
      var s0 = 1 + 0.55 * Z * seg(p, 0, 0.55);
      var s1 = 1 + (0.1 + 0.32 * seg(p, 0.40, 0.86)) * Z;
      var s2 = 1 + (0.14 + 0.2 * seg(p, 0.74, 1)) * Z;
      var y0 = -2.5 * Z * seg(p, 0, 0.55);
      scenes[0].style.transform = 'translate3d(0,' + y0.toFixed(2) + '%,0) scale(' + s0.toFixed(4) + ')';
      scenes[0].style.opacity = o0.toFixed(3);
      if (scenes[1]) { scenes[1].style.transform = 'scale(' + s1.toFixed(4) + ')'; scenes[1].style.opacity = o1.toFixed(3); }
      if (scenes[2]) { scenes[2].style.transform = 'scale(' + s2.toFixed(4) + ')'; scenes[2].style.opacity = o2.toFixed(3); }
      if (atmo[0]) atmo[0].style.opacity = (0.55 * o0).toFixed(3);
      if (atmo[1]) atmo[1].style.opacity = (0.55 * o1).toFixed(3);
      if (atmo[2]) atmo[2].style.opacity = (0.6 * o2).toFixed(3);
      // a teljesen áttetsző rétegeket a böngésző ne is rajzolja (gyorsabb görgetés)
      [o0, o1, o2].forEach(function (o, i) {
        var v = o > 0.004 ? 'visible' : 'hidden';
        if (scenes[i] && scenes[i]._v !== v) { scenes[i]._v = v; scenes[i].style.visibility = v; if (atmo[i]) atmo[i].style.visibility = v; }
      });
      if (light) light.style.opacity = (0.3 + 0.6 * seg(p, 0.3, 0.95)).toFixed(3);   // a fény egyre melegebb
      if (hint) hint.style.opacity = (1 - seg(p, 0, 0.05)).toFixed(3);
      beats.forEach(function (b, i) {
        var w = beatWin[i];
        var o = (w[0] < 0 ? 1 : ease(seg(p, w[0], w[1]))) * (1 - ease(seg(p, w[2], w[3])));
        setBeat(b, o);
      });
      if (jff) jff.setLevel(1 - ease(seg(p, 0.5, 0.84)));   // a fények az erdőben élnek, a kávézóba érve elhalványulnak
    };
    beats.forEach(function (b, i) { b._on = i === 0; });
    // natív görgetés követése (Motion scroll – modern böngészőben hardveresen gyorsított)
    M.scroll(function (a) { render(typeof a === 'number' ? a : (a && a.y ? a.y.progress : 0)); },
      { target: J, offset: ['start start', 'end end'] });

    // nyitás: a cím soronként, a kártya finoman megjelenik (a teljes kártya azonnal olvasható)
    if (FULL) {
      var lines = $$('.beat--1 h1 .ln', J);
      M.animate(lines, { opacity: [0, 1], y: [14, 0] }, { delay: M.stagger(0.14, { startDelay: 0.15 }), duration: 1, ease: [0.22, 0.7, 0.2, 1] });
      M.animate($('.beat--1 .beat__card', J), { opacity: [0, 1] }, { duration: 0.9 });
    }
  }

  /* ---------------- 2–9. festett lapok: közeledés + festékfolt ---------------- */
  if (ANIM) {
    $$('[data-wc]').forEach(function (fig) {
      var page = $('.wc__page', fig), im = $('.wc__page img', fig), wash = $('[data-wash]', fig);
      page.style.opacity = 0;
      M.inView(fig, function () {
        M.animate(page, FULL ? { opacity: [0, 1], scale: [0.965, 1] } : { opacity: [0, 1] }, { duration: 1.2, ease: [0.22, 0.7, 0.2, 1] });
        if (wash) M.animate(wash, { opacity: [0, parseFloat(getComputedStyle(wash).opacity) || 0.6] }, { duration: 1.6 });
      }, { amount: 0.2 });
      if (FULL) {
        // ahogy lefelé haladunk, egyre közelebb kerülünk a képhez
        M.scroll(M.animate(im, { scale: [1.02, 1.17], y: ['-2.5%', '2.5%'] }, { ease: 'linear' }), { target: fig, offset: ['start end', 'end start'] });
        if (wash) M.scroll(M.animate(wash, { y: [36, -36], rotate: [-2.5, 2.5] }, { ease: 'linear' }), { target: fig, offset: ['start end', 'end start'] });
      }
    });
    var tb = $('.tortaband__card .wash');
    if (tb && FULL) M.scroll(M.animate(tb, { scaleX: [0.94, 1.04], rotate: [-1, 1] }, { ease: 'linear' }), { target: tb.parentElement, offset: ['start end', 'end start'] });
  }

  // újratöltés után (a böngésző visszaállítja a görgetést) a fények méretét újraszámoljuk
  window.addEventListener('pageshow', function () { flies.forEach(function (f) { f.resize(); f.update(); if (!f.loop) f.drawStatic(); }); });
})();
