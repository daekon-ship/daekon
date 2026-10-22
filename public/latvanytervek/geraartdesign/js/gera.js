/* geraartdesign – látványterv interakciók (2. kör) */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const halk = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- szolgáltatások: geometrikus jelek ---------------- */
  const K = '#4F4136', C = '#BE9670', V = '#C8B6A1';
  const SZOLG = [
    { cim: 'Egyedi bútorok', le: 'Asztal, komód, tálaló, polc — méretre, a helyiség stílusához.',
      ikon: `<rect class="m m1" x="6" y="22" width="64" height="8" fill="${K}"/><rect x="12" y="30" width="6" height="40" fill="${K}"/><rect x="58" y="30" width="6" height="40" fill="${K}"/><circle class="m m1" cx="52" cy="10" r="9" fill="${C}"/>` },
    { cim: 'Konyhabútorok', le: 'Átgondolt tárolás, tartós felületek, pontos illesztések.',
      ikon: `<rect x="4" y="38" width="68" height="34" fill="none" stroke="${K}" stroke-width="1.6"/><path d="M27 38V72M50 38V72" stroke="${K}" stroke-width="1.6"/><rect class="m m1" x="4" y="6" width="30" height="20" fill="${C}"/><rect class="m m2" x="40" y="6" width="32" height="20" fill="none" stroke="${K}" stroke-width="1.6"/>` },
    { cim: 'Beépített szekrények', le: 'Gardrób, falfülke, tetőtér: a hely minden centiméterét kihasználva.',
      ikon: `<rect x="8" y="4" width="60" height="68" fill="none" stroke="${K}" stroke-width="1.6"/><path d="M38 4V72" stroke="${K}" stroke-width="1.6"/><rect class="m m2" x="12" y="8" width="22" height="60" fill="${C}"/><circle cx="42" cy="40" r="2.6" fill="${K}"/>` },
    { cim: 'Intarzia és díszítés', le: 'Berakásos minták, monogramok, díszlapok bútorra, dobozra, falra.',
      ikon: `<rect x="4" y="4" width="68" height="68" fill="none" stroke="${V}" stroke-width="1.4"/><g class="m m3"><path d="M38 12L48 38L38 64L28 38Z" fill="${C}"/><path d="M12 38L38 30L64 38L38 46Z" fill="${K}"/></g>` },
    { cim: 'Bútorfelújítás', le: 'Régi darabok javítása, felújítása — a karakterük megtartásával.',
      ikon: `<path d="M14 58A28 28 0 1 1 62 44" fill="none" stroke="${K}" stroke-width="1.6"/><path class="m m2" d="M54 40L62 46L68 37" fill="none" stroke="${K}" stroke-width="1.6"/><rect class="m m1" x="26" y="30" width="22" height="22" fill="${C}"/>` },
    { cim: 'Ajtók és ablakok', le: 'Fa nyílászárók készítése és javítása.', egyeztet: true,
      ikon: `<rect x="14" y="4" width="46" height="68" fill="none" stroke="${K}" stroke-width="1.6"/><rect class="m m2" x="20" y="10" width="34" height="26" fill="${C}"/><rect x="20" y="42" width="34" height="24" fill="none" stroke="${V}" stroke-width="1.4"/><circle cx="52" cy="40" r="2.6" fill="${K}"/>` }
  ];
  const sr = $('#szolgRacs');
  if (sr) SZOLG.forEach((s, i) => {
    const d = document.createElement('article');
    d.className = 'szolg felfed';
    d.innerHTML = `<span class="sz">0${i + 1}</span><svg viewBox="0 0 76 76" aria-hidden="true">${s.ikon}</svg><h3>${s.cim}</h3><p>${s.le}</p>${s.egyeztet ? '<span class="jel egyeztet" title="ügyféllel egyeztetendő">egyeztetendő</span>' : ''}`;
    sr.appendChild(d);
  });

  /* ---------------- munkák: fotóhelyek, szűrővel ----------------
     Valódi kép: foto: 'img/munkak/xy.jpg'. Új tétel: új sor a listába. */
  const MUNKAK = [
    { kat: 'Konyha', cim: 'Konyhabútor', foto: null },
    { kat: 'Szekrény', cim: 'Beépített gardrób', foto: null },
    { kat: 'Bútor', cim: 'Tálalószekrény', foto: null },
    { kat: 'Intarzia', cim: 'Berakásos asztallap', foto: null },
    { kat: 'Felújítás', cim: 'Felújított komód', foto: null }
  ];
  /* a fotóhelyekre: lapos, geometrikus nézetrajz a kategóriáról (nem fotó) */
  const D = '#4F4136', KA = '#BE9670', HO = '#F6EFE5', TV = '#C8B6A1';
  const RAJZ = {
    Konyha: `<rect x="20" y="20" width="160" height="34" fill="${HO}"/><path d="M73 20V54M126 20V54" stroke="${TV}"/><rect x="20" y="78" width="160" height="5" fill="${D}"/><rect x="20" y="83" width="160" height="44" fill="${KA}"/><path d="M60 83V127M100 83V127M140 83V127" stroke="#9E7752"/><rect x="30" y="66" width="40" height="12" fill="${TV}"/>`,
    'Szekrény': `<rect x="45" y="10" width="110" height="122" fill="${KA}"/><path d="M82 10V132M118 10V132" stroke="#9E7752"/><rect x="45" y="10" width="110" height="122" fill="none" stroke="${D}" stroke-width="2"/><path d="M78 66V80M86 66V80M114 66V80" stroke="${D}" stroke-width="2"/>`,
    'Bútor': `<circle cx="100" cy="42" r="32" fill="${HO}"/><rect x="40" y="80" width="120" height="4" fill="${D}"/><rect x="44" y="84" width="112" height="38" fill="${KA}"/><path d="M81 84V122M118 84V122" stroke="#9E7752"/><rect x="50" y="122" width="3" height="12" fill="${D}"/><rect x="147" y="122" width="3" height="12" fill="${D}"/><path d="M58 80V68a8 8 0 0 1 16 0V80Z" fill="#7A6A5C"/>`,
    'Intarzia': `<rect x="50" y="10" width="100" height="100" fill="${HO}"/><rect x="58" y="18" width="84" height="84" fill="none" stroke="${TV}"/><path d="M100 22L112 60L100 98L88 60Z" fill="${KA}"/><path d="M62 60L100 50L138 60L100 70Z" fill="${D}"/><rect x="40" y="114" width="120" height="4" fill="${D}"/>`,
    'Felújítás': `<rect x="55" y="40" width="90" height="84" fill="${KA}"/><path d="M55 68H145M55 96H145" stroke="#9E7752"/><g fill="${D}"><circle cx="100" cy="54" r="2.5"/><circle cx="100" cy="82" r="2.5"/><circle cx="100" cy="110" r="2.5"/></g><rect x="50" y="36" width="100" height="4" fill="${D}"/><path d="M40 30A62 62 0 0 1 160 30" fill="none" stroke="${TV}" stroke-dasharray="3 4"/>`
  };
  const gal = $('#galeria'), sz = $('#szuro');
  if (gal) {
    MUNKAK.forEach((m, i) => {
      const f = document.createElement('figure');
      f.className = `kep n${i + 1} felfed`; f.dataset.kat = m.kat;
      f.innerHTML = `<div class="kep-hely">${m.foto ? `<img src="${m.foto}" alt="${m.cim}" loading="lazy">` : `<div class="ures"><span>Fotó helye · 0${i + 1}</span><svg viewBox="0 0 200 140" aria-hidden="true">${RAJZ[m.kat] || ''}</svg><span>${m.kat} · saját kép kerül ide</span></div>`}</div><figcaption><h3>${m.cim}</h3><span>${m.kat}</span></figcaption>`;
      gal.appendChild(f);
    });
    ['Mind', ...new Set(MUNKAK.map(m => m.kat))].forEach((k, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = k; b.setAttribute('aria-pressed', i === 0);
      b.addEventListener('click', () => {
        $$('button', sz).forEach(x => x.setAttribute('aria-pressed', x === b));
        $$('.kep', gal).forEach(el => el.classList.toggle('rejt', k !== 'Mind' && el.dataset.kat !== k));
      });
      sz.appendChild(b);
    });
  }

  /* ---------------- görgetésre megjelenés (ugrásbiztos) ---------------- */
  let varo = $$('.felfed');
  $$('.szolg, .kep, .lepes, .elv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; });
  const folyamat = $('#folyamatSor'), lepesek = $$('.lepes');
  let tick = false;
  function frissit() {
    tick = false;
    const h = innerHeight * 0.88;
    varo = varo.filter(el => (el.getBoundingClientRect().top < h) ? (el.classList.add('lathato'), false) : true);
    if (folyamat) {
      const r = folyamat.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
      folyamat.style.setProperty('--halad', p.toFixed(3));
      lepesek.forEach((l, i) => l.classList.toggle('aktiv', p >= i / lepesek.length + 0.02));
    }
  }
  const figyel = () => { if (!tick) { tick = true; requestAnimationFrame(frissit); } };
  addEventListener('scroll', figyel, { passive: true }); addEventListener('resize', figyel); frissit();

  /* ---------------- hero-jelenet: felépül, egérre finoman mélyül ---------------- */
  const jel = $('#jelenet');
  if (jel) {
    setTimeout(() => jel.classList.add('kesz'), halk ? 0 : 200);
    if (!halk && matchMedia('(pointer:fine)').matches) {
      const ret = $$('.reteg', jel), keret = jel.parentElement;
      keret.addEventListener('pointermove', e => {
        const r = keret.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        ret.forEach(g => { const m = +g.dataset.m; g.style.transform = `translate(${(-x * m).toFixed(1)}px,${(-y * m).toFixed(1)}px)`; });
      });
      keret.addEventListener('pointerleave', () => ret.forEach(g => { g.style.transform = ''; }));
    }
  }

  /* ---------------- fejléc, menü ---------------- */
  const fej = $('#fejlec');
  const gorget = () => fej.classList.toggle('gorgetve', scrollY > 24);
  addEventListener('scroll', gorget, { passive: true }); gorget();
  const mg = $('#menuGomb');
  mg && mg.addEventListener('click', () => { const ny = document.body.classList.toggle('menu-nyitva'); mg.setAttribute('aria-expanded', ny); });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-nyitva'); mg && mg.setAttribute('aria-expanded', 'false'); }));

  /* ---------------- űrlap (demó, nincs háttérrendszer) ---------------- */
  const urlap = $('#urlap'), vj = $('#visszajelzes'), kep = $('#kep');
  kep && kep.addEventListener('change', () => { $('#kepNev').textContent = kep.files.length ? `${kep.files.length} fájl kiválasztva` : 'Fotó vagy vázlat csatolása (nem kötelező)'; });
  urlap && urlap.addEventListener('submit', e => {
    e.preventDefault();
    const nev = urlap.nev.value.trim(), tel = urlap.tel.value.trim();
    if (!nev || !tel) { vj.textContent = 'Kérem, adja meg a nevét és a telefonszámát, hogy vissza tudjam hívni.'; vj.classList.add('lathato'); (!nev ? urlap.nev : urlap.tel).focus(); return; }
    vj.textContent = `Köszönöm, ${nev.split(' ')[0]}! (Látványterv: az űrlap még nincs bekötve — élesítéskor ide érkezik a visszaigazolás.)`;
    vj.classList.add('lathato');
  });

  /* ---------------- bemutató: logóváltozat kipróbálása ---------------- */
  function logo(v) {
    $$('[data-logo]').forEach(img => { img.src = `arculat/logo-${v}/geraartdesign-${v}-${img.dataset.logo}.svg`; });
    $$('#bemutato button[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === String(v)));
    const ico = $('link[rel=icon]'); if (ico) ico.href = `arculat/logo-${v}/geraartdesign-${v}-kompakt.svg`;
    try { localStorage.setItem('gera-logo', v); } catch (e) {}
  }
  let kezdo = new URLSearchParams(location.search).get('logo');
  if (!kezdo) { try { kezdo = localStorage.getItem('gera-logo'); } catch (e) {} }
  if (kezdo && /^[1-5]$/.test(kezdo)) logo(kezdo);
  $$('#bemutato button[data-v]').forEach(b => b.addEventListener('click', () => logo(b.dataset.v)));
  const bm = $('#bemutato'), bk = $('#bemutatoKapcs');
  const allit = z => { bm.classList.toggle('zart', z); bk.setAttribute('aria-expanded', !z); bk.textContent = z ? 'Logó 1–5' : 'Logó'; };
  if (bm) { allit(innerWidth < 1100); bk.addEventListener('click', () => allit(!bm.classList.contains('zart'))); }
})();
