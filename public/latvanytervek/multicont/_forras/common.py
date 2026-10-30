"""MultiCont Center – közös elemek (14. kör): fej, fejléc, lábléc, ikonok."""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent
BASE = "https://daekon-ship.github.io/daekon/latvanytervek/multicont/"
TEL, TEL_H, MAIL = "+36204337811", "+36 20 433 7811", "konyvelde@gmail.com"
ADDR = "2040 Budaörs, Meredek utca 2."
HOURS = "14:00–18:00"
MAPS = "https://www.google.com/maps/dir/?api=1&amp;destination=2040%20Buda%C3%B6rs%2C%20Meredek%20utca%202."
PAGES = []  # sitemaphoz

MARK = ('<svg viewBox="0 0 48 48" aria-hidden="true"><path d=\"M6 6h22v6H12v16H6z\" fill=\"#2764BD\"/><path d=\"M42 42H20v-6h16V20h6z\" fill=\"#28B6A4\"/><rect x=\"18\" y=\"18\" width=\"12\" height=\"12\" fill=\"#F3B85B\"/></svg>')
MARK_D = ('<svg viewBox="0 0 48 48" aria-hidden="true"><path d=\"M6 6h22v6H12v16H6z\" fill=\"#8DB8F2\"/><path d=\"M42 42H20v-6h16V20h6z\" fill=\"#5FD3C4\"/><rect x=\"18\" y=\"18\" width=\"12\" height=\"12\" fill=\"#F3B85B\"/></svg>')
CARET = '<svg class="caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5"/></svg>'
I_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>'
I_PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h3l1.4 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/></svg>'
I_ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

# Szolgáltatás-ikonok: saját geometrikus rajzok, márkaszínekkel
def icon(kind):
    B, N, T, G, S = "#2764BD", "#11243A", "#28B6A4", "#F3B85B", "#EAF3FC"
    body = {
        "konyveles": f'<rect x="4" y="4" width="32" height="32" rx="6" fill="{S}"/><path d="M12 13h16M12 20h16M12 27h9" stroke="{B}" stroke-width="2.6" stroke-linecap="round"/><rect x="25" y="24" width="6" height="6" rx="1.5" fill="{G}"/>',
        "berszamfejtes": f'<rect x="4" y="4" width="32" height="32" rx="6" fill="{S}"/><circle cx="16" cy="16" r="5" fill="none" stroke="{B}" stroke-width="2.6"/><path d="M8 30c1.5-5 4.5-7 8-7s6.5 2 8 7" fill="none" stroke="{B}" stroke-width="2.6" stroke-linecap="round"/><path d="M27 12v12M23.5 15.5 27 12l3.5 3.5" fill="none" stroke="{T}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
        "adotanacsadas": f'<rect x="4" y="4" width="32" height="32" rx="6" fill="{S}"/><path d="M11 29 29 11" stroke="{B}" stroke-width="2.6" stroke-linecap="round"/><circle cx="13" cy="13" r="3.4" fill="none" stroke="{B}" stroke-width="2.4"/><circle cx="27" cy="27" r="3.4" fill="{G}"/>',
        "nav-tb": f'<rect x="4" y="4" width="32" height="32" rx="6" fill="{S}"/><path d="M20 9l9 4v6c0 6-4 10-9 12-5-2-9-6-9-12v-6z" fill="none" stroke="{B}" stroke-width="2.6" stroke-linejoin="round"/><path d="M16 20l3 3 5-6" fill="none" stroke="{T}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
        "online": f'<rect x="4" y="4" width="32" height="32" rx="6" fill="{S}"/><rect x="9" y="11" width="22" height="15" rx="2" fill="none" stroke="{B}" stroke-width="2.6"/><path d="M15 31h10" stroke="{B}" stroke-width="2.6" stroke-linecap="round"/><circle cx="20" cy="18.5" r="3" fill="{T}"/>',
        "vegelszamolas": f'<rect x="4" y="4" width="32" height="32" rx="6" fill="#FDF3E2"/><path d="M11 12h13l5 5v12H11z" fill="none" stroke="{N}" stroke-width="2.6" stroke-linejoin="round"/><path d="M15 23l3 3 6-7" fill="none" stroke="{G}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
    }[kind]
    return f'<svg class="ic" viewBox="0 0 40 40" aria-hidden="true">{body}</svg>'


