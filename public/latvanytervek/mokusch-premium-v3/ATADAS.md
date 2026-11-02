# Mókusch – B-változat (mokusch-premium-v3) · átadás

Élő előnézet: https://daekon-ship.github.io/daekon/latvanytervek/mokusch-premium-v3/
A-változat (Wixhez közelebbi): https://daekon-ship.github.io/daekon/latvanytervek/mokusch-premium-v2/

Generátor: `prototypes/mokusch-premium-v2/build_v3.py` – a v2 tartalmát és aloldalait használja, de saját illusztrációkkal, elrendezéssel és stílussal. A jelenetek: `scenes.py` (SVG), animációjuk: `scenes.js`, a stílus: a v2 közös alapja + `v3.css`.

## Miben más, mint az A-változat

| | A (v2) | B (v3) |
|---|---|---|
| Képek | Wanda Wix-oldalának festett képei | **saját rajzolt, papírkivágásos jelenetek** – fotó és generált kép nincs |
| Hasonlóság a Wixhez | erős (olíva, púder, felhők) | enyhe: fejezetcímek, mókus, púder kiemelés |
| Színek | olíva, púder, barna | papír, erdőzöld, bogyó, méz |
| Betűk | Playfair Display + Manrope | **Literata** (könyvekhez tervezett, nagyon jól olvasható) + **Figtree** |
| Nyitókép | félig kifutó festmény | „papírszínház”: rétegesen mozduló erdei jelenet, előtte szöveges kártya |
| Fejezetlista | – | ikonos fejezet-kártyák (9 db, a torta kiemelve) |
| Torta-finálé | sötét háttér | rajzolt háromszintes torta füzérrel, mellette 3 lépés + gombok |

## Jelenetek (vektoros rajzok, scenes.py)

Ösvény Mókusch-táblával és mókussal · kis kávézó lámpásokkal · pult csészével és tortával · kerek asztal kávéval és keksszel · üst a boszorkánykonyhában · nyuszis polc üvegekkel és teáskannával · olvasósarok fotellel és lámpával · palackposta a hullámokon · háromszintes torta füzérrel. Minden jelenetben ott a Mókusch mókusa (a logó rajza).

A jelenetek fiktív, rajzolt hangulatképek – nem a valódi üzletet vagy valódi tortákat ábrázolják. A valódi fotók helyei („Valódi fotó helye · kód”) ugyanazok, mint az A-változatban.

## Motion

A v2 Motion-rétege (motion-fx.js) itt is fut, plusz a jelenetek saját mozgásai (scenes.js):
- rétegek görgetésre eltérő sebességgel úsznak (papírszínház-mélység), egérrel is elmozdulnak,
- a rétegek belépéskor egymás után „felállnak”,
- gőz száll a csészéből és az üstből, lobog a gyertyaláng, csóvál a mókus farka, rezdül a nyuszi füle, ring a palack, bugyog az üst,
- a nyitó mókus rugóval kiugrik a domb mögül, a kártyák rugósan emelkednek, a fejezet-ikonok kirajzolódnak, a jelenet-kártyák 3D-ben billennek.
Csökkentett mozgásnál csak a halk, helyben maradó mozgások futnak; a láblécben ki-be kapcsolható.

## Ellenőrzés

360 / 390 / 768 / 1024 / 1440 / 1920 px: vízszintes túlcsúszás és konzolhiba nincs; a tortarendelő végig működik.

## Nyitott kérdések

Ugyanazok, mint az A-változatnál (lásd mokusch-premium-v2/ATADAS.md): nevek, étlap, tortakínálat, valódi fotók, nyitvatartás megerősítése.
