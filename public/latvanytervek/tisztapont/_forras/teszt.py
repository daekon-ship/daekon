#!/usr/bin/env python3
"""TisztaPont látványterv – automatikus ellenőrzés (Playwright + Chrome/Chromium).

Használat (a repó public/ mappáját a GitHub Pages-szel azonos alútvonalon kell kiszolgálni):

    mkdir -p /tmp/srv && ln -sfn "$(pwd)/../../../public" /tmp/srv/daekon
    (cd /tmp/srv && python3 -m http.server 8765) &
    python3 _forras/teszt.py http://localhost:8765/daekon/latvanytervek/tisztapont/

Opcionálisan: CHROME=/út/a/chrome python3 _forras/teszt.py <url>
Csak Chromium-motoron fut; Firefoxot, Safarit és valódi eszközt NEM helyettesít.
"""
import os
import re
import subprocess
import sys
import pathlib

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8765/daekon/latvanytervek/tisztapont/"
GYOKER = pathlib.Path(__file__).resolve().parent.parent
HIBAK = []


def ok(feltetel, uzenet):
    print(("OK   " if feltetel else "HIBA ") + uzenet)
    if not feltetel:
        HIBAK.append(uzenet)


def bongeszo(p):
    kw = {}
    if os.environ.get("CHROME"):
        kw["executable_path"] = os.environ["CHROME"]
    elif os.path.exists("/usr/bin/google-chrome"):
        kw["executable_path"] = "/usr/bin/google-chrome"
    return p.chromium.launch(**kw)


def forras_ellenorzes():
    html = (GYOKER / "index.html").read_text(encoding="utf-8")
    ok('content="noindex, nofollow"' in html, "noindex, nofollow beállítva")
    ok("Content-Security-Policy" in html and "connect-src 'none'" in html, "CSP: hálózati adatküldés tiltva (connect-src 'none')")
    ok("form-action 'none'" in html, "CSP: űrlapküldés tiltva (form-action 'none')")
    ok("Poller" not in html, "pontosítandó referencianév nem jelenik meg")
    ok(not re.search(r"partnerei|hivatalos partner", html, re.I), "nincs 'partnereink' állítás")
    ok(not re.search(r"sikeresen|lefoglaltuk|elküldtük", html, re.I), "nincs hamis sikerüzenet")
    ok("<script src=\"http" not in html and "googletagmanager" not in html, "nincs külső szkript / követőkód")
    ok("Fraunces" not in (GYOKER / "tisztapont.css").read_text(encoding="utf-8"), "nincs Fraunces betű")


def eles_szures():
    """Az --eles építés csak 'kozzeteheto' referenciát enged; utána visszaépít látványtervre."""
    epito = [sys.executable, str(GYOKER / "_forras" / "epites.py")]
    try:
        subprocess.run(epito + ["--eles"], check=True, capture_output=True)
        h = (GYOKER / "index.html").read_text(encoding="utf-8")
        ok("Készenléti" not in h and "Pizza King" not in h, "--eles: ellenőrizetlen referenciák kiszűrve")
        ok("egyeztet\"" not in h and "Élesítés előtt ellenőrizendő" not in h, "--eles: egyeztetendő-jelölések nélkül")
    finally:
        subprocess.run(epito, check=True, capture_output=True)


def nezetek(b):
    for w, h in [(360, 780), (390, 844), (768, 1024), (1024, 768), (1366, 768), (1440, 900), (1920, 1080)]:
        ctx = b.new_context(viewport={"width": w, "height": h})
        pg = ctx.new_page()
        hibak, rossz = [], []
        pg.on("pageerror", lambda e: hibak.append(str(e)))
        pg.on("console", lambda m: hibak.append(m.text) if m.type == "error" else None)
        pg.on("response", lambda r: rossz.append(f"{r.status} {r.url}") if r.status >= 400 else None)
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_timeout(1500)
        ho = pg.evaluate("document.body.scrollHeight")
        for y in range(0, ho, 450):
            pg.evaluate(f"window.scrollTo(0,{y})")
            pg.wait_for_timeout(50)
        pg.wait_for_timeout(900)
        sw = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        lathatatlan = pg.evaluate("[...document.querySelectorAll('[data-rv]')].filter(e=>getComputedStyle(e).opacity<0.99).length")
        kicsi = pg.evaluate("""[...document.querySelectorAll('a[href],button')].filter(e=>{const r=e.getBoundingClientRect();
            return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('.lab-nav,.lab-kontakt,.szolg-megj,.ugro,.osszesito')&&(r.height<40||r.width<40)}).map(e=>e.className||e.textContent.trim()).slice(0,5)""")
        ok(sw <= 0 and not hibak and not rossz and lathatatlan == 0,
           f"{w}px: vízszintes csúszás {max(sw, 0)}px, konzolhiba {len(hibak)}, hiányzó fájl {len(rossz)}, rejtve maradt elem {lathatatlan}")
        ok(not kicsi, f"{w}px: érintési célok ≥ 40 px {kicsi if kicsi else ''}")
        ctx.close()


