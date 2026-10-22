/* geraartdesign – látványterv interakciók */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const halk = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- tartalom: szolgáltatások ---------------- */
  const SZOLG = [
    { cim: 'Egyedi bútorok', le: 'Asztal, komód, tálaló, polc — méretre, a helyiség stílusához igazítva.', minta: 'sakk' },
    { cim: 'Konyhabútorok', le: 'Átgondolt tárolás, tartós felületek, pontos illesztések a mindennapokra.', minta: 'halszalka' },
    { cim: 'Beépített szekrények', le: 'Gardrób, falfülke, tetőtér: a hely minden centiméterét kihasználva.', minta: 'keret' },
    { cim: 'Intarzia és díszítés', le: 'Berakásos minták, monogramok, díszlapok bútorra, dobozra, ajtóra.', minta: 'csillag' },
    { cim: 'Bútorfelújítás', le: 'Régi darabok javítása és felújítása úgy, hogy a karakterük megmaradjon.', minta: 'napsugar' },
    { cim: 'Ajtók és ablakok', le: 'Fa nyílászárók készítése és javítása, egyedi méretben is.', minta: 'kocka', egyeztet: true }
  ];
  const lista = $('#szolgLista');
  if (lista) SZOLG.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'szolg felfed';
    li.innerHTML = `<div><span class="sz">${String(i + 1).padStart(2, '0')}</span><h3>${s.cim}</h3><p>${s.le}${s.egyeztet ? ' <span class="egyeztet" title="ügyféllel egyeztetendő">(egyeztetendő)</span>' : ''}</p><div class="minta" data-intarzia="${s.minta}" aria-hidden="true"></div></div>`;
    lista.appendChild(li);
  });

  /* ---------------- tartalom: munkák ----------------
     Valódi munka felvétele: foto: 'img/munkak/xy.jpg', cim, kategoria, leiras. */
  const PROJEKTEK = [
    { minta: 'napsugar', kategoria: 'Asztallap · díszlap', cim: 'Legyezős napsugár', leiras: 'Huszonnégy szeletből kirakott körte–cseresznye legyező diófa középponttal. Kerek asztallapra, tálalótetőre.', foto: null },
    { minta: 'csillag', kategoria: 'Intarzia', cim: 'Iránytűcsillag', leiras: 'Kétszintű, tizenhat és nyolc ágú csillag körbefutó diófa sávban. Klasszikus berakás dobozfedélre, asztal közepére.', foto: null },
    { minta: 'kocka', kategoria: 'Geometrikus minta', cim: 'Kocka-minta', leiras: 'Három tónus, három rostirány: a juhar, a cseresznye és a dió rombuszaiból térhatású felület lesz.', foto: null },
    { minta: 'keret', kategoria: 'Szekrényajtó · front', cim: 'Keresztsávos tábla', leiras: 'Gérbe vágott, kettős keresztsáv és vékony juhar szegély — elegáns keret egyszerű frontokra.', foto: null },
    { minta: 'halszalka', kategoria: 'Felület', cim: 'Francia halszálka', leiras: 'Ferdén vágott, egymásba futó körte, kőris és tölgy csíkok — ládafedélen, falburkolaton is szép.', foto: null },
    { minta: 'sakk', kategoria: 'Asztallap', cim: 'Sakktábla, fordított rosttal', leiras: 'Juhar és dió négyzetek, egymásra merőleges erezettel — ugyanaz a fa, két különböző fényben.', foto: null }
  ];
  const racs = $('#racs');
  if (racs) PROJEKTEK.forEach((p, i) => {
    const f = document.createElement('figure');
    f.className = 'munka';
    f.tabIndex = 0; f.setAttribute('role', 'button');
    f.setAttribute('aria-label', `${p.cim} – nagyobb nézet`);
    f.innerHTML = `<div class="munka-kep">${p.foto ? `<img src="${p.foto}" alt="${p.cim}" loading="lazy">` : `<span class="jel">Mintatanulmány</span><div data-intarzia="${p.minta}"></div>`}</div>
      <figcaption><div class="munka-szoveg"><h3>${p.cim}</h3></div><span>${p.kategoria}</span></figcaption>`;
    f.addEventListener('click', () => nagyit(p));
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nagyit(p); } });
    racs.appendChild(f);
  });

  window.Intarzia && Intarzia.feltolt();

  /* ---------------- lightbox ---------------- */
  const dlg = $('#nagyito');
  function nagyit(p) {
    if (!dlg) return;
    const k = $('#nagyitoKep'); k.innerHTML = '';
    if (p.foto) k.innerHTML = `<img src="${p.foto}" alt="${p.cim}" style="width:100%;height:100%;object-fit:cover">`;
    else { const d = document.createElement('div'); d.style.cssText = 'width:100%;height:100%'; d.dataset.intarzia = p.minta; k.appendChild(d); Intarzia.feltolt(k); }
    $('#nagyitoCimke').textContent = p.kategoria; $('#nagyitoCim').textContent = p.cim; $('#nagyitoSzoveg').textContent = p.leiras;
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  }
  $('#bezar') && $('#bezar').addEventListener('click', () => dlg.close());
  dlg && dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* ---------------- furnér-mintakönyv ---------------- */
  const FAJOK = [
    { k: 'dio', nev: 'Dió', le: 'mély, meleg barna; elegáns kontraszt a világos fák mellett.' },
    { k: 'cseresznye', nev: 'Cseresznye', le: 'vöröses, meleg tónus, amely az idővel szépen sötétedik.' },
    { k: 'tolgy', nev: 'Tölgy', le: 'tartós, karakteres erezetű — klasszikus bútorokhoz és burkolatokhoz.' },
    { k: 'korte', nev: 'Körte', le: 'finom, egyenletes, enyhén rózsás — az intarzia egyik legkedveltebb fája.' },
    { k: 'koris', nev: 'Kőris', le: 'világos, élénk erezet; friss, modern hatás.' },
    { k: 'juhar', nev: 'Juhar', le: 'a legvilágosabb, nyugodt rajzolat — alap és kiemelés egyszerre.' }
  ];
  const konyv = $('#konyv'), info = $('#anyagInfo');
  if (konyv) {
    FAJOK.slice().reverse().forEach((f, ri) => {
      const i = FAJOK.length - 1 - ri;
      const lap = document.createElement('button');
      lap.type = 'button'; lap.className = 'lap'; lap.setAttribute('role', 'listitem');
      lap.style.setProperty('--n', FAJOK.length - 1 - i);
      lap.style.backgroundImage = `url(img/furner-${f.k}.jpg)`;
      lap.style.zIndex = FAJOK.length - i;
      lap.innerHTML = `<span>${f.nev}<i>${f.le.split(';')[0].split('—')[0].trim()}</i></span>`;
      lap.setAttribute('aria-label', `${f.nev}: ${f.le}`);
      const mutat = () => { $$('.lap', konyv).forEach(l => l.classList.remove('kiemel')); lap.classList.add('kiemel'); info.innerHTML = `<b>${f.nev}</b> — ${f.le}`; };
      lap.addEventListener('mouseenter', mutat); lap.addEventListener('focus', mutat); lap.addEventListener('click', mutat);
      konyv.appendChild(lap);
    });
  }

  /* ---------------- megjelenés görgetésre ----------------
     Egyszerű, ugrásbiztos ellenőrzés: ami a nézet alsó 88%-a fölé ért, megjelenik
     (horgony-ugrásnál a fölötte lévők is). */
  let varo = $$('.felfed, .munka, #konyv');
  $$('.munka').forEach((el, i) => { el.style.transitionDelay = (i % 2) * 120 + 'ms'; });
  let tick = false;
  function ellenoriz() {
    tick = false;
    const hatar = innerHeight * 0.88;
    varo = varo.filter(el => {
      if (el.getBoundingClientRect().top < hatar) { el.classList.add(el.id === 'konyv' ? 'nyitva' : 'lathato'); return false; }
      return true;
    });
    if (!varo.length) removeEventListener('scroll', figyel);
  }
  function figyel() { if (!tick) { tick = true; requestAnimationFrame(ellenoriz); } }
  addEventListener('scroll', figyel, { passive: true }); addEventListener('resize', figyel);
  ellenoriz();

  /* hero-tábla kirakása betöltéskor */
  const tabla = $('#heroTabla');
  if (tabla) requestAnimationFrame(() => setTimeout(() => tabla.classList.add('kesz'), halk ? 0 : 250));

  /* ---------------- fejléc, menü ---------------- */
  const fej = $('#fejlec');
  const gorget = () => fej.classList.toggle('gorgetve', scrollY > 24);
  addEventListener('scroll', gorget, { passive: true }); gorget();
  const mg = $('#menuGomb');
  mg && mg.addEventListener('click', () => {
    const ny = document.body.classList.toggle('menu-nyitva');
    mg.setAttribute('aria-expanded', ny);
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-nyitva'); mg && mg.setAttribute('aria-expanded', 'false'); }));

  /* ---------------- űrlap (demó, nincs háttérrendszer) ---------------- */
  const urlap = $('#urlap'), vj = $('#visszajelzes');
  const kep = $('#kep');
  kep && kep.addEventListener('change', () => { $('#kepNev').textContent = kep.files.length ? `${kep.files.length} fájl kiválasztva` : 'Fotó vagy vázlat csatolása (nem kötelező)'; });
  urlap && urlap.addEventListener('submit', e => {
    e.preventDefault();
    const nev = urlap.nev.value.trim(), tel = urlap.tel.value.trim();
    if (!nev || !tel) {
      vj.textContent = 'Kérem, adja meg a nevét és a telefonszámát, hogy vissza tudjam hívni.';
      vj.classList.add('lathato'); (!nev ? urlap.nev : urlap.tel).focus(); return;
    }
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
  const bmAllit = z => { bm.classList.toggle('zart', z); bk.setAttribute('aria-expanded', !z); bk.textContent = z ? 'Logó 1–5' : 'Logó'; };
  if (bm) { bmAllit(innerWidth < 1100); bk.addEventListener('click', () => bmAllit(!bm.classList.contains('zart'))); }
})();
