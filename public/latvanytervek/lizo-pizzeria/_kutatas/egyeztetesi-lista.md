# Lizó Pizzéria – ügyféllel egyeztetendő (belső lista)

Állapot: 2026-11-13. Ezek a pontok **nem** jelennek meg helyettesítő szövegként a látványterven; ahol kellett, a funkció úgy készült, hogy ne állítson valótlant.

## Árak / étlap
1. **Lizo kerék 50 cm = 8 435 Ft** – a többi pizzánál a 32→50 cm felár 1 725–2 778 Ft, itt 3 898 Ft. Valós ár vagy elírás?
2. **Tenger gyümölcse 50 cm = 7 560 Ft**, míg az azonos 32 cm-es árú (4 950) pizzák 50 cm-ben 7 580 Ft. Elírás?
3. **Extra feltétek – IDEIGLENES, nem jóváhagyott adat:** a megbízó közlése alapján beépítve (zöldség 400, hús 800, sajt 800 Ft / feltét; a lista az étlap összetevőiből állt össze). Kérdés: pontos lista, 50 cm-en drágább-e, tükörtojás/olívabogyó/szószok külön kategória-e, burgerre/gyrosra is ugyanez az ár?
4. **Mely összetevők vehetők el** ingyen? A látványterv most az alapot, a tésztát/bucit, a húspogácsát és a gyros húst zárolja, minden mást elvehetővé tesz.
5. **Retro burger „választható húspogácsa”** – milyen húsok közül? (Most: megjegyzésbe írja.)
6. **Gyros tál „választható köret”** – köretlista és felárak? (Most: megjegyzésbe írja.)
7. **Menük üdítője:** melyik kiszerelés (0,33 vagy 0,5 l), mely fajták? (Most: az üdítőkategória fajtái, kiszerelés nélkül.)
8. Duplikált tételek a Falatozz-étlapon (Római, Sonkás, Szalámis, Zoltsy, Hun, Hústorony) – csak hiba, igaz?
9. Pizzánál megmaradjon-e a Kölyök pizza „Édes pizza” külön kategóriaként?

## Rendelés
10. **Kiszállítási díj** zónánként (XVIII. / Gyál / Vecsés) és a **teljes körzetlista** (utcák, irányítószámok). Amíg nincs meg, a felület csak részösszeget mutat („+ díj”, „még nincs benne”); éles rendszerben a teljes fizetendőt a megerősítés előtt közölni kell.
11. **Minimum rendelés** zónánként (a lizopizza.hu szerint kerületenként eltér). Átvételnél van-e minimum? (Most a látványterv csak kiszállításnál ellenőriz, de ezt a felületen nem állítjuk tényként.)
12. **Fizetés átvételkor:** készpénz? kártya a futárnál? SZÉP-kártya? (Most: „Átvételkor fizetek” – általános.)
13. **Személyes átvétel** a Balassa Bálint utcában lehetséges-e, és ugyanabban az időben?
14. **Zárva tartás alatti rendelés:** engedjünk előrendelést, vagy tiltsuk? (Most: előrendelésként rögzíti, jelzi.)
15. Rendelésfelvétel vége 21:40 – ez a konyha zárása vagy az utolsó rendelés időpontja?

## Márka, tartalom
16. **Saját ételfotók** – most nincs fotó az oldalon (sem stock, sem generált); ha jönnek saját képek, az étlapsorokba és a hero mellé beépíthetők.
17. Facebook: a megbízótól kapott link (facebook.com/share/1F5R1QhTbu) be van építve – melyik a hivatalos oldal (lásd 21.)? Instagram / Google-profil van-e?
18. **Cégadatok** (cégnév, székhely, adószám) a lábléchez és a jogi oldalakhoz. A Falatozz-on és a lizopizza.hu adatkezelési tájékoztatójában (ellenőrizve 2026-11-13) „Szekrényes és Gombos DBP Kft.” szerepel – ez a pizzéria cége vagy a platformé?
19. Saját ÁSZF és adatkezelési tájékoztató kell az új rendszerhez (most a jelenlegi lizopizza.hu oldalakra mutat).
20. **Wolt-adatlap létezik** (wolt.com/en/hun/budapest/restaurant/lizo-pizzeria-es-etelbar, Balassa Bálint u. 2-10.): ott a nyitvatartás H–Cs, V 11:00–21:45, P–Szo 10:00–23:15 – a lizopizza.hu 21:40 / 23:00-t ír. Melyik érvényes?
21. **Facebook** (két oldal is fut: facebook.com/LizoPizzeria és /p/Lizo-Pizzéria-és-Ételbár-61550760694849): a DAEKON munkakörnyezetből nem olvasható (robots tiltás). A színeket a megbízó képernyőképe alapján vettük át. **Ajánlások:** a „18 ember ajánlja” szám a megbízó közlése; a véleményszövegek csak a Facebookról szó szerint átvéve, a szerzők nevével kerülhetnek ki – kell hozzá képernyőkép, és érdemes az ügyfél hozzájárulását kérni.

## DAEKON
22. Hozzájárul-e az ügyfél a láblécbeli diszkrét „Weboldal: DAEKON” hivatkozáshoz (daekon.hu)? Most kint van; kérésre egy sor törlésével kivehető.

## Technika (C–D fázis előtt)
23. MHosting csomag: PHP-verzió, MySQL/MariaDB verzió, cron, memória- és futásidő-limit, SSL, SMTP.
24. Védett tesztcím (aldomain) és hozzáférés.
25. **Online fizetés: Novopayment / Saferpay** (a Stripe-terv helyett) – szerződés és licenc (eCommerce vagy Business: API-s visszatérítéshez Business kell), teszt- és éles CustomerId / TerminalId / JSON API hozzáférés a pizzéria vállalkozása nevén, engedélyezett fizetési módok és díjak, ki kezeli a visszatérítést. Részletek: `fizetes-saferpay-terv.md`.
26. Értesítés a konyhának: hangjelzés a tableten, e-mail, SMS? Hány perc után számít „régóta váró” rendelésnek (a látványtervben 3 perc)?
