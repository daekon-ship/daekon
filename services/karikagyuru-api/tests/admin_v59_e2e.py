#!/usr/bin/env python3
"""V5.9 – az egyszerűsített kezelőfelület szerver módban, valódi böngészővel és PHP-szerverrel (ideiglenes adatmappa, csak tesztadat).
Ellenőrzi: a régi és új admin címek nem kerülik meg a belépést; az árak mentése csak szerver-visszaigazolás után „sikeres”;
mentési hiba (leállt szerver) egyértelműen jelezve; korábbi ár visszaállítása; fénykép cseréje a gyűrű adatlapján szerverre;
egy (véletlen vagy rosszindulatú) teljes visszaállítás a szerveren elbukik, adatvesztés nélkül; a tulajdonosi admin nem kapja meg
a fejlesztői nyilvántartást."""
import asyncio, os, re, subprocess, sys, tempfile, time, urllib.request, uuid, struct, zlib, json
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('KG_V59_PORT', '8797'))
B = f'http://127.0.0.1:{PORT}/'
PW = 'proba-' + uuid.uuid4().hex
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, str(x)[:240])
norm = lambda t: re.sub(r'[\s  ]+', ' ', t)

def png(path, w=900, h=700):
    raw = b''.join(b'\x00' + bytes([160, 150, 120]) * w for _ in range(h))
    def ch(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b''))

def start(env):
    srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', ROOT + '/dev/router.php'], env=env, stdout=subprocess.DEVNULL, stderr=open(os.path.join(env['KG_DATA'], 'srv.log'), 'a'))
    for _ in range(60):
        try: urllib.request.urlopen(B + 'api/health', timeout=1); break
        except Exception: time.sleep(0.1)
    return srv

