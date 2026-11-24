#!/usr/bin/env python3
"""V5.8.1 – biztonsági mentés és visszaállítás: valódi PHP-futtatással, izolált, csak tesztadatokat tartalmazó
ideiglenes adatmappákon. Az éles vagy ügyféladatbázishoz nem nyúl (minden mappa tempfile alatt jön létre).

1. Teszt-adatkészlet a valódi API-n át: gyűrűk, módosított grammár, jóváhagyott gyűrűk, több árverzió, visszaállítás,
   műhelymunka fotóval, termékfotó, ajánlatkérések referenciaképekkel, ügyféljóváhagyási válaszok.
2. Mentés → ellenőrzés → visszaállítás új, üres mappába → a visszaállított rendszer indítása → összevetés → újraindítás.
3. Hibás esetek, valóban előidézve: nem létező / nem írható cél, betelt tárhely (kis tmpfs), megszakított mentés (kill),
   sérült SQLite, hiányzó referenciakép, symlink, webgyökér, adatmappa, azonos név, sikertelen másolás (olvashatatlan fájl,
   nem root felhasználóval), félkész mentés, adatváltozás mentés közben (párhuzamos HTTP-írások).
4. Megőrzés (régi mentések törlése), napló, HTTP-elérhetetlenség.
Rootként fut (tmpfs-csatoláshoz); a jogosultsági próbát a `nobody` felhasználóval végzi."""
import hashlib, http.cookiejar, json, os, shutil, signal, sqlite3, stat, struct, subprocess, sys, tempfile, threading, time, urllib.error, urllib.request, uuid, zlib, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.abspath(os.path.join(ROOT, '..', '..', 'public', 'latvanytervek', 'karikagyuru'))
PW = 'mentes-teszt-jelszo-' + uuid.uuid4().hex[:8]
SECRET_NAMES = ['Mentés Márta', 'Párhuzamos Péter', 'Szöveges Szilvia', '+36 30 555 0101', 'marta@example.invalid']
ok = fail = 0
def check(n, c, x=''):
    global ok, fail
    if c: ok += 1; print('  ok  ', n)
    else: fail += 1; print('  HIBA', n, str(x)[:300])

def png(w=60, h=40, rgb=(200, 150, 60)):
    raw = b''.join(b'\x00' + bytes(rgb) * w for _ in range(h))
    def ch(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b'')

def mp(fields, files):
    b = uuid.uuid4().hex; out = b''
    for k, v in fields.items(): out += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n'.encode() + v.encode() + b'\r\n'
    for field, name, data, ct in files:
        out += f'--{b}\r\nContent-Disposition: form-data; name="{field}"; filename="{name}"\r\nContent-Type: {ct}\r\n\r\n'.encode() + data + b'\r\n'
    return out + f'--{b}--\r\n'.encode(), {'Content-Type': f'multipart/form-data; boundary={b}'}

class C:
    def __init__(self, base):
        self.base = base; self.jar = http.cookiejar.CookieJar(); self.csrf = None
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
    def req(self, m, p, body=None, headers=None, timeout=60):
        h = dict(headers or {})
        if self.csrf: h['X-CSRF-Token'] = self.csrf
        try:
            with self.op.open(urllib.request.Request(self.base + p, data=body, method=m, headers=h), timeout=timeout) as r: return r.status, r.read()
        except urllib.error.HTTPError as e: return e.code, e.read()
    def j(self, m, p, data=None, raw=None, headers=None, timeout=60):
        if data is not None: raw = json.dumps(data).encode(); headers = {'Content-Type': 'application/json'}
        s, b = self.req(m, p, raw, headers, timeout)
        try: return s, json.loads(b or b'{}')
        except Exception: return s, {}
    def login(self):
        s, d = self.j('POST', '/login', {'password': PW}); self.csrf = d.get('csrf'); return s

