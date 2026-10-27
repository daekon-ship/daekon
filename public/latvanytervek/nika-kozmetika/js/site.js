/* Nika Kozmetika – látványterv (DAEKON)
   Interakciók + Motion (motion.dev) animációk. Csökkentett mozgásnál minden azonnal látszik. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnim = !!M && !reduce && doc.classList.contains('anim');
  if (!canAnim) doc.classList.remove('anim');
  var ease = [0.22, 0.7, 0.2, 1];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // díszvonalak és jelölők kirajzolódásához
  if (canAnim) $$('.done__mark *').forEach(function (p) { p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); });

  /* ---------- fejléc, haladásjelző, mobil CTA ---------- */
  var hdr = $('#fejlec'), mcta = $('#mcta'), hero = $('#kezdolap'), book = $('#idopont'), ftr = $('.ftr');
  var bar = $('.progress span');
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('is-scrolled', y > 24);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar && !canAnim) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (mcta) {
      var vh = window.innerHeight;
      var past = hero.getBoundingClientRect().bottom < 90;
      var inBook = book.getBoundingClientRect().top < vh * 0.85 && book.getBoundingClientRect().bottom > 0;
      var inFtr = ftr.getBoundingClientRect().top < vh - 20;
      var drawerOpen = !$('#drawer').hidden;
      var on = past && !inBook && !inFtr && !drawerOpen;
      mcta.classList.toggle('is-on', on);
      mcta.setAttribute('aria-hidden', on ? 'false' : 'true');
      $$('a,button', mcta).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // aktív menüpont
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        if (id === 'ilcsi') id = 'kezelesek';
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(function (s) { io.observe(s); });
  }

  /* ---------- fókuszcsapda segéd ---------- */
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    var f = $$('a[href],button:not([disabled]),input,select,textarea', container).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function lock(on) { document.body.style.overflow = on ? 'hidden' : ''; }

  /* ---------- mobil menü ---------- */
  var burger = $('.burger'), menu = $('#menu');
  function openMenu() {
    menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Menü bezárása'); lock(true);
    if (canAnim) {
      M.animate(menu, { opacity: [0, 1] }, { duration: 0.35 });
      M.animate($$('nav a', menu), { opacity: [0, 1], y: [18, 0] }, { delay: M.stagger(0.05, { startDelay: 0.08 }), duration: 0.55, ease: ease });
      M.animate($('.menu__foot', menu), { opacity: [0, 1] }, { delay: 0.4, duration: 0.5 });
    }
    setTimeout(function () { var a = $('nav a', menu); a && a.focus(); }, 60);
  }
  function closeMenu(focusBurger) {
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menü megnyitása'); lock(false);
    if (canAnim) M.animate(menu, { opacity: 0 }, { duration: 0.25 }).then(function () { menu.hidden = true; menu.style.opacity = ''; });
    else menu.hidden = true;
    if (focusBurger) burger.focus();
  }
  burger.addEventListener('click', function () { menu.hidden ? openMenu() : closeMenu(true); });
  $$('nav a', menu).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
  menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); trap(menu, e); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1060 && !menu.hidden) closeMenu(false); });

  /* ---------- időpontkérő panel ---------- */
  var drawer = $('#drawer'), panel = $('.drawer__panel', drawer), form = $('#bookForm'), done = $('#done'), err = $('#formErr');
  var lastFocus = null;
  function openDrawer(topic) {
    if (!menu.hidden) closeMenu(false);
    lastFocus = document.activeElement;
    form.hidden = false; done.hidden = true; err.hidden = true;
    if (topic) {
      var sel = $('#tema');
      $$('option', sel).forEach(function (o) { if (o.textContent === topic) sel.value = o.value; });
    }
    drawer.hidden = false; lock(true); onScroll();
    if (canAnim) {
      M.animate($('.drawer__bg', drawer), { opacity: [0, 1] }, { duration: 0.4 });
      M.animate(panel, { x: ['100%', '0%'] }, { type: M.spring, stiffness: 160, damping: 22 });
      M.animate($$('.drawer__call, .form > *', drawer), { opacity: [0, 1], y: [12, 0] }, { delay: M.stagger(0.035, { startDelay: 0.2 }), duration: 0.45 });
    }
    setTimeout(function () { var x = $('input[name=nev]', form); x && x.focus({ preventScroll: true }); }, canAnim ? 320 : 30);
  }
  function closeDrawer() {
    var fin = function () { drawer.hidden = true; lock(false); onScroll(); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); };
    if (canAnim) {
      M.animate($('.drawer__bg', drawer), { opacity: 0 }, { duration: 0.3 });
      M.animate(panel, { x: '100%' }, { duration: 0.4, ease: [0.4, 0, 1, 1] }).then(fin);
    } else fin();
  }
  $$('[data-book]').forEach(function (b) { b.addEventListener('click', function () { openDrawer(b.getAttribute('data-book')); }); });
  $$('[data-close]', drawer).forEach(function (b) { b.addEventListener('click', closeDrawer); });
  drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); trap(panel, e); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form), bad = [];
    $$('.is-bad', form).forEach(function (x) { x.classList.remove('is-bad'); });
    var nev = (d.get('nev') || '').trim(), tel = (d.get('tel') || '').trim();
    if (!nev) { bad.push('a neved'); form.nev.classList.add('is-bad'); }
    if (tel.replace(/\D/g, '').length < 8) { bad.push('egy elérhető telefonszám'); form.tel.classList.add('is-bad'); }
    if (!form.ok.checked) { bad.push('az adatkezelési hozzájárulás'); form.ok.closest('.consent').classList.add('is-bad'); }
    if (bad.length) {
      err.textContent = 'Még hiányzik: ' + bad.join(', ') + '.';
      err.hidden = false;
      if (canAnim) M.animate(err, { x: [0, -6, 6, -3, 0] }, { duration: 0.4 });
      (form.querySelector('.is-bad input, input.is-bad') || form.nev).focus();
      return;
    }
    err.hidden = true;
    var lines = [
      'Kedves Nika Kozmetika!', '',
      'Időpontot szeretnék kérni.', '',
      'Név: ' + nev,
      'Telefon: ' + tel,
      d.get('email') ? 'E-mail: ' + d.get('email') : null,
      'Érdeklődés: ' + d.get('tema'),
      'Napszak: ' + d.get('napszak') + (d.get('nap') ? ' · nap: ' + d.get('nap') : ''),
      d.get('uzenet') ? '' : null,
      d.get('uzenet') ? 'Üzenet: ' + d.get('uzenet') : null,
      '', 'Köszönöm!'
    ].filter(function (l) { return l !== null; });
    var href = 'mailto:vanyoanyo2@gmail.com?subject=' + encodeURIComponent('Időpontkérés – ' + nev) + '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
    form.hidden = true; done.hidden = false;
    if (canAnim) {
      var mk = $$('.done__mark *', done);
      M.animate(mk, { strokeDashoffset: [1, 0] }, { duration: 0.8, delay: M.stagger(0.25) });
      M.animate($('.done__mark', done), { scale: [0.4, 1], rotate: [-30, 0] }, { type: M.spring, stiffness: 260, damping: 12 });
      M.animate($$('.done > *:not(svg)', done), { opacity: [0, 1], y: [10, 0] }, { delay: M.stagger(0.06, { startDelay: 0.3 }) });
    }
    $('.done .btn', done).focus({ preventScroll: true });
  });

  /* ---------- térkép (kattintásra töltődik) ---------- */
  $('#mapLoad').addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Szeged, Szabadkai út 9/C') + '&z=16&output=embed';
    f.title = 'Nika Kozmetika a térképen – 6725 Szeged, Szabadkai út 9/C';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    var map = $('.map'); map.appendChild(f); $('#mapPh').remove();
    if (canAnim) M.animate(f, { opacity: [0, 1] }, { duration: 0.6 });
  });

  /* ---------- jogi oldalak helye ---------- */
  var legal = $('#legal');
  $$('[data-legal]').forEach(function (b) {
    b.addEventListener('click', function () {
      $('#legalT').textContent = b.getAttribute('data-legal');
      if (legal.showModal) legal.showModal(); else alert('Ez az oldal élesítéskor készül el.');
    });
  });

  /* ================= MOTION (motion.dev) ================= */
  if (!canAnim) return;
  var animate = M.animate, scroll = M.scroll, stagger = M.stagger, spring = M.spring, mv = M.motionValue, frame = M.frame;
  // Motion 11: a visszahívás IntersectionObserverEntry-t kap, újabb verziók elemet – mindkettőt kezeljük
  var inView = function (sel, fn, opt) { return M.inView(sel, function (a, b) { return fn(a && a.target ? a.target : a, b); }, opt); };
  var SPR = { type: spring, stiffness: 170, damping: 18 };
  var SOFT = { type: spring, stiffness: 90, damping: 20 };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wide = window.matchMedia('(min-width: 900px)').matches;
  doc.classList.add('motion');

  // szöveg betűkre/szavakra bontása (szavak egyben maradnak a tördeléshez)
  function splitChars(el) {
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            part.split('').forEach(function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.appendChild(s); out.push(s); });
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return out;
  }
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map(function (w, i) { var s = document.createElement('span'); s.className = 'wd'; s.textContent = w; el.appendChild(s); if (i < words.length - 1) el.appendChild(document.createTextNode(' ')); return s; });
  }

  /* 1. Logó: monogram kirajzolódik, NIKA betűi rugóval érkeznek */
  $$('.mono path').forEach(function (p) { p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); });
  var hdrMono = $$('.hdr .mono path');
  animate(hdrMono, { strokeDashoffset: [1, 0] }, { duration: 1.4, delay: stagger(0.12, { startDelay: 0.1 }), ease: [0.6, 0, 0.2, 1] });
  $$('.logo__nika').forEach(function (n) {
    var ls = n.textContent.split(''); n.textContent = '';
    ls.forEach(function (c) { var s = document.createElement('span'); s.textContent = c; n.appendChild(s); });
  });
  animate('.hdr .logo__nika span', { opacity: [0, 1], y: [14, 0], rotateX: [70, 0] }, { delay: stagger(0.06, { startDelay: 0.35 }), type: spring, stiffness: 200, damping: 16 });
  animate('.hdr .logo__sub', { opacity: [0, 1], letterSpacing: ['1.2em', '.52em'] }, { duration: 1.2, delay: 0.6, ease: ease });
  animate('.nav a, .hdr__cta > *', { opacity: [0, 1], y: [-12, 0] }, { delay: stagger(0.05, { startDelay: 0.5 }), ...SPR });

  /* 2. Hero: betűnkénti, rugós, elmosódásból élesedő cím */
  $$('.h1 .ln').forEach(function (ln) { ln.style.overflow = 'visible'; });
  var chars = splitChars($('.h1'));
  $('.h1').style.perspective = '600px';
  chars.forEach(function (c) { c.style.opacity = '0'; });
  animate(chars, { opacity: [0, 1], y: [40, 0], rotateX: [-80, 0], filter: ['blur(8px)', 'blur(0px)'] },
    { delay: stagger(0.028, { startDelay: 0.3 }), type: spring, stiffness: 140, damping: 14 });
  var leadW = splitWords($('.hero .lead'));
  $('.hero .lead').style.opacity = '1';
  animate(leadW, { opacity: [0, 1], y: [10, 0], filter: ['blur(6px)', 'blur(0px)'] }, { delay: stagger(0.05, { startDelay: 1.1 }), duration: 0.6, ease: ease });
  animate('.hero__btns', { opacity: [0, 1] }, { duration: 0.01, delay: 1.3 });
  animate('.hero__btns .btn', { opacity: [0, 1], scale: [0.6, 1], y: [24, 0] }, { delay: stagger(0.12, { startDelay: 1.35 }), type: spring, stiffness: 220, damping: 14 });

  // lebegő foltok: lassú, végtelen mozgás + egérkövetés rugóval
  animate('.blob--1', { x: [0, -60, 30, 0], y: [0, 40, -30, 0], scale: [1, 1.12, 0.95, 1] }, { duration: 18, repeat: Infinity, ease: 'easeInOut' });
  animate('.blob--2', { x: [0, 50, -40, 0], y: [0, -30, 30, 0], scale: [1, 0.9, 1.1, 1] }, { duration: 14, repeat: Infinity, ease: 'easeInOut' });
  animate('.blob--3', { x: [0, 70, 20, 0], y: [0, -40, 20, 0] }, { duration: 20, repeat: Infinity, ease: 'easeInOut' });
  if (finePointer) {
    var bg = $('.hero__bg');
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      animate(bg, { x: dx * -50, y: dy * -36 }, SOFT);
    });
  }
  // hero görgetésre: tartalom lassan felúszik és elhalványul, a háttér lassabban mozog
  scroll(animate('.hero__text', { y: [0, -80], opacity: [1, 0.15] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
  scroll(animate('.hero__bg', { scale: [1, 1.15] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });

  /* 3. Mágneses gombok + rugós lenyomás */
  if (finePointer) {
    $$('[data-mag]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4 }, { type: spring, stiffness: 300, damping: 18 });
      });
      b.addEventListener('pointerleave', function () { animate(b, { x: 0, y: 0 }, { type: spring, stiffness: 260, damping: 12 }); });
    });
  }
  $$('.btn, .svc, .link').forEach(function (b) {
    b.addEventListener('pointerdown', function () { animate(b, { scale: 0.95 }, { type: spring, stiffness: 500, damping: 20 }); });
    ['pointerup', 'pointerleave'].forEach(function (ev) { b.addEventListener(ev, function () { animate(b, { scale: 1 }, { type: spring, stiffness: 400, damping: 12 }); }); });
  });

  /* 4. Egyéni kurzor: rugóval követő gyűrű, interaktív elemen kinyílik */
  if (finePointer) {
    doc.classList.add('has-cursor');
    var dot = $('.cursor__dot'), ring = $('.cursor__ring');
    window.addEventListener('pointermove', function (e) {
      animate(dot, { x: e.clientX, y: e.clientY }, { duration: 0 });
      animate(ring, { x: e.clientX, y: e.clientY }, { type: spring, stiffness: 350, damping: 28 });
    });
    $$('a, button, input, select, textarea, label').forEach(function (el) {
      el.addEventListener('pointerenter', function () { animate(ring, { scale: 1.8, backgroundColor: 'rgba(156,95,103,.08)' }, SPR); animate(dot, { scale: 0 }, SPR); });
      el.addEventListener('pointerleave', function () { animate(ring, { scale: 1, backgroundColor: 'rgba(156,95,103,0)' }, SPR); animate(dot, { scale: 1 }, SPR); });
    });
    document.addEventListener('pointerdown', function () { animate(ring, { scale: [null, 0.7, 1] }, { duration: 0.35 }); });
  }

  /* 5. Fejléc: lefelé görgetésre eltűnik, felfelé rugóval visszajön; haladásjelző rugós */
  var lastY = window.scrollY, hidden = false;
  var prog = mv(0);
  window.addEventListener('scroll', function () {
    var y = window.scrollY, down = y > lastY && y > 300;
    if (down !== hidden && Math.abs(y - lastY) > 4) { hidden = down; animate(hdr, { y: hidden ? -90 : 0 }, { type: spring, stiffness: 260, damping: 28 }); }
    lastY = y;
  }, { passive: true });
  scroll(function (p) { animate(bar, { scaleX: p }, { type: spring, stiffness: 200, damping: 30 }); });

  // horgony-linkek: Motion-nel animált görgetés
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      var to = t.getBoundingClientRect().top + window.scrollY - 70;
      animate(window.scrollY, to, { duration: 1.1, ease: [0.65, 0, 0.2, 1], onUpdate: function (v) { window.scrollTo(0, v); } });
    });
  });

  /* 6. Futószalag: végtelen sodródás, a görgetés sebessége gyorsítja és megdönti */
  var track = $('.band__track');
  if (track) {
    var bx = 0, vel = 0, prevY = window.scrollY, skew = mv(0);
    frame.update(function loop(data) {
      var y = window.scrollY, d = y - prevY; prevY = y;
      vel += (d - vel) * 0.1;
      var w = track.scrollWidth / 2;
      bx -= (0.6 + Math.abs(vel) * 0.25) * (data.delta / 16.67);
      if (-bx > w) bx += w;
      track.style.transform = 'translateX(' + bx + 'px) skewX(' + Math.max(-12, Math.min(12, -vel * 0.4)) + 'deg)';
    }, true);
    animate('.band', { opacity: [0, 1], scaleX: [0.9, 1] }, { delay: 1.5, ...SOFT });
  }

  /* 7. Szakaszcímek: betűnként rugóval, alulról */
  $$('.sec__h, .nature .h2, .book .h2').forEach(function (h) {
    var cs = splitChars(h); cs.forEach(function (c) { c.style.opacity = '0'; });
    h.removeAttribute('data-r'); h.style.opacity = '1';
    inView(h, function () {
      animate(cs, { opacity: [0, 1], y: [30, 0], rotate: [8, 0] }, { delay: stagger(0.03), type: spring, stiffness: 180, damping: 15 });
    }, { amount: 0.6 });
  });

  /* 8. Általános felúszás (ami még maradt data-r-rel) */
  inView('main > section:not(.hero)', function (sec) {
    var els = $$('[data-r]:not(li)', sec);
    animate(els, { opacity: [0, 1], y: [26, 0] }, { duration: 0.9, delay: stagger(0.08, { startDelay: 0.15 }), ease: ease });
  }, { amount: 0.12 });

  /* 9. Kezelések: sorok balról, kivágásból; követő kiemelés rugóval; görgetési vonal */
  var rows = $$('.svcs > li');
  inView('.svcs', function () {
    animate(rows, { opacity: [0, 1], x: [-60, 0], clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { delay: stagger(0.09), duration: 0.9, ease: [0.7, 0, 0.2, 1] });
    animate($$('.svc__n', $('.svcs')), { rotate: [-90, 0], scale: [0.4, 1] }, { delay: stagger(0.09, { startDelay: 0.3 }), type: spring, stiffness: 200, damping: 12 });
  }, { amount: 0.2 });
  var hl = $('.svcs__hl'), wrap = $('.svcs-wrap');
  if (finePointer && hl) {
    $$('.svc').forEach(function (b) {
      b.addEventListener('pointerenter', function () {
        var r = b.getBoundingClientRect(), w = wrap.getBoundingClientRect();
        animate(hl, { y: r.top - w.top, height: r.height, opacity: 1 }, { type: spring, stiffness: 320, damping: 30 });
        animate($('.svc__t', b), { x: 14 }, SPR);
        animate($('.svc__n', b), { rotate: -12, scale: 1.2 }, SPR);
      });
      b.addEventListener('pointerleave', function () {
        animate($('.svc__t', b), { x: 0 }, SPR);
        animate($('.svc__n', b), { rotate: 0, scale: 1 }, SPR);
      });
    });
    wrap.addEventListener('pointerleave', function () { animate(hl, { opacity: 0 }, { duration: 0.3 }); });
  }
  scroll(animate('.svcs__line span', { scaleY: [0, 1] }, { ease: 'linear' }), { target: $('.svcs'), offset: ['start 80%', 'end 50%'] });

  /* 10. Ilcsi-blokk: a sötét szakasz kitágul, a háttér-monogram kirajzolódik és forog, a szöveg szavanként világosodik */
  var nat = $('#ilcsi');
  scroll(animate(nat, { clipPath: ['inset(0 6% 0 6% round 40px)', 'inset(0 0% 0 0% round 0px)'] }, { ease: 'linear' }), { target: nat, offset: ['start end', 'start 35%'] });
  var nm = $$('.nature__mono path');
  nm.forEach(function (p) { p.setAttribute('stroke-dasharray', '1'); });
  scroll(animate(nm, { strokeDashoffset: [1, 0] }, { ease: 'linear' }), { target: nat, offset: ['start end', 'center center'] });
  scroll(animate('.nature__mono', { rotate: [-14, 10], scale: [0.85, 1.05] }, { ease: 'linear' }), { target: nat });
  var nw = splitWords($('.nature .body-l'));
  $('.nature .body-l').removeAttribute('data-r'); $('.nature .body-l').style.opacity = '1';
  nw.forEach(function (w, i) {
    scroll(animate(w, { opacity: [0.15, 1] }, { ease: 'linear' }), { target: nat, offset: ['start ' + (85 - i * 4) + '%', 'start ' + (55 - i * 4) + '%'] });
  });

  /* 11. Időpontkártya: rugós felbukkanás, 3D billenés és fényfolt az egér alatt */
  var card = $('.book__card'), glow = $('.book__glow');
  card.removeAttribute('data-r'); card.style.opacity = '0';
  inView(card, function () {
    animate(card, { opacity: [0, 1], scale: [0.88, 1], y: [60, 0] }, { type: spring, stiffness: 110, damping: 16 });
    animate($$('.book__text > *, .book__actions > *', card), { opacity: [0, 1], y: [20, 0] }, { delay: stagger(0.1, { startDelay: 0.25 }), ...SPR });
  }, { amount: 0.3 });
  if (finePointer) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      animate(card, { rotateY: (px - 0.5) * 10, rotateX: (0.5 - py) * 8 }, { type: spring, stiffness: 150, damping: 14 });
      animate(glow, { x: e.clientX - r.left, y: e.clientY - r.top, opacity: 1 }, { type: spring, stiffness: 250, damping: 25 });
    });
    card.addEventListener('pointerleave', function () {
      animate(card, { rotateY: 0, rotateX: 0 }, { type: spring, stiffness: 120, damping: 10 });
      animate(glow, { opacity: 0 }, { duration: 0.4 });
    });
  }

  /* 12. Kapcsolat: sorok lépcsőzetesen, térkép-tű rugós „leesése”, lüktető gyűrűk */
  inView('.dl', function (el) {
    animate($$('.dl > div', el), { opacity: [0, 1], x: [-30, 0] }, { delay: stagger(0.1), ...SPR });
  }, { amount: 0.3 });
  $$('.map__lines path').forEach(function (p) { p.setAttribute('pathLength', '1'); p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); });
  inView('.map', function () {
    animate('.map__lines path', { strokeDashoffset: [1, 0] }, { duration: 1.6, delay: stagger(0.12), ease: [0.6, 0, 0.2, 1] });
    animate('.map__pin', { y: [-160, 0], scale: [0.6, 1] }, { type: spring, stiffness: 300, damping: 9, delay: 0.5 });
    animate('.map__ring', { scale: [1, 2.6], opacity: [0.8, 0] }, { duration: 2.2, repeat: Infinity, delay: stagger(1.1, { startDelay: 1.1 }), ease: 'easeOut' });
    animate('.map__addr, .map__ph .btn', { opacity: [0, 1], y: [12, 0] }, { delay: stagger(0.1, { startDelay: 0.9 }), ...SPR });
  }, { amount: 0.3 });

  /* 13. Lábléc: monogram kirajzolódik, oszlopok rugóval érkeznek */
  inView('.ftr', function (f) {
    animate($$('.mono path', f), { strokeDashoffset: [1, 0] }, { duration: 1.6, delay: stagger(0.12), ease: [0.6, 0, 0.2, 1] });
    animate($$('.ftr__grid > *', f), { opacity: [0, 1], y: [30, 0] }, { delay: stagger(0.1), ...SPR });
  }, { amount: 0.2 });

  /* 14. Panelek: rugós választógombok */
  $$('.chips input').forEach(function (r) {
    r.addEventListener('change', function () { animate(r.nextElementSibling, { scale: [0.85, 1.08, 1] }, { duration: 0.45 }); });
  });
})();
