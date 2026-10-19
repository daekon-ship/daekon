/* Tündérszem Optika — látványterv (DAEKON), 2. kör
   Mozgás: GSAP + ScrollTrigger (helyben, js/), minden más natív. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- menü ---------------- */
  var burger = $('.nav__burger');
  var menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    if (open) menu.style.top = Math.max(0, $('#nav').getBoundingClientRect().bottom) + 'px';
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var first = $('a', menu); if (first) first.focus(); }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !menu.hidden) setMenu(false); });

  /* aktív menüpont */
  var links = $$('.nav__side a:not(.btn)');
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
    if (specimen) specimen.setAttribute('viewBox', window.innerWidth <= 980 ? '-18 80 676 420' : '0 0 640 600');
  };
  fitSpecimen();
  window.addEventListener('resize', fitSpecimen);

  var frame = $('#frame'), clipR = $('#clipR'), clipL = $('#clipL'), artSharp = $('#artSharp'), hero = $('.hero');
  var shadow = $('#shadow'), c1 = $('#caustic1'), c2 = $('#caustic2');
  if (frame && clipR && clipL && artSharp) {
    var CX = 320, CY = 300;
    var cur = { x: 0, y: 0, r: 0 }, tgt = { x: 0, y: 0, r: 0 };
    var running = false, heroVisible = true, start = performance.now(), scrollP = 0;

    var apply = function () {
      var x = CX + cur.x, y = CY + cur.y;
      var t = 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') rotate(' + cur.r.toFixed(3) + ')';
      frame.setAttribute('transform', t);
      clipR.setAttribute('transform', t + ' translate(124 0)');
      clipL.setAttribute('transform', t + ' translate(-124 0) scale(-1 1)');
      artSharp.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') scale(1.07) translate(' + (-x).toFixed(2) + ' ' + (-y).toFixed(2) + ')');
      // árnyék: magasabb lebegésnél halványabb és szélesebb
      var lift = Math.max(0, -cur.y);
      if (shadow) {
        shadow.setAttribute('cx', x.toFixed(1));
        shadow.setAttribute('rx', (230 + lift * 1.2).toFixed(1));
        shadow.style.opacity = (0.16 - lift * 0.0016).toFixed(3);
      }
      if (c1) c1.setAttribute('cx', (x - 120).toFixed(1));
      if (c2) c2.setAttribute('cx', (x + 124).toFixed(1));
    };

    if (!reduce) {
      if (finePointer) {
        hero.addEventListener('pointermove', function (e) {
          var r = specimen.getBoundingClientRect();
          var px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
          var py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
          tgt.x = px * 34; tgt.y = py * 22; tgt.r = px * 2;
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
        var idleY = Math.sin(t * 0.85) * 5 - 3;
        var idleX = finePointer ? 0 : Math.sin(t * 0.42) * 28;
        var gx = tgt.x + idleX, gy = tgt.y + idleY - scrollP * 40, gr = tgt.r - scrollP * 2.5 + (finePointer ? 0 : Math.sin(t * 0.42) * 1.1);
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

  /* ---------------- szolgáltatás-index ---------------- */
  var rows = $$('.row'), previews = $$('.index__frame img'), cap = $('#indexCap');
  function setRow(i) {
    rows.forEach(function (r, k) { r.classList.toggle('is-on', k === i); });
    previews.forEach(function (p, k) { p.classList.toggle('is-on', k === i); });
    if (cap) cap.innerHTML = '<span>Pl. ' + ('0' + (i + 1)).slice(-2) + '</span>' + rows[i].dataset.name;
  }
  rows.forEach(function (r, i) {
    r.addEventListener('mouseenter', function () { setRow(i); });
    r.addEventListener('focusin', function () { setRow(i); });
  });
  if (rows.length) setRow(0);

  /* ---------------- vitrin ---------------- */
  var FRAMES = {
    noi: { src: 'img/keret-noi.svg', alt: 'Rajzolt női szemüvegkeret: füstös levendula acetát, macskaszem-forma', kicker: 'Női szemüvegek',
      text: 'Felfelé ívelő külső sarkok, finom színek és vékonyabb vonalak — a macskaszem-forma kiemeli a tekintetet.' },
    ferfi: { src: 'img/keret-ferfi.svg', alt: 'Rajzolt férfi szemüvegkeret: grafit szemöldökperem, vékony fém alsó perem', kicker: 'Férfi szemüvegek',
      text: 'Karakteres felső perem, nyugodt, egyenes vonalak. Irodába és hétvégére is jól működő formák.' },
    gyermek: { src: 'img/keret-gyermek.svg', alt: 'Rajzolt gyermek szemüvegkeret: lekerekített, ködkék acetát', kicker: 'Gyermek szemüvegek',
      text: 'Lekerekített, strapabíró keretek, amelyek bírják a mozgást, és jól ülnek a kisebb arcon is.' },
    klasszikus: { src: 'img/keret-klasszikus.svg', alt: 'Rajzolt klasszikus szemüvegkeret: kerek, vékony arany fém', kicker: 'Klasszikus keretek',
      text: 'Kerek és vékony fém keretek, időtálló formák, amelyek nem mennek ki a divatból.' },
    modern: { src: 'img/keret-modern.svg', alt: 'Rajzolt modern szemüvegkeret: geometrikus, púder acetát', kicker: 'Modern keretek',
      text: 'Geometrikus formák, bátrabb színek — annak, aki szeretné, hogy a szemüvege is mondjon valamit.' }
  };
  var tabs = $$('.tabs [role="tab"]');
  var stageFrame = $('#stageFrame'), stageReflect = $('#stageReflect'), stageKicker = $('#stageKicker'), stageText = $('#stageText'),
    stageNo = $('#stageNo'), stage = $('#stage');
  var tilt = $('.stage__tilt');
  Object.keys(FRAMES).forEach(function (k) { var i = new Image(); i.src = FRAMES[k].src; });

  function selectTab(btn, focus) {
    var idx = tabs.indexOf(btn);
    tabs.forEach(function (b) {
      var on = b === btn;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    stage.setAttribute('aria-labelledby', btn.id);
    if (focus) btn.focus();
    if (window.innerWidth < 760 && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    var fr = FRAMES[btn.dataset.frame];
    var swap = function () {
      stageFrame.src = fr.src; stageFrame.alt = fr.alt; stageReflect.src = fr.src;
      stageKicker.textContent = fr.kicker; stageText.textContent = fr.text;
      stageNo.textContent = ('0' + (idx + 1)).slice(-2);
    };
    if (reduce || !window.gsap) { swap(); return; }
    gsap.timeline()
      .to([stageFrame, stageReflect], { opacity: 0, x: -40, duration: .35, ease: 'power2.in' })
      .to([stageKicker, stageText], { opacity: 0, y: 6, duration: .25 }, 0)
      .add(swap)
      .fromTo(stageFrame, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: .8, ease: 'power3.out' })
      .fromTo(stageReflect, { opacity: 0, x: 40 }, { opacity: .16, x: 0, duration: .8, ease: 'power3.out' }, '<')
      .to([stageKicker, stageText], { opacity: 1, y: 0, duration: .5, stagger: .07, ease: 'power2.out' }, '-=.55');
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { if (b.getAttribute('aria-selected') !== 'true') selectTab(b); });
    b.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') n = tabs[0];
      if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });
  $$('.stage__nav [data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var cur = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
      selectTab(tabs[(cur + (+b.dataset.step) + tabs.length) % tabs.length]);
    });
  });
  if (stage && !reduce && finePointer) {
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = 'rotateY(' + (x * 22).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg)';
    });
    stage.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }

  /* ---------------- lásd a különbséget ---------------- */
  var cmp = $('#compare'), range = $('#compareRange');
  if (cmp && range) {
    var dragging = false, startX = 0, startY = 0, decided = false;
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
    cmp.addEventListener('pointerdown', function (e) {
      dragging = true; decided = e.pointerType === 'mouse'; startX = e.clientX; startY = e.clientY;
      if (decided) { cmp.setPointerCapture(e.pointerId); fromEvent(e); }
    });
    cmp.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (!decided) {
        var dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
        if (dx < 6 && dy < 6) return;
        if (dy > dx) { dragging = false; return; }
        decided = true; cmp.setPointerCapture(e.pointerId);
      }
      fromEvent(e);
    });
    var end = function (e) {
      if (dragging && !decided && e.type === 'pointerup') fromEvent(e);
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
          var up = function () { if (!dragging) setPos(o.v); };
          gsap.timeline({ delay: .4 })
            .to(o, { v: 30, duration: .9, ease: 'power2.inOut', onUpdate: up })
            .to(o, { v: 64, duration: 1.1, ease: 'power2.inOut', onUpdate: up })
            .to(o, { v: 50, duration: .8, ease: 'power2.out', onUpdate: up });
        }
      }, { threshold: .55 }).observe(cmp);
    }
  }

  /* ---------------- vélemények ---------------- */
  var quotes = $$('.quote'), qNo = $('#quoteNo'), qi = 0;
  function showQuote(i) {
    qi = (i + quotes.length) % quotes.length;
    quotes.forEach(function (q, k) { q.classList.toggle('is-on', k === qi); q.setAttribute('aria-hidden', String(k !== qi)); });
    if (qNo) qNo.textContent = ('0' + (qi + 1)).slice(-2);
  }
  $$('.quotes__nav [data-q]').forEach(function (b) {
    b.addEventListener('click', function () { showQuote(qi + (+b.dataset.q)); });
  });
  if (quotes.length) showQuote(0);
  var qWrap = $('#quotes');
  if (qWrap) {
    var sx0 = null;
    qWrap.addEventListener('touchstart', function (e) { sx0 = e.touches[0].clientX; }, { passive: true });
    qWrap.addEventListener('touchend', function (e) {
      if (sx0 === null) return;
      var dx = e.changedTouches[0].clientX - sx0;
      if (Math.abs(dx) > 50) showQuote(qi + (dx < 0 ? 1 : -1));
      sx0 = null;
    });
  }

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
            o.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding:.18em 0 .1em;margin:-.18em 0 -.1em';
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

    gsap.from('.hero__title .line > span', { yPercent: 108, duration: 1.2, ease: 'power4.out', stagger: .11, delay: .1 });
    gsap.from('[data-hero]', { y: 16, opacity: 0, duration: 1, ease: 'power3.out', stagger: .09, delay: .4 });
    gsap.from('.corner, .scrollcue, .hero__hint', { opacity: 0, duration: 1.2, delay: 1.1, stagger: .08 });
    gsap.from('.ribbon__inner > *', { opacity: 0, y: 8, duration: .8, stagger: .04, ease: 'power2.out',
      scrollTrigger: { trigger: '.ribbon', start: 'top 95%', once: true } });

    $$('[data-split]').forEach(function (h) {
      var words = splitWords(h);
      gsap.from(words, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: .05,
        scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
    });
    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, { y: 24, opacity: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-plate]').forEach(function (el) {
      var fr = $('.engraving__frame', el) || el;
      gsap.fromTo(fr, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power4.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }, clearProps: 'clipPath' });
      gsap.from($('img', el), { scale: 1.1, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    gsap.from('.row', { opacity: 0, y: 30, duration: 1, stagger: .08, ease: 'power3.out',
      scrollTrigger: { trigger: '.index__list', start: 'top 85%', once: true } });
    gsap.from('.index__frame', { opacity: 0, y: 30, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.index', start: 'top 85%', once: true } });
    gsap.from('.stage__tilt', { opacity: 0, y: 40, duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: '.stage', start: 'top 85%', once: true } });
    gsap.to('.stage__sprig', { yPercent: 18, rotation: 10, ease: 'none',
      scrollTrigger: { trigger: '.vitrin', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('[data-value]').forEach(function (li, i) {
      gsap.from(li, { opacity: 0, y: 26, duration: 1, delay: (i % 4) * .08, ease: 'power3.out',
        scrollTrigger: { trigger: li, start: 'top 90%', once: true } });
    });
    gsap.from('.quotes', { opacity: 0, y: 24, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.quotes', start: 'top 88%', once: true } });
  }
  initMotion();
})();
