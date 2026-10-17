from common import *

# ======================= RÓLUNK =======================
rolunk = ph("Rólunk", "Budaörsi könyvelőiroda 2015 óta. Szakmai vezetője Horváth Mária, mérlegképes könyvelő és adótanácsadó.", ["Rólunk"]) + f'''
<div class="wrap sd">
  <div>
    <section class="sd-sec" id="tortenet">
      <p class="eyebrow">Történetünk</p>
      <h2 class="h2" style="margin-bottom:12px">Harminc év tapasztalat, egy irodában</h2>
      <p class="lead">Horváth Mária harminc éve dolgozik pénzüggyel és számvitellel. 2015. szeptember 25-én alapította meg a MultiCont Center Kft.-t.</p>
      <p style="margin-top:12px">A cég eredetileg sem kizárólag könyvelésre jött létre, és ma is nyitott új tevékenységek behozására. Ezért épül a weboldal köré partnerközpont is: átlinkelés a partnerek oldalára, ajánlói rendszer és kuponajánlatok – hogy ügyfeleink nálunk megbízható szakembereket is találjanak.</p>
    </section>

    <section class="sd-sec" id="szakmai-vezeto">
      <p class="eyebrow">A szakmai vezető</p>
      <h2 class="h2" style="margin-bottom:16px">Horváth Mária szakmai útja</h2>
      <ol class="l-time" style="padding-left:22px">
        <li><span class="y">Pályakezdés</span><a>Költségvetési szféra</a></li>
        <li><span class="y">Vállalati évek</span><a>Magyar és nemzetközi tulajdonú vállalkozások pénzügyei</a></li>
        <li><span class="y">5 év</span><a>Cafeteria-tanácsadás, biztosítások</a></li>
        <li><span class="y">2015</span><a>A MultiCont Center Kft. megalapítása</a></li>
      </ol>
      <div class="quals" style="margin-top:16px"><span class="tag">Mérlegképes könyvelő</span><span class="tag">Adótanácsadó</span><span class="tag t">TB-ügyintéző</span><span class="tag t">Bérügyintéző</span></div>
    </section>

    <section class="sd-sec" id="nev">
      <p class="eyebrow g">A név és a logó</p>
      <h2 class="h2" style="margin-bottom:16px">Multi · Cont · Center</h2>
      <ul class="triad" style="margin-top:0">
        <li><b>MULTI</b><p>Sokoldalúság és sokféleség – és a növekedési potenciál.</p></li>
        <li><b>CONT</b><p>Contír, ami a könyvelésre utal – és contract, azaz szerződés.</p></li>
        <li><b>CENTER</b><p>Közös pont: szolgáltatási és partneri központ.</p></li>
      </ul>
      <p class="muted" style="margin-top:14px">A logó egy „M” betű három elemből, három színnel: a kék oszlop a MULTI, a türkiz oszlop a CONT, a kettőt összekötő arany ív a CENTER – a közös pont.</p>
    </section>

    <section class="sd-sec">
      <p class="eyebrow t">Ahogy dolgozunk</p>
      <h2 class="h2" style="margin-bottom:14px">Személyesen, online, két nyelven</h2>
      <ul class="benefits">
        <li><b>Személyesen</b><span>Budaörsön, a Meredek utcai irodában.</span></li>
        <li><b>Online</b><span>Az ország bármely részéről, elektronikus bizonylatküldéssel.</span></li>
        <li><b>Magyarul és németül</b><span>Külföldi tulajdonosoknak, partnereknek is.</span></li>
        <li><b>Felelősségbiztosítással</b><span>A munkánkat felelősségbiztosítás mellett végezzük.</span></li>
      </ul>
    </section>
  </div>
  <aside class="side-box">
    <div class="ph-slot" role="img" aria-label="Horváth Mária fotójának helye" style="max-width:300px"><b>HM</b><span>Horváth Mária saját fotójának helye</span></div>
    <div class="tool" id="cegadatok">
      <div class="tool-h"><h2>Cégadatok</h2></div>
      <div class="tool-b"><dl class="mini-res" style="margin:0">
        <div><dt>Cégnév</dt><dd>MultiCont Center Kft.</dd></div>
        <div><dt>Iroda</dt><dd>Budaörs</dd></div>
        <div><dt>Adószám</dt><dd>25378669-2-13</dd></div>
        <div><dt>Cégjegyzékszám</dt><dd>13-09-177232</dd></div>
        <div><dt>Alapítva</dt><dd>2015. 09. 25.</dd></div>
      </dl></div>
    </div>
    <a class="btn btn-p btn-b" href="kapcsolat.html">Kapcsolatfelvétel</a>
  </aside>
</div>
'''
page("rolunk.html", "Rólunk – MultiCont Center Kft. | Horváth Mária, könyvelő, adótanácsadó",
     "A MultiCont Center Kft. története, a név jelentése és szakmai vezetője, Horváth Mária: harminc év pénzügyi-számviteli gyakorlat.", "rolunk.html", rolunk)

