/* ==========================================================================
   V5.8 – Ügyféljóváhagyási központ: a még eldöntendő kérdések egy helyen.
   Szabályok:
   - Minden tétel alapból „Nyitott”. Nincs előre bejelölt vagy kitalált jóváhagyás.
   - A rögzített válasz NEM írja felül automatikusan az árakat, a termékszabályokat
     vagy a jogi szövegeket. A döntés átvezetése külön művelet a megadott menüpontban,
     és csak utána jelölhető „Átvezetve”-nek, egy külön megerősítéssel.
   - Az állapot (state.clientDecisions) csak az adminban él: a szerver nyilvános
     nézete (publicState) nem adja ki.
   ========================================================================== */

export const DECISION_STATUS = {
  nyitott: 'Nyitott – még nincs válasz',
  valasz: 'Válasz rögzítve – még nincs átvezetve',
  atvezetve: 'Átvezetve a rendszerbe',
};

const srcOf = (st, path) => (st.materials.src || {})[path];
const gramTxt = (st, k) => {
  const v = st.materials.sellPerGram?.[k];
  const src = srcOf(st, `sellPerGram.${k}`);
  return v ? `${new Intl.NumberFormat('hu-HU').format(v).replace(/\s/g, ' ')} Ft/g – ${src === 'jovahagyott' ? 'jóváhagyottként jelölve' : 'NEM jóváhagyott (példa / megerősítendő)'}` : 'nincs megadva → egyedi ajánlat';
};

