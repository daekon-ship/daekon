#!/usr/bin/env python3
"""V5.6 – az ügyfélbemutató forgatókönyve végig, böngészőből, a JELSZÓVAL VÉDETT bemutatón (demo/kapu.php).
A (nem nyilvános) bemutató-forgatókönyv sorrendje: főoldal → katalógus → gyűrű → személyre szabás → élő ár →
admin: grammár → érdeklődés beérkezése; plusz termékszerkesztés (jóváhagyás visszavonása és újra jóváhagyás),
referenciakép, visszaállítás. Vásárló 360, 390 és 430 px széles telefonon, admin asztali gépen.
Saját ideiglenes adatmappa, valódi levél nem megy ki. Futtatás: python3 tests/bemutato_e2e.py"""
import asyncio, io, os, re, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.request, uuid
from playwright.async_api import async_playwright
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8808; B = f'http://127.0.0.1:{PORT}/'
DEMO_PW, ADMIN_PW = 'kapu-' + uuid.uuid4().hex[:12], 'admin-' + uuid.uuid4().hex[:12]
A1, A2, PEND = 'maz-81184-81185-w', 'maz-81202-81203-wy', 'maz-79016-79017'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
num = lambda t: int(re.sub(r'\D', '', t) or 0)
NO_HSCROLL = 'document.documentElement.scrollWidth <= window.innerWidth + 1'

async def price(pg, sel='[data-cprice]'):
    for _ in range(40):
        t = await pg.inner_text(sel); v = await pg.get_attribute(sel, 'data-value')
        if v and str(num(t)) == v: return int(v)
        await pg.wait_for_timeout(100)
    return num(await pg.inner_text(sel))

async def wait_saved(pg, t=8000):
    s = ''
    for _ in range(t // 100):
        s = await pg.inner_text('[data-sync]') if await pg.locator('[data-sync]').count() else ''
        if 'Mentve a szerverre' in s or 'NEM' in s: return s
        await pg.wait_for_timeout(100)
    return s

async def gate(pg):
    await pg.goto(B); await pg.wait_for_timeout(300)
    form = await pg.locator('[data-kapu]').count() == 1
    await pg.fill('#jelszo', DEMO_PW); await pg.click('[data-kapu] button[type="submit"]'); await pg.wait_for_timeout(1500)
    return form

async def visitor(b, w, h, full, img):
    tag = f'{w}px'
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    check(f'{tag} jelszókérő a bemutató előtt', await gate(pg))
    # 1. főoldal
    strip = await pg.inner_text('[data-demo-note]') if await pg.locator('[data-demo-note]').count() else ''
    check(f'{tag} 1. főoldal betölt, felül: „Zárt bemutató – szemléltető mintaadatok”', await pg.locator('.site-head').count() == 1 and 'szemléltető' in strip, strip)
    check(f'{tag} 1. főoldal: nincs vízszintes görgetés', await pg.evaluate(NO_HSCROLL))
    # 2. katalógus
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1300)
    cnt = num(await pg.inner_text('[data-count]'))
    check(f'{tag} 2. katalógus: mind a 115 gyűrű látható', cnt == 115, cnt)
    await pg.fill('[data-q]', '81184'); await pg.wait_for_timeout(600)
    check(f'{tag} 2. keresés cikkszámra: megtalálja a mintagyűrűt', await pg.locator(f'.card[data-id="{A1}"]').count() == 1)
    await pg.fill('[data-q]', ''); await pg.wait_for_timeout(400)
    check(f'{tag} 2. katalógus: nincs vízszintes görgetés', await pg.evaluate(NO_HSCROLL))
    # 3–5. gyűrű, személyre szabás, élő ár
    await pg.goto(B + f'#/gyuru/{A1}'); await pg.wait_for_timeout(1300)
    lab = await pg.inner_text('[data-plabel]')
    lab_full = await pg.evaluate("getComputedStyle(document.querySelector('[data-plabel]'), '::after').content")
    check(f'{tag} 3. gyűrű: ár mellett „szemléltető mintaár”', 'szemléltető mintaár' in lab_full, (lab, lab_full))
    p0 = await price(pg)
    await pg.locator('[data-metal="pt"]').click(); await pg.wait_for_timeout(500); p1 = await price(pg)
    check(f'{tag} 4. anyag: platina → más ár', p1 != p0 and p1 > 0, (p0, p1))
    await pg.locator('[data-metal="gold"]').click(); await pg.wait_for_timeout(300)
    await pg.locator('[data-karat="au18"]').click(); await pg.wait_for_timeout(400); p18 = await price(pg)
    check(f'{tag} 4. finomság: 18K drágább, mint 14K', p18 > p0, (p0, p18))
    await pg.locator('[data-karat="au14"]').click(); await pg.wait_for_timeout(400)
    await pg.locator('[data-size="0|1"]').click(); await pg.wait_for_timeout(400); p2 = await price(pg)
    check(f'{tag} 4. méret: nagyobb méret → 5. élő árfrissítés felfelé', p2 > p0, (p0, p2))
    cats = await pg.eval_on_selector_all('[data-scat]', 'els => els.map(e => [e.dataset.scat, e.disabled])')
    check(f'{tag} 4. gyémánt: csak engedélyezett változatok', len(cats) >= 1 and any(not d for _, d in cats), cats)
    if await pg.locator('[data-scount$="|1"]:not([disabled])').count():
        await pg.locator('[data-scount$="|1"]:not([disabled])').first.click(); await pg.wait_for_timeout(400)
        check(f'{tag} 4. +1 gyémánt → magasabb ár', await price(pg) > p2)
    check(f'{tag} konfigurátor: nincs vízszintes görgetés', await pg.evaluate(NO_HSCROLL))
    if full:
        # 7. érdeklődés a gyűrűről + saját ötlet referenciaképpel
        await pg.locator('.pdp [data-inquire]:visible').first.click(); await pg.wait_for_timeout(500)
        await pg.fill('.form [name=nev]', 'Bemutató Bea'); await pg.fill('.form [name=tel]', '+36 30 111 0000')
        await pg.click('.form button[type=submit]'); await pg.wait_for_timeout(1500)
        done = await pg.inner_text('.form--done') if await pg.locator('.form--done').count() else ''
        check(f'{tag} 7. ajánlatkérés elküldve, sikerjelzés', len(done) > 10 and 'nem jut el' not in done, done[:120])
        if await pg.locator('.form--done [data-close]').count(): await pg.click('.form--done [data-close]')
        await pg.goto(B + '#/sajat'); await pg.wait_for_timeout(1200)
        await pg.set_input_files('[data-cfile]', img); await pg.wait_for_timeout(400)
        await pg.fill('[name="leiras"]', 'Ilyen gyűrűt szeretnénk, vékonyabban.')
        await pg.fill('.custom [name="nev"]', 'Kép Kornélia'); await pg.fill('.custom [name="tel"]', '+36 30 222 0000')
        await pg.locator('.custom button[type="submit"]').click(); await pg.wait_for_timeout(1800)
        done = await pg.inner_text('.custom--done') if await pg.locator('.custom--done').count() else ''
        check(f'{tag} 7. saját ötlet referenciaképpel: „a csatolt kép is megérkezett”', 'kép is megérkezett' in done, done[:120])
    check(f'{tag} nincs JavaScript-hiba', not errs, errs[:2])
    return ctx, pg, p0

