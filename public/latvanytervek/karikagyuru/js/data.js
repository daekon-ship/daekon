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
  // A karikagyuru.com ÁSZF-je alapján (2026.11.18.)
  company: 'Virág & Társa Kft.',
  seat: '1132 Budapest, Visegrádi utca 42–46.',
  site: '1089 Budapest, Bláthy Ottó utca 4–8., I. emelet 123.',
  taxNo: '12149030-2-41',
  regNo: '01-09-469480',
};

/* A rendelés menete és feltételei – a karikagyuru.com ÁSZF-je alapján */
export const TERMS = [
  ['Személyesen', 'A méretet és a részleteket a Bláthy Ottó utcai üzletben egyeztetjük.'],
  ['Előleg', 'Egyedi gyűrűnél az ár fele, a megrendeléskor.'],
  ['Határidő', 'Feldolgozás 3 munkanapon belül, a kész dátumot egyeztetjük.'],
  ['Átvétel', 'Személyesen, ekkor fizeti a maradékot készpénzzel vagy átutalással.'],
  ['Garancia', '1 év jótállás. A méretváltoztatás nem tartozik bele.'],
  ['Elállás', 'Egyedi méretre készült gyűrűre nincs elállási jog.'],
];

export const REMOTE_IMG = 'https://karikagyuru.com/public/layout/pictures/karikagyuru/';
export const IMG_BASE = 'img/termekek/';   // a karikagyuru.com saját fotói (az ügyfél mentett oldaláról)

/* --- Kezdő demó alapanyagárak (NEM valós piaci árak; az ügyfél megbeszélésén elhangzott példaárakat sem vettük át éles árként) --- */
/* ==========================================================================
   ADATFORRÁSOK – minden árazási adatnál jelöljük, honnan származik:
     'jovahagyott'  – a tulajdonos megadta vagy jóváhagyta (éles adatnak tekinthető)
     'pelda'        – az ügyfél kézírásos árazási jegyzetéből / a megbeszélésből (PÉLDA, nem végleges)
     'bizonytalan'  – az ügyfél adott rá számot, de ellentmondásos vagy megerősítendő → nem árazunk vele
     'demo'         – kitalált bemutatóadat (DAEKON), csak hogy a felület működjön
   ========================================================================== */
export const SRC_LABEL = { jovahagyott: 'jóváhagyott', pelda: 'ügyfél példája', bizonytalan: 'megerősítendő', demo: 'demó' };

/* --- Alapanyagárak és grammárak (Ft) --- */
export const DEMO_MATERIALS = {
  // ALAPANYAG-REFERENCIAÁRAK (beszerzés, Ft / g). A 14K és 18K a 24K-ból számolódik:
  //   14K = 24K × 0,585 (40 000 → 23 400), 18K = 24K × 0,75 (40 000 → 30 000) – egyezik az ügyfél jegyzetével.
  gold24: 40000,
  platinum: 15000,
  palladium: 10000,
  titanium: 80,
  // KÉSZTERMÉK ELADÁSI GRAMMÁRA (bruttó, Ft / g) – ebben benne van a fém, a munka és az árrés.
  // Az ügyfél példája: 14K 47 000, platina 55 000. A többi demó (az ügyféltől még nem kaptuk meg).
  sellPerGram: { au14: 47000, au18: 56000, pt: 55000, pd: 40000, ti: 30000 },
  // TERMÉSZETES GYÉMÁNT, Ft / db (ügyfél jegyzete). price: null = nincs megbízható ár → egyedi ajánlat.
  // mm = a kő átmérője – ebből ellenőrizzük, hogy fizikailag elfér-e a gyűrűn.
  diamonds: [
    { id: 'd005', ct: 0.005, mm: 1.0,  name: 'Brill 0,005 ct', quality: 'Ø 1,0 mm',     price: 3500,  src: 'demo' },
    { id: 'd01',  ct: 0.01,  mm: 1.25, name: 'Brill 0,01 ct',  quality: 'Ø 1,25 mm',    price: 6000,  src: 'pelda' },
    { id: 'd015', ct: 0.015, mm: 1.5,  name: 'Brill 0,015 ct', quality: 'Ø 1,5 mm',     price: 9000,  src: 'pelda' },
    { id: 'd02',  ct: 0.02,  mm: 1.7,  name: 'Brill 0,02 ct',  quality: 'Ø 1,7 mm',     price: 12000, src: 'pelda' },
    { id: 'd03',  ct: 0.03,  mm: 2.0,  name: 'Brill 0,03 ct',  quality: 'Ø 2,0 mm',     price: 18000, src: 'pelda' },
    { id: 'd04',  ct: 0.04,  mm: 2.3,  name: 'Brill 0,04 ct',  quality: 'Ø 2,2–2,3 mm', price: null,  src: 'bizonytalan', note: 'A jegyzetben 24 000 Ft, a beszélgetésben 20 000 Ft – megerősítendő.' },
    { id: 'd05',  ct: 0.05,  mm: 2.4,  name: 'Brill 0,05 ct',  quality: 'Ø 2,3–2,4 mm', price: null,  src: 'bizonytalan', note: 'Ár megerősítendő.' },
    { id: 'd10',  ct: 0.10,  mm: 3.0,  name: 'Brill 0,10 ct',  quality: 'Ø 3,0 mm',     price: null,  src: 'demo', note: 'Nincs adat.' },
  ],
  src: {
    gold24: 'pelda', platinum: 'pelda', palladium: 'pelda', titanium: 'demo',
    'sellPerGram.au14': 'pelda', 'sellPerGram.pt': 'pelda',
    'sellPerGram.au18': 'demo', 'sellPerGram.pd': 'demo', 'sellPerGram.ti': 'demo',
  },
};

