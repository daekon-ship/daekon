#!/usr/bin/env python3
"""Vályog-Mester – éles (produkciós) csomag előállítása a látványtervből.

Használat (a repó gyökeréből):
    python3 public/latvanytervek/valyog-mester/_forras/build_eles.py --out /útvonal/valyogmester-eles
    python3 …/build_eles.py --out … --vazlat     # tesztcsomag: noindex marad, a jóváhagyandó részek nem állítják meg

Mit csinál:
  1. Csak a ténylegesen használt fájlokat másolja ki (HTML, CSS, JS, betű, képek, logók, videó).
  2. Átírja az előnézeti URL-eket https://valyogmester.hu/-ra (canonical, og:url, og:image, strukturált adat).
  3. noindex → index, follow (kivéve --vazlat), láblécben „Látványterv” → „Weboldal: DAEKON”.
  4. Kiveszi az előnézeti blokkokat (<!--elonezet-->). Az oldal telefonos: nincs űrlap, nincs szerveroldali kód.
  5. Kimásolja: .htaccess (CSP-hash-sel, Apache-tárhelyhez), robots.txt, sitemap.xml, 404.html.
  6. Ellenőrzi: nem maradt-e előnézeti URL, régi domain, „Látványterv”, „egyeztetendő”, „JÓVÁHAGYANDÓ”,
     tesztmód-szöveg, és minden helyi hivatkozás létező fájlra mutat-e. Hiba esetén nem ad ki csomagot.
"""
import argparse, base64, datetime, hashlib, re, shutil, sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent
PREVIEW = "https://daekon-ship.github.io/daekon/latvanytervek/valyog-mester/"
PROD = "https://valyogmester.hu/"
STATIC = ["valyog.css", "valyog.js", "favicon.svg", "fonts/archivo-var.woff2", "fonts/OFL-Archivo.txt", "img/og.png"]
FORBIDDEN = [
    (r"daekon-ship\.github\.io", "előnézeti (GitHub Pages) URL"),
    (r"valyog-mester\.hu", "régi domain"),
    (r"Látványterv", "„Látványterv” felirat"),
    (r"[Ee]gyeztetendő", "„egyeztetendő” szöveg"),
    (r"JÓVÁHAGYANDÓ|jovahagyando|data-tervezet", "jóváhagyásra váró adatkezelési rész"),
    (r'class="tbd', "egyeztetendő jelölés"),
    (r"Előnézeti mód|testmode", "előnézeti/tesztmód blokk"),
    (r"#ajanlat|api/ajanlat|data-endpoint|<form[\s>]|type=\"file\"", "ajánlatkérő-maradvány (az oldal telefonos)"),
]


