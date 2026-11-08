# Limit Pizza látványterv — végponttól végpontig tesztek (Playwright, Chromium).
# Futtatás: a public/latvanytervek mappából `python3 -m http.server 8765`, majd: python3 e2e.py [kepek_mappa]
import json, sys, re
from playwright.sync_api import sync_playwright
B = 'http://localhost:8765/limit-pizza/'
SHOTS = sys.argv[1] if len(sys.argv) > 1 else None
R = {}; ERR = []
SPY = """(() => { window.__osc = 0; const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const o = C.prototype.createOscillator; C.prototype.createOscillator = function () { window.__osc++; return o.apply(this, arguments); }; })();"""
def ok(name, cond, info=''):
    R[name] = ('OK' if cond else 'HIBA') + (' — ' + str(info) if info else '')
def watch(pg, tag):
    pg.on('pageerror', lambda e: ERR.append(tag + ' pageerror: ' + str(e)))
    pg.on('console', lambda m: ERR.append(tag + ' console: ' + m.text) if m.type == 'error' else None)
def shot(pg, n):
    if SHOTS: pg.screenshot(path=f'{SHOTS}/{n}.png')
def open_cart(pg, w):
    pg.click('.cartbtn' if w >= 1000 else '.mbar [data-open-cart]'); pg.wait_for_timeout(450)
def close_dlg(pg, sel):
    pg.click(sel + ' [data-close]'); pg.wait_for_timeout(400)