SVC = [  # slug, menünév, rövid leírás – csak igazolt szolgáltatások
    ("konyveles", "Könyvelés", "Egyéni vállalkozók, bt.-k és kft.-k könyvelése, a bizonylatoktól a bevallásig."),
    ("berszamfejtes", "Bérszámfejtés", "Bérek számfejtése és a kapcsolódó társadalombiztosítási ügyintézés."),
    ("adotanacsadas", "Adózási támogatás", "Adótanácsadói végzettséggel, például adózási forma választásakor."),
    ("nav-tb", "NAV- és TB-képviselet", "Képviselet a NAV és a társadalombiztosítási szervek előtt."),
    ("online", "Online könyvelés, ügyintézés", "Távkönyvelés az ország bármely részéről, elektronikus bizonylatküldéssel."),
    ("vegelszamolas", "Végelszámolás", "Egyszerűsített és normál végelszámolás, az iratoktól a cégtörlésig."),
]
svc_url = lambda k: f"szolgaltatas-{k}.html"

MENU = [
    ("index.html", "Kezdőlap", None),
    ("rolunk.html", "Rólunk", [("rolunk.html#tortenet", "Történetünk"), ("rolunk.html#szakmai-vezeto", "Horváth Mária"),
                               ("rolunk.html#nev", "A név jelentése"), ("rolunk.html#cegadatok", "Cégadatok")]),
    ("szolgaltatasok.html", "Szolgáltatások", [(svc_url(k), t) for k, t, _ in SVC]),
    ("tudastar.html", "Tudástár", [("index.html#tartalom", "Aktuális adóhírek"), ("tudastar.html", "Összes cikk"), ("tudastar.html?tema=KATA", "KATA-változások"),
                                   ("tudastar.html?tema=%C3%81FA", "ÁFA"), ("tudastar.html?tema=SZJA", "SZJA"),
                                   ("tudastar.html?tema=B%C3%A9rsz%C3%A1mfejt%C3%A9s", "Bérszámfejtés"),
                                   ("tudastar.html?tema=%C3%89ves%20ad%C3%B3z%C3%A1si%20k%C3%B6telezetts%C3%A9gek", "Határidők, éves kötelezettségek")]),
    ("kalkulatorok.html", "Kalkulátorok", [("kalkulatorok.html#brutto-netto", "Bruttó → nettó bér"), ("kalkulatorok.html#netto-brutto", "Nettó → bruttó bér"),
                                           ("kalkulatorok.html#munkaltato", "Munkáltatói költség"), ("kalkulatorok.html#afa", "ÁFA"),
                                           ("kalkulatorok.html#kata", "KATA 2026"), ("kalkulatorok.html#eredmeny", "Bevétel – kiadás"),
                                           ("kalkulatorok.html#koltsegterv", "Költségtervező")]),
    ("dokumentumtar.html", "Dokumentumtár", [("dokumentumtar.html?kat=Formanyomtatv%C3%A1nyok", "Formanyomtatványok"), ("dokumentumtar.html?kat=Szakmai%20anyagok", "Szakmai anyagok"), ("dokumentumtar.html?kat=Hivatalos%20online%20fel%C3%BCletek", "Hivatalos online felületek")]),
    ("partnerek.html", "Partnereink", [("partnerek.html", "Partnerlista, partnerlinkek"), ("partnerek.html#ajanlatok", "Kuponajánlatok"),
                                       ("partnerek.html#ajanlo", "Ajánlói rendszer"), ("partnerek.html#jelentkezes", "Partnerjelentkezés")]),
    ("kapcsolat.html", "Kapcsolat", None),
]