def build(out: Path, vazlat: bool) -> int:
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    problems, warnings = [], []

    def copy(rel: str, dst: str | None = None):
        s = SRC / rel
        if not s.exists():
            problems.append(f"hiányzó forrásfájl: {rel}")
            return
        d = out / (dst or rel)
        d.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(s, d)

    def transform(html: str) -> str:
        html = html.replace(PREVIEW, PROD)
        if not vazlat:
            html = html.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow">')
        html = re.sub(r'<p data-eles="([^"]*)">.*?</p>',
                      lambda m: "<p>" + m.group(1).replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"') + "</p>",
                      html, flags=re.S)
        html = re.sub(r"\s*<!--elonezet-->.*?<!--/elonezet-->", "", html, flags=re.S)
        return html

    # oldalak
    index = transform((SRC / "index.html").read_text(encoding="utf-8"))
    (out / "index.html").write_text(index, encoding="utf-8")
    adat = transform((SRC / "adatkezeles.html").read_text(encoding="utf-8"))
    if not vazlat:
        adat = adat.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow">')
    (out / "adatkezeles.html").write_text(adat, encoding="utf-8")
    copy("_eles/404.html", "404.html")

    # statikus fájlok + a HTML/JS-ben hivatkozott képek, logók, videó
    for rel in STATIC:
        copy(rel)
    refs = set()
    for text in (index, adat, (SRC / "valyog.js").read_text(encoding="utf-8"), (SRC / "valyog.css").read_text(encoding="utf-8")):
        refs |= set(re.findall(r"(?:img|arculat|fonts)/[A-Za-z0-9_./-]+\.(?:webp|png|svg|mp4|woff2)", text))
    for rel in sorted(refs):
        copy(rel)

    # konfiguráció (az oldal tisztán statikus: nincs PHP)
    inline = re.findall(r"<script>(.*?)</script>", index, flags=re.S)
    hashes = " ".join(f"'sha256-{base64.b64encode(hashlib.sha256(s.encode()).digest()).decode()}'" for s in inline)
    ht = (SRC / "_eles/htaccess.txt").read_text(encoding="utf-8").replace("__CSP_SCRIPT_HASH__", hashes)
    (out / ".htaccess").write_text(ht, encoding="utf-8")
    copy("_eles/robots.txt", "robots.txt")
    today = datetime.date.today().isoformat()
    (out / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{PROD}</loc><lastmod>{today}</lastmod></url>\n"
        f"  <url><loc>{PROD}adatkezeles.html</loc><lastmod>{today}</lastmod></url>\n</urlset>\n", encoding="utf-8")
    if vazlat:
        (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")

    # ellenőrzés: tiltott maradványok
    for f in out.rglob("*"):
        if f.suffix not in {".html", ".js", ".css", ".xml", ".txt"} or f.name.startswith("OFL"):
            continue
        text = f.read_text(encoding="utf-8")
        code = f.suffix in {".js", ".css"}
        for pat, what in FORBIDDEN:
            if code and what not in ("előnézeti (GitHub Pages) URL", "régi domain", "ajánlatkérő-maradvány (az oldal telefonos)"):
                continue   # a JS/CSS osztálynevei és kommentjei nem látható szövegek
            for m in re.finditer(pat, text):
                line = text.count("\n", 0, m.start()) + 1
                msg = f"{f.relative_to(out)}:{line}: {what}"
                (warnings if vazlat and "JÓVÁHAGYANDÓ" in pat else problems).append(msg)
    # ellenőrzés: helyi hivatkozások
    for page in ("index.html", "adatkezeles.html"):
        html = (out / page).read_text(encoding="utf-8")
        for ref in re.findall(r'(?:href|src|data-src|poster)="([^"#]+)"', html) + \
                   [u.split()[0] for s in re.findall(r'(?:srcset|data-srcset)="([^"]+)"', html) for u in s.split(",")]:
            if re.match(r"^(https?:|mailto:|tel:|data:)", ref) or ref in ("./", "/"):
                continue
            if not (out / ref.split("?")[0]).exists():
                problems.append(f"{page}: hiányzó fájlra mutat: {ref}")
    if any(out.rglob("*.php")):
        problems.append("PHP-fájl került a csomagba – a telefonos oldal tisztán statikus")
    if "index, follow" not in index and not vazlat:
        problems.append("index.html: robots nincs átállítva")

    size = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    print(f"Kimenet: {out}  ({sum(1 for f in out.rglob('*') if f.is_file())} fájl, {size / 1024 / 1024:.1f} MB)")
    for w in sorted(set(warnings)):
        print("  FIGYELEM:", w)
    if problems:
        print("\nAZ ÉLES CSOMAG NEM ADHATÓ KI – javítandó:")
        for p in sorted(set(problems)):
            print("  ✗", p)
        return 1
    print("Rendben – a csomag " + ("TESZTRE (vázlat, noindex)" if vazlat else "ÉLESÍTÉSRE") + " kész.")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")   # Windows-konzolon is kiírható a hibalista (✗)
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--vazlat", action="store_true", help="tesztcsomag: noindex marad, a jóváhagyandó részek csak figyelmeztetnek")
    a = ap.parse_args()
    sys.exit(build(a.out.resolve(), a.vazlat))