async def main():
    tmp = tempfile.mkdtemp(prefix='kg-bemutato-'); data = os.path.join(tmp, 'adat')
    base_env = {k: v for k, v in os.environ.items() if not k.startswith('KG_')}
    r = subprocess.run(['php', ROOT + '/bin/demo-install.php'], env=dict(base_env, KG_DATA=data, KG_DEMO_PASSWORD=DEMO_PW, KG_ADMIN_PASSWORD=ADMIN_PW), capture_output=True, text=True)
    check('bemutató telepítve külön adatmappába', r.returncode == 0, r.stderr)
    img = os.path.join(tmp, 'otlet.jpg'); Image.new('RGB', (900, 700), (200, 180, 120)).save(img, 'JPEG')
    srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', ROOT + '/demo/kapu.php'], env=dict(base_env, KG_DATA=data), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(60):
        try: urllib.request.urlopen(B + 'robots.txt', timeout=1); break
        except Exception: time.sleep(0.1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            print('Vásárló: 430, 360 px (forgatókönyv 1–5)')
            for w, h in [(430, 932), (360, 740)]:
                c, _, _ = await visitor(b, w, h, False, img); await c.close()
            print('Vásárló: 390 px (forgatókönyv 1–5 és 7)')
            vctx, vis, base_price = await visitor(b, 390, 844, True, img)

            print('Admin (asztali): 6. grammár, termékszerkesztés, jóváhagyás, érdeklődések')
            actx = await b.new_context(viewport={'width': 1366, 'height': 900}); adm = await actx.new_page()
            aerrs = []; adm.on('pageerror', lambda e: aerrs.append(str(e)))
            await gate(adm)
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1000)
            await adm.fill('[name="pw"]', DEMO_PW); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(1200)
            check('admin: a bemutató jelszava NEM nyitja a kezelőfelületet', await adm.locator('[data-login]').count() == 1)
            await adm.fill('[name="pw"]', ADMIN_PW); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(1500)
            check('admin: belépés a saját jelszóval, „Zárt bemutató” jelölés', await adm.locator('.adm').count() == 1 and 'Zárt bemutató' in await adm.inner_text('[data-demo-note]'))
            await adm.goto(B + '#/admin/'); await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(900)
            g0 = num(await adm.input_value('[data-path="sellPerGram.au14"]'))
            await adm.fill('[data-path="sellPerGram.au14"]', str(g0 + 3000)); await adm.wait_for_timeout(400)
            if await adm.locator('[data-confirm]').count(): await adm.check('[data-confirm]')
            imp = await adm.inner_text('#adm-main')
            check('6. grammár: mentés előtt látszik, hány gyűrű ára változik', 'gyűrű' in imp, imp[:160].replace('\n', ' | '))
            await adm.click('[data-apply]')
            check('6. grammár mentve a szerverre', 'Mentve a szerverre' in await wait_saved(adm))
            await vis.goto(B + f'#/gyuru/{A1}'); await vis.reload(); await vis.wait_for_timeout(1300)
            p_after = await price(vis)
            check('6. a vásárló oldalán a gyűrű ára azonnal nőtt (újratöltés után)', p_after > base_price, (base_price, p_after))

            # termékszerkesztés → jóváhagyás visszavonása → újra jóváhagyás
            await adm.goto(B + f'#/admin/gyuru/{A1}'); await adm.wait_for_timeout(1000)
            wv = float((await adm.input_value('[data-p="rings.0.weight"]')).replace(',', '.'))
            await adm.fill('[data-p="rings.0.weight"]', str(round(wv + 0.3, 2)).replace('.', ',')); await adm.wait_for_timeout(300)
            await adm.click('[data-save]'); await adm.wait_for_timeout(600)
            if await adm.locator('.modal [data-ok]').count(): await adm.click('.modal [data-ok]'); await adm.wait_for_timeout(400)
            await wait_saved(adm)
            await adm.goto(B + '#/admin/elozmenyek'); await adm.wait_for_timeout(900)
            hist = await adm.inner_text('#adm-main')
            check('termékszerkesztés: tömeg módosítva → jóváhagyás automatikusan visszavonva (előzményekben)', 'automatikusan visszavonva' in hist and '81184' in hist, hist[:200].replace('\n', ' | '))
            await vis.reload(); await vis.wait_for_timeout(1300)
            check('vásárló: visszavont jóváhagyás után nincs beállítás (személyes egyeztetés)', await vis.locator('[data-locked]').count() == 1)
            await adm.goto(B + f'#/admin/sorban/{A1}'); await adm.wait_for_timeout(900)
            await adm.click('[data-approve]'); await wait_saved(adm)
            await vis.reload(); await vis.wait_for_timeout(1300)
            check('újra jóváhagyva: a vásárló ismét beállíthatja, számolt árral', await vis.locator('[data-locked]').count() == 0 and await vis.locator('[data-steps] .cfg__step').count() >= 4)
            await adm.goto(B + f'#/admin/sorban/{PEND}'); await adm.wait_for_timeout(900)
            await adm.click('[data-approve]'); await wait_saved(adm)
            await vis.goto(B + f'#/gyuru/{PEND}'); await vis.reload(); await vis.wait_for_timeout(1300)
            check('a harmadik mintagyűrű jóváhagyás után beállítható', await vis.locator('[data-locked]').count() == 0)

            # 7. érdeklődések az adminban
            await adm.goto(B + '#/admin/erdeklodesek'); await adm.reload(); await adm.wait_for_timeout(1800)
            inq = await adm.inner_text('#adm-main')
            check('7. admin: mindkét érdeklődés beérkezett (gyűrű cikkszámmal és saját ötlet)', 'Bemutató Bea' in inq and 'Kép Kornélia' in inq and '81184' in inq, inq[:200].replace('\n', ' | '))
            art = adm.locator('.inq', has_text='Kép Kornélia')
            okimg = await art.locator('[data-inqfiles] img').first.evaluate("(i) => new Promise((r) => { if (i.complete) r(i.naturalWidth > 0); else { i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); } })") if await art.locator('[data-inqfiles] img').count() else False
            check('7. admin: a referenciakép az érdeklődésnél látszik', okimg)
            check('7. admin: e-mail-értesítés kikapcsolva (a bemutató nem küld levelet)', 'levél' not in inq.lower() or 'kikapcsol' in inq.lower() or 'nem ment' in inq.lower(), inq[:300])
            check('admin: nincs JavaScript-hiba', not aerrs, aerrs[:2])

            print('Visszaállítás')
            r = subprocess.run(['php', ROOT + '/bin/demo-reset.php'], env=dict(base_env, KG_DATA=data), capture_output=True, text=True)
            check('demo-reset lefut', r.returncode == 0, r.stderr)
            await vis.goto(B + f'#/gyuru/{A1}'); await vis.reload(); await vis.wait_for_timeout(1300)
            check('visszaállítás után az eredeti mintaár és állapot', await price(vis) == base_price and await vis.locator('[data-locked]').count() == 0, await price(vis))
            await vis.goto(B + f'#/gyuru/{PEND}'); await vis.reload(); await vis.wait_for_timeout(1200)
            check('visszaállítás után a harmadik gyűrű újra jóváhagyásra vár', await vis.locator('[data-locked]').count() == 1)
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(tmp, ignore_errors=True)
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

asyncio.run(main())
