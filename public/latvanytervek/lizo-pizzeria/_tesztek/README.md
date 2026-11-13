# Lizó látványterv – automatizált tesztek (belső)

```
python3 suite.py <alap-URL> <kimeneti mappa>
# pl. helyben:  cd public && python3 -m http.server 8765
#               python3 suite.py http://127.0.0.1:8765/latvanytervek/lizo-pizzeria/ ./ki
```

Playwright (Python) + Chromium kell. 89 ellenőrzés: 9 nézet, kosár/pénztár, étlap, admin, akadálymentesség,
hálózat/teljesítmény, tartalom/biztonság. Kitalált tesztadatokkal dolgozik, valódi rendelést nem küld.
Eredmények: `eredmeny-*.json` (minden sor egy ellenőrzés, `ok` true/false).
Nem helyettesíti a valódi iOS Safari / Android Chrome készülékes tesztet.
