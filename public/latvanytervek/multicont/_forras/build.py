#!/usr/bin/env python3
"""MultiCont Center – statikus oldalgenerátor (12. kör).
Futtatás:  python3 _forras/build.py   (a multicont/ mappából vagy bárhonnan)
A közös fejléc/lábléc egy helyen van; a változó tartalom a tartalom.js-ben."""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent
TEL, TEL_H, MAIL = "+36204337811", "+36 20 433 7811", "konyvelde@gmail.com"
ADDR = "2040 Budaörs, Meredek utca 2."
MAPS = "https://www.google.com/maps/dir/?api=1&amp;destination=2040%20Buda%C3%B6rs%2C%20Meredek%20utca%202."

MARK = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 6h17v6H12v11H6z" fill="#173550"/><path d="M42 6v17h-6V12H25V6z" fill="#346B95"/><path d="M6 42V25h6v11h11v6z" fill="#639A9C"/><rect x="20" y="20" width="8" height="8" fill="#346B95"/></svg>'
MARK_D = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 6h17v6H12v11H6z" fill="#FFFFFF"/><path d="M42 6v17h-6V12H25V6z" fill="#9EC3E0"/><path d="M6 42V25h6v11h11v6z" fill="#8FC2C4"/><rect x="20" y="20" width="8" height="8" fill="#9EC3E0"/></svg>'
ICO_PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h3l1.4 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/></svg>'
ICO_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>'

MENU = [("index.html", "Főoldal"), ("rolunk.html", "Rólunk"), ("szolgaltatasok.html", "Szolgáltatásaink"),
        ("hirek.html", "Szakmai hírek"), ("tudastar.html", "Tudástár"), ("partnerek.html", "Partnereink"),
        ("kapcsolat.html", "Kapcsolat")]


def head(title, desc):
    return f'''<!DOCTYPE html>
<html lang="hu" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#173550">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="MultiCont Center Kft.">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta name="format-detection" content="telephone=no">
<link rel="preload" href="fonts/sourcesans3.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="fonts/literata.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="mc.css">
<link rel="icon" href="jel.svg" type="image/svg+xml">
<script>document.documentElement.classList.replace('no-js','js')</script>
</head>
<body>
<a class="skip" href="#tartalom">Ugrás a tartalomhoz</a>
'''


def logo(dark=False, href="index.html"):
    return f'''<a class="logo" href="{href}" aria-label="MultiCont Center Kft. – főoldal">{MARK_D if dark else MARK}<span class="logo-txt"><span class="logo-name">Multi<span>Cont</span></span><span class="logo-sub">Center Kft.</span></span></a>'''


SUB = {
    "rolunk.html": [("rolunk.html#tortenet", "Történetünk"), ("rolunk.html#szakmai-ut", "Horváth Mária szakmai útja"),
                    ("rolunk.html#nev", "A név jelentése"), ("rolunk.html#cegadatok", "Cégadatok")],
    "szolgaltatasok.html": [("szolgaltatasok.html#konyveles", "Könyvelés"), ("szolgaltatasok.html#berszamfejtes", "Bérszámfejtés"),
                            ("szolgaltatasok.html#adotanacsadas", "Adótanácsadás"), ("szolgaltatasok.html#nav-tb", "NAV- és TB-képviselet"),
                            ("szolgaltatasok.html#online", "Online könyvelés"), ("szolgaltatasok.html#vegelszamolas", "Végelszámolás")],
    "hirek.html": [("hirek.html", "Összes cikk"), ("hirek.html?kat=Ad%C3%B3z%C3%A1si%20v%C3%A1ltoz%C3%A1sok", "Adózási változások"),
                   ("hirek.html?kat=NAV-inform%C3%A1ci%C3%B3k", "NAV-információk"), ("hirek.html?kat=V%C3%A1llalkoz%C3%B3i%20tudnival%C3%B3k", "Vállalkozói tudnivalók"),
                   ("hirek.html?kat=B%C3%A9rsz%C3%A1mfejt%C3%A9s", "Bérszámfejtés"), ("hirek.html?kat=Sz%C3%A1mvitel", "Számvitel"),
                   ("hirek.html?kat=Hat%C3%A1rid%C5%91k", "Határidők"), ("hirek.html?kat=Jogszab%C3%A1lyi%20t%C3%A1j%C3%A9koztat%C3%B3k", "Jogszabályi tájékoztatók")],
    "tudastar.html": [("tudastar.html#ber", "Bérkalkulátor"), ("tudastar.html#koltseg", "Munkáltatói költség"), ("tudastar.html#kata", "KATA-kalkulátor"),
                      ("tudastar.html#afa", "ÁFA-kalkulátor"), ("tudastar.html#dokumentumtar", "Dokumentumtár"), ("tudastar.html#linkek", "Szakmai linkek")],
    "partnerek.html": [("partnerek.html", "Partnerlista"), ("partnerek.html#ajanlo", "Ajánlói együttműködés"), ("partnerek.html#jelentkezes", "Partnerjelentkezés")],
    "kapcsolat.html": [("kapcsolat.html", "Elérhetőségek"), ("kapcsolat.html#urlap", "Üzenetküldés"), ("kapcsolat.html#urlap", "Visszahívás kérése")],
}
QUICK = [("szolgaltatasok.html#konyveles", "Könyvelés"), ("szolgaltatasok.html#berszamfejtes", "Bérszámfejtés"),
         ("szolgaltatasok.html#adotanacsadas", "Adótanácsadás"), ("szolgaltatasok.html#vegelszamolas", "Végelszámolás"),
         ("tudastar.html#ber", "Bérkalkulátor"), ("tudastar.html#kata", "KATA-kalkulátor"),
         ("tudastar.html#dokumentumtar", "Dokumentumtár"), ("hirek.html?kat=Hat%C3%A1rid%C5%91k", "Határidők")]
ICO_DOWN = '<svg class="caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5"/></svg>'


def header(active):
    items = []
    for h, t in MENU:
        cur = ' aria-current="page"' if h == active else ''
        sub = SUB.get(h)
        if sub:
            cols = ' ddm-2' if len(sub) > 6 else ''
            links = "".join(f'<li><a href="{u}">{n}</a></li>' for u, n in sub)
            items.append(f'<li class="has-dd"><a href="{h}"{cur} aria-haspopup="true">{t}{ICO_DOWN}</a>'
                         f'<div class="ddm{cols}"><p class="ddm-t">{t}</p><ul>{links}</ul></div></li>')
        else:
            items.append(f'<li><a href="{h}"{cur}>{t}</a></li>')
    menu = "".join(items)
    dmenu = ""
    for h, t in MENU:
        cur = ' aria-current="page"' if h == active else ''
        sub = SUB.get(h)
        if sub:
            links = "".join(f'<a href="{u}">{n}</a>' for u, n in sub)
            dmenu += (f'<details class="dm"{" open" if h == active else ""}><summary><a href="{h}"{cur}>{t}</a>'
                      f'<span class="dm-tog" aria-hidden="true">{ICO_DOWN}</span></summary><div class="dm-sub">{links}</div></details>')
        else:
            dmenu += f'<a class="dm-top" href="{h}"{cur}>{t}</a>'
    quick = "".join(f'<li><a href="{u}">{n}</a></li>' for u, n in QUICK)
    return f"""
<header class="hdr">
  <div class="topbar"><div class="wrap">
    <span><span class="tb-firm">MultiCont Center Kft.</span> · Könyvelőiroda, Budaörs</span>
    <span class="tb-r">
      <a href="tel:{TEL}">{TEL_H}</a><span class="tb-sep" aria-hidden="true"></span>
      <a href="mailto:{MAIL}">{MAIL}</a><span class="tb-sep" aria-hidden="true"></span>
      <a class="tb-call" href="kapcsolat.html#urlap">Visszahívást kérek</a>
    </span>
  </div></div>
  <div class="hdr-main"><div class="wrap">
    {logo()}
    <form class="search" role="search" data-go="hirek.html" aria-label="Keresés a szakmai hírekben">
      <label class="vh" for="hq">Keresés a szakmai hírekben</label>
      <input id="hq" type="search" placeholder="Keresés: KATA, ÁFA, határidő…" autocomplete="off">
      <button type="submit" aria-label="Keresés">{ICO_SEARCH}</button>
    </form>
    <a class="hdr-tel" href="tel:{TEL}"><small>Hívjon minket</small><b>{TEL_H}</b></a>
    <a class="btn btn-primary" href="kapcsolat.html">Kapcsolat</a>
    <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Menü megnyitása"><span></span><span></span><span></span></button>
  </div></div>
  <nav class="menubar" aria-label="Főmenü"><div class="wrap"><ul class="menu">{menu}</ul></div></nav>
</header>
<nav class="quickbar" aria-label="Gyorsmenü"><div class="wrap"><span class="qb-k">Gyorsan:</span><ul>{quick}</ul></div></nav>
<div class="drawer" id="drawer" hidden>
  <form class="search" role="search" data-go="hirek.html" aria-label="Keresés a szakmai hírekben">
    <label class="vh" for="hq2">Keresés a szakmai hírekben</label>
    <input id="hq2" type="search" placeholder="Keresés a szakmai hírekben" autocomplete="off">
    <button type="submit" aria-label="Keresés">{ICO_SEARCH}</button>
  </form>
  <nav class="dmenu" aria-label="Mobil főmenü">{dmenu}</nav>
  <div class="drawer-foot">
    <a class="drawer-tel" href="tel:{TEL}">{TEL_H}</a>
    <a href="mailto:{MAIL}">{MAIL}</a>
    <a class="btn btn-primary btn-block" href="kapcsolat.html">Kapcsolatfelvétel</a>
  </div>
</div>
<main id="tartalom">
"""


