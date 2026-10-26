"""Admin demó (admin.html) — saját elrendezés, a tartalmat a js/admin.js rajzolja."""

def build(g):
    ico, V = g['ico'], g['V']
    html = g['head']('Admin demó | Balogh Beatrix', 'Foglaláskezelő admin felület — bemutató.',
                     '\n<link rel="stylesheet" href="css/app.css?v=' + V + '">')
    html += f'''
<body>
{g['sprite']()}
<a class="skip" href="#admView">Ugrás a tartalomra</a>
<div class="adm">
  <aside class="adm-side">
    <a class="brand" href="index.html" aria-label="Vissza a weboldalra"><img class="logo" src="arculat/logo-fejlec-sotet.svg" alt="Balogh Beatrix" width="236" height="64"></a>
    <nav class="adm-tabs" id="admTabs" role="tablist" aria-label="Admin menü"></nav>
    <div class="adm-side-foot">
      <div class="adm-lock">{ico('lock')}<span>Bemutató — nincs bejelentkezés. Élesben szerveroldali hitelesítés és jogosultságkezelés védi.</span></div>
      <a href="index.html">← Vissza a weboldalra</a>
      <a href="foglalas.html">Vendégoldali foglalás</a>
    </div>
  </aside>
  <main class="adm-main" id="admView" tabindex="-1" role="tabpanel"></main>
</div>
<div class="modal" id="admModal"></div>
<div class="toast" id="admToast" role="status" aria-live="polite"></div>'''
    for s in ['js/config.js', 'js/core.js', 'js/site.js', 'js/admin.js']:
        html += f'\n<script src="{s}?v={V}"></script>'
    html += '\n</body>\n</html>\n'
    (g['ROOT'] / 'admin.html').write_text(html, encoding='utf-8')
    print('írva: admin.html')
