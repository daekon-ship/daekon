/* ==========================================================================
   Karikagyuru.com – bemutató adatai
   --------------------------------------------------------------------------
   VALÓS (a karikagyuru.com oldaláról, 2026.11.18.):
     - cikkszámok, a jelenleg feltüntetett árak (listaAr), a képfájlok neve,
       elérhetőségek, "rendelésre elkészítjük".
   DEMÓ (kitalált, egyeztetendő):
     - minden alapanyagár, haszonkulcs, munkadíj, tömeg, szélesség, kőadat,
       finomság-alapérték, stílusbesorolás és a két ezüst demótermék.
   A tömegeket a rendszer a kezdő demóárakból úgy számolja vissza, hogy a
   kalkulált ár közel essen a mostani weboldali árhoz (lásd engine.seedWeights).
   ========================================================================== */

export const BUSINESS = {
  name: 'Karikagyuru.com',
  address: '1089 Budapest, Bláthy Ottó utca 4–8.',
  phone: '+36 30 984 3090',
  phoneHref: 'tel:+36309843090',
  email: 'info@karikagyuru.com',
  hours: 'Előzetes időpont-egyeztetés után bármikor, akár munkaidő után vagy hétvégén is.',
  facebook: 'https://www.facebook.com/www.karikagyuru.com.karikagyuruk.eljegyzesigyuruk',
  instagram: 'https://www.instagram.com/karikagyuru',
  pinterest: 'https://hu.pinterest.com/pin/319544536045334809',
  aszf: 'https://www.karikagyuru.com/aszf.php',
  adatkezeles: 'https://www.karikagyuru.com/adatkezeles.php',
  map: 'https://www.google.com/maps/search/?api=1&query=1089+Budapest+Bl%C3%A1thy+Ott%C3%B3+utca+4-8',
};

export const IMG_BASE = 'https://karikagyuru.com/public/layout/pictures/karikagyuru/';

/* --- Kezdő demó alapanyagárak (NEM valós piaci árak) --- */
export const DEMO_MATERIALS = {
  gold24: 39000,          // Ft / g – 24K színarany referenciaár
  silver: 500,            // Ft / g – ezüst referenciaár
  alloy: {                // Ft / g – ötvözőanyag színenként
    sarga: 400,
    rose: 450,
    feher: 2600,          // palládiumtartalmú fehér ötvözet (demó)
  },
  diamonds: [             // Ft / db – kőkategóriák
    { id: 'd01', name: 'Brill 0,01 ct', quality: 'G / SI', price: 18000 },
    { id: 'd02', name: 'Brill 0,02 ct', quality: 'G / SI', price: 30000 },
    { id: 'd05', name: 'Brill 0,05 ct', quality: 'G / VS', price: 85000 },
    { id: 'd10', name: 'Brill 0,10 ct', quality: 'G / VS', price: 190000 },
  ],
};

/* --- Kezdő demó árképlet-beállítások --- */
export const DEMO_SETTINGS = {
  lossPct: 5,             // gyártási veszteség a fémre, %
  density18: 1.17,        // 18K ugyanannál a modellnél ennyiszer nehezebb
  markupMetal: 30,        // felár a fémre és munkára, %
  markupStones: 20,       // felár a kövekre, %
  vatPct: 27,             // ÁFA, %
  roundTo: 500,           // kerekítés felfelé, Ft
  settingPerStone: 3500,  // kőfoglalás díja, Ft / kő
  engravingPrice: 6000,   // gépi gravírozás, Ft / gyűrű
  boxCost: 4000,          // díszdoboz, Ft / termék
  certCost: 6000,         // kőtanúsítvány, Ft / köves termék
  minMarginPct: 15,       // ennél kisebb árrésnél figyelmeztet
  bigChangePct: 20,       // ennél nagyobb alapanyagár-változásnál külön megerősítés
  showDemoMarks: true,
};

/* --- Munkadíj stílusonként (demó), Ft / gyűrű --- */
export const DEMO_LABOR = { klasszikus: 16000, modern: 22000, koves: 24000, ketszinu: 28000 };

export const STYLES = {
  klasszikus: 'Klasszikus',
  modern: 'Modern, mintás',
  koves: 'Köves',
  ketszinu: 'Kétszínű',
};

