/* Tündérszem Optika — látványterv (DAEKON)
   Mozgás: GSAP + ScrollTrigger (helyben, js/), minden más natív. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- fejléc + menü ---------------- */
  var nav = $('#nav');
  var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var burger = $('.nav__burger');
  var menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var first = $('a', menu); if (first) first.focus(); }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 980 && !menu.hidden) setMenu(false); });

  /* aktív menüpont */
  var links = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['fooldal', 'rolunk', 'szolgaltatasok', 'szemuvegek', 'velemenyek', 'kapcsolat'].forEach(function (id) {
      var el = document.getElementById(id); if (el) secObs.observe(el);
    });
  }

  /* ---------------- hero: a lencse mögött minden éles ---------------- */
  var specimen = $('.specimen');
  var fitSpecimen = function () {
    if (!specimen) return;
    specimen.setAttribute('viewBox', window.innerWidth <= 980 ? '24 178 600 318' : '0 0 640 600');
  };
  fitSpecimen();
  window.addEventListener('resize', fitSpecimen);
  var frame = $('#frame'), clipR = $('#clipR'), clipL = $('#clipL'), artSharp = $('#artSharp'), hero = $('.hero'), svg = $('.specimen');
  if (frame && clipR && clipL && artSharp) {
    var CX = 320, CY = 330;
    var cur = { x: 0, y: 0, r: 0 }, tgt = { x: 0, y: 0, r: 0 };
    var running = false, heroVisible = true, start = performance.now(), scrollP = 0;

    var apply = function () {
      var x = CX + cur.x, y = CY + cur.y;
      var t = 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') rotate(' + cur.r.toFixed(3) + ')';
      frame.setAttribute('transform', t);
      clipR.setAttribute('transform', t + ' translate(124 0)');
      clipL.setAttribute('transform', t + ' translate(-124 0) scale(-1 1)');
      artSharp.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') scale(1.06) translate(' + (-x).toFixed(2) + ' ' + (-y).toFixed(2) + ')');
    };

    if (!reduce) {
      if (finePointer) {
        hero.addEventListener('pointermove', function (e) {
          var r = svg.getBoundingClientRect();
          var px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
          var py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
          tgt.x = px * 34; tgt.y = py * 22; tgt.r = px * 2.2;
        });
        hero.addEventListener('pointerleave', function () { tgt.x = 0; tgt.y = 0; tgt.r = 0; });
      }
      window.addEventListener('scroll', function () {
        var h = hero.offsetHeight || 1;
        scrollP = Math.max(0, Math.min(1, window.scrollY / h));
      }, { passive: true });

      var loop = function (now) {
        if (!heroVisible) { running = false; return; }
        var t = (now - start) / 1000;
        var idleY = Math.sin(t * 0.9) * 5;            // finom lebegés
        var idleX = finePointer ? 0 : Math.sin(t * 0.45) * 30; // érintőn lassan „körbenéz”
        var gx = tgt.x + idleX, gy = tgt.y + idleY - scrollP * 46, gr = tgt.r - scrollP * 3 + (finePointer ? 0 : Math.sin(t * 0.45) * 1.2);
        cur.x += (gx - cur.x) * 0.07; cur.y += (gy - cur.y) * 0.07; cur.r += (gr - cur.r) * 0.07;
        apply();
        requestAnimationFrame(loop);
      };
      var run = function () { if (!running) { running = true; requestAnimationFrame(loop); } };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; if (heroVisible) run(); }).observe(hero);
      }
      run();
    } else {
      apply();
    }
  }

  /* ---------------- vitrin ---------------- */
  var FRAMES = {
    noi: { src: 'img/keret-noi.svg', alt: 'Rajzolt női szemüvegkeret: macskaszem-forma', kicker: '01 · Női szemüvegek',
      text: 'Felfelé ívelő külső sarkok, finom színek és vékonyabb vonalak — a macskaszem-forma kiemeli a tekintetet.' },
    ferfi: { src: 'img/keret-ferfi.svg', alt: 'Rajzolt férfi szemüvegkeret: hangsúlyos felső peremmel', kicker: '02 · Férfi szemüvegek',
      text: 'Karakteres felső perem, nyugodt, egyenes vonalak. Irodába és hétvégére is jól működő formák.' },
    gyermek: { src: 'img/keret-gyermek.svg', alt: 'Rajzolt gyermek szemüvegkeret: lekerekített, vastagabb keret', kicker: '03 · Gyermek szemüvegek',
      text: 'Lekerekített, strapabíró keretek, amelyek bírják a mozgást, és jól ülnek a kisebb arcon is.' },
    klasszikus: { src: 'img/keret-klasszikus.svg', alt: 'Rajzolt klasszikus szemüvegkeret: kerek, vékony fém', kicker: '04 · Klasszikus keretek',
      text: 'Kerek és vékony fém keretek, időtálló formák, amelyek nem mennek ki a divatból.' },
    modern: { src: 'img/keret-modern.svg', alt: 'Rajzolt modern szemüvegkeret: geometrikus forma', kicker: '05 · Modern keretek',
      text: 'Geometrikus formák, bátrabb színek — annak, aki szeretné, hogy a szemüvege is mondjon valamit.' }
  };
  var tabs = $$('.tabs [role="tab"]');
  var stageFrame = $('#stageFrame'), stageKicker = $('#stageKicker'), stageText = $('#stageText'), stage = $('#stage');
  var tilt = $('.stage__tilt'), glass = $('.stage__glass');
  Object.keys(FRAMES).forEach(function (k) { var i = new Image(); i.src = FRAMES[k].src; });

  function selectTab(btn, focus) {
    tabs.forEach(function (b) {
      var on = b === btn;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    stage.setAttribute('aria-labelledby', btn.id);
    if (focus) btn.focus();
    if (btn.scrollIntoView && window.innerWidth < 760) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    var f = FRAMES[btn.dataset.frame];
    var swap = function () {
      stageFrame.src = f.src; stageFrame.alt = f.alt; stageKicker.textContent = f.kicker; stageText.textContent = f.text;
    };
    if (reduce || !window.gsap) { swap(); return; }
    gsap.timeline()
      .to(stageFrame, { rotationY: -70, opacity: 0, y: -10, duration: .32, ease: 'power2.in' })
      .to([stageKicker, stageText], { opacity: 0, y: 6, duration: .2 }, 0)
      .add(swap)
      .fromTo(stageFrame, { rotationY: 70, opacity: 0, y: -10 }, { rotationY: 0, opacity: 1, y: 0, duration: .7, ease: 'power3.out' })
      .to([stageKicker, stageText], { opacity: 1, y: 0, duration: .45, stagger: .06, ease: 'power2.out' }, '-=.5');
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { if (b.getAttribute('aria-selected') !== 'true') selectTab(b); });
    b.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });
  if (glass && !reduce && finePointer) {
    glass.addEventListener('pointermove', function (e) {
      var r = glass.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = 'rotateY(' + (x * 26).toFixed(2) + 'deg) rotateX(' + (-y * 14).toFixed(2) + 'deg) translateZ(20px)';
    });
    glass.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }

  /* ---------------- lásd a különbséget ---------------- */
  var cmp = $('#compare'), range = $('#compareRange');
  if (cmp && range) {
    var setPos = function (v) {
      v = Math.max(3, Math.min(97, v));
      cmp.style.setProperty('--pos', v + '%');
      range.value = Math.round(v);
      range.setAttribute('aria-valuetext', Math.round(v) + '% elmosódott');
    };
    var fromEvent = function (e) {
      var r = cmp.getBoundingClientRect();
      setPos(((e.clientX - r.left) / r.width) * 100);
    };
    var dragging = false, startX = 0, startY = 0, decided = false;
    cmp.addEventListener('pointerdown', function (e) {
      dragging = true; decided = e.pointerType === 'mouse'; startX = e.clientX; startY = e.clientY;
      if (decided) { cmp.setPointerCapture(e.pointerId); fromEvent(e); }
    });
    cmp.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (!decided) {
        var dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
        if (dx < 6 && dy < 6) return;
        if (dy > dx) { dragging = false; return; }       // függőleges görgetés: engedjük
        decided = true; cmp.setPointerCapture(e.pointerId);
      }
      fromEvent(e);
    });
    var end = function (e) {
      if (dragging && !decided && e.type === 'pointerup') fromEvent(e); // koppintás
      dragging = false;
    };
    cmp.addEventListener('pointerup', end);
    cmp.addEventListener('pointercancel', end);
    range.addEventListener('input', function () { setPos(+range.value); });
    setPos(50);

    if (!reduce && 'IntersectionObserver' in window) {
      var hinted = false;
      new IntersectionObserver(function (en, obs) {
        if (!en[0].isIntersecting || hinted) return;
        hinted = true; obs.disconnect();
        var o = { v: 50 };
        if (window.gsap) {
          gsap.timeline({ delay: .4 })
            .to(o, { v: 28, duration: .9, ease: 'power2.inOut', onUpdate: function () { if (!dragging) setPos(o.v); } })
            .to(o, { v: 66, duration: 1.1, ease: 'power2.inOut', onUpdate: function () { if (!dragging) setPos(o.v); } })
            .to(o, { v: 50, duration: .8, ease: 'power2.out', onUpdate: function () { if (!dragging) setPos(o.v); } });
        }
      }, { threshold: .55 }).observe(cmp);
    }
  }

  /* ---------------- vélemények ---------------- */
  var car = $('#carousel');
  $$('.reviews__nav .roundbtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = $('.review', car);
      var step = card ? card.getBoundingClientRect().width + 20 : 320;
      car.scrollBy({ left: step * (+b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------------- nyitvatartás ma ---------------- */
  (function () {
    var out = $('#hoursNow');
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Budapest', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
        .formatToParts(new Date());
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      var mins = (+get('hour') % 24) * 60 + (+get('minute'));
      var row = $('.hours tr[data-day="' + day + '"]');
      if (row) row.classList.add('today');
      var weekday = day >= 1 && day <= 5;
      var open = weekday && mins >= 540 && mins < 1020;
      if (open) out.innerHTML = '<span class="dot open"></span><b>Most nyitva</b> — ma 17:00-ig';
      else if (weekday && mins < 540) out.innerHTML = '<span class="dot"></span><b>Ma 9:00-kor nyitunk</b>';
      else out.innerHTML = '<span class="dot"></span><b>Most zárva</b> — ' + (day === 5 || day === 6 ? 'hétfőn' : 'holnap') + ' 9:00-kor nyitunk';
    } catch (e) { /* ha nincs Intl, a táblázat elég */ }
  })();

  /* ---------------- görgetéses belépők (GSAP) ---------------- */
  function splitWords(el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'w';
            o.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em';
            var i = document.createElement('span'); i.style.display = 'inline-block'; i.textContent = w;
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
    return $$('.w > span', el);
  }

  function initMotion() {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // hero bevezető — rövid, nem blokkol
    gsap.from('.hero__title .line > span', { yPercent: 108, duration: 1.1, ease: 'power4.out', stagger: .1, delay: .1 });
    gsap.from('[data-hero]', { y: 16, opacity: 0, duration: .9, ease: 'power3.out', stagger: .08, delay: .35 });
    gsap.from('.hero__hint', { opacity: 0, duration: .8, delay: 1.6 });

    $$('[data-split]').forEach(function (h) {
      var words = splitWords(h);
      gsap.from(words, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: .045,
        scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
    });
    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y: 26, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-plate]').forEach(function (el, i) {
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut', delay: i * .15,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }, clearProps: 'clipPath' });
      gsap.from($('img', el), { scale: 1.12, duration: 1.6, ease: 'power3.out', delay: i * .15,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    gsap.to('.story__sprig', { yPercent: -28, rotation: 6, ease: 'none',
      scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.sheet--photo', { yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });

    ScrollTrigger.batch('[data-card]', {
      start: 'top 90%', once: true,
      onEnter: function (els) { gsap.from(els, { y: 48, opacity: 0, duration: 1.05, ease: 'power3.out', stagger: .12 }); }
    });
    $$('[data-value]').forEach(function (li) {
      gsap.from(li, { opacity: 0, x: 24, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 88%', once: true } });
    });
    gsap.from('.review', { y: 30, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out',
      scrollTrigger: { trigger: '#carousel', start: 'top 88%', once: true } });
    gsap.to('.stage__sprig', { yPercent: 14, rotation: 14, ease: 'none',
      scrollTrigger: { trigger: '.vitrin', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  initMotion();
})();
