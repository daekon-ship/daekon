#!/usr/bin/env python3
"""Szerver mód, böngészőből: a valódi weboldal + API egy címen (dev/router.php), saját ideiglenes adatmappával.
Belépés, árváltoztatás → másik böngésző (látogató) a szerverről kapja az új árat; érdeklődés a látogatótól → admin
látja; képfeltöltés; ütközés két admin között; kilépés. Futtatás: python3 tests/server_mode_e2e.py"""
import asyncio, os, re, shutil, subprocess, sys, tempfile, time, urllib.request, uuid, struct, zlib
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('KG_E2E_PORT', '8793'))
B = f'http://127.0.0.1:{PORT}/'
PW = 'proba-' + uuid.uuid4().hex
PAIR = 'maz-81194-81195-w'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
num = lambda t: int(re.sub(r'\D', '', t) or 0)

def png(path, w=900, h=700):
    raw = b''.join(b'\x00' + bytes([200, 170, 90]) * w for _ in range(h))
    def ch(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b''))

async def price_on_catalog(pg):
    await pg.goto(B + '#/kollekcio'); await pg.reload(); await pg.wait_for_timeout(1500)
    loc = pg.locator(f'[data-price="{PAIR}"]')
    return num(await loc.inner_text()) if await loc.count() else None

async def wait_saved(pg, t=8000):
    for _ in range(t // 100):
        s = await pg.inner_text('[data-sync]') if await pg.locator('[data-sync]').count() else ''
        if 'Mentve a szerverre' in s or 'NEM' in s: return s
        await pg.wait_for_timeout(100)
    return s

async def main():
    data = tempfile.mkdtemp(prefix='kg-e2e-'); img = os.path.join(data, 'foto.png'); png(img)
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW)
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, check=True, capture_output=True)
    srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', ROOT + '/dev/router.php'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(B + 'api/health', timeout=1); break
        except Exception: time.sleep(0.1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            adm = await (await b.new_context(viewport={'width': 1280, 'height': 860})).new_page()
            vis = await (await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)).new_page()
            errs = []
            for pg in (adm, vis): pg.on('pageerror', lambda e: errs.append(str(e)))

            print('Látogató, mentett állapot nélkül')
            p0 = await price_on_catalog(vis)
            check('a látogató a beépített árakat látja (még nincs mentett változat)', p0 and p0 > 100000, p0)
            check('látogatónak nincs kezelőfelülethez tartozó sütije', not any(c['name'] == 'kg_admin' for c in await vis.context.cookies()))

            print('Belépés')
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1200)
            check('a kezelőfelület belépést kér', await adm.locator('[data-login]').count() == 1 and await adm.locator('.adm').count() == 0)
            await adm.fill('[name="pw"]', 'rossz-jelszo-1234'); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(900)
            check('hibás jelszó: hibaüzenet, nincs belépés', await adm.locator('[data-lerr]').is_visible() and await adm.locator('.adm').count() == 0)
            await adm.fill('[name="pw"]', PW); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(1200)
            check('helyes jelszó: kezelőfelület', await adm.locator('.adm').count() == 1)
            sync = await adm.inner_text('[data-sync]')
            check('mentésjelző: szerveres mentés bekapcsolva', 'Szerveres mentés' in sync, sync)

            print('Árváltoztatás a szerveren')
            await adm.fill('[data-path="sellPerGram.au14"]', '52000'); await adm.wait_for_timeout(400)
            if await adm.locator('[data-confirm]').count(): await adm.check('[data-confirm]')
            await adm.click('[data-apply]')
            s = await wait_saved(adm)
            check('mentés után: „Mentve a szerverre”', 'Mentve a szerverre' in s, s)
            p1 = await price_on_catalog(vis)
            check('a látogató (másik böngésző) a szerverről az új árat kapja', p1 and p1 > p0, f'{p0} → {p1}')
            await rest(b, adm, vis, errs, img)
    finally:
        srv.terminate(); shutil.rmtree(data, ignore_errors=True)
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

