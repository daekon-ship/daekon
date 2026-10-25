/* ==========================================================================
   BB site — közös viselkedés minden oldalon
   ========================================================================== */
(function () {
  'use strict';
  var BB = window.BB, T = BB.t, esc = T.esc;
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.remove('no-js');

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function icon(id, cls) { return '<svg class="ico ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  /* ---------- óralap (időtartam) ---------- */
  function dial(mins, size) {
    if (mins == null) return '<span class="dial' + (size ? ' dial--' + size : '') + '" aria-hidden="true"><svg viewBox="0 0 44 44"><circle class="dial-bg" cx="22" cy="22" r="19" fill="none" stroke-width="1" stroke-dasharray="2 3"/></svg><b>?</b></span>';
    var c = 2 * Math.PI * 19, frac = Math.min(mins / 120, 1);
    return '<span class="dial' + (size ? ' dial--' + size : '') + '" aria-hidden="true"><svg viewBox="0 0 44 44">' +
      '<circle class="dial-bg" cx="22" cy="22" r="19" fill="none" stroke-width="1"/>' +
      '<circle class="dial-fg" cx="22" cy="22" r="19" fill="none" stroke-width="2" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - frac)).toFixed(2) + '" data-off="' + (c * (1 - frac)).toFixed(2) + '"/>' +
      '</svg><b>' + mins + '′</b></span>';
  }
  window.BBUI = { dial: dial, icon: icon };

  /* ---------- konfigurációs adatok bekötése ---------- */
  function bindConfig() {
    var C = BB.cfg, loc = BB.location();
    var map = {
      'phone': C.phone.display,
      'name': C.brand.name,
      'studio': C.brand.studio,
      'addr-label': loc.label,
      'addr-line1': loc.line1,
      'addr-line2': loc.line2,
      'addr-full': loc.line2 + ', ' + loc.line1,
      'addr-source': loc.source,
      'opening': C.openingNote
    };
    $$('[data-bind]').forEach(function (el) { var k = el.getAttribute('data-bind'); if (map[k] != null) el.textContent = map[k]; });
    $$('[data-tel]').forEach(function (el) { el.setAttribute('href', 'tel:' + C.phone.tel); });
    $$('[data-addr-status]').forEach(function (el) { el.hidden = !!loc.confirmed; });
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- fejléc, menük ---------- */
  function header() {
    var hdr = $('.hdr');
    if (hdr) {
      var onS = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
      onS(); window.addEventListener('scroll', onS, { passive: true });
    }
    /* asztali legördülő */
    $$('.nav-dd').forEach(function (dd) {
      var btn = $('.nav-dd-btn', dd), panel = $('.nav-dd-panel', dd), timer;
      function set(open) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); panel.classList.toggle('is-open', open); }
      btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
      dd.addEventListener('mouseenter', function () { clearTimeout(timer); set(true); });
      dd.addEventListener('mouseleave', function () { timer = setTimeout(function () { set(false); }, 180); });
      dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) set(false); });
      dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
    });
    /* mobilmenü */
    var burger = $('.burger'), mnav = $('#mnav'), mbar = $('.mbar');
    if (burger && mnav) {
      var setM = function (open) {
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
        mnav.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (mbar) mbar.classList.toggle('is-hidden', open);
        if (open) { var f = $('a, button', mnav); if (f) f.focus(); }
      };
      burger.addEventListener('click', function () { setM(burger.getAttribute('aria-expanded') !== 'true'); });
      mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setM(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav.classList.contains('is-open')) { setM(false); burger.focus(); } });
      window.addEventListener('resize', function () { if (window.innerWidth > 1080 && mnav.classList.contains('is-open')) setM(false); });
    }
  }

  /* ---------- megjelenési animációk ---------- */
  function reveals() {
    var els = $$('.rv, .rv-img');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    /* A clip-pathtal teljesen kitakart elemet az IntersectionObserver nem látja,
       ezért a .rv-img elemeknél a szülőt figyeljük. */
    var groups = new Map();
    els.forEach(function (e) {
      var target = e.classList.contains('rv-img') ? e.parentElement : e;
      if (!groups.has(target)) groups.set(target, []);
      groups.get(target).push(e);
    });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        (groups.get(en.target) || []).forEach(function (el) {
          el.classList.add('is-in');
          $$('.dial-fg', el).forEach(function (c) { c.style.strokeDashoffset = c.getAttribute('data-off'); });
        });
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    groups.forEach(function (_, target) { io.observe(target); });
    /* óralapok: 0-ról indulnak */
    $$('.rv .dial-fg').forEach(function (c) { c.style.strokeDashoffset = (2 * Math.PI * 19).toFixed(2); });
  }

  /* ---------- árlista ---------- */
  function catName(id) { var c = BB.cfg.categories.filter(function (x) { return x.id === id; })[0]; return c ? c.name : ''; }
  function bookHref(s) { return 'foglalas.html?kezeles=' + encodeURIComponent(s.id); }
  function bookBtn(s, cls) {
    if (s.phoneOnly || !s.bookable) return '<a class="btn btn--ghost btn--sm ' + (cls || '') + '" data-tel href="tel:' + BB.cfg.phone.tel + '">' + icon('phone') + 'Telefonos egyeztetés</a>';
    return '<a class="btn btn--sm ' + (cls || 'btn--ghost') + '" href="' + bookHref(s) + '">Időpontot foglalok</a>';
  }
  function priceHtml(s) {
    return esc(T.fmtPrice(s)) + (s.priceNote ? '<small>' + esc(s.priceNote) + '</small>' : '') + (s.price == null ? '<small>Ár és időtartam egyeztetés után</small>' : '');
  }

  function priceList() {
    var host = $('#priceList'); if (!host) return;
    var svcs = BB.activeServices();
    host.innerHTML = svcs.map(function (s) {
      return '<div class="price-row rv" data-cat="' + s.cat + '">' + dial(s.mins) +
        '<div><span class="cat-name">' + esc(catName(s.cat)) + '</span><h3>' + esc(s.name) + '</h3></div>' +
        '<p>' + esc(s.desc) + ' <span class="sr-only">Időtartam: ' + esc(T.fmtMins(s.mins)) + '.</span></p>' +
        '<div class="price">' + priceHtml(s) + '</div>' +
        '<div class="row-act">' + bookBtn(s) + '</div></div>';
    }).join('');
    var chips = $$('#priceChips .chip');
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        var f = ch.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'); });
        $$('.price-row', host).forEach(function (r) { r.classList.toggle('is-hidden', f !== 'all' && r.getAttribute('data-cat') !== f); });
        var live = $('#priceLive'); if (live) live.textContent = $$('.price-row:not(.is-hidden)', host).length + ' kezelés látható';
      });
    });
  }

  function catLists() {
    $$('[data-cat-list]').forEach(function (ul) {
      var cat = ul.getAttribute('data-cat-list');
      ul.innerHTML = BB.activeServices().filter(function (s) { return s.cat === cat; }).map(function (s) {
        return '<li><span>' + esc(s.name) + '</span><span>' + (s.mins ? s.mins + ' perc · ' : '') + esc(T.fmtPrice(s)) + '</span></li>';
      }).join('');
    });
  }

  function svcCards() {
    $$('[data-svc-cards]').forEach(function (host) {
      var cat = host.getAttribute('data-svc-cards'), tones = ['light', 'cream', 'sage', 'light'];
      host.innerHTML = BB.activeServices().filter(function (s) { return s.cat === cat; }).map(function (s, i) {
        return '<article class="svc-card rv" style="--d:' + (i * .06) + 's" id="' + s.id + '">' +
          '<div class="frame zoomable" data-art="' + s.art + '" data-tone="' + tones[i % 4] + '"></div>' +
          '<div class="svc-card-body"><h3>' + esc(s.name) + '</h3><p>' + esc(s.desc) + '</p>' +
          '<div class="svc-meta">' + dial(s.mins) + '<span class="small muted">' + esc(T.fmtMins(s.mins)) + '</span><span class="price">' + priceHtml(s) + '</span></div>' +
          bookBtn(s, ' ') + '</div></article>';
      }).join('');
      window.BBArt && window.BBArt.mount(host);
    });
  }

  function heroChip() {
    var a = $('[data-hero-chip]'); if (!a) return;
    var s = BB.service(a.getAttribute('data-hero-chip')); if (!s) return;
    a.href = bookHref(s);
    a.innerHTML = dial(s.mins) + '<span><b>' + esc(s.name) + '</b><span>' + s.mins + ' perc · ' + esc(T.fmtPrice(s)) + '</span></span>';
  }

  /* ---------- galéria + nagyító ---------- */
  var GALLERY = [
    { art: 'labfurdo', tone: 'light', cat: 'pedikur', title: 'Lábfürdő előkészítve' },
    { art: 'lakk', tone: 'dark', cat: 'gellakk', title: 'Árnyalatok' },
    { art: 'torolkozo', tone: 'cream', cat: 'szalon', title: 'Friss törölközők' },
    { art: 'kezpihi', tone: 'light', cat: 'manikur', title: 'Kézápolás' },
    { art: 'eszkoz', tone: 'sage', cat: 'szalon', title: 'Lezárt eszközök' },
    { art: 'paraffin', tone: 'cream', cat: 'manikur', title: 'Paraffinos pakolás' },
    { art: 'ko', tone: 'sage', cat: 'pedikur', title: 'Nyugalom' },
    { art: 'lakk', tone: 'light', cat: 'gellakk', title: 'Géllakk' },
    { art: 'torolkozo', tone: 'dark', cat: 'szalon', title: 'Részletek' }
  ];
  var GCATS = { pedikur: 'Pedikűr', manikur: 'Manikűr', gellakk: 'Géllakk', szalon: 'Szalon' };

  function gallery() {
    var host = $('#gallery'); if (!host) return;
    host.innerHTML = GALLERY.map(function (g, i) {
      return '<button type="button" class="g-item rv-img" style="--d:' + (i % 3 * .08) + 's" data-i="' + i + '" data-cat="' + g.cat + '" aria-label="' + esc(g.title) + ' — illusztráció megnyitása nagyítva">' +
        '<span class="frame zoomable" data-art="' + g.art + '" data-tone="' + g.tone + '"></span>' +
        '<span class="g-cap"><span><b>' + esc(g.title) + '</b><br>' + GCATS[g.cat] + '</span><span>Illusztráció</span></span></button>';
    }).join('');
    window.BBArt && window.BBArt.mount(host);

    var chips = $$('#galleryChips .chip');
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        var f = ch.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'); });
        host.classList.toggle('is-filtered', f !== 'all');
        $$('.g-item', host).forEach(function (g) { var on = f === 'all' || g.getAttribute('data-cat') === f; g.classList.toggle('is-hidden', !on); if (on) g.classList.add('is-in'); });
      });
    });

    var lb = $('#lightbox'), stage = $('.lb-stage', lb), cap = $('.lb-cap', lb), cnt = $('.lb-count', lb), idx = 0, lastFocus;
    function visible() { return $$('.g-item:not(.is-hidden)', host).map(function (b) { return +b.getAttribute('data-i'); }); }
    function show(i) {
      var v = visible(); if (!v.length) return;
      var pos = v.indexOf(i); if (pos < 0) pos = 0; idx = v[pos];
      var g = GALLERY[idx];
      stage.innerHTML = '<div class="frame" data-art="' + g.art + '" data-tone="' + g.tone + '"></div>';
      window.BBArt.mount(stage);
      cap.innerHTML = '<b>' + esc(g.title) + '</b><span>' + GCATS[g.cat] + ' · programból rajzolt illusztráció, nem Beatrix munkája — saját fotóval cserélendő</span>';
      cnt.textContent = (pos + 1) + ' / ' + v.length;
    }
    function step(d) { var v = visible(), p = v.indexOf(idx); show(v[(p + d + v.length) % v.length]); }
    function open(i) {
      lastFocus = document.activeElement; show(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; $('.lb-close', lb).focus();
      if (lb.requestFullscreen && window.innerWidth < 700) { /* mobilon nem kérünk teljes képernyőt automatikusan */ }
    }
    function close() {
      lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
      if (document.fullscreenElement) document.exitFullscreen().catch(function () { });
      if (lastFocus) lastFocus.focus();
    }
    host.addEventListener('click', function (e) { var b = e.target.closest('.g-item'); if (b) open(+b.getAttribute('data-i')); });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { step(-1); });
    $('.lb-next', lb).addEventListener('click', function () { step(1); });
    var fs = $('.lb-fs', lb);
    if (fs) {
      if (!lb.requestFullscreen) fs.hidden = true;
      fs.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen(); else lb.requestFullscreen().catch(function () { });
      });
    }
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') { /* fókusz bent tartása */
        var f = $$('button:not([hidden])', lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var sx = null;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); sx = null; });
  }

  /* ---------- finom oldalváltás ---------- */
  function transitions() {
    if (reduce) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
      var href = a.getAttribute('href') || '';
      if (!/\.html(\?|#|$)/.test(href) || /^(https?:|tel:|mailto:)/.test(href)) return;
      var url = new URL(href, location.href);
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault(); document.body.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 200);
    });
    window.addEventListener('pageshow', function () { document.body.classList.remove('is-leaving'); });
  }

  function init() {
    bindConfig(); header(); priceList(); catLists(); svcCards(); heroChip(); gallery(); reveals(); transitions();
    requestAnimationFrame(function () { doc.classList.add('is-loaded'); });
  }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('bb:change', bindConfig);
})();
