#!/usr/bin/env python3
"""V5.7 – arculat (KARIKAGYURU.COM, két összehasonlítható változat), magyar szövegaudit eredménye,
és vizuális ellenőrzés 360/390/430/768/1440 px-en: főoldal, katalógus, termékoldal, műhelymunkák, saját ötlet, kapcsolat.
Külső (karikagyuru.com) képek letiltva – így a teszt nem függ a hálózattól. Helyi szerver: 8765."""
import asyncio, re, sys
from playwright.async_api import async_playwright
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
PAIR = 'maz-81184-81185-w'
PAGES = ['#/', '#/kollekcio', f'#/gyuru/{PAIR}', '#/munkak', '#/sajat', '#/kapcsolat']
SIZES = [(360, 740, True, 'Android 360'), (390, 844, True, 'iPhone 390'), (430, 932, True, 'nagy telefon 430'), (768, 1024, True, 'tablet 768'), (1440, 900, False, 'asztali 1440')]
FORBIDDEN = ['Két gyűrű, egy igen', 'harmincvalahány', 'Köszi', 'Ilyet szeretnék', 'vitrinben', 'csúnya', 'kísérletezni', 'Az ár az alapbeállításra szól',
             'tájékoztató becslések', 'Mennyit szánnál', 'Merre lehet elvinni', 'Így megy', 'pont tökéletes', 'hamarosan hívunk', 'Nem eladóval',
             'legjobb', 'egyedülálló', 'páratlan', 'kevés műhely', 'nincs elállási jog', 'az ár fele', '3 munkanap']
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        print('Arculat')
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
        await ctx.route(re.compile(r'https://karikagyuru\.com/.*'), lambda r: r.abort())
        pg = await ctx.new_page()
        await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1000)
        logo = await pg.inner_text('.site-head .logo')
        check('fejléc: a márkanév KARIKAGYURU.COM (nem „Két gyűrű, egy igen”)', 'KARIKAGYURU.COM' in logo and 'Két gyűrű' not in logo, logo)
        check('alapból az „a” (monokróm) változat', await pg.evaluate("document.documentElement.dataset.arculat") == 'a' and await pg.locator('.site-head .logo__a').is_visible() and not await pg.locator('.site-head .logo__b').is_visible())
        nat = await pg.evaluate("[...document.querySelectorAll('.site-head .logo__mark img, .logo--foot img')].filter(i => i.offsetParent).map(i => i.complete && i.naturalWidth > 0)")
        check('fejléc- és láblécembléma betölt', nat and all(nat), nat)
        h = await pg.evaluate("document.querySelector('.site-head .logo__mark img').getBoundingClientRect().height")
        check('fejlécembléma mérsékelt méretű (≤ 48 px)', 0 < h <= 48, h)
        await pg.goto(B + '?arculat=b#/'); await pg.wait_for_timeout(800)
        check('?arculat=b: kék változat, ugyanazzal a szerkezettel', await pg.evaluate("document.documentElement.dataset.arculat") == 'b' and await pg.locator('.site-head .logo__b').is_visible() and await pg.locator('nav.nav > a').count() == 5)
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(500)
        check('a választott változat a böngészőlapon belül megmarad', await pg.evaluate("document.documentElement.dataset.arculat") == 'b')
        await pg.goto(B + '?arculat=a#/'); await pg.wait_for_timeout(500)
        check('visszaállítható: ?arculat=a', await pg.evaluate("document.documentElement.dataset.arculat") == 'a')
        check('favicon: SVG embléma és PNG tartalék', await pg.locator('link[rel="icon"][type="image/svg+xml"]').count() == 1 and await pg.locator('link[rel="icon"][sizes="48x48"]').count() == 1)
        title = await pg.title(); desc = await pg.get_attribute('meta[name="description"]', 'content')
        check('SEO-cím és leírás: márka, Budapest, természetes gyémánt; noindex marad', 'KARIKAGYURU.COM' in title and 'Budapest' in desc and 'természetes gyémánt' in desc and await pg.locator('meta[name="robots"][content*="noindex"]').count() == 1, (title, desc))

        print('Szövegek')
        found = {}
        for u in PAGES:
            await pg.goto(B + u); await pg.wait_for_timeout(900)
            txt = await pg.inner_text('body')
            for f in FORBIDDEN:
                if f.lower() in txt.lower(): found.setdefault(f, []).append(u)
        check('a kifogásolt kifejezések egyik oldalon sincsenek', not found, found)
        await pg.goto(B + '#/'); await pg.wait_for_timeout(900)
        body = await pg.inner_text('body')
        check('főoldal: az ötvös szakmai tapasztalata kitalált évszám nélkül („több évtizedes”)', 'Több évtizedes' in body or 'több évtizedes' in body)
        check('főoldal: a két vásárlói út megvan', await pg.locator('.path--a').count() == 1 and await pg.locator('.path--b').count() == 1)
        check('lábléc: pontos árazási tájékoztatás (jóváhagyott ár / egyedi árajánlat)', 'jóváhagyott' in await pg.inner_text('.site-foot__note') and 'egyedi árajánlat' in await pg.inner_text('.site-foot__note'))
        await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1000)
        ctas = await pg.inner_text('.pdp__ctas')
        check('termékoldal: egységes fogalmak – „Ajánlatot kérek”, „Időpontot kérek”', 'Ajánlatot kérek' in ctas and 'Időpontot kérek' in ctas and 'Érdekel' not in ctas)
        check('termékoldal: ár nélküli gyűrűnél nincs „online ár tájékoztató” megjegyzés', await pg.locator('[data-pricenotice]').is_hidden())
        await pg.locator('.pdp__ctas [data-inquire="erdeklodes"]').click(); await pg.wait_for_timeout(400)
        mt = await pg.inner_text('.form')
        check('ajánlatkérő űrlap: „Ajánlatkérés”, nem „megrendelés”', 'Ajánlatkérés' in mt and 'megrendel' not in mt.lower(), mt[:80])
        await pg.keyboard.press('Escape')
        await pg.goto(B + '#/sajat'); await pg.wait_for_timeout(900)
        st = await pg.inner_text('.custom')
        check('saját ötlet: „Milyen árkategóriában gondolkodsz?”, nem kötelező', 'Milyen árkategóriában gondolkodsz?' in st)
        await ctx.close()

        print('Képernyőméretek')
        for w, hh, mob, name in SIZES:
            c = await b.new_context(viewport={'width': w, 'height': hh}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
            await c.route(re.compile(r'https://karikagyuru\.com/.*'), lambda r: r.abort())
            q = await c.new_page(); errs = []; q.on('pageerror', lambda e: errs.append(str(e)))
            over, small, broken, head_gap = [], [], [], None
            for u in PAGES:
                await q.goto(B + u); await q.wait_for_timeout(900)
                sw = await q.evaluate('document.documentElement.scrollWidth')
                if sw > w + 1: over.append(f'{u}:{sw}')
                sm = await q.evaluate("""[...document.querySelectorAll('main .btn, .site-head .btn, .burger')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => [e.textContent.trim().slice(0, 24), Math.round(e.getBoundingClientRect().height)]).filter(x => x[1] < 44)""")
                small += [f'{u}:{x[0]}={x[1]}' for x in sm]
                bi = await q.evaluate("""[...document.querySelectorAll('main img')].filter(i => i.complete && i.offsetParent && !/^https?:/.test(i.getAttribute('src') || '') && i.naturalWidth === 0).map(i => i.getAttribute('src'))""")
                broken += [f'{u}:{x}' for x in bi]
                if u == '#/': head_gap = await q.evaluate("document.querySelector('.site-head').getBoundingClientRect().top")
            check(f'{name}: nincs vízszintes görgetés (6 oldal)', not over, over)
            check(f'{name}: minden látható gomb legalább 44 px magas', not small, small[:4])
            check(f'{name}: nincs törött helyi kép', not broken, broken[:3])
            check(f'{name}: a fejléc a képernyő tetején, üres sáv nélkül', head_gap == 0, head_gap)
            await q.goto(B + '#/'); await q.wait_for_timeout(900)
            fs = await q.evaluate("""(() => { const v = innerHeight; const h = document.querySelector('.hero h1').getBoundingClientRect(); const b = [...document.querySelectorAll('.hero__cta .btn')].map(x => x.getBoundingClientRect().bottom); return [h.top >= 0 && h.bottom <= v, b.length === 2 && Math.max(...b) <= v]; })()""")
            check(f'{name}: első képernyőn a főcím és mindkét vásárlói gomb', fs == [True, True], fs)
            h1 = await q.evaluate("parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize)")
            check(f'{name}: a főcím nem túlméretezett (≤ 44 px)', h1 <= 44, h1)
            check(f'{name}: nincs JavaScript-hiba', not errs, errs[:2])
            await c.close()
        await b.close()
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

asyncio.run(main())
