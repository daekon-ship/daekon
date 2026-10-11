# SLY Mobil Gumiszerviz — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/sly-mobilgumi/
Fájlok: `index.html`, `sly.css`, `sly.js` (függőség nélkül), `fonts/` (Archivo var + IBM Plex Sans/Mono, OFL).

## Koncepció (2. kör – „oldalfal”)
- Hero: kódból rajzolt, görgetésre forgó kerék (SLY-feliratos oldalfal, könnyűfém felni, sárga féknyereg, „205/55 R16” méretvonal). Mobilon a kerék felső íve látszik, kifutva.
- Sárga „futófelület” futószalag a szolgáltatásokkal.
- „Az út hozzád”: ragadós jelenet – görgetésre a szervizautó végigmegy az úton, 4 megállóval (hívás → egyeztetés → kiszállás → kész).
- A szervizautó metszetrajza a 4 berendezéssel (kirajzolódó vonalak) + 2 valódi fotó.
- Szolgáltatások: szerkesztett, számozott index (mind a 13), csoportosítva; asztali gépen a sorok fölött a saját fotó követi a kurzort.
- Oldalfal-dekóder: a „205/55 R16 91V · DOT 3824” jelölés részei koppintásra magyaráznak; az R16 az ársorhoz és a kalkulátorhoz visz.
- S.O.S.: elakadásjelző-tábla stílusú hívógomb, 3 lépés, defektárak.
- Árak: kalkulátor méretre skálázódó felnirajzzal + a teljes árlista 6 fülön, nettó/bruttó.
- Munkáink: húzható filmszalag mind a 7 fotóval + nagyító galéria. Flották: rajzolt járműikon-sor + ajánlatkérő.
- Mobilon alsó S.O.S.-sáv (safe-area), elrejtődik a heróban, a kapcsolatnál, gépeléskor és nyitott menünél. `prefers-reduced-motion`: forgás, ragadós jelenet és futószalag kikapcsol.

## Mi van ellenőrizve
- Árak: a brief árlistája tételesen (2025. 02. 01-től visszavonásig). Bruttó = nettó × 1,27, kerekítve.
- Kalkulátor: csak közzétett árak; felárak csak gumiszerelésnél; +50% a szolgáltatásdíjra munkaidőn túl; körzeten kívüli kiszállást nem számol.
- Telefonok: `tel:+36707321908`, `tel:+436765221185`; e-mail: `sly.mobilgumi@gmail.com`; Facebook: facebook.com/Slymobilgumi (a jelenlegi honlapról).
- Vízszintes túlcsordulás nincs 360 / 390 / 430 / 768 / 1440 px-en (géppel mérve). `prefers-reduced-motion` kezelve.

## Ügyféllel egyeztetendő
1. **Fotók:** a jelenlegi honlap 7 munkafotója csak 500×500 px-es eredetiben létezik (WP médiatár). A terv a slymobilgumi.hu-ról tölti be őket (hotlink, nincs helyi másolat — a sandbox nem érte el a domaint). Kellenek nagyobb felbontású saját képek, különösen a **barna Ford Transitról** (hero-jelölt). A sárga szervizautót „archív / korábbi” felirattal mutatjuk.
2. **Képjogok:** az impresszum a fotókra Schmidt Bálint (designbyschmidt.eu) szerzői jogát hirdeti → éles használat előtt engedély kell.
3. **Logó:** a jelenlegi `cropped-logouj.png` világos „rendszámtábla” keretben; vektoros logó kérendő.
4. **Cégadatok:** cégforma (Kft.?), telephely (Bánfalvi út 190. vs. Baross út 24/A) — a terv nem mutat címet. Kétféle e-mail él (gmail és info@slymobilgumi.hu).
5. **Árak 2026-ra:** megerősítendők; a „16 colig / 16 coltól” átfedés változatlanul maradt.
6. **Vélemények:** ellenőrizhető értékelést nem találtunk, ezért nincs véleményszekció. A „terepről” lista a nyilvános FB-bejegyzések munkatípusait foglalja össze idézet nélkül.
7. **Partnerlogók** (Dini Felni, DBS, Nilo, Kir Schnell, Staycar): a régi oldalról — aktuális-e.
8. **Jogi oldalak:** impresszum és adatkezelés ügyféljóváhagyás után (régi adatkezelő: Simon Szilveszter — elavult lehet).
9. **Űrlapok:** bemutató mód — nem küldenek, e-mail-piszkozatot nyitnak. Éleshez háttér kell.
10. A GYIK szakmai állításai (7 °C ökölszabály, osztrák téligumi-szabály nov. 1.–ápr. 15., 1,6 mm profilmélység) a tulajdonossal átnézendők.