def mobil(b):
    ctx = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    pg = ctx.new_page()
    keresek = []
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1200)
    pg.click(".menu-gomb")
    pg.wait_for_timeout(400)
    ok(pg.is_visible("#mobilmenu a[href='#munkaink']"), "mobilmenü nyílik, linkek láthatók")
    pg.keyboard.press("Escape")
    ok(pg.is_hidden("#mobilmenu") and pg.evaluate("document.activeElement.classList.contains('menu-gomb')"), "Esc bezárja, fókusz vissza")
    pg.click(".menu-gomb")
    pg.click("#mobilmenu a[href='#munkaink']")
    pg.wait_for_timeout(1200)
    t = pg.evaluate("document.querySelector('#munkaink h2').getBoundingClientRect().top")
    f = pg.evaluate("document.querySelector('#fej').getBoundingClientRect().bottom")
    ok(t > f, "horgony nem csúszik a ragadós fejléc alá")

    pg.evaluate("window.scrollTo(0,0)")
    pg.locator('[data-szolg="iroda"]').click()
    pg.wait_for_timeout(1000)
    ok(pg.evaluate("document.querySelector('input[value=\"iroda\"]').checked"), "szolgáltatás előválasztása az időpontkérőben")
    pg.on("request", lambda r: keresek.append(r.url))
    ok(pg.is_visible(".fog-demo"), "demójelzés látható az időpontkérőben")
    pg.click("[data-tovabb]")
    pg.wait_for_timeout(300)
    pg.click("[data-tovabb]")
    ok(pg.is_visible("#hiba-telepules") and pg.is_visible("#hiba-alapterulet"), "kötelező mezők hibajelzése")
    ok(pg.get_attribute("#f-telepules", "aria-invalid") == "true", "aria-invalid érvényes értékkel")
    pg.fill("#f-telepules", "Pécs")
    pg.click("text=50–100 m²")
    pg.click("[data-tovabb]")
    pg.wait_for_timeout(300)
    pg.fill("#f-datum", "2020-01-01")
    pg.click("text=Délelőtt")
    pg.click("[data-tovabb]")
    ok(pg.is_visible("#hiba-datum"), "múltbeli dátum elutasítva")
    pg.click("[data-vissza]")
    pg.wait_for_timeout(300)
    ok(pg.input_value("#f-telepules") == "Pécs", "visszalépés megtartja a beírt adatot")
    pg.click("[data-tovabb]")
    pg.wait_for_timeout(300)
    pg.fill("#f-datum", "2030-03-01")
    pg.click("[data-tovabb]")
    pg.wait_for_timeout(300)
    pg.fill("#f-nev", "Teszt Elek")
    pg.click("[data-tovabb]")
    ok(pg.is_visible("#hiba-kontakt") and pg.get_attribute("#f-tel", "aria-invalid") == "true", "telefon vagy e-mail kötelező")
    ok(pg.inner_text("[data-tovabb-szoveg]") == "Igény áttekintése", "záró gomb: Igény áttekintése")
    pg.fill("#f-tel", "+36 30 123 4567")
    pg.click("[data-tovabb]")
    pg.wait_for_timeout(500)
    s = pg.inner_text("[data-osszesito]")
    ok("Irodák" in s and "Pécs" in s and "2030" in s, "összesítő tartalma")
    ok(pg.is_visible(".demo-doboz"), "összesítőben demó-figyelmeztetés")
    ok(keresek == [], f"időpontkérés közben nulla hálózati kérés {keresek[:2]}")
    ok(pg.evaluate("[localStorage.length, sessionStorage.length, document.cookie]") == [0, 0, ""], "nincs tárolás (localStorage / session / süti)")
    ok(pg.evaluate("location.search") == "", "nincs adat az URL-ben")
    pg.click("button[aria-label='Módosítom: Település']")
    ok(pg.evaluate("document.activeElement.tagName") == "LEGEND", "Módosítom: vissza a lépéshez, fókusszal")

    pg.reload(wait_until="networkidle")
    pg.wait_for_timeout(600)
    ok(pg.input_value("#f-nev") == "" and pg.is_visible("[data-lepes='1']"), "újratöltés után az űrlap üres, 1. lépés")

    pg.locator(".gal-eloszoba .gal-gomb").scroll_into_view_if_needed()
    pg.locator(".gal-eloszoba .gal-gomb").tap()
    pg.wait_for_timeout(400)
    ok(pg.evaluate("document.querySelector('[data-nagyito]').open"), "képnagyító érintésre nyílik")
    elotte = pg.inner_text("[data-nszam]")
    box = pg.locator(".nagyito-kep").bounding_box()
    cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    pg.mouse.move(cx, cy)
    pg.dispatch_event(".nagyito", "pointerdown", {"pointerType": "touch", "clientX": cx + 100, "clientY": cy})
    pg.dispatch_event(".nagyito", "pointerup", {"pointerType": "touch", "clientX": cx - 60, "clientY": cy})
    pg.wait_for_timeout(300)
    ok(pg.inner_text("[data-nszam]") != elotte, "húzással lapozás mobilon")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    ok(pg.evaluate("document.activeElement.closest('.gal-eloszoba')!==null"), "Esc bezár, fókusz vissza a bélyegképre")
    ctx.close()