export const COLORS = {
  sarga: { label: 'Sárgaarany', short: 'sárga' },
  feher: { label: 'Fehérarany', short: 'fehér' },
  rose:  { label: 'Rozéarany',  short: 'rozé' },
  ezust: { label: 'Ezüst 925',  short: 'ezüst' },
};

/* Valós cikkszám + valós listaár + valós képfájl; minden más demó. */
const R = (code, listaAr, img, o) => ({ code, listaAr, img, ...o });

// Rövidítés: p = pár, s = egy gyűrű.  st = demó kőbeállítás a női/egyetlen gyűrűn.
const RAW = [
  R('MAZ 79000 W', 435000, 'MAZ_79000_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 2.5, st: ['d02', 9] }),
  R('MAZ 79002 W', 499000, 'MAZ_79002_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 2.5, st: ['d05', 3] }),
  R('MAZ 79004 W', 499000, 'MAZ_79004_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 3,   st: ['d02', 11] }),
  R('MAZ 79006 W', 329000, 'MAZ_79006_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 2,   st: ['d01', 12] }),
  R('MAZ 79008 W', 735000, 'MAZ_79008_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 3,   st: ['d05', 4] }),
  R('MAZ 79010 W', 425000, 'MAZ_79010_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 2.5, st: ['d05', 2] }),
  R('MAZ 79014 W', 260000, 'MAZ_79014_W.JPG',   { kind: 's', color: 'feher', style: 'koves', width: 2,   st: ['d01', 5] }),
  R('MAZ 79016 - 79017', 499500, 'KETS.85105104.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 4, st: ['d02', 5] }),
  R('MAZ 81161 - 81162 Y', 425000, 'karikagyuru_maz_81161_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 5 }),
  R('MAZ 81163 - 81164 Y', 429000, 'karikagyuru_maz_81163_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 5, st: ['d01', 3] }),
  R('MAZ 81165 - 81166 Y', 373000, 'karikagyuru_maz_81165_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 4.5 }),
  R('MAZ 81167 - 81168 Y', 232500, 'karikagyuru_maz_81167_y_n.jpg', { kind: 'p', color: 'sarga', style: 'klasszikus', width: 3 }),
  R('MAZ 81169 Y',         270000, 'karikagyuru_maz_81169_y_n.jpg', { kind: 's', color: 'sarga', style: 'koves', width: 3, st: ['d02', 4] }),
  R('MAZ 81170 - 81171 Y', 259500, 'karikagyuru_maz_81170_y_n.jpg', { kind: 'p', color: 'sarga', style: 'klasszikus', width: 3.5 }),
  R('MAZ 81172 - 81173 Y', 370000, 'karikagyuru_maz_81172_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 4, st: ['d01', 5] }),
  R('MAZ 81174 - 81175 Y', 367500, 'karikagyuru_maz_81174_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 5 }),
  R('MAZ 81176 - 81177 Y', 335000, 'karikagyuru_maz_81176_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 4 }),
  R('MAZ 81178 - 81179 Y', 375500, 'karikagyuru_maz_81178_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 4, st: ['d02', 3] }),
  R('MAZ 81180 - 81181 W', 292500, 'karikagyuru_maz_81180_w_n.jpg', { kind: 'p', color: 'feher', style: 'klasszikus', width: 3.5 }),
  R('MAZ 81182 - 81183 W', 299000, 'karikagyuru_maz_81182_w_n.jpg', { kind: 'p', color: 'feher', style: 'klasszikus', width: 4 }),
  R('MAZ 81184 - 81185 W', 411000, 'karikagyuru_maz_81184_w_n.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 4.5, st: ['d02', 3] }),
  R('MAZ 81186 - 81187 W', 351500, 'karikagyuru_maz_81186_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 4.5 }),
  R('MAZ 81188 - 81189 W', 341000, 'karikagyuru_maz_81188_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 4 }),
  R('MAZ 81190 - 81191 W', 401000, 'karikagyuru_maz_81190_w_n.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 4, st: ['d01', 7] }),
  R('MAZ 81192 - 81193 W', 429000, 'karikagyuru_maz_81192_w_n.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 5, st: ['d02', 3] }),
  R('MAZ 81194 - 81195 W', 259500, 'karikagyuru_maz_81194_w_n.jpg', { kind: 'p', color: 'feher', style: 'klasszikus', width: 3 }),
  R('MAZ 81196 - 81197 W', 342000, 'karikagyuru_maz_81196_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 4.5 }),
  R('MAZ 81198 - 81199 W', 254000, 'karikagyuru_maz_81198_w_n.jpg', { kind: 'p', color: 'feher', style: 'klasszikus', width: 3 }),
  R('MAZ 81200 - 81201 W/Y', 263000, 'karikagyuru_maz_81200_wy_n.jpg', { kind: 'p', color: 'ketszinu', style: 'ketszinu', width: 3.5 }),
  R('MAZ 81202 - 81203 W/Y', 364500, 'karikagyuru_maz_81202_wy_n.jpg', { kind: 'p', color: 'ketszinu', style: 'ketszinu', width: 4.5 }),
];

const slug = (code) => code.toLowerCase().replace(/\//g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function nameFor(r) {
  const col = r.color === 'ketszinu' ? 'Kétszínű (fehér–sárga) arany' : COLORS[r.color].label;
  if (r.kind === 's') return r.st ? `${col} gyémántgyűrű` : `${col} gyűrű`;
  if (r.st) return `${col} karikagyűrű pár, gyémánttal`;
  return `${col} karikagyűrű pár`;
}

function ringFrom(label, refSize, r, withStones, share) {
  return {
    label,
    refSize,
    refWidth: r.width,
    share,                         // a visszaszámolt tömeg ekkora része jut erre a gyűrűre
    weight: 0,                     // g, 14K-ban, referenciaméretben – a seed tölti ki
    labor: DEMO_LABOR[r.style],
    other: 0,
    stones: withStones && r.st ? { cat: r.st[0], count: r.st[1] } : null,
  };
}

export function buildDemoProducts() {
  const list = RAW.map((r) => {
    const pair = r.kind === 'p';
    const colors = r.color === 'ketszinu' ? ['ketszinu'] : ['sarga', 'feher', 'rose'];
    return {
      id: slug(r.code),
      code: r.code,
      name: nameFor(r),
      real: true,
      listaAr: r.listaAr,
      img: IMG_BASE + r.img,
      kind: r.kind,
      baseColor: r.color,
      colors,
      karats: [14, 18],
      baseKarat: 14,
      style: r.style,
      widths: pair && r.style !== 'koves'
        ? [r.width - 0.5, r.width, r.width + 0.5]
        : [r.width],
      stoneOptional: !!r.st && pair,
      rings: pair
        ? [ringFrom('Női gyűrű', 54, r, true, 0.43), ringFrom('Férfi gyűrű', 64, r, false, 0.57)]
        : [ringFrom('Gyűrű', 54, r, true, 1)],
      override: null,              // { type: 'fixed' | 'pct', value }
      minPrice: 0,
    };
  });

  // Két ezüst demótermék – nem a karikagyuru.com katalógusából.
  const silver = (id, code, name, w, width, labor) => ({
    id, code, name, real: false, listaAr: null, img: null,
    kind: 'p', baseColor: 'ezust', colors: ['ezust'], karats: [925], baseKarat: 925,
    style: 'klasszikus', widths: [width - 1, width, width + 1], stoneOptional: false,
    rings: [
      { label: 'Női gyűrű', refSize: 54, refWidth: width, share: 0.43, weight: +(w * 0.43).toFixed(1), labor, other: 0, stones: null },
      { label: 'Férfi gyűrű', refSize: 64, refWidth: width, share: 0.57, weight: +(w * 0.57).toFixed(1), labor, other: 0, stones: null },
    ],
    override: null, minPrice: 0, fixedWeight: true,
  });
  list.push(silver('demo-ag-01', 'DEMÓ AG 01', 'Ezüst karikagyűrű pár – demótermék', 9, 4, 14000));
  list.push(silver('demo-ag-02', 'DEMÓ AG 02', 'Széles ezüst karikagyűrű pár – demótermék', 14, 6, 16000));
  return list;
}

export const FEATURED = ['maz-79008-w', 'maz-81163-81164-y', 'maz-81184-81185-w', 'maz-81202-81203-wy', 'maz-79000-w', 'maz-81170-81171-y'];
