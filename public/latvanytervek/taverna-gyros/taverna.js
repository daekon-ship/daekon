/* Taverna Gyros Monor — látványterv, 2. irány
   Felület: nyitvatartás, fejléc + haladásjelző, mobil menü, étlap (fejezetek + keresés),
   galéria-lightbox, kiszállítási vázlat, rétegrajz.
   Mozgás: visszafogott megjelenés (IntersectionObserver) és a rétegrajz szétnyílása
   (GSAP + ScrollTrigger, helyben). Mozgáscsökkentésnél minden statikus. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  window.__tvOK = true;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fold(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ---------------- nyitvatartás (budapesti idő) ---------------- */
  var DAYS = ['vasárnap', 'hétfőn', 'kedden', 'szerdán', 'csütörtökön', 'pénteken', 'szombaton'];
  function budapestNow() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Budapest', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], min: parseInt(o.hour, 10) % 24 * 60 + parseInt(o.minute, 10) };
  }
  function paintStatus() {
    var n = budapestNow(), open = n.day !== 0 && n.min >= 660 && n.min < 1260, txt;
    if (open && n.min < 1230) txt = 'Most nyitva · 21:00-ig';
    else if (open) txt = 'Nyitva 21:00-ig · rendelés lezárva';
    else if (n.day !== 0 && n.min < 660) txt = 'Zárva · ma 11:00-kor nyit';
    else { var nx = (n.day + 1) % 7; if (nx === 0) nx = 1; txt = 'Zárva · ' + (nx === (n.day + 1) % 7 ? 'holnap' : DAYS[nx]) + ' 11:00-kor nyit'; }
    $$('[data-status]').forEach(function (el) { el.textContent = txt; });
    $$('.hours tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-day') === n.day); });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------------- fejléc, haladásjelző ---------------- */
  var hdr = $('#fejlec'), prog = $('.progress');
  function onScroll() {
    var y = window.scrollY, h = doc.scrollHeight - window.innerHeight;
    hdr.classList.toggle('is-compact', y > 10);
    prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
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
  window.addEventListener('resize', function () { if (window.innerWidth >= 1000 && !drawer.hidden) setDrawer(false); });

  /* ---------------- megjelenés ---------------- */
  var ins = $$('[data-in]');
  if (doc.classList.contains('anim') && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .01 });
    ins.forEach(function (el) { io.observe(el); });
  } else { doc.classList.remove('anim'); }

  /* ---------------- étlap ---------------- */
  var MENU = window.ETLAP || [];
  var tabsEl = $('[data-menu-tabs]'), panel = $('[data-menu-panel]'), search = $('[data-menu-search]');
  var current = MENU.length ? MENU[0].id : null;
  var total = MENU.reduce(function (n, c) { return n + c.items.length; }, 0);
  $$('[data-menu-total]').forEach(function (el) { el.textContent = total; });

  function priceHtml(p) {
    if (!p || p === '—') return '<span class="pr">—</span>';
    if (p.indexOf('/') > -1) { var a = p.split('/').map(function (x) { return x.trim(); }); return '<span class="pr">' + esc(a[0]) + ' / ' + esc(a[1]) + '<small>Ft</small></span>'; }
    return '<span class="pr">' + esc(p) + (p.charAt(0) === '+' ? '<small>Ft felár</small>' : '<small>Ft</small>') + '</span>';
  }
  function nameHtml(n, q) {
    if (!q) return esc(n);
    var i = fold(n).indexOf(q);
    if (i < 0) return esc(n);
    return esc(n.slice(0, i)) + '<mark>' + esc(n.slice(i, i + q.length)) + '</mark>' + esc(n.slice(i + q.length));
  }
  function rowHtml(it, q, cat) {
    return '<li class="menu-row"><span class="nm">' + nameHtml(it.n, q) + '</span>' + priceHtml(it.p) +
      (it.d ? '<span class="ds">' + esc(it.d) + '</span>' : '') + (cat ? '<span class="cat">' + esc(cat) + '</span>' : '') + '</li>';
  }
  MENU.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'menu-tab'; b.id = 'tab-' + c.id;
    b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'etlap-panel');
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false'); b.tabIndex = i === 0 ? 0 : -1;
    b.dataset.cat = c.id;
    b.innerHTML = '<span>' + esc(c.name) + '</span><small>' + (c.items.length < 10 ? '0' : '') + c.items.length + '</small>';
    tabsEl.appendChild(b);
  });
  panel.id = 'etlap-panel';
  function renderCat(id) {
    var c = MENU.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    current = id;
    $$('.menu-tab', tabsEl).forEach(function (b) { var on = b.dataset.cat === id; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', 'tab-' + id); panel.removeAttribute('aria-label');
    panel.innerHTML = '<div class="menu-panel-head"><h3>' + esc(c.name) + '</h3><p>' + esc(c.lede) + '</p></div><ul class="menu-list">' + c.items.map(function (it) { return rowHtml(it); }).join('') + '</ul>';
    if (!reduce && panel.animate) panel.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.1,1)' });
  }
  function renderSearch(q) {
    var hits = [];
    MENU.forEach(function (c) { c.items.forEach(function (it) { if (fold(it.n + ' ' + it.d).indexOf(q) > -1) hits.push({ it: it, cat: c.name }); }); });
    $$('.menu-tab', tabsEl).forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
    panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label', 'Keresési találatok');
    panel.innerHTML = '<div class="menu-panel-head"><h3>' + hits.length + ' találat</h3><p>Erre kerestél: „' + esc(search.value.trim()) + '”</p></div>' +
      (hits.length ? '<ul class="menu-list">' + hits.map(function (h) { return rowHtml(h.it, q, h.cat); }).join('') + '</ul>'
        : '<p class="menu-empty">Nincs ilyen tétel az étlapon. Próbáld rövidebb szóval, például „gyros” vagy „sajt”.</p>');
  }
  if (MENU.length) renderCat(current);
  tabsEl.addEventListener('click', function (e) { var b = e.target.closest('.menu-tab'); if (!b) return; search.value = ''; renderCat(b.dataset.cat); });
  tabsEl.addEventListener('keydown', function (e) {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].indexOf(e.key) < 0) return;
    e.preventDefault();
    var tabs = $$('.menu-tab', tabsEl), i = tabs.indexOf(document.activeElement);
    if (e.key === 'Home') i = 0; else if (e.key === 'End') i = tabs.length - 1;
    else i = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[i].focus(); search.value = ''; renderCat(tabs[i].dataset.cat);
  });
  var sT;
  search.addEventListener('input', function () {
    clearTimeout(sT);
    sT = setTimeout(function () { var q = fold(search.value.trim()); if (q.length < 2) renderCat(current); else renderSearch(q); }, 120);
  });

  /* ---------------- galéria + lightbox ---------------- */
  var lb = $('#lightbox'), lbImg = $('[data-lb-img]'), lbCap = $('[data-lb-cap]'), lbN = $('[data-lb-n]');
  var shots = $$('[data-lb]').map(function (b) {
    var img = $('img', b), src = $('source', b);
    return { src: (src ? src.getAttribute('srcset') : img.getAttribute('srcset')).split(',').pop().trim().split(' ')[0], alt: img.alt, btn: b };
  });
  var lbI = 0, lastFocus = null;
  function showLb(i) {
    lbI = (i + shots.length) % shots.length;
    lbImg.src = shots[lbI].src; lbImg.alt = shots[lbI].alt; lbCap.textContent = shots[lbI].alt;
    lbN.textContent = (lbI + 1 < 10 ? '0' : '') + (lbI + 1) + ' / 0' + shots.length;
  }
  function openLb(i) { lastFocus = document.activeElement; lb.hidden = false; document.body.classList.add('lb-open'); document.body.style.overflow = 'hidden'; showLb(i); $('[data-lb-close]').focus(); }
  function closeLb() { lb.hidden = true; document.body.classList.remove('lb-open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
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
    else if (e.key === 'Tab') { var f = $$('button', lb), a = f.indexOf(document.activeElement); e.preventDefault(); f[(a + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
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
    var it = galGrid.children, mid = galGrid.scrollLeft + galGrid.clientWidth / 2, best = 0, bd = 1e9;
    for (var i = 0; i < it.length; i++) { var d = Math.abs(it[i].offsetLeft + it[i].offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } }
    galN.textContent = best + 1;
  }, { passive: true });

  /* ---------------- kiszállítási vázlat ---------------- */
  var TOWNS = [['Gomba', 20, 0], ['Péteri', 262, 0], ['Monorierdő', 140, 1], ['Csévharaszt', 182, 1], ['Vasad', 212, 1], ['Gyömrő', 338, 1], ['Bénye', 62, 2], ['Pilis', 100, 2], ['Nyáregyháza', 158, 2], ['Üllő', 305, 2]];
  var R = [70, 120, 168], dial = $('[data-dial]'), NS = 'http://www.w3.org/2000/svg';
  function el(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  TOWNS.forEach(function (t) {
    var a = (t[1] - 90) * Math.PI / 180, r = R[t[2]], x = 200 + Math.cos(a) * r, y = 200 + Math.sin(a) * r;
    var g = el('g', {});
    g.appendChild(el('line', { x1: (200 + Math.cos(a) * 12).toFixed(1), y1: (200 + Math.sin(a) * 12).toFixed(1), x2: x.toFixed(1), y2: y.toFixed(1), 'class': 'dial-spoke' }));
    g.appendChild(el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 3.5, 'class': 'dial-dot' }));
    var dx = Math.cos(a), dy = Math.sin(a), tx;
    if (Math.abs(dx) < .3) tx = el('text', { 'class': 'dial-label', 'text-anchor': 'middle', x: x.toFixed(1), y: (y + (dy < 0 ? -12 : 22)).toFixed(1) });
    else tx = el('text', { 'class': 'dial-label', 'text-anchor': dx > 0 ? 'start' : 'end', x: (x + (dx > 0 ? 10 : -10)).toFixed(1), y: (y + 5).toFixed(1) });
    tx.textContent = t[0]; g.appendChild(tx); dial.appendChild(g);
  });

  /* ---------------- rétegrajz ---------------- */
  var lyGroups = $$('.layers-svg .ly'), lyItems = $$('.ly-list li');
  function setLayer(n) {
    lyGroups.forEach(function (g) { g.classList.toggle('is-on', +g.getAttribute('data-ly') === n); });
    lyItems.forEach(function (li) { li.classList.toggle('is-on', +li.getAttribute('data-ly') === n); });
  }
  lyItems.forEach(function (li) {
    li.addEventListener('mouseenter', function () { setLayer(+li.getAttribute('data-ly')); });
  });
  setLayer(1);

  if (reduce || !hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  // szétnyílás: a rétegek összecsukva indulnak, görgetésre a helyükre nyílnak; utána sorban kiemelődnek
  var GAP = 100, TIGHT = 26;
  var tl = gsap.timeline({ defaults: { ease: 'none' } });
  lyGroups.forEach(function (g, i) {
    tl.fromTo(g, { y: (2 - i) * (GAP - TIGHT) }, { y: 0, duration: 1 }, 0);
  });
  tl.fromTo('.layers-svg .lead', { opacity: 0 }, { opacity: 1, duration: .35 }, .65);
  tl.to({}, { duration: 1.2 });
  ScrollTrigger.create({
    trigger: '.layers-fig', start: 'top 85%', end: 'bottom 25%', scrub: .5, animation: tl,
    onUpdate: function (self) {
      var p = self.progress, n = p < .45 ? 1 : Math.min(5, 1 + Math.floor((p - .45) / .55 * 5));
      if (n !== setLayer.cur) { setLayer.cur = n; setLayer(n); }
    }
  });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
