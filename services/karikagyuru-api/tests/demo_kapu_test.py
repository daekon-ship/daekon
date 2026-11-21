#!/usr/bin/env python3
"""V5.6 – jelszóval védett, különálló bemutató (demo/kapu.php + src/DemoGate.php + bin/demo-install.php, demo-reset.php).
HTTP-szintű ellenőrzések, saját ideiglenes adatmappákkal. Valódi levelet nem küld, élesadatot nem érint.
Futtatás: python3 tests/demo_kapu_test.py"""
import http.cookiejar, io, json, os, re, shutil, sqlite3, subprocess, sys, tempfile, time, urllib.error, urllib.parse, urllib.request, uuid
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT, LPORT = 8806, 8807
B = f'http://127.0.0.1:{PORT}/'
DEMO_PW, ADMIN_PW = 'kapu-' + uuid.uuid4().hex[:12], 'admin-' + uuid.uuid4().hex[:12]
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
class Client:
    def __init__(self, base=B):
        self.base = base; self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar), NoRedirect)
        self.csrf = None
    def req(self, method, path, body=None, headers=None, ctype=None):
        h = dict(headers or {});
        if ctype: h['Content-Type'] = ctype
        if self.csrf: h['X-CSRF-Token'] = self.csrf
        r = urllib.request.Request(self.base + path.lstrip('/'), data=body, method=method, headers=h)
        try:
            with self.op.open(r, timeout=10) as res: return res.status, res.read(), dict(res.headers)
        except urllib.error.HTTPError as e: return e.code, e.read(), dict(e.headers)
    def j(self, method, path, obj=None):
        s, raw, h = self.req(method, path, json.dumps(obj).encode() if obj is not None else None, ctype='application/json' if obj is not None else None)
        try: return s, json.loads(raw)
        except Exception: return s, {'_raw': raw[:200]}
    def gate(self, pw):
        return self.req('POST', 'kapu', urllib.parse.urlencode({'jelszo': pw}).encode(), ctype='application/x-www-form-urlencoded')
    def admin(self, pw):
        s, d = self.j('POST', 'api/login', {'password': pw})
        if s == 200: self.csrf = d.get('csrf')
        return s, d

def php(args, env): return subprocess.run(['php'] + args, env=env, capture_output=True, text=True)
def wait(url):
    for _ in range(60):
        try: urllib.request.urlopen(url, timeout=1); return
        except urllib.error.HTTPError: return
        except Exception: time.sleep(0.1)

def jpeg():
    from PIL import Image
    b = io.BytesIO(); Image.new('RGB', (640, 480), (190, 170, 120)).save(b, 'JPEG'); return b.getvalue()
