from common import *

# ======================= TUDÁSTÁR =======================
tud = ph("Tudástár", "Adózási változások, határidők és vállalkozói tudnivalók – minden cikk mellett a forrás, a közzététel dátuma és hogy melyik időszakra érvényes.", ["Tudástár"]) + f'''
<div class="wrap kb">
  <aside class="kb-side" aria-label="Témák">
    <h2>Témák</h2>
    <div class="topics" id="kb-topics"></div>
    <div class="tool" style="margin-top:24px"><div class="tool-h"><h2>Közelgő határidők</h2></div><div class="tool-b"><ul class="l-dead" data-mod="deadlines" data-n="3"></ul><p class="src" data-mod="deadline-src"></p></div></div>
  </aside>
  <div>
    <form class="kb-tools" id="kb-form" role="search">
      <div class="search"><label class="vh" for="kb-q">Keresés a cikkekben</label><input id="kb-q" type="search" placeholder="Keresés: KATA, ÁFA, minimálbér…" autocomplete="off"><span class="ico" aria-hidden="true">{I_SEARCH}</span></div>
      <div class="kb-mtopics"><label class="vh" for="kb-tema">Téma</label><select class="select" id="kb-tema" style="width:100%"></select></div>
      <div><label class="vh" for="kb-sort">Rendezés</label><select class="select" id="kb-sort" style="width:100%"><option value="uj">Legújabb elöl</option><option value="regi">Legrégebbi elöl</option><option value="frissitett">Legutóbb frissített</option></select></div>
    </form>
    <a class="feat" id="kb-feat" href="#" hidden></a>
    <p class="count" id="kb-count" aria-live="polite" style="margin:18px 0 4px"></p>
    <ul class="alist" id="kb-list"></ul>
    <p class="disc">Tájékoztató összefoglalók, nem minősülnek adótanácsadásnak. Az irányadó a hivatalos jogszabály és a NAV közleménye.</p>
  </div>
</div>
'''
page("tudastar.html", "Tudástár – MultiCont Center Kft. | KATA, ÁFA, SZJA, bérszámfejtés, határidők",
     "Adózási és vállalkozói tudnivalók forrásmegjelöléssel: KATA, ÁFA, SZJA, átalányadó, TAO, KIVA, bérszámfejtés, járulékok, határidők.", "tudastar.html", tud, prio="0.9")

cikk = f'''<section class="ph"><div class="wrap" style="padding-bottom:18px;padding-top:24px">
  <nav aria-label="Morzsamenü"><ol class="crumbs"><li><a href="index.html">Kezdőlap</a></li><li><a href="tudastar.html">Tudástár</a></li><li id="crumb-cikk" aria-current="page"></li></ol></nav>
</div></section>
<div class="wrap read">
  <div>
    <article class="article" id="article"></article>
    <section style="margin-top:44px;max-width:760px" aria-labelledby="h-rel"><div class="mod-h"><h2 class="h4" id="h-rel">Kapcsolódó cikkek</h2><a href="tudastar.html">Tudástár</a></div><ul class="alist" id="related"></ul></section>
  </div>
  <aside class="side-box">
    <div class="tool"><div class="tool-h"><h2>Közelgő határidők</h2></div><div class="tool-b"><ul class="l-dead" data-mod="deadlines" data-n="3"></ul></div></div>
    <div class="tool"><div class="tool-h"><h2>Számoljon utána</h2></div><div class="tool-b"><div class="l-nav" style="grid-template-columns:1fr">
      <a href="kalkulatorok.html#brutto-netto">Bruttó → nettó bér</a><a href="kalkulatorok.html#kata">KATA 2026</a><a href="kalkulatorok.html#afa">ÁFA-kalkulátor</a></div></div></div>
    <section class="r-contact"><h2>Kérdése van a cikk kapcsán?</h2><a class="tel" href="tel:{TEL}">{TEL_H}</a><p><a href="mailto:{MAIL}">{MAIL}</a></p></section>
  </aside>
</div>
'''
page("cikk.html", "Cikk – Tudástár – MultiCont Center Kft.", "Szakmai cikk forrásmegjelöléssel, hatályossági időszakkal.", "tudastar.html", cikk, prio="0.6")

