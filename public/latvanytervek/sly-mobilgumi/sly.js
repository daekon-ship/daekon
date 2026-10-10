/* SLY Mobil Gumiszerviz — látványterv interakciók (függőség nélkül) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var VAT = 0.27;
  var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; };

  /* ---- belépés ---- */
  requestAnimationFrame(function () { d.body.classList.add('is-loaded'); });

  /* ---- képhiba-tartalék (a képek a jelenlegi honlapról töltődnek) ---- */
  $$('img').forEach(function (img) {
    var fail = function () {
      if (img.dataset.fallback === 'wordmark') { img.closest('.brand').classList.add('no-logo'); return; }
      img.classList.add('is-missing');
      if (img.parentElement) img.parentElement.classList.add('has-missing');
    };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    img.addEventListener('error', fail);
  });

  /* ---- fejléc ---- */
  var hdr = $('#hdr');
  var onScroll = function () { hdr.classList.toggle('is-solid', window.scrollY > 16); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- mobilmenü ---- */
  var burger = $('#burger'), menu = $('#menu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    d.body.classList.toggle('menu-open', open);
    hdr.classList.toggle('is-solid', open || window.scrollY > 16);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      var first = $('a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      menu.hidden = true;
    }
    updateSosBar();
  };
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && !menu.hidden) setMenu(false); });

  /* ---- aktív menüpont ---- */
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['kezdolap', 'szolgaltatasok', 'arak', 'munkaink', 'flottaknak', 'kapcsolat'].forEach(function (id) { var el = d.getElementById(id); if (el) secIO.observe(el); });
  }

  /* ---- görgetésre megjelenő elemek (progresszív, biztonsági időzítővel) ---- */
  var revealEls = $$('.reveal, .mask-reveal, [data-draw]');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el, i) {
      var sib = el.parentElement ? $$(':scope > .reveal', el.parentElement).indexOf(el) : -1;
      if (sib > 0) el.style.transitionDelay = Math.min(sib * 70, 280) + 'ms';
      io.observe(el);
    });
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('is-in'); }); }, 6000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- hero parallax (csak asztali, nem csökkentett mozgásnál) ---- */
  var px = $$('[data-parallax]');
  if (!reduce && px.length) {
    var ticking = false;
    var para = function () {
      ticking = false;
      if (window.innerWidth < 900) { px.forEach(function (f) { f.firstElementChild.style.transform = ''; }); return; }
      var y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      px.forEach(function (f) {
        var k = parseFloat(f.dataset.parallax);
        f.firstElementChild.style.transform = 'translate3d(0,' + (y * k).toFixed(1) + 'px,0) scale(1.1)';
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true });
    para();
  }

  /* ---- mágneses gombok ---- */
  if (fine && !reduce) {
    $$('.magnet').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = 'translate(' + (dx * 10).toFixed(1) + 'px,' + (dy * 8).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---- fülek (általános) ---- */
  function tabs(list, onChange) {
    var btns = $$('[role="tab"]', list);
    var select = function (b, focus) {
      btns.forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        var p = d.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) b.focus();
      if (b.scrollIntoView && list.scrollWidth > list.clientWidth) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      if (onChange) onChange(b);
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight') n = btns[(i + 1) % btns.length];
        if (k === 'ArrowLeft') n = btns[(i - 1 + btns.length) % btns.length];
        if (k === 'Home') n = btns[0];
        if (k === 'End') n = btns[btns.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }
  tabs($('.seg'));
  tabs($('.ptabs'), function () { bars(); });

  /* ---- árlista: nettó / bruttó ---- */
  var vatMode = 'net';
  var priceCells = $$('td[data-net]');
  priceCells.forEach(function (td) { td.dataset.orig = td.innerHTML; });
  function renderPrices() {
    priceCells.forEach(function (td) {
      if (vatMode === 'net') { td.innerHTML = td.dataset.orig; return; }
      var g = parseFloat(td.dataset.net) * (1 + VAT);
      var s = (td.dataset.plus ? '+' : '') + fmt(g) + (td.dataset.from ? '-tól' : '') + (td.dataset.unit ? ' ' + td.dataset.unit : '');
      td.innerHTML = s + '<small>bruttó</small>';
      td.classList.remove('num-flash'); void td.offsetWidth; td.classList.add('num-flash');
    });
  }
  $$('.vat__b').forEach(function (b) {
    b.addEventListener('click', function () {
      vatMode = b.dataset.vat;
      $$('.vat__b').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      renderPrices();
    });
  });
  function bars() {
    $$('.ptable--bars tr').forEach(function (tr) {
      var td = $('td', tr); var th = $('th', tr);
      if (td && th) th.style.setProperty('--w', (parseFloat(td.dataset.net) / 30000 * 100).toFixed(1) + '%');
    });
  }
  bars();

  /* ---- díjkalkulátor: csak a közzétett árakból ---- */
  var SIZES = {
    kerek: [['16 colig', 13000], ['16 coltól', 15000], ['Kisteherautó', 15000]],
    gumi: [['16 colig', 17000], ['17 col', 18000], ['18 col', 19000], ['19 col', 20000], ['20 col', 24000], ['21 col', 26000], ['22 col', 30000], ['Kisteherautó', 20000]]
  };
  var SVC_NAME = { kerek: 'Kerékcsere centrírozással (4 db)', gumi: 'Gumiszerelés + centrírozás + felszerelés (4 db)' };
  var form = $('#calcForm'), sizeBox = $('#sizeChips'), extrasSet = $('#extrasSet');
  function buildSizes(svc, keep) {
    sizeBox.innerHTML = '';
    SIZES[svc].forEach(function (s, i) {
      var l = d.createElement('label'); l.className = 'chip';
      l.innerHTML = '<input type="radio" name="size" value="' + i + '"' + (i === (keep || 0) ? ' checked' : '') + '><span>' + s[0] + '</span>';
      sizeBox.appendChild(l);
    });
  }
  function calc() {
    var f = form.elements;
    var svc = form.querySelector('[name=svc]:checked').value;
    var si = +(form.querySelector('[name=size]:checked') || { value: 0 }).value;
    var size = SIZES[svc][si];
    var lines = [[SVC_NAME[svc] + ' · ' + size[0], size[1]]];
    var sub = size[1];
    var isGumi = svc === 'gumi';
    extrasSet.disabled = !isGumi;
    if (isGumi) {
      if (f.suv.checked) { lines.push(['SUV-felár (4 × 500 Ft)', 2000]); sub += 2000; }
      if (f.tpms.checked) { lines.push(['TPMS-szelep (4 × 500 Ft)', 2000]); sub += 2000; }
      if (f.rft.checked) { lines.push(['Defekttűrő abroncs (4 × 1 000 Ft)', 4000]); sub += 4000; }
    }
    var net = sub;
    if (form.querySelector('[name=when]:checked').value === 'out') { var o = sub * 0.5; lines.push(['Nyitvatartáson túli felár (50%)', o]); net += o; }
    var hotel = +f.hotel.value; if (hotel) { lines.push(['Gumihotel (garnitúra / szezon)', hotel]); net += hotel; }
    var w = +f.waste.value; if (w) { lines.push(['Selejt abroncs elszállítása (' + w + ' × 1 000 Ft)', w * 1000]); net += w * 1000; }
    var c = +f.carry.value; if (c) { lines.push(['Rakodás pincéből / padlásról (' + c + ' × 750 Ft)', c * 750]); net += c * 750; }
    var vat = Math.round(net * VAT);
    var set = function (id, v) { var el = d.getElementById(id); if (el.textContent !== v) { el.textContent = v; el.classList.remove('num-flash'); void el.offsetWidth; el.classList.add('num-flash'); } };
    set('cNet', fmt(net)); set('cVat', fmt(vat)); set('cGross', fmt(net + vat));
    $('#cLines').innerHTML = lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + fmt(l[1]) + '</span></li>'; }).join('');
    $('#cZone').textContent = form.querySelector('[name=zone]:checked').value === 'in'
      ? 'Kiszállás: ingyenes (tervezett csere, Sopron 20 km-es körzetében).'
      : 'Kiszállás: körzeten kívül egyedi díj – telefonos egyeztetés alapján, az összeg nem tartalmazza.';
  }
  if (form) {
    buildSizes('kerek');
    form.addEventListener('change', function (e) {
      if (e.target.name === 'svc') buildSizes(e.target.value);
      calc();
    });
    calc();
  }

  /* ---- galéria ---- */
  var GAL = [
    ['munka1', 'Abroncs és felni – részletfotó'],
    ['munka2', 'Helyszíni kerékszerelés'],
    ['munka3', 'Szakember gumiszerelés közben'],
    ['munka4', 'Archív fotó: korábbi szervizautó és felszerelés'],
    ['munka5', 'Gumiszerelő és centrírozó berendezések'],
    ['munka6', 'Kerékszerelési részlet'],
    ['munka7', 'Autó és leszerelt kerekek']
  ];
  var gal = $('#gal'), gImg = $('#galImg'), gCap = $('#galCap'), gCount = $('#galCount'), gi = 0, lastFocus = null;
  function show(i) {
    gi = (i + GAL.length) % GAL.length;
    gImg.classList.remove('is-missing');
    gImg.src = 'https://slymobilgumi.hu/wp-content/uploads/2021/06/' + GAL[gi][0] + '.jpg';
    gImg.alt = GAL[gi][1]; gCap.textContent = GAL[gi][1]; gCount.textContent = (gi + 1) + ' / ' + GAL.length;
  }
  function openGal(i) {
    lastFocus = d.activeElement; show(i || 0);
    if (gal.showModal) gal.showModal(); else gal.setAttribute('open', '');
    d.body.classList.add('menu-open'); updateSosBar();
  }
  function closeGal() { if (gal.close) gal.close(); else gal.removeAttribute('open'); }
  if (gal) {
    gal.addEventListener('close', function () { d.body.classList.remove('menu-open'); updateSosBar(); if (lastFocus) lastFocus.focus(); });
    $('#openGallery').addEventListener('click', function () { openGal(0); });
    $$('[data-gal]').forEach(function (b) { b.addEventListener('click', function () { openGal(+b.dataset.gal); }); });
    $('#galClose').addEventListener('click', closeGal);
    $('#galPrev').addEventListener('click', function () { show(gi - 1); });
    $('#galNext').addEventListener('click', function () { show(gi + 1); });
    gal.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(gi + 1); if (e.key === 'ArrowLeft') show(gi - 1); });
    gal.addEventListener('click', function (e) { if (e.target === gal) closeGal(); });
    var sx = null;
    gal.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    gal.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(gi + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* ---- űrlapok: bemutató mód, e-mail-piszkozat ---- */
  function demoForm(f, subject, labels) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', f).forEach(function (inp) {
        var bad = !inp.value.trim();
        inp.closest('.fld').classList.toggle('is-err', bad);
        inp.setAttribute('aria-invalid', bad);
        if (bad && ok) { inp.focus(); ok = false; }
      });
      var out = $('.form__demo', f);
      if (!ok) { out.textContent = 'Kérjük, töltsd ki a kötelező mezőket.'; return; }
      var body = labels.map(function (l) { var el = f.elements[l[0]]; return el && el.value.trim() ? l[1] + ': ' + el.value.trim() : null; }).filter(Boolean).join('\n');
      var href = 'mailto:sly.mobilgumi@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      out.innerHTML = 'Bemutató mód: semmit nem küldtünk el. <a href="' + href + '">E-mail-piszkozat megnyitása</a> vagy hívj: <a href="tel:+36707321908">+36 70 732 1908</a>.';
    });
    $$('[required]', f).forEach(function (inp) { inp.addEventListener('input', function () { inp.closest('.fld').classList.remove('is-err'); inp.removeAttribute('aria-invalid'); }); });
  }
  var idp = $('#idopont'), flt = $('#fleetForm');
  if (idp) demoForm(idp, 'Gumicsere időpontkérés', [['nev', 'Név'], ['tel', 'Telefon'], ['szolg', 'Szolgáltatás'], ['meret', 'Abroncsméret'], ['hely', 'Helyszín'], ['mikor', 'Időpont'], ['megj', 'Megjegyzés']]);
  if (flt) demoForm(flt, 'Flottás ajánlatkérés', [['ceg', 'Cég'], ['nev', 'Kapcsolattartó'], ['tel', 'Telefon'], ['db', 'Járművek száma'], ['tipus', 'Járműtípus'], ['hely', 'Telephely'], ['megj', 'Megjegyzés']]);

  /* ---- mobil S.O.S. sáv ---- */
  var bar = $('#sosbar'), heroCtas = $('.hero__ctas'), contact = $('#kapcsolat'), ftr = $('.ftr');
  var st = { hero: true, contact: false, foot: false, typing: false };
  function updateSosBar() {
    if (!bar) return;
    var on = !st.hero && !st.contact && !st.foot && !st.typing && !d.body.classList.contains('menu-open');
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', !on);
    $('a', bar).tabIndex = on ? 0 : -1;
  }
  if ('IntersectionObserver' in window && bar) {
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target === heroCtas) st.hero = e.isIntersecting || e.boundingClientRect.top > 0;
        if (e.target === contact) st.contact = e.isIntersecting;
        if (e.target === ftr) st.foot = e.isIntersecting;
      });
      updateSosBar();
    });
    [heroCtas, contact, ftr].forEach(function (el) { if (el) bio.observe(el); });
  }
  d.addEventListener('focusin', function (e) { if (e.target.matches('input, select, textarea')) { st.typing = true; updateSosBar(); } });
  d.addEventListener('focusout', function () { st.typing = false; setTimeout(updateSosBar, 50); });
  updateSosBar();
})();
