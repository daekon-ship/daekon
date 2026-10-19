/* Kalocsa Zoltán – gépi földmunka · látványterv · DAEKON */
(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fejléc + mobil sáv + nyomvonal
  const hdr = d.getElementById('fejlec'), dock = d.getElementById('dock');
  const fill = d.querySelector('.route__fill');
  const kapcs = d.getElementById('kapcsolat');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 24);
    const max = d.body.scrollHeight - innerHeight;
    if (fill) fill.style.setProperty('--p', Math.min(100, (y / max) * 100).toFixed(2) + '%');
    // a mobil sáv a hero után jelenik meg, és eltűnik a kapcsolat blokknál (ott már ott a hívás és az űrlap)
    const k = kapcs.getBoundingClientRect();
    dock.classList.toggle('is-on', y > innerHeight * 0.6 && !(k.top < innerHeight * 0.6 && k.bottom > 0));
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

  motion();

  // Lightbox
  const items = [...d.querySelectorAll('.gal__item')];
  const lb = d.getElementById('lb'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption');
  let cur = 0, last = null;
  const show = i => {
    cur = (i + items.length) % items.length;
    const img = items[cur].querySelector('img');
    lbImg.src = img.currentSrc.replace('-720.', '-1200.');
    lbImg.alt = img.alt;
    const c = items[cur].querySelector('.gal__cap');
    lbCap.innerHTML = '<b>' + c.querySelector('b').textContent + '</b>' + c.querySelector('span').firstChild.textContent.trim();
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
    if (e.key === 'Tab') { // fókusz a dobozban marad
      const f = [...lb.querySelectorAll('button')]; const i = f.indexOf(d.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  const ev = d.getElementById('ev'); if (ev) ev.textContent = new Date().getFullYear();

  /* ================= MOZGÁS ================= */
  function motion() {
    const g = window.gsap, ST = window.ScrollTrigger;
    if (reduce || !g || !ST) { root.classList.remove('anim'); return; }
    g.registerPlugin(ST);
    root.classList.add('anim');
    const desk = matchMedia('(min-width: 861px)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

    // --- szavakra bontás (címek) ---
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

    // --- HERO belépő ---
    const tl = g.timeline({ defaults: { ease: 'expo.out' } });
    g.set(['.hero__kicker', '.hero__lead', '.hero__cta', '.hero__more', '.hero__shot', '.hero__coord'], { visibility: 'visible' });
    tl.from('.hero__shot .shot', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3 }, 0)
      .from('.hero__shot .shot img', { scale: 1.25, duration: 1.8 }, 0)
      .from('.hero__kicker', { x: -30, autoAlpha: 0, duration: .8 }, .1)
      .to('.ln>span', { y: 0, duration: 1.1, stagger: .12 }, .15)
      .from('.hero__lead', { y: 24, autoAlpha: 0, duration: .9 }, .55)
      .from('.hero__cta .btn', { y: 22, autoAlpha: 0, duration: .8, stagger: .08 }, .65)
      .from('.hero__more', { autoAlpha: 0, duration: .6 }, .9)
      .from('.crop--tl', { x: -26, y: -26, autoAlpha: 0, duration: .8 }, .8)
      .from('.crop--tr', { x: 26, y: -26, autoAlpha: 0, duration: .8 }, .8)
      .from('.crop--bl', { x: -26, y: 26, autoAlpha: 0, duration: .8 }, .8)
      .from('.crop--br', { x: 26, y: 26, autoAlpha: 0, duration: .8 }, .8)
      .from('.shot__dim', { scaleY: 0, transformOrigin: '50% 0%', duration: 1 }, .9)
      .from('.shot__dimlbl, .shot__cap', { autoAlpha: 0, y: 10, duration: .6, stagger: .1 }, 1.1)
      .from('.hero__coord span', { autoAlpha: 0, y: -8, duration: .5, stagger: .08 }, 1.1)
      .from('.shot__laser', { autoAlpha: 0, duration: .4 }, 1.2);

    // lézer-szintvonal pásztáz a fotón
    g.to('.shot__laser', { top: '88%', duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.3 });

    // hero görgetésre: fotó lassabban, szöveg kissé felcsúszik
    g.to('.hero__shot .shot img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    g.to('.hero__copy', { y: -70, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    g.to('.topo', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // egér: a szintvonalak és a fotó finoman elmozdul
    if (fine && desk) {
      const tx = g.quickTo('.topo', 'x', { duration: 1.2, ease: 'power3' });
      const sx = g.quickTo('.hero__shot', 'x', { duration: 1, ease: 'power3' });
      const sy = g.quickTo('.hero__shot', 'y', { duration: 1, ease: 'power3' });
      d.querySelector('.hero').addEventListener('mousemove', e => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        tx(nx * -40); sx(nx * 14); sy(ny * 14);
      });
    }

    // --- szekciócímek szavanként ---
    d.querySelectorAll('.sec h2, .cta h2').forEach(h => {
      const ws = split(h);
      g.from(ws, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    d.querySelectorAll('.sec__no').forEach(n => g.from(n, { x: -24, autoAlpha: 0, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 90%' } }));
    g.utils.toArray('.quote, .services__head .muted, .services__head .btn, .paper__lead, .paper__copy > p, .ticks li, .works__head .muted, .about__lead, .area__copy p, .area__copy .btn, .cta__sub').forEach(el =>
      g.from(el, { y: 26, autoAlpha: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

    // --- szolgáltatások: sorok becsúsznak, ikonok kirajzolódnak ---
    g.utils.toArray('.svc__item').forEach((li, i) => {
      const shapes = li.querySelectorAll('.ico path:not([stroke-dasharray]), .ico circle');
      shapes.forEach(s => { const L = s.getTotalLength(); g.set(s, { strokeDasharray: L, strokeDashoffset: L }); });
      const t = g.timeline({ scrollTrigger: { trigger: li, start: 'top 88%' } });
      t.from(li.querySelector('a'), { x: 60, autoAlpha: 0, duration: .9, ease: 'expo.out' })
       .to(shapes, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: .1 }, .15)
       .from(li.querySelectorAll('.ico [stroke-dasharray]'), { autoAlpha: 0, duration: .5 }, .6)
       .from(li.querySelector('.svc__no'), { autoAlpha: 0, y: 10, duration: .5 }, .2);
    });

    // --- szűk hely: a kisgép görgetésre végiggurul az útvonalon, aztán kiássa az árkot ---
    const path = d.querySelector('.plan__path'), mach = d.querySelector('.plan__machine'), arm = d.querySelector('.plan__arm');
    if (path && mach) {
      const L = path.getTotalLength();
      g.set(path, { strokeDasharray: L, strokeDashoffset: L });
      g.set('.plan__trench', { scaleX: 0 });
      const st = { p: 0 };
      const place = () => {
        const p = Math.max(.001, st.p) * L;
        const a = path.getPointAtLength(p), b = path.getPointAtLength(Math.max(0, p - 2));
        const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI + 90;
        mach.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`);
        path.style.strokeDashoffset = L - p;
      };
      place();
      const pt = g.timeline({ scrollTrigger: { trigger: '.plan', start: 'top 75%', end: 'bottom 45%', scrub: .6 } });
      pt.to(st, { p: 1, duration: 1, ease: 'none', onUpdate: place })
        .to('.plan__trench', { scaleX: 1, duration: .6, ease: 'none' })
        .to(arm, { rotation: 28, svgOrigin: '7 -8', duration: .15, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<');
    }
    g.from('.paper__photo', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: '.paper__photo', start: 'top 85%' } });
    g.from('.paper__photo img', { scale: 1.3, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.paper__photo', start: 'top 85%' } });
    g.from('.plan svg', { autoAlpha: 0, y: 30, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.plan', start: 'top 85%' } });

    // --- galéria: maszkos feltárás + belső parallaxis ---
    ST.batch('.gal__item', {
      start: 'top 88%',
      onEnter: b => g.fromTo(b, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: .12 })
    });
    g.set('.gal__item', { clipPath: 'inset(100% 0% 0% 0%)' });
    g.utils.toArray('.gal__item').forEach(it => {
      g.fromTo(it.querySelector('img'), { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: it, start: 'top bottom', end: 'bottom top', scrub: true } });
      g.from(it.querySelector('.gal__cap'), { y: 20, autoAlpha: 0, duration: .8, ease: 'expo.out', scrollTrigger: { trigger: it, start: 'top 70%' } });
    });

    // --- lépések: a kitűzési vonal görgetésre húzódik, a karók beugranak ---
    g.from('.steps__line', { [desk ? 'scaleX' : 'scaleY']: 0, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 60%', scrub: .5 } });
    g.utils.toArray('.step').forEach(s => {
      const t = g.timeline({ scrollTrigger: { trigger: s, start: desk ? 'top 75%' : 'top 82%' } });
      t.from(s.querySelector('.step__stake'), { scale: 0, rotation: 225, duration: .7, ease: 'back.out(2.5)' })
       .from(s.querySelectorAll('.step__no, h4, p'), { y: 20, autoAlpha: 0, duration: .7, stagger: .07, ease: 'expo.out' }, .1);
    });

    // --- kiszállás: kör kinyílik, radar pásztáz, 0 → 60 km ---
    const rt = g.timeline({ scrollTrigger: { trigger: '.radar', start: 'top 80%' } });
    rt.from('.radar__ring', { scale: 0, svgOrigin: '200 200', duration: 1.4, ease: 'expo.out' })
      .from('.radar__r', { scale: 0, svgOrigin: '200 200', duration: .8, ease: 'expo.out' }, .3)
      .from('.radar text', { autoAlpha: 0, duration: .6, stagger: .1 }, .5);
    g.to('.radar__sweep', { rotation: -360, svgOrigin: '200 200', duration: 6, ease: 'none', repeat: -1 });
    d.querySelectorAll('.count').forEach(c => {
      const o = { v: 0 }, to = +c.dataset.to;
      g.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => c.textContent = Math.round(o.v), scrollTrigger: { trigger: c, start: 'top 85%' } });
    });

    // --- kapcsolat: hívókártya beúszik ---
    g.from('.callcard', { y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.callcard', start: 'top 88%' } });
    g.from('.callcard > *', { y: 14, autoAlpha: 0, duration: .6, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '.callcard', start: 'top 80%' } });

    // --- mágneses gombok ---
    if (fine) d.querySelectorAll('.btn--orange, .btn--ghost').forEach(b => {
      const xTo = g.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = g.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .25); yTo((e.clientY - r.top - r.height / 2) * .35); });
      b.addEventListener('mouseleave', () => { g.to(b, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }); });
    });

    // --- lábléc ---
    g.from('.ftr__grid > *', { y: 24, autoAlpha: 0, duration: .8, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 92%' } });

    addEventListener('load', () => ST.refresh());
  }
})();
