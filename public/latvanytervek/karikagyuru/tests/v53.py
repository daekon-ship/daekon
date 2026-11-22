#!/usr/bin/env python3
"""V5.3 – helyi mód, a kiinduló (nem jóváhagyott) adatokkal: nem jóváhagyott ár, jóváhagyás sorban,
jóváhagyott és nem jóváhagyott gyűrű viselkedése, sikertelen érdeklődés-rögzítés. Helyi szerver: 8765."""
import asyncio, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from kg_common import load_dataset, fill_required, approve_in_queue
from playwright.async_api import async_playwright
B = 'http://localhost:8765/latvanytervek/karikagyuru/'
PAIR = 'maz-81194-81195-w'
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)
num = lambda t: int(re.sub(r'\D', '', t) or 0)
APPROVE_PRICES = """async () => { const { store } = await import('./js/store.js'); const st = store.get(); const ok = 'jovahagyott';
  ['sellPerGram.au14', 'sellPerGram.au18', 'sellPerGram.pt', 'sellPerGram.pd'].forEach((k) => (st.materials.src[k] = ok));
  st.materials.diamonds.forEach((d) => { if (d.price) d.src = ok; });
  Object.keys(st.settings.src).forEach((k) => (st.settings.src[k] = ok)); store.persistNow(); }"""

