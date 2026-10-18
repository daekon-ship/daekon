from common import *

# A név jelentése rajzban: a logó három eleme = MULTI (kék), CONT (türkiz), CENTER (arany közép)
NAME_SVG = '''<svg class="name-art" viewBox="0 0 560 236" role="img" aria-labelledby="na-t">
  <title id="na-t">A logó három eleme: MULTI, CONT és a CENTER középpont</title>
  <g class="ha-line"><path d="M0 90H560M280 0V236"/></g>
  <circle class="ha-pulse" cx="280" cy="90" r="78" fill="#EAF3FC"/>
  <path class="ha-flow" style="--len:60;--d:.5s" stroke="#2764BD" d="M180 90H220"/>
  <path class="ha-flow" style="--len:60;--d:.7s" stroke="#28B6A4" d="M380 90H340"/>
  <path class="ha-flow" style="--len:40;--d:.9s" stroke="#F3B85B" d="M280 150V178"/>
  <g class="ha-core" style="--d:.1s">
    <rect x="220" y="30" width="120" height="120" rx="16" fill="#fff" stroke="#DCE8F7"/>
    <g transform="translate(232 42) scale(2)"><path d="M6 6h22v6H12v16H6z" fill="#2764BD"/><path d="M42 42H20v-6h16V20h6z" fill="#28B6A4"/><rect x="18" y="18" width="12" height="12" fill="#F3B85B"/></g>
  </g>
  <g class="ha-node" style="--d:.35s"><rect x="0" y="62" width="180" height="56" rx="12"/><circle cx="22" cy="90" r="7" fill="#2764BD"/><text class="ha-cap" x="38" y="85" fill="#2764BD">MULTI</text><text x="38" y="104">Sokoldalúság</text></g>
  <g class="ha-node" style="--d:.5s"><rect x="380" y="62" width="180" height="56" rx="12"/><circle cx="402" cy="90" r="7" fill="#28B6A4"/><text class="ha-cap" x="418" y="85" fill="#13796D">CONT</text><text x="418" y="104">Contír · contract</text></g>
  <g class="ha-node" style="--d:.65s"><rect x="190" y="178" width="180" height="56" rx="12"/><circle cx="212" cy="206" r="7" fill="#F3B85B"/><text class="ha-cap" x="228" y="201" fill="#8A5B12">CENTER</text><text x="228" y="220">Kapcsolatok</text></g>
</svg>'''

svc_cards = ""
for i, (k, t, d) in enumerate(SVC):
    key = k == "vegelszamolas"
    svc_cards += (f'<li><a class="svc-row{" key" if key else ""}" href="{svc_url(k)}"><span class="n">{i+1:02d}</span>{icon(k)}'
                  f'<span class="tx"><b>{t}{" <span class=\"tag g\">Kiemelt szakterület</span>" if key else ""}</b><span>{d}</span></span><span class="go" aria-hidden="true">→</span></a></li>')