/** A tételek. A `now` az aktuális értéket írja le (függvény esetén az aktuális adatból számolva). */
export const DECISION_GROUPS = [
  { id: 'arculat', title: 'Arculat', items: [
    { id: 'logo', label: 'Logó (A vagy B változat)', now: 'Két javaslat: A – sötét alapon arany jel, B – kék alapon. Mindkettő az ügyfél e-mailben küldött logói alapján rajzolva újra.', source: 'Ügyfél e-mailje (2026.11.19.), két logófájl', question: 'Melyik változat legyen a végleges? Rendben van-e az újrarajzolt gyémántos jel?', where: '#/admin/kozpont' },
    { id: 'szlogen', label: 'Szlogen', now: 'Nincs szlogen a fejlécben. Korábbi DAEKON-javaslat: „Két gyűrű, egy igen”.', source: 'DAEKON javaslata, nem az ügyfélé', question: 'Legyen-e szlogen? Ha igen, mi?' },
    { id: 'megszolitas', label: 'Megszólítás (tegező / magázó)', now: 'Az oldal tegez („Karikagyűrű, amit az ötvössel együtt tervezel.”).', source: 'V5.7 megbízás', question: 'Tegezve vagy magázva szóljon a vásárlókhoz?' },
  ] },
  { id: 'szakmai', title: 'Szakmai adatok', items: [
    { id: 'arany', label: '14K és 18K arany grammára', now: (st) => `14K: ${gramTxt(st, 'au14')}. 18K: ${gramTxt(st, 'au18')}.`, source: 'Az ötvös kézzel írt példája (a pontos számok nem nyilvánosak)', question: 'Mennyi a 14K és a 18K bruttó grammár? Mikortól érvényes?', where: '#/admin/alapanyag' },
    { id: 'platina', label: 'Platina', now: (st) => `${gramTxt(st, 'pt')}. Csak fehér színben.`, source: 'Átirat: platinából csak fehér gyűrű', question: 'Mennyi a platina grammára? Minden modellnél kínálja?', where: '#/admin/alapanyag' },
    { id: 'palladium', label: 'Palládium', now: (st) => `${gramTxt(st, 'pd')}. Csak fehér színben.`, source: 'Átirat: palládiumból csak fehér gyűrű', question: 'Mennyi a palládium grammára? Minden modellnél kínálja?', where: '#/admin/alapanyag' },
    { id: 'titan', label: 'Titán', now: 'Nincs grammár; mindig egyedi ajánlat.', source: 'A régi weboldal szövege', question: 'Kínál-e titán gyűrűt? Maradjon egyedi ajánlat?' },
    { id: 'acel', label: 'Acél', now: 'Az oldal NEM kínálja. A régi lábléc még említette – ezt V5.8-ban kivettük.', source: 'A régi weboldal lábléce', question: 'Kínál-e acél gyűrűt? Ha igen, milyen áron és milyen modellekből?' },
    { id: 'gyemant', label: 'Gyémántméretek és árak', now: (st) => { const d = st.materials.diamonds || []; return `${d.length} kőméret, ebből ${d.filter((x) => x.src === 'jovahagyott').length} jóváhagyott áru. A többinél „egyedi ajánlat”.`; }, source: 'Ötvös példája; a többi demó', question: 'Milyen kőméreteket használ, és mennyi a kövenkénti ár (minőséggel)?', where: '#/admin/alapanyag' },
    { id: 'gravir', label: 'Gravírozás', now: (st) => (st.settings.engravingPrice === null || st.settings.engravingPrice === undefined ? 'Nincs ár megadva. A vásárló kérésként jelezheti; az oldal kiírja, hogy az ár ezt nem tartalmazza.' : `Ár: ${st.settings.engravingPrice} Ft / gyűrű`), source: 'Nincs megerősítve', question: 'Kínál-e gravírozást? Mennyiért, milyen betűtípussal, hány karakterig?', where: '#/admin/keplet' },
    { id: 'foglalas', label: 'Kőfoglalás díja', now: (st) => (st.settings.settingPerStone ? `${st.settings.settingPerStone} Ft / kő – ${(st.settings.src || {}).settingPerStone === 'jovahagyott' ? 'jóváhagyottként jelölve' : 'nem jóváhagyott'}` : 'Nincs megadva.'), source: 'Nincs megerősítve', question: 'Van-e külön foglalási díj kövenként? Ha igen, mennyi?', where: '#/admin/keplet' },
    { id: 'meret', label: 'Méretszabályok', now: 'Méretlépcső, legkisebb és legnagyobb méret, szélesség- és vastagsághatárok: bemutató szabályok.', source: 'Nincs megerősítve (a 0,5 mm / 3,5 mm szabály nincs az átiratban)', question: 'Milyen méretlépcsőben és milyen határok között dolgozik? Mikor kell egyedi ajánlat?', where: '#/admin/szabalyok' },
    { id: 'evek', label: 'Szakmai múlt', now: 'Az oldal így fogalmaz: „Több évtizedes ötvöstapasztalattal”. Pontos évszám nincs.', source: 'Átirat, pontos szám nélkül', question: 'Hány éve dolgozik ötvösként? Kiírhatjuk-e?' },
  ] },
  { id: 'rendeles', title: 'Rendelési feltételek', items: [
    { id: 'eloleg', label: 'Előleg', now: '„A rendeléskor előleget kérünk; a mértékét a személyes egyeztetésen rögzítjük.”', source: 'Az ÁSZF nem volt elérhető', question: 'Kér-e előleget? Mennyit (százalék vagy összeg)?' },
    { id: 'fizetes', label: 'Fizetési módok', now: 'Az oldal nem nevez meg fizetési módot („egyeztetjük”).', source: 'Nincs megerősítve', question: 'Készpénz, bankkártya, átutalás – mit fogad el?' },
    { id: 'hatarido', label: 'Elkészülési idő', now: '„Az elkészülés várható idejét a rendeléskor egyeztetjük.”', source: 'Nincs megerősítve', question: 'Általában hány hét alatt készül el egy pár?' },
    { id: 'lemondas', label: 'Lemondás, elállás', now: 'Óvatos szöveg; a 14 napos elállási jog a távollévők közötti szerződésre vonatkozik (45/2014. Korm. rendelet).', source: 'Jogszabály; az ÁSZF-et az ügyfélnek kell megerősítenie', question: 'Mi a lemondás rendje személyes rendelésnél? Ki nézi át jogilag?' },
    { id: 'jotallas', label: 'Jótállás', now: '„A hatályos jogszabályok szerint, a jótállási jegyen rögzített feltételekkel.”', source: 'Nincs megerősítve', question: 'Milyen jótállást ad? Van-e saját vállalás a kötelezőn felül?' },
  ] },
  { id: 'technikai', title: 'Technikai adatok', items: [
    { id: 'domain', label: 'Domain', now: 'karikagyuru.com – a mostani oldal fut rajta, nem nyúltunk hozzá.', source: 'Ügyfél', question: 'Ki kezeli a domaint? Hozzáférünk-e a DNS-beállításokhoz?' },
    { id: 'tarhely', label: 'Tárhely', now: 'Nincs kiválasztva. PHP 8.1+ és SQLite kell (lásd TELEPITES.md).', source: '—', question: 'Melyik tárhelyen fusson? Meglévő vagy új?' },
    { id: 'ertesites', label: 'Értesítési e-mail-cím', now: 'Nincs beállítva; a levélküldés ki van kapcsolva.', source: '—', question: 'Melyik címre menjenek az érdeklődések?' },
    { id: 'smtp', label: 'Levelezőszerver (SMTP)', now: 'Nincs beállítva. Engedély nélkül nem küldünk valódi levelet.', source: '—', question: 'Melyik fiókból küldje a rendszer az értesítést? Ki adja meg a jelszót?' },
    { id: 'adatkezeles', label: 'Adatkezelési tájékoztató', now: 'A mostani oldal tájékoztatójára mutatunk. Az új funkciók (képfeltöltés, ajánlatkérés) miatt frissíteni kell.', source: 'karikagyuru.com/adatkezeles.php', question: 'Ki frissíti a tájékoztatót? Mennyi ideig őrizzük az érdeklődéseket és a képeket?' },
    { id: 'aszf', label: 'ÁSZF', now: 'A mostani oldal ÁSZF-jére mutatunk; innen nem volt elérhető, nem néztük át.', source: 'karikagyuru.com/aszf.php', question: 'Kell-e új ÁSZF az új oldalhoz? Ki készíti?' },
    { id: 'fotok', label: 'Termékfotók eredetije', now: 'A 115 gyűrűből 30-nak saját, optimalizált fotója van; 85 fotó a mostani oldalról töltődik be.', source: 'docs/KATALOGUS_JELENTES.md', question: 'Megkaphatjuk-e a fotók eredeti, nagy felbontású fájljait?', where: '#/admin/fotok' },
  ] },
];

export const DECISION_ITEMS = DECISION_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.id })));
export const decisionOf = (st, id) => (st.clientDecisions || {})[id] || { status: 'nyitott', answer: '' };
export const decisionCounts = (st) => {
  const c = { nyitott: 0, valasz: 0, atvezetve: 0 };
  DECISION_ITEMS.forEach((i) => { c[decisionOf(st, i.id).status] += 1; });
  return c;
};
