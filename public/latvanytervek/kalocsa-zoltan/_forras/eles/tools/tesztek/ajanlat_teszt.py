"""Kalocsa GeoWorks – a 2027-es ajánlatkérő végpont (ajanlat.php) helyi tesztje. ÉLES SZERVERT NEM ÉR EL, LEVELET NEM KÜLD.

Ideiglenes mappában helyi PHP-szervert indít, a PHPMailer helyett csonkot használ (a „levél” fájlba íródik),
kitalált tesztadatokkal. A végén mindent töröl.
Használat:  python -X utf8 -I tools/tesztek/ajanlat_teszt.py <backend-mappa>
  pl.       python -X utf8 -I tools/tesztek/ajanlat_teszt.py eles-src/public/latvanytervek/kalocsa-zoltan/_forras/backend
Feltétel: php (8.1+) a PATH-ban. Kilépési kód: 0 = minden rendben, 1 = hiba.
"""
import io, json, os, shutil, socket, subprocess, sys, tempfile, time, urllib.error, urllib.request, uuid

SRC = sys.argv[1]
PORT = 8790 + os.getpid() % 9
URL = f'http://127.0.0.1:{PORT}/api/ajanlat.php'
T = tempfile.mkdtemp(prefix='kgw-ajanlat-')
P = os.path.join(T, '_private')
hibak, db = [], 0

STUB = r'''<?php
// TESZT-CSONK: a PHPMailer helyett a levelet fájlba írja (valódi küldés nincs). Ha létezik a smtp-hiba fájl, kivételt dob.
namespace PHPMailer\PHPMailer;
class PHPMailer {
  const ENCRYPTION_SMTPS = 'ssl';
  public $Host, $SMTPAuth, $Username, $Password, $SMTPSecure, $Port, $CharSet, $Subject, $Body;
  private $to = [], $reply, $att = [];
  public function __construct($e = false) {}
  public function isSMTP() {}
  public function setFrom($a, $n = '') {}
  public function addAddress($a) { $this->to[] = $a; }
  public function addReplyTo($a, $n = '') { $this->reply = $a; }
  public function addAttachment($p, $n) { $this->att[] = $n . ':' . filesize($p); }
  public function send() {
    if (file_exists(__DIR__ . '/smtp-hiba')) throw new \Exception('SMTP connect() failed');
    file_put_contents(__DIR__ . '/sent.txt', json_encode(['to' => $this->to, 'reply' => $this->reply, 'subject' => $this->Subject, 'body' => $this->Body, 'att' => $this->att], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
    return true;
  }
}
'''
CONFIG = r'''<?php return ['autoload' => __DIR__ . '/stub-autoload.php', 'allowed_origins' => ['https://kalocsageoworks.com'],
  'to' => 'teszt@example.invalid', 'from' => 'weboldal@example.invalid', 'smtp_host' => 'x', 'smtp_port' => 465, 'smtp_user' => 'x', 'smtp_pass' => 'x',
  'salt' => 'teszt-salt', 'ratelimit_dir' => __DIR__ . '/rl', 'stats_dir' => __DIR__ . '/stats', 'trusted_proxies' => []];
'''


def ok(f, msg):
    global db
    db += 1
    print(('  OK   ' if f else '  HIBA ') + msg)
    if not f:
        hibak.append(msg)


