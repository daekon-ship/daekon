"""Mókusch V2 – mesekönyves főoldal (görgetéses út az erdőből a kávézóba).

A build.py importálja és csak a V2 kimenetre kapcsolja be (a V3/B-változat generátora a
build.py-t másik kimeneti mappával használja – arra ez a réteg nem kerül rá).
"""
import html

SB_VER = "1"
PALETTES = [("erdei", "Erdei", "#4E5A39", "#D9BBAC"),
            ("puder", "Púderes", "#6B6E4E", "#D8AFA3"),
            ("arany", "Aranyló", "#475436", "#C9A45C")]


def is_v2(B):
    return B.OUT.name == "mokusch-premium-v2"


def head_extra(prefix):
    """Akvarell-réteg stíluslapja + színvilág korai beállítása (villanás nélkül)."""
    return (f'<link rel="stylesheet" href="{prefix}css/storybook.css?v={SB_VER}">\n'
            '<script>(function(){try{var p=localStorage.getItem("mokusch-palette");'
            'if(p&&/^(erdei|puder|arany)$/.test(p))document.documentElement.setAttribute("data-palette",p)}catch(e){}})();</script>\n')


def palette_picker(cls=""):
    b = "".join(f'<button type="button" data-palette-set="{k}" aria-pressed="false" title="{n} színvilág">'
                f'<i style="background:{c1}"></i><i style="background:{c2}"></i><span>{n}</span></button>'
                for k, n, c1, c2 in PALETTES)
    return (f'<div class="palette {cls}" role="group" aria-label="Színvilág kipróbálása (bemutató)">'
            f'<span class="palette__lbl">Színvilág:</span>{b}</div>')


def foot_extra(prefix):
    return f'<script src="{prefix}js/storybook.js?v={SB_VER}" defer></script>\n'


def story_img(B, key, ratio=(2, 3), widths=(640, 960, 1280), sizes="(max-width: 899px) 100vw, 46vw",
              eager=False, low=False, cls=""):
    rw, rh = ratio
    srcset = ", ".join(f"{B.wimg(key, w, round(w * rh / rw))} {w}w" for w in widths)
    w0 = widths[1]
    if eager:
        load = 'fetchpriority="high"'
    elif low:
        load = 'loading="eager" fetchpriority="low"'
    else:
        load = 'loading="lazy"'
    c = f' class="{cls}"' if cls else ""
    return (f'<img{c} src="{B.wimg(key, w0, round(w0 * rh / rw))}" srcset="{srcset}" sizes="{sizes}" '
            f'width="{w0}" height="{round(w0 * rh / rw)}" alt="{html.escape(B.WIX[key][2])}" {load} decoding="async">')


def lqip(B, key):
    return B.wimg(key, 18, 27)   # apró kép: a böngésző felnagyítva magától „elmossa” – nincs drága blur-szűrő


def leaf(B, no, sid, title, sub, lead, btns, key, wash=1, flip=False, extra="", tag="Illusztráció", fireflies=False, cls=""):
    ff = '<canvas class="fireflies fireflies--warm" data-fireflies="warm" aria-hidden="true"></canvas>' if fireflies else ""
    return f'''<section class="leaf{' leaf--flip' if flip else ''}{(' ' + cls) if cls else ''}" id="{sid}" aria-labelledby="h-{sid}">
  <div class="wrap leaf__grid">
    <figure class="wc" data-wc>
      <div class="wash wash--{wash}" aria-hidden="true" data-wash></div>
      <div class="wc__page">{story_img(B, key, (4, 5), (480, 720, 1000), "(max-width: 899px) 92vw, 520px")}{ff}</div>
      <figcaption class="wc__cap">{tag}</figcaption>
    </figure>
    <div class="leaf__text">
      <span class="no" data-rv>{no}.</span>
      <h2 id="h-{sid}">{title}</h2>
      {f'<p class="sub" data-rv>{sub}</p>' if sub else ''}
      <p class="lead" data-rv>{lead}</p>
      {extra}
      {f'<div class="btns" data-rv>{btns}</div>' if btns else ''}
    </div>
  </div>
</section>'''