def footer():
    return f'''</main>
<footer class="ftr">
  <div class="ftr-top"></div>
  <div class="wrap ftr-grid">
    <div>
      {logo(dark=True)}
      <dl class="ftr-data">
        <div><dt>Cégnév</dt><dd>MultiCont Center Kft.</dd></div>
        <div><dt>Iroda</dt><dd>{ADDR}</dd></div>
        <div><dt>Adószám</dt><dd>25378669-2-13</dd></div>
        <div><dt>Cégjegyzékszám</dt><dd>13-09-177232</dd></div>
        <div><dt>Alapítva</dt><dd>2015. szeptember 25.</dd></div>
      </dl>
    </div>
    <nav aria-label="Lábléc – oldalak"><h2>Oldalak</h2><ul>
      <li><a href="rolunk.html">Rólunk</a></li><li><a href="szolgaltatasok.html">Szolgáltatásaink</a></li>
      <li><a href="partnerek.html">Partnereink</a></li><li><a href="kapcsolat.html">Kapcsolat</a></li>
    </ul></nav>
    <nav aria-label="Lábléc – szakmai tartalom"><h2>Szakmai tartalom</h2><ul>
      <li><a href="hirek.html">Szakmai hírek</a></li><li><a href="hirek.html?kat=Hat%C3%A1rid%C5%91k">Határidők</a></li>
      <li><a href="tudastar.html#kalkulatorok">Kalkulátorok</a></li><li><a href="tudastar.html#dokumentumtar">Dokumentumtár</a></li>
    </ul></nav>
    <div><h2>Elérhetőség</h2><ul>
      <li><a class="ftr-tel" href="tel:{TEL}">{TEL_H}</a></li><li><a href="mailto:{MAIL}">{MAIL}</a></li>
      <li>{ADDR}</li><li><a href="kapcsolat.html#urlap">Visszahívást kérek →</a></li>
    </ul></div>
  </div>
  <div class="wrap ftr-bottom">
    <p>© <span id="ev">2026</span> MultiCont Center Kft. · Magyar és német nyelven</p>
    <ul>
      <li><button type="button" data-dlg="impresszum">Impresszum</button></li>
      <li><button type="button" data-dlg="adatkezeles">Adatkezelési tájékoztató</button></li>
      <li><a href="admin.html">Kezelőfelület (látványterv)</a></li>
    </ul>
  </div>
</footer>
<div class="mbar"><a class="mbar-tel" href="tel:{TEL}">{ICO_PHONE.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"')}{TEL_H}</a><a class="mbar-c" href="kapcsolat.html">Üzenet</a></div>
<dialog class="dlg" id="dlg-impresszum" aria-labelledby="imp-t"><div class="dlg-in">
  <button class="dlg-x" type="button" data-close aria-label="Bezárás">×</button>
  <p class="kicker">Impresszum</p><h2 id="imp-t">MultiCont Center Kft.</h2>
  <dl>
    <div><dt>Megnevezés</dt><dd>MultiCont Center – Budaörsi Könyvelőiroda</dd></div>
    <div><dt>Iroda</dt><dd>{ADDR}</dd></div>
    <div><dt>Telefon</dt><dd><a href="tel:{TEL}">{TEL_H}</a></dd></div>
    <div><dt>E-mail</dt><dd><a href="mailto:{MAIL}">{MAIL}</a></dd></div>
    <div><dt>Adószám</dt><dd>25378669-2-13</dd></div>
    <div><dt>Cégjegyzékszám</dt><dd>13-09-177232</dd></div>
    <div><dt>Alapítás</dt><dd>2015. szeptember 25.</dd></div>
  </dl>
  <p class="pending" style="margin-top:14px">Székhely, nyilvántartó bíróság és tárhelyszolgáltató: jóváhagyásra vár.</p>
</div></dialog>
<dialog class="dlg" id="dlg-adatkezeles" aria-labelledby="adat-t"><div class="dlg-in">
  <button class="dlg-x" type="button" data-close aria-label="Bezárás">×</button>
  <p class="kicker">Jogi dokumentum</p><h2 id="adat-t">Adatkezelési tájékoztató</h2>
  <p class="pending">A tájékoztató szövege jóváhagyásra vár. Élesítés előtt az ügyféllel egyeztetett, végleges dokumentum kerül ide.</p>
</div></dialog>
<script src="tartalom.js" defer></script>
<script src="mc.js" defer></script>
</body>
</html>
'''


def phead(title, lead, crumbs):
    cr = '<li><a href="index.html">Főoldal</a></li>' + "".join(
        f'<li>{c}</li>' if not isinstance(c, tuple) else f'<li><a href="{c[0]}">{c[1]}</a></li>' for c in crumbs)
    return f'''<section class="phead"><div class="wrap">
  <nav aria-label="Morzsamenü"><ol class="crumbs">{cr}</ol></nav>
  <h1 class="h1">{title}</h1>
  <p class="lead">{lead}</p>
</div></section>
'''


def page(name, title, desc, active, body):
    (OUT / name).write_text(head(title, desc) + header(active) + body + footer(), encoding="utf-8")


# ======================= FŐOLDAL =======================
SVC = [("konyveles", "Könyvelés", "Egyéni vállalkozók, bt.-k és kft.-k teljes körű könyvelése."),
       ("berszamfejtes", "Bérszámfejtés", "Bérek számfejtése és a kapcsolódó TB-ügyintézés."),
       ("adotanacsadas", "Adótanácsadás", "Adózási kérdésekben, adótanácsadói végzettséggel."),
       ("nav-tb", "NAV- és TB-képviselet", "Képviselet a hatóságok előtt."),
       ("online", "Online könyvelés", "Távkönyvelés az ország bármely részéről."),
       ("vegelszamolas", "Végelszámolás", "Egyszerűsített és normál végelszámolás, a cég törléséig.")]
