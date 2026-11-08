/* TisztaPont – interakciók + Motion (motion.dev).
   Elv: minden tartalom JS és animáció nélkül is látszik; a mozgás csak ráadás.
   Csökkentett mozgásnál semmi nem animál. */
(function () {
  "use strict";
  var D = window.TP_ADATOK || {};
  var M = window.Motion || null;
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animOk = !!(M && !reduce && root.classList.contains("anim"));
  if (animOk) root.classList.add("anim-ok"); else root.classList.remove("anim");
  var ease = [0.2, 0.7, 0.1, 1];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- fejléc ---------- */
  var fej = $("#fej");
  function fejAllapot() { fej.classList.toggle("gorgetve", window.scrollY > 8); }
  fejAllapot();
  window.addEventListener("scroll", fejAllapot, { passive: true });

  /* ---------- mobilmenü ---------- */
  var mGomb = $(".menu-gomb"), menu = $("#mobilmenu");
  function menuAllit(nyit) {
    if (nyit) menu.style.setProperty("--menu-top", Math.round(fej.getBoundingClientRect().bottom) + "px");
    menu.hidden = !nyit;
    mGomb.setAttribute("aria-expanded", String(nyit));
    mGomb.setAttribute("aria-label", nyit ? "Menü bezárása" : "Menü megnyitása");
    $("use", mGomb).setAttribute("href", nyit ? "#i-x" : "#i-menu");
    document.body.classList.toggle("zar", nyit);
    if (nyit && animOk) M.animate($$("nav > a, .mm-kontakt", menu), { opacity: [0, 1], y: [8, 0] }, { duration: 0.3, delay: M.stagger(0.035), ease: ease });
  }
  mGomb.addEventListener("click", function () { menuAllit(menu.hidden); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menuAllit(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) { menuAllit(false); mGomb.focus(); }
  });
  var szeles = matchMedia("(min-width: 981px)");
  var szelesValt = function (e) { if (e.matches && !menu.hidden) menuAllit(false); };
  if (szeles.addEventListener) szeles.addEventListener("change", szelesValt); else if (szeles.addListener) szeles.addListener(szelesValt);

  /* ---------- aktív menüpont ---------- */
  if ("IntersectionObserver" in window) {
    var navLinkek = $$(".nav a");
    var io = new IntersectionObserver(function (bej) {
      bej.forEach(function (b) {
        if (!b.isIntersecting) return;
        navLinkek.forEach(function (a) {
          if (a.getAttribute("href") === "#" + b.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["szolgaltatasok", "wolt", "munkaink", "igy-dolgozunk", "idopont", "kapcsolat"].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- megjelenés görgetésre + a márka képfeltárása ---------- */
  if (animOk) {
    var heroKep = $(".hero-keret img");
    var heroElemek = $$(".hero [data-rv]");
    M.animate(heroElemek, { opacity: [0, 1], y: [14, 0] }, { duration: 0.7, delay: M.stagger(0.08, { startDelay: 0.05 }), ease: ease });
    // „Egy pontból kitisztul a tér”: a fotó a mellette álló pontból, körként tárul fel.
    M.animate(heroKep, { clipPath: ["circle(0% at 0% 78%)", "circle(150% at 0% 78%)"] }, { duration: 1.25, delay: 0.15, ease: [0.65, 0, 0.25, 1] });
    M.animate(heroKep, { scale: [1.06, 1] }, { duration: 1.6, delay: 0.15, ease: ease });

    $$("[data-rv]").forEach(function (el) {
      if (el.closest(".hero")) return;
      M.inView(el, function () {
        M.animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: 0.6, ease: ease });
      }, { amount: 0.15, margin: "0px 0px -6% 0px" });
    });
    M.inView(".lepesek", function () {
      $$(".lepes-pont").forEach(function (p, i) {
        M.animate(p, { "--toltes": [0, 1] }, { duration: 0.45, delay: 0.25 + i * 0.18, ease: ease });
      });
    }, { amount: 0.4 });
    // biztonsági háló: ha bármi elakadna, néhány másodperc múlva minden látszik
    setTimeout(function () {
      $$("[data-rv]").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && getComputedStyle(el).opacity === "0") el.style.opacity = "1";
      });
      if (heroKep && getComputedStyle(heroKep).clipPath.indexOf("0%") === 7) heroKep.style.clipPath = "none";
    }, 3500);
  }

  /* ---------- szalag szüneteltetése ---------- */
  var szGomb = $("[data-szalag-gomb]");
  if (szGomb) {
    szGomb.addEventListener("click", function () {
      var all = szGomb.getAttribute("aria-pressed") !== "true";
      szGomb.setAttribute("aria-pressed", String(all));
      szGomb.closest(".szalag-blokk").classList.toggle("all", all);
      $("span", szGomb).textContent = all ? "Lejátszás" : "Megállítás";
      $("use", szGomb).setAttribute("href", all ? "#i-lejatszas" : "#i-szunet");
    });
  }

  /* ---------- galéria: szűrés ---------- */
  var gal = $("[data-galeria]");
  var elemek = $$(".gal-elem", gal);
  $$("[data-szuro]").forEach(function (gomb) {
    gomb.addEventListener("click", function () {
      var sz = gomb.getAttribute("data-szuro");
      $$("[data-szuro]").forEach(function (g) { g.setAttribute("aria-pressed", String(g === gomb)); });
      gal.setAttribute("data-szuro-allapot", sz);
      var lathato = [];
      elemek.forEach(function (li) {
        var be = sz === "mind" || li.getAttribute("data-kat") === sz;
        li.hidden = !be;
        if (be) lathato.push(li);
      });
      if (animOk) M.animate(lathato, { opacity: [0, 1], y: [10, 0] }, { duration: 0.4, delay: M.stagger(0.05), ease: ease });
    });
  });

  /* ---------- galéria: képnézegető ---------- */
  var dlg = $("[data-nagyito]");
  var nKep = $("[data-nkep]"), nFel = $("[data-nfel]"), nSzam = $("[data-nszam]");
  var aktualis = 0, sor = [], indito = null;
  var munkak = D.munkak || [];

  function lathatoIndexek() {
    // a képernyőn látható sorrend (mobilon a CSS „order” átrendez)
    return elemek.filter(function (li) { return !li.hidden; })
      .map(function (li, i) { return { li: li, i: i, o: parseInt(getComputedStyle(li).order, 10) || 0 }; })
      .sort(function (a, b) { return a.o - b.o || a.i - b.i; })
      .map(function (x) { return +$("[data-nagyit]", x.li).getAttribute("data-nagyit"); });
  }
  function mutat(i, irany) {
    aktualis = (i + sor.length) % sor.length;
    var m = munkak[sor[aktualis]];
    if (!m) return;
    nKep.src = "img/" + m.kep + "-" + m.w + ".jpg";
    nKep.width = m.w; nKep.height = m.h;
    nKep.alt = m.alt;
    nFel.textContent = m.felirat;
    nSzam.textContent = (aktualis + 1) + " / " + sor.length;
    var tobb = sor.length > 1;
    $("[data-nelozo]", dlg).hidden = !tobb;
    $("[data-nkov]", dlg).hidden = !tobb;
    if (animOk && irany) M.animate(nKep, { opacity: [0, 1], x: [irany * 24, 0] }, { duration: 0.35, ease: ease });
    // a szomszédos képek előtöltése a gyors lapozáshoz
    [aktualis + 1, aktualis - 1].forEach(function (j) {
      var n = munkak[sor[(j + sor.length) % sor.length]];
      if (n) { var im = new Image(); im.src = "img/" + n.kep + "-" + n.w + ".jpg"; }
    });
  }
  function nyit(idx, gomb) {
    sor = lathatoIndexek();
    indito = gomb;
    var poz = sor.indexOf(idx);
    mutat(poz < 0 ? 0 : poz, 0);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    document.body.classList.add("zar");
    $("[data-nzar]", dlg).focus();
    if (animOk) M.animate($(".nagyito-belso", dlg), { opacity: [0, 1] }, { duration: 0.25 });
  }
  function zar() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("close", function () {
    document.body.classList.remove("zar");
    if (indito) indito.focus();
  });
  $$("[data-nagyit]").forEach(function (g) {
    g.addEventListener("click", function () { nyit(+g.getAttribute("data-nagyit"), g); });
  });
  $("[data-nzar]", dlg).addEventListener("click", zar);
  $("[data-nelozo]", dlg).addEventListener("click", function () { mutat(aktualis - 1, -1); });
  $("[data-nkov]", dlg).addEventListener("click", function () { mutat(aktualis + 1, 1); });
  dlg.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); mutat(aktualis + 1, 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); mutat(aktualis - 1, -1); }
    else if (e.key === "Escape" && !dlg.open) zar();
  });
  // kattintás a háttérre: bezár
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg || e.target.classList.contains("nagyito-kep")) zar();
  });
  // érintés: lapozás vízszintes húzással
  var tx = null, ty = null;
  dlg.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") { tx = e.clientX; ty = e.clientY; } });
  dlg.addEventListener("pointerup", function (e) {
    if (tx === null) return;
    var dx = e.clientX - tx, dy = e.clientY - ty; tx = ty = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3 && sor.length > 1) mutat(aktualis + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });

  /* ---------- időpontkérő ---------- */
  var fog = $("[data-foglalo]");
  var urlap = $("[data-fog-urlap]");
  var lepesek = $$(".fog-lepes", urlap);
  var jelzok = $$(".fog-lepesek li", fog);
  var allapot = $("[data-fog-allapot]");
  var bVissza = $("[data-vissza]", urlap), bTovabb = $("[data-tovabb]", urlap), bUjra = $("[data-ujra]", urlap);
  var tovSzoveg = $("[data-tovabb-szoveg]", urlap);
  var NEVEK = ["Szolgáltatás", "Helyszín", "Időpont", "Elérhetőség", "Összesítés"];
  var lepes = 1;

  function maISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var datum = $("#f-datum");
  datum.min = maISO();

  function ertek(nev) {
    var el = urlap.elements[nev];
    if (!el) return "";
    if (el instanceof RadioNodeList || (el.length && !el.tagName)) { return el.value || ""; }
    return (el.value || "").trim();
  }
  function invalid(el, rossz) { if (rossz) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid"); }
  function hiba(kulcs, mutatva, mezo) {
    var p = $('[data-hiba="' + kulcs + '"]', urlap);
    if (p) p.hidden = !mutatva;
    if (mezo) {
      if (mutatva) mezo.setAttribute("aria-invalid", "true"); else mezo.removeAttribute("aria-invalid");
    }
    return !mutatva;
  }
  function ellenoriz(n) {
    var ok = true, elso = null;
    function jelol(kulcs, rossz, mezo, fokusz) {
      hiba(kulcs, rossz, mezo);
      if (rossz) { ok = false; if (!elso) elso = fokusz || mezo; }
    }
    if (n === 1) {
      jelol("szolgaltatas", !ertek("szolgaltatas"), $(".valaszto-szolg", urlap), $('input[name="szolgaltatas"]', urlap));
    } else if (n === 2) {
      jelol("telepules", !ertek("telepules"), $("#f-telepules"));
      var ch = $('[aria-labelledby="lbl-terulet"]', urlap);
      jelol("alapterulet", !ertek("alapterulet"), ch, $('input[name="alapterulet"]', urlap));
    } else if (n === 3) {
      var d = ertek("datum");
      jelol("datum", !d || d < maISO(), datum);
      var ns = $('[aria-labelledby="lbl-napszak"]', urlap);
      jelol("napszak", !ertek("napszak"), ns, $('input[name="napszak"]', urlap));
    } else if (n === 4) {
      jelol("nev", !ertek("nev"), $("#f-nev"));
      var tel = ertek("telefon"), em = ertek("email");
      var telOk = tel.replace(/[^\d]/g, "").length >= 8;
      var emOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
      var rossz = !(telOk || emOk);
      hiba("kontakt", rossz);
      invalid($("#f-tel"), rossz);
      invalid($("#f-email"), rossz && em !== "");
      if (rossz) { ok = false; if (!elso) elso = $("#f-tel"); }
    }
    if (!ok && elso) elso.focus();
    return ok;
  }
  function szolgNev(id) {
    var s = (D.szolgaltatasok || []).filter(function (x) { return x.id === id; })[0];
    return s ? s.cim : id;
  }
  function datumSzoveg(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(d);
  }
  function osszesit() {
    var sorok = [
      ["Szolgáltatás", szolgNev(ertek("szolgaltatas")), 1],
      ["Település", ertek("telepules"), 2],
      ["Alapterület", ertek("alapterulet"), 2],
      ["Kívánt nap", datumSzoveg(ertek("datum")), 3],
      ["Napszak", ertek("napszak"), 3],
      ["Név", ertek("nev"), 4],
    ];
    if (ertek("telefon")) sorok.push(["Telefon", ertek("telefon"), 4]);
    if (ertek("email")) sorok.push(["E-mail", ertek("email"), 4]);
    if (ertek("megjegyzes")) sorok.push(["Megjegyzés", ertek("megjegyzes"), 4]);
    var dl = $("[data-osszesito]", urlap);
    dl.textContent = "";
    sorok.forEach(function (s) {
      var w = document.createElement("div");
      var dt = document.createElement("dt"); dt.textContent = s[0];
      var dd = document.createElement("dd"); dd.textContent = s[1];
      var md = document.createElement("dd"); md.className = "mod";
      var b = document.createElement("button"); b.type = "button"; b.textContent = "Módosítom";
      b.setAttribute("aria-label", "Módosítom: " + s[0]);
      b.addEventListener("click", function () { menj(s[2], true); });
      md.appendChild(b);
      w.appendChild(dt); w.appendChild(dd); w.appendChild(md);
      dl.appendChild(w);
    });
    // élesnek ható módban: a látogató saját levelezőjéből elküldhető, előre kitöltött levél
    var mailA = $("[data-igeny-email]", urlap);
    if (mailA) {
      var NL = "\r\n";
      var torzs = "Kedves TisztaPont!" + NL + NL + "Időpontot szeretnék kérni az alábbiak szerint:" + NL + NL +
        sorok.filter(function (x) { return x[1] && x[1] !== "–"; }).map(function (x) { return x[0] + ": " + x[1]; }).join(NL) +
        NL + NL + "Köszönöm!" + NL + ertek("nev");
      mailA.href = "mailto:" + (D.email || "") + "?subject=" + encodeURIComponent("Időpontigény – " + szolgNev(ertek("szolgaltatas"))) +
        "&body=" + encodeURIComponent(torzs);
    }
  }
  function menj(n, fokusz) {
    var regi = lepes;
    lepes = n;
    lepesek.forEach(function (fs) { fs.hidden = +fs.getAttribute("data-lepes") !== n; });
    jelzok.forEach(function (li) {
      var i = +li.getAttribute("data-fl");
      li.classList.toggle("kesz", i < n);
      if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    allapot.textContent = n + ". lépés az 5-ből: " + NEVEK[n - 1];
    bVissza.hidden = n === 1;
    bTovabb.hidden = n === 5;
    bUjra.hidden = n !== 5;
    tovSzoveg.textContent = n === 4 ? "Igény áttekintése" : "Tovább";
    if (n === 5) osszesit();
    var akt = $('[data-lepes="' + n + '"]', urlap);
    if (animOk && regi !== n) M.animate(akt, { opacity: [0, 1], x: [n > regi ? 18 : -18, 0] }, { duration: 0.35, ease: ease });
    if (fokusz) {
      var leg = $("legend", akt);
      leg.focus({ preventScroll: true });
      var r = fog.getBoundingClientRect();
      var fejM = fej.getBoundingClientRect().height;
      if (r.top < fejM + 8) window.scrollTo({ top: window.scrollY + r.top - fejM - 16, behavior: reduce ? "auto" : "smooth" });
    }
  }
  bTovabb.addEventListener("click", function () {
    if (!ellenoriz(lepes)) return;
    // Az összesítő lépés csak áttekintés: semmilyen adat nem megy el, a TPFoglalas.kuld() nincs meghívva demó módban.
    menj(lepes + 1, true);
  });
  bVissza.addEventListener("click", function () { menj(Math.max(1, lepes - 1), true); });
  bUjra.addEventListener("click", function () {
    alaphelyzet();
    menj(1, true);
  });
  // hibajelzés eltüntetése javításkor
  urlap.addEventListener("input", function (e) {
    var t = e.target;
    if (t.name === "telefon" || t.name === "email") { hiba("kontakt", false); $("#f-tel").removeAttribute("aria-invalid"); $("#f-email").removeAttribute("aria-invalid"); return; }
    var kulcs = t.name;
    var mezo = t.type === "radio" ? t.closest(".chipek, .valaszto") : t;
    if (kulcs) hiba(kulcs, false, mezo);
  });
  // Enter egy szövegmezőben: lépjen tovább, ne küldjön semmit
  urlap.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "radio") { e.preventDefault(); bTovabb.hidden || bTovabb.click(); }
  });
  urlap.addEventListener("submit", function (e) { e.preventDefault(); });

  // :has() nélküli böngészők: a kiválasztott / fókuszált opció osztályt kap
  var vanHas = !!(window.CSS && CSS.supports && CSS.supports("selector(:has(*))"));
  function opcioFrissit() {
    if (vanHas) return;
    $$('input[type="radio"]', urlap).forEach(function (r) { r.closest("label").classList.toggle("valasztva", r.checked); });
  }
  urlap.addEventListener("change", opcioFrissit);
  if (!vanHas) {
    urlap.addEventListener("focusin", function (e) { if (e.target.type === "radio") e.target.closest("label").classList.add("fokuszban"); });
    urlap.addEventListener("focusout", function (e) { if (e.target.type === "radio") e.target.closest("label").classList.remove("fokuszban"); });
  }

  // tiszta kezdőállapot: a böngésző se töltse vissza a korábban beírt adatokat
  function alaphelyzet() {
    urlap.reset();
    $$(".hiba", urlap).forEach(function (h) { h.hidden = true; });
    $$("[aria-invalid]", urlap).forEach(function (h) { h.removeAttribute("aria-invalid"); });
    $("[data-osszesito]", urlap).textContent = "";
    opcioFrissit();
  }
  alaphelyzet();
  menj(1, false);

  // vissza/előre gombbal visszatöltött oldal (bfcache): menü, nagyító bezárva, űrlap üres
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    if (!menu.hidden) menuAllit(false);
    if (dlg.open) dlg.close();
    document.body.classList.remove("zar");
    alaphelyzet();
    menj(1, false);
  });

  /* ---------- szolgáltatás előválasztása ---------- */
  $$("[data-szolg]").forEach(function (a) {
    a.addEventListener("click", function () {
      var r = $('input[name="szolgaltatas"][value="' + a.getAttribute("data-szolg") + '"]', urlap);
      if (!r) return;
      r.checked = true;
      opcioFrissit();
      hiba("szolgaltatas", false, $(".valaszto-szolg", urlap));
      if (lepes !== 1) menj(1, false);
      setTimeout(function () { r.focus({ preventScroll: true }); }, reduce ? 0 : 450);
    });
  });
})();
