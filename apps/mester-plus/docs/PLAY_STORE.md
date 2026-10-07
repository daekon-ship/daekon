# Mester+ – kiadás a Google Play Áruházba

Ez a leírás a teljes utat végigviszi: a gépeden futó build-től a Play Console beállításain át a tesztelésig és a nyilvános megjelenésig.

## 0. Előfeltételek

- **Flutter 3.35 vagy újabb** (`flutter --version`). Ebben a verzióban már helyes a 16 KB-os memórialap-igazítás és az API 36-os célzás.
- Android Studio (az Android SDK és a `keytool` miatt). A `flutter doctor` ne mutasson hibát az Android sorban.
- Google Play fejlesztői fiók (egyszeri 25 USD): https://play.google.com/console

## 1. Egyszeri előkészítés a gépeden

```bat
cd %USERPROFILE%\Desktop\APPOK\mester-plus
setup.bat
```

A `setup.bat` lépései:
- létrehozza az Android projektet;
- legenerálja az adatbázis-kódot, az ikont és az indítóképernyőt;
- lefuttatja a `tool/android_release_setup.dart`-ot, amely beállítja:
  - az app nevét (Mester+);
  - a **target és compile SDK 36**-ot (a Play követelménye 2026. augusztus 31. óta);
  - a **min SDK 24**-et (Android 7.0);
  - a kiadási aláírást.

**Az alkalmazásazonosító (applicationId): `hu.mesterplus.mester_plus`.**
Az első feltöltés után ez véglegesen nem változtatható. Ha mást szeretnél, az első `setup.bat` előtt írd át a `--org` értéket a `setup.bat` fájlban.

## 2. Kiadási csomag (AAB) készítése

```bat
release.bat
```

- Az első futtatáskor létrehozza a **feltöltési kulcsot**:
  - a kulcs a `%USERPROFILE%\mester_plus_upload.jks` fájlba kerül;
  - a jelszó az `android\key.properties` fájlba kerül, amely nem kerül a git-be.
- **Ezt a két fájlt és a jelszót mentsd el biztonságos helyre.** Nélkülük a frissítést csak a Google ügyfélszolgálatán keresztüli kulcscserével tudod feltölteni.
- Ezután lefuttatja a teszteket, és elkészíti a fájlt: `build\app\outputs\bundle\release\app-release.aab`.

Minden új kiadás előtt emeld a verziót a `pubspec.yaml`-ban, például `version: 0.4.0+4`.
A `+` utáni szám (versionCode) minden feltöltésnél nagyobb kell legyen.

## 3. Play Console – az alkalmazás létrehozása

1. **Alkalmazás létrehozása:**
   - név: *Mester+ Árajánlat szakiknak*;
   - alapértelmezett nyelv: magyar;
   - típus: Alkalmazás;
   - díj: Ingyenes.
2. **Play App Signing:** fogadd el (alapértelmezett). A Google tárolja az alkalmazás-aláíró kulcsot, te csak a feltöltési kulccsal írsz alá.
3. **Áruházi adatlap** (Növekedés → Áruházi jelenlét → Fő áruházi adatlap):
   - a szövegek: `store/listing_hu.md`;
   - az ikon: `store/play_icon_512.png`;
   - a kiemelt grafika: `store/feature_graphic_1024x500.png`;
   - a telefonos képernyőképek: `store/screenshots/` (5 db).
4. **Kategória:** Üzleti. Add meg a kapcsolattartási e-mailt is.

## 4. Az „Alkalmazás tartalma” űrlapok