svc_ed = "".join(
    f'<li{" class=\"key\"" if k == "vegelszamolas" else ""}><span class="n">{i+1:02d}</span><div><h3>{t}</h3><p>{d}</p></div><a href="szolgaltatasok.html#{k}">Részletek</a></li>'
    for i, (k, t, d) in enumerate(SVC))

home = f'''
<section class="intro">
  <div class="wrap">
    <div>
      <p class="kicker">Könyvelőiroda · Budaörs · 2015 óta</p>
      <h1 class="h1">Könyvelés, amire hosszú távon is építhet.</h1>
      <p class="lead">A MultiCont Center Kft. egyéni vállalkozók, betéti társaságok és kft.&#8209;k könyvelését végzi. Nálunk nem csak a havi bevallás készül el: olyan könyvelővel dolgozik, aki ismeri a vállalkozását, és szól, ha változik valami.</p>
      <div class="intro-btns">
        <a class="btn btn-primary" href="kapcsolat.html">Konzultációt kérek</a>
        <a class="btn btn-line" href="szolgaltatasok.html">Szolgáltatásaink</a>
      </div>
    </div>
    <div>
      <p class="kicker" style="margin-bottom:10px">Kiemelt szakmai hír</p>
      <a class="featured" data-mod="featured" href="hirek.html"><span class="muted">Betöltés…</span></a>
    </div>
  </div>
</section>

<div class="wrap portal">

  <aside class="col-l" aria-label="Szakmai információk">
    <section>
      <div class="mod-h"><h2>Aktuális adóhírek</h2><a href="hirek.html">Összes</a></div>
      <ul class="m-news" data-mod="news-mini" data-n="3" data-cats="Adózási változások|NAV-információk|Jogszabályi tájékoztatók"></ul>
    </section>
    <section>
      <div class="mod-h"><h2>Fontos határidők</h2><a href="hirek.html?kat=Hat%C3%A1rid%C5%91k">Mind</a></div>
      <ul class="m-dead" data-mod="deadlines" data-n="4"></ul>
      <p class="src">Forrás: <a href="https://www.accace.hu/adonaptar/" target="_blank" rel="noopener">Accace Adónaptár</a> · ellenőrizve 2026. október 14.</p>
    </section>
    <section>
      <div class="mod-h"><h2>Jogszabályi változások</h2></div>
      <ol class="m-time" data-mod="timeline"></ol>
    </section>
    <section>
      <div class="mod-h"><h2>Könyvelési tudnivalók</h2></div>
      <ol class="m-know">
        <li>A KATA tételes adóját minden hónap 12-éig kell befizetni.</li>
        <li>Az alanyi ÁFA-mentesség határa 2026-ban 20 millió Ft.</li>
        <li>Az átalányadózók költséghányada 2026-tól 45%.</li>
        <li>A KATA éves bevallása a következő év február 25-éig esedékes.</li>
      </ol>
      <p class="src"><a href="hirek.html?kat=V%C3%A1llalkoz%C3%B3i%20tudnival%C3%B3k">Részletek és források →</a></p>
    </section>
    <section>
      <div class="mod-h"><h2>Friss szakmai cikkek</h2></div>
      <ul class="m-news" data-mod="news-mini" data-n="3" data-cats="Vállalkozói tudnivalók|Bérszámfejtés|Számvitel"></ul>
    </section>
  </aside>

  <div class="col-m">
    <section class="sec-m" aria-labelledby="h-rolunk">
      <p class="kicker">A MultiCont Centerről</p>
      <h2 class="h2" id="h-rolunk">Egy könyvelő, aki a vállalkozása mellett áll</h2>
      <div class="story">
        <p class="story-year">2015<small>alapítás</small></p>
        <div>
          <p>Horváth Mária harminc éve dolgozik pénzüggyel és számvitellel. Pályája során a költségvetési szférában, magyar és nemzetközi tulajdonú vállalkozásoknál dolgozott, öt évig cafeteria-tanácsadó volt, és biztosításokkal is foglalkozott. 2015. szeptember 25-én alapította meg a MultiCont Center Kft.-t.</p>
          <p>A név is erről szól: a <i>multi</i> a sokoldalúságra és a fejlődésre utal, a <i>cont</i> a számvitelre és az üzleti megállapodásokra, a <i>center</i> pedig arra, hogy az iroda a partnerei közös pontja legyen.</p>
        </div>
      </div>
    </section>

    <section class="sec-m" aria-labelledby="h-szemlelet">
      <p class="kicker">Szemléletünk</p>
      <h2 class="h2" id="h-szemlelet">Személyes kapcsolat, nem ügyfélszám</h2>
      <p>Kisvállalkozásokkal dolgozunk, közvetlenül. A kérdéseire az válaszol, aki a könyveit vezeti, és ha a szabályok változnak, előre szólunk. A könyvelés így nem kötelező teher, hanem biztos háttér a döntéseihez.</p>
      <blockquote class="quote"><p>„Megbízható, rugalmas, magas színvonalú szolgáltatást nyújtok kisvállalkozók részére.”</p><footer>Horváth Mária</footer></blockquote>
    </section>

    <section class="sec-m" aria-labelledby="h-szolg">
      <p class="kicker">Szolgáltatásaink</p>
      <h2 class="h2" id="h-szolg">Amiben segítünk</h2>
      <ol class="svc-ed">{svc_ed}</ol>
    </section>

    <section class="sec-m" aria-labelledby="h-maria">
      <p class="kicker">A szakmai vezető</p>
      <h2 class="h2 vh" id="h-maria">Horváth Mária</h2>
      <div class="person">
        <div class="photo" role="img" aria-label="Horváth Mária fotójának helye">Horváth Mária saját fotójának helye</div>
        <div>
          <p class="name">Horváth Mária</p>
          <p class="role">Mérlegképes könyvelő, adótanácsadó</p>
          <p>Harminc év pénzügyi-számviteli gyakorlattal vezeti az irodát. Ügyfeleit személyesen Budaörsön, illetve online fogadja az ország bármely részéről, magyar és német nyelven.</p>
          <ul class="quals" aria-label="Végzettségek"><li>Mérlegképes könyvelő</li><li>Adótanácsadó</li><li>TB-ügyintéző</li><li>Bérügyintéző</li></ul>
          <p style="margin-top:16px"><a class="link-arrow" href="rolunk.html">Bővebben rólunk</a></p>
        </div>
      </div>
    </section>

    <section class="sec-m" aria-labelledby="h-vall">
      <p class="kicker">Vállalkozóknak</p>
      <h2 class="h2" id="h-vall">Kinek dolgozunk?</h2>
      <ul class="facts">
        <li><b>Egyéni vállalkozóknak</b><span>könyvelés, bevallás, adózási tanács</span></li>
        <li><b>Bt.-knek és kft.-knek</b><span>teljes körű könyvelés, bérekkel</span></li>
        <li><b>Országosan</b><span>online együttműködéssel</span></li>
      </ul>
      <p style="margin-top:16px">Külföldi partnerekkel németül is tartjuk a kapcsolatot. Ha cégét meg szeretné szüntetni, a végelszámolást is végigvisszük.</p>
    </section>

    <section class="sec-m">
      <div class="cta">
        <div><h2>Beszéljük át, mire van szüksége.</h2><p>Hívjon, vagy írjon: egy rövid beszélgetésben átnézzük, hogyan tudunk együtt dolgozni.</p></div>
        <div class="btns"><a class="btn btn-primary" href="tel:{TEL}">{TEL_H}</a><a class="btn btn-ghost" href="kapcsolat.html">Üzenetet küldök</a></div>
      </div>
    </section>
  </div>

  <aside class="col-r" aria-label="Hasznos eszközök">
    <section class="m-calc">
      <div class="mod-h"><h2>Bérkalkulátor</h2><a href="tudastar.html#kalkulatorok">Több</a></div>
      <label for="q-brutto">Bruttó havi bér (Ft)</label>
      <input class="num" id="q-brutto" type="text" inputmode="numeric" value="400 000" autocomplete="off">
      <dl><div><dt>Nettó bér</dt><dd id="q-netto">–</dd></div><div><dt>Munkáltatói költség</dt><dd id="q-koltseg">–</dd></div></dl>
      <p class="note">2026-os kulcsokkal, kedvezmények nélkül.</p>
    </section>
    <section>
      <div class="mod-h"><h2>Letölthető dokumentumok</h2><a href="tudastar.html#dokumentumtar">Tár</a></div>
      <ul class="m-docs" data-mod="docs-mini"></ul>
    </section>
    <section>
      <div class="mod-h"><h2>Nyomtatványok</h2></div>
      <ul class="m-links" data-mod="forms-mini"></ul>
    </section>
    <section>
      <div class="mod-h"><h2>Szakmai linkek</h2></div>
      <ul class="m-links" data-mod="links"></ul>
    </section>
    <section>
      <div class="mod-h"><h2>Ajánlott partnerek</h2></div>
      <div class="m-partner"><p>A partnerlista most készül. Szívesen ajánlaná vállalkozását ügyfeleinknek?</p><a class="link-arrow" href="partnerek.html">Partnereink</a></div>
    </section>
    <section class="m-contact">
      <div class="mod-h"><h2>Kapcsolat</h2></div>
      <a class="tel" href="tel:{TEL}">{TEL_H}</a>
      <p><a href="mailto:{MAIL}">{MAIL}</a></p>
      <p>{ADDR}</p>
      <p><a href="{MAPS}" target="_blank" rel="noopener">Útvonaltervezés ↗</a></p>
    </section>
  </aside>
</div>

<section class="band band-navy" aria-labelledby="h-spec">
  <div class="wrap spec">
    <div>
      <p class="kicker">Kiemelt szakterület</p>
      <h2 class="h2" id="h-spec">Megszüntetné a cégét? Végigvisszük Ön helyett.</h2>
      <p style="margin-top:12px">A végelszámolás az iroda egyik szakterülete. Az iratoktól a cégtörlésig intézzük a folyamatot, Önnek csak döntenie kell.</p>
      <div class="spec-kinds">
        <div><h3>Egyszerűsített végelszámolás</h3><p>Ha a feltételek adottak: rövidebb, kevesebb lépéssel.</p></div>
        <div><h3>Normál végelszámolás</h3><p>Minden más esetben, a teljes eljárással.</p></div>
      </div>
    </div>
    <div class="spec-card">
      <p class="t">Melyik eljárás jöhet szóba?</p>
      <p class="muted" style="margin-top:6px">Egy rövid beszélgetés után megmondjuk.</p>
      <a class="tel" href="tel:{TEL}">{TEL_H}</a>
      <a class="mail" href="mailto:{MAIL}">{MAIL}</a>
      <a class="btn btn-primary btn-block" href="kapcsolat.html?tema=V%C3%A9gelsz%C3%A1mol%C3%A1s#urlap">Érdeklődöm a végelszámolásról</a>
    </div>
  </div>
</section>

<section class="band band-off" aria-labelledby="h-partner">
  <div class="wrap">
    <div class="band-head">
      <div><p class="kicker">Partnereink</p><h2 class="h2" id="h-partner">Vállalkozások, akik ajánlják egymást</h2></div>
      <p class="lead">A MultiCont Center szeretné összekötni a jó szakembereket: ügyvédeket, pénzügyi tanácsadókat, szoftverforgalmazókat, akiknek az ügyfelei könyvelőt keresnek – és fordítva.</p>
    </div>
    <div class="intro-btns" style="margin-top:0"><a class="btn btn-primary" href="partnerek.html#jelentkezes">Partnernek jelentkezem</a><a class="btn btn-line" href="partnerek.html">A partnerprogramról</a></div>
  </div>
</section>
'''
page("index.html", "MultiCont Center Kft. – Könyvelőiroda Budaörs | Könyvelés, adótanácsadás, végelszámolás",
     "Budaörsi könyvelőiroda 2015 óta: könyvelés, bérszámfejtés, adótanácsadás, NAV- és TB-képviselet, online könyvelés és végelszámolás. Horváth Mária, +36 20 433 7811.",
     "index.html", home)

