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
                       'diamonds': [{'id': 'd01', 'price': 6000}, {'id': 'd04', 'price': None}],
                       'src': {'sellPerGram.au14': 'jovahagyott'}}}

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

        print('Nyilvános nézet: nem szivároghat belső adat')
        rich = {
          'v': 14,
          'products': [
            {'id': 'jo-1', 'code': 'JO 1', 'name': 'Jóváhagyott', 'approved': True, 'listaAr': 300000, 'metals': ['au14'], 'colors': ['sarga'],
             'override': {'type': 'pct', 'value': 5}, 'minPrice': 250000, 'models3d': [{'url': 'titkos.glb'}], 'belso': 'TITOK-TERMEK',
             'rings': [{'label': 'Női', 'refSize': 54, 'refWidth': 4, 'weight': 4.8, 'labor': 12345, 'stoneRule': None, 'jegyzet': 'TITOK-GYURU'}]},
            {'id': 'nem-1', 'code': 'NEM 1', 'name': 'Nem jóváhagyott', 'approved': False, 'listaAr': 200000, 'metals': ['au14'],
             'override': {'type': 'fixed', 'value': 111111}, 'minPrice': 99999, 'rings': [{'label': 'Női', 'refSize': 54, 'refWidth': 3, 'weight': 3.1, 'labor': 777}]},
            {'id': 'rejtett-1', 'code': 'REJTETT', 'name': 'Rejtett', 'visible': False, 'approved': True, 'rings': []},
          ],
          'materials': {'gold24': 40000, 'platinum': 15000, 'palladium': 10000, 'titanium': 80,
                        'sellPerGram': {'au14': 47000, 'au18': 56000, 'pt': 55000, 'pd': 40000, 'ti': None},
                        'diamonds': [{'id': 'd01', 'ct': 0.01, 'price': 6000, 'src': 'jovahagyott', 'note': 'TITOK-KO'},
                                     {'id': 'd02', 'ct': 0.02, 'price': 12000, 'src': 'pelda', 'note': 'x'}],
                        'src': {'gold24': 'pelda', 'sellPerGram.au14': 'jovahagyott', 'sellPerGram.au18': 'demo', 'sellPerGram.pt': 'pelda'}},
          'settings': {'pricingMode': 'gramm', 'sizeMethod': 'tomeg', 'roundTo': 100, 'vatPct': 27, 'markupMetal': 35, 'markupStones': 20,
                       'lossPct': 3, 'laborFactor': {'au14': 1}, 'minMarginPct': 18, 'bigChangePct': 15, 'boxCost': 0,
                       'src': {'pricingMode': 'jovahagyott', 'roundTo': 'demo', 'markupMetal': 'jovahagyott'}},
          'history': [{'title': 'TITOK-NAPLO', 'before': {'gold24': 39000}}],
          'lastChange': {'at': '2026-11-21', 'old': {'jo-1': 290000, 'nem-1': 187654}},
          'inquiries': [{'name': 'TITOK-ERDEKLODO'}],
        }
        s, d = a.j('GET', '/versions'); base = d['versions'][0]['version']
        s, d = a.j('PUT', '/state', {'baseVersion': base, 'state': rich, 'note': 'teljes'}); check('teljes állapot mentve', s == 200, d)
        vb = d.get('version')
        s, raw, _ = b.req('GET', '/state'); txt = raw.decode('utf-8'); pub = json.loads(txt)['state']
        for secret in ['TITOK-TERMEK', 'TITOK-GYURU', 'TITOK-KO', 'TITOK-NAPLO', 'TITOK-ERDEKLODO', 'titkos.glb', 'REJTETT', '187654', '111111', '99999', '12345', '"labor"']:
            check(f'látogató nem kapja: {secret}', secret not in txt)
        m = pub['materials']
        check('nincs beszerzési referenciaár (24K, platina, palládium, titán)', not any(k in m for k in ['gold24', 'platinum', 'palladium', 'titanium']), list(m))
        check('csak a jóváhagyott grammár látszik (14K), a többi üres', m['sellPerGram']['au14'] == 47000 and m['sellPerGram']['au18'] is None and m['sellPerGram']['pt'] is None)
        check('nem jóváhagyott kőár üres, jóváhagyott megvan, megjegyzés nincs', m['diamonds'][0]['price'] == 6000 and m['diamonds'][1]['price'] is None and 'note' not in m['diamonds'][0])
        check('jóváhagyási címkék: csak „jovahagyott”, belső címke (pelda/demo) nincs', set(m['src'].values()) <= {'jovahagyott'} and set(pub['settings']['src'].values()) <= {'jovahagyott'} and 'pelda' not in txt and '"demo"' not in txt)
        st_ = pub['settings']
        check('felár, anyagveszteség, munkadíj-szorzó, árrés-küszöb nem megy ki', not any(k in st_ for k in ['markupMetal', 'markupStones', 'lossPct', 'laborFactor', 'minMarginPct', 'bigChangePct']), list(st_))
        check('nincs árnapló és érdeklődés', 'history' not in pub and 'inquiries' not in pub)
        check('rejtett gyűrű nem megy ki', [p['id'] for p in pub['products']] == ['jo-1', 'nem-1'])
        nem = pub['products'][1]; jo = pub['products'][0]
        check('nem jóváhagyott gyűrű: nincs egyedi/minimumár', 'override' not in nem and 'minPrice' not in nem and nem['approved'] is False)
        check('jóváhagyott gyűrű: egyedi ár szabálya megmarad', jo['override'] == {'type': 'pct', 'value': 5} and jo['minPrice'] == 250000)
        check('„frissült ár”: csak jóváhagyott gyűrű régi ára', pub['lastChange']['old'] == {'jo-1': 290000})
        s, d = a.j('GET', '/state')
        check('admin a teljes állapotot kapja (beszerzési ár, napló, felár)', d['state']['materials']['gold24'] == 40000 and d['state']['history'][0]['title'] == 'TITOK-NAPLO' and d['state']['settings']['markupMetal'] == 35)
        check('az admin állapotában sincs érdeklődés (azok külön táblában)', 'inquiries' not in d['state'])
        pubst = json.loads(json.dumps(pub))
        s, d = a.j('PUT', '/state', {'baseVersion': vb, 'state': pubst}); check('a nyilvános nézetet nem lehet visszamenteni (422)', s == 422, s)
        kolt = json.loads(json.dumps(rich)); kolt['settings']['pricingMode'] = 'koltseg'
        s, d = a.j('PUT', '/state', {'baseVersion': vb, 'state': kolt}); vb = d.get('version')
        s, d = b.j('GET', '/state')
        check('költségalapú módban nincs nyilvános grammár (minden egyedi ajánlat)', all(v is None for v in d['state']['materials']['sellPerGram'].values()))

        print('Érdeklődések')
        inq = {'name': 'Teszt Elek', 'email': 'teszt@example.invalid', 'phone': '', 'message': 'Próbaüzenet <script>', 'type': 'erdeklodes', 'productId': 'proba-1',
               'code': '81194 - 81195 W', 'summary': '14K fehérarany', 'config': {'metal': 'au14', 'rings': [[54, 4]]}, 'estimate': 259500}
        s, d = b.j('POST', '/inquiry', inq); check('érdeklődés rögzítve (201)', s == 201 and d.get('ok'), d)
        s, d = b.j('POST', '/inquiry', dict(inq, name='')); check('név nélkül elutasítva', s == 422, s)
        s, d = b.j('POST', '/inquiry', dict(inq, email='', phone='')); check('elérhetőség nélkül elutasítva', s == 422, s)
        s, d = b.j('POST', '/inquiry', dict(inq, email='nem-email')); check('hibás e-mail elutasítva', s == 422, s)
        s, d = b.j('POST', '/inquiry', dict(inq, config={'x': 'y' * 9000})); check('túl nagy beállítás elutasítva (413)', s == 413, s)
        s, d = b.j('POST', '/inquiry', dict(inq, website='http://spam')); check('csapdamezős (robot) üzenet nem kerül rögzítésre', s == 200, s)
        s, d = b.j('GET', '/inquiries'); check('látogató nem olvashat érdeklődést (401)', s == 401, s)
        s, d = a.j('GET', '/inquiries'); q0 = (d.get('inquiries') or [{}])[0]
        check('admin 1 érdeklődést lát, minden mezővel', s == 200 and len(d['inquiries']) == 1 and q0['name'] == 'Teszt Elek' and q0['status'] == 'uj' and q0['id'].startswith('s') and q0['config']['metal'] == 'au14' and q0['estimate'] == 259500 and q0['code'] == '81194 - 81195 W', d)
        iid = d['inquiries'][0]['id']
        s, d = a.j('POST', '/inquiry-status', {'id': iid, 'status': 'elfogadva', 'lockedPrice': 259500}); check('elfogadás rögzített árral', s == 200, s)
        s, d = a.j('GET', '/inquiries'); q0 = d['inquiries'][0]
        check('rögzített ár és állapot visszaolvasható', q0['status'] == 'elfogadva' and q0['lockedPrice'] == 259500 and q0.get('lockedAt'), q0)
        s, d = a.j('POST', '/inquiry-status', {'id': iid, 'status': 'lezarva'}); check('lezárás', s == 200, s)
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