class Srv:
    def __init__(self, data, port, env=None, router=False):
        self.port = port; self.base = f'http://127.0.0.1:{port}' + ('/api' if router else '')
        e = dict(os.environ, KG_DATA=data, **(env or {}))
        cmd = ['php', '-d', 'upload_max_filesize=10M', '-d', 'post_max_size=40M', '-S', f'127.0.0.1:{port}']
        cmd += [ROOT + '/dev/router.php'] if router else ['-t', ROOT + '/public', ROOT + '/public/index.php']
        if router: e['KG_SITE'] = SITE
        self.p = subprocess.Popen(cmd, env=e, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(80):
            try: urllib.request.urlopen(self.base + '/health', timeout=1); break
            except Exception: time.sleep(0.1)
    def stop(self):
        self.p.terminate(); self.p.wait(5)

def php(script, args, data, env=None, user=None, root=ROOT, **kw):
    cmd = ['php', f'{root}/bin/{script}', *args]
    if user: cmd = ['setpriv', '--reuid=65534', '--regid=65534', '--clear-groups', *cmd]
    return subprocess.run(cmd, env=dict(os.environ, KG_DATA=data, **(env or {})), capture_output=True, text=True, **kw)

def tree_hashes(d):
    out = {}
    for sub in ('photos', 'inquiry-files'):
        for r, _, fs in os.walk(os.path.join(d, sub)):
            for f in fs:
                p = os.path.join(r, f); out[os.path.relpath(p, d)] = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    return out

def backups(t): return sorted(n for n in os.listdir(t) if n.startswith('kg-mentes-'))
def partials(t): return sorted(n for n in os.listdir(t) if n.endswith('.reszleges'))
def mode(p): return stat.S_IMODE(os.stat(p).st_mode)
def counts(d):
    c = sqlite3.connect(os.path.join(d, 'kg.sqlite'))
    r = (c.execute('SELECT COUNT(*) FROM state_version').fetchone()[0], c.execute('SELECT COUNT(*) FROM inquiry').fetchone()[0]); c.close(); return r
def copydata(src, dst):
    c = sqlite3.connect(os.path.join(src, 'kg.sqlite')); c.execute('PRAGMA wal_checkpoint(TRUNCATE)'); c.close()
    shutil.copytree(src, dst, symlinks=True)

def build_fixture(data, port):
    """Csak tesztadat: a nyilvános bemutató-mintaállapotból (115 gyűrű), „demo” jelölés nélkül, éles módú API-n át."""
    subprocess.run(['php', ROOT + '/bin/setup.php'], env=dict(os.environ, KG_DATA=data, KG_ADMIN_PASSWORD=PW), check=True, capture_output=True)
    srv = Srv(data, port, env={'KG_FEJLESZTOI_VISSZAALLITAS': '1'})   # V5.9: a teljes visszaállítás fejlesztői művelet
    a = C(srv.base); a.login()
    st = json.load(open(ROOT + '/demo/minta-allapot.json', encoding='utf-8'))
    for k in ('demo', 'history', 'inquiries'): st.pop(k, None)
    s, d = a.j('PUT', '/state', {'baseVersion': 0, 'state': st, 'note': 'kiinduló'}); v = d['version']
    b, h = mp({}, [('photo', 'gyuru.png', png(900, 700, (180, 160, 90)), 'image/png')]); s, ph1 = a.j('POST', '/photo', raw=b, headers=h)
    b, h = mp({}, [('photo', 'munka.png', png(800, 600, (90, 120, 160)), 'image/png')]); s, ph2 = a.j('POST', '/photo', raw=b, headers=h)
    st['products'][0]['img'] = ph1['url']
    st['materials']['sellPerGram']['au14'] = 44500
    for p in st['products'][3:6]: p['approved'] = True
    st['works'].append({'id': 'mentes-proba', 'title': 'Mentési próbamunka', 'text': 'Teszt', 'photos': [ph2['url']], 'video': '', 'visible': True})
    s, d = a.j('PUT', '/state', {'baseVersion': v, 'state': st, 'note': 'grammár + jóváhagyás'}); v = d['version']
    # V5.9: a fejlesztői nyilvántartás (ügyféldöntések) csak parancssorból írható
    for args in (['eloleg', 'valasz', 'Teszt: 30%'], ['logo', 'atvezetve', 'Teszt: B']):
        subprocess.run(['php', ROOT + '/bin/fejlesztoi-dontesek.php', 'beallit', *args], env=dict(os.environ, KG_DATA=data), check=True, capture_output=True)
    s, d = a.j('GET', '/versions'); v = d['versions'][0]['version']
    s, d = a.j('POST', '/revert', {'version': 1}); s, d = a.j('POST', '/revert', {'version': v})   # korábbi árverzió vissza, majd előre
    v_inq = C(srv.base)
    for name, imgs in [('Mentés Márta', [png(1200, 900), png(300, 300, (20, 20, 20))]), ('Szöveges Szilvia', [png(500, 400, (220, 40, 40))])]:
        payload = {'name': name, 'phone': '+36 30 555 0101', 'email': 'marta@example.invalid', 'type': 'egyedi', 'message': 'Mentési teszt', 'images': len(imgs)}
        b, h = mp({'payload': json.dumps(payload)}, [('images[]', f'k{i}.png', im, 'image/png') for i, im in enumerate(imgs)])
        v_inq.j('POST', '/inquiry', raw=b, headers=h)
    v_inq.j('POST', '/inquiry', {'name': 'Kép nélküli Kató', 'phone': '+36 30 555 0102', 'type': 'erdeklodes', 'message': 'x'})
    return srv, a, ph1['url'], ph2['url']

def decisions(data):
    return subprocess.run(['php', ROOT + '/bin/fejlesztoi-dontesek.php', 'lista'], env=dict(os.environ, KG_DATA=data), capture_output=True, text=True).stdout

def snapshot(base, admin=True):
    c = C(base)
    if admin: c.login()
    s, st = c.j('GET', '/state'); s, vs = c.j('GET', '/versions'); s, iq = c.j('GET', '/inquiries')
    return c, st, vs, iq

def main():
    tmp = tempfile.mkdtemp(prefix='kg-mentes-teszt-'); os.chmod(tmp, 0o755)
    mounts, servers = [], []
    try:
        data = os.path.join(tmp, 'adat'); T = os.path.join(tmp, 'mentesek'); os.makedirs(T)
        print('Teszt-adatkészlet (csak tesztadat, izolált mappában)')
        srv, a, ph1, ph2 = build_fixture(data, 8851); servers.append(srv)
        _, st0, vs0, iq0 = snapshot(srv.base)
        check('kiinduló adat: 115 gyűrű, 5 jóváhagyott, módosított grammár, műhelymunka, 2 ügyféldöntés',
              len(st0['state']['products']) == 115 and sum(1 for p in st0['state']['products'] if p.get('approved')) == 5
              and st0['state']['materials']['sellPerGram']['au14'] == 44500 and any(w['id'] == 'mentes-proba' for w in st0['state']['works'])
              and 'clientDecisions' not in st0['state']
              and 'Teszt: 30%' in decisions(data) and 'Teszt: B' in decisions(data))
        check('kiinduló adat: 6 változat (2 fejlesztői bejegyzés, visszaállítással), 3 ajánlatkérés, 3 referenciakép', len(vs0['versions']) == 6 and len(iq0['inquiries']) == 3 and sum(len(q.get('files') or []) for q in iq0['inquiries']) == 3,
              (len(vs0['versions']), len(iq0['inquiries'])))
        src_hash = tree_hashes(data)

        print('1. Mentés futó weboldal mellett')
        r = php('mentes.php', [T], data)
        check('mentés: kilépési kód 0, „kész és ellenőrizve”', r.returncode == 0 and 'kész és ellenőrizve' in r.stdout, r.stdout + r.stderr)
        bk = os.path.join(T, backups(T)[0]) if backups(T) else ''
        m = json.load(open(os.path.join(bk, 'manifest.json'))) if bk else {}
        check('a mentésben ugyanannyi fájl, ugyanazzal az ellenőrzőösszeggel, mint a forrásban',
              {k: v['sha256'] for k, v in m.get('files', {}).items() if not k.startswith('config/')} == src_hash, (len(m.get('files', {})), len(src_hash)))
        check('a fájlméretek is egyeznek', all(os.path.getsize(os.path.join(data, k)) == v['bytes'] for k, v in m.get('files', {}).items() if not k.startswith('config/')))
        check('rekordszámok a manifestben = forrás (6 változat, 3 érdeklődés, 115 gyűrű, 5 jóváhagyott, 2 döntés)',
              m.get('db', {}).get('counts') == {'state_version': 6, 'inquiry': 3, 'latest_version': 6, 'products': 115, 'approved': 5, 'works': 5, 'decisions': 2}, m.get('db', {}).get('counts'))
        check('a manifest konzisztens pillanatképet jelez (kizárólagos zár), nincs hiányzó fájl', m.get('consistent') is True and m.get('lock') == 'exclusive' and m.get('missing') == [])
        check('szigorú jogosultságok: mappák 0700, fájlok 0600', mode(bk) == 0o700 and all(mode(os.path.join(r_, f)) == 0o600 for r_, _, fs in os.walk(bk) for f in fs)
              and all(mode(os.path.join(r_, d_)) == 0o700 for r_, ds, _ in os.walk(bk) for d_ in ds))
        r = php('mentes-ellenorzes.php', [bk], data); check('különálló ellenőrzés (mentes-ellenorzes.php): rendben', r.returncode == 0, r.stderr)
        mtxt = open(os.path.join(bk, 'manifest.json'), encoding='utf-8').read()
        check('a manifest nem tartalmaz személyes adatot', not any(x in mtxt for x in SECRET_NAMES))
        check('a beállítások (só) is mentve', 'config/salt' in m.get('files', {}))

        print('2. Teljes visszaállítási próba új, üres adatmappába')
        R = os.path.join(tmp, 'visszaallitott')
        r = php('visszaallitas.php', [bk], R)
        check('visszaállítás: kód 0, minden fájl ellenőrizve', r.returncode == 0 and 'mind ellenőrizve' in r.stdout, r.stdout + r.stderr)
        check('a visszaállított fájlok azonosak a forrással', tree_hashes(R) == src_hash)
        check('visszaállított jogosultságok: adatmappa 0700, fájlok 0600', mode(R) == 0o700 and mode(os.path.join(R, 'kg.sqlite')) == 0o600)
        for attempt in ('indítás', 'újraindítás'):
            s2 = Srv(R, 8852); servers.append(s2)
            c2, st2, vs2, iq2 = snapshot(s2.base)
            check(f'{attempt}: belépés a régi admin jelszóval', c2.csrf is not None)
            check(f'{attempt}: a teljes állapot (árak, 115 gyűrű, jóváhagyások, műhelymunkák, döntések) bájtra egyezik', st2 == st0)
            check(f'{attempt}: a változatok listája egyezik (6)', vs2 == vs0)
            check(f'{attempt}: a fejlesztői nyilvántartás (2 válasz) is visszaállt', 'Teszt: 30%' in decisions(R) and 'Teszt: B' in decisions(R))
            check(f'{attempt}: az érdeklődések egyeznek (3, névvel, állapottal, képlistával)', iq2 == iq0)
            okimg = all(c2.req('GET', '/' + u.split('api/', 1)[1])[1] == open(os.path.join(data, 'photos', u.rsplit('/', 1)[1]), 'rb').read() for u in (ph1, ph2))
            check(f'{attempt}: a termékfotó és a műhelymunka fotója kiszolgálva, azonos tartalommal', okimg)
            anon = C(s2.base); priv_ok = True; anon_block = True
            for q in iq2['inquiries']:
                for f in q.get('files') or []:
                    url = f"/inquiry-file/s{str(q['id']).lstrip('s')}/{f['file']}"
                    s, body = c2.req('GET', url)
                    src = open(os.path.join(data, 'inquiry-files', str(q['id']).lstrip('s'), f['file']), 'rb').read()
                    priv_ok &= s == 200 and body == src
                    s, body = anon.req('GET', url); anon_block &= s == 401 and body != src
            check(f'{attempt}: a referenciaképek adminnak azonos tartalommal elérhetők', priv_ok)
            check(f'{attempt}: a referenciaképek belépés nélkül továbbra is tiltottak (401)', anon_block)
            s, pub = anon.req('GET', '/state')
            check(f'{attempt}: a látogató nem kapja meg az ügyféldöntéseket', b'clientDecisions' not in pub and b'Teszt: 30%' not in pub)
            s2.stop(); servers.remove(s2)

        print('2b. Visszaállítás – amit nem szabad')
        r = php('visszaallitas.php', [bk], data)
        check('meglévő (nem üres) adatmappát nem ír felül', r.returncode == 1 and 'nem üres' in r.stderr and tree_hashes(data) == src_hash, r.stderr)
        T2 = os.path.join(tmp, 'meghamisitott'); os.makedirs(T2); bad = os.path.join(T2, os.path.basename(bk)); shutil.copytree(bk, bad)
        pf = next(os.path.join(bad, k) for k in m['files'] if k.startswith('photos/'))
        with open(pf, 'r+b') as fh: fh.seek(100); fh.write(b'\x00\x01\x02')
        r = php('visszaallitas.php', [bad], os.path.join(tmp, 'x1'))
        check('módosított fájlú mentés: elutasítva ellenőrzőösszeg-hiba miatt, cél nem jön létre', r.returncode == 2 and 'eltérő fájl' in r.stderr and not os.path.exists(os.path.join(tmp, 'x1')), r.stderr)
        r = php('mentes-ellenorzes.php', [bad], data); check('a mentes-ellenorzes.php is jelzi (kód 2)', r.returncode == 2)

        print('3. Hibás mentések (valóban előidézve)')
        r = php('mentes.php', [os.path.join(tmp, 'nincs-ilyen')], data)
        check('nem létező célmappa: kód 1, nem jön létre', r.returncode == 1 and 'nem létezik' in r.stderr and not os.path.exists(os.path.join(tmp, 'nincs-ilyen')), r.stderr)
        r = php('mentes.php', [os.path.join(tmp, 'uj-cel'), '--letrehoz'], data)
        check('--letrehoz kapcsolóval létrejön (0700), a mentés elkészül', r.returncode == 0 and mode(os.path.join(tmp, 'uj-cel')) == 0o700, r.stderr)

        ro = os.path.join(tmp, 'csak-olvashato'); os.makedirs(ro)
        subprocess.run(['mount', '-t', 'tmpfs', '-o', 'ro,size=1m', 'tmpfs', ro], check=True); mounts.append(ro)
        r = php('mentes.php', [ro], data)
        check('nem írható célmappa (csak olvasható fájlrendszer): kód ≠ 0, nincs mentés', r.returncode != 0 and not os.listdir(ro), r.stderr)

        big = os.path.join(tmp, 'nagy-adat'); copydata(data, big)
        for i in range(12): open(os.path.join(big, 'photos', uuid.uuid4().hex + '.jpg'), 'wb').write(os.urandom(300_000))
        full = os.path.join(tmp, 'kis-lemez'); os.makedirs(full)
        size_kb = os.path.getsize(os.path.join(big, 'kg.sqlite')) // 1024 + 900
        subprocess.run(['mount', '-t', 'tmpfs', '-o', f'size={size_kb}k', 'tmpfs', full], check=True); mounts.append(full)
        r = php('mentes.php', [full], big)
        check('betelt tárhely (valódi ENOSPC, kis tmpfs): kód 2', r.returncode == 2, (r.returncode, r.stderr))
        check('betelt tárhely: nincs kész mentés és nem maradt félkész mappa', not backups(full) and not partials(full), os.listdir(full))
        log = open(os.path.join(full, 'mentes-naplo.log'), encoding='utf-8').read() if os.path.exists(os.path.join(full, 'mentes-naplo.log')) else ''
        check('betelt tárhely: a naplóban HIBA kod=2', 'HIBA kod=2' in log, log)

        K = os.path.join(tmp, 'megszakitott'); os.makedirs(K)
        p = subprocess.Popen(['php', ROOT + '/bin/mentes.php', K], env=dict(os.environ, KG_DATA=big, KG_MENTES_TESZT_LASSITAS_MS='250'), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(1.5); p.send_signal(signal.SIGKILL); p.wait()
        check('megszakított mentés (kill -9): nincs kész nevű mentés', not backups(K), os.listdir(K))
        part = partials(K)
        check('megszakított mentés: csak a rejtett .reszleges munkamappa maradt', len(part) == 1, os.listdir(K))
        if part:
            r = php('visszaallitas.php', [os.path.join(K, part[0])], os.path.join(tmp, 'x2'))
            check('a félkész munkamappa nem állítható vissza', r.returncode == 1 and not os.path.exists(os.path.join(tmp, 'x2')), r.stderr)
            r = php('mentes-ellenorzes.php', [os.path.join(K, part[0])], big); check('a félkész munkamappa ellenőrzése: hibás (nincs manifest)', r.returncode == 2 and 'manifest' in r.stderr, r.stderr)
            old = time.time() - 1200; os.utime(os.path.join(K, part[0]), (old, old))
        check('kill -9 után a zár felszabadult: új mentés elkészül', php('mentes.php', [K], big).returncode == 0)
        check('…és a 10 percnél régebbi félkész munkamappát eltakarította', not partials(K) and len(backups(K)) == 1, os.listdir(K))
        K2 = os.path.join(tmp, 'megszakitott-term'); os.makedirs(K2)
        p = subprocess.Popen(['php', ROOT + '/bin/mentes.php', K2], env=dict(os.environ, KG_DATA=big, KG_MENTES_TESZT_LASSITAS_MS='250'), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        time.sleep(1.5); p.send_signal(signal.SIGTERM); _, err = p.communicate(timeout=10)
        check('megszakítás (Ctrl+C / SIGTERM): kód 5, a félkész mappa törölve, semmi nem marad', p.returncode == 5 and not os.listdir(K2), (p.returncode, os.listdir(K2), err))

        cor = os.path.join(tmp, 'serult'); copydata(data, cor)
        dbf = os.path.join(cor, 'kg.sqlite'); sz = os.path.getsize(dbf)
        with open(dbf, 'r+b') as fh: fh.seek(4096 * 2); fh.write(os.urandom(min(8192, sz - 8192)))
        Tc = os.path.join(tmp, 'cel-serult'); os.makedirs(Tc)
        r = php('mentes.php', [Tc], cor)
        check('sérült SQLite-fájl: kód 2, nincs mentés', r.returncode == 2 and not backups(Tc) and not partials(Tc), (r.returncode, r.stderr))

        mis = os.path.join(tmp, 'hianyos'); copydata(data, mis)
        q = next(q for q in iq0['inquiries'] if q.get('files'))
        os.remove(os.path.join(mis, 'inquiry-files', str(q['id']).lstrip('s'), q['files'][0]['file']))
        Tm = os.path.join(tmp, 'cel-hianyos'); os.makedirs(Tm)
        r = php('mentes.php', [Tm], mis)
        check('hiányzó referenciakép: kód 4, nincs mentés („nem teljes”)', r.returncode == 4 and not backups(Tm) and 'hiányzik' in r.stderr, (r.returncode, r.stderr))
        r = php('mentes.php', [Tm, '--hianyos-engedve'], mis)
        hb = backups(Tm)
        check('--hianyos-engedve: elkészül, de a neve -HIANYOS, és a kód 4', r.returncode == 4 and len(hb) == 1 and hb[0].endswith('-HIANYOS'), (r.returncode, hb))
        if hb:
            check('a hiányos mentés ellenőrizhető, a hiányt a manifest rögzíti', php('mentes-ellenorzes.php', [os.path.join(Tm, hb[0])], mis).returncode == 0
                  and len(json.load(open(os.path.join(Tm, hb[0], 'manifest.json')))['missing']) == 1)
            r = php('visszaallitas.php', [os.path.join(Tm, hb[0])], os.path.join(tmp, 'x3'))
            check('hiányos mentés kapcsoló nélkül nem állítható vissza', r.returncode == 4 and not os.path.exists(os.path.join(tmp, 'x3')), r.stderr)

        web = os.path.join(tmp, 'public_html'); os.makedirs(os.path.join(web, 'mentes'))
        good = os.path.join(tmp, 'jo-hely'); os.makedirs(good)
        os.symlink(data, os.path.join(tmp, 'link-adatba')); os.symlink(os.path.join(web, 'mentes'), os.path.join(tmp, 'link-webre')); os.symlink(good, os.path.join(tmp, 'link-jo'))
        r = php('mentes.php', [os.path.join(tmp, 'link-adatba')], data)
        check('symlink az adatmappára: elutasítva (kanonikus útvonal)', r.returncode == 1 and 'adatmappába' in r.stderr, r.stderr)
        r = php('mentes.php', [os.path.join(tmp, 'link-webre')], data)
        check('symlink a webgyökérbe: elutasítva', r.returncode == 1 and 'web' in r.stderr, r.stderr)
        r = php('mentes.php', [os.path.join(tmp, 'link-jo')], data)
        check('symlink megengedett helyre: a mentés a valódi mappába kerül', r.returncode == 0 and len(backups(good)) == 1, r.stderr)
        r = subprocess.run(['php', ROOT + '/bin/mentes.php', '../adat/../adat/./photos/../uj', '--letrehoz'], cwd=T, env=dict(os.environ, KG_DATA=data), capture_output=True, text=True)
        check('relatív útvonallal az adatmappába: elutasítva', r.returncode == 1 and not os.path.exists(os.path.join(data, 'uj')), r.stderr)
        r = php('mentes.php', [os.path.join(web, 'mentes')], data)
        check('webgyökér (public_html) alatti cél: elutasítva', r.returncode == 1 and not os.listdir(os.path.join(web, 'mentes')), r.stderr)
        own = os.path.join(tmp, 'sajat-weboldal', 'x'); os.makedirs(own)
        r = php('mentes.php', [own], data, env={'KG_WEBGYOKER': os.path.join(tmp, 'sajat-weboldal')})
        check('KG_WEBGYOKER-rel megadott webgyökér alatti cél: elutasítva', r.returncode == 1 and 'KG_WEBGYOKER' in r.stderr, r.stderr)
        os.makedirs(os.path.join(data, 'belso'), exist_ok=True)
        r1 = php('mentes.php', [os.path.join(data, 'belso')], data); r2 = php('mentes.php', [data], data)
        check('az adatmappa és az alatta lévő mappa: elutasítva', r1.returncode == 1 and r2.returncode == 1 and not os.listdir(os.path.join(data, 'belso')))
        os.rmdir(os.path.join(data, 'belso'))

        Td = os.path.join(tmp, 'azonos-nev'); os.makedirs(Td)
        now = time.time()
        for i in range(-1, 6):
            n = 'kg-mentes-' + datetime.datetime.fromtimestamp(now + i, datetime.timezone.utc).strftime('%Y%m%d-%H%M%S')
            os.makedirs(os.path.join(Td, n), exist_ok=True); open(os.path.join(Td, n, 'ne-nyulj-hozza'), 'w').write('x')
        r = php('mentes.php', [Td], data)
        check('azonos nevű mentés már létezik: kód 1, a meglévőt nem írja felül', r.returncode == 1 and 'már létezik' in r.stderr
              and all(os.listdir(os.path.join(Td, n)) == ['ne-nyulj-hozza'] for n in backups(Td)), r.stderr)

        app = os.path.join(tmp, 'kg-app'); shutil.copytree(os.path.join(ROOT, 'src'), os.path.join(app, 'src')); shutil.copytree(os.path.join(ROOT, 'bin'), os.path.join(app, 'bin'))
        subprocess.run(['chmod', '-R', 'a+rX', app], check=True)
        nob = os.path.join(tmp, 'nobody-adat'); copydata(data, nob)
        Tn = os.path.join(tmp, 'nobody-cel'); os.makedirs(Tn)
        subprocess.run(['chown', '-R', '65534:65534', nob, Tn], check=True)
        victim = os.path.join(nob, 'photos', os.listdir(os.path.join(nob, 'photos'))[0]); os.chmod(victim, 0)
        r = php('mentes.php', [Tn], nob, user=True, root=app)
        check('sikertelen fájlmásolás (olvashatatlan forrásfájl, nem root felhasználó): kód 2', r.returncode == 2 and ('olvasható' in r.stderr or 'másolás' in r.stderr), (r.returncode, r.stderr))
        check('sikertelen másolás után: nincs kész és nincs félkész mentés', not backups(Tn) and not partials(Tn), os.listdir(Tn))
        os.chmod(victim, 0o600)
        check('ugyanez javítás után, nem root felhasználóval: elkészül', php('mentes.php', [Tn], nob, user=True, root=app).returncode == 0)

        print('3b. Adatváltozás mentés közben (párhuzamos HTTP-írások a futó szerveren)')
        Tp = os.path.join(tmp, 'parhuzamos'); os.makedirs(Tp)
        for i in range(10): open(os.path.join(data, 'photos', uuid.uuid4().hex + '.jpg'), 'wb').write(os.urandom(50_000))
        srv.stop(); servers.remove(srv)
        srv = Srv(data, 8853, env={'KG_MENTES_VARAKOZAS': '60'}); servers.append(srv)
        pre = counts(data)
        res = {}
        bp = subprocess.Popen(['php', ROOT + '/bin/mentes.php', Tp], env=dict(os.environ, KG_DATA=data, KG_MENTES_TESZT_LASSITAS_MS='200'), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        time.sleep(0.8)
        def w_inquiry():
            b, h = mp({'payload': json.dumps({'name': 'Párhuzamos Péter', 'phone': '+36 30 555 0199', 'type': 'egyedi', 'message': 'mentés közben', 'images': 1})}, [('images[]', 'p.png', png(400, 300), 'image/png')])
            res['inquiry'] = (C(srv.base).j('POST', '/inquiry', raw=b, headers=h)[0], time.time())
        def w_delete():
            c = C(srv.base); c.login(); res['delete'] = (c.j('POST', '/inquiry-delete', {'id': iq0['inquiries'][-1]['id']})[0], time.time())
        ths = [threading.Thread(target=w_inquiry), threading.Thread(target=w_delete)]
        for t in ths: t.start(); time.sleep(0.2)
        out, err = bp.communicate(timeout=120); t_end = time.time()
        for t in ths: t.join(60)
        check('mentés közben is kész és ellenőrizve (kód 0)', bp.returncode == 0, err)
        check('az írások (új ajánlatkérés képpel, érdeklődés törlése) a mentés végéig vártak, majd sikerültek',
              res.get('inquiry', (0,))[0] == 201 and res.get('delete', (0,))[0] == 200 and min(res['inquiry'][1], res['delete'][1]) >= t_end - 1.5, (res, t_end))
        pb = os.path.join(Tp, backups(Tp)[0]) if backups(Tp) else ''
        pm = json.load(open(os.path.join(pb, 'manifest.json'))) if pb else {}
        check('a mentés a változás előtti állapotot tartalmazza (rekordszámok = előtte)', pm.get('db', {}).get('counts', {}).get('inquiry') == pre[1] and pm['db']['counts']['state_version'] == pre[0], (pre, pm.get('db', {}).get('counts')))
        check('a mentés belsőleg konzisztens: minden hivatkozott kép benne van', pm.get('missing') == [] and php('mentes-ellenorzes.php', [pb], data).returncode == 0)
        check('a forrásban a változások megtörténtek (új érdeklődés, a törölt eltűnt)', counts(data)[1] == pre[1])
        R2 = os.path.join(tmp, 'visszaallitott-parhuzamos')
        check('a mentés közbeni mentésből a visszaállítás sikerül', php('visszaallitas.php', [pb], R2).returncode == 0)
        s3 = Srv(R2, 8854); servers.append(s3); _, _, _, iq3 = snapshot(s3.base); s3.stop(); servers.remove(s3)
        names = [q['name'] for q in iq3['inquiries']]
        check('a visszaállított adatban a törölt érdeklődés még megvan, az új még nincs (egy időpont állapota)', 'Kép nélküli Kató' in names and 'Párhuzamos Péter' not in names, names)

        srv.stop(); servers.remove(srv)
        srv = Srv(data, 8855, env={'KG_MENTES_VARAKOZAS': '1'}); servers.append(srv)
        a = C(srv.base); a.login(); s, cur = a.j('GET', '/state'); v_before = counts(data)[0]
        Tq = os.path.join(tmp, 'varakozas'); os.makedirs(Tq)
        bp = subprocess.Popen(['php', ROOT + '/bin/mentes.php', Tq], env=dict(os.environ, KG_DATA=data, KG_MENTES_TESZT_LASSITAS_MS='300'), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(0.8)
        s, d = a.j('PUT', '/state', {'baseVersion': cur['version'], 'state': cur['state'], 'note': 'mentés közben'})
        bp.communicate(timeout=120)
        check('ha a mentés tovább tart a várakozási időnél: 503 „Biztonsági mentés folyamatban”, és semmi nem íródott', s == 503 and 'mentés folyamatban' in d.get('error', '') and counts(data)[0] == v_before, (s, d))
        s, d = a.j('PUT', '/state', {'baseVersion': cur['version'], 'state': cur['state'], 'note': 'mentés után'})
        check('a mentés után ugyanez az írás sikerül', s == 200, (s, d))

        print('4. Bemutató-adat nem kerülhet élesbe visszaállítással')
        D = os.path.join(tmp, 'bemutato-adat')
        subprocess.run(['php', ROOT + '/bin/demo-install.php'], env=dict(os.environ, KG_DATA=D), capture_output=True, check=True)
        Tb = os.path.join(tmp, 'bemutato-mentes'); os.makedirs(Tb)
        check('bemutató-adat mentése elkészül', php('mentes.php', [Tb], D).returncode == 0)
        db_ = os.path.join(Tb, backups(Tb)[0])
        r = php('visszaallitas.php', [db_], os.path.join(tmp, 'x4'))
        check('bemutató-mentés éles adatmappába (--bemutato nélkül): elutasítva', r.returncode == 1 and 'bemutató' in r.stderr and not os.path.exists(os.path.join(tmp, 'x4')), r.stderr)
        check('--bemutato kapcsolóval visszaállítható', php('visszaallitas.php', [db_, '--bemutato'], os.path.join(tmp, 'x5')).returncode == 0)
        r = php('visszaallitas.php', [bk, '--bemutato'], os.path.join(tmp, 'x6'))
        check('éles mentés --bemutato kapcsolóval: elutasítva', r.returncode == 1)

        print('5. HTTP-elérhetőség')
        srv.stop(); servers.remove(srv)
        sw = Srv(data, 8856, router=True); servers.append(sw)
        site = f'http://127.0.0.1:8856'
        leak = []
        for path in ['/bin/mentes.php', '/../bin/mentes.php', '/api/../bin/mentes.php', '/src/Backup.php', '/api/mentes', '/api/backup', '/mentesek/', '/../mentesek/' + os.path.basename(bk) + '/manifest.json', '/api/../../kg.sqlite']:
            try:
                with urllib.request.urlopen(site + path, timeout=5) as rr: body = rr.read(); code = rr.status
            except urllib.error.HTTPError as e: body = e.read(); code = e.code
            if code == 200 or b'<?php' in body or b'SQLite format' in body or b'sha256' in body: leak.append((path, code))
        check('a mentő szkriptek, a forráskód és a mentések HTTP-n nem érhetők el', not leak, leak)
        sw.stop(); servers.remove(sw)

        print('6. Megőrzés és napló')
        Tr = os.path.join(tmp, 'megorzes'); os.makedirs(Tr)
        src_b = bk
        ages = [0, 3, 10, 40, 50, 90]
        for d_ in ages:
            n = 'kg-mentes-' + (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=d_, minutes=5)).strftime('%Y%m%d-%H%M%S')
            shutil.copytree(src_b, os.path.join(Tr, n))
        os.makedirs(os.path.join(Tr, 'sajat-mappa')); os.makedirs(os.path.join(Tr, 'kg-mentes-20200101-000000'))   # manifest nélkül
        before = sorted(os.listdir(Tr))
        oldest3 = sorted(n for n in before if n.startswith('kg-mentes-2026'))[:3]
        r = php('mentes-torles.php', [Tr, '--napok', '30', '--megtart', '2'], data)
        check('próbafuttatás: kiírja a 3 törölhetőt, de semmit nem töröl', r.returncode == 0 and r.stdout.count('törölhető:') == 3 and sorted(os.listdir(Tr)) == before, r.stdout)
        r = php('mentes-torles.php', [Tr, '--napok', '30', '--megtart', '2', '--torles'], data)
        left = sorted(os.listdir(Tr))
        check('--torles: pontosan a 30 napnál régebbi 3 mentés törlődött', r.returncode == 0 and sorted(set(before) - set(left)) == oldest3 and set(left) - set(before) == {'mentes-naplo.log'}, (r.stdout, left))
        check('más mappához (manifest nélküli, más nevű) nem nyúlt', 'sajat-mappa' in left and 'kg-mentes-20200101-000000' in left)
        r = php('mentes-torles.php', [Tr, '--napok', '1', '--megtart', '10', '--torles'], data)
        check('a legújabb K mentés mindig megmarad', sorted(os.listdir(Tr)) == left, os.listdir(Tr))
        check('megőrzési idő nélkül nem fut (nincs önkényes alapérték)', php('mentes-torles.php', [Tr], data).returncode == 1 and php('mentes-torles.php', [Tr, '--napok', '0', '--torles'], data).returncode == 1)
        logf = os.path.join(T, 'mentes-naplo.log'); logt = open(logf, encoding='utf-8').read()
        check('napló: van sikeres sor, 0600 jogosultsággal', 'OK kod=0' in logt and mode(logf) == 0o600, logt[:200])
        all_logs = ''.join(open(os.path.join(r_, f), encoding='utf-8', errors='replace').read() for r_, _, fs in os.walk(tmp) for f in fs if f == 'mentes-naplo.log')
        check('a naplókban nincs személyes adat (név, telefon, e-mail)', not any(x in all_logs for x in SECRET_NAMES))
        check('a naplók hibás eseteket is rögzítenek (HIBA kod=1, 2, 4) és a törlést (MEGORZES)', all(x in all_logs for x in ['HIBA kod=1', 'HIBA kod=2', 'HIBA kod=4', 'MEGORZES']))
        check('a forrás-adatmappában nem maradt mentés vagy munkamappa', not any(n.startswith(('kg-mentes', '.kg-mentes')) for n in os.listdir(data)))
    finally:
        for s_ in servers:
            try: s_.stop()
            except Exception: pass
        for mnt in mounts: subprocess.run(['umount', mnt], capture_output=True)
        shutil.rmtree(tmp, ignore_errors=True)
    print(f'\n{ok} sikeres, {fail} hibás')
    sys.exit(1 if fail else 0)

main()
