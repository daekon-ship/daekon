"""Élesítésre kész weboldal-csomag a látványtervből -> _eles/ mappa + kiraly-weboldal-eles.zip
- kiveszi a „Látványterv · DAEKON” sávot
- noindex -> index, follow; canonical + abszolút megosztási linkek a megadott domainre
- csak a futáshoz szükséges fájlokat másolja, robots.txt és sitemap.xml-t ír
python3 _forras/eles_csomag.py https://www.pelda.hu
"""
import os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_eles")
LATVANY = "https://daekon-ship.github.io/daekon/latvanytervek/kiraly-autoszerviz/"
FAJLOK = ["kiraly.css", "kiraly.js", "js/vendor/motion-11.18.2.min.js", "fonts/archivo-var.woff", "fonts/manrope-var.woff",
          "img/og-kiraly.png", "img/apple-touch-icon.png", "img/favicon-32.png",
          "arculat-kombi/WEB/emblema-ejkek.svg", "arculat-kombi/WEB/fejlec-felirat-ejkek.svg"]
OLDALAK = ["index.html", "impresszum.html", "adatkezeles.html"]


def main(domain):
    domain = domain.rstrip("/") + "/"
    shutil.rmtree(OUT, ignore_errors=True)
    for f in FAJLOK:
        os.makedirs(os.path.dirname(os.path.join(OUT, f)) or OUT, exist_ok=True)
        shutil.copy(os.path.join(ROOT, f), os.path.join(OUT, f))
    for o in OLDALAK:
        h = open(os.path.join(ROOT, o), encoding="utf-8").read()
        h = re.sub(r'<div class="demo-szal"[^>]*>.*?</div>\n?', "", h)
        h = h.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow">')
        h = h.replace(LATVANY, domain)
        url = domain if o == "index.html" else domain + o
        if 'rel="canonical"' not in h:
            h = h.replace("</title>", f'</title>\n<link rel="canonical" href="{url}">', 1)
        assert "latvanyterv" not in h.lower() or o != "index.html", "látványterv-hivatkozás maradt"
        open(os.path.join(OUT, o), "w", encoding="utf-8").write(h)
    open(os.path.join(OUT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\nSitemap: {domain}sitemap.xml\n")
    urls = "".join(f"<url><loc>{domain if o == 'index.html' else domain + o}</loc></url>" for o in OLDALAK)
    open(os.path.join(OUT, "sitemap.xml"), "w").write(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    z = os.path.join(ROOT, "kiraly-weboldal-eles.zip")
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for d, _, fs in os.walk(OUT):
            for f in fs:
                p = os.path.join(d, f)
                zf.write(p, os.path.relpath(p, OUT))
    print("kész:", OUT, z)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "https://DOMAIN-HELYE.hu")
