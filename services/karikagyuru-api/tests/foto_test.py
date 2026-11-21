#!/usr/bin/env python3
"""V5.6 – a fotóellenőrző/letöltő eszköz próbája helyi álszerverrel (valódi karikagyuru.com-ot nem ér el).
A weboldalmappáról ideiglenes másolat készül, az eredeti fájlokat a teszt nem módosítja."""
import http.server, json, os, shutil, subprocess, sys, tempfile, threading
from io import BytesIO
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
SITE = os.path.join(ROOT, 'public/latvanytervek/karikagyuru')
TOOL = os.path.join(ROOT, 'services/karikagyuru-api/dev/foto-ellenorzes.mjs')
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('  ok  ', name)
    else: fail += 1; print('  HIBA', name, extra)

# Álszerver: 2 fájl valódi kép (különböző formátum), 1 nem kép, 1 sérült, a többi 404.
def jpeg(w, h, fmt='JPEG'):
    b = BytesIO(); Image.new('RGB', (w, h), (200, 190, 170)).save(b, fmt); return b.getvalue()
FILES = {
    'karikagyuru_maz_93610_93611_n.jpg': ('image/jpeg', jpeg(2400, 1800)),
    'karikagyuru_maz_93630_93631_n.jpg': ('image/png', jpeg(600, 600, 'PNG')),
    'karikagyuru_maz_93630_93631_wr_n.jpg': ('text/html', b'<html>nem kep</html>'),
}
BROKEN = 'karikagyuru_maz_81204_wy_n.jpg'
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        name = self.path.rsplit('/', 1)[-1]
        if name in FILES:
            t, b = FILES[name]; self.send_response(200); self.send_header('Content-Type', t); self.end_headers(); self.wfile.write(b)
        elif name == BROKEN:
            self.send_response(200); self.send_header('Content-Type', 'image/jpeg'); self.end_headers(); self.wfile.write(b'\xff\xd8 rossz')
        else: self.send_response(404); self.end_headers()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()

tmp = tempfile.mkdtemp(prefix='kg-foto-')
site = os.path.join(tmp, 'site'); shutil.copytree(SITE, site, ignore=shutil.ignore_patterns('tests', '__pycache__'))
# Egy helyi kép kártyaméretét eltávolítjuk → törött útvonalként kell jelentenie.
first_local = sorted(f for f in os.listdir(os.path.join(site, 'img/termekek')) if f.endswith('-800.jpg'))[0]
os.remove(os.path.join(site, 'img/termekek', first_local))
open(os.path.join(site, 'js/photos.js'), 'w').write('export const LOCAL_FILES = [];\n')
env = dict(os.environ, KG_SITE=site, KG_FOTO_FORRAS=f'http://127.0.0.1:{srv.server_port}/')
try:
    print('Fotóellenőrzés és letöltés (álszerver)')
    r = subprocess.run(['node', TOOL], env=env, capture_output=True, text=True, timeout=300)
    rep = json.load(open(os.path.join(site, 'docs/KATALOGUS_JELENTES.json')))
    check('a jelentés mind a 115 terméket tartalmazza', rep['osszes_termek'] == 115 and len(rep['termekek']) == 115, rep['osszes_termek'])
    check('mind a 115 látható a katalógusban', rep['katalogusban_lathato'] == 115)
    check('2 valódi kép letöltve', rep['most_letoltve'] == 2, rep['most_letoltve'])
    check('helyi = 30 eredeti + 2 letöltött', rep['helyi_foto'] == 31 and len(rep['torott_utvonal']) == 1, (rep['helyi_foto'], rep['torott_utvonal']))
    check('törött útvonal jelentve (hiányzó kártyakép)', rep['torott_utvonal'][0]['reason'].startswith('hiányzik vagy sérült a kártyakép') if rep['torott_utvonal'] else False)
    check('hibás kilépési kód törött útvonalnál', r.returncode == 1, r.returncode)
    errs = {x['url'].rsplit('/', 1)[-1]: x['error'] for x in rep['sikertelen_letoltes']}
    check('nem kép → sikertelen, „nem kép”', errs.get('karikagyuru_maz_93630_93631_wr_n.jpg', '').startswith('nem kép'), errs.get('karikagyuru_maz_93630_93631_wr_n.jpg'))
    check('sérült kép → sikertelen', errs.get(BROKEN) == 'sérült képfájl', errs.get(BROKEN))
    check('404 → sikertelen, HTTP 404', any(v == 'HTTP 404' for v in errs.values()))
    check('összeg stimmel (helyi + külső + hiányzó + törött = 115)', rep['helyi_foto'] + rep['kulso_foto'] + rep['hianyzo_foto'] + len(rep['torott_utvonal']) == 115)
    for name, w in [('karikagyuru_maz_93610_93611_n.jpg', 1600), ('karikagyuru_maz_93630_93631_n.jpg', 600)]:
        big = Image.open(os.path.join(site, 'img/termekek', name)); card = Image.open(os.path.join(site, 'img/termekek', name.replace('.jpg', '-800.jpg')))
        check(f'{name}: JPEG, termékoldal {w}px-ig, kártya ≤800px', big.format == 'JPEG' and big.width == w and card.format == 'JPEG' and card.width <= 800, (big.format, big.width, card.width))
    pj = open(os.path.join(site, 'js/photos.js')).read()
    check('photos.js: a letöltött fájlok szerepelnek, a sikertelenek nem', 'karikagyuru_maz_93610_93611_n.jpg' in pj and 'karikagyuru_maz_93630_93631_wr_n.jpg' not in pj)
    out = subprocess.run(['node', '--input-type=module', '-e',
        f"import {{buildDemoProducts}} from '{site}/js/data.js'; const p=buildDemoProducts(); console.log(JSON.stringify(p.filter(x=>/93610_93611_n|93630_93631_wr_n/.test(x.img)).map(x=>x.img)))"],
        capture_output=True, text=True)
    imgs = json.loads(out.stdout)
    check('a weboldal a letöltött képet helyből, a többit a régi címről tölti', any(i.startswith('img/termekek/') for i in imgs) and any(i.startswith('https://') for i in imgs), imgs)
    md = open(os.path.join(site, 'docs/KATALOGUS_JELENTES.md')).read()
    check('olvasható jelentés is készül', '| Összes termék | 115 |' in md and 'Sikertelen letöltés' in md)
    check('az eredeti weboldalmappa nem változott (photos.js)', 'karikagyuru_maz_93610' not in open(os.path.join(SITE, 'js/photos.js')).read())
finally:
    srv.shutdown(); shutil.rmtree(tmp, ignore_errors=True)
print(f'\n{ok}/{ok + fail} sikeres'); sys.exit(1 if fail else 0)
