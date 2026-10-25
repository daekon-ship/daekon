"""Kalocsa GeoWorks – éles telepítési változat a jóváhagyott látványtervből.

Használat (a kalocsageoworks mappából):
    python -X utf8 -I tools/build.py

Forrás: eles-src/public/latvanytervek/kalocsa-zoltan (daekon-ship/daekon, változatlanul hagyva)
Kimenet: dist/ – csak a ténylegesen hivatkozott fájlok; _forras, ATADAS.md, minta- és képernyőkép-fájlok NEM.
A dizájn nem változik; csak a bemutató jellegű feliratok, az inaktív ajánlatkérő és a jogi linkek.
Minden csere pontosan egyszer kell, hogy illeszkedjen – különben a build leáll (forrásváltozás jelzése).
"""
import base64, hashlib, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get("KGW_SRC") or os.path.join(ROOT, "eles-src", "public", "latvanytervek", "kalocsa-zoltan")  # jóváhagyott látványterv
DIST = os.environ.get("KGW_DIST") or os.path.join(ROOT, "dist")
TPL = os.path.join(ROOT, "tools", "eles")
DOMAIN = "https://kalocsageoworks.com"
# Végleges adatkezelési tájékoztató: tools/eles/adatkezeles.html (csak ha jogilag kész – [kitöltendő] nélkül).
HAS_PRIVACY = os.path.isfile(os.path.join(TPL, "adatkezeles.html"))
# --ajanlat: online ajánlatkérő bekapcsolása (űrlap + /api/ajanlat.php). Csak végleges tájékoztatóval és beállított SMTP-vel.
AJANLAT_ON = "--ajanlat" in sys.argv
if AJANLAT_ON and not HAS_PRIVACY:
    sys.exit("BUILD STOP – az ajánlatkérő csak végleges adatkezelési tájékoztatóval (tools/eles/adatkezeles.html) kapcsolható be")
if HAS_PRIVACY and "kitöltendő" in open(os.path.join(TPL, "adatkezeles.html"), encoding="utf-8").read():
    sys.exit("BUILD STOP – az adatkezelési tájékoztató még [kitöltendő] mezőt tartalmaz")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def sub1(s, old, new, label):
    n = s.count(old)
    if n != 1:
        sys.exit(f"BUILD STOP – '{label}': {n} találat (1 kell)")
    return s.replace(old, new)


def subre(s, pat, new, label):
    s2, n = re.subn(pat, new, s, flags=re.S)
    if n != 1:
        sys.exit(f"BUILD STOP – '{label}': {n} találat (1 kell)")
    return s2


os.makedirs(DIST, exist_ok=True)
for n in os.listdir(DIST):  # tartalom ürítése (a mappa maradhat nyitva pl. egy helyi tesztszerverben)
    p = os.path.join(DIST, n)
    shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)

# ---------------- index.html ----------------
h = read(os.path.join(SRC, "index.html"))

