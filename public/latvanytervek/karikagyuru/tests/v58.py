#!/usr/bin/env python3
"""V5.8 – végső ügyféloldali és admin ellenőrzés valódi böngészőben (Chromium, Playwright), helyi szerver: 8765.
- mobil vásárlói utak 360 és 390 px-en: kezdőlap → kollekció → gyűrű → ajánlatkérés; saját ötlet képpel; műhelymunka → időpont
- hibás kitöltés, vissza gomb, tel-linkek, vízszintes görgetés, JS-hibák
- helyi (Pages) mód: soha nincs hamis „elküldve” üzenet
- jóvá nem hagyott állítások (acél, gravírár, belső jegyzetek) a vásárlói oldalon
- mind a 115 gyűrű: katalógus, termékoldal, nagyítás; a külső kép kiesése nem hagy törött képet
- A/B arculat ugyanazzal a működéssel
- ügyféljóváhagyási központ: alapból minden nyitott, a válasz nem ír át árat/szabályt, átvezetés külön megerősítéssel
- admin: érvénytelen grammár, visszaállítás, az érdeklődés megjelenik
A külső (karikagyuru.com) képeket a teszt letiltja: így nézzük, mi történik, ha a régi oldal képei nem töltenek be."""
import asyncio, re, sys, os, tempfile, struct, zlib
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kg_common import approve_all
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
SHOTS = os.environ.get('KG_SHOTS')   # ha meg van adva, ide kerülnek a képernyőképek
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)

def png_file():
    raw = b''.join(b'\x00' + b'\xc8\xa0\x50' * 40 for _ in range(30))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 40, 30, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
    f = tempfile.NamedTemporaryFile(suffix='.png', delete=False); f.write(data); f.close(); return f.name

FORBIDDEN_PUBLIC = ['acélból', 'ügyféllel egyeztetendő', 'egyeztetendő', 'demóadat', 'demótermék', 'demó kőszabály', 'TODO', 'V5.', 'Egyedi ajánlat / gyűrű', 'kitalált', 'nincs színjelölés']

async def new_ctx(b, w, h, mobile):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1)
    await ctx.route(re.compile(r'https://(www\.)?karikagyuru\.com/.*\.(jpe?g|png|webp|gif)(\?.*)?$', re.I), lambda r: r.abort())
    return ctx

async def no_hscroll(pg):
    return await pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')

async def shot(pg, name):
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); await pg.screenshot(path=os.path.join(SHOTS, name + '.png'))

