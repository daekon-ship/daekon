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
      gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: .25, ease: 'power1.out', clearProps: 'opacity' });
    }
    var t = $('#tab-' + id);
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
    .fromTo('[data-hero="fade"]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, stagger: .07, ease: 'power3.out' }, .7);

  /* ---- hero: görgetésre mélység + a tányér „forog” ---- */
  mm.add('(min-width: 900px)', function () {
  });

  /* görgetéshez kötött szöveg- és képanimáció nincs: a tartalom mindig teljesen, fixen látszik */

  // a ragadós szakasz méretei a képek betöltése után változhatnak
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
