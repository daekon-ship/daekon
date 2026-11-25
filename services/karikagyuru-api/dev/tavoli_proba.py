#!/usr/bin/env python3
"""Karikagyuru – a TELEPÍTETT bemutató ellenőrzése kívülről, HTTPS-en (V5.10). Csak Python 3, külső csomag nélkül.

    python3 tavoli_proba.py https://kg-bemutato.daekon.hu/

A két jelszót bekéri (nem kerül a parancssorba, a naplóba vagy a kimenetbe). KG_DEMO_PASSWORD / KG_ADMIN_PASSWORD
környezeti változóval is megadható. Amit kipróbál, azt a végén visszaállítja: a grammár az eredeti értékre áll vissza
(ez – mint minden mentés – új változatként naplózódik), a próba-érdeklődést törli. Valódi személyes adatot nem használ.

Ellenőrzi: TLS és noindex · jelszó nélkül semmi nem látszik (oldal, API, config, .user.ini) · rossz jelszó elutasítva ·
bemutató és admin külön jelszó · 115 gyűrű, az öt mintagyűrű állapota · grammár mentése, újraolvasás, visszaállítás ·
fotófeltöltés és visszaolvasás · próba-érdeklődés megjelenik az adminban · e-mail kikapcsolva · kilépés.
A konfigurátort és a mobilnézetet böngészőben kell megnézni (a kimenet végén a lista)."""
import getpass, http.cookiejar, json, os, ssl, struct, sys, urllib.error, urllib.parse, urllib.request, uuid, zlib

if len(sys.argv) != 2 or not (sys.argv[1].startswith('https://') or (os.environ.get('KG_PROBA_HTTP') == '1' and sys.argv[1].startswith('http://127.0.0.1'))):   # http csak helyi teszthez
    sys.exit('Használat: python3 tavoli_proba.py https://kg-bemutato.daekon.hu/')
B = sys.argv[1].rstrip('/') + '/'
SAMPLES = {'maz-79014-w': True, 'maz-81184-81185-w': True, 'maz-81202-81203-wy': True, 'maz-79016-79017': False, 'maz-81632': False}
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, str(x)[:200])

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
def client():
    jar = http.cookiejar.CookieJar()
    return jar, urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), urllib.request.HTTPSHandler(context=ssl.create_default_context()), NoRedirect())
def req(op, method, path, data=None, headers=None, raw=False):
    h = dict(headers or {}); body = None
    if data is not None and not raw: body = json.dumps(data).encode(); h['Content-Type'] = 'application/json'
    elif data is not None: body = data
    r = urllib.request.Request(B + path, data=body, method=method, headers=h)
    try:
        with op.open(r, timeout=30) as res: return res.status, dict(res.headers), res.read()
    except urllib.error.HTTPError as e: return e.code, dict(e.headers), e.read()
def js(b):
    try: return json.loads(b)
    except Exception: return {}
def png(w=640, h=480):
    raw = b''.join(b'\x00' + bytes([150, 140, 120]) * w for _ in range(h))
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')

demo_pw = os.environ.get('KG_DEMO_PASSWORD') or getpass.getpass('Bemutató jelszava: ')
admin_pw = os.environ.get('KG_ADMIN_PASSWORD') or getpass.getpass('Admin jelszó: ')

print('1. Kívülről, jelszó nélkül')
jar, anon = client()
try:
    s, h, b = req(anon, 'GET', '')
    if B.startswith('https://'): check('HTTPS-kapcsolat érvényes tanúsítvánnyal', True)
except ssl.SSLError as e:
    sys.exit(f'  HIBA a tanúsítvány nem érvényes: {e}')
check('jelszó nélkül a jelszókérő oldal jön, nem a weboldal', b'data-kapu' in b and b'id="view"' not in b, s)
check('X-Robots-Tag: noindex', 'noindex' in h.get('X-Robots-Tag', h.get('x-robots-tag', '')), h.get('X-Robots-Tag'))
s, _, b = req(anon, 'GET', 'robots.txt'); check('robots.txt mindent tilt', b'Disallow: /' in b, b[:60])
for p in ['api/state', 'api/inquiries', 'config.php', '.user.ini', 'site/index.html', 'js/app.js']:
    s, _, b = req(anon, 'GET', p)
    check(f'jelszó nélkül nem érhető el: /{p}', b'"products"' not in b and b'<?php' not in b and b'upload_max' not in b and b'import ' not in b[:400], s)
s, _, b = req(anon, 'POST', 'kapu', urllib.parse.urlencode({'jelszo': 'rossz-' + uuid.uuid4().hex[:6]}).encode(), {'Content-Type': 'application/x-www-form-urlencoded'}, raw=True)
s2, _, b2 = req(anon, 'GET', 'api/state'); check('rossz bemutató-jelszóval nem enged be', b'"products"' not in b2, s2)

