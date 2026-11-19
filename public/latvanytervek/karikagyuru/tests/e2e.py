"""Böngészős tesztek (Playwright). Futtatás: python3 tests/e2e.py [alap-URL]
Alapértelmezés: helyi szerver a public mappából (python3 -m http.server 8765)."""
import asyncio, re, sys
from playwright.async_api import async_playwright

B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/latvanytervek/karikagyuru/'
SHOTS = '/tmp/kgshots/'
PAIR = 'maz-81184-81185-w'          # pár, női gyűrűben választható kőszám
ETERNITY = 'maz-79008-w'            # körbe foglalt
results = []

def n(s):
    d = re.sub(r'\D', '', s)
    return int(d) if d else None

def check(name, ok, info=''):
    results.append((name, ok))
    print(('OK   ' if ok else 'HIBA ') + name + (f' – {info}' if info else ''))

async def price(pg):
    await pg.wait_for_timeout(950)
    return n(await pg.inner_text('[data-cprice]'))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errs.append(m.text))
        await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(800)

        # --- Konfigurátor ---
        await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1200)
        base = await price(pg)
        steps = await pg.locator('.cfg__step h2').all_inner_texts()
        check('Lépések sorrendje (anyag → finomság → szín → méret → gyémánt → gravír)',
              steps[:6] == ['Anyag', 'Finomság', 'Arany színe', 'Méret – női és férfi', 'Gyémánt', 'Gravírozás'], ' / '.join(steps))
        await pg.click('[data-color="sarga"]'); c1 = await price(pg)
        await pg.click('[data-color="rose"]'); c2 = await price(pg)
        check('1. A szín nem változtat az árat', base == c1 == c2, f'{base} {c1} {c2}')
        await pg.click('[data-karat="au18"]'); k18 = await price(pg)
        check('2. 18K drágább a 14K-nál', k18 > base, f'{base} → {k18}')
        await pg.click('[data-karat="au14"]')
        await pg.click('[data-metal="pt"]'); pt = await price(pg)
        check('Platina: nincs aranyszín-lépés', await pg.locator('[data-color]').count() == 0 and pt and pt != base, f'{pt}')
        await pg.click('[data-metal="gold"]'); await price(pg)
        await pg.click('[data-size="0|1"]'); await pg.click('[data-size="0|1"]'); s1 = await price(pg)
        await pg.click('[data-size="1|1"]'); await pg.click('[data-size="1|1"]'); s2 = await price(pg)
        out = await pg.locator('.ringbox .stepper output').all_inner_texts()
        check('3+6. Méret: nő az ár, a női és férfi méret külön', base < s1 < s2 and out[:2] == ['56', '66'], f'{base} {s1} {s2} {out[:2]}')
        # kőszám-határok
        for _ in range(6):
            btn = pg.locator('[data-scount="0|1"]')
            if await btn.count() and await btn.is_enabled(): await btn.click(); await pg.wait_for_timeout(120)
        mx = await pg.locator('.stonecount output').first.inner_text()
        check('4. A kőszám nem lépi túl a maximumot', mx == '3' and await pg.locator('[data-scount="0|1"]').is_disabled(), mx)
        await pg.click('[data-stones="0|0"]'); ns = await price(pg)
        await pg.click('[data-stones="0|1"]'); ws = await price(pg)
        check('5. Kő nélkül olcsóbb, a kő ára egyszer adódik hozzá', ns < ws, f'{ns} / {ws}')
        await pg.click('[data-scat="0|d10"]'); await pg.wait_for_timeout(900)
        q = await pg.inner_text('[data-cprice]')
        check('9. Ár nélküli kőméret → „Egyedi árajánlat szükséges”', 'Egyedi árajánlat' in q, q)
        await pg.click('[data-resetcfg]'); await price(pg)
        await pg.fill('[data-engrave="0"]', 'Anna & Bence'); eg = await price(pg)
        check('Gravírozás felára', eg > base, f'{eg}')
        await pg.click('.pdp__ctas [data-inquire="erdeklodes"]'); await pg.wait_for_timeout(400)
        pre = await pg.inner_text('.form__cfg pre')
        check('Érdeklődés: a konfiguráció átkerül', 'Anyag:' in pre and 'Anna & Bence' in pre, pre.replace('\n', ' | ')[:120])
        await pg.fill('[name=nev]', 'Teszt Elek'); await pg.fill('[name=tel]', '+36 30 111 2222'); await pg.click('.form button[type=submit]'); await pg.wait_for_timeout(300)
        await pg.click('.form--done [data-close]')
        await pg.goto(B + f'#/gyuru/{ETERNITY}'); await pg.wait_for_timeout(1100)
        txt = await pg.inner_text('[data-steps]')
        check('Körbe foglalt: kőszám mérettől függ, kő nem hagyható el', 'méretétől függ' in txt and await pg.locator('[data-stones^="0|"]').count() == 0)

        # --- Admin → vásárlói nézet ---
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1000)
        p0 = n(await pg.locator(f'[data-price="{PAIR}"]').inner_text())
        await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(700)
        await pg.fill('[data-path="gold24"]', '45000'); await pg.wait_for_timeout(400)
        say = await pg.inner_text('.impact__say')
        if await pg.locator('[data-confirm]').count(): await pg.check('[data-confirm]')
        await pg.click('[data-apply]'); await pg.wait_for_timeout(500)
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(2000)
        p1 = n(await pg.locator(f'[data-price="{PAIR}"]').inner_text())
        check('7. Aranyár-változás megjelenik a vásárlói oldalon', p1 > p0, f'{p0} → {p1} ({say})')
        # grammáras mód bekapcsolása
        await pg.goto(B + '#/admin/keplet'); await pg.wait_for_timeout(700)
        await pg.check('input[data-mode="pricingMode"][value="gramm"]'); await pg.wait_for_timeout(300)
        await pg.click('[data-save]'); await pg.wait_for_timeout(500)
        await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(600)
        check('Grammáras mód: a fő mező a 14K grammár', await pg.locator('[data-path="sellPerGram.au14"]').count() == 1)
        await pg.goto(B + f'#/gyuru/{PAIR}'); g = await price(pg)
        check('Grammáras mód: van ár a termékoldalon', bool(g), str(g))
        # termékszerkesztő
        await pg.goto(B + f'#/admin/gyuru/{PAIR}'); await pg.wait_for_timeout(700)
        check('Termékszerkesztő: kőszabály, anyagok, jóváhagyandó lista',
              await pg.locator('[data-rulemode]').count() == 2 and await pg.locator('[data-arr="metals"]').count() == 5 and await pg.locator('.ebox--todo li').count() >= 1)
        await pg.uncheck('[data-b="visible"]'); await pg.click('[data-save]'); await pg.wait_for_timeout(500)
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(900)
        check('Rejtett termék nem jelenik meg a katalógusban', await pg.locator(f'.card[data-id="{PAIR}"]').count() == 0)
        await pg.goto(B + '#/admin/arszamitas'); await pg.wait_for_timeout(600)
        check('Gyors árszámítás működik', 'Ft' in await pg.inner_text('.qcalc__price'))
        # 8. demó visszaállítás
        await pg.goto(B + '#/admin/beallitasok'); await pg.wait_for_timeout(500)
        await pg.click('[data-reset]'); await pg.click('[data-ok]'); await pg.wait_for_timeout(600)
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1200)
        p2 = n(await pg.locator(f'[data-price="{PAIR}"]').inner_text())
        check('8. Demó visszaállítás: eredeti ár, látható termék', p2 == p0, f'{p2}')

        # --- 10. Eszközök: nincs vízszintes görgetés ---
        pages = ['#/', '#/kollekcio', f'#/gyuru/{PAIR}', f'#/gyuru/{ETERNITY}', '#/admin/attekintes', '#/admin/alapanyag', f'#/admin/gyuru/{PAIR}', '#/admin/keplet', '#/admin/arszamitas']
        for w, h, name in [(360, 740, 'Android 360'), (390, 844, 'iPhone 390'), (768, 1024, 'tablet'), (1440, 900, 'asztali')]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=w < 700, has_touch=w < 700)
            q = await ctx.new_page(); q.on('pageerror', lambda e: errs.append(str(e)))
            bad = []
            for u in pages:
                await q.goto(B + u); await q.wait_for_timeout(700)
                sw = await q.evaluate('document.documentElement.scrollWidth')
                if sw > w + 1: bad.append(f'{u}:{sw}')
                if u == f'#/gyuru/{PAIR}': await q.screenshot(path=f'{SHOTS}pdp_{w}.png', full_page=True)
                if u == f'#/admin/gyuru/{PAIR}': await q.screenshot(path=f'{SHOTS}pedit_{w}.png', full_page=True)
                if u == '#/admin/keplet': await q.screenshot(path=f'{SHOTS}keplet_{w}.png', full_page=True)
            check(f'10. {name}: nincs vízszintes túlcsordulás', not bad, ', '.join(bad))
            await ctx.close()
        check('Nincs JavaScript-hiba', not errs, ' | '.join(errs[:3]))
        await b.close()
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)}/{len(results)} sikeres')
    sys.exit(1 if failed else 0)

asyncio.run(main())
