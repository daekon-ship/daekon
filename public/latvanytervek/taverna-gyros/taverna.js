/* Taverna Gyros Monor — látványterv 2026
   Felület: nyitvatartás-állapot, fejléc, mobil menü, étlap (fejezetek + keresés),
   galéria-lightbox, kiszállítási iránytű, közelről-színpad.
   Mozgás: GSAP + ScrollTrigger (helyben), csak ha a mozgáscsökkentés nincs bekapcsolva. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animOn = !reduce && hasGsap;
  if (!animOn) { doc.classList.remove('anim'); clearTimeout(window.__animFallback); }

  /* ---------------- nyitvatartás (budapesti idő) ---------------- */
  var DAYS = ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton'];
  function budapestNow() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Budapest', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
    return { day: wd, min: parseInt(o.hour, 10) % 24 * 60 + parseInt(o.minute, 10) };
  }
  function statusText() {
    var n = budapestNow(), open = n.day !== 0 && n.min >= 660 && n.min < 1260;
    var txt;
    if (open && n.min < 1230) txt = 'Most nyitva, telefonos rendelés 20:30-ig';
    else if (open) txt = 'Nyitva 21:00-ig, a rendelésfelvétel mára lezárult';
    else {
      var next = n.day;
      if (n.day !== 0 && n.min < 660) txt = 'Zárva, ma 11:00-kor nyitunk';
      else {
        next = (n.day + 1) % 7; if (next === 0) next = 1;
        txt = 'Zárva, ' + (next === (n.day + 1) % 7 ? 'holnap' : DAYS[next]) + ' 11:00-kor nyitunk';
      }
    }
    return { open: open, txt: txt, day: n.day };
  }
  function paintStatus() {
    var s = statusText();
    $$('[data-status]').forEach(function (el) { el.textContent = s.txt; });
    var hs = $('.hero-status'); if (hs) hs.classList.toggle('is-open', s.open);
    $$('.hours tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-day') === s.day); });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------------- fejléc + mobil sáv ---------------- */
  var head = $('#fejlec'), hero = $('.hero'), dock = $('.dock');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY, hb = hero.offsetHeight - 80;
    head.classList.toggle('is-scrolled', y > 8);
    head.classList.toggle('is-solid', y > hb);
    if (!document.body.classList.contains('drawer-open')) head.classList.toggle('is-hidden', y > hb + 200 && y > lastY + 2);
    if (y < lastY - 2) head.classList.remove('is-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('.head-burger'), drawer = $('#drawer');
  function setDrawer(open) {
    burger.setAttribute('aria-expanded', String(open));
    $('.sr', burger).textContent = open ? 'Menü bezárása' : 'Menü megnyitása';
    drawer.hidden = !open;
    document.body.classList.toggle('drawer-open', open);
    if (open) { var f = $('a', drawer); if (f) f.focus(); }
  }
  burger.addEventListener('click', function () { setDrawer(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) { setDrawer(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth >= 980 && !drawer.hidden) setDrawer(false); });

  /* ---------------- étlap ---------------- */
  var MENU = window.ETLAP || [];
  var tabsEl = $('[data-menu-tabs]'), panel = $('[data-menu-panel]'), search = $('[data-menu-search]');
  var current = MENU.length ? MENU[0].id : null;
  var total = MENU.reduce(function (n, c) { return n + c.items.length; }, 0);
  var totalEl = $('[data-menu-total]'); if (totalEl) totalEl.textContent = total;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fold(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function priceHtml(p) {
    if (!p || p === '—') return '<span class="pr">—</span>';
    if (p.indexOf('/') > -1) {
      var a = p.split('/').map(function (x) { return x.trim(); });
      return '<span class="pr">' + esc(a[0]) + ' / ' + esc(a[1]) + '<small>Ft</small></span>';
    }
    return '<span class="pr">' + esc(p) + (p.charAt(0) === '+' ? '<small>Ft felár</small>' : '<small>Ft</small>') + '</span>';
  }
  function nameHtml(n, q) {
    if (!q) return esc(n);
    var f = fold(n), i = f.indexOf(q);
    if (i < 0) return esc(n);
    return esc(n.slice(0, i)) + '<mark>' + esc(n.slice(i, i + q.length)) + '</mark>' + esc(n.slice(i + q.length));
  }
  function rowHtml(it, q, cat) {
    return '<li class="menu-row"><span class="nm">' + nameHtml(it.n, q) + '</span>' + priceHtml(it.p) +
      (it.d ? '<span class="ds">' + esc(it.d) + '</span>' : '') +
      (cat ? '<span class="cat">' + esc(cat) + '</span>' : '') + '</li>';
  }

  MENU.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'menu-tab'; b.id = 'tab-' + c.id;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'etlap-panel');
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false'); b.tabIndex = i === 0 ? 0 : -1;
    b.dataset.cat = c.id;
    b.innerHTML = '<span>' + esc(c.name) + '</span><small>' + c.items.length + '</small>';
    tabsEl.appendChild(b);
  });
  panel.id = 'etlap-panel';

  function renderCat(id, animate) {
    var c = MENU.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    current = id;
    $$('.menu-tab', tabsEl).forEach(function (b) {
      var on = b.dataset.cat === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'tab-' + id);
    panel.innerHTML = '<div class="menu-panel-head"><h3>' + esc(c.name) + '</h3><p>' + esc(c.lede) + '</p></div>' +
      '<ul class="menu-list">' + c.items.map(function (it) { return rowHtml(it); }).join('') + '</ul>';
    if (animate && animOn) {
      gsap.fromTo($('.menu-panel-head h3', panel), { yPercent: 100, clipPath: 'inset(0 0 100% 0)' }, { yPercent: 0, clipPath: 'inset(0 0 0% 0)', duration: .55, ease: 'power3.out' });
      gsap.fromTo($$('.menu-row', panel), { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: .45, ease: 'power2.out', stagger: .025, clearProps: 'transform,opacity' });
    }
    var t = $('#tab-' + id);
    if (t && tabsEl.scrollWidth > tabsEl.clientWidth) tabsEl.scrollTo({ left: t.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
  }
  function renderSearch(q) {
    var hits = [];
    MENU.forEach(function (c) { c.items.forEach(function (it) { if (fold(it.n + ' ' + it.d).indexOf(q) > -1) hits.push({ it: it, cat: c.name }); }); });
    $$('.menu-tab', tabsEl).forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
    panel.removeAttribute('aria-labelledby');
    panel.setAttribute('aria-label', 'Keresési találatok');
    panel.innerHTML = '<div class="menu-panel-head"><h3>' + hits.length + ' találat</h3><p>Erre kerestél: „' + esc(search.value.trim()) + '”</p></div>' +
      (hits.length ? '<ul class="menu-list">' + hits.map(function (h) { return rowHtml(h.it, q, h.cat); }).join('') + '</ul>'
        : '<p class="menu-empty">Nincs ilyen tétel az étlapon. Próbáld rövidebb szóval, például „gyros” vagy „sajt”.</p>');
  }
  if (MENU.length) renderCat(current, false);

  tabsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.menu-tab'); if (!b) return;
    if (search.value) search.value = '';
    renderCat(b.dataset.cat, true);
  });
  tabsEl.addEventListener('keydown', function (e) {
    var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (keys.indexOf(e.key) < 0) return;
    e.preventDefault();
    var tabs = $$('.menu-tab', tabsEl), i = tabs.indexOf(document.activeElement);
    if (e.key === 'Home') i = 0; else if (e.key === 'End') i = tabs.length - 1;
    else i = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[i].focus(); search.value = ''; renderCat(tabs[i].dataset.cat, true);
  });
  var sTimer;
  search.addEventListener('input', function () {
    clearTimeout(sTimer);
    sTimer = setTimeout(function () {
      var q = fold(search.value.trim());
      if (q.length < 2) { renderCat(current, false); return; }
      renderSearch(q);
    }, 120);
  });
  $$('[data-cat-link]').forEach(function (a) {
    a.addEventListener('click', function () { search.value = ''; renderCat(a.getAttribute('data-cat-link'), false); });
  });

  /* ---------------- galéria + lightbox ---------------- */
  var lb = $('#lightbox'), lbImg = $('[data-lb-img]'), lbCap = $('[data-lb-cap]'), lbN = $('[data-lb-n]');
  var shots = $$('[data-lb]').map(function (b) {
    var img = $('img', b), src = $('source', b);
    var set = (src ? src.getAttribute('srcset') : img.getAttribute('srcset')).split(',').pop().trim().split(' ')[0];
    return { src: set, alt: img.alt, btn: b };
  });
  var lbI = 0, lastFocus = null;
  function showLb(i) {
    lbI = (i + shots.length) % shots.length;
    var s = shots[lbI];
    lbImg.src = s.src; lbImg.alt = s.alt; lbCap.textContent = s.alt; lbN.textContent = (lbI + 1) + ' / ' + shots.length;
    if (animOn) gsap.fromTo(lbImg, { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: .35, ease: 'power2.out' });
  }
  function openLb(i) {
    lastFocus = document.activeElement; lb.hidden = false; document.body.classList.add('lb-open');
    document.body.style.overflow = 'hidden'; showLb(i); $('[data-lb-close]').focus();
  }
  function closeLb() {
    lb.hidden = true; document.body.classList.remove('lb-open'); document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  shots.forEach(function (s, i) { s.btn.addEventListener('click', function () { openLb(i); }); s.btn.setAttribute('aria-label', 'Nagyítás: ' + s.alt); });
  $('[data-lb-close]').addEventListener('click', closeLb);
  $('[data-lb-prev]').addEventListener('click', function () { showLb(lbI - 1); });
  $('[data-lb-next]').addEventListener('click', function () { showLb(lbI + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowRight') showLb(lbI + 1);
    else if (e.key === 'ArrowLeft') showLb(lbI - 1);
    else if (e.key === 'Tab') {
      var f = $$('button', lb), a = f.indexOf(document.activeElement);
      e.preventDefault(); f[(a + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  var sx = null, sy = null;
  lb.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
  lb.addEventListener('pointerup', function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showLb(lbI + (dx < 0 ? 1 : -1));
  });
  var galGrid = $('[data-gallery]'), galN = $('[data-gal-n]');
  galGrid.addEventListener('scroll', function () {
    var items = galGrid.children, mid = galGrid.scrollLeft + galGrid.clientWidth / 2, best = 0, bd = 1e9;
    for (var i = 0; i < items.length; i++) { var c = items[i].offsetLeft + items[i].offsetWidth / 2, d = Math.abs(c - mid); if (d < bd) { bd = d; best = i; } }
    galN.textContent = best + 1;
  }, { passive: true });

  /* ---------------- kiszállítási iránytű ---------------- */
  var TOWNS = [ // [név, irány fokban (É = 0), gyűrű]
    ['Gomba', 20, 0], ['Péteri', 262, 0],
    ['Monorierdő', 140, 1], ['Csévharaszt', 182, 1], ['Vasad', 212, 1], ['Gyömrő', 338, 1],
    ['Bénye', 62, 2], ['Pilis', 100, 2], ['Nyáregyháza', 158, 2], ['Üllő', 305, 2]
  ];
  var R = [70, 120, 168];
  var dial = $('[data-dial]'), NS = 'http://www.w3.org/2000/svg';
  TOWNS.forEach(function (t) {
    var a = (t[1] - 90) * Math.PI / 180, r = R[t[2]];
    var x = 200 + Math.cos(a) * r, y = 200 + Math.sin(a) * r;
    var x0 = 200 + Math.cos(a) * 36, y0 = 200 + Math.sin(a) * 36;
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'dial-town');
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', x0.toFixed(1)); l.setAttribute('y1', y0.toFixed(1)); l.setAttribute('x2', x.toFixed(1)); l.setAttribute('y2', y.toFixed(1));
    l.setAttribute('class', 'dial-spoke');
    var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', 6); c.setAttribute('class', 'dial-dot');
    var tx = document.createElementNS(NS, 'text'); tx.setAttribute('class', 'dial-label'); tx.textContent = t[0];
    var dx = Math.cos(a), dy = Math.sin(a);
    if (Math.abs(dx) < .3) { tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('x', x.toFixed(1)); tx.setAttribute('y', (y + (dy < 0 ? -14 : 24)).toFixed(1)); }
    else { tx.setAttribute('text-anchor', dx > 0 ? 'start' : 'end'); tx.setAttribute('x', (x + (dx > 0 ? 12 : -12)).toFixed(1)); tx.setAttribute('y', (y + 5).toFixed(1)); }
    g.appendChild(l); g.appendChild(c); g.appendChild(tx); dial.appendChild(g);
  });

  /* ---------------- közelről: gombok (mozgás nélkül is működik) ---------------- */
  var showBtns = $$('.show-list button'), showShots = $$('.show-shot'), showN = $('[data-show-n]');
  function setShow(i) {
    showBtns.forEach(function (b, k) { b.parentNode.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    if (showN) showN.textContent = i + 1;
  }
  var showST = null, showSeg = [];
  showBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (showST) {
        var y = showST.start + (showST.end - showST.start) * showSeg[i];
        window.scrollTo({ top: y + 2, behavior: 'smooth' });
      } else {
        showShots.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
        setShow(i);
      }
    });
  });
  setShow(0);

  /* =========================================================
     MOZGÁS
     ========================================================= */
  if (!animOn) return;
  gsap.registerPlugin(ScrollTrigger);
  clearTimeout(window.__animFallback);
  var mm = gsap.matchMedia();

  // sorokra bontás a címekhez — animáció után visszaáll az eredeti szöveg
  function splitLines(el) {
    var original = el.innerHTML, text = el.textContent.trim().split(/\s+/);
    el.innerHTML = text.map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
    var lines = [], top = null;
    $$('.w', el).forEach(function (w) {
      if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map(function (l) { return '<span class="ln"><span>' + esc(l.join(' ')) + '</span></span>'; }).join('');
    return { inner: $$('.ln > span', el), revert: function () { el.innerHTML = original; } };
  }

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  /* ---- 01 hero: filmszerű belépés ---- */
  var heroTl = gsap.timeline({ defaults: { ease: 'power4.out' }, onComplete: function () { doc.classList.remove('anim'); } });
  heroTl
    .fromTo('[data-hero="arch"] .arch-img', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15 }, 0)
    .fromTo('[data-hero="arch"] img', { scale: 1.35 }, { scale: 1, duration: 1.5, ease: 'expo.out' }, 0)
    .fromTo('[data-hero="line"]', { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: .95, stagger: .1 }, .12)
    .fromTo('[data-hero="plate"]', { opacity: 0, scale: .55, rotate: -120 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.4)' }, .55)
    .fromTo('[data-hero="fade"]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, stagger: .07, ease: 'power3.out' }, .7);

  /* ---- hero: görgetésre mélység + a tányér „forog” ---- */
  gsap.to('.hero-arch .arch-img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.ring', { rotate: 220, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
  mm.add('(min-width: 900px)', function () {
    gsap.to('.hero-arch', { rotateY: -9, rotateX: 3, scale: .95, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-copy', { y: -70, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.plate', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  fontsReady.then(function () {
    /* ---- címek soronként ---- */
    $$('[data-split]').forEach(function (el) {
      var s = splitLines(el);
      gsap.fromTo(s.inner, { yPercent: 108 }, {
        yPercent: 0, duration: .9, ease: 'power4.out', stagger: .09,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        onComplete: s.revert
      });
    });

    /* ---- bekezdések: rövid emelkedés ---- */
    gsap.set('[data-rise]', { opacity: 0 });
    ScrollTrigger.batch('[data-rise]', {
      start: 'top 90%', once: true,
      onEnter: function (els) { gsap.fromTo(els, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'power3.out', stagger: .08, clearProps: 'transform,opacity' }); }
    });

    /* ---- képek: korán induló, rövid megjelenés teljes keretben —
       nincs oldalról becsúszó vagy félig kivágott köztes állapot ---- */
    function showUp(el, delay) {
      gsap.fromTo(el, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: .6, delay: delay || 0, ease: 'power2.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top 96%', once: true }
      });
    }
    $$('[data-wipe], [data-slide], .exp-arch, [data-tilt]').forEach(function (el) { showUp(el); });

    /* ---- 05 közelről: ragadós színpad, kör alakú „tányér” átmenetek ---- */
    document.querySelector('.show').classList.add('anim-ready');
    var showTl = gsap.timeline({ defaults: { ease: 'none' } });
    var seg = 1.3, total = 0;
    showShots.forEach(function (s, i) { s.style.zIndex = i + 1; if (i) gsap.set(s, { clipPath: 'circle(0% at 50% 62%)' }); });
    showSeg = [0];
    for (var i = 1; i < showShots.length; i++) {
      var at = (i - 1) * seg + .35;
      showTl.to(showShots[i], { clipPath: 'circle(78% at 50% 62%)', duration: 1, ease: 'power2.inOut' }, at)
        .fromTo($('img', showShots[i]), { scale: 1.3, rotate: -6 }, { scale: 1, rotate: 0, duration: 1, ease: 'power2.out' }, at)
        .to($('img', showShots[i - 1]), { scale: 1.12, duration: 1 }, at);
      showSeg.push(at + 1);
      total = at + 1;
    }
    showTl.to({}, { duration: .35 }, total);
    var tlDur = showTl.duration();
    showSeg = showSeg.map(function (t) { return t / tlDur; });
    showST = ScrollTrigger.create({
      trigger: '.show-track', start: 'top top', end: 'bottom bottom', scrub: .4, animation: showTl,
      onUpdate: function (self) {
        var t = self.progress * tlDur, idx = 0;
        for (var k = 1; k < showShots.length; k++) if (t >= (k - 1) * seg + .35 + .5) idx = k;
        if (idx !== setShow.cur) { setShow.cur = idx; setShow(idx); }
      }
    });

    /* ---- 06 galéria: fokozatos feltárás ---- */
    mm.add('(min-width: 760px)', function () {
      gsap.set('.gal-grid li', { opacity: 0 });
      ScrollTrigger.batch('.gal-grid li', {
        start: 'top 96%', once: true,
        onEnter: function (els) {
          gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out', stagger: .06, clearProps: 'transform,opacity' });
        }
      });
    });
    mm.add('(max-width: 759px)', function () {
      gsap.fromTo('.gal-grid li', { opacity: 0 }, { opacity: 1, duration: .5, stagger: .05, ease: 'power2.out', clearProps: 'opacity', scrollTrigger: { trigger: '.gal-grid', start: 'top 96%', once: true } });
    });

    /* ---- 07 szállítás: a küllők kirajzolódnak ---- */
    var spokes = $$('.dial-spoke');
    spokes.forEach(function (l) {
      var len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
      l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
    });
    var dialTl = gsap.timeline({ scrollTrigger: { trigger: '.del-dial', start: 'top 80%', once: true } });
    dialTl.fromTo('.dial-rings circle', { scale: .4, opacity: 0, transformOrigin: '200px 200px' }, { scale: 1, opacity: 1, duration: .9, stagger: .1, ease: 'expo.out' })
      .fromTo('.dial-core, .dial-monor', { scale: 0, transformOrigin: '200px 200px' }, { scale: 1, duration: .6, ease: 'back.out(2)' }, .1)
      .to(spokes, { strokeDashoffset: 0, duration: .6, stagger: .05, ease: 'power2.out' }, .35)
      .fromTo('.dial-dot', { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' }, { scale: 1, duration: .35, stagger: .05, ease: 'back.out(3)' }, .6)
      .fromTo('.dial-label', { opacity: 0 }, { opacity: 1, duration: .4, stagger: .05 }, .7);
    gsap.fromTo('.del-towns li', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, stagger: .04, ease: 'power3.out', scrollTrigger: { trigger: '.del-towns', start: 'top 92%', once: true } });


    ScrollTrigger.refresh();
  });

  // a ragadós szakasz méretei a képek betöltése után változhatnak
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