def index(B):
    pre = ""
    btn = B.btn
    arrow = B.ARROW
    trio = ('<div class="trio" data-rv>' + "".join(
        f'<figure><div class="oval"><div class="slot" role="img" aria-label="Portré helye: {n}">{B.CAM}</div></div>'
        f'<figcaption><b>{n}</b>alapító</figcaption></figure>' for n in ("Wanda", "…", "…")) + '</div>')
    posta_extra = (f'<div class="pins" data-rv>{btn("uzenek/", "Üzenek!", "btn--berry")}{btn("asztalfoglalas/", "Asztalfoglalás")}'
                   f'{btn("uzenetek/", "Üzenetek", "btn--ghost")}{btn("mokassagok/", "Mókásságok", "btn--ghost")}</div>'
                   f'<p class="visit" id="hol-vagyunk" data-rv><span><b>Hol vagyunk?</b> {B.ADDR} · '
                   f'<a href="{B.MAP}" target="_blank" rel="noopener">térkép</a></span>'
                   f'<span><a href="{B.PHONE_HREF}">{B.PHONE}</a> · <a href="mailto:{B.EMAIL}">{B.EMAIL}</a></span></p>')
    torta_steps = ('<ol class="steps-book" data-rv><li><b>1</b>Meséld el, milyen tortát álmodtál</li>'
                   '<li><b>2</b>A műhely ajánlattal jelentkezik</li><li><b>3</b>Megbeszélitek a részleteket</li></ol>')

    scenes = [("osveny", "Varázserdő"), ("udvar", "A kávézó megközelítése"), ("bolt", "Belépés a Mókuschba")]
    atmo = "".join(f'<div class="atmo" data-atmo="{i}" style="background-image:url({lqip(B, k)})"></div>' for i, (k, _) in enumerate(scenes))
    frames = "".join(
        f'<figure class="jscene" data-jscene="{i}">{story_img(B, k, eager=(i == 0), low=(i > 0))}</figure>'
        for i, (k, _) in enumerate(scenes))

    body = f'''
<main id="tartalom">

<!-- 1. fejezet: mesekönyves út – Varázserdő → erdei ösvény → a kávézó megközelítése → belépés.
     Natív görgetés (nincs scroll-jacking); a ragadós képkivágást a görgetés előrehaladása mozgatja. -->
<section class="journey" id="meseba" aria-labelledby="h-meseba" data-journey>
  <div class="journey__sticky">
    <div class="journey__atmo" aria-hidden="true">{atmo}</div>
    <div class="journey__veil" aria-hidden="true"></div>
    <div class="journey__frame" data-jframe>{frames}</div>
    <div class="journey__light" aria-hidden="true" data-jlight></div>
    <canvas class="fireflies" data-fireflies="forest" aria-hidden="true"></canvas>
    <div class="journey__text">
      <div class="beat beat--1 is-on" data-beat="0">
        <div class="beat__card">
          <p class="beat__kicker"><span class="no">1.</span> Varázserdő</p>
          <h1 id="h-meseba"><span class="ln">Hagyd magad mögött a várost,</span> <span class="ln">és lépj be <em>egy mesébe.</em></span></h1>
          <p class="beat__lead">Kézzel készített sütemények, illatos kávék és mesebeli pillanatok egy természetközeli kuckóban.</p>
          <div class="btns">{btn("a-mokusch-meseje/", "A Mókusch meséje")}{btn("almok-vagyak-tervek/", "Álmok, vágyak, tervek", "btn--ghost")}</div>
          <p class="beat__more"><a class="link" href="mesebeli-programok/">Mesebeli programok {arrow}</a></p>
        </div>
      </div>
      <div class="beat beat--2" data-beat="1">
        <div class="beat__card beat__card--sm">
          <p class="beat__kicker">Az erdei ösvény</p>
          <p class="beat__line">Az ösvény egyre beljebb visz a fák közé, <em>a fények pedig mutatják az utat.</em></p>
        </div>
      </div>
      <div class="beat beat--3" data-beat="2">
        <div class="beat__card beat__card--sm">
          <p class="beat__kicker">A kávézó megközelítése</p>
          <p class="beat__line">A lámpások már égnek – <em>valahol itt kell lennie.</em></p>
        </div>
      </div>
      <div class="beat beat--4" data-beat="3">
        <div class="beat__card beat__card--sm">
          <p class="beat__kicker">Belépés a Mókuschba</p>
          <p class="beat__line">Nyisd ki az ajtót: <em>megérkeztél.</em></p>
          <div class="btns">{btn("#akik-eletre-keltik", "Nézz körül")}{B.torta_btn(pre, label_short="Tortarendelés")}</div>
        </div>
      </div>
    </div>
    <p class="journey__hint" aria-hidden="true" data-jhint><span>Görgess, és indulj el az ösvényen</span><i></i></p>
  </div>
</section>

{leaf(B, 2, "akik-eletre-keltik", "Akik életre keltik <em>minden nap</em>", "Rólunk, minden mókuschról",
      "Három lány, aki minden reggel kinyitja az ajtót, kávét főz, süt és díszít.",
      btn("valogatott-tarsasag/", "Válogatott társaság"), "pult1", wash=2, extra=trio)}

{leaf(B, 3, "mit-muvelunk", "Mit művelünk <em>mi itt?</em>", "kávéfőzés · sütés · tortadíszítés · kézművesség",
      "A Mókusch hétköznapjai – képekben és rövid történetekben.",
      btn("kepek/", "Képek") + btn("sztorik/", "Sztorik", "btn--ghost"), "polc2", wash=1, flip=True)}

{leaf(B, 4, "finomsagok", "Finomságok", "kávék – sütik – kutyafülék",
      "Mit lehet itt? Enni és inni – egy csésze mellett, kényelmesen.",
      btn("enni/", "Enni") + btn("inni/", "Inni", "btn--ghost"), "pult2", wash=3,
      extra='<ul class="menu-idx" data-rv><li>kávék</li><li>sütemények</li><li>reggelik</li><li>kutyafülék</li></ul>')}

{leaf(B, 5, "boszorkanykonyha", "Ez a mi kis <em>boszorkánykonyhánk</em>", "receptek, praktikák, kézműves ötletek",
      "Amit nálunk megszerettél, otthon is kipróbálhatod.",
      btn("nehany-artatlan-recept/", "Néhány ártatlan recept") + btn("tippek-trukkok/", "Tippek-trükkök", "btn--ghost"),
      "konyha", wash=1, flip=True)}

<aside class="tortaband" aria-label="Tortarendelés">
  <div class="wrap">
    <div class="tortaband__card" data-rv>
      <div class="wash wash--2" aria-hidden="true"></div>
      {B.LOGO.inline_mark(cls="tortaband__mark", bg="#EEE1D8")}
      <div class="tortaband__txt"><h2>Tortát álmodnál?</h2><p>Születésnapra, esküvőre, vagy csak úgy – nyolc rövid lépésben.</p></div>
      {B.torta_btn(pre, label_short="Tortarendelés")}
    </div>
  </div>
</aside>

{leaf(B, 6, "nyuszis-polc", "A híres <em>nyuszis polc</em>", "minden, ami egy erdei teadélutánhoz kellhet",
      "Egy polc, amely előtt mindenki megáll egy pillanatra.",
      btn("nyuszis-polc/", "…és ezt is mind ti csináltátok?"), "polc1", wash=2)}

{leaf(B, 7, "akarmicsodak", "Varázslatos <em>akármicsodák</em>", "varázslatos-mesés könyvek, csodás csecsebecsék",
      "Egy sarok, ahol leülhetsz egy könyvvel – és apróságok, amiket haza is vihetsz.",
      btn("konyvek/", "Könyvek") + btn("csodas-csecsebecsek/", "Csodás csecsebecsék", "btn--ghost"),
      "olvaso", wash=4, flip=True)}

{leaf(B, 8, "palackposta", "Palackposta", "minden levél ideér",
      "Írj nekünk, foglalj asztalt, vagy olvasd el, mit üzentek mások.", "", "posta", wash=3,
      extra=posta_extra, tag="Kép a Wix-oldalról")}

{leaf(B, 9, "tortak", "Torták <em>és romantika</em>", "születésnapra, esküvőre, vagy csak úgy",
      "Meséld el, milyen tortát álmodtál – a műhely ajánlattal jelentkezik.",
      B.torta_btn(pre, label_short="Tortarendelés") + btn("eskuvo/", "Esküvői torták", "btn--ghost"),
      "kepfal", wash=2, flip=True, extra=torta_steps, fireflies=True, cls="leaf--finale")}

</main>
'''
    ld = f'''<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"CafeOrCoffeeShop","name":"Mókusch kávézó és tortaműhely",
"address":{{"@type":"PostalAddress","streetAddress":"Várfok utca 30.","postalCode":"1012","addressLocality":"Budapest","addressCountry":"HU"}},
"telephone":"{B.PHONE}","email":"{B.EMAIL}","sameAs":["{B.FB}","{B.IG}"],
"openingHoursSpecification":[
{{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"07:30","closes":"18:00"}},
{{"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"09:00","closes":"16:00"}},
{{"@type":"OpeningHoursSpecification","dayOfWeek":"Sunday","opens":"09:00","closes":"13:00"}}]}}
</script>
'''
    pl = (f'<link rel="preload" as="image" imagesrcset="{B.wimg("osveny", 640, 960)} 640w, {B.wimg("osveny", 960, 1440)} 960w, '
          f'{B.wimg("osveny", 1280, 1920)} 1280w" imagesizes="(max-width: 899px) 100vw, 46vw" fetchpriority="high">\n')
    out = B.head("Mókusch kávézó és tortaműhely – Budapest, Várfok utca 30.",
                 "Mesebeli kávézó és tortaműhely a Várfok utcában: egy erdei ösvény vezet a kávékhoz, süteményekhez, a híres nyuszis polchoz és az egyedi tortákhoz.",
                 pre, extra=pl + ld)
    out += B.header(pre) + body + B.footer(pre)
    (B.OUT / "index.html").write_text(out, encoding="utf-8")
