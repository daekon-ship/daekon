"""V4 böngészős tesztek: öt fő adminfeladat, árverziók, fotók, gyűrűnkénti szabályok. Futtatás: python3 tests/v4.py [alap-URL]"""
import asyncio, base64, re, sys, os, tempfile
from playwright.async_api import async_playwright
import os, sys as _sys; _sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from kg_common import approve_all, approve_in_queue

B = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/latvanytervek/karikagyuru/'
PLAIN = 'maz-81194-81195-w'
BI = 'maz-81202-81203-wy'
res = []
def check(name, ok, info=''):
    res.append(ok); print(('OK   ' if ok else 'HIBA ') + name + (f' – {info}' if info else ''))
n = lambda s: int(re.sub(r'\D', '', s) or 0)
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
    async def cprice():
        await pg.wait_for_function("(() => { const e = document.querySelector('[data-cprice]'); return e && e.textContent.replace(/\\D/g, '') === e.dataset.value })()", timeout=6000)
        return n(await pg.inner_text('[data-cprice]'))
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(800); await approve_all(pg)

    # --- Főmenü: öt kiemelt feladat ---
    await pg.goto(B + '#/admin/attekintes'); await pg.wait_for_timeout(600)
    tiles = await pg.locator('.bigtiles--5 .bigtile b').all_inner_texts()
    check(f'{tag} admin: öt kiemelt feladat', tiles == ['1. Árak módosítása', '2. Gyűrűk', '3. Fotók', '4. Gyűrűk jóváhagyása', '5. Érdeklődések'], str(tiles))
    await over('admin főmenü')

    # --- Árak: előtte–utána, jóváhagyás, verzió, visszaállítás ---
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900); p0 = await cprice()
    await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(700)
    head = await pg.inner_text('[data-pver]'); miss = await pg.inner_text('[data-missing]')
    check(f'{tag} árak: 1. árverzió; a hiányzó kőárak jelezve; titánhoz nincs grammármező', head.startswith('1. árverzió') and '0,04 ct' in miss and await pg.locator('[data-path="sellPerGram.ti"]').count() == 0, head)
    await pg.fill('[data-path="sellPerGram.au14"]', '46000'); await pg.wait_for_timeout(400)
    imp = re.sub(r'[ \xa0]', ' ', await pg.inner_text('[data-impact]'))
    check(f'{tag} árak: előnézet az érintett gyűrűkről (darab, %, példák előtte → utána)', 'gyűrű ára változik' in imp and '%' in imp and len(re.findall(r'\d Ft', imp)) >= 6, imp.replace('\n', ' | ')[:170])
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900)
    check(f'{tag} árak: jóváhagyás előtt a vásárlói ár nem változik', await cprice() == p0)
    await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(600)
    await pg.fill('[data-path="sellPerGram.au14"]', '46000'); await pg.wait_for_timeout(300)
    await pg.click('[data-apply]'); await pg.wait_for_timeout(600)
    done = await pg.inner_text('#adm-main')
    check(f'{tag} árak: mentés után egyértelmű visszajelzés', 'gyűrű' in done and ('frissült' in done or 'Kész' in done or 'érvényben' in done), done.replace('\n', ' | ')[60:200])
    await pg.goto(B + '#/admin/attekintes'); await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(600)
    check(f'{tag} árak: alkalmazás után 2. árverzió', (await pg.inner_text('[data-pver]')).startswith('2. árverzió'))
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900); p1 = await cprice()
    check(f'{tag} árak: a gyűrű ára újraszámolódott (42 000 → 46 000 Ft/g, szemléltető)', abs(p1 / p0 - 46 / 42) < 0.002, f'{p0} → {p1}')
    await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(600)
    await pg.fill('[data-path="sellPerGram.au14"]', '80000'); await pg.wait_for_timeout(300)
    check(f'{tag} árak: nagy változásnál külön megerősítés kell', await pg.locator('[data-confirm]').count() == 1 and await pg.locator('[data-apply]').is_disabled())
    await pg.goto(B + '#/admin/attekintes'); await pg.goto(B + '#/admin/alapanyag'); await pg.wait_for_timeout(600)
    await pg.click('[data-verlist]'); await pg.wait_for_timeout(300)
    await pg.locator('[data-verrev]').first.click(); await pg.wait_for_timeout(600)
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900)
    check(f'{tag} árak: korábbi verzió visszaállítása után az eredeti ár', await cprice() == p0)

    # --- Fotók ---
    await pg.goto(B + '#/admin/fotok'); await pg.wait_for_timeout(700)
    await pg.set_input_files(f'[data-photo="{PLAIN}"]', img); await pg.wait_for_timeout(700)
    src = await pg.locator(f'[data-pc="{PLAIN}"] img').get_attribute('src')
    check(f'{tag} fotók: képcsere mentve, visszajelzéssel', src.startswith('data:image/jpeg') and 'itt feltöltött' in await pg.inner_text(f'[data-pc="{PLAIN}"]'))
    await over('admin fotók')
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900)
    check(f'{tag} fotók: az új kép látszik a vásárlói oldalon', (await pg.locator('.pdp__stage--foto img').get_attribute('src')).startswith('data:image/jpeg'))

    # --- Szabályok gyűrűnként ---
    await pg.goto(B + '#/admin/szabalyok'); await pg.wait_for_timeout(700)
    check(f'{tag} szabályok: lista gyűrűnként, jóváhagyási állapottal', await pg.locator('.rules__row').count() > 20 and 'jóváhagyva' in await pg.inner_text('.rules'))
    await over('admin szabályok')
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900)
    fixed = await pg.locator('[data-width-fixed]').first.inner_text()
    check(f'{tag} alap: a szélesség nem választható, okkal kiírva', await pg.locator('[data-width]').count() == 0 and 'nem állítható' in fixed, fixed)
    await pg.goto(B + f'#/admin/gyuru/{PLAIN}'); await pg.wait_for_timeout(700)
    await pg.check('[data-b="opts.width.enabled"]'); await pg.wait_for_timeout(300)
    await pg.fill('[data-p="opts.width.min"]', '3'); await pg.fill('[data-p="opts.width.max"]', '6'); await pg.wait_for_timeout(200)
    await pg.fill('[data-p="rings.0.thickness"]', '1,2'); await pg.wait_for_timeout(200)
    warn = await pg.inner_text('[data-optwarn]')
    check(f'{tag} admin: kockázatos vastagságra figyelmeztet, de nem tilt', '1,3 mm' in warn and 'nem tiltások' in warn and await pg.locator('[data-save]').is_enabled(), warn[:90])
    await pg.fill('[data-p="rings.0.thickness"]', '')
    await pg.fill('[data-p="opts.width.min"]', '3,5'); await pg.fill('[data-p="rings.0.sizeMax"]', '56')
    await pg.fill('[data-consult]', 'Kő a férfigyűrűbe\nKalapált felület')
    await pg.click('[data-save]'); await pg.wait_for_timeout(300)
    tst = await pg.inner_text('#toast') if await pg.locator('#toast').count() else ''
    check(f'{tag} jóváhagyott gyűrű szakmai módosítása: a mentés jelzi, hogy a jóváhagyás visszavonva', 'jóváhagyás visszavonva' in tst, tst[:120])
    await pg.wait_for_timeout(400)
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900)
    check(f'{tag} visszavont jóváhagyás után a vásárlói oldalon nincs beállítás', await pg.locator('[data-locked]').count() == 1)
    # V5.6: bekapcsolt, de jóvá nem hagyott szélességválasztással és vastagság nélkül a gyűrű sem hagyható jóvá
    await pg.goto(B + f'#/admin/sorban/{PLAIN}'); await pg.wait_for_timeout(600)
    miss = await pg.inner_text('[data-qmissing]') if await pg.locator('[data-qmissing]').count() else ''
    check(f'{tag} szakmai jóváhagyás hiányos adattal tiltva: vastagság és a választható szélességek jóváhagyása kell', 'vastagság' in miss and 'választható szélességek jóváhagyása' in miss and await pg.locator('[data-approve]').is_disabled(), miss.replace('\n', ' | ')[:160])
    await pg.goto(B + f'#/admin/gyuru/{PLAIN}'); await pg.wait_for_timeout(700)
    for i in range(await pg.locator('[data-p$=".thickness"]').count()): await pg.locator('[data-p$=".thickness"]').nth(i).fill('1,8')
    await pg.check('[data-b="opts.width.approved"]'); await pg.wait_for_timeout(300)
    await pg.click('[data-save]'); await pg.wait_for_timeout(700)
    await pg.goto(B + f'#/admin/sorban/{PLAIN}'); await pg.wait_for_timeout(600)
    check(f'{tag} adatok pótolva: nincs hiányzó kötelező adat', await pg.locator('[data-qmissing]').count() == 0)
    await approve_in_queue(pg); await pg.wait_for_timeout(500)
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900)
    cons = await pg.inner_text('[data-consult]')
    await pg.click('[data-size="0|1"]'); await pg.click('[data-size="0|1"]'); await pg.wait_for_timeout(300)
    check(f'{tag} gyűrűnkénti mérethatár (legfeljebb 56) és egyeztetendő lista érvényesül', await pg.locator('[data-size="0|1"]').is_disabled() and (await pg.locator('.ringbox .stepper output').first.inner_text()) == '56' and 'Kalapált felület' in cons)
    await pg.goto(B + f'#/gyuru/{PLAIN}'); await pg.wait_for_timeout(900); pa = await cprice()
    ws = await pg.locator('[data-width^="0|"] b').all_inner_texts()
    check(f'{tag} jóváhagyás után 0,5 mm-es lépésekben választható', ws == ['3,5 mm', '4 mm', '4,5 mm', '5 mm', '5,5 mm', '6 mm'], str(ws))
    await pg.click('[data-width="0|6"]'); await pg.wait_for_timeout(300); pb = await cprice()
    await pg.click('[data-view="abra"]'); await pg.wait_for_timeout(300)
    lab = (await pg.locator('.pdp__stage--abra .sketch .sk__s').all_text_contents())[0]
    check(f'{tag} szélesebb gyűrű: nő az ár, az ábra és a férfigyűrű külön marad', pb > pa and '6 mm' in lab and await pg.locator('[data-width="1|6"][aria-pressed="true"]').count() == 0, f'{pa} → {pb} · {lab}')
    await pg.click('.pdp__ctas [data-inquire="erdeklodes"]'); await pg.wait_for_timeout(400)
    check(f'{tag} a választott szélesség bekerül az érdeklődésbe', '6 mm' in await pg.inner_text('.form__cfg pre'))
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
    await over('termékoldal szélességválasztóval')

    # --- Katalógus: keresés ---
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(900)
    all_n = await pg.locator('.card').count()
    await pg.fill('[data-q]', '81194'); await pg.wait_for_timeout(400)
    found = await pg.locator('.card').count()
    check(f'{tag} katalógus: keresés cikkszámra', 0 < found < all_n and await pg.locator(f'.card[data-id="{PLAIN}"]').count() == 1, f'{all_n} → {found}')
    await pg.fill('[data-q]', ''); await pg.wait_for_timeout(300)
    # --- Nem választható anyag: okkal ---
    await pg.goto(B + f'#/gyuru/{BI}'); await pg.wait_for_timeout(900)
    off = await pg.locator('[data-metal-off]').all_inner_texts()
    check(f'{tag} kétszínű modell: platina/palládium/titán látszik, de nem választható, okkal', len(off) == 3 and all('csak aranyból' in x for x in off) and await pg.locator('[data-metal-off]:not([disabled])').count() == 0, ' / '.join(x.replace('\n', ' ') for x in off)[:120])
    await over('admin gyűrű szerkesztés') if await pg.goto(B + f'#/admin/gyuru/{PLAIN}') or True else None
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
