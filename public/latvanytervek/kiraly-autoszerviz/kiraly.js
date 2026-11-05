/* KIRÁLY Autószerviz – interakciók + Motion (motion.dev).
   Csökkentett mozgásnál minden azonnal a végállapotban látszik. */
(function () {
  "use strict";
  var M = window.Motion || null;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ease = [0.2, 0.7, 0.1, 1];

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

  /* ---------- prémium mozgásréteg ---------- */
  var fej = $(".fej");
  function fejAllit() { if (fej) fej.classList.toggle("gorgetve", window.scrollY > 24); }
  fejAllit(); addEventListener("scroll", fejAllit, { passive: true });

  /* ha az animáció bármi miatt nem tud elindulni, minden tartalom azonnal, animáció nélkül látszik */
  function mindentMutat() {
    root.classList.remove("anim");
    $$("[data-be], .hero .eyebrow, .hero .lead, .hero-cta, .hero-info, h1 .m-sor > *").forEach(function (el) {
      el.style.opacity = ""; el.style.transform = "";
    });
  }
  if (M && !reduce && root.classList.contains("anim")) try {
    // görgetésjelző: vékony arany vonal a fejléc alján
    var hal = $(".halado");
    if (hal && M.scroll) M.scroll(M.animate(hal, { scaleX: [0, 1] }, { ease: "linear" }));

    // hero: a címsorok alulról „kicsúsznak”, utána a többi elem
    M.animate("h1 .m-sor > *", { y: ["105%", "0%"] }, { duration: 0.95, delay: M.stagger(0.12, { startDelay: 0.12 }), ease: ease });
    M.animate(".hero .eyebrow", { opacity: [0, 1], y: [8, 0] }, { duration: 0.7, ease: ease });
    M.animate($$(".hero .lead, .hero-cta, .hero-info"), { opacity: [0, 1], y: [14, 0] }, { duration: 0.8, delay: M.stagger(0.1, { startDelay: 0.45 }), ease: ease });

    // belépők: ami egyszerre ér a képernyőre, az lépcsőzetesen jön
    var sor = 0, sorReset = null;
    M.inView("[data-be]", function (info) {
      var el = info && info.target ? info.target : info;
      var d = sor++ * 0.08;
      if (!sorReset) sorReset = requestAnimationFrame(function () { sor = 0; sorReset = null; });
      M.animate(el, { opacity: [0, 1], y: [22, 0] }, { duration: 0.85, delay: d, ease: ease });
      setTimeout(function () { el.classList.add("be-kesz"); }, d * 1000);
    }, { margin: "0px 0px -10% 0px" });
    root.classList.add("anim-ok"); // csak sikeres indulás után – a fejben lévő biztosíték különben 2,5 mp után mindent megmutat
  } catch (e) { mindentMutat(); }
})();
