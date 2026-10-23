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
    mp4: 'video/hero-scrub.mp4',            // asztali: görgetésre pörgetett (sűrű kulcskockás)
    mobileMp4: 'video/hero-loop-mobil.mp4', // mobil: varrat nélküli hurok
    poster: 'video/hero-poster.webp', posterMobile: 'video/hero-poster-mobil.webp',
    stages: ['Ásás', 'Kanál tele', 'Kiemelés', 'Föld a kupacra'], // a fázisjelző feliratai videó esetén
    tag: 'Szemléltető animáció'
  };
  // Ajánlatkérő végpont (pl. saját PHP/Node végpont vagy űrlapszolgáltatás). null = bemutató mód, NEM küld adatot.
  const AJANLAT = { endpoint: null, maxFiles: 5, maxBytes: 8 * 1024 * 1024 };
  // Térkép
  const MAP = { center: [46.9062, 19.6913], radiusM: 45000 };

  /* ---------- MÉRÉS ----------
     Események (mindig a window.dataLayer-be kerülnek; hálózatra csak beállított szolgáltatónál mennek):
     - phone_click: bármely tel: link kattintása (NEM bizonyított hívás, csak a gomb használata)
     - quote_submit_success: csak valódi, sikeres szerverválasz után (bemutató módban soha)
     - portfolio_view: a Kiemelt munkák szekció első, legalább 25%-os láthatósága, illetve képnagyítás megnyitása
     - featured_project_open: a Kiemelt munkáim fül első megnyitása / nézetváltás
     Szolgáltató (élesítéskor): GA4 → csak hozzájárulás után tölt be (süti); GoatCounter → süti nélküli, hozzájárulás nem kell. */
  const ANALYTICS = { ga4: null /* pl. 'G-XXXXXXX' */, goatcounter: null /* pl. 'https://kalocsageoworks.goatcounter.com/count' */ };
  // Saját, süti nélküli számláló (_forras/backend/meres.php + statisztika.php). null = nem küld semmit.
  // Csak a telefon- és e-mail-kattintás megy ide; az elküldött ajánlatkérést a szerver maga számolja (hitelesen).
  const MERES = { endpoint: null /* pl. '/api/meres.php' */ };
  window.dataLayer = window.dataLayer || [];
  const track = (event, params = {}) => {
    window.dataLayer.push({ event, ...params });
    if (typeof window.gtag === 'function') window.gtag('event', event, params);
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'esemeny/' + event, title: event, event: true });
  };
  const loadScript = (src, attrs = {}) => { const s = d.createElement('script'); s.async = true; s.src = src; Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v)); d.head.appendChild(s); };
  if (ANALYTICS.goatcounter) loadScript('https://gc.zgo.at/count.js', { 'data-goatcounter': ANALYTICS.goatcounter });
  if (ANALYTICS.ga4) {
    const KEY = 'kgw-consent';
    const startGA = () => { loadScript('https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.ga4); window.gtag = function () { window.dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', ANALYTICS.ga4, { anonymize_ip: true }); };
    let c = null; try { c = localStorage.getItem(KEY); } catch (x) {}
    if (c === 'igen') startGA();
    else if (c === null) {
      const bar = d.createElement('div'); bar.className = 'consent-bar'; bar.setAttribute('role', 'dialog'); bar.setAttribute('aria-label', 'Sütik');
      bar.innerHTML = '<p>Statisztikához (hányan nézik a munkákat, hányan hívnak) sütit használnánk. <a href="adatkezeles.html">Részletek</a></p><div><button class="btn btn--sm" data-c="igen">Elfogadom</button><button class="btn btn--sm btn--ghost" data-c="nem">Elutasítom</button></div>';
      bar.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; try { localStorage.setItem(KEY, b.dataset.c); } catch (x) {} if (b.dataset.c === 'igen') startGA(); bar.remove(); });
      d.body.appendChild(bar);
    }
  }
  const where = el => {
    if (el.closest('.fab')) return 'fab';
    if (el.closest('header')) return 'fejlec';
    if (el.closest('footer')) return 'lablec';
    if (el.closest('.final')) return 'zaro';
    return el.closest('section[id]')?.id || 'egyeb';
  };
  const beacon = (e, hely) => {
    if (!MERES.endpoint) return;
    const body = JSON.stringify({ e, hely });
    try { if (!(navigator.sendBeacon && navigator.sendBeacon(MERES.endpoint, new Blob([body], { type: 'application/json' })))) fetch(MERES.endpoint, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {}); } catch (x) {}
  };
  d.addEventListener('click', e => {
    const a = e.target.closest('a[href^="tel:"], a[href^="mailto:"]'); if (!a) return;
    const ev = a.href.startsWith('tel:') ? 'phone_click' : 'email_click', hely = where(a);
    track(ev, { location: hely }); beacon(ev, hely);
  });

  const conn = navigator.connection;
  const isMobile = matchMedia('(max-width: 860px)').matches;

  /* ---------- FEJLÉC, HÍVÓGOMB, AKTÍV MENÜ ---------- */
  const hdr = $('#fejlec'), fab = $('#fab'), hero = $('.hero');
  const navLinks = $$('.nav a[href^="#"]');
  const spy = ['fooldal', 'szolgaltatasok', 'szuk-hely', 'kiemelt-munkak', 'rolam', 'folyamat', 'munkaterulet', 'ajanlat'].map(id => d.getElementById(id));
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
    navLinks.forEach(a => {
      let on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
    });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // űrlapkitöltés közben (mobil billentyűzet) a hívógomb ne takarjon
  d.addEventListener('focusin', e => fab.classList.toggle('is-typing', !!e.target.closest('.form input:not([type=checkbox]), .form textarea, .form select')));
  d.addEventListener('focusout', () => fab.classList.remove('is-typing'));
  // mobilon az űrlap látható részén a hívógomb elrejtőzik, hogy ne takarja a mezőket és a küldés gombot
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => fab.classList.toggle('is-away', e.isIntersecting)), { rootMargin: '0px 0px -10% 0px' }).observe($('#ajanlat-form'));

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

  // portfolio_view – első megtekintéskor
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { track('portfolio_view', { via: 'scroll' }); io.disconnect(); } }), { threshold: .25 });
    io.observe($('#kiemelt-munkak'));
  }

  /* ---------- LIGHTBOX (a képlista a HTML-ből épül: [data-full] + [data-cap]) ---------- */
  const LB = [];
  $$('[data-full]').forEach(el => { if (!LB.some(x => x[0] === el.dataset.full)) LB.push([el.dataset.full, el.dataset.cap || '', el.dataset.note || 'Saját munkafotó – fény és kontraszt szerkesztve']); });
  const lb = $('#lb'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let cur = 0, last = null;
  const show = i => { cur = (i + LB.length) % LB.length; lbImg.src = LB[cur][0]; lbImg.alt = LB[cur][1]; lbCap.textContent = `${String(cur + 1).padStart(2, '0')} · ${LB[cur][1]}`; lbCap.dataset.note = LB[cur][2]; };
  const open = i => { last = d.activeElement; show(i); lb.hidden = false; d.body.style.overflow = 'hidden'; $('.lb__x', lb).focus(); track('portfolio_view', { via: 'lightbox', image: i + 1 }); };
  const close = () => { lb.hidden = true; d.body.style.overflow = ''; last && last.focus(); };
  d.addEventListener('click', e => {
    const t = e.target.closest('[data-full]'); if (!t) return;
    open(LB.findIndex(x => x[0] === t.dataset.full));
    const f = t.closest('.feat'); if (f) track('featured_project_open', { project: f.dataset.feat, via: 'image' });
  });
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
  if (AJANLAT.endpoint) { const dn = $('#form-demo'); if (dn) dn.hidden = true; }
  const formStart = Date.now();
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
    fd.append('kitoltesi_ido_ms', String(Date.now() - formStart)); // spam-szűréshez (a szerver ellenőrzi)
    const munka = fd.getAll('munka').join(', ');
    const btn = $('button[type=submit]', form);

    if (!AJANLAT.endpoint) {
      // BEMUTATÓ MÓD – nincs szerveroldali továbbítás, ezért NEM jelzünk sikeres küldést.
      const body = `Név: ${fd.get('nev')}\nTelefon: ${fd.get('telefon')}\nHelyszín: ${fd.get('helyszin')}\nMunka: ${munka}\nMikor: ${fd.get('mikor') || '-'}\nE-mail: ${fd.get('email') || '-'}\n\n${fd.get('leiras')}`;
      const mail = 'mailto:kalocsageoworks@gmail.com?subject=' + encodeURIComponent('Ajánlatkérés – ' + munka) + '&body=' + encodeURIComponent(body);
      showDone('Bemutató mód', 'Ez a látványterv még nem továbbítja az üzenetet – az élesítéskor az ajánlatkérés közvetlenül Zoltánhoz érkezik. Addig hívj, vagy küldd el e-mailben az előre kitöltött üzenetet.' + (files.length ? ' (A fotókat az e-mailhez kézzel csatold.)' : ''),
        `<a class="btn" href="tel:+36704204170">Hívás most</a><a class="btn btn--ghost" href="${mail}">E-mail piszkozat</a>`);
      return;
    }
    btn.disabled = true; btn.textContent = 'Küldés…';
    try {
      const r = await fetch(AJANLAT.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      const res = await r.json().catch(() => ({}));
      if (!r.ok || !res.ok) throw new Error(res.error || r.status);
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
    // görgetés közben a térkép NEM foghatja meg az oldalt: alapból sem kerékkel, sem egy ujjal nem mozgatható;
    // koppintás/kattintás után aktív, és amint kigörgetsz mellőle (vagy 8 mp tétlenség), újra „alszik”
    const map = L.map(mapEl, { scrollWheelZoom: false, dragging: false, touchZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false, zoomControl: true, attributionControl: true }).setView(MAP.center, 9);
    const wrap = $('#map-wrap'), hint = d.createElement('button');
    hint.type = 'button'; hint.className = 'map__hint'; hint.textContent = 'Koppints a térkép mozgatásához';
    wrap.appendChild(hint);
    let sleepT = 0;
    const wake = () => {
      ['dragging', 'touchZoom', 'scrollWheelZoom', 'doubleClickZoom'].forEach(k => map[k].enable());
      wrap.classList.add('is-awake'); clearTimeout(sleepT); sleepT = setTimeout(sleep, 8000);
    };
    const sleep = () => { ['dragging', 'touchZoom', 'scrollWheelZoom', 'doubleClickZoom'].forEach(k => map[k].disable()); wrap.classList.remove('is-awake'); };
    hint.addEventListener('click', wake);
    map.on('click', wake);
    ['movestart', 'zoomstart'].forEach(ev => map.on(ev, () => { if (wrap.classList.contains('is-awake')) { clearTimeout(sleepT); sleepT = setTimeout(sleep, 8000); } }));
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) sleep(); }), { threshold: .3 }).observe(wrap);
    // kulcs nélküli OpenStreetMap-csempék; a sötét hatást CSS-szűrő adja (.leaflet-tile-pane)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const circle = L.circle(MAP.center, { radius: MAP.radiusM, color: '#F27A21', weight: 2, dashArray: '6 6', fillColor: '#F27A21', fillOpacity: .08 }).addTo(map);
    map.fitBounds(circle.getBounds(), { padding: [16, 16] });
    const icon = (job) => L.divIcon({ className: '', html: `${job ? '<span class="mk-pulse"></span>' : ''}<span class="mk${job ? '' : ' mk--center'}"></span>`, iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -22] });
    L.marker(MAP.center, { icon: icon(false), title: 'Kecskemét – központ' }).addTo(map)
      .bindPopup('<b>Kecskemét</b>A munkaterület központja.<br>Körzet: 45 km.<br><a href="tel:+36704204170" style="color:#F27A21">+36 70 420 4170</a>');
    const job = L.marker([47.034, 19.776], { icon: icon(true), title: 'Munkajelölő (bemutató)' }).addTo(map)
      .bindPopup('<b>Munkajelölő – bemutató</b>Így jelenik majd meg egy aktuális munka helye.<br><small style="color:#A9B0B7">Ez nem valós munkahelyszín. Élesítéskor csak Zoltán által jóváhagyott, nem pontos lakcímre mutató helyszín kerül fel.</small>');
    // a rögzített nyitókép miatt az elrendezés később változhat → méret újraszámolása
    const fix = () => { map.invalidateSize(); };
    setTimeout(fix, 300); setTimeout(fix, 1500); addEventListener('resize', fix);
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', fix);
  }
  if ('IntersectionObserver' in window) {
    const mo = new IntersectionObserver(es => { if (es[0].isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: '400px' });
    mo.observe(mapEl);
  } else loadMap();

  const ev = $('#ev'); if (ev) ev.textContent = new Date().getFullYear();
  onScroll();

  /* ================= MOZGÁS (GSAP + ScrollTrigger) ================= */
  const g = window.gsap, ST = window.ScrollTrigger;
  if (reduce || !g || !ST) { root.classList.remove('anim'); heroInit(null, null, !isMobile); return; }
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
  heroInit(g, ST, desk);

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

  // munkák: a kártyák felúsznak (csak átlátszóság + eltolás – rejtett fülön sem maradhat semmi kitakarva)
  ST.batch('.feat', { start: 'top 90%', once: true,
    onEnter: b => g.fromTo(b, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, ease: 'expo.out', stagger: .1, clearProps: 'transform' }) });

  // portré
  g.from('.portrait img', { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.portrait', start: 'top 85%' } });

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

  /* ================= NYITÓKÉP (videó → poszter → valódi fotós tartalék) ================= */
  function heroInit(g, ST, desk) {
    const heroEl = $('.hero'), media = $('#hero-media'), scenes = $$('.scene'), stages = $$('.stages li'), stageBox = $('.stages'), tag = $('.hero__tag');
    const slowNet = conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
    let vidTrigger = null, sceneTl = null, sceneTimer = null, video = null;
    const setStage = (seg) => stages.forEach((li, i) => {
      li.style.setProperty('--p', Math.min(1, Math.max(0, seg - i)));
      li.classList.toggle('is-on', i === Math.min(stages.length - 1, Math.floor(seg)));
      li.classList.toggle('is-done', i < Math.floor(seg));
    });

    // --- tartalék: valódi munkafotós jelenetsor ---
    const startScenes = (why) => {
      heroEl.classList.remove('has-video'); heroEl.classList.add('is-scenes');
      if (tag) tag.textContent = 'Valódi munkafotók';
      $$('.stages li span').forEach(s => { if (s.dataset.scene) s.textContent = s.dataset.scene; });
      stageBox.hidden = false;
      scenes.forEach((s, i) => { if (s.dataset.src) { s.srcset = s.dataset.srcset; s.src = s.dataset.src; s.removeAttribute('data-src'); } if (!i) s.classList.add('is-on'); });
      if (!g || reduce) { setStage(0); return; }
      g.set(scenes, { scale: 1.14, transformOrigin: '60% 50%' });
      g.set(scenes.slice(1), { opacity: 0 });
      if (desk) {
        sceneTl = g.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=' + (scenes.length * 70) + '%', pin: true, scrub: .8, anticipatePin: 1, onUpdate: s => setStage(s.progress * scenes.length) } });
        scenes.forEach((s, i) => {
          sceneTl.to(s, { scale: 1, duration: 1, ease: 'none' }, i);
          if (scenes[i + 1]) sceneTl.to(scenes[i + 1], { opacity: 1, duration: .32, ease: 'none' }, i + .68);
        });
        ST.refresh();
      } else {
        let i = 0;
        const step = () => {
          const cur = scenes[i], nx = (i + 1) % scenes.length;
          stages.forEach((li, k) => { li.classList.toggle('is-on', k === i); li.classList.toggle('is-done', k < i); if (k !== i) li.style.setProperty('--p', k < i ? 1 : 0); });
          g.fromTo(cur, { scale: 1.14 }, { scale: 1, duration: 4.2, ease: 'none' });
          g.fromTo(stages[i], { '--p': 0 }, { '--p': 1, duration: 4.2, ease: 'none' });
          sceneTimer = g.delayedCall(3.6, () => {
            g.set(scenes[nx], { scale: 1.14 });
            g.to(scenes[nx], { opacity: 1, duration: .8, ease: 'power1.inOut' });
            g.to(cur, { opacity: 0, duration: .8, delay: .1, ease: 'power1.inOut' });
            i = nx; sceneTimer = g.delayedCall(.6, step);
          });
        };
        step();
      }
      track('hero_fallback', { reason: why });
    };

    // --- lassú kapcsolat / adatkímélés / nincs videó: valódi fotók ---
    if (!HERO_VIDEO.mp4 || slowNet) { startScenes(slowNet ? 'slow-network' : 'no-video'); return; }
    // csökkentett mozgásnál (pl. Windows „Animációs effektusok: ki”) nincs görgetéses rögzítés,
    // a videó csendben ismétlődik, és egy gombbal megállítható
    const scrub = desk && !reduce && !!g && !!ST;

    // --- videó ---
    // Miért volt néha pixeles / üres / tökéletes? A görgetéses videót a böngésző menet közben töltötte:
    // amíg egy rész nem jött le, a gyors egymás utáni ugrások (seek) egymást szakították meg → akadó, kockás vagy üres kép;
    // lassabb netnél 10 mp után a kód a fotós tartalékra váltott; gyorsítótárból pedig hibátlan volt.
    // Most: asztali gépen a teljes videó előbb letöltődik (blob), az ugrások sorban, egymás után futnak;
    // hiba vagy tiltott automatikus lejátszás esetén a videó első kockája (poszter) marad – nem vált át más képekre.
    video = d.createElement('video');
    video.muted = true; video.playsInline = true; video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
    video.preload = 'auto';
    video.poster = (isMobile && HERO_VIDEO.posterMobile) || HERO_VIDEO.poster;
    video.className = 'hero__video'; video.setAttribute('aria-hidden', 'true'); video.disablePictureInPicture = true;
    if (!scrub) { video.loop = true; video.autoplay = true; video.setAttribute('autoplay', ''); }
    let failed = false;
    const fail = (why) => {
      if (failed) return; failed = true;
      if (vidTrigger) { vidTrigger.kill(true); vidTrigger = null; }
      video.remove(); heroEl.classList.add('video-off');   // a poszter (a videó első kockája) látszik tovább
      track('hero_fallback', { reason: why });
    };
    video.addEventListener('error', () => fail('video-error'), { once: true });
    const srcUrl = (!desk && HERO_VIDEO.mobileMp4) || HERO_VIDEO.mp4;
    const guard = { id: 0 };
    if (scrub && window.fetch && window.URL && URL.createObjectURL) {
      // teljes letöltés előre → a görgetés mindig kész kockákat kap
      const ctl = 'AbortController' in window ? new AbortController() : null;
      guard.id = setTimeout(() => { ctl && ctl.abort(); }, 30000);
      fetch(srcUrl, ctl ? { signal: ctl.signal } : {}).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then(bl => { clearTimeout(guard.id); if (!failed) { video.src = URL.createObjectURL(bl); media.appendChild(video); } })
        .catch(() => { clearTimeout(guard.id); fail('video-load'); });
    } else {
      video.src = srcUrl; media.appendChild(video);
      // ha 15 mp látható nyitókép után sincs kép, marad a poszter
      const heroVisible = () => { const r = heroEl.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
      let seen = 0;
      guard.id = setInterval(() => {
        if (failed || video.readyState >= 2) { clearInterval(guard.id); return; }
        if (heroVisible() && ++seen >= 15) { clearInterval(guard.id); fail('video-timeout'); }
      }, 1000);
      video.addEventListener('loadeddata', () => clearInterval(guard.id), { once: true });
    }

    if (scrub) {
      // görgetésre pörgetett videó (a referencia mechanikája)
      // a lap tetején magától, hurokban ás; görgetéskor a görgetés vezérli
      let target = 0, raf = 0, idle = true, seeking = false;
      const tick = () => {
        raf = 0;
        if (idle || seeking || video.readyState < 2) return;
        if (Math.abs(video.currentTime - target) > .02) { seeking = true; video.currentTime = target; }
      };
      video.addEventListener('seeked', () => { seeking = false; if (!raf) raf = requestAnimationFrame(tick); });
      const idlePlay = () => { idle = true; seeking = false; video.loop = true; video.play().catch(() => {}); };
      video.addEventListener('timeupdate', () => { if (idle) setStage(video.currentTime / (video.duration || 8) * stages.length); });
      // a rögzítés azonnal létrejön (nincs későbbi ugrás az oldalon); a videó a letöltés után kapcsolódik be
      let prog = 0;
      vidTrigger = ST.create({ trigger: '.hero', start: 'top top', end: '+=260%', pin: true, scrub: true, anticipatePin: 1,
        onUpdate: s => {
          prog = s.progress; setStage(prog * stages.length);
          if (prog < .003) { if (!idle && video.readyState >= 2) idlePlay(); return; }
          if (idle) { idle = false; video.loop = false; video.pause(); }
          target = prog * ((video.duration || 8) - .05); if (!raf) raf = requestAnimationFrame(tick);
        } });
      ST.refresh();
      video.addEventListener('loadeddata', () => {
        if (failed) return;
        if (prog < .003) idlePlay(); else { idle = false; target = prog * (video.duration - .05); tick(); }
      }, { once: true });
    } else {
      // mobil / csökkentett mozgás: némítva, hurokban; ha az automatikus lejátszás tiltott → valódi fotók
      let userPaused = false;
      const p = video.play();
      if (p) p.catch(e => {
        if (!e || e.name !== 'NotAllowedError') return;
        // pl. iPhone energiatakarékos mód: a poszter látszik, és az első érintésre/kattintásra elindul
        track('hero_fallback', { reason: 'autoplay-blocked' });
        const go = () => { video.play().catch(() => {}); ['touchstart', 'click', 'keydown'].forEach(t => removeEventListener(t, go, true)); };
        ['touchstart', 'click', 'keydown'].forEach(t => addEventListener(t, go, { capture: true, passive: true }));
      });
      video.addEventListener('timeupdate', () => setStage(video.currentTime / (video.duration || 8) * stages.length));
      // megállító gomb (akadálymentesség: mozgó tartalom leállítható)
      const btn = d.createElement('button');
      btn.type = 'button'; btn.className = 'hero__pause'; btn.setAttribute('aria-label', 'Animáció megállítása');
      btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" rx="1"/><rect x="9.5" y="3" width="3" height="10" rx="1"/></svg>';
      btn.addEventListener('click', () => {
        userPaused = !video.paused;
        if (userPaused) video.pause(); else video.play().catch(() => {});
        btn.classList.toggle('is-paused', userPaused);
        btn.setAttribute('aria-label', userPaused ? 'Animáció indítása' : 'Animáció megállítása');
        btn.innerHTML = userPaused ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5z"/></svg>' : '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" rx="1"/><rect x="9.5" y="3" width="3" height="10" rx="1"/></svg>';
      });
      heroEl.appendChild(btn);
      const killBtn = () => btn.remove();
      video.addEventListener('error', killBtn, { once: true });
      // ha kigörgetünk a hero-ból, megáll (akkumulátor)
      if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { if (failed) { killBtn(); return; } e.isIntersecting ? (userPaused || video.play().catch(() => {})) : video.pause(); })).observe(heroEl);
    }
  }
})();
