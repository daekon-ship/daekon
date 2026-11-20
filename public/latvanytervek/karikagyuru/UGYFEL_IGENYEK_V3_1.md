# Karikagyuru.com – ügyféligények és megvalósítás (V3.1)

**FONTOS – a forrás korlátja.** Ehhez a körhöz a beszélgetés **hangfelvétele** érkezett meg (`Hang_261119_113549.m4a`, 1 óra 55 perc) és a V3.1 feladatleírás. A hivatkozott szöveges átirat (`Karikagyuru_ugyfelbeszelgetes_TELJES_UTF8.txt`) és a kézírásos jegyzet képe (`Karikagyuru_kezi_arjegyzet.jpg`) **nem érkezett meg**. Hangfájlt a fejlesztőkörnyezet nem tud leiratozni, ezért a felvételt **nem tudtuk feldolgozni**.

Ez a mátrix tehát **ideiglenes**: az igények és az időkódok a DAEKON feladatleírásaiból (V2, V2.1, V3, V3.1) származnak, nem az átirat saját olvasásából. A „Bizonyíték” oszlop ezért a feladatleírás állítását idézi. Amint a szöveges átirat megvan, a mátrixot soronként ellenőrizni kell, és ki kell egészíteni a feladatleírásokban nem szereplő igényekkel.

Állapotok: **Kész** = működik a látványtervben · **Demó** = működik, de kitalált adattal vagy csak a böngészőben · **Jóváhagyandó** = az ötvös döntése kell · **Hiány** = nincs meg.