# régi cím → átirányítás
(OUT / "hirek.html").write_text('''<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"><title>Tudástár – MultiCont Center Kft.</title>
<meta name="robots" content="noindex"><link rel="canonical" href="tudastar.html">
<script>location.replace('tudastar.html'+location.search.replace('kat=','tema='))</script>
<meta http-equiv="refresh" content="0; url=tudastar.html"></head><body><p><a href="tudastar.html">A szakmai hírek a Tudástárba költöztek.</a></p></body></html>
''', encoding="utf-8")

# ======================= KALKULÁTOROK =======================
SRC = 'SZJA 15%, TB-járulék 18,5%, szociális hozzájárulási adó 13% (2026). Forrás: <a class="ext" href="https://taxhungary.hu/hu/mi-mennyi-2026-ban-berek-jarulekok-adokulcsok-es-ertekhatarok/" target="_blank" rel="noopener">TaxHungary</a>, ellenőrizve 2026. 10. 14.'
def num(id_, label, val, hint="", presets=""):
    return f'<div class="fld"><label for="{id_}">{label}</label><input class="inp" id="{id_}" type="text" inputmode="numeric" value="{val}" autocomplete="off">{f"<p class=hint>{hint}</p>" if hint else ""}{presets}</div>'
MIN = '<div class="presets"><button type="button" data-set="{0}" data-val="322800">Minimálbér: 322 800</button><button type="button" data-set="{0}" data-val="373200">Garantált bérminimum: 373 200</button></div>'
def panel(pid, title, tag, left, right, hidden=True):
    return f'''<section class="cpanel" role="tabpanel" id="cp-{pid}" aria-labelledby="ct-{pid}"{" hidden" if hidden else ""}>
  <div class="cpanel-h"><h2>{title}</h2>{tag}</div>
  <div class="cpanel-b"><div>{left}</div><div>{right}</div></div>
</section>'''
LIVE = '<span class="tag live t">Működik · 2026-os kulcsok</span>'
DEMO = '<span class="tag demo">Demo · nem végleges számítás</span>'
EXEMPT = lambda i: f'<label class="check"><input type="checkbox" id="{i}"> SZJA-mentes vagyok (pl. 25 év alatti vagy kedvezményezett anya)</label><p class="hint">A mentesség felső határát nem számolja.</p>'
STEPS = lambda i: f'<details class="steps"><summary>Hogyan számoltunk?</summary><ol id="{i}"></ol></details>'

