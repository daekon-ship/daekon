# Karikagyuru.com – átadás (1. kör, 2026.11.18.)

Élő előnézet: https://daekon-ship.github.io/daekon/latvanytervek/karikagyuru/
Build nélküli, önálló mappa (`index.html` + `css/` + `js/` + `fonts/`), `noindex`.

## Mi működik ténylegesen

| Rész | Hol | Állapot |
|---|---|---|
| Kezdőoldal (hero, kollekciók, kiemelt modellek, egyedi készítés, miért személyesen, kalkulátor-előzetes, kapcsolat) | `#/` | kész |
| Kollekció 30 valós cikkszámmal + 2 jelölt ezüst demótermékkel, szűrők (szín, 14K/18K, kő, stílus, típus, szélesség, ártartomány), rendezés | `#/kollekcio` | kész |
| Termékoldal + konfigurátor: szín, finomság, a két gyűrű külön mérete/szélessége/köve/gravírozása, animált ár, mobil árcsík | `#/gyuru/<id>` | kész |
| Érdeklődés / időpontkérés a cikkszámmal és a konfigurációval előtöltve | modal | **demó: nem küld adatot**, az admin „Érdeklődések” listájába kerül |
| Admin 7 menüvel (Áttekintés, Alapanyagárak, Gyűrűk kezelése, Árképletek és munkadíjak, Érdeklődések, Árváltozási előzmények, Beállítások) | `#/admin/...` | kész, bejelentkezés nélkül |
| Alapanyagár-módosítás: hatás-előnézet (érintett db, átlagos %, 5 példa régi→új), érvényességi nap, nagy változás külön megerősítése, Mégsem / Új árak alkalmazása, visszavonás | `#/admin/alapanyag` | kész |
| Egyedi ár: képlet / képlet ± % / rögzített ár, minimumár, alacsony árrés figyelmeztetés | `#/admin/gyuru/<id>` | kész |
| Ajánlati ár rögzítése érdeklődésnél (az aranyár-változás nem írja felül) | `#/admin/erdeklodesek` | kész |
| Napló (ki, mikor, mit, hány gyűrű, összeg) + visszaállítás | `#/admin/elozmenyek` | kész |
| Bemutató-sáv: Vásárlói ↔ Adminisztrátori nézet, Forgatókönyv (7 lépés), Demóadatok visszaállítása | felül | kész |

Az állapot közös (`js/store.js`, `localStorage` kulcs: `karikagyuru-demo-v1`) – csak az adott böngészőben él. **Nincs** szerveroldali adatbázis, jogosultság vagy e-mail-küldés; a felület ezt ki is írja.

## Bemutató forgatókönyv (kb. 3 perc)
1. Vásárlói nézet → Kollekció. 2. MAZ 81184 - 81185 W megnyitása (410 500 Ft). 3. Felső sáv: Adminisztrátori nézet. 4. 24K színarany: 39 000 → 45 000 Ft/g (vagy „Kipróbálom” gomb). 5. Új árak alkalmazása (30 gyűrű, átlag +8,8%). 6. „Megnézem a katalógusban”. 7. A kártyákon „Frissült ár”, az ár felszámol 441 500 Ft-ra.
Utána: „Demóadatok visszaállítása”.

## Árképlet (`js/engine.js`, tiszta függvények)
```
tömeg = alaptömeg(14K, ref. méret) × méret/refméret × szélesség/refszélesség × (18K ? 1,17 : 1)
nemesfém  = tömeg × finomság(0,585 | 0,75) × 24K ár × (1 + veszteség%)
ötvözet   = tömeg × (1 − finomság) × ötvözetár(szín) × (1 + veszteség%)
kövek     = darabszám × kategória-egységár   (nem grammár)
alap      = nemesfém + ötvözet + munkadíj (fix Ft) + kőfoglalás + gravír + doboz + tanúsítvány + egyéb
nettó     = alap × (1 + fém/munka felár%) + kövek × (1 + kőfelár%)
kalkulált = felfelé kerekítve( nettó × (1 + ÁFA%) )
megjelenő = felülbírálás (rögzített / ±%) → minimumár-védelem
```
Árrés = (nettó végár − önköltség) / nettó végár; a beállított minimum alatt figyelmeztet.
A nyilvános felület csak a végső becsült árat, a paramétereket és a becsült tömeget mutatja – felárat, beszerzési árat, önköltséget nem.

## Valós vs. demó adat
- **Valós** (karikagyuru.com, 2026.11.18.): 30 cikkszám, a mostani weboldali árak (`listaAr`, csak az adminban, összehasonlításhoz), képfájlnevek, cím (1089 Budapest, Bláthy Ottó utca 4–8.), telefon (+36 30 984 3090), e-mail, „időpont-egyeztetés után bármikor, akár munkaidő után vagy hétvégén is”, anyagválaszték, természetes gyémántok, „rendelésre elkészítjük”, közösségi linkek, ÁSZF/adatkezelés linkek.
- **Demó** (kitalált, egyeztetendő): minden alapanyagár (39 000 Ft/g arany, 500 Ft/g ezüst, kőárak, ötvözetek), felárak, munkadíjak, díjak, a terméknevek (cikkszám-végződésből: W = fehér, Y = sárga, W/Y = kétszínű), stílus, szélesség, kőszám/kategória, tömegek. A tömegeket a rendszer a kezdő demóárakból úgy számolja vissza (`seedWeights`), hogy a kalkulált ár ~1%-on belül a mostani weboldali ár legyen – így a bemutatón ismerős árak jelennek meg.
- Két ezüst demótermék (`DEMÓ AG 01/02`), hogy az ezüstár-módosítás is látható legyen; nem a katalógus része.
- Árak mellett „demó” jelölés (Beállítások → kikapcsolható).