# fej: kanonikus cím, közösségi előnézet, strukturált adat (csak valós, megadott adatok)
h = sub1(h, '<meta name="robots" content="noindex, nofollow">',
         '<meta name="robots" content="noindex, nofollow">\n'  # indexelés: csak a jogi/működési ellenőrzés után (lásd ELESITES.md)
         f'<link rel="canonical" href="{DOMAIN}/">\n'
         '<meta property="og:type" content="website">\n'
         '<meta property="og:locale" content="hu_HU">\n'
         '<meta property="og:site_name" content="Kalocsa GeoWorks">\n'
         '<meta property="og:title" content="Kalocsa GeoWorks | Gépi földmunka Kecskeméten és 45 km-es körzetében">\n'
         '<meta property="og:description" content="Alapásás, közműárok-ásás, nyomvonalásás, tuskóeltávolítás, tereprendezés – kis géppel, szűk helyeken is. Hívás: +36 70 420 4170.">\n'
         f'<meta property="og:url" content="{DOMAIN}/">\n'
         f'<meta property="og:image" content="{DOMAIN}/img/og-kalocsageoworks.jpg">\n'
         '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
         '<meta property="og:image:alt" content="Kubota KX019-4 kisgép munka közben egy építési telken">\n'
         '<meta name="twitter:card" content="summary_large_image">\n'
         # strukturált adat csak igazolt adatokból: nincs bejegyzett vállalkozás → szolgáltatás + kapcsolattartó személy, cégadat nélkül
         # (a vállalkozás bejegyzése után: HomeAndConstructionBusiness a hivatalos névvel/címmel – lásd AKTIVALAS-2027.md)
         '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service",'
         '"name":"Kalocsa GeoWorks – gépi földmunka","url":"' + DOMAIN + '/",'
         '"serviceType":["Alapásás","Közműárok-ásás","Nyomvonalásás","Tuskóeltávolítás","Tereprendezés"],'
         '"provider":{"@type":"Person","name":"Kalocsa Zoltán","telephone":"+36704204170","email":"kalocsageoworks@gmail.com"},'
         '"areaServed":{"@type":"GeoCircle","geoMidpoint":{"@type":"GeoCoordinates","latitude":46.9062,"longitude":19.6913},"geoRadius":"45000"},'
         '"image":"' + DOMAIN + '/img/og-kalocsageoworks.jpg"}</script>',
         "fej")

# térkép: a bemutató munkajelölő nem valós helyszín → élesben csak a körzet
h = sub1(h, '        <li><span class="lg lg--job"></span>Munkajelölő <em>(bemutató – nem valós helyszín)</em></li>\n', "", "jelmagyarázat")
h = sub1(h, '        <circle cx="236" cy="120" r="9" fill="#F27A21"/><circle cx="236" cy="120" r="16" fill="none" stroke="#F27A21" stroke-opacity=".5"/>\n', "", "tartalék jelölő")
h = sub1(h, '        <text x="252" y="116" font-family="Manrope, sans-serif" font-size="11" fill="#F27A21">BEMUTATÓ JELÖLŐ</text>\n', "", "tartalék felirat")

# akadálymentesség: az aria-label csak szereppel érvényes (vizuálisan nem változik)
h = sub1(h, '<div class="map__canvas" id="map" aria-label=', '<div class="map__canvas" id="map" role="region" aria-label=', "térkép szerep")

if AJANLAT_ON:
    # online ajánlatkérő bekapcsolva: az űrlap marad, a bemutató-jelzés kikerül
    h = subre(h, r'\s*<p class="form__demo" id="form-demo">.*?</p>', "", "űrlap bemutató-jelzés")
    h = sub1(h, "<li>Élesítés után közvetlenül Zoltánhoz kerül</li>", "<li>Közvetlenül Zoltánhoz kerül</li>", "ajánlat pipa")
