/* Vályog-Mester · DAEKON 2026 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const mqMobile = matchMedia('(max-width: 900px)');

  /* ================= SZÉTBONTOTT CÍMEK ================= */
  $$('.split').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });

  /* ================= MEGJELENÉS GÖRGETÉSRE ================= */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('.reveal, .reveal-img, .split').forEach(el => {
    if (el.closest('.hero')) return; // a hero saját idővonalat kap
    motion ? io.observe(el) : el.classList.add('is-in');
  });

  /* ================= FEJLÉC, HALADÁSJELZŐ ================= */
  const nav = $('#nav'), bar = $('.progress span'), hero = $('.hero');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    const past = y > hero.offsetHeight - 90;
    nav.classList.add('is-solid');            // világos nyitókép: a fejléc végig sötét szövegű
    nav.classList.remove('is-top');
    nav.classList.toggle('is-hidden', past && y > lastY + 4 && y > 900 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ================= MENÜ ================= */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false; nav.classList.remove('is-hidden');
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      document.body.style.overflow = 'hidden';
      setTimeout(() => $('a', menu).focus({ preventScroll: true }), 350);
    } else {
      menu.classList.remove('is-open'); document.body.style.overflow = '';
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, motion ? 600 : 0);
    }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });
  mqMobile.addEventListener?.('change', () => setMenu(false));

  /* ================= SZOLGÁLTATÁSOK ↔ FOTÓ =================
     Desktopon az épp olvasott szolgáltatás sorszáma (és ha több kép van, a fotója) áll a bal oldali keretben. */
  const items = $$('.svc__item'), shots = $$('.svc-photo figure'), svcNo = $('#svc-no');
  const activate = item => {
    items.forEach(i => i.classList.toggle('is-active', i === item));
    if (shots.length > 1) shots.forEach(f => f.classList.toggle('is-on', f.dataset.zone === item.dataset.zone));
    svcNo.textContent = $('.svc__no', item).textContent;
  };
  const svcIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) activate(e.target); }),
    { rootMargin: '-45% 0px -45% 0px' });
  items.forEach(i => { svcIO.observe(i); i.addEventListener('mouseenter', () => activate(i)); });
  activate(items[0]);

  /* ================= MOBIL DOKK ================= */
  const dock = $('#dock'), dockState = new Map();
  const dockIO = new IntersectionObserver(es => {
    es.forEach(e => dockState.set(e.target, e.target === hero ? e.intersectionRatio > .35 : e.isIntersecting));
    dock.classList.toggle('is-hidden', [...dockState.values()].some(Boolean));
  }, { threshold: [0, .05, .35, .5] });
  [hero, $('#kapcsolat'), $('.foot')].forEach(el => dockIO.observe(el));

  /* ================= HERO FOTÓFILM =================
     A régi weboldal képei lassú áttűnéssel, „kameramozgással” – videószerű nyitókép. */
  const slides = $$('.hero__film .slide');
  const loadSlide = s => { if (s.dataset.src) { s.srcset = s.dataset.srcset || ''; s.src = s.dataset.src; delete s.dataset.src; } };
  let si = 0;
  const nextSlide = () => {
    const cur = slides[si], nx = slides[(si + 1) % slides.length];
    loadSlide(nx);
    const go = () => { nx.classList.add('is-on'); cur.classList.remove('is-on'); si = (si + 1) % slides.length; $$('.hero__dots span').forEach((d, k) => d.classList.toggle('is-on', k === si)); };
    nx.complete && nx.naturalWidth ? go() : nx.addEventListener('load', go, { once: true });
  };
  if (motion && slides.length > 1) {
    addEventListener('load', () => slides.slice(1).forEach(loadSlide), { once: true });
    let timer = setInterval(nextSlide, 7000);
    document.addEventListener('visibilitychange', () => { clearInterval(timer); if (!document.hidden) timer = setInterval(nextSlide, 7000); });
  }

  /* ================= BEMUTATKOZÓ VIDEÓ =================
     Csak kattintásra töltődik be (preload="none") – nem fogyaszt mobiladatot magától. */
  const video = $('#mester-video'), vBtn = $('#vid-btn');
  const playVideo = () => { video.controls = true; vBtn.hidden = true; video.play().catch(() => { vBtn.hidden = false; }); };
  vBtn.addEventListener('click', playVideo);
  video.addEventListener('ended', () => { video.controls = false; vBtn.hidden = false; });
  $$('[data-play-video]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    $('#mester').scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' });
    playVideo();
  }));

  /* ================= NYITÓKÉP ================= (CSS-animáció, GSAP nélkül) */
  requestAnimationFrame(() => $('.hero__title').classList.add('is-in'));
})();
