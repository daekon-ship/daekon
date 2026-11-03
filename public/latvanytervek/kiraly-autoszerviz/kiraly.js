/* KIRÁLY Autószerviz – látványterv. Interakciók + Motion (motion.dev).
   Csökkentett mozgásnál minden azonnal a végállapotban látszik. */
(function () {
  "use strict";
  var M = window.Motion || null;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ease = [0.2, 0.7, 0.1, 1];
  /* SVG-elemeken a Motion értéket animál, a stílust mi írjuk (megbízható minden böngészőben) */
  function tween(from, to, opts, write) {
    write(from);
    return M.animate(from, to, Object.assign({}, opts, { onUpdate: write }));
  }

  /* ---------- logóváltozat (?logo=1..4) ---------- */
  var logo = root.getAttribute("data-logo") || "1";
  $$("[data-logo-kep]").forEach(function (img) {
    img.src = "arculat/logo-" + logo + "/kiraly-" + logo + "-" + img.getAttribute("data-logo-kep") + ".svg";
  });
  var fav = $('link[rel="icon"]');
  if (fav) fav.href = "arculat/logo-" + logo + "/kiraly-" + logo + "-jel.svg";
  if (logo === "4") {
    $$('[fill="#F26732"]').forEach(function (el) { el.setAttribute("fill", "#F2B705"); });
  }

  /* ---------- mobilmenü ---------- */
  var gomb = $(".menu-gomb"), menu = $("#mobilmenu");
  function menuAllit(nyit) {
    if (!menu) return;
    menu.hidden = !nyit;
    gomb.setAttribute("aria-expanded", String(nyit));
    gomb.setAttribute("aria-label", nyit ? "Menü bezárása" : "Menü megnyitása");
    gomb.innerHTML = '<svg aria-hidden="true"><use href="#' + (nyit ? "i-x" : "i-menu") + '"/></svg>';
    document.body.style.overflow = nyit ? "hidden" : "";
    if (nyit && M && !reduce) M.animate($$("a", menu), { opacity: [0, 1], y: [10, 0] }, { duration: 0.35, delay: M.stagger(0.03), ease: ease });
  }
  if (gomb) {
    gomb.addEventListener("click", function () { menuAllit(menu.hidden); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menuAllit(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { menuAllit(false); gomb.focus(); } });
    matchMedia("(min-width: 981px)").addEventListener("change", function (e) { if (e.matches) menuAllit(false); });
  }

  /* ---------- nyitvatartás most (budapesti idő szerint) ---------- */
  function budapestIdo() {
    var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Budapest", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    var napok = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { nap: napok[o.weekday], perc: (+o.hour % 24) * 60 + (+o.minute) };
  }
  function allapotFrissit() {
    var t = budapestIdo(), hetkoznap = t.nap >= 1 && t.nap <= 5;
    var nyitva = hetkoznap && ((t.perc >= 480 && t.perc < 720) || (t.perc >= 780 && t.perc < 1020));
    var szoveg;
    if (nyitva) szoveg = "Most nyitva · " + (t.perc < 720 ? "12:00-ig" : "17:00-ig");
    else if (hetkoznap && t.perc >= 720 && t.perc < 780) szoveg = "Ebédszünet · 13:00-kor nyit";
    else if (hetkoznap && t.perc < 480) szoveg = "Zárva · ma 8:00-kor nyit";
    else if (t.nap >= 1 && t.nap <= 4) szoveg = "Zárva · holnap 8:00-kor nyit";
    else szoveg = "Zárva · hétfőn 8:00-kor nyit";
    $$("[data-allapot]").forEach(function (el) {
      el.classList.toggle("nyitott", nyitva);
      el.querySelector("span").textContent = szoveg;
    });
    var ma = $('tr[data-nap="' + t.nap + '"]');
    $$("tr[data-nap]").forEach(function (tr) { tr.classList.toggle("ma", tr === ma); });
  }
  allapotFrissit();
  setInterval(allapotFrissit, 60000);

  /* ---------- szolgáltatás-lista (lenyíló sorok) ---------- */
  $$(".sor > button").forEach(function (b) {
    var sor = b.parentNode, r = $("#" + b.getAttribute("aria-controls"));
    b.addEventListener("click", function () {
      var nyit = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(nyit));
      if (nyit) sor.setAttribute("data-nyitva", ""); else sor.removeAttribute("data-nyitva");
      if (nyit) {
        r.hidden = false;
        var h = r.firstElementChild.offsetHeight;
        if (M && !reduce) M.animate(r, { height: [0, h + "px"] }, { duration: 0.42, ease: ease }).then(function () { r.style.height = "auto"; });
        else r.style.height = "auto";
      } else {
        var cur = r.offsetHeight;
        var kesz = function () { r.hidden = true; r.style.height = "0px"; };
        if (M && !reduce) M.animate(r, { height: [cur + "px", "0px"] }, { duration: 0.32, ease: ease }).then(kesz);
        else kesz();
      }
    });
  });

  /* ---------- hero: 3D mérés – a kerekek beállnak ---------- */
  var hb = $(".kerek-b"), hj = $(".kerek-j");
  var zold = "#4CC38A";
  function heroKesz(azonnal) {
    [[hb, -4], [hj, 3]].forEach(function (x) {
      x[0].removeAttribute("transform");
      if (azonnal || !M) { x[0].style.rotate = "0deg"; return; }
      tween(x[1], 0, { duration: 1.6, delay: 0.5, ease: ease }, function (v) { x[0].style.rotate = v + "deg"; });
    });
    var eb = $(".ertek-b"), ej = $(".ertek-j"), st = $(".statusz");
    var vege = function () {
      eb.textContent = "+0°03′"; ej.textContent = "+0°04′";
      eb.setAttribute("fill", zold); ej.setAttribute("fill", zold);
      st.textContent = "BEÁLLÍTVA · GYÁRI TARTOMÁNYBAN"; st.setAttribute("fill", zold);
    };
    if (azonnal || !M) { vege(); return; }
    // számláló: a perc értékek lefutnak 0 felé
    M.animate(0, 1, {
      duration: 1.6, delay: 0.5, ease: ease,
      onUpdate: function (v) {
        if (v < 0.42) { // Decrypted Text: a mért értékek „kódolva” pörögnek, majd beállnak
          var r = function () { return String(Math.floor(Math.random() * 60)).padStart(2, "0"); };
          eb.textContent = "±" + Math.floor(Math.random() * 3) + "°" + r() + "′";
          ej.textContent = "±" + Math.floor(Math.random() * 3) + "°" + r() + "′";
          return;
        }
        var b = Math.round(-42 + (45 * v)), j = Math.round(31 - (27 * v));
        eb.textContent = (b < 0 ? "−" : "+") + "0°" + String(Math.abs(b)).padStart(2, "0") + "′";
        ej.textContent = (j < 0 ? "−" : "+") + "0°" + String(Math.abs(j)).padStart(2, "0") + "′";
      }
    }).then(vege);
    var latas = $$(".latas path");
    tween(0.15, 0.7, { duration: 1.8, delay: 0.3 }, function (v) { latas.forEach(function (l) { l.style.opacity = v; }); });
  }
  if (hb && hj) heroKesz(reduce || !M);

  /* ---------- dízel: porlasztási kép ---------- */
  if (M && !reduce) {
    var permet = $$(".permet path");
    tween(0, -18, { duration: 0.9, repeat: Infinity, ease: "linear" }, function (v) { permet.forEach(function (l) { l.style.strokeDashoffset = v; }); });
  }

  /* ---------- futómű: előtte / utána ---------- */
  var ALL = {
    elotte: { b: -5, j: 4, korm: -9, kop: [0.95, 0.45, 0.15], e: { ob: ["−0°42′", "rossz"], oj: ["+0°31′", "rossz"], db: ["−1°36′", "rossz"], dj: ["−0°34′", ""] } },
    utana: { b: 0, j: 0, korm: 0, kop: [0.5, 0.5, 0.5], e: { ob: ["+0°04′", "jo"], oj: ["+0°05′", "jo"], db: ["−0°36′", "jo"], dj: ["−0°34′", "jo"] } }
  };
  var fkb = $(".fk-b"), fkj = $(".fk-j"), korm = $(".kormany");
  var aktualis = "elotte", felhasznaloKattintott = false;
  [fkb, fkj, korm].forEach(function (el, i) {
    if (!el) return;
    el.removeAttribute("transform");
    el.style.rotate = [-5, 4, -9][i] + "deg";
  });
  function futomu(nev, azonnal) {
    var a = ALL[nev], d = (azonnal || !M || reduce) ? 0 : 0.9;
    aktualis = nev;
    $$("[data-allapot-gomb]").forEach(function (g) { g.setAttribute("aria-pressed", String(g.getAttribute("data-allapot-gomb") === nev)); });
    var cel = [[fkb, a.b], [fkj, a.j], [korm, a.korm]];
    cel.forEach(function (x) {
      if (!x[0]) return;
      var tol = parseFloat(x[0].style.rotate) || 0;
      if (d) tween(tol, x[1], { duration: d, ease: ease }, function (v) { x[0].style.rotate = v + "deg"; });
      else x[0].style.rotate = x[1] + "deg";
    });
    [".k1", ".k2", ".k3"].forEach(function (k, i) {
      $$(".allito " + k).forEach(function (el) {
        var tol = parseFloat(el.getAttribute("opacity"));
        if (d) tween(tol, a.kop[i], { duration: d }, function (v) { el.setAttribute("opacity", v); });
        else el.setAttribute("opacity", a.kop[i]);
      });
    });
    Object.keys(a.e).forEach(function (k) {
      var el = $('[data-e="' + k + '"]');
      el.textContent = a.e[k][0];
      el.className = a.e[k][1];
      if (d) M.animate(el, { opacity: [0.3, 1] }, { duration: 0.4 });
    });
  }
  $$("[data-allapot-gomb]").forEach(function (g) {
    g.addEventListener("click", function () { felhasznaloKattintott = true; futomu(g.getAttribute("data-allapot-gomb")); });
  });
  if (M && !reduce && $(".allito")) {
    M.inView(".allito", function () {
      setTimeout(function () { if (!felhasznaloKattintott && aktualis === "elotte") futomu("utana"); }, 1100);
    }, { amount: 0.55 });
  }

  /* ---------- belépő animációk ---------- */
  if (M && !reduce && root.classList.contains("anim")) {
    M.inView("[data-be]", function (info) {
      var el = info && info.target ? info.target : info;
      M.animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: 0.7, ease: ease });
    }, { margin: "0px 0px -8% 0px" });
  }
})();