panels = [
    panel("brutto-netto", "Bruttó → nettó bér", LIVE,
          num("b-brutto", "Bruttó havi bér (Ft)", "400 000", presets=MIN.format("b-brutto")) + EXEMPT("b-mentes"),
          '<dl class="res"><div><dt>Bruttó bér</dt><dd id="b-br">–</dd></div><div><dt>SZJA (15%)</dt><dd id="b-szja">–</dd></div><div><dt>TB-járulék (18,5%)</dt><dd id="b-tb">–</dd></div><div class="main"><dt>Nettó bér</dt><dd id="b-netto">–</dd></div><div><dt>Szociális hozzájárulási adó (13%)</dt><dd id="b-szocho">–</dd></div><div><dt>Munkáltató teljes költsége</dt><dd id="b-koltseg">–</dd></div></dl>'
          + STEPS("b-steps") + f'<p class="csrc">{SRC} Kedvezményeket (családi, első házas, személyi) nem számol.</p>', hidden=False),
    panel("netto-brutto", "Nettó → bruttó bér", LIVE,
          num("n-netto", "Kívánt nettó havi bér (Ft)", "266 000", "Megmutatja, mekkora bruttó bérből lesz ennyi kézhez.") + EXEMPT("n-mentes"),
          '<dl class="res"><div class="main"><dt>Szükséges bruttó bér</dt><dd id="n-brutto">–</dd></div><div><dt>SZJA</dt><dd id="n-szja">–</dd></div><div><dt>TB-járulék</dt><dd id="n-tb">–</dd></div><div><dt>Munkáltató teljes költsége</dt><dd id="n-koltseg">–</dd></div></dl>'
          + STEPS("n-steps") + f'<p class="csrc">{SRC}</p>'),
    panel("munkaltato", "Munkáltatói költség", LIVE,
          num("mk-brutto", "Tervezett bruttó bér (Ft/hó)", "500 000") + num("mk-keret", "Vagy: mennyit tud havonta bérre költeni? (Ft)", "", "Megmutatjuk, mekkora bruttó bér fér bele."),
          '<dl class="res"><div><dt>Bruttó bér</dt><dd id="mk-br">–</dd></div><div><dt>Szociális hozzájárulási adó (13%)</dt><dd id="mk-szocho">–</dd></div><div class="main"><dt>Havi költség</dt><dd id="mk-ossz">–</dd></div><div><dt>Éves költség (12 hó)</dt><dd id="mk-ev">–</dd></div><div><dt>A keretből adható bruttó bér</dt><dd id="mk-maxbrutto">–</dd></div></dl>'
          '<p class="csrc">Szociális hozzájárulási adó 13% (2026), forrás: TaxHungary. Egyéb munkáltatói terheket és kedvezményeket nem számol.</p>'),
    panel("afa", "ÁFA-kalkulátor", LIVE,
          num("a-osszeg", "Összeg (Ft)", "100 000") + '<fieldset class="seg"><legend class="vh">A megadott összeg</legend><label><input type="radio" name="a-irany" value="netto" checked> nettó</label><label><input type="radio" name="a-irany" value="brutto"> bruttó</label></fieldset><fieldset class="seg"><legend class="vh">ÁFA-kulcs</legend><label><input type="radio" name="a-kulcs" value="27" checked> 27%</label><label><input type="radio" name="a-kulcs" value="18"> 18%</label><label><input type="radio" name="a-kulcs" value="5"> 5%</label></fieldset>',
          '<dl class="res"><div><dt>Nettó</dt><dd id="a-netto">–</dd></div><div><dt>ÁFA</dt><dd id="a-afa">–</dd></div><div class="main"><dt>Bruttó</dt><dd id="a-brutto">–</dd></div></dl>'
          '<p class="csrc">Hogy egy termékre vagy szolgáltatásra melyik kulcs vonatkozik, azt a jogszabály határozza meg – kérdés esetén segítünk.</p>'),
    panel("kata", "KATA 2026 – éves teher", LIVE,
          num("k-bevetel", "Várható éves bevétel 2026-ban (Ft)", "15 000 000") + num("k-honap", "Hány hónapig katás 2026-ban?", "12", "Havi 50 000 Ft tételes adó; a bevételi határ arányosan csökken.")
          + '<p class="hint">Főfoglalkozású egyéni vállalkozóra, aki csak magánszemélyeknek számláz.</p>',
          '<dl class="res"><div><dt>Tételes adó</dt><dd id="k-teteles">–</dd></div><div><dt>Bevételi határ</dt><dd id="k-hatar">–</dd></div><div><dt>Adó a határ feletti részre (40%)</dt><dd id="k-felett">–</dd></div><div class="main"><dt>Fizetendő összesen</dt><dd id="k-ossz">–</dd></div></dl>'
          + STEPS("k-steps") + '<p class="csrc">Forrás: <a class="ext" href="https://financera.hu/szemelyes-penzugyek/kata-kisadozo-vallalkozok-teteles-adoja/" target="_blank" rel="noopener">Financera</a> (2026. 10. 04.). A 2027-re tervezett új KATA-ról <a href="cikk.html?id=uj-kata-2027-tervezet">ebben a cikkben</a> olvashat.</p>'),
    panel("eredmeny", "Bevétel – kiadás", '<span class="tag n">Egyszerű matematika</span>',
          num("e-bev", "Bevétel (Ft)", "1 200 000") + num("e-kia", "Kiadás (Ft)", "780 000") + '<fieldset class="seg"><legend class="vh">Időszak</legend><label><input type="radio" name="e-per" value="1" checked> havi</label><label><input type="radio" name="e-per" value="12"> éves</label></fieldset>',
          '<dl class="res"><div class="main"><dt>Eredmény</dt><dd id="e-ered">–</dd></div><div><dt>Kiadás a bevétel arányában</dt><dd id="e-arany">–</dd></div><div><dt>Árrés (eredmény / bevétel)</dt><dd id="e-margin">–</dd></div><div><dt>Éves szinten</dt><dd id="e-ev">–</dd></div></dl>'
          '<p class="csrc">Adó előtti, egyszerű különbség. Hogy ebből mennyi az adó, az adózási formától függ.</p>'),
    panel("koltsegterv", "Költségtervező", '<span class="tag n">Egyszerű matematika</span>',
          '<p class="hint" style="margin:0 0 12px">Írja be a vállalkozás rendszeres havi költségeit. A sorok szerkeszthetők.</p><ul class="costs" id="ct-list"></ul><button class="btn btn-o btn-s" type="button" id="ct-add">+ Új sor</button>',
          '<dl class="res"><div><dt>Tételek száma</dt><dd id="ct-n">–</dd></div><div class="main"><dt>Havi összesen</dt><dd id="ct-ho">–</dd></div><div><dt>Éves összesen</dt><dd id="ct-ev">–</dd></div><div><dt>Legnagyobb tétel</dt><dd id="ct-max">–</dd></div></dl>'
          '<p class="csrc">A böngészője ideiglenesen megjegyzi a sorokat; adat nem kerül hozzánk.</p>'),
    f'''<section class="cpanel" role="tabpanel" id="cp-osszehasonlitas" aria-labelledby="ct-osszehasonlitas" hidden>
  <div class="cpanel-h"><h2>Adózási formák összehasonlítása</h2>{DEMO}</div>
  <div style="padding:24px"><div class="prep">
    <p class="h4">Előkészítés alatt – ez a modul még nem számol.</p>
    <p style="margin-top:8px">A KATA, az átalányadó és a vállalkozói SZJA összevetése sok feltételtől függ (költséghányad, járulékalap, minimálbér, kedvezmények, vevők köre). Élesítés előtt könyvelői ellenőrzéssel teszteljük a képletet, hogy ne mutasson félrevezető eredményt.</p>
    <p style="margin-top:10px"><b>Ellenőrzött 2026-os adatok, amelyekre épül:</b></p>
    <ul><li>KATA: havi 50 000 Ft, 18 M Ft bevételi határ, felette 40%</li><li>Átalányadó: 45%-os általános költséghányad, 1 936 800 Ft adómentes rész, 38 736 000 Ft bevételi határ</li><li>SZJA 15%, TB-járulék 18,5%, szociális hozzájárulási adó 13%</li></ul>
    <p style="margin-top:12px"><a class="arrow" href="szolgaltatas-adotanacsadas.html">Addig: kérjen személyes összevetést</a></p>
  </div></div>
</section>''',
]
CL = [("Bér", [("brutto-netto", "Bruttó → nettó"), ("netto-brutto", "Nettó → bruttó"), ("munkaltato", "Munkáltatói költség")]),
      ("Adó", [("afa", "ÁFA"), ("kata", "KATA 2026"), ("osszehasonlitas", "Adózási formák")]),
      ("Tervezés", [("eredmeny", "Bevétel – kiadás"), ("koltsegterv", "Költségtervező")])]