async def wait_text(pg, sel, texts, t=10000):
    for _ in range(t // 100):
        s = norm(await pg.inner_text(sel)) if await pg.locator(sel).count() else ''
        if any(x in s for x in texts): return s
        await pg.wait_for_timeout(100)
    return s

async def main():
    data = tempfile.mkdtemp(prefix='kg-v59-'); img = os.path.join(data, 'uj.png'); png(img)
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW, KG_DEMO='1')
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, check=True, capture_output=True)
    stf = os.path.join(data, 'allapot.json')
    open(stf, 'w').write(subprocess.run(['node', ROOT + '/dev/make-demo-state.mjs', '--mind'], capture_output=True, text=True, check=True).stdout)
    subprocess.run(['php', ROOT + '/bin/demo-seed.php', stf], env=env, check=True, capture_output=True)
    cli = lambda *x: subprocess.run(['php', ROOT + '/bin/fejlesztoi-dontesek.php', *x], env=env, capture_output=True, text=True)
    cli('beallit', 'eloleg', 'valasz', 'FEJLESZTOI-TITOK-V59')
    srv = start(env)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            adm = await (await b.new_context(viewport={'width': 1280, 'height': 860})).new_page()
            errs = []; adm.on('pageerror', lambda e: errs.append(str(e)))

            print('3. Régi és új admin címek belépés nélkül')
            leaked = []
            for r in ['attekintes', 'alapanyag', 'arszamitas', 'keplet', 'elozmenyek', 'jovahagyas', 'sorban', 'szabalyok', 'fotok', 'kozpont', 'fejleszto',
                      'arak', 'arak/korabbi', 'arak/arlista', 'gyuruk/ellenorzes', 'gyuru/maz-81184-81185-w', 'beallitasok', 'beallitasok/halado', 'erdeklodesek']:
                await adm.goto(B + '#/admin/' + r); await adm.wait_for_timeout(500)
                if await adm.locator('[data-login]').count() != 1 or await adm.locator('.adm').count(): leaked.append(r)
            check('3. 19 régi és új admin cím belépés nélkül csak a belépőlapot mutatja', not leaked, leaked)

            print('Belépés')
            await adm.goto(B + '#/admin/attekintes'); await adm.wait_for_timeout(700)
            await adm.fill('[name="pw"]', PW); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(1500)
            check('belépés után az egyszerű kezdőképernyő', 'Mit szeretne ma elintézni?' in await adm.inner_text('#adm-main'))
            own = await adm.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())")
            check('16. a tulajdonosi admin API nem adja ki a fejlesztői nyilvántartást', 'FEJLESZTOI-TITOK' not in own and 'clientDecisions' not in own and '"products"' in own)
            await adm.goto(B + '#/admin/kozpont'); await adm.wait_for_timeout(600)
            check('16. a nyilvántartás oldala belépve sem nyílik meg', await adm.locator('[data-devonly]').count() == 1 and await adm.locator('[data-dec]').count() == 0)
            await adm.goto(B + '#/admin/beallitasok'); await adm.wait_for_timeout(600)
            check('17. a Beállításokban nincs teljes visszaállítás gomb', await adm.locator('[data-reset]').count() == 0 and 'Alapállapot' not in await adm.inner_text('#adm-main'))

            print('7/18. Grammár mentése – „sikeres” csak a szerver visszaigazolása után')
            await adm.goto(B + '#/admin/arak'); await adm.wait_for_timeout(900)
            g0 = int(re.sub(r'\D', '', await adm.input_value('[data-path="sellPerGram.au14"]')))
            await adm.fill('[data-path="sellPerGram.au14"]', str(g0 + 1000)); await adm.wait_for_timeout(400)
            if await adm.locator('[data-confirm]').count(): await adm.check('[data-confirm]')
            await adm.click('[data-apply]')
            first = norm(await adm.inner_text('#adm-main'))
            res = await wait_text(adm, '#adm-main', ['sikeresen mentve', 'NEM lettek mentve'])
            srvst = json.loads(await adm.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())"))
            check('18. közvetlenül a kattintás után „Mentés folyamatban…”, nem siker', 'Mentés folyamatban' in first and 'sikeresen' not in first, first[:120])
            check('7. „Az árak sikeresen mentve.” – és a szerveren tényleg az új grammár van', 'Az árak sikeresen mentve.' in res and srvst['state']['materials']['sellPerGram']['au14'] == g0 + 1000, res[:120])

            print('9. Korábbi ár visszaállítása szerver módban')
            await adm.click('[data-undo]'); await adm.wait_for_timeout(400)
            await adm.click('[data-revconfirm] [data-ok]')
            await adm.wait_for_timeout(2500)
            srvst = json.loads(await adm.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())"))
            check('9. a korábbi grammár visszaállt a szerveren', srvst['state']['materials']['sellPerGram']['au14'] == g0, srvst['state']['materials']['sellPerGram']['au14'])

            print('12. Fénykép cseréje a gyűrű adatlapján (szerverre)')
            pid = srvst['state']['products'][0]['id']; old = srvst['state']['products'][0].get('img')
            await adm.goto(B + f'#/admin/gyuru/{pid}'); await adm.wait_for_timeout(1000)
            await adm.set_input_files('[data-imgfile]', img); await adm.wait_for_timeout(400)
            mid = json.loads(await adm.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())"))
            check('12. előnézet közben a szerveren még a régi kép', mid['state']['products'][0].get('img') == old)
            await adm.click('[data-imgsave]')
            msg = await wait_text(adm, '[data-imgmsg]', ['A fénykép mentve', 'NEM'])
            new = json.loads(await adm.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())"))['state']['products'][0].get('img', '')
            check('12. feltöltve és mentve: a szerveren az új, optimalizált kép', 'A fénykép mentve' in msg and new.startswith('api/photo/') and new != old, (msg, new))
            code = 0
            if new.startswith('api/photo/'):
                with urllib.request.urlopen(B + new, timeout=10) as r_: r_.read(); code = r_.status
            check('12. az új kép a weboldalról betölthető', code == 200)

            print('17. Véletlen teljes visszaállítás a böngészőből → a szerver elutasítja')
            n0 = len(new and json.loads(await adm.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())"))['state']['products'])
            await adm.evaluate("async () => { const { store } = await import('./js/store.js'); window.__kgPut = []; const of = window.fetch; window.fetch = async (...a) => { window.__kgPut.push('start ' + String(a[0]) + ' ' + ((a[1] || {}).method || 'GET') + ' ' + (((a[1] || {}).body || '').length || 0)); const r = await of(...a); if (String(a[0]).includes('state') && a[1] && a[1].method === 'PUT') window.__kgPut.push(r.status); return r; }; const { api } = await import('./js/api.js'); window.__kgApi = api; store.reset(); }")
            await adm.wait_for_timeout(1500)
            sync = await wait_text(adm, 'body', ['NEM került mentésre', 'Mentve a szerverre'], t=30000)
            puts = await adm.evaluate('window.__kgPut')
            after = json.loads(await adm.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())"))['state']
            check('17. a szerver elutasította (422), a kezelőfelület kiírja: NEM került mentésre', 422 in puts and 'NEM került mentésre' in sync and ('korábbi árakat' in sync or 'gyűrűt törölne' in sync), (puts, sync[-300:]))
            check('17. a szerveren minden megmaradt (gyűrűk, fotó, előzmények)', len(after['products']) == n0 == 115 and after['products'][0].get('img') == new and len(after.get('history', [])) > 3)
            check('16. …és a fejlesztői nyilvántartás is megmaradt', 'FEJLESZTOI-TITOK-V59' in cli('lista').stdout)
            await adm.reload(); await adm.wait_for_timeout(1500)
            if await adm.locator('[data-login]').count():
                await adm.fill('[name="pw"]', PW); await adm.click('[data-login] button[type="submit"]'); await adm.wait_for_timeout(1500)

            print('18. Mentési hiba: leállt szerver')
            await adm.goto(B + '#/admin/arak'); await adm.wait_for_timeout(1200)
            if await adm.locator('[data-blocked]').count(): await adm.reload(); await adm.wait_for_timeout(1500)
            await adm.fill('[data-path="sellPerGram.au14"]', str(g0 + 500)); await adm.wait_for_timeout(400)
            srv.terminate(); srv.wait(5)
            await adm.click('[data-apply]')
            res = await wait_text(adm, 'body', ['sikeresen mentve', 'NEM lettek mentve', 'NEM került mentésre'], t=15000)
            check('18. leállt szervernél egyértelmű hiba („NEM … mentésre/mentve”), sikerüzenet nincs, a kezelőfelület zárol', ('NEM lettek mentve' in res or 'NEM került mentésre' in res) and 'sikeresen mentve' not in res, res[-500:])
            srv = start(env)
            st = json.loads(urllib.request.urlopen(B + 'api/state').read())['state']
            adm2 = json.loads(subprocess.run(['php', '-r', f'require "{ROOT}/src/App.php"; $a = new App(getenv("KG_DATA")); echo json_encode(["v" => 1]);'], env=env, capture_output=True, text=True).stdout or '{}')
            import sqlite3; c = sqlite3.connect(os.path.join(data, 'kg.sqlite')); body = json.loads(c.execute('SELECT body FROM state_version ORDER BY version DESC LIMIT 1').fetchone()[0]); c.close()
            check('18. a szerveren a régi grammár maradt (a sikertelen mentés nem íródott be)', body['materials']['sellPerGram']['au14'] == g0, body['materials']['sellPerGram']['au14'])
            check('nincs JavaScript-hiba', not [e for e in errs if 'Failed to fetch' not in e], errs[:3])
            await b.close()
    finally:
        srv.terminate()
    print(f'\n{ok} sikeres, {fail} hibás')
    sys.exit(1 if fail else 0)

asyncio.run(main())
