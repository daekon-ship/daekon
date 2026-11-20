#!/usr/bin/env python3
"""Karikagyuru API – végpontteszt. Saját, ideiglenes adatmappával indít egy helyi PHP-szervert.
Futtatás:  python3 tests/api_test.py     (PHP 8.1+ kell, pdo_sqlite és gd bővítménnyel)"""
import json, os, subprocess, sys, tempfile, time, shutil, struct, zlib, uuid
import urllib.request, urllib.error, http.cookiejar

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get('KG_TEST_PORT', '8791'))
BASE = f'http://127.0.0.1:{PORT}/api'
PW = 'teszt-' + uuid.uuid4().hex      # csak erre a futásra
ok = fail = 0

def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('  ok  ', name)
    else: fail += 1; print('  HIBA', name, extra)

class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.csrf = None
    def req(self, method, path, data=None, headers=None, raw=None):
        h = dict(headers or {})
        body = raw
        if data is not None: body = json.dumps(data).encode(); h['Content-Type'] = 'application/json'
        if self.csrf and 'X-CSRF-Token' not in h: h['X-CSRF-Token'] = self.csrf
        r = urllib.request.Request(BASE + path, data=body, method=method, headers=h)
        try:
            with self.op.open(r, timeout=10) as res: return res.status, res.read(), res.headers
        except urllib.error.HTTPError as e: return e.code, e.read(), e.headers
    def j(self, *a, **k):
        s, b, h = self.req(*a, **k)
        try: return s, json.loads(b)
        except Exception: return s, {}