# ======================= RÓLUNK =======================
rolunk = phead("Rólunk", "A MultiCont Center Kft. 2015 óta működő budaörsi könyvelőiroda. Szakmai vezetője Horváth Mária, mérlegképes könyvelő és adótanácsadó.", ["Rólunk"]) + f'''
<div class="wrap about">
  <div>
    <section class="sec-m" id="tortenet">
      <p class="kicker">Történetünk</p>
      <h2 class="h2">Harminc év tapasztalat, egy irodában</h2>
      <p>Horváth Mária harminc éve dolgozik pénzüggyel és számvitellel. Pályája során a költségvetési szférában, magyar és nemzetközi tulajdonú vállalkozásoknál is dolgozott; öt évig cafeteria-tanácsadó volt, és biztosításokkal is foglalkozott.</p>
      <p>2015. szeptember 25-én alapította meg a MultiCont Center Kft.-t. A cég eredetileg sem kizárólag könyvelésre jött létre, és ma is nyitott új tevékenységi területekre.</p>
    </section>
    <section class="sec-m" id="szakmai-ut">
      <p class="kicker">Szakmai út</p>
      <h2 class="h2">Ahol a tapasztalat összegyűlt</h2>
      <ol class="ledger" style="margin-top:8px">
        <li><span class="k">Terület</span><span class="v">Költségvetési szféra</span></li>
        <li><span class="k">Terület</span><span class="v">Magyar tulajdonú vállalkozások</span></li>
        <li><span class="k">Terület</span><span class="v">Nemzetközi tulajdonú vállalkozások</span></li>
        <li><span class="k">5 év</span><span class="v">Cafeteria-tanácsadás, biztosítások</span></li>
        <li><span class="k">2015</span><span class="v">A MultiCont Center Kft. megalapítása</span></li>
      </ol>
    </section>
    <section class="sec-m" id="nev">
      <p class="kicker">A név jelentése</p>
      <h2 class="h2">Multi · Cont · Center</h2>
      <ol class="ledger" style="margin-top:8px">
        <li><span class="k">Multi</span><span class="v" style="font-weight:400">Sokoldalúság, különböző szakterületek és a fejlődés lehetősége.</span></li>
        <li><span class="k">Cont</span><span class="v" style="font-weight:400">A számvitel (conti) és az üzleti megállapodások, szerződések (contract) világa.</span></li>
        <li><span class="k">Center</span><span class="v" style="font-weight:400">Együttműködés: szolgáltatási és partneri központ.</span></li>
      </ol>
      <p style="margin-top:14px" class="muted">A logó három eleme ezt a hármat jeleníti meg, közös középpont körül – egy oldalát nyitva hagyva a növekedésnek.</p>
    </section>
    <section class="sec-m">
      <p class="kicker">Ahogy dolgozunk</p>
      <h2 class="h2">Személyesen, online, két nyelven</h2>
      <ul class="facts">
        <li><b>Személyesen</b><span>Budaörsön, {ADDR.split(', ')[1]}</span></li>
        <li><b>Online</b><span>az ország bármely részéről</span></li>
        <li><b>Magyarul és németül</b><span>külföldi partnereknek is</span></li>
      </ul>
      <p style="margin-top:16px">Munkánkat felelősségbiztosítás mellett végezzük.</p>
    </section>
  </div>
  <aside style="display:flex;flex-direction:column;gap:28px">
    <div class="photo" role="img" aria-label="Horváth Mária fotójának helye">Horváth Mária saját fotójának helye</div>
    <div>
      <p class="h3" style="font-family:var(--serif);color:var(--navy)">Horváth Mária</p>
      <p class="muted">Mérlegképes könyvelő, adótanácsadó, TB- és bérügyintéző</p>
    </div>
    <div class="datacard" id="cegadatok">
      <div class="mod-h" style="margin-bottom:0"><h2>Cégadatok</h2></div>
      <dl>
        <div><dt>Cégnév</dt><dd>MultiCont Center Kft.</dd></div>
        <div><dt>Iroda</dt><dd>{ADDR}</dd></div>
        <div><dt>Adószám</dt><dd>25378669-2-13</dd></div>
        <div><dt>Cégjegyzékszám</dt><dd>13-09-177232</dd></div>
        <div><dt>Alapítva</dt><dd>2015. szeptember 25.</dd></div>
        <div><dt>Nyelvek</dt><dd>magyar, német</dd></div>
      </dl>
    </div>
    <a class="btn btn-primary btn-block" href="kapcsolat.html">Kapcsolatfelvétel</a>
  </aside>
</div>
'''
page("rolunk.html", "Rólunk – MultiCont Center Kft. | Horváth Mária, könyvelő, adótanácsadó",
     "A MultiCont Center Kft. története és szakmai vezetője, Horváth Mária: 30 év pénzügyi-számviteli tapasztalat, budaörsi könyvelőiroda 2015 óta.", "rolunk.html", rolunk)

