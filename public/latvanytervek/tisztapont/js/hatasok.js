/* TisztaPont – interakciós réteg (Motion / motion.dev).
   A React Bits (reactbits.dev) komponensek mintájára, React és build nélkül, natív JS + Motion:
     BlurText / SplitText  → címek szavanként, elmosásból élesedve
     Magnet                → elsődleges gombok finoman a mutató felé húzódnak
     GlareHover            → fényvillanás a kék gombokon (CSS)
     SpotlightCard         → a mutatót követő halvány fényfolt sorokon, kártyákon
     TiltedCard            → galériaképek enyhe 3D-dőlése
     DotGrid               → a „Pont” motívum: a nyitó pontrácsa reagál a mutatóra / érintésre
     ScrollVelocity        → a referenciaszalag görgetéskor felgyorsul, majd visszalassul
     AnimatedContent       → galériaképek feltárulása
     ScrollProgress        → olvasási sáv a fejléc alján; a folyamatvonal görgetésre töltődik
   Szabályok: csökkentett mozgásnál semmi; hover-effektek csak egérrel (finom mutató);
   minden tartalom látható marad akkor is, ha valami hibára fut. */
(function () {
  "use strict";
  var M = window.Motion;
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!M || reduce || !root.classList.contains("anim")) return;
  var finom = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var ease = [0.2, 0.7, 0.1, 1];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function biztos(fn) { try { fn(); } catch (e) { /* egy effekt hibája ne vigye el a többit */ } }

  /* ---------- BlurText: címek szavanként ---------- */
  function feloszt(el) {
    var szavak = [];
    (function bejar(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (k) {
        if (k.nodeType === 3) {
          var reszek = k.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          reszek.forEach(function (r) {
            if (!r) return;
            if (/^\s+$/.test(r)) { frag.appendChild(document.createTextNode(r)); return; }
            var s = document.createElement("span");
            s.className = "szo";
            s.textContent = r;
            frag.appendChild(s);
            szavak.push(s);
          });
          n.replaceChild(frag, k);
        } else if (k.nodeType === 1 && k.tagName !== "BR") bejar(k);
      });
    })(el);
    return szavak;
  }
  function szoAnim(szavak, kesl) {
    return M.animate(szavak, { opacity: [0, 1], filter: ["blur(10px)", "blur(0px)"], y: [12, 0] },
      { duration: 0.7, delay: M.stagger(0.06, { startDelay: kesl || 0 }), ease: ease });
  }
  biztos(function () {
    $$(".hero h1, .szekcio h2, .wolt h2, .kapcsolat h2").forEach(function (h) {
      var hero = !!h.closest(".hero");
      h.removeAttribute("data-rv");        // a mozgást itt kezeljük, nem az általános felúszás
      h.style.opacity = "1";
      var szavak = feloszt(h);
      szavak.forEach(function (s) { s.style.opacity = "0"; });
      var futtat = function () { szoAnim(szavak, hero ? 0.05 : 0); };
      if (hero) futtat(); else M.inView(h, function () { futtat(); }, { amount: 0.4 });
      setTimeout(function () {             // biztonsági háló
        if (h.getBoundingClientRect().top < innerHeight) szavak.forEach(function (s) { if (getComputedStyle(s).opacity === "0") { s.style.opacity = "1"; s.style.filter = "none"; } });
      }, 4000);
    });
  });

  /* ---------- ScrollProgress ---------- */
  biztos(function () {
    var fej = $("#fej");
    var sav = document.createElement("span");
    sav.className = "olvasas-sav";
    sav.setAttribute("aria-hidden", "true");
    fej.appendChild(sav);
    M.scroll(M.animate(sav, { scaleX: [0, 1] }, { ease: "linear" }));
  });

  /* ---------- Folyamatvonal: görgetésre töltődik ---------- */
  biztos(function () {
    var l = $(".lepesek");
    if (!l) return;
    var t = document.createElement("span");
    t.className = "lepes-toltes";
    t.setAttribute("aria-hidden", "true");
    l.appendChild(t);
    var mobil = matchMedia("(max-width: 560px)").matches;
    M.scroll(M.animate(t, mobil ? { scaleY: [0, 1] } : { scaleX: [0, 1] }, { ease: "linear" }),
      { target: l, offset: ["start 85%", "end 60%"] });
  });

  /* ---------- AnimatedContent: galériaképek feltárulása ---------- */
  biztos(function () {
    $$(".gal-kep").forEach(function (k) {
      var r = k.getBoundingClientRect();
      if (r.top < innerHeight) return;     // ami már látszik, azt nem rejtjük el
      k.style.clipPath = "inset(14% 0 0 0 round 14px)";
      k.style.opacity = "0";
      M.inView(k, function () {
        M.animate(k, { clipPath: ["inset(14% 0 0 0 round 14px)", "inset(0% 0 0 0 round 14px)"], opacity: [0, 1] }, { duration: 0.8, ease: ease })
          .then(function () { k.style.clipPath = ""; });
      }, { amount: 0.15 });
      setTimeout(function () { if (k.getBoundingClientRect().top < innerHeight && k.style.opacity === "0") { k.style.opacity = "1"; k.style.clipPath = ""; } }, 5000);
    });
  });

  /* ---------- ScrollVelocity: a szalag görgetésre gyorsul ---------- */
  biztos(function () {
    var savok = $$(".szalag-sav");
    if (!savok.length || !savok[0].getAnimations) return;
    var cel = 1, aktualis = 1, utolsoY = scrollY, utolsoT = performance.now(), fut = false;
    function lep() {
      aktualis += (cel - aktualis) * 0.08;
      cel += (1 - cel) * 0.05;
      savok.forEach(function (s) { s.getAnimations().forEach(function (a) { a.playbackRate = aktualis; }); });
      if (Math.abs(aktualis - 1) > 0.01 || Math.abs(cel - 1) > 0.01) requestAnimationFrame(lep); else fut = false;
    }
    addEventListener("scroll", function () {
      var most = performance.now(), dt = Math.max(16, most - utolsoT);
      var v = Math.abs(scrollY - utolsoY) / dt * 1000;   // px/mp
      utolsoY = scrollY; utolsoT = most;
      cel = Math.min(4, 1 + v / 900);
      if (!fut) { fut = true; requestAnimationFrame(lep); }
    }, { passive: true });
  });

  /* ---------- DotGrid: a nyitó pontrácsa ---------- */
  biztos(function () {
    var hero = $(".hero");
    if (!hero || !window.HTMLCanvasElement) return;
    var cv = document.createElement("canvas");
    cv.className = "pontracs";
    cv.setAttribute("aria-hidden", "true");
    hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext("2d");
    var dpr = Math.min(2, devicePixelRatio || 1);
    var LEP = 26, SUGAR = 1.4, HATOS = 150, TOLAS = 11;
    var pontok = [], W = 0, H = 0, mx = -9999, my = -9999, hullam = null, lathato = true, fut = false;
    var alap = [214, 228, 244], aktiv = [96, 168, 236];
    function meret() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pontok = [];
      for (var y = LEP / 2; y < H; y += LEP) for (var x = LEP / 2; x < W; x += LEP) pontok.push({ x: x, y: y, dx: 0, dy: 0 });
      rajzol();
    }
    function rajzol() {
      ctx.clearRect(0, 0, W, H);
      var mozog = false, most = performance.now();
      for (var i = 0; i < pontok.length; i++) {
        var p = pontok[i], tx = 0, ty = 0, k = 0;
        var ddx = p.x - mx, ddy = p.y - my, d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < HATOS) { k = 1 - d / HATOS; var e = k * k * TOLAS; tx = ddx / (d || 1) * e; ty = ddy / (d || 1) * e; }
        if (hullam) {                                    // érintés: táguló „lökéshullám”
          var hr = (most - hullam.t) / 1000 * 420, hx = p.x - hullam.x, hy = p.y - hullam.y, hd = Math.sqrt(hx * hx + hy * hy);
          var sav = 1 - Math.min(1, Math.abs(hd - hr) / 40);
          if (sav > 0) { var he = sav * 10 * Math.max(0, 1 - hr / 520); tx += hx / (hd || 1) * he; ty += hy / (hd || 1) * he; k = Math.max(k, sav * 0.8); }
        }
        p.dx += (tx - p.dx) * 0.18; p.dy += (ty - p.dy) * 0.18;
        if (Math.abs(p.dx) > 0.05 || Math.abs(p.dy) > 0.05 || k > 0) mozog = true;
        var c0 = Math.round(alap[0] + (aktiv[0] - alap[0]) * k), c1 = Math.round(alap[1] + (aktiv[1] - alap[1]) * k), c2 = Math.round(alap[2] + (aktiv[2] - alap[2]) * k);
        ctx.fillStyle = "rgb(" + c0 + "," + c1 + "," + c2 + ")";
        ctx.beginPath(); ctx.arc(p.x + p.dx, p.y + p.dy, SUGAR + k * 0.9, 0, 6.2832); ctx.fill();
      }
      if (hullam && most - hullam.t > 1400) hullam = null;
      return mozog || !!hullam;
    }
    function ciklus() { if (lathato && rajzol()) requestAnimationFrame(ciklus); else fut = false; }
    function indit() { if (!fut) { fut = true; requestAnimationFrame(ciklus); } }
    meret();
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(meret, 150); }, { passive: true });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (b) { lathato = b[0].isIntersecting; if (lathato) indit(); }).observe(hero);
    if (finom) {
      hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; indit(); }, { passive: true });
      hero.addEventListener("pointerleave", function () { mx = my = -9999; indit(); });
    }
    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button")) return;
      var r = hero.getBoundingClientRect(); hullam = { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; indit();
    }, { passive: true });
    // betöltéskor egyszeri hullám a nyitófotó pontjából – a márka mozdulata
    setTimeout(function () {
      var f = $(".hero-foto"), r = hero.getBoundingClientRect(), fr = f ? f.getBoundingClientRect() : null;
      hullam = { x: fr ? fr.left - r.left : W * 0.6, y: fr ? fr.top - r.top + fr.height * 0.78 : H * 0.6, t: performance.now() }; indit();
    }, 350);
  });

  if (!finom) return;   // az alábbiak csak egérrel használt eszközön

  /* ---------- Magnet ---------- */
  biztos(function () {
    $$(".gomb-fo, .gomb-masod.gomb-nagy").forEach(function (g) {
      g.addEventListener("pointermove", function (e) {
        var r = g.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        M.animate(g, { x: x * 6, y: y * 4 }, { type: "spring", stiffness: 300, damping: 20 });
      });
      g.addEventListener("pointerleave", function () { M.animate(g, { x: 0, y: 0 }, { type: "spring", stiffness: 260, damping: 18 }); });
    });
  });

  /* ---------- SpotlightCard ---------- */
  biztos(function () {
    $$(".szolg-sor, .ut, .wolt-kinalat, .foglalo, .kapcs-sor").forEach(function (el) {
      el.classList.add("spot");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  });

  /* ---------- TiltedCard: galéria ---------- */
  biztos(function () {
    $$(".gal-gomb").forEach(function (g) {
      var k = $(".gal-kep", g);
      g.addEventListener("pointermove", function (e) {
        var r = g.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        M.animate(k, { rotateY: px * 7, rotateX: -py * 7, scale: 1.015 }, { type: "spring", stiffness: 220, damping: 22 });
      });
      g.addEventListener("pointerleave", function () { M.animate(k, { rotateY: 0, rotateX: 0, scale: 1 }, { type: "spring", stiffness: 200, damping: 20 }); });
    });
  });
})();
