"""Foglalási oldal (foglalas.html) váza — a tartalmat a js/booking.js rajzolja."""

def build(g):
    ico, tag, page = g['ico'], g['tag'], g['page']
    body = f'''
<div class="bk">
  <section class="bk-head wrap">
    <nav class="crumbs" aria-label="Morzsamenü"><a href="index.html">Kezdőlap</a><span aria-hidden="true">/</span><span aria-current="page">Időpontfoglalás</span></nav>
    <div class="bk-title">
      <div><p class="eyebrow">Időpontfoglalás</p><h1 id="bkTitle">Foglalj időpontot <em>pár lépésben</em>.</h1></div>
      <p class="bk-demo">{ico('info')}<span><b>Bemutató:</b> a szabad időpontok mintaadatok, valódi foglalás és értesítés nem történik. Telefonon: <a data-tel href="tel:+36706146070" data-bind="phone">+36 70 614 6070</a></span></p>
    </div>
    <div class="bk-stepper">
      <ol id="bkSteps" aria-label="Foglalás lépései"></ol>
      <div class="bk-progress" id="bkProgress" aria-hidden="true"><i></i></div>
    </div>
  </section>

  <div class="wrap bk-grid" id="bkMain">
    <div class="bk-main">
      <div class="bk-step" id="bkStep" aria-live="off"></div>
      <div class="bk-nav" id="bkNav">
        <button type="button" class="btn btn--ghost" id="bkBack">{ico('arrow-l')}Vissza</button>
        <button type="button" class="btn" id="bkNext">Tovább</button>
      </div>
    </div>
    <aside class="bk-sum" aria-label="Foglalás összesítése"><div id="bkSum"></div></aside>
  </div>

  <div class="bk-mobile" id="bkMobile">
    <span id="bkMSum" aria-live="polite"></span>
    <button type="button" class="btn" id="bkMNext">Tovább</button>
  </div>
  <p class="sr-only" id="bkLive" aria-live="polite" aria-atomic="true"></p>
  <div class="bk-flash" id="bkFlash" role="status" aria-live="polite"></div>

  <section class="sec sec--cream" id="kezeles" hidden aria-labelledby="kez2-h" style="padding-bottom:0">
    <div class="wrap"><p class="eyebrow">Foglalás kezelése</p><h2 id="kez2-h" style="margin-bottom:24px">A foglalásod</h2><div id="kezelesCard"></div>
    <p class="small muted" style="margin-top:14px">Az éles rendszerben ide a visszaigazoló e-mailben kapott egyedi, biztonságos linkkel lehet eljutni — belépés nélkül.</p></div>
  </section>

  <section class="sec sec--cream" id="foglalasaim" aria-labelledby="mine-h">
    <div class="wrap">
      <div class="sec-head"><div><p class="eyebrow">Foglalásaim</p><h2 id="mine-h">Ezen az eszközön tett <em>bemutató foglalások</em></h2></div>
      <p class="muted">Itt próbálhatod ki a módosítást és a lemondást. Az adatok csak a böngésződben vannak — nem központi adatbázisban.</p></div>
      <div class="mine-list" id="mineList"></div>
    </div>
  </section>
</div>'''
    head_extra = '\n<link rel="stylesheet" href="css/app.css?v=' + g['V'] + '">'
    # saját head: a page() függvényt kiegészítjük az app.css-sel
    orig_head = g['head']
    g['head'] = lambda t, d, extra='': orig_head(t, d, head_extra)
    page('foglalas.html', 'Időpontfoglalás | Balogh Beatrix',
         'Foglalj időpontot pedikűrre, manikűrre vagy géllakkra pár lépésben, regisztráció nélkül.', body,
         mbar=False, extra_js=('js/booking.js',))
    g['head'] = orig_head
