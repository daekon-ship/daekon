# Termékfotók – állapot és hiánylista (V5.10, 2026-11-25)

| | db |
|---|---|
| Gyűrű a katalógusban | 115 |
| Saját, optimalizált helyi fotó (`img/termekek/`, 1600 és 800 px) – **böngészőben igazoltan betölt** | 30 |
| A régi karikagyuru.com-ról töltődő fotó | 85 |
| Ismétlődő kép (két gyűrű ugyanazzal a fájllal) | 0 |

A 30 helyi fotó a karikagyuru.com kezdőlapjának mind a 30 termékével egyezik: cikkszám és fájlnév, ellenőrizve 2026-11-25-én.

**A 85 külső fotó állapota: ebből a környezetből nem ellenőrizhető.**
- A fejlesztői gép hálózata a karikagyuru.com-ot nem éri el (a proxy 403-mal tilt); a böngészős tesztben ezért mind a 85 helyén „Fotó hamarosan” helykitöltő látszik.
- A karikagyuru.com kezdőlapja ugyanebből a mappából (`/public/layout/pictures/karikagyuru/`) szolgálja ki a képeit. Ezért valószínű, de nem igazolt, hogy az ötvös és a látogatók böngészőjében betöltődnek.
- Ha egy kép nem tölt be, a kártyán „Fotó hamarosan” és a cikkszám látszik; a gyűrű kereshető és megnyitható marad.

**Helyi másolat:** csak az ügyfél engedélyével. Ezek az ügyfél saját weboldalán lévő, saját termékfotók.
- Futtatás olyan gépről, ahonnan a karikagyuru.com elérhető (pl. a DAEKON VPS): `node services/karikagyuru-api/dev/foto-ellenorzes.mjs`.
- A szkript letölti, ellenőrzi és optimalizálja a képeket, majd beírja őket a `js/photos.js`-be.
- **Élesítés előtt kötelező**, mert a régi oldal fájljai a csere után eltűnhetnek.

Kitalált vagy generált ékszerfotó nem kerül a katalógusba.

## A 85 gyűrű, amelynek fotója még a régi oldalról töltődik