# ======================= SZOLGÁLTATÁS-RÉSZLETEK =======================
# Csak általános, igazolt tartalom: díj, határidő, garancia nincs benne.
DET = {
    "konyveles": dict(
        lead="Egyéni vállalkozók, betéti társaságok és kft.-k könyvelése: a beküldött bizonylatoktól a bevallásokig.",
        intro="A könyvelés nálunk nem csak a havi kötelező kör. Ugyanaz a könyvelő vezeti a könyveit, aki a kérdéseire válaszol, így ismeri a vállalkozását, és szól, ha egy változás Önt is érinti.",
        ben=[("Bizonylatok feldolgozása", "Számlák, bankkivonatok és egyéb bizonylatok rögzítése."),
             ("Bevallások", "Az adózási formához tartozó bevallások elkészítése."),
             ("Egy kapcsolattartó", "Közvetlenül azzal beszél, aki a könyveit vezeti."),
             ("Online is", "Elektronikus bizonylatküldés, az ország bármely részéről.")],
        tg=["Egyéni vállalkozók", "Betéti társaságok", "Kft.-k", "Német nyelvű tulajdonosok"],
        faq=[("Mennyibe kerül a könyvelés?", "Az ár a vállalkozási formától, a bizonylatok számától és a foglalkoztatottaktól függ. Rövid egyeztetés után adunk ajánlatot."),
             ("Lehet év közben könyvelőt váltani?", "Igen. Hogy az átadás pontosan hogyan zajlik, azt Önnel és az előző könyvelővel egyeztetjük."),
             ("Személyesen kell bejárnom?", "Nem szükséges. Budaörsön személyesen is fogadjuk, de online az ország bármely részéről dolgozunk.")]),
    "berszamfejtes": dict(
        lead="Munkavállalók bérének számfejtése és a kapcsolódó társadalombiztosítási ügyintézés.",
        intro="Horváth Mária TB- és bérügyintézői végzettséggel is rendelkezik. A bérszámfejtést a könyveléssel együtt, egy kézben végezzük.",
        ben=[("Havi bérszámfejtés", "Bérek, levonások és járulékok kiszámítása."),
             ("TB-ügyintézés", "Be- és kijelentések, a kapcsolódó adminisztráció."),
             ("Egy kézben a könyveléssel", "Nem kell két irodával egyeztetnie."),
             ("Tervezés előre", "A kalkulátorral megnézheti, mennyibe kerül egy új munkatárs.")],
        tg=["Munkáltató egyéni vállalkozók", "Bt.-k és kft.-k", "Akik most vesznek fel először munkavállalót"],
        faq=[("Mennyibe kerül egy munkavállaló a cégnek?", "A munkáltatói kalkulátorunk megmutatja a bruttó bér és a szociális hozzájárulási adó összegét. A kedvezményeket egyeztetéskor nézzük át."),
             ("Mit kell küldenem egy új munkavállalóról?", "A szükséges adatok listáját a megbízás elején elküldjük; a bejelentést mi intézzük.")]),
    "adotanacsadas": dict(
        lead="Adózási kérdésekben adótanácsadói végzettséggel segítünk – például ha adózási formát választana vagy váltana.",
        intro="A jó adózási döntés a vállalkozás számaiból indul. Átnézzük a bevételeit, költségeit és vevőit, és elmondjuk, mely formák jöhetnek szóba.",
        ben=[("Adózási forma áttekintése", "KATA, átalányadó, vállalkozói SZJA, társas vállalkozás."),
             ("Változások követése", "A Tudástárban forrással együtt foglaljuk össze őket."),
             ("Egyedi kérdések", "Ha valami nem illik a sablonba, megnézzük."),
             ("Előre szólunk", "Ha egy új szabály Önt is érinti.")],
        tg=["Induló vállalkozók", "Adózási formát váltók", "Működő vállalkozások"],
        faq=[("KATA vagy átalányadó?", "A tevékenységtől, a bevételtől és attól függ, kiknek számláz. A 2026-os szabályokat a Tudástárban összefoglaltuk; a döntéshez érdemes a saját számaival együtt átnézni."),
             ("Mi várható 2027-ben a KATA-val?", "Jelenleg tervezet van társadalmi egyeztetésen. Amit eddig tudni lehet, azt külön cikkben gyűjtöttük össze.")]),
    "nav-tb": dict(
        lead="Képviseljük vállalkozását a NAV és a társadalombiztosítási szervek előtt.",
        intro="Ha hivatalos levél érkezik, nem kell egyedül kitalálnia, mit jelent. Meghatalmazás alapján eljárunk az Ön nevében.",
        ben=[("Hatósági levelek", "Megkeresések értelmezése és megválaszolása."),
             ("Képviselet", "Meghatalmazás alapján, a NAV és a TB-szervek előtt."),
             ("Egy kézben", "A képviselő ismeri a könyveit."),
             ("Világos tájékoztatás", "Elmondjuk, mi történik és miért.")],
        tg=["Könyvelési ügyfeleink", "Hatósági megkeresést kapott vállalkozások"],
        faq=[("Mi kell a képviselethez?", "Meghatalmazás. A pontos módját a megbízáskor egyeztetjük."),
             ("Mikor érdemes szólni?", "Amint megérkezik a levél: minél előbb látjuk, annál több idő marad a válaszra.")]),
    "online": dict(
        lead="Távkönyvelés az ország bármely részéről: nem kell Budaörs közelében lennie ahhoz, hogy velünk dolgozzon.",
        intro="A bizonylatokat elektronikusan küldi, mi pedig telefonon és e-mailben tartjuk a kapcsolatot. A szakmai tartalom ugyanaz, mint személyesen.",
        ben=[("Elektronikus bizonylatküldés", "A módját a megbízás elején egyeztetjük."),
             ("Telefon és e-mail", "Közvetlen elérés, kérdés esetén."),
             ("Országosan", "Bárhol is működik a vállalkozása."),
             ("Két nyelven", "Magyarul és németül.")],
        tg=["Budaörstől távol működő vállalkozások", "Sokat utazó vállalkozók", "Külföldi tulajdonosok"],
        faq=[("Hogyan küldöm a bizonylatokat?", "Elektronikusan; a pontos módot a megbízás elején egyeztetjük."),
             ("Lehet személyesen is találkozni?", "Igen, Budaörsön, előre egyeztetett időpontban.")]),
    "vegelszamolas": dict(
        lead="Egyszerűsített és normál végelszámolás nagy tapasztalattal, az iratoktól a cégtörlésig.",
        intro="A végelszámolás az iroda egyik szakterülete. Végigvisszük a folyamatot; Önnek a döntéseknél kell jelen lennie.",
        ben=[("Egyszerűsített végelszámolás", "Ha a feltételek adottak: rövidebb, kevesebb lépéssel."),
             ("Normál végelszámolás", "Minden más esetben, a teljes eljárással."),
             ("Az iratoktól a törlésig", "A teljes folyamatot kezeljük."),
             ("Előzetes áttekintés", "Megmondjuk, melyik eljárás jöhet szóba.")],
        tg=["Megszüntetni kívánt kft.-k", "Bt.-k", "Tevékenységüket befejező vállalkozások"],
        faq=[("Mi a különbség a két eljárás között?", "Az egyszerűsített rövidebb, de feltételekhez kötött. Hogy az Ön cégénél melyik jöhet szóba, azt az iratok alapján mondjuk meg."),
             ("Mennyi ideig tart?", "Az eljárástól és a cég helyzetétől függ. Az áttekintés után reális képet adunk.")]),
}
REL_ART = {"konyveles": "adokulcsok-2026", "berszamfejtes": "minimalber-2026", "adotanacsadas": "uj-kata-2027-tervezet",
           "nav-tb": "hataridok-2026-november-december", "online": "alanyi-afa-mentesseg-2026", "vegelszamolas": "tao-kiva-2026"}