async def run(b, w, h, mob):
    tag = f'{w}px'
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob); pg = await ctx.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(B + '#/'); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1000)

    # --- nem jóváhagyott: listaár vagy egyedi ajánlat, nincs konfigurátor ---
    await pg.goto(B + '#/kollekcio'); await pg.wait_for_timeout(1200)
    card = await pg.inner_text(f'.card[data-id="{PAIR}"]')
    check(f'{tag} katalógus: a nem jóváhagyott gyűrű látszik, „Egyedi árajánlat” – a régi listaár NEM', 'Egyedi árajánlat' in card and '259' not in card and ' Ft' not in card, card.replace('\n', ' | ')[:100])
    await pg.goto(B + f'#/gyuru/{PAIR}?k=x'); await pg.wait_for_timeout(1200)
    lab = await pg.inner_text('[data-plabel]'); pv = num(await pg.inner_text('[data-cprice]'))
    check(f'{tag} termékoldal: nincs ár (egyedi árajánlat), nincs „listaár”, nincs „becsült ár”', 'listaár' not in lab.lower() and 'Becsült' not in lab and pv == 0 and 'Egyedi' in await pg.inner_text('[data-cprice]'), f'{lab} {pv}')
    check(f'{tag} termékoldal: nincs beállítás, helyette „személyesen szabjuk rád”', await pg.locator('[data-steps]').count() == 0 and await pg.locator('[data-locked]').count() == 1)
    body = await pg.inner_text('.pdp__panel')
    check(f'{tag} termékoldal: nincs becsült tömeg és gyűrűnkénti árbontás nem jóváhagyott adatból', 'Becsült tömeg' not in body and 'kb.' not in body)
    check(f'{tag} termékoldal: a fő gomb ajánlatkérés', 'Ajánlatot kérek' in await pg.inner_text('.pdp__ctas'))
    # konfigurációs link sem nyit ki nem engedélyezett beállítást
    await pg.goto(B + f'#/gyuru/{PAIR}?k=Z2FyYmFnZQ'); await pg.wait_for_timeout(900)
    check(f'{tag} beállítás-link nem jóváhagyott gyűrűn: alapváltozat marad, ár nélkül', num(await pg.inner_text('[data-cprice]')) == 0 and await pg.locator('[data-steps]').count() == 0)

    # --- jóváhagyás sorban ---
    await pg.goto(B + '#/admin'); await pg.wait_for_timeout(800)
    tile = await pg.inner_text('.bigtiles')
    check(f'{tag} főmenü: „4. Gyűrűk jóváhagyása 0 / 115”', '4. Gyűrűk jóváhagyása' in tile and '0 / 115' in tile, tile.replace('\n', ' | ')[:200])
    await pg.goto(B + '#/admin/sorban'); await pg.wait_for_timeout(800)
    first = await pg.get_attribute('[data-qcard]', 'data-qcard')
    q = await pg.inner_text('[data-qcard]')
    check(f'{tag} sor: egy gyűrű, a jóváhagyandó adatokkal', all(x in q for x in ['Tömeg 54-es méretre', 'Szélesség', 'Méretek', 'Kő', 'Számolt ár']), q.replace('\n', ' | ')[:200])
    await pg.click('[data-skip]'); await pg.wait_for_timeout(400)
    check(f'{tag} sor: „Később” a következőre lép, nem hagy jóvá', await pg.get_attribute('[data-qcard]', 'data-qcard') != first and '0 / 115' in await pg.inner_text('.qbar__t'))
    await pg.goto(B + f'#/admin/sorban/{PAIR}'); await pg.wait_for_timeout(700)
    # V5.6: hiányos szakmai adattal (nincs vastagság) nem hagyható jóvá
    miss = await pg.inner_text('[data-qmissing]') if await pg.locator('[data-qmissing]').count() else ''
    check(f'{tag} hiányos adat (vastagság): a jóváhagyás gomb tiltva, a hiány megnevezve', 'vastagság' in miss and await pg.locator('[data-approve]').is_disabled(), miss)
    await pg.evaluate("document.querySelector('[data-approve]').disabled = false"); await pg.click('[data-approve]'); await pg.wait_for_timeout(400)
    check(f'{tag} hiányos adat: kikényszerített kattintásra sem lesz jóváhagyva', '0 / 115' in await pg.inner_text('.qbar__t'))
    await fill_required(pg, PAIR); await pg.reload(); await pg.wait_for_timeout(800)
    est = await pg.inner_text('[data-qestimated]') if await pg.locator('[data-qestimated]').count() else ''
    check(f'{tag} becsült adat (kőszabály a fotóról): megerősítés nélkül a gomb tiltva', 'becs' in est and await pg.locator('[data-approve]').is_disabled(), est[:120])
    await approve_in_queue(pg); await pg.wait_for_timeout(500)
    check(f'{tag} sor: jóváhagyás után 1 / 115, és a következő gyűrű jön', '1 / 115' in await pg.inner_text('.qbar__t') and await pg.get_attribute('[data-qcard]', 'data-qcard') != PAIR)
    # mellényomás: azonnali visszavonás, majd újra jóváhagyás
    check(f'{tag} sor: jóváhagyás után „Visszavonás” gomb a gyűrű kódjával', '81194' in await pg.inner_text('[data-qundo]'))
    await pg.click('[data-undo]'); await pg.wait_for_timeout(500)
    check(f'{tag} sor: visszavonás után 0 / 115, és ugyanaz a gyűrű látszik újra', '0 / 115' in await pg.inner_text('.qbar__t') and await pg.get_attribute('[data-qcard]', 'data-qcard') == PAIR and await pg.locator('[data-qundo]').count() == 0)
    await approve_in_queue(pg); await pg.wait_for_timeout(500)
    await pg.goto(B + '#/admin/elozmenyek'); await pg.wait_for_timeout(600)
    check(f'{tag} jóváhagyás bekerül az árnaplóba', 'Jóváhagyva: 81194' in await pg.inner_text('.adm__main'))

    # --- jóváhagyott gyűrű, de nem jóváhagyott árak: beállítható, de nincs számolt ár ---
    await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1100)
    check(f'{tag} jóváhagyott gyűrű: beállítható', await pg.locator('[data-steps] .cfg__step').count() >= 3 and await pg.locator('[data-locked]').count() == 0)
    await pg.click('[data-size="0|1"]'); await pg.wait_for_timeout(500)
    check(f'{tag} jóváhagyott gyűrű + nem jóváhagyott grammár: módosítva egyedi ajánlat', await pg.inner_text('[data-cprice]') in ('Egyedi árajánlat szükséges',) or num(await pg.inner_text('[data-cprice]')) == 0, await pg.inner_text('[data-cprice]'))
    # --- árak jóváhagyva → számolt ár ---
    await load_dataset(pg); await pg.evaluate(APPROVE_PRICES); await pg.reload(); await pg.wait_for_timeout(1100)
    await pg.click('[data-size="0|1"]'); await pg.wait_for_timeout(600)
    lab = await pg.inner_text('[data-plabel]'); v = num(await pg.inner_text('[data-cprice]'))
    check(f'{tag} minden jóváhagyva: „Becsült ár a választott beállítással”, valódi szám', 'Becsült ár' in lab and v > 200000, f'{lab} {v}')
    # visszavonás
    await pg.goto(B + f'#/admin/sorban/{PAIR}'); await pg.wait_for_timeout(700)
    await pg.click('[data-unapprove]'); await pg.wait_for_timeout(400)
    await pg.goto(B + f'#/gyuru/{PAIR}'); await pg.wait_for_timeout(1000)
    check(f'{tag} jóváhagyás visszavonása után újra nincs beállítás', await pg.locator('[data-locked]').count() == 1)

    # --- sikertelen rögzítés (betelt böngészőtárhely): nincs hamis siker ---
    await pg.evaluate("() => { Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); }; }")
    await pg.locator('.pdp__ctas [data-inquire="erdeklodes"]').click(); await pg.wait_for_timeout(500)
    await pg.fill('[name="nev"]', 'Tele Tárhely'); await pg.fill('[name="tel"]', '+36 30 555 6666')
    await pg.locator('.modal form button[type="submit"]').first.click(); await pg.wait_for_timeout(700)
    err = await pg.inner_text('.modal [data-err]') if await pg.locator('.modal [data-err]:visible').count() else ''
    check(f'{tag} sikertelen rögzítés: nincs „Megvan”, hiba + telefonszám', await pg.locator('.form--done').count() == 0 and 'nem sikerült' in err and 'Telefon' in err, err)
    check(f'{tag} nincs JavaScript-hiba', not errs, ' | '.join(errs)[:200])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, mob in [(1280, 860, False), (390, 844, True)]:
            print(f'{w}×{h}'); await run(b, w, h, mob)
        await b.close()
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)
asyncio.run(main())