else:
    # ajánlatkérő: amíg nincs adatkezelési tájékoztató + SMTP, az űrlap NEM kerül ki – helyette telefonos kapcsolatfelvétel
    h = sub1(h, '<p class="sec__lead">Töltsd ki pár perc alatt, és visszahívlak. Ha sietős, hívj most.</p>',
             '<p class="sec__lead">Hívj, és pár perc alatt átbeszéljük, mire van szükséged.</p>', "ajánlat bevezető")
    h = subre(h, r'<ul class="ticks ticks--sm">.*?</ul>',
              '<ul class="ticks ticks--sm">\n'
              '        <li>Közvetlenül velem beszélsz</li>\n'
              '        <li>Fotót e-mailben is küldhetsz a helyszínről</li>\n'
              '        <li>Kecskemét és 45 km-es körzete</li>\n'
              '      </ul>', "ajánlat pipák")
    h = subre(h, r'    <form class="form" id="ajanlat-form".*?</form>\s*<div class="done" id="form-done".*?</div>\n    </div>\n',
              '    <div class="done" id="ajanlat-tel">\n'
              '      <svg viewBox="0 0 24 24" aria-hidden="true"><path stroke-width="1.4" d="M6.6 3h3l1.5 4.2-2 1.4a12 12 0 0 0 6.3 6.3l1.4-2 4.2 1.5v3A2 2 0 0 1 19 20 16 16 0 0 1 4 5a2 2 0 0 1 2.6-2Z"/></svg>\n'
              '      <h3>Kapcsolatfelvétel telefonon</h3>\n'
              '      <p>Hívj, és átbeszéljük, mit kell kiásni, hol, és hogyan jut be a gép. A helyszínről fotót e-mailben is küldhetsz.</p>\n'
              '      <div class="done__act"><a class="btn" href="tel:+36704204170">Hívás most</a><a class="btn btn--ghost" href="mailto:kalocsageoworks@gmail.com">E-mail küldése</a></div>\n'
              '    </div>\n', "űrlap → telefon")
    h = sub1(h, '<p>Telefonálsz, vagy elküldöd az ajánlatkérést.</p>', '<p>Telefonálsz, vagy írsz egy e-mailt.</p>', "folyamat 01")
    # Hívógomb csak a kulcspontokon (ügyfél-visszajelzés 2026.10.25.: „rengeteg a Hívás most”): hero, Kapcsolat panel,
    # záró blokk, mobil lebegő gomb (+ a látványterv meglévő számos linkjei). A fejléc a számot mutatja.
    # A kártyák / kiemelt munkák / „befér-e” gombjai a Kapcsolat szakaszhoz görgetnek (ott hívás vagy e-mail – űrlap nincs).
    TEL, NUM = 'href="tel:+36704204170"', "+36 70 420 4170"
    h = sub1(h, '<a class="btn btn--sm hdr__cta" href="#ajanlat">Ajánlatot kérek</a>',
             f'<a class="btn btn--sm hdr__cta" {TEL} aria-label="Hívás: {NUM}">{NUM}</a>', "fejléc gomb")
    h = sub1(h, '<a class="btn" href="#ajanlat">Ajánlatot kérek</a>',
             f'<a class="btn" {TEL} aria-label="Beszéljünk telefonon: {NUM}">Beszéljünk telefonon</a>', "hero gomb")
    # záró blokk: közvetlenül a Kapcsolat panel alatt van, ezért nem ismétli annak „Hívás most / E-mail” párját – egy gomb, a számmal
    h = sub1(h, '      <a class="btn btn--lg" href="tel:+36704204170">Hívás most</a>\n      <a class="btn btn--ghost btn--lg" href="#ajanlat">Ajánlatot kérek</a>\n',
             f'      <a class="btn btn--lg" {TEL} aria-label="Hívás: {NUM}">{NUM}</a>\n', "záró gombok")
    LBL = {"Ajánlatot kérek erre": "Érdeklődöm", "Ilyen munkát kérek": "Érdeklődöm"}
    def munka_gomb(m):
        txt = m[3]
        for old, new in LBL.items():
            txt = txt.replace(old, new)
        return f'<a class="{m[1]}" href="#ajanlat" aria-label="{re.sub("<[^>]+>", "", txt).strip()}: {m[2]} – kapcsolat">{txt}</a>'
    h, n1 = re.subn(r'<button class="([^"]+)" data-munka="([^"]+)">(.*?)</button>', munka_gomb, h)
    h, n2 = re.subn(r'<button class="([^"]+)" data-befer>(.*?)</button>',
                    lambda m: f'<a class="{m[1]}" href="#ajanlat">{m[2]}</a>', h)
    if (n1, n2) != (10, 2):
        sys.exit(f"BUILD STOP – ajánlatkérő gombok: {n1} munka- és {n2} befér-gomb (10 és 2 kell)")
    h = sub1(h, "<p>Hívj most, vagy kérj ajánlatot – a részleteket közvetlenül velem beszéled meg.</p>",
             "<p>Hívj most – a munka részleteit közvetlenül velem beszéled meg.</p>", "záró szöveg")
    # a kapcsolat-szakasz és a lábléc ne „ajánlatkérést” ígérjen (nincs űrlap)
    h = sub1(h, '<p class="kicker"><span class="dot"></span>Ajánlatkérés</p>', '<p class="kicker"><span class="dot"></span>Kapcsolat</p>', "kapcsolat kicker")
    h = sub1(h, '<a href="#ajanlat">Ajánlatkérés</a></p>', '<a href="#ajanlat">Kapcsolat</a></p>', "lábléc kapcsolat")
    if "data-munka" in h or "data-befer" in h or re.search(r"Ajánlatot kérek|Ilyen munkát kérek|Ajánlatkérés\b", h):
        sys.exit("BUILD STOP – maradt nem hívó / ajánlatkérő felirat")

