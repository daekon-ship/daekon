/* ==========================================================================
   Balogh Beatrix | Foot & Nail Studio — KÖZPONTI KONFIGURÁCIÓ
   --------------------------------------------------------------------------
   Minden üzleti adat innen jön: név, telefon, helyszín, árlista, munkaidő.
   Az oldalak ezt olvassák — itt elég átírni, a HTML-hez nem kell nyúlni.

   ÁLLAPOT (2026.10.25.):
   - Telefonszám: a briefben megadott, nyilvános szám.
   - Helyszín: NINCS MEGERŐSÍTVE. Alapértelmezés a Notino-profil budapesti
     címe; a Nagykátai cím egy régebbi szakmai listáról származik.
   - Árlista: a Notino-profil referenciaadatai, NEM az ügyfél által
     jóváhagyott végleges árlista.
   - Munkaidő, szünet, pufferidő: BEMUTATÓ értékek, egyeztetendők.
   ========================================================================== */
window.BB_CONFIG = {
  brand: {
    name: 'Balogh Beatrix',
    studio: 'Foot & Nail Studio',
    monogram: 'BB',
    /* „Foot & Nail Studio" kreatív javaslat, nem igazolt márkanév */
    studioConfirmed: false
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

  /* Árlista — forrás: Notino-profil. price: Ft; priceMax: sávos ár felső értéke.
     buffer: takarítás / előkészítés két kezelés között (perc) — bemutató érték. */
  services: [
    { id: 'klasszikus-pedikur', cat: 'pedikur', name: 'Klasszikus pedikűr', mins: 80, price: 9500,
      desc: 'A láb és a lábkörmök alapos ápolása: körömvágás, formázás, a bőrkeményedés kíméletes eltávolítása.',
      art: 'labfurdo', buffer: 15, active: true, bookable: true },
    { id: 'vizes-pedikur-gellakk', cat: 'pedikur', name: 'Vizes pedikűr géllakkozással', mins: 100, price: 13500,
      desc: 'Lábáztatással induló, teljes pedikűr, a végén tartós géllakkal — a legteljesebb lábkezelés.',
      art: 'torolkozo', buffer: 15, active: true, bookable: true },
    { id: 'labgellakk', cat: 'pedikur', name: 'Géllakkozás lábra', mins: 60, price: 8500,
      desc: 'Tartós, fényes szín a lábkörmökre, gondosan előkészített körömfelületre.',
      art: 'lakk', buffer: 15, active: true, bookable: true },
    { id: 'labgellakk-eltavolitas-mini-pedikur', cat: 'pedikur', name: 'Lábgéllakk eltávolítás + mini pedikűr', mins: 90, price: 8500,
      desc: 'A régi lábgéllakk kíméletes eltávolítása, utána rövidebb, frissítő pedikűr.',
      art: 'ko', buffer: 15, active: true, bookable: true },
    { id: 'gepi-manikur', cat: 'manikur', name: 'Gépi manikűr', mins: 45, price: 5500,
      desc: 'Csiszológéppel végzett, precíz köröm- és bőrápolás, formára igazított körmökkel.',
      art: 'kezpihi', buffer: 15, active: true, bookable: true },
    { id: 'erositett-gellakk', cat: 'manikur', name: 'Erősített géllakk', mins: 90, price: 9000, priceMax: 10000,
      priceNote: 'A végleges összeg a köröm hosszától és állapotától függ, egyeztetés alapján.',
      desc: 'Erősítő alapréteggel készülő géllakk a saját körmön, hogy a szín tovább szép maradjon.',
      art: 'lakk', buffer: 15, active: true, bookable: true },
    { id: 'paraffinos-kezapolas', cat: 'manikur', name: 'Paraffinos kézápolás', mins: 45, price: 6500,
      desc: 'Meleg paraffinos pakolás a kéz bőrének — csendes, pihentető kezelés.',
      art: 'paraffin', buffer: 15, active: true, bookable: true },
    { id: 'mukorom-eltavolitas', cat: 'manikur', name: 'Műköröm eltávolítás', mins: 60, price: 6500,
      desc: 'A műköröm kíméletes eltávolítása és a saját köröm előkészítése a pihentetésre vagy új kezelésre.',
      art: 'eszkoz', buffer: 15, active: true, bookable: true },
    { id: 'specialis-labapolas', cat: 'specialis', name: 'Speciális lábápolás', mins: null, price: null,
      desc: 'Egyéni figyelmet igénylő lábápolás. Időpont előtt telefonon beszéljük át, mire van szükséged.',
      art: 'eszkoz', buffer: 15, active: true, bookable: false, phoneOnly: true }
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

  site: {
    baseUrl: 'https://daekon-ship.github.io/daekon/latvanytervek/balogh-beatrix/',
    demo: true
  }
};
