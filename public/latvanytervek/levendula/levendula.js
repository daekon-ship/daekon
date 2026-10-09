/* Levendula Szépségszalon – 3. változat */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var desktop = window.matchMedia('(min-width:1001px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var ft = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; };

  /* ---------- the eye: almond ↔ rectangle path ---------- */
  var A = [[0,.5],[.12,.3],[.3,.06],[.5,.06],[.7,.06],[.88,.3],[1,.5],[.88,.7],[.7,.94],[.5,.94],[.3,.94],[.12,.7],[0,.5]];
  var R = [[0,.5],[0,0],[0,0],[.5,0],[1,0],[1,0],[1,.5],[1,1],[1,1],[.5,1],[0,1],[0,1],[0,.5]];
  var r3 = function (v) { return Math.round(v * 1000) / 1000; };
  var eyeD = function (morph, open) {
    var P = A.map(function (a, i) {
      var k = 1 + 0.22 * morph;
      var x = a[0] + (R[i][0] - a[0]) * morph;
      var y = a[1] + (R[i][1] - a[1]) * morph;
      x = 0.5 + (x - 0.5) * k;
      y = 0.5 + (y - 0.5) * open * k;
      return r3(x) + ',' + r3(y);
    });
    return 'M' + P[0] + ' C' + P[1] + ' ' + P[2] + ' ' + P[3] + ' C' + P[4] + ' ' + P[5] + ' ' + P[6] +
      ' C' + P[7] + ' ' + P[8] + ' ' + P[9] + ' C' + P[10] + ' ' + P[11] + ' ' + P[12] + ' Z';
  };
  var eyePath = $('#eyePath');
  var eyeState = { morph: 0, open: 1 };
  var drawEye = function () { if (eyePath) eyePath.setAttribute('d', eyeD(eyeState.morph, eyeState.open)); };

  var hero = $('.hero');
  var ready = function () { if (hero) hero.classList.add('is-ready'); };

  /* ---------- header ---------- */
  var hdr = $('.hdr'), mbar = $('.mbar');
  var heroEnd = function () { return hero ? hero.offsetTop + hero.offsetHeight - 80 : 200; };
  var pinExtra = 0;
  var onScroll = function () {
    var y = window.scrollY;
    hdr.classList.toggle('is-solid', y > heroEnd() + pinExtra);
    if (mbar) {
      var on = !desktop.matches && y > (hero ? hero.offsetHeight * 0.7 : 300);
      mbar.classList.toggle('is-on', on);
      mbar.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a,button', mbar).forEach(function (el) { el.tabIndex = on ? 0 : -1; });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  var burger = $('.burger'), mm = $('.mmenu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    mm.hidden = !open;
    hdr.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', mm).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mm.hidden) setMenu(false); });

  /* ---------- motion ---------- */
  if (hasG && !reduce) {
    gsap.registerPlugin(ScrollTrigger);

    requestAnimationFrame(ready);

    ScrollTrigger.matchMedia({
      '(min-width:1001px)': function () {
        /* services: horizontal ride */
        var track = $('.svc-track'), bar = $('.svc-progress i');
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        var h = gsap.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: '.svc', start: 'top top', end: function () { return '+=' + dist(); },
            pin: true, scrub: 0.8, invalidateOnRefresh: true,
            onUpdate: function (s) { gsap.set(bar, { scaleX: s.progress }); }
          }
        });
      },
      '(max-width:1000px)': function () {
        /* mobil: nincs képmozgatás */
      }
    });

    /* contact eye opens when it scrolls in */
    var p2 = $('#eyeClip2 path');
    if (p2) {
      var st2 = { open: 0.05 };
      var d2 = function () { p2.setAttribute('d', eyeD(0, st2.open)); };
      d2();
      gsap.to(st2, { open: 1, ease: 'none', onUpdate: d2, scrollTrigger: { trigger: '.contact-eye', start: 'top 85%', end: 'center 55%', scrub: 0.6 } });
    }

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else {
    ready();
  }
  onScroll();

  /* gift tilt (pointer) */
  var stage = $('.gift-stage');
  if (stage && !reduce && window.matchMedia('(hover:hover)').matches) {
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      $('.gc-1', stage).style.transform = 'rotate(-8deg) rotateY(' + (px * 14) + 'deg) rotateX(' + (-py * 10) + 'deg) translateZ(10px)';
      $('.gc-2', stage).style.transform = 'rotate(4deg) rotateY(' + (px * 20) + 'deg) rotateX(' + (-py * 14) + 'deg) translateZ(30px)';
    });
    stage.addEventListener('pointerleave', function () { $('.gc-1', stage).style.transform = ''; $('.gc-2', stage).style.transform = ''; });
  }

  /* ---------- prices & builder ---------- */
  var tabs = $$('.p-tab'), panels = $$('.p-panel');
  var showCat = function (cat, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.cat === cat;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) { p.hidden = p.dataset.cat !== cat; });
  };
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showCat(t.dataset.cat); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault();
      showCat(tabs[(i + d + tabs.length) % tabs.length].dataset.cat, true);
    });
  });
  $$('[data-goto]').forEach(function (a) { a.addEventListener('click', function () { showCat(a.dataset.goto); }); });

  var items = $$('.mi'), note = $('#uzenet'), list = $('.note-list'), empty = $('.note-empty');
  var sumRow = $('.note-sum'), sumB = $('.note-sum b'), hint = $('.note-hint'), send = $('.note-send');
  var nameIn = $('.note-name input'), whens = $$('.note-when input'), mgo = $('.mbar-go span');
  var nameOf = function (b) {
    var n = $('.mi-n', b).cloneNode(true);
    $$('small,.pill', n).forEach(function (x) { x.remove(); });
    return n.textContent.trim().replace(/\s+/g, ' ');
  };
  var render = function () {
    var sel = items.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
    list.innerHTML = '';
    var total = 0, from = false, ask = false;
    sel.forEach(function (b) {
      total += +b.dataset.price || 0;
      if (b.dataset.from) from = true;
      if (b.dataset.ask) ask = true;
      var li = document.createElement('li');
      var n = document.createElement('span'); n.textContent = nameOf(b);
      var p = document.createElement('b'); p.textContent = $('.mi-p', b).textContent.trim();
      var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', nameOf(b) + ' törlése');
      x.addEventListener('click', function () { b.setAttribute('aria-pressed', 'false'); render(); });
      li.appendChild(n); li.appendChild(p); li.appendChild(x); list.appendChild(li);
    });
    empty.hidden = sel.length > 0;
    sumRow.hidden = !sel.length;
    sumB.textContent = (from || ask ? 'kb. ' : '') + ft(total);
    var h = [];
    if (from) h.push('A „-tól” árak a köröm állapotától függnek.');
    if (ask) h.push('Az UV-LED pilla árát Bogi megírja.');
    hint.textContent = h.join(' '); hint.hidden = !h.length;
    tabs.forEach(function (t) {
      var c = sel.filter(function (b) { return b.closest('.p-panel').dataset.cat === t.dataset.cat; }).length;
      var i = $('i', t); i.textContent = c || ''; i.classList.toggle('has', c > 0);
    });
    if (mgo) mgo.textContent = sel.length ? sel.length + ' kezelés · ' + sumB.textContent : 'Időpontot kérek';
    var L = ['Szia Bogi!', '', 'Ezekre szeretnék időpontot kérni:'];
    sel.forEach(function (b) { L.push('– ' + nameOf(b) + ' (' + $('.mi-p', b).textContent.trim() + ')'); });
    if (sel.length) L.push('', 'Összesen: ' + sumB.textContent.replace(/ /g, ' '));
    var w = whens.filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
    if (w.length) L.push('', 'Nekem ' + w.join(', ') + ' lenne jó.');
    var nm = nameIn.value.trim();
    L.push('', 'Köszönöm!'); if (nm) L.push(nm);
    send.href = 'mailto:bogibense@gmail.com?subject=' + encodeURIComponent('Időpontkérés' + (nm ? ' – ' + nm : '')) + '&body=' + encodeURIComponent(L.join('\n'));
    send.classList.toggle('is-off', !sel.length);
    send.setAttribute('aria-disabled', sel.length ? 'false' : 'true');
  };
  items.forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      render();
    });
  });
  whens.forEach(function (x) { x.addEventListener('change', render); });
  nameIn.addEventListener('input', render);
  send.addEventListener('click', function (e) { if (send.classList.contains('is-off')) e.preventDefault(); });

  /* mobile sheet */
  var bg = document.createElement('div'); bg.className = 'note-bg'; document.body.appendChild(bg);
  var last = null;
  var openSheet = function () { last = document.activeElement; note.classList.add('is-open'); bg.classList.add('is-on'); document.documentElement.style.overflow = 'hidden'; setTimeout(function () { $('.note-x').focus(); }, 60); };
  var closeSheet = function () { note.classList.remove('is-open'); bg.classList.remove('is-on'); document.documentElement.style.overflow = ''; if (last && last.focus) last.focus(); };
  $('.mbar-go').addEventListener('click', function () {
    var any = items.some(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
    if (any) openSheet(); else $('#arak').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  bg.addEventListener('click', closeSheet);
  $('.note-x').addEventListener('click', closeSheet);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && note.classList.contains('is-open')) closeSheet(); });
  desktop.addEventListener && desktop.addEventListener('change', function () { if (desktop.matches) closeSheet(); });
  render();

  /* ---------- lightbox ---------- */
  var lb = $('.lb'), lbImg = $('.lb img'), lbCap = $('.lb figcaption'), group = [], gi = 0, lbLast = null;
  var show = function () { var a = group[gi], im = $('img', a); lbImg.src = a.getAttribute('href'); lbImg.alt = im.alt; lbCap.textContent = a.dataset.cap || im.alt; };
  var openLb = function (set, i) { group = set; gi = i; lbLast = document.activeElement; show(); lb.hidden = false; document.documentElement.style.overflow = 'hidden'; $('.lb-x').focus(); };
  var closeLb = function () { lb.hidden = true; document.documentElement.style.overflow = ''; if (lbLast) lbLast.focus(); };
  ['.wi', '.cert'].forEach(function (sel) {
    var set = $$(sel);
    set.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); openLb(set, i); }); });
  });
  $('.lb-x').addEventListener('click', closeLb);
  $('.lb-prev').addEventListener('click', function () { gi = (gi - 1 + group.length) % group.length; show(); });
  $('.lb-next').addEventListener('click', function () { gi = (gi + 1) % group.length; show(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') $('.lb-prev').click();
    if (e.key === 'ArrowRight') $('.lb-next').click();
  });
})();
