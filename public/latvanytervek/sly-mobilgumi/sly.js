/* SLY Mobil Gumiszerviz — látványterv interakciók, 2. kör (függőség nélkül) */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var VAT = 0.27;
  var IMG = 'https://slymobilgumi.hu/wp-content/uploads/2021/06/';
  var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; };

  requestAnimationFrame(function () { d.body.classList.add('is-loaded'); });

  /* ---- képhiba-tartalék ---- */
  $$('img').forEach(function (img) {
    var fail = function () {
      if (img.dataset.fallback === 'wordmark') { img.closest('.brand').classList.add('no-logo'); return; }
      img.classList.add('is-missing');
      if (img.parentElement) img.parentElement.classList.add('has-missing');
    };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    img.addEventListener('error', fail);
  });

  /* ---- fejléc + haladásjelző ---- */
  var hdr = $('#hdr'), prog = $('#progress');
  function onScrollHdr() {
    var y = window.scrollY, max = d.documentElement.scrollHeight - window.innerHeight;
    hdr.classList.toggle('is-solid', y > 16 || d.body.classList.contains('menu-open'));
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
  }

  /* ---- mobilmenü ---- */
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    d.body.classList.toggle('menu-open', open);
    if (open) { menu.hidden = false; requestAnimationFrame(function () { menu.classList.add('is-open'); }); var f = $('a', menu); if (f) f.focus({ preventScroll: true }); }
    else { menu.classList.remove('is-open'); menu.hidden = true; }
    onScrollHdr(); updateSosBar();
  }
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

  /* ---- görgetésre megjelenő elemek ---- */
  var revealEls = $$('.reveal, .mask-reveal, [data-draw]');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) {
      var sib = el.parentElement ? $$(':scope > .reveal, :scope > .mask-reveal', el.parentElement).indexOf(el) : -1;
      if (sib > 0) el.style.transitionDelay = Math.min(sib * 80, 320) + 'ms';
      io.observe(el);
    });
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('is-in'); }); }, 6000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- forgó kerék a heróban (görgetés + lassú alapforgás) ---- */
  var spins = $$('.tyre__spin'), hero = $('#kezdolap'), heroOn = true, idle = 0, last = 0;
  function setSpin(a) { spins.forEach(function (g) { g.setAttribute('transform', 'rotate(' + a.toFixed(2) + ')'); }); }
  if (spins.length && !reduce) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; if (heroOn) loop(performance.now()); }).observe(hero);
    var loop = function (t) {
      if (!heroOn) return;
      var dt = last ? Math.min(t - last, 64) : 16; last = t;
      idle += dt * 0.006;
      setSpin(idle + window.scrollY * 0.24);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---- „az út hozzád”: ragadós jelenet ---- */
  var story = $('#story'), sticky = story && $('.story__sticky', story), van = $('#van'), fill = $('#roadFill');
  var road = story && $('.road', story), stops = story ? $$('.road__stop', story) : [], steps = story ? $$('#steps li', story) : [];
  var storyLive = story && !reduce && getComputedStyle(sticky).position === 'sticky';
  function onStory() {
    if (!storyLive) return;
    var r = story.getBoundingClientRect(), total = story.offsetHeight - sticky.offsetHeight;
    var p = clamp(-r.top / (total || 1), 0, 1);
    road.style.setProperty('--p', p.toFixed(4));
    var idx = Math.min(3, Math.floor(p * 4));
    steps.forEach(function (li, i) { li.classList.toggle('is-on', i === idx); });
    stops.forEach(function (s, i) { s.classList.toggle('is-on', p >= i / 3 - 0.01); });
  }
  if (story && !storyLive) { road.style.setProperty('--p', 1); stops.forEach(function (s) { s.classList.add('is-on'); }); steps.forEach(function (li) { li.classList.add('is-on'); }); }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; onScrollHdr(); onStory(); });
  }, { passive: true });
  onScrollHdr(); onStory();

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

  /* ---- szolgáltatáslista: kurzort követő saját fotó ---- */
  var peek = $('#peek');
  if (peek && fine && !reduce) {
    var pimg = $('img', peek), px = 0, py = 0, tx = 0, ty = 0, pRun = false;
    var pl = function () { px += (tx - px) * 0.18; py += (ty - py) * 0.18; peek.style.left = px + 'px'; peek.style.top = py + 'px'; if (pRun) requestAnimationFrame(pl); };
    $$('.idx a').forEach(function (a) {
      a.addEventListener('pointerenter', function (e) {
        if (window.innerWidth < 1000 || !a.dataset.img) return;
        pimg.src = IMG + a.dataset.img + '.jpg';
        tx = px = e.clientX + 150; ty = py = e.clientY;
        peek.classList.add('is-on'); if (!pRun) { pRun = true; pl(); }
      });
      a.addEventListener('pointermove', function (e) { tx = e.clientX + 150; ty = e.clientY; });
      a.addEventListener('pointerleave', function () { peek.classList.remove('is-on'); pRun = false; });
    });
  }

  /* ---- fülek ---- */
  function tabs(list, onChange) {
    var btns = $$('[role="tab"]', list);
    var select = function (b, focus) {
      btns.forEach(function (x) {
        var on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        var p = d.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) b.focus();
      if (onChange) onChange(b);
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = btns[(i + 1) % btns.length];
        if (e.key === 'ArrowLeft') n = btns[(i - 1 + btns.length) % btns.length];
        if (e.key === 'Home') n = btns[0];
        if (e.key === 'End') n = btns[btns.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    return select;
  }
  tabs($('.ptabs'), function () { bars(); });

  /* ---- oldalfal-dekóder ---- */
  var EX = {
    w: ['Szélesség · mm', '205 mm széles abroncs.', 'Az abroncs szélessége milliméterben, oldalfaltól oldalfalig.'],
    a: ['Oldalfalarány · %', 'Az oldalfal magassága a szélesség 55%-a.', 'Minél kisebb ez a szám, annál alacsonyabb az oldalfal.'],
    r: ['Szerkezet', 'R = radiál abroncs.', 'Ma szinte minden személyautó-abroncs radiál szerkezetű.'],
    d: ['Felniátmérő · colban', '16 col – ez határozza meg a szerelési díjat.', 'Gumiszerelés + centrírozás 16 colig: <b>17 000 Ft + ÁFA</b> · kerékcsere: <b>13 000 Ft + ÁFA</b> (4 db).'],
    l: ['Terhelési index', '91 = legfeljebb 615 kg kerekenként.', 'Cserénél legalább az autóhoz előírt terhelési indexű abroncs kell.'],
    s: ['Sebességindex', 'V = legfeljebb 240 km/h.', 'Az abroncs legnagyobb megengedett sebessége.'],
    dot: ['Gyártási idő · DOT', '3824 = 2024, a 38. hét.', 'Az utolsó négy számjegy a gyártás hetét és évét mutatja. Idősebb abroncsnál érdemes állapotfelmérést kérni.']
  };
  var exBox = $('#explain');
  if (exBox) {
    var exBtns = $$('.code button');
    exBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        exBtns.forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        var e = EX[b.dataset.k];
        $('#exK').textContent = e[0]; $('#exV').textContent = e[1]; $('#exP').innerHTML = e[2];
        $('#exLink').hidden = b.dataset.k !== 'd';
        exBox.classList.remove('is-swap'); void exBox.offsetWidth; exBox.classList.add('is-swap');
      });
    });
    $('#exLink').addEventListener('click', function () {
      var r = d.querySelector('input[name=svc][value=gumi]'); if (r) { r.checked = true; buildSizes('gumi', 0); calc(); }
    });
  }

  /* ---- árlista: nettó / bruttó ---- */
  var vatMode = 'net', priceCells = $$('td[data-net]');
  priceCells.forEach(function (td) { td.dataset.orig = td.innerHTML; });
  function renderPrices() {
    priceCells.forEach(function (td) {
      if (vatMode === 'net') { td.innerHTML = td.dataset.orig; return; }
      var g = parseFloat(td.dataset.net) * (1 + VAT);
      td.innerHTML = (td.dataset.plus ? '+' : '') + fmt(g) + (td.dataset.from ? '-tól' : '') + (td.dataset.unit ? ' ' + td.dataset.unit : '') + '<small>bruttó</small>';
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
      var td = $('td', tr), th = $('th', tr);
      if (td && th) th.style.setProperty('--w', (parseFloat(td.dataset.net) / 30000 * 100).toFixed(1) + '%');
    });
  }
  bars();

  /* ---- díjkalkulátor (csak közzétett árak) ---- */
  // [címke, nettó ár, kijelzett méret, felni-sugár a rajzon]
  var SIZES = {
    kerek: [['16 colig', 13000, '≤16″', 80], ['16 coltól', 15000, '16″+', 100], ['Kisteherautó', 15000, 'Kisteher', 84]],
    gumi: [['16 colig', 17000, '≤16″', 80], ['17 col', 18000, '17″', 88], ['18 col', 19000, '18″', 96], ['19 col', 20000, '19″', 104], ['20 col', 24000, '20″', 112], ['21 col', 26000, '21″', 120], ['22 col', 30000, '22″', 128], ['Kisteherautó', 20000, 'Kisteher', 84]]
  };
  var SVC_NAME = { kerek: 'Kerékcsere centrírozással (4 db)', gumi: 'Gumiszerelés + centrírozás (4 db)' };
  var form = $('#calcForm'), sizeBox = $('#sizeChips'), extrasSet = $('#extrasSet');
  function buildSizes(svc, keep) {
    sizeBox.innerHTML = '';
    SIZES[svc].forEach(function (s, i) {
      var l = d.createElement('label'); l.className = 'chip';
      l.innerHTML = '<input type="radio" name="size" value="' + i + '"' + (i === (keep || 0) ? ' checked' : '') + '><span>' + s[0] + '</span>';
      sizeBox.appendChild(l);
    });
  }
  function drawWheel(s) {
    var rim = $('#cwRim'), rin = $('#cwRimIn'), dim = $('#cwDim'), r = s[3];
    rim.style.r = r + 'px'; rim.setAttribute('r', r);
    rin.style.r = (r - 14) + 'px'; rin.setAttribute('r', r - 14);
    dim.setAttribute('d', 'M' + (-r) + ' 0H' + r);
    $('#cwSpokes path').setAttribute('d', 'M0 -20V' + (-(r - 14)) + 'M0 20V' + (r - 14) + 'M-20 0H' + (-(r - 14)) + 'M20 0H' + (r - 14));
    $('#cSizeBig').textContent = s[2]; $('#cSizeLbl').textContent = s[0];
  }
  function calc() {
    var f = form.elements;
    var svc = form.querySelector('[name=svc]:checked').value;
    var si = +(form.querySelector('[name=size]:checked') || { value: 0 }).value;
    var size = SIZES[svc][si];
    drawWheel(size);
    var lines = [[SVC_NAME[svc] + ' · ' + size[0], size[1]]], sub = size[1], isGumi = svc === 'gumi';
    extrasSet.disabled = !isGumi;
    if (isGumi) {
      if (f.suv.checked) { lines.push(['SUV-felár (4 × 500 Ft)', 2000]); sub += 2000; }
      if (f.tpms.checked) { lines.push(['TPMS-szelep (4 × 500 Ft)', 2000]); sub += 2000; }
      if (f.rft.checked) { lines.push(['Defekttűrő abroncs (4 × 1 000 Ft)', 4000]); sub += 4000; }
    }
    var net = sub;
    if (form.querySelector('[name=when]:checked').value === 'out') { lines.push(['Nyitvatartáson túli felár (50%)', sub * 0.5]); net += sub * 0.5; }
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
    form.addEventListener('change', function (e) { if (e.target.name === 'svc') buildSizes(e.target.value); calc(); });
    calc();
  }

  /* ---- filmszalag ---- */
  var strip = $('#strip');
  if (strip) {
    var step = function () { var i = $('.strip__i', strip); return i ? i.offsetWidth + 14 : 300; };
    $('#stripPrev').addEventListener('click', function () { strip.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    $('#stripNext').addEventListener('click', function () { strip.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (fine) {
      var down = false, sx = 0, sl = 0, moved = false;
      strip.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft; });
      window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; strip.classList.add('is-drag'); } strip.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', function () { if (!down) return; down = false; strip.classList.remove('is-drag'); });
      strip.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    }
  }

  /* ---- galéria ---- */
  var GAL = [
    ['munka1', 'Abroncs és felni – részletfotó'], ['munka2', 'Helyszíni kerékszerelés'], ['munka3', 'Szakember gumiszerelés közben'],
    ['munka4', 'Archív fotó: korábbi szervizautó és felszerelés'], ['munka5', 'Gumiszerelő és centrírozó berendezések'],
    ['munka6', 'Kerékszerelési részlet'], ['munka7', 'Autó és leszerelt kerekek']
  ];
  var gal = $('#gal'), gImg = $('#galImg'), gCap = $('#galCap'), gCount = $('#galCount'), gi = 0, lastFocus = null;
  function show(i) {
    gi = (i + GAL.length) % GAL.length; gImg.classList.remove('is-missing');
    gImg.src = IMG + GAL[gi][0] + '.jpg'; gImg.alt = GAL[gi][1]; gCap.textContent = GAL[gi][1]; gCount.textContent = (gi + 1) + ' / ' + GAL.length;
  }
  function openGal(i) { lastFocus = d.activeElement; show(i || 0); if (gal.showModal) gal.showModal(); else gal.setAttribute('open', ''); d.body.classList.add('menu-open'); updateSosBar(); }
  function closeGal() { if (gal.close) gal.close(); else gal.removeAttribute('open'); }
  if (gal) {
    gal.addEventListener('close', function () { d.body.classList.remove('menu-open'); updateSosBar(); onScrollHdr(); if (lastFocus) lastFocus.focus(); });
    $$('[data-gal]').forEach(function (b) { b.addEventListener('click', function () { openGal(+b.dataset.gal); }); });
    $('#galClose').addEventListener('click', closeGal);
    $('#galPrev').addEventListener('click', function () { show(gi - 1); });
    $('#galNext').addEventListener('click', function () { show(gi + 1); });
    gal.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(gi + 1); if (e.key === 'ArrowLeft') show(gi - 1); });
    gal.addEventListener('click', function (e) { if (e.target === gal) closeGal(); });
    var tsx = null;
    gal.addEventListener('touchstart', function (e) { tsx = e.touches[0].clientX; }, { passive: true });
    gal.addEventListener('touchend', function (e) { if (tsx === null) return; var dx = e.changedTouches[0].clientX - tsx; if (Math.abs(dx) > 50) show(gi + (dx < 0 ? 1 : -1)); tsx = null; });
  }

  /* ---- űrlapok: bemutató mód ---- */
  function demoForm(f, subject, labels) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', f).forEach(function (inp) {
        var bad = !inp.value.trim();
        inp.closest('.fld').classList.toggle('is-err', bad); inp.setAttribute('aria-invalid', bad);
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
    bar.classList.toggle('is-on', on); bar.setAttribute('aria-hidden', !on); $('a', bar).tabIndex = on ? 0 : -1;
  }
  if ('IntersectionObserver' in window && bar) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target === heroCtas) st.hero = e.isIntersecting || e.boundingClientRect.top > 0;
        if (e.target === contact) st.contact = e.isIntersecting;
        if (e.target === ftr) st.foot = e.isIntersecting;
      });
      updateSosBar();
    }).observe(heroCtas);
  }
  if ('IntersectionObserver' in window && bar) {
    var bio2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.target === contact) st.contact = e.isIntersecting; if (e.target === ftr) st.foot = e.isIntersecting; });
      updateSosBar();
    });
    [contact, ftr].forEach(function (el) { if (el) bio2.observe(el); });
  }
  d.addEventListener('focusin', function (e) { if (e.target.matches('input, select, textarea')) { st.typing = true; updateSosBar(); } });
  d.addEventListener('focusout', function () { st.typing = false; setTimeout(updateSosBar, 50); });
  updateSosBar();
})();