def head(name, title, desc, extra=""):
    canon = BASE + ("" if name == "index.html" else name)
    return f'''<!DOCTYPE html>
<html lang="hu" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<!-- látványterv: élesítéskor törlendő -->
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="{canon}">
<meta name="theme-color" content="#2764BD">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="MultiCont Center Kft.">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{BASE}og.png">
<meta name="format-detection" content="telephone=no">
<link rel="preload" href="fonts/plusjakarta.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="mc.css">
<link rel="icon" href="jel.svg" type="image/svg+xml">
<script>document.documentElement.classList.replace('no-js','js')</script>{extra}
</head>
<body>
<a class="skip" href="#tartalom">Ugrás a tartalomhoz</a>
'''


def logo(dark=False):
    return (f'<a class="logo{" dk" if dark else ""}" href="index.html" aria-label="MultiCont Center Kft. – kezdőlap">{MARK_D if dark else MARK}'
            '<span class="logo-t"><span class="logo-n">Multi<span>Cont</span></span><span class="logo-s">CENTER KFT.</span></span></a>')


def header(active):
    items, dm = [], []
    for h, t, sub in MENU:
        cur = ' aria-current="page"' if h == active else ''
        if sub:
            links = "".join(f'<a href="{u}">{n}</a>' for u, n in sub)
            items.append(f'<li class="has-sub"><a href="{h}"{cur} aria-haspopup="true">{t}{CARET}</a><div class="sub">{links}</div></li>')
            dlinks = "".join(f'<a href="{u}">{n}</a>' for u, n in sub)
            dm.append(f'<details class="dm-i"{" open" if h == active else ""}><summary><a href="{h}"{cur}>{t}</a>'
                      f'<span class="tg" aria-hidden="true">{CARET}</span></summary><div class="dm-sub">{dlinks}</div></details>')
        else:
            items.append(f'<li><a href="{h}"{cur}>{t}</a></li>')
            dm.append(f'<div class="dm-i"><a href="{h}"{cur}>{t}</a></div>')
    return f'''<div class="tbar"><div class="wrap">
  <p class="tbar-msg"><b>MultiCont Center Kft.</b>&nbsp;· Könyvelés és pénzügyi háttér vállalkozásoknak, Budaörsön és online</p>
  <div class="tbar-r">
    <a href="tel:{TEL}">{TEL_H}</a><span class="sep hide-s" aria-hidden="true"></span>
    <a class="hide-s" href="mailto:{MAIL}">{MAIL}</a><span class="sep" aria-hidden="true"></span>
    <button class="cta" type="button" data-dlg="visszahivas">Visszahívást kérek</button>
  </div>
</div></div>
<header class="nav" id="nav"><div class="wrap">
  {logo()}
  <nav aria-label="Főmenü"><ul class="menu">{"".join(items)}</ul></nav>
  <a class="btn btn-p btn-s nav-cta" href="kapcsolat.html">Kapcsolatfelvétel</a>
  <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Menü megnyitása"><span></span><span></span><span></span></button>
</div></header>
<div class="drawer" id="drawer" hidden>
  <nav aria-label="Mobil főmenü">{"".join(dm)}</nav>
  <div class="dm-foot">
    <a class="dm-tel" href="tel:{TEL}">{TEL_H}</a>
    <a href="mailto:{MAIL}">{MAIL}</a>
    <a class="btn btn-p btn-b" href="kapcsolat.html">Kapcsolatfelvétel</a>
    <button class="btn btn-o btn-b" type="button" data-dlg="visszahivas">Visszahívást kérek</button>
  </div>
</div>
<main id="tartalom">
'''


