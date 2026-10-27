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
  function lock(on) { doc.classList.toggle('locked', !!on); }

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
    if (canAnim) { M.animate(menu, { opacity: 0 }, { duration: 0.22 }); setTimeout(function () { menu.hidden = true; menu.style.opacity = ''; }, 240); }
    else menu.hidden = true;
    if (focusBurger) burger.focus();
  }
  burger.addEventListener('click', function () { menu.hidden ? openMenu() : closeMenu(true); });
  $$('nav a', menu).forEach(function (a) { a.addEventListener('click', function () { closeMenu(false); }); });
  menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); trap(menu, e); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1060 && !menu.hidden) closeMenu(false); });

  /* ---------- időpontkérő panel ---------- */
  var drawer = $('#drawer'), panel = $('.drawer__panel', drawer), form = $('#bookForm'), done = $('#done');
  var lastFocus = null;

  // magyar napválasztó: a következő 14 nap + „Mindegy” (JS nélkül sima dátummező marad)
  (function buildDays() {
    var row = $('#days'); if (!row) return;
    var NAP = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];
    var NAPH = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
    var HO = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];
    var HOH = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
    row.innerHTML = '';
    function add(value, inner, label, cls, checked) {
      var l = document.createElement('label');
      l.innerHTML = '<input type="radio" name="nap" value="' + value + '"' + (checked ? ' checked' : '') + ' aria-label="' + label + '"><span class="day ' + (cls || '') + '">' + inner + '</span>';
      row.appendChild(l);
    }
    add('', 'Mindegy', 'Bármelyik nap', 'day--any', true);
    var d = new Date(); d.setHours(12, 0, 0, 0);
    for (var i = 1; i <= 14; i++) {
      var x = new Date(d.getTime() + i * 864e5);
      var val = x.getFullYear() + '. ' + HOH[x.getMonth()] + ' ' + x.getDate() + '. (' + NAPH[x.getDay()] + ')';
      add(val, '<small>' + NAP[x.getDay()] + '</small><b>' + x.getDate() + '</b><i>' + HO[x.getMonth()] + '</i>', val, '', false);
    }
  })();

  function setErr(input, msg, errId) {
    var el = $('#' + errId);
    if (el) el.textContent = msg || '';
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate(showAll) {
    var ok = true, first = null;
    var nev = form.nev.value.trim(), tel = form.tel.value.trim(), em = form.email.value.trim();
    var nevMsg = nev.length < 2 ? 'Add meg a neved.' : '';
    var digits = tel.replace(/\D/g, '');
    var telMsg = !tel ? 'Add meg a telefonszámod.' : (!/^[+\d][\d\s()\/-]{6,}$/.test(tel) || digits.length < 8 || digits.length > 13) ? 'Ellenőrizd a telefonszámot (pl. +36 30 123 4567).' : '';
    var emMsg = em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) ? 'Ez nem tűnik érvényes e-mail-címnek.' : '';
    var okMsg = !form.ok.checked ? 'Az e-mail elküldéséhez fogadd el az adatkezelési tájékoztatót.' : '';
    [[form.nev, nevMsg, 'e-nev'], [form.tel, telMsg, 'e-tel'], [form.email, emMsg, 'e-email'], [form.ok, okMsg, 'e-ok']].forEach(function (f) {
      if (showAll || f[0].dataset.touched) setErr(f[0], f[1], f[2]);
      if (f[1]) { ok = false; first = first || f[0]; }
    });
    form.ok.closest('.consent').toggleAttribute('data-bad', !!okMsg && !!(showAll || form.ok.dataset.touched));
    return { ok: ok, first: first };
  }
  ['nev', 'tel', 'email'].forEach(function (n) {
    form[n].addEventListener('blur', function () { form[n].dataset.touched = '1'; validate(false); });
    form[n].addEventListener('input', function () { if (form[n].getAttribute('aria-invalid') === 'true') validate(false); });
  });
  form.ok.addEventListener('change', function () { form.ok.dataset.touched = '1'; validate(false); });

  function openDrawer(topic) {
    if (!menu.hidden) closeMenu(false);
    if (drawer.dataset.closing) return;
    lastFocus = document.activeElement;
    form.hidden = false; done.hidden = true;
    var sel = $('#tema');
    if (topic) $$('option', sel).forEach(function (o) { if (o.textContent === topic) sel.value = o.value; });
    else sel.selectedIndex = 0;
    drawer.hidden = false; lock(true); onScroll();
    panel.scrollTop = 0;
    if (canAnim) {
      M.animate($('.drawer__bg', drawer), { opacity: [0, 1] }, { duration: 0.3 });
      M.animate(panel, { x: ['100%', '0%'] }, { type: M.spring, stiffness: 220, damping: 28 });
      M.animate($$('.drawer__call, .form > *', drawer), { opacity: [0, 1], y: [10, 0] }, { delay: M.stagger(0.025, { startDelay: 0.12 }), duration: 0.35 });
      if (topic) M.animate(sel, { backgroundColor: ['#F2DCDA', '#FFFBF9'] }, { duration: 1.2, delay: 0.35 });
    }
    setTimeout(function () { form.nev.focus({ preventScroll: true }); }, canAnim ? 260 : 30);
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    if (drawer.dataset.closing) return;
    drawer.dataset.closing = '1';
    var finished = false;
    var fin = function () {
      if (finished) return; finished = true;
      delete drawer.dataset.closing;
      drawer.hidden = true; lock(false); onScroll();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (canAnim) {
      M.animate($('.drawer__bg', drawer), { opacity: 0 }, { duration: 0.25 });
      M.animate(panel, { x: '100%' }, { duration: 0.28, ease: [0.4, 0, 1, 1] });
      setTimeout(fin, 300);
    } else fin();
  }
  $$('[data-book]').forEach(function (b) { b.addEventListener('click', function () { openDrawer(b.getAttribute('data-book')); }); });
  $$('[data-close]', drawer).forEach(function (b) { b.addEventListener('click', closeDrawer); });
  drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); } trap(panel, e); });
  $('#doneBack').addEventListener('click', function () { done.hidden = true; form.hidden = false; form.nev.focus(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = validate(true);
    if (!v.ok) {
      if (canAnim) M.animate(v.first.closest('.fld, .consent') || v.first, { x: [0, -6, 6, -3, 0] }, { duration: 0.35 });
      v.first.focus();
      return;
    }
    var d = new FormData(form);
    var lines = [
      'Kedves Nika Kozmetika!', '',
      'Időpontot szeretnék kérni.', '',
      'Név: ' + form.nev.value.trim(),
      'Telefon: ' + form.tel.value.trim(),
      form.email.value.trim() ? 'E-mail: ' + form.email.value.trim() : null,
      'Kezelés: ' + d.get('tema'),
      'Napszak: ' + d.get('napszak'),
      'Nap: ' + (d.get('nap') || 'mindegy'),
      d.get('uzenet') ? '' : null,
      d.get('uzenet') ? 'Üzenet: ' + d.get('uzenet') : null,
      '', 'Köszönöm!'
    ].filter(function (l) { return l !== null; });
    var href = 'mailto:vanyoanyo2@gmail.com?subject=' + encodeURIComponent('Időpontkérés – ' + form.nev.value.trim()) + '&body=' + encodeURIComponent(lines.join('\n'));
    window.__lastMailto = href;
    window.location.href = href;
    form.hidden = true; done.hidden = false;
    if (canAnim) {
      var mk = $$('.done__mark *', done);
      M.animate(mk, { strokeDashoffset: [1, 0] }, { duration: 0.7, delay: M.stagger(0.2) });
      M.animate($$('.done > *:not(svg)', done), { opacity: [0, 1], y: [8, 0] }, { delay: M.stagger(0.05, { startDelay: 0.25 }) });
    }
    done.focus({ preventScroll: true });
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
  var animate = M.animate, scroll = M.scroll, stagger = M.stagger, spring = M.spring;
  // Motion 11: a visszahívás IntersectionObserverEntry-t kap, újabb verziók elemet – mindkettőt kezeljük
  var inView = function (sel, fn, opt) { return M.inView(sel, function (a, b) { return fn(a && a.target ? a.target : a, b); }, opt); };
  var SPR = { type: spring, stiffness: 200, damping: 22 };
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wide = window.matchMedia('(min-width: 900px)').matches;
  var small = !wide;
  doc.classList.add('motion');

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

  /* 1. Logó: a monogram kirajzolódik, a betűk finoman érkeznek */
  $$('.mono path').forEach(function (p) { p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); });
  animate($$('.hdr .mono path'), { strokeDashoffset: [1, 0] }, { duration: 1.1, delay: stagger(0.1, { startDelay: 0.1 }), ease: [0.6, 0, 0.2, 1] });
  $$('.logo__nika').forEach(function (n) { var ls = n.textContent.split(''); n.textContent = ''; ls.forEach(function (c) { var s = document.createElement('span'); s.textContent = c; n.appendChild(s); }); });
  animate('.hdr .logo__nika span', { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.05, { startDelay: 0.25 }), ...SPR });
  if (wide) animate('.nav a, .hdr__cta > *', { opacity: [0, 1], y: [-8, 0] }, { delay: stagger(0.04, { startDelay: 0.35 }), ...SPR });

  /* 2. Hero: cím betűnként (desktop) / soronként (mobil), majd szöveg és gombok – minden kb. 1,3 s alatt kész */
  $$('.h1 .ln').forEach(function (ln) { ln.style.overflow = 'visible'; });
  if (wide) {
    var chars = splitChars($('.h1'));
    chars.forEach(function (c) { c.style.opacity = '0'; });
    animate(chars, { opacity: [0, 1], y: [24, 0], filter: ['blur(6px)', 'blur(0px)'] }, { delay: stagger(0.018, { startDelay: 0.2 }), type: spring, stiffness: 180, damping: 18 });
  } else {
    animate('.h1 .ln > span', { opacity: [0, 1], y: [18, 0] }, { delay: stagger(0.1, { startDelay: 0.15 }), duration: 0.6, ease: ease });
  }
  animate('.hero [data-h]', { opacity: [0, 1], y: [14, 0] }, { delay: stagger(0.08, { startDelay: wide ? 0.6 : 0.35 }), duration: 0.6, ease: ease });

  animate('.blob--1', { x: [0, -40, 20, 0], y: [0, 30, -20, 0] }, { duration: 20, repeat: Infinity, ease: 'easeInOut' });
  animate('.blob--3', { x: [0, 40, 0], y: [0, -24, 0] }, { duration: 22, repeat: Infinity, ease: 'easeInOut' });

  /* 3. Gombok: mágneses (egérrel), rugós lenyomás */
  if (finePointer) {
    $$('[data-mag]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        animate(b, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.25 }, { type: spring, stiffness: 300, damping: 20 });
      });
      b.addEventListener('pointerleave', function () { animate(b, { x: 0, y: 0 }, { type: spring, stiffness: 260, damping: 16 }); });
    });
  }
  $$('.btn, .svc').forEach(function (b) {
    b.addEventListener('pointerdown', function () { animate(b, { scale: 0.97 }, { type: spring, stiffness: 500, damping: 24 }); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { animate(b, { scale: 1 }, { type: spring, stiffness: 400, damping: 16 }); }); });
  });

  /* 4. Egyéni kurzor – csak egérrel; sosem takar el semmit (pointer-events: none) */
  if (finePointer) {
    doc.classList.add('has-cursor');
    var dot = $('.cursor__dot'), ring = $('.cursor__ring');
    window.addEventListener('pointermove', function (e) {
      animate(dot, { x: e.clientX, y: e.clientY }, { duration: 0 });
      animate(ring, { x: e.clientX, y: e.clientY }, { type: spring, stiffness: 400, damping: 30 });
    });
    $$('a, button, input, select, textarea, label').forEach(function (el) {
      el.addEventListener('pointerenter', function () { animate(ring, { scale: 1.6 }, SPR); });
      el.addEventListener('pointerleave', function () { animate(ring, { scale: 1 }, SPR); });
    });
  }

  /* 5. Fejléc: lefelé görgetésre elrejtőzik, felfelé visszajön; haladásjelző */
  var lastY = window.scrollY, hidden = false, autoScroll = false;
  window.addEventListener('scroll', function () {
    var y = window.scrollY, down = y > lastY && y > 400;
    if (doc.classList.contains('locked') || autoScroll) { lastY = y; return; }
    if (down !== hidden && Math.abs(y - lastY) > 6) { hidden = down; animate(hdr, { y: hidden ? -90 : 0 }, { type: spring, stiffness: 280, damping: 30 }); }
    lastY = y;
  }, { passive: true });
  scroll(function (p) { bar.style.transform = 'scaleX(' + p + ')'; });

  // horgonylinkek: sima görgetés (a fejlécet visszahozza)
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      var to = Math.max(0, t.getBoundingClientRect().top + window.scrollY - 76);
      autoScroll = true; hidden = false; animate(hdr, { y: 0 }, SPR);
      animate(window.scrollY, to, { duration: 0.9, ease: [0.65, 0, 0.2, 1], onUpdate: function (v) { window.scrollTo(0, v); } })
        .then(function () { setTimeout(function () { autoScroll = false; lastY = window.scrollY; }, 80); });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* 6. Szakaszcímek: betűnként (desktop), egyben (mobil) */
  $$('.sec__h, .nature .h2, .book .h2').forEach(function (h) {
    h.removeAttribute('data-r');
    if (small) { h.style.opacity = '0'; inView(h, function () { animate(h, { opacity: [0, 1], y: [16, 0] }, { duration: 0.6, ease: ease }); }, { amount: 0.5 }); return; }
    var cs = splitChars(h); cs.forEach(function (c) { c.style.opacity = '0'; });
    inView(h, function () { animate(cs, { opacity: [0, 1], y: [20, 0] }, { delay: stagger(0.02), ...SPR }); }, { amount: 0.6 });
  });

  /* 7. Általános felúszás */
  inView('main > section:not(.hero)', function (sec) {
    var els = $$('[data-r]:not(li)', sec);
    animate(els, { opacity: [0, 1], y: [18, 0] }, { duration: 0.6, delay: stagger(0.06, { startDelay: 0.1 }), ease: ease });
  }, { amount: 0.1 });

  /* 8. Kezelések: sorok lépcsőzetesen; követő kiemelés (egérrel); görgetési vonal */
  var rows = $$('.svcs > li');
  inView('.svcs', function () {
    animate(rows, { opacity: [0, 1], x: [small ? 0 : -30, 0], y: [small ? 10 : 0, 0] }, { delay: stagger(0.06), duration: 0.6, ease: ease });
  }, { amount: 0.15 });
  var hl = $('.svcs__hl'), wrap = $('.svcs-wrap');
  if (finePointer && hl) {
    $$('.svc').forEach(function (b) {
      b.addEventListener('pointerenter', function () {
        var r = b.getBoundingClientRect(), w = wrap.getBoundingClientRect();
        animate(hl, { y: r.top - w.top, height: r.height, opacity: 1 }, { type: spring, stiffness: 340, damping: 32 });
        animate($('.svc__t', b), { x: 10 }, SPR);
      });
      b.addEventListener('pointerleave', function () { animate($('.svc__t', b), { x: 0 }, SPR); });
    });
    wrap.addEventListener('pointerleave', function () { animate(hl, { opacity: 0 }, { duration: 0.25 }); });
  }
  scroll(animate('.svcs__line span', { scaleY: [0, 1] }, { ease: 'linear' }), { target: $('.svcs'), offset: ['start 80%', 'end 50%'] });

  /* 9. Ilcsi-blokk: finom kitágulás (desktop), a háttér-monogram kirajzolódik */
  var nat = $('#ilcsi');
  if (wide) scroll(animate(nat, { clipPath: ['inset(0 4% 0 4% round 32px)', 'inset(0 0% 0 0% round 0px)'] }, { ease: 'linear' }), { target: nat, offset: ['start end', 'start 40%'] });
  var nm = $$('.nature__mono path');
  nm.forEach(function (p) { p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); });
  inView(nat, function () { animate(nm, { strokeDashoffset: [1, 0] }, { duration: 1.8, delay: stagger(0.2), ease: [0.6, 0, 0.2, 1] }); }, { amount: 0.3 });

  /* 10. Időpontkártya: felbukkanás, lépések egymás után; 3D billenés (egérrel) */
  var card = $('.book__card'), glow = $('.book__glow');
  card.removeAttribute('data-r'); card.style.opacity = '0';
  inView(card, function () {
    animate(card, { opacity: [0, 1], y: [30, 0], scale: [0.97, 1] }, { duration: 0.7, ease: ease });
    animate($$('.steps li', card), { opacity: [0, 1], y: [14, 0] }, { delay: stagger(0.12, { startDelay: 0.3 }), duration: 0.5, ease: ease });
    animate($$('.book__actions > *', card), { opacity: [0, 1], y: [12, 0] }, { delay: stagger(0.1, { startDelay: 0.5 }), ...SPR });
  }, { amount: 0.25 });
  if (finePointer) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      animate(card, { rotateY: (px - 0.5) * 5, rotateX: (0.5 - py) * 4 }, { type: spring, stiffness: 160, damping: 18 });
      animate(glow, { x: e.clientX - r.left, y: e.clientY - r.top, opacity: 1 }, { type: spring, stiffness: 250, damping: 26 });
    });
    card.addEventListener('pointerleave', function () {
      animate(card, { rotateY: 0, rotateX: 0 }, { type: spring, stiffness: 140, damping: 14 });
      animate(glow, { opacity: 0 }, { duration: 0.3 });
    });
  }

  /* 11. Kapcsolat: sorok; térkép-vonalak kirajzolódnak, a tű rugóval érkezik */
  inView('.dl', function (el) { animate($$('.dl > div', el), { opacity: [0, 1], x: [-16, 0] }, { delay: stagger(0.08), duration: 0.5, ease: ease }); }, { amount: 0.3 });
  $$('.map__lines path').forEach(function (p) { p.setAttribute('pathLength', '1'); p.setAttribute('stroke-dasharray', '1'); p.setAttribute('stroke-dashoffset', '1'); });
  inView('.map', function () {
    animate('.map__lines path', { strokeDashoffset: [1, 0] }, { duration: 1.3, delay: stagger(0.1), ease: [0.6, 0, 0.2, 1] });
    animate('.map__pin', { y: [-60, 0], opacity: [0, 1] }, { type: spring, stiffness: 300, damping: 14, delay: 0.3 });
    animate('.map__ring', { scale: [1, 2.4], opacity: [0.7, 0] }, { duration: 2.4, repeat: Infinity, delay: stagger(1.2, { startDelay: 0.8 }), ease: 'easeOut' });
  }, { amount: 0.3 });

  /* 12. Lábléc: monogram kirajzolódik */
  inView('.ftr', function (f) { animate($$('.mono path', f), { strokeDashoffset: [1, 0] }, { duration: 1.3, delay: stagger(0.1), ease: [0.6, 0, 0.2, 1] }); }, { amount: 0.2 });

  /* 13. Panel apróságai */
  $$('.chips input, .days__row input').forEach(function (r) {
    r.addEventListener('change', function () { animate(r.nextElementSibling, { scale: [0.92, 1.04, 1] }, { duration: 0.35 }); });
  });
})();
