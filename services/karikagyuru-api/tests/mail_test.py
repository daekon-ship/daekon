#!/usr/bin/env python3
"""E-mail-értesítés tesztje – valódi levél NEM megy ki. Kikapcsolt mód, fájlba írás, SMTP egy helyi álszerverre,
elérhetetlen SMTP (az érdeklődés megmarad), hiányos és nem biztonságos beállítás, fejlécinjekció, admin-végpontok.
Futtatás: python3 tests/mail_test.py"""
import base64, json, os, shutil, socket, subprocess, sys, tempfile, threading, time, urllib.request, urllib.error, uuid, http.cookiejar, email
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8796; SMTP_PORT = 8797
BASE = f'http://127.0.0.1:{PORT}/api'
PW = 'teszt-' + uuid.uuid4().hex
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, x)

class FakeSMTP(threading.Thread):
    """Minimális SMTP-álszerver: csak rögzíti, amit kap. Nem továbbít semmit."""
    def __init__(self):
        super().__init__(daemon=True); self.msgs = []; self.auth = []
        self.sock = socket.socket(); self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind(('127.0.0.1', SMTP_PORT)); self.sock.listen(5)
    def run(self):
        while True:
            try: c, _ = self.sock.accept()
            except OSError: return
            f = c.makefile('rb'); w = lambda s: c.sendall(s.encode() + b'\r\n')
            w('220 alszerver'); state = None; data = []; rcpt = []
            while True:
                line = f.readline()
                if not line: break
                t = line.decode(errors='replace').rstrip('\r\n')
                if state == 'data':
                    if t == '.': self.msgs.append({'rcpt': rcpt, 'raw': '\r\n'.join(data)}); data = []; state = None; w('250 OK')
                    else: data.append(t)
                    continue
                if state in ('u', 'p'): self.auth.append(base64.b64decode(t).decode()); w('334 UGFzc3dvcmQ6' if state == 'u' else '235 OK'); state = 'p' if state == 'u' else None; continue
                u = t.upper()
                if u.startswith('EHLO'): c.sendall(b'250-alszerver\r\n250 AUTH LOGIN\r\n')
                elif u == 'AUTH LOGIN': state = 'u'; w('334 VXNlcm5hbWU6')
                elif u.startswith('MAIL FROM'): w('250 OK')
                elif u.startswith('RCPT TO'): rcpt.append(t); w('250 OK')
                elif u == 'DATA': state = 'data'; w('354 tovabb')
                elif u == 'QUIT': w('221 viszlat'); break
                else: w('500 ?')
            c.close()

class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar(); self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar)); self.csrf = None
    def j(self, m, p, data=None):
        h = {'Content-Type': 'application/json'}
        if self.csrf: h['X-CSRF-Token'] = self.csrf
        r = urllib.request.Request(BASE + p, data=None if data is None else json.dumps(data).encode(), method=m, headers=h)
        try:
            with self.op.open(r, timeout=20) as res: return res.status, json.loads(res.read() or b'{}')
        except urllib.error.HTTPError as e:
            try: return e.code, json.loads(e.read() or b'{}')
            except Exception: return e.code, {}