# lábléc: vázlat-jogi oldalak nem mennek ki véglegesként; az adatkezelési tájékoztató csak a véglegesítése után (tools/eles/adatkezeles.html)
h = sub1(h, '<p><a href="adatkezeles.html">Adatkezelési tájékoztató</a> <em>(vázlat)</em><br><a href="impresszum.html">Impresszum</a> <em>(vázlat)</em><br>Cégforma, adószám <em>[egyeztetendő]</em></p>',
         '<p><a href="adatkezeles.html">Adatkezelési tájékoztató</a><br><a href="impresszum.html">Impresszum</a></p>' if HAS_PRIVACY else
         '<p><a href="impresszum.html">Impresszum</a><br>Adatkezelési tájékoztató: előkészítés alatt</p>', "lábléc jogi")
h = sub1(h, '<span>Látványterv: <a href="https://daekon.hu" rel="noopener">DAEKON</a></span>',
         '<span>Weboldal: <a href="https://daekon.hu" rel="noopener">DAEKON</a></span>', "lábléc készítő")
# az éles JS-nek saját verzió (a statikus fájlok 1 évig gyorsítótárazódnak) – minden JS-változtatáskor emelni kell
h = sub1(h, '<script src="kalocsa.js?v=37" defer></script>', '<script src="kalocsa.js?v=37-eles6" defer></script>', "js verzió")
h = sub1(h, '<link rel="stylesheet" href="kalocsa.css?v=39">', '<link rel="stylesheet" href="kalocsa.css?v=39-eles3">', "css verzió")
for bad in ("Bemutató mód", "bemutató", "BEMUTATÓ", "kitöltendő", "egyeztetendő", "github", "látványterv"):
    if bad.lower() in h.lower():
        sys.exit(f"BUILD STOP – index.html még tartalmazza: {bad}")
write(os.path.join(DIST, "index.html"), h)

# ---------------- kalocsa.js ----------------
j = read(os.path.join(SRC, "kalocsa.js"))
if AJANLAT_ON:
    j = sub1(j, "const AJANLAT = { endpoint: null,", "const AJANLAT = { endpoint: '/api/ajanlat.php',", "js ajánlat végpont")
    # több munkatípus: a „munka” nevű jelölőnégyzetekből PHP csak az utolsót kapná meg → munka[] tömbként küldjük
    j = sub1(j, "    fd.delete('fotok'); files.forEach(f => fd.append('fotok[]', f, f.name));\n",
             "    fd.delete('fotok'); files.forEach(f => fd.append('fotok[]', f, f.name));\n"
             "    const munkak = fd.getAll('munka'); fd.delete('munka'); munkak.forEach(m => fd.append('munka[]', m));\n", "js munka[] tömb")
    j = sub1(j, "    const munka = fd.getAll('munka').join(', ');", "    const munka = munkak.join(', ');", "js munka felirat")
    # a bemutató ág (végpont nélküli e-mail-piszkozat) élesben nem kell – kivesszük, ne maradjon „Bemutató mód” szöveg
    j = subre(j, r"    if \(!AJANLAT\.endpoint\) \{\n      // BEMUTATÓ MÓD.*?\n      return;\n    \}\n", "", "js bemutató ág")