clist = ""
first = True
for g, items in CL:
    clist += f'<p class="cg" aria-hidden="true">{g}</p>'
    for pid, t in items:
        badge = ' <span class="tag demo">Demo</span>' if pid == "osszehasonlitas" else ''
        clist += f'<button role="tab" id="ct-{pid}" data-hash="{pid}" aria-controls="cp-{pid}" aria-selected="{"true" if first else "false"}"{"" if first else " tabindex=\"-1\""}>{t}{badge}</button>'
        first = False
kalk = ph("Kalkulátorok", "Bér, ÁFA, KATA és egyszerű tervezés. A bér- és adókalkulátorok ellenőrzött 2026-os kulcsokkal számolnak; a pontos összeghez kérje a segítségünket.", ["Kalkulátorok"]) + f'''
<div class="wrap calc">
  <div class="clist" role="tablist" aria-label="Kalkulátorok" aria-orientation="vertical">{clist}</div>
  <div>{"".join(panels)}
    <p class="disc">Az eredmények tájékoztató jellegűek, nem minősülnek adótanácsadásnak.</p>
  </div>
</div>
'''
page("kalkulatorok.html", "Kalkulátorok – MultiCont Center Kft. | Bér, ÁFA, KATA 2026",
     "Bruttó–nettó és nettó–bruttó bérkalkulátor, munkáltatói költség, ÁFA, KATA 2026, bevétel–kiadás és költségtervező, ellenőrzött 2026-os kulcsokkal.", "kalkulatorok.html", kalk, prio="0.8")

