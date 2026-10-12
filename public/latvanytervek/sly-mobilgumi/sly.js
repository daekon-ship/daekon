/* SLY Mobil Gumiszerviz — látványterv, 8. kör (függőség nélkül) */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var VAT = 0.27, IMG = 'https://slymobilgumi.hu/wp-content/uploads/2021/06/';
  var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'; };

  /* képhiba-tartalék */
  $$('img').forEach(function (img) {
    var fail = function () {
      if (img.dataset.fallback === 'wordmark') { img.closest('.brand').classList.add('no-logo'); return; }
      img.classList.add('is-missing'); if (img.parentElement) img.parentElement.classList.add('has-missing');
    };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    img.addEventListener('error', fail);
  });

  /* fejléc */
  var hdr = $('#hdr');
  var onScroll = function () { hdr.classList.toggle('is-solid', window.scrollY > 8); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* mobilmenü */
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    menu.hidden = !open; d.body.classList.toggle('menu-open', open); updateBar();
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && !menu.hidden) setMenu(false); });

  /* aktív menüpont */
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['szolgaltatasok', 'arak', 'munkaink', 'flottaknak', 'kapcsolat'].forEach(function (id) { var el = d.getElementById(id); if (el) sio.observe(el); });
  }

  /* finom érkezés */
  var rv = $$('.rv');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) {
      var i = $$(':scope > .rv', el.parentElement).indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
      io.observe(el);
    });
    setTimeout(function () { rv.forEach(function (el) { el.classList.add('is-in'); }); }, 5000);
  } else rv.forEach(function (el) { el.classList.add('is-in'); });

  /* szolgáltatáslista: a sor fölött a saját fotó */
  var peek = $('#peek');
  if (peek && fine && !reduce) {
    var pimg = $('img', peek), px = 0, py = 0, tx = 0, ty = 0, run = false;
    var loop = function () { px += (tx - px) * .2; py += (ty - py) * .2; peek.style.left = px + 'px'; peek.style.top = py + 'px'; if (run) requestAnimationFrame(loop); };
    $$('.idx a').forEach(function (a) {
      a.addEventListener('pointerenter', function (e) {
        if (window.innerWidth < 1000 || !a.dataset.img) return;
        pimg.src = IMG + a.dataset.img + '.jpg'; tx = px = e.clientX + 140; ty = py = e.clientY;
        peek.classList.add('is-on'); if (!run) { run = true; loop(); }
      });
      a.addEventListener('pointermove', function (e) { tx = e.clientX + 140; ty = e.clientY; });
      a.addEventListener('pointerleave', function () { peek.classList.remove('is-on'); run = false; });
    });
  }

  /* árfülek */
  var tabs = $$('.ptabs [role=tab]');
  function selectTab(b, focus) {
    tabs.forEach(function (x) {
      var on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      d.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) b.focus();
    if (b.scrollIntoView && b.parentElement.scrollWidth > b.parentElement.clientWidth) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { selectTab(b); });
    b.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1] : null;
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* nettó / bruttó */
  var cells = $$('td[data-net]');
  cells.forEach(function (td) { td.dataset.orig = td.innerHTML; });
  $$('.vat button').forEach(function (b) {
    b.addEventListener('click', function () {
      var gross = b.dataset.vat === 'gross';
      $$('.vat button').forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      cells.forEach(function (td) {
        td.innerHTML = gross ? (td.dataset.plus ? '+' : '') + fmt(td.dataset.net * (1 + VAT)) + (td.dataset.from ? '-tól' : '') + (td.dataset.unit ? ' ' + td.dataset.unit : '') + '<small>bruttó</small>' : td.dataset.orig;
      });
    });
  });

  /* díjkalkulátor – csak közzétett árak */
  var SIZES = {
    kerek: [['16 colig', 13000], ['16 coltól', 15000], ['Kisteherautó', 15000]],
    gumi: [['16 colig', 17000], ['17 col', 18000], ['18 col', 19000], ['19 col', 20000], ['20 col', 24000], ['21 col', 26000], ['22 col', 30000], ['Kisteherautó', 20000]]
  };
  var NAME = { kerek: 'Kerékcsere centrírozással (4 db)', gumi: 'Gumiszerelés + centrírozás (4 db)' };
  var form = $('#calcForm'), sizeBox = $('#sizeChips'), extras = $('#extrasSet');
  function sizes(svc) {
    sizeBox.innerHTML = SIZES[svc].map(function (s, i) { return '<label class="chip"><input type="radio" name="size" value="' + i + '"' + (i ? '' : ' checked') + '><span>' + s[0] + '</span></label>'; }).join('');
  }
  function calc() {
    var f = form.elements, svc = form.querySelector('[name=svc]:checked').value;
    var s = SIZES[svc][+(form.querySelector('[name=size]:checked') || { value: 0 }).value];
    var lines = [[NAME[svc] + ' · ' + s[0], s[1]]], sub = s[1], g = svc === 'gumi';
    extras.disabled = !g;
    if (g) {
      if (f.suv.checked) { lines.push(['SUV-felár (4 × 500 Ft)', 2000]); sub += 2000; }
      if (f.tpms.checked) { lines.push(['TPMS-szelep (4 × 500 Ft)', 2000]); sub += 2000; }
      if (f.rft.checked) { lines.push(['Defekttűrő abroncs (4 × 1 000 Ft)', 4000]); sub += 4000; }
    }
    var net = sub;
    if (form.querySelector('[name=when]:checked').value === 'out') { lines.push(['Nyitvatartáson túli felár (50%)', sub * .5]); net += sub * .5; }
    var h = +f.hotel.value; if (h) { lines.push(['Gumihotel (garnitúra / szezon)', h]); net += h; }
    var w = +f.waste.value; if (w) { lines.push(['Selejt abroncs elszállítása (' + w + ' × 1 000 Ft)', w * 1000]); net += w * 1000; }
    var c = +f.carry.value; if (c) { lines.push(['Rakodás pincéből / padlásról (' + c + ' × 750 Ft)', c * 750]); net += c * 750; }
    var vat = Math.round(net * VAT);
    [['cNet', net], ['cVat', vat], ['cGross', net + vat]].forEach(function (p) {
      var el = d.getElementById(p[0]), v = fmt(p[1]);
      if (el.textContent !== v) { el.textContent = v; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    });
    $('#cLines').innerHTML = lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + fmt(l[1]) + '</span></li>'; }).join('');
    $('#cZone').textContent = form.querySelector('[name=zone]:checked').value === 'in'
      ? 'Kiszállás: ingyenes (tervezett csere, Sopron 20 km-es körzetében).'
      : 'Kiszállás körzeten kívül: egyedi díj telefonos egyeztetés alapján – az összeg nem tartalmazza.';
  }
  if (form) { sizes('kerek'); form.addEventListener('change', function (e) { if (e.target.name === 'svc') sizes(e.target.value); calc(); }); calc(); }

  /* galéria */
  var GAL = [['munka1', 'Abroncs és felni – részletfotó'], ['munka2', 'Helyszíni kerékszerelés'], ['munka3', 'Szakember gumiszerelés közben'], ['munka4', 'Archív fotó: korábbi szervizautó és felszerelés'], ['munka5', 'Gumiszerelő és centrírozó berendezések'], ['munka6', 'Kerékszerelési részlet'], ['munka7', 'Autó és leszerelt kerekek']];
  var gal = $('#gal'), gi = 0, last = null;
  function show(i) { gi = (i + GAL.length) % GAL.length; var im = $('#galImg'); im.classList.remove('is-missing'); im.src = IMG + GAL[gi][0] + '.jpg'; im.alt = GAL[gi][1]; $('#galCap').textContent = GAL[gi][1]; $('#galCount').textContent = (gi + 1) + ' / ' + GAL.length; }
  if (gal) {
    $$('[data-gal]').forEach(function (b) { b.addEventListener('click', function () { last = b; show(+b.dataset.gal); gal.showModal ? gal.showModal() : gal.setAttribute('open', ''); }); });
    $('#galClose').addEventListener('click', function () { gal.close ? gal.close() : gal.removeAttribute('open'); });
    $('#galPrev').addEventListener('click', function () { show(gi - 1); });
    $('#galNext').addEventListener('click', function () { show(gi + 1); });
    gal.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(gi + 1); if (e.key === 'ArrowLeft') show(gi - 1); });
    gal.addEventListener('click', function (e) { if (e.target === gal) gal.close(); });
    gal.addEventListener('close', function () { if (last) last.focus(); });
  }

  /* űrlapok – bemutató mód */
  function demo(f, subject, labels) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', f).forEach(function (inp) { var bad = !inp.value.trim(); inp.closest('.fld').classList.toggle('is-err', bad); inp.setAttribute('aria-invalid', bad); if (bad && ok) { inp.focus(); ok = false; } });
      var out = $('.form__demo', f);
      if (!ok) { out.textContent = 'Kérjük, töltsd ki a kötelező mezőket.'; return; }
      var body = labels.map(function (l) { var el = f.elements[l[0]]; return el && el.value.trim() ? l[1] + ': ' + el.value.trim() : null; }).filter(Boolean).join('\n');
      out.innerHTML = 'Bemutató mód: semmit nem küldtünk el. <a href="mailto:sly.mobilgumi@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body) + '">E-mail-piszkozat megnyitása</a> vagy hívj: <a href="tel:+36707321908">+36 70 732 1908</a>.';
    });
  }
  if ($('#idopont')) demo($('#idopont'), 'Gumicsere időpontkérés', [['nev', 'Név'], ['tel', 'Telefon'], ['szolg', 'Szolgáltatás'], ['meret', 'Abroncsméret'], ['hely', 'Helyszín'], ['mikor', 'Időpont'], ['megj', 'Megjegyzés']]);
  if ($('#fleetForm')) demo($('#fleetForm'), 'Flottás ajánlatkérés', [['ceg', 'Cég'], ['nev', 'Kapcsolattartó'], ['tel', 'Telefon'], ['db', 'Járművek száma'], ['tipus', 'Járműtípus'], ['hely', 'Telephely'], ['megj', 'Megjegyzés']]);

  /* mobil S.O.S.-sáv: nem takar heróban, kapcsolatnál, láblécnél, gépeléskor */
  var bar = $('#sosbar'), st = { hero: true, contact: false, foot: false, typing: false };
  function updateBar() {
    if (!bar) return;
    var on = !st.hero && !st.contact && !st.foot && !st.typing && !d.body.classList.contains('menu-open');
    bar.classList.toggle('is-on', on); bar.setAttribute('aria-hidden', !on); $('a', bar).tabIndex = on ? 0 : -1;
  }
  if ('IntersectionObserver' in window && bar) {
    var m = { hero: $('.hero__ctas'), contact: $('#kapcsolat'), foot: $('.ftr') };
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target === m.hero) st.hero = e.isIntersecting || e.boundingClientRect.top > 0;
        if (e.target === m.contact) st.contact = e.isIntersecting;
        if (e.target === m.foot) st.foot = e.isIntersecting;
      });
      updateBar();
    }).observe(m.hero);
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.target === m.contact) st.contact = e.isIntersecting; if (e.target === m.foot) st.foot = e.isIntersecting; }); updateBar(); });
    io2.observe(m.contact); io2.observe(m.foot);
  }
  d.addEventListener('focusin', function (e) { if (e.target.matches('input, select, textarea')) { st.typing = true; updateBar(); } });
  d.addEventListener('focusout', function () { st.typing = false; setTimeout(updateBar, 50); });
  updateBar();
})();
