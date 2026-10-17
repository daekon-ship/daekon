from common import *

HERO_SVG = '''<svg viewBox="0 0 560 470" role="img" aria-labelledby="ha-t">
  <title id="ha-t">A MultiCont három pillére – szakértelem, számvitel, együttműködés – egy közös középpont körül</title>
  <g class="ha-line"><path d="M110 98V250M450 98V250M280 330V392M60 250H500"/></g>
  <circle class="ha-pulse" cx="280" cy="235" r="104" fill="#EAF3FC"/>
  <path class="ha-flow" style="--len:260;--d:.5s" stroke="#2764BD" d="M110 88C110 196 150 235 205 235"/>
  <path class="ha-flow" style="--len:260;--d:.7s" stroke="#28B6A4" d="M450 88C450 196 410 235 355 235"/>
  <path class="ha-flow" style="--len:90;--d:.9s" stroke="#F3B85B" d="M280 310V398"/>
  <g class="ha-core" style="--d:.1s">
    <rect x="205" y="160" width="150" height="150" rx="18" fill="#fff" stroke="#DFE7F0"/>
    <g transform="translate(220 175) scale(2.5)"><path d="M6 6h17v6H12v11H6z" fill="#2764BD"/><path d="M6 42V25h6v11h11v6z" fill="#11243A"/><path d="M42 42H25v-6h11V25h6z" fill="#28B6A4"/><rect x="19" y="19" width="10" height="10" fill="#F3B85B"/></g>
  </g>
  <g class="ha-node" style="--d:.35s"><rect x="10" y="30" width="200" height="58" rx="12"/><circle cx="32" cy="59" r="7" fill="#2764BD"/><text class="ha-cap" x="48" y="54" fill="#2764BD">MULTI</text><text x="48" y="73">Sokoldalú szakértelem</text></g>
  <g class="ha-node" style="--d:.5s"><rect x="350" y="30" width="200" height="58" rx="12"/><circle cx="372" cy="59" r="7" fill="#28B6A4"/><text class="ha-cap" x="388" y="54" fill="#13796D">CONT</text><text x="388" y="73">Számvitel, szerződések</text></g>
  <g class="ha-node" style="--d:.65s"><rect x="180" y="398" width="200" height="58" rx="12"/><circle cx="202" cy="427" r="7" fill="#F3B85B"/><text class="ha-cap" x="218" y="422" fill="#8A5B12">CENTER</text><text x="218" y="441">Partnerek, együttműködés</text></g>
  <g class="ha-card" style="--d:.9s">
    <rect class="bg" x="8" y="272" width="160" height="112" rx="12"/>
    <text class="ttl" x="24" y="298">BEVÉTEL / KIADÁS</text>
    <g fill="#2764BD"><rect x="26" y="336" width="10" height="34" rx="2"/><rect x="58" y="326" width="10" height="44" rx="2"/><rect x="90" y="318" width="10" height="52" rx="2"/><rect x="122" y="310" width="10" height="60" rx="2"/></g>
    <g fill="#8DB8F2"><rect x="38" y="346" width="10" height="24" rx="2"/><rect x="70" y="342" width="10" height="28" rx="2"/><rect x="102" y="340" width="10" height="30" rx="2"/><rect x="134" y="336" width="10" height="34" rx="2"/></g>
  </g>
  <g class="ha-card" style="--d:1.05s">
    <rect class="bg" x="392" y="272" width="160" height="112" rx="12"/>
    <text class="ttl" x="408" y="298">HAVI ZÁRÁS</text>
    <g><rect x="408" y="312" width="14" height="14" rx="4" fill="#E3F6F3"/><path d="M411 319l3 3 5-6" fill="none" stroke="#13796D" stroke-width="2" stroke-linecap="round"/><text x="430" y="323">Bizonylatok</text></g>
    <g><rect x="408" y="334" width="14" height="14" rx="4" fill="#E3F6F3"/><path d="M411 341l3 3 5-6" fill="none" stroke="#13796D" stroke-width="2" stroke-linecap="round"/><text x="430" y="345">Bevallások</text></g>
    <g><rect x="408" y="356" width="14" height="14" rx="4" fill="#FDF3E2"/><circle cx="415" cy="363" r="2.5" fill="#F3B85B"/><text x="430" y="367">Bérek, járulékok</text></g>
  </g>
</svg>'''

