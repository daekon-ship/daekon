/* Mókusch V2 – mesekönyves réteg (DAEKON)
   1) Megérkezés (1–3. fejezet): ragadós könyvlap, benne az ösvény, az udvar és a bolt festménye.
      Görgetésre finoman közelebb lépünk oda, ahová az út vezet, és onnan nyílik ki a következő kép.
      Nincs scroll-jacking; visszafelé is pontos; újratöltéskor a pillanatnyi állásból indul.
   2) Szentjánosbogarak (canvas) csak az erdőben és az udvaron.
   3) Fejezetek (4–9.): a lapok csendesen előtűnnek, görgetésre ragadó zoom nélkül.
   4) Színvilág-választó (bemutató).
   Mód: .anim-full = minden; .anim-soft (csökkentett mozgás) = kisebb közelítés, rövid áttűnések, álló fények;
   animáció kikapcsolva = a lapok egymás alatt. */
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
        on: R() < 0.8, until: R() * 8, fade: 0,                // időnként eltűnik / felbukkan
        d: 0.4 + R() * 1.1, zs: 1                              // mélység: a közeliek gyorsabban suhannak el mellettünk
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
      var x = q.x * w + ox * q.zs, y = q.y * h + oy * q.zs, s = q.s * q.zs * (0.85 + tw * 0.25);
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(this.sprite, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };
  // előrehaladás: görgetéskor a fények a kép közepéből kifelé suhannak és nőnek – mintha köztük sétálnánk
  Fireflies.prototype.push = function (dT) {
    if (!this.p) return;
    var R = Math.random, cx = 0.5, cy = 0.56;
    for (var i = 0; i < this.p.length; i++) {
      var q = this.p[i], f = Math.exp(dT * q.d * 1.5);
      q.x = cx + (q.x - cx) * f; q.y = cy + (q.y - cy) * f;
      q.zs = clamp(q.zs * Math.exp(dT * q.d * 0.9), 0.25, 4);
      var out = q.x < -0.15 || q.x > 1.15 || q.y < -0.15 || q.y > 1.15 || q.zs >= 4;
      var near = Math.abs(q.x - cx) < 0.015 && Math.abs(q.y - cy) < 0.015;
      if (dT > 0 && out) {          // új fény bukkan fel messze, a kép mélyén
        q.x = cx + (R() - 0.5) * 0.4; q.y = cy + (R() - 0.5) * 0.36; q.zs = 0.4 + R() * 0.25;
      } else if (dT < 0 && (near || q.zs <= 0.25)) {   // visszafelé: a fények a szélről úsznak vissza
        var a = R() * 6.283; q.x = cx + Math.cos(a) * 0.62; q.y = cy + Math.sin(a) * 0.55; q.zs = 1.6 + R();
      }
    }
    if (!this.loop) this.drawStatic();
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

  /* ---------------- 1–3. MEGÉRKEZÉS: ösvény → udvar → bolt ----------------
     Egy ragadós könyvlap, benne a három festmény. Görgetésre finoman közelebb lépünk oda, ahová
     az út vezet (a festmény fókuszpontja), és onnan nyílik ki vízfestékfoltként a következő kép.
     A görgetést nem vesszük át: a pillanatnyi állásból számol, visszafelé is pontos. */
  var J = $('[data-journey]');
  var swapSrc = function (fig) {
    if (!fig || fig._ld) return; fig._ld = true;
    $$('[data-srcset]', fig).forEach(function (e) { e.setAttribute('srcset', e.getAttribute('data-srcset')); e.removeAttribute('data-srcset'); });
    $$('img[data-src]', fig).forEach(function (e) { e.src = e.getAttribute('data-src'); e.removeAttribute('data-src'); });
  };
  if (J && !ANIM) $$('[data-ascene]', J).forEach(function (f) { swapSrc(f); });
  if (J && ANIM) {
    var num = function (el, k) { return parseFloat(el.getAttribute('data-' + k)); };
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var scenes = $$('[data-ascene]', J).map(function (el) {
      var f = (el.getAttribute('data-f') || '50,50').split(',');
      return { el: el, inner: $('.ascene__in', el), a: num(el, 'a'), b: num(el, 'b'), c: num(el, 'c'), d: num(el, 'd'),
        fx: +f[0] / 100, fy: +f[1] / 100, v: el.getAttribute('data-ascene') === '0', bloom: false };
    });
    var atmo = $$('[data-atmo]', J);
    var beats = $$('[data-beat]', J).map(function (el) {
      return { el: el, a: num(el, 'a'), b: num(el, 'b'), c: num(el, 'c'), d: num(el, 'd'), on: el.classList.contains('is-on'), shown: false };
    });
    var trail = $$('[data-trail]', J), hint = $('[data-jhint]', J), frame = $('[data-jframe]', J);
    var ff = $('canvas[data-fireflies]', J); ff = ff && ff._ff;
    var FW = 1, FH = 1, curTrail = -1, lastTravel = null;
    var measure = function () { FW = frame.clientWidth || 1; FH = frame.clientHeight || 1; };
    measure(); window.addEventListener('resize', measure);
    var A = FULL ? 1 : 0.4;   // csökkentett mozgásnál kisebb közelítés, a kinyíló átmenet megmarad
    var enter = function (b) {
      if (b.shown || !FULL) { b.shown = true; return; }
      b.shown = true;
      M.animate($$(':scope > *', b.el), { opacity: [0, 1], y: [10, 0] }, { delay: M.stagger(0.07), duration: 0.9, ease: [0.22, 0.7, 0.2, 1] });
    };
    var forestOut = scenes[1] ? [scenes[1].c, scenes[1].d] : [0.6, 0.7];

    var render = function (p) {
      var travel = 0, cur = 0;
      for (var i = 0; i < scenes.length; i++) {
        var s = scenes[i];
        var r = s.a < 0 ? 1 : seg(p, s.a, s.b);          // kinyílik
        var h = seg(p, s.b, s.c);                         // ott állunk, lassan közelebb lépünk
        var x = s.c > 1 ? 0 : seg(p, s.c, s.d);           // továbblépünk: a következő kép kinyílik előttünk
        travel += 0.3 * h + 0.8 * x * x;
        if (s.a < 0 || p >= s.b) cur = i;
        var vis = (s.a < 0 || p >= s.a) && p < s.d;
        if (p > s.a - 0.12) { swapSrc(s.el); }
        if (vis !== s.v) { s.v = vis; s.el.style.visibility = vis ? 'visible' : 'hidden'; if (!vis) s.el.style.opacity = '0'; }
        var ao = vis ? 0.3 * (s.a < 0 ? 1 : ease(r)) * (1 - ease(x)) : 0;
        if (atmo[i]) atmo[i].style.opacity = ao.toFixed(3);
        if (!vis) continue;
        var z = (1 + 0.06 * A * ease(h)) * (1 + 0.24 * A * x * x);
        var prev = scenes[i - 1], bl = i > 0 && r < 1 && !!prev;
        if (bl !== s.bloom) { s.bloom = bl; s.el.classList.toggle('is-bloom', bl); }
        var o = 1;
        if (bl) {
          var diag = Math.sqrt(FW * FW + FH * FH), bs = 2.8 * diag * Math.pow(ease(r), 1.6);
          s.el.style.setProperty('--bs', bs.toFixed(1) + 'px');
          s.el.style.setProperty('--bp', (prev.fx * FW - bs / 2).toFixed(1) + 'px ' + (prev.fy * FH - bs / 2).toFixed(1) + 'px');
          o = clamp(r * 5, 0, 1);
        }
        s.el.style.opacity = o.toFixed(3);
        s.inner.style.transform = 'scale(' + z.toFixed(4) + ')';
      }
      if (ff) {
        if (FULL && lastTravel !== null && travel !== lastTravel) ff.push(travel - lastTravel);
        ff.setLevel(1 - ease(seg(p, forestOut[0], forestOut[1])));   // szentjánosbogarak csak kint, az erdőben és az udvaron
      }
      lastTravel = travel;
      for (var j = 0; j < beats.length; j++) {
        var b = beats[j];
        var bo = (b.a < 0 ? 1 : ease(seg(p, b.a, b.b))) * (1 - ease(seg(p, b.c, b.d)));
        var on = bo > 0.02;
        if (on !== b.on) { b.on = on; b.el.style.visibility = on ? 'visible' : 'hidden'; b.el.classList.toggle('is-on', on); if (on) enter(b); }
        if (on || b.el.style.opacity !== '0') {
          b.el.style.opacity = on ? bo.toFixed(3) : '0';
          b.el.style.setProperty('--by', ((1 - bo) * 12).toFixed(1) + 'px');
        }
      }
      if (cur !== curTrail) { curTrail = cur; trail.forEach(function (t, k) { t.classList.toggle('is-on', k === cur); t.classList.toggle('is-past', k < cur); }); }
      if (hint) hint.style.opacity = (1 - seg(p, 0, 0.04)).toFixed(3);
    };
    render(0);
    // teljes mozgásnál a kép puhán követi a görgetést (csak a rajzolást simítjuk, a görgetést nem vesszük át)
    var tgt = 0, cur = 0, sraf = 0, slast = 0, still = 0;
    var follow = function (now) {
      var dt = slast ? Math.min((now - slast) / 1000, 0.05) : 0.016; slast = now;
      var d = tgt - cur;
      cur = Math.abs(d) < 0.00008 || Math.abs(d) > 0.25 ? tgt : cur + d * (1 - Math.exp(-dt / 0.16));
      render(cur);
      sraf = cur === tgt ? 0 : requestAnimationFrame(follow);
      if (!sraf) { slast = 0; clearTimeout(still); still = setTimeout(function () { J.classList.remove('is-moving'); }, 180); }
    };
    M.scroll(function (a) {
      var v = typeof a === 'number' ? a : (a && a.y ? a.y.progress : 0);
      if (!FULL) { render(v); return; }
      tgt = v; clearTimeout(still); J.classList.add('is-moving'); if (!sraf) sraf = requestAnimationFrame(follow);
    }, { target: J, offset: ['start start', 'end end'] });

    if (FULL) {
      M.animate($$('.beat--hero > *', J), { opacity: [0, 1], y: [12, 0] }, { delay: M.stagger(0.1, { startDelay: 0.15 }), duration: 1, ease: [0.22, 0.7, 0.2, 1] });
      M.animate($('[data-ascene="0"] img', J), { opacity: [0, 1], scale: [1.03, 1] }, { duration: 1.6, ease: [0.22, 0.7, 0.2, 1] });
      beats[0].shown = true;
    }
  }

  /* ---------------- 4–9. FEJEZETEK: a lapok csendesen előtűnnek ----------------
     Nincs görgetésre ragadó zoom: a festmény a saját arányában, élesen áll. */
  if (ANIM) {
    $$('.chap').forEach(function (ch) {
      var pages = $$('[data-page]', ch), txt = $$('[data-ctext] > *', ch), two = ch.classList.contains('chap--two');
      pages.concat(txt).forEach(function (e) { e.style.opacity = 0; });
      M.inView(ch, function () {
        pages.forEach(function (pg, k) {
          var from = two && !isMobile() ? (k === 0 ? 14 : -14) : 0;
          M.animate(pg, FULL ? { opacity: [0, 1], x: [from, 0], y: [18, 0] } : { opacity: [0, 1] },
            { duration: FULL ? 1.2 : 0.6, delay: k * 0.12, ease: [0.22, 0.7, 0.2, 1] });
          var im = $('img', pg);
          if (FULL && im) M.animate(im, { scale: [1.035, 1] }, { duration: 1.8, delay: k * 0.12, ease: [0.22, 0.7, 0.2, 1] });
        });
        M.animate(txt, FULL ? { opacity: [0, 1], y: [12, 0] } : { opacity: [0, 1] },
          { delay: M.stagger(0.06, { startDelay: 0.25 }), duration: FULL ? 0.9 : 0.5, ease: [0.22, 0.7, 0.2, 1] });
      }, { amount: 0.18 });
    });
  }
  // mobilon a kétoldalas illusztráció lapozható: első lapozás után eltűnik a „lapozz” jelzés
  $$('[data-spread]').forEach(function (sp) {
    var h = sp.parentNode.querySelector('.chap__hint');
    sp.addEventListener('scroll', function () { if (h && sp.scrollLeft > 20) h.style.opacity = '0'; }, { passive: true });
  });


  // újratöltés után (a böngésző visszaállítja a görgetést) a fények méretét újraszámoljuk
  window.addEventListener('pageshow', function () { flies.forEach(function (f) { f.resize(); f.update(); if (!f.loop) f.drawStatic(); }); });
})();
