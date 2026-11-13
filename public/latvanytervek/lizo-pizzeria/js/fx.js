/* Lizó – látványelemek (Motion 11 + vanilla). Ihlet: motion.dev, React Bits (Rotating Text, Click Spark,
 * Magnet, szikra-háttér, spotlight kártya) – saját megvalósítás, nem másolat.
 * Minden effekt kikapcsol prefers-reduced-motion mellett; az érintőképernyőn a kurzoros effektek nem futnak. */
(function () {
  'use strict';
  const M = window.Motion;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ease = [0.22, 1, 0.36, 1];

  /* 1. Parázs-háttér a heróban: a Facebook-logó kemencéjének lángjából – lassan felszálló szikrák. */
  function embers() {
    const c = $('[data-embers]'); if (!c || reduced) return;
    const ctx = c.getContext('2d'); let w, h, dpr, parts = [], run = true, raf;
    const N = matchMedia('(max-width:720px)').matches ? 26 : 54;
    function size() { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    const spawn = (y) => ({ x: Math.random() * w, y: y ?? h + Math.random() * 40, r: .6 + Math.random() * 1.8, v: .25 + Math.random() * .7, d: (Math.random() - .5) * .35, a: .25 + Math.random() * .6, hue: Math.random() < .35 ? 4 : 38 });
    size(); for (let i = 0; i < N; i++) parts.push(spawn(Math.random() * h));
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.v; p.x += p.d + Math.sin((p.y + p.x) / 60) * .15;
        const life = Math.max(0, Math.min(1, p.y / h));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `hsla(${p.hue},85%,${p.hue < 10 ? 52 : 60}%,${p.a * life})`;
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.fill();
        if (p.y < -10) Object.assign(p, spawn());
      }
      if (run) raf = requestAnimationFrame(tick);
    }
    tick();
    new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run) { cancelAnimationFrame(raf); tick(); } }).observe(c);
    addEventListener('resize', size);
  }

  /* 2. Címsor: szavanként, elmosódásból élesedő belépő. */
  function splitTitle() {
    const h = $('[data-split]'); if (!h || !M || reduced) return;
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(w => `<span class="sw" aria-hidden="true">${w}</span>`).join(' ');
    M.animate($$('.sw', h), { opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'], transform: ['translateY(14px)', 'translateY(0)'] }, { duration: .45, delay: M.stagger(.03, { startDelay: .05 }), ease });
  }

  /* 3. Forgó szó: „Most rendelhető: pizza / smash burger / gyros …” */
  function rotator() {
    const el = $('[data-rotate]'); if (!el) return;
    const words = JSON.parse(el.dataset.rotate); let i = 0;
    el.textContent = words[0];
    if (reduced) return;
    setInterval(() => {
      i = (i + 1) % words.length;
      if (!M) { el.textContent = words[i]; return; }
      M.animate(el, { opacity: 0, transform: 'translateY(-60%)' }, { duration: .25, ease: [0.4, 0, 1, 1] }).finished.then(() => {
        el.textContent = words[i];
        M.animate(el, { opacity: [0, 1], transform: ['translateY(60%)', 'translateY(0)'] }, { duration: .4, ease });
      });
    }, 2200);
  }



  /* 6. Click Spark: arany szikrák a kosárba tételkor és a „+” gombokon. */
  function sparks() {
    if (reduced || !M) return;
    document.addEventListener('click', e => {
      const b = e.target.closest('.plus, [data-add], .btn--ink'); if (!b) return;
      const r = b.getBoundingClientRect(), cx = e.clientX || r.left + r.width / 2, cy = e.clientY || r.top + r.height / 2;
      for (let i = 0; i < 10; i++) {
        const s = document.createElement('i'); s.className = 'spark';
        const a = (i / 10) * Math.PI * 2, d = 22 + Math.random() * 18;
        s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.transform = `rotate(${a}rad)`;
        document.body.appendChild(s);
        M.animate(s, { transform: [`rotate(${a}rad) translateX(4px) scaleX(1)`, `rotate(${a}rad) translateX(${d}px) scaleX(.2)`], opacity: [1, 0] }, { duration: .45, ease: [0.2, 0.8, 0.3, 1] }).finished.then(() => s.remove());
      }
    }, true);
  }

  /* 7. Magnet: a fő gombok finoman a kurzor felé húznak (csak egérrel). */
  function magnet() {
    if (!fine || reduced) return;
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .3; b.style.transform = `translate(${x}px,${y}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1)'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 450); });
    });
  }

  /* 8. Spotlight: arany fényfolt követi a kurzort az étlapsorokon és kártyákon (csak egérrel). */
  function spotlight() {
    if (!fine) return;
    document.addEventListener('pointermove', e => {
      const el = e.target.closest('.mrow, .ocard, .rev, .fbcard'); if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* 9. Görgetésjelző a fejléc alján. */
  function progress() {
    const bar = $('[data-progress]'); if (!bar) return;
    if (M && M.scroll && !reduced) { M.scroll(M.animate(bar, { transform: ['scaleX(0)', 'scaleX(1)'] }, { ease: 'linear' })); return; }
    addEventListener('scroll', () => { const p = scrollY / (document.documentElement.scrollHeight - innerHeight); bar.style.transform = `scaleX(${p})`; }, { passive: true });
  }


  embers(); splitTitle(); rotator(); sparks(); magnet(); spotlight(); progress();
})();
