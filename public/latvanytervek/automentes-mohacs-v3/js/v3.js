/* NON-STOP AUTÓMENTÉS MOHÁCS — V3 interakciók
   Mozgás: Motion 11.18.2 (motion.dev), helyben (js/vendor), lustán betöltve.
   Motion nélkül (vagy csökkentett mozgásnál) minden tartalom azonnal, animáció nélkül látszik. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var M = null;
  var EASE = [0.2, 0.7, 0.2, 1];
  var on = false; // Motion aktív
  function safe(fn) { if (!on) return; try { fn(M); } catch (e) { if (w.console) console.warn('[motion]', e); } }

  var hero = $('.hero'), photo = $('[data-photo]'), dock = $('#dock'), hdr = $('#fejlec'), contact = $('#kapcsolat');

  /* ---------- óra (budapesti idő) ---------- */
  var ora = $('#ora');
  function tick() {
    try { ora.textContent = new Intl.DateTimeFormat('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' }).format(new Date()); }
    catch (e) { ora.textContent = '0–24'; }
  }
  if (ora) { tick(); setInterval(tick, 20000); }

  /* ---------- hero fotó hibatűrés ---------- */
  if (photo) {
    var pimg = $('img', photo);
    var fail = function () { photo.classList.add('is-failed'); };
    if (pimg.complete && !pimg.naturalWidth) fail(); else pimg.addEventListener('error', fail);
  }

  /* ==================================================================
     MOTION – lusta betöltés
     A hero belépése tiszta CSS (nem vár JavaScriptre, nem rontja az LCP-t).
     A Motion az első görgetésnél / érintésnél / billentyűnél töltődik be, így a
     kezdeti betöltést nem terheli; a hajtás alatti animációkat ez hajtja.
     ================================================================== */
  var MOTION_SRC = 'js/vendor/motion-11.18.2.min.js';
  var loading = false;
  function loadMotion() {
    if (loading || reduce) return; loading = true;
    ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { w.removeEventListener(ev, loadMotion, true); });
    var sc = d.createElement('script'); sc.src = MOTION_SRC; sc.async = true;
    sc.onload = function () {
      if (!w.Motion || typeof w.Motion.animate !== 'function') return;
      M = w.Motion;
      try { enhance(M); on = true; root.classList.add('fx'); }
      catch (e) { if (w.console) console.warn('[motion]', e); $$('[data-up]').forEach(function (el) { el.style.opacity = ''; el.style.transform = ''; }); }
    };
    d.head.appendChild(sc);
  }
  if (!reduce) ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { w.addEventListener(ev, loadMotion, { capture: true, passive: true }); });

  function below(el) { return el.getBoundingClientRect().top > w.innerHeight * 0.92; }

  function enhance(Mo) {
    var animate = Mo.animate, inView = Mo.inView, scroll = Mo.scroll;

    /* Szekcióelemek: csak a még nem látott csoportok úsznak be, rugós mozgással */
    var groups = [];
    $$('[data-up]').forEach(function (el) {
      var g = groups.filter(function (x) { return x.p === el.parentNode; })[0];
      if (!g) groups.push(g = { p: el.parentNode, items: [] });
      g.items.push(el);
    });
    groups.forEach(function (g) {
      if (!below(g.p)) return;
      g.items.forEach(function (el) { el.style.opacity = 0; });
      inView(g.p, function () {
        g.items.forEach(function (el, i) {
          var dl = Math.min(i, 6) * 0.07;
          animate(el, { opacity: [0, 1], y: [26, 0] }, {
            y: { type: 'spring', stiffness: 160, damping: 22, delay: dl },
            opacity: { duration: 0.4, delay: dl, ease: 'easeOut' }
          });
        });
      }, { margin: '0px 0px -6% 0px', amount: 0.05 });
    });

    /* A mentés menete: a sárga sáv és a kis mentő a görgetéssel halad */
    var flow = $('#flow'), fill = $('.flow__fill'), truck = $('.flow__truck');
    if (flow && fill) {
      var wide = w.matchMedia('(min-width: 900px)');
      scroll(function (p) {
        var v = Math.max(0, Math.min(1, p));
        if (wide.matches) { fill.style.transform = 'scaleX(' + v + ')'; if (truck) truck.style.left = (v * 100) + '%'; }
        else fill.style.transform = 'scaleY(' + v + ')';
      }, { target: flow, offset: ['start 80%', 'end 55%'] });
    }

    /* Térkép: autópályák kirajzolódnak, Mohács tűje leesik */
    var map = $('.map');
    if (map && below(map)) {
      var roads = $$('.map__mw', map), pin = $('.map__pin', map);
      roads.forEach(function (p) { var L = Math.ceil(p.getTotalLength()); p.setAttribute('stroke-dasharray', L); p.setAttribute('stroke-dashoffset', L); });
      if (pin) pin.setAttribute('opacity', '0');
      inView(map, function () {
        roads.forEach(function (p, i) {
          var L = parseFloat(p.getAttribute('stroke-dasharray'));
          animate(p, { strokeDashoffset: [L, 0] }, { duration: 1.1, delay: 0.15 + i * 0.25, ease: EASE });
        });
        if (pin) animate(pin, { opacity: [0, 1], y: [-44, 0] }, { y: { type: 'spring', stiffness: 260, damping: 13, delay: 0.7 }, opacity: { duration: 0.2, delay: 0.7 } });
      }, { amount: 0.35 });
    }

    /* Mobil hívássáv: átveszi a CSS-állapotot */
    if (dock) animate(dock, { y: dockOn ? '0%' : '150%' }, { duration: 0 });

    /* Gombok: tapintható visszajelzés */
    $$('.btn, .hdr__call, .dock__call, .dock__loc').forEach(function (b) {
      var dn = function () { animate(b, { scale: 0.96 }, { type: 'spring', stiffness: 700, damping: 30 }); };
      var up = function () { animate(b, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 18 }); };
      b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    });

    /* GYIK */
    $$('.faq details').forEach(function (det) {
      det.addEventListener('toggle', function () {
        if (det.open) { var p = $('p', det); if (p) animate(p, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.32, ease: EASE }); }
      });
    });
  }

  /* ==================================================================
     FEJLÉC + MOBIL HÍVÁSSÁV
     ================================================================== */
  var contactIn = false, dockOn = false;
  function setDock(v) {
    if (!dock || v === dockOn) return;
    dockOn = v; dock.classList.toggle('is-on', v);
    safe(function (Mo) { Mo.animate(dock, { y: v ? '0%' : '150%' }, v ? { type: 'spring', stiffness: 380, damping: 28 } : { duration: 0.22, ease: 'easeIn' }); });
  }
  function onScroll() {
    var y = w.scrollY;
    if (hdr) hdr.classList.toggle('is-stuck', y > 8);
    if (hero) setDock(y > hero.offsetHeight * 0.6 && !contactIn);
  }
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if ('IntersectionObserver' in w && contact) {
    new IntersectionObserver(function (en) { contactIn = en[0].isIntersecting; onScroll(); }, { threshold: 0.2 }).observe(contact);
  }

  /* ==================================================================
     MOBIL MENÜ
     ================================================================== */
  var burger = $('#burger'), menu = $('#menu');
  function closeMenu(focusBack) {
    if (!menu || menu.hidden) return;
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menü megnyitása');
    d.body.classList.remove('no-scroll');
    var hide = function () { menu.hidden = true; };
    if (on) safe(function (Mo) { Mo.animate(menu, { opacity: [1, 0], y: [0, -10] }, { duration: 0.2 }).then(hide); }); else hide();
    if (focusBack) burger.focus();
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') return closeMenu(false);
      menu.hidden = false;
      burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Menü bezárása');
      d.body.classList.add('no-scroll');
      safe(function (Mo) {
        Mo.animate(menu, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.25, ease: EASE });
        Mo.animate($$('nav a, .menu__foot', menu), { opacity: [0, 1], x: [-14, 0] }, { duration: 0.32, delay: Mo.stagger(0.035, { startDelay: 0.06 }), ease: EASE });
      });
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });
    w.addEventListener('resize', function () { if (w.innerWidth >= 1100) closeMenu(false); });
  }

  /* ==================================================================
     HELYMEGOSZTÁS – csak gombnyomásra, engedéllyel; semmit nem tárolunk
     ================================================================== */
  var hb = $('#hely-gomb'), ho = $('#hely-ki'), TEL = '+36202590264';
  function locOut(html) { ho.innerHTML = html; ho.hidden = false; safe(function (Mo) { Mo.animate(ho, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3, ease: EASE }); }); }
  if (hb && ho) {
    hb.addEventListener('click', function () {
      if (!('geolocation' in navigator)) {
        locOut('<p>Ez a böngésző nem tudja megadni a helyet. Hívj minket, és mondd el a legközelebbi települést, utat vagy kilométerkövet.</p><div class="row"><a class="btn btn--dark" href="tel:' + TEL + '">Hívás most</a></div>');
        return;
      }
      hb.disabled = true; $('span', hb).textContent = 'Hely keresése…';
      navigator.geolocation.getCurrentPosition(function (pos) {
        hb.disabled = false; $('span', hb).textContent = 'Helyzetem frissítése';
        var la = pos.coords.latitude.toFixed(5), lo = pos.coords.longitude.toFixed(5);
        var link = 'https://maps.google.com/?q=' + la + ',' + lo;
        var msg = 'Autómentést kérek. A helyem: ' + link;
        locOut('<p>Megvan a helyed: <code>' + la + ', ' + lo + '</code> (±' + Math.round(pos.coords.accuracy) + ' m)</p>' +
          '<div class="row">' +
          '<a class="btn btn--dark" href="sms:' + TEL + '?&body=' + encodeURIComponent(msg) + '">SMS küldése a helyemmel</a>' +
          '<a class="btn btn--light" href="' + link + '" target="_blank" rel="noopener">Megnyitás térképen</a>' +
          '<button class="btn btn--light" type="button" id="hely-masol">Másolás</button>' +
          '</div><p>Utána hívj minket: <a href="tel:' + TEL + '"><b>+36 20 259 0264</b></a></p>');
        var cp = $('#hely-masol');
        if (cp) cp.addEventListener('click', function () {
          var done = function () { cp.textContent = 'Kimásolva'; };
          if (navigator.clipboard) navigator.clipboard.writeText(msg).then(done, function () { cp.textContent = 'Nem sikerült'; });
        });
      }, function (err) {
        hb.disabled = false; $('span', hb).textContent = 'Újrapróbálom';
        var why = err && err.code === 1 ? 'Nem kaptunk engedélyt a hely lekéréséhez.' : 'A helyet most nem sikerült lekérni.';
        locOut('<p>' + why + ' Hívj minket, és mondd el a legközelebbi települést, utat, kijáratot vagy kilométerkövet.</p><div class="row"><a class="btn btn--dark" href="tel:' + TEL + '">Hívás most</a></div>');
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
    });
  }

  /* ==================================================================
     GALÉRIA + NAGYÍTÓ
     ================================================================== */
  var items = $$('.gal__i'), gal = $('#gal'), gfb = $('#gal-fb');
  var broken = 0;
  items.forEach(function (b) {
    var im = $('img', b);
    var bad = function () { b.hidden = true; if (++broken === items.length && gal) { gal.hidden = true; if (gfb) gfb.hidden = false; } };
    if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) bad(); else im.addEventListener('error', bad);
  });

  var lb, lbImg, lbCap, lbCnt, idx = 0, opener = null;
  function vis() { return items.filter(function (b) { return !b.hidden; }); }
  function build() {
    lb = d.createElement('div'); lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Képnézegető');
    lb.innerHTML = '<figure class="lb__fig"><img alt=""></figure><div class="lb__bar"><span class="lb__cap"></span><span class="lb__count"></span><div class="lb__nav"><button type="button" class="lb__p" aria-label="Előző kép">‹</button><button type="button" class="lb__n" aria-label="Következő kép">›</button></div></div><button type="button" class="lb__x" aria-label="Bezárás">×</button>';
    d.body.appendChild(lb);
    lbImg = $('img', lb); lbCap = $('.lb__cap', lb); lbCnt = $('.lb__count', lb);
    $('.lb__x', lb).addEventListener('click', closeLb);
    $('.lb__p', lb).addEventListener('click', function () { go(-1); });
    $('.lb__n', lb).addEventListener('click', function () { go(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__fig')) closeLb(); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Tab') {
        var f = $$('button', lb), i = f.indexOf(d.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    var sx = null;
    lb.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    lb.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
  }
  function show(dir) {
    var v = vis(), b = v[idx], im = $('img', b);
    lbImg.src = b.getAttribute('data-full'); lbImg.alt = im.alt;
    lbCap.textContent = im.alt; lbCnt.textContent = (idx + 1) + ' / ' + v.length;
    safe(function (Mo) { Mo.animate(lbImg, { opacity: [0, 1], x: [dir ? dir * 40 : 0, 0], scale: [dir ? 1 : 0.96, 1] }, { type: 'spring', stiffness: 260, damping: 28 }); });
  }
  function go(dir) { var n = vis().length; idx = (idx + dir + n) % n; show(dir); }
  function openLb(b) {
    if (!lb) build();
    opener = b; idx = Math.max(0, vis().indexOf(b));
    lb.hidden = false; d.body.classList.add('no-scroll');
    safe(function (Mo) { Mo.animate(lb, { opacity: [0, 1] }, { duration: 0.2 }); });
    show(0); $('.lb__x', lb).focus();
  }
  function closeLb() { lb.hidden = true; d.body.classList.remove('no-scroll'); if (opener) opener.focus(); }
  items.forEach(function (b) { b.addEventListener('click', function () { openLb(b); }); });
})();
