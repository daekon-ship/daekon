/* GYÁLAUTÓ – gyalauto.hu (DAEKON, 2026)
   Egy rajzolt autó vezet végig az oldalon: hero → diagnosztika. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 961px)');
  var hasG = function () { return !reduce && window.gsap; };

  /* ===================== ADATOK ===================== */
  var tread = '';
  for (var i = 0; i < 24; i++) {
    var a = i * 15 * Math.PI / 180;
    var x1 = 140 + 76 * Math.cos(a), y1 = 110 + 76 * Math.sin(a), x2 = 140 + 84 * Math.cos(a), y2 = 110 + 84 * Math.sin(a);
    tread += 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }
  var spokes = '';
  for (i = 0; i < 5; i++) {
    var b = (i * 72 - 90) * Math.PI / 180;
    spokes += 'M' + (140 + 14 * Math.cos(b)).toFixed(1) + ' ' + (110 + 14 * Math.sin(b)).toFixed(1) + 'L' + (140 + 48 * Math.cos(b)).toFixed(1) + ' ' + (110 + 48 * Math.sin(b)).toFixed(1);
  }
  var blades = '';
  for (i = 0; i < 5; i++) blades += '<path transform="rotate(' + i * 72 + ' 150 110)" d="M150 98c4-26 22-40 42-38-2 20-18 34-38 40"/>';

  var DRAW = {
    altalanos: '<ellipse cx="150" cy="58" rx="44" ry="9"/><path d="M106 58v104a44 9 0 0 0 88 0V58"/><path class="t" d="M106 84a44 9 0 0 0 88 0M106 140a44 9 0 0 0 88 0M118 92v44M130 94v44M142 95v44M154 95v44M166 94v44M178 92v44"/><path class="a" d="M246 66c14 20 22 32 22 44a22 22 0 0 1-44 0c0-12 8-24 22-44z"/><path class="a t" d="M236 114a11 11 0 0 0 11 11"/><path d="M40 192l46-46M80 134l12 12M92 146a22 22 0 0 0 26-30l-12 12-10-2-2-10 12-12a22 22 0 0 0-30 26"/><path class="d" d="M106 200h88M106 194v12M194 194v12"/>',
    diagnosztika: '<rect x="70" y="30" width="180" height="128" rx="14"/><rect class="t" x="86" y="46" width="148" height="78" rx="4"/><path class="a" d="M92 94h20l8-26 12 46 10-34 8 14h14l8-12 10 18h12l8-6h24"/><circle cx="110" cy="142" r="6"/><circle cx="134" cy="142" r="6"/><rect class="t" x="186" y="136" width="46" height="12" rx="6"/><path d="M160 158v16c0 14 10 20 24 20h52"/><rect x="236" y="186" width="30" height="16" rx="3"/><path class="t" d="M242 192h18M242 197h18"/><path class="d" d="M56 30v128M50 30h12M50 158h12"/>',
    motor: '<path d="M120 36h80v64h-80z"/><path class="t" d="M120 50h80M120 58h80M120 66h80"/><circle cx="160" cy="84" r="8"/><path d="M152 92l-14 66M168 92l14 66"/><circle cx="160" cy="174" r="24"/><circle class="t" cx="160" cy="174" r="9"/><circle class="a" cx="160" cy="174" r="38" stroke-dasharray="4 7"/><path class="d" d="M222 36v64M216 36h12M216 100h12"/><path class="a t" d="M60 120h34M86 112l8 8-8 8"/>',
    vizsga: '<rect x="90" y="32" width="128" height="166" rx="10"/><rect x="126" y="22" width="56" height="22" rx="6"/><path class="a" d="M108 74l6 6 11-13M108 102l6 6 11-13M108 130l6 6 11-13"/><path class="t" d="M138 76h62M138 104h62M138 132h62M138 160h48"/><rect class="t" x="108" y="153" width="14" height="14" rx="3"/><circle cx="238" cy="148" r="24"/><path d="M255 165l22 22"/><path class="t" d="M226 142a13 13 0 0 1 12-9"/>',
    klima: '<circle cx="150" cy="110" r="70"/><circle class="t" cx="150" cy="110" r="78"/><circle cx="150" cy="110" r="12"/>' + blades + '<path class="a" d="M268 30v44M249 41l38 22M249 63l38-22"/><path class="a t" d="M236 130c18 0 28 10 50 10M236 152c18 0 28 10 50 10M236 174c18 0 28 10 50 10"/>',
    gumi: '<circle cx="140" cy="110" r="84"/><circle cx="140" cy="110" r="58"/><circle class="t" cx="140" cy="110" r="50"/><circle cx="140" cy="110" r="10"/><path class="t" d="' + tread + '"/><path d="' + spokes + '"/><path class="a" d="M262 38v144M250 182h24M262 58h18M262 82h11M262 106h18M262 130h11M262 154h18"/>'
  };

  var SERVICES = [
    { id: 'altalanos', name: 'Általános autószerviz', intro: 'A rendszeres karbantartás a legolcsóbb javítás. Gyári előírások szerint cseréljük az olajat és a szűrőket, és közben átnézzük, mire lesz szükség legközelebb.', items: ['Olajcsere', 'Időszakos karbantartás', 'Teljes körű javítás', 'Akkumulátorcsere', 'Vezérléscsere', 'Kipufogójavítás'] },
    { id: 'diagnosztika', name: 'Diagnosztika', intro: 'Hivatalos diagnosztikai eszközökkel olvassuk ki a hibakódokat, majd méréssel ellenőrizzük, mi áll valójában mögöttük.', items: ['Hibakód-kiolvasás', 'Motor- és járműdiagnosztika', 'Autóvillamossági hibakeresés', 'Fékhatásmérés', 'Lengéscsillapító-mérés'] },
    { id: 'motor', name: 'Motor és hajtáslánc', intro: 'Teljesítményvesztés, szokatlan hang, csúszó kuplung vagy eldugult részecskeszűrő: a javítást és a felújítást is vállaljuk.', items: ['Motorjavítás', 'Motorfelújítás', 'Kuplungjavítás és csere', 'Automata váltó olajcsere', 'Részecskeszűrő-tisztítás', 'Generátor- és önindító-felújítás'] },
    { id: 'vizsga', name: 'Műszaki vizsga', intro: 'Felkészítjük az autót a vizsgára, és a műszaki vizsgát, valamint az eredetvizsgát is intézzük. Használt autó vásárlása előtt állapotfelmérést készítünk.', items: ['Műszaki vizsgára felkészítés', 'Műszaki vizsga', 'Eredetvizsga', 'Használt autó vásárlás előtti állapotfelmérés'] },
    { id: 'klima', name: 'Klímaszerviz', intro: 'Ha a klíma gyengén hűt, vagy kellemetlen szagot áraszt: töltés, tisztítás, javítás és ózonos fertőtlenítés.', items: ['Klímatöltés', 'Klímatisztítás', 'Klímajavítás', 'Ózonos fertőtlenítés'] },
    { id: 'gumi', name: 'Gumi és futómű', intro: 'Szezonális gumicsere centrírozással, új abroncsok, gumihotel – és mindaz, ami a kerék mögött van: fék és lengéscsillapító.', items: ['Gumiszerelés', 'Centrírozás', 'Új abroncsok', 'Gumihotel', 'Fékrendszer javítása', 'Lengéscsillapító-csere', 'Szélvédőcsere'] }
  ];

  /* Diagnosztikai rétegek (az autó koordinátáiban) */
  var SYS = {
    motor: { label: 'MOTOR', hot: [190, 252], svg: '<path class="dr fillz glowline" d="M100 236h170l12 12v26H112l-12-12z"/><path class="dr" d="M124 236v-10h32v10M176 236v-10h32v10M228 236v-10h28v10"/><circle class="dr" cx="128" cy="256" r="9"/><path class="dr" d="M137 256h120"/>',
      title: 'Motor', lede: 'Teljesítményvesztés, szokatlan hang, rángatás vagy füst: először mérünk, aztán javítunk vagy felújítunk.', warn: 'Ha villog a motorhibajelző, kerülje a terhelést, és hívjon.',
      list: ['Motordiagnosztika és -javítás', 'Motorfelújítás', 'Vezérléscsere', 'Generátor- és önindító-felújítás'], svc: 'motor' },
    fek: { label: 'FÉKRENDSZER', hot: [282, 262], svg: '<circle class="dr fillz glowline" cx="230" cy="300" r="31"/><path class="dr glowline" d="M200 280a36 36 0 0 1 30-16"/><circle class="dr fillz" cx="760" cy="300" r="31"/><path class="dr" d="M730 280a36 36 0 0 1 30-16"/><path class="dr" d="M230 300L300 252L400 250L700 250L760 300"/>',
      title: 'Fékrendszer', lede: 'A fék állapotát nem érzésre ítéljük meg: fékhatásmérővel ellenőrizzük, és a mérés alapján javítunk.', warn: 'Csikorgás, rángatás vagy hosszabb fékút esetén ne halassza.',
      list: ['Fékjavítás', 'Fékhatásmérés', 'Műszaki vizsgára felkészítés'], svc: 'gumi' },
    futomu: { label: 'FUTÓMŰ', hot: [812, 244], svg: '<path class="dr glowline" d="M748 228l26 6-26 6 26 6-26 6 26 6-26 6"/><path class="dr glowline" d="M218 228l26 6-26 6 26 6-26 6 26 6-26 6"/><path class="dr" d="M760 300L680 296M230 300L320 296"/><path class="dr fillz" d="M740 214h40v12h-40zM210 214h40v12h-40z"/>',
      title: 'Futómű', lede: 'Kopogó futómű, bizonytalan úttartás, egyenetlen gumikopás? Lengéscsillapító-méréssel és átvizsgálással kezdünk.', warn: '',
      list: ['Lengéscsillapító-mérés és -csere', 'Gumiszerelés, centrírozás', 'Új abroncsok', 'Gumihotel'], svc: 'gumi' },
    klima: { label: 'KLÍMA', hot: [418, 216], svg: '<rect class="dr fillz" x="62" y="250" width="12" height="32" rx="2"/><path class="dr glowline" d="M74 262C160 262 250 270 300 252S360 222 384 218M74 274C170 276 270 280 320 262S372 232 392 228"/><rect class="dr fillz glowline" x="384" y="208" width="46" height="24" rx="4"/><circle class="dr" cx="104" cy="276" r="8"/>',
      title: 'Klíma', lede: 'Ha a klíma gyengén hűt vagy kellemetlen szagú, a rendszert töltjük, tisztítjuk, és szükség esetén ózonnal fertőtlenítjük.', warn: '',
      list: ['Klímatöltés', 'Klímatisztítás és -javítás', 'Ózonos fertőtlenítés'], svc: 'klima' },
    diag: { label: 'DIAGNOSZTIKA', hot: [452, 262], svg: '<rect class="dr fillz glowline" x="420" y="254" width="22" height="14" rx="3"/><path class="dr glowline" d="M420 261C360 262 300 250 190 240" stroke-dasharray="5 6"/><path class="dr" d="M442 261C520 262 600 256 900 222" stroke-dasharray="5 6"/><rect class="dr fillz" x="150" y="230" width="40" height="18" rx="3"/>',
      title: 'Diagnosztika', lede: 'Égő hibajelző esetén kiolvassuk a hibakódokat, és a kód mögött álló valódi okot keressük – a kód önmagában még nem diagnózis.', warn: '',
      list: ['Hibakód-kiolvasás', 'Járműdiagnosztika hivatalos eszközökkel', 'Autóvillamossági javítások'], svc: 'diagnosztika' }
  };
  var SYS_ORDER = ['motor', 'fek', 'futomu', 'klima', 'diag'];

  /* ===================== SEGÉDEK ===================== */
  function drawIn(root, opts) {
    if (!hasG()) return;
    opts = opts || {};
    var els = $$('path,circle,rect,ellipse,polyline', root).filter(function (el) { return !el.closest('.dims') && !el.classList.contains('d') && !el.hasAttribute('stroke-dasharray') && el.getTotalLength; });
    els.forEach(function (el) {
      var L = 0; try { L = el.getTotalLength(); } catch (e) { }
      if (!L) return;
      el.style.strokeDasharray = L + ' ' + L;
      el.style.strokeDashoffset = L;
    });
    gsap.to(els, { strokeDashoffset: 0, duration: opts.d || 1.1, ease: 'power2.inOut', stagger: opts.s || 0.012, delay: opts.delay || 0, onComplete: function () { els.forEach(function (el) { el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; }); } });
  }
  function svgEl(tag, attrs, html) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; }

  /* ===================== NYITVATARTÁS (élő, budapesti idő) =====================
     Rendes nyitvatartás: H–P 08:00–16:30. Ünnepnapokat nem kezel. */
  function openText() {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Budapest', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) { return null; }
    var wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday);
    if (wd < 0) return null;
    var t = (+parts.hour) * 60 + (+parts.minute), O = 480, C = 990, work = wd < 5;
    if (work && t >= O && t < C) {
      var left = C - t;
      return { open: true, txt: left <= 60 ? 'Most nyitva · még ' + left + ' percig' : 'Most nyitva · 16:30-ig' };
    }
    var when = (work && t < O) ? 'ma' : (wd >= 4 ? 'hétfőn' : 'holnap');
    return { open: false, txt: 'Most zárva · ' + when + ' 8:00-kor nyitunk' };
  }
  function paintOpen() {
    var s = openText();
    $$('[data-open]').forEach(function (el) {
      if (!s) { el.hidden = true; return; }
      el.textContent = s.txt; el.classList.toggle('is-open', s.open); el.classList.toggle('is-closed', !s.open);
    });
  }
  paintOpen(); setInterval(paintOpen, 60000);

  /* ===================== NAVIGÁCIÓ ===================== */
  var nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), mbar = $('#mbar'), hero = $('#fooldal');
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('solid', y > 40);
    mbar.classList.toggle('show', y > hero.offsetHeight * 0.55);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('solid', open || window.scrollY > 40);
    if (open && hasG()) gsap.from($$('#menu nav a, #menu .btn'), { y: 14, opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' });
    if (open) $('#menu nav a').focus();
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });
  desktop.addEventListener && desktop.addEventListener('change', function (m) { if (m.matches && !menu.hidden) setMenu(false); });

  var linkFor = { fooldal: 'fooldal', szolgaltatasok: 'szolgaltatasok', diagnosztika: 'szolgaltatasok', miert: 'miert', kapcsolat: 'kapcsolat' };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = linkFor[en.target.id];
        $$('.nav-links a').forEach(function (a) { a.classList.toggle('on', !!id && a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ===================== SZOLGÁLTATÁSOK ===================== */
  var idx = $('#svcIndex'), panel = $('#svcPanel'), acc = $('#svcAcc');
  function figHTML(s, n) { return '<div class="svc-fig"><span class="num">' + n + ' / 06</span><svg class="draw" viewBox="0 0 320 220" aria-hidden="true">' + DRAW[s.id] + '</svg></div>'; }
  function itemsHTML(s) { return '<ul class="svc-items">' + s.items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'; }
  function ctaHTML(s) { return '<a class="btn btn-glow" href="#idopont" data-pick="' + s.id + '">Időpontot kérek erre</a>'; }

  SERVICES.forEach(function (s, k) {
    var n = String(k + 1).padStart(2, '0');
    var li = document.createElement('li');
    li.setAttribute('role', 'presentation');
    li.innerHTML = '<button role="tab" id="tab-' + s.id + '" aria-selected="false" aria-controls="svcPanel" tabindex="-1"><span class="n">' + n + '</span><span class="t">' + s.name + '</span><span class="c">' + s.items.length + ' tétel</span></button>';
    idx.appendChild(li);
    var a = document.createElement('div');
    a.className = 'acc';
    a.innerHTML = '<h3><button class="acc-h" aria-expanded="false" aria-controls="acc-' + s.id + '"><span class="n">' + n + '</span><span class="t">' + s.name + '</span><span class="pm" aria-hidden="true"></span></button></h3>' +
      '<div class="acc-b" id="acc-' + s.id + '"><div>' + figHTML(s, n) + '<p class="intro">' + s.intro + '</p>' + itemsHTML(s) + ctaHTML(s) + '</div></div>';
    acc.appendChild(a);
  });
  var cur = -1;
  function showSvc(k, focus) {
    if (k === cur) return;
    cur = k;
    var s = SERVICES[k], n = String(k + 1).padStart(2, '0');
    $$('button', idx).forEach(function (b, j) { b.setAttribute('aria-selected', j === k); b.tabIndex = j === k ? 0 : -1; });
    panel.setAttribute('aria-labelledby', 'tab-' + s.id);
    panel.innerHTML = figHTML(s, n) + '<div class="svc-txt"><h3>' + s.name + '</h3><p class="intro">' + s.intro + '</p>' + itemsHTML(s) + ctaHTML(s) + '</div>';
    if (hasG()) {
      gsap.fromTo($('.svc-fig', panel), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power3.out' });
      gsap.from($$('.svc-txt > *, .svc-items li', panel), { y: 12, opacity: 0, duration: 0.5, stagger: 0.03, ease: 'power2.out', delay: 0.1 });
      drawIn($('.svc-fig svg', panel), { d: 0.9, s: 0.02, delay: 0.15 });
    }
    if (focus) $$('button', idx)[k].focus();
  }
  idx.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showSvc($$('button', idx).indexOf(b)); });
  idx.addEventListener('keydown', function (e) {
    var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (e.key === 'Home') { e.preventDefault(); showSvc(0, true); }
    else if (e.key === 'End') { e.preventDefault(); showSvc(SERVICES.length - 1, true); }
    else if (d) { e.preventDefault(); showSvc((cur + d + SERVICES.length) % SERVICES.length, true); }
  });
  showSvc(0);
  acc.addEventListener('click', function (e) {
    var h = e.target.closest('.acc-h'); if (!h) return;
    var box = h.closest('.acc'), open = !box.classList.contains('open');
    box.classList.toggle('open', open); h.setAttribute('aria-expanded', open);
    if (open) drawIn($('.svc-fig svg', box), { d: 0.9, s: 0.02, delay: 0.1 });
  });

  /* ===================== DIAGNOSZTIKA ===================== */
  var dsvg = $('#diagCar'), dtabs = $('#diagTabs'), dinfo = $('#diagInfo');
  var dcar = $('#car-shape').cloneNode(true); dcar.removeAttribute('id'); dsvg.appendChild(dcar);
  SYS_ORDER.forEach(function (k) { dsvg.appendChild(svgEl('g', { class: 'sys', 'data-k': k }, SYS[k].svg)); });
  SYS_ORDER.forEach(function (k) {
    var p = SYS[k].hot;
    var g = svgEl('g', { class: 'hot', 'data-k': k }, '<circle class="ring" cx="' + p[0] + '" cy="' + p[1] + '" r="9"/><circle class="core" cx="' + p[0] + '" cy="' + p[1] + '" r="7"/><circle class="hit" cx="' + p[0] + '" cy="' + p[1] + '" r="22"/>');
    dsvg.appendChild(g);
    var b = document.createElement('button');
    b.setAttribute('role', 'tab'); b.id = 'dt-' + k; b.setAttribute('aria-controls', 'diagInfo'); b.dataset.k = k;
    b.innerHTML = '<i aria-hidden="true"></i>' + SYS[k].label;
    dtabs.appendChild(b);
  });
  var dcur = null;
  function showSys(k, focus) {
    if (k === dcur) return; dcur = k;
    var s = SYS[k];
    $$('button', dtabs).forEach(function (b) { var on = b.dataset.k === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$('.sys', dsvg).forEach(function (g) { g.classList.toggle('on', g.dataset.k === k); });
    $$('.hot', dsvg).forEach(function (g) { g.classList.toggle('on', g.dataset.k === k); });
    dinfo.setAttribute('aria-labelledby', 'dt-' + k);
    dinfo.innerHTML = '<h3>' + s.title + '</h3><p class="lede">' + s.lede + '</p>' + (s.warn ? '<p class="warn">' + s.warn + '</p>' : '') +
      '<ul>' + s.list.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul><a class="btn btn-glow" href="#idopont" data-pick="' + s.svc + '">Időpontot kérek</a>';
    if (hasG()) {
      gsap.from($$('#diagInfo > *'), { y: 10, opacity: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out' });
      drawIn($('.sys[data-k="' + k + '"]', dsvg), { d: 0.8, s: 0.05 });
    }
  }
  dtabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showSys(b.dataset.k); });
  dtabs.addEventListener('keydown', function (e) {
    var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault(); var j = SYS_ORDER.indexOf(dcur); showSys(SYS_ORDER[(j + d + SYS_ORDER.length) % SYS_ORDER.length], true);
  });
  function tabEnd() { dtabs.classList.toggle('at-end', dtabs.scrollLeft + dtabs.clientWidth >= dtabs.scrollWidth - 4); }
  dtabs.addEventListener('scroll', tabEnd, { passive: true }); window.addEventListener('resize', tabEnd); tabEnd();
  dsvg.addEventListener('click', function (e) { var g = e.target.closest('.hot'); if (g) showSys(g.dataset.k); });
  showSys('motor');

  /* ===================== GOOGLE-VÉLEMÉNYEK =====================
     Kártyák a #reviewsData JSON-ból: [{ "name", "rating" (1–5), "date" (pl. "2026. október"), "text" (szó szerint), "url" (a Google-vélemény linkje) }].
     Csak hiánytalan, Google-linkes tétel jelenik meg; üres listánál a kártyasáv rejtve marad (az összesítő mindig látszik). */
  var STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.85 6.05 6.65.8-4.9 4.55 1.28 6.58L12 17.3l-5.88 3.28 1.28-6.58-4.9-4.55 6.65-.8z"/></svg>';
  var rvTrack = $('#revTrack'), rvWrap = $('#revCards'), REVIEWS = [];
  try { REVIEWS = JSON.parse(($('#reviewsData') || {}).textContent || '[]'); } catch (e) { REVIEWS = []; }
  REVIEWS = (Array.isArray(REVIEWS) ? REVIEWS : []).filter(function (r) {
    return r && r.name && r.text && r.rating >= 1 && r.rating <= 5 && /^https:\/\/(www\.google\.[a-z.]+\/maps|maps\.app\.goo\.gl\/|g\.co\/kgs\/)/.test(r.url || '');
  });
  if (rvTrack && REVIEWS.length) {
    var stars5 = STAR + STAR + STAR + STAR + STAR;
    REVIEWS.forEach(function (r) {
      var art = document.createElement('article'); art.className = 'rev-card';
      var st = document.createElement('span'); st.className = 'stars'; st.setAttribute('role', 'img');
      st.setAttribute('aria-label', String(r.rating).replace('.', ',') + ' csillag az 5-ből'); st.style.setProperty('--fill', (r.rating / 5 * 100) + '%');
      st.innerHTML = '<span class="stars-bg" aria-hidden="true">' + stars5 + '</span><span class="stars-fg" aria-hidden="true">' + stars5 + '</span>';
      var q = document.createElement('blockquote'); var qp = document.createElement('p'); qp.textContent = r.text; q.appendChild(qp);
      var ft = document.createElement('footer');
      var nm = document.createElement('strong'); nm.textContent = r.name; ft.appendChild(nm);
      if (r.date) { var dt = document.createElement('span'); dt.className = 'rev-date'; dt.textContent = r.date; ft.appendChild(dt); }
      var a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.className = 'rev-link';
      a.textContent = 'Google-vélemény';
      var hint = document.createElement('span'); hint.className = 'sr-only'; hint.textContent = ' – ' + r.name + ' (új lapon)'; a.appendChild(hint);
      ft.appendChild(a);
      art.appendChild(st); art.appendChild(q); art.appendChild(ft); rvTrack.appendChild(art);
    });
    rvWrap.hidden = false;
    var prev = $('#revPrev'), next = $('#revNext');
    var step = function () { var c = rvTrack.querySelector('.rev-card'); return c ? c.getBoundingClientRect().width + (parseFloat(getComputedStyle(rvTrack).columnGap) || 0) : rvTrack.clientWidth; };
    var navState = function () {
      var max = rvTrack.scrollWidth - rvTrack.clientWidth - 2;
      prev.disabled = rvTrack.scrollLeft <= 2; next.disabled = rvTrack.scrollLeft >= max;
      rvWrap.classList.toggle('no-nav', max <= 0);
    };
    prev.addEventListener('click', function () { rvTrack.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { rvTrack.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    rvTrack.addEventListener('scroll', navState, { passive: true });
    window.addEventListener('resize', navState);
    navState();
  }

  /* ===================== IDŐPONTKÉRÉS ===================== */
  var form = $('#bookForm'), chips = $('#svcChips'), done = $('#bookDone');
  SERVICES.concat([{ id: 'egyeb', name: 'Még nem tudom' }]).forEach(function (s) {
    chips.insertAdjacentHTML('beforeend', '<label class="chip"><input type="radio" name="service" value="' + s.name + '" data-id="' + s.id + '"><span>' + s.name + '</span></label>');
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-pick]'); if (!a) return;
    var r = $('input[data-id="' + a.dataset.pick + '"]', chips); if (r) { r.checked = true; clearErr('service'); }
  });
  var tried = false;
  var Y = new Date().getFullYear();
  var rules = {
    brand: function (v) { return v.trim().length >= 2 ? '' : 'Adja meg az autó márkáját.'; },
    model: function (v) { return v.trim().length >= 1 ? '' : 'Adja meg a típust.'; },
    year: function (v) { var n = +v; return /^\d{4}$/.test(v.trim()) && n >= 1950 && n <= Y + 1 ? '' : 'Négyjegyű évszám kell, 1950 és ' + (Y + 1) + ' között.'; },
    name: function (v) { return v.trim().length >= 2 ? '' : 'Adja meg a nevét.'; },
    phone: function (v) { var d = v.replace(/[^\d]/g, ''); return d.length >= 9 && d.length <= 13 && /^[+\d][\d\s()\/-]*$/.test(v.trim()) ? '' : 'Adjon meg egy hívható telefonszámot, pl. +36 20 123 4567.'; },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Az e-mail-cím formátuma nem jó (vagy hagyja üresen).'; }
  };
  function setErr(name, msg) {
    if (name === 'service') { $('.err[data-for="service"]').textContent = msg; return; }
    var inp = form.elements[name], f = inp.closest('.f'), em = $('.err', f);
    em.textContent = msg; f.classList.toggle('bad', !!msg);
    inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) { em.id = 'e-' + name; inp.setAttribute('aria-describedby', em.id); } else inp.removeAttribute('aria-describedby');
  }
  function clearErr(name) { setErr(name, ''); }
  function check() {
    var first = null, ok = true;
    var svc = form.elements.service.value;
    if (!svc) { setErr('service', 'Válassza ki, miben segítsünk (vagy: „Még nem tudom”).'); ok = false; first = first || $('input', chips); } else clearErr('service');
    Object.keys(rules).forEach(function (k) {
      var m = rules[k](form.elements[k].value); setErr(k, m);
      if (m) { ok = false; first = first || form.elements[k]; }
    });
    return { ok: ok, first: first };
  }
  form.addEventListener('input', function (e) { if (tried && rules[e.target.name]) setErr(e.target.name, rules[e.target.name](e.target.value)); if (e.target.name === 'service') clearErr('service'); });
  form.addEventListener('focusout', function (e) { if (tried && rules[e.target.name]) setErr(e.target.name, rules[e.target.name](e.target.value)); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); tried = true;
    var r = check();
    if (!r.ok) { r.first.focus(); if (hasG()) gsap.fromTo(form, { x: -5 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,.3)' }); return; }
    var v = function (k) { return form.elements[k].value.trim(); };
    var txt = 'Szolgáltatás: ' + v('service') + '\nAutó: ' + v('brand') + ' ' + v('model') + ' (' + v('year') + ')' +
      (v('desc') ? '\nTapasztalt probléma: ' + v('desc') : '') + '\n\nNév: ' + v('name') + '\nTelefon: ' + v('phone') + (v('email') ? '\nE-mail: ' + v('email') : '');
    $('#bookSummary').textContent = txt;
    $('#mailBtn').href = 'mailto:stabilterv@gmail.com?subject=' + encodeURIComponent('Időpontkérés – ' + v('brand') + ' ' + v('model')) +
      '&body=' + encodeURIComponent('Jó napot kívánok!\n\nIdőpontot szeretnék egyeztetni az alábbiak szerint:\n\n' + txt + '\n\nKöszönöm!');
    form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (hasG()) gsap.from($$('#bookDone > *'), { y: 14, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' });
  });
  $('#editBtn').addEventListener('click', function () { done.hidden = true; form.hidden = false; form.elements.brand.focus(); });

  /* ===================== TÉRKÉP (csak kattintásra – addig nincs Google-kérés, nincs süti) ===================== */
  var mapLoad = $('#mapLoad');
  if (mapLoad) mapLoad.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.title = 'Térkép: Gyálautó, 2360 Gyál, Vállalkozó utca 8.';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = mapLoad.getAttribute('data-src');
    var gate = $('#mapGate');
    gate.parentNode.insertBefore(f, gate); gate.remove();
    f.focus();
  });

  /* ===================== MOZGÁS ===================== */
  var flow = $('#flowSteps'), steps = $$('li', flow);
  function setFlow(p) {
    flow.style.setProperty('--prog', p.toFixed(3));
    steps.forEach(function (li, k) { li.classList.toggle('on', p >= k / (steps.length - 1) - 0.02); });
  }

  function motion() {
    if (!hasG()) { setFlow(1); return; }
    gsap.registerPlugin(ScrollTrigger);

    /* hero nyitány – a tartalom azonnal kattintható, csak a megjelenés finom */
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.nav .logo', { opacity: 0, y: -6, duration: 0.6 }, 0)
      .from('.nav .lg-light', { opacity: 0.1, duration: 0.45, ease: 'steps(3)' }, 0.5)
      .from('.nav .lg-word', { opacity: 0, x: -8, duration: 0.6 }, 0.15)
      .from('.hero-bg', { opacity: 0, duration: 1.2, ease: 'power1.out' }, 0)
      .from('.hero-mark', { opacity: 0, x: -12, duration: 0.6 }, 0.15)
      .from('.hero h1 .ln > span', { yPercent: 108, duration: 0.95, stagger: 0.12, ease: 'power4.out' }, 0.2)
      .from('.hero-sub, .hero-cta, .hero-phone', { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 }, 0.55)
      .from('.hero-facts li', { opacity: 0, y: 10, duration: 0.6, stagger: 0.1 }, 1.1)
      .from('#heroCar .dims', { opacity: 0, duration: 0.8 }, 1.6)
      .fromTo('#heroScan', { attr: { x: -40 }, opacity: 0 }, { attr: { x: 1000 }, opacity: 1, duration: 1.4, ease: 'power1.inOut' }, 1.7)
      .to('#heroScan', { opacity: 0, duration: 0.3 }, 2.9);
    drawIn($('#heroCar'), { d: 1.4, s: 0.01, delay: 0.25 });

    var mm = gsap.matchMedia();
    mm.add('(min-width: 961px)', function () {
      gsap.to('.hero-art', { yPercent: 8, scale: 1.04, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-copy', { y: -50, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero-grid', { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      /* egérre reagáló fénycsóva */
      var hc = $('#heroCursor'), h = $('.hero');
      var qx = gsap.quickTo(hc, 'x', { duration: 0.6, ease: 'power3' }), qy = gsap.quickTo(hc, 'y', { duration: 0.6, ease: 'power3' });
      function mv(e) { var r = h.getBoundingClientRect(); qx(e.clientX - r.left); qy(e.clientY - r.top); hc.style.opacity = 1; }
      function lv() { hc.style.opacity = 0; }
      h.addEventListener('mousemove', mv); h.addEventListener('mouseleave', lv);
      return function () { h.removeEventListener('mousemove', mv); h.removeEventListener('mouseleave', lv); };
    });

    /* szakaszonként egy-egy komponált belépő */
    gsap.from('.svc-panel', { clipPath: 'inset(0 0 0 100% round 18px)', duration: 1.1, ease: 'power3.inOut', scrollTrigger: { trigger: '.svc-body', start: 'top 78%' } });
    gsap.from('.svc-index li', { opacity: 0, x: -16, duration: 0.6, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: '.svc-body', start: 'top 78%' } });
    gsap.from('.diag-svg', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.diag-stage', start: 'top 80%', onEnter: function () { drawIn(dsvg, { d: 1.2, s: 0.006 }); } } });
    gsap.from('.why-list > div', { opacity: 0, y: 18, duration: 0.6, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: '.why-list', start: 'top 80%' } });
    gsap.from('.why-year', { opacity: 0, y: 18, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.why-year', start: 'top 88%' } });
    /* vélemények: csak transform + opacity (nincs layoutváltozás) */
    gsap.from('.rev-score, .rev-dist', { opacity: 0, y: 16, duration: 0.7, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '.rev-top', start: 'top 82%' } });
    gsap.from('.rev-dist .bar i', { scaleX: 0, transformOrigin: '0 50%', duration: 0.9, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.rev-dist', start: 'top 85%' } });
    gsap.from('.rev-score .stars-fg svg', { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.45, stagger: 0.07, ease: 'back.out(2)', scrollTrigger: { trigger: '.rev-top', start: 'top 82%' } });
    if (REVIEWS.length) gsap.from('.rev-card', { opacity: 0, y: 22, duration: 0.7, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '#revCards', start: 'top 85%' } });

    /* folyamat: görgetéssel töltődő vonal */
    ScrollTrigger.create({ trigger: flow, start: 'top 75%', end: 'bottom 55%', scrub: 0.4, onUpdate: function (st) { setFlow(st.progress); } });
    gsap.from('.final-in', { opacity: 0, y: 20, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: '.final', start: 'top 85%' } });
  }
  if (document.readyState === 'complete') motion(); else window.addEventListener('load', motion);
})();
