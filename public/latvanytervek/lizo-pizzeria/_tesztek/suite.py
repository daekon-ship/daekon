"""Lizó Pizzéria látványterv – teljes Playwright tesztcsomag.
Futtatás: python3 suite.py <BASE_URL> <OUT_DIR>
Minden ellenőrzés PASS/FAIL sort ír; a végén összesítés + results.json."""
import asyncio, json, sys, re, time
from playwright.async_api import async_playwright

BASE = sys.argv[1].rstrip('/') + '/'
OUT = sys.argv[2]
R = []
def check(group, name, ok, detail=''):
    R.append({'group': group, 'name': name, 'ok': bool(ok), 'detail': str(detail)[:300]})
    print(('PASS ' if ok else 'FAIL ') + f'[{group}] {name}' + (f' — {detail}' if detail and not ok else (f' ({detail})' if detail else '')))

def nbsp(s): return (s or '').replace('\xa0', ' ').strip()
def fmt(n): return f'{n:,}'.replace(',', ' ') + ' Ft'

async def new_page(b, w, h, mobile=None, **kw):
    mobile = (w <= 720) if mobile is None else mobile
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=mobile, is_mobile=mobile, locale='hu-HU', timezone_id='Europe/Budapest', **kw)
    pg = await ctx.new_page()
    pg._errs, pg._fails = [], []
    pg.on('pageerror', lambda e: pg._errs.append(str(e)))
    pg.on('console', lambda m: pg._errs.append(m.text) if m.type == 'error' else None)
    pg.on('requestfailed', lambda r: pg._fails.append(r.url))
    pg.on('response', lambda r: pg._fails.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    return ctx, pg

async def fresh(pg, path=''):
    await pg.goto(BASE + path); await pg.evaluate('localStorage.clear(); sessionStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(700)

async def open_cat(pg, cat):
    await pg.click(f'[data-tab="{cat}"]'); await pg.wait_for_timeout(450)

async def open_product(pg, pid):
    cat = await pg.evaluate(f"window.LIZO.products.find(p=>p.id==='{pid}').cat")
    await open_cat(pg, cat)
    await pg.click(f'.mitem[data-pid="{pid}"] .mrow'); await pg.wait_for_timeout(500)

async def add(pg):
    await pg.click('[data-add]'); await pg.wait_for_timeout(650)

async def cart_open(pg):
    mob = await pg.evaluate("matchMedia('(max-width:720px)').matches")
    await pg.click('[data-cartbar]' if mob else '.cartbtn'); await pg.wait_for_timeout(550)

async def expected_total(pg):
    # független számítás a terméktörzsből (nem a store.js-ből)
    return await pg.evaluate("""() => { const L = window.LIZO; const c = JSON.parse(localStorage.getItem('lizo.cart.v1')||'[]');
      return c.reduce((s,l)=>{ const p=L.products.find(x=>x.id===l.id); const base = p.sizes ? p.sizes.find(z=>z.k===l.size).price : p.price;
        const ex=(l.extras||[]).reduce((a,id)=>a+L.extrasById[id].price,0); return s+(base+(p.extras?ex:0))*l.qty; },0); }""")

async def fill_checkout(pg, name='Teszt Elek', phone='+36 30 123 4567', area='Gyál', street='Fő utca 1.', terms=True, mode='delivery'):
    if mode == 'pickup': await pg.click('.mode label:nth-of-type(2)')
    await pg.fill('[name=name]', name); await pg.fill('[name=phone]', phone)
    if mode == 'delivery':
        if area: await pg.select_option('[name=area]', area)
        await pg.fill('[name=street]', street)
    if terms: await pg.check('[name=terms]')

# ---------------------------------------------------------------- 1. nézetek
async def viewports(b):
    G = 'nézet'
    for w, h in [(320, 640), (360, 740), (375, 812), (390, 844), (430, 932), (768, 1024), (1024, 768), (1440, 900), (1920, 1080)]:
        ctx, pg = await new_page(b, w, h)
        await fresh(pg)
        ov = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        barh = await pg.evaluate("document.querySelector('.bar').getBoundingClientRect().height")
        overlap = await pg.evaluate("""() => { const els=[...document.querySelectorAll('.bar__in > *')].filter(e=>e.offsetParent!==null).map(e=>e.getBoundingClientRect());
          for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],b=els[j]; if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1) return true;} return false; }""")
        clipped = await pg.evaluate("""() => [...document.querySelectorAll('h1,h2,h3,.btn,.tab,.mrow__name,.prices,.etlapbtn')].filter(e=>e.offsetParent!==null && (e.scrollWidth>e.clientWidth+1) && getComputedStyle(e).overflow!=='visible').length""")
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/v{w}-home.png')
        # kategóriapanel
        await pg.click('.bar [data-etlap-open]'); await pg.wait_for_timeout(700)
        cpx = await pg.evaluate("(()=>{const r=document.querySelector('[data-cp-close]').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth})()")
        cpo = await pg.evaluate("(()=>{const e=document.querySelector('[data-catpanel]');return e.scrollWidth-e.clientWidth})()")
        await pg.screenshot(path=f'{OUT}/v{w}-panel.png')
        await pg.click('[data-cp-cat="pizza"]'); await pg.wait_for_timeout(900)
        # termékablak
        await pg.click('.mitem[data-pid="don-diego"] .mrow'); await pg.wait_for_timeout(600)
        sx = await pg.evaluate("(()=>{const r=document.querySelector('[data-sheet] .x').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth})()")
        sf = await pg.evaluate("(()=>{const r=document.querySelector('[data-add]').getBoundingClientRect();const k=[...document.querySelectorAll('[data-add] > *')].every(c=>{const q=c.getBoundingClientRect();return q.left>=r.left-1&&q.right<=r.right+1});return r.bottom<=innerHeight+1&&r.right<=innerWidth+1&&k})()")
        so = await pg.evaluate("(()=>{const e=document.querySelector('.sheet__body');return e.scrollWidth-e.clientWidth})()")
        await pg.evaluate("document.querySelector('.sheet__body').scrollTop=9999"); await pg.wait_for_timeout(200)
        sx2 = await pg.evaluate("(()=>{const r=document.querySelector('[data-sheet] .x').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()")
        await pg.screenshot(path=f'{OUT}/v{w}-sheet.png')
        await add(pg)
        await cart_open(pg)
        do = await pg.evaluate("(()=>{const e=document.querySelector('[data-view=cart]');return e.scrollWidth-e.clientWidth})()")
        dx = await pg.evaluate("(()=>{const r=document.querySelector('[data-drawer] .x').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth})()")
        await pg.click('[data-next]'); await pg.wait_for_timeout(500)
        fo = await pg.evaluate("(()=>{const e=document.querySelector('[data-view=checkout]');return e.scrollWidth-e.clientWidth})()")
        fb = await pg.evaluate("(()=>{const r=document.querySelector('[data-next]').getBoundingClientRect();const k=[...document.querySelectorAll('[data-next] > *')].every(c=>{const q=c.getBoundingClientRect();return q.left>=r.left-1&&q.right<=r.right+1});return r.bottom<=innerHeight+1&&k})()")
        await pg.screenshot(path=f'{OUT}/v{w}-checkout.png')
        ok = ov == 0 and not overlap and clipped == 0 and cpx and cpo <= 0 and sx and sx2 and sf and so <= 0 and do <= 0 and dx and fo <= 0 and fb and not pg._errs and not pg._fails
        check(G, f'{w}×{h}', ok, f'túlcsordulás={ov} fejléc={round(barh)}px átfedés={overlap} levágott={clipped} panel-x={cpx} termék-x={sx}/{sx2} kosárba-gomb={sf} kosár-x={dx} pénztár-gomb={fb} hibák={pg._errs[:2]} hálózat={pg._fails[:2]}')
        if w <= 430:
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
            await pg.click('[data-menu-btn]'); await pg.wait_for_timeout(400)
            mn = await pg.evaluate("(()=>{const e=document.querySelector('[data-mnav]');const r=e.getBoundingClientRect();return {bottom:r.bottom,ih:innerHeight,scroll:e.scrollHeight>e.clientHeight,last:document.querySelector('.mnav__fb').getBoundingClientRect().bottom}})()")
            reach = mn['bottom'] <= mn['ih'] + 1 and (mn['last'] <= mn['ih'] or mn['scroll'])
            await pg.screenshot(path=f'{OUT}/v{w}-menu.png')
            check(G, f'{w}: hamburger-menü elfér / görgethető', reach, mn)
        await ctx.close()

# ---------------------------------------------------------------- 2. vásárlási forgatókönyvek
async def flows(b):
    G = 'kosár/pénztár'
    ctx, pg = await new_page(b, 390, 844)
    await fresh(pg)
    # méret
    await open_product(pg, 'hawaii')
    p32 = nbsp(await pg.text_content('[data-add-price]'))
    await pg.click('.seg label:nth-child(2)'); p50 = nbsp(await pg.text_content('[data-add-price]'))
    check(G, 'pizza 32/50 cm ár a terméktörzs szerint', p32 == '4 537 Ft' and p50 == '6 720 Ft', f'{p32} / {p50}')
    # extra + elvétel
    await pg.click('[data-ing="ananász"]'); after_rm = nbsp(await pg.text_content('[data-add-price]'))
    check(G, 'összetevő elvétele nem változtat árat', after_rm == '6 720 Ft', after_rm)
    await pg.click('.xg:nth-of-type(1) summary'); await pg.click('[data-extra="zoldseg:gomba"]')
    await pg.click('.xg:nth-of-type(2) summary'); await pg.click('[data-extra="hus:bacon"]')
    ex = nbsp(await pg.text_content('[data-add-price]'))
    check(G, 'extra: +400 zöldség, +800 hús', ex == '7 920 Ft', ex)
    await pg.click('[data-extra="hus:bacon"]'); ex2 = nbsp(await pg.text_content('[data-add-price]'))
    check(G, 'extra levétele visszaállítja az árat', ex2 == '7 120 Ft', ex2)
    await pg.click('[data-qty="1"]'); q2 = nbsp(await pg.text_content('[data-add-price]'))
    check(G, 'mennyiség ×2 a termékablakban', q2 == '14 240 Ft', q2)
    # dupla kattintás
    await pg.dblclick('[data-add]'); await pg.wait_for_timeout(700)
    n = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.cart.v1')).reduce((s,l)=>s+l.qty,0)")
    check(G, 'dupla kattintás a Kosárba gombon egyszer ad hozzá', n == 2, n)
    # ugyanaz a termék eltérő feltéttel → külön sor; azonos → összevonás
    await open_product(pg, 'hawaii'); await pg.click('.seg label:nth-child(2)'); await pg.click('[data-ing="ananász"]')
    await pg.click('.xg:nth-of-type(1) summary'); await pg.click('[data-extra="zoldseg:gomba"]'); await add(pg)
    await open_product(pg, 'hawaii'); await pg.click('.seg label:nth-child(2)'); await add(pg)
    lines = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.cart.v1')).map(l=>[l.id,l.size,l.qty,(l.extras||[]).length,(l.removed||[]).length])")
    check(G, 'azonos konfiguráció összevonva, eltérő külön sor', lines == [['hawaii', '50', 3, 1, 1], ['hawaii', '50', 1, 0, 0]], lines)
    # menü üdítő, fajta
    await open_product(pg, 'm-smash'); await pg.click('[data-drink="Sprite"]'); await add(pg)
    await open_product(pg, 'cola05'); await pg.click('.seg label:nth-child(2)'); await add(pg)
    sel = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.cart.v1')).slice(-2).map(l=>l.drink||l.variant)")
    check(G, 'menü-üdítő és üdítőfajta rögzítve', sel == ['Sprite', 'Coca-Cola Zero'], sel)
    # kosár összeg
    await cart_open(pg)
    shown = nbsp(await pg.text_content('[data-subtotal]')); exp = await expected_total(pg)
    check(G, 'kosár részösszeg = független számítás', shown == fmt(exp), f'{shown} vs {fmt(exp)}')
    meta = nbsp(await pg.inner_text('[data-lines]'))
    check(G, 'kosársor: méret, extra, elvétel, üdítő látszik', all(x in meta for x in ['50 cm', 'extra: gomba', 'nélküle', 'üdítő: Sprite', 'Coca-Cola Zero']), meta[:200])
    await pg.screenshot(path=f'{OUT}/flow-cart.png')
    # módosítás: első sor szerkesztése → 32 cm
    await pg.click('.line[data-i="0"] [data-ledit]'); await pg.wait_for_timeout(900)
    await pg.click('.seg label:nth-child(1)'); await pg.click('[data-add]'); await pg.wait_for_timeout(1200)
    sz = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.cart.v1')).map(l=>l.size)")
    shown = nbsp(await pg.text_content('[data-subtotal]')); exp = await expected_total(pg)
    check(G, 'kosársor módosítása (méretcsere) + újraszámolás', '32' in sz and shown == fmt(exp), f'{sz} {shown} vs {fmt(exp)}')
    # mennyiség −/+
    await pg.click('.line[data-i="1"] [data-lq="1"]'); await pg.click('.line[data-i="1"] [data-lq="-1"]'); await pg.click('.line[data-i="1"] [data-lq="-1"]')
    await pg.wait_for_timeout(300)
    shown = nbsp(await pg.text_content('[data-subtotal]')); exp = await expected_total(pg)
    check(G, 'mennyiség +/− és 0-ra csökkentés törli a sort', shown == fmt(exp), f'{shown} vs {fmt(exp)}')
    # oldalfrissítés
    before = await pg.evaluate("localStorage.getItem('lizo.cart.v1')")
    await pg.reload(); await pg.wait_for_timeout(800)
    after = await pg.evaluate("localStorage.getItem('lizo.cart.v1')"); cnt = await pg.text_content('.cartbar [data-cart-count]')
    check(G, 'oldalfrissítés után a kosár megmarad', before == after and cnt != '0', cnt)
    # pénztár validáció
    await cart_open(pg); await pg.click('[data-next]'); await pg.wait_for_timeout(400)
    lbl = nbsp(await pg.text_content('[data-next-total]'))
    check(G, 'kiszállításnál a gomb nem mutat félrevezető végösszeget', '+ díj' in lbl, lbl)
    await fill_checkout(pg, phone='12345')
    await pg.click('[data-next]'); await pg.wait_for_timeout(400)
    err = nbsp(await pg.text_content('[data-formerr]')); foc = await pg.evaluate('document.activeElement.name')
    check(G, 'hibás telefonszám → hibaüzenet + fókusz a mezőn', 'telefonszám' in err.lower() and foc == 'phone', f'{err} / {foc}')
    await pg.fill('[name=phone]', '+36 30 123 4567'); await pg.fill('[name=street]', '')
    await pg.click('[data-next]'); await pg.wait_for_timeout(400)
    err = nbsp(await pg.text_content('[data-formerr]'))
    check(G, 'hiányzó cím → hibaüzenet', 'utcát' in err, err)
    # átvétel: cím nem kell
    await pg.click('.mode label:nth-of-type(2)'); await pg.wait_for_timeout(200)
    hid = await pg.evaluate("document.querySelector('[data-addr]').hidden"); lbl = nbsp(await pg.text_content('[data-next-total]'))
    check(G, 'átvétel: címmezők eltűnnek, gomb a fizetendőt mutatja', hid and '+' not in lbl, lbl)
    await pg.click('.mode label:nth-of-type(1)'); await pg.fill('[name=street]', 'Fő utca 1.')
    # dupla beküldés
    await pg.dblclick('[data-next]'); await pg.wait_for_timeout(1500)
    orders = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.orders.v1')||'[]')")
    check(G, 'dupla kattintás a leadáson egy rendelést hoz létre', len(orders) == 1, len(orders))
    o = orders[0]
    recompute = await pg.evaluate("""(o)=>o.lines.reduce((s,l)=>s+l.total,0)""", o)
    check(G, 'rendelés összege = tételek összege', recompute == o['subtotal'], f'{recompute} vs {o["subtotal"]}')
    rc = nbsp(await pg.inner_text('[data-done]'))
    check(G, 'visszaigazolás: részösszeg + „kiszállítási díj még nincs benne”', 'még nincs benne' in rc and 'Fizetendő' in rc, rc[:160])
    await pg.screenshot(path=f'{OUT}/flow-done.png')
    await pg.reload(); await pg.wait_for_timeout(700); await pg.click('.cartbtn'); await pg.wait_for_timeout(600)
    stays = await pg.evaluate("!document.querySelector('[data-view=done]').hidden")
    check(G, 'frissítés után a visszaigazolás újra megnyitható', stays)
    # kosár ürítése
    await pg.click('[data-new-order]'); await pg.wait_for_timeout(300); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
    for pid in ['sonkas', 'romai']:
        await open_product(pg, pid); await add(pg)
    await cart_open(pg); vis = await pg.is_visible('[data-cart-clear]')
    await pg.click('[data-cart-clear]'); await pg.wait_for_timeout(300)
    empty = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.cart.v1')).length"); ev = await pg.is_visible('.cartempty')
    check(G, 'kosár ürítése', vis and empty == 0 and ev, f'{vis} {empty} {ev}')
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
    # minimum rendelés
    await open_product(pg, 'pal-turos'); await add(pg); await cart_open(pg); await pg.click('[data-next]'); await pg.wait_for_timeout(300)
    dis = await pg.evaluate("document.querySelector('[data-next]').disabled"); warn = nbsp(await pg.text_content('[data-minwarn]'))
    await pg.click('.mode label:nth-of-type(2)'); await pg.wait_for_timeout(200)
    dis2 = await pg.evaluate("document.querySelector('[data-next]').disabled")
    check(G, 'minimum rendelés: kiszállításnál tiltva, kiírja a hiányt', dis and '1 410 Ft' in warn and not dis2, f'{dis} „{warn}” átvételnél tiltva={dis2}')
    check(G, 'konzol- és hálózati hiba nincs (folyamat)', not pg._errs and not pg._fails, pg._errs[:3] + pg._fails[:3])
    await ctx.close()

    # zárvatartás: 03:00 helyi idő
    ctx, pg = await new_page(b, 390, 844)
    await pg.clock.install(time='2026-11-13T03:00:00+01:00')
    await fresh(pg)
    st = nbsp(await pg.text_content('[data-status-text2]'))
    await open_product(pg, 'sonkas'); await add(pg); await open_product(pg, 'romai'); await add(pg)
    await cart_open(pg); await pg.click('[data-next]'); await pg.wait_for_timeout(300)
    lbl = nbsp(await pg.text_content('[data-next-label]'))
    await fill_checkout(pg); await pg.click('[data-next]'); await pg.wait_for_timeout(1200)
    pre = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.orders.v1'))[0].preorder"); txt = nbsp(await pg.inner_text('[data-done]'))
    check(G, 'zárva: állapot, „Előrendelés leadása”, rendelés előrendelésként', 'Zárva' in st and lbl == 'Előrendelés leadása' and pre and 'Előrendelés rögzítve' in txt, f'{st} / {lbl} / {pre}')
    await ctx.close()

# ---------------------------------------------------------------- 3. étlap
async def menu(b):
    G = 'étlap'
    ctx, pg = await new_page(b, 1440, 900)
    await fresh(pg)
    for q, must in [('fustolt', 'don-diego'), ('füstölt', 'don-diego'), ('GOMBA', 'romai'), ('gyros', 'gyrospita'), ('tukortojas', 'fonix')]:
        await pg.fill('[data-search]', q); await pg.wait_for_timeout(300)
        vis = await pg.evaluate("[...document.querySelectorAll('.mitem')].filter(e=>!e.hidden && !e.closest('[hidden]')).map(e=>e.dataset.pid)")
        check(G, f'keresés „{q}”', must in vis, f'{len(vis)} találat')
    await pg.fill('[data-search]', 'qqqxyz'); await pg.wait_for_timeout(300)
    check(G, 'keresés: nincs találat üzenet', await pg.is_visible('[data-empty]'))
    await pg.fill('[data-search]', ''); await pg.wait_for_timeout(300)
    one = await pg.evaluate("[...document.querySelectorAll('.mcat')].filter(e=>!e.hidden).map(e=>e.dataset.cat)")
    check(G, 'keresés törlése után egy kategória látszik', one == ['pizza'], one)
    cats = await pg.evaluate("window.LIZO.categories.map(c=>c.id)")
    bad = []
    for c in cats:
        await pg.click(f'[data-tab="{c}"]'); await pg.wait_for_timeout(250)
        v = await pg.evaluate("[...document.querySelectorAll('.mcat')].filter(e=>!e.hidden).map(e=>e.dataset.cat)")
        n = await pg.evaluate(f"document.querySelectorAll('#cat-{c} .mitem').length"); exp = await pg.evaluate(f"window.LIZO.products.filter(p=>p.cat==='{c}').length")
        if v != [c] or n != exp: bad.append((c, v, n, exp))
    check(G, f'mind a {len(cats)} kategóriafül váltása + tételszám', not bad, bad)
    await pg.click('.bar [data-etlap-open]'); await pg.wait_for_timeout(600)
    sub = nbsp(await pg.text_content('.catpanel__sub'))
    await pg.click('[data-cp-cat="gyros"]'); await pg.wait_for_timeout(1000)
    v = await pg.evaluate("[...document.querySelectorAll('.mcat')].filter(e=>!e.hidden).map(e=>e.dataset.cat)")
    cartn = await pg.evaluate("JSON.parse(localStorage.getItem('lizo.cart.v1')||'[]').length")
    check(G, 'kategóriapanel navigál, nem tesz kosárba, a szöveg ezt mondja', v == ['gyros'] and cartn == 0 and 'kosárba' in sub and 'odaugrunk' in sub, f'{v} {cartn} „{sub}”')
    # ármegjelenítés = adat
    mism = await pg.evaluate("""() => { const L=window.LIZO, f=n=>String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u00a0')+'\\u00a0Ft'; const out=[];
      L.products.forEach(p=>{ const li=document.querySelector(`.mitem[data-pid="${p.id}"] .prices`); const t=li.textContent; const want=p.sizes?p.sizes.map(s=>f(s.price)):[f(p.price)];
        want.forEach(w=>{ if(!t.includes(w)) out.push(p.id); }); }); return out; }""")
    check(G, 'minden étlapár egyezik a terméktörzzsel', not mism, mism[:5])
    await ctx.close()

# ---------------------------------------------------------------- 4. admin
async def admin(b):
    G = 'admin'
    ctx, cust = await new_page(b, 390, 844)
    await fresh(cust)
    async def order(pid, mode='delivery', name='Kovács Teszt'):
        await open_product(cust, pid); await add(cust); await open_product(cust, 'romai'); await add(cust)
        await cart_open(cust); await cust.click('[data-next]'); await cust.wait_for_timeout(300)
        await fill_checkout(cust, name=name, mode=mode); await cust.click('[data-next]'); await cust.wait_for_timeout(1000)
        await cust.click('[data-new-order]'); await cust.wait_for_timeout(200); await cust.keyboard.press('Escape'); await cust.wait_for_timeout(500)
    await order('hustorony'); await order('m-smash', 'pickup', 'Nagy Teszt'); await order('sonkas', 'delivery', '<img src=x onerror="window.__xss=1">')
    ad = await ctx.new_page(); ad._errs = []; ad.on('pageerror', lambda e: ad._errs.append(str(e)))
    await ad.set_viewport_size({'width': 1024, 'height': 768}); await ad.goto(BASE + 'admin.html'); await ad.wait_for_timeout(700)
    newc = await ad.evaluate("document.querySelectorAll('.col--new .ord').length")
    check(G, 'új rendelések megjelennek (3)', newc == 3, newc)
    xss = await ad.evaluate('window.__xss') ; xss2 = await cust.evaluate('window.__xss')
    check(G, 'XSS: a vevő által beírt HTML nem fut le (admin + vevő)', xss is None and xss2 is None, f'{xss} {xss2}')
    det = nbsp(await ad.inner_text('.col--new'))
    check(G, 'kártyán: méret, tételek, cím, telefon, részösszeg + díj', all(x in det for x in ['Hústorony', 'Gyál', '+36 30 123 4567', 'Részösszeg', '+ kiszállítási díj']), det[:200])
    # életciklus
    for act, col in [('accepted', 'accepted'), ('cooking', 'cooking'), ('ready', 'ready')]:
        await ad.click(f'.col--{ "new" if act=="accepted" else {"cooking":"accepted","ready":"cooking"}[act]} .ord[data-no="401"] [data-act="{act}"]'); await ad.wait_for_timeout(500)
    in_ready = await ad.evaluate("!!document.querySelector('.col--ready .ord[data-no=\"401\"]')")
    await cust.goto(BASE); await cust.wait_for_timeout(500)
    await cust.evaluate("sessionStorage.setItem('lizo.last','401')"); await cust.click('.cartbtn'); await cust.wait_for_timeout(700)
    now = nbsp(await cust.text_content('.timeline .is-now'))
    check(G, 'életciklus: elfogad → készül → kész; a vevő oldalán (ugyanebben a böngészőben) követhető', in_ready and 'úton' in now, now)
    await cust.keyboard.press('Escape'); await cust.wait_for_timeout(400)
    await ad.click('.ord[data-no="401"] [data-act="done"]'); await ad.wait_for_timeout(500)
    await ad.click('.ord[data-no="402"] [data-act="rejected"]'); await ad.wait_for_timeout(500)
    await ad.click('[data-pane="history"]'); await ad.wait_for_timeout(300)
    hist = nbsp(await ad.inner_text('[data-history]'))
    check(G, 'átadás + elutasítás → előzmények', '#401' in hist and 'Teljesítve' in hist and '#402' in hist and 'Elutasítva' in hist, hist[:120])
    # sürgős jelzés
    await ad.evaluate("const o=JSON.parse(localStorage.getItem('lizo.orders.v1')); o.find(x=>x.no===403).history[0].t=Date.now()-5*60000; localStorage.setItem('lizo.orders.v1',JSON.stringify(o))")
    await ad.reload(); await ad.wait_for_timeout(600)
    late = await ad.evaluate("!!document.querySelector('.ord.is-late .ord__alert')"); title = await ad.title()
    check(G, 'figyelmet igénylő rendelés (>3 perce nincs elfogadva) kiemelve + darabszám a címben', late and title.startswith('(1)'), f'{late} {title}')
    await ad.screenshot(path=f'{OUT}/admin-board.png')
    # termék kikapcsolás
    await ad.click('[data-pane="products"]'); await ad.wait_for_timeout(300)
    await ad.click('label:has([data-pid="bbq"])'); await ad.wait_for_timeout(300)
    await cust.reload(); await cust.wait_for_timeout(600)
    off = await cust.evaluate("document.querySelector('.mitem[data-pid=bbq]').classList.contains('is-off')")
    await cust.click('.mitem[data-pid="bbq"] .mrow', force=True); await cust.wait_for_timeout(400)
    opened = await cust.evaluate("!document.querySelector('[data-sheet]').hidden")
    check(G, 'kikapcsolt termék: jelölve, nem nyitható meg', off and not opened, f'{off} {opened}')
    # minimum változtatás
    await ad.click('[data-pane="settings"]'); await ad.fill('[name=min]', '5000'); await ad.click('[data-minform] button'); await ad.wait_for_timeout(300)
    await cust.reload(); await cust.wait_for_timeout(500)
    mn = nbsp(await cust.text_content('.hcard [data-min-order]'))
    check(G, 'minimum rendelési összeg módosítása átvezetődik', mn == '5 000 Ft', mn)
    note = nbsp(await ad.text_content('.adm__note'))
    check(G, 'admin egyértelműen demo, nem szinkronizál', 'nem szinkronizál' in note and 'nem védett' in note, note[:90])
    await ad.set_viewport_size({'width': 768, 'height': 1024}); await ad.click('[data-pane="orders"]'); await ad.wait_for_timeout(400)
    await ad.screenshot(path=f'{OUT}/admin-768.png')
    tap = await ad.evaluate("[...document.querySelectorAll('.ord footer .btn,.adm__tabs button')].filter(e=>e.offsetParent).every(e=>e.getBoundingClientRect().height>=44)")
    check(G, 'tableten az admin gombjai ≥44 px', tap)
    check(G, 'admin konzolhiba nincs', not ad._errs, ad._errs[:3])
    await ctx.close()

# ---------------------------------------------------------------- 5. akadálymentesség
def lum(hexc):
    hexc = hexc.lstrip('#'); r, g, b = [int(hexc[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)
def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)

async def a11y(b):
    G = 'akadálymentesség'
    pairs = [('szöveg', '#f3e8d4', '#0e0b0a', 4.5), ('másodlagos szöveg', '#d8cab3', '#0e0b0a', 4.5), ('halvány szöveg', '#a8977f', '#0e0b0a', 4.5),
             ('halvány szöveg kártyán', '#a8977f', '#1a1412', 4.5), ('fehér a piros gombon', '#ffffff', '#d3201f', 4.5), ('arany felirat', '#d4a23c', '#0e0b0a', 4.5),
             ('hibaüzenet', '#ff7a6b', '#0e0b0a', 4.5), ('tiltott gomb', '#a8977f', '#3a302a', 3.0)]
    for n, f, bg, need in pairs:
        r = ratio(f, bg); check(G, f'kontraszt: {n}', r >= need, f'{r:.2f}:1 (min {need})')
    ctx, pg = await new_page(b, 390, 844)
    await fresh(pg)
    noname = await pg.evaluate("""() => [...document.querySelectorAll('button,a[href],input,select,textarea')].filter(e=>{ if(e.closest('[hidden]')) return false;
      const t=(e.getAttribute('aria-label')||e.textContent||e.getAttribute('placeholder')||'').trim(); const lab=e.labels&&e.labels.length; return !t && !lab; }).map(e=>e.outerHTML.slice(0,60))""")
    check(G, 'minden interaktív elemnek van neve', not noname, noname[:3])
    alts = await pg.evaluate("[...document.images].filter(i=>!i.hasAttribute('alt')).length")
    check(G, 'minden képnek van alt attribútuma', alts == 0, alts)
    small = await pg.evaluate("""() => [...document.querySelectorAll('button,a[href],input,select,summary')].filter(e=>e.offsetParent&&!e.closest('[hidden]')&&!e.closest('p,li,address,.foot__cols nav,.foot__note')).map(e=>{const r=e.getBoundingClientRect();return [e.className||e.tagName,Math.round(r.width),Math.round(r.height)]}).filter(x=>x[1]<24||x[2]<24)""")
    check(G, 'érintési célok ≥24×24 px (WCAG 2.2 AA 2.5.8)', not small, small[:4])
    # billentyűzet + fókuszcsapda
    await pg.keyboard.press('Tab'); first = await pg.evaluate("document.activeElement.textContent.trim()")
    check(G, 'első Tab: „Ugrás az étlapra”', first == 'Ugrás az étlapra', first)
    for name, opener, layer, closer in [('kategóriapanel', '.bar [data-etlap-open]', '[data-catpanel]', None), ('termékablak', '.mitem[data-pid="sonkas"] .mrow', '[data-sheet]', None)]:
        await pg.focus(opener); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(700)
        inside = True
        for _ in range(25):
            await pg.keyboard.press('Tab')
            if not await pg.evaluate(f"!!document.activeElement.closest('{layer}')"): inside = False; break
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(600)
        closed = await pg.evaluate(f"document.querySelector('{layer}').hidden")
        back = await pg.evaluate(f"document.activeElement === document.querySelector('{opener}')")
        check(G, f'{name}: fókusz bent marad, Escape bezár, fókusz visszatér', inside and closed and back, f'{inside} {closed} {back}')
    await pg.focus('.mitem[data-pid="sonkas"] .mrow'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
    await pg.focus('[data-add]'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(700)
    await pg.focus('.cartbtn'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
    inside = True
    for _ in range(20):
        await pg.keyboard.press('Tab')
        if not await pg.evaluate("!!document.activeElement.closest('[data-drawer]')"): inside = False; break
    check(G, 'kosár: fókuszcsapda', inside)
    await ctx.close()
    # csökkentett mozgás
    ctx, pg = await new_page(b, 390, 844, reduced_motion='reduce')
    await fresh(pg)
    vis = await pg.evaluate("getComputedStyle(document.querySelector('#hero-title')).opacity + '|' + document.querySelector('.rot__w').textContent")
    canvas = await pg.evaluate("(()=>{const c=document.querySelector('[data-embers]');return c.width})()")
    check(G, 'prefers-reduced-motion: tartalom látszik, szikra-háttér nem fut', vis.startswith('1|') and canvas in (0, 300), f'{vis} canvas={canvas}')
    await open_product(pg, 'sonkas'); await add(pg)
    check(G, 'prefers-reduced-motion: kosárba tétel működik, hiba nincs', await pg.evaluate("JSON.parse(localStorage.getItem('lizo.cart.v1')).length") == 1 and not pg._errs, pg._errs[:2])
    await ctx.close()

# ---------------------------------------------------------------- 6. hálózat, teljesítmény, tartalom
async def perf(b):
    G = 'hálózat/teljesítmény'
    for w, h, label in [(390, 844, 'mobil'), (1440, 900, 'asztali')]:
        ctx, pg = await new_page(b, w, h)
        sizes = {}
        async def on_resp(r):
            try:
                body = await r.body(); sizes[r.url] = len(body)
            except Exception: pass
        pg.on('response', lambda r: asyncio.ensure_future(on_resp(r)))
        await pg.add_init_script("""window.__lcp=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
          window.__cls=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});""")
        await pg.goto(BASE, wait_until='load'); await pg.wait_for_timeout(2500)
        nav = await pg.evaluate("(()=>{const n=performance.getEntriesByType('navigation')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)}})()")
        lcp = await pg.evaluate('Math.round(window.__lcp)'); cls = await pg.evaluate('window.__cls')
        total = sum(sizes.values()); n = len(sizes)
        check(G, f'{label}: betöltés (helyi szerver)', not pg._fails and total < 600_000, f'{n} kérés, {total/1024:.0f} KB, DCL {nav["dcl"]} ms, load {nav["load"]} ms, LCP {lcp} ms, CLS {cls:.3f}')
        check(G, f'{label}: CLS < 0,1', cls < 0.1, f'{cls:.3f}')
        if label == 'mobil':
            big = sorted(((v, k.split('/')[-1]) for k, v in sizes.items()), reverse=True)[:5]
            check(G, 'legnagyobb erőforrások', True, ', '.join(f'{k} {v/1024:.0f} KB' for v, k in big))
        await ctx.close()
    ctx, pg = await new_page(b, 1440, 900)
    await pg.goto(BASE); await pg.wait_for_timeout(500)
    bad = ['todo', 'fixme', 'placeholder', 'lorem', 'coming soon', 'demo', 'mock data', 'mintaadat', 'kép helye', 'fotó hamarosan', 'teszt rendelés',
           'fejlesztés alatt', 'egyeztetés szükséges', 'egyeztetendő', 'ide kerül', 'példa ár', 'próba tartalom', 'ai által', 'generált', 'hamarosan']
    for path in ['', 'admin.html']:
        await pg.goto(BASE + path); await pg.wait_for_timeout(400)
        txt = (await pg.evaluate("document.body.innerText + ' ' + [...document.querySelectorAll('[placeholder],[alt],[aria-label],[title]')].map(e=>[e.placeholder,e.alt,e.getAttribute('aria-label'),e.title].join(' ')).join(' ') + document.title")).lower()
        hits = [x for x in bad if x in txt]
        check('tartalom', f'tiltott kifejezések: {path or "index.html"}', not hits, hits)
        robots = await pg.evaluate("document.querySelector('meta[name=robots]').content")
        check('tartalom', f'noindex megmaradt: {path or "index.html"}', 'noindex' in robots, robots)
    links = await pg.evaluate("[...new Set([...document.querySelectorAll('a[href^=http]')].map(a=>a.href))]")
    await pg.goto(BASE); links = await pg.evaluate("[...new Set([...document.querySelectorAll('a[href^=http]')].map(a=>a.href))]")
    blank = await pg.evaluate("[...document.querySelectorAll('a[target=_blank]')].filter(a=>!/noopener/.test(a.rel)).length")
    check('tartalom', 'külső linkek target=_blank + rel=noopener', blank == 0, blank)
    check('tartalom', 'külső linkek listája (elérhetőség külön ellenőrizve)', True, ' | '.join(links))
    secrets = await pg.evaluate("""async () => { const srcs=[...document.scripts].map(s=>s.src).filter(Boolean); let hit=[];
      for (const s of srcs) { const t = await (await fetch(s)).text(); if (/sk_live|sk_test|api[_-]?key|password\\s*[:=]|secret/i.test(t.replace(/motion/g,''))) hit.push(s.split('/').pop()); } return hit; }""")
    check('biztonság', 'nincs API-kulcs / jelszó a betöltött JS-ben', not secrets, secrets)
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for fn in (viewports, flows, menu, admin, a11y, perf):
            try:
                await fn(b)
            except Exception as e:
                check(fn.__name__, 'VÁRATLAN HIBA a tesztben', False, repr(e))
        await b.close()
    ok = sum(r['ok'] for r in R)
    print(f'\nÖSSZESEN: {ok}/{len(R)} PASS')
    json.dump(R, open(f'{OUT}/results.json', 'w'), ensure_ascii=False, indent=1)

asyncio.run(main())
