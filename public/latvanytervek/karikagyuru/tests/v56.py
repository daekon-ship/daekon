#!/usr/bin/env python3
"""V5.6 – teljes katalógus: a fotó hiánya nem rejti el a gyűrűt; „Fotó hamarosan” helykitöltő; keresés, szűrés;
kép nélküli gyűrű megnyitható; admin fotóellenőrzés; 360/390/430 px mobil és asztali nézet.
A karikagyuru.com-ról töltődő képeket a teszt szándékosan letiltja (így nem függ a hálózattól). Helyi szerver: 8765."""
import asyncio, json, re, sys, os
from playwright.async_api import async_playwright
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
EXT = 'maz-81204-81205-wy'          # külső (karikagyuru.com-os) fotójú gyűrű
LOCAL = 'maz-81184-81185-w'   # helyi fotójú gyűrű
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
num = lambda t: int(re.sub(r'\D', '', t) or 0)
NO_HSCROLL = 'document.documentElement.scrollWidth <= window.innerWidth + 1'

async def run(b, w, h, mob, full):
    tag = f'{w}px'
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob)
    await ctx.route(re.compile(r'https://karikagyuru\.com/.*'), lambda r: r.abort())
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1200)
    check(f'{tag} főoldal: nincs vízszintes görgetés', await pg.evaluate(NO_HSCROLL))

    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1500)
    cnt = await pg.inner_text('[data-count]')
    check(f'{tag} katalógus: mind a 115 gyűrű látszik, a nem betöltődő fotójúak is', num(cnt) == 115, cnt)
    await pg.wait_for_timeout(2500)
    check(f'{tag} katalógus: továbbra is 115 a fotók betöltési kísérlete után (nem rejt el)', num(await pg.inner_text('[data-count]')) == 115)
    check(f'{tag} katalógus: nincs vízszintes görgetés', await pg.evaluate(NO_HSCROLL))

    # keresés egy külső fotójú gyűrűre
    await pg.fill('[data-q]', '81204'); await pg.wait_for_timeout(900)
    check(f'{tag} keresés: a kép nélküli gyűrű megtalálható', num(await pg.inner_text('[data-count]')) >= 1 and await pg.locator(f'.card[data-id="{EXT}"]').count() == 1)
    card = pg.locator(f'.card[data-id="{EXT}"]')
    await card.scroll_into_view_if_needed(); await pg.wait_for_timeout(1200)
    ctext = await card.inner_text()
    check(f'{tag} kártya: „Fotó hamarosan” helykitöltő, cikkszámmal', 'Fotó hamarosan' in ctext and await card.locator('[data-nophoto]').count() == 1, ctext.replace('\n', ' | ')[:120])
    check(f'{tag} kártya: nincs törött kép ikon (a hibás img el van rejtve)', await card.locator('.media.is-fallback img').evaluate_all('xs => xs.every(x => getComputedStyle(x).display === "none")'))
    await card.locator('a').first.click(); await pg.wait_for_timeout(1200)
    check(f'{tag} kép nélküli gyűrű megnyitható', EXT in pg.url and await pg.locator('.pdp').count() == 1, pg.url)
    check(f'{tag} termékoldal: „Fotó hamarosan” a kép helyén', 'Fotó hamarosan' in await pg.inner_text('.pdp'))
    check(f'{tag} termékoldal: ajánlatkérés elérhető', await pg.locator('.pdp__ctas').count() == 1)
    check(f'{tag} termékoldal (kép nélkül): nincs vízszintes görgetés', await pg.evaluate(NO_HSCROLL))

    # helyi fotójú gyűrű valódi fotóval
    await pg.goto(B + f'#/gyuru/{LOCAL}'); await pg.wait_for_timeout(1500)
    im = await pg.evaluate("[...document.querySelectorAll('.pdp img')].map(i => [i.complete && i.naturalWidth > 0, i.currentSrc]).find(x => x[1].includes('img/termekek/')) || null")
    check(f'{tag} helyi fotó betölt a termékoldalon (helyi fájlból)', bool(im and im[0]), im)

    if full:
        # szűrés
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1200)
        await pg.fill('[data-q]', ''); await pg.wait_for_timeout(600)
        if await pg.locator('[data-open-filters]').is_visible(): await pg.click('[data-open-filters]'); await pg.wait_for_timeout(300)
        await pg.click('[data-f="tipus"][data-v="p"]'); await pg.wait_for_timeout(600)
        pairs = num(await pg.inner_text('[data-count]'))
        check(f'{tag} szűrés gyűrűpárra: kevesebb, de nem nulla', 0 < pairs < 115, pairs)
        await pg.click('[data-f="tipus"][data-v="mind"]'); await pg.wait_for_timeout(600)
        check(f'{tag} szűrés visszaállítva: 115', num(await pg.inner_text('[data-count]')) == 115)

        # admin fotóellenőrzés a böngészőben
        await pg.goto(B + '#/admin/fotok'); await pg.wait_for_timeout(1000)
        t0 = await pg.inner_text('[data-pcheck]')
        check(f'{tag} admin Fotók: összesítő (115 gyűrű · 30 helyi · 85 külső · 0 kép nélkül)', all(x in t0 for x in ['115 gyűrű', '30 helyi fotó', '85 külső fotó', '0 kép nélkül']), t0.replace('\n', ' | '))
        await pg.click('[data-pcheckrun]')
        await pg.wait_for_selector('[data-pmissing]', timeout=30000)
        miss = await pg.inner_text('[data-pmissing]')
        check(f'{tag} admin ellenőrzés: a letiltott 85 külső kép „nem tölt be”, a 30 helyi mind betölt', num(miss) == 85, miss)
        href = await pg.get_attribute('[data-pcheckdl]', 'href')
        rep = json.loads(await pg.evaluate('async (u) => await (await fetch(u)).text()', href)) if href else {}
        check(f'{tag} admin ellenőrzés: letölthető JSON-jelentés', rep.get('osszes_termek') == 115 and rep.get('helyi_foto') == 30 and rep.get('nem_tolt_be') == 85 and rep.get('hianyzo_foto') == 0, {k: rep.get(k) for k in ['osszes_termek', 'helyi_foto', 'nem_tolt_be']})
        t1 = await pg.inner_text('.photogrid')
        check(f'{tag} admin: a kártyákon „nem tölt be” / „helyben tárolt fotó” jelzés', 'nem tölt be' in t1 and 'helyben tárolt fotó' in t1)
    check(f'{tag} nincs JavaScript-hiba', not errs, errs[:2])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        print('V5.6 – teljes katalógus')
        await run(b, 1440, 900, False, True)
        await run(b, 430, 932, True, False)
        await run(b, 390, 844, True, True)
        await run(b, 360, 740, True, False)
        await b.close()
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)
asyncio.run(main())
