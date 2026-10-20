# Mester+ Pilot – útmutató a tesztelőnek

Köszönjük, hogy kipróbálod a Mester+-t a valódi munkádban. Ez egy **béta tesztverzió**: már megbízhatóan működik,
de még csiszoljuk. A kezdőlapon a dátum mellett és a Beállítások alján ez látszik: „Mester+ Pilot · béta tesztverzió · 0.9.0”.

## 1. Első lépések

1. Telepítsd a `mester-plus-pilot.apk` fájlt (a telefon rákérdez: „Ismeretlen alkalmazás telepítése” – engedélyezd erre az egy fájlra).
   Ha korábban kaptál egy **teszt**-APK-t (`mester-plus-cloud-test.apk`), azt előbb töröld; az abban rögzített adat nem jön át.
2. Az első indításkor **állíts be PIN-kódot** (Beállítások → Biztonság). Jegyezd meg jól – lásd lent.
3. Töltsd ki a cégadataidat (Beállítások → Cégadatok): ezek kerülnek az ajánlatra.
4. Regisztrálj Mester+ fiókot (Beállítások → Mester+ fiók → Bejelentkezés / Regisztráció), és **szólj nekünk, milyen e-mail címmel** –
   mi kapcsoljuk be a fiókodon a Pilot-hozzáférést (felhőmentés + online ajánlat). Ez ingyenes, és lejárattal szól;
   a lejárat a Mester+ fióknál látszik („Mester+ Pilot · ….-ig”). Az e-mail-megerősítő levél még nem érkezik meg – ez nem hiba.

## 2. Mit próbálj ki – lehetőleg valódi munkán

- új ügyfél és projekt; felmérés (helyiségek, méretek); munkatételek az árlistából
- az árlista saját áraidra állítása; kalkuláció (kedvezmény/felár, ÁFA)
- PDF ajánlat készítése és elküldése (pl. e-mailben vagy Messengeren)
- **Online ajánlat**: a projektnél „Online ajánlat küldése” → a linket küldd el az ügyfélnek (vagy először magadnak);
  az ügyfél a telefonján megnyitja, elfogadja vagy elutasítja – az appban frissítéssel látod: Megnyitva / Elfogadva / Elutasítva
- projekt státusz léptetése (ajánlat → elfogadva → folyamatban → kész)
- befizetés, kiadás, munkanapló (ledolgozott órák), anyaglista
- **internet nélkül** (repülő üzemmód): minden fenti munka működik; a felhős gombok csak jeleznek, hogy nincs net

## 3. Felhőmentés – ez a legfontosabb

- Beállítások → **Felhőmentés** → **„Mentés most”**. A mentést a telefon titkosítja, mielőtt feltölti – mi sem látjuk bele.
- Kapcsold be az **„Automatikus napi mentés”**-t: ha változott valami, naponta egyszer ment, amikor megnyitod az appot.
- **Így ellenőrzöd, hogy van friss mentésed:** Beállítások → Felhőmentés → zöld felhő ikon és
  „Utolsó sikeres mentés: …” (ma / tegnap). A „Felhőmentések és visszaállítás” gomb alatt látod az összes mentést, dátummal és mérettel.
- Hetente egyszer a régi módszer is jó pluszban: Beállítások → Helyi adatmentés → „Mentés készítése” (fájlba, pl. Google Drive-ra).

## 4. Mit NE tegyél

- **Ne töröld (ne távolítsd el) az appot**, és ne nyomd meg a telefon beállításaiban az „Adatok törlése” gombot –
  ilyenkor a telefonon lévő minden adat elveszik. Frissítéshez soha nem kell törölni (lásd 6.).
- Ne felejtsd el a PIN-kódot: biztonsági okból nincs „elfelejtett PIN” – ilyenkor csak újratelepítés és a felhőmentés visszatöltése segít.
  Ezért fontos, hogy legyen friss felhőmentésed.
- Ne add oda a telefont feloldva idegennek; ne oszd meg a Mester+ jelszavadat.
- Az online ajánlat linkje az ügyfélnek szól: aki megkapja, megnézheti. Ha rossz helyre ment, a projektnél **„Visszavonás”** – a link azonnal megszűnik.
- Ne töltsd le az appot más forrásból: csak tőlünk kapott fájlt telepíts.

## 5. Hibajelzés

Írj vagy hívj minket azon a csatornán, ahol az appot kaptad. Sokat segít, ha leírod:

1. mit csináltál (melyik képernyő, melyik gomb),
2. mi történt, és mit vártál helyette,
3. mikor (nap, óra),
4. egy képernyőkép (hangerő-le + bekapcsoló gomb egyszerre),
5. a verziót a Beállítások aljáról („Mester+ Pilot · béta tesztverzió · 0.9.0”).

Ügyfeled személyes adatát (név, cím, telefon) lehetőleg ne küldd el a hibajelzésben – a képernyőképen ezt kitakarhatod.

## 6. Hogyan frissítjük az appot

- Új verziónál küldünk egy új `mester-plus-pilot.apk` fájlt. **Előtte nyomj egy „Mentés most”-ot.**
- Nyisd meg a fájlt → a telefon azt kérdezi: **„Frissíted ezt az alkalmazást?”** → Frissítés.
  Az adataid, a PIN és a bejelentkezés megmarad – a frissítés ugyanazzal az aláírással érkezik.
- Ha a telefon nem frissítést ajánl, hanem „Az alkalmazás nincs telepítve” / „ütközik egy meglévő csomaggal” hibát ír:
  **ne töröld a meglévő appot**, hanem szólj nekünk.
- A Beállítások alján ellenőrizheted, hogy a verziószám nőtt.

---

*Üzemeltetőnek (nem a tesztelőnek):* Pilot-hozzáférés a szerveren – `php bin/cli.php pilot --email <e-mail> --days <1–180>`,
visszavonás `pilot-revoke --email <e-mail>`, lista `pilot-list` (lásd OPERATIONS.md). Ez nem előfizetés és nem bevétel;
lejárat vagy visszavonás után a fiók FREE: új felhőmentés nem készül, a meglévők még 30 napig visszaállíthatók.