else:
    j = subre(j, r"  /\* ---------- AJÁNLATKÉRŐ ---------- \*/.*?(?=  /\* ---------- TÉRKÉP)",
              "  /* ---------- AJÁNLATKÉRŐ (éles: kikapcsolva) ---------- */\n"
              "  // Az online űrlap nincs az éles oldalon; minden ajánlatkérő gomb tel: link (a phone_click mérés automatikusan követi).\n"
              "  // Bekapcsolás később: tools/build.py --ajanlat (csak végleges adatkezelési tájékoztatóval).\n\n", "js ajánlat")
    j = sub1(j, ".observe($('#ajanlat-form'));", ".observe($('#ajanlat-tel'));", "js hívógomb-elrejtés")
    j = sub1(j, "g.from('.form', { y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.form', start: 'top 90%' } });",
             "g.from('#ajanlat-tel', { y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '#ajanlat-tel', start: 'top 90%' } });", "js gsap panel")
    j = sub1(j, "g.from('.form > *', { y: 14, autoAlpha: 0, duration: .6, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.form', start: 'top 80%' } });",
             "g.from('#ajanlat-tel > *', { y: 14, autoAlpha: 0, duration: .6, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '#ajanlat-tel', start: 'top 80%' } });", "js gsap panel elemei")
j = subre(j, r"    const job = L\.marker\(\[47\.034, 19\.776\].*?\n(?=    // a rögzített)", "", "js bemutató jelölő")
# mobilvideó 4:2:0-ra újrakódolva (a 4:4:4-et a telefonok nem játsszák le) – új URL, hogy a gyorsítótár ne a régit adja
j = sub1(j, "mobileMp4: 'video/hero-loop-mobil.mp4',", "mobileMp4: 'video/hero-loop-mobil.mp4?v=420',", "js mobilvideó verzió")
# robusztusság: ha a böngésző nem játssza le a blob:-forrást (pl. egyes WebKit-portok), egyszer még a közvetlen fájllal
# próbálkozik, és csak utána marad a poszter (a görgetéses vezérlés közvetlen forrással is működik, csak a letöltés közben lassabb)
j = sub1(j, "    video.addEventListener('error', () => fail('video-error'), { once: true });",
         "    let blobRetry = false;\n"
         "    video.addEventListener('error', () => {\n"
         "      if (!blobRetry && String(video.src).startsWith('blob:')) { blobRetry = true; URL.revokeObjectURL(video.src); video.src = srcUrl; return; }\n"
         "      fail('video-error');\n"
         "    });", "js videó blob-tartalék")
# térképkönyvtár saját tárhelyről (Leaflet 1.9.4, a hivatalos SRI-hash-sel ellenőrizve) – nincs cdnjs/unpkg-kérés
j = sub1(j, "const CDN = ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/', 'https://unpkg.com/leaflet@1.9.4/dist/'];",
         "const CDN = ['vendor/leaflet/'];", "js leaflet helyi")
if "Bemutató mód" in j or "Munkajelölő" in j:
    sys.exit("BUILD STOP – kalocsa.js még tartalmaz bemutató szöveget")
write(os.path.join(DIST, "kalocsa.js"), j)

# ---------------- statikus fájlok (csak a hivatkozottak) ----------------
refs = set(re.findall(r"(?:img|video|fonts|js)/[A-Za-z0-9._-]+", h + read(os.path.join(SRC, "kalocsa.css")) + j))
refs |= {"logo-jel.svg", "fonts/OFL-Archivo.txt", "fonts/OFL-Manrope.txt"}
refs.discard("img/og-kalocsageoworks.jpg")  # a build generálja (lent)
css = read(os.path.join(SRC, "kalocsa.css"))
if not AJANLAT_ON:
    css += "\n/* éles: a hívó .card__link gomb <a> lett – ugyanaz a megjelenés, mint a <button>-é */\na.card__link{text-decoration:none}\n"
