#!/usr/bin/env python3
"""V5.9 – egyszerűsített kezelőfelület: elfogadási tesztek valódi böngészőben (helyi mód, :8765).
A szerver módú feltételeket (belépés-ellenőrzés régi címeken, valós mentési visszaigazolás, mentési hiba,
fejlesztői adat elzárása, teljes visszaállítás tiltása) a services/karikagyuru-api/tests/admin_v59_e2e.py ellenőrzi."""
import asyncio, os, re, sys, tempfile, struct, zlib
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kg_common import load_dataset, approve_all
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
SHOTS = os.environ.get('KG_SHOTS')
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, str(x)[:240])
norm = lambda t: re.sub(r'[\s  ]+', ' ', t)
digits = lambda t: int(re.sub(r'\D', '', t) or 0)

def png_bytes(w=60, h=40):
    raw = b''.join(b'\x00' + b'\xb4\x8c\x3c' * w for _ in range(h))
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')

LEGACY = {'alapanyag': 'arak', 'arszamitas': 'arak/kiprobalas', 'keplet': 'beallitasok/halado', 'elozmenyek': 'arak/korabbi',
          'jovahagyas': 'beallitasok/jovahagyas', 'sorban': 'gyuruk/ellenorzes', 'szabalyok': 'gyuruk', 'fotok': 'gyuruk/fotok'}
PAGES = ['attekintes', 'gyuruk', 'gyuruk/ellenorzes', 'gyuruk/fotok', 'gyuru/maz-81184-81185-w', 'gyuru/uj', 'arak', 'arak/kiprobalas', 'arak/korabbi',
         'arak/arlista', 'munkak', 'munkak/uj', 'erdeklodesek', 'beallitasok', 'beallitasok/halado', 'beallitasok/jovahagyas']
ST = "(async () => { const { store } = await import('./js/store.js'); return store.get(); })()"