def asztali(b):
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1000)
    pg.click("[data-szuro='uzleti']")
    ok(pg.evaluate("[...document.querySelectorAll('.gal-elem')].filter(e=>!e.hidden).length") == 1, "szűrő: Üzleti terek")
    pg.click("[data-szuro='lakoter']")
    pg.focus(".gal-etkezo .gal-gomb")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    a = pg.inner_text("[data-nszam]")
    pg.keyboard.press("ArrowRight")
    ok(a == "1 / 4" and pg.inner_text("[data-nszam]") == "2 / 4", "billentyűzet: nyitás + lapozás a szűrt képek között")
    sz = pg.evaluate("document.documentElement.clientWidth")
    for _ in range(6):
        pg.keyboard.press("Tab")
    ok(pg.evaluate("!!document.activeElement.closest('[data-nagyito]')"), "fókusz a nagyítóban marad")
    pg.keyboard.press("Escape")
    ok(pg.evaluate("document.documentElement.clientWidth") == sz, "nincs oldalugrás a nagyító miatt")
    pg.click("[data-szuro='mind']")
    pg.click("[data-szalag-gomb]")
    ok(pg.evaluate("getComputedStyle(document.querySelector('.szalag-sav')).animationPlayState") == "paused", "szalag megállítható")
    ok(pg.get_attribute(".szalag-masolat", "aria-hidden") == "true", "szalag másolata rejtve a képernyőolvasó elől")
    ok(pg.evaluate("fetch('js/adatok.js').then(()=>1).catch(()=>0)") == 0, "CSP: az oldal nem tud hálózati kérést indítani")
    for u in ["favicon.ico", "favicon.svg", "img/apple-touch-icon.png", "img/icon-192.png", "img/icon-512.png",
              "site.webmanifest", "img/og-tisztapont.jpg"]:
        ok(pg.request.get(URL + u).status == 200, "elérhető: " + u)
    ctx.close()


def kulonleges(b):
    ctx = b.new_context(viewport={"width": 1024, "height": 900}, reduced_motion="reduce")
    pg = ctx.new_page()
    pg.goto(URL, wait_until="networkidle")
    ok(pg.evaluate("getComputedStyle(document.querySelector('.szalag-sav')).animationName") == "none", "csökkentett mozgás: szalag áll")
    ok(pg.evaluate("[...document.querySelectorAll('[data-rv]')].every(e=>getComputedStyle(e).opacity=='1')"), "csökkentett mozgás: minden látszik")
    ctx.close()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, java_script_enabled=False)
    pg = ctx.new_page()
    pg.goto(URL, wait_until="networkidle")
    ok(pg.eval_on_selector("#szolg-cim", "e=>getComputedStyle(e).opacity") == "1" and pg.is_visible(".fog-noscript"),
       "JS nélkül: tartalom látszik, időpontkérő helyett tájékoztatás")
    ctx.close()
    # közvetlen megnyitás horgonnyal + vissza/előre
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    pg = ctx.new_page()
    pg.goto(URL + "#idopont", wait_until="networkidle")
    pg.wait_for_timeout(1500)
    ok(pg.evaluate("[...document.querySelectorAll('#idopont [data-rv]')].every(e=>getComputedStyle(e).opacity=='1')"),
       "közvetlen link (#idopont): a tartalom megjelenik")
    pg.goto(URL + "#kapcsolat")
    pg.wait_for_timeout(800)
    pg.go_back()
    pg.wait_for_timeout(800)
    ok(pg.evaluate("[...document.querySelectorAll('[data-rv]')].filter(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}).every(e=>getComputedStyle(e).opacity=='1')"),
       "visszalépés után a látható tartalom nem tűnik el")
    ctx.close()


if __name__ == "__main__":
    forras_ellenorzes()
    eles_szures()
    with sync_playwright() as p:
        b = bongeszo(p)
        nezetek(b)
        mobil(b)
        asztali(b)
        kulonleges(b)
        b.close()
    print("\n" + ("MINDEN ELLENŐRZÉS RENDBEN" if not HIBAK else f"{len(HIBAK)} HIBA:\n- " + "\n- ".join(HIBAK)))
    sys.exit(1 if HIBAK else 0)