write(os.path.join(DIST, "kalocsa.css"), css)
for r in sorted(refs):
    s = os.path.join(SRC, r)
    if not os.path.isfile(s):
        sys.exit(f"BUILD STOP – hiányzó hivatkozott fájl: {r}")
    os.makedirs(os.path.dirname(os.path.join(DIST, r)) or DIST, exist_ok=True)
    shutil.copy2(s, os.path.join(DIST, r))

# közösségi megosztókép: valós munkafotó (Kubota KX019-4), 1200×630 JPG – a WebP-t nem minden platform kezeli
from PIL import Image
Image.open(os.path.join(SRC, "img", "kisgep-kx019-1200.webp")).convert("RGB").crop((0, 300, 1200, 930)).save(
    os.path.join(DIST, "img", "og-kalocsageoworks.jpg"), quality=84, optimize=True, progressive=True)

shutil.copytree(os.path.join(ROOT, "tools", "vendor", "leaflet-1.9.4"), os.path.join(DIST, "vendor", "leaflet"))
LEAFLET_SRI = {"leaflet.js": "20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=", "leaflet.css": "p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="}
for f, want in LEAFLET_SRI.items():
    with open(os.path.join(DIST, "vendor", "leaflet", f), "rb") as fh:
        if base64.b64encode(hashlib.sha256(fh.read()).digest()).decode() != want:
            sys.exit(f"BUILD STOP – a Leaflet {f} nem egyezik a hivatalos hash-sel")

# ---------------- saját éles fájlok ----------------
for name in ("impresszum.html", "404.html", "robots.txt") + (("adatkezeles.html",) if HAS_PRIVACY else ()):
    shutil.copy2(os.path.join(TPL, name), os.path.join(DIST, name))

# CSP: a fej inline szkriptje hash-sel engedélyezve
inline = re.findall(r"<script>(.*?)</script>", h, re.S)
if len(inline) != 1:
    sys.exit(f"BUILD STOP – inline szkriptek száma: {len(inline)}")
sha = base64.b64encode(hashlib.sha256(inline[0].encode("utf-8")).digest()).decode()
ht = read(os.path.join(TPL, "htaccess")).replace("{{INLINE_SHA}}", sha)
# adatküldés: alapból sehova (405); --ajanlat módban csak az ajánlatkérő végpontra
ht = ht.replace("{{POST_EXCEPT}}", "  RewriteCond %{REQUEST_URI} !^/api/ajanlat\\.php$\n" if AJANLAT_ON else "")
ht = ht.replace("{{FORM_ACTION}}", "'self'" if AJANLAT_ON else "'none'")
if "{{" in ht:
    sys.exit("BUILD STOP – kitöltetlen .htaccess-helyőrző")
write(os.path.join(DIST, ".htaccess"), ht)

# indexeléshez előkészítve, de NEM feltöltendő (külön mappa)
ready = os.environ.get("KGW_READY") or os.path.join(ROOT, "indexeleshez-kesz")
os.makedirs(ready, exist_ok=True)
# sitemap: csak a ténylegesen kikerülő oldalak (az adatkezelési tájékoztató csak a véglegesítése után)
pages = [("/", "monthly", "1.0"), ("/impresszum.html", "yearly", "0.2")] + ([("/adatkezeles.html", "yearly", "0.2")] if HAS_PRIVACY else [])
write(os.path.join(ready, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + "".join(f"  <url><loc>{DOMAIN}{p}</loc><changefreq>{c}</changefreq><priority>{pr}</priority></url>\n" for p, c, pr in pages) + "</urlset>\n")
shutil.copy2(os.path.join(TPL, "robots-vegleges.txt"), os.path.join(ready, "robots.txt"))

total = 0
for rt, _, fs in os.walk(DIST):
    for f in fs:
        total += os.path.getsize(os.path.join(rt, f))
print(f"BUILD OK: {sum(len(f) for _, _, f in os.walk(DIST))} fájl, {total/1e6:.1f} MB -> {DIST}")
print(f"inline sha256: {sha}")
