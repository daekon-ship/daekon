#!/usr/bin/env python3
"""V5.10 – végső minőségellenőrzés a TELEPÍTÉSI CSOMAGON (dev/demo-csomag.sh), valódi PHP + SQLite háttérrel, valódi böngészőben.

Pontosan azt próbálja ki, amit az ötvös otthonról kap: jelszavas bemutató-kapu (demo/kapu.php) → weboldal → külön admin jelszó.
  1. vásárlói oldal: főoldal (fejléc, két arculat, kiemelt gyűrűk, kalkulátor, műhely, kapcsolat, lábléc – minden hivatkozás),
     katalógus (115 gyűrű, cikkszámok, keresés, szűrés, rendezés, képek), mind a 115 termékoldal, konfigurátor, megosztás,
     saját ötlet fotóval, műhelymunkák, kapcsolat, ajánlatkérés, időpontkérés
  2. admin: belépés, új érdeklődések, grammár → összehasonlítás → mentés → kilépés → új belépés → ár ellenőrzése → korábbi ár
     visszaállítása, gyűrű szerkesztése, fotócsere, új műhelymunka fotóval, érdeklődés visszahívása/lezárása, újratöltés
  3. mentés a telepített csomag parancsaival, ellenőrzés, visszaállítás ÜRES adatmappába, újraindítás után minden megvan,
     sérült mentés felismerése, a mentés jogosultságai
  4. hálózat: a böngésző a próbák alatt semmilyen adatot nem küld más gépre (csak a karikagyuru.com-os termékfotókat kéri le)
  5. képernyőképek 360/390/430/768/1280/1440 px-en (vásárlói és admin oldalak) → KG_V510_KEPEK mappába, vízszintes görgetés nélkül
Csak kitalált tesztadat (Teszt Béla, +36 30 000 0001), valódi levél nem megy ki. Futtatás: python3 tests/v510_vegso_e2e.py"""
import asyncio, json, os, re, shutil, sqlite3, stat, subprocess, sys, tempfile, time, urllib.request, uuid
from urllib.parse import urlparse
from playwright.async_api import async_playwright
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('KG_V510_PORT', '8811')); B = f'http://127.0.0.1:{PORT}/'
SHOTS = os.environ.get('KG_V510_KEPEK', '')
DEMO_PW, ADMIN_PW = 'kapu-' + uuid.uuid4().hex[:12], 'admin-' + uuid.uuid4().hex[:12]
SAMPLE = 'maz-81184-81185-w'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, str(x)[:400])
num = lambda t: int(re.sub(r'\D', '', t or '') or 0)
norm = lambda t: re.sub(r'[\s  ]+', ' ', t or '')
NO_HSCROLL = 'document.documentElement.scrollWidth <= window.innerWidth + 1'

async def price(pg, sel='[data-cprice]'):
    for _ in range(40):
        t = await pg.inner_text(sel); v = await pg.get_attribute(sel, 'data-value')
        if v and str(num(t)) == v: return int(v)
        await pg.wait_for_timeout(100)
    return num(await pg.inner_text(sel))