def keres(fields=(), files=(), origin='https://kalocsageoworks.com', method='POST', raw=None, ctype=None):
    b = uuid.uuid4().hex
    if raw is None:
        out = io.BytesIO()
        for k, v in fields:
            out.write(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        for k, name, ct, data in files:
            out.write(f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{name}"\r\nContent-Type: {ct}\r\n\r\n'.encode() + data + b'\r\n')
        out.write(f'--{b}--\r\n'.encode())
        raw, ctype = out.getvalue(), f'multipart/form-data; boundary={b}'
    h = {'Content-Type': ctype} if ctype else {}
    if origin:
        h['Origin'] = origin
    req = urllib.request.Request(URL, data=raw if method == 'POST' else None, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            code, body = r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        code, body = e.code, e.read().decode('utf-8', 'replace')
    try:
        js = json.loads(body)
    except ValueError:
        js = None
    return code, js, body


def levelek():
    f = os.path.join(P, 'sent.txt')
    return [json.loads(l) for l in open(f, encoding='utf-8')] if os.path.exists(f) else []


def tiszta():
    for x in ('rl', 'sent.txt', 'smtp-hiba'):
        p = os.path.join(P, x)
        shutil.rmtree(p) if os.path.isdir(p) else (os.remove(p) if os.path.exists(p) else None)


JPG = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00' + b'\x00' * 2000 + b'\xff\xd9'
ALAP = [('nev', 'Teszt Elek'), ('telefon', '+36 70 123 4567'), ('helyszin', 'Kecskemét, Hetényegyháza'),
        ('leiras', 'Alapásás egy kisebb telken – próba.'), ('adatkezeles', 'on'), ('kitoltesi_ido_ms', '9000')]
def csere(alap, **kw):
    """Az alapmezők másolata: kw felülír, None érték törli a mezőt."""
    out = [(k, kw[k] if k in kw else v) for k, v in alap if not (k in kw and kw[k] is None)]
    return out + [(k, v) for k, v in kw.items() if v is not None and k not in dict(alap)]

os.makedirs(os.path.join(T, 'api')); os.makedirs(P)
for f in ('ajanlat.php', 'meres-lib.php'):
    shutil.copy(os.path.join(SRC, f), os.path.join(T, 'api', f))
open(os.path.join(P, 'stub-autoload.php'), 'w', encoding='utf-8').write(STUB)
open(os.path.join(P, 'ajanlat-config.php'), 'w', encoding='utf-8').write(CONFIG)
lint = subprocess.run(['php', '-l', os.path.join(T, 'api', 'ajanlat.php')], capture_output=True, text=True)
# tipikus tárhely-korlátok: 10 MB / fájl, 50 MB / kérés (így a 8 MB-os saját korlátot az ajanlat.php ellenőrzi)
srv = subprocess.Popen(['php', '-d', 'upload_max_filesize=10M', '-d', 'post_max_size=50M', '-d', 'display_errors=0', '-S', f'127.0.0.1:{PORT}', '-t', T],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try:
            socket.create_connection(('127.0.0.1', PORT), timeout=.2).close(); break
        except OSError:
            time.sleep(.1)
    print(f'Ajánlatkérő végpont – helyi teszt – {SRC} – {time.strftime("%Y-%m-%d %H:%M:%S")}')
    ok('No syntax errors' in lint.stdout, 'php -l: nincs szintaktikai hiba')

    print('\n[1] Kérés-szintű védelem')
    tiszta(); c, js, _ = keres(method='GET'); ok(c == 405 and js == {'ok': False, 'error': 'method'}, f'GET → 405 JSON ({c} {js})')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás')], origin='https://tamado.example'); ok(c == 403 and js and js['error'] == 'origin', f'idegen Origin → 403 ({c})')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás'), ('weboldal', 'http://spam')]); ok(c == 200 and js == {'ok': True} and not levelek(), f'honeypot → csendes ok, levél nincs ({c})')
    tiszta(); c, js, _ = keres(csere(ALAP, kitoltesi_ido_ms='800') + [('munka[]', 'Alapásás')]); ok(c == 400 and js['error'] == 'too-fast', f'túl gyors kitöltés → 400 ({c})')
    tiszta(); c, js, _ = keres(raw=b'{"nev":"Teszt","telefon":"06701234567"}', ctype='application/json'); ok(c in (400, 422) and js is not None and not js['ok'], f'JSON-törzs → tiszta JSON-elutasítás ({c} {js})')
    tiszta(); c, js, _ = keres(raw=b'--x\r\nhibas', ctype='multipart/form-data; boundary=x'); ok(c in (400, 422) and js is not None and not js['ok'], f'sérült multipart → tiszta JSON-elutasítás ({c})')

    print('\n[2] Mezőellenőrzés')
    tiszta(); c, js, _ = keres([('kitoltesi_ido_ms', '9000')]); ok(c == 422 and set(js['fields']) >= {'nev', 'telefon', 'helyszin', 'munka', 'leiras', 'adatkezeles'}, f'üres űrlap → 422 minden kötelező mezővel ({js and js.get("fields")})')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás'), ('email', 'nem-email')]); ok(c == 422 and js['fields'] == ['email'], f'érvénytelen e-mail → 422 email ({js and js.get("fields")})')
    for t in ('123', '+1 555 123 4567', '06 70 123 45678 9'):
        tiszta(); c, js, _ = keres(csere(ALAP, telefon=t) + [('munka[]', 'Alapásás')]); ok(c == 422 and js['fields'] == ['telefon'], f'hibás telefonszám ({t}) → 422 ({js and js.get("fields")})')
    for t in ('06701234567', '+36 (70) 123-4567', '36 1 234 5678'):
        tiszta(); c, js, _ = keres(csere(ALAP, telefon=t) + [('munka[]', 'Alapásás')]); ok(c == 200, f'helyes telefonszám ({t}) → 200 ({c})')
    tiszta(); c, js, _ = keres(csere(ALAP, adatkezeles=None) + [('munka[]', 'Alapásás')]); ok(c == 422 and js['fields'] == ['adatkezeles'], f'adatkezelés nincs bejelölve → 422 ({js and js.get("fields")})')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Nem létező munka')]); ok(c == 422 and js['fields'] == ['munka'], f'ismeretlen munkatípus → 422 ({js and js.get("fields")})')

    print('\n[3] Sikeres küldés és a levél tartalma')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás'), ('munka[]', 'Tuskóeltávolítás'), ('email', 'valaki@example.com'), ('mikor', 'jövő hét')], files=[('fotok[]', 'IMG_0001.jpg', 'image/jpeg', JPG)])
    L = levelek()
    ok(c == 200 and js == {'ok': True} and len(L) == 1, f'sikeres küldés → 200 {{"ok":true}}, pontosan 1 levél ({c}, {len(L)})')
    if L:
        m = L[0]
        ok('Alapásás, Tuskóeltávolítás' in m['body'] and 'Alapásás, Tuskóeltávolítás' in m['subject'], 'több munkatípus: mindkettő megérkezik (PR #15)')
        ok(m['reply'] == 'valaki@example.com' and m['att'] == [f'foto-1.jpg:{len(JPG)}'], f'Reply-To a látogató, csatolmány átnevezve ({m["reply"]}, {m["att"]})')
    ok(os.path.exists(os.path.join(P, 'stats', 'szamlalo.json')), 'sikeres küldés számlálva (statisztika)')
    tiszta(); c, js, _ = keres(ALAP + [('munka', 'Alapásás')]); ok(c == 200, f'régi kliens (munka egyszeres mezőként) is elfogadva ({c})')

    print('\n[4] Befecskendezés, tartalom-megőrzés')
    tiszta(); c, js, _ = keres(csere(ALAP, helyszin='Kecskemét\r\nBcc: tamado@example.com') + [('munka[]', 'Alapásás')]); L = levelek()
    ok(c == 200 and L and '\n' not in L[0]['subject'] and '\r' not in L[0]['subject'], f'fejléc-befecskendezés hatástalan (tárgy: {L and L[0]["subject"]!r})')
    tiszta(); c, js, _ = keres(csere(ALAP, nev='<script>alert(1)</script>Béla') + [('munka[]', 'Alapásás')]); L = levelek()
    ok(c == 200 and L and '<script>' not in L[0]['body'], 'HTML-címke a névben nem kerül a levélbe')
    szoveg = 'Árok mélysége <1 m, szélessége 40 cm; a kapu > 1,2 m. Köszönöm!'
    tiszta(); c, js, _ = keres(csere(ALAP, leiras=szoveg) + [('munka[]', 'Alapásás')]); L = levelek()
    ok(c == 200 and L and szoveg in L[0]['body'], f'a leírás „<” és „>” jelekkel is csonkítatlanul megérkezik ({L and L[0]["body"].splitlines()[-1]!r})')

    print('\n[5] Fotók')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás')], files=[('fotok[]', 'x.jpg', 'image/jpeg', b'%PDF-1.4 nem kep')]); ok(c == 415 and js['error'] == 'file-type' and not levelek(), f'hamis kép (PDF .jpg néven) → 415, levél nincs ({c})')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás')], files=[('fotok[]', 'nagy.jpg', 'image/jpeg', JPG[:-2] + b'\x00' * (8 * 1024 * 1024 + 10) + b'\xff\xd9')]); ok(c == 413 and js['error'] == 'file-size' and not levelek(), f'8 MB feletti kép → 413, levél nincs ({c})')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás')], files=[('fotok[]', 'oriás.jpg', 'image/jpeg', JPG[:-2] + b'\x00' * (11 * 1024 * 1024) + b'\xff\xd9')]); L = levelek()
    ok(c == 413 and not L, f'a tárhely feltöltési korlátját (10 MB) meghaladó kép → 413, nem vész el csendben ({c}, levél: {len(L)})')
    tiszta(); c, js, _ = keres(ALAP + [('munka[]', 'Alapásás')], files=[('fotok[]', f'k{i}.jpg', 'image/jpeg', JPG) for i in range(7)]); L = levelek()
    ok(c == 200 and L and len(L[0]['att']) == 5, f'7 kép → legfeljebb 5 kerül a levélbe ({L and len(L[0]["att"])})')

    print('\n[6] SMTP-hiba, túlterhelés')
    tiszta(); open(os.path.join(P, 'smtp-hiba'), 'w').close()
    c, js, body = keres(ALAP + [('munka[]', 'Alapásás')]); ok(c == 502 and js == {'ok': False, 'error': 'mail'}, f'SMTP-hiba → 502 tiszta JSON, nincs hamis siker ({c} {body[:60]})')
    tiszta(); kodok = [keres(ALAP + [('munka[]', 'Alapásás')])[0] for _ in range(6)]
    ok(kodok == [200] * 5 + [429], f'6. kérés egy órán belül → 429 ({kodok})')
    ok(not any(os.path.basename(f).startswith(('Teszt', '127')) for f in os.listdir(os.path.join(P, 'rl'))), 'a túlterhelés-védelem csak hash-t tárol (IP/név nincs a fájlnévben)')
finally:
    srv.terminate(); srv.wait(timeout=10)
    shutil.rmtree(T, ignore_errors=True)

print(f'\nÖsszesen {db} ellenőrzés, {len(hibak)} hiba.')
for x in hibak:
    print('  - ' + x)
sys.exit(1 if hibak else 0)
