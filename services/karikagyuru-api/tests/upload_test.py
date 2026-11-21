#!/usr/bin/env python3
"""Saját ötlet – referenciaképek: típus- és méretellenőrzés, újrakódolás, privát tárolás, admin-megtekintés,
biztos hozzárendelés, hiba esetén semmi nem mentődik, törlés és megőrzési idő. Futtatás: python3 tests/upload_test.py"""
import json, os, shutil, struct, subprocess, sys, tempfile, time, uuid, zlib, urllib.request, urllib.error, http.cookiejar, sqlite3
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8798; BASE = f'http://127.0.0.1:{PORT}/api'
PW = 'teszt-' + uuid.uuid4().hex
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)

def png(w=60, h=40, rgb=(200, 150, 60)):
    raw = b''.join(b'\x00' + bytes(rgb) * w for _ in range(h))
    def ch(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')

def multipart(payload, files):
    b = uuid.uuid4().hex; out = b''
    out += f'--{b}\r\nContent-Disposition: form-data; name="payload"\r\n\r\n'.encode() + json.dumps(payload).encode() + b'\r\n'
    for name, data, ctype in files:
        out += f'--{b}\r\nContent-Disposition: form-data; name="images[]"; filename="{name}"\r\nContent-Type: {ctype}\r\n\r\n'.encode() + data + b'\r\n'
    out += f'--{b}--\r\n'.encode()
    return out, {'Content-Type': f'multipart/form-data; boundary={b}'}

class C:
    def __init__(self, ip=None):
        self.jar = http.cookiejar.CookieJar(); self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar)); self.csrf = None
    def req(self, m, p, body=None, headers=None):
        h = dict(headers or {})
        if self.csrf: h['X-CSRF-Token'] = self.csrf
        r = urllib.request.Request(BASE + p, data=body, method=m, headers=h)
        try:
            with self.op.open(r, timeout=20) as res: return res.status, res.read(), res.headers
        except urllib.error.HTTPError as e: return e.code, e.read(), e.headers
    def j(self, m, p, data=None, raw=None, headers=None):
        if data is not None: raw = json.dumps(data).encode(); headers = {'Content-Type': 'application/json'}
        s, b, h = self.req(m, p, raw, headers)
        try: return s, json.loads(b or b'{}')
        except Exception: return s, {}

