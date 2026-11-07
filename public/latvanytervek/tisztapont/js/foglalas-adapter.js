/* TisztaPont – időpontigény-adapter.
   A felület (tisztapont.js) KIZÁRÓLAG ezen az objektumon keresztül küldhetne adatot.
   Bemutató módban („demo”) semmilyen hálózati kérés nem indul, és semmi nem tárolódik.

   Éles bekötéshez (később, az ügyféllel egyeztetett rendszerrel):
     1. _forras/adatok.json → foglalas.mod: "eles", majd python3 _forras/epites.py
     2. az alábbi kuld() függvényben a megfelelő végpont meghívása
        (saját űrlapkezelő, e-mail-szolgáltatás vagy foglalási rendszer API),
        adatkezelési tájékoztatóval és hozzájárulással együtt.
*/
(function () {
  "use strict";
  var mod = (window.TP_ADATOK && window.TP_ADATOK.foglalasMod) || "demo";

  window.TPFoglalas = {
    mod: mod,
    /** @param {Object} igeny – {szolgaltatas, telepules, alapterulet, datum, napszak, nev, telefon, email, megjegyzes} */
    kuld: function (igeny) {
      if (mod !== "eles") {
        return Promise.resolve({ ok: false, demo: true });
      }
      // ÉLES ÁG – szándékosan nincs kitöltve.
      return Promise.reject(new Error("Az éles küldés még nincs bekötve."));
    }
  };
})();
