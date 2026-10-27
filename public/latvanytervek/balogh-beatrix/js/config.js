/* ==========================================================================
   Beatrix Nails & Pedikűr (Balogh Beatrix) — KÖZPONTI KONFIGURÁCIÓ
   --------------------------------------------------------------------------
   Minden üzleti adat innen jön: név, telefon, helyszín, árlista, munkaidő.
   Az oldalak ezt olvassák — itt elég átírni, a HTML-hez nem kell nyúlni.

   ÁLLAPOT (2026.10.27.):
   - Márkanév és logó: Beatrix saját logójáról („BEATRIX — Nails & Pedikűr").
   - Árlista: Beatrix saját árlista-képeiről (Lábápolás, Kézápolás, Díszítés,
     Wellness pedikűr csomagok). A Kézápolás listából KÉT változat érkezett;
     itt a magasabb árú (A4-es) szerepel — melyik az érvényes, egyeztetendő.
   - Időtartam: csak a talpmasszázsnál és a wellness csomagoknál szerepel az
     árlistán. A többi BECSÜLT érték (estimate: true), Beatrix-szel egyeztetendő.
   - Helyszín: NINCS MEGERŐSÍTVE (Budapest XI. vagy Nagykáta).
   - Munkaidő, szünet, pufferidő: BEMUTATÓ értékek, egyeztetendők.
   ========================================================================== */