# ======================= SZOLGÁLTATÁSOK =======================
SVC_FULL = [
    ("konyveles", "Könyvelés", "Egyéni vállalkozások, betéti társaságok és kft.-k teljes körű könyvelése, a bizonylatoktól a bevallásig.",
     [("Kinek", "egyéni vállalkozóknak, bt.-knek, kft.-knek"), ("Hogyan", "személyesen Budaörsön vagy online, távkönyveléssel"), ("Nyelv", "magyar, német")], "Könyvelés"),
    ("berszamfejtes", "Bérszámfejtés", "Munkavállalók bérének számfejtése és a kapcsolódó társadalombiztosítási ügyintézés. Horváth Mária TB- és bérügyintézői végzettséggel rendelkezik.",
     [("Kinek", "munkavállalót foglalkoztató vállalkozásoknak"), ("Kapcsolódik", "TB-ügyintézés, bejelentések")], "Bérszámfejtés"),
    ("adotanacsadas", "Adótanácsadás", "Adózási kérdésekben adótanácsadói végzettséggel segítünk – például ha adózási formát választana vagy váltana.",
     [("Kinek", "induló és működő vállalkozásoknak"), ("Hasznos", "a Szakmai hírek aktuális változásai")], "Adótanácsadás"),
    ("nav-tb", "NAV- és TB-képviselet", "Képviseljük vállalkozását a NAV és a társadalombiztosítási szervek előtt.",
     [("Kinek", "ügyfeleinknek, megbízás alapján")], "NAV- és TB-képviselet"),
    ("online", "Online könyvelés", "Távkönyvelés az ország bármely részéről: nem kell Budaörs közelében lennie ahhoz, hogy velünk dolgozzon.",
     [("Kinek", "országosan, bárkinek"), ("Hogyan", "elektronikus bizonylatküldéssel, telefonos és e-mailes kapcsolattartással")], "Online könyvelés"),
    ("vegelszamolas", "Cégmegszűnés, végelszámolás", "Egyszerűsített és normál végelszámolás nagy tapasztalattal. Az iratoktól a cégtörlésig végigvisszük a folyamatot.",
     [("Egyszerűsített", "ha a feltételek adottak: rövidebb, kevesebb lépéssel"), ("Normál", "minden más esetben, a teljes eljárással")], "Végelszámolás"),
]
toc = "".join(f'<a href="#{k}">{t}</a>' for k, t, *_ in SVC_FULL)
secs = ""
for i, (k, t, txt, rows, tema) in enumerate(SVC_FULL):
    dl = "".join(f"<dt>{a}</dt><dd>{b}</dd>" for a, b in rows)
    secs += f'''<section class="svc-sec{' key' if k == 'vegelszamolas' else ''}" id="{k}">
  <span class="num-big">{i+1:02d}</span>
  <div>
    {'<span class="badge badge-live" style="margin-bottom:10px">Kiemelt szakterület</span>' if k == 'vegelszamolas' else ''}
    <h2>{t}</h2>
    <p class="intro-t">{txt}</p>
    <dl>{dl}</dl>
    <p class="actions"><a class="btn btn-line btn-sm" href="kapcsolat.html?tema={tema.replace(' ', '%20')}#urlap">Érdeklődöm</a></p>
  </div>
</section>
'''
szolg = phead("Szolgáltatásaink", "Egyéni vállalkozók, betéti társaságok és kft.-k könyvelése a bérszámfejtéstől a hatósági képviseletig. Kiemelt szakterületünk a végelszámolás.", ["Szolgáltatásaink"]) + f'''
<div class="wrap svc-page">
  <nav class="toc" aria-label="Szolgáltatások"><p>Tartalom</p>{toc}</nav>
  <div>
    {secs}
    <div class="cta" style="margin-top:36px">
      <div><h2>Nem biztos benne, mire van szüksége?</h2><p>Mondja el, mivel foglalkozik a vállalkozása – megmondjuk, mit tudunk vállalni. Munkánkat felelősségbiztosítás mellett végezzük.</p></div>
      <div class="btns"><a class="btn btn-primary" href="tel:{TEL}">{TEL_H}</a><a class="btn btn-ghost" href="kapcsolat.html">Üzenetet küldök</a></div>
    </div>
  </div>
</div>
'''
page("szolgaltatasok.html", "Szolgáltatásaink – MultiCont Center Kft. | Könyvelés, bérszámfejtés, végelszámolás",
     "Könyvelés, bérszámfejtés, adótanácsadás, NAV- és TB-képviselet, online könyvelés és végelszámolás Budaörsön és online.", "szolgaltatasok.html", szolg)

# ======================= SZAKMAI HÍREK =======================
side = f'''<aside style="display:flex;flex-direction:column;gap:32px">
    <section><div class="mod-h"><h2>Fontos határidők</h2></div><ul class="m-dead" data-mod="deadlines" data-n="5"></ul>
      <p class="src">Forrás: <a href="https://www.accace.hu/adonaptar/" target="_blank" rel="noopener">Accace Adónaptár</a></p></section>
    <section><div class="mod-h"><h2>Jogszabályi változások</h2></div><ol class="m-time" data-mod="timeline"></ol></section>
    <section class="m-contact"><div class="mod-h"><h2>Kérdése van?</h2></div><a class="tel" href="tel:{TEL}">{TEL_H}</a><p><a href="mailto:{MAIL}">{MAIL}</a></p></section>
  </aside>'''
hirek = phead("Szakmai hírek", "Adózási változások, határidők és vállalkozói tudnivalók. Minden cikk mellett ott a forrás és a dátum.", ["Szakmai hírek"]) + f'''
<div class="wrap mag">
  <div>
    <form class="toolbar" id="mag-search" role="search">
      <div class="search"><label class="vh" for="mag-q">Keresés a cikkekben</label><input id="mag-q" type="search" placeholder="Keresés a cikkekben" autocomplete="off"><button type="submit" aria-label="Keresés">{ICO_SEARCH}</button></div>
      <span class="count" id="mag-count" aria-live="polite"></span>
    </form>
    <div class="filters" id="mag-filters" aria-label="Kategóriák"></div>
    <a class="lead-art" id="mag-lead" href="#" hidden></a>
    <ul class="art-list" id="mag-list"></ul>
    <p class="disclaimer">Tájékoztató összefoglalók. Az irányadó mindig a hivatalos jogszabály és a NAV közleménye.</p>
  </div>
  {side}
</div>
'''
page("hirek.html", "Szakmai hírek – MultiCont Center Kft. | Adózás, határidők, vállalkozói tudnivalók",
     "Adózási változások, határidők, bérszámfejtési és vállalkozói tudnivalók forrásmegjelöléssel.", "hirek.html", hirek)