def build_t1(pg):
    pg.click('.pi[data-id="magyaros"] .pi__btn'); pg.wait_for_timeout(450)
    pg.click('#cfg label.opt--rm:has(input[value="lilahagyma"])')
    pg.click('#cfg label.opt:has(input[name="plusz"][value="gomba"])')
    pg.click('#cfg label.opt:has(input[name="extra"][value="bacon"])')
    pg.fill('#cfg-note', 'jól átsütve')
    pg.click('#cfg [data-q="1"]'); pg.wait_for_timeout(150)
    return pg.text_content('#cfg [data-sum]')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
    for w, h in ((1440, 900), (390, 844)):
        tag = str(w)
        ctx = b.new_context(viewport={'width': w, 'height': h}, timezone_id='Europe/Budapest')
        ctx.add_init_script(SPY)
        adm = ctx.new_page(); watch(adm, tag + '/admin')
        adm.goto(B + 'admin.html', wait_until='networkidle'); adm.wait_for_timeout(500)
        adm.click('[data-reset]'); adm.wait_for_timeout(300)
        site = ctx.new_page(); watch(site, tag + '/site')
        REQ = []
        ctx.on('request', lambda r: REQ.append((r.method, r.url)))
        site.goto(B, wait_until='networkidle'); site.wait_for_timeout(700)
        site.evaluate("localStorage.removeItem('limitpizza-demo-kosar-v1')"); site.reload(wait_until='networkidle'); site.wait_for_timeout(500)

        # T1
        s1 = build_t1(site); shot(site, f'{tag}-t1-cfg')
        ok(f'{tag} T1 Magyaros 2 db módosításokkal = 9100 Ft', s1.replace('\xa0', ' ') == '9100 Ft', s1)
        site.click('#cfg [data-cfg-add]'); site.wait_for_timeout(600)
        # T2
        site.evaluate("document.querySelector('#uditok').scrollIntoView()")
        site.click('[data-add-drink="coca-cola-175"]'); site.wait_for_timeout(200)
        open_cart(site, w)
        site.select_option('[data-town]', 'Sajtoskál'); site.wait_for_timeout(250)
        t2 = site.text_content('[data-total]').replace('\xa0', ' ')
        rows = site.text_content('.cart__sum .rows').replace('\xa0', ' ')
        ok(f'{tag} T2 + 1,75 l Cola, Sajtoskál = 10 900 Ft (szállítás külön)', t2 == '10 900 Ft' and '700 Ft' in rows and '10 200 Ft' in rows, t2)
        shot(site, f'{tag}-t2-cart')
        # T6 — várható idő
        adm.bring_to_front(); adm.click('[data-tab="beall"]'); adm.wait_for_timeout(200)
        adm.click('[data-eta-id="60-90"]'); adm.wait_for_timeout(400)
        e1 = site.text_content('.eta-row')
        adm.fill('[data-eta-min]', '25'); adm.fill('[data-eta-max]', '40'); adm.click('[data-eta-own] button'); adm.wait_for_timeout(400)
        e2 = site.evaluate("document.querySelector('[data-eta]').textContent")
        adm.fill('[data-eta-min]', '50'); adm.fill('[data-eta-max]', '20'); adm.click('[data-eta-own] button'); adm.wait_for_timeout(200)
        bad = adm.is_visible('[data-eta-err]'); e3 = site.evaluate("document.querySelector('[data-eta]').textContent")
        ok(f'{tag} T6 várható idő megjelenik a vevői oldalon (+hibás érték elutasítva)', '60–90 perc' in e1 and '25–40 perc' in e2 and 'becsült' in e2 and bad and '25–40' in e3, f'{e1.strip()} | {e2.strip()}')
        # T5 — szüneteltetés
        adm.click('[data-accepting]'); adm.wait_for_timeout(400)
        pause_bar = site.is_visible('[data-pause-bar]'); dis = site.is_disabled('[data-checkout]'); kept = site.evaluate("document.querySelectorAll('.ci').length")
        site.reload(wait_until='networkidle'); site.wait_for_timeout(400); open_cart(site, w)
        dis2 = site.is_disabled('[data-checkout]'); kept2 = site.evaluate("document.querySelectorAll('.ci').length")
        adm.click('[data-accepting]'); adm.wait_for_timeout(400)
        en = not site.is_disabled('[data-checkout]')
        ok(f'{tag} T5 szünetnél nem véglegesíthető, a kosár megmarad, visszakapcsolva újra mehet', pause_bar and dis and dis2 and kept == 2 and kept2 == 2 and en, f'bar={pause_bar} tiltva={dis}/{dis2} tételek={kept}/{kept2} újra={en}')
        # szünet a checkout lépésben is (versenyhelyzet): adatok lépés → szünet → leadás tiltva
        site.click('[data-checkout]'); site.wait_for_timeout(300)
        adm.click('[data-accepting]'); adm.wait_for_timeout(400)
        dis3 = site.is_disabled('[data-send]'); adm.click('[data-accepting]'); adm.wait_for_timeout(400)
        ok(f'{tag} T5b szünet az adatok lépés közben is tilt', dis3)
        shot(site, f'{tag}-t5-checkout')
        # T12 gyors dupla kattintás a leadásra → egy rendelés
        before = adm.evaluate("LimitDemo.getOrders().length")
        site.dblclick('[data-send]'); site.wait_for_timeout(600)
        after = adm.evaluate("LimitDemo.getOrders().length")
        ok(f'{tag} T12a dupla kattintás → egyetlen rendelés', after == before + 1, f'{before}→{after}')
        done_txt = site.text_content('.done')
        cust_order = site.evaluate("(()=>{const l=LimitDemo.getOrders();return l[l.length-1]})()")
        ok(f'{tag} T12b nincs „Elküldve/Sikeres” állítás, bemutató jelzés van', 'Valódi rendelés nem történt' in done_txt and 'Elküldve' not in site.text_content('#cart') and 'Sikeres' not in done_txt)
        shot(site, f'{tag}-done')
        # T7 riasztás
        adm.bring_to_front(); adm.click('[data-tab="rend"]'); adm.click('[data-sound]'); adm.wait_for_timeout(300)
        a1 = adm.evaluate('window.__limitAlarm()'); o1 = adm.evaluate('window.__osc'); adm.wait_for_timeout(5600); o2 = adm.evaluate('window.__osc')
        shot(adm, f'{tag}-admin-alarm')
        new_no = adm.evaluate("Math.max(...LimitDemo.getOrders().map(o=>o.no))")
        adm.click(f'[data-accept="{new_no}"]'); adm.wait_for_timeout(250); shot(adm, f'{tag}-admin-accept')
        adm.click('#acc-dlg label.pc:has(input[value="30"])'); adm.click('[data-acc-ok]'); adm.wait_for_timeout(400)
        a2 = adm.evaluate('window.__limitAlarm()'); o3 = adm.evaluate('window.__osc'); adm.wait_for_timeout(3000); o4 = adm.evaluate('window.__osc')
        live = site.text_content('[data-live]')
        ok(f'{tag} T7 új rendelés → ismétlődő riasztás → elfogadás → riasztás leáll', a1['active'] and o2 - o1 >= 6 and not a2['active'] and o4 == o3 and 'elfogadta' in live and '30 perc' in live, f'hangok {o1}→{o2}, elfogadás után {o3}→{o4}; vevő: {live.strip()[:70]}')
        # T8 újabb rendelés → új riasztás
        site.bring_to_front(); site.click('[data-new]'); site.wait_for_timeout(500)
        site.click('.pi[data-id="vega"] .pi__btn'); site.wait_for_timeout(350); site.click('#cfg [data-cfg-add]'); site.wait_for_timeout(500)
        open_cart(site, w); site.click('[data-checkout]'); site.wait_for_timeout(250); site.click('[data-send]'); site.wait_for_timeout(500)
        a3 = adm.evaluate('window.__limitAlarm()'); o5 = adm.evaluate('window.__osc'); adm.wait_for_timeout(3000); o6 = adm.evaluate('window.__osc')
        ok(f'{tag} T8 újabb rendelés új riasztást indít', a3['active'] and o6 > o5, f'{o5}→{o6}')
        close_dlg(site, '#cart')
        # második egyszerre: szimulált → kettő külön látszik
        adm.bring_to_front(); adm.click('[data-simulate]'); adm.wait_for_timeout(400)
        nnew = adm.evaluate("document.querySelectorAll('[data-new-list] .oc').length")
        ok(f'{tag} T8b több új rendelés külön-külön látható', nnew == 2 and adm.evaluate('window.__limitAlarm().count') == 2, nnew)
        # T9 elutasítás csak megerősítéssel
        rn = adm.evaluate("LimitDemo.getOrders().filter(o=>o.status==='uj').map(o=>o.no)[0]")
        adm.click(f'[data-reject="{rn}"]'); adm.wait_for_timeout(250)
        st1 = adm.evaluate(f"LimitDemo.getOrders().find(o=>o.no==={rn}).status")
        adm.click('#rej-dlg [data-sheet-cancel]'); adm.wait_for_timeout(200)
        adm.click(f'[data-reject="{rn}"]'); adm.keyboard.press('Escape'); adm.wait_for_timeout(200)
        st2 = adm.evaluate(f"LimitDemo.getOrders().find(o=>o.no==={rn}).status")
        adm.click(f'[data-reject="{rn}"]'); adm.wait_for_timeout(200); shot(adm, f'{tag}-admin-reject')
        adm.click('#rej-dlg label.pc:has(input[value="Túl sok rendelés"])'); adm.click('[data-rej-ok]'); adm.wait_for_timeout(400)
        st3 = adm.evaluate(f"LimitDemo.getOrders().find(o=>o.no==={rn}).status")
        ok(f'{tag} T9 elutasítás nem történhet véletlenül', st1 == 'uj' and st2 == 'uj' and st3 == 'elutasitva', f'{st1},{st2},{st3}')
        # maradék új rendelés elfogadása → riasztás leáll
        for n in adm.evaluate("LimitDemo.getOrders().filter(o=>o.status==='uj').map(o=>o.no)"):
            adm.click(f'[data-accept="{n}"]'); adm.wait_for_timeout(200); adm.click('[data-acc-ok]'); adm.wait_for_timeout(300)
        ok(f'{tag} T7b minden új rendelés kezelve → nincs riasztás', not adm.evaluate('window.__limitAlarm().active'))
        # T10 rendelés részletei (digitális konyhai nézet) — pontos módosítások, egyezés a vevői adatokkal
        t1no = adm.evaluate("LimitDemo.getOrders().find(o=>o.lines.some(l=>l.name==='Magyaros' && l.qty===2) && !o.sample).no")
        if w < 1000: adm.click('[data-col="keszul"]'); adm.wait_for_timeout(200)
        adm.click(f'#r{t1no} [data-det-no]'); adm.wait_for_timeout(350)
        det = adm.text_content('#det-dlg').replace('\xa0', ' ')
        shot(adm, f'{tag}-admin-details')
        need = ['#' + str(t1no), 'Érkezett', 'NÉLKÜLE', 'lilahagyma', '+ Plusz', 'gomba', '+ Extra', 'bacon', 'jól átsütve', 'Sajtoskál', 'Minta Vendég', '+36 30 000 0000', 'Kiszállítási díj', '700 Ft', 'Bankkártya a futárnál', '10 900 Ft', 'Készül', 'Várható indulás', '30 perc', 'Figyelem — NÉLKÜLE kérés']
        miss = [n for n in need if n not in det]
        ok(f'{tag} T10 rendelés részletei: minden módosítás, adat és állapot látszik', not miss, 'hiányzik: ' + ', '.join(miss) if miss else 'minden elem megvan')
        cust = cust_order
        adm_o = adm.evaluate(f"LimitDemo.getOrders().find(o=>o.no==={t1no})")
        same = cust and cust['total'] == adm_o['total'] == 10900 and cust['lines'] == adm_o['lines'] and cust['customer']['town'] == adm_o['customer']['town']
        ok(f'{tag} T13 vevői és admin rendelésadat megegyezik', same, f"vevő {cust and cust['total']} / admin {adm_o['total']}")
        adm.click('#det-dlg [data-det-close]'); adm.wait_for_timeout(200)
        # minden rendelés részletei megnyithatók (minden oszlopban)
        nos = adm.evaluate("LimitDemo.getOrders().filter(o=>o.status!=='elutasitva').map(o=>[o.no,o.status])")
        opened = 0
        for no, st in nos:
            if w < 1000 and st != 'uj': adm.click(f'[data-col="{st}"]'); adm.wait_for_timeout(120)
            adm.click(f'#r{no} [data-det-no]'); adm.wait_for_timeout(150)
            if adm.evaluate("document.querySelector('#det-dlg').open") and ('#' + str(no)) in adm.text_content('#det-t'): opened += 1
            adm.keyboard.press('Escape'); adm.wait_for_timeout(120)
        ok(f'{tag} T14 a részletek minden rendelésnél megnyithatók', opened == len(nos), f'{opened}/{len(nos)}')
        # állapotváltás a részletekből
        adm.click(f'#r{t1no} [data-det-no]') if w >= 1000 else (adm.click('[data-col="keszul"]'), adm.click(f'#r{t1no} [data-det-no]'))
        adm.wait_for_timeout(200); adm.click('#det-dlg [data-next]'); adm.wait_for_timeout(300)
        ok(f'{tag} T15 állapotváltás a részletek ablakból (Készül → Úton)', adm.evaluate(f"LimitDemo.getOrders().find(o=>o.no==={t1no}).status") == 'uton' and not adm.evaluate("document.querySelector('#det-dlg').open"))
        # nincs nyomtatási kezelőelem
        btxt = adm.evaluate("[...document.querySelectorAll('button,a')].map(b=>b.textContent.trim().toLowerCase())")
        ok(f'{tag} T16 nincs „Blokk” vagy „Nyomtatás” gomb', not any(('blokk' in t or 'nyomtat' in t) for t in btxt))
        # T3 elfogyott pizza
        adm.click('[data-tab="beall"]'); adm.wait_for_timeout(200)
        adm.click('label.sw:has(input[data-out-p="gombas"])'); adm.click('label.sw:has(input[data-out-p="magyaros"])'); adm.wait_for_timeout(400)
        site.bring_to_front(); site.wait_for_timeout(200)
        g_dis = site.is_disabled('.pi[data-id="gombas"] .pi__btn')
        site.evaluate("document.querySelector('.plate--main .plate__btn').click()"); site.wait_for_timeout(300)
        hero_open = site.evaluate("document.querySelector('#cfg').open")
        ok(f'{tag} T3 elfogyott pizza nem rendelhető (lista és hero)', g_dis and not hero_open)
        # T3b kosárban lévő, időközben elfogyott tétel
        site.click('.pi[data-id="songoku"] .pi__btn'); site.wait_for_timeout(300); site.click('#cfg [data-cfg-add]'); site.wait_for_timeout(500)
        adm.click('label.sw:has(input[data-out-p="songoku"])'); adm.wait_for_timeout(400)
        open_cart(site, w); prob = site.is_visible('.ci.is-prob'); dis4 = site.is_disabled('[data-checkout]')
        shot(site, f'{tag}-t3-cart-soldout')
        site.click('.ci.is-prob [data-del]'); site.wait_for_timeout(500)
        ok(f'{tag} T3b kosárban elfogyott tétel jelölve, tiltja a továbblépést; törlés után folytatható', prob and dis4 and site.evaluate("document.querySelectorAll('.ci').length") == 0)
        close_dlg(site, '#cart')
        # T4 elfogyott feltét
        adm.click('label.sw:has(input[data-out-t="gomba"])'); adm.click('label.sw:has(input[data-out-t="bacon"])'); adm.wait_for_timeout(400)
        site.click('.pi[data-id="vega"] .pi__btn'); site.wait_for_timeout(400)
        gdis = site.is_disabled('#cfg input[name="plusz"][value="gomba"]'); bdis = site.is_disabled('#cfg input[name="extra"][value="bacon"]')
        site.click('#cfg label.opt:has(input[name="plusz"][value="gomba"])', force=True); site.wait_for_timeout(150)
        gchk = site.is_checked('#cfg input[name="plusz"][value="gomba"]')
        # nyitott konfigurátor közben tiltott feltét: kipipálva → automatikusan kiveszi
        site.click('#cfg label.opt:has(input[name="plusz"][value="kukorica"])')
        adm.click('label.sw:has(input[data-out-t="kukorica"])'); adm.wait_for_timeout(500)
        kchk = site.is_checked('#cfg input[name="plusz"][value="kukorica"]'); kdis = site.is_disabled('#cfg input[name="plusz"][value="kukorica"]')
        shot(site, f'{tag}-t4-cfg-soldout')
        ok(f'{tag} T4 elfogyott feltét nem adható hozzá (nyitott ablakban is frissül)', gdis and bdis and not gchk and not kchk and kdis)
        close_dlg(site, '#cfg')
        # T12 újratöltés: tiltás megmarad
        site.reload(wait_until='networkidle'); site.wait_for_timeout(400)
        ok(f'{tag} T12c tiltás újratöltés után is megmarad', site.is_disabled('.pi[data-id="gombas"] .pi__btn'))
        # T12 üres kosár
        open_cart(site, w); empty = site.is_visible('.cart__empty'); close_dlg(site, '#cart')
        ok(f'{tag} T12d üres kosár állapot', empty)
        # T12 dupla kattintás a kosárba gombra → 1 tétel
        site.click('.pi[data-id="margherita"] .pi__btn'); site.wait_for_timeout(400); site.dblclick('#cfg [data-cfg-add]'); site.wait_for_timeout(700)
        q = site.evaluate("JSON.parse(localStorage.getItem('limitpizza-demo-kosar-v1')).items.reduce((a,b)=>a+b.qty,0)")
        ok(f'{tag} T12e dupla kattintás a Kosárba gombon → 1 db', q == 1, q)
        # T11 mobil: menü
        if w < 1000:
            site.evaluate('scrollTo(0,0)'); site.click('[data-burger]'); site.wait_for_timeout(400)
            mo = site.is_visible('#mnav'); site.click('#mnav a[href="#konyha"]'); site.wait_for_timeout(900)
            ok(f'{tag} T11 mobilmenü nyit, zár, navigál', mo and not site.is_visible('#mnav') and site.evaluate('scrollY') > 1000)
        # módosítás a kosárból
        open_cart(site, w); site.click('.ci [data-edit]'); site.wait_for_timeout(700)
        ed = site.evaluate("document.querySelector('#cfg').open") and site.evaluate("document.querySelector('#cfg-name').textContent") == 'MARGHERITA'
        ok(f'{tag} kosártétel módosítása visszanyitja a konfigurátort', ed)
        site.click('#cfg [data-cfg-add]'); site.wait_for_timeout(600)
        ext = [u for m, u in REQ if not u.startswith('http://localhost:8765/') or m != 'GET']
        ok(f'{tag} T17 nem megy ki kérés (nincs POST, nincs külső hívás) — valódi rendelés/adat nem távozik', not ext, ext[:3])
        R[f'{tag} konzolhibák'] = 'OK' if not [e for e in ERR if e.startswith(tag)] else 'HIBA — ' + ' | '.join([e for e in ERR if e.startswith(tag)][:5])
        ctx.close()

    # T12 sérült adatok
    ctx = b.new_context(viewport={'width': 390, 'height': 844}); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(B, wait_until='domcontentloaded')
    pg.evaluate("""localStorage.setItem('limitpizza-demo-kosar-v1','{"items":[{"type":"pizza","id":"nincs-ilyen","qty":3},{"type":"pizza","id":"vega","qty":"x"},{"type":"drink","id":"fanta-05","qty":2},null],"town":"Budapest"}');
      localStorage.setItem('limitpizza-demo-beallitasok-v1','{nem json');
      localStorage.setItem('limitpizza-demo-rendelesek-v1','[{"no":"a"},{"no":5}]');""")
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(500)
    items = pg.evaluate("JSON.parse(localStorage.getItem('limitpizza-demo-kosar-v1')||'{}')")
    pg.click('.mbar [data-open-cart]'); pg.wait_for_timeout(400); n = pg.evaluate("document.querySelectorAll('.ci').length")
    a = ctx.new_page(); a.on('pageerror', lambda e: errs.append('admin ' + str(e))); a.goto(B + 'admin.html', wait_until='networkidle'); a.wait_for_timeout(400)
    ok('T12f sérült/hibás tárolt adatok → nincs összeomlás, csak az érvényes tétel marad', not errs and n == 1, f'tételek a kosárban: {n}, hibák: {errs[:2]}')
    ctx.close()
    # T18 törött hivatkozások (helyi fájlok) + forráskód: nincs window.print
    import urllib.request, re as _re
    bad = []
    for page in ('index.html', 'admin.html'):
        html = urllib.request.urlopen(B + page).read().decode('utf-8')
        for u in set(_re.findall(r'(?:href|src|srcset)="([^"#:]+?)(?:\s+\d+w)?"', html)):
            for part in u.split(','):
                part = part.strip().split(' ')[0]
                if not part or part.startswith(('mailto', 'tel', 'http')): continue
                try: urllib.request.urlopen(B + part)
                except Exception as e: bad.append(page + ' → ' + part)
    src = ''.join(urllib.request.urlopen(B + f).read().decode('utf-8') for f in ('admin.js', 'limit.js', 'admin.html', 'index.html'))
    ok('T18 nincs törött helyi hivatkozás', not bad, bad[:4])
    ok('T19 a kódban nincs nyomtatási vezérlés (window.print, blokk-előnézet)', 'window.print' not in src and 'kslip' not in src and 'prn-dlg' not in src)
    b.close()
print(json.dumps(R, ensure_ascii=False, indent=1))
print('ÖSSZESEN:', sum(1 for v in R.values() if v.startswith('OK')), 'OK /', len(R))
