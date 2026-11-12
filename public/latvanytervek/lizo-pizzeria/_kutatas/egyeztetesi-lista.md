# Lizó Pizzéria – ügyféllel egyeztetendő (belső lista)

Állapot: 2026-11-12. Ezek a pontok **nem** jelennek meg helyettesítő szövegként a látványterven; ahol kellett, a funkció úgy készült, hogy ne állítson valótlant.

## Árak / étlap
1. **Lizo kerék 50 cm = 8 435 Ft** – a többi pizzánál a 32→50 cm felár 1 725–2 778 Ft, itt 3 898 Ft. Valós ár vagy elírás?
2. **Tenger gyümölcse 50 cm = 7 560 Ft**, míg az azonos 32 cm-es árú (4 950) pizzák 50 cm-ben 7 580 Ft. Elírás?
3. **Feltét-hozzáadás:** van-e feláras extra feltét-lista (pl. +sajt, +bacon)? Ha igen, tételesen árral, 32/50 cm-re külön.
4. **Mely összetevők vehetők el** ingyen? A látványterv most az alapot, a tésztát/bucit, a húspogácsát és a gyros húst zárolja, minden mást elvehetővé tesz.
5. **Retro burger „választható húspogácsa”** – milyen húsok közül? (Most: megjegyzésbe írja.)
6. **Gyros tál „választható köret”** – köretlista és felárak? (Most: megjegyzésbe írja.)
7. **Menük üdítője:** melyik kiszerelés (0,33 vagy 0,5 l), mely fajták? (Most: az üdítőkategória fajtái, kiszerelés nélkül.)
8. Duplikált tételek a Falatozz-étlapon (Római, Sonkás, Szalámis, Zoltsy, Hun, Hústorony) – csak hiba, igaz?
9. Pizzánál megmaradjon-e a Kölyök pizza „Édes pizza” külön kategóriaként?

## Rendelés
10. **Kiszállítási díj** zónánként (XVIII. / Gyál / Vecsés) és a **teljes körzetlista** (utcák, irányítószámok).
11. **Minimum rendelés** zónánként (a lizopizza.hu szerint kerületenként eltér). Átvételnél van-e minimum? (Most: nincs.)
12. **Fizetés átvételkor:** készpénz? kártya a futárnál? SZÉP-kártya? (Most: „Átvételkor fizetek” – általános.)
13. **Személyes átvétel** a Balassa Bálint utcában lehetséges-e, és ugyanabban az időben?
14. **Zárva tartás alatti rendelés:** engedjünk előrendelést, vagy tiltsuk? (Most: előrendelésként rögzíti, jelzi.)
15. Rendelésfelvétel vége 21:40 – ez a konyha zárása vagy az utolsó rendelés időpontja?

## Márka, tartalom
16. **Saját ételfotók** – a hero és a termékkártyák fotóhelyei rajzolt megoldással készültek; ha jönnek képek, közvetlenül cserélhetők.
17. Facebook / Instagram / Google-profil linkje (a láblécbe).
18. **Cégadatok** (cégnév, székhely, adószám) a lábléchez és a jogi oldalakhoz. A Falatozz-on „Szekrényes és Gombos DBP Kft.” szerepel üzemeltetőként – ez a pizzéria cége vagy a platformé?
19. Saját ÁSZF és adatkezelési tájékoztató kell az új rendszerhez (most a jelenlegi lizopizza.hu oldalakra mutat).
20. **Wolt-adatlap létezik** (wolt.com/en/hun/budapest/restaurant/lizo-pizzeria-es-etelbar, Balassa Bálint u. 2-10.): ott a nyitvatartás H–Cs, V 11:00–21:45, P–Szo 10:00–23:15 – a lizopizza.hu 21:40 / 23:00-t ír. Melyik érvényes?
21. **Facebook** (két oldal is fut: facebook.com/LizoPizzeria és /p/Lizo-Pizzéria-és-Ételbár-61550760694849): a DAEKON munkakörnyezetből nem olvasható (robots tiltás). Színek és ajánlások képernyőképről jönnek majd.

## Technika (C–D fázis előtt)
21. MHosting csomag: PHP-verzió, MySQL/MariaDB verzió, cron, memória- és futásidő-limit, SSL, SMTP.
22. Védett tesztcím (aldomain) és hozzáférés.
23. Stripe-fiók a pizzéria vállalkozásának nevén; ki kezeli a visszatérítést.
24. Értesítés a konyhának: hangjelzés a tableten, e-mail, SMS?
