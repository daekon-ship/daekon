/* Kalocsa Zoltán – gépi földmunka · látványterv · DAEKON */
(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fejléc + mobil hívássáv
  const hdr = d.getElementById('fejlec'), dock = d.getElementById('dock'), kapcs = d.getElementById('kapcsolat');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 20);
    const k = kapcs.getBoundingClientRect();
    dock.classList.toggle('is-on', y > innerHeight * 0.5 && !(k.top < innerHeight * 0.7 && k.bottom > 0));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Mobilmenü
  const burger = d.getElementById('burger'), nav = d.getElementById('nav');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  // Lightbox
  const items = [...d.querySelectorAll('.gal__item')];
  const lb = d.getElementById('lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption');
  let cur = 0, last = null;
  const show = i => {
    cur = (i + items.length) % items.length;
    const img = items[cur].querySelector('img');
    lbImg.src = img.getAttribute('src').replace('-720.', '-1200.');
    lbImg.alt = img.alt;
    lbCap.textContent = items[cur].querySelector('.gal__cap b').textContent;
  };
  const open = i => { last = d.activeElement; show(i); lb.hidden = false; d.body.style.overflow = 'hidden'; lb.querySelector('.lb__x').focus(); };
  const close = () => { lb.hidden = true; d.body.style.overflow = ''; last && last.focus(); };
  items.forEach((b, i) => b.addEventListener('click', () => open(i)));
  lb.querySelector('.lb__x').addEventListener('click', close);
  lb.querySelector('.lb__prev').addEventListener('click', () => show(cur - 1));
  lb.querySelector('.lb__next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  d.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'Tab') { const f = [...lb.querySelectorAll('button')]; const i = f.indexOf(d.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });

  const ev = d.getElementById('ev'); if (ev) ev.textContent = new Date().getFullYear();

  /* ================= MOZGÁS (GSAP + ScrollTrigger) ================= */
  const g = window.gsap, ST = window.ScrollTrigger;
  if (reduce || !g || !ST) { root.classList.remove('anim'); return; }
  g.registerPlugin(ST);
  const desk = matchMedia('(min-width: 861px)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const split = el => {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = d.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(' ')); return; }
          const w = d.createElement('span'); w.className = 'w';
          const i = d.createElement('span'); i.textContent = t; w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('count')) split(n);
    });
    return el.querySelectorAll('.w>span');
  };

  // --- HERO: belépő ---
  g.set(['.hero__lead', '.hero__cta', '.hero__art'], { visibility: 'visible' });
  const tl = g.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.ln>span', { y: 0, duration: 1.1, stagger: .14 }, .1)
    .from('.hero__lead', { y: 24, autoAlpha: 0, duration: .9 }, .45)
    .from('.hero__cta > *', { y: 20, autoAlpha: 0, duration: .8, stagger: .1 }, .6)
    .from('.frame', { clipPath: 'inset(0% 0% 0% 100%)', duration: 1.3, ease: 'expo.inOut' }, .15)
    .from('.frame img', { scale: 1.3, duration: 1.8 }, .15)
    .from('.ex__tracks, .ex > rect, .ex > path:not(:first-of-type):not(.ex__pile), .ex > g:not(.ex__boom):not(.ex__tracks):not(.ex__dust)', { x: 260, autoAlpha: 0, duration: 1.3, ease: 'power3.out' }, .3)
    .from('.ex__chain', { strokeDashoffset: 72, duration: 1.3, ease: 'power3.out' }, .3)
    .from('.ex__boom', { x: 260, autoAlpha: 0, rotation: 12, svgOrigin: '332 346', duration: 1.4, ease: 'power3.out' }, .3)
    .from('.ex > path:first-of-type, .ex__pile', { y: 40, autoAlpha: 0, duration: 1 }, .2)
    .from('.hero__note', { autoAlpha: 0, duration: .6 }, 1.2);

  // kotrógép ás: gém, kar, kanál ciklikusan; a kanálból föld hull
  const dig = g.timeline({ repeat: -1, delay: 1.8, defaults: { ease: 'sine.inOut' } });
  dig.to('.ex__boom', { rotation: 5, svgOrigin: '332 346', duration: 1.1 })
     .to('.ex__arm', { rotation: 14, svgOrigin: '220 108', duration: 1.1 }, '<')
     .to('.ex__bucket', { rotation: -28, svgOrigin: '126 328', duration: .9 }, '-=.5')
     .to('.ex__boom', { rotation: -4, svgOrigin: '332 346', duration: 1.2 })
     .to('.ex__arm', { rotation: -6, svgOrigin: '220 108', duration: 1.2 }, '<')
     .to('.ex__bucket', { rotation: 12, svgOrigin: '126 328', duration: .7 }, '-=.4')
     .fromTo('.ex__dust circle', { y: -60, autoAlpha: 1 }, { y: 0, autoAlpha: 0, duration: .8, stagger: .06, ease: 'power2.in' }, '<')
     .to(['.ex__boom', '.ex__arm', '.ex__bucket'], { rotation: 0, duration: 1 });

  // görgetés: a gép előrébb, a fotó lassabban mozog
  g.to('.ex', { y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  g.to('.frame img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  if (fine && desk) {
    const ex = g.quickTo('.ex', 'x', { duration: 1, ease: 'power3' }), fx = g.quickTo('.frame', 'x', { duration: 1.2, ease: 'power3' });
    d.querySelector('.hero').addEventListener('mousemove', e => { const n = e.clientX / innerWidth - .5; ex(n * 18); fx(n * -10); });
  }

  // --- címek szavanként, bevezetők ---
  d.querySelectorAll('.sec h2').forEach(h => {
    g.from(split(h), { yPercent: 115, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: h, start: 'top 86%' } });
  });
  g.utils.toArray('.sec__lead, .quote, .narrow__copy > p:not(.quote), .ticks li, .narrow__copy .btn, .cta__meta').forEach(el =>
    g.from(el, { y: 22, autoAlpha: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

  // --- szolgáltatások: ikonok kirajzolódnak, kitöltés beúszik ---
  g.utils.toArray('.svc__item').forEach((li, i) => {
    const lines = li.querySelectorAll('.ico path:not(.f):not([stroke-dasharray]), .ico rect, .ico circle:not(.f)');
    lines.forEach(s => { const L = s.getTotalLength(); g.set(s, { strokeDasharray: L, strokeDashoffset: L }); });
    const t = g.timeline({ scrollTrigger: { trigger: li, start: 'top 88%' }, delay: desk ? (i % 3) * .12 : 0 });
    t.from(li, { y: 40, autoAlpha: 0, duration: .9, ease: 'expo.out' })
     .to(lines, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: .08 }, .1)
     .from(li.querySelectorAll('.ico .f'), { scale: 0, transformOrigin: '50% 50%', duration: .6, ease: 'back.out(2.4)', stagger: .06 }, .6)
     .from(li.querySelectorAll('.ico [stroke-dasharray]'), { autoAlpha: 0, duration: .5 }, .5);
  });

  // --- szűk hely: kisgép végiggurul, nyomot húz, a végén ás és kitelik az árok ---
  const path = d.querySelector('.plan__path'), mach = d.querySelector('.plan__machine');
  if (path && mach) {
    const L = path.getTotalLength(), st = { p: 0 };
    g.set(path, { strokeDasharray: L, strokeDashoffset: L });
    g.set('.plan__trench', { scaleX: 0 });
    const place = () => {
      const p = Math.max(.001, st.p) * L, a = path.getPointAtLength(p), b = path.getPointAtLength(Math.max(0, p - 2));
      mach.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI + 90})`);
      path.style.strokeDashoffset = L - p;
    };
    place();
    g.timeline({ scrollTrigger: { trigger: '.plan', start: 'top 75%', end: 'bottom 45%', scrub: .6 } })
      .to(st, { p: 1, duration: 1, ease: 'none', onUpdate: place })
      .to('.plan__trench', { scaleX: 1, duration: .6, ease: 'none' })
      .to('.plan__arm', { rotation: 28, svgOrigin: '7 -8', duration: .15, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<');
  }
  g.from('.plan svg', { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.plan', start: 'top 85%' } });

  // --- munkák: maszkos feltárás + parallaxis ---
  g.set('.gal__img', { clipPath: 'inset(100% 0% 0% 0%)' });
  ST.batch('.gal__item', {
    start: 'top 90%',
    onEnter: b => {
      g.to(b.map(x => x.querySelector('.gal__img')), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: .12 });
      g.from(b.map(x => x.querySelector('.gal__cap')), { y: 16, autoAlpha: 0, duration: .8, ease: 'expo.out', stagger: .12, delay: .5 });
    }
  });
  g.utils.toArray('.gal__img img').forEach(img =>
    g.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // --- lépések ---
  g.utils.toArray('.step').forEach((s, i) => {
    const t = g.timeline({ scrollTrigger: { trigger: s, start: 'top 86%' }, delay: desk ? i * .15 : 0 });
    t.from(s, { y: 40, autoAlpha: 0, duration: .9, ease: 'expo.out' })
     .from(s.querySelector('.step__no'), { textContent: 0, duration: .6, snap: { textContent: 1 }, onUpdate() { const n = s.querySelector('.step__no'); n.textContent = String(Math.round(+n.textContent)).padStart(2, '0'); } }, .1)
     .from(s.querySelectorAll('h3, p'), { y: 14, autoAlpha: 0, duration: .6, stagger: .08, ease: 'power3.out' }, .2);
  });

  // --- kiszállás: kör kinyílik, radar pásztáz, 0 → 60 ---
  g.timeline({ scrollTrigger: { trigger: '.radar', start: 'top 82%' } })
    .from('.radar__ring', { scale: 0, svgOrigin: '200 200', duration: 1.4, ease: 'expo.out' })
    .from('.radar text', { autoAlpha: 0, duration: .6 }, .5);
  g.to('.radar__sweep', { rotation: -360, svgOrigin: '200 200', duration: 6, ease: 'none', repeat: -1 });
  d.querySelectorAll('.count').forEach(c => {
    const o = { v: 0 };
    g.to(o, { v: +c.dataset.to, duration: 1.6, ease: 'power3.out', onUpdate: () => c.textContent = Math.round(o.v), scrollTrigger: { trigger: c, start: 'top 88%' } });
  });

  // --- kapcsolat: a nagy gomb beúszik, majd finoman „lélegzik” ---
  g.from('.btn--lg', { scale: .85, autoAlpha: 0, duration: 1, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.cta', start: 'top 80%' } });
  g.to('.btn--lg', { boxShadow: '0 1px 0 rgba(255,255,255,.18) inset, 0 0 0 10px rgba(242,107,29,.12), 0 14px 34px rgba(242,107,29,.35)', duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.5 });

  // --- mágneses gombok (asztali) ---
  if (fine) d.querySelectorAll('.btn').forEach(b => {
    const xTo = g.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = g.quickTo(b, 'y', { duration: .5, ease: 'power3' });
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .22); yTo((e.clientY - r.top - r.height / 2) * .32); });
    b.addEventListener('mouseleave', () => g.to(b, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
  });

  addEventListener('load', () => ST.refresh());
})();
