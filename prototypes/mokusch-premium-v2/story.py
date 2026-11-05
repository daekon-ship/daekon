"""Mókusch V2 – mesekönyves főoldal (görgetéses út az erdőből a kávézóba).

A build.py importálja és csak a V2 kimenetre kapcsolja be (a V3/B-változat generátora a
build.py-t másik kimeneti mappával használja – arra ez a réteg nem kerül rá).
"""
import html

SB_VER = "16"
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




# ---------------------------------------------------------------------------------------------
#  A teljes főoldal egyetlen görgetéses mese: Vanda Wix-oldalának 11 festett képe, ugyanabban
#  a sorrendben, ahogy a Wix-en szerepelnek (ösvény → udvar → bolt → pult → … → képfal).
#  Minden kép teljes képernyős festmény, elmosódó szélekkel; görgetésre beljebb közelítünk,
#  majd áttűnünk a következő helyiségbe.
# ---------------------------------------------------------------------------------------------
# kulcs, hossz (képernyőnyi görgetés), fókuszpont (a közelítés iránya), fejezet sorszáma
SCENES = [
    ("osveny", 2.4, "50% 58%", 1),
    ("udvar", 1.7, "52% 52%", 2),
    ("bolt", 1.7, "50% 56%", 3),
    ("pult1", 1.4, "52% 50%", 4),
    ("pult2", 1.5, "55% 52%", 4),
    ("konyha", 1.7, "50% 48%", 5),
    ("polc1", 1.4, "58% 48%", 6),
    ("polc2", 1.5, "45% 48%", 6),
    ("olvaso", 1.7, "48% 58%", 7),
    ("posta", 1.8, "50% 48%", 8),
    ("kepfal", 1.9, "48% 60%", 9),
]
# az átmenet hossza: ennyi görgetés alatt „lépünk be” a következő képbe (a régi felnagyul, az új akvarellfoltként kinyílik)
FADE = 0.8


import json as _json
from pathlib import Path as _Path
# Vanda 11 festményének 4K-ra felskálázott helyi sorozata (mese_kepek.py; forrás: kepek-4k ág)
_MJ = _Path(__file__).with_name("mese_kepek.json")
MESE = _json.loads(_MJ.read_text()) if _MJ.exists() else {}


def mese_srcset(key, pre="", kind="f"):
    """kind: d = asztali 16:10, m = mobil 2:3 (a régi Wix-kivágással azonos, középre igazított), f = teljes kép"""
    tag = "-" if kind == "f" else f"-{kind}-"
    return ", ".join(f"{pre}img/mese/{key}{tag}{w}.webp {w}w" for w in MESE[key][kind])


def _r(x):
    return f"{x:.4f}"


