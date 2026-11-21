#!/usr/bin/env python3
"""Szerver mód hibái, böngészőből (dev/router.php + saját adatmappa):
API-kiesés induláskor, sikertelen mentés, lejárt belépés, sikertelen érdeklődés – egyik sem adhat hamis sikert,
és a kezelőfelület nem mutathat el nem mentett adatot mentettként. Futtatás: python3 tests/server_failures_e2e.py"""
import asyncio, os, re, shutil, subprocess, sys, tempfile, time, urllib.request, uuid
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('KG_E2E_PORT', '8795'))
B = f'http://127.0.0.1:{PORT}/'
PW = 'proba-' + uuid.uuid4().hex
PAIR = 'maz-81194-81195-w'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
num = lambda t: int(re.sub(r'\D', '', t) or 0)

async def login(pg):
    await pg.fill('[name="pw"]', PW); await pg.click('[data-login] button[type="submit"]'); await pg.wait_for_timeout(1200)

async def inquire(pg):
    if await pg.locator('.modal [data-close]').count(): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    if await pg.locator('.modal').count(): await pg.locator('.modal__scrim').first.click(force=True); await pg.wait_for_timeout(300)
    await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1200)
    await pg.locator('.pdp__ctas [data-inquire="erdeklodes"]').click(); await pg.wait_for_timeout(500)
    await pg.fill('[name="nev"]', 'Hiba Hugó'); await pg.fill('[name="tel"]', '+36 30 111 2222')
    await pg.locator('.modal form button[type="submit"]').first.click(); await pg.wait_for_timeout(1500)
    done = await pg.locator('.form--done').count()
    err = await pg.inner_text('.modal [data-err]') if await pg.locator('.modal [data-err]:visible').count() else ''
    return done, err

async def main():
    data = tempfile.mkdtemp(prefix='kg-fail-'); down = os.path.join(data, '.api-down')
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW)
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, check=True, capture_output=True)
    srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', ROOT + '/dev/router.php'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(B, timeout=1); break
        except Exception: time.sleep(0.1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            errs = []
            async def page(w=1280, h=860, mob=False):
                pg = await (await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob)).new_page()
                pg.on('pageerror', lambda e: errs.append(str(e))); return pg

            print('1. API-kiesés induláskor')
            open(down, 'w').close()
            adm = await page()
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1500)
            check('kezelőfelület: „nem használható” képernyő, nincs szerkeszthető admin', await adm.locator('[data-blocked]').count() == 1 and await adm.locator('.adm').count() == 0)
            txt = await adm.inner_text('[data-blocked]')
            check('a képernyő megmondja, hogy a módosítás nem menthető', 'nem menthetők' in txt, txt[:120])
            check('nem jött létre helyi mentés a böngészőben', await adm.evaluate("Object.keys(localStorage).filter(k => k.startsWith('karikagyuru-')).length") == 0)
            vis = await page(390, 844, True)
            await vis.goto(B + '#/kollekcio'); await vis.wait_for_timeout(1500)
            check('látogató: a katalógus kiesés alatt is látszik', await vis.locator('.card').count() > 10)
            done, err = await inquire(vis)
            check('látogató: kiesés alatt NINCS sikeres visszajelzés, hanem hiba + telefonszám', done == 0 and 'Telefon' in err, f'{done} {err}')
            os.remove(down)

            print('2. Sikertelen mentés belépés után')
            await adm.reload(); await adm.wait_for_timeout(1500)
            await login(adm)
            await adm.goto(B + '#/admin/beallitasok'); await adm.wait_for_timeout(800)
            before = await adm.input_value('[data-path="roundTo"], [name="roundTo"], [data-set="roundTo"]') if await adm.locator('[data-path="roundTo"], [name="roundTo"], [data-set="roundTo"]').count() else None
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(900)
            v0 = num(await adm.input_value('[data-path="sellPerGram.au14"]'))
            open(down, 'w').close()
            await adm.fill('[data-path="sellPerGram.au14"]', str(v0 + 3000)); await adm.wait_for_timeout(400)
            if await adm.locator('[data-confirm]').count(): await adm.check('[data-confirm]')
            await adm.click('[data-apply]'); await adm.wait_for_timeout(2500)
            check('mentési hiba: a kezelőfelület zárolódik', await adm.locator('[data-blocked]').count() == 1 and await adm.locator('.adm').count() == 0)
            check('mentési hiba: „NEM került mentésre” kiírva', 'NEM került mentésre' in await adm.inner_text('[data-blocked]'))
            os.remove(down)
            await adm.reload(); await adm.wait_for_timeout(1500)
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(900)
            v1 = num(await adm.input_value('[data-path="sellPerGram.au14"]'))
            check('a szerveren a régi ár maradt (nem mentett változás nem „ragadt be”)', v1 == v0, f'{v0} / {v1}')

            print('3. Lejárt belépés')
            await adm.context.clear_cookies()
            await adm.fill('[data-path="sellPerGram.au14"]', str(v0 + 5000)); await adm.wait_for_timeout(400)
            if await adm.locator('[data-confirm]').count(): await adm.check('[data-confirm]')
            await adm.click('[data-apply]'); await adm.wait_for_timeout(2500)
            check('lejárt belépés: belépőképernyő jön', await adm.locator('[data-login]').count() == 1)
            msg = await adm.inner_text('[data-lmsg]') if await adm.locator('[data-lmsg]').count() else ''
            check('lejárt belépés: kiírja, hogy a módosítás NEM mentődött', 'NEM került mentésre' in msg, msg)
            await login(adm)
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(900)
            v2 = num(await adm.input_value('[data-path="sellPerGram.au14"]'))
            check('újra belépés után a szerver valódi állapota látszik (régi ár)', v2 == v0, f'{v0} / {v2}')
            await adm.fill('[data-path="sellPerGram.au14"]', str(v0 + 1000)); await adm.wait_for_timeout(400)
            if await adm.locator('[data-confirm]').count(): await adm.check('[data-confirm]')
            await adm.click('[data-apply]'); await adm.wait_for_timeout(2000)
            sync = await adm.inner_text('[data-sync]')
            check('újra belépés után a mentés ismét működik', 'Mentve a szerverre' in sync, sync)

            print('4. Sikertelen érdeklődés futás közben')
            vis2 = await page(1280, 860)
            await vis2.goto(B + f'#/gyuru/{PAIR}'); await vis2.wait_for_timeout(1300)
            open(down, 'w').close()
            done, err = await inquire(vis2)
            check('érdeklődés közbeni kiesés: nincs hamis siker, hiba + telefonszám', done == 0 and 'Telefon' in err, f'{done} {err}')
            os.remove(down)
            done, err = await inquire(vis2)
            check('a kapcsolat visszatérése után az érdeklődés elmegy', done == 1, err)

            print('5. Nem jóváhagyott ár a látogatónál')
            await vis2.goto(B + f'#/gyuru/{PAIR}?k=x'); await vis2.reload(); await vis2.wait_for_timeout(1300)
            lab = await vis2.inner_text('[data-plabel]')
            check('nem jóváhagyott gyűrű: „listaár – alapváltozat”, nem „becsült ár”', 'listaár' in lab.lower() and 'Becsült' not in lab, lab)
            check('nem jóváhagyott gyűrű: nincs online beállítás', await vis2.locator('[data-steps]').count() == 0 and await vis2.locator('[data-locked]').count() == 1)
            check('nincs JavaScript-hiba', not [e for e in errs if 'Failed to fetch' not in e], ' | '.join(errs)[:200])
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(data, ignore_errors=True)
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

asyncio.run(main())
