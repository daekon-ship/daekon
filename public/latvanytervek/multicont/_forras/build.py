#!/usr/bin/env python3
"""MultiCont Center – statikus oldalgenerátor (14. kör).
Futtatás:  python3 _forras/build.py
common.py  – fej, fejléc, lábléc, menü, ikonok
p_home.py  – kezdőlap (hero + háromoszlopos rendszer)
p_svc.py   – Rólunk, Szolgáltatások + 6 részletező oldal
p_content.py – Tudástár, cikk, Kalkulátorok, Dokumentumtár, Partnerek, partner, Kapcsolat
p_admin.py – kezelőfelület-látványterv (belépés + 4 képernyő)
A változó tartalom (cikkek, határidők, dokumentumok, partnerek) a tartalom.js-ben van."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import common
import p_home, p_svc, p_content, p_admin  # noqa: E402,F401  (importáláskor generálnak)

sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for name, prio in common.PAGES:
    loc = common.BASE + ("" if name == "index.html" else name)
    sm.append(f"  <url><loc>{loc}</loc><lastmod>2026-10-17</lastmod><priority>{prio}</priority></url>")
sm.append("</urlset>")
(common.OUT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")
(common.OUT / "robots.txt").write_text(f"# Látványterv – élesítéskor: Allow: /\nUser-agent: *\nDisallow: /\nSitemap: {common.BASE}sitemap.xml\n", encoding="utf-8")
print("kész:", ", ".join(sorted(p.name for p in common.OUT.glob("*.html"))))
