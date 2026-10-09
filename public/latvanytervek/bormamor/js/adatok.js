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

  /* BORSTÍLUSOK — a „monori borok világa” szekció.
   * x, y: a pohár közepe a poharak.webp képen (0–1). A pezsgőnek nincs saját fotója: x = null. */
  borok: [
    { id: "feher",  nev: "Fehérborok", rovid: "Fehér", x: .177, y: .56,
      alt: "Pohár aranyló fehérbor egy hordó tetején",
      leiras: "Friss, ropogós tételek és testesebb, érlelt fehérek — vacsorához, nyári estékhez, ajándékba.",
      illik: "Halhoz, szárnyashoz, könnyű vacsorához" },
    { id: "rose",   nev: "Rosék", rovid: "Rosé", x: .391, y: .56,
      alt: "Pohár rozé egy hordó tetején",
      leiras: "Gyümölcsös, könnyed rosék teraszra, grillhez és hosszú beszélgetésekhez.",
      illik: "Grillhez, salátához, baráti estéhez" },
    { id: "siller", nev: "Sillerek", rovid: "Siller", x: .613, y: .56,
      alt: "Pohár mélyrubin siller egy hordó tetején",
      leiras: "A rosé és a vörös között: élénk, mély színű, mégis könnyed borok — a siller régi magyar hagyomány.",
      illik: "Sültekhez, sajtokhoz, nyári vacsorához" },
    { id: "voros",  nev: "Vörösborok", rovid: "Vörös", x: .835, y: .56,
      alt: "Pohár sötét vörösbor egy hordó tetején",
      leiras: "Könnyed, gyümölcsös vörösöktől a testes, érlelt tételekig — hosszú estékre és ünnepi asztalra.",
      illik: "Vadhoz, marhához, ünnepi asztalhoz" },
    { id: "pezsgo", nev: "Pezsgők", rovid: "Pezsgő", x: null, y: null,
      alt: "",
      leiras: "Magyar pezsgők koccintáshoz, meglepetéshez, kis és nagy ünnepekhez.",
      illik: "Koccintáshoz, ajándékba, ünnepre" }
  ]

};