async def rest(b, adm, vis, errs, img):
    print('Újratöltés után is a szerver adata él')
    await adm.reload(); await adm.wait_for_timeout(1500)
    await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1000)
    v = await adm.input_value('[data-path="sellPerGram.au14"]')
    check('újratöltés után a kezelőfelületen 52 000 Ft/g', num(v) == 52000, v)
    check('újratöltés után is be van lépve', await adm.locator('.adm').count() == 1)

    print('Érdeklődés a látogatótól')
    await vis.goto(B + f'#/gyuru/{PAIR}'); await vis.wait_for_timeout(1300)
    await vis.locator('.pdp__ctas [data-inquire="erdeklodes"]').click(); await vis.wait_for_timeout(500)
    await vis.fill('[name="nev"]', 'Próba Péter'); await vis.fill('[name="tel"]', '+36 30 123 4567')
    await vis.locator('.modal form button[type="submit"]').first.click(); await vis.wait_for_timeout(1200)
    done = await vis.inner_text('.form--done') if await vis.locator('.form--done').count() else ''
    check('látogató: „megérkezett hozzánk” visszajelzés', 'megérkezett' in done, done[:120])
    await adm.goto(B + '#/admin/erdeklodesek'); await adm.reload(); await adm.wait_for_timeout(1800)
    inq = await adm.inner_text('#adm-main')
    check('admin: a látogató érdeklődése megjelenik, a gyűrű cikkszámával', 'Próba Péter' in inq and '81194' in inq, inq[:200].replace('\n', ' | '))

    print('Képfeltöltés')
    await adm.goto(B + '#/admin/fotok'); await adm.wait_for_timeout(1000)
    await adm.set_input_files(f'[data-photo="{PAIR}"]', img)
    s = await wait_saved(adm)
    src = await adm.evaluate(f"(() => {{ const i = document.querySelector('[data-photo=\"{PAIR}\"]').closest('li,article,div').querySelector('img'); return i ? i.getAttribute('src') : ''; }})()")
    check('a kép a szerverre került (api/photo/…jpg), mentve', src.startswith('api/photo/') and 'Mentve a szerverre' in s, f'{src} / {s}')
    await vis.goto(B + f'#/gyuru/{PAIR}'); await vis.reload(); await vis.wait_for_timeout(1500)
    vsrc = await vis.get_attribute('.pdp__stage img', 'src') or ''
    ok_img = await vis.evaluate("(() => { const i = document.querySelector('.pdp__stage img'); return !!i && i.complete && i.naturalWidth > 0; })()")
    check('látogató: az új kép a szerverről töltődik be', vsrc.startswith('api/photo/') and ok_img, vsrc)

    print('Ütközés: két admin egyszerre')
    adm2 = await (await b.new_context(viewport={'width': 1280, 'height': 860})).new_page()
    adm2.on('pageerror', lambda e: errs.append(str(e)))
    await adm2.goto(B + '#/admin/beallitasok'); await adm2.wait_for_timeout(1000)
    await adm2.fill('[name="pw"]', PW); await adm2.click('[data-login] button[type="submit"]'); await adm2.wait_for_timeout(1200)
    await adm.goto(B + '#/admin/beallitasok'); await adm.wait_for_timeout(800)
    await adm.click('[data-save]'); s1 = await wait_saved(adm)
    await adm2.goto(B + '#/admin/beallitasok'); await adm2.wait_for_timeout(600)
    await adm2.click('[data-save]'); s2 = await wait_saved(adm2)
    check('az első mentés sikerül', 'Mentve a szerverre' in s1, s1)
    check('a második (elavult) mentés nem írja felül: egyértelmű hiba', 'NEM került mentésre' in s2 and 'Töltse újra' in s2, s2)

    print('Kilépés')
    await adm.click('[data-logout]'); await adm.wait_for_timeout(1000)
    await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1000)
    check('kilépés után újra belépés kell', await adm.locator('[data-login]').count() == 1)
    bad = [e for e in errs if 'Failed to fetch' not in e]
    check('nincs JavaScript-hiba', not bad, ' | '.join(bad)[:200])
    await b.close()

asyncio.run(main())