/* Az ügyfél példatömegei 54-es méretnél, ugyanarra a gyűrűre (g) – ebből jönnek az anyagonkénti tömegarányok. */
export const EXAMPLE_WEIGHTS = { ti: 1.5, au14: 4.8, au18: 5.4, pt: 6.9, pd: 4.0 };
const ratio = (m) => Math.round((EXAMPLE_WEIGHTS[m] / EXAMPLE_WEIGHTS.au14) * 1e6) / 1e6;

/* --- Árképlet-beállítások --- */
export const DEMO_SETTINGS = {
  pricingMode: 'gramm',   // 'gramm' = az ötvös módszere: tömeg × grammár · 'koltseg' = költségalapú (összehasonlításnak)
  sizeMethod: 'tomeg',    // 'tomeg' = a tömeg arányos a mérettel (pl. 60-as = 54-es × 60/54) · 'ar' = árarányosítás
  // tömegszorzó a 14K-hoz képest – az ügyfél példatömegeiből: 18K 5,4/4,8 · Pt 6,9/4,8 · Pd 4,0/4,8 · Ti 1,5/4,8
  density: { au14: 1, au18: ratio('au18'), pt: ratio('pt'), pd: ratio('pd'), ti: ratio('ti') },
  stonesGross: true,      // grammáras módban a kő darabára végső (bruttó) ár – nincs rá külön felár és ÁFA
  settingPerStone: 0,     // kőfoglalás díja, Ft / kő (bruttó) – egyeztetendő, most 0
  engravingPrice: 6000,   // gravírozás, Ft / gyűrű (bruttó)
  boxCost: 0,             // díszdoboz, Ft / termék
  certCost: 0,            // kőtanúsítvány, Ft / köves termék
  roundTo: 100,           // kerekítés felfelé, Ft
  vatPct: 27,             // ÁFA, % – grammáras módban a grammár már tartalmazza
  // csak költségalapú módban:
  lossPct: 5,
  laborFactor: { au14: 1, au18: 1, pt: 1.3, pd: 1.2, ti: 1.4 },
  markupMetal: 30,
  markupStones: 20,
  // fizikai kőellenőrzés (demó műszaki szabály, ötvössel egyeztetendő):
  stoneEdgeMm: 1.0,       // a kő átmérője legfeljebb a gyűrű szélessége mínusz ennyi
  stoneGapMm: 0.1,        // körbe foglalásnál ennyi hely kell két kő között
  minMarginPct: 15,
  bigChangePct: 20,
  showDemoMarks: true,
  src: {
    pricingMode: 'pelda', sizeMethod: 'pelda', density: 'pelda', vatPct: 'jovahagyott',
    stonesGross: 'demo', settingPerStone: 'demo', engravingPrice: 'demo', boxCost: 'demo', certCost: 'demo', roundTo: 'demo',
    lossPct: 'demo', laborFactor: 'demo', markupMetal: 'demo', markupStones: 'demo', stoneEdgeMm: 'demo', stoneGapMm: 'demo',
  },
};

