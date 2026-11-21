"""V3 böngészős tesztek: két út, szemléltető ábra, saját ötlet, új gyűrű felvitele. Futtatás: python3 tests/v3.py [alap-URL]"""
import asyncio, base64, re, sys, os, tempfile
from playwright.async_api import async_playwright
import os, sys as _sys; _sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from kg_common import approve_all, DATASET

B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/latvanytervek/karikagyuru/'
PAIR = 'maz-81184-81185-w'
res = []
def check(name, ok, info=''):
    res.append(ok); print(('OK   ' if ok else 'HIBA ') + name + (f' – {info}' if info else ''))
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVQImWP8z8Dwn4EIwESMolGFAAA8YgEPsm5RWwAAAABJRU5ErkJggg==')

async def run(b, w, h, mob):
    tag = f'{w}px'
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    img = os.path.join(tempfile.gettempdir(), 'kg-teszt.png'); open(img, 'wb').write(PNG)
    async def over(name):
        sw = await pg.evaluate('document.documentElement.scrollWidth')
        check(f'{tag} {name}: nincs oldalra görgetés', sw <= w + 1, str(sw))
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1000); await approve_all(pg)

    # --- Kezdőoldal: a három üzenet ---
    h1 = await pg.inner_text('.hero h1'); cta = await pg.locator('.hero__cta a').all_inner_texts()
    hrefs = [await a.get_attribute('href') for a in await pg.locator('.hero__cta a').all()]
    check(f'{tag} főcím és a két gomb', 'vitrinben' in h1 and cta == ['Alakítsd a sajátodra', 'Van egy saját ötletem'] and hrefs == ['#/kollekcio', '#/sajat'], f'{h1} {cta}')
    note = await pg.inner_text('.hero__note')
    check(f'{tag} az ötvös személyes segítsége a nyitóképernyőn', 'ötvös' in note and 'ülsz le' in note)
    paths = [await a.get_attribute('href') for a in await pg.locator('.paths .path').all()]
    top = await pg.evaluate("document.querySelector('.paths').getBoundingClientRect().top + scrollY")
    check(f'{tag} két külön út a nyitóoldal elején', paths == ['#/kollekcio', '#/sajat'] and top < h * 1.6, f'{paths} {int(top)}')
    less = await pg.locator('.lesscard strong').all_inner_texts()
    nums = [int(re.sub(r'\D', '', x)) for x in less]
    check(f'{tag} „A kevesebb is…”: három valós változat, növekvő árral', len(nums) == 3 and nums[0] < nums[1] < nums[2], str(nums))
    home = await pg.inner_text('#view')
    check(f'{tag} nincs túlzó állítás (ugyanaz az ember készíti / bármelyiken változtathatsz)', not any(t in home for t in ['ugyanaz az ember', 'ugyanazzal az ötvössel', 'mindegyiken változtathatsz', 'bármelyiken']) and 'kollégát is bevon' in home)
    await over('kezdőoldal')

    # --- Termékoldal: fotó és szemléltető ábra külön ---
    await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1100)
    check(f'{tag} a fotó valódi modellfotóként jelölt; állítható és egyeztetendő rész külön', 'Valódi modellfotó' in await pg.inner_text('.pdp__stage--foto') and 'Amit itt te állíthatsz' in await pg.inner_text('.scope--ok') and 'Amit külön egyeztetünk' in await pg.inner_text('.other'))
    steps_txt = await pg.inner_text('[data-steps]')
    check(f'{tag} platina/palládium: „csak fehér” kiírva; szélesség nem választható', 'csak fehér' in steps_txt and await pg.locator('[data-width]').count() == 0 and 'online nem választható' in steps_txt)
    check(f'{tag} alapnézet: a valódi fotó', await pg.locator('.pdp__stage--foto img').count() == 1 and await pg.locator('.pdp__stage .sketch').count() == 0)
    await pg.locator('[data-view="abra"]').tap() if mob else await pg.click('[data-view="abra"]'); await pg.wait_for_timeout(300)
    stones = lambda: pg.locator('.pdp__stage--abra .sketch g[transform]').count()
    tagtxt = await pg.inner_text('.sketch__tag'); notetxt = await pg.inner_text('[data-stagenote]')
    check(f'{tag} az ábra illusztrációként jelölt', 'nem fotó' in tagtxt and 'Nem a kész gyűrű pontos képe' in notetxt)
    n3 = await stones()
    await pg.click('[data-scount="0|-1"]'); await pg.wait_for_timeout(250); n2 = await stones()
    await pg.click('[data-stones="0|0"]'); await pg.wait_for_timeout(250); n0 = await stones()
    await pg.click('[data-stones="0|1"]'); await pg.wait_for_timeout(250)
    check(f'{tag} az ábra követi a kőszámot (3 → 2 → 0)', (n3, n2, n0) == (3, 2, 0), str((n3, n2, n0)))
    col = lambda: pg.evaluate("document.querySelector('.pdp__stage--abra .sketch stop:nth-child(2)').getAttribute('stop-color')")
    c1 = await col(); await pg.click('[data-color="sarga"]'); await pg.wait_for_timeout(250); c2 = await col()
    await pg.click('[data-metal="pt"]'); await pg.wait_for_timeout(250); c3 = await col()
    await pg.click('[data-metal="gold"]'); await pg.wait_for_timeout(250)
    check(f'{tag} az ábra követi a színt és az anyagot', len({c1, c2, c3}) == 3, f'{c1} {c2} {c3}')
    await pg.click('[data-size="0|1"]'); await pg.click('[data-size="0|1"]'); await pg.wait_for_timeout(250)
    labs = await pg.locator('.pdp__stage--abra .sketch .sk__s').all_text_contents()
    check(f'{tag} a két gyűrű külön szerkeszthető (56-os / 64-es)', labs[0].startswith('56-os') and labs[1].startswith('64-es'), str(labs))
    await pg.fill('[data-engrave="1"]', 'Bence'); await pg.wait_for_timeout(400)
    check(f'{tag} férfigyűrű kő nélkül: egyedi egyeztetés felkínálva', await pg.locator('.ringbox [data-custom-link]').count() == 1)
    await over('termékoldal ábrával')

    # --- „Másképp képzelted el?” → egyedi kérés a modell adataival ---
    await pg.click('.other [data-custom-link]'); await pg.wait_for_timeout(900)
    cm = await pg.inner_text('[data-cmodel]')
    check(f'{tag} egyedi kérés viszi a cikkszámot és a beállításokat', '#/sajat?modell=' + PAIR in pg.url and '81184' in cm and '56-os' in cm and 'Bence' in cm, cm.replace('\n', ' | ')[:150])

    # --- Saját ötlet űrlap ---
    await pg.fill('[name=leiras]', 'Legyen keskenyebb, és a férfigyűrűbe is kerüljön egy kő.')
    await pg.click('[data-cf="keret|250–400 ezer Ft"]'); await pg.click('[data-cf="gyemant|igen"]')
    await pg.set_input_files('[data-cfile]', img); await pg.wait_for_timeout(300)
    fnote = await pg.inner_text('[data-cfilenote]')
    check(f'{tag} kép helyi előnézettel, feltöltés állítása nélkül', await pg.locator('[data-cprev] img').count() == 1 and 'nem tölti fel' in fnote)
    sumtxt = await pg.inner_text('[data-csummary]')
    check(f'{tag} egyedi tervnél nincs automatikus ár', 'Személyes egyeztetés alapján' in sumtxt and not re.search(r'\d Ft\b', sumtxt.replace('ezer Ft', '')), sumtxt.replace('\n', ' | ')[:160])
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(500); await pg.goto(B + '#/sajat'); await pg.wait_for_timeout(700)
    kept = await pg.input_value('[name=leiras]')
    check(f'{tag} az űrlap megőrzi az adatokat (leírás, keret, modell)', 'keskenyebb' in kept and await pg.locator('[data-cf="keret|250–400 ezer Ft"][aria-checked="true"]').count() == 1 and await pg.locator('[data-cmodel]').count() == 1)
    await pg.click('[data-custom] button[type=submit]'); await pg.wait_for_timeout(300)
    check(f'{tag} név nélkül nem küldhető', await pg.locator('[data-cerr]').is_visible())
    await pg.fill('[name=nev]', 'Teszt Elek'); await pg.fill('[name=tel]', '+36 30 111 2222')
    await pg.click('[data-custom] button[type=submit]'); await pg.wait_for_timeout(500)
    done = await pg.inner_text('.custom--done')
    check(f'{tag} visszaigazolás: adatok megvannak, ár egyeztetés alapján, nincs hamis „elküldve”', all(x in done for x in ['81184', '56-os', 'keskenyebb', 'személyes egyeztetés alapján', 'nem jutott el', 'ebben a böngészőben', 'nem töltődött fel']) and 'elküldtük' not in done.lower() and all(x not in done for x in ['Bemutató', 'demó']), done.replace('\n', ' | ')[:200])
    await pg.goto(B + '#/admin/erdeklodesek'); await pg.wait_for_timeout(600)
    inq = await pg.inner_text('.inq')
    check(f'{tag} admin: az egyedi kérés a modellel és a leírással megérkezett', all(x in inq for x in ['saját elképzelés', '81184', 'keskenyebb', '250–400']), inq.replace('\n', ' | ')[:200])

    # --- V3.3: ár nélküli modell is konfigurálható; admin szélesség; élesítési ellenőrzés ---
    rid = await pg.evaluate("JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('karikagyuru-')))).products.find(p => p.priceOnRequest && p.kind === 'p' && p.metals.includes('au18')).id")
    await pg.goto(B + f'#/gyuru/{rid}'); await pg.wait_for_timeout(1000)
    ptxt0 = await pg.inner_text('[data-cprice]')
    check(f'{tag} ár nélküli modell: van konfigurátor, ár helyett egyedi ajánlat', await pg.locator('.cfg__step').count() >= 3 and 'Egyedi árajánlat' in ptxt0 and await pg.locator('.cfg__step .delta--up, .cfg__step .delta--down').count() == 0, ptxt0)
    await pg.click('[data-size="0|1"]'); await pg.wait_for_timeout(200)
    if await pg.locator('[data-karat="au18"]').count(): await pg.click('[data-karat="au18"]')
    await pg.fill('[data-engrave="0"]', 'Teszt'); await pg.wait_for_timeout(400)
    await pg.click('.pdp__ctas [data-inquire="erdeklodes"]'); await pg.wait_for_timeout(400)
    pre0 = await pg.inner_text('.form__cfg')
    check(f'{tag} ár nélküli modell: a beállítások bekerülnek az érdeklődésbe', all(x in pre0 for x in ['55-ös', 'Teszt', 'egyedi árajánlat']), pre0.replace('\n', ' | ')[:170])
    await pg.fill('[name=nev]', 'Ajánlat Kérő'); await pg.fill('[name=tel]', '+36 30 000 0000'); await pg.click('.form button[type=submit]'); await pg.wait_for_timeout(300)
    await pg.click('.form--done [data-close]')
    await pg.goto(B + '#/admin/erdeklodesek'); await pg.wait_for_timeout(500)
    check(f'{tag} admin: az ár nélküli modell érdeklődése a beállításokkal megérkezett', '55-ös' in await pg.inner_text('.inq'))
    await pg.goto(B + f'#/admin/gyuru/{PAIR}'); await pg.wait_for_timeout(600)
    etxt = await pg.inner_text('.edit__form')
    check(f'{tag} admin: nincs több szélesség, gyűrűnként egy („online nem választhat mást”)', await pg.locator('[data-widths]').count() == 0 and 'online nem választhat mást' in etxt and 'Szélességek' not in etxt)
    # az árelemek jóváhagyását visszaállítjuk a kiinduló állapotra (a gyűrűk maradnak jóváhagyva)
    await pg.evaluate("""async () => { const { store } = await import('./js/store.js'); const st = store.get(); const d = ds; st.materials.src = JSON.parse(JSON.stringify(d.materials.src)); st.settings.src = JSON.parse(JSON.stringify(d.settings.src)); st.materials.diamonds.forEach((x) => { const o = d.materials.diamonds.find((y) => y.id === x.id); if (o) x.src = o.src; }); store.persistNow(); }""".replace('async () =>', 'async (ds) =>'), DATASET)
    await pg.reload(); await pg.wait_for_timeout(500)
    await pg.goto(B + '#/admin/jovahagyas'); await pg.wait_for_timeout(600)
    gl = await pg.inner_text('[data-golive-box]')
    check(f'{tag} élesítési ellenőrzés: jóváhagyás nélkül tiltva', 'Nem élesíthető' in gl and await pg.locator('[data-golive]').is_disabled() and all(x in gl for x in ['grammár', 'gyémántár', 'kerekítés', 'ÁFA']), gl.replace('\n', ' | ')[:200])
    check(f'{tag} élesítés: „csak előzetes ellenőrzés… szerveroldali ellenőrzés és bejelentkezés” kiírva', all(t in gl for t in ['csak előzetes ellenőrzés', 'szerveroldali ellenőrzés', 'bejelentkezéshez kötött']) and 'hiányzik vagy hibás' in gl)
    check(f'{tag} élesítés: a titán nem szerepel a blokkoló tételek között', 'Titán' not in gl)
    # --- Admin: új gyűrű felvitele → megjelenik a vásárlói katalógusban ---
    code = f'TESZT-{w}'
    await pg.goto(B + '#/admin/gyuruk'); await pg.wait_for_timeout(600); await pg.click('[data-newprod]'); await pg.wait_for_timeout(600)
    banner = await pg.inner_text('.view')
    check(f'{tag} új gyűrű: nincs bemutató-felirat', 'Bemutató' not in banner and 'demó' not in banner.lower())
    await pg.fill('[data-t="code"]', code); await pg.fill('[data-t="name"]', 'Teszt karikagyűrű pár')
    await pg.fill('[data-p="rings.0.weight"]', '3'); await pg.fill('[data-p="rings.1.weight"]', '4')
    await pg.set_input_files('[data-imgfile]', img); await pg.wait_for_timeout(500)
    check(f'{tag} új gyűrű: kép előnézet', await pg.locator('[data-imgprev] img').count() == 1)
    await pg.select_option('[data-rulemode="0"]', 'free'); await pg.wait_for_timeout(300)
    await pg.click('[data-save]'); await pg.wait_for_timeout(700)
    lst = await pg.inner_text('.view')
    check(f'{tag} új gyűrű: bekerült az admin listába', code in lst)
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1200)
    card = pg.locator(f'.card[data-id="uj-{code.lower()}"]')
    ptxt = await card.inner_text() if await card.count() else ''
    check(f'{tag} új gyűrű: jóváhagyásig a katalógusban „egyedi ajánlat”, ár nélkül', 'Teszt karikagyűrű' in ptxt and 'egyedi ajánlat' in ptxt and ' Ft' not in re.sub(r'[ \xa0]', ' ', ptxt), ptxt.replace('\n', ' | ')[:120])
    await pg.goto(B + f'#/gyuru/uj-{code.lower()}'); await pg.wait_for_timeout(900)
    check(f'{tag} új gyűrű: jóváhagyásig nem konfigurálható', await pg.locator('.cfg__step').count() == 0 and await pg.locator('[data-locked]').count() == 1)
    await pg.goto(B + f'#/admin/sorban/uj-{code.lower()}'); await pg.wait_for_timeout(700)
    await pg.click('[data-approve]'); await pg.wait_for_timeout(500)
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1200)
    ptxt = await card.inner_text() if await card.count() else ''
    check(f'{tag} új gyűrű jóváhagyva, de a grammár nincs jóváhagyva: továbbra sincs számolt ár', 'egyedi ajánlat' in ptxt and ' Ft' not in re.sub(r'[ \xa0]', ' ', ptxt), ptxt.replace('\n', ' | ')[:120])
    await pg.goto(B + f'#/gyuru/uj-{code.lower()}'); await pg.wait_for_timeout(900)
    check(f'{tag} új gyűrű: jóváhagyás után konfigurálható (lépések, kőszabály)', await pg.locator('.cfg__step').count() >= 4 and await pg.locator('[data-stones="0|1"]').count() == 1)
    check(f'{tag} nincs JavaScript-hiba', not errs, ' | '.join(errs[:3]))
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await run(b, 1280, 900, False)
        await run(b, 390, 844, True)
        await b.close()
    print(f'\n{sum(res)}/{len(res)} sikeres'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
