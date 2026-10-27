/* Mókusch – prémium látványterv v2 (DAEKON)
   Interakciók + Motion (motion.dev) animációk. Csökkentett mozgásnál minden azonnal látszik.
   FONTOS: minden űrlap bemutató jellegű – semmi nem kerül elküldésre. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnim = !!M && doc.classList.contains('anim');
  var soft = doc.classList.contains('anim-soft');
  if (!canAnim) doc.classList.remove('anim');
  var ease = [0.22, 0.7, 0.2, 1];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = (function () { try { var k = '__t'; sessionStorage.setItem(k, k); sessionStorage.removeItem(k); return sessionStorage; } catch (e) { return null; } })();

  /* ---------------- fejléc ---------------- */
  var hdr = $('#fejlec');
  function onScroll() { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 16); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- fejezet-menü (lap) ---------------- */
  var sheet = $('#menu');
  var opener = $('.hdr .menu-btn');
  var lastFocus = null;
  function openMenu() {
    lastFocus = document.activeElement;
    sheet.hidden = false; sheet.classList.add('is-open');
    opener.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var panel = $('.sheet__panel', sheet);
    if (canAnim) {
      M.animate(panel, { x: ['100%', '0%'] }, { duration: 0.45, ease: ease });
      M.animate($('.sheet__bg', sheet), { opacity: [0, 1] }, { duration: 0.3 });
      M.animate($$('.toc li', sheet), { opacity: [0, 1], x: [16, 0] }, { delay: M.stagger(0.035, { startDelay: 0.15 }), duration: 0.4, ease: ease });
    }
    var first = $('[data-close].menu-btn', sheet); if (first) first.focus();
  }
  function closeMenu() {
    sheet.classList.remove('is-open'); sheet.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  if (sheet && opener) {
    opener.addEventListener('click', openMenu);
    $$('[data-close]', sheet).forEach(function (b) { b.addEventListener('click', closeMenu); });
    $$('.sheet__panel a', sheet).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('href').indexOf('#') > -1) closeMenu(); }); });
    sheet.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a,button', $('.sheet__panel', sheet)).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }

  /* ---------------- animációk ---------------- */
  if (canAnim) {
    // nyitócím: soronként, lassan
    var lines = $$('.hero h1 .ln');
    if (lines.length) M.animate(lines, { opacity: [0, 1], y: ['0.45em', '0em'] }, { delay: M.stagger(0.18, { startDelay: 0.15 }), duration: 1.1, ease: ease });

    // rajzolt páfrányok: a vonal „kirajzolódik”
    $$('.sprig').forEach(function (svg) {
      var paths = $$('path,circle', svg);
      paths.forEach(function (p) { p.setAttribute('pathLength', '1'); });
      M.inView(svg, function () {
        M.animate(paths, { strokeDashoffset: [1, 0] }, { delay: M.stagger(0.07), duration: 1.6, ease: 'easeOut' });
      }, { amount: 0.2 });
    });

    // görgetésre megjelenő elemek
    $$('[data-rv]').forEach(function (el) {
      M.inView(el, function () {
        var sibs = el.parentElement ? $$(':scope > [data-rv]', el.parentElement) : [el];
        var i = Math.max(0, sibs.indexOf(el));
        var isFade = el.getAttribute('data-rv') === 'fade';
        M.animate(el, isFade ? { opacity: [0, 1] } : { opacity: [0, 1], y: [18, 0] }, { duration: isFade ? 1.1 : 0.8, delay: Math.min(i, 5) * 0.08, ease: ease });
      }, { amount: 0.15, margin: '0px 0px -6% 0px' });
    });

    // finom képparallax
    if (!soft) {
    $$('[data-px]').forEach(function (px) {
      var target = px.closest('.pic, .plate') || px;
      M.scroll(M.animate(px, { y: ['-4%', '4%'] }, { ease: 'linear' }), { target: target, offset: ['start end', 'end start'] });
    });

    }
    // tortagaléria: a középső lap emelkedik ki először, a két szélső utána csúszik be
    var cakes = $('[data-cakes]');
    if (cakes) {
      var cp = Array.prototype.slice.call(cakes.children);
      M.inView(cakes, function () {
        var order = [1, 0, 2], fromX = [-36, 0, 36];
        order.forEach(function (k, i) {
          var el = cp[k]; if (!el) return;
          M.animate(el, { opacity: [0, 1], y: [k === 1 ? 50 : 30, 0], x: [fromX[k], 0] }, { duration: 1.2, delay: 0.15 * i, ease: ease });
        });
      }, { amount: 0.25 });
    }


    // képfeltárás: a kép alulról felfelé „kinyílik”, közben finoman kicsinyedik
    $$('[data-reveal]').forEach(function (el) {
      M.inView(el, function () {
        M.animate(el, { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, { duration: 1.3, ease: [0.7, 0, 0.2, 1] });
        var im = el.querySelector('img');
        if (im) M.animate(im, { scale: [1.18, 1] }, { duration: 1.8, ease: ease });
      }, { amount: 0.2 });
    });

    // lassú „Ken Burns” nagyítás a nyitó- és a tortaképen
    if (!soft) {
    $$('[data-kb] img').forEach(function (im) {
      M.animate(im, { scale: [1.04, 1.14] }, { duration: 22, ease: 'linear', repeat: Infinity, repeatType: 'reverse' });
    });
    }

    // futó kézírásos szalag
    // a futó szalagot a motion-fx.js mozgatja (görgetési sebességre gyorsul)

    // felhőszegélyek: görgetésre alig érezhetően elsodródnak
    if (!soft) {
    $$('.cloud--top, .cloud--bot').forEach(function (c, i) {
      M.scroll(M.animate(c.querySelector('path'), { x: [i % 2 ? -18 : 18, i % 2 ? 18 : -18] }, { ease: 'linear' }), { target: c.parentElement, offset: ['start end', 'end start'] });
    });
    }

    // a pecsét görgetésre lassan körbefordul
    if (!soft) {
    var seal = $('[data-seal] img');
    if (seal) M.scroll(M.animate(seal, { rotate: [0, 120] }, { ease: 'linear' }), { target: $('.hero'), offset: ['start start', 'end start'] });
    }
  }

  /* ---------------- animáció-kapcsoló a láblécben ---------------- */
  $$('[data-motion-toggle]').forEach(function (t) {
    var cur = doc.classList.contains('anim-full') ? 'teljes' : doc.classList.contains('anim-soft') ? 'visszafogott' : 'kikapcsolva';
    t.textContent = 'Animációk: ' + cur + ' (váltás)';
    t.addEventListener('click', function () {
      var next = cur === 'teljes' ? 'off' : 'full';
      if (cur === 'visszafogott') next = 'full';
      if (cur === 'kikapcsolva') next = 'full';
      try { localStorage.setItem('mokusch-motion', next); } catch (e) {}
      location.reload();
    });
  });

  /* ---------------- felső sáv: ma nyitva? (Wix-nyitvatartás alapján, egyeztetendő) ---------------- */
  var openTxt = $('[data-open-text]'), openDot = $('[data-open-dot]');
  if (openTxt) {
    var H = { 0: [9, 13], 6: [9, 16] }; // vasárnap, szombat; hétköznap 7:30–18
    var now = new Date(), wd = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    var r = H[wd] || [7.5, 18];
    var fmt = function (x) { return Math.floor(x) + ':' + (x % 1 ? '30' : '00'); };
    var isOpen = h >= r[0] && h < r[1];
    openTxt.textContent = isOpen ? 'Most nyitva · ma ' + fmt(r[0]) + '–' + fmt(r[1]) : 'Most zárva · ma ' + fmt(r[0]) + '–' + fmt(r[1]);
    if (openDot) openDot.classList.toggle('is-closed', !isOpen);
  }

  /* ---------------- mobil lebegő tortagomb ---------------- */
  var fl = $('[data-float]');
  if (fl && 'IntersectionObserver' in window) {
    document.body.classList.add('has-float');
    var heroEl = $('.hero') || $('.sub-hero');
    var blockers = $$('.finale, .ftr, .cake-cta, .ribbon, .wiz');
    var seen = new Set(), pastHero = false;
    var upd = function () { fl.classList.toggle('is-on', pastHero && seen.size === 0); };
    if (heroEl) new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; upd(); }, { threshold: 0 }).observe(heroEl);
    var bo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); }); upd(); }, { threshold: 0 });
    blockers.forEach(function (b) { bo.observe(b); });
  }

  /* ---------------- képek szűrése (Képek aloldal) ---------------- */
  var gal = $('[data-gallery]');
  if (gal) {
    var chips = $$('[data-filter]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var f = c.getAttribute('data-filter');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        $$('[data-cat]', gal).forEach(function (it) {
          var show = f === 'mind' || it.getAttribute('data-cat') === f;
          it.hidden = !show;
          if (show) { it.style.opacity = ''; it.style.transform = ''; if (canAnim) M.animate(it, { opacity: [0, 1] }, { duration: 0.5 }); }
        });
      });
    });
  }

  /* ---------------- segédek űrlapokhoz ---------------- */
  function todayISO(addDays) {
    var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (addDays || 0));
    return d.toISOString().slice(0, 10);
  }
  function setErr(input, on) {
    if (!input) return;
    input.setAttribute('aria-invalid', on ? 'true' : 'false');
    var e = input.id ? document.getElementById(input.id + '-e') : null;
    if (e) { e.classList.toggle('is-on', on); if (on) input.setAttribute('aria-describedby', e.id); }
  }
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };

  // referenciakép-előnézet (csak böngészőben, nincs feltöltés)
  function initDrop(drop) {
    var input = $('input[type=file]', drop);
    var wrap = drop.parentElement;
    var list = $('[data-thumbs]', wrap);
    var err = $('[data-file-err]', wrap);
    var max = parseInt(input.getAttribute('data-files') || '3', 10);
    var files = [];
    function render() {
      list.innerHTML = '';
      files.forEach(function (f, i) {
        var li = document.createElement('li');
        var im = document.createElement('img'); im.alt = 'Referenciakép: ' + f.name; im.src = URL.createObjectURL(f);
        var b = document.createElement('button'); b.type = 'button'; b.textContent = '×'; b.setAttribute('aria-label', f.name + ' eltávolítása');
        b.addEventListener('click', function () { files.splice(i, 1); render(); });
        var s = document.createElement('span'); s.textContent = f.name;
        li.appendChild(im); li.appendChild(b); li.appendChild(s); list.appendChild(li);
      });
      wrap.dataset.count = files.length;
    }
    function add(fl) {
      var msg = '';
      Array.prototype.forEach.call(fl, function (f) {
        if (!/^image\//.test(f.type)) { msg = 'Csak képfájlt lehet csatolni.'; return; }
        if (f.size > 8 * 1024 * 1024) { msg = 'Egy kép legfeljebb 8 MB lehet.'; return; }
        if (files.length >= max) { msg = 'Legfeljebb ' + max + ' képet csatolhatsz.'; return; }
        files.push(f);
      });
      err.textContent = msg; err.classList.toggle('is-on', !!msg);
      render(); input.value = '';
    }
    input.addEventListener('change', function () { add(input.files); });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer) add(e.dataTransfer.files); });
    drop.getFiles = function () { return files; };
  }
  $$('[data-drop]').forEach(initDrop);

  /* ---------------- egyszerű bemutató-űrlapok ---------------- */
  var params = new URLSearchParams(location.search);
  $$('[data-demo-form]').forEach(function (form) {
    var targy = $('#u-targy', form);
    if (targy && params.get('targy')) { var o = $('option[value="' + params.get('targy') + '"]', targy); if (o) targy.value = o.value; }
    $$('input[type=date]', form).forEach(function (d) { d.min = todayISO(0); });

    // asztalfoglalás: időpontok a nyitvatartásból (egyeztetendő)
    if (form.hasAttribute('data-booking')) {
      var nap = $('#a-nap', form), ido = $('#a-ido', form);
      var fill = function () {
        ido.innerHTML = '';
        if (!nap.value) { ido.innerHTML = '<option value="">Előbb válassz napot</option>'; return; }
        var wd = new Date(nap.value + 'T12:00:00').getDay();
        var range = wd === 0 ? [9, 12] : wd === 6 ? [9, 15] : [7.5, 17];
        var first = document.createElement('option'); first.value = ''; first.textContent = 'Válassz időpontot'; ido.appendChild(first);
        for (var t = range[0]; t <= range[1]; t += 0.5) {
          var h = Math.floor(t), m = t % 1 ? '30' : '00';
          var op = document.createElement('option'); op.textContent = h + ':' + m; ido.appendChild(op);
        }
      };
      nap.addEventListener('change', fill);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('[required]', form).forEach(function (inp) {
        var v = (inp.value || '').trim();
        var ok = inp.type === 'checkbox' ? inp.checked : v !== '';
        if (ok && inp.type === 'email') ok = emailOk(v);
        if (ok && inp.type === 'date') ok = v >= todayISO(0);
        if (inp.type === 'checkbox') { var ce = $('[data-consent-err]', form); if (ce) ce.classList.toggle('is-on', !ok); }
        else setErr(inp, !ok);
        if (!ok && !bad) bad = inp;
      });
      if (bad) { bad.focus(); return; }
      var done = form.nextElementSibling;
      form.hidden = true;
      if (done && done.classList.contains('done')) {
        done.classList.add('is-on'); done.focus();
        if (canAnim) M.animate(done, { opacity: [0, 1], y: [12, 0] }, { duration: 0.6, ease: ease });
      }
    });
  });

  /* ---------------- tortarendelő varázsló ---------------- */
  var wiz = $('[data-wizard]');
  if (wiz) {
    var KEY = 'mokusch-torta-v2';
    var form = $('#torta');
    var steps = $$('.step', form);
    var navBtns = $$('[data-goto]', wiz);
    var bPrev = $('[data-prev]', form), bNext = $('[data-next]', form), bSubmit = $('[data-submit]', form);
    var saved = $('[data-saved]', form);
    var bar = $('.progress i', wiz);
    var drop = $('[data-drop]', form);
    var cur = 0, reached = 0;
    var LABELS = ['Alkalom', 'Dátum', 'Méret', 'Ízvilág', 'Díszítés', 'Referenciakép', 'Elérhetőség', 'Összegzés'];

    var dateInput = $('#w-datum', form);
    dateInput.min = todayISO(0); // a minimális előrendelési idő ügyféllel egyeztetendő

    function data() {
      var o = {};
      $$('input,select,textarea', form).forEach(function (el) {
        if (!el.name || el.type === 'file') return;
        if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
        else if (el.type === 'checkbox') {
          if (el.name === 'iz' || el.name === 'stilus') { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); }
          else o[el.name] = el.checked ? el.value : '';
        } else o[el.name] = el.value;
      });
      return o;
    }
    function persist() {
      if (!store) return;
      try { store.setItem(KEY, JSON.stringify({ d: data(), cur: cur, reached: reached })); saved.textContent = 'Mentve ebben a böngészőben'; } catch (e) {}
    }
    function restore() {
      if (!store) return;
      var raw; try { raw = JSON.parse(store.getItem(KEY) || 'null'); } catch (e) { raw = null; }
      if (!raw) return;
      var d = raw.d || {};
      $$('input,select,textarea', form).forEach(function (el) {
        if (!el.name || !(el.name in d) || el.type === 'file') return;
        var v = d[el.name];
        if (el.type === 'radio') el.checked = el.value === v;
        else if (el.type === 'checkbox') el.checked = Array.isArray(v) ? v.indexOf(el.value) > -1 : v === el.value;
        else el.value = v;
      });
      reached = Math.min(raw.reached || 0, 7);
      cur = Math.min(raw.cur || 0, reached);
    }
    // előtöltés: ?alkalom=eskuvo
    if (params.get('alkalom') === 'eskuvo') { var r = $('input[name=alkalom][value="Esküvő"]', form); if (r && !(store && store.getItem(KEY))) r.checked = true; }

    function err(name, on) { var e = $('[data-err="' + name + '"]', form); if (e) e.classList.toggle('is-on', on); return !on; }
    function validate(i) {
      var d = data();
      switch (i) {
        case 0: return err('alkalom', !d.alkalom);
        case 1: var ok = !!d.datum && d.datum >= todayISO(0); dateInput.setAttribute('aria-invalid', String(!ok)); return err('datum', !ok);
        case 2: return err('meret', !d.meret);
        case 3: return err('iz', !(d.iz && d.iz.length));
        case 4: var t = $('#w-leiras', form); var ok4 = (d.leiras || '').trim().length >= 3; t.setAttribute('aria-invalid', String(!ok4)); return err('leiras', !ok4);
        case 5: return true;
        case 6:
          var ok6 = (d.nev || '').trim() && emailOk((d.email || '').trim()) && d.hozzajarulas;
          $('#w-nev', form).setAttribute('aria-invalid', String(!(d.nev || '').trim()));
          $('#w-mail', form).setAttribute('aria-invalid', String(!emailOk((d.email || '').trim())));
          return err('kapcsolat', !ok6);
        case 7: return err('ellenorizve', !d.ellenorizve);
      }
      return true;
    }
    function fmtDate(v) { if (!v) return '–'; var p = v.split('-'); return p[0] + '. ' + ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'][+p[1] - 1] + ' ' + (+p[2]) + '.'; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function summary() {
      var d = data();
      var n = drop && drop.getFiles ? drop.getFiles().length : 0;
      var rows = [
        [0, 'Alkalom', d.alkalom || '–'],
        [1, 'Dátum', fmtDate(d.datum) + (d.napszak ? ', ' + d.napszak.toLowerCase() : '') + (d.rugalmas ? ' (rugalmas)' : '')],
        [2, 'Méret', (d.meret || '–') + (d.vendeg ? ' · kb. ' + d.vendeg + ' vendég' : '')],
        [3, 'Ízvilág', (d.iz || []).join(', ') + (d.allergia ? ' · allergia/étrend: ' + d.allergia : '')],
        [4, 'Elképzelés', ((d.stilus || []).length ? d.stilus.join(', ') + ' – ' : '') + (d.leiras || '–') + (d.felirat ? ' · felirat: „' + d.felirat + '”' : '')],
        [5, 'Referenciakép', n ? n + ' kép csatolva' : 'nincs'],
        [6, 'Elérhetőség', [d.nev, d.email, d.tel].filter(Boolean).join(' · ') + ' · ' + (d.atvetel || '')]
      ];
      $('[data-summary]', form).innerHTML = rows.map(function (r) {
        return '<div><dt>' + r[1] + '</dt><dd>' + esc(r[2]) + '</dd><button class="edit" type="button" data-goto="' + r[0] + '">Módosítás<span class="sr-only">: ' + r[1] + '</span></button></div>';
      }).join('');
      $$('[data-summary] [data-goto]', form).forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-goto')); }); });
    }
    function show(i, dir) {
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      navBtns.forEach(function (b, k) {
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.disabled = k > reached;
        b.classList.toggle('is-done', k < reached && k !== i);
      });
      bPrev.hidden = i === 0;
      bNext.hidden = i === 7;
      bSubmit.hidden = i !== 7;
      bar.style.setProperty('--p', ((i + 1) / 8 * 100) + '%');
      if (i === 7) summary();
      var st = steps[i];
      if (canAnim && dir !== undefined) M.animate(st, { opacity: [0, 1], x: [dir * 22, 0] }, { duration: 0.45, ease: ease });
      var activeNav = navBtns[i]; if (activeNav && activeNav.scrollIntoView && window.innerWidth < 980) activeNav.scrollIntoView({ block: 'nearest', inline: 'center', behavior: canAnim ? 'smooth' : 'auto' });
    }
    function go(i, focus) {
      var dir = i > cur ? 1 : -1;
      cur = i; reached = Math.max(reached, i);
      show(i, dir); persist();
      if (focus !== false) {
        var top = wiz.getBoundingClientRect().top + window.scrollY - 90;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: canAnim ? 'smooth' : 'auto' });
        steps[i].focus({ preventScroll: true });
      }
    }
    bNext.addEventListener('click', function () { if (validate(cur)) go(cur + 1); else { var e = $('.err.is-on', steps[cur]); if (e) e.scrollIntoView({ block: 'center' }); } });
    bPrev.addEventListener('click', function () { go(cur - 1); });
    navBtns.forEach(function (b, k) { b.addEventListener('click', function () { if (k <= reached) go(k); }); });
    form.addEventListener('change', persist);
    form.addEventListener('input', function (e) {
      if (e.target.id === 'w-leiras') $('[data-count]', form).textContent = e.target.value.length;
      persist();
    });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') { e.preventDefault(); bNext.hidden ? null : bNext.click(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var k = 0; k < 8; k++) { if (!validate(k)) { go(k); return; } }
      // Látványterv: nincs valódi küldés.
      form.hidden = true;
      var done = $('[data-done]', wiz);
      done.classList.add('is-on'); done.focus();
      if (canAnim) M.animate(done, { opacity: [0, 1], y: [14, 0] }, { duration: 0.6, ease: ease });
      if (store) store.removeItem(KEY);
    });
    $('[data-restart]', wiz).addEventListener('click', function () {
      form.reset(); if (store) store.removeItem(KEY);
      cur = 0; reached = 0; form.hidden = false; $('[data-done]', wiz).classList.remove('is-on');
      $('[data-count]', form).textContent = '0'; show(0); steps[0].focus();
    });

    restore();
    var l = $('#w-leiras', form); $('[data-count]', form).textContent = l.value.length;
    show(cur);
    if (cur > 0) saved.textContent = 'Folytatod, ahol abbahagytad';
  }
})();