def footer(scripts=""):
    svc = "".join(f'<li><a href="{svc_url(k)}">{t}</a></li>' for k, t, _ in SVC)
    return f'''</main>
<footer class="ftr">
  <div class="ftr-band" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="wrap ftr-g">
    <div>
      {logo()}
      <p class="claim">Könyvelés, adózási támogatás és üzleti kapcsolatok egy helyen – 2015 óta, Budaörsön és online.</p>
      <dl class="fdata">
        <div><dt>Cégnév</dt><dd>MultiCont Center Kft.</dd></div>
        <div><dt>Iroda</dt><dd>{ADDR}</dd></div>
        <div><dt>Adószám</dt><dd>25378669-2-13</dd></div>
        <div><dt>Cégjegyzékszám</dt><dd>13-09-177232</dd></div>
      </dl>
    </div>
    <nav aria-label="Lábléc – szolgáltatások"><h2>Szolgáltatások</h2><ul>{svc}</ul></nav>
    <nav aria-label="Lábléc – szakmai tartalom"><h2>Szakmai tartalom</h2><ul>
      <li><a href="tudastar.html">Tudástár</a></li><li><a href="kalkulatorok.html">Kalkulátorok</a></li>
      <li><a href="dokumentumtar.html">Dokumentumtár</a></li><li><a href="partnerek.html">Partnereink</a></li>
      <li><a href="rolunk.html">Rólunk</a></li>
    </ul></nav>
    <div><h2>Kapcsolat</h2><ul>
      <li><a class="tel" href="tel:{TEL}">{TEL_H}</a></li><li><a href="mailto:{MAIL}">{MAIL}</a></li>
      <li class="f-addr">{ADDR}</li><li class="f-hours">Ügyfélfogadás: {HOURS}</li><li class="f-lang">Magyarul és németül</li><li><button class="lnk" type="button" data-dlg="visszahivas">Visszahívást kérek →</button></li>
    </ul></div>
  </div>
  <div class="wrap ftr-b">
    <p>© <span id="ev">2026</span> MultiCont Center Kft.</p>
    <ul>
      <li><button type="button" data-dlg="impresszum">Impresszum</button></li>
      <li><button type="button" data-dlg="adatkezeles">Adatkezelési tájékoztató</button></li>
      <li><button type="button" data-dlg="suti">Süti-beállítások</button></li>
      <li><a href="admin-belepes.html">Kezelőfelület (látványterv)</a></li>
    </ul>
  </div>
</footer>
<div class="mbar"><a class="t" href="tel:{TEL}">Hívás</a><button class="c" type="button" data-dlg="visszahivas">Visszahívást kérek</button></div>
<dialog class="dlg" id="dlg-impresszum" aria-labelledby="imp-t"><div class="dlg-in">
  <button class="dlg-x" type="button" data-close aria-label="Bezárás">×</button>
  <p class="eyebrow">Impresszum</p><h2 id="imp-t">MultiCont Center Kft.</h2>
  <dl>
    <div><dt>Iroda</dt><dd>{ADDR}</dd></div>
    <div><dt>Telefon</dt><dd><a href="tel:{TEL}">{TEL_H}</a></dd></div>
    <div><dt>Ügyfélfogadás</dt><dd>{HOURS}</dd></div>
    <div><dt>E-mail</dt><dd><a href="mailto:{MAIL}">{MAIL}</a></dd></div>
    <div><dt>Adószám</dt><dd>25378669-2-13</dd></div>
    <div><dt>Cégjegyzékszám</dt><dd>13-09-177232</dd></div>
  </dl>
  <p class="pend" style="margin-top:14px">Székhely, nyilvántartó bíróság, képviselő és tárhelyszolgáltató: ellenőrzésre és jóváhagyásra vár.</p>
</div></dialog>
<dialog class="dlg" id="dlg-adatkezeles" aria-labelledby="adat-t"><div class="dlg-in">
  <button class="dlg-x" type="button" data-close aria-label="Bezárás">×</button>
  <p class="eyebrow">Jogi dokumentum</p><h2 id="adat-t">Adatkezelési tájékoztató</h2>
  <p class="pend">Helyőrző. Élesítés előtt az ügyféllel egyeztetett, jogilag ellenőrzött tájékoztató kerül ide (adatkezelő, célok, jogalap, megőrzési idő, érintetti jogok, űrlapok és sütik).</p>
</div></dialog>
<dialog class="dlg" id="dlg-suti" aria-labelledby="suti-t"><div class="dlg-in">
  <button class="dlg-x" type="button" data-close aria-label="Bezárás">×</button>
  <p class="eyebrow">Adatvédelem</p><h2 id="suti-t">Süti-beállítások</h2>
  <p>Az oldal nem használ követő- vagy hirdetési sütit. Külső tartalmat (Google Térkép) csak az Ön engedélyével töltünk be.</p>
  <div style="margin-top:16px;display:grid;gap:12px">
    <label class="check"><input type="checkbox" checked disabled> <span><b>Szükséges</b><br><span class="muted small">Az oldal működéséhez kell, nem kapcsolható ki.</span></span></label>
    <label class="check"><input type="checkbox" id="c-maps"> <span><b>Külső tartalom: Google Térkép</b><br><span class="muted small">A kapcsolati oldalon a térkép betöltéséhez. A Google sütiket helyezhet el.</span></span></label>
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><button class="btn btn-p btn-s" type="button" id="c-save">Beállítások mentése</button><button class="btn btn-o btn-s" type="button" data-close>Mégse</button></div>
</div></dialog>
<dialog class="dlg" id="dlg-visszahivas" aria-labelledby="vh-t"><div class="dlg-in">
  <button class="dlg-x" type="button" data-close aria-label="Bezárás">×</button>
  <p class="eyebrow">Visszahívás</p><h2 id="vh-t">Hívjuk vissza?</h2>
  <p class="muted small" style="margin:-6px 0 16px">Adja meg a nevét és a számát, és visszahívjuk.</p>
  <form class="vh-form" novalidate data-mail="{MAIL}" data-subject="Visszahívás kérése">
    <div class="hp" aria-hidden="true"><label for="vh-web2">Ne töltse ki</label><input id="vh-web2" name="web2" tabindex="-1" autocomplete="off"></div>
    <div class="f"><label for="vh-nev">Név <span>*</span></label><input id="vh-nev" name="nev" data-rule="nev" data-label="Név" autocomplete="name"><p class="msg"></p></div>
    <div class="f"><label for="vh-tel">Telefonszám <span>*</span></label><input id="vh-tel" type="tel" name="telefon" data-rule="telkell" data-label="Telefon" autocomplete="tel" placeholder="+36 …"><p class="msg"></p></div>
    <div class="f"><label for="vh-ido">Mikor hívjuk?</label><select id="vh-ido" name="ido" data-label="Mikor hívjuk"><option>Mindegy</option><option>Délelőtt</option><option>Délután</option></select></div>
    <div class="f"><label for="vh-tema">Miről lenne szó? (nem kötelező)</label><input id="vh-tema" name="tema" data-label="Téma" placeholder="pl. könyvelés, bérszámfejtés"></div>
    <label class="check"><input type="checkbox" name="hozzajarul" data-rule="hozzajarul" data-label="Hozzájárulás"> <span>Hozzájárulok, hogy a megadott számon felhívjanak. <span class="msg" style="display:block"></span></span></label>
    <button class="btn btn-p btn-b" type="submit" style="margin-top:14px">Visszahívást kérek</button>
    <div class="done" hidden role="status"><p><b>Megnyílt a levelezőprogramja</b> a kész kéréssel. Az Elküldés gombbal érkezik meg hozzánk – addig nem kaptuk meg.</p><p>Sürgős? Hívjon: <a href="tel:{TEL}">{TEL_H}</a></p></div>
  </form>
</div></dialog>
<div class="toast" id="toast" role="status" hidden></div>
<script src="tartalom.js" defer></script>
<script src="mc.js" defer></script>{scripts}
</body>
</html>
'''


def ph(title, lead, crumbs, art=True):
    cr = '<li><a href="index.html">Kezdőlap</a></li>' + "".join(
        f'<li><a href="{c[0]}">{c[1]}</a></li>' if isinstance(c, tuple) else f'<li aria-current="page">{c}</li>' for c in crumbs)
    deco = ''
    return f'''<section class="ph"><div class="wrap">
  <nav aria-label="Morzsamenü"><ol class="crumbs">{cr}</ol></nav>
  <h1 class="h1">{title}</h1>
  {f'<p class="lead">{lead}</p>' if lead else ''}
  {deco}
</div></section>
'''


def page(name, title, desc, active, body, extra_head="", scripts="", prio="0.7"):
    PAGES.append((name, prio))
    (OUT / name).write_text(head(name, title, desc, extra_head) + header(active) + body + footer(scripts), encoding="utf-8")
