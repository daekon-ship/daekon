"""Éles (FTP-re feltölthető) csomag a látványtervből.
Adatok: _forras/eles_adatok.json (domain + tárhelyszolgáltató). Üres mezőnél a csomag elkészül,
de ELESITESRE-VAR státusszal (helykitöltő domainnel) – ilyenkor NEM tölthető fel.

python3 _forras/eles_csomag.py
  -> _eles/                       (a webgyökér tartalma, helyi teszthez)
  -> kiraly-autoszerviz-eles.zip  (gyökerében index.html)
"""
import json, os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_eles")
ZIP = os.path.join(ROOT, "kiraly-autoszerviz-eles.zip")
LATVANY = "https://daekon-ship.github.io/daekon/latvanytervek/kiraly-autoszerviz/"
HELYKITOLTO = "https://DOMAIN-HELYE.hu/"
FAJLOK = ["kiraly.css", "kiraly.js", "js/vendor/motion-11.18.2.min.js", "fonts/archivo-var.woff", "fonts/manrope-var.woff",
          "img/og-kiraly.png", "img/apple-touch-icon.png", "img/favicon-32.png",
          "arculat-kombi/WEB/emblema-ejkek.svg", "arculat-kombi/WEB/fejlec-felirat-ejkek.svg"]
OLDALAK = ["index.html", "impresszum.html", "adatkezeles.html"]
TILTOTT = ["github.io", "daekon-ship", "latvanyterv", "átványterv", "demo-szal", "noindex"]


def css_tisztit(css):
    """A látványterv-sáv szabályainak eltávolítása."""
    css = re.sub(r'\.demo-szal[^{]*\{[^}]*\}\n?', "", css)
    return css.replace("/* KIRÁLY Autószerviz – látványterv (DAEKON) */", "/* KIRÁLY Autószerviz – weboldal (DAEKON) */")


def main():
    adat = json.load(open(os.path.join(ROOT, "_forras", "eles_adatok.json"), encoding="utf-8"))
    hianyzik = [k for k in ("domain", "tarhely_nev", "tarhely_szekhely", "tarhely_email") if not adat.get(k, "").strip()]
    domain = (adat["domain"].strip().rstrip("/") + "/") if adat.get("domain", "").strip() else HELYKITOLTO
    if domain != HELYKITOLTO and not domain.startswith("https://"):
        sys.exit("A domain csak https:// kezdetű lehet.")

    shutil.rmtree(OUT, ignore_errors=True)
    for f in FAJLOK:
        os.makedirs(os.path.dirname(os.path.join(OUT, f)), exist_ok=True)
        shutil.copy(os.path.join(ROOT, f), os.path.join(OUT, f))
    p = os.path.join(OUT, "kiraly.css")
    css = css_tisztit(open(p, encoding="utf-8").read())  # előbb beolvas, csak utána ír (különben üres lesz)
    assert len(css) > 10000, "a CSS sérült"
    open(p, "w", encoding="utf-8").write(css)

    for o in OLDALAK:
        h = open(os.path.join(ROOT, o), encoding="utf-8").read()
        h = re.sub(r'<div class="demo-szal"[^>]*>.*?</div>\n?', "", h)
        h = h.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow">')
        h = h.replace(LATVANY, domain)
        url = domain if o == "index.html" else domain + o
        h = h.replace("</title>", f'</title>\n<link rel="canonical" href="{url}">', 1)
        if o == "index.html":  # strukturált adat: domainfüggő mezők
            def ld(m):
                d = json.loads(m.group(1))
                d.update({"url": domain, "image": domain + "img/og-kiraly.png", "logo": domain + "arculat-kombi/WEB/emblema-ejkek.svg"})
                return '<script type="application/ld+json">\n' + json.dumps(d, ensure_ascii=False) + "\n</script>"
            h = re.sub(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', ld, h, flags=re.S)
        if o == "impresszum.html":
            for k in ("tarhely_nev", "tarhely_szekhely", "tarhely_email"):
                if adat.get(k, "").strip():
                    h = h.replace(f'<dd data-mezo="{k}">[élesítéskor kitöltendő]</dd>', f'<dd data-mezo="{k}">{adat[k].strip()}</dd>')
            if not [k for k in ("tarhely_nev", "tarhely_szekhely", "tarhely_email") if k in hianyzik]:
                h = h.replace("<dl data-kitoltendo>", "<dl>")
        open(os.path.join(OUT, o), "w", encoding="utf-8").write(h)

    open(os.path.join(OUT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {domain}sitemap.xml\n")
    urls = "".join(f"\n  <url><loc>{domain if o == 'index.html' else domain + o}</loc></url>" for o in OLDALAK)
    open(os.path.join(OUT, "sitemap.xml"), "w").write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}\n</urlset>\n')

    # maradt-e látványterv-hivatkozás valamelyik szöveges fájlban?
    hibak = []
    for d, _, fs in os.walk(OUT):
        for f in fs:
            if f.endswith((".html", ".css", ".js", ".txt", ".xml", ".svg")) and "motion-" not in f:
                t = open(os.path.join(d, f), encoding="utf-8").read()
                hibak += [f"{f}: {x}" for x in TILTOTT if x in t]
    if hibak:
        sys.exit("Látványterv-maradvány az éles fájlokban: " + "; ".join(hibak))

    if os.path.exists(ZIP):
        os.unlink(ZIP)
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for d, _, fs in sorted(os.walk(OUT)):
            for f in sorted(fs):
                q = os.path.join(d, f)
                zf.write(q, os.path.relpath(q, OUT))
    statusz = "FELTÖLTHETŐ (adatok teljesek)" if not hianyzik else "ELESITESRE-VAR – hiányzik: " + ", ".join(hianyzik)
    print("domain:", domain)
    print("státusz:", statusz)
    print("zip:", ZIP)


if __name__ == "__main__":
    main()