def multipart(fields, files):
    bd = 'kg' + uuid.uuid4().hex; out = io.BytesIO()
    for k, v in fields.items(): out.write(f'--{bd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, name, data in files: out.write(f'--{bd}\r\nContent-Disposition: form-data; name="{k}"; filename="{name}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + data + b'\r\n')
    out.write(f'--{bd}--\r\n'.encode()); return out.getvalue(), f'multipart/form-data; boundary={bd}'

def main():
    tmp = tempfile.mkdtemp(prefix='kg-kapu-'); data = os.path.join(tmp, 'demo-adat'); live = os.path.join(tmp, 'eles-adat')
    base_env = {k: v for k, v in os.environ.items() if not k.startswith('KG_')}
    env = dict(base_env, KG_DATA=data, KG_DEMO_PASSWORD=DEMO_PW, KG_ADMIN_PASSWORD=ADMIN_PW)
    srv = lsrv = None
    try:
        print('Telepítés')
        r = php([ROOT + '/bin/demo-install.php'], env)
        check('telepítés üres adatmappába', r.returncode == 0 and 'telepítve' in r.stdout, r.stderr)
        check('a megadott jelszavakat nem írja ki', DEMO_PW not in r.stdout and ADMIN_PW not in r.stdout)
        r2 = php([ROOT + '/bin/demo-install.php'], env)
        check('nem üres adatmappába nem telepít újra', r2.returncode != 0 and 'nem üres' in r2.stderr, r2.stderr)
        g = os.path.join(tmp, 'gen'); r3 = php([ROOT + '/bin/demo-install.php'], dict(base_env, KG_DATA=g))
        pws = re.findall(r'(?:jelszava|jelszó) \([^)]*\):\s+(\S+)', r3.stdout)
        check('jelszó nélkül két erős, különböző jelszót generál és egyszer kiírja', r3.returncode == 0 and len(pws) == 2 and pws[0] != pws[1] and all(len(x) >= 17 for x in pws), r3.stdout)
        kmode = oct(os.stat(os.path.join(data, 'demo-kapu.json')).st_mode & 0o777)
        check('a kapu jelszófájlja csak a tulajdonosé (0600), jelszó nincs benne olvashatóan', kmode == '0o600' and DEMO_PW not in open(os.path.join(data, 'demo-kapu.json')).read(), kmode)
        # éles (nem bemutató) adatmappa: setup + egy éles állapot mentése a normál API-n
        lenv = dict(base_env, KG_DATA=live, KG_ADMIN_PASSWORD=ADMIN_PW)
        php([ROOT + '/bin/setup.php'], lenv)
        lsrv = subprocess.Popen(['php', '-S', f'127.0.0.1:{LPORT}', '-t', ROOT + '/public', ROOT + '/public/index.php'], env=lenv, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait(f'http://127.0.0.1:{LPORT}/api/health')
        lc = Client(f'http://127.0.0.1:{LPORT}/'); lc.admin(ADMIN_PW)
        demo_state = json.load(open(ROOT + '/demo/minta-allapot.json'))
        s, d = lc.j('PUT', 'api/state', {'baseVersion': 0, 'state': demo_state, 'note': 'x'})
        check('éles rendszerbe bemutató-jelölésű adat NEM menthető (422)', s == 422 and 'Bemutató' in d.get('error', ''), (s, d))
        live_state = dict(demo_state); live_state.pop('demo')
        s, d = lc.j('PUT', 'api/state', {'baseVersion': 0, 'state': live_state, 'note': 'éles'})
        check('éles adat menthető az éles rendszerbe', s == 200, (s, d))
        lsrv.terminate(); lsrv = None
        r = php([ROOT + '/bin/demo-reset.php'], dict(base_env, KG_DATA=live))
        check('a visszaállítás éles adatmappán nem fut le', r.returncode != 0, r.stdout + r.stderr)
        open(os.path.join(live, 'demo-kapu.json'), 'w').write(open(os.path.join(data, 'demo-kapu.json')).read())
        r = php([ROOT + '/bin/demo-reset.php'], dict(base_env, KG_DATA=live))
        check('kapufájllal sem töröl éles adatbázist', r.returncode != 0 and 'nem bemutató' in r.stderr, r.stderr)
        n = sqlite3.connect(os.path.join(live, 'kg.sqlite')).execute('SELECT COUNT(*) FROM state_version').fetchone()[0]
        check('az éles adat megmaradt', n == 1, n)
        # a bemutató kapuja éles adatmappára állítva nem indul
        lsrv = subprocess.Popen(['php', '-S', f'127.0.0.1:{LPORT}', ROOT + '/demo/kapu.php'], env=dict(base_env, KG_DATA=live), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait(f'http://127.0.0.1:{LPORT}/robots.txt')
        s, raw, _ = Client(f'http://127.0.0.1:{LPORT}/').req('GET', '')
        check('éles adatmappára állítva a bemutató nem indul (503)', s == 503 and 'nem bemutató-adatbázis' in raw.decode(), (s, raw[:120]))
        lsrv.terminate(); lsrv = None

        # mail.json SMTP-vel az adatmappában: a kapu akkor is kikapcsolja a levelezést
        json.dump({'mode': 'file', 'to': 'teszt@example.invalid', 'from': 'teszt@example.invalid'}, open(os.path.join(data, 'mail.json'), 'w'))
        srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', ROOT + '/demo/kapu.php'], env=dict(base_env, KG_DATA=data), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait(B + 'robots.txt')

        print('Kapu: belépés nélkül')
        c = Client()
        s, raw, h = c.req('GET', '')
        html = raw.decode()
        check('belépés nélkül a weboldal helyett jelszókérő (401)', s == 401 and 'data-kapu' in html and 'kg-api' not in html, s)
        check('a jelszókérő kimondja: szemléltető mintaadatok, e-mail nem megy ki', 'szemléltető mintaadatok' in html and 'e-mail nem megy ki' in html)
        check('noindex fejléc és meta', 'noindex' in h.get('X-Robots-Tag', '') and 'noindex' in html)
        for path in ['index.html', 'js/app.js', 'js/data.js', 'img/termekek/', 'api/state', 'api/health']:
            s, raw, _ = c.req('GET', path)
            check(f'belépés nélkül nem érhető el: /{path}', s == 401 and b'kg-api' not in raw and b'export ' not in raw, s)
        s, raw, _ = c.req('GET', 'robots.txt')
        check('robots.txt: mindent tilt', s == 200 and 'Disallow: /' in raw.decode())
        s, raw, _ = c.gate('rossz-jelszo')
        check('hibás bemutató-jelszó: 401, hibaüzenet', s == 401 and 'Hibás jelszó' in raw.decode(), s)
        s, raw, _ = c.gate(ADMIN_PW)
        check('az admin jelszó NEM nyitja a bemutatót (külön jelszó)', s == 401, s)
        bad = Client(); bad.jar.set_cookie(http.cookiejar.Cookie(0, 'kg_demo_kapu', '9999999999.' + 'a' * 64, None, False, '127.0.0.1', False, False, '/', True, False, None, False, None, None, {}))
        check('hamisított belépési süti: nem enged be', bad.req('GET', '')[0] == 401)

        print('Kapu: belépés után')
        s, raw, h = c.gate(DEMO_PW)
        ck = [x for x in c.jar if x.name == 'kg_demo_kapu']
        check('helyes jelszó: továbbirányít, HttpOnly süti', s == 303 and ck and ck[0].has_nonstandard_attr('HttpOnly'), (s, h.get('Set-Cookie')))
        s, raw, h = c.req('GET', '')
        html = raw.decode()
        check('belépve: a weboldal szerver módban (kg-api = api/)', s == 200 and '<meta name="kg-api" content="api/">' in html, s)
        check('belépve is noindex', 'noindex' in h.get('X-Robots-Tag', '') and 'noindex' in html)
        for path in ['tests/v56.py', 'docs/TELEPITES.md', 'ATADAS.md', '../../services/karikagyuru-api/src/App.php', 'js/../../../../etc/passwd']:
            check(f'nem szolgál ki: /{path}', c.req('GET', path)[0] == 404)
        s, d = c.j('GET', 'api/state')
        check('API: nyilvános nézet, „demo” jelöléssel', s == 200 and d['state'].get('public') is True and d['state'].get('demo') is True, (s, list(d.get('state', {}))[:6]))
        check('a teljes katalógus (115) látható, ebből 2 mintagyűrű jóváhagyott', len([p for p in d['state']['products'] if p.get('visible') is not False]) == 115 and len([p for p in d['state']['products'] if p.get('approved')]) == 2)
        s, d = c.j('GET', 'api/inquiries')
        check('admin végpont csak admin belépéssel (a bemutató-jelszó kevés)', s in (401, 403), s)
        s, d = c.admin(DEMO_PW)
        check('a bemutató-jelszó nem admin jelszó', s == 401, s)
        s, d = c.admin(ADMIN_PW)
        check('admin belépés a saját jelszóval', s == 200, (s, d))

        print('Mentés, ajánlatkérés, e-mail')
        s, d = c.j('GET', 'api/state'); st = d['state']; v = d['version']
        st.pop('demo', None); st['materials']['sellPerGram']['au14'] += 1000
        s, d = c.j('PUT', 'api/state', {'baseVersion': v, 'state': st, 'note': 'grammár'})
        check('admin mentés a bemutatóban', s == 200, (s, d))
        s, d = c.j('GET', 'api/state')
        check('a mentett állapot akkor is „demo” jelölésű, ha a kérésből hiányzott', d['state'].get('demo') is True)
        body, ct = multipart({'payload': json.dumps({'type': 'egyedi', 'name': 'Bemutató Teszt', 'phone': '+36 30 000 0000', 'message': 'Próba'})}, [('images[]', 'minta.jpg', jpeg())])
        s, raw, _ = c.req('POST', 'api/inquiry', body, ctype=ct)
        check('ajánlatkérés referenciaképpel rögzítve', s == 201, (s, raw[:200]))
        s, d = c.j('GET', 'api/inquiries')
        inq = (d.get('inquiries') or [{}])[0]
        check('az érdeklődés az adminban, a csatolt képpel', s == 200 and inq.get('name') == 'Bemutató Teszt' and len(inq.get('files', [])) == 1, (s, inq))
        check('e-mail: kikapcsolva akkor is, ha az adatmappában levélbeállítás van', inq.get('notify') in ('off', '') and not os.path.isdir(os.path.join(data, 'outbox')), (inq.get('notify'), os.listdir(data)))
        s, d = c.j('GET', 'api/mail-status')
        check('levélállapot: „off”', d.get('mail', {}).get('mode') == 'off', d)

        print('Visszaállítás')
        srv.terminate(); srv.wait()
        r = php([ROOT + '/bin/demo-reset.php'], dict(base_env, KG_DATA=data))
        check('visszaállítás lefut', r.returncode == 0, r.stderr)
        db = sqlite3.connect(os.path.join(data, 'kg.sqlite'))
        check('visszaállítás után: 1 változat, 0 érdeklődés, nincs csatolt kép', db.execute('SELECT COUNT(*) FROM state_version').fetchone()[0] == 1 and db.execute('SELECT COUNT(*) FROM inquiry').fetchone()[0] == 0 and not os.path.exists(os.path.join(data, 'inquiry-files')))
        body = json.loads(db.execute('SELECT body FROM state_version').fetchone()[0])
        check('visszaállítás után az eredeti mintagrammár', body['materials']['sellPerGram']['au14'] == demo_state['materials']['sellPerGram']['au14'])
        srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', ROOT + '/demo/kapu.php'], env=dict(base_env, KG_DATA=data), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait(B + 'robots.txt')
        c2 = Client(); c2.gate(DEMO_PW)
        check('a jelszavak a visszaállítás után is érvényesek', c2.req('GET', '')[0] == 200 and c2.admin(ADMIN_PW)[0] == 200)
        s, raw, _ = c2.req('GET', 'kapu/kilepes')
        check('kilépés a bemutatóból', s == 303 and c2.req('GET', '')[0] == 401)

        print('Zárolás')
        c3 = Client(); codes = [c3.gate('rossz-' + str(i))[0] for i in range(5)]
        s, raw, _ = c3.gate(DEMO_PW)
        check('5 hibás próbálkozás után zárolás, helyes jelszóval is (429)', codes == [401] * 5 and s == 429 and 'Túl sok' in raw.decode(), (codes, s))
    finally:
        for x in (srv, lsrv):
            if x: x.terminate()
        shutil.rmtree(tmp, ignore_errors=True)
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

main()