/* Több domain (pl. karikagyuru.com és budapestikarikagyuru.com) közös termék- és áradminisztrációval:
   minden termék `sites` listája mondja meg, melyik oldalon jelenik meg; az árak és a gyűrűk közösek. */
export const SITES = { karikagyuru: 'karikagyuru.com', budapest: 'budapestikarikagyuru.com' };
export const CURRENT_SITE = 'karikagyuru';

/* --- Munkadíj stílusonként (demó), Ft / gyűrű --- */
export const DEMO_LABOR = { klasszikus: 16000, modern: 22000, koves: 24000, ketszinu: 18000 };

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
  ketszinu:  { label: 'Fehér–sárga arany', short: 'fehér–sárga' },
  feherrose: { label: 'Fehér–rozé arany',  short: 'fehér–rozé' },
  sargarose: { label: 'Sárga–rozé arany',  short: 'sárga–rozé' },
};
export const BICOLOR = { ketszinu: ['feher', 'sarga'], feherrose: ['feher', 'rose'], sargarose: ['sarga', 'rose'] };

/* Valós cikkszám + valós listaár + valós képfájl; minden más demó. */
const R = (code, listaAr, img, o) => ({ code, listaAr, img, ...o });

// p = pár, s = egy gyűrű. Típus, szín és a kövek száma a fotók alapján (becslés, egyeztetendő);
// a kő mérete/kategóriája, a szélesség és a stílus demó.
const RAW_PAGE1 = [
  R('MAZ 79000 W', 435000, 'MAZ_79000_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 5,   st: ['d01', 10] }),
  R('MAZ 79002 W', 499000, 'MAZ_79002_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 5,   st: ['d01', 20] }),
  R('MAZ 79004 W', 499000, 'MAZ_79004_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 5,   st: ['d01', 20] }),
  R('MAZ 79006 W', 329000, 'MAZ_79006_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 3.5, st: ['d005', 18] }),
  R('MAZ 79008 W', 735000, 'MAZ_79008_W.jpg',   { kind: 'p', color: 'feher', style: 'koves', width: 6,   st: ['d005', 60] }),
  R('MAZ 79010 W', 425000, 'MAZ_79010_W.jpg',   { kind: 's', color: 'feher', style: 'koves', width: 3,   st: ['d01', 22] }),
  R('MAZ 79014 W', 260000, 'MAZ_79014_W.JPG',   { kind: 'p', color: 'feher', style: 'klasszikus', width: 5 }),
  R('MAZ 79016 - 79017', 499500, 'KETS.85105104.jpg', { kind: 'p', color: 'rose', style: 'koves', width: 4, st: ['d01', 20] }),
  R('MAZ 81161 - 81162 Y', 425000, 'karikagyuru_maz_81161_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 5,   st: ['d02', 3] }),
  R('MAZ 81163 - 81164 Y', 429000, 'karikagyuru_maz_81163_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 5,   st: ['d01', 5] }),
  R('MAZ 81165 - 81166 Y', 373000, 'karikagyuru_maz_81165_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 4.5, st: ['d05', 1] }),
  R('MAZ 81167 - 81168 Y', 232500, 'karikagyuru_maz_81167_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 4,  st: ['d01', 3] }),
  R('MAZ 81169 Y',         270000, 'karikagyuru_maz_81169_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 4 }),
  R('MAZ 81170 - 81171 Y', 259500, 'karikagyuru_maz_81170_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 4,  st: ['d02', 1] }),
  R('MAZ 81172 - 81173 Y', 370000, 'karikagyuru_maz_81172_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 4.5, st: ['d05', 1] }),
  R('MAZ 81174 - 81175 Y', 367500, 'karikagyuru_maz_81174_y_n.jpg', { kind: 'p', color: 'sarga', style: 'modern', width: 4.5, st: ['d02', 1] }),
  R('MAZ 81176 - 81177 Y', 335000, 'karikagyuru_maz_81176_y_n.jpg', { kind: 'p', color: 'sarga', style: 'koves', width: 4.5, st: ['d02', 1] }),
  R('MAZ 81178 - 81179 Y', 375500, 'karikagyuru_maz_81178_y_n.jpg', { kind: 'p', color: 'sarga', style: 'klasszikus', width: 5, st: ['d01', 1] }),
  R('MAZ 81180 - 81181 W', 292500, 'karikagyuru_maz_81180_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 4,  st: ['d01', 5] }),
  R('MAZ 81182 - 81183 W', 299000, 'karikagyuru_maz_81182_w_n.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 4,   st: ['d02', 1] }),
  R('MAZ 81184 - 81185 W', 411000, 'karikagyuru_maz_81184_w_n.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 4.5, st: ['d01', 3] }),
  R('MAZ 81186 - 81187 W', 351500, 'karikagyuru_maz_81186_w_n.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 4.5, st: ['d01', 5] }),
  R('MAZ 81188 - 81189 W', 341000, 'karikagyuru_maz_81188_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 5,  st: ['d02', 1] }),
  R('MAZ 81190 - 81191 W', 401000, 'karikagyuru_maz_81190_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 4,  st: ['d01', 3] }),
  R('MAZ 81192 - 81193 W', 429000, 'karikagyuru_maz_81192_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 5,  st: ['d02', 1] }),
  R('MAZ 81194 - 81195 W', 259500, 'karikagyuru_maz_81194_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 4,  st: ['d01', 1] }),
  R('MAZ 81196 - 81197 W', 342000, 'karikagyuru_maz_81196_w_n.jpg', { kind: 'p', color: 'feher', style: 'koves', width: 5,   st: ['d02', 1] }),
  R('MAZ 81198 - 81199 W', 254000, 'karikagyuru_maz_81198_w_n.jpg', { kind: 'p', color: 'feher', style: 'modern', width: 4.5, st: ['d01', 1] }),
  R('MAZ 81200 - 81201 W/Y', 263000, 'karikagyuru_maz_81200_wy_n.jpg', { kind: 'p', color: 'ketszinu', style: 'ketszinu', width: 4, st: ['d01', 1] }),
  R('MAZ 81202 - 81203 W/Y', 364500, 'karikagyuru_maz_81202_wy_n.jpg', { kind: 'p', color: 'ketszinu', style: 'ketszinu', width: 4.5, st: ['d02', 1] }),
];

/*
 * A karikagyuru.com további modelljei (2. oldal, valamint a cikkszám és ár szerinti
 * rendezések első oldalai, 2026.11.18.). Cikkszám, ár és képfájl valós; a fotók
 * a karikagyuru.com-ról töltődnek. Ár nélküli tétel = „Ár: Ft” az eredeti oldalon.
 * A színt a cikkszám végződéséből olvassuk (W fehér, Y sárga, R rozé, W/Y, W/R, Y/R kétszínű).
 */
const MORE = `
MAZ 81204 - 81205 W/Y|234000|karikagyuru_maz_81204_wy_n.jpg
MAZ 81206 - 81207 Y/W|286500|karikagyuru_maz_81206_yw_n.jpg
MAZ 81208 - 81209 W/Y|387000|karikagyuru_maz_81208_wy_n.jpg
MAZ 81210 - 81211 W/Y|364000|karikagyuru_maz_81210_wy_n.jpg
MAZ 81212 - 81213 W/Y|422500|karikagyuru_maz_81212_wy_n.jpg
MAZ 81214 - 81215 W/Y|364500|karikagyuru_maz_81214_wy_n.jpg
MAZ 81216 - 81217 W/Y|249500|karikagyuru_maz_81216_wy_n.jpg
MAZ 81218 - 81219 W/Y|335000|karikagyuru_maz_81218_wy_n.jpg
MAZ 81632||karikagyuru_maz_81632_n.jpg
MAZ 82000 - 82001 W|394500|karikagyuru_maz_82000_w_n.jpg
MAZ 82002 - 82003 W|451800|karikagyuru_maz_82002_w_n.jpg
MAZ 82004 - 82005 W|438000|karikagyuru_maz_82004_w_n.jpg
MAZ 82006 - 82007 W|357000|karikagyuru_maz_82006_w_n.jpg
MAZ 82008 - 82009 W|357000|karikagyuru_maz_82008_w_n.jpg
MAZ 82010 - 82011 Y|311000|karikagyuru_maz_82010_y_n.jpg
MAZ 82012 - 82013 Y|359000|karikagyuru_maz_82012_y_n.jpg
MAZ 82014 - 82015 Y|330000|karikagyuru_maz_82014_y_n.jpg
MAZ 82016 - 82017 Y|438000|karikagyuru_maz_82016_y_n.jpg
MAZ 82018 - 82019 Y|397500|karikagyuru_maz_82018_y_n.jpg
MAZ 82020 - 82021 W/Y|309000|karikagyuru_maz_82020_wy_n.jpg
MAZ 82022 - 82023 W/Y|459500|karikagyuru_maz_82022_wy_n.jpg
MAZ 82024 - 82025 W/Y|389000|karikagyuru_maz_82024_wy_n.jpg
MAZ 82026 - 82027 W/Y|397500|karikagyuru_maz_82026_wy_n.jpg
MAZ 82028 - 82029 W/Y|474500|karikagyuru_maz_82028_wy_n.jpg
MAZ 82030 - 82031 W/R|447000|karikagyuru_maz_82030_wr_n.jpg
MAZ 82032 - 82033 W/R|375000|karikagyuru_maz_82032_wr_n.jpg
MAZ 82034 - 82035 W/R|433500|karikagyuru_maz_82034_wr_n.jpg
MAZ 82036 - 82037 W/R|328500|karikagyuru_maz_82036_wr_n.jpg
MAZ 82038 - 82039 W/R|311000|karikagyuru_maz_82038_wr_n.jpg
MAZ 82040 - 82041 W/Y|455000|karikagyuru_maz_82040_wy_n.jpg
MAZ 82044 - 82045 W/Y|509000|karikagyuru_maz_82044_wy_n.jpg
MAZ 82050 - 82051 W/R|521000|karikagyuru_maz_82050_wr_n.jpg
MAZ 82064 - 82065 W||karikagyuru_maz_82064_82065_w_n.jpg
MAZ 82064 - 82065 W/R||karikagyuru_maz_82064_82065_wr_n.jpg
MAZ 82064 - 82065 Y||karikagyuru_maz_82064_82065_y_n.jpg
MAZ 82064 - 82065 Y/W||karikagyuru_maz_82064_82065_yw_n.jpg
MAZ 82070 - 82071 W/R||karikagyuru_maz_82070_82071_wr_n.jpg
MAZ 82070 - 82071 Y/W||karikagyuru_maz_82070_82071_yw_n.jpg
MAZ 87000 - 87001 W/Y|223000|karikagyuru_maz_87000_wy_n.jpg
MAZ 87002 - 87003 W/Y|228500|karikagyuru_maz_87002_wy_n.jpg
MAZ 87004 - 87005 W/Y|251900|karikagyuru_maz_87004_wy_n.jpg
MAZ 87008 - 87009 W/Y|240000|karikagyuru_maz_87008_wy_n.jpg
MAZ 87010 - 87011 W/Y|225500|karikagyuru_maz_87010_wy_n.jpg
MAZ 87012 - 87013 W/Y|249000|karikagyuru_maz_87012_wy_n.jpg
MAZ 87014 - 87015 W/Y|225000|karikagyuru_maz_87014_wy_n.jpg
MAZ 87016 - 87017 W/Y|212500|karikagyuru_maz_87016_wy_n.jpg
MAZ 87024 - 87025 Y|234500|karikagyuru_maz_87024_y_n.jpg
MAZ 87026 - 87027 Y|226500|MAZ_87026_Y.jpg
MAZ 87028 - 87029 Y|242500|karikagyuru_maz_87028_y_n.jpg
MAZ 87030 - 87031 Y|237500|karikagyuru_maz_87030_y_n.jpg
MAZ 87036 - 87037 Y|241500|karikagyuru_maz_87036_y_n.jpg
MAZ 87040 - 87041 W|236000|karikagyuru_maz_87040_w_n.jpg
MAZ 87044 - 87045 W|253500|karikagyuru_maz_87044_n.jpg
MAZ 87048 - 87049 W|236500|karikagyuru_maz_87048_w_n.jpg
MAZ 87054 - 87055 W|236500|karikagyuru_maz_87054_w_n.jpg
MAZ 93130 - 93131|607500|karikagyuru_maz_93130_93131_n.jpg
MAZ 93130 - 93131 R|607500|karikagyuru_maz_93130_93131_r_n.jpg
MAZ 93130 - 93131 W|607500|karikagyuru_maz_93130_w_n.jpg
MAZ 93140 - 93141|975000|karikagyuru_maz_93140_93141_n.jpg
MAZ 93150 - 93151|665000|karikagyuru_maz_93150_93151_n.jpg
MAZ 93210 - 93211|645000|karikagyuru_maz_93210_93211_n.jpg
MAZ 93210 - 93211 W||karikagyuru_maz_93210_93211_w_n.jpg
MAZ 93210 - 93211 Y/V|645000|karikagyuru_maz_93210_93211_yv_n.jpg
MAZ 93230 - 93231|1040000|karikagyuru_maz_93230_93231_n.jpg
MAZ 93240 - 93241|885000|karikagyuru_maz_93240_93240_n.jpg
MAZ 93310 - 93311|535000|karikagyuru_maz_93310_93311_n.jpg
MAZ 93320 - 93321|580000|karikagyuru_maz_93320_93321_n.jpg
MAZ 93340 - 93341|669000|karikagyuru_maz_93340_93341_n.jpg
MAZ 93410 - 93411|547000|karikagyuru_maz_93410_93411_n.jpg
MAZ 93410 - 93411 Y/R|547000|karikagyuru_maz_93410_93411_yr_n.jpg
MAZ 93430 - 93431|714000|karikagyuru_maz_93430_93431_n.jpg
MAZ 93440 - 93441|571000|MAZ93440_W:R.jpg
MAZ 93450 - 93451|745000|karikagyuru_maz_93450_93451_n.jpg
MAZ 93510 - 93511|505000|karikagyuru_maz_93510_93511_n.jpg
MAZ 93510 - 93511 (2. változat)|505000|karikagyuru_maz_93510_93511_2_n.jpg
MAZ 93510 - 93511 W|505000|karikagyuru_maz_93510_93511_w_n.jpg
MAZ 93510 - 93511 W / R|505000|karikagyuru_maz_93510_93511_wr_n.jpg
MAZ 93510 - 93511 Y|505000|karikagyuru_maz_93510_93511_y_n.jpg
MAZ 93510 - 93511 Y/ W|505000|karikagyuru_maz_93510_93511_yw_n.jpg
MAZ 93530 - 93531|575000|karikagyuru_maz_93530_93531_n.jpg
MAZ 93530 - 93531 R/W|575000|karikagyuru_maz_93530_93531_rw_n.jpg
MAZ 93550 - 93551|583000|karikagyuru_maz_93550_93551_n.jpg
MAZ 93610 - 93611|342500|karikagyuru_maz_93610_93611_n.jpg
MAZ 93630 - 93631|427000|karikagyuru_maz_93630_93631_n.jpg
MAZ 93630 - 93631 W/R|427000|karikagyuru_maz_93630_93631_wr_n.jpg
`;

function colorFromCode(code) {
  const suf = (code.match(/(?:\d)\s+([WYRV][\sWYRV/]*)$/) || [])[1];
  if (!suf) return null;
  const set = new Set(suf.replace(/\s/g, '').split('/').map((x) => ({ W: 'feher', Y: 'sarga', R: 'rose', V: 'feher' }[x])).filter(Boolean));
  if (set.size === 1) return [...set][0];
  if (set.has('rose') && set.has('feher')) return 'feherrose';
  if (set.has('rose') && set.has('sarga')) return 'sargarose';
  return 'ketszinu';
}

const RAW = RAW_PAGE1.concat(MORE.trim().split('\n').map((line) => {
  const [code, price, img] = line.split('|');
  const num = Number((code.match(/MAZ\s+(\d+)/) || [])[1]);
  const color = colorFromCode(code.replace(' (2. változat)', ''));
  const bi = color && BICOLOR[color];
  const style = bi ? 'ketszinu' : num >= 87000 && num < 88000 ? 'klasszikus' : 'modern';
  const width = num >= 93000 ? 5 : num >= 87000 ? 4 : 4.5;
  return R(code, price ? Number(price) : null, img, {
    kind: code.includes(' - ') ? 'p' : 's', color: color || 'feher', unknownColor: !color, style, width, remote: true,
  });
}));

const slug = (code) => code.toLowerCase().replace(/\//g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function nameFor(r) {
  if (!r.color || r.unknownColor) return r.kind === 's' ? 'Arany gyűrű' : 'Arany karikagyűrű pár';
  const col = COLORS[r.color].label;
  if (r.kind === 's') return r.st ? `${col} gyémántgyűrű` : `${col} gyűrű`;
  if (r.st) return `${col} karikagyűrű pár, gyémánttal`;
  return `${col} karikagyűrű pár`;
}

const CAT_ORDER = ['d005', 'd01', 'd015', 'd02', 'd03', 'd04', 'd05', 'd10'];
/** Demó gyémántszabály a fotóról becsült kőszámból – jóváhagyandó, nem végleges korlát. */
function demoRule(cat, n, allowNone) {
  const i = CAT_ORDER.indexOf(cat);
  const near = (a, b) => CAT_ORDER.slice(Math.max(0, i + a), i + b + 1);
  if (n >= 40) return { mode: 'perSize', min: 40, max: 70, def: n, cats: [cat], defCat: cat, allowNone: false, demo: true };
  if (n > 5) return { mode: 'fixed', min: n, max: n, def: n, cats: near(-1, 0), defCat: cat, allowNone: false, demo: true };
  const cats = near(-1, 1);
  return { mode: 'free', min: allowNone ? 0 : 1, max: n <= 3 ? 3 : 5, def: n, cats, defCat: cat, allowNone, demo: true };
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
    stoneRule: withStones && r.st ? demoRule(r.st[0], r.st[1], r.st[1] <= 5) : null,
  };
}

export function buildDemoProducts() {
  const list = RAW.map((r) => {
    const pair = r.kind === 'p';
    const colors = BICOLOR[r.color] ? [r.color] : ['sarga', 'feher', 'rose'];
    return {
      id: slug(r.code),
      code: r.code.replace(/^MAZ\s*/i, ''),   // a „MAZ” előtag nem jelenik meg (ügyfélkérés)
      name: nameFor(r),
      real: true,
      listaAr: r.listaAr,
      img: r.remote ? REMOTE_IMG + encodeURIComponent(r.img) : IMG_BASE + r.img.toLowerCase(),
      priceOnRequest: !r.listaAr,
      imgFill: r.code === 'MAZ 79008 W',   // ez az egy maradt eredeti stúdiófotó, kitöltve
      unknownColor: !!r.unknownColor,
      kind: r.kind,
      baseColor: r.color,
      colors,
      // Anyagok (demó szabály): kétszínű modell csak aranyból; köves modell titánból nem.
      metals: BICOLOR[r.color] ? ['au14', 'au18'] : r.st ? ['au14', 'au18', 'pt', 'pd'] : ['au14', 'au18', 'pt', 'pd', 'ti'],
      style: r.style,
      visible: true,               // megjelenítési állapot (admin: Gyűrűk → Megjelenés)
      sites: ['karikagyuru', 'budapest'],
      widths: pair && r.style !== 'koves'
        ? [r.width - 0.5, r.width, r.width + 0.5]
        : [r.width],
      stoneOptional: !!r.st && r.st[1] <= 5,
      rings: pair
        ? [ringFrom('Női gyűrű', 54, r, true, 0.43), ringFrom('Férfi gyűrű', 64, r, false, 0.57)]
        : [ringFrom('Gyűrű', 54, r, true, 1)],
      approved: false,             // az ötvös jóváhagyta-e a tömeg- és kőadatokat (most: becslés)
      override: null,              // { type: 'fixed' | 'pct', value }
      minPrice: 0,
    };
  });

  return list;
}

export const FEATURED = ['maz-81161-81162-y', 'maz-81163-81164-y', 'maz-79016-79017', 'maz-81202-81203-wy', 'maz-79010-w', 'maz-81186-81187-w'];
