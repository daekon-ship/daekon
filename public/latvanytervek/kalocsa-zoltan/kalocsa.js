/* Kalocsa GeoWorks – gépi földmunka · látványterv (5. kör) · DAEKON */
(() => {
  'use strict';
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];

  /* ---------- BEÁLLÍTÁSOK ---------- */
  // A végleges munkagépes videó (Higgsfield, jóváhagyás után). Amíg mp4 = null, a valódi munkafotókból álló jelenetsor fut.
  // Asztali gépen görgetésre pörög (scrub, mint a referenciavideón), mobilon némítva, hurokban játszik.
  // A fájlokat a _forras/video.sh állítja elő a nyers Higgsfield-exportból.
  const HERO_VIDEO = {
    mp4: null,                       // pl. 'video/hero-scrub-1920.mp4' (sűrű kulcskockás, görgetéshez)
    mobileMp4: null,                 // pl. 'video/hero-loop-720.mp4'
    poster: 'img/hero-kisgep-1425.webp', // pl. 'video/hero-poster.webp'
    stages: ['Kanál le', 'Ásás', 'Kiemelés', 'Föld oldalra'] // a fázisjelző feliratai videó esetén
  };
  // Ajánlatkérő végpont (pl. saját PHP/Node végpont vagy űrlapszolgáltatás). null = bemutató mód, NEM küld adatot.
  const AJANLAT = { endpoint: null, maxFiles: 5, maxBytes: 8 * 1024 * 1024 };
  // Térkép
  const MAP = { center: [46.9062, 19.6913], radiusM: 45000 };

  /* ---------- ANALITIKA (GA4 / dataLayer – hozzájárulás után kapcsolandó) ---------- */
  window.dataLayer = window.dataLayer || [];
  const track = (event, params = {}) => {
    window.dataLayer.push({ event, ...params });
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
  };
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href^="tel:"]');
    if (a) track('phone_click', { location: a.closest('section,header,footer,.fab')?.id || a.className || 'page' });
  });

  /* ---------- HERO VIDEÓ ---------- */
  const conn = navigator.connection;
  const isMobile = matchMedia('(max-width: 860px)').matches;
  let heroVideo = null;
  if (!reduce && !(conn && conn.saveData) && HERO_VIDEO.mp4) {
    const v = d.createElement('video');
    v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.preload = 'auto'; v.poster = HERO_VIDEO.poster;
    v.className = 'hero__video'; v.setAttribute('aria-hidden', 'true');
    if (isMobile) { v.loop = true; v.autoplay = true; v.setAttribute('autoplay', ''); }
    v.src = (isMobile && HERO_VIDEO.mobileMp4) || HERO_VIDEO.mp4;
    v.style.opacity = 0;
    const ready = () => { v.style.transition = 'opacity .8s'; v.style.opacity = 1; setTimeout(() => $$('.scene').forEach(s => s.style.visibility = 'hidden'), 900); };
    v.addEventListener(isMobile ? 'playing' : 'loadeddata', ready, { once: true });
    $('#hero-media').appendChild(v);
    if (isMobile) { const p = v.play(); if (p) p.catch(() => { /* autoplay tiltva: marad a fotós jelenetsor */ }); }
    // fázisjelző feliratai a videó szakaszaihoz
    $$('.stages li span').forEach((s, i) => { if (HERO_VIDEO.stages[i]) s.textContent = HERO_VIDEO.stages[i]; });
    heroVideo = v;
  }

  /* ---------- FEJLÉC, HÍVÓGOMB, AKTÍV MENÜ ---------- */
  const hdr = $('#fejlec'), fab = $('#fab'), hero = $('.hero');
  const navLinks = $$('.nav a[href^="#"]');
  const spy = ['fooldal', 'szolgaltatasok', 'szuk-hely', 'munkaim', 'rolam', 'folyamat', 'munkaterulet', 'ajanlat'].map(id => d.getElementById(id));
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 20);
    fab.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
    // aktív menüpont
    let cur = spy[0];
    spy.forEach(s => { if (s && s.getBoundingClientRect().top < innerHeight * 0.35) cur = s; });
    let id = cur.id;
    if (id === 'szuk-hely') id = 'szolgaltatasok';
    if (id === 'folyamat') id = 'rolam';
    const featOpen = $('#tab-kiemelt').getAttribute('aria-selected') === 'true';
    navLinks.forEach(a => {
      let on = a.getAttribute('href') === '#' + id;
      if (a.dataset.tab) on = on && ((a.dataset.tab === 'kiemelt') === featOpen);
      a.classList.toggle('is-active', on);
    });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // űrlapkitöltés közben (mobil billentyűzet) a hívógomb ne takarjon
  d.addEventListener('focusin', e => fab.classList.toggle('is-typing', !!e.target.closest('.form input:not([type=checkbox]), .form textarea, .form select')));
  d.addEventListener('focusout', () => fab.classList.remove('is-typing'));

  /* ---------- MOBILMENÜ ---------- */
  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    d.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  /* ---------- MUNKÁIM: FÜLEK ---------- */
  const tabs = $$('.tab');
  let featSeen = false;
  const selectTab = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      d.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
    if (tab.id === 'tab-kiemelt' && !featSeen) { featSeen = true; track('featured_project_open', { via: 'tab' }); }
    if (window.gsap && !reduce) {
      const p = d.getElementById(tab.getAttribute('aria-controls'));
      gsap.fromTo(p.children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .08, ease: 'expo.out', overwrite: true });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
    onScroll();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true); }
    });
  });
  $$('[data-tab]').forEach(a => a.addEventListener('click', () => selectTab(d.getElementById('tab-' + a.dataset.tab))));

  // portfolio_view – első megtekintéskor
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { track('portfolio_view', { via: 'scroll' }); io.disconnect(); } }), { threshold: .25 });
    io.observe($('#munkaim'));
  }

  /* ---------- KIEMELT MUNKÁK: nézetváltás ---------- */
  $$('.feat').forEach(f => {
    const main = $('.feat__main img', f), svg = $('.feat__svg', f);
    $$('.feat__thumbs button', f).forEach(b => b.addEventListener('click', () => {
      $$('.feat__thumbs button', f).forEach(x => x.classList.toggle('is-on', x === b));
      if (b.dataset.view) { const s = b.dataset.view === 'svg'; svg && svg.toggleAttribute('hidden', !s); main.style.opacity = s ? 0 : 1; }
      if (b.dataset.src) { main.src = b.dataset.src; main.dataset.lb = b.dataset.i || (/melyebb/.test(b.dataset.src) ? 6 : 0); }
      const badge = $('.feat__badge', f); if (badge) badge.hidden = !(b.dataset.src && /melyebb/.test(b.dataset.src));
      track('featured_project_open', { project: f.dataset.feat, view: b.dataset.view || b.dataset.i });
    }));
  });

  /* ---------- LIGHTBOX ---------- */
  const LB = [
    ['img/kozmuarok-1200.webp', 'Közműárok-ásás'], ['img/tusko-1200.webp', 'Tuskóeltávolítás'],
    ['img/fas-terulet-2-1200.webp', 'Kisgép munka közben'], ['img/fas-terulet-1-1200.webp', 'Terület-előkészítés'],
    ['img/talajrendezes-1-1200.webp', 'Tereprendezés'], ['img/talajrendezes-2-1200.webp', 'Tereprendezés – más nézet'],
    ['img/kozmuarok-melyebb-1200.webp', 'Közműárok-ásás – szerkesztett fénykép, mélyebb hatás']
  ];
  const lb = $('#lb'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let cur = 0, last = null;
  const show = i => { cur = (i + LB.length) % LB.length; lbImg.src = LB[cur][0]; lbImg.alt = LB[cur][1]; lbCap.textContent = `${String(cur + 1).padStart(2, '0')} · ${LB[cur][1]}`; };
  const open = i => { last = d.activeElement; show(i); lb.hidden = false; d.body.style.overflow = 'hidden'; $('.lb__x', lb).focus(); track('portfolio_view', { via: 'lightbox', image: i + 1 }); };
  const close = () => { lb.hidden = true; d.body.style.overflow = ''; last && last.focus(); };
  d.addEventListener('click', e => { const t = e.target.closest('[data-lb]'); if (t && !t.closest('.feat__main svg')) open(+t.dataset.lb); });
  $('.lb__x', lb).addEventListener('click', close);
  $('.lb__prev', lb).addEventListener('click', () => show(cur - 1));
  $('.lb__next', lb).addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  d.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'Tab') { const f = $$('button', lb); const i = f.indexOf(d.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  });

  /* ---------- AJÁNLATKÉRŐ ---------- */
  const form = $('#ajanlat-form'), err = $('#form-err'), done = $('#form-done');
  const goForm = (focusSel) => {
    $('#ajanlat').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => { const el = $(focusSel, form); el && el.focus({ preventScroll: true }); }, reduce ? 0 : 700);
  };
  $$('[data-munka]').forEach(b => b.addEventListener('click', () => {
    if (!done.hidden) { done.hidden = true; form.hidden = false; }
    $$('input[name=munka]', form).forEach(c => { if (c.value === b.dataset.munka) c.checked = true; });
    $('#munkatipus').classList.remove('is-err');
    goForm('input[name=nev]');
  }));
  $('[data-befer]').addEventListener('click', () => {
    const t = form.elements.leiras;
    if (!t.value.trim()) t.value = 'Befér-e a gép a kapubejárón? Fotót csatolok a bejáratról és a munkaterületről.';
    goForm('#fotok');
  });
  $$('[data-later]', form).forEach(a => a.addEventListener('click', e => { e.preventDefault(); err.style.color = 'var(--mute)'; err.textContent = 'Az adatkezelési tájékoztató szövege az ügyféllel egyeztetés után kerül ide.'; }));

  // fotók
  let files = [];
  const fileIn = $('#fotok'), list = $('#upload-list');
  const OK = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const renderFiles = (msg) => {
    list.innerHTML = '';
    files.forEach((f, i) => {
      const li = d.createElement('li');
      const url = /heic|heif/.test(f.type) ? '' : URL.createObjectURL(f);
      li.innerHTML = (url ? `<img src="${url}" alt="">` : `<span style="display:grid;place-items:center;height:100%;font-size:11px">HEIC</span>`) + `<button type="button" aria-label="${f.name} eltávolítása">×</button>`;
      $('button', li).addEventListener('click', () => { files.splice(i, 1); renderFiles(); });
      list.appendChild(li);
    });
    if (msg) { const li = d.createElement('li'); li.className = 'err'; li.textContent = msg; list.appendChild(li); }
  };
  fileIn.addEventListener('change', () => {
    let msg = '';
    [...fileIn.files].forEach(f => {
      if (!OK.includes(f.type) && !/\.(heic|heif)$/i.test(f.name)) msg = `${f.name}: csak JPG, PNG, WEBP vagy HEIC kép tölthető fel.`;
      else if (f.size > AJANLAT.maxBytes) msg = `${f.name}: nagyobb, mint 8 MB.`;
      else if (files.length >= AJANLAT.maxFiles) msg = `Legfeljebb ${AJANLAT.maxFiles} kép csatolható.`;
      else files.push(f);
    });
    fileIn.value = '';
    renderFiles(msg);
  });

  const validate = () => {
    let first = null;
    const mark = (el, bad) => { (el.closest('.f, .consent, .chips') || el).classList.toggle('is-err', bad); if (bad && !first) first = el; };
    ['nev', 'telefon', 'helyszin', 'leiras'].forEach(n => mark(form.elements[n], !form.elements[n].value.trim()));
    const tel = form.elements.telefon.value.replace(/[\s\-()\/]/g, '');
    if (tel && !/^(\+36|06|36)?\d{8,9}$/.test(tel)) mark(form.elements.telefon, true);
    const em = form.elements.email.value.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) mark(form.elements.email, true);
    const chips = $$('input[name=munka]:checked', form);
    $('#munkatipus').classList.toggle('is-err', !chips.length); if (!chips.length && !first) first = $('input[name=munka]', form);
    mark(form.elements.adatkezeles, !form.elements.adatkezeles.checked);
    return first;
  };
  form.addEventListener('input', e => { const w = e.target.closest('.is-err'); if (w) w.classList.remove('is-err'); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.style.color = ''; err.textContent = '';
    if (form.elements.weboldal.value) return; // honeypot
    const bad = validate();
    if (bad) { err.textContent = 'Kérlek, töltsd ki a jelölt mezőket (név, telefonszám, helyszín, munkatípus, leírás, adatkezelés).'; bad.focus(); return; }
    const fd = new FormData(form);
    fd.delete('fotok'); files.forEach(f => fd.append('fotok[]', f, f.name));
    const munka = fd.getAll('munka').join(', ');
    const btn = $('button[type=submit]', form);

    if (!AJANLAT.endpoint) {
      // BEMUTATÓ MÓD – nincs szerveroldali továbbítás, ezért NEM jelzünk sikeres küldést.
      const body = `Név: ${fd.get('nev')}\nTelefon: ${fd.get('telefon')}\nHelyszín: ${fd.get('helyszin')}\nMunka: ${munka}\nMikor: ${fd.get('mikor') || '-'}\nE-mail: ${fd.get('email') || '-'}\n\n${fd.get('leiras')}`;
      const mail = 'mailto:zkalocsa8@gmail.com?subject=' + encodeURIComponent('Ajánlatkérés – ' + munka) + '&body=' + encodeURIComponent(body);
      showDone('Bemutató mód', 'Ez a látványterv még nem továbbítja az üzenetet – az élesítéskor az ajánlatkérés közvetlenül Zoltánhoz érkezik. Addig hívj, vagy küldd el e-mailben az előre kitöltött üzenetet.' + (files.length ? ' (A fotókat az e-mailhez kézzel csatold.)' : ''),
        `<a class="btn" href="tel:+36704204170">Hívás most</a><a class="btn btn--ghost" href="${mail}">E-mail piszkozat</a>`);
      return;
    }
    btn.disabled = true; btn.textContent = 'Küldés…';
    try {
      const r = await fetch(AJANLAT.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      track('quote_submit_success', { munka });
      showDone('Köszönöm, megkaptam!', 'Hamarosan visszahívlak a megadott telefonszámon.', `<a class="btn btn--ghost" href="#fooldal">Vissza a főoldalra</a>`);
    } catch (x) {
      err.textContent = 'Az elküldés nem sikerült. Kérlek, próbáld újra, vagy hívj: +36 70 420 4170.';
    } finally { btn.disabled = false; btn.textContent = 'Ajánlatkérés elküldése'; }
  });
  function showDone(t, p, act) {
    $('#done-title').textContent = t; $('#done-text').textContent = p; $('#done-act').innerHTML = act;
    form.hidden = true; done.hidden = false; done.focus();
    if (window.gsap && !reduce) gsap.from(done, { y: 30, autoAlpha: 0, duration: .8, ease: 'expo.out' });
  }

  /* ---------- TÉRKÉP (Leaflet, igény szerint betöltve) ---------- */
  const mapEl = $('#map');
  const loadMap = () => {
    const CDN = ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/', 'https://unpkg.com/leaflet@1.9.4/dist/'];
    const load = (k) => {
      if (k >= CDN.length) return;
      const css = d.createElement('link'); css.rel = 'stylesheet'; css.href = CDN[k] + 'leaflet.css'; d.head.appendChild(css);
      const s = d.createElement('script'); s.src = CDN[k] + 'leaflet.js'; s.onload = initMap; s.onerror = () => load(k + 1); d.head.appendChild(s);
    };
    load(0);
  };
  function initMap() {
    const L = window.L; if (!L) return;
    $('#map-wrap').classList.add('is-live');
    const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(MAP.center, 9);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18, subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    const circle = L.circle(MAP.center, { radius: MAP.radiusM, color: '#F27A21', weight: 2, dashArray: '6 6', fillColor: '#F27A21', fillOpacity: .08 }).addTo(map);
    map.fitBounds(circle.getBounds(), { padding: [16, 16] });
    const icon = (job) => L.divIcon({ className: '', html: `${job ? '<span class="mk-pulse"></span>' : ''}<span class="mk${job ? '' : ' mk--center'}"></span>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -22] });
    L.marker(MAP.center, { icon: icon(false), title: 'Kecskemét – központ' }).addTo(map)
      .bindPopup('<b>Kecskemét</b>A munkaterület központja.<br>Körzet: 45 km.<br><a href="tel:+36704204170" style="color:#F27A21">+36 70 420 4170</a>');
    const job = L.marker([47.034, 19.776], { icon: icon(true), title: 'Folyamatban lévő munka (példa)' }).addTo(map)
      .bindPopup('<b>Itt épp munka folyik</b>Közműárok-ásás · folyamatban<br><small style="color:#A9B0B7">Példa jelölő – a valódi helyszín Zoltán jóváhagyásával kerül fel.</small><img src="img/kozmuarok-720.webp" alt="Közműárok – munkafotó">');
    setTimeout(() => job.openPopup(), 900);
    map.on('click', () => map.scrollWheelZoom.enable());
  }
  if ('IntersectionObserver' in window) {
    const mo = new IntersectionObserver(es => { if (es[0].isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: '400px' });
    mo.observe(mapEl);
  } else loadMap();

  const ev = $('#ev'); if (ev) ev.textContent = new Date().getFullYear();
  onScroll();

  /* ================= MOZGÁS (GSAP + ScrollTrigger) ================= */
  const g = window.gsap, ST = window.ScrollTrigger;
  if (reduce || !g || !ST) { root.classList.remove('anim'); return; }
  g.registerPlugin(ST);
  const desk = matchMedia('(min-width: 861px)').matches;

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
      } else if (n.nodeType === 1 && n.tagName !== 'BR') split(n);
    });
    return el.querySelectorAll('.w>span');
  };

  // hero belépő
  g.set(['.hero__copy .kicker', '.hero__lead', '.hero__cta', '.hero__foot'], { visibility: 'visible' });
  g.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__media', { clipPath: desk ? 'inset(0% 0% 0% 100%)' : 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0)
    .from('.hdr__in > *', { y: -16, autoAlpha: 0, duration: .8, stagger: .05 }, .2)
    .from('.hero__copy .kicker', { x: -24, autoAlpha: 0, duration: .8 }, .4)
    .to('.ln>span', { y: 0, duration: 1.2, stagger: .14 }, .5)
    .from('.hero__lead', { y: 22, autoAlpha: 0, duration: .9 }, .85)
    .from('.hero__cta .btn', { y: 20, autoAlpha: 0, duration: .8, stagger: .08 }, 1)
    .from('.hero__facts', { scaleX: 0, transformOrigin: 'left', duration: 1.2, ease: 'expo.inOut' }, 1.05)
    .from('.hero__facts li, .scrollcue, .stages li, .hero__tag', { y: 12, autoAlpha: 0, duration: .6, stagger: .08 }, 1.4);
  // görgetés: a kép lassabban, a szöveg felcsúszik
  // FILMSZERŰ NYITÓKÉP: valódi munkafotókból álló jelenetsor (a végleges videóig)
  const scenes = $$('.scene'), stages = $$('.stages li');
  const setStage = (seg) => stages.forEach((li, i) => {
    li.style.setProperty('--p', Math.min(1, Math.max(0, seg - i)));
    li.classList.toggle('is-on', i === Math.min(stages.length - 1, Math.floor(seg)));
    li.classList.toggle('is-done', i < Math.floor(seg));
  });
  if (heroVideo && desk) {
    // görgetésre pörgetett videó (a referencia mechanikája)
    const v = heroVideo; let target = 0, raf = 0;
    const tick = () => { raf = 0; if (v.readyState >= 1 && Math.abs(v.currentTime - target) > .01) v.currentTime = target; };
    const setup = () => {
      const dur = v.duration || 8;
      ST.create({ trigger: '.hero', start: 'top top', end: '+=260%', pin: true, scrub: true, anticipatePin: 1,
        onUpdate: s => { target = s.progress * (dur - .05); setStage(s.progress * stages.length); if (!raf) raf = requestAnimationFrame(tick); } });
      ST.refresh();
    };
    v.readyState >= 1 ? setup() : v.addEventListener('loadedmetadata', setup, { once: true });
  } else if (heroVideo) {
    // mobil: a videó magától megy, a fázisjelző a lejátszást követi
    heroVideo.addEventListener('timeupdate', () => setStage(heroVideo.currentTime / (heroVideo.duration || 8) * stages.length));
  } else if (!$('.hero__video')) {
    g.set(scenes, { scale: 1.14, transformOrigin: '60% 50%' });
    g.set(scenes.slice(1), { opacity: 0 });
    if (desk) {
      // asztali gép: görgetésre „lepörög” (rögzített nyitókép, mint a referenciavideóban)
      const tl = g.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=' + (scenes.length * 70) + '%', pin: true, scrub: .8, anticipatePin: 1,
        onUpdate: s => setStage(s.progress * scenes.length) } });
      scenes.forEach((s, i) => {
        tl.to(s, { scale: 1, duration: 1, ease: 'none' }, i);
        if (scenes[i + 1]) tl.to(scenes[i + 1], { opacity: 1, duration: .32, ease: 'none' }, i + .68);
      });
      tl.to('.hero__copy', { y: -30, duration: .5, ease: 'none' }, scenes.length - .5);
      // amíg nem görget: lassú „lélegzés” az első képen
      g.to(scenes[0], { scale: 1.08, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1, overwrite: false, paused: false, id: 'idle' });
      ST.create({ trigger: '.hero', start: 'top top-=4', onEnter: () => g.getById('idle')?.kill() });
    } else {
      // mobil: magától vált, rögzítés nélkül
      let i = 0;
      const step = () => {
        const cur = scenes[i], nx = (i + 1) % scenes.length;
        stages.forEach((li, k) => { li.classList.toggle('is-on', k === i); li.classList.toggle('is-done', k < i); if (k !== i) li.style.setProperty('--p', k < i ? 1 : 0); });
        g.fromTo(cur, { scale: 1.14 }, { scale: 1, duration: 4.2, ease: 'none' });
        g.fromTo(stages[i], { '--p': 0 }, { '--p': 1, duration: 4.2, ease: 'none' });
        g.delayedCall(3.6, () => {
          g.set(scenes[nx], { scale: 1.14 });
          g.to(scenes[nx], { opacity: 1, duration: .8, ease: 'power1.inOut' });
          g.to(cur, { opacity: 0, duration: .8, delay: .1, ease: 'power1.inOut' });
          i = nx; g.delayedCall(.6, step);
        });
      };
      step();
    }
  }

  // címek szavanként
  $$('.sec h2, .final h2').forEach(h => g.from(split(h), { yPercent: 115, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 87%' } }));
  $$('.sec__lead, .sec .kicker, .quote, .narrow__copy > p:not(.quote), .ticks li, .narrow__copy .btn, .about__lead, .about .muted, .about__cta, .area__list li, .area .btn, .bigtel, .final p, .final__cta, .feat__note').forEach(el =>
    g.from(el, { y: 22, autoAlpha: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));

  // szolgáltatáskártyák + ikonrajzolás
  ST.batch('.card', { start: 'top 90%', onEnter: b => {
    g.from(b, { y: 50, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .1 });
    b.forEach((c, i) => {
      const lines = $$('.ico path:not([stroke-dasharray]), .ico rect, .ico circle', c);
      lines.forEach(s => { const L = s.getTotalLength(); g.fromTo(s, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, delay: .25 + i * .1, ease: 'power2.inOut' }); });
    });
  } });

  // szűk hely: kisgép végiggurul, ás, kitelik az árok
  const path = $('.plan__path'), mach = $('.plan__machine');
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
    g.from('.plan svg', { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.plan', start: 'top 88%' } });
  }

  // galéria: feltárás + belső mozgás
  g.set('.gal__item', { clipPath: 'inset(100% 0% 0% 0%)' });
  ST.batch('.gal__item', { start: 'top 92%', onEnter: b => g.to(b, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: .1 }) });
  $$('.gal__item img').forEach(img => g.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // portré
  g.from('.portrait__slot', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: '.portrait', start: 'top 85%' } });

  // folyamat: vonal húzódik, számok beugranak
  g.fromTo('.flow__line i', { [desk ? 'scaleX' : 'scaleY']: 0 }, { [desk ? 'scaleX' : 'scaleY']: 1, ease: 'none', scrollTrigger: { trigger: '.flow', start: 'top 75%', end: 'bottom 60%', scrub: .5 } });
  $$('.step').forEach((s, i) => {
    g.timeline({ scrollTrigger: { trigger: s, start: 'top 85%' }, delay: desk ? i * .18 : 0 })
      .from($('.step__no', s), { scale: .4, autoAlpha: 0, duration: .8, ease: 'back.out(2)' })
      .from($$('.step__ico, h3, p', s), { y: 16, autoAlpha: 0, duration: .7, stagger: .07, ease: 'expo.out' }, .15);
  });

  // térkép, űrlap, záró
  g.from('.map', { y: 40, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.map', start: 'top 88%' } });
  g.from('.form', { y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.form', start: 'top 90%' } });
  g.from('.form > *', { y: 14, autoAlpha: 0, duration: .6, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.form', start: 'top 80%' } });
  g.from('.ftr__grid > *', { y: 20, autoAlpha: 0, duration: .8, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 95%' } });

  addEventListener('load', () => ST.refresh());
})();
