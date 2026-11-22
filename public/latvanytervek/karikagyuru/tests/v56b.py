#!/usr/bin/env python3
"""V5.6/b – egyedi műhelymunkák, árállapotok a vásárlói oldalon, jogi szöveg, tisztázandó kérdések, mobil (360/390/430).
Helyi mód, saját böngészőadat; valódi fotó helyett a teszt saját generált tesztképeket tölt fel (nem kerülnek az oldalra).
Helyi szerver: 8765."""
import asyncio, os, re, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from kg_common import load_dataset, approve_all
from playwright.async_api import async_playwright
from PIL import Image
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
num = lambda t: int(re.sub(r'\D', '', t) or 0)
NO_HSCROLL = 'document.documentElement.scrollWidth <= window.innerWidth + 1'

async def fresh(pg):
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(900)

async def main():
    tmp = tempfile.mkdtemp(prefix='kg-v56b-'); imgs = []
    for i, c in enumerate([(200, 170, 120), (180, 180, 190)]):
        f = os.path.join(tmp, f'teszt{i}.jpg'); Image.new('RGB', (900, 700), c).save(f, 'JPEG'); imgs.append(f)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1366, 'height': 900}); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await fresh(pg)

        print('Árak a vásárlói oldalon (kiinduló, nem jóváhagyott adatok)')
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1200)
        prices = await pg.locator('.card [data-price]').count()
        reqs = await pg.locator('.card .price--req').count()
        check('régi, nem jóváhagyott listaár: egyetlen kártyán sincs ár, mind „Egyedi árajánlat”', prices == 0 and reqs > 0, (prices, reqs))
        body = await pg.inner_text('main')
        check('a katalógusban nem szerepel „listaár”', 'listaár' not in body.lower())
        await pg.goto(B + '#/'); await pg.wait_for_timeout(1000)
        hero = await pg.inner_text('.hero__cap')
        check('főoldal: a kiemelt gyűrűnél sincs régi listaár', 'Listaár' not in hero and 'egyedi ajánlat' in hero.lower(), hero[:80])

        print('Jogi szöveg')
        terms = await pg.inner_text('.terms')
        check('elállás: nincs kategorikus „nincs elállási jog”, helyette a rendeléskor rögzített feltételek + ÁSZF', 'nincs elállási jog' not in terms.lower() and 'ÁSZF' in terms and 'írásban rögzítjük' in terms, terms[-200:])
        check('az ÁSZF-re mutató link az ügyfél saját címére mutat (nem DAEKON)', await pg.locator('a[href*="karikagyuru.com/aszf"]').count() >= 1 and await pg.locator('a[href*="daekon"]').count() == 0)

        print('Műhelymunkák – főoldal és külön oldal, fotó nélkül')
        sec = await pg.inner_text('#muhelymunkak')
        check('főoldal: külön „Egyedi műhelymunkák” szakasz a 4 valódi munkával', 'Egyedi műhelymunkák' in sec and all(x in sec for x in ['Kétsoros', 'Három karikából', 'Kalapált', 'Háromszög']), sec[:160])
        check('főoldal: fotó nélküli munkához nincs kitalált kép', await pg.locator('#muhelymunkak img').count() == 0)
        await pg.click('nav >> text=Műhelymunkák'); await pg.wait_for_timeout(900)
        wp = await pg.inner_text('main')
        check('a menüből elérhető a Műhelymunkák oldal; jelzi, hogy nincs még fotó', 'Egyedi műhelymunkák' in wp and 'Ezekről még nincs fotó' in wp and 'Ft' not in wp, wp[:120])
        check('műhelymunkánál nincs cikkszám, ár, konfigurátor', await pg.locator('main [data-cprice], main .card__code, main [data-steps]').count() == 0)
        await pg.locator('[data-work="kalapalt-felulet"]').click(); await pg.wait_for_timeout(500)
        ref = await pg.inner_text('[data-workref]')
        check('„Ilyet szeretnék”: konzultációs űrlap a munka nevével, „nem készíthető el újra”', 'Kalapált' in ref and 'nem készíthető el újra' in ref and await pg.locator('[data-type="konzultacio"][aria-pressed="true"]').count() == 1, ref)
        await pg.fill('.form [name=nev]', 'Műhely Márta'); await pg.fill('.form [name=tel]', '+36 30 555 1234'); await pg.click('.form button[type=submit]'); await pg.wait_for_timeout(700)
        saved = await pg.evaluate("async () => { const { store } = await import('./js/store.js'); const q = store.get().inquiries[0]; return q ? [q.type, q.summary, q.productId] : null; }")
        check('a konzultációkérés a munka nevével rögzül, termékhez nem kötve', saved and saved[0] == 'konzultacio' and 'Kalapált' in saved[1] and saved[2] is None, saved)
        await pg.keyboard.press('Escape')

        print('Műhelymunka felvitele az adminban – cikkszám és ár nélkül, több fotóval')
        await pg.goto(B + '#/admin/munkak'); await pg.wait_for_timeout(900)
        lst = await pg.inner_text('[data-wlist]')
        check('admin: a 4 munka „fotóra vár” jelöléssel', lst.count('fotóra vár') == 4, lst[:200])
        await pg.click('[data-wnew]'); await pg.wait_for_timeout(700)
        await pg.click('[data-wsave]'); await pg.wait_for_timeout(300)
        check('cím nélkül nem menthető', 'címet' in await pg.inner_text('[data-werr]'))
        await pg.fill('[data-wt="title"]', 'Fekete-arany próbadarab'); await pg.fill('[data-wt="text"]', 'Teszt leírás.')
        await pg.set_input_files('[data-wfiles]', imgs); await pg.wait_for_timeout(1200)
        check('két fotó feltöltve az előnézetbe', await pg.locator('[data-wphotos] img').count() == 2)
        await pg.fill('[data-wt="video"]', 'http://nem-biztonsagos.example'); await pg.click('[data-wsave]'); await pg.wait_for_timeout(300)
        check('nem https videólink: hibaüzenet', 'https://' in await pg.inner_text('[data-werr]'))
        await pg.fill('[data-wt="video"]', 'https://www.youtube.com/watch?v=teszt'); await pg.click('[data-wsave]'); await pg.wait_for_timeout(700)
        check('mentés után a listában: 2 fotó, videó', '2 fotó · videó' in await pg.inner_text('[data-wlist]'))
        await pg.goto(B + '#/munkak'); await pg.wait_for_timeout(900)
        card = pg.locator('[data-work-card^="fekete-arany"]')
        ctext = await card.inner_text() if await card.count() else ''
        check('látogató: a munka 2 fotóval, videólinkkel, ár és cikkszám nélkül', await card.locator('img').count() == 2 and 'Videó megnézése' in ctext and 'Ft' not in ctext and 'Ilyet szeretnék' in ctext, ctext[:120])
        await pg.goto(B + '#/'); await pg.wait_for_timeout(900)
        check('főoldal: a fotós munka kiemelve a szakasz elején', await pg.locator('#muhelymunkak .work img').count() == 2)
        await pg.goto(B + '#/admin/munkak'); await pg.wait_for_timeout(700)
        await pg.locator('[data-wrow^="fekete-arany"] a').click(); await pg.wait_for_timeout(700)
        await pg.uncheck('[data-wvis]'); await pg.click('[data-wsave]'); await pg.wait_for_timeout(600)
        await pg.goto(B + '#/munkak'); await pg.wait_for_timeout(700)
        check('elrejtve: a látogatói oldalon nem jelenik meg', await pg.locator('[data-work-card^="fekete-arany"]').count() == 0)

        print('Tisztázandó kérdések (admin)')
        await load_dataset(pg)
        await pg.evaluate("async () => { const { store } = await import('./js/store.js'); store.get().settings.openQuestions = ['Teszt: a 60-as méret példája eltér – egyeztetendő']; store.persistNow(); }")
        await pg.goto(B + '#/admin/attekintes'); await pg.reload(); await pg.wait_for_timeout(900)
        oq = await pg.inner_text('[data-openq]') if await pg.locator('[data-openq]').count() else ''
        check('admin főmenü: jól látható „Tisztázandó az ötvössel” doboz, a megerősítendő kőárakkal', 'Tisztázandó' in oq and '60-as' in oq and 'megerősítendő' in oq, oq[:200])
        await pg.goto(B + '#/admin/jovahagyas'); await pg.wait_for_timeout(800)
        await pg.fill('[data-openq-edit]', 'Első kérdés\nMásodik kérdés'); await pg.click('[data-openq-save]'); await pg.wait_for_timeout(500)
        qs = await pg.evaluate("async () => { const { store } = await import('./js/store.js'); return store.get().settings.openQuestions; }")
        check('a kérdések szerkeszthetők és menthetők', qs == ['Első kérdés', 'Második kérdés'], qs)

        print('Jóváhagyott ár: számított és fix')
        await approve_all(pg)
        await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1200)
        check('minden jóváhagyva: a kártyákon számított ár', await pg.locator('.card [data-price]').count() > 10)
        await pg.evaluate("async () => { const { store } = await import('./js/store.js'); const p = store.get().products.find((x) => x.id === 'maz-81194-81195-w'); p.override = { type: 'fixed', value: 345600 }; store.persistNow(); }")
        await pg.goto(B + '#/gyuru/maz-81194-81195-w'); await pg.reload(); await pg.wait_for_timeout(1200)
        lab = await pg.inner_text('[data-plabel]'); v = num(await pg.inner_text('[data-cprice]'))
        check('jóváhagyott fix ár: „Ár”, pontosan a rögzített összeg, nem „becsült”', v == 345600 and 'Becsült' not in lab, (lab, v))
        check('nincs JavaScript-hiba (asztali)', not errs, errs[:2])
        await ctx.close()

        print('Mobil: 360, 390, 430 px')
        for w, h in [(360, 740), (390, 844), (430, 932)]:
            c = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True); m = await c.new_page()
            merr = []; m.on('pageerror', lambda e: merr.append(str(e)))
            await fresh(m)
            for path in ['#/', '#/munkak', '#/kollekcio', '#/gyuru/maz-81194-81195-w', '#/kapcsolat', '#/admin/munkak', '#/admin/sorban']:
                await m.goto(B + path); await m.wait_for_timeout(700)
                check(f'{w}px {path}: nincs vízszintes görgetés', await m.evaluate(NO_HSCROLL))
            await m.goto(B + '#/'); await m.wait_for_timeout(500)
            await m.click('.menu-btn, [data-menu], .site-head__menu, button[aria-controls]') if await m.locator('.menu-btn, [data-menu], .site-head__menu, button[aria-controls]').count() else None
            await m.wait_for_timeout(400)
            check(f'{w}px mobil menüben ott a „Műhelymunkák”', await m.locator('nav a[href="#/munkak"]').count() == 1)
            check(f'{w}px nincs JavaScript-hiba', not merr, merr[:2])
            await c.close()
        await b.close()
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

asyncio.run(main())