## Képek és logó (2. kör, 2026.11.18.)
- A 30 termékfotó és a logó az ügyfél által küldött mentett oldalról (`Karikagyuru.com.mht`) került ki, és helyben van: `img/termekek/` (a 79014-es fotó 1000 px-re kicsinyítve, a KETS-fotóról levágva a vékony keret), `img/logo.png` (eredeti), `img/logo-jel.png` (gyémánt + jel, a fejlécben a szóvédjegy mellett), `img/logo-vilagos.png` (invertált, sötét láblécre), favicon és apple-touch-ikon a jelből. Hotlink már nincs.
- A fotók alapján javítva: MAZ 79016-79017 rozéarany pár (eddig fehérként szerepelt), a 79008, 79014 és 81169 pár, a 79014 és 81169 kő nélküli; a kövek darabszáma a fotóról becsült (egyeztetendő), a kő mérete demó.
- A fotók 600×600 px körüliek, a legtöbbön „www.karikagyuru.com” vízjel; éleshez nagyobb felbontású, vízjel nélküli képeket és modellenként több nézetet kérünk.
- A logó 270×146 px-es PNG; éleshez vektoros (SVG) újrarajzolás javasolt.
- Tartalékként marad a programból rajzolt, színhelyes gyűrűkép (a „Színminta” nézet és az ezüst demótermékek).

## Art direction – három irány, a választott
1. **Vitrin (választott)** – elefántcsont/pezsgő/homok, egyetlen meleg arany hajszálvonal-szín, a gyűrű kör alakú „talapzaton”, a magyar fémjel (585/750) bélyegként visszatérő motívum. A brief luxusirányához ez illik a legjobban, és a gyűrű marad a főszereplő.
2. Ötvösműhely – sötét dió, kovácsolt textúrák, műhelyfotók. Elvetve: nincs valódi műhelyfotó, és a brief világos alapot kér.
3. Esküvői meghívó – letterpress, kézírásos díszítés. Elvetve: túl dekoratív, könnyen sablonos „esküvői” hangulatú lesz.

## Designrendszer
- Betűk: Bodoni Moda (címek, árak; 400) + Jost (szöveg, UI) – helyben (`fonts/`, OFL). Mérsékelt méretek: h1 max ~50 px, h2 max ~34 px. Admin alapméret 18,4 px.
- Színek: `--ivory #FAF6EE`, `--paper #F3ECDF`, `--champ #EBE0CC`, `--sand #DDCDB1`, `--ink #26201B`, `--gold #A07A43`, `--gold-l #C9A66B`, vonal `rgba(122,90,44,.22)`.
- Térköz: 8 / 16 / 24 / 40 / 64 / szekció 72–128 px; konténer 1240 px.
- Komponensek: fémjel-bélyeg, szegmentált választó, aranyszín-minta (fémes gradiens), chip, léptető, kártya, admin mező ± gombokkal, hatáspanel.
- Reszponzív: 1100 / 960 / 640 / 380 px töréspontok; mobilon menü teljes képernyőn, szűrők alsó lapként, ár + „Érdeklődöm” alsó sávban (a tartalom alatta kap helyet), admin menü vízszintesen görgethető, nagy gombokkal.

## Animációk (Motion 11, helyben: `js/vendor/`)
- Betöltés: hero-elemek lépcsőzetes felúszása, a talapzat kirajzolódó „pályagyűrűje” (pathLength), felirat-kártya beúszik.
- Görgetés: `inView` alapú finom felúszás (data-reveal).
- Interakció: ár felszámolása régi→új értékre, kártyák „Frissült ár” jelzése alapanyagár-változás után, nézetváltásnál halvány átúszás, modal belépés, jóváhagyás-pipa rugós animáció.
- `prefers-reduced-motion` esetén minden animáció kikapcsol. Nincs scrolljacking, nincs blokkoló betöltő.

## Éles rendszerhez kell (nincs benne)
Bejelentkezés és szerepkörök; szerveroldali adatbázis (termékek, árak, napló); szerveroldali árképzés és naplózás; érdeklődés e-mail/SMS értesítéssel; képfeltöltés; adatkezelési hozzájárulás az űrlapon; mentés. React + TypeScript + Tailwind portolás a meglévő tiszta motorral (`engine.js` változtatás nélkül átvihető).

## Ügyféllel egyeztetendő
- Valós tömegek, szélességek, kövek, finomság-elérhetőség modellenként; terméknevek.
- Valós munkadíjak, felárak, kerekítési szabály, ÁFA-kezelés, díszdoboz/tanúsítvány.
- Melyik gyémántkategóriákat használja, milyen minőségben.
- Kér-e rozéarany/18K opciót minden modellhez; platina, palládium, titán, acél kollekció.
- Fotók (több nézet, nagy felbontás), logó (most tipográfiai szóvédjegy + két karika jel).
- Érdeklődés: telefon vagy űrlap legyen-e az elsődleges.