# ======================= DOKUMENTUMTÁR =======================
dok = ph("Dokumentumtár", "Formanyomtatványok és szakmai anyagok egy helyen, verziószámmal és dátummal. Az új anyagokat az iroda maga tölti fel.", ["Dokumentumtár"]) + f'''
<div class="wrap" style="padding-top:32px;padding-bottom:64px">
  <p class="notice" style="margin-bottom:20px">Itt csak nyilvános, közzétételre jóváhagyott dokumentumok vannak. Ügyféliratokat soha nem teszünk ide – azokhoz később külön, belépéssel védett felület készülhet.</p>
  <div class="dtools">
    <div class="search"><label class="vh" for="doc-q">Keresés a dokumentumokban</label><input id="doc-q" type="search" placeholder="Keresés a dokumentumokban" autocomplete="off"><span class="ico" aria-hidden="true">{I_SEARCH}</span></div>
    <div><label class="vh" for="doc-kat">Kategória</label><select class="select" id="doc-kat" style="width:100%"></select></div>
    <label class="check"><input type="checkbox" id="doc-arch"> Archivált változatok is</label>
  </div>
  <p class="count" id="doc-count" aria-live="polite" style="margin-bottom:8px"></p>
  <div id="doclib"></div>
</div>
'''
page("dokumentumtar.html", "Dokumentumtár – MultiCont Center Kft. | Letölthető dokumentumok, nyomtatványok",
     "Letölthető tájékoztatók, az iroda nyomtatványai és hivatalos NAV-felületek, kategóriák szerint, verziószámmal.", "dokumentumtar.html", dok)

# ======================= PARTNEREK =======================
CHK = '<label class="check"><input type="checkbox" name="hozzajarul" data-rule="hozzajarul" data-label="Hozzájárulás"> <span>Hozzájárulok, hogy a megadott adatokkal felvegyék velem a kapcsolatot. <span class="msg" style="display:block"></span></span></label>'
def f(id_, label, name, rule="", typ="text", req=True, ac="", ph_=""):
    r = f' data-rule="{rule}"' if rule else ''
    return f'<div class="f"><label for="{id_}">{label}{" <span>*</span>" if req else ""}</label><input id="{id_}" type="{typ}" name="{name}"{r} data-label="{label}"{f" autocomplete={ac}" if ac else ""}{f" placeholder=\"{ph_}\"" if ph_ else ""}><p class="msg"></p></div>'
HP = '<div class="hp" aria-hidden="true"><label for="{0}-web2">Ne töltse ki</label><input id="{0}-web2" name="web2" tabindex="-1" autocomplete="off"></div>'
DONE = '<div class="done" hidden role="status"><p><b>Megnyílt a levelezőprogramja</b> a kész üzenettel. Az Elküldés gombbal érkezik meg hozzánk – amíg nem küldi el, nem kaptuk meg.</p><p>Nem nyílt meg? <button class="btn btn-o btn-s" type="button" data-copy>Szöveg másolása</button></p></div>'
KATS = "".join(f'<option>{k}</option>' for k in ["Jogi szolgáltatás", "Pénzügy és biztosítás", "Informatika és szoftver", "Marketing és kommunikáció", "Egyéb vállalkozói szolgáltatás"])