| # | Cikkszám | Azonosító | Fájlnév a karikagyuru.com-on |
|---|---|---|---|
| 1 | 81204 - 81205 W/Y | maz-81204-81205-wy | karikagyuru_maz_81204_wy_n.jpg |
| 2 | 81206 - 81207 Y/W | maz-81206-81207-yw | karikagyuru_maz_81206_yw_n.jpg |
| 3 | 81208 - 81209 W/Y | maz-81208-81209-wy | karikagyuru_maz_81208_wy_n.jpg |
| 4 | 81210 - 81211 W/Y | maz-81210-81211-wy | karikagyuru_maz_81210_wy_n.jpg |
| 5 | 81212 - 81213 W/Y | maz-81212-81213-wy | karikagyuru_maz_81212_wy_n.jpg |
| 6 | 81214 - 81215 W/Y | maz-81214-81215-wy | karikagyuru_maz_81214_wy_n.jpg |
| 7 | 81216 - 81217 W/Y | maz-81216-81217-wy | karikagyuru_maz_81216_wy_n.jpg |
| 8 | 81218 - 81219 W/Y | maz-81218-81219-wy | karikagyuru_maz_81218_wy_n.jpg |
| 9 | 81632 | maz-81632 | karikagyuru_maz_81632_n.jpg |
| 10 | 82000 - 82001 W | maz-82000-82001-w | karikagyuru_maz_82000_w_n.jpg |
| 11 | 82002 - 82003 W | maz-82002-82003-w | karikagyuru_maz_82002_w_n.jpg |
| 12 | 82004 - 82005 W | maz-82004-82005-w | karikagyuru_maz_82004_w_n.jpg |
| 13 | 82006 - 82007 W | maz-82006-82007-w | karikagyuru_maz_82006_w_n.jpg |
| 14 | 82008 - 82009 W | maz-82008-82009-w | karikagyuru_maz_82008_w_n.jpg |
| 15 | 82010 - 82011 Y | maz-82010-82011-y | karikagyuru_maz_82010_y_n.jpg |
| 16 | 82012 - 82013 Y | maz-82012-82013-y | karikagyuru_maz_82012_y_n.jpg |
| 17 | 82014 - 82015 Y | maz-82014-82015-y | karikagyuru_maz_82014_y_n.jpg |
| 18 | 82016 - 82017 Y | maz-82016-82017-y | karikagyuru_maz_82016_y_n.jpg |
| 19 | 82018 - 82019 Y | maz-82018-82019-y | karikagyuru_maz_82018_y_n.jpg |
| 20 | 82020 - 82021 W/Y | maz-82020-82021-wy | karikagyuru_maz_82020_wy_n.jpg |
| 21 | 82022 - 82023 W/Y | maz-82022-82023-wy | karikagyuru_maz_82022_wy_n.jpg |
| 22 | 82024 - 82025 W/Y | maz-82024-82025-wy | karikagyuru_maz_82024_wy_n.jpg |
| 23 | 82026 - 82027 W/Y | maz-82026-82027-wy | karikagyuru_maz_82026_wy_n.jpg |
| 24 | 82028 - 82029 W/Y | maz-82028-82029-wy | karikagyuru_maz_82028_wy_n.jpg |
| 25 | 82030 - 82031 W/R | maz-82030-82031-wr | karikagyuru_maz_82030_wr_n.jpg |
| 26 | 82032 - 82033 W/R | maz-82032-82033-wr | karikagyuru_maz_82032_wr_n.jpg |
| 27 | 82034 - 82035 W/R | maz-82034-82035-wr | karikagyuru_maz_82034_wr_n.jpg |
| 28 | 82036 - 82037 W/R | maz-82036-82037-wr | karikagyuru_maz_82036_wr_n.jpg |
| 29 | 82038 - 82039 W/R | maz-82038-82039-wr | karikagyuru_maz_82038_wr_n.jpg |
| 30 | 82040 - 82041 W/Y | maz-82040-82041-wy | karikagyuru_maz_82040_wy_n.jpg |
| 31 | 82044 - 82045 W/Y | maz-82044-82045-wy | karikagyuru_maz_82044_wy_n.jpg |
| 32 | 82050 - 82051 W/R | maz-82050-82051-wr | karikagyuru_maz_82050_wr_n.jpg |
| 33 | 82064 - 82065 W | maz-82064-82065-w | karikagyuru_maz_82064_82065_w_n.jpg |
| 34 | 82064 - 82065 W/R | maz-82064-82065-wr | karikagyuru_maz_82064_82065_wr_n.jpg |
| 35 | 82064 - 82065 Y | maz-82064-82065-y | karikagyuru_maz_82064_82065_y_n.jpg |
| 36 | 82064 - 82065 Y/W | maz-82064-82065-yw | karikagyuru_maz_82064_82065_yw_n.jpg |
| 37 | 82070 - 82071 W/R | maz-82070-82071-wr | karikagyuru_maz_82070_82071_wr_n.jpg |
| 38 | 82070 - 82071 Y/W | maz-82070-82071-yw | karikagyuru_maz_82070_82071_yw_n.jpg |
| 39 | 87000 - 87001 W/Y | maz-87000-87001-wy | karikagyuru_maz_87000_wy_n.jpg |
| 40 | 87002 - 87003 W/Y | maz-87002-87003-wy | karikagyuru_maz_87002_wy_n.jpg |
| 41 | 87004 - 87005 W/Y | maz-87004-87005-wy | karikagyuru_maz_87004_wy_n.jpg |
| 42 | 87008 - 87009 W/Y | maz-87008-87009-wy | karikagyuru_maz_87008_wy_n.jpg |
| 43 | 87010 - 87011 W/Y | maz-87010-87011-wy | karikagyuru_maz_87010_wy_n.jpg |
| 44 | 87012 - 87013 W/Y | maz-87012-87013-wy | karikagyuru_maz_87012_wy_n.jpg |
| 45 | 87014 - 87015 W/Y | maz-87014-87015-wy | karikagyuru_maz_87014_wy_n.jpg |
| 46 | 87016 - 87017 W/Y | maz-87016-87017-wy | karikagyuru_maz_87016_wy_n.jpg |
| 47 | 87024 - 87025 Y | maz-87024-87025-y | karikagyuru_maz_87024_y_n.jpg |
| 48 | 87026 - 87027 Y | maz-87026-87027-y | MAZ_87026_Y.jpg |
| 49 | 87028 - 87029 Y | maz-87028-87029-y | karikagyuru_maz_87028_y_n.jpg |
| 50 | 87030 - 87031 Y | maz-87030-87031-y | karikagyuru_maz_87030_y_n.jpg |
| 51 | 87036 - 87037 Y | maz-87036-87037-y | karikagyuru_maz_87036_y_n.jpg |
| 52 | 87040 - 87041 W | maz-87040-87041-w | karikagyuru_maz_87040_w_n.jpg |
| 53 | 87044 - 87045 W | maz-87044-87045-w | karikagyuru_maz_87044_n.jpg |
| 54 | 87048 - 87049 W | maz-87048-87049-w | karikagyuru_maz_87048_w_n.jpg |
| 55 | 87054 - 87055 W | maz-87054-87055-w | karikagyuru_maz_87054_w_n.jpg |
| 56 | 93130 - 93131 | maz-93130-93131 | karikagyuru_maz_93130_93131_n.jpg |
| 57 | 93130 - 93131 R | maz-93130-93131-r | karikagyuru_maz_93130_93131_r_n.jpg |
| 58 | 93130 - 93131 W | maz-93130-93131-w | karikagyuru_maz_93130_w_n.jpg |
| 59 | 93140 - 93141 | maz-93140-93141 | karikagyuru_maz_93140_93141_n.jpg |
| 60 | 93150 - 93151 | maz-93150-93151 | karikagyuru_maz_93150_93151_n.jpg |
| 61 | 93210 - 93211 | maz-93210-93211 | karikagyuru_maz_93210_93211_n.jpg |
| 62 | 93210 - 93211 W | maz-93210-93211-w | karikagyuru_maz_93210_93211_w_n.jpg |
| 63 | 93210 - 93211 Y/V | maz-93210-93211-yv | karikagyuru_maz_93210_93211_yv_n.jpg |
| 64 | 93230 - 93231 | maz-93230-93231 | karikagyuru_maz_93230_93231_n.jpg |
| 65 | 93240 - 93241 | maz-93240-93241 | karikagyuru_maz_93240_93240_n.jpg |
| 66 | 93310 - 93311 | maz-93310-93311 | karikagyuru_maz_93310_93311_n.jpg |
| 67 | 93320 - 93321 | maz-93320-93321 | karikagyuru_maz_93320_93321_n.jpg |
| 68 | 93340 - 93341 | maz-93340-93341 | karikagyuru_maz_93340_93341_n.jpg |
| 69 | 93410 - 93411 | maz-93410-93411 | karikagyuru_maz_93410_93411_n.jpg |
| 70 | 93410 - 93411 Y/R | maz-93410-93411-yr | karikagyuru_maz_93410_93411_yr_n.jpg |
| 71 | 93430 - 93431 | maz-93430-93431 | karikagyuru_maz_93430_93431_n.jpg |
| 72 | 93440 - 93441 | maz-93440-93441 | MAZ93440_W%3AR.jpg |
| 73 | 93450 - 93451 | maz-93450-93451 | karikagyuru_maz_93450_93451_n.jpg |
| 74 | 93510 - 93511 | maz-93510-93511 | karikagyuru_maz_93510_93511_n.jpg |
| 75 | 93510 - 93511 (2. változat) | maz-93510-93511-2-v-ltozat | karikagyuru_maz_93510_93511_2_n.jpg |
| 76 | 93510 - 93511 W | maz-93510-93511-w | karikagyuru_maz_93510_93511_w_n.jpg |
| 77 | 93510 - 93511 W / R | maz-93510-93511-w-r | karikagyuru_maz_93510_93511_wr_n.jpg |
| 78 | 93510 - 93511 Y | maz-93510-93511-y | karikagyuru_maz_93510_93511_y_n.jpg |
| 79 | 93510 - 93511 Y/ W | maz-93510-93511-y-w | karikagyuru_maz_93510_93511_yw_n.jpg |
| 80 | 93530 - 93531 | maz-93530-93531 | karikagyuru_maz_93530_93531_n.jpg |
| 81 | 93530 - 93531 R/W | maz-93530-93531-rw | karikagyuru_maz_93530_93531_rw_n.jpg |
| 82 | 93550 - 93551 | maz-93550-93551 | karikagyuru_maz_93550_93551_n.jpg |
| 83 | 93610 - 93611 | maz-93610-93611 | karikagyuru_maz_93610_93611_n.jpg |
| 84 | 93630 - 93631 | maz-93630-93631 | karikagyuru_maz_93630_93631_n.jpg |
| 85 | 93630 - 93631 W/R | maz-93630-93631-wr | karikagyuru_maz_93630_93631_wr_n.jpg |
