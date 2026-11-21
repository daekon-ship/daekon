#!/usr/bin/env python3
"""V5.1 – bemutató-feliratok nélkül: nincs bemutató-sáv, nincs „demó”/„Bemutató” szöveg a vásárlói oldalon,
nincs kitalált árelőzmény; a kezelőfelület a láblécből érhető el, és onnan vissza a weboldalra."""
import asyncio, sys, re
from playwright.async_api import async_playwright
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
PAIR = 'maz-81194-81195-w'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
BAD = re.compile(r'demó|demo\b|bemutató|látványterv|kitalált', re.I)

async def run(b, w, h, mob):
    tag = f'{w}px'
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob); pg = await ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1200)
    check(f'{tag} nincs bemutató-sáv', await pg.locator('.demobar:visible, [data-mode-btn]:visible, [data-reset-demo], [data-script]').count() == 0)
    check(f'{tag} a lapcímben nincs „látványterv”', 'látványterv' not in (await pg.title()).lower())
    for route in ['#/', '#/kollekcio', f'#/gyuru/{PAIR}', '#/gyuru/maz-79016-79017', '#/sajat', '#/kapcsolat']:
        await pg.goto(B + route); await pg.wait_for_timeout(900)
        txt = await pg.inner_text('body')
        m = BAD.findall(txt)
        check(f'{tag} {route}: nincs bemutató-/demófelirat', not m and await pg.locator('.demo-chip').count() == 0, ','.join(set(m)))
    # érdeklődés: a visszajelzés nem állítja, hogy e-mail ment volna, és nem „bemutató”
    await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(900)
    await pg.locator('.pdp__ctas [data-inquire="erdeklodes"]').click(); await pg.wait_for_timeout(500)
    form_txt = await pg.inner_text('.modal, dialog, [role="dialog"]')
    check(f'{tag} érdeklődési űrlapon nincs bemutató-felirat, de előre kiírja: nem jut el az ötvöshöz', not BAD.search(form_txt) and 'nem jut el az ötvöshöz' in form_txt)
    await pg.fill('[name="nev"]', 'Teszt Elek'); await pg.fill('[name="tel"]', '+36 30 000 0000')
    await pg.locator('.modal form button[type="submit"], dialog form button[type="submit"], [role="dialog"] form button[type="submit"]').first.click(); await pg.wait_for_timeout(600)
    done = await pg.inner_text('.form--done')
    check(f'{tag} visszajelzés igaz: helyi módban „nem jutott el az ötvöshöz”, telefon és e-mail', 'nem jutott el' in done and 'nem ment el' in done.lower() and '+36 30 984 3090' in done and 'info@karikagyuru.com' in done and 'hamarosan hívunk' not in done.lower() and not BAD.search(done), done[:120])
    await pg.locator('.form--done [data-close]').click(); await pg.wait_for_timeout(400)
    # lábléc → kezelőfelület → vissza
    await pg.goto(B + '#/'); await pg.wait_for_timeout(700)
    await pg.locator('.site-foot a[href="#/admin"]').click(); await pg.wait_for_timeout(900)
    check(f'{tag} láblécből elérhető a kezelőfelület', '#/admin' in pg.url and await pg.locator('.adm').count() == 1)
    adm = await pg.inner_text('.adm')
    check(f'{tag} kezelőfelület főmenüjén nincs „Bemutató”/„demó” felirat', not BAD.search(adm), ','.join(set(BAD.findall(adm))))
    await pg.goto(B + '#/admin/elozmenyek'); await pg.wait_for_timeout(700)
    hist = await pg.inner_text('.adm__main')
    check(f'{tag} árnaplóban nincs kitalált előzmény (csak a kiinduló bejegyzés)', '35 400' not in hist and '36 300' not in hist and 'Kiinduló árak' in hist)
    await pg.goto(B + '#/admin/beallitasok'); await pg.wait_for_timeout(700)
    st = await pg.inner_text('.adm__main')
    check(f'{tag} beállítások: adattárolás tényszerűen, „Alapállapot visszaállítása”', 'ebben a böngészőben' in st and 'Alapállapot visszaállítása' in st and 'Demó' not in st)
    await pg.goto(B + '#/admin'); await pg.wait_for_timeout(600); await pg.locator('.adm__site:visible').first.click(); await pg.wait_for_timeout(700)
    check(f'{tag} kezelőfelületről vissza a weboldalra', pg.url.endswith('#/') and await pg.locator('.hero').count() == 1)
    check(f'{tag} nincs JavaScript-hiba', not errs, ' | '.join(errs)[:200])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, mob in [(1440, 900, False), (390, 844, True)]:
            print(f'{w}×{h}'); await run(b, w, h, mob)
        await b.close()
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)
asyncio.run(main())