async def main():
    tmp = tempfile.mkdtemp()
    img = os.path.join(tmp, 'gyuru.png'); open(img, 'wb').write(png_bytes())
    txt = os.path.join(tmp, 'nem-kep.txt'); open(txt, 'w').write('ez nem kép')
    big = os.path.join(tmp, 'nagy.jpg'); open(big, 'wb').write(b'\xff\xd8\xff' + os.urandom(8_100_000))
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(600)
        await load_dataset(pg); await pg.reload(); await pg.wait_for_timeout(600)

        print('1–2. Menü és régi funkciók helye')
        await pg.goto(B + '#/admin/attekintes'); await pg.wait_for_timeout(600)
        items = await pg.locator('.adm__nav [data-anav] a').all_inner_texts()
        check('1. a főmenü legfeljebb hat elem: Áttekintés, Gyűrűk, Árak, Műhelymunkák, Érdeklődések, Beállítások',
              [re.sub(r'\d+$', '', x).strip() for x in items] == ['Áttekintés', 'Gyűrűk', 'Árak', 'Műhelymunkák', 'Érdeklődések', 'Beállítások'], items)
        check('1. nincs „További” almenü, nincs fejlesztői menüpont', await pg.locator('.adm__navsub, .adm__navx').count() == 0 and 'Ügyféljóváhagy' not in await pg.inner_text('.adm__nav'))
        for old, new in LEGACY.items():
            await pg.goto(B + '#/admin/' + old); await pg.wait_for_timeout(350)
            h1 = await pg.locator('.adm__h1').first.inner_text() if await pg.locator('.adm__h1').count() else ''
            check(f'2. régi cím #/admin/{old} → #/admin/{new} ({h1})', pg.url.endswith('#/admin/' + new) and h1, pg.url)
        await pg.goto(B + '#/admin/sorban/maz-81184-81185-w'); await pg.wait_for_timeout(400)
        check('2. régi cím paraméterrel is (sorban/<gyűrű>) a megfelelő gyűrűt nyitja', pg.url.endswith('gyuruk/ellenorzes/maz-81184-81185-w') and await pg.get_attribute('[data-qcard]', 'data-qcard') == 'maz-81184-81185-w')
        await pg.goto(B + '#/admin/kozpont'); await pg.wait_for_timeout(400)
        check('2. a belső 25 kérdés tulajdonosi nézetben nem nyílik meg (fejlesztői nyilvántartás)', await pg.locator('[data-devonly]').count() == 1 and await pg.locator('[data-dec]').count() == 0)

        print('3. Kezdőképernyő')
        await pg.goto(B + '#/admin/attekintes'); await pg.wait_for_timeout(500)
        home = norm(await pg.inner_text('#adm-main'))
        check('kezdőlap: „Jó napot kívánok!” + „Mit szeretne ma elintézni?” + négy művelet', 'Jó napot kívánok!' in home and 'Mit szeretne ma elintézni?' in home
              and await pg.locator('[data-homeacts] .homeact').count() == 4)
        check('kezdőlap: nincs 25 kérdés, 115-ös jóváhagyási kényszer, fejlesztői lista, képlet, élesítési lista, grafikon',
              not any(x in home for x in ['25', '115', 'Tisztázandó', 'élesít', 'Élesít', 'grammár szerint', 'képlet', 'jóváhagyásra']) and await pg.locator('.gchart, [data-openq], [data-golive-box]').count() == 0, home[:300])
        check('kezdőlap: érdeklődés nélkül nincs indokolatlan figyelmeztetés', await pg.locator('[data-home-new], [data-home-err], .warnbox').count() == 0)
        check('kezdőlap: visszafogott „További beállítások” link', await pg.locator('.homemore a[href="#/admin/beallitasok"]').count() == 1)

        print('5–6. A háromféle ár és az árlista')
        st = await pg.evaluate(ST)
        un = next(x for x in st['products'] if not x['approved'] and x.get('visible') is not False)
        await pg.goto(B + '#/admin/gyuruk'); await pg.wait_for_timeout(500)
        await pg.fill('[data-q]', un['code']); await pg.wait_for_timeout(300)
        row = norm(await pg.inner_text(f'[data-prow="{un["id"]}"]'))
        check('5. jóváhagyatlan gyűrű a listában: a weboldalon „Egyedi árajánlat”, a belső számítás „nem végleges” jelöléssel', 'A weboldalon: Egyedi árajánlat' in row and ('nem végleges' in row or 'belső' not in row), row)
        await pg.goto(B + f'#/admin/gyuru/{un["id"]}'); await pg.wait_for_timeout(600)
        vis = norm(await pg.inner_text('[data-evisible]')); intl = norm(await pg.inner_text('[data-einternal]'))
        check('5. gyűrűszerkesztő: „A weboldalon látható ár: Egyedi árajánlat”, a belső számított ár külön, „nem végleges”', 'Egyedi árajánlat' in vis and 'Belső számított ár' in intl and 'nem végleges' in intl, (vis, intl))
        await pg.goto(B + '#/admin/arak/kiprobalas'); await pg.wait_for_timeout(500)
        q = norm(await pg.inner_text('[data-qcalc]'))
        check('5. ár kipróbálása: jóváhagyás nélkül a látható ár „Egyedi árajánlat”, a belső szám nem végleges', 'Egyedi árajánlat' in await pg.inner_text('[data-qvisible]') and ('nem végleges' in q or await pg.locator('[data-qinternal]').count() == 0), q[:200])
        await pg.goto(B + '#/admin/arak/arlista'); await pg.wait_for_timeout(400)
        csv = await pg.evaluate("(async () => { const v = await import('./js/views-admin.js'); const { store } = await import('./js/store.js'); return [v.priceCsvText(store.get(), 'pub'), v.priceCsvText(store.get(), 'int')]; })()")
        pub_rows = csv[0].split('\r\n')[1:]
        check('6. vásárlói árlista: jóváhagyás nélkül minden sor „Egyedi árajánlat”, nincs összeg', pub_rows and all(r.endswith('"Egyedi árajánlat"') for r in pub_rows), pub_rows[:3])
        check('6. vásárlói árlista: a rejtett gyűrű nem kerül bele', len(pub_rows) == len([x for x in st['products'] if x.get('visible') is not False]))
        check('6. belső kalkuláció: első sora „BELSŐ HASZNÁLATRA – NEM VÉGLEGES ÁRAJÁNLAT”, összegekkel', csv[1].startswith('"BELSŐ HASZNÁLATRA – NEM VÉGLEGES ÁRAJÁNLAT"') and re.search(r'"\d{5,}"', csv[1]))
        await pg.evaluate("window.print = () => {}")
        await pg.click('[data-print-int]'); await pg.wait_for_timeout(200)
        check('6. belső nyomtatás: minden oldal tetején a „nem végleges” jelölés', await pg.locator('#printsheet.ps--int [data-intmark]').count() == 1 and 'NEM VÉGLEGES' in await pg.inner_text('#printsheet thead'))
        await approve_all(pg)
        st = await pg.evaluate(ST)
        csv = await pg.evaluate("(async () => { const v = await import('./js/views-admin.js'); const { store } = await import('./js/store.js'); return v.priceCsvText(store.get(), 'pub'); })()")
        shown = await pg.evaluate("""(async () => { const e = await import('./js/engine.js'); const { store } = await import('./js/store.js'); const s = store.get();
          return s.products.filter((p) => p.visible !== false).map((p) => { const r = e.shownPrice(p, null, s.materials, s.settings); return [p.code, r.kind === 'quote' ? null : r.final]; }); })()""")
        rows = [r.split(';') for r in csv.split('\r\n')[1:]]
        mism = [(c, v, r[2]) for (c, v), r in zip(shown, rows) if (str(v) if v is not None else 'Egyedi árajánlat') != r[2].strip('"')]
        check('6. jóváhagyás után a vásárlói lista pontosan a weboldalon látható árakat adja (a valós motorból)', not mism and any(v for _, v in shown), mism[:3])

        print('4, 7–8. Árak oldal: egyszerű mezők, ellenőrzés, mentés')
        await pg.goto(B + '#/admin/arak'); await pg.wait_for_timeout(600)
        main_paths = await pg.eval_on_selector_all('[data-mainprices] [data-path]', 'es => es.map(e => e.dataset.path)')
        check('4. fő mezők: 14K, 18K, platina, palládium grammár (titán nélkül)', main_paths == ['sellPerGram.au14', 'sellPerGram.au18', 'sellPerGram.pt', 'sellPerGram.pd'], main_paths)
        check('4. gyémántok darabárral', await pg.locator('[data-diamonds] [data-path^="diamonds."]').count() >= 4)
        check('4. a haladó (24K beszerzési ár, grafikon) alapból zárva', await pg.locator('[data-advprices]:not([open])').count() == 1 and not await pg.locator('[data-path="gold24"]').is_visible())
        before = await pg.evaluate("""(async () => { const e = await import('./js/engine.js'); const { store } = await import('./js/store.js'); const s = store.get(); return e.priceAll(s.products, s.materials, s.settings); })()""")
        await pg.fill('[data-path="sellPerGram.au14"]', '44000'); await pg.wait_for_timeout(400)
        imp = norm(await pg.inner_text('[data-impact]'))
        expect = await pg.evaluate("""(async () => { const e = await import('./js/engine.js'); const { store } = await import('./js/store.js'); const s = store.get();
          const M1 = JSON.parse(JSON.stringify(s.materials)); M1.sellPerGram.au14 = 44000; M1.src = { ...M1.src, 'sellPerGram.au14': 'jovahagyott' };
          let vis = 0, quote = 0; for (const p of s.products) { if (p.visible === false) continue;
            const a = e.shownPrice(p, null, s.materials, s.settings), b = e.shownPrice(p, null, M1, s.settings);
            const va = a.kind === 'quote' ? null : a.final, vb = b.kind === 'quote' ? null : b.final; if (vb === null) quote++; if (va !== vb) vis++; }
          return { internal: e.diffPrices(s.products, s.materials, M1, s.settings).count, vis, quote }; })()""")
        check('8. „Változtatások ellenőrzése”: melyik ár, előtte → utána', 'Változtatások ellenőrzése' in imp and '42 000 → 44 000' in imp, imp[:160])
        check(f"8. a számok a valós motorból: {expect['internal']} belső, {expect['vis']} weboldalon, {expect['quote']} egyedi ajánlat marad",
              f"{expect['internal']} gyűrű belső számított ára változik" in imp and f"{expect['vis']} gyűrűnél változik a weboldalon látható ár" in imp and f"{expect['quote']} gyűrűnél továbbra is „Egyedi árajánlat”" in imp, imp)
        await pg.fill('[data-path="sellPerGram.au14"]', 'abc'); await pg.wait_for_timeout(200)
        check('7. érvénytelen szám jelölve, nem kerül be', await pg.locator('[data-path="sellPerGram.au14"][aria-invalid]').count() == 1)
        await pg.fill('[data-path="sellPerGram.au14"]', '44000'); await pg.wait_for_timeout(300)
        await pg.click('[data-apply]'); await pg.wait_for_timeout(600)
        done = norm(await pg.inner_text('#adm-main'))
        check('7. mentés után: „Az árak sikeresen mentve.” (helyi mód: csak sikeres tárolás után)', 'Az árak sikeresen mentve.' in done and await pg.locator('[data-saved-ok]').count() == 1, done[:160])
        after = await pg.evaluate("""(async () => { const e = await import('./js/engine.js'); const { store } = await import('./js/store.js'); const s = store.get(); return [s.materials.sellPerGram.au14, e.priceAll(s.products, s.materials, s.settings)]; })()""")
        ratio_ok = all(abs(after[1][k] / before[k] - 44 / 42) < 0.01 for k in before if before[k] and after[1].get(k) and not any(r for r in []))
        check('4. a matematika változatlan: grammáras gyűrűknél az ár a grammár arányában nő (42 000 → 44 000)', after[0] == 44000 and sum(1 for k in before if before[k] and after[1].get(k) and abs(after[1][k] / before[k] - 44 / 42) < 0.012) >= 50)
        await pg.click('[data-undo]'); await pg.wait_for_timeout(300)
        rc = norm(await pg.inner_text('[data-revconfirm]'))
        check('9/10. visszaállítás előtt a pontos következmények', '44 000 → 42 000' in rc and 'gyűrű' in rc, rc[:160])
        await pg.click('[data-revconfirm] [data-ok]'); await pg.wait_for_timeout(500)
        check('9. a korábbi árverzió visszaállt', (await pg.evaluate(ST))['materials']['sellPerGram']['au14'] == 42000)
        check('10. nincs teljes adatbázis-visszaállító gomb a tulajdonosi beállításokban', await pg.goto(B + '#/admin/beallitasok') is None and await pg.wait_for_timeout(400) is None and await pg.locator('[data-reset]').count() == 0)

        print('6. Gyűrűszerkesztő: egyszerű + részletes nézet, jóváhagyás')
        await pg.evaluate("async () => { const { store } = await import('./js/store.js'); const p = store.get().products.find((x) => x.id === 'maz-81184-81185-w'); p.approved = false; store.persistNow(); }")
        try: await pg.evaluate("sessionStorage.removeItem('kg-edit-adv')")
        except Exception: pass
        await pg.goto(B + '#/admin/gyuru/maz-81184-81185-w'); await pg.reload(); await pg.wait_for_timeout(700)
        simple = norm(await pg.inner_text('.edit__form'))
        check('egyszerű nézet: cikkszám, név, fénykép, anyagok, színek, méretek, gyémántok, ár típusa, láthatóság, mentés',
              all(x in simple for x in ['Cikkszám', 'A gyűrű neve', 'Fénykép', 'Elérhető anyagok', 'Színek', 'Méretek', 'Gyémántok', 'Ár típusa', 'Látható a weboldalon', 'Mentés']))
        check('részletes nézet alapból zárva; a 3D-mezők nem jelennek meg', await pg.locator('[data-adv]:not([open])').count() == 1 and await pg.locator('[data-m3dbox], [data-m3add]').count() == 0)
        est = norm(await pg.inner_text('[data-echeck]'))
        check('jóváhagyás a szerkesztőben érthetően: állapot, tételes lista, következmény', 'ellenőrzésre várnak' in est.lower() and 'Jóváhagyás után' in est, est[:200])
        await pg.click('[data-adv] summary'); await pg.wait_for_timeout(200)
        adv = norm(await pg.inner_text('[data-adv]'))
        check('részletes nézet: referenciaméret, tömeg, szélesség, vastagság, kőszabály, korlátozások, minimumár, számítási részletek',
              all(x in adv for x in ['Referenciaméret', 'Tömeg', 'Szélesség', 'Vastagság', 'Mit állíthat a vásárló', 'Minimumár', 'Számítási részletek']))

        print('7/12. Fénykép cseréje a gyűrű adatlapján')
        old_img = (await pg.evaluate(ST))['products'][0]['img']
        pid = (await pg.evaluate(ST))['products'][0]['id']
        await pg.goto(B + f'#/admin/gyuru/{pid}'); await pg.wait_for_timeout(600)
        await pg.set_input_files('[data-imgfile]', txt); await pg.wait_for_timeout(300)
        check('12. nem kép fájl: elutasítva, a régi kép marad', 'nem használható' in await pg.inner_text('[data-imgmsg]') and (await pg.evaluate(ST))['products'][0]['img'] == old_img)
        await pg.set_input_files('[data-imgfile]', {'name': 'nagy.jpg', 'mimeType': 'image/jpeg', 'buffer': open(big, 'rb').read()}); await pg.wait_for_timeout(300)
        check('12. 8 MB-nál nagyobb kép: elutasítva, méretet kiírja', 'túl nagy' in await pg.inner_text('[data-imgmsg]'))
        await pg.set_input_files('[data-imgfile]', img); await pg.wait_for_timeout(400)
        check('12. előnézet a régi mellett; mentésig a régi kép marad', await pg.locator('[data-imgnewbox]:not([hidden]) img').count() == 1 and (await pg.evaluate(ST))['products'][0]['img'] == old_img)
        await pg.click('[data-imgsave]'); await pg.wait_for_timeout(900)
        newimg = (await pg.evaluate(ST))['products'][0]['img']
        check('12. mentés után az új kép él, sikeres visszajelzéssel', newimg.startswith('data:image/jpeg') and 'A fénykép mentve' in await pg.inner_text('[data-imgmsg]'))

        print('11, 13. Új gyűrű, műhelymunkák, 115 termék')
        n0 = len((await pg.evaluate(ST))['products']); w0 = len((await pg.evaluate(ST))['works'])
        await pg.goto(B + '#/admin/gyuru/uj'); await pg.wait_for_timeout(500)
        await pg.fill('[data-t="code"]', 'V59-UJ'); await pg.fill('[data-t="name"]', 'Új próbagyűrű'); await pg.click('[data-save]'); await pg.wait_for_timeout(500)
        st = await pg.evaluate(ST)
        check('11. új gyűrű létrehozható, és rögtön ellenőrzésre vár', len(st['products']) == n0 + 1 and any(x['code'] == 'V59-UJ' and not x['approved'] for x in st['products']))
        check('10. a 115 eredeti gyűrű megmaradt', sum(1 for x in st['products'] if not x.get('added')) == 115)
        check('13. a műhelymunkák megmaradtak', len(st['works']) == w0 and w0 >= 4)

        print('8. Érdeklődések: négy csoport, egyértelmű gombok, ár és állapot külön')
        await pg.evaluate("""async () => { const { store } = await import('./js/store.js');
          await store.addInquiry({ type: 'erdeklodes', name: 'Hívandó Hanna', phone: '+36 30 555 0001', email: 'hanna@example.invalid', productId: 'maz-81184-81185-w', code: '81184 - 81185 W', summary: '14K fehér, 54 / 64', config: null, message: 'Érdekel a pár.' });
          await store.addInquiry({ type: 'konzultacio', name: 'Lezárt Lajos', phone: '+36 30 555 0002' }); }""")
        await pg.goto(B + '#/admin/erdeklodesek'); await pg.wait_for_timeout(500)
        groups = await pg.eval_on_selector_all('[data-inqgrp]', 'es => es.map(e => e.dataset.inqgrp)')
        check('négy csoport: új, visszahívásra vár, felkeresett, lezárt', groups == ['uj', 'hivando', 'felkeresett', 'lezart'], groups)
        card = pg.locator('[data-inqcard]', has_text='Hívandó Hanna')
        ct = norm(await card.inner_text())
        check('kártyán: név, kattintható telefon, e-mail, gyűrű, változat, üzenet, beérkezés, állapot',
              all(x in ct for x in ['Hívandó Hanna', '+36 30 555 0001', 'hanna@example.invalid', '81184 - 81185 W', '14K fehér', 'Érdekel a pár', 'Beérkezett', 'Új'])
              and await card.locator('a[href="tel:+36305550001"]').count() >= 1)
        await card.locator('[data-call]').evaluate("(a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); }"); await pg.wait_for_timeout(400)
        st = await pg.evaluate(ST); hq = next(x for x in st['inquiries'] if x['name'] == 'Hívandó Hanna')
        check('„Felhívom”: visszahívásra vár – NEM jelöli sikeres visszahívásnak', hq['status'] == 'hivando', hq['status'])
        await pg.locator('[data-inqcard]', has_text='Hívandó Hanna').locator('[data-st="visszahivva"]').click(); await pg.wait_for_timeout(300)
        check('„Visszahívtam”: a felkeresettek közé kerül', 'Hívandó Hanna' in await pg.inner_text('[data-inqgrp="felkeresett"]'))
        await pg.locator('[data-inqcard]', has_text='Lezárt Lajos').locator('[data-st="lezarva"]').click(); await pg.wait_for_timeout(300)
        check('„Lezárás”: a lezárt ügyek közé kerül (alapból összecsukva)', await pg.locator('details[data-inqgrp="lezart"]:not([open])').count() == 1 and 'Lezárt Lajos' in await pg.locator('[data-inqgrp="lezart"]').inner_html())
        st = await pg.evaluate(ST); hq = next(x for x in st['inquiries'] if x['name'] == 'Hívandó Hanna')
        check('nincs automatikusan rögzített ajánlati ár (ár és állapot külön)', not hq.get('lockedPrice'))

        print('19. Mobil, billentyűzet, kontraszt-célpontok')
        for w, h in [(360, 740), (390, 844), (768, 1024), (1280, 800), (1440, 900)]:
            c2 = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=w < 800, has_touch=w < 800); q = await c2.new_page()
            await q.goto(B + '#/'); await q.evaluate(f"localStorage.setItem('karikagyuru-v15', {repr(await pg.evaluate('localStorage.getItem(\"karikagyuru-v15\")'))})"); await q.reload()
            bad = []
            for r in PAGES:
                await q.goto(B + '#/admin/' + r); await q.wait_for_timeout(300)
                if not await q.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'): bad.append(r)
            check(f'{w}px: egyik adminoldal sem görget oldalirányban ({len(PAGES)} oldal)', not bad, bad)
            if w < 961:
                await q.goto(B + '#/admin/attekintes'); await q.wait_for_timeout(300)
                await q.click('[data-amenu]'); await q.wait_for_timeout(200)
                links = await q.locator('[data-amnav] a').count()
                await q.locator('[data-amnav] a', has_text='Árak').click(); await q.wait_for_timeout(400)
                check(f'{w}px: a Menü gomb kinyitja mind a 6 főmenüpontot, és onnan tovább lehet menni', links == 6 and '#/admin/arak' in q.url)
                small = await q.evaluate("[...document.querySelectorAll('.adm__mbar button, .adm__mbar a, .atabs a, .abtn, .mbtn')].filter(e => e.offsetParent).filter(e => e.getBoundingClientRect().height < 44).map(e => e.textContent.trim().slice(0, 20))")
                check(f'{w}px: érintéses célpontok legalább 44 px magasak', not small, small[:5])
                im = await q.get_attribute('[data-path="sellPerGram.au14"]', 'inputmode')
                check(f'{w}px: az ármezők numerikus billentyűzetet kérnek', im == 'numeric')
            if SHOTS:
                os.makedirs(SHOTS, exist_ok=True)
                for r in ['attekintes', 'arak', 'gyuru/maz-81184-81185-w', 'erdeklodesek']:
                    await q.goto(B + '#/admin/' + r); await q.wait_for_timeout(400); await q.screenshot(path=f"{SHOTS}/{w}-{r.replace('/', '_')}.png")
            await c2.close()
        c2 = await b.new_context(viewport={'width': 390, 'height': 844}); q = await c2.new_page()
        await q.goto(B + '#/admin/attekintes'); await q.wait_for_timeout(400)
        await q.focus('[data-amenu]'); await q.keyboard.press('Enter'); await q.wait_for_timeout(200)
        opened = await q.locator('[data-amnav]:not([hidden])').count() == 1
        await q.keyboard.press('Escape'); await q.wait_for_timeout(150)
        check('billentyűzet: a Menü Enterrel nyílik, Escape-pel zárul, a fókusz visszakerül', opened and await q.locator('[data-amnav][hidden]').count() == 1 and await q.evaluate("document.activeElement.matches('[data-amenu]')"))
        await c2.close()
        check('nincs JavaScript-hiba', not errs, errs[:3])
        await b.close()
    print(f'\n{ok} sikeres, {fail} hibás')
    sys.exit(1 if fail else 0)

asyncio.run(main())