home = f'''
<div class="dateline"><div class="wrap" data-mod="dateline"><span>Aktuális adóhírek · határidők · kalkulátorok</span></div></div>
<div class="wrap portal portal-home">

  <aside class="col-l" aria-label="Aktuális adóhírek és határidők">
    <div class="col-h o4"><h2>Aktuális adóhírek</h2><a href="tudastar.html">Tudástár</a></div>
    <section class="mod o4">
      <a class="hot" data-mod="hot" href="tudastar.html?tema=KATA"></a>
    </section>
    <section class="mod m-hide o4">
      <div class="mod-h"><h3>További hírek</h3><a href="tudastar.html">Összes</a></div>
      <ul class="l-news" data-mod="news" data-n="3" data-skip-hot="1"></ul>
    </section>
    <section class="mod o4">
      <div class="mod-h"><h3>Közelgő határidők</h3><a href="tudastar.html?tema=%C3%89ves%20ad%C3%B3z%C3%A1si%20k%C3%B6telezetts%C3%A9gek">Mind</a></div>
      <ul class="l-dead" data-mod="deadlines" data-n="3"></ul>
    </section>
    <section class="mod t-hide">
      <div class="mod-h"><h3>Hivatalos oldalak</h3></div>
      <ul class="l-links" data-mod="links" data-n="4"></ul>
    </section>
    <p class="m-only m-more o4"><a class="arrow" href="tudastar.html">Összes adóhír és tudnivaló</a></p>
  </aside>

  <div class="col-m">
    <section class="intro o1" aria-labelledby="h-hero">
      <p class="eyebrow">Könyvelőiroda · Budaörs · 2015 óta</p>
      <h1 class="h1" id="h-hero">Könyvelés és adózási támogatás, biztos szakmai háttérrel.</h1>
      <p class="lead">Személyre szabott könyvelési és pénzügyi támogatás vállalkozásoknak, Budaörsön és online.</p>
      <dl class="intro-facts">
        <div><dt>Tapasztalat</dt><dd><b>30 év</b> pénzügyi-számviteli gyakorlat</dd></div>
        <div><dt>Kiknek</dt><dd>Egyéni vállalkozók, bt.-k és kft.-k</dd></div>
        <div><dt>Hogyan</dt><dd>Személyesen Budaörsön vagy online, magyarul és németül</dd></div>
      </dl>
      <div class="intro-cta">
        <a class="btn btn-p" href="kapcsolat.html">Kapcsolatfelvétel {I_ARROW}</a>
        <a class="intro-tel" href="tel:{TEL}"><small>vagy hívjon</small>{TEL_H}</a>
      </div>
    </section>

    <section class="ed rv o2" aria-labelledby="h-szolg">
      <div class="sec-t"><div><p class="eyebrow"><span class="no">01</span>Szolgáltatások</p><h2 class="h2" id="h-szolg">Amiben segítünk</h2></div><a class="arrow" href="szolgaltatasok.html">Összes részlet</a></div>
      <ol class="svc-idx">{svc_cards}</ol>
    </section>

    <section class="ed rv o3" aria-labelledby="h-maria">
      <p class="eyebrow"><span class="no">02</span>A szakmai vezető</p>
      <div class="pro">
        <figure class="portrait" aria-label="Horváth Mária portréjának helye">
          <div class="portrait-fr"><span class="mono">HM</span><span class="cap">Portré helye<br>Horváth Mária saját fotója</span></div>
        </figure>
        <div class="pro-b">
          <h2 class="h2" id="h-maria">Horváth Mária</h2>
          <p class="role">Alapító, szakmai vezető · mérlegképes könyvelő, adótanácsadó</p>
          <blockquote class="pq">„Megbízható, rugalmas, magas színvonalú szolgáltatást nyújtok kisvállalkozók részére.”</blockquote>
          <dl class="pro-facts">
            <div><dt>Tapasztalat</dt><dd>30 év pénzügy és számvitel</dd></div>
            <div><dt>Végzettség</dt><dd>Mérlegképes könyvelő, adótanácsadó, TB- és bérügyintéző</dd></div>
            <div><dt>Pálya</dt><dd>Költségvetési szféra, magyar és nemzetközi cégek</dd></div>
            <div><dt>Nyelvek</dt><dd>Magyar, német</dd></div>
          </dl>
          <a class="arrow" href="rolunk.html">Bővebben rólunk</a>
        </div>
      </div>
    </section>

    <section class="ed rv o3" aria-labelledby="h-nev">
      <p class="eyebrow"><span class="no">03</span>A nevünk</p>
      <h2 class="h2" id="h-nev">Multi · Cont · Center</h2>
      {NAME_SVG}
      <ul class="chips3">
        <li><b>Multi</b> sokoldalúság, sokféleség, növekedés</li>
        <li><b>Cont</b> contír (könyvelés) és contract (szerződés)</li>
        <li><b>Center</b> közös pont ügyfeleknek, partnereknek</li>
      </ul>
      <p class="ed-p">A céget eredetileg sem kizárólag könyvelésre alapítottuk: nyitottak vagyunk új tevékenységekre és együttműködésekre.</p>
    </section>

    <section class="ed rv o6" aria-labelledby="h-net">
      <p class="eyebrow"><span class="no">04</span>Partnerközpont</p>
      <h2 class="h2" id="h-net">Kapcsolat más vállalkozásokkal</h2>
      <p class="ed-p">Ügyfeleink gyakran keresnek ügyvédet, biztosítót, szoftvert. Összekötjük őket azokkal a cégekkel, akiket jó szívvel ajánlunk.</p>
      <ul class="net-l">
        <li><a href="partnerek.html"><span class="ni b">↗</span><span><b>Partnerlinkek</b> átlinkelés a partnerek oldalára</span></a></li>
        <li><a href="partnerek.html#ajanlo"><span class="ni t">⇄</span><span><b>Ajánlói rendszer</b> saját linkkel ajánljuk egymást</span></a></li>
        <li><a href="partnerek.html#ajanlatok"><span class="ni g">%</span><span><b>Kuponajánlatok</b> kedvezmények ügyfeleinknek</span></a></li>
      </ul>
    </section>

    <section class="cta o7" aria-labelledby="h-cta">
      <div><h2 id="h-cta">Beszéljük át, mire van szüksége.</h2><p>Hívjon, vagy kérjen visszahívást – mi keressük.</p></div>
      <div class="btns"><a class="btn btn-w" href="tel:{TEL}">{TEL_H}</a><button class="btn btn-gh" type="button" data-dlg="visszahivas">Visszahívást kérek</button></div>
    </section>
  </div>

  <aside class="col-r" aria-label="Kalkulátor, dokumentumok, kapcsolat">
    <div class="col-h t-hide"><h2>Eszköztár</h2></div>
    <section class="tool o5" id="mini-calc">
      <div class="tool-h"><h2>Bérkalkulátor</h2><span class="tag live t">2026</span></div>
      <div class="mini-tabs" role="tablist" aria-label="Bérkalkulátor">
        <button role="tab" id="mt-ber" aria-controls="mp-ber" aria-selected="true">Bruttó → nettó</button>
        <button role="tab" id="mt-nb" aria-controls="mp-nb" aria-selected="false" tabindex="-1">Nettó → bruttó</button>
      </div>
      <div class="tool-b">
        <div role="tabpanel" id="mp-ber" aria-labelledby="mt-ber">
          <label class="field-l" for="q-brutto">Bruttó havi bér (Ft)</label>
          <input class="inp" id="q-brutto" type="text" inputmode="numeric" value="400 000" autocomplete="off">
          <dl class="mini-res"><div class="big"><dt>Nettó bér</dt><dd id="q-netto">–</dd></div><div><dt>Munkáltatói költség</dt><dd id="q-koltseg">–</dd></div></dl>
        </div>
        <div role="tabpanel" id="mp-nb" aria-labelledby="mt-nb" hidden>
          <label class="field-l" for="q-netto-in">Kívánt nettó bér (Ft)</label>
          <input class="inp" id="q-netto-in" type="text" inputmode="numeric" value="266 000" autocomplete="off">
          <dl class="mini-res"><div class="big"><dt>Szükséges bruttó</dt><dd id="q-nb-brutto">–</dd></div><div><dt>Munkáltatói költség</dt><dd id="q-nb-koltseg">–</dd></div></dl>
        </div>
        <p class="note">SZJA 15%, TB 18,5%, szocho 13% · kedvezmények nélkül</p>
        <p class="calc-k">További kalkulátorok</p>
        <div class="calc-more"><a href="kalkulatorok.html#afa">ÁFA</a><a href="kalkulatorok.html#kata">KATA 2026</a><a href="kalkulatorok.html#munkaltato">Munkáltatói költség</a><a href="kalkulatorok.html#eredmeny">Bevétel – kiadás</a><a href="kalkulatorok.html#koltsegterv">Költségtervező</a></div>
      </div>
    </section>

    <section class="tool o6">
      <div class="tool-h"><h2>Dokumentumtár</h2><a class="arrow small" href="dokumentumtar.html">Mind</a></div>
      <div class="tool-b"><ul class="r-docs" data-mod="docs" data-n="3"></ul></div>
    </section>

    <section class="r-contact t-hide">
      <h2>Kérdése van?</h2>
      <a class="tel" href="tel:{TEL}">{TEL_H}</a>
      <p><a href="mailto:{MAIL}">{MAIL}</a></p>
      <button class="btn btn-w btn-s" type="button" data-dlg="visszahivas">Visszahívást kérek</button>
    </section>
  </aside>
</div>
'''

JSONLD = f'''
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"AccountingService","name":"MultiCont Center Kft.","url":"{BASE}","telephone":"{TEL}","email":"{MAIL}","logo":"{BASE}logo.svg","foundingDate":"2015-09-25","taxID":"25378669-2-13","address":{{"@type":"PostalAddress","streetAddress":"Meredek utca 2.","postalCode":"2040","addressLocality":"Budaörs","addressCountry":"HU"}},"areaServed":"HU","availableLanguage":["hu","de"],"founder":{{"@type":"Person","name":"Horváth Mária"}}}}</script>'''

page("index.html", "MultiCont Center Kft. – Könyvelés, adózási támogatás, Budaörs",
     "Könyvelés, bérszámfejtés, adózási támogatás és végelszámolás Budaörsön és online, 2015 óta. Aktuális adóhírek, kalkulátorok, dokumentumtár, partnerközpont.",
     "index.html", home, extra_head=JSONLD, prio="1.0")