def main():
    data = tempfile.mkdtemp(prefix='kg-upl-')
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW)
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, check=True, capture_output=True)
    srv = subprocess.Popen(['php', '-d', 'upload_max_filesize=10M', '-d', 'post_max_size=40M', '-S', f'127.0.0.1:{PORT}', '-t', ROOT + '/public', ROOT + '/public/index.php'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(BASE + '/health', timeout=1); break
        except Exception: time.sleep(0.1)
    db = lambda: sqlite3.connect(os.path.join(data, 'kg.sqlite'))
    count = lambda: db().execute('SELECT COUNT(*) FROM inquiry').fetchone()[0]
    files_on_disk = lambda: sum(len(fs) for _, _, fs in os.walk(os.path.join(data, 'inquiry-files')))
    try:
        a = C(); s, d = a.j('POST', '/login', {'password': PW}); a.csrf = d['csrf']
        P = {'name': 'Kép Kata', 'phone': '+36 30 222 3333', 'type': 'egyedi', 'message': 'Ilyet szeretnék'}

        print('Hibás képek: semmi nem mentődik, érthető hiba')
        v = C()
        b, h = multipart(P, [('rossz.php', b'<?php echo 1;', 'image/jpeg')])
        s, d = v.j('POST', '/inquiry', raw=b, headers=h)
        check('álcázott nem-kép: 415, a fájl nevével', s == 415 and 'rossz.php' in d.get('error', '') and 'JPG, PNG vagy WebP' in d.get('error', ''), (s, d))
        b, h = multipart(P, [('a.gif', b'GIF89a\x01\x00\x01\x00\x00\x00\x00;', 'image/gif')])
        s, d = v.j('POST', '/inquiry', raw=b, headers=h); check('GIF: 415', s == 415, s)
        b, h = multipart(P, [(f'k{i}.png', png(), 'image/png') for i in range(4)])
        s, d = v.j('POST', '/inquiry', raw=b, headers=h); check('4 kép: 422 („legfeljebb 3”)', s == 422 and 'Legfeljebb 3' in d.get('error', ''), (s, d))
        big = png(10, 10) + b'\x00' * 8_100_000
        b, h = multipart(P, [('nagy.png', big, 'image/png')])
        s, d = v.j('POST', '/inquiry', raw=b, headers=h); check('8 MB feletti kép: 413, a fájl nevével', s == 413 and 'nagy.png' in d.get('error', ''), (s, d))
        check('egyik hibás kérés után sincs mentett érdeklődés vagy fájl', count() == 0 and files_on_disk() == 0, (count(), files_on_disk()))

        print('Sikeres feltöltés: privát tárolás, hozzárendelés')
        b, h = multipart(P, [('gyuru-otlet.png', png(3000, 1500), 'image/png'), ('rajz.png', png(80, 80, (10, 10, 10)), 'image/png')])
        s, d = v.j('POST', '/inquiry', raw=b, headers=h)
        check('2 képes érdeklődés: 201', s == 201 and d.get('ok'), (s, d))
        iid = d.get('id')
        s, d = a.j('GET', '/inquiries'); q = d['inquiries'][0]
        check('az érdeklődéshez 2 fájl tartozik, számmal együtt', q['images'] == 2 and len(q['files']) == 2 and q['id'] == f's{iid}', q.get('files'))
        f0 = q['files'][0]
        check('újrakódolva: JPEG, a hosszabbik oldal legfeljebb 2000 px', f0['file'].endswith('.jpg') and max(f0['w'], f0['h']) == 2000, f0)
        check('a fájlnév véletlen, nem az eredeti (az eredeti csak megjegyzés)', 'gyuru' not in f0['file'] and f0['orig'] == 'gyuru-otlet.png')
        path = os.path.join(data, 'inquiry-files', str(iid), f0['file'])
        check('a fájl az adatmappában, érdeklődésenként külön mappában', os.path.isfile(path))
        check('a fájl a webgyökérből (public/) nem érhető el', not any('inquiry-files' in r for r, _, _ in os.walk(os.path.join(ROOT, 'public'))))
        check('az adatbázisban nincs kép (csak hivatkozás)', db().execute('SELECT MAX(LENGTH(body)) FROM inquiry').fetchone()[0] < 5000)

        print('Megtekintés: csak admin')
        url = f"/inquiry-file/s{iid}/{f0['file']}"
        s, body, hd = a.req('GET', url)
        check('admin megnyithatja: JPEG, gyorsítótárazás nélkül', s == 200 and body[:3] == b'\xff\xd8\xff' and 'no-store' in hd.get('Cache-Control', '') and hd.get('Content-Type') == 'image/jpeg', (s, hd.get('Cache-Control')))
        s, body, hd = C().req('GET', url); check('látogató nem nyithatja meg (401)', s == 401, s)
        s, body, hd = C().req('GET', f"/photo/{f0['file']}"); check('a nyilvános fotóvégponton sem érhető el', s == 404 or body[:3] != b'\xff\xd8\xff', s)
        s, body, hd = a.req('GET', f"/inquiry-file/s{iid}/../kg.sqlite"); check('útvonal-trükk nem működik', s in (400, 401, 404) and b'SQLite' not in body, s)
        s, body, hd = a.req('GET', f"/inquiry-file/s{int(iid) + 99}/{f0['file']}"); check('másik érdeklődés azonosítójával nem nyílik meg', s == 404, s)
        s, d = C().j('GET', '/state'); check('nyilvános állapotban nincs nyoma a képnek', f0['file'] not in json.dumps(d))

        print('Törlés és megőrzési idő')
        s, d = C().j('POST', '/inquiry-delete', {'id': f's{iid}'}); check('látogató nem törölhet (401)', s == 401, s)
        s, d = a.j('POST', '/inquiry-delete', {'id': f's{iid}'})
        check('admin törlés: érdeklődés és fájlok eltűnnek', s == 200 and count() == 0 and not os.path.exists(os.path.join(data, 'inquiry-files', str(iid))), (s, count()))
        b, h = multipart(P, [('x.png', png(), 'image/png')]); s, d = C().j('POST', '/inquiry', raw=b, headers=h); old_id = d['id']
        b, h = multipart(P, [('y.png', png(), 'image/png')]); s, d = C().j('POST', '/inquiry', raw=b, headers=h); new_id = d['id']
        con = db(); con.execute("UPDATE inquiry SET created_at = '2020-01-01T00:00:00+00:00', status = 'lezarva' WHERE id = ?", (old_id,)); con.commit()
        r = subprocess.run(['php', ROOT + '/bin/purge.php', '365'], env=env, capture_output=True, text=True)
        check('megőrzési idő: a régi, lezárt érdeklődés és képe törölve, az új megmaradt', 'Törölve: 1' in r.stdout and count() == 1 and not os.path.exists(os.path.join(data, 'inquiry-files', str(old_id))) and os.path.exists(os.path.join(data, 'inquiry-files', str(new_id))), r.stdout + r.stderr)
        r = subprocess.run(['php', ROOT + '/bin/purge.php', '0'], env=env, capture_output=True, text=True)
        check('megőrzési idő nélkül a törlő nem fut', r.returncode != 0 and count() == 1)
    finally:
        srv.terminate(); shutil.rmtree(data, ignore_errors=True)
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

main()
