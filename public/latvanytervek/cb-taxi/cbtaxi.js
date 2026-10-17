/* CB TAXI – Nyakas Péter · látványterv (DAEKON) · 4. kör
   - Hero: naplemente → éjszaka görgetésre, a kisbusz betölt, majd továbbhajt.
   - Szolgáltatások: vízszintes éjszakai út (asztalon, tableten); mobilon egymás alatti jelenetek.
   - Ajánlatkérő: valódi ellenőrzés, küldéskor előre kitöltött e-mail a taxispeter@gmail.com címre.
     Nincs háttérrendszer, ezért az oldal soha nem jelez „sikeresen elküldve” állapotot.
   GSAP + ScrollTrigger helyben (js/). Csökkentett mozgásnál / GSAP nélkül minden statikus. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduce && window.gsap && window.ScrollTrigger;
  if (!motion) document.documentElement.classList.add('no-motion');

  /* ---------- segédek ---------- */
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent && parent.appendChild(n);
    return n;
  };
  const stars = (g, n, yMax) => {
    if (!g) return;
    for (let i = 0; i < n; i++) {
      const r = rnd() < .9 ? .6 + rnd() * .9 : 1.6 + rnd() * .6;
      el('circle', { cx: (rnd() * 1600).toFixed(1), cy: (rnd() * yMax).toFixed(1), r: r.toFixed(2), fill: '#F5F4EF', opacity: (.25 + rnd() * .7).toFixed(2) }, g);
    }
  };
  /* a <use href="#van"> helyére a kisbusz saját példánya, hogy a kerekei foroghassanak */
  const vanSym = $('#van');
  const inlineVan = svg => {
    const u = svg.querySelector('use[href="#van"]');
    if (!u) return [];
    const g = el('g', {});
    vanSym.childNodes.forEach(n => g.appendChild(n.cloneNode(true)));
    u.replaceWith(g);
    return $$('.spokes', g).map(sp => [sp, +sp.parentNode.firstElementChild.getAttribute('cx'), +sp.parentNode.firstElementChild.getAttribute('cy')]);
  };
  const spin = (list, deg) => list.forEach(([sp, cx, cy]) => sp.setAttribute('transform', `rotate(${deg.toFixed(1)} ${cx} ${cy})`));

  /* ---------- generált jelenetrészletek ---------- */
  const sky = $('.sky');
  const skyStars = el('svg', { class: 'sky-stars', viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMin slice', 'aria-hidden': 'true' }, sky);
  skyStars.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0';
  stars(el('g', {}, skyStars), 170, 560);

  const hl = $('#h-lights'), lightSpots = [];
  for (let i = 0; i < 46; i++) {
    let x, y;
    if (i < 18) { x = 1000 + rnd() * 260; y = 236 + rnd() * 58; }
    else if (i < 26) { x = 540 + rnd() * 120; y = 268 + rnd() * 26; }
    else { x = rnd() * 1600; y = 286 + rnd() * 10; }
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
    }
  };
  clump(0, 260, 506, 60, 52); clump(1380, 1600, 506, 44, 46);
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

  /* ---------- kisbuszok ---------- */
  const heroVan = $('.hero-van'), heroScene = $('.hero .scene');
  const heroSpokes = inlineVan($('svg', heroVan));
  const rideSpokes = $$('.ride-spokes').map(sp => { const c = sp.parentNode.firstElementChild; return [sp, +c.getAttribute('cx'), +c.getAttribute('cy')]; });
  const ride = $('.ride'), ridePin = $('.ride-pin'), carWrap = $('.car-wrap');
  const panels = $$('.panel');
  panels.forEach(p => {
    const v = el('svg', { class: 'panel-van van', viewBox: '0 0 460 190', overflow: 'visible', 'aria-hidden': 'true' }, p);
    el('polygon', { class: 'beam', points: '436,110 1260,56 1260,206', fill: 'url(#g-carbeam)' }, v);
    el('use', { href: '#van' }, v);
  });

  function sizeVans() {
    // hero: a kerekek az előtéri útra kerülnek
    const s = heroScene.getBoundingClientRect().width / 1600;
    const vh = heroVan.getBoundingClientRect().width * 190 / 460;
    heroVan.style.setProperty('--vanB', ((560 - 541) * s - vh * 4 / 190).toFixed(1));
    // éjszakai út
    const W = ridePin.clientWidth, H = ridePin.clientHeight;
    const rs = Math.max(W / 1600, H / 900);
    const k = Math.min(rs * .78, (W * .6) / 460);
    carWrap.style.setProperty('--carW', (460 * k).toFixed(1));
    carWrap.style.setProperty('--carB', (100 * rs - 4 * k).toFixed(1));
    // egymás alatti jelenetek
    panels.forEach(p => {
      const sc = $('.pscene', p), v = $('.panel-van', p);
      const r = sc.getBoundingClientRect();
      if (!r.width) return;
      const vb = sc.viewBox.baseVal;
      const ps = Math.max(r.width / vb.width, r.height / vb.height);
      const bottomGap = (vb.y + vb.height - 800) * ps;
      const pvh = v.getBoundingClientRect().width * 190 / 460;
      p.style.setProperty('--pvB', (bottomGap - pvh * 4 / 190).toFixed(1));
    });
  }

  /* ---------- navigáció, mobil sáv ---------- */
  const nav = $('#nav'), route = $('.nav-route'), mbar = $('#mbar');
  const hide = new Set();
  const watch = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? hide.add(e.target) : hide.delete(e.target)); tick(); }, { threshold: .02 });
  ['#fuvar', '#kapcsolat', '.foot'].forEach(q => watch.observe($(q)));
  function tick() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    route.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    const show = y > innerHeight * .9 && hide.size === 0;
    mbar.classList.toggle('is-on', show);
    $$('a', mbar).forEach(a => a.tabIndex = show ? 0 : -1);
    mbar.setAttribute('aria-hidden', String(!show));
  }
  addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true });

  /* ---------- mozgás ---------- */
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const mm = gsap.matchMedia();

    // betöltéskor a kisbusz begurul és megáll
    gsap.fromTo(heroVan, { x: () => -innerWidth * .55, opacity: 0 }, {
      x: 0, opacity: 1, duration: 2.2, ease: 'power3.out', delay: .3,
      onUpdate() { spin(heroSpokes, gsap.getProperty(heroVan, 'x') * 1.4); }
    });

    // HERO: naplemente → éjszaka, a lámpák felkapcsolnak, a végén a busz továbbhajt
    gsap.set('.layer-far, .layer-near > path', { filter: 'brightness(1)' });
    const hp = { x: 0 };
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=80%', scrub: .7, pin: '.hero-pin', anticipatePin: 1 }
    })
      .to('.sky-night', { opacity: 1, duration: 1 }, 0)
      .to('#h-sun', { attr: { cy: 350 }, duration: .55 }, 0)
      .to('.sun-glow', { opacity: 0, duration: .6 }, 0)
      .to('#h-shimmer', { opacity: 0, duration: .45 }, 0)
      .to('#h-water-night', { opacity: .6, duration: .8 }, 0)
      .to('.layer-far, .layer-near > path', { filter: 'brightness(.6)', duration: .9 }, 0)
      .to(skyStars, { opacity: 1, duration: .6 }, .3)
      .to('#h-moon', { opacity: 1, attr: { cy: 150 }, duration: .7 }, .25)
      .to('#h-moonpath', { opacity: 1, duration: .5 }, .45)
      .to(lightSpots, { opacity: 1, duration: .25, stagger: { each: .012, from: 'random' } }, .3)
      .to('.van-beam', { opacity: .95, duration: .6 }, .2)
      .to('.hero-caption, .scroll-hint', { opacity: 0, duration: .2 }, 0)
      .to(hp, { x: 1, duration: .35, ease: 'power2.in', onUpdate() {
        const dx = hp.x * innerWidth * .9;
        heroVan.style.translate = `${dx.toFixed(1)}px 0`;
        spin(heroSpokes, dx * 1.4);
      } }, .75)
      .to('.hero-in', { y: -30, opacity: 0, duration: .2 }, .85);

    // ÉJSZAKAI ÚT asztalon/tableten: vízszintes haladás
    mm.add('(min-width: 768px)', () => {
      ride.classList.remove('is-stacked');
      sizeVans();
      const track = $('#ride-track');
      const steps = $$('.ride-steps li');
      const train = $('#train'), plane = $('#plane');
      const dist = () => track.scrollWidth - ridePin.clientWidth;
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.ride', start: 'top top', end: () => '+=' + dist() * 1.1, scrub: .8, pin: '.ride-pin', anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate(self) {
            const p = self.progress;
            const i = Math.min(3, Math.round(p * 3));
            steps.forEach((li, n) => { li.classList.toggle('is-on', n === i); li.classList.toggle('is-past', n < i); });
            spin(rideSpokes, p * 360 * 16);
            const tp = gsap.utils.clamp(0, 1, (p - .45) / .4);
            train.setAttribute('transform', `translate(${(260 - tp * 900).toFixed(1)} 0)`);
            const lp = gsap.utils.clamp(0, 1, (p - .72) / .28);
            plane.setAttribute('transform', `translate(${(380 + lp * 760).toFixed(1)} ${(560 - lp * 360).toFixed(1)}) rotate(${(-8 - lp * 8).toFixed(1)})`);
          }
        }
      });
      train.setAttribute('transform', 'translate(260 0)');
      plane.setAttribute('transform', 'translate(380 560) rotate(-8)');
      gsap.from(carWrap, { xPercent: -140, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: '.ride', start: 'top 70%', end: 'top top', scrub: .6 } });
    });

    // mobilon: nincs rögzítés, a jelenetek egymás alatt, finom felúszással
    mm.add('(max-width: 767px)', () => {
      ride.classList.add('is-stacked');
      $$('.pscene').forEach(sc => sc.setAttribute('viewBox', '300 430 1000 470'));
      $('#train').setAttribute('transform', 'translate(120 0)');
      $('#plane').setAttribute('transform', 'translate(980 520) rotate(-14)');
      requestAnimationFrame(sizeVans);
      panels.forEach(p => {
        gsap.from($('.panel-van', p), { xPercent: -90, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 55%' } });
      });
      return () => { ride.classList.remove('is-stacked'); $$('.pscene').forEach(sc => sc.setAttribute('viewBox', '0 0 1600 900')); };
    });

    // finom felúszás a világos és a záró szekciókban (egyszer)
    $$('.booking-side, .bk-form, .area-text, .final-in').forEach(n => {
      gsap.from(n, { y: 28, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 82%' } });
    });

    addEventListener('resize', sizeVans);
    document.fonts && document.fonts.ready.then(() => { sizeVans(); ScrollTrigger.refresh(); });
  } else {
    $('#plane').setAttribute('transform', 'translate(820 300) rotate(-12)');
    $('#train').setAttribute('transform', 'translate(200 0)');
    $('.van-beam').style.opacity = '.8';
    addEventListener('resize', sizeVans);
  }
  sizeVans();
  addEventListener('load', sizeVans);

  /* ---------- ajánlatkérő ---------- */
  const form = $('#bk-form'), done = $('#bk-done'), air = $('#airport');
  const T = k => $(`[data-t="${k}"]`);
  const typeNames = { helyi: 'Helyi fuvar', tavolsagi: 'Távolsági fuvar', transzfer: 'Transzfer', repteri: 'Reptéri transzfer' };
  const F = n => form.elements[n];
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  F('datum').min = iso(new Date());
  const fmtDate = v => v ? new Date(v + 'T12:00').toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) : '';

  function setTicket(key, text) {
    const e = T(key), val = text || e.dataset.empty;
    if (e.textContent === val) return;
    e.textContent = val;
    e.classList.toggle('is-empty', !text);
    if (text && !reduce) { e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); }
  }
  function syncTicket() {
    const type = F('tipus').value;
    T('type').textContent = typeNames[type];
    setTicket('from', F('honnan').value.trim());
    setTicket('to', type === 'repteri' && F('repuloter').value && !F('hova').value.trim() ? F('repuloter').value : F('hova').value.trim());
    setTicket('date', fmtDate(F('datum').value));
    setTicket('time', F('ido').value);
    const pax = F('utasok').value;
    setTicket('pax', pax ? (pax === '7+' ? '7 vagy több' : pax + ' fő') : '');
    const b = F('csomag').value;
    setTicket('bags', b === '0' ? 'nincs' : b === '5+' ? '5+ db' : b + ' db');
    const a = T('air');
    if (type === 'repteri') {
      const parts = [F('irany').value === 'erkezes' ? 'Érkezés, a reptérről indulna' : 'Indulás a reptérre'];
      if (F('repuloter').value) parts.push(F('repuloter').value);
      if (F('jarat').value.trim()) parts.push('járat: ' + F('jarat').value.trim());
      a.textContent = parts.join(', ');
      a.hidden = false;
    } else a.hidden = true;
    $('#pax-note').hidden = pax !== '7+';
  }
  function setType(t) {
    const r = $(`input[name="tipus"][value="${t}"]`, form);
    if (r) r.checked = true;
    air.hidden = t !== 'repteri';
    F('repuloter').required = t === 'repteri';
    $('label[for="f-to"]').textContent = t === 'repteri' && F('irany').value === 'erkezes' ? 'Úti cél a reptérről' : 'Úti cél';
    syncTicket();
  }
  const rules = {
    honnan: v => v.trim() ? '' : 'Adja meg, honnan indulna.',
    hova: v => v.trim() || (F('tipus').value === 'repteri' && F('repuloter').value) ? '' : 'Adja meg az úti célt.',
    repuloter: v => F('tipus').value !== 'repteri' || v ? '' : 'Válassza ki a repülőteret.',
    datum: v => !v ? 'Válassza ki az indulás napját.' : v < iso(new Date()) ? 'A dátum nem lehet a mai napnál korábbi.' : '',
    ido: v => v ? '' : 'Adja meg az indulás időpontját.',
    utasok: v => v ? '' : 'Hányan utaznak?',
    nev: v => v.trim().length > 1 ? '' : 'Adja meg a nevét.',
    telefon: v => v.replace(/\D/g, '').length >= 9 ? '' : 'Adjon meg egy hívható telefonszámot (pl. +36 30 123 4567).',
    email: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Az e-mail-cím formátuma hibás (pl. nev@pelda.hu).'
  };
  const errFor = { honnan: 'e-from', hova: 'e-to', repuloter: 'e-air', datum: 'e-date', ido: 'e-time', utasok: 'e-pax', nev: 'e-name', telefon: 'e-tel', email: 'e-mail' };
  function validateField(f) {
    if (!rules[f.name]) return true;
    const msg = rules[f.name](f.value), err = document.getElementById(errFor[f.name]);
    f.closest('.f').classList.toggle('bad', !!msg);
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    msg ? f.setAttribute('aria-describedby', errFor[f.name]) : f.removeAttribute('aria-describedby');
    err.textContent = msg;
    return !msg;
  }
  form.addEventListener('change', e => {
    if (e.target.name === 'tipus' || e.target.name === 'irany') setType(F('tipus').value); else syncTicket();
    if (e.target.closest('.f.bad')) validateField(e.target);
  });
  form.addEventListener('input', e => { syncTicket(); if (e.target.closest('.f.bad')) validateField(e.target); });
  Object.keys(rules).forEach(n => F(n).addEventListener('blur', e => { if (e.target.value) validateField(e.target); }));

  let mailText = '';
  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    Object.keys(rules).forEach(n => { if (!validateField(F(n)) && !first) first = F(n); });
    if (first) { $('#bk-status').textContent = 'Néhány mező hiányzik vagy hibás.'; first.focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    const lines = [
      `Fuvar típusa: ${typeNames[d.tipus]}`,
      `Indulási hely: ${d.honnan}`,
      `Úti cél: ${d.hova || d.repuloter}`,
      d.tipus === 'repteri' ? `Repülőtér: ${d.repuloter} (${d.irany === 'erkezes' ? 'érkezés' : 'indulás'})${d.jarat ? ', járat: ' + d.jarat : ''}` : null,
      `Dátum, időpont: ${d.datum} ${d.ido}`,
      `Utasok: ${d.utasok}, csomagok: ${d.csomag}`,
      `Név: ${d.nev}`, `Telefon: ${d.telefon}`, d.email ? `E-mail: ${d.email}` : null,
      d.megjegyzes ? `Megjegyzés: ${d.megjegyzes}` : null
    ].filter(Boolean);
    mailText = 'Kedves Péter!\n\nEgyedi ajánlatot kérnék az alábbi útra:\n\n' + lines.join('\n') + '\n\nKöszönöm!';
    const href = 'mailto:taxispeter@gmail.com?subject=' + encodeURIComponent('Fuvarajánlat kérése – ' + typeNames[d.tipus]) + '&body=' + encodeURIComponent(mailText);
    $('#bk-mail').href = href;
    form.hidden = true; done.hidden = false; done.focus();
    $('#bk-status').textContent = 'Az e-mail-program megnyílik az előre kitöltött ajánlatkéréssel.';
    location.href = href;
  });
  $('#bk-edit').addEventListener('click', () => { done.hidden = true; form.hidden = false; F('honnan').focus(); });
  $('#bk-copy').addEventListener('click', async () => {
    const st = $('#bk-copy-status');
    try { await navigator.clipboard.writeText(mailText); st.textContent = 'A szöveg a vágólapra került.'; $('#bk-copy').textContent = 'Kimásolva'; }
    catch { st.textContent = 'A másolás nem sikerült, jelölje ki a szöveget kézzel.'; }
  });

  function gotoForm(type) {
    done.hidden = true; form.hidden = false;
    if (type) setType(type);
    const top = document.getElementById('fuvar').getBoundingClientRect().top + scrollY - 64;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    const firstEmpty = ['honnan', 'hova', 'datum', 'ido', 'utasok', 'nev', 'telefon'].map(F).find(f => !f.value);
    setTimeout(() => (firstEmpty || F('honnan')).focus({ preventScroll: true }), reduce ? 0 : 900);
  }
  $$('[data-type]').forEach(b => b.addEventListener('click', () => gotoForm(b.dataset.type)));
  $$('[data-goto-form]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); gotoForm(); }));
  syncTicket();

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
    pins.forEach(p => { p.classList.remove('is-on'); void p.getBBox(); p.classList.toggle('is-on', p.dataset.place === id || id === 'balaton'); });
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
