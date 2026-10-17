/* CB TAXI – Nyakas Péter · látványterv (DAEKON) · 2. kör
   Naplemente → éjszaka a heróban, majd vízszintes éjszakai út négy jeleneten át.
   GSAP + ScrollTrigger helyben (js/). Csökkentett mozgásnál / GSAP nélkül statikus. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduce && window.gsap && window.ScrollTrigger;
  if (!motion) document.documentElement.classList.add('no-motion');

  /* determinisztikus „véletlen” */
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent && parent.appendChild(n);
    return n;
  };
  const stars = (g, n, yMax) => {
    for (let i = 0; i < n; i++) {
      const r = rnd() < .9 ? .6 + rnd() * .9 : 1.6 + rnd() * .6;
      el('circle', { cx: (rnd() * 1600).toFixed(1), cy: (rnd() * yMax).toFixed(1), r: r.toFixed(2), fill: '#F5F4EF', opacity: (.25 + rnd() * .7).toFixed(2) }, g);
    }
  };

  /* ---------- jelenetek generált részletei ---------- */
  // hero: csillagos ég (teljes égbolt), part menti fények, nádas
  const sky = $('.sky');
  const skyStars = el('svg', { class: 'sky-stars', viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMin slice', 'aria-hidden': 'true' }, sky);
  skyStars.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0';
  stars(el('g', {}, skyStars), 170, 560);

  const hl = $('#h-lights');
  const lightSpots = [];
  for (let i = 0; i < 46; i++) {
    let x, y;
    if (i < 18) { x = 1000 + rnd() * 260; y = 236 + rnd() * 58; }          // Badacsony lejtői
    else if (i < 26) { x = 540 + rnd() * 120; y = 268 + rnd() * 26; }      // Szigliget
    else { x = rnd() * 1600; y = 286 + rnd() * 10; }                        // part menti falvak
    const g = el('g', { opacity: 0 }, hl);
    el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (4 + rnd() * 3).toFixed(1), fill: 'url(#g-dot)' }, g);
    el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: '1.1', fill: '#FFE6B5' }, g);
    lightSpots.push(g);
  }

  const reeds = $('#reeds');
  const clump = (x0, x1, base, n, hMax) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), h = 18 + rnd() * hMax, lean = (rnd() - .5) * 14;
      el('path', { d: `M${x.toFixed(1)} ${base} Q${(x + lean * .3).toFixed(1)} ${base - h * .6} ${(x + lean).toFixed(1)} ${(base - h).toFixed(1)}`, 'stroke-width': (1 + rnd() * 1.4).toFixed(2) }, reeds);
      if (rnd() > .82) el('ellipse', { cx: (x + lean).toFixed(1), cy: (base - h + 5).toFixed(1), rx: '1.8', ry: '6', fill: '#040D15' }, reeds);
    }
  };
  clump(0, 260, 452, 70, 46); clump(300, 420, 446, 22, 30); clump(1380, 1600, 486, 50, 44);

  // éjszakai út és záró jelenet csillagai, kifutópálya fényei
  stars($('#r-stars'), 220, 520);
  stars($('#f-stars'), 150, 480);
  const rw = $('#runway');
  for (let x = 20, i = 0; x < 1600; x += 44, i++) {
    const c = el('circle', { cx: x, cy: 687, r: 3.2 }, rw);
    if (motion) c.style.animation = `rabbit 2.2s ${(i * 0.06).toFixed(2)}s infinite`;
  }
  const kf = document.createElement('style');
  kf.textContent = '@keyframes rabbit{0%,100%{opacity:.35}8%{opacity:1}}';
  document.head.appendChild(kf);

  /* ---------- hero fényszórók helyzete ---------- */
  const road = $('#road-line'), lights = $('#headlights');
  const L = road.getTotalLength();
  const placeLights = t => {
    const p = road.getPointAtLength(L * t);
    lights.setAttribute('transform', `translate(${p.x.toFixed(1)} ${(p.y - 3).toFixed(1)}) scale(${(.5 + t * 1.6).toFixed(3)})`);
  };

  /* ---------- navigáció, mobil sáv ---------- */
  const nav = $('#nav'), route = $('.nav-route'), mbar = $('#mbar');
  const finalSec = $('#kapcsolat'), foot = $('.foot');
  let endZone = false;
  new IntersectionObserver(es => { endZone = es.some(e => e.isIntersecting) || false; tick(); }, { threshold: .15 }).observe(finalSec);
  function tick() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    route.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    const show = y > innerHeight * .9 && !endZone;
    mbar.classList.toggle('is-on', show);
    mbar.tabIndex = show ? 0 : -1;
    mbar.setAttribute('aria-hidden', String(!show));
  }
  addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });

  /* ---------- autó méretezése az úthoz ---------- */
  const ridePin = $('.ride-pin'), carWrap = $('.car-wrap');
  function sizeCar() {
    const W = ridePin.clientWidth, H = ridePin.clientHeight;
    const s = Math.max(W / 1600, H / 900);
    const k = Math.min(s * .95, (W * .62) / 440);
    carWrap.style.setProperty('--carW', (440 * k).toFixed(1));
    carWrap.style.setProperty('--carB', (100 * s - 7 * k).toFixed(1));
  }
  sizeCar();
  addEventListener('resize', sizeCar);

  /* ---------- mozgás ---------- */
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // betöltéskor a fényszóró megjelenik a távolban
    placeLights(.04);
    gsap.to(lights, { opacity: 1, duration: 1.2, delay: .6 });

    // HERO: naplemente → éjszaka, a fény közelít
    gsap.set('.layer-far, .layer-near > path', { filter: 'brightness(1)' });
    const hp = { t: .04 };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=120%', scrub: .7, pin: '.hero-pin', anticipatePin: 1 }
    });
    tl.to('.sky-night', { opacity: 1, duration: 1 }, 0)
      .to('#h-sun', { attr: { cy: 350 }, duration: .55 }, 0)
      .to('.sun-glow', { opacity: 0, duration: .6 }, 0)
      .to('#h-shimmer', { opacity: 0, duration: .45 }, 0)
      .to('#h-water-night', { opacity: .6, duration: .8 }, 0)
      .to('.layer-far, .layer-near > path', { filter: 'brightness(.55)', duration: .9 }, 0)
      .to(skyStars, { opacity: 1, duration: .6 }, .3)
      .to('#h-moon', { opacity: 1, attr: { cy: 150 }, duration: .7 }, .25)
      .to('#h-moonpath', { opacity: 1, duration: .5 }, .45)
      .to(lightSpots, { opacity: 1, duration: .25, stagger: { each: .012, from: 'random' } }, .3)
      .to(hp, { t: .9, duration: 1, onUpdate: () => placeLights(hp.t) }, 0)
      .to('.hero-caption, .scroll-hint', { opacity: 0, duration: .2 }, 0)
      .to('.hero-in', { y: -30, opacity: 0, duration: .2 }, .85);

    // ÉJSZAKAI ÚT: vízszintes haladás négy jeleneten át
    const track = $('#ride-track');
    const steps = $$('.ride-steps li');
    const spokes = $$('.ride-spokes').map(sp => { const b = sp.getBBox(); return [sp, b.x + b.width / 2, b.y + b.height / 2]; });
    const train = $('#train'), plane = $('#plane');
    const dist = () => track.scrollWidth - ridePin.clientWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.ride', start: 'top top', end: () => '+=' + dist() * 1.15, scrub: .8, pin: '.ride-pin', anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate(self) {
          const p = self.progress;
          const i = Math.min(3, Math.round(p * 3));
          steps.forEach((li, n) => { li.classList.toggle('is-on', n === i); li.classList.toggle('is-past', n < i); });
          spokes.forEach(([sp, cx, cy]) => sp.setAttribute('transform', `rotate(${(p * 360 * 16).toFixed(1)} ${cx} ${cy})`));
          carWrap.style.translate = `0 ${(Math.sin(p * 90) * .8).toFixed(2)}px`;
          const tp = gsap.utils.clamp(0, 1, (p - .45) / .4);
          train.setAttribute('transform', `translate(${(260 - tp * 900).toFixed(1)} 0)`);
          const lp = gsap.utils.clamp(0, 1, (p - .72) / .28);
          plane.setAttribute('transform', `translate(${(380 + lp * 760).toFixed(1)} ${(560 - lp * 360).toFixed(1)}) rotate(${(-8 - lp * 8).toFixed(1)})`);
        }
      }
    });
    train.setAttribute('transform', 'translate(260 0)');
    plane.setAttribute('transform', 'translate(380 560) rotate(-8)');

    // a fényszórós autó kicsit „beúszik”, amikor az út elkezdődik
    gsap.from(carWrap, { xPercent: -120, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: '.ride', start: 'top 70%', end: 'top top', scrub: .6 } });

    // záró jelenet: a szöveg és a hívógomb felúszik
    gsap.from('.final-in > *', { y: 24, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '.final', start: 'top 65%' } });

    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  } else {
    // statikus: esti hangulat, a fény a part közepén
    placeLights(.62);
    lights.setAttribute('opacity', '1');
    $('#plane').setAttribute('transform', 'translate(820 300) rotate(-12)');
    $('#train').setAttribute('transform', 'translate(200 0)');
  }

  /* ---------- működési terület ---------- */
  const tabs = $$('.places [role="tab"]'), pins = $$('.pin'), mapFig = $('.map');
  function selectPlace(id, focus) {
    tabs.forEach(t => {
      const on = t.dataset.place === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
    pins.forEach(p => {
      p.classList.remove('is-on'); void p.getBBox();
      p.classList.toggle('is-on', p.dataset.place === id || id === 'balaton');
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectPlace(t.dataset.place));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      selectPlace(tabs[(i + d + tabs.length) % tabs.length].dataset.place, true);
    });
  });
  pins.forEach(p => p.addEventListener('click', () => selectPlace(p.dataset.place)));
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (e.isIntersecting) { mapFig.classList.add('is-in'); selectPlace('maria'); o.disconnect(); }
  }), { threshold: .35 }).observe(mapFig);
  pins[0].classList.add('is-on');

  /* ---------- adatkezelés ---------- */
  const dlg = $('#privacy');
  $('#privacy-open').addEventListener('click', () => dlg.showModal ? dlg.showModal() : alert(dlg.textContent));

  tick();
})();