TEMA = {"konyveles": "Könyvelés", "berszamfejtes": "Bérszámfejtés", "adotanacsadas": "Adótanácsadás", "nav-tb": "NAV- és TB-képviselet",
        "online": "Online könyvelés", "vegelszamolas": "Végelszámolás"}

for i, (k, t, d) in enumerate(SVC):
    x = DET[k]
    side = "".join(f'<a href="{svc_url(kk)}"{" aria-current=\"page\"" if kk == k else ""}>{tt}<span aria-hidden="true">→</span></a>' for kk, tt, _ in SVC)
    ben = "".join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in x["ben"])
    tg = "".join(f'<li>{a}</li>' for a in x["tg"])
    faq = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in x["faq"])
    tema = TEMA[k].replace(" ", "%20").replace("é", "%C3%A9").replace("á", "%C3%A1").replace("ö", "%C3%B6").replace("ó", "%C3%B3")
    body = ph(t, x["lead"], [("szolgaltatasok.html", "Szolgáltatások"), t]) + f'''
<div class="wrap sd">
  <div>
    <section class="sd-sec">
      <div style="display:flex;gap:18px;align-items:flex-start">{icon(k).replace('class="ic"', 'class="ic" style="width:56px;height:56px;flex:none"')}<p class="lead">{x["intro"]}</p></div>
    </section>
    <section class="sd-sec"><h2>Mit tartalmaz?</h2><ul class="benefits">{ben}</ul>
      <p class="hint">A szolgáltatás pontos köre megbízásonként egyeztetendő.</p></section>
    <section class="sd-sec"><h2>Kinek ajánljuk?</h2><ul class="targets">{tg}</ul></section>
    <section class="sd-sec faq" id="gyik"><h2>Gyakori kérdések</h2>{faq}</section>
    <section class="sd-sec cta">
      <div><h2>Beszéljük át, mire van szüksége.</h2><p>Írjon vagy hívjon: egy rövid egyeztetés után megmondjuk, mit tudunk vállalni.</p></div>
      <div class="btns"><a class="btn btn-w" href="kapcsolat.html?tema={tema}#urlap">Érdeklődöm</a><a class="btn btn-gh" href="tel:{TEL}">{TEL_H}</a></div>
    </section>
  </div>
  <aside class="side-box">
    <nav class="tool" aria-label="Szolgáltatások"><div class="tool-h"><h2>Szolgáltatások</h2></div><div class="side-nav" style="padding:8px">{side}</div></nav>
    <div class="tool"><div class="tool-h"><h2>Kapcsolódó cikk</h2></div><div class="tool-b"><ul class="l-news" data-mod="art-one" data-id="{REL_ART[k]}"></ul></div></div>
    <section class="r-contact"><h2>Hívjon minket</h2><a class="tel" href="tel:{TEL}">{TEL_H}</a><p><a href="mailto:{MAIL}">{MAIL}</a></p></section>
  </aside>
</div>
'''
    page(svc_url(k), f"{t} – MultiCont Center Kft. | Budaörs és online", f"{d} Részletek, gyakori kérdések és kapcsolatfelvétel.", "szolgaltatasok.html", body)

