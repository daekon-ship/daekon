from common import *

ANAV = [("admin.html", "Áttekintés", "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"),
        ("admin.html#oldalak", "Oldalak", "M6 3h9l4 4v14H6zM14 3v5h5"),
        ("admin-cikkek.html", "Hírek, cikkek", "M5 5h14v14H5zM8 9h8M8 13h8M8 17h5"),
        ("admin.html#szolgaltatasok", "Szolgáltatások", "M4 7h16v12H4zM9 7V4h6v3"),
        ("admin-dokumentumok.html", "Dokumentumok", "M7 3h7l5 5v13H7zM10 13h6M10 17h6"),
        ("admin.html#kalkulatorok", "Kalkulátorok", "M6 3h12v18H6zM9 7h6M9 12h1M14 12h1M9 16h1M14 16h1"),
        ("admin-partnerek.html", "Partnerek", "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6M3 20c0-3 2-5 5-5s5 2 5 5M14 15c3 0 6 2 6 5"),
        ("admin-partnerek.html#ajanlatok", "Ajánlatok, kuponok", "M4 8h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4zM10 8v12"),
        ("admin.html#megkeresesek", "Megkeresések", "M4 6h16v12H4zM4 7l8 6 8-6"),
        ("admin.html#beallitasok", "Weboldal-beállítások", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1")]


def ahead(title):
    return f'''<!DOCTYPE html>
<html lang="hu" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} – Kezelőfelület (látványterv) – MultiCont Center</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preload" href="fonts/plusjakarta.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="mc.css">
<link rel="stylesheet" href="admin.css">
<link rel="icon" href="jel.svg" type="image/svg+xml">
<script>document.documentElement.classList.replace('no-js','js');try{{if(!sessionStorage.getItem('mc-admin-demo')&&!/admin-belepes/.test(location.pathname))location.replace('admin-belepes.html?vissza='+encodeURIComponent(location.pathname.split('/').pop()+location.hash))}}catch(e){{}}</script>
</head>
<body class="adm-body">
'''


def admin_page(name, active, title, sub, body, actions=""):
    nav = ""
    for h, t, d in ANAV:
        cur = ' aria-current="page"' if h == active else ''
        nav += f'<a href="{h}"{cur} data-nav="{h}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="{d}"/></svg>{t}</a>'
    html = ahead(title) + f'''<div class="adm">
  <aside class="adm-side" id="adm-side">
    <div class="adm-brand">{logo(True)}</div>
    <nav aria-label="Kezelőfelület menü" class="adm-nav">{nav}</nav>
    <div class="adm-side-f"><a href="index.html">← Vissza a weboldalra</a></div>
  </aside>
  <div class="adm-main">
    <header class="adm-top">
      <button class="adm-burger" id="adm-burger" type="button" aria-expanded="false" aria-controls="adm-side" aria-label="Menü"><span></span><span></span><span></span></button>
      <span class="tag demo">Látványterv · nem ment adatot</span>
      <div class="adm-user"><span class="av" aria-hidden="true">HM</span><span class="nm">Horváth Mária<small>adminisztrátor</small></span><button class="btn btn-o btn-s" type="button" id="adm-out">Kilépés</button></div>
    </header>
    <main class="adm-c" id="tartalom">
      <div class="adm-h"><div><h1 class="h2">{title}</h1><p class="muted">{sub}</p></div><div class="adm-acts">{actions}</div></div>
      {body}
    </main>
  </div>
</div>
<div class="toast" id="toast" role="status" hidden></div>
<script src="tartalom.js" defer></script>
<script src="admin.js" defer></script>
</body>
</html>
'''
    (OUT / name).write_text(html, encoding="utf-8")


# ---------- Belépés ----------
(OUT / "admin-belepes.html").write_text(ahead("Belépés") + f'''<main class="login" id="tartalom">
  <div class="login-card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">{logo()}<span class="tag demo">Látványterv</span></div>
    <h1 class="h3" style="margin-top:26px">Belépés a kezelőfelületre</h1>
    <p class="muted small" style="margin-top:6px">Csak jogosult munkatársaknak.</p>
    <form id="login" novalidate>
      <div id="step1">
        <div class="f" style="margin-top:20px"><label for="l-mail">E-mail-cím</label><input id="l-mail" type="email" autocomplete="username" required><p class="msg"></p></div>
        <div class="f"><label for="l-pw">Jelszó</label><input id="l-pw" type="password" autocomplete="current-password" required><p class="msg"></p></div>
        <button class="btn btn-p btn-b" type="submit">Tovább</button>
      </div>
      <div id="step2" hidden>
        <p class="notice" style="margin-top:20px">Kétlépcsős azonosítás: írja be a hitelesítő alkalmazásban látható 6 jegyű kódot.</p>
        <div class="f" style="margin-top:14px"><label for="l-code">Ellenőrző kód</label><input id="l-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••"><p class="msg"></p></div>
        <button class="btn btn-p btn-b" type="submit">Belépés</button>
      </div>
    </form>
    <div class="pend" style="margin-top:22px">Ez a képernyő csak a folyamatot mutatja: itt nincs valódi hitelesítés, és a kezelőfelület semmit nem ment el. Bármilyen e-mail-cím, 8+ karakteres jelszó és 6 jegyű kód továbbenged a látványtervbe. Élesben szerveroldali belépés, kétlépcsős azonosítás, jogosultságkezelés és naplózás kell.</div>
    <p style="margin-top:18px"><a class="arrow" href="index.html">Vissza a weboldalra</a></p>
  </div>
</main>
<script src="admin.js" defer></script>
</body></html>
''', encoding="utf-8")

# ---------- Áttekintés ----------
MODS = {
    "oldalak": ("Oldalak", "Minden oldal szövege szerkeszthető, és új oldal vagy menüpont is felvehető – például ha új tevékenység kerül be a cégbe. Így a weboldal nyitott marad a további fejlesztési irányokra.",
                ["Oldalanként: cím, bevezető, szakaszok, meta leírás", "Új oldal és új menüpont felvétele (pl. új tevékenység)", "Előnézet, piszkozat → közzététel, verziótörténet"]),
    "szolgaltatasok": ("Szolgáltatások", "A hat szolgáltatásoldal tartalma: leírás, mit tartalmaz, kinek ajánljuk, GYIK, sorrend.",
                       ["Szolgáltatás be- és kikapcsolása", "GYIK-elemek hozzáadása", "Kiemelt szolgáltatás kijelölése"]),
    "kalkulatorok": ("Kalkulátorok", "Kulcsok és határok egy helyen: ha év elején változik egy adókulcs, itt kell átírni, és minden kalkulátor az újjal számol.",
                     ["SZJA, TB-járulék, szocho, ÁFA-kulcsok, KATA-határ", "Hatálybalépés dátuma és forrás kötelező", "Kalkulátor demo/éles állapota"]),
    "megkeresesek": ("Kapcsolati megkeresések", "Élesítés után az űrlapok szerveren keresztül érkeznek, és itt látszanak: téma, ajánlói kód, státusz (új / folyamatban / lezárt).",
                     ["Spamszűrés (honeypot, időzítés, sebességkorlát)", "Ajánlói kód szerinti szűrés", "Adatmegőrzési idő után automatikus törlés"]),
    "beallitasok": ("Weboldal-beállítások", "Cégadatok, elérhetőségek, felső sáv üzenete, közösségi megosztási kép, süti- és adatkezelési szöveg.",
                    ["Felhasználók és jogosultságok (admin / szerkesztő)", "Kétlépcsős azonosítás kötelezővé tétele", "Naplózás: ki, mit, mikor módosított"]),
}
mods = ""
for k, (t, d, li) in MODS.items():
    lis = "".join(f'<li>{x}</li>' for x in li)
    extra = ''
    if k == "oldalak":
        rows = "".join(f'<tr><td><b>{n}</b></td><td>{u}</td><td><span class="tag live t">Közzétéve</span></td><td class="a-act"><button class="btn btn-o btn-s" type="button" data-demo="Oldal szerkesztése">Szerkesztés</button></td></tr>'
                       for n, u in [("Kezdőlap", "index.html"), ("Rólunk", "rolunk.html"), ("Szolgáltatások", "szolgaltatasok.html"), ("Kapcsolat", "kapcsolat.html"), ("Impresszum, adatkezelés", "ablakban")])
        extra = f'<div class="tbl-wrap" style="margin-top:16px"><table class="tbl"><thead><tr><th>Oldal</th><th>Cím</th><th>Állapot</th><th></th></tr></thead><tbody>{rows}</tbody></table></div><div class="ed-acts"><button class="btn btn-p btn-s" type="button" data-demo="Új oldal / menüpont felvétele">+ Új oldal vagy menüpont</button></div>'
    mods += f'<section class="adm-card adm-mod" id="m-{k}" hidden><div class="adm-card-h"><h2>{t}</h2><span class="tag demo">Tervezett modul</span></div><p>{d}</p><ul class="adm-ul">{lis}</ul>{extra}<p class="muted small" style="margin-top:12px">A látványtervben ez a modul csak vázlat; kidolgozott képernyő az Áttekintés, a Hírek, a Dokumentumok és a Partnerek.</p></section>'

admin_page("admin.html", "admin.html", "Áttekintés", "A weboldal tartalmának állapota egy pillantásra.", f'''
<div id="m-attekintes">
  <div class="kpis" id="kpis"></div>
  <div class="adm-grid">
    <section class="adm-card"><div class="adm-card-h"><h2>Teendők</h2></div><ul class="todo" id="todo"></ul></section>
    <section class="adm-card"><div class="adm-card-h"><h2>Gyors műveletek</h2></div>
      <div class="quick">
        <a href="admin-cikkek.html#uj"><b>Új cikk</b><span>Piszkozat, forrással</span></a>
        <a href="admin-dokumentumok.html#feltoltes"><b>Anyag feltöltése</b><span>Formanyomtatvány, szakmai anyag</span></a>
        <a href="admin-partnerek.html#jovahagyas"><b>Jóváhagyások</b><span>Partnerek, ajánlatok</span></a>
        <a href="admin.html#kalkulatorok"><b>Adókulcsok</b><span>Kalkulátorok adatai</span></a>
      </div>
    </section>
  </div>
  <section class="adm-card"><div class="adm-card-h"><h2>Legutóbbi cikkek</h2><a class="arrow small" href="admin-cikkek.html">Mind</a></div><div class="tbl-wrap"><table class="tbl" id="recent"></table></div></section>
</div>
{mods}
''', '<a class="btn btn-p btn-s" href="admin-cikkek.html#uj">+ Új cikk</a>')

# ---------- Cikkek ----------
admin_page("admin-cikkek.html", "admin-cikkek.html", "Hírek, cikkek", "Piszkozat → előnézet → közzététel. Forrás nélkül nem tehető közzé.", '''
<section class="adm-card">
  <div class="adm-card-h"><h2>Cikkek</h2><div class="adm-filters"><label class="vh" for="ac-st">Állapot</label><select class="select" id="ac-st"><option value="">Minden állapot</option><option value="kozzeteve">Közzétéve</option><option value="tervezet">Tervezetről szól</option><option value="piszkozat">Piszkozat</option></select></div></div>
  <div class="tbl-wrap"><table class="tbl" id="ac-tbl"></table></div>
</section>
<section class="adm-card" id="uj">
  <div class="adm-card-h"><h2 id="ed-title">Új cikk</h2><span class="tag n" id="ed-state">Piszkozat</span></div>
  <div class="editor">
    <form id="ed" novalidate>
      <div class="f"><label for="ed-cim">Cím <span>*</span></label><input id="ed-cim" maxlength="110"><p class="msg"></p></div>
      <div class="f2">
        <div class="f"><label for="ed-tema">Fő téma <span>*</span></label><select id="ed-tema"></select><p class="msg"></p></div>
        <div class="f"><label for="ed-hataly">Melyik időszakra vonatkozik? <span>*</span></label><input id="ed-hataly" placeholder="pl. 2026-os adóév"><p class="msg"></p></div>
      </div>
      <div class="f"><label for="ed-lead">Összefoglaló <span>*</span></label><textarea id="ed-lead" style="min-height:80px" maxlength="260"></textarea><p class="msg"></p></div>
      <div class="f"><label for="ed-body">Szöveg (bekezdésenként új sor) <span>*</span></label><textarea id="ed-body" style="min-height:160px"></textarea><p class="msg"></p></div>
      <div class="f2">
        <div class="f"><label for="ed-src">Forrás neve <span>*</span></label><input id="ed-src" placeholder="pl. NAV-közlemény"><p class="msg"></p></div>
        <div class="f"><label for="ed-url">Forrás címe (URL) <span>*</span></label><input id="ed-url" type="url" placeholder="https://"><p class="msg"></p></div>
      </div>
      <label class="check" style="margin-bottom:8px"><input type="checkbox" id="ed-terv"> Tervezetről / el nem fogadott szabályról szól (jelölés a cikken)</label>
      <label class="check"><input type="checkbox" id="ed-kiemelt"> Kiemelt cikk a Tudástárban</label>
      <div class="ed-acts">
        <button class="btn btn-o btn-s" type="button" id="ed-save">Mentés piszkozatként</button>
        <button class="btn btn-n btn-s" type="button" id="ed-prev">Előnézet frissítése</button>
        <button class="btn btn-p btn-s" type="submit">Közzététel</button>
      </div>
    </form>
    <div class="preview"><p class="pv-l">Előnézet</p><div id="pv"></div></div>
  </div>
</section>
''', '<a class="btn btn-p btn-s" href="#uj">+ Új cikk</a>')

# ---------- Dokumentumok ----------
admin_page("admin-dokumentumok.html", "admin-dokumentumok.html", "Dokumentumok", "Nyilvános dokumentumtár: feltöltés, új verzió, archiválás.", '''
<p class="notice w" style="margin-bottom:18px"><b>Csak nyilvános, közzétételre jóváhagyott anyag.</b> Ügyféliratokat, adóügyeket, személyes adatot ide tilos feltölteni – azokhoz külön, jogosultsághoz kötött rendszer kell.</p>
<section class="adm-card">
  <div class="adm-card-h"><h2>Dokumentumok</h2><label class="check small"><input type="checkbox" id="ad-arch"> Archiváltak is</label></div>
  <div class="tbl-wrap"><table class="tbl" id="ad-tbl"></table></div>
</section>
<section class="adm-card" id="feltoltes">
  <div class="adm-card-h"><h2 id="up-title">Dokumentum feltöltése</h2></div>
  <form id="up" novalidate>
    <div class="f"><label for="up-file">Fájl (PDF, max. 10 MB) <span>*</span></label><input id="up-file" type="file" accept="application/pdf"><p class="msg"></p></div>
    <div class="f2">
      <div class="f"><label for="up-cim">Megnevezés <span>*</span></label><input id="up-cim"><p class="msg"></p></div>
      <div class="f"><label for="up-kat">Kategória <span>*</span></label><select id="up-kat"></select><p class="msg"></p></div>
    </div>
    <div class="f2">
      <div class="f"><label for="up-ver">Verziószám <span>*</span></label><input id="up-ver" placeholder="pl. 1.0"><p class="msg"></p></div>
      <div class="f"><label for="up-desc">Rövid leírás</label><input id="up-desc"><p class="msg"></p></div>
    </div>
    <label class="check"><input type="checkbox" id="up-ok"> <span>Igazolom, hogy a dokumentum <b>nyilvános közzétételre jóváhagyott</b>, és nem tartalmaz ügyfél- vagy személyes adatot. <span class="msg" style="display:block"></span></span></label>
    <div class="ed-acts"><button class="btn btn-p btn-s" type="submit">Feltöltés (demo)</button><button class="btn btn-o btn-s" type="reset">Mégse</button></div>
  </form>
</section>
''', '<a class="btn btn-p btn-s" href="#feltoltes">+ Feltöltés</a>')

# ---------- Partnerek ----------
admin_page("admin-partnerek.html", "admin-partnerek.html", "Partnerek és ajánlatok", "Jóváhagyási sor, partnerlista, kuponok lejárattal.", '''
<section class="adm-card" id="jovahagyas"><div class="adm-card-h"><h2>Jóváhagyásra vár</h2><span class="tag demo">Minta</span></div><div class="queue" id="ap-queue"></div></section>
<section class="adm-card"><div class="adm-card-h"><h2>Partnerek</h2></div><div class="tbl-wrap"><table class="tbl" id="ap-tbl"></table></div></section>
<section class="adm-card" id="ajanlatok">
  <div class="adm-card-h"><h2>Ajánlatok és kuponok</h2></div>
  <div class="tbl-wrap"><table class="tbl" id="ao-tbl"></table></div>
  <form id="ao" novalidate style="margin-top:20px">
    <p class="h4" style="margin-bottom:12px">Új kupon</p>
    <div class="f2">
      <div class="f"><label for="ao-p">Partner <span>*</span></label><select id="ao-p"></select><p class="msg"></p></div>
      <div class="f"><label for="ao-cim">Ajánlat <span>*</span></label><input id="ao-cim" placeholder="pl. 10% kedvezmény az első megbízásból"><p class="msg"></p></div>
    </div>
    <div class="f2">
      <div class="f"><label for="ao-kod">Kuponkód <span>*</span></label><input id="ao-kod" placeholder="NAGYBETŰ, SZÁM" style="text-transform:uppercase"><p class="msg"></p></div>
      <div class="f"><label for="ao-lej">Lejárat <span>*</span></label><input id="ao-lej" type="date"><p class="msg"></p></div>
    </div>
    <div class="ed-acts"><button class="btn btn-p btn-s" type="submit">Kupon létrehozása (jóváhagyásra)</button></div>
  </form>
</section>
''')