/* ===== 2. kör: React Bits-mintájú effektek – saját, könnyű megvalósítás, Motionnel ===== */
(function () {
  "use strict";
  var M = window.Motion || null;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ease = [0.2, 0.7, 0.1, 1];
  var accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#F26732";

  /* Spotlight Card / Magic Bento */
  $$(".k-elem, .miert, .nyitva, .allito, .egr, .ermek").forEach(function (el) {
    el.classList.add("spot");
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* Magnet – a fő gombok finoman a kurzor felé húzódnak */
  if (M && !reduce && fine) {
    $$(".hero-cta .btn, .kapcs-cta .btn, .fej .btn-fo").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22, dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        M.animate(el, { x: dx, y: dy }, { duration: 0.25, ease: "easeOut" });
      });
      el.addEventListener("pointerleave", function () {
        M.animate(el, { x: 0, y: 0 }, { type: "spring", stiffness: 300, damping: 14 });
      });
    });
  }

  /* Blur Text – a szekciócímek szavanként élesednek ki */
  var cimek = $$("main h2").filter(function (h) { return !h.closest(".hero"); });
  if (M && !reduce && document.documentElement.classList.contains("anim")) {
    cimek.forEach(function (h) {
      if (h.children.length) return;
      var szavak = h.textContent.trim().split(/\s+/);
      h.setAttribute("aria-label", h.textContent.trim());
      h.innerHTML = szavak.map(function (w) { return '<span class="szo" aria-hidden="true">' + w + "</span>"; }).join(" ");
      $$(".szo", h).forEach(function (s) { s.style.opacity = 0; s.style.filter = "blur(10px)"; });
    });
    M.inView("main h2", function (info) {
      var h = info && info.target ? info.target : info;
      var sz = $$(".szo", h);
      if (!sz.length) return;
      M.animate(sz, { opacity: [0, 1], filter: ["blur(10px)", "blur(0px)"], y: [8, 0] }, { duration: 0.7, delay: M.stagger(0.07), ease: ease });
    }, { amount: 0.6 });
  }

  /* Count Up – értékelés */
  $$("[data-szamlalo]").forEach(function (el) {
    var cel = parseFloat(el.getAttribute("data-szamlalo")), tized = +(el.getAttribute("data-tized") || 0);
    var ir = function (v) { el.textContent = v.toFixed(tized).replace(".", ","); };
    if (!M || reduce) return;
    ir(0);
    M.inView(el, function () {
      M.animate(0, cel, { duration: 1.4, ease: ease, onUpdate: ir });
    }, { amount: 0.8 });
  });

  /* Scroll Velocity – végtelen szolgáltatássáv, a görgetés gyorsítja */
  var sav = document.querySelector(".futosav-belso");
  if (sav) {
    sav.innerHTML += sav.innerHTML;
    if (!reduce) {
      var x = 0, utolso = scrollY, seb = 0, fel = 0, ido = performance.now();
      var lathato = true;
      new IntersectionObserver(function (e) { lathato = e[0].isIntersecting; }).observe(sav);
      (function lep(t) {
        var dt = Math.min(0.05, (t - ido) / 1000); ido = t;
        var d = scrollY - utolso; utolso = scrollY;
        seb += (d * 0.9 - seb) * 0.08;
        fel = sav.scrollWidth / 2;
        if (lathato && fel) {
          x -= (38 + Math.abs(seb) * 6) * dt * (seb < -0.5 ? -1 : 1);
          if (x <= -fel) x += fel;
          if (x > 0) x -= fel;
          sav.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
        }
        requestAnimationFrame(lep);
      })(performance.now());
    }
  }

  /* Dot Grid + Grid Scan – pontrács a heróban: a kurzor és egy lassú pásztázó fény világítja meg */
  var cv = document.querySelector(".pontracs");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, mx = -999, my = -999, fut = true;
    var hex = accent.replace("#", ""), ar = parseInt(hex.slice(0, 2), 16), ag = parseInt(hex.slice(2, 4), 16), ab = parseInt(hex.slice(4, 6), 16);
    var meret = function () {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var rajzol = function (t) {
      ctx.clearRect(0, 0, W, H);
      var g = W < 700 ? 24 : 30, scan = ((t / 7000) % 1.2) * H * 1.1 - H * 0.05;
      for (var y = g / 2; y < H; y += g) {
        for (var x = g / 2; x < W; x += g) {
          var dm = Math.hypot(x - mx, y - my), kurzor = Math.max(0, 1 - dm / 150);
          var ds = Math.abs(y - scan), sv = reduce ? 0 : Math.max(0, 1 - ds / 60) * 0.5;
          var fade = Math.min(1, x / (W * 0.45));
          var a = (0.09 + sv * 0.35) * fade + kurzor * 0.65;
          var r = 1 + kurzor * 1.4;
          if (kurzor > 0.02) ctx.fillStyle = "rgba(" + ar + "," + ag + "," + ab + "," + a.toFixed(3) + ")";
          else ctx.fillStyle = "rgba(244,245,246," + a.toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
        }
      }
    };
    meret();
    addEventListener("resize", meret);
    var hero = cv.parentNode;
    if (fine) {
      hero.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      hero.addEventListener("pointerleave", function () { mx = my = -999; });
    }
    new IntersectionObserver(function (e) { fut = e[0].isIntersecting; }).observe(hero);
    if (reduce) { rajzol(0); }
    else (function loop(t) { if (fut && !document.hidden) rajzol(t); requestAnimationFrame(loop); })(0);
  }
})();