# ======================= SZOLGÁLTATÁSOK ÁTTEKINTÉS =======================
rows = ""
for i, (k, t, d) in enumerate(SVC):
    x = DET[k]
    pts = "".join(f'<li>{a}</li>' for a, _ in x["ben"][:3])
    tgs = "".join(f'<li>{a}</li>' for a in x["tg"])
    art = (icon(k).replace('class="ic"', 'class="ic" style="width:48px;height:48px"') +
           f'<p class="so-k">Kinek ajánljuk?</p><ul class="targets">{tgs}</ul>'
           f'<p class="so-k">Gyakori kérdés</p><p class="so-q">{x["faq"][0][0]}</p><a class="arrow small" href="{svc_url(k)}#gyik">Válasz és további kérdések</a>')
    rows += f'''<article class="so{' key' if k == 'vegelszamolas' else ''}" id="{k}">
  <div>
    <p class="eyebrow{' g' if k == 'vegelszamolas' else ''}">{i+1:02d}{' · Kiemelt szakterület' if k == 'vegelszamolas' else ''}</p>
    <h2>{t}</h2>
    <p class="lead">{x["lead"]}</p>
    <ul>{pts}</ul>
    <div class="acts"><a class="btn btn-p btn-s" href="{svc_url(k)}">Részletek</a><a class="btn btn-o btn-s" href="kapcsolat.html#urlap">Érdeklődöm</a></div>
  </div>
  <div class="so-art">{art}</div>
</article>'''
szolg = ph("Szolgáltatások", "Könyveléstől a végelszámolásig: amit egy kisvállalkozás pénzügyi hátteréhez rendszeresen igényel. Az ár és a pontos tartalom egyeztetés után derül ki.", ["Szolgáltatások"]) + f'''
<div class="wrap" style="padding-top:20px;padding-bottom:56px">{rows}
  <div class="cta" style="margin-top:28px">
    <div><h2>Nem biztos benne, mire van szüksége?</h2><p>Mondja el, mivel foglalkozik a vállalkozása – megmondjuk, mit tudunk vállalni.</p></div>
    <div class="btns"><a class="btn btn-w" href="tel:{TEL}">{TEL_H}</a><a class="btn btn-gh" href="kapcsolat.html">Üzenetet írok</a></div>
  </div>
</div>
'''
page("szolgaltatasok.html", "Szolgáltatások – MultiCont Center Kft. | Könyvelés, bérszámfejtés, végelszámolás",
     "Könyvelés, bérszámfejtés, adózási támogatás, NAV- és TB-képviselet, online könyvelés és végelszámolás Budaörsön és online.", "szolgaltatasok.html", szolg, prio="0.9")