print('2. Bemutató-jelszóval (látogató)')
jar, op = client()
s, _, _ = req(op, 'POST', 'kapu', urllib.parse.urlencode({'jelszo': demo_pw}).encode(), {'Content-Type': 'application/x-www-form-urlencoded'}, raw=True)
ck = {c.name: c for c in jar}
gate = ck.get('kg_demo_kapu')
check('a bemutató-jelszóval belép; a süti HttpOnly' + ('' if B.startswith('http://') else ' és Secure'), gate is not None and (gate.secure or B.startswith('http://')) and gate.has_nonstandard_attr('HttpOnly'), s)
s, _, b = req(op, 'GET', ''); check('a weboldal betölt', b'id="view"' in b and b'kg-version' in b, s)
st = js(req(op, 'GET', 'api/state')[2]); state = st.get('state') or {}
prods = {p['id']: p for p in state.get('products', [])}
check('mind a 115 gyűrű megvan', len(prods) == 115, len(prods))
check('az adatbázis bemutató-jelölésű (demo)', state.get('demo') is True)
check('a fejlesztői nyilvántartás nincs a válaszban', 'clientDecisions' not in st.get('state', {}))
for pid, appr in SAMPLES.items():
    p = prods.get(pid, {}); check(f'mintagyűrű {pid}: {"jóváhagyott, beállítható" if appr else "egyedi ajánlat / jóváhagyásra vár"}', bool(p) and bool(p.get('approved')) == appr)
s, _, b = req(op, 'GET', 'api/inquiries'); check('a bemutató-jelszó az admint NEM nyitja (érdeklődések: 401/403)', s in (401, 403), s)
mark = 'TAVOLI-PROBA-' + uuid.uuid4().hex[:8]
s, _, b = req(op, 'POST', 'api/inquiry', {'type': 'erdeklodes', 'name': 'Teszt Béla', 'phone': '+36 30 000 0001', 'message': mark + ' (automatikus próba, törölhető)'})
check('próba-érdeklődés elküldve', s in (200, 201) and js(b).get('ok'), (s, b[:120]))

print('3. Admin – külön jelszóval')
s, _, b = req(op, 'POST', 'api/login', {'password': 'rossz-' + uuid.uuid4().hex[:6]}); check('rossz admin-jelszó elutasítva', s in (401, 403), s)
s, _, b = req(op, 'POST', 'api/login', {'password': admin_pw}); check('admin-belépés', s == 200, (s, b[:100]))
me = js(req(op, 'GET', 'api/me')[2]); csrf = me.get('csrf'); H = {'X-CSRF-Token': csrf or ''}
adm = {c.name: c for c in jar}.get('kg_admin')
check('admin-süti HttpOnly' + ('' if B.startswith('http://') else ' és Secure'), adm is not None and (adm.secure or B.startswith('http://')) and adm.has_nonstandard_attr('HttpOnly'))
inq = js(req(op, 'GET', 'api/inquiries')[2]).get('inquiries', [])
mine = [q for q in inq if mark in json.dumps(q, ensure_ascii=False)]
check('a próba-érdeklődés megjelent az adminban', len(mine) == 1, len(mine))
mail = js(req(op, 'GET', 'api/mail-status')[2]).get('mail', {})
check('e-mail-küldés kikapcsolva (bemutató)', str(mail.get('mode', mail)).lower() in ('off', 'ki', 'kikapcsolva') or mail.get('enabled') is False, mail)

print('4. Grammár: mentés → újraolvasás → visszaállítás')
cur = js(req(op, 'GET', 'api/state')[2]); v0 = cur.get('version'); st0 = cur['state']
g0 = st0['materials']['sellPerGram']['au14']; st1 = json.loads(json.dumps(st0)); st1['materials']['sellPerGram']['au14'] = g0 + 1000
s, _, b = req(op, 'PUT', 'api/state', {'baseVersion': v0, 'state': st1, 'note': 'Távoli próba: 14K grammár +1000'}, H)
check('grammár mentése a szerverre', s == 200, (s, b[:150]))
again = js(req(op, 'GET', 'api/state')[2])
check('újraolvasva az új grammár van meg', again['state']['materials']['sellPerGram']['au14'] == g0 + 1000)
s, _, b = req(op, 'PUT', 'api/state', {'baseVersion': again['version'], 'state': st0, 'note': 'Távoli próba: grammár visszaállítva'}, H)
back = js(req(op, 'GET', 'api/state')[2])
check('a korábbi grammár visszaállítva', s == 200 and back['state']['materials']['sellPerGram']['au14'] == g0, (s, b[:120]))

print('5. Fotófeltöltés')
bd = uuid.uuid4().hex
body = (f'--{bd}\r\nContent-Disposition: form-data; name="photo"; filename="proba.png"\r\nContent-Type: image/png\r\n\r\n').encode() + png() + f'\r\n--{bd}--\r\n'.encode()
s, _, b = req(op, 'POST', 'api/photo', body, dict(H, **{'Content-Type': f'multipart/form-data; boundary={bd}'}), raw=True)
src = js(b).get('src') or js(b).get('url') or ''
check('fotó feltöltve', s in (200, 201) and src, (s, b[:150]))
if src:
    s, h, b = req(op, 'GET', src.lstrip('/')); check('a feltöltött fotó visszaolvasható (JPEG)', s == 200 and b[:2] == b'\xff\xd8', s)

print('6. Rendrakás és kilépés')
if mine:
    s, _, _ = req(op, 'POST', 'api/inquiry-delete', {'id': mine[0]['id']}, H); check('a próba-érdeklődés törölve', s == 200, s)
s, _, _ = req(op, 'POST', 'api/logout', {}, H)
s, _, _ = req(op, 'GET', 'api/inquiries'); check('kilépés után az admin nem érhető el', s in (401, 403), s)

print(f'\n{ok} sikeres, {fail} hibás')
print('Böngészőben (telefonon is) még: egy mintagyűrű beállítása (anyag, méret, kő → az ár változik), '
      'Árak → grammár → „Az árak sikeresen mentve.” → újratöltés, Korábbi árak → visszaállítás, fénykép cseréje egy gyűrűnél.')
sys.exit(1 if fail else 0)