cikk = f'''<section class="phead"><div class="wrap" style="padding-bottom:20px">
  <nav aria-label="Morzsamenü"><ol class="crumbs"><li><a href="index.html">Főoldal</a></li><li><a href="hirek.html">Szakmai hírek</a></li><li id="crumb-cikk"></li></ol></nav>
</div></section>
<div class="wrap mag">
  <div>
    <article class="article" id="article"></article>
    <section class="related"><div class="mod-h"><h2>Kapcsolódó cikkek</h2><a href="hirek.html">Összes cikk</a></div><ul class="art-list" id="related"></ul></section>
  </div>
  {side}
</div>
'''
page("cikk.html", "Szakmai hírek – MultiCont Center Kft.", "Szakmai cikk forrásmegjelöléssel.", "hirek.html", cikk)

# ======================= TUDÁSTÁR =======================
SRC_BER = 'Kulcsok: SZJA 15%, TB-járulék 18,5%, szociális hozzájárulási adó 13% (2026). Forrás: <a href="https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/" target="_blank" rel="noopener">TaxHungary</a>, ellenőrizve 2026. 10. 14. Kedvezményeket (családi, első házas, személyi) nem számol.'
tudas = phead("Tudástár", "Kalkulátorok, letölthető dokumentumok és hivatalos nyomtatványok egy helyen.", ["Tudástár"]) + f'''
<section class="band" id="kalkulatorok" style="padding-top:44px">
  <div class="wrap">
    <div class="band-head"><div><p class="kicker">Kalkulátorok</p><h2 class="h2">Számoljon utána</h2></div><p class="lead">Tájékoztató számítások, ellenőrzött 2026-os kulcsokkal. A pontos összeghez kérje a segítségünket.</p></div>
    <div class="tabs" role="tablist" aria-label="Kalkulátorok">
      <button role="tab" id="t-ber" data-hash="ber" aria-controls="p-ber" aria-selected="true">Bruttó–nettó bér</button>
      <button role="tab" id="t-mk" data-hash="koltseg" aria-controls="p-mk" aria-selected="false" tabindex="-1">Munkáltatói költség</button>
      <button role="tab" id="t-kata" data-hash="kata" aria-controls="p-kata" aria-selected="false" tabindex="-1">KATA 2026</button>
      <button role="tab" id="t-afa" data-hash="afa" aria-controls="p-afa" aria-selected="false" tabindex="-1">ÁFA</button>
      <button role="tab" id="t-atal" data-hash="atalany" aria-controls="p-atal" aria-selected="false" tabindex="-1">Átalányadó <span class="badge badge-plan">előkészítés</span></button>
    </div>

    <div class="panel" role="tabpanel" id="p-ber" aria-labelledby="t-ber"><div class="calc-grid">
      <div>
        <div class="field"><label for="b-brutto">Bruttó havi bér (Ft)</label><input class="num" id="b-brutto" type="text" inputmode="numeric" value="400 000" autocomplete="off">
          <div class="presets"><button type="button" data-set="b-brutto" data-val="322800">Minimálbér: 322 800</button><button type="button" data-set="b-brutto" data-val="373200">Garantált bérminimum: 373 200</button></div></div>
        <label class="check"><input type="checkbox" id="b-mentes"> SZJA-mentes vagyok (pl. 25 év alatti vagy kedvezményezett anya)</label>
        <p class="hint">A mentesség felső határát a kalkulátor nem számolja.</p>
      </div>
      <div><dl class="result">
        <div><dt>SZJA (15%)</dt><dd id="b-szja">–</dd></div><div><dt>TB-járulék (18,5%)</dt><dd id="b-tb">–</dd></div>
        <div class="main"><dt>Nettó bér</dt><dd id="b-netto">–</dd></div>
        <div><dt>Szociális hozzájárulási adó (13%)</dt><dd id="b-szocho">–</dd></div><div><dt>Munkáltató teljes költsége</dt><dd id="b-koltseg">–</dd></div>
      </dl><p class="calc-src">{SRC_BER}</p></div>
    </div></div>

    <div class="panel" role="tabpanel" id="p-mk" aria-labelledby="t-mk" hidden><div class="calc-grid">
      <div>
        <div class="field"><label for="mk-brutto">Tervezett bruttó bér (Ft/hó)</label><input class="num" id="mk-brutto" type="text" inputmode="numeric" value="500 000" autocomplete="off"></div>
        <div class="field"><label for="mk-keret">Vagy: mennyit tud havonta bérre költeni? (Ft)</label><input class="num" id="mk-keret" type="text" inputmode="numeric" value="" placeholder="pl. 600 000" autocomplete="off"><p class="hint">Megmutatjuk, mekkora bruttó bér fér bele.</p></div>
      </div>
      <div><dl class="result">
        <div><dt>Szociális hozzájárulási adó (13%)</dt><dd id="mk-szocho">–</dd></div>
        <div class="main"><dt>Munkáltató havi költsége</dt><dd id="mk-ossz">–</dd></div>
        <div><dt>A keretből adható bruttó bér</dt><dd id="mk-maxbrutto">–</dd></div>
      </dl><p class="calc-src">Szociális hozzájárulási adó 13% (2026). Forrás: TaxHungary. Egyéb munkáltatói terheket (pl. rehabilitációs hozzájárulás) nem számol.</p></div>
    </div></div>

    <div class="panel" role="tabpanel" id="p-kata" aria-labelledby="t-kata" hidden><div class="calc-grid">
      <div>
        <div class="field"><label for="k-bevetel">Várható éves bevétel 2026-ban (Ft)</label><input class="num" id="k-bevetel" type="text" inputmode="numeric" value="15 000 000" autocomplete="off"></div>
        <p class="hint">Egész évben katás, főfoglalkozású egyéni vállalkozóra: havi 50 000 Ft tételes adó, 18 millió Ft-os éves bevételi határ, felette 40%. A KATA 2026-ban csak magánszemélyeknek számlázók választhatják.</p>
      </div>
      <div><dl class="result">
        <div><dt>Tételes adó (12 × 50 000 Ft)</dt><dd id="k-teteles">–</dd></div>
        <div><dt>Adó a 18 M Ft feletti részre (40%)</dt><dd id="k-felett">–</dd></div>
        <div class="main"><dt>Fizetendő összesen</dt><dd id="k-ossz">–</dd></div>
      </dl><p class="calc-src">Forrás: <a href="https://financera.hu/szemelyes-penzugyek/kata-kisadozo-vallalkozok-teteles-adoja/" target="_blank" rel="noopener">Financera</a> (2026. 10. 04.). A 2027-re tervezett új KATA-ról <a href="cikk.html?id=uj-kata-2027-tervezet">ebben a cikkben</a> olvashat.</p></div>
    </div></div>

    <div class="panel" role="tabpanel" id="p-afa" aria-labelledby="t-afa" hidden><div class="calc-grid">
      <div>
        <div class="field"><label for="a-osszeg">Összeg (Ft)</label><input class="num" id="a-osszeg" type="text" inputmode="numeric" value="100 000" autocomplete="off"></div>
        <fieldset class="seg"><legend class="vh">A megadott összeg</legend><label><input type="radio" name="a-irany" value="netto" checked> nettó összeg</label><label><input type="radio" name="a-irany" value="brutto"> bruttó összeg</label></fieldset>
        <fieldset class="seg"><legend class="vh">ÁFA-kulcs</legend><label><input type="radio" name="a-kulcs" value="27" checked> 27%</label><label><input type="radio" name="a-kulcs" value="18"> 18%</label><label><input type="radio" name="a-kulcs" value="5"> 5%</label></fieldset>
      </div>
      <div><dl class="result"><div><dt>Nettó</dt><dd id="a-netto">–</dd></div><div><dt>ÁFA</dt><dd id="a-afa">–</dd></div><div class="main"><dt>Bruttó</dt><dd id="a-brutto">–</dd></div></dl>
      <p class="calc-src">Hogy egy termékre vagy szolgáltatásra melyik kulcs vonatkozik, azt a jogszabály határozza meg – kérdés esetén segítünk.</p></div>
    </div></div>

    <div class="panel" role="tabpanel" id="p-atal" aria-labelledby="t-atal" hidden>
      <div class="prep">
        <p class="h3" style="font-family:var(--serif);color:var(--navy)">Átalányadó-kalkulátor – előkészítés alatt</p>
        <p style="margin-top:8px">Ez a modul még nem számol. Élesítés előtt könyvelői ellenőrzéssel teszteljük a képletet, hogy ne mutasson félrevezető eredményt. A számításhoz ezek az ellenőrzött 2026-os adatok kerülnek be:</p>
        <ul><li>45%-os általános költséghányad</li><li>1 936 800 Ft éves adómentes jövedelemrész</li><li>38 736 000 Ft bevételi határ</li><li>SZJA, járulékok és szociális hozzájárulási adó alapjának szabályai</li></ul>
        <p style="margin-top:12px"><a class="link-arrow" href="cikk.html?id=atalanyado-2026">Átalányadó 2026 – cikkünk</a></p>
      </div>
    </div>
  </div>
</section>

<section class="band band-off" id="dokumentumtar">
  <div class="wrap">
    <div class="band-head"><div><p class="kicker">Dokumentumtár</p><h2 class="h2">Dokumentumok és nyomtatványok</h2></div><p class="lead">Letölthető PDF-ek, hivatalos nyomtatványok és az iroda saját anyagai, csoportosítva és kereshetően.</p></div>
    <div class="docs-tools">
      <div class="search"><label class="vh" for="doc-q">Keresés a dokumentumokban</label><input id="doc-q" type="search" placeholder="Keresés a dokumentumokban" autocomplete="off"><button type="button" aria-hidden="true" tabindex="-1">{ICO_SEARCH}</button></div>
      <label class="vh" for="doc-group">Csoport</label><select class="select" id="doc-group"></select>
      <label class="check"><input type="checkbox" id="doc-withdrawn"> Visszavontak is</label>
    </div>
    <p class="count" id="doc-count" aria-live="polite" style="margin-bottom:8px"></p>
    <div id="doclib"></div>
  </div>
</section>

<section class="band" id="linkek">
  <div class="wrap">
    <div class="band-head"><div><p class="kicker">Szakmai linkek</p><h2 class="h2">Gyakran használt oldalak</h2></div><p class="lead">Hivatalos oldalak, amelyeket ügyfeleink a leggyakrabban keresnek.</p></div>
    <ul class="m-links" data-mod="links" style="columns:2;column-gap:48px"></ul>
  </div>
</section>
'''
page("tudastar.html", "Tudástár – MultiCont Center Kft. | Kalkulátorok, dokumentumtár",
     "Bérkalkulátor, munkáltatói költség, KATA- és ÁFA-kalkulátor 2026-os kulcsokkal; letölthető dokumentumok és hivatalos nyomtatványok.", "tudastar.html", tudas)

