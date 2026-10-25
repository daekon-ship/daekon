"""Egyetlen fájl cseréje EGY FTPS-kapcsolaton, előtte az élő példány mentése. Használat: upload_one.py <jelszófájl> <helyi> <távoli> <mentés-mappa>"""
import ftplib, os, sys
pw = open(sys.argv[1], encoding="utf-8").read().strip(); local, remote, backup = sys.argv[2:5]
ftp = ftplib.FTP_TLS(os.environ["KGW_FTP_HOST"], timeout=60); ftp.encoding = "utf-8"
try:
    ftp.login(os.environ["KGW_FTP_USER"], pw)
except ftplib.error_perm as e:
    print("AUTH FAILED:", e); sys.exit(2)
ftp.prot_p(); ftp.voidcmd("TYPE I")
os.makedirs(backup, exist_ok=True)
with open(os.path.join(backup, os.path.basename(remote)), "wb") as fh:
    ftp.retrbinary("RETR " + remote, fh.write)
with open(local, "rb") as fh:
    ftp.storbinary("STOR " + remote, fh)
print("OK" if ftp.size(remote) == os.path.getsize(local) else "SIZE MISMATCH", remote)
ftp.quit()
