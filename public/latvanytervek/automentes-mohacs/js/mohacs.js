/* NON-STOP AUTÓMENTÉS MOHÁCS — interakciók. Külső függőség nincs. */
(function () {
  'use strict';
  var d = document, w = window;
  d.documentElement.classList.add('js');
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---- Ügyeleti óra (budapesti idő) ---- */
  var ora = $('#ora');
  function tick() {
    if (!ora) return;
    try {
      ora.textContent = new Intl.DateTimeFormat('hu-HU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Budapest' }).format(new Date());
    } catch (e) { ora.textContent = '0–24'; }
  }
  tick(); setInterval(tick, 20000);

  /* ---- Fejléc + mobil hívássáv ---- */
  var hdr = $('#fejlec'), dock = $('.dock'), hero = $('.hero'), contact = $('#kapcsolat');
  var contactVisible = false;
  function onScroll() {
    var y = w.scrollY;
    if (hdr) hdr.classList.toggle('is-stuck', y > 10);
    if (dock && hero) {
      var past = y > hero.offsetHeight * 0.55;
      dock.classList.toggle('is-on', past && !contactVisible);
    }
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if ('IntersectionObserver' in w && contact) {
    new IntersectionObserver(function (en) {
      contactVisible = en[0].isIntersecting; onScroll();
    }, { threshold: 0.25 }).observe(contact);
  }

  /* ---- Mobil menü ---- */
  var burger = $('#burger'), menu = $('#mobilmenu');
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    d.body.classList.remove('menu-open');
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 300);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') return closeMenu();
      menu.hidden = false; void menu.offsetWidth;
      menu.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      d.body.classList.add('menu-open');
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    w.addEventListener('resize', function () { if (w.innerWidth >= 1080) closeMenu(); });
  }

  /* ---- Hero: a mentő begördül, majd megáll ---- */
  var truck = $('#truck');
  if (truck && hero && !reduce && truck.animate) {
    hero.classList.add('is-arriving');
    truck.classList.add('is-driving');
    var anim = truck.animate(
      [{ transform: 'translateX(-70vw)' }, { transform: 'translateX(1.5%)', offset: .82 }, { transform: 'translateX(0)' }],
      { duration: 1700, easing: 'cubic-bezier(.16,.8,.25,1)', fill: 'both' }
    );
    setTimeout(function () { hero.classList.remove('is-arriving'); }, 1100);
    anim.onfinish = function () { truck.classList.remove('is-driving'); };
  }

  /* ---- Megjelenés görgetésre ---- */
  var revs = $$('[data-reveal]');
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sibs = $$('[data-reveal]', el.parentNode);
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 70 + 'ms';
        el.classList.add('in'); io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revs.forEach(function (el) { io.observe(el); });
  } else { revs.forEach(function (el) { el.classList.add('in'); }); }

  var steps = $('#steps');
  if (steps && 'IntersectionObserver' in w) {
    var so = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { steps.classList.add('is-in'); so.disconnect(); }
    }, { threshold: 0.3 });
    so.observe(steps);
  } else if (steps) steps.classList.add('is-in');

  /* ---- Galéria: az ügyfél saját képei a jelenlegi oldaláról ---- */
  var gal = $('#galeria'), fb = $('#gal-fallback');
  if (gal) {
    var base = gal.getAttribute('data-src'), n = +gal.getAttribute('data-count') || 0;
    var loaded = [], pending = n;
    function done() {
      if (--pending > 0) return;
      if (!loaded.length) { gal.hidden = true; if (fb) fb.hidden = false; }
    }
    function startGal() {
    for (var i = 1; i <= n; i++) {
      (function (i) {
        var src = base + (i < 10 ? '0' + i : i) + '.webp';
        var btn = d.createElement('button');
        btn.className = 'gal__item'; btn.type = 'button';
        btn.setAttribute('aria-label', 'Referenciakép ' + i + ' nagyítása');
        var img = new Image();
        img.decoding = 'async';
        img.alt = 'Non-Stop Autómentés Mohács – referenciakép ' + i;
        btn.dataset.i = i;
        img.onload = function () {
          loaded.push(src); btn.dataset.src = src;
          var after = $$('.gal__item', gal).filter(function (b) { return +b.dataset.i > i; })[0];
          gal.insertBefore(btn, after || null); done();
        };
        img.onerror = function () { done(); };
        img.src = src;
        btn.appendChild(img);
        btn.addEventListener('click', function () { openLb(src); });
      })(i);
    }
    }
    if ('IntersectionObserver' in w) {
      var go = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { go.disconnect(); startGal(); }
      }, { rootMargin: '600px 0px' });
      go.observe(gal);
    } else startGal();
    if (!n && fb) { gal.hidden = true; fb.hidden = false; }
  }

  /* ---- Nagyító ---- */
  var lb, lbImg, cur = 0;
  function list() { return $$('.gal__item').slice(0, 9).map(function (b) { return b.dataset.src; }).filter(Boolean); }
  function openLb(src) {
    if (!lb) {
      lb = d.createElement('div'); lb.className = 'lb'; lb.hidden = true;
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Képnézegető');
      lb.innerHTML = '<img alt=""><button class="lb__x" aria-label="Bezárás">×</button><button class="lb__p" aria-label="Előző kép">‹</button><button class="lb__n" aria-label="Következő kép">›</button>';
      d.body.appendChild(lb); lbImg = $('img', lb);
      $('.lb__x', lb).onclick = closeLb;
      $('.lb__p', lb).onclick = function () { step(-1); };
      $('.lb__n', lb).onclick = function () { step(1); };
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
      d.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      });
    }
    var l = list(); cur = Math.max(0, l.indexOf(src));
    lbImg.src = src; lbImg.alt = 'Referenciakép ' + (cur + 1);
    lb.hidden = false; d.body.classList.add('menu-open'); $('.lb__x', lb).focus();
  }
  function step(dir) { var l = list(); if (!l.length) return; cur = (cur + dir + l.length) % l.length; lbImg.src = l[cur]; }
  function closeLb() { lb.hidden = true; d.body.classList.remove('menu-open'); }
})();