| Űrlap | Válasz |
|---|---|
| Adatvédelmi irányelvek | Nyilvános URL kell. A szöveg kész: `store/adatvedelem.html`. Tedd fel egy nyilvános oldalra, pl. GitHub Pages, és add meg a címét. |
| Hirdetések | Nem tartalmaz hirdetést. |
| Alkalmazás-hozzáférés | Minden funkció korlátozás nélkül elérhető (nincs bejelentkezés). |
| Tartalom besorolása | Kérdőív: Segédprogram / Üzleti. Erőszak, szexuális tartalom, szerencsejáték, felhasználók közötti kommunikáció: mind **nem**. Várható eredmény: PEGI 3 / Mindenki. |
| Célközönség | **18 év felett.** Így nem vonatkoznak rá a Families-szabályok. |
| Hírek alkalmazás | Nem. |
| Pénzügyi funkciók | Nem nyújt pénzügyi szolgáltatást (az árajánlat-készítés nem az). |
| Egészségügy | Nem. |
| Kormányzati alkalmazás | Nem. |

### Adatbiztonság (Data safety)

Az app nem gyűjt és nem oszt meg adatot: nincs hálózati forgalom, minden adat helyben marad.
- **Gyűjt vagy oszt meg a felhasználói adattípusok közül bármit?** Nem.
  Az, hogy a felhasználó maga oszt meg egy PDF-et a rendszer megosztás-ablakával, a Play definíciója szerint nem számít az app általi adatgyűjtésnek vagy -megosztásnak.
- Titkosítás továbbítás közben: nem releváns, mert nincs továbbítás.
- Adattörlési kérelem: az adatok a készüléken vannak, és az app eltávolításával törlődnek.

## 5. Tesztelés – új személyes fiókoknál kötelező

A 2023. november 13. után létrehozott **személyes** fejlesztői fiókoknál a nyilvános (production) megjelenés előfeltétele egy **zárt teszt, legalább 12 tesztelővel, akik 14 egymást követő napig benne maradnak**.

1. Tesztelés → Belső tesztelés: töltsd fel az AAB-t, és próbáld ki a saját telefonodon. Ez azonnal elérhető.
2. Tesztelés → Zárt tesztelés:
   - hozz létre egy tesztelői listát legalább 12 Google-fiókkal (kollégák, ismerős szakik);
   - töltsd fel ugyanazt az AAB-t;
   - a tesztelők a meghívó linken jelentkezzenek, és telepítsék az appot.
3. 14 nap után: Irányítópult → **Hozzáférés kérése a production-höz**. Itt a Google néhány kérdést tesz fel a tesztelésről.
4. A jóváhagyás után következhet a production kiadás. Az első felülvizsgálat általában néhány naptól egy-két hétig tart.

Céges (szervezeti) fióknál nincs 12 fős szabály, de D-U-N-S szám kell.

## 6. Kiadás előtti ellenőrzőlista a telefonon

Ezeket a valódi telefonon próbáld ki a belső tesztelési buildből:
- [ ] Első indítás: megjelenik az indítóképernyő, az ikon kerek és lekerekített maszkkal is jól néz ki.
- [ ] Ügyfél → projekt → felmérés → tétel → árazás → kalkuláció → PDF megosztás e-mailben. A PDF-ben az ő és ű betűk helyesek.
- [ ] Nyomtatás: megjelenik a rendszer nyomtatási ablaka.
- [ ] Beállítások → Mentés készítése. Ezután próbáld ki a visszaállítást egy második telefonon vagy egy újratelepített appon.
- [ ] Nagy rendszer-betűméret (Beállítások → Kijelző → Betűméret: legnagyobb): semmi nem lóg ki.
- [ ] Gesztusnavigáció és 3 gombos navigáció: az alsó sáv nem takar ki gombot.
- [ ] Sötét mód: az app szándékosan világos, olvasható marad.
- [ ] Tablet vagy fekvő mód (ha van): a tartalom középen, legfeljebb 640 dp széles.
- [ ] Repülőgép üzemmód: minden funkció működik.

## Források

- Target API követelmény: https://developer.android.com/google/play/requirements/target-sdk
- Tesztelési követelmény új személyes fiókoknak: https://support.google.com/googleplay/android-developer/answer/14151465
- Flutter Android kiadás: https://docs.flutter.dev/deployment/android
