#!/usr/bin/env python3
"""Nem nyilvános bemutatópéldány (dev/make-demo-state.mjs + bin/demo-seed.php + dev/router.php), böngészőből.
Telefonos vásárló: anyag, méret, gyémánt (csak a megengedett változatok), árfrissítés; admin: központi grammár hatása,
jóváhagyás folyamata; a mintaadat jelölve van, élesíteni nem lehet, és éles (nem üres) adatbázisba nem tölthető.
Futtatás: python3 tests/demo_e2e.py"""
import asyncio, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.request, uuid
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8800; B = f'http://127.0.0.1:{PORT}/'
PW = 'bemutato-' + uuid.uuid4().hex[:10]
A1, A2, PEND = 'maz-81184-81185-w', 'maz-81202-81203-wy', 'maz-79016-79017'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
num = lambda t: int(re.sub(r'\D', '', t) or 0)

async def price(pg, sel='[data-cprice]'):
    for _ in range(40):
        t = await pg.inner_text(sel); v = await pg.get_attribute(sel, 'data-value')
        if v and str(num(t)) == v: return int(v)
        await pg.wait_for_timeout(100)
    return num(await pg.inner_text(sel))

async def main():
    data = tempfile.mkdtemp(prefix='kg-demo-'); stf = os.path.join(data, 'allapot.json')
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW, KG_MAIL_MODE='off', KG_DEMO='1')
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, check=True, capture_output=True)
    open(stf, 'w').write(subprocess.run(['node', ROOT + '/dev/make-demo-state.mjs'], capture_output=True, text=True, check=True).stdout)
    r = subprocess.run(['php', ROOT + '/bin/demo-seed.php', stf], env=env, capture_output=True, text=True)
    check('mintaadat betöltve üres adatbázisba', r.returncode == 0, r.stderr)
    r = subprocess.run(['php', ROOT + '/bin/demo-seed.php', stf], env=env, capture_output=True, text=True)
    check('már mentett adatot tartalmazó adatbázisba NEM tölthető', r.returncode != 0 and 'már van mentett adat' in r.stderr, r.stderr)
    nd = os.path.join(data, 'nemdemo.json'); s = json.load(open(stf)); s['demo'] = False; json.dump(s, open(nd, 'w'))
    d2 = tempfile.mkdtemp(prefix='kg-demo2-')
    r = subprocess.run(['php', ROOT + '/bin/demo-seed.php', nd], env=dict(env, KG_DATA=d2), capture_output=True, text=True)
    check('„demo” jelölés nélküli állapotot nem tölt be', r.returncode != 0, r.stderr); shutil.rmtree(d2, ignore_errors=True)
    srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', ROOT + '/dev/router.php'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(B + 'api/health', timeout=1); break
        except Exception: time.sleep(0.1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(); errs = []
            vis = await (await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)).new_page()
            adm = await (await b.new_context(viewport={'width': 1280, 'height': 860})).new_page()
            for pg in (vis, adm): pg.on('pageerror', lambda e: errs.append(str(e)))

            print('Vásárló (telefon)')
            await vis.goto(B + '#/kollekcio'); await vis.wait_for_timeout(1500)
            cnt = num(await vis.inner_text('[data-count]'))
            found = []
            for code in ['81184', '81202', '79016']:
                await vis.fill('[data-q]', code); await vis.wait_for_timeout(500)
                found += await vis.eval_on_selector_all('.card[data-id]', 'els => els.map(e => e.dataset.id)')
            await vis.fill('[data-q]', '')
            check('a katalógusban mind a 115 gyűrű, köztük a 3 mintagyűrű', cnt == 115 and all(x in found for x in [A1, A2, PEND]), (cnt, found))
            check('felső sáv jelzi: zárt bemutató, szemléltető mintaárak', 'szemléltető mintaadatok' in await vis.inner_text('[data-demo-note]'))
            await vis.goto(B + f'#/gyuru/{A1}'); await vis.wait_for_timeout(1300)
            p0 = await price(vis)
            check('jóváhagyott mintagyűrű: számolt ár, beállítható', 'Becsült ár' in await vis.inner_text('[data-plabel]') and await vis.locator('[data-steps] .cfg__step').count() >= 4 and p0 > 100000, p0)
            await vis.locator('[data-metal="pt"]').click(); await vis.wait_for_timeout(500)
            p1 = await price(vis); check('anyagválasztás: platinára más ár', p1 != p0 and p1 > 0, (p0, p1))
            await vis.locator('[data-metal="gold"]').click(); await vis.wait_for_timeout(300); await vis.locator('[data-karat="au14"]').click(); await vis.wait_for_timeout(400)
            await vis.locator('[data-size="0|1"]').click(); await vis.wait_for_timeout(400)
            p2 = await price(vis); check('méretválasztás: nagyobb méret, magasabb ár', p2 > p0, (p0, p2))
            cats = await vis.eval_on_selector_all('[data-scat]', 'els => els.map(e => [e.dataset.scat, e.disabled])')
            allowed = [c for c, dis in cats if not dis]
            check('gyémánt: csak a megengedett kőméretek választhatók', len(cats) >= 1 and len(allowed) >= 1, cats)
            if await vis.locator('[data-scount$="|1"]:not([disabled])').count():
                await vis.locator('[data-scount$="|1"]:not([disabled])').first.click(); await vis.wait_for_timeout(400)
                p3 = await price(vis); check('+1 gyémánt: magasabb ár', p3 > p2, (p2, p3))
            over = await vis.evaluate('document.documentElement.scrollWidth - innerWidth')
            check('telefonon nincs oldalra görgetés a konfigurátorban', over <= 0, over)
            await vis.goto(B + f'#/gyuru/{PEND}'); await vis.wait_for_timeout(1200)
            check('jóváhagyásra váró mintagyűrű: nincs beállítás, listaár', await vis.locator('[data-locked]').count() == 1 and 'listaár' in (await vis.inner_text('[data-plabel]')).lower())

            print('Admin: központi grammár és jóváhagyás')
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1200)
            await adm.fill('[name="pw"]', PW); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(1500)
            check('admin: zárt bemutató jelölve', await adm.locator('.adm').count() == 1 and 'Zárt bemutató' in await adm.inner_text('[data-demo-note]'), (await adm.inner_text('body'))[:300])
            await adm.wait_for_timeout(1000); await adm.goto(B + '#/admin/'); await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(900)
            g0 = num(await adm.input_value('[data-path="sellPerGram.au14"]'))
            await adm.fill('[data-path="sellPerGram.au14"]', str(g0 + 5000)); await adm.wait_for_timeout(400)
            if await adm.locator('[data-confirm]').count(): await adm.check('[data-confirm]')
            await adm.click('[data-apply]'); await adm.wait_for_timeout(2000)
            check('grammár mentve a szerverre', 'Mentve a szerverre' in await adm.inner_text('[data-sync]'))
            await vis.goto(B + f'#/gyuru/{A1}'); await vis.reload(); await vis.wait_for_timeout(1300)
            p4 = await price(vis); check('központi 14K grammár emelése → a mintagyűrű ára nőtt', p4 > p0, (p0, p4))
            await adm.goto(B + f'#/admin/sorban/{PEND}'); await adm.wait_for_timeout(900)
            await adm.click('[data-approve]'); await adm.wait_for_timeout(2000)
            await vis.goto(B + f'#/gyuru/{PEND}'); await vis.reload(); await vis.wait_for_timeout(1300)
            check('jóváhagyás után a harmadik mintagyűrű is beállítható, számolt árral', await vis.locator('[data-locked]').count() == 0 and 'Becsült ár' in await vis.inner_text('[data-plabel]'))
            await adm.goto(B + '#/admin/jovahagyas'); await adm.wait_for_timeout(900)
            gl = await adm.inner_text('[data-golive-box]')
            check('élesítési ellenőrzés: bemutató mintaadattal tilt', 'bemutató mintaadat' in gl and 'Nem élesíthető' in gl, gl[:200])
            check('nincs JavaScript-hiba', not errs, ' | '.join(errs)[:200])
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(data, ignore_errors=True)
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

asyncio.run(main())