partner = ph("Partnereink", "Megbízható szakemberek, akiket ügyfeleinknek ajánlunk – és akik minket ajánlanak. A partnerprogram most indul: az alábbi kártyák a működését mutatják be.", ["Partnereink"]) + f'''
<section class="band" style="padding-top:32px">
  <div class="wrap">
    <p class="notice w" style="margin-bottom:20px"><b>Minta.</b> A partnerlista feltöltés alatt áll. A kártyák és ajánlatok csak a megjelenést mutatják, valódi céget és kedvezményt nem tartalmaznak.</p>
    <div class="dtools" style="grid-template-columns:minmax(0,1fr) 260px">
      <div class="search"><label class="vh" for="p-q">Keresés a partnerek között</label><input id="p-q" type="search" placeholder="Keresés a partnerek között" autocomplete="off"><span class="ico" aria-hidden="true">{I_SEARCH}</span></div>
      <div><label class="vh" for="p-kat">Kategória</label><select class="select" id="p-kat" style="width:100%"></select></div>
    </div>
    <div class="pgrid" id="p-grid"></div>
  </div>
</section>

<section class="band band-off" id="ajanlatok">
  <div class="wrap">
    <div class="bhead"><div><p class="eyebrow g">Ajánlatok és kuponok</p><h2 class="h2">Kedvezmények ügyfeleinknek</h2></div><p class="lead">A partnerek időszakos ajánlatai, kuponkóddal és lejárati dátummal. Minden ajánlat az iroda jóváhagyása után jelenik meg.</p></div>
    <div class="pgrid" id="o-grid"></div>
  </div>
</section>

<section class="band" id="ajanlo">
  <div class="wrap">
    <div class="bhead"><div><p class="eyebrow t">Ajánlói rendszer</p><h2 class="h2">Így ajánljuk egymást</h2></div><p class="lead">Az alap már most működik: a partner saját linkjével érkező érdeklődőnél az ajánlói kód automatikusan bekerül az űrlapba. A nyilvántartáshoz háttérrendszer kell.</p></div>
    <ol class="flow">
      <li><h3>Partnerlink</h3><p>Minden partner kártyája és aloldala átlinkel a partner saját weboldalára.</p><span class="tag live t">Kész – a címet a partner adja meg</span></li>
      <li><h3>Ajánlói link</h3><p>A partner saját kódot kap: <code>kapcsolat.html?ajanlo=KÓD</code></p><span class="tag live t">Működik</span></li>
      <li><h3>Kuponkód</h3><p>Az ajánlatokhoz kód és lejárati dátum tartozik.</p><span class="tag live t">Megjelenítés működik</span></li>
      <li><h3>Érdeklődő rögzítése</h3><p>Ma: a kód bekerül az e-mailbe. Később: nyilvántartás.</p><span class="tag demo">Részben</span></li>
      <li><h3>Jóváhagyás</h3><p>Partner, ajánlat és ajánlás csak jóváhagyás után él.</p><span class="tag demo">Backend kell</span></li>
    </ol>
  </div>
</section>

<section class="band band-off" id="jelentkezes">
  <div class="wrap cgrid">
    <div>
      <p class="eyebrow">Kapcsolatfelvétel</p>
      <h2 class="h2">Ajánlatkérés, ajánlás, jelentkezés</h2>
      <p style="margin-top:12px">Kérjen ajánlatot egy partnertől, ajánljon nekünk egy szakembert, vagy jelentkezzen partnernek. Minden űrlap a levelezőprogramján keresztül érkezik meg hozzánk.</p>
      <ul class="why" style="grid-template-columns:1fr;margin-top:18px">
        <li><span><b>Jóváhagyás után</b> jelenik meg bármi a listán</span></li>
        <li><span><b>Hivatkozás</b> a partner weboldalára</span></li>
        <li><span><b>Kölcsönös ajánlás</b> ajánlói kóddal</span></li>
      </ul>
    </div>
    <div>
      <div class="ftabs" role="tablist" aria-label="Űrlap típusa">
        <button role="tab" id="ft-ajanlat" data-hash="ajanlatkeres" aria-controls="fp-ajanlat" aria-selected="true">Ajánlatkérés</button>
        <button role="tab" id="ft-ajanlas" data-hash="ajanlas" aria-controls="fp-ajanlas" aria-selected="false" tabindex="-1">Partner ajánlása</button>
        <button role="tab" id="ft-jel" data-hash="jelentkezes" aria-controls="fp-jel" aria-selected="false" tabindex="-1">Jelentkezés</button>
      </div>
      <form class="form" role="tabpanel" id="fp-ajanlat" aria-labelledby="ft-ajanlat" novalidate data-mail="{MAIL}" data-subject="Ajánlatkérés partnertől">
        {HP.format("aj")}
        <div class="f"><label for="aj-p">Melyik partnertől? <span>*</span></label><select id="aj-p" name="partner" data-rule="select" data-label="Partner"><option value="">Válasszon…</option></select><p class="msg"></p></div>
        <div class="f2">{f("aj-nev", "Név", "nev", "nev", ac="name")}{f("aj-mail", "E-mail", "email", "email", "email", ac="email")}</div>
        <div class="f"><label for="aj-uz">Mire kér ajánlatot? <span>*</span></label><textarea id="aj-uz" name="uzenet" data-rule="uzenet" data-label="Kérés"></textarea><p class="msg"></p></div>
        <div class="f2">{f("aj-kup", "Kuponkód (ha van)", "kupon", req=False)}{f("aj-ref", "Ajánlói kód (ha van)", "ajanlo", req=False)}</div>
        {CHK}<button class="btn btn-p btn-b" type="submit" style="margin-top:14px">Ajánlatkérés küldése</button>{DONE}
      </form>
      <form class="form" role="tabpanel" id="fp-ajanlas" aria-labelledby="ft-ajanlas" hidden novalidate data-mail="{MAIL}" data-subject="Partner ajánlása">
        {HP.format("an")}
        <div class="f2">{f("an-ceg", "Ajánlott vállalkozás", "ceg", "ceg")}{f("an-web", "Weboldala", "weboldal", "weboldal", "url", False, ph_="https://")}</div>
        <div class="f"><label for="an-kat">Kategória <span>*</span></label><select id="an-kat" name="kategoria" data-rule="select" data-label="Kategória"><option value="">Válasszon…</option>{KATS}</select><p class="msg"></p></div>
        <div class="f"><label for="an-uz">Miért ajánlja? <span>*</span></label><textarea id="an-uz" name="uzenet" data-rule="uzenet" data-label="Indoklás"></textarea><p class="msg"></p></div>
        <div class="f2">{f("an-nev", "Az Ön neve", "nev", "nev", ac="name")}{f("an-mail", "E-mail", "email", "email", "email", ac="email")}</div>
        {CHK}<button class="btn btn-p btn-b" type="submit" style="margin-top:14px">Ajánlás küldése</button>{DONE}
      </form>
      <form class="form" role="tabpanel" id="fp-jel" aria-labelledby="ft-jel" hidden novalidate data-mail="{MAIL}" data-subject="Partnerjelentkezés">
        {HP.format("pj")}
        <div class="f2">{f("pj-ceg", "Cégnév", "ceg", "ceg", ac="organization")}{f("pj-nev", "Kapcsolattartó", "nev", "nev", ac="name")}</div>
        <div class="f2">{f("pj-mail", "E-mail", "email", "email", "email", ac="email")}{f("pj-tel", "Telefon", "telefon", "telefon", "tel", False, ac="tel")}</div>
        <div class="f2">{f("pj-web", "Weboldal", "weboldal", "weboldal", "url", False, ph_="https://")}<div class="f"><label for="pj-kat">Kategória <span>*</span></label><select id="pj-kat" name="kategoria" data-rule="select" data-label="Kategória"><option value="">Válasszon…</option>{KATS}</select><p class="msg"></p></div></div>
        <div class="f"><label for="pj-uz">Rövid bemutatkozás, ajánlat ügyfeleinknek <span>*</span></label><textarea id="pj-uz" name="uzenet" data-rule="uzenet" data-label="Bemutatkozás"></textarea><p class="msg"></p></div>
        {CHK}<button class="btn btn-p btn-b" type="submit" style="margin-top:14px">Jelentkezés küldése</button>{DONE}
      </form>
      <p class="req">* kötelező mező</p>
    </div>
  </div>
</section>
'''
page("partnerek.html", "Partnereink – MultiCont Center Kft. | Partnerprogram, ajánlatok, ajánlói rendszer",
     "A MultiCont Center partnerprogramja: partnerlista kategóriák szerint, kuponos ajánlatok, ajánlói rendszer és partnerjelentkezés.", "partnerek.html", partner)