# ======================= PARTNEREK =======================
partner = phead("Partnereink", "Vállalkozások, akiket jó szívvel ajánlunk – és akik minket ajánlanak. Csatlakozzon a MultiCont Center partnerhálózatához.", ["Partnereink"]) + f'''
<section class="band" style="padding-top:44px">
  <div class="wrap">
    <p class="pending" style="margin-bottom:22px">A partnerlista feltöltés alatt áll. Az alábbi kártyák csak a megjelenést mutatják (<b>minta</b>), valódi partnert nem tartalmaznak.</p>
    <div class="docs-tools" style="grid-template-columns:minmax(0,1fr) 280px">
      <div class="search"><label class="vh" for="p-q">Keresés a partnerek között</label><input id="p-q" type="search" placeholder="Keresés a partnerek között" autocomplete="off"><button type="button" aria-hidden="true" tabindex="-1">{ICO_SEARCH}</button></div>
      <label class="vh" for="p-kat">Kategória</label><select class="select" id="p-kat"></select>
    </div>
    <div class="p-grid" id="p-grid"></div>
  </div>
</section>

<section class="band band-off" id="ajanlo">
  <div class="wrap">
    <div class="band-head"><div><p class="kicker">Ajánlói együttműködés</p><h2 class="h2">Így ajánljuk egymást</h2></div>
      <p class="lead">A rendszer alapja már most működik: az ajánlói kód linkben vagy az űrlapon eljut hozzánk. A teljes nyilvántartáshoz háttérrendszer készül.</p></div>
    <ol class="flow">
      <li><h3>Ajánlói azonosító</h3><p>A partner saját kódot kap, és linkben adja tovább: <code>kapcsolat.html?ajanlo=KÓD</code></p><span class="badge badge-live">Alapverzió működik</span></li>
      <li><h3>Kuponkód</h3><p>A partnerhez saját kedvezménykód tartozik.</p><span class="badge badge-plan">Tervezett</span></li>
      <li><h3>Érdeklődő rögzítése</h3><p>Ma: a kód bekerül az érdeklődő e-mailjébe. Később: nyilvántartás.</p><span class="badge badge-live">Részben működik</span></li>
      <li><h3>Jóváhagyás</h3><p>Az iroda jóváhagyja az ajánlást és a partneradatokat.</p><span class="badge badge-plan">Tervezett</span></li>
      <li><h3>Kampányok</h3><p>Időszakos kedvezménykampányok kezelése.</p><span class="badge badge-plan">Tervezett</span></li>
    </ol>
    <div class="status-grid">
      <div class="status"><h3><span class="badge badge-live">Most működik</span></h3><ul>
        <li>Ajánlói kód a linkben – az oldal megjegyzi és kitölti az űrlapon</li><li>Ajánlói kód mező a kapcsolati űrlapon</li><li>Partnerjelentkezési űrlap ellenőrzéssel</li></ul></div>
      <div class="status plan"><h3><span class="badge badge-plan">Háttérrendszerrel készül</span></h3><ul>
        <li>Ajánlói azonosítók generálása</li><li>Partnerhez tartozó kuponkódok</li><li>Ajánlott érdeklődők nyilvántartása</li><li>Adminisztrátori jóváhagyás, kampányok, partneradat-frissítés</li></ul></div>
    </div>
  </div>
</section>

<section class="band" id="jelentkezes">
  <div class="wrap contact-grid">
    <div>
      <p class="kicker">Partnerjelentkezés</p>
      <h2 class="h2">Legyen a partnerünk</h2>
      <p style="margin-top:12px">Ügyvéd, pénzügyi tanácsadó, biztosítási szakember vagy szoftverforgalmazó? Ha ügyfelei könyvelőt keresnek, és Ön is szívesen fogad ajánlást, töltse ki az űrlapot. Jóváhagyás után bemutatjuk a partnerlistán, a weboldalára mutató hivatkozással.</p>
      <ul class="facts" style="margin-top:20px;grid-template-columns:1fr">
        <li><b>Bemutatkozás</b><span>rövid leírás, kategória, logó</span></li>
        <li style="padding-left:0;border-left:0;border-top:1px solid var(--line)"><b>Hivatkozás</b><span>a partner weboldalára</span></li>
        <li style="padding-left:0;border-left:0;border-top:1px solid var(--line)"><b>Kölcsönös ajánlás</b><span>ajánlói kóddal</span></li>
      </ul>
    </div>
    <form class="form" novalidate data-mail="{MAIL}" data-subject="Partnerjelentkezés">
      <p class="h3">Jelentkezési űrlap</p>
      <p class="intro-n">Küldéskor a levelezőprogramja nyílik meg a kitöltött adatokkal.</p>
      <div class="f2">
        <div class="f"><label for="pj-ceg">Cégnév <span>*</span></label><input id="pj-ceg" name="ceg" data-rule="ceg" data-label="Cégnév" autocomplete="organization"><p class="msg"></p></div>
        <div class="f"><label for="pj-nev">Kapcsolattartó <span>*</span></label><input id="pj-nev" name="nev" data-rule="nev" data-label="Kapcsolattartó" autocomplete="name"><p class="msg"></p></div>
      </div>
      <div class="f2">
        <div class="f"><label for="pj-mail">E-mail <span>*</span></label><input id="pj-mail" type="email" name="email" data-rule="email" data-label="E-mail" autocomplete="email"><p class="msg"></p></div>
        <div class="f"><label for="pj-tel">Telefon</label><input id="pj-tel" type="tel" name="telefon" data-rule="telefon" data-label="Telefon" autocomplete="tel"><p class="msg"></p></div>
      </div>
      <div class="f2">
        <div class="f"><label for="pj-web">Weboldal</label><input id="pj-web" type="url" name="weboldal" data-rule="weboldal" data-label="Weboldal" placeholder="https://"><p class="msg"></p></div>
        <div class="f"><label for="pj-kat">Kategória <span>*</span></label><select id="pj-kat" name="kategoria" data-rule="select" data-label="Kategória"><option value="">Válasszon…</option><option>Jogi szolgáltatás</option><option>Pénzügy és biztosítás</option><option>Informatika és szoftver</option><option>Egyéb vállalkozói szolgáltatás</option></select><p class="msg"></p></div>
      </div>
      <div class="f"><label for="pj-uz">Rövid bemutatkozás <span>*</span></label><textarea id="pj-uz" name="uzenet" data-rule="uzenet" data-label="Bemutatkozás"></textarea><p class="msg"></p></div>
      <label class="check"><input type="checkbox" name="hozzajarul" data-rule="hozzajarul" data-label="Hozzájárulás az adatkezeléshez"> <span>Hozzájárulok, hogy a megadott adatokkal felvegyék velem a kapcsolatot. <span class="msg" style="display:block;color:var(--err);font-size:14px"></span></span></label>
      <button class="btn btn-primary btn-block" type="submit">Jelentkezés elküldése</button>
      <p class="req">* kötelező mező</p>
      <div class="done" hidden role="status"><p><b>Megnyílt a levelezőprogramja.</b> A jelentkezés az Elküldés gombbal érkezik meg hozzánk.</p></div>
    </form>
  </div>
</section>
'''
page("partnerek.html", "Partnereink – MultiCont Center Kft. | Partnerprogram, ajánlói együttműködés",
     "A MultiCont Center partnerhálózata: partnerlista kategóriák szerint, ajánlói együttműködés és partnerjelentkezés.", "partnerek.html", partner)

