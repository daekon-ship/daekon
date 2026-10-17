/* CB TAXI – Nyakas Péter · látványterv (DAEKON). Build nélkül, függőség nélkül. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- navigáció ---------- */
  const nav = $('#nav');
  const burger = $('.nav-burger');
  const menu = $('#menu');
  const route = $('.nav-route');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('is-solid', open || scrollY > 40);
    if (open) $('a', menu).focus();
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
  });

  /* aktív menüpont */
  const navLinks = $$('.nav-links a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-here', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['szolgaltatasok', 'fuvar', 'terulet', 'kapcsolat'].forEach(id => secIO.observe(document.getElementById(id)));

  /* ---------- hero: nádas ---------- */
  const reeds = $('#reeds');
  if (reeds) {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const clump = (x0, x1, base, n, hMax) => {
      for (let i = 0; i < n; i++) {
        const x = x0 + rnd() * (x1 - x0);
        const h = 18 + rnd() * hMax;
        const lean = (rnd() - .5) * 14;
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', `M${x.toFixed(1)} ${base} Q${(x + lean * .3).toFixed(1)} ${base - h * .6} ${(x + lean).toFixed(1)} ${(base - h).toFixed(1)}`);
        p.setAttribute('stroke-width', (1 + rnd() * 1.4).toFixed(2));
        reeds.appendChild(p);
        if (rnd() > .82) {
          const t = document.createElementNS(NS, 'ellipse');
          t.setAttribute('cx', (x + lean).toFixed(1)); t.setAttribute('cy', (base - h + 5).toFixed(1));
          t.setAttribute('rx', '1.8'); t.setAttribute('ry', '6'); t.setAttribute('fill', '#040D15');
          reeds.appendChild(t);
        }
      }
    };
    clump(0, 260, 452, 70, 46);
    clump(300, 420, 446, 22, 30);
    clump(1380, 1600, 486, 50, 44);
  }

  /* ---------- hero: fényszórók az úton (egyszer, betöltéskor) ---------- */
  const road = $('#road-line'), lights = $('#headlights');
  if (road && lights) {
    const L = road.getTotalLength();
    const place = t => {
      const p = road.getPointAtLength(L * t);
      const s = .55 + t * 1.1; // a közeledő fény nagyobb
      lights.setAttribute('transform', `translate(${p.x} ${p.y - 3}) scale(${s})`);
    };
    const end = .62;
    if (reduce) { place(end); lights.setAttribute('opacity', '1'); }
    else {
      const t0 = performance.now() + 500, dur = 4200;
      const step = now => {
        const k = Math.min(1, Math.max(0, (now - t0) / dur));
        const e = 1 - Math.pow(1 - k, 3);
        place(.04 + (end - .04) * e);
        lights.setAttribute('opacity', String(Math.min(1, k * 4)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  /* ---------- görgetés: nav, útvonalcsík, parallax, országút ---------- */
  const far = $('.layer-far'), near = $('.layer-near');
  const hero = $('.hero');
  const journey = $('.journey'), dash = $('#jr-dash'), jrHills = $('.jr-hills');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    if (menu.hidden) nav.classList.toggle('is-solid', y > 40);
    const max = document.documentElement.scrollHeight - vh;
    route.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    if (!reduce) {
      const hh = hero.offsetHeight;
      if (y < hh) {
        far && far.setAttribute('transform', `translate(0 ${(y * .06).toFixed(1)})`);
        near && near.setAttribute('transform', `translate(0 ${(y * .03).toFixed(1)})`);
      }
      const r = journey.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = (vh - r.top) / (vh + r.height); // 0..1 a szekción át
        dash.style.strokeDashoffset = (-p * 560).toFixed(1);
        jrHills.setAttribute('transform', `translate(0 ${((p - .5) * 14).toFixed(1)})`);
      }
    }
    mobileBar();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);

  /* lépések megjelenése */
  const steps = $('.steps');
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (e.isIntersecting) { steps.classList.add('is-in'); o.disconnect(); }
  }), { threshold: .3 }).observe(steps);

  /* ---------- szolgáltatások ---------- */
  const srvs = $$('.srv'), vigs = $$('.vig');
  const activate = v => {
    srvs.forEach(s => s.classList.toggle('is-on', s.dataset.v === v));
    vigs.forEach(s => s.classList.toggle('is-on', s.dataset.v === v));
  };
  srvs.forEach(s => {
    s.addEventListener('mouseenter', () => activate(s.dataset.v));
    s.addEventListener('focusin', () => activate(s.dataset.v));
  });
  /* görgetéskor is váltson asztali nézetben */
  const srvIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && matchMedia('(min-width:901px)').matches) activate(e.target.dataset.v);
  }), { rootMargin: '-48% 0px -48% 0px' });
  srvs.forEach(s => srvIO.observe(s));

  /* ---------- fuvarigénylés ---------- */
  const form = $('#bk-form');
  const done = $('#bk-done');
  const air = $('#airport');
  const T = k => $(`[data-t="${k}"]`);
  const typeNames = { helyi: 'Helyi fuvar', tavolsagi: 'Távolsági fuvar', transzfer: 'Transzfer', repteri: 'Reptéri transzfer' };
  const F = n => form.elements[n];

  const today = new Date();
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  F('datum').min = iso(today);
  $('#a-date').min = iso(today);

  const fmtDate = v => {
    if (!v) return '';
    const d = new Date(v + 'T12:00');
    return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  function setTicket(key, text) {
    const el = T(key);
    const val = text || el.dataset.empty;
    if (el.textContent === val) return;
    el.textContent = val;
    el.classList.toggle('is-empty', !text);
    if (text && !reduce) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
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
      const parts = [F('irany').value === 'erkezes' ? 'Érkezés a reptérre, onnan indulás' : 'Indulás a reptérre'];
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
    const toLbl = $('label[for="f-to"]');
    toLbl.textContent = t === 'repteri' && F('irany').value === 'erkezes' ? 'Úti cél a reptérről' : 'Úti cél';
    syncTicket();
  }
  form.addEventListener('change', e => {
    if (e.target.name === 'tipus' || e.target.name === 'irany') setType(F('tipus').value);
    else syncTicket();
    if (e.target.closest('.f.bad')) validateField(e.target);
  });
  form.addEventListener('input', e => {
    syncTicket();
    if (e.target.closest('.f.bad')) validateField(e.target);
  });

  /* ellenőrzés */
  const rules = {
    honnan: v => v.trim() ? '' : 'Adja meg, honnan indulna.',
    hova: (v) => v.trim() || (F('tipus').value === 'repteri' && F('repuloter').value) ? '' : 'Adja meg az úti célt.',
    repuloter: v => F('tipus').value !== 'repteri' || v ? '' : 'Válassza ki a repülőteret.',
    datum: v => {
      if (!v) return 'Válassza ki az indulás napját.';
      return v < iso(new Date()) ? 'A dátum nem lehet a mai napnál korábbi.' : '';
    },
    ido: v => v ? '' : 'Adja meg az indulás időpontját.',
    utasok: v => v ? '' : 'Hányan utaznak?',
    nev: v => v.trim().length > 1 ? '' : 'Adja meg a nevét.',
    telefon: v => v.replace(/\D/g, '').length >= 9 ? '' : 'Adjon meg egy hívható telefonszámot (pl. +36 30 123 4567).',
    email: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Az e-mail-cím formátuma hibás (pl. nev@pelda.hu).'
  };
  const errFor = { honnan: 'e-from', hova: 'e-to', repuloter: 'e-air', datum: 'e-date', ido: 'e-time', utasok: 'e-pax', nev: 'e-name', telefon: 'e-tel', email: 'e-mail' };

  function validateField(el) {
    const name = el.name;
    if (!rules[name]) return true;
    const msg = rules[name](el.value);
    const wrap = el.closest('.f');
    const err = document.getElementById(errFor[name]);
    wrap.classList.toggle('bad', !!msg);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) el.setAttribute('aria-describedby', errFor[name]); else el.removeAttribute('aria-describedby');
    err.textContent = msg;
    return !msg;
  }
  Object.keys(rules).forEach(n => F(n).addEventListener('blur', e => { if (e.target.value) validateField(e.target); }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    Object.keys(rules).forEach(n => { if (!validateField(F(n)) && !first) first = F(n); });
    if (first) {
      $('#bk-status').textContent = 'Néhány mező hiányzik vagy hibás.';
      first.focus();
      return;
    }
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
    $('#bk-mail').href = 'mailto:taxispeter@gmail.com?subject=' + encodeURIComponent('Fuvarajánlat kérése – ' + typeNames[d.tipus]) + '&body=' + encodeURIComponent('Kedves Péter!\n\nAjánlatot kérnék az alábbi útra:\n\n' + lines.join('\n') + '\n\nKöszönöm!');
    form.hidden = true;
    done.hidden = false;
    done.focus();
    $('#bk-status').textContent = 'Az ajánlatkérés összeállt (bemutató, nem lett elküldve).';
  });
  $('#bk-edit').addEventListener('click', () => { done.hidden = true; form.hidden = false; F('honnan').focus(); });

  /* ugrás az űrlaphoz, előválasztott típussal */
  function gotoForm(type) {
    done.hidden = true; form.hidden = false;
    if (type) setType(type);
    const top = document.getElementById('fuvar').getBoundingClientRect().top + scrollY - 64;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    const firstEmpty = ['honnan', 'hova', 'datum', 'ido', 'utasok', 'nev', 'telefon'].map(F).find(el => !el.value);
    setTimeout(() => (firstEmpty || F('honnan')).focus({ preventScroll: true }), reduce ? 0 : 650);
  }
  $$('[data-type]').forEach(b => b.addEventListener('click', () => gotoForm(b.dataset.type)));
  $$('[data-goto-form]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); setMenu(false); gotoForm(); }));

  /* reptéri mini-űrlap → teljes ajánlatkérő */
  $('#ap-form').addEventListener('submit', e => {
    e.preventDefault();
    setType('repteri');
    F('honnan').value = $('#a-from').value;
    if ($('#a-air').value) F('repuloter').value = $('#a-air').value;
    if ($('#a-date').value) F('datum').value = $('#a-date').value;
    if ($('#a-pax').value) F('utasok').value = $('#a-pax').value;
    F('irany').value = 'indulas';
    syncTicket();
    $$('.f.bad input, .f.bad select', form).forEach(validateField);
    gotoForm();
  });

  /* ---------- működési terület ---------- */
  const tabs = $$('.places [role="tab"]');
  const pins = $$('.pin');
  const mapFig = $('.map');
  function selectPlace(id, focus) {
    tabs.forEach(t => {
      const on = t.dataset.place === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
    pins.forEach(p => p.classList.toggle('is-on', p.dataset.place === id || id === 'balaton'));
    mapFig.classList.toggle('all', id === 'balaton');
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
  selectPlace('maria');

  /* ---------- mobil kezelősáv ---------- */
  const mbar = $('#mbar');
  const hideZones = [document.getElementById('fuvar'), document.getElementById('indulas'), $('.foot')];
  const visible = new Set();
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)), { threshold: .05 })
    .observe(hideZones[0]);
  hideZones.slice(1).forEach(z => z && new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)), { threshold: .05 }).observe(z));
  function mobileBar() {
    const show = scrollY > hero.offsetHeight * .7 && visible.size === 0 && menu.hidden;
    mbar.classList.toggle('is-on', show);
    $$('a', mbar).forEach(a => a.tabIndex = show ? 0 : -1);
    mbar.setAttribute('aria-hidden', String(!show));
  }

  /* ---------- adatkezelés ---------- */
  const dlg = $('#privacy');
  $('#privacy-open').addEventListener('click', () => dlg.showModal ? dlg.showModal() : alert(dlg.textContent));

  syncTicket();
  onScroll();
})();
