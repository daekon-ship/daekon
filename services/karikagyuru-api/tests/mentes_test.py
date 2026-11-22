"""V5.8 – a biztonsági mentés (bin/mentes.php) ellenőrzése: valódi PHP-futtatással, ideiglenes adatmappán."""
import os, sqlite3, subprocess, sys, tempfile, shutil, pathlib, json

ROOT = pathlib.Path(__file__).resolve().parents[1]
ok = fail = 0
def check(name, cond, extra=''):
    global ok, fail
    if cond: ok += 1; print('  ok  ', name)
    else: fail += 1; print('  HIBA', name, extra)

def run(args, data):
    return subprocess.run(['php', str(ROOT / 'bin/mentes.php'), *args], env={**os.environ, 'KG_DATA': data}, capture_output=True, text=True)

t = tempfile.mkdtemp()
try:
    data = os.path.join(t, 'data')
    subprocess.run(['php', '-r', f'require "{ROOT}/src/App.php"; new App();'], env={**os.environ, 'KG_DATA': data}, check=True)
    con = sqlite3.connect(os.path.join(data, 'kg.sqlite'))
    con.execute("INSERT INTO state_version (body, note, saved_at) VALUES (?, '', '2026-11-22')", (json.dumps({'x': 1}),))
    con.execute("INSERT INTO inquiry (body, ip_hash, created_at) VALUES ('{}', 'h', '2026-11-22')")
    con.commit(); con.close()
    os.makedirs(os.path.join(data, 'inquiry-files', '1'))
    pathlib.Path(data, 'inquiry-files', '1', 'ref.jpg').write_bytes(b'KEP')
    pathlib.Path(data, 'photos', 'p.jpg').write_bytes(b'FOTO')

    r = run([os.path.join(t, 'mentesek')], data)
    check('mentés lefut (0)', r.returncode == 0, r.stderr)
    dirs = list(pathlib.Path(t, 'mentesek').glob('kg-mentes-*'))
    check('dátumozott mentésmappa készült', len(dirs) == 1)
    if dirs:
        d = dirs[0]
        c = sqlite3.connect(d / 'kg.sqlite')
        check('a másolatban megvan az árváltozat és az érdeklődés', c.execute('SELECT COUNT(*) FROM state_version').fetchone()[0] == 1 and c.execute('SELECT COUNT(*) FROM inquiry').fetchone()[0] == 1)
        c.close()
        check('a referenciakép és a termékfotó is mentve', (d / 'inquiry-files/1/ref.jpg').read_bytes() == b'KEP' and (d / 'photos/p.jpg').read_bytes() == b'FOTO')
        check('a mentett fájlok csak a tulajdonosnak olvashatók (0600)', oct((d / 'inquiry-files/1/ref.jpg').stat().st_mode & 0o777) == '0o600')
    r = run([os.path.join(data, 'belso')], data)
    check('az adatmappába nem ment (1)', r.returncode == 1 and not os.path.exists(os.path.join(data, 'belso')))
    r = run([], data)
    check('célmappa nélkül hibaüzenet (1)', r.returncode == 1 and 'célmappát' in r.stderr)
    r = run([os.path.join(t, 'x')], os.path.join(t, 'nincs'))
    check('adatbázis nélkül hibaüzenet (1)', r.returncode == 1)
finally:
    shutil.rmtree(t, ignore_errors=True)
print(f'\n{ok} sikeres, {fail} hibás')
sys.exit(1 if fail else 0)