def index(B):
    pre = ""
    btn = B.btn
    arrow = B.ARROW
    T = sum(s[1] for s in SCENES)
    starts, u = [], 0.0
    for s in SCENES:
        starts.append(u); u += s[1]
    P = lambda units: max(0.0, min(1.0, units / T))
    chap_span = {}
    for i, s in enumerate(SCENES):
        a, b = chap_span.get(s[3], (starts[i], starts[i] + s[1]))
        chap_span[s[3]] = (min(a, starts[i]), max(b, starts[i] + s[1]))

    # --- jelenetek
    figs, atmo = [], []
    for i, (k, units, focal, ch) in enumerate(SCENES):
        S, E = starts[i], starts[i] + units
        a = -1 if i == 0 else S - FADE          # megjelenés kezdete
        b = 0 if i == 0 else S                  # teljesen látszik
        c = 99 if i == len(SCENES) - 1 else E - FADE   # eltűnés kezdete
        d = 99 if i == len(SCENES) - 1 else E          # eltűnt
        z0, z1 = (0 if i == 0 else S - FADE), E
        if k in MESE:   # helyi, nagy felbontású kép: mobilon 2:3 kivágás, asztalon a teljes (vágatlan) festmény
            mob, desk = mese_srcset(k, kind="m"), mese_srcset(k, kind="f")
        else:
            mob = ", ".join(f"{B.wimg(k, w, round(w * 1.5), True)} {w}w" for w in (640, 960, 1280, 1600))
            desk = ", ".join(f"{B.wimg(k, w, round(w * 10 / 16), True)} {w}w" for w in (1280, 1920, 2560, 3200, 3840))
        isrc = f"img/mese/{k}-m-960.webp" if k in MESE else B.wimg(k, 960, 1440, True)
        msz = "100vw"
        eager = i == 0
        lazyattr = "" if i < 2 else "data-"
        prio = 'fetchpriority="high"' if eager else 'fetchpriority="low"'
        figs.append(
            f'<figure class="jscene" data-jscene="{i}" data-a="{_r(P(a)) if a >= 0 else -1}" data-b="{_r(P(b))}" '
            f'data-c="{_r(P(c)) if c < 90 else 2}" data-d="{_r(P(d)) if d < 90 else 3}" '
            f'data-f="{focal.replace("%", "").replace(" ", ",")}" data-ar="{(MESE[k]["full"][0] / MESE[k]["full"][1]) if k in MESE else 0.8:.4f}" '
            f'style="--focal:{focal};--o:{i * 10}">'
            f'<div class="jscene__in"><i class="jscene__bg" aria-hidden="true" style="background-image:url({(f"img/mese/{k}-24.webp" if k in MESE else B.wimg(k, 24, 32))})"></i>'
            f'<picture><source media="(min-width: 900px)" {lazyattr}srcset="{desk}" sizes="{"min(60vw, 120vh)" if k in MESE else "100vw"}">'
            f'<img {lazyattr}src="{isrc}" {lazyattr}srcset="{mob}" sizes="{msz}" width="960" height="1440" '
            f'alt="{html.escape(B.WIX[k][2])}" {prio} decoding="async"></picture></div></figure>')
        atmo.append(f'<div class="atmo" data-atmo="{i}" style="background-image:url({(f"img/mese/{k}-24.webp" if k in MESE else B.wimg(k, 18, 27))})"></div>')

    # --- fejezetkártyák (a Wix 9 témaköre, mindegyikben 1–2 gomb)
    # Palackposta: két fő gomb; a további aloldalak finom szöveges hivatkozásként maradnak elérhetők
    pins = (f'<div class="btns">{btn("uzenek/", "Üzenek!", "btn--berry")}{btn("asztalfoglalas/", "Asztalfoglalás", "btn--ghost")}</div>'
            f'<p class="beat__more">Olvasd el, mit <a class="link" href="uzenetek/">üzentek mások</a>, vagy nézd meg a '
            f'<a class="link" href="mokassagok/">mókásságokat</a>.</p>')
    CH = {
        2: ("akik-eletre-keltik", "A lámpások már égnek – megérkeztünk a kávézóhoz.", "Akik életre keltik <em>minden nap</em>",
            "Rólunk, minden mókuschról", "Három lány, aki minden reggel kinyitja az ajtót, kávét főz, süt és díszít.",
            btn("valogatott-tarsasag/", "Válogatott társaság"), ""),
        3: ("mit-muvelunk", "Nyisd ki az ajtót, és lépj be.", "Mit művelünk <em>mi itt?</em>",
            "kávéfőzés · sütés · tortadíszítés · kézművesség", "A Mókusch hétköznapjai – képekben és rövid történetekben.",
            btn("kepek/", "Képek") + btn("sztorik/", "Sztorik", "btn--ghost"), ""),
        4: ("finomsagok", "Kávéillat szálldogál a pult felől…", "Finomságok", "kávék – sütik – kutyafülék",
            "Mit lehet itt? Enni és inni – egy csésze mellett, kényelmesen.",
            btn("enni/", "Enni") + btn("inni/", "Inni", "btn--ghost"), ""),
        5: ("boszorkanykonyha", "Hátul, a konyhában mindig rotyog valami.", "Ez a mi kis <em>boszorkánykonyhánk</em>",
            "receptek, praktikák, kézműves ötletek", "Amit nálunk megszerettél, otthon is kipróbálhatod.",
            btn("nehany-artatlan-recept/", "Néhány ártatlan recept") + btn("tippek-trukkok/", "Tippek-trükkök", "btn--ghost"), ""),
        6: ("nyuszis-polc", "És itt a polc, amely előtt mindenki megáll.", "A híres <em>nyuszis polc</em>",
            "minden, ami egy erdei teadélutánhoz kellhet", "Kézzel készült apróságok egy erdei teadélutánhoz.",
            btn("nyuszis-polc/", "…és ezt is mind ti csináltátok?"), ""),
        7: ("akarmicsodak", "Egy csendes sarok, egy jó könyv.", "Varázslatos <em>akármicsodák</em>",
            "varázslatos-mesés könyvek, csodás csecsebecsék", "Leülhetsz egy könyvvel – és apróságokat is hazavihetsz.",
            btn("konyvek/", "Könyvek") + btn("csodas-csecsebecsek/", "Csodás csecsebecsék", "btn--ghost"), ""),
        8: ("palackposta", "A falon üzenetek – írj te is!", "Palackposta", "minden levél ideér",
            "Írj nekünk, foglalj asztalt, vagy olvasd el, mit üzentek mások.", "",
            pins + f'<p class="beat__visit"><b>Hol vagyunk?</b> {B.ADDR} · <a href="{B.MAP}" target="_blank" rel="noopener">térkép</a> · <a href="{B.PHONE_HREF}">{B.PHONE}</a></p>'),
        9: ("tortak", "És a mese végén: a torták.", "Torták <em>és romantika</em>", "születésnapra, esküvőre, vagy csak úgy",
            "Meséld el, milyen tortát álmodtál – a műhely ajánlattal jelentkezik.",
            B.torta_btn(pre, label_short="Tortarendelés") + btn("eskuvo/", "Esküvői torták", "btn--ghost"),
            '<ol class="steps-book"><li><b>1</b>Meséld el, mit álmodtál</li><li><b>2</b>Ajánlatot kapsz</li><li><b>3</b>Megbeszélitek a részleteket</li></ol>'),
    }

    def win(a, b, c, d):
        return f'data-a="{_r(P(a)) if a >= 0 else -1}" data-b="{_r(P(b)) if a >= 0 else 0}" data-c="{_r(P(c)) if c < 90 else 2}" data-d="{_r(P(d)) if d < 90 else 3}"'

    beats, anchors = [], []
    first = {}
    for i, sc in enumerate(SCENES):
        first.setdefault(sc[3], i)
    # 1. fejezet – nyitókártya + az ösvény mondata
    s0, e0 = chap_span[1]
    beats.append(f'''<div class="beat beat--hero is-on" data-beat {win(-1, 0, e0 * 0.24, e0 * 0.31)} data-ch="1" style="--o:-1">
      <div class="beat__card">
        <p class="beat__kicker"><span class="no">1.</span> Varázserdő</p>
        <h1 id="h-meseba"><span class="ln">Hagyd magad mögött a várost,</span> <span class="ln">és lépj be <em>egy mesébe.</em></span></h1>
        <p class="beat__lead">Kézzel készített sütemények, illatos kávék és mesebeli pillanatok egy természetközeli kuckóban.</p>
        <div class="btns">{btn("a-mokusch-meseje/", "A Mókusch meséje")}{btn("almok-vagyak-tervek/", "Álmok, vágyak, tervek", "btn--ghost")}</div>
        <p class="beat__more"><a class="link" href="mesebeli-programok/">Mesebeli programok {arrow}</a></p>
      </div>
    </div>''')
    beats.append(f'''<div class="beat beat--line" data-beat {win(e0 * 0.36, e0 * 0.43, e0 - FADE - 0.12, e0 - FADE + 0.04)} style="--o:5">
      <div class="beat__card beat__card--sm"><p class="beat__story">Az ösvény egyre beljebb visz a fák közé – <em>a fények mutatják az utat.</em></p></div>
    </div>''')
    anchors.append(('meseba', 0.0, 1))
    for n in range(2, 10):
        sid, story, title, sub, lead, bts, extra = CH[n]
        a0, b0 = chap_span[n]
        last = n == 9
        ia, ib = a0 + 0.08, a0 + 0.3
        oc, od = (99, 99) if last else (b0 - FADE - 0.18, b0 - FADE + 0.02)
        beats.append(f'''<div class="beat" data-beat {win(ia, ib, oc, od)} data-ch="{n}" style="--o:{first[n] * 10 + 5}">
      <div class="beat__card">
        <p class="beat__story">{story}</p>
        <p class="beat__kicker"><span class="no">{n}.</span> fejezet</p>
        <h2 id="h-{sid}">{title}</h2>
        <p class="sub">{sub}</p>
        <p class="beat__lead">{lead}</p>
        {extra}
        {f'<div class="btns">{bts}</div>' if bts else ''}
      </div>
    </div>''')
        anchors.append((sid, P(ib + 0.22), n))   # a fejléc miatti rövidebb ugrással is teljesen látszó kártyán érkezünk
        if n == 8:
            anchors.append(("hol-vagyunk", P(ib + 0.22), n))
    anc = "".join(f'<span class="janchor" id="{sid}" style="--p:{_r(p)}" data-p="{_r(p)}" data-ch="{c}" aria-hidden="true"></span>' for sid, p, c in anchors)

    body = f'''
<main id="tartalom">

<!-- A teljes főoldal egy görgetéses mesekönyv: 11 festett jelenet (a Mókusch saját képei) az erdőtől a tortákig.
     Natív görgetés (nincs scroll-jacking); a ragadós képkivágást a görgetés előrehaladása mozgatja. -->
<section class="journey" aria-labelledby="h-meseba" data-journey style="--units:{T:.2f}">
  {anc}
  <div class="journey__sticky">
    <div class="journey__atmo" aria-hidden="true">{"".join(atmo)}</div>
    <div class="journey__veil" aria-hidden="true"></div>
    <div class="journey__frame" data-jframe>{"".join(figs)}</div>
    <div class="journey__mist" aria-hidden="true" data-jmist><i></i><i></i><i></i></div>
    <div class="journey__edge" aria-hidden="true"></div>
    <div class="journey__light" aria-hidden="true" data-jlight></div>
    <canvas class="fireflies" data-fireflies="forest" aria-hidden="true"></canvas>
    <canvas class="fireflies fireflies--warm" data-fireflies="warm" aria-hidden="true"></canvas>
    <div class="journey__text">{"".join(beats)}</div>
    <p class="journey__hint" aria-hidden="true" data-jhint><span>Görgess, és indulj el az ösvényen</span><i></i></p>
    <ol class="journey__dots" aria-hidden="true">{"".join(f'<li data-dot="{n}"></li>' for n in range(1, 10))}</ol>
  </div>
</section>

<!-- A mese utolsó lapja: zárás, és a két legfontosabb következő lépés -->
<aside class="tortaband epilog" aria-labelledby="h-epilog">
  <div class="wrap">
    <div class="tortaband__card epilog__page" data-rv>
      <div class="wash wash--2" aria-hidden="true"></div>
      {B.LOGO.inline_mark(cls="tortaband__mark", bg="#EEE1D8")}
      <p class="epilog__orn" aria-hidden="true"><i></i><span>~</span><i></i></p>
      <h2 id="h-epilog">Itt ér véget a mese első lapja.</h2>
      <p class="epilog__txt">A folytatást a Várfok utcában meséljük el – egy csésze kávé mellett, vagy egy tortával, amit együtt álmodunk meg.</p>
      <div class="btns">{B.torta_btn(pre, label_short="Tortarendelés")}{btn("asztalfoglalas/", "Asztalfoglalás", "btn--ghost")}</div>
    </div>
  </div>
</aside>

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
    k0 = SCENES[0][0]
    if k0 in MESE:
        pl = (f'<link rel="preload" as="image" media="(max-width: 899px)" imagesrcset="{mese_srcset(k0, kind='m')}" imagesizes="100vw" fetchpriority="high">\n'
              f'<link rel="preload" as="image" media="(min-width: 900px)" imagesrcset="{mese_srcset(k0, kind='f')}" imagesizes="min(60vw, 120vh)" fetchpriority="high">\n')
    else:
        pl = ""
    out = B.head("Mókusch kávézó és tortaműhely – Budapest, Várfok utca 30.",
                 "Mesebeli kávézó és tortaműhely a Várfok utcában: egy erdei ösvény vezet a kávékhoz, süteményekhez, a híres nyuszis polchoz és az egyedi tortákhoz.",
                 pre, extra=pl + ld)
    out += B.header(pre) + body + B.footer(pre)
    (B.OUT / "index.html").write_text(out, encoding="utf-8")
