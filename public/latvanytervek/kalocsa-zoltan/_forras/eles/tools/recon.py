"""Kalocsa GeoWorks – tárhely-felmérés és teljes mentés, EGYETLEN FTPS-kapcsolaton.

Használat: python -X utf8 -I tools/recon.py <jelszófájl> <mentés-mappa>
MHosting brute-force védelem: egy kapcsolat, nincs újrapróbálkozás, hitelesítési hibánál leáll.
A jelszó projekten kívüli fájlból jön, soha nem kerül kiírásra.
"""
import ftplib, os, sys

HOST, USER = os.environ["KGW_FTP_HOST"], os.environ["KGW_FTP_USER"]  # az FTP-adatok nincsenek a kódban (lásd a helyi ELESITES.md)
PWFILE, BACKUP = sys.argv[1], sys.argv[2]
pw = open(PWFILE, encoding="utf-8").read().strip()

ftp = ftplib.FTP_TLS(HOST, timeout=40)
ftp.encoding = "utf-8"
print("WELCOME:", ftp.getwelcome())
try:
    ftp.login(USER, pw)
except ftplib.error_perm as e:
    print("AUTH FAILED:", e)
    sys.exit(2)
ftp.prot_p()
ftp.voidcmd("TYPE I")
print("PWD:", ftp.pwd())

entries = []
def walk(p):
    for n, f in ftp.mlsd(p):
        if n in (".", ".."):
            continue
        rp = p.rstrip("/") + "/" + n
        t = f.get("type")
        entries.append((rp, t, f.get("size", ""), f.get("modify", "")))
        if t == "dir":
            walk(rp)
walk("/")
for rp, t, s, m in entries:
    print(f"{t:5} {s:>10} {m} {rp}")

n = 0
for rp, t, s, m in entries:
    if t == "file":
        dst = os.path.join(BACKUP, rp.lstrip("/"))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "wb") as fh:
            ftp.retrbinary("RETR " + rp, fh.write)
        n += 1
    elif t == "dir":
        os.makedirs(os.path.join(BACKUP, rp.lstrip("/")), exist_ok=True)
print(f"BACKUP: {n} files -> {BACKUP}")
ftp.quit()
