"""Mobil konfigurálási folyamat (érintés, 360 és 390 px). Futtatás: python3 tests/mobile.py [alap-URL]"""
import asyncio, re, sys
from playwright.async_api import async_playwright
import os, sys as _sys; _sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from kg_common import approve_all

B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/latvanytervek/karikagyuru/'
OUT = '/tmp/kgshots/'
res = []
def check(name, ok, info=''):
    res.append(ok); print(('OK   ' if ok else 'HIBA ') + name + (f' – {info}' if info else ''))

async def flow(b, w, h):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    async def over(tag):
        sw = await pg.evaluate('document.documentElement.scrollWidth')
        if sw > w + 1: check(f'{w}px {tag}: nincs oldalra görgetés', False, str(sw))
    async def tap(sel):
        loc = pg.locator(sel).first
        await loc.scroll_into_view_if_needed(); await loc.tap(); await pg.wait_for_timeout(350)
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear()'); await approve_all(pg)
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(900); await over('kollekció')
    await tap('.card[data-id="maz-81184-81185-w"] a'); await pg.wait_for_timeout(900)
    check(f'{w}px: kártyáról a termékoldalra', 'maz-81184-81185-w' in pg.url)
    await over('termékoldal')
    # érintési célpontok
    small = await pg.evaluate('''() => [...document.querySelectorAll('[data-steps] button:not(.linkbtn), .pdp__ctas .btn')]
      .filter(b => b.offsetParent).map(b => b.getBoundingClientRect()).filter(r => r.height < 38 || r.width < 38).length''')
    check(f'{w}px: a gombok legalább 38 px-esek', small == 0, str(small))
    for sel in ['[data-metal="pt"]', '[data-metal="gold"]', '[data-karat="au18"]', '[data-karat="au14"]', '[data-color="rose"]',
                '[data-size="0|1"]', '[data-size="1|-1"]', '[data-width="0|4"]', '[data-scount="0|-1"]', '[data-scat="0|d015"]', '[data-stones="0|0"]', '[data-stones="0|1"]', '[data-font="1|1"]']:
        if await pg.locator(sel).count() and await pg.locator(sel).first.is_enabled(): await tap(sel); await over(sel)
    await pg.locator('[data-engrave="0"]').scroll_into_view_if_needed(); await pg.locator('[data-engrave="0"]').fill('Anna & Bence'); await pg.wait_for_timeout(500)
    sizes = await pg.locator('.ringbox .stepper output').all_inner_texts()
    check(f'{w}px: női és férfi méret külön állítható', sizes[:2] == ['55', '63'], str(sizes[:2]))
    await pg.wait_for_function('''() => [...document.querySelectorAll('[data-cprice],[data-mprice]')].every(e => e.textContent.replace(/\\D/g, '') === e.dataset.value)''', timeout=5000)
    chips = await pg.locator('.stonecats button b').all_inner_texts()
    check(f'{w}px: kőméretek pontosan (0,005 / 0,01 / 0,015 ct)', chips[:3] == ['0,005 ct', '0,01 ct', '0,015 ct'], str(chips))
    p1 = await pg.inner_text('[data-cprice]'); pm = await pg.inner_text('[data-mprice]')
    check(f'{w}px: alsó sáv ára = fő ár, 100 Ft-ra kerek', p1 == pm and re.sub(r'\D', '', p1).endswith('00'), f'{p1} / {pm}')
    note = await pg.inner_text('[data-pnote]')
    check(f'{w}px: kerekítés feltüntetve', 'kerekítve' in note, note)
    # alsó sáv nem takarja a fő gombokat
    await pg.locator('.pdp__ctas [data-inquire="erdeklodes"]').scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
    cover = await pg.evaluate('''() => { const m = document.querySelector('[data-mbar]').getBoundingClientRect(); const c = document.querySelector('.pdp__ctas [data-inquire="erdeklodes"]').getBoundingClientRect();
      return getComputedStyle(document.querySelector('[data-mbar]')).display !== 'none' && c.bottom > m.top && c.top < m.bottom; }''')
    check(f'{w}px: az alsó sáv nem takarja az érdeklődés gombot', not cover)
    await pg.screenshot(path=f'{OUT}m_{w}_cfg.png', full_page=True)
    # méretsegítő
    await tap('[data-sizehelp="0"]'); await pg.wait_for_timeout(300)
    mw = await pg.evaluate("(() => { const d = document.querySelector('.modal__box, dialog .form, .modal'); return d ? d.getBoundingClientRect().width : 0 })()")
    check(f'{w}px: méretsegítő elfér', 0 < mw <= w, str(mw))
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    if await pg.locator('[data-close]').count() and await pg.locator('[data-close]').first.is_visible(): await pg.locator('[data-close]').first.tap()
    # érdeklődés az alsó sávból
    await pg.evaluate('window.scrollTo(0, 400)'); await pg.wait_for_timeout(300)
    await pg.locator('[data-mbar] [data-inquire]').tap(); await pg.wait_for_timeout(500)
    pre = await pg.inner_text('.form__cfg pre')
    check(f'{w}px: érdeklődésben a teljes konfiguráció', all(x in pre for x in ['55-ös', '63-as', 'Anna & Bence', 'gyémánt']), pre.replace('\n', ' | ')[:140])
    await pg.screenshot(path=f'{OUT}m_{w}_inq.png')
    await pg.fill('[name=nev]', 'Teszt Elek'); await pg.fill('[name=tel]', '+36 30 111 2222')
    await pg.locator('.form button[type=submit]').tap(); await pg.wait_for_timeout(400)
    check(f'{w}px: érdeklődés elküldve', await pg.locator('.form--done').count() == 1)
    await pg.locator('.form--done [data-close]').first.tap(); await pg.wait_for_timeout(300)
    # körbe foglalt és ajánlatos
    await pg.goto(B + '#/gyuru/maz-81165-81166-y'); await pg.wait_for_timeout(900)
    await tap('[data-scat="0|d04"]'); await pg.wait_for_timeout(700)
    check(f'{w}px: 0,04 ct → egyedi ajánlat', 'Egyedi árajánlat' in await pg.inner_text('[data-cprice]'))
    await over('ajánlatos')
    await pg.goto(B + '#/admin/arszamitas'); await pg.wait_for_timeout(800)
    fits = await pg.evaluate("(() => { const t = document.querySelector('.xtable'); return t.scrollWidth <= t.clientWidth + 1 && t.getBoundingClientRect().right <= innerWidth + 1 })()")
    check(f'{w}px: admin példatábla oldalra görgetés nélkül elfér', fits)
    await over('admin árszámítás')
    check(f'{w}px: nincs JS-hiba', not errs, ' | '.join(errs[:2]))
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in [(360, 740), (390, 844)]: await flow(b, w, h)
        await b.close()
    print(f'\n{sum(res)}/{len(res)} sikeres'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
