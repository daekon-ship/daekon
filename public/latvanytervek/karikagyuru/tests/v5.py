#!/usr/bin/env python3
"""V5 – arculati réteg: hero-fotó, ár-dokk (asztali), mobil elrendezés. Futtatás: helyi szerver a public mappán, 8765-ös port."""
import asyncio, sys
from playwright.async_api import async_playwright
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
PAIR = 'maz-81194-81195-w'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)

async def run(b, w, h, mob):
    tag = f'{w}px'
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob); pg = await ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1500)
    src = await pg.get_attribute('.hero__photo img', 'src') or ''
    check(f'{tag} hero: valódi termékfotó, nincs rajzolt kör', 'img/termekek/' in src and await pg.locator('.hero__orbit').count() == 0, src)
    check(f'{tag} hero: négy rövid tény', await pg.locator('.hero__facts li').count() == 4)
    font = await pg.evaluate("getComputedStyle(document.querySelector('.hero h1')).fontFamily")
    size = await pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize)")
    check(f'{tag} főcím Baskerville, nem túlméretezett (≤ 44 px)', 'Baskerville' in font and size <= 44, f'{font} {size}')
    bg = await pg.evaluate("getComputedStyle(document.querySelector('.hero__cta .btn--dark')).backgroundColor")
    check(f'{tag} elsődleges gomb sötét', bg.startswith('rgb(20, 35, 42'), bg)
    over = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
    check(f'{tag} kezdőlap: nincs oldalra görgetés', over <= 0, over)

    await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1300)
    dock = pg.locator('[data-dock]')
    if mob:
        check(f'{tag} ár-dokk telefonon rejtve (ott az árcsík van)', not await dock.is_visible() and await pg.locator('[data-mbar]').is_visible())
        y_title = await pg.evaluate("document.querySelector('.pdp__title').getBoundingClientRect().top + scrollY")
        check(f'{tag} a cím a fotó után 1000 px-en belül', y_title < 1000, y_title)
    else:
        check(f'{tag} ár-dokk látszik', await dock.is_visible())
        async def prices():
            for _ in range(30):
                a = await pg.get_attribute('[data-cprice]', 'data-value'); d = await pg.get_attribute('[data-dprice]', 'data-value')
                t = await pg.inner_text('[data-dprice]')
                if a and a == d and ''.join(ch for ch in t if ch.isdigit()) == d: return a, d
                await pg.wait_for_timeout(100)
            return a, d
        a, d = await prices(); check(f'{tag} dokk ára = fő ár', a == d and a, f'{a} {d}')
        await pg.click('[data-metal="pt"]'); await pg.wait_for_timeout(300)
        a2, d2 = await prices(); check(f'{tag} anyagváltás után a dokk is frissül', a2 == d2 and a2 != a, f'{a}->{a2} / {d2}')
        await pg.evaluate('window.scrollTo(0, 1400)'); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(() => { const b = document.querySelector('[data-dock]').getBoundingClientRect(); return [b.top, b.bottom, innerHeight]; })()")
        check(f'{tag} görgetés közben a dokk a képernyőn marad', r[0] >= 0 and r[1] <= r[2], r)
        await pg.click('[data-dock] [data-inquire]'); await pg.wait_for_timeout(600)
        check(f'{tag} dokk gombja megnyitja az érdeklődést', await pg.locator('dialog[open], .modal.is-open, [role="dialog"]').count() > 0)
    check(f'{tag} nincs JavaScript-hiba', not errs, ' | '.join(errs)[:200])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, mob in [(1440, 900, False), (1280, 760, False), (390, 844, True), (360, 740, True)]:
            print(f'{w}×{h}'); await run(b, w, h, mob)
        await b.close()
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)
asyncio.run(main())