pdet = f'''<section class="ph"><div class="wrap" style="padding-bottom:18px;padding-top:24px">
  <nav aria-label="Morzsamenü"><ol class="crumbs"><li><a href="index.html">Kezdőlap</a></li><li><a href="partnerek.html">Partnereink</a></li><li id="crumb-p" aria-current="page"></li></ol></nav>
</div></section>
<div class="wrap pd">
  <div id="pdet"></div>
  <aside class="side-box" id="pside"></aside>
</div>
'''
page("partner.html", "Partner – MultiCont Center Kft.", "Partner bemutatkozása, ajánlatai és kapcsolatfelvétel.", "partnerek.html", pdet, prio="0.5")

# ======================= KAPCSOLAT =======================
kapcs = ph("Kapcsolat", "Hívjon, írjon, vagy keressen fel minket Budaörsön. Magyarul és németül is.", ["Kapcsolat"]) + f'''
<section class="band" style="padding-top:36px">
  <div class="wrap cgrid">
    <div>
      <div class="qact"><a class="btn btn-p btn-s" href="tel:{TEL}">Hívás</a><a class="btn btn-o btn-s" href="mailto:{MAIL}">E-mail</a><a class="btn btn-o btn-s" href="{MAPS}" target="_blank" rel="noopener">Útvonal</a></div>
      <dl class="clist2">
        <div><dt>Telefon</dt><dd><a class="big" href="tel:{TEL}">{TEL_H}</a></dd></div>
        <div><dt>E-mail</dt><dd><a href="mailto:{MAIL}">{MAIL}</a></dd></div>
        <div><dt>Iroda</dt><dd>{ADDR}</dd></div>
        <div><dt>Ügyfélfogadás</dt><dd>{HOURS}, előre egyeztetett időpontban</dd></div>
        <div><dt>Nyelvek</dt><dd>magyar, német</dd></div>
        <div><dt>Kapcsolattartó</dt><dd>Horváth Mária</dd></div>
      </dl>
      <div class="map" id="map" data-src="https://maps.google.com/maps?q=2040%20Buda%C3%B6rs%2C%20Meredek%20utca%202.&amp;z=16&amp;hl=hu&amp;output=embed">
        <div class="map-ph" style="padding:28px 22px 74px">
          <p class="h4">Térkép</p>
          <p class="muted small" style="margin-top:6px">A Google Térkép sütiket helyezhet el, ezért csak az Ön kérésére töltjük be.</p>
          <button class="btn btn-o btn-s" type="button" id="map-load" style="margin-top:12px">Térkép betöltése</button>
        </div>
        <a class="btn btn-w btn-s" href="{MAPS}" target="_blank" rel="noopener" style="border:1px solid var(--line-2)">Útvonaltervezés ↗</a>
      </div>
      <!-- GOOGLE CÉGPROFIL: az igazolás után ide kerül a Térkép-link és a véleményírási link (Értékeljen minket a Google-on). -->
      <p class="pend" style="margin-top:14px">Google Cégprofil: igazolás folyamatban. Utána ide kerül a Google Térkép- és az értékelési link. · Az ügyfélfogadási napok pontosítandók.</p>
    </div>
    <form class="form" id="urlap" novalidate data-mail="{MAIL}" data-subject="Érdeklődés a weboldalról">
      <h2 class="h3">Írjon nekünk</h2>
      <p class="muted small" style="margin:6px 0 18px">Küldéskor a levelezőprogramja nyílik meg a kész üzenettel – onnan érkezik meg hozzánk.</p>
      {HP.format("k")}
      <div class="f2">{f("k-nev", "Név", "nev", "nev", ac="name")}{f("k-mail", "E-mail", "email", "email", "email", ac="email")}</div>
      <div class="f2">{f("k-tel", "Telefon", "telefon", "telefon", "tel", False, ac="tel", ph_="+36 …")}
        <div class="f"><label for="k-tip">Vállalkozás típusa <span>*</span></label><select id="k-tip" name="tipus" data-rule="select" data-label="Vállalkozás típusa"><option value="">Válasszon…</option><option>Egyéni vállalkozás</option><option>Betéti társaság (bt.)</option><option>Kft.</option><option>Még nincs vállalkozásom</option><option>Egyéb</option></select><p class="msg"></p></div></div>
      <div class="f"><label for="k-tema">Miben segíthetünk? <span>*</span></label><select id="k-tema" name="szolgaltatas" data-rule="select" data-label="Téma"><option value="">Válasszon…</option><option>Könyvelés</option><option>Bérszámfejtés</option><option>Adótanácsadás</option><option>NAV- és TB-képviselet</option><option>Online könyvelés</option><option>Végelszámolás</option><option>Partnerprogram</option><option>Egyéb kérdés</option></select><p class="msg"></p></div>
      <div class="f"><label for="k-uz">Üzenet <span>*</span></label><textarea id="k-uz" name="uzenet" data-rule="uzenet" data-label="Üzenet" placeholder="Röviden írja le, miben segíthetünk."></textarea><p class="msg"></p></div>
      <div class="f2">
        <label class="check" style="align-self:center;margin-bottom:14px"><input type="checkbox" name="visszahivas" data-label="Visszahívást kér"> Kérem, hívjanak vissza</label>
        {f("k-ref", "Ajánlói kód (ha van)", "ajanlo", req=False)}
      </div>
      {CHK}
      <button class="btn btn-p btn-b" type="submit" style="margin-top:14px">Üzenet elküldése</button>
      <p class="req">* kötelező mező · Visszahíváshoz a telefonszám is kötelező.</p>
      {DONE}
    </form>
  </div>
</section>
'''
page("kapcsolat.html", "Kapcsolat – MultiCont Center Kft. | +36 20 433 7811, Budaörs",
     "MultiCont Center Kft., 2040 Budaörs, Meredek utca 2. Telefon: +36 20 433 7811, e-mail: konyvelde@gmail.com. Magyarul és németül.", "kapcsolat.html", kapcs, prio="0.8")