async def main():
    img = png_file()
    async with async_playwright() as p:
        b = await p.chromium.launch()

        for (w, h) in [(360, 740), (390, 844)]:
            print(f'Mobil vásárlói utak – {w} px')
            ctx = await new_ctx(b, w, h, True); pg = await ctx.new_page()
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'karikagyuru.com' not in m.text and 'ERR_FAILED' not in m.text else None)
            await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(900)
            check(f'{w}: kezdőlap vízszintes görgetés nélkül', await no_hscroll(pg))
            await shot(pg, f'{w}-1-kezdolap')
            tels = await pg.eval_on_selector_all('a[href^="tel:"]', 'as => as.map(a => a.getAttribute("href"))')
            check(f'{w}: telefonlinkek tel:+36… formájúak', tels and all(t.startswith('tel:+36') for t in tels), tels)
            await pg.click('[data-menu]'); await pg.wait_for_timeout(400)
            check(f'{w}: mobilmenü kinyílik', await pg.get_attribute('[data-menu]', 'aria-expanded') == 'true')
            await pg.click('nav.nav > a[href="#/kollekcio"]'); await pg.wait_for_timeout(900)
            check(f'{w}: menüből a kollekcióba, a menü bezárult', 'kollekcio' in pg.url and await pg.get_attribute('[data-menu]', 'aria-expanded') != 'true')
            cnt = await pg.inner_text('[data-count]')
            check(f'{w}: a katalógus 115 modellt mutat', cnt.startswith('115'), cnt)
            cols = await pg.evaluate("getComputedStyle(document.querySelector('[data-results]') || document.querySelector('.grid')).gridTemplateColumns.split(' ').length")
            check(f'{w}: mobilon kétoszlopos rács', cols == 2, cols)
            broken = await pg.evaluate("[...document.querySelectorAll('.card img')].filter(i => i.complete && i.naturalWidth === 0 && !i.closest('.is-fallback')).length")
            check(f'{w}: nincs törött kép (a kiesett külső fotó helyén tartalék látszik)', broken == 0, broken)
            await shot(pg, f'{w}-2-kollekcio')
            await pg.click('.card__link >> nth=0'); await pg.wait_for_timeout(1000)
            check(f'{w}: kártyáról a termékoldalra', '#/gyuru/' in pg.url)
            check(f'{w}: termékoldal vízszintes görgetés nélkül', await no_hscroll(pg))
            if await pg.locator('[data-sizehelp]').count():
                await pg.click('[data-sizehelp] >> nth=0'); await pg.wait_for_timeout(400)
                check(f'{w}: méretsegítő megnyílik', await pg.locator('.sizetable').is_visible())
                await pg.click('[data-pick] >> nth=2'); await pg.wait_for_timeout(300)
            dock = pg.locator('[data-dock] [data-inquire="erdeklodes"]')
            btn = dock if await dock.count() and await dock.first.is_visible() else pg.locator('[data-inquire="erdeklodes"]:visible').first
            await btn.first.click(); await pg.wait_for_timeout(500)
            check(f'{w}: az ajánlatkérő előre jelzi, hogy itt nem jut el az ötvöshöz', await pg.locator('[data-localnote]').is_visible())
            await pg.click('[data-inq] button[type="submit"]'); await pg.wait_for_timeout(300)
            check(f'{w}: üres űrlapnál hibaüzenet, nincs „elküldve”', await pg.locator('[data-inq] [data-err]').is_visible() and 'Elküldve' not in await pg.inner_text('body'))
            await pg.fill('[data-inq] input[name="nev"]', 'Teszt Anna'); await pg.fill('[data-inq] input[name="tel"]', '+36 30 000 0000')
            await pg.click('[data-inq] button[type="submit"]'); await pg.wait_for_timeout(500)
            done = (await pg.locator('.form--done').last.inner_text()).lower()
            check(f'{w}: helyi módban őszinte visszajelzés („Nem ment el az ötvösnek”), nincs hamis siker', 'nem ment el az ötvösnek' in done and 'megkaptuk' not in done, done[:120])
            await shot(pg, f'{w}-3-ajanlatkeres')
            await pg.click('.form--done [data-close]'); await pg.wait_for_timeout(300)
            await pg.go_back(); await pg.wait_for_timeout(800)
            check(f'{w}: vissza gomb a kollekcióhoz visz', 'kollekcio' in pg.url, pg.url)

            await pg.goto(B + '#/sajat'); await pg.wait_for_timeout(800)
            await pg.set_input_files('[data-cfile]', img); await pg.wait_for_timeout(400)
            check(f'{w}: saját ötlet – a kép előnézete megjelenik', await pg.locator('[data-cprev] img').count() == 1)
            await pg.click('[data-custom] button[type="submit"]'); await pg.wait_for_timeout(300)
            check(f'{w}: saját ötlet – név és telefon nélkül hibaüzenet', await pg.locator('[data-cerr]').is_visible())
            await pg.fill('[data-custom] textarea[name="leiras"]', 'Két színű gyűrű, apró kövekkel körben.')
            await pg.fill('[data-custom] input[name="nev"]', 'Teszt Béla'); await pg.fill('[data-custom] input[name="tel"]', '+36 30 000 0001')
            await pg.click('[data-custom] button[type="submit"]'); await pg.wait_for_timeout(600)
            done = (await pg.inner_text('.custom--done')).lower()
            check(f'{w}: saját ötlet – őszinte helyi visszajelzés', 'nem ment el az ötvösnek' in done and 'megérkezett' not in done, done[:120])
            check(f'{w}: saját ötlet oldal vízszintes görgetés nélkül', await no_hscroll(pg))
            await shot(pg, f'{w}-4-sajat-otlet')

            await pg.goto(B + '#/munkak'); await pg.wait_for_timeout(800)
            await pg.click('[data-work-consult] >> nth=0'); await pg.wait_for_timeout(500)
            check(f'{w}: műhelymunkák → időpontkérés űrlap', await pg.locator('[data-inq] [data-datefield]').is_visible())
            await pg.fill('[data-inq] input[name="nev"]', 'Teszt Cili'); await pg.fill('[data-inq] input[name="tel"]', '+36 30 000 0002')
            await pg.click('[data-inq] button[type="submit"]'); await pg.wait_for_timeout(500)
            check(f'{w}: időpontkérés – őszinte helyi visszajelzés', 'nem ment el az ötvösnek' in (await pg.locator('.form--done').last.inner_text()).lower())
            # hosszú magyar feliratok: semmi nem lóg ki a gombokból
            await pg.goto(B + '#/kapcsolat'); await pg.wait_for_timeout(600)
            over = await pg.evaluate("[...document.querySelectorAll('.btn, button')].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 2).map(e => e.textContent.trim().slice(0, 30))")
            check(f'{w}: a gombok felirata nem lóg ki', not over, over)
            check(f'{w}: nincs JavaScript-hiba', not errs, errs[:3])
            await ctx.close()

        print('Vásárlói oldal: jóvá nem hagyott állítások, belső jegyzetek')
        ctx = await new_ctx(b, 1440, 900, False); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(800)
        ids = await pg.evaluate("(async () => { const { store } = await import('./js/store.js'); return store.get().products.map(p => [p.id, p.visible !== false, !!(p.img && !/^https?:/.test(p.img))]); })()")
        check('a kiinduló adatban 115 gyűrű van, mind látható', len(ids) == 115 and all(v for _, v, _ in ids), len(ids))
        hits = {}
        for u in ['#/', '#/kollekcio', '#/munkak', '#/sajat', '#/kapcsolat', '#/rolunk', f'#/gyuru/{ids[0][0]}']:
            await pg.goto(B + u); await pg.wait_for_timeout(700)
            t = await pg.inner_text('body')
            for f in FORBIDDEN_PUBLIC:
                if f in t: hits.setdefault(f, []).append(u)
        check('nincs „acél”, belső „egyeztetendő” jegyzet, demó- vagy fejlesztői felirat a vásárlói oldalon', not hits, hits)
        pid = next(i for i, _, loc in ids if loc)
        await approve_all(pg)
        await pg.evaluate("(async () => { const { store } = await import('./js/store.js'); store.get().settings.engravingPrice = null; store.persistNow(); })()")
        await pg.goto(B + f'#/gyuru/{pid}'); await pg.reload(); await pg.wait_for_timeout(900)
        txt = await pg.inner_text('body')
        check('gravírozás ár nélkül: „kérésként jelezheted”, és kiírja, hogy az ár nem tartalmazza', 'kérésként jelezheted' in txt and 'nem tartalmazza' in txt)
        await pg.click('.pdp__stage--foto'); await pg.wait_for_timeout(500)
        zi = await pg.evaluate("(() => { const i = document.querySelector('.zoom img'); return i ? [i.complete, i.naturalWidth] : null })()")
        check('nagyítás: saját fotó betölt nagy méretben', zi and zi[0] and zi[1] >= 600, zi)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)

        print('Mind a 115 termékoldal')
        bad = []
        for i, _, _ in ids:
            await pg.evaluate(f"location.hash = '#/gyuru/{i}'"); await pg.wait_for_timeout(120)
            okp = await pg.evaluate("!!document.querySelector('.pdp h1') && !document.querySelector('.media img:not(.is-fallback img)') || [...document.querySelectorAll('.pdp .media img')].every(im => !im.complete || im.naturalWidth > 0 || im.closest('.is-fallback'))")
            if not okp or not await pg.locator('.pdp h1').count(): bad.append(i)
        check('mind a 115 termékoldal megnyílik, címmel, törött kép nélkül', not bad, bad[:5])
        check('nincs JavaScript-hiba a 115 oldalon', not errs, errs[:3])

        print('A/B arculat – ugyanaz a működés')
        heights = {}
        for v in ['a', 'b']:
            await pg.goto(B + f'?arculat={v}#/'); await pg.wait_for_timeout(700)
            heights[v] = await pg.evaluate("document.querySelector('.site-head').getBoundingClientRect().height")
            foot = await pg.evaluate("[...document.querySelectorAll('.logo--foot img')].filter(i => i.offsetParent).map(i => i.naturalWidth > 0)")
            check(f'{v}: lábléc-logó betölt', foot and all(foot), foot)
            await pg.goto(B + f'#/gyuru/{pid}'); await pg.wait_for_timeout(700)
            await pg.click('[data-inquire="erdeklodes"]:visible >> nth=0'); await pg.wait_for_timeout(400)
            check(f'{v}: ajánlatkérő ugyanúgy működik', await pg.locator('[data-inq]').is_visible())
            await pg.fill('[data-inq] input[name="nev"]', f'Arculat {v.upper()} Teszt'); await pg.fill('[data-inq] input[name="tel"]', '+36 30 000 0009')
            await pg.click('[data-inq] button[type="submit"]'); await pg.wait_for_timeout(400)
            check(f'{v}: az ajánlatkérés elküldhető (helyi mód)', await pg.locator('.form--done').count() >= 1)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        check('A és B fejléc magassága azonos (nem törik meg)', abs(heights['a'] - heights['b']) < 1, heights)
        await pg.goto(B + '?arculat=a#/'); await pg.wait_for_timeout(300)

        print('Ügyféljóváhagyási központ')
        before = await pg.evaluate("(async () => { const { store } = await import('./js/store.js'); const s = store.get(); return JSON.stringify([s.materials, s.settings, s.products]); })()")
        await pg.goto(B + '#/admin/kozpont'); await pg.wait_for_timeout(800)
        n = await pg.locator('[data-dec]').count()
        st = await pg.eval_on_selector_all('[data-dec-status]', 'es => es.map(e => e.textContent)')
        check(f'a központban {n} tétel, mind „Nyitott” (nincs előre bejelölt jóváhagyás)', n >= 25 and all(s.startswith('Nyitott') for s in st), (n, set(st)))
        groups = await pg.eval_on_selector_all('[data-dec-group] > h2', 'es => es.map(e => e.textContent)')
        check('négy csoport: Arculat, Szakmai adatok, Rendelési feltételek, Technikai adatok', groups == ['Arculat', 'Szakmai adatok', 'Rendelési feltételek', 'Technikai adatok'], groups)
        card = pg.locator('[data-dec="eloleg"]')
        await card.locator('[data-dec-save]').click(); await pg.wait_for_timeout(300)
        check('válasz nélkül nem menthető', 'Előbb írja be' in await card.locator('[data-dec-saved]').inner_text())
        await card.locator('[data-dec-answer]').fill('30% előleg, személyesen.'); await card.locator('[data-dec-save]').click(); await pg.wait_for_timeout(400)
        card = pg.locator('[data-dec="eloleg"]')
        check('a válasz mentve, állapot: „Válasz rögzítve – még nincs átvezetve”', (await card.locator('[data-dec-status]').inner_text()).startswith('Válasz rögzítve') and 'Mentve:' in await card.locator('[data-dec-saved]').inner_text())
        g = pg.locator('[data-dec="arany"]')
        await g.locator('[data-dec-answer]').fill('14K: 99 999 Ft/g'); await g.locator('[data-dec-save]').click(); await pg.wait_for_timeout(400)
        after = await pg.evaluate("(async () => { const { store } = await import('./js/store.js'); const s = store.get(); return JSON.stringify([s.materials, s.settings, s.products]); })()")
        check('a rögzített válasz NEM írta át az árakat, a beállításokat és a gyűrűket', before == after)
        await pg.locator('[data-dec="eloleg"] [data-dec-apply]').click(); await pg.wait_for_timeout(300)
        check('„Átvezettem” külön megerősítést kér', await pg.locator('.modal [data-ok], [role="dialog"] [data-ok]').count() == 1)
        await pg.locator('[data-ok]').click(); await pg.wait_for_timeout(400)
        check('megerősítés után: „Átvezetve”', (await pg.locator('[data-dec="eloleg"] [data-dec-status]').inner_text()).startswith('Átvezetve'))
        await pg.reload(); await pg.wait_for_timeout(800)
        check('újratöltés után megmarad', (await pg.locator('[data-dec="eloleg"] [data-dec-status]').inner_text()).startswith('Átvezetve') and await pg.locator('[data-dec="arany"] [data-dec-answer]').input_value() == '14K: 99 999 Ft/g')
        await pg.locator('[data-dec="arany"] [data-dec-reopen]').click(); await pg.wait_for_timeout(300)
        check('visszaállítható nyitottra', (await pg.locator('[data-dec="arany"] [data-dec-status]').inner_text()).startswith('Nyitott'))
        check('nyomtatás gomb van', await pg.locator('[data-dec-print]').count() == 1)
        await pg.goto(B + '#/admin/attekintes'); await pg.wait_for_timeout(600)
        check('a főmenüből elérhető (nyitott tételek számával)', await pg.locator('[data-openq-center]').count() == 1 and 'nyitott' in await pg.inner_text('[data-openq-center]'))
        await pg.goto(B + '#/'); await pg.wait_for_timeout(600)
        check('a vásárlói oldalon nem jelenik meg a döntés szövege', '30% előleg' not in await pg.inner_text('body'))

        print('Admin használhatóság')
        await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(800)
        g0 = await pg.evaluate("(async () => { const { store } = await import('./js/store.js'); return store.get().materials.sellPerGram.au14; })()")
        for bad in ['abc', '-5', '0']:
            await pg.fill('[data-path="sellPerGram.au14"]', bad); await pg.wait_for_timeout(300)
            dis = await pg.locator('[data-apply]').is_disabled() if await pg.locator('[data-apply]').count() else True
            if not dis: await pg.click('[data-apply]'); await pg.wait_for_timeout(400)
            g1 = await pg.evaluate("(async () => { const { store } = await import('./js/store.js'); return store.get().materials.sellPerGram.au14; })()")
            check(f'érvénytelen grammár („{bad}”) nem kerül mentésre', g1 == g0, (bad, g0, g1))
            await pg.goto(B + '#/admin/attekintes'); await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(500)
        await pg.goto(B + '#/admin/erdeklodesek'); await pg.wait_for_timeout(700)
        check('a böngészőben küldött teszt-ajánlatkérés látszik az adminban', 'Arculat B Teszt' in await pg.inner_text('#adm-main'))
        await ctx.close()

        print('Központ mobilon (390 px)')
        ctx = await new_ctx(b, 390, 844, True); pg = await ctx.new_page()
        await pg.goto(B + '#/admin/kozpont'); await pg.wait_for_timeout(900)
        check('390: a központ vízszintes görgetés nélkül', await no_hscroll(pg))
        await shot(pg, '390-5-kozpont')
        await ctx.close()
        await b.close()
    os.unlink(img)
    print(f'\n{ok} sikeres, {fail} hibás')
    sys.exit(1 if fail else 0)

asyncio.run(main())
