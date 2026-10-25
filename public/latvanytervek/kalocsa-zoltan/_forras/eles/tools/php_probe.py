"""Egyszeri PHP-diagnosztika EGY FTPS-kapcsolaton: minimális próbafájl, 644-es jog, egy HTTPS-kérés, törlés."""
import ftplib, io, secrets, sys, urllib.request, urllib.error, os
pw = open(sys.argv[1], encoding="utf-8").read().strip()
ftp = ftplib.FTP_TLS(os.environ["KGW_FTP_HOST"], timeout=60); ftp.encoding = "utf-8"
try:
    ftp.login(os.environ["KGW_FTP_USER"], pw)
except ftplib.error_perm as e:
    print("AUTH FAILED:", e); sys.exit(2)
ftp.prot_p(); ftp.voidcmd("TYPE I")
name = f"/_php-probe-{secrets.token_hex(8)}.php"
ftp.storbinary("STOR " + name, io.BytesIO(b"<?php echo 'ok ' . PHP_VERSION . ' finfo=' . (int)class_exists('finfo') . ' openssl=' . (int)extension_loaded('openssl') . ' mbstring=' . (int)extension_loaded('mbstring');"))
try:
    print("CHMOD:", ftp.sendcmd("SITE CHMOD 644 " + name))
except Exception as e:
    print("CHMOD n/a:", e)
for n, f in ftp.mlsd("/", facts=["unix.mode", "perm", "size"]):
    if n in ("index.html", name.lstrip("/")): print("LIST", n, f)
try:
    with urllib.request.urlopen(urllib.request.Request("https://kalocsageoworks.com" + name, headers={"User-Agent": "kalocsa-php-probe"}), timeout=30) as r:
        print("PHP ->", r.status, r.read()[:200].decode("utf-8", "replace"))
except urllib.error.HTTPError as e:
    print("PHP ->", e.code, dict(e.headers).get("Server"), e.read()[:300].decode("utf-8", "replace"))
finally:
    ftp.delete(name); print("probe deleted")
ftp.quit()