svc_cards = ""
for i, (k, t, d) in enumerate(SVC):
    if k == "vegelszamolas":
        svc_cards += (f'<a class="svc key" href="{svc_url(k)}"><span class="n">{i+1:02d}</span>{icon(k)}<h3>{t} <span class="tag g">Kiemelt</span></h3><p>{d}</p><span class="go">Részletek</span></a>')
    else:
        svc_cards += f'<a class="svc" href="{svc_url(k)}"><span class="n">{i+1:02d}</span>{icon(k)}<h3>{t}</h3><p>{d}</p><span class="go">Részletek</span></a>'

home = f'''
<section class="hero">
  <div class="wrap">
    <div>
      <p class="eyebrow">Könyvelőiroda · Budaörs · 2015 óta</p>
      <h1 class="h1">Biztos pénzügyi háttér. Több lehetőség vállalkozásának.</h1>
      <p class="lead">Könyvelés, pénzügyi szakértelem és üzleti együttműködések egy helyen. A MultiCont Center célja, hogy vállalkozása ne csak megfeleljen a kötelezettségeknek, hanem magabiztosan fejlődhessen.</p>
      <div class="hero-btns">
        <a class="btn btn-p" href="kapcsolat.html">Kapcsolatfelvétel {I_ARROW}</a>
        <a class="btn btn-o" href="szolgaltatasok.html">Szolgáltatások megtekintése</a>
      </div>
      <ul class="hero-facts"><li>30 év pénzügyi-számviteli gyakorlat</li><li>Budaörsön és online</li><li>Magyarul és németül</li></ul>
    </div>
    <div class="hero-art">{HERO_SVG}</div>
  </div>
</section>

<div class="wrap portal">

  <aside class="col-l" aria-label="Szakmai hírek és határidők">
    <div class="col-h"><h2>Szakmai hírek</h2><span data-mod="checked"></span></div>
    <section class="mod">
      <div class="mod-h"><h3>Adóhírek, változások</h3><a href="tudastar.html">Összes</a></div>
      <ul class="l-news" data-mod="news" data-n="4"></ul>
    </section>
    <section class="mod">
      <div class="mod-h"><h3>Közelgő határidők</h3><a href="tudastar.html?tema=%C3%89ves%20ad%C3%B3z%C3%A1si%20k%C3%B6telezetts%C3%A9gek">Mind</a></div>
      <ul class="l-dead" data-mod="deadlines" data-n="4"></ul>
      <p class="src" data-mod="deadline-src"></p>
    </section>
    <section class="mod">
      <div class="mod-h"><h3>Jogszabályi idővonal</h3></div>
      <ol class="l-time" data-mod="timeline"></ol>
    </section>
    <section class="mod">
      <div class="mod-h"><h3>Tudástár témák</h3></div>
      <div class="l-nav" data-mod="topics-mini"></div>
    </section>
    <section class="mod">
      <div class="mod-h"><h3>Hivatalos oldalak</h3></div>
      <ul class="l-links" data-mod="links" data-n="6"></ul>
    </section>
  </aside>

  <div class="col-m">
    <section class="card intro-card" aria-labelledby="h-rolunk">
      <p class="eyebrow">A MultiCont Centerről</p>
      <h2 class="h2" id="h-rolunk">Könyvelő, aki ismeri a vállalkozását</h2>
      <p class="lead">Horváth Mária 2015-ben alapította az irodát, harminc év pénzügyi-számviteli gyakorlat után. Kisvállalkozásokkal dolgozunk, közvetlenül: a kérdéseire az válaszol, aki a könyveit vezeti, és ha változik egy szabály, előre szólunk.</p>
      <ul class="triad" aria-label="A név jelentése">
        <li><b>MULTI</b><p>Sokoldalúság: több szakterület, nyitottság új tevékenységekre.</p></li>
        <li><b>CONT</b><p>Számvitel és megállapodások: a könyvektől a szerződésekig.</p></li>
        <li><b>CENTER</b><p>Közös pont: ügyfelek és partnerek egy helyen.</p></li>
      </ul>
    </section>

    <section aria-labelledby="h-szolg">
      <div class="sec-t"><div><p class="eyebrow">Szolgáltatások</p><h2 class="h2" id="h-szolg">Amiben segítünk</h2></div><a class="arrow" href="szolgaltatasok.html">Mind a hat</a></div>
      <div class="svc-grid">{svc_cards}</div>
    </section>

    <section class="card" aria-labelledby="h-mod">
      <p class="eyebrow t">Szemléletünk</p>
      <h2 class="h2" id="h-mod" style="margin-bottom:18px">Miért a MultiCont?</h2>
      <div class="approach">
        <blockquote class="quote"><p>Megbízható, rugalmas, magas színvonalú szolgáltatást nyújtok kisvállalkozók részére.</p><footer>Horváth Mária, alapító</footer></blockquote>
        <ul class="why">
          <li><span><b>Mérlegképes könyvelő és adótanácsadó</b> vezeti az irodát</span></li>
          <li><span><b>TB- és bérügyintézői</b> végzettség</span></li>
          <li><span><b>Személyesen</b> Budaörsön, <b>online</b> országosan</span></li>
          <li><span><b>Német nyelven</b> is, külföldi partnereknek</span></li>
          <li><span><b>Felelősségbiztosítás</b> mellett dolgozunk</span></li>
          <li><span><b>Végelszámolásban</b> nagy tapasztalat</span></li>
        </ul>
      </div>
    </section>

    <section class="card" aria-labelledby="h-maria">
      <div class="person">
        <div class="ph-slot" role="img" aria-label="Horváth Mária fotójának helye"><b>HM</b><span>Saját fotó helye</span></div>
        <div>
          <p class="eyebrow">A szakmai vezető</p>
          <h2 class="h3" id="h-maria">Horváth Mária</h2>
          <p class="muted" style="margin-top:4px">Mérlegképes könyvelő, adótanácsadó</p>
          <p style="margin-top:10px">Dolgozott a költségvetési szférában, magyar és nemzetközi tulajdonú cégeknél, öt évig cafeteria-tanácsadóként. Ügyfeleit magyarul és németül fogadja.</p>
          <p style="margin-top:12px"><a class="arrow" href="rolunk.html">Bővebben rólunk</a></p>
        </div>
      </div>
    </section>

    <section class="cta" aria-labelledby="h-cta">
      <div><h2 id="h-cta">Beszéljük át, mire van szüksége.</h2><p>Egy rövid hívásban kiderül, mit tudunk vállalni, és mennyi munkával jár.</p></div>
      <div class="btns"><a class="btn btn-w" href="tel:{TEL}">{TEL_H}</a><a class="btn btn-gh" href="kapcsolat.html">Üzenetet írok</a></div>
    </section>
  </div>

  <aside class="col-r" aria-label="Eszközök és partnerek">
    <section class="tool" id="mini-calc">
      <div class="tool-h"><h2>Gyorskalkulátor</h2><a class="arrow small" href="kalkulatorok.html">Mind</a></div>
      <div class="mini-tabs" role="tablist" aria-label="Gyorskalkulátor">
        <button role="tab" id="mt-ber" aria-controls="mp-ber" aria-selected="true">Bér</button>
        <button role="tab" id="mt-nb" aria-controls="mp-nb" aria-selected="false" tabindex="-1">Nettó→bruttó</button>
        <button role="tab" id="mt-afa" aria-controls="mp-afa" aria-selected="false" tabindex="-1">ÁFA</button>
      </div>
      <div class="tool-b">
        <div role="tabpanel" id="mp-ber" aria-labelledby="mt-ber">
          <label class="field-l" for="q-brutto">Bruttó havi bér</label>
          <input class="inp" id="q-brutto" type="text" inputmode="numeric" value="400 000" autocomplete="off">
          <dl class="mini-res"><div class="big"><dt>Nettó bér</dt><dd id="q-netto">–</dd></div><div><dt>Munkáltatói költség</dt><dd id="q-koltseg">–</dd></div></dl>
        </div>
        <div role="tabpanel" id="mp-nb" aria-labelledby="mt-nb" hidden>
          <label class="field-l" for="q-netto-in">Kívánt nettó bér</label>
          <input class="inp" id="q-netto-in" type="text" inputmode="numeric" value="266 000" autocomplete="off">
          <dl class="mini-res"><div class="big"><dt>Szükséges bruttó</dt><dd id="q-nb-brutto">–</dd></div><div><dt>Munkáltatói költség</dt><dd id="q-nb-koltseg">–</dd></div></dl>
        </div>
        <div role="tabpanel" id="mp-afa" aria-labelledby="mt-afa" hidden>
          <label class="field-l" for="q-afa">Nettó összeg</label>
          <input class="inp" id="q-afa" type="text" inputmode="numeric" value="100 000" autocomplete="off">
          <div class="mini-seg" role="radiogroup" aria-label="ÁFA-kulcs"><label><input type="radio" name="q-k" value="27" checked>27%</label><label><input type="radio" name="q-k" value="18">18%</label><label><input type="radio" name="q-k" value="5">5%</label></div>
          <dl class="mini-res"><div><dt>ÁFA</dt><dd id="q-afa-v">–</dd></div><div class="big"><dt>Bruttó</dt><dd id="q-afa-b">–</dd></div></dl>
        </div>
        <p class="note">2026-os kulcsok, kedvezmények nélkül. Tájékoztató jellegű.</p>
      </div>
    </section>

    <section class="tool">
      <div class="tool-h"><h2>Dokumentumok</h2><a class="arrow small" href="dokumentumtar.html">Tár</a></div>
      <div class="tool-b"><ul class="r-docs" data-mod="docs" data-n="4"></ul></div>
    </section>

    <section class="tool">
      <div class="tool-h"><h2>Partnerajánlat</h2><span class="tag demo">Minta</span></div>
      <div class="tool-b" data-mod="offer"></div>
    </section>

    <section class="tool">
      <div class="tool-h"><h2>Kiemelt partnerek</h2><a class="arrow small" href="partnerek.html">Lista</a></div>
      <div class="tool-b" data-mod="partners-mini" data-n="3"></div>
    </section>

    <section class="r-contact">
      <h2>Kérdése van?</h2>
      <a class="tel" href="tel:{TEL}">{TEL_H}</a>
      <p><a href="mailto:{MAIL}">{MAIL}</a></p>
      <p>{ADDR} · <a href="{MAPS}" target="_blank" rel="noopener">útvonal</a></p>
    </section>
  </aside>
</div>
'''

JSONLD = f'''
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"AccountingService","name":"MultiCont Center Kft.","url":"{BASE}","telephone":"{TEL}","email":"{MAIL}","logo":"{BASE}logo.svg","foundingDate":"2015-09-25","taxID":"25378669-2-13","address":{{"@type":"PostalAddress","streetAddress":"Meredek utca 2.","postalCode":"2040","addressLocality":"Budaörs","addressCountry":"HU"}},"areaServed":"HU","availableLanguage":["hu","de"],"founder":{{"@type":"Person","name":"Horváth Mária"}}}}</script>'''

page("index.html", "MultiCont Center Kft. – Könyvelés, adózási támogatás, Budaörs",
     "Könyvelés, bérszámfejtés, adózási támogatás és végelszámolás Budaörsön és online, 2015 óta. Szakmai hírek, kalkulátorok, dokumentumtár.",
     "index.html", home, extra_head=JSONLD, prio="1.0")