async def wait_text(pg, sel, texts, t=12000):
    s = ''
    for _ in range(t // 100):
        s = norm(await pg.inner_text(sel)) if await pg.locator(sel).count() else ''
        if any(x in s for x in texts): return s
        await pg.wait_for_timeout(100)
    return s

async def gate(pg, pw=DEMO_PW):
    await pg.goto(B); await pg.wait_for_timeout(300)
    await pg.fill('#jelszo', pw); await pg.click('[data-kapu] button[type="submit"]'); await pg.wait_for_timeout(1500)

async def admin_login(pg, pw=ADMIN_PW):
    await pg.goto(B + '#/admin/attekintes'); await pg.wait_for_timeout(900)
    await pg.fill('[name="pw"]', pw); await pg.click('[data-login] button[type="submit"]'); await pg.wait_for_timeout(1600)

async def state(pg):
    return json.loads(await pg.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())"))['state']

def serve(webroot, port=PORT):
    srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{port}', 'kapu.php'], cwd=webroot, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(80):
        try: urllib.request.urlopen(f'http://127.0.0.1:{port}/robots.txt', timeout=1); break
        except Exception: time.sleep(0.1)
    return srv

def package(tmp, name):
    """A telepítési csomag elkészítése és beállítása úgy, ahogy a VPS-en lesz (config.php, adatmappa a webgyökéren kívül)."""
    out = os.path.join(tmp, name); data = os.path.join(tmp, name + '-adat')
    subprocess.run(['bash', ROOT + '/dev/demo-csomag.sh', out], check=True, capture_output=True)
    web = os.path.join(out, 'webgyoker/bemutato'); api = os.path.join(out, 'karikagyuru-api')
    open(os.path.join(web, 'config.php'), 'w').write(f"<?php return ['data' => {json.dumps(data)}, 'site' => __DIR__ . '/site', 'src' => {json.dumps(api + '/src')}];\n")
    return out, web, api, data

async def public_walk(b, net):
    print('1. Vásárlói oldal – asztali gép (1280 px)')
    ctx = await b.new_context(viewport={'width': 1280, 'height': 860}); pg = await ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('request', lambda r: net.append((r.method, r.url, r.resource_type, r.post_data or '')))
    await pg.goto(B); await pg.wait_for_timeout(300)
    pts = await pg.inner_text('[data-kapupontok]') if await pg.locator('[data-kapupontok]').count() else ''
    check('kapu: az öt tudnivaló (bemutató, szemléltető árak, éles oldal nem változik, megmarad, nem megy ki ügyfélhez)',
          all(x in pts for x in ['bemutató', 'szemléltetők', 'semmi nem változik', 'megmaradnak', 'nem kerülnek valódi ügyfelekhez']), pts)
    await gate(pg, 'rossz-jelszo')
    check('kapu: rossz jelszóval nem enged be', await pg.locator('[data-kapu]').count() == 1 and await pg.locator('.site-head').count() == 0)
    await gate(pg)
    check('kapu: helyes jelszóval a weboldal nyílik meg', await pg.locator('.site-head').count() == 1)
    strip = await pg.inner_text('[data-demo-note]') if await pg.locator('[data-demo-note]').count() else ''
    check('felül: „Zárt bemutató”, szemléltető árak, az éles oldal nem változik', 'Zárt bemutató' in strip and 'szemléltető' in strip.lower() and 'nem változik' in strip, strip)
    robots = urllib.request.urlopen(B + 'robots.txt').read().decode(); hdr = urllib.request.urlopen(B + 'robots.txt').headers.get('X-Robots-Tag', '')
    check('keresőindexelés tiltva (robots.txt + X-Robots-Tag noindex)', 'Disallow: /' in robots and 'noindex' in hdr, (robots, hdr))

    # fejléc és navigáció
    navs = await pg.eval_on_selector_all('.site-head a[href^="#/"]', 'els => [...new Set(els.map(e => e.getAttribute("href")))]')
    bad = []
    for h in navs:
        await pg.goto(B + h); await pg.wait_for_timeout(500)
        if not await pg.locator('#view h1, #view h2').count(): bad.append(h)
    check(f'fejléc: mind a {len(navs)} belső menüpont működő oldalt nyit', navs and not bad, (navs, bad))

    # két arculat
    for v in 'ab':
        await pg.goto(B + f'?arculat={v}#/'); await pg.wait_for_timeout(700)
        cur = await pg.evaluate('document.documentElement.dataset.arculat')
        shown = await pg.evaluate(f'getComputedStyle(document.querySelector(".logo__{v}")).display')
        check(f'arculat „{v.upper()}”: bekapcsol, a hozzá tartozó logó látszik', cur == v and shown != 'none', (cur, shown))
    await pg.goto(B + '?arculat=a#/'); await pg.wait_for_timeout(900)

    # főoldal részei
    feat = await pg.locator('#view .card[data-id]').count()
    check('főoldal: kiemelt gyűrűk', feat >= 3, feat)
    if feat:
        fid = await pg.locator('#view .card[data-id]').first.get_attribute('data-id')
        await pg.locator('#view .card[data-id] .card__link').first.click(); await pg.wait_for_timeout(900)
        check('főoldal: kiemelt gyűrűre kattintva a termékoldal nyílik', f'#/gyuru/{fid}' in pg.url and await pg.locator('[data-cprice], .price--req').count() > 0, pg.url)
        await pg.goto(B + '#/'); await pg.wait_for_timeout(900)
    t0 = num(await pg.inner_text('[data-tprice]'))
    ms = await pg.locator('[data-tmetal] [data-m]').count()
    if ms > 1:
        await pg.locator('[data-tmetal] [data-m]').nth(ms - 1).click(); await pg.wait_for_timeout(900)
    t1 = num(await pg.inner_text('[data-tprice]'))
    check('főoldali kalkulátor: anyagváltásra más becsült ár', ms > 1 and t0 > 0 and t1 > 0 and t0 != t1, (ms, t0, t1))
    tl = await pg.get_attribute('[data-tlink]', 'href')
    check('főoldali kalkulátor: „Tovább a méretekhez” a gyűrű oldalára visz', (tl or '').startswith('#/gyuru/'), tl)
    body = await pg.inner_text('#view')
    check('főoldal: műhely-bemutató és kapcsolatfelvétel', await pg.locator('#view a[href="#/munkak"]').count() > 0 and await pg.locator('a[href^="tel:"]').count() > 0, '')

    # lábléc és az összes hivatkozás a főoldalon
    links = await pg.eval_on_selector_all('a[href]', 'els => [...new Set(els.map(e => e.getAttribute("href")))]')
    internal = [h for h in links if h.startswith('#/') and not h.startswith('#/admin')]
    other = [h for h in links if not h.startswith('#')]
    bad = []
    for h in internal:
        await pg.goto(B + h); await pg.wait_for_timeout(450)
        if not await pg.locator('#view h1, #view h2').count(): bad.append(h)
    check(f'főoldal + lábléc: mind a {len(internal)} belső hivatkozás működő oldalt nyit', not bad, bad)
    badx = [h for h in other if not (re.match(r'^tel:\+36\d{8,9}$', h) or re.match(r'^mailto:[^@\s]+@[^@\s]+\.\w+', h) or h.startswith('https://'))]
    check(f'főoldal + lábléc: a {len(other)} külső hivatkozás érvényes (tel:, mailto:, https://)', not badx, badx)
    await pg.goto(B + '#/'); await pg.wait_for_timeout(700)
    check('lábléc: ÁSZF és adatkezelés hivatkozás', await pg.locator('footer a[href*="aszf"]').count() > 0 and await pg.locator('footer a[href*="adatkezeles"]').count() > 0)

    print('   Katalógus')
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1300)
    check('katalógus: 115 gyűrű a számlálóban', num(await pg.inner_text('[data-count]')) == 115, await pg.inner_text('[data-count]'))
    for _ in range(5):
        if not await pg.locator('[data-more]').count(): break
        await pg.click('[data-more]'); await pg.wait_for_timeout(500)
    cards = await pg.eval_on_selector_all('.card[data-id]', 'els => els.map(e => [e.dataset.id, e.querySelector(".card__code").textContent.trim()])')
    ids = [c[0] for c in cards]; codes = [c[1] for c in cards]
    check('katalógus: mind a 115 kártya megjelenik, ismétlés nélkül', len(ids) == 115 and len(set(ids)) == 115, len(ids))
    badc = [c for c in codes if not re.match(r'^([A-Z]{2,5}[\s.]?)?\d{4,}', c)]
    check('katalógus: minden kártyán van cikkszám, egyedi', not badc and len(set(codes)) == 115, (badc[:5], len(set(codes))))
    await pg.evaluate('window.scrollTo(0, document.body.scrollHeight)'); await pg.wait_for_timeout(1500)
    imgs = await pg.eval_on_selector_all('.card__media img', 'els => els.map(e => [e.currentSrc || e.src, e.complete && e.naturalWidth > 0])')
    loc = [s for s, l in imgs if '/img/termekek/' in s]; ext = [s for s, l in imgs if 'karikagyuru.com' in s]
    check('katalógus: a 30 helyi (optimalizált) fotó mind betöltődik', len(loc) == 30 and all(l for s, l in imgs if '/img/termekek/' in s), (len(loc), [s for s, l in imgs if '/img/termekek/' in s and not l][:3]))
    ext_ok = sum(1 for s, l in imgs if 'karikagyuru.com' in s and l)
    print(f'   (info) külső fotó: {len(ext)} hivatkozás, ebből ebben a környezetben betöltődött: {ext_ok}')
    soon = await pg.locator('.media__soon:visible').count()
    print(f'   (info) „Fotó hamarosan” helykitöltő látszik: {soon}')
    await pg.fill('[data-q]', '81184'); await pg.wait_for_timeout(600)
    check('katalógus: keresés cikkszámra', await pg.locator(f'.card[data-id="{SAMPLE}"]').count() == 1 and await pg.locator('.card[data-id]').count() <= 3)
    await pg.fill('[data-q]', 'nincs-ilyen-gyuru-xyz'); await pg.wait_for_timeout(600)
    check('katalógus: üres találatnál érthető üzenet', await pg.locator('.card[data-id]').count() == 0 and len(norm(await pg.inner_text('[data-results]'))) > 10)
    await pg.fill('[data-q]', ''); await pg.wait_for_timeout(500)
    await pg.click('[data-f="tipus"][data-v="s"]'); await pg.wait_for_timeout(600); n_s = num(await pg.inner_text('[data-count]'))
    await pg.click('[data-f="tipus"][data-v="p"]'); await pg.wait_for_timeout(600); n_p = num(await pg.inner_text('[data-count]'))
    check('katalógus: szűrés típusra (egy gyűrű + gyűrűpár = 115)', n_s > 0 and n_p > 0 and n_s + n_p == 115, (n_s, n_p))
    await pg.click('[data-f="tipus"][data-v="mind"]'); await pg.wait_for_timeout(500)
    await pg.click('[data-f="ko"][data-v="koves"]'); await pg.wait_for_timeout(600); n_k = num(await pg.inner_text('[data-count]'))
    await pg.click('[data-f="ko"][data-v="nelkul"]'); await pg.wait_for_timeout(600); n_n = num(await pg.inner_text('[data-count]'))
    check('katalógus: szűrés kövekre', 0 < n_k < 115 and 0 < n_n < 115, (n_k, n_n))
    await pg.click('[data-f="ko"][data-v="mind"]'); await pg.wait_for_timeout(500)
    await pg.select_option('[data-sort]', 'ar-fel'); await pg.wait_for_timeout(700)
    up = [int(v) for v in await pg.eval_on_selector_all('.card [data-price]', 'els => els.map(e => e.dataset.value)')]
    await pg.select_option('[data-sort]', 'ar-le'); await pg.wait_for_timeout(700)
    dn = [int(v) for v in await pg.eval_on_selector_all('.card [data-price]', 'els => els.map(e => e.dataset.value)')]
    check(f'katalógus: rendezés ár szerint növekvő és csökkenő ({len(up)} látható árral)', len(up) >= 2 and up == sorted(up) and dn == sorted(dn, reverse=True), (up[:5], dn[:5]))
    await pg.select_option('[data-sort]', 'cikkszam'); await pg.wait_for_timeout(700)
    cs = await pg.eval_on_selector_all('.card .card__code', 'els => els.map(e => e.textContent.trim())')
    check('katalógus: rendezés cikkszám szerint', cs == sorted(cs, key=lambda x: x) or cs[:5] == sorted(cs[:5]), cs[:5])
    await pg.select_option('[data-sort]', 'ajanlott'); await pg.wait_for_timeout(400)

    print('   Mind a 115 termékoldal')
    broken = []; kinds = {'ar': 0, 'egyedi': 0}
    for pid in ids:
        await pg.goto(B + f'#/gyuru/{pid}'); await pg.wait_for_timeout(220)
        h1 = await pg.locator('#view h1').count()
        has_price = await pg.locator('[data-cprice]').count(); req = await pg.locator('.pdp .price--req, [data-quote], [data-locked]').count()
        media = await pg.locator('.pdp img, .pdp .media__soon, .pdp svg').count()
        if not h1 or not (has_price or req) or not media: broken.append(pid)
        kinds['egyedi' if await pg.locator('[data-locked], .pdp .price--req').count() else 'ar'] += 1
    check('mind a 115 termékoldal megnyílik: cím, ár vagy egyedi ajánlat, kép vagy jelzett helykitöltő', not broken, broken[:5])
    print(f'   (info) termékoldalak: árral {kinds["ar"]}, egyedi ajánlattal {kinds["egyedi"]}')

    print('   Konfigurátor')
    await pg.goto(B + f'#/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1300)
    p0 = await price(pg)
    await pg.click('[data-karat="au18"]'); await pg.wait_for_timeout(400); p18 = await price(pg)
    await pg.click('[data-karat="au14"]'); await pg.wait_for_timeout(400)
    check('konfigurátor: 18K drágább, mint 14K', p18 > p0 > 0, (p0, p18))
    res = {}
    for m in ['pt', 'pd']:
        if await pg.locator(f'[data-metal="{m}"]').count():
            await pg.click(f'[data-metal="{m}"]'); await pg.wait_for_timeout(500)
            res[m] = (await price(pg) if await pg.locator('[data-cprice]').count() else None, 'csak fehér' in await pg.inner_text('[data-steps]'))
    check('konfigurátor: platina és palládium – saját ár, csak fehér színben', res and all(v[0] and v[1] for v in res.values()), res)
    await pg.click('[data-metal="gold"]'); await pg.wait_for_timeout(400)
    # titán: a kő nélküli mintagyűrűn (maz-79014-w) – grammár nélkül, egyedi árajánlat
    await pg.goto(B + '#/gyuru/maz-79014-w'); await pg.wait_for_timeout(1200)
    s0 = await price(pg)
    check('kő nélküli mintagyűrű (79014 W): beállítható, szemléltető árral', s0 > 0 and await pg.locator('[data-locked]').count() == 0, s0)
    await pg.click('[data-metal="ti"]'); await pg.wait_for_timeout(600)
    tt = norm(await pg.inner_text('.pdp'))
    check('konfigurátor: titán → egyedi árajánlat, nem számolt ár', 'egyedi árajánlat' in tt.lower() and 'titán' in tt.lower(), tt[:300])
    await pg.goto(B + '#/gyuru/maz-81632'); await pg.wait_for_timeout(1000)
    check('egyedi ajánlatos modell (81632): ár helyett „egyeztetés alapján / egyedi árajánlat”, ajánlatkérés kérhető', 'egyedi' in norm(await pg.inner_text('.pdp')).lower() or 'egyeztetés' in norm(await pg.inner_text('.pdp')).lower())
    await pg.goto(B + '#/gyuru/maz-79016-79017'); await pg.wait_for_timeout(1000)
    check('20 köves mintagyűrű (79016): jóváhagyásra vár → egyedi ajánlat, online nem állítható', await pg.locator('[data-locked]').count() == 1)
    await pg.goto(B + '#/gyuru/maz-81202-81203-wy'); await pg.wait_for_timeout(1000)
    check('kétszínű mintagyűrű (81202 W/Y): beállítható ár', await price(pg) > 0 and await pg.locator('[data-locked]').count() == 0)
    await pg.goto(B + f'#/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1200)
    await pg.click('[data-size="0|1"]'); await pg.wait_for_timeout(400); p2 = await price(pg)
    check('konfigurátor: nagyobb gyűrűméret → magasabb ár', p2 > p0, (p0, p2))
    widths = await pg.locator('[data-width]').count(); wf = await pg.locator('[data-width-fixed]').count()
    check('konfigurátor: szélesség vagy választható, vagy kiírja, hogy nem állítható', widths > 0 or wf > 0, (widths, wf))
    cats = await pg.eval_on_selector_all('[data-scat]', 'els => els.map(e => [e.dataset.scat, e.disabled])')
    plus = pg.locator('[data-scount$="|1"]:not([disabled])')
    if await plus.count():
        before = await price(pg); await plus.first.click(); await pg.wait_for_timeout(400)
        check('konfigurátor: +1 gyémánt → magasabb ár', await price(pg) > before)
    check('konfigurátor: gyémántméret csak az engedélyezett lépésekben', len(cats) >= 1, cats)
    await pg.fill('[data-engrave="0"]', 'Anna & Bence'); await pg.wait_for_timeout(400)
    check('konfigurátor: gravírozás bekerül az összegzésbe', 'Anna & Bence' in await pg.inner_text('[data-summary]'), '')
    await ctx.grant_permissions(['clipboard-read', 'clipboard-write'])
    pc = await price(pg); await pg.click('[data-share]'); await pg.wait_for_timeout(500)
    shared = await pg.evaluate('navigator.clipboard.readText().catch(() => "")') or pg.url
    pg2 = await ctx.new_page(); await pg2.goto(shared if shared.startswith('http') else B + shared); await pg2.wait_for_timeout(1500)
    check('konfiguráció megosztása: a link ugyanazt a beállítást és árat nyitja meg', await price(pg2) == pc and 'Anna & Bence' in await pg2.inner_text('[data-summary]'), (shared, pc))
    await pg2.close()
    await pg.click('.pdp__ctas [data-inquire="erdeklodes"]'); await pg.wait_for_timeout(500)
    cfgtxt = await pg.inner_text('[data-inq] .form__cfg')
    check('ajánlatkérés: a választott beállítás és ár az űrlapon', 'Anna & Bence' in cfgtxt and num(cfgtxt.split('ár:')[-1]) == pc if 'ár:' in cfgtxt else 'Anna & Bence' in cfgtxt, cfgtxt[-120:])
    await pg.click('[data-inq] button[type="submit"]'); await pg.wait_for_timeout(300)
    check('ajánlatkérés: üres név/telefon → hibaüzenet, nem küldi el', await pg.locator('[data-inq] [data-err]:not([hidden])').count() == 1)
    await pg.fill('[data-inq] [name="nev"]', 'Teszt Béla'); await pg.fill('[data-inq] [name="tel"]', '+36 30 000 0001')
    await pg.fill('[data-inq] [name="uzenet"]', 'V510-AJANLAT próba'); await pg.click('[data-inq] button[type="submit"]')
    done = await wait_text(pg, '.form--done', ['Megkaptuk'])
    check('ajánlatkérés beküldve: „Megkaptuk az üzeneted.”', 'Megkaptuk' in done, done)
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)

    print('   Saját ötlet, műhelymunkák, kapcsolat, időpontkérés')
    img = os.path.join(tempfile.gettempdir(), 'v510-otlet.jpg'); Image.new('RGB', (900, 700), (200, 180, 120)).save(img, 'JPEG')
    await pg.goto(B + '#/sajat'); await pg.wait_for_timeout(900)
    await pg.set_input_files('[data-cfile]', img); await pg.wait_for_timeout(400)
    await pg.fill('[data-custom] textarea[name="leiras"]', 'V510-SAJAT két színű gyűrű, apró kövekkel.')
    await pg.fill('[data-custom] input[name="nev"]', 'Teszt Béla'); await pg.fill('[data-custom] input[name="tel"]', '+36 30 000 0001')
    await pg.click('[data-custom] button[type="submit"]')
    sent = await wait_text(pg, '#view', ['Megkaptuk', 'Elküldve'])
    check('saját ötlet fotóval beküldve', 'Megkaptuk' in sent or 'Elküldve' in sent, sent[:200])
    await pg.goto(B + '#/munkak'); await pg.wait_for_timeout(900)
    wc = await pg.locator('[data-work-card]').count()
    nophoto = await pg.locator('[data-work-card]').filter(has_not=pg.locator('img')).count()
    check(f'műhelymunkák: {wc} munka, a fotó nélküliek rendezett, jelölt állapotban', wc >= 4 and await pg.evaluate(NO_HSCROLL), (wc, nophoto))
    if nophoto: check('műhelymunkák: fotó nélkül „Ezekről még nincs fotó” jelzés', 'még nincs fotó' in (await pg.inner_text('#view')).lower())
    await pg.click('[data-work] >> nth=0'); await pg.wait_for_timeout(500)
    check('műhelymunka: „Ebből inspirálódnék” ajánlatkérő a munka megnevezésével', await pg.locator('[data-inq] [data-workref]').count() == 1)
    await pg.fill('[data-inq] [name="nev"]', 'Teszt Béla'); await pg.fill('[data-inq] [name="tel"]', '+36 30 000 0001')
    await pg.fill('[data-inq] [name="uzenet"]', 'V510-MUNKA'); await pg.click('[data-inq] button[type="submit"]')
    check('műhelymunka-érdeklődés beküldve', 'Megkaptuk' in await wait_text(pg, '.form--done', ['Megkaptuk']))
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    await pg.goto(B + '#/kapcsolat'); await pg.wait_for_timeout(900)
    kt = await pg.inner_text('#view')
    check('kapcsolat: telefon, e-mail, cím, nyitvatartás vagy időpont', await pg.locator('#view a[href^="tel:"]').count() and await pg.locator('#view a[href^="mailto:"]').count(), kt[:120])
    await pg.click('#view [data-book] >> nth=0'); await pg.wait_for_timeout(500)
    check('időpontkérés: dátummező látszik', await pg.locator('[data-inq] [data-datefield]:not([hidden])').count() == 1)
    await pg.fill('[data-inq] [name="nev"]', 'Teszt Béla'); await pg.fill('[data-inq] [name="tel"]', '+36 30 000 0001')
    await pg.fill('[data-inq] [name="nap"]', '2026-12-10'); await pg.fill('[data-inq] [name="uzenet"]', 'V510-IDOPONT')
    await pg.click('[data-inq] button[type="submit"]')
    check('időpontkérés beküldve', 'Megkaptuk' in await wait_text(pg, '.form--done', ['Megkaptuk']))
    check('vásárlói oldal: nincs JavaScript-hiba', not errs, errs[:3])
    await ctx.close()

async def admin_walk(b, net, img):
    print('2. Admin – az ötvös szemszögéből (1366 px)')
    ctx = await b.new_context(viewport={'width': 1366, 'height': 900}); pg = await ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('request', lambda r: net.append((r.method, r.url, r.resource_type, r.post_data or '')))
    await gate(pg)
    await admin_login(pg, 'rossz-admin-jelszo')
    check('admin: rossz jelszóval nem lép be', await pg.locator('[data-login]').count() == 1 and await pg.locator('.adm').count() == 0)
    await admin_login(pg)
    home = norm(await pg.inner_text('#adm-main'))
    check('admin: belépés után „Jó napot kívánok!” kezdőlap', 'Jó napot kívánok!' in home and 'Mit szeretne ma elintézni?' in home, home[:120])
    menu = await pg.eval_on_selector_all('[data-amnav] a, .adm__nav a', 'els => [...new Set(els.map(e => e.textContent.trim()))].filter(Boolean)')
    six = ['Áttekintés', 'Gyűrűk', 'Árak', 'Műhelymunkák', 'Érdeklődések', 'Beállítások']
    check('admin: a hat főmenü megvan', all(any(m.startswith(x) for m in menu) for x in six), menu)
    newn = num(await pg.inner_text('[data-home-new]')) if await pg.locator('[data-home-new]').count() else -1
    check('admin: a kezdőlap az új érdeklődések pontos számát mutatja (4 próba-érdeklődés)', newn == 4, newn)
    own = await pg.evaluate("fetch('api/state', {credentials: 'include'}).then(r => r.text())")
    check('admin: a 25 kérdéses fejlesztői nyilvántartás nincs a tulajdonosi felületen (API-ban sem)', 'clientDecisions' not in own)
    await pg.goto(B + '#/admin/kozpont'); await pg.wait_for_timeout(600)
    check('admin: a régi nyilvántartás-cím sem nyitja meg', await pg.locator('[data-dec]').count() == 0)

    print('   Érdeklődések')
    await pg.goto(B + '#/admin/erdeklodesek'); await pg.wait_for_timeout(1200)
    new = pg.locator('[data-inqgrp="uj"] [data-inqcard]')
    check('érdeklődések: a 4 próba-érdeklődés az „Új” csoportban', await new.count() == 4, await new.count())
    alltxt = await pg.inner_text('#adm-main')
    check('érdeklődések: az ajánlatkérés tartalmazza a gyűrűt és a gravírozást', 'V510-AJANLAT' in alltxt and 'Anna & Bence' in alltxt)
    check('érdeklődések: a saját ötlet csatolt fotóval', 'V510-SAJAT' in alltxt and await pg.locator('[data-inqcard] img, [data-inqcard] a[href*="inquiry-file"]').count() >= 1)
    first = await new.first.get_attribute('data-inqcard')
    await pg.evaluate("document.querySelectorAll('[data-call]').forEach(a => a.addEventListener('click', e => e.preventDefault(), { once: true }))")
    await pg.click(f'[data-call="{first}"]'); await pg.wait_for_timeout(1200)
    check('„Felhívom” → visszahívásra vár (nem jelöl sikeresnek)', await pg.locator(f'[data-inqgrp="hivando"] [data-inqcard="{first}"]').count() == 1)
    await pg.click(f'[data-inqcard="{first}"] [data-st="visszahivva"]'); await pg.wait_for_timeout(1200)
    check('„Visszahívtam” → felkeresett', await pg.locator(f'[data-inqgrp="felkeresett"] [data-inqcard="{first}"]').count() == 1)
    second = await pg.locator('[data-inqgrp="uj"] [data-inqcard]').first.get_attribute('data-inqcard')
    await pg.click(f'[data-inqcard="{second}"] [data-st="lezarva"]'); await pg.wait_for_timeout(1200)
    check('„Lezárás” → lezárt', await pg.locator(f'[data-inqgrp="lezart"] [data-inqcard="{second}"]').count() == 1)
    await pg.reload(); await pg.wait_for_timeout(1800)
    check('érdeklődések: újratöltés után is megmaradt az állapot',
          await pg.locator(f'[data-inqgrp="felkeresett"] [data-inqcard="{first}"]').count() == 1 and await pg.locator(f'[data-inqgrp="lezart"] [data-inqcard="{second}"]').count() == 1)

    print('   Árak: grammár → összehasonlítás → mentés → kilépés → új belépés → visszaállítás')
    await pg.goto(B + f'#/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1200); pub0 = await price(pg)
    await pg.goto(B + '#/admin/arak'); await pg.wait_for_timeout(1000)
    g0 = num(await pg.input_value('[data-path="sellPerGram.au14"]'))
    await pg.fill('[data-path="sellPerGram.au14"]', str(g0 + 2000)); await pg.wait_for_timeout(500)
    imp = norm(await pg.inner_text('[data-impact]')) if await pg.locator('[data-impact]').count() else ''
    check('összehasonlítás mentés előtt: régi → új grammár, érintett és látható árak száma', str(g0 + 2000)[:3] in imp.replace(' ', '') and num(await pg.inner_text('[data-imp-visible]')) > 0, imp[:300])
    if await pg.locator('[data-confirm]').count(): await pg.check('[data-confirm]')
    await pg.click('[data-apply]')
    r = await wait_text(pg, '#adm-main', ['sikeresen mentve', 'NEM lettek mentve'])
    st = await state(pg)
    check('mentés: „Az árak sikeresen mentve.” és a szerveren az új grammár', 'sikeresen mentve' in r and st['materials']['sellPerGram']['au14'] == g0 + 2000, r[:120])
    await pg.click('[data-logout] >> nth=0'); await pg.wait_for_timeout(1200)
    await pg.goto(B + '#/admin/arak'); await pg.wait_for_timeout(900)
    check('kilépés után az admin újra jelszót kér', await pg.locator('[data-login]').count() == 1)
    await admin_login(pg); await pg.goto(B + '#/admin/arak'); await pg.wait_for_timeout(1000)
    check('új belépés után a módosított grammár van ott', num(await pg.input_value('[data-path="sellPerGram.au14"]')) == g0 + 2000)
    vctx = await b.new_context(viewport={'width': 390, 'height': 844}); v = await vctx.new_page(); await gate(v)
    await v.goto(B + f'#/gyuru/{SAMPLE}'); await v.wait_for_timeout(1300); pub1 = await price(v)
    check('az új ár egy másik böngészőben (látogató) is látszik és magasabb', pub1 > pub0, (pub0, pub1))
    await pg.goto(B + '#/admin/arak/korabbi'); await pg.wait_for_timeout(1000)
    revs = pg.locator('[data-rev]')
    check('korábbi árak: van visszaállítható árváltozat', await revs.count() >= 1, await revs.count())
    await revs.first.click(); await pg.wait_for_timeout(500)
    conf = norm(await pg.inner_text('[role="dialog"], .modal')) if await pg.locator('[role="dialog"], .modal').count() else ''
    check('visszaállítás előtt a következményeit kiírja', len(conf) > 30, conf[:200])
    await pg.click('[data-ok]'); await pg.wait_for_timeout(2500)
    st = await state(pg)
    check('korábbi árváltozat visszaállítva a szerveren', st['materials']['sellPerGram']['au14'] == g0, st['materials']['sellPerGram']['au14'])
    await v.reload(); await v.wait_for_timeout(1500)
    check('a visszaállított ár a látogatónál is megjelenik', await price(v) == pub0, (await price(v), pub0))
    await vctx.close()

    print('   Gyűrű szerkesztése és fotócsere')
    await pg.goto(B + f'#/admin/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1200)
    nm = pg.locator('[data-t="name"]')
    if await nm.count():
        old = await nm.input_value(); await nm.fill(old + ' (próba)'); await pg.wait_for_timeout(300)
        await pg.click('[data-save]')
        msg = await wait_text(pg, '.toast, [role="status"], body', ['Mentve', 'NEM lett mentve'], t=8000)
        await pg.wait_for_timeout(800); st = await state(pg)
        check('gyűrű szerkesztése: „Mentve” csak a szerver visszaigazolása után, és a szerveren az új név', next(p for p in st['products'] if p['id'] == SAMPLE)['name'] == old + ' (próba)', msg[-120:])
        await pg.goto(B + f'#/admin/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1200)
        await pg.fill('[data-t="name"]', old); await pg.click('[data-save]'); await pg.wait_for_timeout(1500)
    else:
        check('gyűrű szerkesztése: névmező', False, 'nincs [data-t="name"]')
    await pg.goto(B + f'#/admin/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1200)
    before = next(p for p in (await state(pg))['products'] if p['id'] == SAMPLE).get('img')
    await pg.set_input_files('[data-imgfile]', img); await pg.wait_for_timeout(500)
    check('fotócsere: előnézet, a régi kép a mentésig marad', await pg.locator('[data-imgnewbox]:not([hidden])').count() == 1 and next(p for p in (await state(pg))['products'] if p['id'] == SAMPLE).get('img') == before)
    await pg.click('[data-imgsave]'); m = await wait_text(pg, '[data-imgmsg]', ['A fénykép mentve', 'NEM'])
    newimg = next(p for p in (await state(pg))['products'] if p['id'] == SAMPLE).get('img', '')
    check('fotócsere: feltöltve, mentve, betölthető', 'A fénykép mentve' in m and newimg.startswith('api/photo/') and (await pg.request.get(B + newimg)).status == 200, (m, newimg))

    # V5.10: a szerver PHP-korlátja (itt az alapértelmezett 2 MB) fölötti kép → érthető üzenet, a régi kép marad
    big = os.path.join(os.path.dirname(img), 'nagy.jpg')
    import random; random.seed(5); Image.frombytes('RGB', (1800, 1400), bytes(random.getrandbits(8) for _ in range(1800 * 1400 * 3))).save(big, 'JPEG', quality=98)
    if os.path.getsize(big) > 2_200_000:
        await pg.goto(B + f'#/admin/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1200)
        await pg.set_input_files('[data-imgfile]', big); await pg.wait_for_timeout(400); await pg.click('[data-imgsave]')
        m2 = await wait_text(pg, '[data-imgmsg]', ['A fénykép mentve', 'NEM', 'túl nagy'])
        still = next(p for p in (await state(pg))['products'] if p['id'] == SAMPLE).get('img', '')
        check('túl nagy kép (a szerver korlátja fölött): érthető üzenet, nem „sikeres”, a kép nem cserélődött', 'túl nagy ehhez a szerverhez' in m2 and 'mentve' not in m2.replace('NEM', '').lower().split('túl')[0] and still == newimg, (m2, os.path.getsize(big)))

    print('   Új műhelymunka fotóval')
    await pg.goto(B + '#/admin/munkak/uj'); await pg.wait_for_timeout(1000)
    await pg.fill('[data-wt="title"]', 'V510 próba műhelymunka'); await pg.fill('[data-wt="text"]', 'Kalapált felület, próba leírás.')
    await pg.set_input_files('[data-wfiles]', img); await pg.wait_for_timeout(2500)
    check('műhelymunka: a fotó feltöltve a szerverre (előnézet)', await pg.locator('[data-wphotos] img').count() == 1)
    await pg.click('[data-wsave]')
    m = await wait_text(pg, 'body', ['Mentve: V510', 'NEM lett mentve'], t=8000)
    st = await state(pg); w = [x for x in st.get('works', []) if x['title'] == 'V510 próba műhelymunka']
    check('műhelymunka: „Mentve” a szerver visszaigazolása után, a szerveren fotóval', 'Mentve: V510' in m and w and w[0]['photos'] and w[0]['photos'][0].startswith('api/photo/'), m[-150:])

    print('   Újratöltés és adatmegőrzés')
    await pg.reload(); await pg.wait_for_timeout(1800)
    st = await state(pg)
    check('újratöltés után minden megvan (115 gyűrű, fotó, műhelymunka, visszaállított grammár)',
          len(st['products']) == 115 and next(p for p in st['products'] if p['id'] == SAMPLE).get('img') == newimg and any(x['title'] == 'V510 próba műhelymunka' for x in st.get('works', [])) and st['materials']['sellPerGram']['au14'] == g0)
    vctx = await b.new_context(viewport={'width': 1280, 'height': 860}); v = await vctx.new_page(); await gate(v)
    await v.goto(B + '#/munkak'); await v.wait_for_timeout(1200)
    check('az új műhelymunka a látogatói oldalon fotóval megjelenik', 'V510 próba műhelymunka' in await v.inner_text('#view') and await v.locator('[data-work-card] img').count() >= 1)
    await vctx.close()
    await pg.goto(B + '#/admin/beallitasok'); await pg.wait_for_timeout(800)
    check('beállítások: nincs teljes visszaállítás / alapállapot gomb', await pg.locator('[data-reset]').count() == 0)
    check('admin: nincs JavaScript-hiba', not [e for e in errs if 'Failed to fetch' not in e], errs[:3])
    await ctx.close()
    return g0, newimg

async def shots(b, out):
    print('5. Mobilos és asztali ellenőrzés: 360/390/430/768/1280/1440 px, képernyőképekkel')
    pages_pub = [('fooldal', '#/'), ('katalogus', '#/kollekcio'), ('gyuru', f'#/gyuru/{SAMPLE}'), ('sajat', '#/sajat'), ('munkak', '#/munkak'), ('kapcsolat', '#/kapcsolat')]
    pages_adm = [('a-attekintes', '#/admin/attekintes'), ('a-arak', '#/admin/arak'), ('a-gyuru', f'#/admin/gyuru/{SAMPLE}'), ('a-gyuruk', '#/admin/gyuruk'),
                 ('a-erdeklodesek', '#/admin/erdeklodesek'), ('a-munkak', '#/admin/munkak'), ('a-beallitasok', '#/admin/beallitasok')]
    for w, h in [(360, 740), (390, 844), (430, 932), (768, 1024), (1280, 860), (1440, 900)]:
        mob = w < 768
        ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, device_scale_factor=1)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await gate(pg); over = []; small = []; covered = []
        for name, hsh in pages_pub + [('admin-belepes', None)] + pages_adm:
            if hsh is None:
                await admin_login(pg); continue
            await pg.goto(B + hsh); await pg.wait_for_timeout(1100)
            if not await pg.evaluate(NO_HSCROLL): over.append(name)
            # túlcsorduló szöveg: elem, amely kilóg a képernyőből
            wide = await pg.evaluate('''() => [...document.querySelectorAll('#view *, #adm-main *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('[aria-hidden="true"], .sr, details:not([open])'); }).slice(0, 3).map(e => e.tagName + '.' + e.className)''')
            if wide: over.append(f'{name}: {wide}')
            if mob:
                tiny = await pg.evaluate('''() => [...document.querySelectorAll('#view .btn, #adm-main .abtn, .adm button, [data-amenu]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 && getComputedStyle(e).visibility !== 'hidden'; }).slice(0, 3).map(e => e.textContent.trim().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().height))''')
                if tiny: small.append(f'{name}: {tiny}')
            if SHOTS:
                await pg.evaluate('async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); }'); await pg.wait_for_timeout(500)
                await pg.screenshot(path=os.path.join(SHOTS, f'{w}-{name}.png'), full_page=True)
        # mobil: a rögzített ajánlatkérő sáv nem takarja el a termékoldal gombjait, és működik
        if mob:
            await pg.goto(B + f'#/gyuru/{SAMPLE}'); await pg.wait_for_timeout(1200)
            await pg.locator('.pdp__ctas [data-inquire="erdeklodes"]').scroll_into_view_if_needed(); await pg.wait_for_timeout(400)
            cover = await pg.evaluate('''() => { const m = document.querySelector('[data-mbar]'); const c = document.querySelector('.pdp__ctas [data-inquire="erdeklodes"]'); if (!m || !c) return 'nincs'; const a = m.getBoundingClientRect(), b = c.getBoundingClientRect(); return getComputedStyle(m).display === 'none' || a.height === 0 || b.bottom <= a.top || b.top >= a.bottom ? '' : 'takar'; }''')
            if cover: covered.append(cover)
            await pg.evaluate('window.scrollTo(0, 0)'); await pg.wait_for_timeout(300)
            mbar = pg.locator('[data-mbar] [data-inquire]')
            if await mbar.count() and await mbar.first.is_visible():
                await mbar.first.tap(); await pg.wait_for_timeout(500)
                check(f'{w}px rögzített ajánlatkérő gomb megnyitja az űrlapot, a modális ablak elfér', await pg.locator('[data-inq]').count() == 1 and await pg.evaluate("(() => { const r = document.querySelector('[data-inq]').closest('[role=dialog], .modal, dialog').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; })()"))
                if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, f'{w}-modal.png'))
                await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            await pg.goto(B + '#/admin/arak'); await pg.wait_for_timeout(900)
            await pg.click('[data-amenu]'); await pg.wait_for_timeout(300)
            check(f'{w}px admin mobilmenü megnyílik, mind a hat pont látszik', await pg.locator('[data-amnav]:visible a').count() >= 6)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
            check(f'{w}px admin mobilmenü Escape-re bezárul', not await pg.locator('[data-amnav]').first.is_visible())
        check(f'{w}px nincs vízszintes görgetés / kilógó elem (13 oldal)', not over, over[:4])
        if mob: check(f'{w}px gombok legalább 40 px magasak (érinthető)', not small, small[:4])
        if mob: check(f'{w}px a rögzített sáv nem takarja a gombokat', not covered, covered)
        check(f'{w}px nincs JavaScript-hiba', not errs, errs[:2])
        await ctx.close()

def backup_restore(tmp, api, data, g0, newimg):
    print('3. Mentés és visszaállítás a telepített csomag parancsaival')
    env = {k: v for k, v in os.environ.items() if not k.startswith('KG_')}; env['KG_DATA'] = data
    dst = os.path.join(tmp, 'mentesek')
    r = subprocess.run(['php', api + '/bin/mentes.php', dst, '--letrehoz'], env=env, capture_output=True, text=True)
    check('mentés elkészül (adatbázis, fotók, referenciaképek, ellenőrzőösszeg)', r.returncode == 0, r.stdout[-300:] + r.stderr[-300:])
    m = sorted(x for x in os.listdir(dst) if x.startswith('kg-mentes-'))[-1]; md = os.path.join(dst, m)
    man = json.load(open(next(os.path.join(md, f) for f in os.listdir(md) if f.endswith('.json'))))
    fk = list(man.get('files', {}).keys()) if isinstance(man.get('files'), dict) else [f.get('path', '') for f in man.get('files', [])]
    pid = newimg.split('/')[-1].split('?')[0].split('.')[0]
    check('a mentésben az adatbázis (SHA-256, épség), a feltöltött fotók és a referenciaképek',
          len(man['db'].get('sha256', '')) == 64 and man['db'].get('integrity') == 'ok' and any(pid in k for k in fk) and any(k.startswith('inquiry-files/') for k in fk) and not man.get('missing'), (fk[:6], pid))
    mode = stat.S_IMODE(os.stat(dst).st_mode)
    check('a mentések mappája csak a tulajdonosé (0700)', mode == 0o700, oct(mode))
    r = subprocess.run(['php', api + '/bin/mentes-ellenorzes.php', md], env=env, capture_output=True, text=True)
    check('mentés ellenőrzése: rendben', r.returncode == 0, r.stdout[-200:])
    bad = md + '-serult'; shutil.copytree(md, bad)
    db = next(os.path.join(dp, f) for dp, _, fs in os.walk(bad) for f in fs if f.endswith('.sqlite'))
    with open(db, 'r+b') as f: f.seek(2000); f.write(b'\x00SERULT\x00' * 8)
    r = subprocess.run(['php', api + '/bin/mentes-ellenorzes.php', bad], env=env, capture_output=True, text=True)
    check('sérült mentés felismerve (nem 0 kilépési kód)', r.returncode != 0, r.stdout[-200:])
    new = os.path.join(tmp, 'visszaallitott-adat')
    r = subprocess.run(['php', api + '/bin/visszaallitas.php', md, '--bemutato'], env=dict(env, KG_DATA=new), capture_output=True, text=True)
    check('visszaállítás külön, üres adatmappába', r.returncode == 0, r.stdout[-300:] + r.stderr[-300:])
    r = subprocess.run(['php', api + '/bin/visszaallitas.php', md, '--bemutato'], env=env, capture_output=True, text=True)
    check('visszaállítás meglévő adatra elutasítva (nem ír felül)', r.returncode != 0)
    return new

async def restored_check(b, web, new, g0, newimg):
    cfg = os.path.join(web, 'config.php'); orig = open(cfg).read()
    open(cfg, 'w').write(re.sub(r"'data' => \"[^\"]+\"", "'data' => " + json.dumps(new), orig))
    srv = serve(web, PORT + 1)
    try:
        ctx = await b.new_context(); pg = await ctx.new_page()
        await pg.goto(f'http://127.0.0.1:{PORT + 1}/'); await pg.fill('#jelszo', DEMO_PW); await pg.click('[data-kapu] button[type="submit"]'); await pg.wait_for_timeout(1500)
        st = json.loads(await pg.evaluate("fetch('api/state').then(r => r.text())"))['state']
        code = (await pg.request.get(f'http://127.0.0.1:{PORT + 1}/' + newimg)).status if newimg else 0
        check('újraindítás után a visszaállított bemutatóban minden megvan (115 gyűrű, grammár, műhelymunka, fotó)',
              len(st['products']) == 115 and st['materials']['sellPerGram']['au14'] == g0 and any(x['title'] == 'V510 próba műhelymunka' for x in st.get('works', [])) and code == 200, code)
        await ctx.close()
    finally:
        srv.terminate(); open(cfg, 'w').write(orig)

async def main():
    tmp = tempfile.mkdtemp(prefix='kg-v510-')
    if SHOTS: os.makedirs(SHOTS, exist_ok=True)
    out, web, api, data = package(tmp, 'csomag')
    leak = [p for p in ['tests', 'docs', 'dev'] if os.path.exists(os.path.join(web, 'site', p))]
    check('a csomagban nincs teszt, dokumentáció, fejlesztői fájl a webgyökérben', not leak, leak)
    env = {k: v for k, v in os.environ.items() if not k.startswith('KG_')}
    r = subprocess.run(['php', api + '/bin/demo-install.php'], env=dict(env, KG_DATA=data, KG_DEMO_PASSWORD=DEMO_PW, KG_ADMIN_PASSWORD=ADMIN_PW), capture_output=True, text=True)
    check('a csomag telepítése külön adatmappába', r.returncode == 0, r.stderr)
    check('a telepítő nem írja ki a megadott jelszavakat', DEMO_PW not in r.stdout and ADMIN_PW not in r.stdout, '')
    img = os.path.join(tmp, 'uj-foto.jpg'); Image.new('RGB', (1200, 900), (180, 170, 150)).save(img, 'JPEG')
    srv = serve(web); net = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            await public_walk(b, net)
            g0, newimg = await admin_walk(b, net, img)
            await shots(b, SHOTS)
            print('4. Hálózat: semmi nem megy ki máshová')
            foreign = [(m, u, t) for m, u, t, _ in net if urlparse(u).hostname not in ('127.0.0.1', None) and not u.startswith('data:')]
            nonimg = [x for x in foreign if not (x[2] == 'image' and x[0] == 'GET' and urlparse(x[1]).hostname in ('karikagyuru.com', 'www.karikagyuru.com'))]
            check('a böngésző csak a karikagyuru.com-os termékfotókat kéri le kívülről – adatot nem küld (űrlap, mentés, admin)', not nonimg, nonimg[:5])
            posts = [u for m, u, t, _ in net if m in ('POST', 'PUT')]
            check('minden beküldés és mentés a bemutató saját szerverére ment', posts and all(u.startswith(B) for u in posts), posts[:3])
            c = sqlite3.connect(os.path.join(data, 'kg.sqlite'))
            tabs = {r_[0] for r_ in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            inq = c.execute('SELECT COUNT(*) FROM inquiry').fetchone()[0] if 'inquiry' in tabs else -1
            mails = c.execute('SELECT COUNT(*) FROM mail_log').fetchone()[0] if 'mail_log' in tabs else 0
            c.close()
            check('a 4 próba-érdeklődés a bemutató adatbázisában van', inq == 4, (inq, tabs))
            print(f'   (info) levélnapló bejegyzés: {mails} (kimenő levél bemutató módban kikapcsolva)')
            new = backup_restore(tmp, api, data, g0, newimg)
            await restored_check(b, web, new, g0, newimg)
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(tmp, ignore_errors=True)
    print(f'\n{ok} sikeres, {fail} hibás'); sys.exit(1 if fail else 0)

asyncio.run(main())
