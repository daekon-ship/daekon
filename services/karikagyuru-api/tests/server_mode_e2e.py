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
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW, KG_DEMO='1')   # V5.6: mintaadat → bemutató mód (élesben bemutató-adat nem menthető)
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, check=True, capture_output=True)
    # A nyilvános kódban nincs ár (V5.5): a teszt a fejlesztői adatkészletet tölti be (minden gyűrű, semmi sincs jóváhagyva).
    stf = os.path.join(data, 'allapot.json')
    open(stf, 'w').write(subprocess.run(['node', ROOT + '/dev/make-demo-state.mjs', '--mind'], capture_output=True, text=True, check=True).stdout)
    subprocess.run(['php', ROOT + '/bin/demo-seed.php', stf], env=env, check=True, capture_output=True)
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

            print('Látogató, kiinduló (tesztadat) állapot')
            p0 = await price_on_catalog(vis)
            ctext = await vis.inner_text(f'.card[data-id="{PAIR}"]') if await vis.locator(f'.card[data-id="{PAIR}"]').count() else ''
            check('a látogató a nem jóváhagyott gyűrűnél „Egyedi árajánlat”-ot lát, nem a régi listaárat', p0 is None and 'Egyedi árajánlat' in ctext, (p0, ctext[:80]))
            st0 = await vis.evaluate("async () => { const { store } = await import('./js/store.js'); return store.get().products.filter((p) => 'listaAr' in p).length; }")
            check('a nyilvános API nem adja ki a régi listaárat', st0 == 0, st0)
            check('látogatónak nincs kezelőfelülethez tartozó sütije', not any(c['name'] == 'kg_admin' for c in await vis.context.cookies()))
            st_pub = await vis.evaluate("async () => { const { store } = await import('./js/store.js'); const s = store.get(); return { pub: !!s.public, g: s.materials.gold24 ?? null, h: (s.history || []).length, mk: s.settings.markupMetal ?? null }; }")

            print('Belépés')
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1200)
            check('a kezelőfelület belépést kér', await adm.locator('[data-login]').count() == 1 and await adm.locator('.adm').count() == 0)
            await adm.fill('[name="pw"]', 'rossz-jelszo-1234'); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(900)
            check('hibás jelszó: hibaüzenet, nincs belépés', await adm.locator('[data-lerr]').is_visible() and await adm.locator('.adm').count() == 0)
            await adm.fill('[name="pw"]', PW); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(1200)
            check('helyes jelszó: kezelőfelület', await adm.locator('.adm').count() == 1)
            sync = await adm.inner_text('[data-sync]')
            check('mentésjelző (V5.10 közérthetően): a változások a szerverre mentődnek', 'szerverre mentődnek' in sync or 'Mentve a szerverre' in sync, sync)

            print('Jóváhagyás: árelemek és egy gyűrű')
            await adm.goto(B + '#/admin/jovahagyas'); await adm.wait_for_timeout(900)
            for _ in range(60):
                btn = adm.locator('[data-appr]:not([disabled])').first
                if not await btn.count(): break
                await btn.click(); await adm.wait_for_timeout(120)
            s = await wait_saved(adm)
            check('árelemek jóváhagyva és mentve', await adm.locator('[data-appr]:not([disabled])').count() == 0 and 'Mentve a szerverre' in s, s)
            await vis.goto(B + f'#/gyuru/{PAIR}'); await vis.reload(); await vis.wait_for_timeout(1300)
            check('látogató: nem jóváhagyott gyűrűn nincs beállítás, „egyedi” út', await vis.locator('[data-locked]').count() == 1 and await vis.locator('[data-steps]').count() == 0)
            await adm.goto(B + f'#/admin/sorban/{PAIR}'); await adm.wait_for_timeout(900)
            check('szakmai jóváhagyás vastagság nélkül tiltva (szerver mód)', await adm.locator('[data-approve]').is_disabled() and 'vastagság' in await adm.inner_text('[data-qmissing]'))
            await adm.goto(B + f'#/admin/gyuru/{PAIR}'); await adm.wait_for_timeout(900)
            if not await adm.locator('[data-adv][open]').count(): await adm.click('[data-adv] summary'); await adm.wait_for_timeout(200)   # V5.9: részletes beállítások
            for i in range(await adm.locator('[data-p$=".thickness"]').count()): await adm.locator('[data-p$=".thickness"]').nth(i).fill('1,8')
            await adm.click('[data-save]'); await wait_saved(adm)
            await adm.goto(B + f'#/admin/sorban/{PAIR}'); await adm.wait_for_timeout(900)
            if await adm.locator('[data-qconfirm]').count(): await adm.check('[data-qconfirm]')
            await adm.click('[data-approve]'); s = await wait_saved(adm)
            check('gyűrű jóváhagyva a sorban, mentve', 'Mentve a szerverre' in s, s)
            await vis.reload(); await vis.wait_for_timeout(1300)
            check('látogató: jóváhagyott gyűrűn megjelenik a beállítás és a számolt ár', await vis.locator('[data-locked]').count() == 0 and await vis.locator('[data-steps] .cfg__step').count() >= 3 and 'Becsült ár' in await vis.inner_text('[data-pricebox]'))

            st_pub = await vis.evaluate("async () => { const { store } = await import('./js/store.js'); const s = store.get(); return { pub: !!s.public, g: s.materials.gold24 ?? null, h: (s.history || []).length, mk: s.settings.markupMetal ?? null }; }")
            check('látogató böngészőjében a nyilvános nézet van: nincs beszerzési ár, felár, árnapló', st_pub['pub'] and st_pub['g'] is None and st_pub['mk'] is None and st_pub['h'] == 0, st_pub)
            st_adm = await adm.evaluate("async () => { const { store } = await import('./js/store.js'); const s = store.get(); return { pub: !!s.public, g: s.materials.gold24 ?? null, h: (s.history || []).length }; }")
            check('admin böngészőjében a teljes állapot van (beszerzési ár, árnapló)', not st_adm['pub'] and st_adm['g'] and st_adm['h'] > 0, st_adm)
            print('Árváltoztatás a szerveren')
            p0 = await price_on_catalog(vis)
            await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(900)
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
    ftxt = await vis.inner_text('.modal')
    check('szerver módban nincs „nem jut el az ötvöshöz” figyelmeztetés', 'nem jut el' not in ftxt and await vis.locator('[data-localnote]').count() == 0)
    await vis.fill('[name="nev"]', 'Próba Péter'); await vis.fill('[name="tel"]', '+36 30 123 4567')
    await vis.locator('.modal form button[type="submit"]').first.click(); await vis.wait_for_timeout(1200)
    done = await vis.inner_text('.form--done') if await vis.locator('.form--done').count() else ''
    check('látogató: „Megkaptuk az üzeneted” visszajelzés, határidő-ígéret nélkül', 'Megkaptuk' in done and 'hamarosan hívunk' not in done.lower(), done[:120])
    await adm.goto(B + '#/admin/erdeklodesek'); await adm.reload(); await adm.wait_for_timeout(1800)
    inq = await adm.inner_text('#adm-main')
    check('admin: a látogató érdeklődése megjelenik, a gyűrű cikkszámával', 'Próba Péter' in inq and '81194' in inq, inq[:200].replace('\n', ' | '))

    print('Saját ötlet referenciaképpel (mobil)')
    await vis.goto(B + '#/sajat'); await vis.reload(); await vis.wait_for_timeout(1200)
    check('saját ötlet: adatkezelési link az űrlap mellett, nincs „nem jut el” figyelmeztetés', await vis.locator('.custom [data-privacy] a').count() == 1 and await vis.locator('.custom [data-localnote]').count() == 0)
    await vis.set_input_files('[data-cfile]', img); await vis.wait_for_timeout(400)
    note = await vis.inner_text('[data-cfilenote]')
    check('a kép kiválasztása után: „csak az ötvös látja”', 'Csak az ötvös látja' in note, note)
    await vis.fill('[name="leiras"]', 'Ilyen gyűrűt szeretnénk, csak vékonyabban.')
    await vis.fill('.custom [name="nev"]', 'Kép Kornél'); await vis.fill('.custom [name="tel"]', '+36 30 765 4321')
    await vis.locator('.custom button[type="submit"]').click(); await vis.wait_for_timeout(1800)
    done = await vis.inner_text('.custom--done') if await vis.locator('.custom--done').count() else ''
    check('saját ötlet: „a csatolt kép is megérkezett”', 'kép is megérkezett' in done, done[:160])
    await adm.goto(B + '#/admin/erdeklodesek'); await adm.reload(); await adm.wait_for_timeout(1800)
    art = adm.locator('.inq', has_text='Kép Kornél')
    okimg = await art.locator('[data-inqfiles] img').first.evaluate("(i) => new Promise((r) => { if (i.complete) r(i.naturalWidth > 0); else { i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); } })") if await art.locator('[data-inqfiles] img').count() else False
    check('admin: a csatolt referenciakép látszik az érdeklődésnél', okimg)
    src = await art.locator('[data-inqfiles] img').first.get_attribute('src') if await art.locator('[data-inqfiles] img').count() else ''
    st_, _ = await vis.evaluate(f"(async () => {{ const r = await fetch('{src}'); return [r.status, 0]; }})()") if src else (0, 0)
    check('látogató böngészőjéből ugyanaz a kép nem nyitható meg (401)', st_ == 401, st_)

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
    await adm2.click('[data-save]'); await adm2.wait_for_timeout(2500)
    s2 = await adm2.inner_text('[data-blocked]') if await adm2.locator('[data-blocked]').count() else ''
    check('az első mentés sikerül', 'Mentve a szerverre' in s1, s1)
    check('a második (elavult) mentés nem írja felül: zárolt képernyő, egyértelmű hiba', 'NEM került mentésre' in s2 and 'Töltse újra' in s2 and await adm2.locator('.adm').count() == 0, s2)

    print('Kilépés')
    await adm.click('[data-logout]'); await adm.wait_for_timeout(1000)
    await adm.goto(B + '#/admin/alapanyag'); await adm.wait_for_timeout(1000)
    check('kilépés után újra belépés kell', await adm.locator('[data-login]').count() == 1)
    bad = [e for e in errs if 'Failed to fetch' not in e]
    check('nincs JavaScript-hiba', not bad, ' | '.join(bad)[:200])
    await b.close()

asyncio.run(main())
