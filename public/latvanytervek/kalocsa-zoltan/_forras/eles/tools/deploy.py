"""Kalocsa GeoWorks – éles feltöltés MHosting FTPS-re, EGYETLEN kapcsolaton.

Használat (a kalocsageoworks mappából):
    python -X utf8 -I tools/deploy.py <jelszófájl> dist _mhosting-backups/<mentés-mappa>

Biztonsági szabályok (MHosting brute-force védelem):
  * egyetlen FTPS-kapcsolat, újrapróbálkozás nélkül; hitelesítési hibánál azonnal leáll,
  * a jelszó projekten kívüli fájlból jön, soha nem kerül kiírásra.
Folyamat: a felülírandó élő fájlok mentése -> feltöltés (eszközök -> HTML -> index.html -> .htaccess)
-> méretellenőrzés -> HTTPS-ellenőrzés; ha a .htaccess után a főoldal nem 200, a .htaccess törlődik.
Semmit mást nem töröl. (PHP-diagnosztika külön: tools/php_probe.py)
"""
import ftplib, os, sys, urllib.request, urllib.error

HOST, USER = os.environ["KGW_FTP_HOST"], os.environ["KGW_FTP_USER"]  # az FTP-adatok nincsenek a kódban (lásd a helyi ELESITES.md)
SITE = "https://kalocsageoworks.com"
PWFILE, DIST, BACKUP = sys.argv[1], sys.argv[2], sys.argv[3]
pw = open(PWFILE, encoding="utf-8").read().strip()


def http(url):
    req = urllib.request.Request(url, headers={"User-Agent": "kalocsa-deploy-check"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.geturl(), r.read()
    except urllib.error.HTTPError as e:
        return e.code, url, e.read()
    except Exception as e:
        return 0, url, repr(e).encode()


files = []
for root, _, names in os.walk(DIST):
    for n in names:
        rel = os.path.relpath(os.path.join(root, n), DIST).replace("\\", "/")
        files.append(("/" + rel, os.path.join(root, n)))


def order(item):
    r = item[0]
    if r == "/.htaccess":
        return (4, r)
    if r == "/index.html":
        return (3, r)
    if r.endswith(".html"):
        return (2, r)
    return (1, r)


files.sort(key=order)

ftp = ftplib.FTP_TLS(HOST, timeout=60)
ftp.encoding = "utf-8"
try:
    ftp.login(USER, pw)
except ftplib.error_perm as e:
    print("AUTH FAILED:", e)
    sys.exit(2)
ftp.prot_p()
ftp.voidcmd("TYPE I")

existing = {}
def walk(p):
    for n, f in ftp.mlsd(p):
        if n in (".", ".."):
            continue
        rp = p.rstrip("/") + "/" + n
        if f.get("type") == "dir":
            existing[rp] = "dir"
            walk(rp)
        elif f.get("type") == "file":
            existing[rp] = int(f.get("size", -1))
walk("/")

# 1) mentés: minden élő fájl, amit felülírnánk
backed = []
for remote, _ in files:
    if existing.get(remote, "dir") != "dir":
        dst = os.path.join(BACKUP, remote.lstrip("/"))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "wb") as fh:
            ftp.retrbinary("RETR " + remote, fh.write)
        backed.append(remote)
print(f"BACKUP: {len(backed)} live files saved to {BACKUP}")

# 2) feltöltés, 3) méretellenőrzés
try:
    for remote, local in files:
        parts = [p for p in os.path.dirname(remote).split("/") if p]
        for i in range(len(parts)):
            sub = "/" + "/".join(parts[: i + 1])
            if sub not in existing:
                ftp.mkd(sub)
                existing[sub] = "dir"
        with open(local, "rb") as fh:
            ftp.storbinary("STOR " + remote, fh)
    bad = [r for r, l in files if ftp.size(r) != os.path.getsize(l)]
    if bad:
        raise RuntimeError(f"size mismatch: {bad}")
    print(f"UPLOADED + VERIFIED: {len(files)} files")
except Exception as e:
    print(f"FAILED: {e!r} -> restoring {len(backed)} backed-up files")
    for remote in backed:
        with open(os.path.join(BACKUP, remote.lstrip("/")), "rb") as fh:
            ftp.storbinary("STOR " + remote, fh)
    ftp.quit()
    sys.exit(4)

# 4) HTTPS főoldal; .htaccess-hiba esetén visszavonás
st, final, body = http(SITE + "/")
print(f"CHECK {SITE}/ -> {st} ({final})")
if st != 200 or b"Kalocsa GeoWorks" not in body:
    print("HOMEPAGE NOT OK -> removing .htaccess")
    ftp.delete("/.htaccess")
    st, final, _ = http(SITE + "/")
    print(f"CHECK after rollback -> {st} ({final})")

ftp.quit()
