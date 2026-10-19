/* Kalocsa Zoltán – gépi földmunka · látványterv · DAEKON */
(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero belépő
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-in')));

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

  // Megjelenés görgetésre
  const els = d.querySelectorAll('.reveal, .plan, .radar');
  if (reduce || !('IntersectionObserver' in window)) els.forEach(el => el.classList.add('is-v'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-v'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    els.forEach((el, i) => { el.style.transitionDelay = el.classList.contains('svc__item') || el.classList.contains('step') ? (i % 5) * 60 + 'ms' : ''; io.observe(el); });
  }

  // Szolgáltatás-sor → űrlap munkatípus előválasztás
  const tipus = d.getElementById('tipus');
  d.querySelectorAll('[data-munka]').forEach(a => a.addEventListener('click', () => {
    const v = a.dataset.munka;
    [...tipus.options].forEach(o => { if (o.text === v) tipus.value = o.value; });
  }));

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

  // Ajánlatkérő – LÁTVÁNYTERV: nem küld adatot. Éleshez: KULDES.endpoint
  const KULDES = { endpoint: null };
  const form = d.getElementById('ajanlat'), msg = d.getElementById('form-msg');
  form.querySelectorAll('[data-later]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); msg.textContent = 'Az adatkezelési tájékoztató szövege az ügyféllel egyeztetés után kerül ide.'; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim();
      f.classList.toggle('is-err', bad); if (bad && ok) { ok = false; f.focus(); }
    });
    if (!ok) { msg.textContent = 'Kérlek, töltsd ki a jelölt mezőket, és fogadd el az adatkezelést.'; return; }
    if (!KULDES.endpoint) {
      const v = n => form.elements[n].value.trim();
      const body = `Név: ${v('nev')}\nTelefon: ${v('tel')}\nHelyszín: ${v('hely')}\nMunka: ${v('tipus')}\n\n${v('leiras')}`;
      const href = 'mailto:zkalocsa8@gmail.com?subject=' + encodeURIComponent('Ajánlatkérés – ' + v('tipus')) + '&body=' + encodeURIComponent(body);
      msg.innerHTML = 'Ez a látványterv még nem küld adatot. <a href="' + href + '">Megnyitom e-mailben</a> vagy <a href="tel:+36704204170">hívom: +36 70 420 4170</a>.';
    }
  });

  const ev = d.getElementById('ev'); if (ev) ev.textContent = new Date().getFullYear();
})();
