/* Dr. Szedoglavits Réka – Motion (motion.dev) réteg
   Minden mozgás itt van. Csak akkor fut, ha a site.js engedi (nincs csökkentett mozgás,
   a Motion betöltődött). Egérkövető hatások csak finom mutatónál (asztali gép). */
(function () {
  'use strict';
  if (!window.SZR_MOTION || !window.Motion) return;
  var M = window.Motion;
  var animate = M.animate, scroll = M.scroll, inView = M.inView, stagger = M.stagger;
  var ease = [0.22, 0.7, 0.2, 1];
  var easeIO = [0.65, 0, 0.25, 1];
  var spring = { type: 'spring', stiffness: 260, damping: 22, mass: 0.6 };
  var soft = { type: 'spring', stiffness: 120, damping: 18, mass: 0.8 };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var desktop = window.matchMedia('(min-width: 900px)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- segédek ---------- */
  // szöveg felbontása szavakra (és opcionálisan betűkre), maszkolt felfedéshez
  function split(el, chars) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var out = [];
    text.split(/\s+/).forEach(function (word, wi, arr) {
      var w = document.createElement('span');
      w.className = 'sw';
      w.setAttribute('aria-hidden', 'true');
      if (chars) {
        Array.from(word).forEach(function (ch) {
          var c = document.createElement('span');
          c.className = 'sc';
          c.textContent = ch;
          w.appendChild(c);
          out.push(c);
        });
      } else {
        var i = document.createElement('span');
        i.className = 'swi';
        i.textContent = word;
        w.appendChild(i);
        out.push(i);
      }
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return out;
  }
  function drawable(nodes) {
    nodes.forEach(function (n) {
      n.setAttribute('pathLength', '1');
      n.setAttribute('stroke-dasharray', '1');
      n.setAttribute('stroke-dashoffset', '1');
    });
    return nodes;
  }

  /* ---------- 1. görgetés-jelző ---------- */
  scroll(animate('.progress span', { scaleX: [0, 1] }, { ease: 'linear' }));

  /* ---------- 2. fejléc: a logó „aláírásként” íródik ki ---------- */
  var brandMark = $('.brand__mark');
  animate(brandMark, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'], opacity: [0.2, 1] }, { duration: 1.6, ease: easeIO, delay: 0.15 });
  animate('.brand__txt', { opacity: [0, 1], x: [-10, 0] }, { duration: 0.8, ease: ease, delay: 0.5 });
  animate('.nav li, .hdr__cta, .burger', { opacity: [0, 1], y: [-10, 0] }, { duration: 0.6, ease: ease, delay: stagger(0.05, { startDelay: 0.35 }) });

  /* ---------- 3. hero ---------- */
  var hero = $('#fooldal');
  var h1 = $('.hero__title');
  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
  var heroChars = [];
  $$('[data-hl]').forEach(function (line) {
    line.style.transform = 'none';
    heroChars.push(split(line, true));
  });
  heroChars.forEach(function (chars, li) {
    animate(chars, { y: ['110%', '0%'], opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'] },
      { duration: 0.9, ease: ease, delay: stagger(0.022, { startDelay: 0.35 + li * 0.32 }) });
  });
  animate('.hero__eyebrow', { opacity: [0, 1], letterSpacing: ['0.42em', '0.2em'] }, { duration: 1.2, ease: ease, delay: 0.1 });
  animate('.hero__swash path', { strokeDashoffset: [1, 0] }, { duration: 1.8, ease: easeIO, delay: 1.1 });
  animate('.hero__lead', { opacity: [0, 1], y: [18, 0], filter: ['blur(4px)', 'blur(0px)'] }, { duration: 0.9, ease: ease, delay: 1.25 });
  animate('.hero__btns', { opacity: [0, 1] }, { duration: 0.01, delay: 1.4 });
  animate('.hero__btns .btn', { opacity: [0, 1], y: [16, 0], scale: [0.96, 1] }, { ...spring, delay: stagger(0.1, { startDelay: 1.4 }) });
  animate('.hero__meta', { opacity: [0, 1] }, { duration: 0.01, delay: 1.6 });
  animate('.hero__meta div', { opacity: [0, 1], x: [-12, 0] }, { duration: 0.7, ease: ease, delay: stagger(0.1, { startDelay: 1.6 }) });
  animate('.hero__meta', { borderTopColor: ['rgba(226,216,203,0)', 'rgba(226,216,203,1)'] }, { duration: 1, delay: 1.6 });
  // portré: függönyszerű felfedés, keret „rajzolódik”, gyémántok elfordulnak
  var heroImg = $('.pp__img img');
  animate('.pp__img', { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.4, ease: [0.7, 0, 0.2, 1], delay: 0.3 });
  animate(heroImg, { scale: [1.18, 1] }, { duration: 2.2, ease: ease, delay: 0.3 });
  animate('.pp__frame', { opacity: [0, 1], clipPath: ['inset(0 50% 0 50%)', 'inset(0 0% 0 0%)'] }, { duration: 1.4, ease: easeIO, delay: 1.0 });
  animate('.pp__tag', { opacity: [0, 1], x: [-30, 0], scale: [0.92, 1] }, { ...spring, delay: 1.55 });
  // a háttérpanel lassan „beúszik”
  var heroPanel = document.createElement('div');
  heroPanel.className = 'hero__panel';
  hero.insertBefore(heroPanel, hero.firstChild);
  hero.classList.add('has-panel');
  animate(heroPanel, { scaleX: [0, 1] }, { duration: 1.5, ease: easeIO, delay: 0.05 });

  // fényes csík a portrén (egérrel követhető)
  var sheen = document.createElement('span');
  sheen.className = 'pp__sheen';
  $('.pp__img').appendChild(sheen);
  animate(sheen, { x: ['-120%', '220%'] }, { duration: 1.8, ease: easeIO, delay: 1.6 });

  if (desktop) {
    // kifelé görgetés: a szöveg feljebb úszik és halványul, a portré lassabban mozog
    scroll(animate('.hero__text', { y: [0, -70], opacity: [1, 0.25] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
    scroll(animate('.hero__portrait', { y: [0, 50], scale: [1, 0.95] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
    scroll(animate('.topics ul', { x: [60, -60] }, { ease: 'linear' }), { target: $('.topics'), offset: ['start end', 'end start'] });
  }

  if (finePointer && desktop) {
    // portré 3D-ben követi az egeret, a fénycsík vele mozog
    var pp = $('.pp');
    var heroGlow = document.createElement('div');
    heroGlow.className = 'hero__glow';
    hero.appendChild(heroGlow);
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      animate(pp, { rotateY: px * 9, rotateX: -py * 7, transformPerspective: 1100 }, soft);
      animate(sheen, { x: (px + 0.5) * 240 - 120 + '%', opacity: 0.9 }, soft);
      animate(heroGlow, { x: e.clientX - r.left - 300, y: e.clientY - r.top - 300, opacity: 1 }, soft);
    });
    hero.addEventListener('pointerleave', function () {
      animate(pp, { rotateY: 0, rotateX: 0 }, soft);
      animate(sheen, { opacity: 0 }, { duration: 0.6 });
      animate(heroGlow, { opacity: 0 }, { duration: 0.8 });
    });
  }

  /* ---------- 4. gombok: mágneses húzás + rugós lenyomás ---------- */
  function magnetic(el, strength) {
    if (!finePointer) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      animate(el, { x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength }, spring);
    });
    el.addEventListener('pointerleave', function () { animate(el, { x: 0, y: 0, scale: 1 }, spring); });
  }
  $$('.btn, .direct a, .burger').forEach(function (b) {
    magnetic(b, b.classList.contains('btn--full') ? 0.06 : 0.22);
    b.addEventListener('pointerdown', function () { animate(b, { scale: 0.95 }, spring); });
    b.addEventListener('pointerup', function () { animate(b, { scale: 1 }, spring); });
  });
  // menüpontok: a szöveg rugósan megemelkedik
  $$('.nav a').forEach(function (a) {
    a.addEventListener('pointerenter', function () { animate(a, { y: -2 }, spring); });
    a.addEventListener('pointerleave', function () { animate(a, { y: 0 }, spring); });
  });

  /* ---------- 5. szakaszcímek: szavanként, maszk mögül ---------- */
  $$('.h2').forEach(function (h) {
    h.removeAttribute('data-r');
    h.style.opacity = '1';
    var words = split(h, false);
    words.forEach(function (w) { w.style.transform = 'translateY(110%)'; });
    inView(h, function () {
      animate(words, { y: ['110%', '0%'], rotate: [4, 0] }, { duration: 0.95, ease: ease, delay: stagger(0.06) });
    }, { amount: 0.6 });
  });
  // szemöldök-feliratok: a vonal kinő, a betűk összehúzódnak
  $$('.sec .eyebrow').forEach(function (e) {
    e.removeAttribute('data-r');
    e.style.opacity = '0';
    inView(e, function () {
      animate(e, { opacity: [0, 1], letterSpacing: ['0.36em', '0.2em'] }, { duration: 1, ease: ease });
    }, { amount: 0.8 });
  });

  /* ---------- 6. általános felúszás ---------- */
  $$('.sec').forEach(function (sec) {
    var items = $$('[data-r]', sec).filter(function (el) { return !el.closest('.values') && !el.matches('.facts, .map, .form-card, .family__tabs'); });
    if (!items.length) return;
    inView(sec, function () {
      animate(items, { opacity: [0, 1], y: [26, 0], filter: ['blur(3px)', 'blur(0px)'] }, { duration: 0.9, ease: ease, delay: stagger(0.08, { startDelay: 0.15 }) });
    }, { amount: 0.12 });
  });

  /* ---------- 7. bemutatkozás ---------- */
  var values = $$('.values li');
  var valueIcons = drawable($$('.values svg > *'));
  inView('.values', function () {
    animate(values, { opacity: [0, 1], x: [40, 0] }, { duration: 0.9, ease: ease, delay: stagger(0.09) });
    animate(valueIcons, { strokeDashoffset: [1, 0] }, { duration: 1.4, ease: easeIO, delay: stagger(0.06, { startDelay: 0.25 }) });
  }, { amount: 0.2 });
  values.forEach(function (li) {
    var ic = $$('svg > *', li);
    li.addEventListener('pointerenter', function () {
      animate($('svg', li), { scale: [1, 1.15, 1], rotate: [0, -6, 0] }, { duration: 0.6, ease: ease });
      animate(ic, { strokeDashoffset: [1, 0] }, { duration: 0.9, ease: ease });
    });
  });
  var facts = $('.facts');
  inView(facts, function () {
    animate(facts, { opacity: [0, 1], clipPath: ['inset(0 0 100% 0 round 4px)', 'inset(0 0 0% 0 round 4px)'] }, { duration: 1.1, ease: easeIO });
    animate($$('div', facts), { opacity: [0, 1], y: [12, 0] }, { duration: 0.7, ease: ease, delay: stagger(0.1, { startDelay: 0.35 }) });
  }, { amount: 0.4 });
  // iniciálé és aláírás
  var signImg = $('.sign img');
  signImg.style.clipPath = 'inset(0 100% 0 0)';
  inView('.sign', function () {
    animate(signImg, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 1.8, ease: easeIO, delay: 0.2 });
  }, { amount: 0.8 });
  if (desktop) {
    scroll(animate('.about__side', { y: [60, -30] }, { ease: 'linear' }), { target: $('#bemutatkozas'), offset: ['start end', 'end start'] });
  }

  /* ---------- 8. szakterületek: 3D lapozás, ikonrajz, dőlés egérre ---------- */
  var cards = $$('.areas .card');
  var cardIcons = $$('.card__ic > *');
  inView('.areas__grid', function () {
    animate('.fam', { opacity: [0, 1], scale: [0.96, 1] }, { duration: 1, ease: ease });
    animate('.fam__label', { opacity: [0, 1], x: [-14, 0] }, { duration: 0.8, ease: ease, delay: stagger(0.1, { startDelay: 0.2 }) });
    animate(cards, { opacity: [0, 1], y: [50, 0], rotateX: [18, 0], transformPerspective: 900 }, { duration: 1, ease: ease, delay: stagger(0.09, { startDelay: 0.15 }) });
    animate(cardIcons, { strokeDashoffset: [1, 0] }, { duration: 1.4, ease: easeIO, delay: stagger(0.04, { startDelay: 0.5 }) });
  }, { amount: 0.1 });
  function tilt(el, max) {
    if (!finePointer) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      animate(el, { rotateY: px * max, rotateX: -py * max, y: -5, transformPerspective: 900 }, soft);
      el.style.setProperty('--mx', (px + 0.5) * 100 + '%');
      el.style.setProperty('--my', (py + 0.5) * 100 + '%');
    });
    el.addEventListener('pointerleave', function () { animate(el, { rotateY: 0, rotateX: 0, y: 0 }, soft); });
  }
  cards.forEach(function (c) {
    tilt(c, 9);
    c.addEventListener('pointerenter', function () {
      var sh = $$('.card__ic > *', c);
      animate(sh, { strokeDashoffset: [1, 0] }, { duration: 0.9, ease: ease, delay: stagger(0.06) });
      animate($('.card__ic', c), { scale: [1, 1.12], rotate: [0, -4] }, spring);
      animate($('.card__more svg', c), { x: [0, 6, 3] }, { duration: 0.6 });
    });
    c.addEventListener('pointerleave', function () { animate($('.card__ic', c), { scale: 1, rotate: 0 }, spring); });
  });

  /* ---------- 9. családjog: csúszó jelölő, panelváltás, fényfolt ---------- */
  var family = $('#csaladjog');
  var tablist = $('.tablist');
  var ind = document.createElement('span');
  ind.className = 'tab-ind';
  ind.setAttribute('aria-hidden', 'true');
  tablist.appendChild(ind);
  tablist.classList.add('has-ind');
  function moveInd(t, instant) {
    var vertical = window.innerWidth >= 720;
    var to = vertical
      ? { x: 0, y: t.offsetTop, width: 2, height: t.offsetHeight }
      : { x: t.offsetLeft, y: t.offsetTop, width: t.offsetWidth, height: t.offsetHeight };
    tablist.classList.toggle('ind-v', vertical);
    animate(ind, to, instant ? { duration: 0 } : spring);
  }
  var tabs = $$('[role="tab"]');
  requestAnimationFrame(function () { moveInd($('[aria-selected="true"]', tablist) || tabs[0], true); });
  window.addEventListener('resize', function () { moveInd($('[aria-selected="true"]', tablist) || tabs[0], true); });
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { moveInd(t); });
    t.addEventListener('keydown', function () { setTimeout(function () { moveInd($('[aria-selected="true"]', tablist)); }, 0); });
    t.addEventListener('pointerenter', function () { animate($('i', t), { x: [0, 4, 0] }, { duration: 0.45 }); });
  });
  // panelváltás: a site.js elindítja, itt egy elmosott, oldalról érkező réteget adunk hozzá
  var observer = new MutationObserver(function (list) {
    list.forEach(function (m) {
      if (m.attributeName === 'hidden' && !m.target.hidden) {
        animate(m.target, { opacity: [0, 1], x: [24, 0], filter: ['blur(6px)', 'blur(0px)'] }, { duration: 0.6, ease: ease });
        animate($$('li', m.target), { opacity: [0, 1], x: [16, 0] }, { duration: 0.5, ease: ease, delay: stagger(0.06, { startDelay: 0.2 }) });
      }
    });
  });
  $$('[role="tabpanel"]').forEach(function (p) { observer.observe(p, { attributes: true }); });
  inView('.family__tabs', function () {
    animate('.family__tabs', { opacity: [0, 1] }, { duration: 0.8, ease: ease });
    animate($$('[role="tab"]'), { opacity: [0, 1], x: [-20, 0] }, { duration: 0.7, ease: ease, delay: stagger(0.06, { startDelay: 0.25 }) });
    animate($$('#p1 li'), { opacity: [0, 1], x: [16, 0] }, { duration: 0.6, ease: ease, delay: stagger(0.08, { startDelay: 0.6 }) });
  }, { amount: 0.25 });
  scroll(animate('.family__light', { x: [80, -80], y: [-40, 40], scale: [0.9, 1.1] }, { ease: 'linear' }), { target: family });
  if (desktop) {
    scroll(animate('.family__tabs', { y: [50, -20] }, { ease: 'linear' }), { target: family, offset: ['start end', 'end start'] });
  }
  if (finePointer) {
    var fl = $('.family__light');
    family.addEventListener('pointermove', function (e) {
      var r = family.getBoundingClientRect();
      animate(fl, { left: e.clientX - r.left - fl.offsetWidth / 2 + 'px', top: e.clientY - r.top - fl.offsetHeight / 2 + 'px' }, soft);
    });
  }

  /* ---------- 10. a konzultáció menete ---------- */
  var list = $('.steps__list');
  var steps = $$('[data-step]');
  scroll(animate('.steps__track span', { scaleY: [0, 1] }, { ease: 'linear' }), { target: list, offset: ['start 70%', 'end 60%'] });
  var lastOn = 0;
  scroll(function (p) {
    var n = Math.min(steps.length, Math.floor(p * steps.length + 0.25));
    steps.forEach(function (s, i) { s.classList.toggle('is-on', i < n); });
    if (n > lastOn) {
      var num = $('.step__n', steps[n - 1]);
      animate(num, { scale: [0.6, 1.18, 1], rotate: [-20, 0] }, { duration: 0.7, ease: ease });
    }
    lastOn = n;
  }, { target: list, offset: ['start 70%', 'end 60%'] });
  steps.forEach(function (s) { s.style.opacity = '0'; });
  inView(list, function () {
    animate(steps, { opacity: [0, 1], x: [40, 0], filter: ['blur(4px)', 'blur(0px)'] }, { duration: 0.9, ease: ease, delay: stagger(0.14) });
  }, { amount: 0.15 });
  steps.forEach(function (s) {
    s.addEventListener('pointerenter', function () { animate($('h3', s), { x: 6 }, spring); });
    s.addEventListener('pointerleave', function () { animate($('h3', s), { x: 0 }, spring); });
  });

  /* ---------- 11. tudástár ---------- */
  var posts = $$('.post');
  var coverPath = drawable($$('.post__cover svg path'));
  inView('.kb__grid', function () {
    animate(posts, { opacity: [0, 1], y: [50, 0], rotate: [1.5, 0], scale: [0.97, 1] }, { duration: 1, ease: ease, delay: stagger(0.08) });
    animate('.post__cover', { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, { duration: 1.2, ease: easeIO, delay: 0.1 });
    animate('.post__cover i', { opacity: [0, 1], letterSpacing: ['0.3em', '0em'] }, { duration: 1.2, ease: ease, delay: 0.6 });
    animate(coverPath, { strokeDashoffset: [1, 0] }, { duration: 1.8, ease: easeIO, delay: 0.9 });
  }, { amount: 0.1 });
  posts.forEach(function (p) { tilt(p, 6); });
  scroll(animate('.post__cover i', { y: [-14, 14] }, { ease: 'linear' }), { target: $('.post--lead'), offset: ['start end', 'end start'] });

  /* ---------- 12. időpontkérés: a bordó szakasz kinyílik, reflektor követi az egeret ---------- */
  var book = $('#konzultacio');
  scroll(animate(book, {
    clipPath: ['inset(6% 5% 0% 5% round 28px)', 'inset(0% 0% 0% 0% round 0px)']
  }, { ease: 'linear' }), { target: book, offset: ['start end', 'start 35%'] });
  inView(book, function () {
    animate('.form-card', { opacity: [0, 1] }, { duration: 0.9, ease: ease, delay: 0.2 });
    animate('.direct li', { opacity: [0, 1], x: [-30, 0] }, { duration: 0.8, ease: ease, delay: stagger(0.12, { startDelay: 0.4 }) });
    animate($$('.req > *'), { opacity: [0, 1], y: [16, 0] }, { duration: 0.6, ease: ease, delay: stagger(0.05, { startDelay: 0.45 }) });
  }, { amount: 0.25 });
  if (desktop) {
    scroll(animate('.form-card', { y: [70, -30], rotate: [1.2, 0] }, { ease: 'linear' }), { target: book, offset: ['start end', 'end start'] });
  }
  if (finePointer) {
    var spot = document.createElement('div');
    spot.className = 'book__spot';
    book.appendChild(spot);
    book.addEventListener('pointermove', function (e) {
      var r = book.getBoundingClientRect();
      animate(spot, { x: e.clientX - r.left - 350, y: e.clientY - r.top - 350, opacity: 1 }, soft);
    });
    book.addEventListener('pointerleave', function () { animate(spot, { opacity: 0 }, { duration: 0.8 }); });
  }
  // mezők: fókuszkor rugós emelés
  $$('.fld input, .fld select').forEach(function (f) {
    f.addEventListener('focus', function () { animate(f, { y: -2, scale: 1.01 }, spring); });
    f.addEventListener('blur', function () { animate(f, { y: 0, scale: 1 }, spring); });
  });
  $$('.chips label').forEach(function (l) {
    l.addEventListener('click', function () { animate($('span', l), { scale: [0.9, 1.06, 1] }, { duration: 0.45, ease: ease }); });
  });
  // sikeres küldés: a pipa megrajzolódik
  var okBox = $('#keres-ok');
  var okPaths = $$('svg > *', okBox);
  new MutationObserver(function () {
    if (!okBox.hidden) {
      drawable(okPaths);
      animate(okPaths, { strokeDashoffset: [1, 0] }, { duration: 1, ease: easeIO, delay: stagger(0.3) });
      animate($('svg', okBox), { scale: [0.6, 1.1, 1] }, { duration: 0.8, ease: ease });
    }
  }).observe(okBox, { attributes: true, attributeFilter: ['hidden'] });

  /* ---------- 13. kapcsolat: utcák rajzolódnak, a tű leesik ---------- */
  var mapLines = drawable($$('.map__lines path'));
  inView('.map', function () {
    animate('.map', { opacity: [0, 1], scale: [0.94, 1] }, { duration: 1, ease: ease });
    animate(mapLines, { strokeDashoffset: [1, 0] }, { duration: 1.8, ease: easeIO, delay: stagger(0.12, { startDelay: 0.2 }) });
    animate('.map__pin', { y: [-80, 0], opacity: [0, 1] }, { type: 'spring', stiffness: 300, damping: 12, delay: 1.1 });
    animate('.map__card', { opacity: [0, 1], y: [30, 0] }, { ...spring, delay: 1.4 });
  }, { amount: 0.3 });
  inView('.clist', function () {
    animate('.clist li', { opacity: [0, 1], x: [-20, 0] }, { duration: 0.7, ease: ease, delay: stagger(0.08) });
  }, { amount: 0.5 });
  var pin = $('.map__pin');
  if (pin && finePointer) {
    $('.map').addEventListener('pointerenter', function () { animate(pin, { y: [0, -14, 0] }, { duration: 0.7, ease: ease }); });
  }

  /* ---------- 14. lábléc ---------- */
  var ftrLogo = $('.ftr__brand img');
  ftrLogo.style.clipPath = 'inset(0 100% 0 0)';
  inView('.ftr', function () {
    animate(ftrLogo, { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 1.8, ease: easeIO });
    animate('.ftr__nav a, .ftr__contact p, .ftr__brand p', { opacity: [0, 1], y: [14, 0] }, { duration: 0.7, ease: ease, delay: stagger(0.05, { startDelay: 0.3 }) });
  }, { amount: 0.3 });

  /* ---------- 15. párbeszédablak: rugós nyitás, sorok beúsznak ---------- */
  var dlg = $('#dlg');
  new MutationObserver(function () {
    if (dlg.open) {
      animate($('.dlg__box', dlg), { opacity: [0, 1], y: [40, 0], scale: [0.94, 1], rotateX: [8, 0], transformPerspective: 1000 }, { type: 'spring', stiffness: 220, damping: 20 });
      animate($$('li', dlg), { opacity: [0, 1], x: [24, 0] }, { duration: 0.55, ease: ease, delay: stagger(0.06, { startDelay: 0.25 }) });
    }
  }).observe(dlg, { attributes: true, attributeFilter: ['open'] });

})();
