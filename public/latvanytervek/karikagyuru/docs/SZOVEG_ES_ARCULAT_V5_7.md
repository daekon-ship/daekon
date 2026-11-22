# V5.7 – arculat és magyar szövegaudit

Állapot: **javaslat**, ügyféljóváhagyás nélkül. A vizuális módosítás nem számít jóváhagyásnak.

## Források és állításaik helye

| Forrás | Elérhető? | Mire használtuk |
|---|---|---|
| Személyes beszélgetés átirata (≈1 óra 55 perc) | igen (nem nyilvános) | Tapasztalat („harmincvalahány év” → pontos szám nincs), kéz és eszterga, nyitottság, közönség, nem webshop, elállás miatti offline értékesítés |
| Telefonbeszélgetés | **nincs** | – |
| Kézzel írt árjegyzet | igen (nem nyilvános) | Árképlet-ellenőrzés (V5.6) |
| Régi weboldal (mentés) | igen | Kék arculat (#43BDDB), cégadatok, „Nincs készleten, rendelésre elkészítjük” |
| Ügyfél logói (e-mail, 2026. 11. 19.) | igen – *kocka.jpg*, *gyémántos kék logó.png* (az eredetiek nincsenek a repóban) | Arculati változatok |
| Korábbi igénymátrix, V5.6 dokumentáció és tesztek | igen | Összevetés, regresszió |

A „Két gyűrű, egy igen” **nem az ügyféltől származik**. A DAEKON hozta be a 8f609f8 commitban, se a régi oldalon, se a beszélgetésben nem szerepel. Ezért került ki a fejlécből. Szlogenként csak az ügyfél kérésére jöhet vissza.

## Arculat

- **Eddig:**
  - a fejlécben a „Két gyűrű, egy igen” szöveg volt a márkanév;
  - az embléma a régi oldalról kivágott 176×127-es PNG volt;
  - a láblécben szintén a régi PNG szerepelt;
  - a favicon a régi PNG kicsinyítése volt.
- **Most:**
  - a márkanév **KARIKAGYURU.COM**, olvasható szöveges szóvédjeggyel;
  - mellette vektoros embléma;
  - alatta „Karikagyűrűk · Budapest”.
- **Két változat, ugyanazzal a szerkezettel** – váltás: `?arculat=a` / `?arculat=b`; összevetés: `arculat.html`:
  - **A** – monokróm embléma gyémánttal. A sima *kocka* logó a kék logó gyémántjával, átlátszó háttéren – a felhasználó kérésére.
  - **B** – kék csempe, a *gyémántos kék logó* alapján.
- **A fájlok** arányhű újrarajzolások (`img/arculat/`, generátor: `services/karikagyuru-api/dev/logo_ujrarajzolas.py`):
  - a négyzetek elrendezése, a szürke árnyalatok és a gyémánt helye az eredetiből mérve;
  - a felirat betűi az eredetiben 8 px magasak, ezért azonos stílusban újrarajzolva.
- **Egyik változat sem végleges.**

## Szövegek – régi → új → indok

| Hely | Régi | Új | Miért |
|---|---|---|---|
| Fejléc | Két gyűrű, egy igen / Karikagyűrű-szalon · Budapest | KARIKAGYURU.COM / Karikagyűrűk · Budapest | A márka az ügyfél logóján szereplő név |
| Főoldal – felcím | Karikagyűrűk Budapestről · ötvössel együtt tervezve | Karikagyűrűk és eljegyzési gyűrűk · Budapest | Tárgyszerű, a márkanévtől elkülönül |
| Főcím | Nem kell beérned azzal, ami a vitrinben van. | Karikagyűrű, amit az ötvössel együtt tervezel. | Állító, a valódi értéket mondja ki; nincs vitrin (az ötvösnek nincs készlete) |
| Bevezető | …tervezzünk együtt valami teljesen újat. A gyűrűdnek nem kell hasonlítania senki máséra. | Válassz a modellek közül, és állítsd be rajta, amit a modell enged – vagy hozd el a saját ötleted… | Nem ígér korlátlan módosítást |
| Gombok | Alakítsd a sajátodra / Van egy saját ötletem | Gyűrűt választok / Saját ötletem van | Rövidebb, egyértelmű |
| Nyitómegjegyzés | …ötvössel ülsz le, aki harmincvalahány éve csinálja… | Több évtizedes ötvöstapasztalattal segít megtervezni a gyűrűt… | Pongyola; pontos évszám nincs, ezért nem találtunk ki |
| 1. út | Alakítsd a sajátodra … gravírozás | Választok egy modellt … gyémánt – ahol a modell engedi | A gravírozás nincs megerősítve (nyitott kérdés) |
| Kiemelt modellek | Innen el lehet indulni / Mind a 115 gyűrű | Néhány modell a kínálatból / Az összes gyűrű (115) | Természetesebb |
| Kalkulátor | Próbáld ki, mennyi lenne … gravírozást is | Mennyibe kerülne? … (gravírozás nélkül) | Gravírozás nincs megerősítve |
| Kőváltozatok | A kevesebb is lehet pont tökéletes. | Kő nélkül, egy kővel vagy többel | Közhely helyett konkrét – a szakasz megmaradt, mert az ügyfél kérte, hogy „minden pénztárcának” szóljon |
| Inspiráció | Merre lehet elvinni egy gyűrűt? | Egy gyűrű, sok lehetőség | Természetellenes kérdés |
| Ötvös | Akivel a gyűrűdet kitalálod / Nem eladóval beszélsz… / Nála lehet kísérletezni… csúnya lenne… | Az ötvös / A gyűrűdet közvetlenül az ötvössel tervezheted meg… / A különleges elképzelésekre is nyitott… tartósság, kényelmes viselés, arányok | Felesleges tagadás, hétköznapi, prémiumhoz méltatlan megfogalmazás |
| Ötvös – anyagok | Ezekkel kevés műhely dolgozik – itt igen. | Nemcsak arannyal dolgozik. | Bizonyítatlan piaci összehasonlítás |
| Folyamat | Így megy / Kitalálod … mi visszahívunk / Írásos ajánlat … Előleg: az ár fele | Így készül el a gyűrűtök / Ajánlatot kérsz … felvesszük veled a kapcsolatot / … az előleget és a határidőt ilyenkor egyeztetitek | Nincs visszahívási ígéret; az előleg és az írásos ajánlat nem ellenőrzött állítás |
| ÁSZF-kivonat | Előleg: az ár fele · 3 munkanap · készpénz vagy átutalás | Előleg: a rendeléskor rögzítjük · határidő: egyeztetjük · fizetés módja: egyeztetjük | A régi ÁSZF jelenlegi szövege nem ellenőrizhető; ne legyen tényszerű ígéret |
| Katalógus | … Az ár az alapbeállításra szól. | … Ahol az ötvös már jóváhagyta az árat, a kártyán is látod – a többire egyedi árajánlatot kérhetsz. | Félrevezető volt – sok gyűrűnek nincs jóváhagyott ára |
| Üres találat | Ezekkel a feltételekkel nincs modell. | Nincs találat + tanács + „Saját ötletem van” | Ne legyen zsákutca |
| Termékoldal gombjai | Érdekel ez a gyűrű / Árajánlatot kérek / Személyes konzultációt kérek | Ajánlatot kérek (erre a gyűrűre) / Időpontot kérek | Egységes fogalmak: ajánlatkérés, időpontkérés |
| Árjegyzet | Tájékoztató ár… (ár nélkül is) | Csak akkor látszik, ha van ár | Ár nélkül nem volt mire vonatkoznia |
| Űrlap | Érdeklődés / Érdekel ez a gyűrű? / Kérdésem van | Ajánlatkérés / Ajánlatkérés erre a gyűrűre / Ajánlatot kérek | Egységes fogalmak |
| Sikeres beküldés | Megvan · Köszi, hamarosan hívunk. | Elküldve · Megkaptuk az üzeneted. Hamarosan felvesszük veled a kapcsolatot. | Igényes, határidő-ígéret nélkül |
| Műhelymunka gomb | Ilyet szeretnék | Ebből inspirálódnék | Egyszeri darab, nem újrarendelhető |
| Saját ötlet | Mennyit szánnál rá? · Köszi, …! Hamarosan hívunk. | Milyen árkategóriában gondolkodsz? · Köszönjük, …! Megkaptuk az ötleted. | Túl közvetlen; nincs ígéret |
| Méretsegítő | Széles gyűrűnél gyakran fél–egy mérettel nagyobb kell. | Széles gyűrűnél a viselési érzet más lehet – érdemes kipróbálni. | Nem az ügyfél állítása (V3.2-ben egy hasonló már kikerült) |
| Kapcsolat | …visszahívunk. | …felvesszük veled a kapcsolatot az időpont miatt. | Nincs határidő-ígéret |
| Lábléc | Az árak tájékoztató becslések… | Online csak az ötvös által jóváhagyott tájékoztató ár jelenik meg; a többi gyűrűre egyedi árajánlatot adunk… | Pontos, az árazás tényleges működéséhez igazodik |
| SEO-cím és leírás | Karikagyuru.com – Alakítsd a sajátodra | Karikagyűrűk ötvössel tervezve – KARIKAGYURU.COM, Budapest | Márka, tárgy, hely |
| E-mail-értesítés típusa | Érdeklődés / Konzultáció | Ajánlatkérés (gyűrű) / Időpontkérés | Ugyanazok a fogalmak, mint az oldalon |

**Megtartva:** „Természetes gyémánt”, „Rendelésre készül”, „Kéz és eszterga”, a lábléc cégadatai, „Gyere el, nézd meg élőben”, a műhelymunkák szövegei.

## Bizonyított és ellenőrizendő állítások

- **Bizonyított** (átirat, régi oldal):
  - csak természetes gyémánt;
  - rendelésre készül;
  - platinából és palládiumból csak fehér gyűrű;
  - kéz és eszterga;
  - szakmai kollégát is bevon;
  - időpont-egyeztetéssel hétvégén is.
- **Ügyféllel ellenőrizendő:**
  - a pontos szakmai évek száma;
  - előleg, határidő, fizetési mód;
  - a lábléc „acélból” állítása – a konfigurátorban nincs acél;
  - gravírozás;
  - a tegező megszólítás;
  - a „Két gyűrű, egy igen” szlogen sorsa.

## Vizuális változások

- **Mobil első képernyő:**
  - a főcím és a két vásárlói gomb most az első képernyőn van; a fotó alatta;
  - javítva egy V5.1-ből maradt hiba (`--bar: 52px`), amely mobilon üres sávot hagyott a fejléc fölött, és a fejléc eltakarta a tartalmat.
- **Gombok:** 6 px-es saroklekerekítés; minden gomb legalább 44 px magas – a fejléc gombja eddig 42 px volt.
- **Méretek:** a főcím mérete változatlanul mérsékelt (legfeljebb 44 px). Új arculat vagy betűtípus nem került be (Libre Baskerville + Manrope marad).
