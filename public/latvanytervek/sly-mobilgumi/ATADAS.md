# SLY Mobil Gumiszerviz — látványterv, átadás

Élő cím: https://daekon-ship.github.io/daekon/latvanytervek/sly-mobilgumi/
Fájlok: `index.html`, `sly.css`, `sly.js`, `sly-motion.js` (GSAP-jelenetek), `js/` (GSAP 3 + ScrollTrigger, helyben), `fonts/` (Archivo var + IBM Plex Sans/Mono, OFL).

## Koncepció (3. kör – fotóközpontú, filmszerű)
- **Nyitójelenet (asztali, rögzített):** a saját munkafotó egy forgó, SLY-feliratos abroncs „ablakán” át látszik; görgetésre az ablak kitágul, a fotó kitölti a képernyőt (fekete–sárga duotón, raszterpont, filmszemcse – így az 500 px-es eredeti is vállalható nagyban), majd megjelenik: „A műhely jön. Te maradsz.” Mobilon a kerék-ablak statikus, a szöveg alatta.
- **Kijelentés:** a „Miért mobil?” mondat görgetésre szavanként gyúl ki, két saját fotó parallaxban lebeg mellette.
- **Két út:** teljes szélességű, fotós plakát-panelek – sárga duotón „Tervezett” és vörös duotón „S.O.S.”; rámutatásra a kiválasztott kiszélesedik.
- **Munkáink (asztali):** függőleges görgetés → vízszintes, rögzített fotósín számlálóval (01/07), képenkénti mélységi zoommal. Mobilon húzható szalag.
- Megmaradt és finomodott: „Az út hozzád” jelenet mozgó szervizautóval, metszetrajz, 13 tételes szolgáltatás-index kurzort követő fotóval, oldalfal-dekóder, méretre skálázó kalkulátor, teljes árlista, flották, GYIK, kapcsolat.
- Tipográfia: keskeny, nagybetűs Archivo plakátcímek (mérsékelt méret), IBM Plex szöveg. Mozgás: GSAP + ScrollTrigger helyben (`js/`), `prefers-reduced-motion` esetén minden jelenet statikus.

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
