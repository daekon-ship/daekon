/* ============================================================
   DIESEL MOTOR JAVÍTÁS — interactions
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* logóváltozat: ?logo=1|2|3 (alapértelmezés: 1) */
  var lq = (location.search.match(/[?&]logo=([123])/) || [])[1];
  if (lq) document.querySelectorAll("[data-logo-use]").forEach(function (u) { u.setAttribute("href", "#dmj-mark-" + lq); });

  /* year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());


  /* ============ MUNKÁINK — galéria ============
     Ügyfél saját fotói: assets/img/munkak/  (nagy kép + _t bélyegkép).
     Új kép felvétele: egy sor ide, a sorrend = megjelenési sorrend.
     { f: "fájlnév alap kiterjesztés nélkül", c: "felirat", w: "wide" | "tall" | "" } */
  var GALLERY = [];

  var galSec = document.getElementById("munkaink");
  var galEl = document.getElementById("gallery");
  if (galSec && galEl && GALLERY.length) {
    galSec.hidden = false;
    document.querySelectorAll("[data-gal-link]").forEach(function (a) { a.hidden = false; });
    GALLERY.forEach(function (g, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "gal-it" + (g.w ? " gal-" + g.w : "");
      b.setAttribute("aria-label", "Kép nagyítása: " + (g.c || "munka " + (i + 1)));
      b.innerHTML = '<img src="assets/img/munkak/' + g.f + '_t.jpg" alt="' + (g.c || "") +
        '" loading="lazy" decoding="async"><span class="gal-cap mono">' + String(i + 1).padStart(2, "0") +
        (g.c ? " · " + g.c : "") + "</span>";
      b.addEventListener("click", function () { openLb(i); });
      galEl.appendChild(b);
    });

    var lb = document.getElementById("lightbox");
    var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
    var cur = 0, lastFocus = null;
    function show(i) {
      cur = (i + GALLERY.length) % GALLERY.length;
      var g = GALLERY[cur];
      lbImg.src = "assets/img/munkak/" + g.f + ".jpg";
      lbImg.alt = g.c || "";
      lbCap.textContent = String(cur + 1).padStart(2, "0") + " / " + String(GALLERY.length).padStart(2, "0") + (g.c ? " · " + g.c : "");
    }
    function openLb(i) {
      lastFocus = document.activeElement;
      show(i); lb.hidden = false; document.body.classList.add("lb-open");
      lb.querySelector(".lb-x").focus();
    }
    function closeLb() {
      lb.hidden = true; document.body.classList.remove("lb-open");
      if (lastFocus) lastFocus.focus();
    }
    lb.querySelector(".lb-x").addEventListener("click", closeLb);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(cur - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") show(cur - 1);
      else if (e.key === "ArrowRight") show(cur + 1);
    });
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    });
  }

  /* header solid on scroll */
  var head = document.querySelector(".site-head");
  function onScrollHead() {
    if (head) head.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScrollHead, { passive: true });
  onScrollHead();

  /* reveal on view */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* counters */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      cio.unobserve(el);
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (reduced || target > 3000) { el.textContent = String(target); return; }
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * p));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });

  /* machine list rotator + hover image */
  var mList = document.getElementById("machineList");
  if (mList) {
    var mImg = mList.querySelector("[data-ml-img]");
    var items = mList.querySelectorAll("li[data-img]");
    var rot = null, idx = 0;

    function activate(i) {
      idx = i;
      items.forEach(function (li, k) { li.classList.toggle("is-active", k === i); });
      var src = items[i].getAttribute("data-img");
      if (mImg && mImg.getAttribute("src") !== src) {
        mImg.style.opacity = "0";
        var pre = new Image();
        pre.onload = function () { mImg.src = src; mImg.style.opacity = "0.34"; };
        pre.src = src;
      }
    }
    items.forEach(function (li, k) {
      li.addEventListener("mouseenter", function () { stopRot(); activate(k); });
    });
    function startRot() { if (!reduced) rot = setInterval(function () { activate((idx + 1) % items.length); }, 2400); }
    function stopRot() { if (rot) { clearInterval(rot); rot = null; } }
    startRot();
  }

  /* Hungary map: grid, cities, routes */
  var mapPanel = document.querySelector(".map-panel");
  if (mapPanel) {
    var NS = "http://www.w3.org/2000/svg";
    var grid = mapPanel.querySelector(".map-grid");
    var routes = document.getElementById("huRoutes");
    var dots = document.getElementById("huDots");

    var cities = [
      ["Budapest", 358.5, 195.1, 1], ["Debrecen", 616.3, 190.2, 0], ["Nyíregyháza", 625.2, 128, 0],
      ["Szeged", 468.2, 377.6, 0], ["Pécs", 278, 404.1, 0], ["Győr", 220.1, 167.3, 0],
      ["Miskolc", 531.7, 106.3, 0], ["Székesfehérvár", 297, 240.8, 0], ["Kecskemét", 423.2, 283.3, 0],
      ["Szombathely", 117.6, 234.3, 0], ["Szolnok", 473.6, 242.5, 0], ["Kaposvár", 234.2, 361, 0],
      ["Veszprém", 246.1, 254.4, 0], ["Békéscsaba", 562.5, 315.9, 0], ["Zalaegerszeg", 140, 290.8, 0],
      ["Sopron", 113.9, 168.1, 0], ["Eger", 491.7, 135.8, 0], ["Nagykanizsa", 154.7, 348.4, 0],
      ["Salgótarján", 433.6, 106.1, 0], ["Szekszárd", 325.1, 363.4, 0]
    ];

    for (var gx = 0; gx <= 800; gx += 100) {
      var vl = document.createElementNS(NS, "line");
      vl.setAttribute("x1", gx); vl.setAttribute("y1", 0); vl.setAttribute("x2", gx); vl.setAttribute("y2", 480);
      grid.appendChild(vl);
    }
    for (var gy = 0; gy <= 480; gy += 96) {
      var hl = document.createElementNS(NS, "line");
      hl.setAttribute("x1", 0); hl.setAttribute("y1", gy); hl.setAttribute("x2", 800); hl.setAttribute("y2", gy);
      grid.appendChild(hl);
    }

    var hub = cities[0];
    cities.slice(1).forEach(function (c) {
      var mx = (hub[1] + c[1]) / 2 + (c[2] - hub[2]) * 0.06;
      var my = (hub[2] + c[2]) / 2 + (hub[1] - c[1]) * 0.06;
      var d = "M" + hub[1] + " " + hub[2] + " Q " + mx.toFixed(1) + " " + my.toFixed(1) + " " + c[1] + " " + c[2];
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      routes.appendChild(p);
    });

    cities.forEach(function (c) {
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", c[1]); dot.setAttribute("cy", c[2]);
      dot.setAttribute("r", c[3] ? 5 : 3);
      if (c[3]) dot.classList.add("hub");
      dots.appendChild(dot);
      if (c[3]) {
        var pulse = document.createElementNS(NS, "circle");
        pulse.setAttribute("cx", c[1]); pulse.setAttribute("cy", c[2]);
        pulse.setAttribute("r", 3); pulse.classList.add("pulse");
        dots.appendChild(pulse);
      }
      var t = document.createElementNS(NS, "text");
      t.setAttribute("x", c[1] + 8); t.setAttribute("y", c[2] + 4);
      t.setAttribute("class", "g-label" + (c[3] ? "" : " lbl-minor"));
      t.setAttribute("font-size", c[3] ? "13" : "10");
      t.setAttribute("fill", c[3] ? "#ECE9E1" : "#8B949B");
      t.textContent = c[0];
      dots.appendChild(t);
    });

    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { mapPanel.classList.add("is-drawn"); mio.disconnect(); }
      });
    }, { threshold: 0.35 });
    mio.observe(mapPanel);
  }

  /* hero + CTA parallax */
  if (!reduced) {
    var heroImg = document.querySelector(".hero-img");
    var ctaImg = document.querySelector(".contact-bg img");
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (heroImg && y < window.innerHeight * 1.2) {
          heroImg.style.transform = "translateY(" + y * 0.18 + "px) scale(" + (1 + y * 0.00012) + ")";
        }
        if (ctaImg) {
          var r = ctaImg.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
            ctaImg.style.transform = "translateY(" + (p - 0.5) * 60 + "px) scale(1.12)";
          }
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* fault form — demo handler (no backend yet) */
  var form = document.getElementById("faultForm");
  var status = document.getElementById("ffStatus");
  if (form && status) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var tel = form.telefon.value.trim();
      if (!form.nev.value.trim() || tel.length < 7 || !form.gep.value.trim() || !form.telepules.value.trim() || !form.leiras.value.trim()) {
        status.textContent = "KÉRJÜK, TÖLTSE KI A KÖTELEZŐ MEZŐKET (NÉV, TELEFON, GÉP, TELEPÜLÉS, LEÍRÁS).";
        status.classList.add("err");
        return;
      }
      status.classList.remove("err");
      var summary = "Hibabejelentés — " + form.nev.value.trim() + " · " + tel +
        " · Gép: " + form.gep.value.trim() +
        (form.motor.value.trim() ? " · Motor: " + form.motor.value.trim() : "") +
        " · " + form.telepules.value.trim() +
        " · " + form.leiras.value.trim() +
        (form.callback.checked ? " · VISSZAHÍVÁST KÉR" : "");
      location.href = "mailto:szatmari1974@gmail.com?subject=" +
        encodeURIComponent("Hibabejelentés — " + form.gep.value.trim()) +
        "&body=" + encodeURIComponent(summary);
      status.textContent = "A GOMB ELINDÍTJA AZ E-MAIL PROGRAMOT. GYORSEBB ÚT: TELEFON, +36 70 367 7072.";
    });
  }
})();