| # | Igény | Időkód (a feladatleírás szerint) | Bizonyíték (feladatleírás) | Megvalósítás most | Állapot | Teendő / kérdés |
|---|---|---|---|---|---|---|
| 1 | Nem webshop: nincs kosár, fizetés, készlet | 00:44–00:49 | „az online rendelés korlátai”, személyes konzultáció | Nincs kosár és fizetés; a fő gombok érdeklődést és konzultációt kérnek | Kész | – |
| 2 | Lépésenkénti konfigurátor | 00:44–00:48 | „lépésenkénti konfigurátor” | Anyag → finomság → szín → méret → gyémánt → gravírozás → összefoglaló | Kész | – |
| 3 | Anyagok: 14K, 18K, platina, palládium, titán; 24K csak alap | 00:00–00:26 | anyagok, tömeg, méretezés | Modellenként állítható anyaglista; 9K nincs | Demó | Melyik modell miből készülhet? |
| 4 | Ár = tömeg × grammár, méret szerint arányosan | 00:00–00:26 + jegyzet | 4,8 × 47 000 = 225 600; 6,9 × 55 000 = 379 500; × 48/54; × 60/54 | A motor pontosan így számol; tesztek ellenőrzik | Kész (példák), Demó (többi grammár) | 18K, palládium, titán grammára |
| 5 | A 60-as platina 442 000 Ft a jegyzetben | jegyzet | a lineáris számítás 421 667 Ft | Nincs beállítva, az adminban kiemelve | Jóváhagyandó | Melyik a helyes és miért? |
| 6 | Azonos karátnál a szín nem változtat az árat | 00:00–00:26 | V2-leírás | Így működik, teszt ellenőrzi | Kész | – |
| 7 | Csak természetes gyémánt | 00:00–00:26 | „természetes gyémánt, kőméretek és árpéldák” | Minden köves helyen kiírva; kőárak a jegyzetből | Kész (0,01–0,03 ct), Jóváhagyandó (0,04; 0,05 ct) | 0,04 ct: 24 000 vagy 20 000 Ft? 0,05 ct ára? |
| 8 | Modellenként eltérő kőszám és kőméret; fizikai korlátok | 00:26–00:44 | „kőszám, foglalási lehetőségek és modellenkénti fizikai korlátok” | Kőszabály modellenként; be nem férő kő nem választható | Demó | A szabályok becslések, „demó kőszabály” jelöléssel. Modellenként kell az ötvöstől. |
| 9 | Foglalási lehetőségek bemutatása | 00:26–00:44 | „foglalási lehetőségek” | Csak szövegesen, az egyedi kérésnél | Hiány | Milyen foglalásokat vállal? Van róluk fotó? |
| 10 | Női és férfi gyűrű külön szerkeszthető | 00:36–00:40 | V3-leírás | Méret, szélesség, kő, gravír gyűrűnként külön | Kész | – |
| 11 | Férfigyűrű kövezése: se automatikus igen, se nem | – | V3.1-leírás 2. pont | Ahol nincs szabály: „kérd egyedi egyeztetéssel” | Kész | Modellenként: kerülhet-e bele kő? |
| 12 | A vásárló kísérletezhet és közösen tervezhet | 01:26:56–01:27:18 | „kísérletezhet és közösen tervezhet vele” | Főcím, két út, „Saját ötlet” oldal, „Másképp képzelted el?” | Kész | A szövegek hangjának jóváhagyása |
| 13 | Nem minden valósítható meg; az ötvös dönt | 01:16–01:30 | „az ötvös szakmailag dönti el, mi kivitelezhető” | V3.1-ben javítva: nincs „bármelyiken változtathatsz”; a konfigurátorban külön „Amit itt te állíthatsz” és „Amit külön egyeztetünk” | Kész | – |
| 14 | Nem mindig ugyanaz az ötvös készíti; kollégát is bevon | 01:16–01:30 | „szakmai kollégák bevonásáról is szó van” | V3.1-ben javítva: kikerült az „ugyanaz az ember készíti” állítás; bekerült: „ha egy munkához az kell, szakmai kollégát is bevon” | Kész | A megfogalmazás jóváhagyása |
| 15 | Több mint 30 év tapasztalat | – | V3-leírás | Hero-megjegyzés és ötvös-szekció | Jóváhagyandó | Pontos szám, megfogalmazás, név |
| 16 | Gépi és kézi munka együtt | 01:34–01:39 | „kézi és gépi megmunkálás” | „Gép és kéz együtt” – nem állítjuk, hogy minden kézzel készül | Kész | – |
| 17 | Fiatal vásárlók megszólítása | 01:10–01:15 | „fiatal vásárlók megszólítása” | Tegeződő, mai szövegek | Jóváhagyandó | Maradhat a tegeződés? |
| 18 | Különböző költségkeretek | 01:10–01:16 | „különböző árkategóriák kiszolgálása” | „A kevesebb is lehet pont tökéletes” élő árakkal; opcionális keret az űrlapon | Demó | A keretsávok és a példaváltozat jóváhagyása |
| 19 | Különleges, nem megismételhető darabok | 01:40–01:46 | „különleges, nem megismételhető gyűrűk” | Inspirációs irányok a katalógus fotóival, szövegben említve | Hiány (fotók) | Korábbi egyedi munkák fotói |
| 20 | Új modellek és fotók felvitele | 01:40–01:46 | „új modellek és fotók hozzáadása” | Admin: új gyűrű felvitele képpel, megjelenik a katalógusban | Demó | Csak a böngészőben tárolódik; éleshez szerver kell |
| 21 | Egy helyen átírható árak, automatikus átárazás | – | V2-leírás | Admin „Árak”: grammár, alapanyag, kőárak, előnézet, napló, visszaállítás | Demó | – |
| 22 | Műhelymunka bemutatása | 01:30–01:47 | „műhelymunka” | Csak szöveg | Hiány (fotók) | Műhelyfotók, portré |
| 23 | Megállapodás a további munkáról | 01:53–01:55 | „ne kezelj jóváhagyás nélküli teljes éles rendszert megrendeltnek” | Minden demóként jelölve; éles rendszer nem készült | – | A következő lépésről az ügyféllel kell megállapodni |

## Amit a szöveges átirat nélkül nem lehetett ellenőrizni
- Vannak-e a beszélgetésben olyan igények, amelyek egyik feladatleírásban sem szerepelnek.
- Az időkódok pontossága és a parafrázisok hűsége.
- A kézírásos jegyzet számai (a V2.1-leírás átírását használtuk).
- Az ötvös pontos szóhasználata, amelyből a szövegek hangját érdemes venni.
