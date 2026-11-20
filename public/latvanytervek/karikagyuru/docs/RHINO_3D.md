# Rhino 3D-modellek a weboldalon – előkészítés

**Állapot: előkészítés. Az oldalon jelenleg nincs 3D-megjelenítés, és nincs Rhino-integráció.**
Valódi `.3dm` fájlt ehhez a munkához nem kaptunk, tehát az alábbi folyamat nincs az ötvös saját
modelljein kipróbálva. A lépések a Rhino és a three.js hivatalos dokumentációján alapulnak.

## 1. Alapszabály: a CAD-fájl nem kerül a webre

- Az eredeti `.3dm` gyártási terv, szellemi tulajdon. **Nem kerül nyilvános tárolóba, sem a webszerverre.**
- A weboldal csak egy ebből készített, egyszerűsített **megjelenítési modellt** (GLB) kap. Ebből
  gyártani nem lehet: háromszögháló, nincs benne a pontos NURBS-felület.
- A `.3dm` fájlok az ötvösnél (vagy zárt, privát tárhelyen) maradnak.

## 2. Ami már megvan az adatmodellben

Minden terméknél van `models3d` lista (admin: gyűrű szerkesztése → 3D-modellek). Ma az admin a
megnevezést és a fájl webcímét tudja rögzíteni; a vásárlói oldal ezeket **még nem jeleníti meg**.

```js
// ami ma tárolódik
{ id: 'm1a2b3', label: '14K, 10 kővel', url: '', metals: [], stones: 'any' }

// tervezett bővítés a megjelenítéshez (még nincs megvalósítva)
{
  ring: 'w',                                  // női / férfi gyűrű
  width: 3.5, thick: 1.5,                     // melyik méretváltozatot ábrázolja
  stones: { count: 10, cat: 'd01' },          // melyik kőváltozatot
  parts: { band: 'Gyuru', stones: 'Kovek' },  // a GLB-ben így hívják a részeket (anyagcseréhez)
  source: '79000-noi.3dm',                    // csak a forrásfájl NEVE; maga a fájl nincs feltöltve
  approved: false                             // az ötvös jóváhagyta-e, hogy ez látszhat
}
```

A vásárló beállítása (fém, szín, méret, szélesség, vastagság, kőszám, kőméret, gravírozás) ma is egy
rövid kódba menthető (`encodeCfg` / `decodeCfg`), ez megy az ajánlatkéréssel. Ugyanebből a beállításból
választható majd ki a megfelelő 3D-változat, és ugyanez adható át később egy parametrikus modellnek.

## 3. Hogyan lesz a `.3dm`-ből webes modell

1. **Rhinóban rendbe tenni a modellt:** külön réteg/objektum a gyűrűtestnek és a köveknek, értelmes
   nevekkel (ezekre hivatkozik a `parts`). Egység: mm. A gyűrű tengelye legyen egységes minden modellnél.
2. **Hálósítás:** a NURBS-felületből háló készül. A finomság a döntő: a túl durva háló szögletes,
   a túl finom lassú. Kiinduló cél: 1–3 MB alatti fájl gyűrűnként, telefonon is.
3. **Export GLB-be:** a Rhino 8 beépítve ment `.glb`/`.gltf` formátumba (File → Export Selected).
   Érdemes bekapcsolni a „Map Rhino Z to glTF Y” beállítást, mert a glTF-ben az Y tengely néz felfelé.
4. **Tömörítés:** Draco vagy Meshopt (pl. a `gltf-transform` eszközzel). A megjelenítőnek ismernie kell
   a választott tömörítést.
5. **Anyagok a weben, nem a fájlban:** a fém színét (sárga, fehér, rozé arany, platina) és a kő
   megjelenését a weboldal adja a rész neve alapján. Így **egy** GLB elég fémenként külön fájl helyett.
6. **Megjelenítés:** three.js `GLTFLoader`, forgatható nézet, környezeti megvilágítás (HDR) a fém
   tükröződéséhez. A könyvtár és a modell csak akkor töltődik be, amikor a vásárló megnyitja a 3D-nézetet.
   Ahol nincs WebGL vagy a modell hiányzik, a mostani fotó + szemléltető ábra marad.

Kisebb darabszámnál a 3–4. lépés kézzel megy; sok modellnél Rhino-szkripttel (RhinoCommon / Python)
kötegelve. Létezik `.3dm` közvetlen böngészős betöltése is (rhino3dm + three.js `Rhino3dmLoader`),
de ahhoz a gyártási fájlt kellene a webre tenni – **ezt nem javasoljuk**.

## 4. Változatok fém, kő és méret szerint

| Mi változik | Hogyan kezeljük | Kell új modell? |
|---|---|---|
| Fém, szín | anyagcsere a weben | nem |
| Kő megjelenése | anyagcsere a weben | nem |
| Kőszám, kőméret | külön `models3d` elem változatonként, vagy a kövek ki-be kapcsolása név szerint | általában igen |
| Szélesség, vastagság | külön modell engedélyezett értékenként (ha az ötvös engedi az állítást) | igen |
| Ujjméret | a nézetben nem kell pontosan követni (a szemnek alig látszik) | nem |

Szabály marad: amit az ötvös nem hagyott jóvá, az 3D-ben sem választható, és a 3D-kép **szemléltetés**,
nem gyárthatósági igazolás.

## 5. Később: parametrikus tervező (Grasshopper)

- **Rhino.Compute:** a Rhino/Grasshopper szerveren fut, a weboldal paramétereket küld, hálót kap vissza.
  A McNeel szerint szerveres üzemhez core-hour (magóra-alapú) díjazás kell, jelenleg 0,10 USD magonként
  óránként. Ez folyamatos költség és külön üzemeltetés – **nem része az első átadásnak**, és szolgáltatást
  ehhez nem vásároltunk.
- **Alternatíva:** előre legyártott változatok (a 4. pont szerint) – nincs futó szerver, nincs havi díj,
  cserébe csak az előre elkészített kombinációk láthatók. Kis modellszámnál ez a reális első lépés.
- **Rhino-fájl generálása a vásárló beállításából:** csak Rhino.Compute-tal vagy az ötvös gépén futó
  szkripttel. A kapott fájl kiindulás, **nem kész gyártási terv** – az ötvös ellenőrzése nélkül nem gyártható.

## 6. Mi kell az ötvöstől, hogy ezt el lehessen kezdeni

1. 2–3 jellemző modell `.3dm` fájlja **privát csatornán** (nem a nyilvános tárolóba).
2. Rhino-verzió, és hogy van-e Grasshopper-definíció a gyűrűkhöz.
3. Hogyan vannak a modellek felépítve (rétegek, külön kő-objektumok).
4. Mely modelleknél szeretne 3D-nézetet, és mely változatokban.
5. Hozzájárulás ahhoz, hogy az egyszerűsített megjelenítési modell nyilvánosan letölthető lesz
   (a böngészőbe letöltött GLB-t technikailag el lehet menteni).

## Források

- Rhino 8 súgó – glTF import/export: https://docs.mcneel.com/rhino/8/help/en-us/fileio/gltf_import_export.htm
- Rhino.Compute – licenc és díjazás: https://developer.rhino3d.com/guides/compute/core-hour-billing/
- Rhino.Compute – GYIK: https://developer.rhino3d.com/guides/compute/compute-faq/
