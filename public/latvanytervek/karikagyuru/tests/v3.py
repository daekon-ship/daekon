"""V3 böngészős tesztek: két út, szemléltető ábra, saját ötlet, új gyűrű felvitele. Futtatás: python3 tests/v3.py [alap-URL]"""
import asyncio, base64, re, sys, os, tempfile
from playwright.async_api import async_playwright

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
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1000)

    # --- Kezdőoldal: a három üzenet ---
    h1 = await pg.inner_text('.hero h1'); cta = await pg.locator('.hero__cta a').all_inner_texts()
    hrefs = [await a.get_attribute('href') for a in await pg.locator('.hero__cta a').all()]
    check(f'{tag} főcím és a két gomb', 'vitrinben' in h1 and cta == ['Alakítsd a sajátodra', 'Van egy saját ötletem'] and hrefs == ['#/kollekcio', '#/sajat'], f'{h1} {cta}')
    note = await pg.inner_text('.hero__note')
    check(f'{tag} az ötvös személyes segítsége a nyitóképernyőn', 'ötvös' in note and 'személyesen' in note)
    paths = [await a.get_attribute('href') for a in await pg.locator('.paths .path').all()]
    top = await pg.evaluate("document.querySelector('.paths').getBoundingClientRect().top + scrollY")
    check(f'{tag} két külön út a nyitóoldal elején', paths == ['#/kollekcio', '#/sajat'] and top < h * 1.6, f'{paths} {int(top)}')
    less = await pg.locator('.lesscard strong').all_inner_texts()
    nums = [int(re.sub(r'\D', '', x)) for x in less]
    check(f'{tag} „A kevesebb is…”: három valós változat, növekvő árral', len(nums) == 3 and nums[0] < nums[1] < nums[2], str(nums))
    await over('kezdőoldal')

    # --- Termékoldal: fotó és szemléltető ábra külön ---
    await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1100)
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
    check(f'{tag} kép helyi előnézettel, feltöltés állítása nélkül', await pg.locator('[data-cprev] img').count() == 1 and 'nem töltődik fel' in fnote)
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
    check(f'{tag} visszaigazolás: adatok megvannak, ár egyeztetés alapján, nincs hamis „elküldve”', all(x in done for x in ['81184', '56-os', 'keskenyebb', 'személyes egyeztetés alapján', 'nem került elküldésre']), done.replace('\n', ' | ')[:200])
    await pg.goto(B + '#/admin/erdeklodesek'); await pg.wait_for_timeout(600)
    inq = await pg.inner_text('.inq')
    check(f'{tag} admin: az egyedi kérés a modellel és a leírással megérkezett', all(x in inq for x in ['saját elképzelés', '81184', 'keskenyebb', '250–400']), inq.replace('\n', ' | ')[:200])

    # --- Admin: új gyűrű felvitele → megjelenik a vásárlói katalógusban ---
    code = f'TESZT-{w}'
    await pg.goto(B + '#/admin/gyuruk'); await pg.wait_for_timeout(600); await pg.click('[data-newprod]'); await pg.wait_for_timeout(600)
    banner = await pg.inner_text('.view')
    check(f'{tag} új gyűrű: a demó korlátai kiírva', 'csak ebben a böngészőben' in banner and 'központi adatbázis' in banner)
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
    check(f'{tag} új gyűrű: megjelent a vásárlói katalógusban, árral', 'Teszt karikagyűrű' in ptxt and ' Ft' in re.sub(r'[ \xa0]', ' ', ptxt), ptxt.replace('\n', ' | ')[:120])
    await pg.goto(B + f'#/gyuru/uj-{code.lower()}'); await pg.wait_for_timeout(900)
    check(f'{tag} új gyűrű: konfigurálható (lépések, kőszabály)', await pg.locator('.cfg__step').count() >= 4 and await pg.locator('[data-stones="0|1"]').count() == 1)
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