def main():
    data = tempfile.mkdtemp(prefix='kg-mail-'); cfg = os.path.join(data, 'mail.json')
    setcfg = lambda c: open(cfg, 'w').write(json.dumps(c)) if c is not None else (os.path.exists(cfg) and os.remove(cfg))
    env = dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW)
    for k in list(env): 
        if k.startswith('KG_MAIL_'): del env[k]
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=env, check=True, capture_output=True)
    smtp = FakeSMTP(); smtp.start()
    srv = subprocess.Popen(['php', '-S', f'127.0.0.1:{PORT}', '-t', ROOT + '/public', ROOT + '/public/index.php'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try: urllib.request.urlopen(BASE + '/health', timeout=1); break
        except Exception: time.sleep(0.1)
    try:
        a = Client(); s, d = a.j('POST', '/login', {'password': PW}); a.csrf = d.get('csrf')
        n = [0]
        def inquire(name='Levél Lenke', **kw):
            n[0] += 1
            v = Client()
            return v.j('POST', '/inquiry', dict({'name': name, 'phone': f'+36 30 000 {n[0]:04d}', 'type': 'erdeklodes', 'code': '81194 - 81195 W', 'message': 'Szia!'}, **kw))
        def last():
            s, d = a.j('GET', '/inquiries'); return d['inquiries'][0]

        print('Kikapcsolt mód (alapértelmezett)')
        setcfg(None)
        s, d = inquire(); q = last()
        check('érdeklődés mentve, értesítés „off”', s == 201 and q['notify'] == 'off', q.get('notify'))
        check('nem jött létre levél (outbox nincs, álszerver üres)', not os.path.exists(os.path.join(data, 'outbox')) and not smtp.msgs)

        print('Fájlba írás (fejlesztéshez)')
        setcfg({'mode': 'file', 'to': 'ertesites@example.invalid', 'from': 'web@example.invalid'})
        s, d = inquire(name='Injekció\r\nBcc: tamado@example.invalid')
        files = sorted(os.listdir(os.path.join(data, 'outbox'))) if os.path.exists(os.path.join(data, 'outbox')) else []
        check('levél fájlba írva, értesítés „fajlba”', s == 201 and len(files) == 1 and last()['notify'] == 'fajlba', files)
        msg = email.message_from_bytes(open(os.path.join(data, 'outbox', files[0]), 'rb').read()) if files else None
        body = msg.get_payload(decode=True).decode() if msg else ''
        check('fejlécek: címzett a beállított, nincs befecskendezett Bcc', msg and msg['To'] == 'ertesites@example.invalid' and msg['Bcc'] is None and 'Bcc' not in ''.join(f'{k}:{v}' for k, v in msg.items()))
        subj = str(email.header.make_header(email.header.decode_header(msg['Subject']))) if msg else ''
        check('tárgy: rögzített szöveg sorszámmal', subj.startswith('Új érdeklődés – karikagyuru.com (#'), subj)
        check('szöveg: név, telefon, gyűrű, üzenet benne van', all(x in body for x in ['Injekció', 'Telefon: +36 30 000', 'Gyűrű: 81194 - 81195 W', 'Szia!']), body[:200])
        check('szöveg: nincs hamis link (KG_SITE_URL nélkül nincs URL)', 'http' not in body)

        print('SMTP – helyi álszerverre (valódi levél nem megy ki)')
        setcfg({'mode': 'smtp', 'to': 'ertesites@example.invalid', 'from': 'web@example.invalid', 'host': '127.0.0.1', 'port': SMTP_PORT, 'secure': 'none', 'user': 'felhasznalo', 'pass': 'jelszo-123'})
        s, d = inquire(name='Smtp Simon')
        time.sleep(0.3)
        check('levél megérkezett az álszerverhez, értesítés „elkuldve”', s == 201 and len(smtp.msgs) == 1 and last()['notify'] == 'elkuldve', (len(smtp.msgs), last().get('notify')))
        m2 = email.message_from_string(smtp.msgs[0]['raw']) if smtp.msgs else None
        check('az álszerver a beállított címzettet kapta', smtp.msgs and 'ertesites@example.invalid' in smtp.msgs[0]['rcpt'][0])
        check('a levél szövege dekódolható, a név benne', m2 and 'Smtp Simon' in m2.get_payload(decode=True).decode())
        check('azonosítás megtörtént (AUTH LOGIN)', smtp.auth == ['felhasznalo', 'jelszo-123'], smtp.auth)
        s, d = a.j('GET', '/mail-status')
        check('admin: e-mail-állapot jelszó és felhasználónév nélkül', s == 200 and d['mail']['ready'] is True and 'jelszo-123' not in json.dumps(d) and 'felhasznalo' not in json.dumps(d) and d['mail']['to'].startswith('e…@'), d)
        v = Client(); s, d = v.j('GET', '/mail-status'); check('látogató nem látja az e-mail-állapotot (401)', s == 401, s)
        s, d = v.j('POST', '/mail-test', {}); check('látogató nem küldhet próbalevelet (401)', s == 401, s)
        a2 = Client(); a2.j('POST', '/login', {'password': PW}); s, d = a2.j('POST', '/mail-test', {}); check('CSRF-jel nélkül nincs próbalevél (403)', s == 403, s)
        s, d = a.j('POST', '/mail-test', {}); time.sleep(0.3)
        check('admin gombnyomásra próbalevél megy (álszerverre)', s == 200 and len(smtp.msgs) == 2, s)

        print('Sikertelen küldés: az érdeklődés megmarad')
        setcfg({'mode': 'smtp', 'to': 'ertesites@example.invalid', 'from': 'web@example.invalid', 'host': '127.0.0.1', 'port': 1, 'secure': 'none', 'timeout': 2})
        s, d = a.j('GET', '/inquiries'); before = len(d['inquiries'])
        s, d = inquire(name='Elakadt Elek')
        q = last()
        check('a látogató sikeres beküldést kap (az üzenete mentve)', s == 201 and d.get('ok'), (s, d))
        check('az érdeklődés megvan, értesítés „hiba”', q['name'] == 'Elakadt Elek' and q['notify'] == 'hiba', q.get('notify'))
        s, d = a.j('GET', '/inquiries'); check('egyetlen érdeklődés sem veszett el', len(d['inquiries']) == before + 1)
        s, d = a.j('POST', '/mail-test', {}); check('próbalevél hibája az adminnak érthető hibaként jön (502)', s == 502 and 'nem érhető el' in d.get('error', ''), d)

        print('Hiányos és nem biztonságos beállítás')
        setcfg({'mode': 'smtp', 'from': 'web@example.invalid', 'host': '127.0.0.1', 'port': SMTP_PORT, 'secure': 'none'})
        k0 = len(smtp.msgs); s, d = inquire(name='Hiányos Hanna')
        check('címzett nélkül nem küld, „hiba”, az érdeklődés megmarad', s == 201 and last()['notify'] == 'hiba' and len(smtp.msgs) == k0)
        setcfg({'mode': 'smtp', 'to': 'ertesites@example.invalid', 'from': 'web@example.invalid', 'host': 'smtp.example.invalid', 'port': 25, 'secure': 'none', 'user': 'u', 'pass': 'p'})
        s, d = a.j('GET', '/mail-status')
        check('titkosítatlan SMTP távoli szerverrel tiltva (jelszó nem menne nyíltan)', d['mail']['ready'] is False and any('secure' in x for x in d['mail']['missing']), d)
        setcfg({'mode': 'valami', 'to': 'x@example.invalid'})
        s, d = a.j('GET', '/mail-status'); check('ismeretlen mód → kikapcsolt', d['mail']['mode'] == 'off')
        check('a webgyökérben nincs mail.json (a beállítás az adatmappában van)', not os.path.exists(os.path.join(ROOT, 'public', 'mail.json')))
    finally:
        srv.terminate(); smtp.sock.close(); shutil.rmtree(data, ignore_errors=True)
    print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)

main()
