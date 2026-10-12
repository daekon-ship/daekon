/* Tető.pro – látványterv */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var csokkentett = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  /* ---------- Hero: a kép soronként, eresztől a gerinc felé kerül a helyére ---------- */
  var hero = $("#heroKep");
  if (hero && !csokkentett) {
    var forras = $("img", hero);
    var n = parseInt(hero.getAttribute("data-sorok"), 10) || 10;
    var sorok = [];
    for (var i = 0; i < n; i++) {
      var sor = document.createElement("div");
      sor.className = "hero__sor";
      sor.style.top = (i * 100 / n) + "%";
      sor.style.height = "calc(" + (100 / n) + "% + 1px)";
      var k = forras.cloneNode();
      k.removeAttribute("fetchpriority");
      k.alt = "";
      k.setAttribute("aria-hidden", "true");
      k.style.height = (n * 100) + "%";
      k.style.top = (-i * 100) + "%";
      sor.appendChild(k);
      hero.insertBefore(sor, forras.nextSibling);
      sorok.push(sor);
    }
    forras.style.visibility = "hidden";
    var indit = function () {
      // alulról felfelé, mint a cserépsorok
      sorok.slice().reverse().forEach(function (s, j) {
        setTimeout(function () { s.classList.add("le"); }, 80 + j * 70);
      });
      setTimeout(function () {
        hero.classList.add("kesz");
        forras.style.visibility = "";
        sorok.forEach(function (s) { s.remove(); });
      }, 80 + n * 70 + 1100);
    };
    if (forras.complete && forras.naturalWidth) indit();
    else { forras.addEventListener("load", indit, { once: true }); forras.addEventListener("error", function () { forras.style.visibility = ""; }); }
  }

  /* ---------- Fejléc, menü ---------- */
  var fejlec = $("#fejlec"), menu = $("#menu"), mg = $("#menugomb");
  var allapot = function () { fejlec.classList.toggle("gorgetve", window.scrollY > 40); };
  allapot();
  window.addEventListener("scroll", allapot, { passive: true });
  var menuZar = function () { menu.classList.remove("nyitva"); mg.setAttribute("aria-expanded", "false"); };
  mg.addEventListener("click", function () {
    var nyit = !menu.classList.contains("nyitva");
    menu.classList.toggle("nyitva", nyit);
    mg.setAttribute("aria-expanded", String(nyit));
  });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", menuZar); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") menuZar(); });

  // aktív menüpont
  var menupontok = $$('.menu a[href^="#"]');
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (bej) {
      bej.forEach(function (b) {
        if (b.isIntersecting) {
          menupontok.forEach(function (a) { a.classList.toggle("aktiv", a.getAttribute("href") === "#" + b.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    menupontok.forEach(function (a) { var c = $(a.getAttribute("href")); if (c) io.observe(c); });
  }

  /* ---------- Mobil alsó sáv: a hero gombjai után jelenik meg ---------- */
  var sav = $("#mobilsav"), heroGombok = $(".hero__gombok");
  if (sav && heroGombok && "IntersectionObserver" in window) {
    new IntersectionObserver(function (b) {
      sav.classList.toggle("lathato", !b[0].isIntersecting && b[0].boundingClientRect.top < 0);
    }).observe(heroGombok);
  }

  /* ---------- Szolgáltatások lapozó (mobil) ---------- */
  var racs = $("#szolgRacs"), lapozo = $("#szolgLapozo");
  if (racs && lapozo) {
    var kartyak = $$(".kartya", racs);
    kartyak.forEach(function () { lapozo.appendChild(document.createElement("i")); });
    var pontok = $$("i", lapozo);
    var frissit = function () {
      var bal = racs.scrollLeft, legk = 0, min = Infinity;
      kartyak.forEach(function (k, i) { var d = Math.abs(k.offsetLeft - kartyak[0].offsetLeft - bal); if (d < min) { min = d; legk = i; } });
      if (racs.scrollLeft + racs.clientWidth >= racs.scrollWidth - 4) legk = kartyak.length - 1;
      pontok.forEach(function (p, i) { p.classList.toggle("aktiv", i === legk); });
    };
    racs.addEventListener("scroll", function () { window.requestAnimationFrame(frissit); }, { passive: true });
    frissit();
  }

  /* ---------- Galéria ----------
     Új referencia: egy új sor ebbe a tömbbe; a kép két méretben az img/ mappába:
     <nev>-800.webp és <nev>-1600.webp. h: a 800 px széles kép magassága. */
  var GALERIA = [
    { nev: "tetoter-kesz", felirat: "Tetőtér-bővítés, elkészült felépítmény ablaksorral", kat: "egyedi", h: 600 },
    { nev: "vapa-badogozas", felirat: "Vápabádog a lécezésen", kat: "lemez kozben", h: 1422 },
    { nev: "cserepfedes-vapa", felirat: "Cserépfedés vápával, kész felület", kat: "tetofedes", h: 600 },
    { nev: "lemezfedes-vapa", felirat: "Lemezfedés vápával, mellette a lécezés", kat: "lemez kozben", h: 600 },
    { nev: "cserepfedes-uj", felirat: "Új cserépfedés a lécezésen", kat: "tetofedes kozben", h: 1067 },
    { nev: "terasz-fedett", felirat: "Fedett terasz lemezfedéssel", kat: "terasz", h: 600 },
    { nev: "dron-lecezes", felirat: "Lécezés drónról, a csapat munka közben", kat: "kozben", h: 447 },
    { nev: "tetoablak", felirat: "Tetőablak beépítése cseréptetőbe", kat: "egyedi", h: 1067 },
    { nev: "fedes-felulnezet", felirat: "Új fedés felülnézetből", kat: "tetofedes", h: 600 },
    { nev: "terasz-pergola", felirat: "Terasz pergolával, mögötte tetőtér-bővítés", kat: "terasz egyedi", h: 600 },
    { nev: "lecezes-gerinc", felirat: "Fólia és lécezés a gerincig", kat: "kozben tetofedes", h: 1067 },
    { nev: "tetoter-szerkezet", felirat: "Tetőtér-bővítés: a felépítmény szerkezete", kat: "egyedi kozben", h: 600 },
    { nev: "ereszalj-deszkazas", felirat: "Ereszalj deszkázása", kat: "egyedi", h: 1374 },
    { nev: "terasz-szerkezet", felirat: "Terasz acélszerkezete építés közben", kat: "terasz kozben", h: 600 },
    { nev: "tetoter-elotte", felirat: "Tetőtér-bővítés: kiindulási állapot", kat: "egyedi kozben", h: 600 }
  ];
  var gal = $("#galeria");
  GALERIA.forEach(function (g, i) {
    var li = document.createElement("li");
    if (i >= 9) li.className = "tobb";
    li.dataset.kat = g.kat;
    li.innerHTML = '<button type="button" data-i="' + i + '" aria-label="Nagyítás: ' + g.felirat + '">' +
      '<img src="img/' + g.nev + '-800.webp" alt="' + g.felirat + '" width="800" height="' + g.h + '" loading="lazy" decoding="async">' +
      '<span class="gf">' + g.felirat + '</span></button>';
    gal.appendChild(li);
  });

  var tobb = $("#tobbgomb");
  tobb.textContent = "Összes kép (" + GALERIA.length + ")";
  tobb.addEventListener("click", function () { gal.classList.remove("zart"); tobb.hidden = true; });
  var szuroGombok = $$(".szuro__gomb");
  var lathatok = function () { return $$("li", gal).filter(function (l) { return !l.hidden && getComputedStyle(l).display !== "none"; }).map(function (l) { return +$("button", l).dataset.i; }); };
  szuroGombok.forEach(function (b) {
    b.addEventListener("click", function () {
      var sz = b.dataset.szuro;
      szuroGombok.forEach(function (x) { var a = x === b; x.classList.toggle("aktiv", a); x.setAttribute("aria-pressed", String(a)); });
      $$("li", gal).forEach(function (l) { l.hidden = !(sz === "mind" || l.dataset.kat.split(" ").indexOf(sz) > -1); });
      if (sz !== "mind") { gal.classList.remove("zart"); tobb.hidden = true; }
    });
  });

  /* ---------- Nagyító ---------- */
  var nz = $("#nagyito"), nzKep = $("#nzKep"), nzF = $("#nzFelirat"), nzSz = $("#nzSzam");
  var sor = [], hol = 0, elozoFokusz = null;
  var mutat = function () {
    var g = GALERIA[sor[hol]];
    nzKep.src = "img/" + g.nev + "-1600.webp";
    nzKep.alt = g.felirat;
    nzF.textContent = g.felirat;
    nzSz.textContent = (hol + 1) + " / " + sor.length;
  };
  var nyit = function (i, lista) {
    sor = lista; hol = Math.max(0, sor.indexOf(i));
    elozoFokusz = document.activeElement;
    mutat(); nz.hidden = false; document.body.style.overflow = "hidden";
    $("#nzZar").focus();
  };
  var zar = function () { nz.hidden = true; document.body.style.overflow = ""; if (elozoFokusz) elozoFokusz.focus(); };
  var lep = function (d) { hol = (hol + d + sor.length) % sor.length; mutat(); };
  gal.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) nyit(+b.dataset.i, lathatok()); });
  $$(".tortenet__kep").forEach(function (b) {
    b.addEventListener("click", function () {
      var idx = GALERIA.map(function (g) { return g.nev; });
      var lista = ["tetoter-elotte", "tetoter-szerkezet", "tetoter-kesz"].map(function (n) { return idx.indexOf(n); });
      nyit(idx.indexOf(b.dataset.kep), lista);
    });
  });
  $("#nzZar").addEventListener("click", zar);
  $("#nzElozo").addEventListener("click", function () { lep(-1); });
  $("#nzKov").addEventListener("click", function () { lep(1); });
  nz.addEventListener("click", function (e) { if (e.target === nz) zar(); });
  document.addEventListener("keydown", function (e) {
    if (nz.hidden) return;
    if (e.key === "Escape") zar();
    if (e.key === "ArrowLeft") lep(-1);
    if (e.key === "ArrowRight") lep(1);
    if (e.key === "Tab") { // fókusz a nagyítóban marad
      var f = $$("button", nz), elso = f[0], utolso = f[f.length - 1];
      if (e.shiftKey && document.activeElement === elso) { e.preventDefault(); utolso.focus(); }
      else if (!e.shiftKey && document.activeElement === utolso) { e.preventDefault(); elso.focus(); }
    }
  });
  var tx = null;
  nz.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  nz.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var d = e.changedTouches[0].clientX - tx;
    if (Math.abs(d) > 45) lep(d < 0 ? 1 : -1);
    tx = null;
  });

  /* ---------- Térkép: 200 km-es körzet Bugyi körül ---------- */
  var VAROSOK = [
    { n: "Budapest", lat: 47.4979, lon: 19.0402, igazit: "start", dx: 10, dy: 4 },
    { n: "Kecskemét", lat: 46.9062, lon: 19.6913, igazit: "start", dx: 10, dy: 4 },
    { n: "Szolnok", lat: 47.1621, lon: 20.1825, igazit: "start", dx: 10, dy: 4 },
    { n: "Csongrád", lat: 46.7130, lon: 20.1430, igazit: "start", dx: 10, dy: 4 },
    { n: "Hódmezővásárhely", lat: 46.4181, lon: 20.3300, igazit: "end", dx: -10, dy: -6 },
    { n: "Szeged", lat: 46.2530, lon: 20.1414, igazit: "end", dx: -10, dy: 4 }
  ];
  var BAZ = { lat: 47.2236, lon: 19.1503 };
  var korok = $("#terkepKorok"), varosok = $("#terkepVarosok");
  if (korok && varosok) {
    var NS = "http://www.w3.org/2000/svg";
    var C = 210, KM = 150 / 186; // 150 km = 186 px
    var pont = function (lat, lon) {
      var dy = (BAZ.lat - lat) * 111.2, dx = (lon - BAZ.lon) * 111.2 * Math.cos(BAZ.lat * Math.PI / 180);
      return [C + dx / KM, C + dy / KM];
    };
    var el = function (t, a, sz) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (sz) e.textContent = sz; return e; };
    [50, 100, 150].forEach(function (km) {
      var r = km / KM;
      korok.appendChild(el("circle", { cx: C, cy: C, r: r, "class": km === 150 ? "kulso" : "" }));
      korok.appendChild(el("text", { x: C + 4, y: C - r - 5 }, km + " km"));
    });
    VAROSOK.forEach(function (v) {
      var p = pont(v.lat, v.lon), g = el("g", {});
      g.appendChild(el("circle", { cx: p[0], cy: p[1], r: 4.5 }));
      g.appendChild(el("text", { x: p[0] + v.dx, y: p[1] + v.dy, "text-anchor": v.igazit }, v.n));
      varosok.appendChild(g);
    });
    var b = el("g", { "class": "bazis" });
    b.appendChild(el("circle", { cx: C, cy: C, r: 14, "class": "gy" }));
    b.appendChild(el("circle", { cx: C, cy: C, r: 7, "class": "bel" }));
    b.appendChild(el("text", { x: C - 20, y: C + 5, "text-anchor": "end" }, "Bugyi"));
    varosok.appendChild(b);
  }

  /* ---------- Gyors felmérés-kérő (hero kártya, 2 lépés) ---------- */
  var gy = $("#gyors");
  if (gy) {
    var l1 = $("#gyors1"), l2 = $("#gyors2"), hibaG = $("#gyorsHiba");
    var valt = function (n) {
      l1.hidden = n !== 1; l2.hidden = n !== 2;
      $("#gyorsLepes").textContent = n; $("#gyorsSav2").classList.toggle("aktiv", n === 2);
    };
    var tipus = function () { var c = $('input[name="tipus"]:checked', gy); return c ? c.value : ""; };
    $("#gyorsTovabb").addEventListener("click", function () {
      $("#gyorsTipus").textContent = tipus() || "még nem tudom";
      valt(2); $("#g-nev").focus();
    });
    $$('input[name="tipus"]', gy).forEach(function (r) { r.addEventListener("change", function () { setTimeout(function () { $("#gyorsTovabb").click(); }, 180); }); });
    $("#gyorsVissza").addEventListener("click", function () { valt(1); });
    gy.addEventListener("submit", function (e) {
      e.preventDefault();
      var nev = gy.nev.value.trim(), tel = gy.tel.value.trim(), ok = tel.replace(/\D/g, "").length >= 8;
      gy.nev.setAttribute("aria-invalid", String(!nev)); gy.tel.setAttribute("aria-invalid", String(!ok));
      if (!nev || !ok) { hibaG.textContent = !nev ? "Adja meg a nevét." : "Adjon meg egy telefonszámot, amin visszahívhatjuk."; (!nev ? gy.nev : gy.tel).focus(); return; }
      hibaG.textContent = "";
      var torzs = "Név: " + nev + "\nTelefon: " + tel + "\nTelepülés: " + (gy.hely.value.trim() || "-") + "\nMunka: " + (tipus() || "nincs megadva");
      location.href = "mailto:samujanos777@gmail.com?subject=" + encodeURIComponent("Felméréskérés – " + nev) + "&body=" + encodeURIComponent(torzs);
    });
  }

  /* ---------- Ajánlatkérő: előre kitöltött e-mail ---------- */
  var urlap = $("#urlap"), hiba = $("#urlapHiba");
  urlap.addEventListener("submit", function (e) {
    e.preventDefault();
    var nev = urlap.nev.value.trim(), tel = urlap.tel.value.trim();
    urlap.nev.setAttribute("aria-invalid", String(!nev));
    urlap.tel.setAttribute("aria-invalid", String(tel.replace(/\D/g, "").length < 8));
    if (!nev || tel.replace(/\D/g, "").length < 8) {
      hiba.textContent = !nev ? "Adja meg a nevét, hogy tudjuk, kit keresünk." : "Adjon meg egy telefonszámot, amin visszahívhatjuk.";
      (!nev ? urlap.nev : urlap.tel).focus();
      return;
    }
    hiba.textContent = "";
    var munkak = $$('input[name="munka"]:checked', urlap).map(function (c) { return c.value; }).join(", ") || "nincs megadva";
    var torzs = "Név: " + nev + "\nTelefon: " + tel + "\nTelepülés: " + (urlap.hely.value.trim() || "-") +
      "\nMunka: " + munkak + "\n\n" + (urlap.uzenet.value.trim() || "");
    location.href = "mailto:samujanos777@gmail.com?subject=" + encodeURIComponent("Ajánlatkérés – " + nev) + "&body=" + encodeURIComponent(torzs);
  });

  // egyeztetendő linkek (pl. Facebook) – a látványtervben jelezzük
  $$("[data-egyeztetendo]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); alert("Látványterv: a(z) " + a.dataset.egyeztetendo + " az ügyféllel egyeztetendő."); });
  });

  /* finom megjelenés görgetéskor (szakaszfejek, kártyák) */
  if ("IntersectionObserver" in window && !csokkentett) {
    var elemek = $$(".fej, .kiemelt__fo, .kiemelt__szoveg, .lepesek li, .terkep, .gyik details, .urlap");
    var fo = new IntersectionObserver(function (b) { b.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("lathato"); fo.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    elemek.forEach(function (e, i) { e.classList.add("felbukkan"); e.style.transitionDelay = (i % 3) * 60 + "ms"; fo.observe(e); });
  }

  var ev = $("#ev"); if (ev) ev.textContent = new Date().getFullYear();
})();
