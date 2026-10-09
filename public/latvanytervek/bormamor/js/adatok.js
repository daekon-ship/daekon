/* Bormámor — tartalmi adatok.
 * Itt frissíthető minden, ami változik: események, galéria, borstílusok.
 * Csak ellenőrzött adat kerülhet ide: nincs kitalált bor, ár, évjárat vagy időpont.
 */
window.BORMAMOR = {

  /* ESEMÉNYEK
   * Egy esemény mezői:
   *   id:        egyedi azonosító (pl. "2026-11-borkostolo")
   *   cim:       az esemény neve
   *   datum:     "ÉÉÉÉ-HH-NN"
   *   ido:       "18:00" (nem kötelező)
   *   helyszin:  pl. "Bormámor, Monor, Kiss Ernő utca 9."
   *   leiras:    1–3 mondat
   *   kep:       "img/…webp" (nem kötelező; csak saját, engedélyezett fotó)
   *   reszletek: link (pl. a Facebook-esemény), nem kötelező
   *   jelentkezes: true → megjelenik a jelentkezés gomb
   *   lezart:    true → a jelentkezés lezárult
   * A mai napnál korábbi dátumú események automatikusan az archívumba kerülnek.
   */
  esemenyek: [],

  /* BORSTÍLUSOK — a „monori borok világa” szekció */
  borok: [
    { id: "feher",  nev: "Fehérborok", kep: "img/pohar-feher.webp",
      alt: "Pohár aranyló fehérbor egy hordó tetején",
      leiras: "Friss, ropogós tételek és testesebb, érlelt fehérek — vacsorához, nyári estékhez, ajándékba.",
      illik: "Halhoz, szárnyashoz, könnyű vacsorához" },
    { id: "rose",   nev: "Rosék", kep: "img/pohar-rose.webp",
      alt: "Pohár rozé egy hordó tetején",
      leiras: "Gyümölcsös, könnyed rosék teraszra, grillhez és hosszú beszélgetésekhez.",
      illik: "Grillhez, salátához, baráti estéhez" },
    { id: "siller", nev: "Sillerek", kep: "img/pohar-siller.webp",
      alt: "Pohár mélyrubin siller egy hordó tetején",
      leiras: "A rosé és a vörös között: élénk, mély színű, mégis könnyed borok — a siller régi magyar hagyomány.",
      illik: "Sültekhez, sajtokhoz, nyári vacsorához" },
    { id: "voros",  nev: "Vörösborok", kep: "img/pohar-voros.webp",
      alt: "Pohár sötét vörösbor egy hordó tetején",
      leiras: "Könnyed, gyümölcsös vörösöktől a testes, érlelt tételekig — hosszú estékre és ünnepi asztalra.",
      illik: "Vadhoz, marhához, ünnepi asztalhoz" },
    { id: "pezsgo", nev: "Pezsgők", kep: null,
      alt: "",
      leiras: "Magyar pezsgők koccintáshoz, meglepetéshez, kis és nagy ünnepekhez.",
      illik: "Koccintáshoz, ajándékba, ünnepre" }
  ],

  /* GALÉRIA — csak a Bormámor saját / arculati képei */
  galeria: [
    { kep: "img/dugohuzo.webp",          kicsi: "img/dugohuzo-m.webp",          w: 1400, h: 582, alt: "Dugóhúzó és két dugó, rajtuk a Bormámor kulcslyuk-jele", forma: "szeles" },
    { kep: "img/kulcslyuk-dugok.webp",   kicsi: "img/kulcslyuk-dugok-m.webp",   w: 900,  h: 900, alt: "A kulcslyuk-embléma borosdugókból kirakva", forma: "negyzet" },
    { kep: "img/poharak.webp",           kicsi: "img/poharak-m.webp",           w: 1240, h: 470, alt: "Négy kóstolópohár egy hordó tetején", forma: "szeles" },
    { kep: "img/dugok-bal.webp",         kicsi: "img/dugok-bal.webp",           w: 600,  h: 720, alt: "Használt borosdugók közelről", forma: "allo" },
    { kep: "img/palackok-felulrol.webp", kicsi: "img/palackok-felulrol.webp",   w: 540,  h: 404, alt: "Borosüvegek felülről, köztük a kulcslyuk-embléma", forma: "fekvo" },
    { kep: "img/palack-kez-allo.webp",   kicsi: "img/palack-kez-allo.webp",     w: 760,  h: 400, alt: "Bormámor-címkés palack egy kéz mellett", forma: "fekvo" }
  ]
};