window.BB_CONFIG = {
  brand: {
    name: 'Beatrix Nails & Pedikűr',
    owner: 'Balogh Beatrix',
    studio: 'Nails & Pedikűr',
    monogram: 'B',
    studioConfirmed: true
  },
  phone: { display: '+36 70 614 6070', tel: '+36706146070' },
  email: null, /* nincs ismert e-mail-cím — ügyféltől bekérendő */

  locations: {
    budapest: {
      label: 'Budapest XI.',
      line1: 'Bertalan Lajos utca 19.',
      line2: '1111 Budapest',
      source: 'Notino-profil'
    },
    nagykata: {
      label: 'Nagykáta',
      line1: 'Dózsa György út 21.',
      line2: '2760 Nagykáta',
      source: 'régebbi szakmai lista, JóSzaki-profil'
    }
  },
  activeLocation: 'budapest',
  addressConfirmed: false,

  /* Ami biztosan ismert a nyitvatartásról */
  openingNote: 'Előre egyeztetett időpontok alapján',

  categories: [
    { id: 'pedikur', name: 'Pedikűr és lábápolás', short: 'Pedikűr', page: 'pedikur.html' },
    { id: 'manikur', name: 'Manikűr és géllakk', short: 'Manikűr', page: 'manikur.html' },
    { id: 'specialis', name: 'Speciális lábápolás', short: 'Speciális', page: 'specialis-labapolas.html' }
  ],

  /* Árlista — forrás: Beatrix saját árlista-képei (2026.10.).
     price: Ft; priceMax: sávos ár felső értéke; unit: „/ alkalom", „/ köröm"…
     estimate: true = az időtartam BECSÜLT, az árlistán nem szerepel.
     buffer: takarítás / előkészítés két kezelés között (perc) — bemutató érték. */
  services: [
    { id: 'klasszikus-pedikur', cat: 'pedikur', name: 'Klasszikus esztétikai pedikűr', mins: 60, price: 8500, desc: 'Bőrkeményedés eltávolítása, a körmök rövidítése és rendbetétele, peeling, tápláló krémezés.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'vizes-pedikur-gellakk', cat: 'pedikur', name: 'Esztétikai pedikűr + lábgéllakk', mins: 90, price: 12500, desc: 'A teljes esztétikai pedikűr, a végén tartós géllakkal a lábkörmökön.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'pedikur-talpmasszazs', cat: 'pedikur', name: 'Esztétikai pedikűr + talpmasszázs', mins: 90, price: 13500, desc: 'Esztétikai pedikűr, utána 30 perces talpmasszázs.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'pedikur-masszazs-gellakk', cat: 'pedikur', name: 'Esztétikai pedikűr + talpmasszázs + lábgéllakk', mins: 120, price: 16000, desc: 'A legteljesebb lábkezelés: pedikűr, talpmasszázs és lábgéllakk egy alkalommal.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'labgellakk', cat: 'pedikur', name: 'Lábgéllakk (teli szín vagy francia)', mins: 60, price: 7500, desc: 'Tartós, fényes szín vagy francia a lábkörmökön, előkészített körömfelületre.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'labgellakk-eltavolitas-mini-pedikur', cat: 'pedikur', name: 'Lábgéllakk végleges eltávolítása + mini pedikűr', mins: 60, price: 6500, desc: 'A régi lábgéllakk kíméletes eltávolítása, utána rövidebb, frissítő pedikűr.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'talpmasszazs', cat: 'pedikur', name: 'Talpmasszázs', mins: 30, price: 6000, desc: '30 perces, pihentető talpmasszázs.', buffer: 15, active: true, bookable: true },
    { id: 'paraffinos-labapolas', cat: 'pedikur', name: 'Paraffinos lábápolás', mins: 30, price: 6500, desc: 'Meleg paraffinos pakolás a láb bőrének.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'wellness-frissito', cat: 'pedikur', name: 'Wellness pedikűr — Frissítő', mins: 60, price: 9000, desc: 'Aromás lábfürdő (illóolaj, tengeri só), körömformázás, bőrápolás, sarok- és talprendbetétel, lábpeeling, hidratáló krémezés rövid masszázzsal.', package: 'Basic', buffer: 15, active: true, bookable: true },
    { id: 'wellness-relax', cat: 'pedikur', name: 'Wellness pedikűr — Relax', mins: 90, price: 14000, desc: 'Aromaterápiás lábfürdő, körömformázás, bőrkeményedés eltávolítás, tápláló peeling és pakolás, paraffinos kezelés, 15 perces láb- és lábszármasszázs, géllakkozás.', package: 'Standard', buffer: 15, active: true, bookable: true },
    { id: 'wellness-deluxe', cat: 'pedikur', name: 'Wellness pedikűr — Deluxe', mins: 120, price: 20000, desc: 'Exkluzív aromás lábfürdő (gyógynövény, rózsaszirom, spa só), körömformázás, bőrkeményedés kezelés, luxus peeling és tápláló pakolás, paraffinos kezelés vagy meleg pakolás, 20–25 perces aromaterápiás masszázs, géllakk (francia vagy teli szín), gyógytea vagy frissítő ital.', package: 'Luxus', buffer: 15, active: true, bookable: true },
    { id: 'gepi-manikur', cat: 'manikur', name: 'Orosz gépi manikűr', mins: 45, price: 5500, desc: 'Csiszológéppel végzett, precíz köröm- és bőrápolás, formára igazított körmökkel.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'paraffinos-kezapolas', cat: 'manikur', name: 'Paraffinos kézápolás', mins: 45, price: 6500, desc: 'Meleg paraffinos pakolás a kéz bőrének — csendes, pihentető kezelés.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'gellakk-eltavolitas', cat: 'manikur', name: 'Géllakk eltávolítás manikűrrel', mins: 60, price: 6500, desc: 'A régi géllakk kíméletes eltávolítása, utána manikűr.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'erositett-gellakk', cat: 'manikur', name: 'Erősített géllakk — XS méret', mins: 90, price: 9000, desc: 'Modern géllakk orosz manikűrrel, erősítő alapréteggel a saját körmön. 2 köröm díszítése benne van.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'erositett-gellakk-s', cat: 'manikur', name: 'Erősített géllakk — S méret', mins: 100, price: 10000, desc: 'Modern géllakk orosz manikűrrel, hosszabb saját körömre. 2 köröm díszítése benne van.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'mukorom-xs', cat: 'manikur', name: 'Műköröm építés — XS', mins: 120, price: 9500, desc: 'Műköröm szalonformába, a legrövidebb hosszban. Töltés: 8 500 Ft.', estimate: true, refill: 8500, buffer: 15, active: true, bookable: true },
    { id: 'mukorom-s', cat: 'manikur', name: 'Műköröm építés — S', mins: 135, price: 12000, desc: 'Műköröm szalonformába, S hosszban. Töltés: 11 000 Ft.', estimate: true, refill: 11000, buffer: 15, active: true, bookable: true },
    { id: 'mukorom-m', cat: 'manikur', name: 'Műköröm építés — M', mins: 150, price: 14000, desc: 'Műköröm szalonformába, M hosszban. Töltés: 13 000 Ft.', estimate: true, refill: 13000, buffer: 15, active: true, bookable: true },
    /* mukorom-eltavolitas: csak a régebbi árlistán szerepel — egyeztetendő */
    { id: 'mukorom-eltavolitas', cat: 'manikur', name: 'Műköröm eltávolítás manikűrrel', mins: 60, price: 6500, desc: 'A műköröm kíméletes eltávolítása és a saját köröm rendbetétele.', estimate: true, buffer: 15, active: true, bookable: true },
    { id: 'specialis-labapolas', cat: 'specialis', name: 'Állapotfelmérés, konzultáció', mins: null, price: 2500, desc: 'Személyes állapotfelmérés: átbeszéljük, mire van szüksége a lábadnak, és ehhez igazítjuk a kezelést.', unit: 'alkalom', phoneOnly: true, buffer: 15, active: true, bookable: false },
    { id: 'specialis-pedikur', cat: 'specialis', name: 'Speciális pedikűr', mins: null, price: 9500, desc: 'Extrém vastag bőrkeményedés, tyúkszem, benőtt köröm, repedezett, száraz sarok kezelése, tápláló pakolással.', phoneOnly: true, buffer: 15, active: true, bookable: false },
    { id: 'gombas-korom', cat: 'specialis', name: 'Gombás köröm kezelése', mins: null, price: 6500, desc: 'Esztétikai körömkezelés, alkalmanként. Orvosi kezelést nem helyettesít.', unit: 'alkalom', phoneOnly: true, buffer: 15, active: true, bookable: false },
    { id: 'benott-korom', cat: 'specialis', name: 'Benőtt köröm kezelése pedikűr nélkül', mins: null, price: 2500, desc: 'Önálló kezelés, pedikűr nélkül.', unit: 'köröm oldal', phoneOnly: true, buffer: 15, active: true, bookable: false },
    { id: 'korom-protezis', cat: 'specialis', name: 'Köröm protézis, körömkorrekció', mins: null, price: 2000, desc: 'A sérült vagy hiányos köröm esztétikai pótlása, korrekciója.', priceMax: 3500, unit: 'köröm', phoneOnly: true, buffer: 15, active: true, bookable: false }
  ],

  /* Díszítés — a géllakk és műköröm ára 2 köröm tetszőleges díszítését tartalmazza.
     Nem tartalmazza: teli kövezés, festett francia, ombre, babyboomer. */
  extras: [
    { name: 'Ombre, babyboomer', price: '250 Ft / köröm' },
    { name: 'Festett francia', price: '150 Ft / köröm' },
    { name: 'Egyszerű díszítés (porok, matrica, nyomda)', price: '100–300 Ft / köröm' },
    { name: 'Bonyolultabb díszítés (porcelán virág, 3D minta)', price: '300–800 Ft / köröm' },
    { name: 'Köröm ékszer', price: '250–400 Ft / köröm' },
    { name: 'Teli kövezés', price: '500–1 100 Ft / köröm' },
    { name: 'Köröm pótlása', price: 'a szolgáltatás 10%-a / köröm' }
  ],

  /* BEMUTATÓ munkarend — a valós beosztás nem ismert, ügyféllel egyeztetendő.
     0 = vasárnap … 6 = szombat. */
  schedule: {
    days: {
      0: null,
      1: null,
      2: { open: '09:00', close: '18:00', breakStart: '12:30', breakEnd: '13:00' },
      3: { open: '09:00', close: '18:00', breakStart: '12:30', breakEnd: '13:00' },
      4: { open: '10:00', close: '19:00', breakStart: '13:30', breakEnd: '14:00' },
      5: { open: '09:00', close: '18:00', breakStart: '12:30', breakEnd: '13:00' },
      6: { open: '09:00', close: '14:00', breakStart: null, breakEnd: null }
    },
    slotStep: 30,      /* percenként kínált kezdési időpontok */
    leadMinutes: 180,  /* legkorábban ennyi perccel előre foglalható */
    horizonDays: 75    /* ennyi napra előre lehet foglalni */
  },

  /* Előtte–utána galéria (speciális lábápolás oldal).
     consentApproved: true csak a vendég(ek) ÍRÁSOS hozzájárulása után! Addig a képek
     „belső bemutató" fátyol mögött vannak. pairingConfirmed: Beatrix megerősítette a párokat. */
  beforeAfter: { consentApproved: false, pairingConfirmed: false },

  site: {
    baseUrl: 'https://daekon-ship.github.io/daekon/latvanytervek/balogh-beatrix/',
    demo: true
  }
};