def png(w=40, h=30):
    raw = b''.join(b'\x00' + b'\xcc\x99\x33' * w for _ in range(h))
    def ch(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')

def multipart(name, filename, content, ctype):
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: {ctype}\r\n\r\n').encode() + content + f'\r\n--{b}--\r\n'.encode()
    return body, {'Content-Type': f'multipart/form-data; boundary={b}'}

STATE = {'products': [{'id': 'proba-1', 'name': 'Próba'}], 'settings': {'pricingMode': 'gramm'},
         'materials': {'sellPerGram': {'au14': 47000, 'au18': None, 'pt': 55000, 'pd': None, 'ti': None},
                       'diamonds': [{'id': 'd01', 'price': 6000}, {'id': 'd04', 'price': None}]}}

def main():
    data = tempfile.mkdtemp(prefix='kg-api-')
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW)
    srv = None
    try:
        srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', '-t', ROOT + '/public', ROOT + '/public/index.php'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(50):
            try: urllib.request.urlopen(BASE + '/health', timeout=1); break
            except Exception: time.sleep(0.1)

        print('Telepítés')
        a = Client()
        s, d = a.j('GET', '/health'); check('health válaszol, még nincs jelszó', s == 200 and d.get('configured') is False, d)
        s, d = a.j('POST', '/login', {'password': PW}); check('jelszó nélkül nincs belépés (503)', s == 503, s)
        r = subprocess.run(['php', ROOT + '/bin/setup.php'], env=dict(env, KG_ADMIN_PASSWORD='rovid'), capture_output=True)
        check('rövid jelszót a telepítő elutasít', r.returncode != 0)
        r = subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, capture_output=True)
        check('telepítő beállítja a jelszót', r.returncode == 0, r.stderr)
        check('a telepítő nem írja ki a jelszót', PW.encode() not in r.stdout + r.stderr)
        raw = b''.join(open(os.path.join(data, f), 'rb').read() for f in os.listdir(data) if os.path.isfile(os.path.join(data, f)))
        check('a jelszó nincs nyílt szövegként az adatmappában', PW.encode() not in raw)

        print('Jogosultság')
        s, d = a.j('GET', '/state'); check('üres állapot olvasható (0. változat)', s == 200 and d['version'] == 0 and d['state'] is None, d)
        v = Client(); v.j('GET', '/state'); v.j('GET', '/health'); check('látogató nem kap sütit', len(v.jar) == 0)
        for m, p in [('PUT', '/state'), ('GET', '/inquiries'), ('GET', '/versions'), ('POST', '/photo'), ('POST', '/revert'), ('POST', '/inquiry-status'), ('POST', '/logout')]:
            s, d = a.j(m, p, {} if m != 'GET' else None); check(f'belépés nélkül tiltva: {m} {p}', s == 401, s)
        s, d = a.j('POST', '/login', {'password': 'rossz-jelszo-123'}); check('hibás jelszó: 401', s == 401, s)
        s, d = a.j('GET', '/me'); check('hibás jelszó után nincs admin', d.get('admin') is False, d)
        s, d = a.j('POST', '/login', {'password': PW}); check('helyes jelszó: belép', s == 200 and d.get('admin') is True and len(d.get('csrf', '')) == 64, d)
        tok = d.get('csrf')
        ck = [c for c in a.jar if c.name == 'kg_admin']
        check('süti HttpOnly és SameSite=Strict', bool(ck) and ck[0].has_nonstandard_attr('HttpOnly') and (ck[0].get_nonstandard_attr('SameSite') or '').lower() == 'strict')
        s, d = a.j('PUT', '/state', {'baseVersion': 0, 'state': STATE}); check('CSRF-jel nélkül a mentés tiltva (403)', s == 403, s)
        s, d = a.j('PUT', '/state', {'baseVersion': 0, 'state': STATE}, headers={'X-CSRF-Token': 'x' * 64}); check('hibás CSRF-jellel tiltva (403)', s == 403, s)
        a.csrf = tok

        print('Mentés, változatok')
        s, d = a.j('PUT', '/state', {'baseVersion': 0, 'state': STATE, 'note': 'első'}); check('mentés sikerül, 1. változat', s == 200 and d.get('version') == 1, d)
        v1 = d.get('version')
        b = Client(); s, d = b.j('GET', '/state'); check('látogató a mentett adatot kapja', s == 200 and d['state']['materials']['sellPerGram']['au14'] == 47000, d)
        s, d = a.j('PUT', '/state', {'baseVersion': 0, 'state': STATE}); check('elavult alapváltozat: 409, nem ír felül', s == 409, s)
        st2 = json.loads(json.dumps(STATE)); st2['materials']['sellPerGram']['au14'] = 48000; st2['inquiries'] = [{'name': 'Valaki'}]
        s, d = a.j('PUT', '/state', {'baseVersion': v1, 'state': st2, 'note': 'emelés'}); check('második mentés: 2. változat', s == 200 and d.get('version') == v1 + 1, d)
        s, d = b.j('GET', '/state'); check('új ár látszik, érdeklődőadat nem kerül az állapotba', d['state']['materials']['sellPerGram']['au14'] == 48000 and 'inquiries' not in d['state'], d)
        bad = json.loads(json.dumps(STATE)); bad['materials']['sellPerGram']['au14'] = -5
        s, d = a.j('PUT', '/state', {'baseVersion': v1 + 1, 'state': bad}); check('negatív grammár elutasítva (422)', s == 422, s)
        bad = json.loads(json.dumps(STATE)); bad['materials']['sellPerGram']['ti'] = 9000
        s, d = a.j('PUT', '/state', {'baseVersion': v1 + 1, 'state': bad}); check('titán grammár elutasítva (422)', s == 422, s)
        bad = json.loads(json.dumps(STATE)); bad['products'][0]['img'] = 'data:image/png;base64,AAAA'
        s, d = a.j('PUT', '/state', {'baseVersion': v1 + 1, 'state': bad}); check('beágyazott kép az állapotban elutasítva (422)', s == 422, s)
        bad = json.loads(json.dumps(STATE)); bad['products'].append({'id': 'proba-1'})
        s, d = a.j('PUT', '/state', {'baseVersion': v1 + 1, 'state': bad}); check('ismétlődő termékazonosító elutasítva (422)', s == 422, s)
        s, d = a.j('PUT', '/state', {'baseVersion': v1 + 1, 'state': {'products': []}}); check('hiányos állapot elutasítva (422)', s == 422, s)
        s, d = b.j('GET', '/state'); check('elutasított mentések után az adat változatlan', d['version'] == v1 + 1 and d['state']['materials']['sellPerGram']['au14'] == 48000, d)
        s, d = a.j('GET', '/versions'); check('változatlista: 2 tétel, megjegyzéssel', s == 200 and len(d['versions']) == 2 and d['versions'][0]['note'] == 'emelés', d)
        s, d = a.j('POST', '/revert', {'version': v1}); check('visszaállítás új változatot hoz létre', s == 200 and d.get('version') == v1 + 2, d)
        s, d = b.j('GET', '/state'); check('visszaállítás után a régi ár él', d['state']['materials']['sellPerGram']['au14'] == 47000, d)
        s, d = a.j('POST', '/revert', {'version': 999}); check('nem létező változat: 404', s == 404, s)

        print('Érdeklődések')
        inq = {'name': 'Teszt Elek', 'email': 'teszt@example.invalid', 'phone': '', 'message': 'Próbaüzenet <script>', 'kind': 'ajanlat', 'productId': 'proba-1', 'consent': True}
        s, d = b.j('POST', '/inquiry', inq); check('érdeklődés rögzítve (201)', s == 201 and d.get('ok'), d)
        s, d = b.j('POST', '/inquiry', dict(inq, name='')); check('név nélkül elutasítva', s == 422, s)
        s, d = b.j('POST', '/inquiry', dict(inq, email='', phone='')); check('elérhetőség nélkül elutasítva', s == 422, s)
        s, d = b.j('POST', '/inquiry', dict(inq, email='nem-email')); check('hibás e-mail elutasítva', s == 422, s)
        s, d = b.j('POST', '/inquiry', dict(inq, consent=False)); check('hozzájárulás nélkül elutasítva', s == 422, s)
        s, d = b.j('POST', '/inquiry', dict(inq, website='http://spam')); check('csapdamezős (robot) üzenet nem kerül rögzítésre', s == 200, s)
        s, d = b.j('GET', '/inquiries'); check('látogató nem olvashat érdeklődést (401)', s == 401, s)
        s, d = a.j('GET', '/inquiries'); check('admin 1 érdeklődést lát', s == 200 and len(d['inquiries']) == 1 and d['inquiries'][0]['name'] == 'Teszt Elek' and d['inquiries'][0]['status'] == 'uj', d)
        iid = d['inquiries'][0]['id']
        s, d = a.j('POST', '/inquiry-status', {'id': iid, 'status': 'lezart'}); check('állapot módosítható', s == 200, s)
        s, d = a.j('POST', '/inquiry-status', {'id': iid, 'status': 'torolve'}); check('ismeretlen állapot elutasítva', s == 422, s)
        for _ in range(4): b.j('POST', '/inquiry', inq)
        s, d = b.j('POST', '/inquiry', inq); check('óránként 5 után korlátozás (429)', s == 429, s)

        print('Fényképek')
        body, h = multipart('photo', 'gyuru.png', png(), 'image/png')
        s, d = b.j('POST', '/photo', raw=body, headers=h); check('látogató nem tölthet fel képet (401)', s == 401, s)
        s, d = a.j('POST', '/photo', raw=body, headers=h); check('admin feltölt: 201, JPG-re kódolva', s == 201 and d['url'].endswith('.jpg') and d['width'] == 40, d)
        url = d.get('url', '')
        s, bts, hd = b.req('GET', url.replace('api', '', 1)); check('feltöltött kép nyilvánosan letölthető, JPEG', s == 200 and bts[:3] == b'\xff\xd8\xff' and hd.get('Content-Type') == 'image/jpeg', s)
        body, h = multipart('photo', 'rossz.php', b'<?php echo 1; ?>', 'image/jpeg'); s, d = a.j('POST', '/photo', raw=body, headers=h); check('nem kép (PHP-fájl képnek álcázva) elutasítva (415)', s == 415, s)
        body, h = multipart('photo', 'a.gif', b'GIF89a\x01\x00\x01\x00\x00\x00\x00;', 'image/gif'); s, d = a.j('POST', '/photo', raw=body, headers=h); check('nem támogatott formátum elutasítva (415)', s == 415, s)
        s, bts, hd = b.req('GET', '/photo/../kg.sqlite'); check('adatbázis nem tölthető le a képvégponton át', s in (401, 404) and b'SQLite' not in bts, s)
        check('a photos mappában csak .jpg van', all(f.endswith('.jpg') for f in os.listdir(os.path.join(data, 'photos'))))

        print('Kilépés, zárolás')
        s, d = a.j('POST', '/logout'); check('kilépés', s == 200 and d.get('admin') is False, d)
        s, d = a.j('PUT', '/state', {'baseVersion': v1 + 2, 'state': STATE}); check('kilépés után a mentés tiltva', s == 401, s)
        s, d = a.j('GET', '/nincs-ilyen'); check('ismeretlen végpont nem ad adatot', s in (401, 404), s)
        c = Client()
        for _ in range(4): c.j('POST', '/login', {'password': 'rossz-jelszo-123'})   # az elején már volt 1 hibás
        s, d = c.j('POST', '/login', {'password': PW}); check('5 hibás próbálkozás után zárolás, jó jelszóval is (429)', s == 429, s)
    finally:
        if srv: srv.terminate()
        shutil.rmtree(data, ignore_errors=True)
    print(f'\n{ok} sikeres, {fail} hibás')
    sys.exit(1 if fail else 0)

main()