# ======================= KAPCSOLAT =======================
kapcs = phead("Kapcsolat", "Hívjon, írjon, vagy keressen fel minket Budaörsön. Magyar és német nyelven is.", ["Kapcsolat"]) + f'''
<section class="band" style="padding-top:44px">
  <div class="wrap contact-grid">
    <div>
      <dl class="c-list">
        <div><dt>Telefon</dt><dd><a class="big" href="tel:{TEL}">{TEL_H}</a></dd></div>
        <div><dt>E-mail</dt><dd><a href="mailto:{MAIL}">{MAIL}</a></dd></div>
        <div><dt>Iroda</dt><dd>{ADDR}</dd></div>
        <div><dt>Nyelvek</dt><dd>magyar, német</dd></div>
        <div><dt>Kapcsolattartó</dt><dd>Horváth Mária, könyvelő, adótanácsadó</dd></div>
      </dl>
      <div class="map">
        <iframe title="Térkép: {ADDR}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=2040%20Buda%C3%B6rs%2C%20Meredek%20utca%202.&amp;z=16&amp;hl=hu&amp;output=embed"></iframe>
        <a class="btn btn-line btn-sm" href="{MAPS}" target="_blank" rel="noopener">Útvonaltervezés ↗</a>
      </div>
    </div>
    <form class="form" id="urlap" novalidate data-mail="{MAIL}" data-subject="Érdeklődés a weboldalról">
      <p class="h3">Írjon nekünk</p>
      <p class="intro-n">Küldéskor a levelezőprogramja nyílik meg a kész üzenettel – onnan érkezik meg hozzánk.</p>
      <div class="f2">
        <div class="f"><label for="k-nev">Név <span>*</span></label><input id="k-nev" name="nev" data-rule="nev" data-label="Név" autocomplete="name"><p class="msg"></p></div>
        <div class="f"><label for="k-mail">E-mail <span>*</span></label><input id="k-mail" type="email" name="email" data-rule="email" data-label="E-mail" autocomplete="email"><p class="msg"></p></div>
      </div>
      <div class="f2">
        <div class="f"><label for="k-tel">Telefon</label><input id="k-tel" type="tel" name="telefon" data-rule="telefon" data-label="Telefon" autocomplete="tel" placeholder="+36 …"><p class="msg"></p></div>
        <div class="f"><label for="k-tip">Vállalkozás típusa <span>*</span></label><select id="k-tip" name="tipus" data-rule="select" data-label="Vállalkozás típusa"><option value="">Válasszon…</option><option>Egyéni vállalkozás</option><option>Betéti társaság (bt.)</option><option>Kft.</option><option>Még nincs vállalkozásom</option><option>Egyéb</option></select><p class="msg"></p></div>
      </div>
      <div class="f"><label for="k-tema">Miben segíthetünk? <span>*</span></label><select id="k-tema" name="szolgaltatas" data-rule="select" data-label="Téma"><option value="">Válasszon…</option><option>Könyvelés</option><option>Bérszámfejtés</option><option>Adótanácsadás</option><option>NAV- és TB-képviselet</option><option>Online könyvelés</option><option>Végelszámolás</option><option>Egyéb kérdés</option></select><p class="msg"></p></div>
      <div class="f"><label for="k-uz">Üzenet <span>*</span></label><textarea id="k-uz" name="uzenet" data-rule="uzenet" data-label="Üzenet" placeholder="Röviden írja le, miben segíthetünk."></textarea><p class="msg"></p></div>
      <div class="f2">
        <label class="check" style="align-self:center"><input type="checkbox" name="visszahivas" data-label="Visszahívást kér"> Kérem, hívjanak vissza</label>
        <div class="f"><label for="k-ref">Ajánlói kód (ha van)</label><input id="k-ref" name="ajanlo" data-label="Ajánlói kód" autocomplete="off"></div>
      </div>
      <button class="btn btn-primary btn-block" type="submit">Üzenet elküldése</button>
      <p class="req">* kötelező mező</p>
      <div class="done" hidden role="status">
        <p><b>Megnyílt a levelezőprogramja</b> a kész üzenettel. Az üzenet az Elküldés gombbal érkezik meg hozzánk.</p>
        <p>Nem nyílt meg? <button class="btn btn-line btn-sm" type="button" data-copy>Üzenet másolása</button></p>
      </div>
    </form>
  </div>
</section>
'''
page("kapcsolat.html", "Kapcsolat – MultiCont Center Kft. | +36 20 433 7811, Budaörs",
     "MultiCont Center Kft., 2040 Budaörs, Meredek utca 2. Telefon: +36 20 433 7811, e-mail: konyvelde@gmail.com.", "kapcsolat.html", kapcs)

# telefon kötelező, ha visszahívást kér: a kapcsolat oldalon a telefonmezőt ehhez kötjük (mc.js rules.telefon)
k = (OUT / "kapcsolat.html").read_text(encoding="utf-8")
(OUT / "kapcsolat.html").write_text(k, encoding="utf-8")
print("kész:", ", ".join(sorted(p.name for p in OUT.glob("*.html"))))
