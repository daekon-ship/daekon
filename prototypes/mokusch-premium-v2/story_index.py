"""Mókusch V2 – mesekönyv-főoldal (3. koncepció, 2026-11).

Vanda 11 festménye álló, mesekönyv-illusztráció arányú kép (736–1179 px széles eredetik).
Ezért nem vágjuk őket széles, teljes képernyős kivágásra – az nagyítás és a festmény felének
levágása volt –, hanem könyvlapként, a saját arányukban mutatjuk, a 4K-ra felskálázott
változatból (mese_kepek.py).

 1) MEGÉRKEZÉS (ragadós, görgetésvezérelt): ösvény → udvar → bolt ajtaja (1–3. fejezet).
    A lap a festmény útjának folytatása felé lép közelebb, és onnan nyílik ki a következő kép.
 2) FEJEZETEK (4–9.): különálló, egységes könyvoldalak, normál görgetéssel. A pult és a polc
    két-két összeillő fél kép: kétoldalas illusztrációként állnak egymás mellett.
"""
import html
import json
from pathlib import Path

_SIZES = Path(__file__).with_name("mese_kepek.json")
MESE = json.loads(_SIZES.read_text()) if _SIZES.exists() else {}
MESE_W = (480, 720, 1080, 1600, 2200)
# Vanda eredeti Wix-képeinek mérete (fallback, ha nincs helyi 4K sorozat)
WIX_SIZE = {"osveny": (1122, 1402), "udvar": (1122, 1402), "bolt": (1179, 1700), "pult1": (1150, 1662),
            "pult2": (1115, 1671), "konyha": (1023, 1537), "polc1": (813, 1024), "polc2": (736, 1024),
            "olvaso": (1023, 1537), "posta": (1023, 1537), "kepfal": (1023, 1537)}


def mese_src(B, key, sizes, eager=False, data=False, pre=""):
    if key in MESE:
        W, H = MESE[key]
        ws = [w for w in MESE_W if w < W] + [W]
        srcset = ", ".join(f"{pre}img/mese/{key}-{w}.webp {w}w" for w in ws)
        src = f"{pre}img/mese/{key}-1080.webp"
    else:
        W, H = WIX_SIZE[key]
        ws = [w for w in (480, 720) if w < W] + [W]
        srcset = ", ".join(f"{B.wimg(key, w, round(w * H / W), True)} {w}w" for w in ws)
        src = B.wimg(key, ws[-1], round(ws[-1] * H / W), True)
    d = "data-" if data else ""
    load = 'fetchpriority="high"' if eager else ('fetchpriority="low"' if data else 'loading="lazy"')
    return (f'<img {d}src="{src}" {d}srcset="{srcset}" sizes="{sizes}" width="{W}" height="{H}" '
            f'alt="{html.escape(B.WIX[key][2])}" {load} decoding="async">')


def mese_thumb(B, key, pre=""):
    return f"{pre}img/mese/{key}-24.webp" if key in MESE else B.wimg(key, 24, 32)


# kulcs, görgetési hossz (képernyő), fókuszpont = ahol az út folytatódik (ide lépünk közelebb), fejezet
ARRIVAL = [
    ("osveny", 2.3, "64% 34%", 1),   # az ösvény a fény felé kanyarodik
    ("udvar", 1.9, "74% 44%", 2),    # a csíkos előtető alatti ajtó
    ("bolt", 1.6, "56% 46%", 3),     # fel a lépcsőn, be a boltba
]
STEP = 0.55   # ennyi görgetés alatt nyílik ki a következő kép

CH = {
    2: ("akik-eletre-keltik", "A lámpások már égnek – megérkeztünk a kávézóhoz.", "Akik életre keltik <em>minden nap</em>",
        "Rólunk, minden mókuschról", "Három lány, aki minden reggel kinyitja az ajtót, kávét főz, süt és díszít.",
        [("valogatott-tarsasag/", "Válogatott társaság", "")], ""),
    3: ("mit-muvelunk", "Nyisd ki az ajtót, és lépj be.", "Mit művelünk <em>mi itt?</em>",
        "kávéfőzés · sütés · tortadíszítés · kézművesség", "A Mókusch hétköznapjai – képekben és rövid történetekben.",
        [("kepek/", "Képek", ""), ("sztorik/", "Sztorik", "btn--ghost")], ""),
    4: ("finomsagok", "Kávéillat szálldogál a pult felől…", "Finomságok", "kávék – sütik – kutyafülék",
        "Mit lehet itt? Enni és inni – egy csésze mellett, kényelmesen.",
        [("enni/", "Enni", ""), ("inni/", "Inni", "btn--ghost")], ""),
    5: ("boszorkanykonyha", "Hátul, a konyhában mindig rotyog valami.", "Ez a mi kis <em>boszorkánykonyhánk</em>",
        "receptek, praktikák, kézműves ötletek", "Amit nálunk megszerettél, otthon is kipróbálhatod.",
        [("nehany-artatlan-recept/", "Néhány ártatlan recept", ""), ("tippek-trukkok/", "Tippek-trükkök", "btn--ghost")], ""),
    6: ("nyuszis-polc", "És itt a polc, amely előtt mindenki megáll.", "A híres <em>nyuszis polc</em>",
        "minden, ami egy erdei teadélutánhoz kellhet", "Kézzel készült apróságok egy erdei teadélutánhoz.",
        [("nyuszis-polc/", "…és ezt is mind ti csináltátok?", "")], ""),
    7: ("akarmicsodak", "Egy csendes sarok, egy jó könyv.", "Varázslatos <em>akármicsodák</em>",
        "varázslatos-mesés könyvek, csodás csecsebecsék", "Leülhetsz egy könyvvel – és apróságokat is hazavihetsz.",
        [("konyvek/", "Könyvek", ""), ("csodas-csecsebecsek/", "Csodás csecsebecsék", "btn--ghost")], ""),
    8: ("palackposta", "A falon üzenetek – írj te is!", "Palackposta", "minden levél ideér",
        "Írj nekünk, foglalj asztalt, vagy olvasd el, mit üzentek mások.",
        [("uzenek/", "Üzenek!", "btn--berry"), ("asztalfoglalas/", "Asztalfoglalás", "btn--ghost")], "POSTA"),
    9: ("tortak", "És a mese végén: a torták.", "Torták <em>és romantika</em>", "születésnapra, esküvőre, vagy csak úgy",
        "Meséld el, milyen tortát álmodtál – a műhely ajánlattal jelentkezik.", "TORTA", "STEPS"),
}
# fejezet → illusztráció(k); két kép = kétoldalas, összeillő illusztráció
CH_IMG = {4: ("pult1", "pult2"), 5: ("konyha",), 6: ("polc1", "polc2"), 7: ("olvaso",), 8: ("posta",), 9: ("kepfal",)}


def _btns(B, pre, spec):
    if spec == "TORTA":
        return B.torta_btn(pre, label_short="Tortarendelés") + B.btn("eskuvo/", "Esküvői torták", "btn--ghost")
    return "".join(B.btn(h, t, c) for h, t, c in spec)


def _r(x):
    return f"{x:.4f}"


def index(B):
    pre = ""
    arrow = B.ARROW
    T = sum(a[1] for a in ARRIVAL)
    P = lambda u: max(0.0, min(1.0, u / T))
    starts, u = [], 0.0
    for a in ARRIVAL:
        starts.append(u)
        u += a[1]

    # --- 1. MEGÉRKEZÉS: a jelenetek egy könyvlapon belül cserélődnek
    pages, atmo = [], []
    for i, (k, units, focal, ch) in enumerate(ARRIVAL):
        S, E = starts[i], starts[i] + units
        a = -1 if i == 0 else P(S - STEP)
        b = 0 if i == 0 else P(S)
        last = i == len(ARRIVAL) - 1
        c = 2 if last else P(E - STEP)
        d = 3 if last else P(E)
        img = mese_src(B, k, "(max-width: 899px) 100vw, min(48vw, 70vh)", eager=i == 0, data=i == 2)
        pages.append(
            f'<figure class="ascene" data-ascene="{i}" data-a="{_r(a) if a >= 0 else -1}" data-b="{_r(b)}" '
            f'data-c="{_r(c) if c < 2 else 2}" data-d="{_r(d) if d < 3 else 3}" '
            f'data-f="{focal.replace("%", "").replace(" ", ",")}" style="--focal:{focal}">'
            f'<div class="ascene__in">{img}</div></figure>')
        atmo.append(f'<i data-atmo="{i}" style="background-image:url({mese_thumb(B, k)})"></i>')

    def win(a, b, c, d):
        return (f'data-a="{_r(P(a)) if a >= 0 else -1}" data-b="{_r(P(b)) if a >= 0 else 0}" '
                f'data-c="{_r(P(c)) if c < 90 else 2}" data-d="{_r(P(d)) if d < 90 else 3}"')

    e0 = ARRIVAL[0][1]
    beats = [
        f'''<div class="beat beat--hero is-on" data-beat {win(-1, 0, e0 * 0.34, e0 * 0.42)} data-ch="1">
        <p class="beat__kicker"><span class="no">1.</span> Varázserdő</p>
        <h1 id="h-meseba"><span class="ln">Hagyd magad mögött a várost,</span> <span class="ln">és lépj be <em>egy mesébe.</em></span></h1>
        <p class="beat__lead">Kézzel készített sütemények, illatos kávék és mesebeli pillanatok egy természetközeli kuckóban.</p>
        <div class="btns">{B.btn("a-mokusch-meseje/", "A Mókusch meséje")}{B.btn("almok-vagyak-tervek/", "Álmok, vágyak, tervek", "btn--ghost")}</div>
        <p class="beat__more"><a class="link" href="mesebeli-programok/">Mesebeli programok {arrow}</a></p>
      </div>''',
        f'''<div class="beat beat--line" data-beat {win(e0 * 0.46, e0 * 0.56, e0 - STEP - 0.05, e0 - STEP + 0.12)}>
        <p class="beat__story">Az ösvény egyre beljebb visz a fák közé – <em>a fények mutatják az utat.</em></p>
      </div>''']
    anchors = [("meseba", 0.0, 1)]
    for n in (2, 3):
        sid, story, title, sub, lead, bts, _x = CH[n]
        i = n - 1
        S, E = starts[i], starts[i] + ARRIVAL[i][1]
        last = n == 3
        ia, ib = S + 0.05, S + 0.3
        oc, od = (99, 99) if last else (E - STEP - 0.12, E - STEP + 0.06)
        beats.append(f'''<div class="beat" data-beat {win(ia, ib, oc, od)} data-ch="{n}">
        <p class="beat__story">{story}</p>
        <p class="beat__kicker"><span class="no">{n}.</span> fejezet</p>
        <h2 id="h-{sid}">{title}</h2>
        <p class="sub">{sub}</p>
        <p class="beat__lead">{lead}</p>
        <div class="btns">{_btns(B, pre, bts)}</div>
      </div>''')
        anchors.append((sid, P(ib + 0.2), n))
    anc = "".join(f'<span class="janchor" id="{sid}" style="--p:{_r(p)}" data-ch="{c}" aria-hidden="true"></span>'
                  for sid, p, c in anchors)
    trail = "".join(f'<li data-trail="{i}"><i></i><span>{t}</span></li>'
                    for i, t in enumerate(("Az erdei ösvény", "Az udvar", "A bolt ajtaja")))

    # --- 2. FEJEZETEK: könyvoldalak
    chaps = []
    for n in range(4, 10):
        sid, story, title, sub, lead, bts, extra = CH[n]
        imgs = CH_IMG[n]
        two = len(imgs) == 2
        if two:
            fig = ('<figure class="chap__art chap__art--two" data-art><div class="chap__spread" data-spread>'
                   + "".join(f'<div class="chap__page" data-page>{mese_src(B, k, "(max-width: 899px) 80vw, min(36vw, 460px)")}</div>' for k in imgs)
                   + '</div><figcaption class="chap__hint" aria-hidden="true">lapozz →</figcaption></figure>')
        else:
            fig = (f'<figure class="chap__art" data-art><div class="chap__page" data-page>'
                   f'{mese_src(B, imgs[0], "(max-width: 899px) 92vw, min(40vw, 520px)")}</div></figure>')
        ex = ""
        if extra == "POSTA":
            ex = (f'<p class="beat__more">Olvasd el, mit <a class="link" href="uzenetek/">üzentek mások</a>, vagy nézd meg a '
                  f'<a class="link" href="mokassagok/">mókásságokat</a>.</p>'
                  f'<p class="chap__visit" id="hol-vagyunk"><b>Hol vagyunk?</b> {B.ADDR} · '
                  f'<a href="{B.MAP}" target="_blank" rel="noopener">térkép</a> · <a href="{B.PHONE_HREF}">{B.PHONE}</a></p>')
        steps = ('<ol class="steps-book"><li><b>1</b>Meséld el, mit álmodtál</li><li><b>2</b>Ajánlatot kapsz</li>'
                 '<li><b>3</b>Megbeszélitek a részleteket</li></ol>') if bts == "TORTA" else ""
        flip = (not two) and n in (7, 9)
        chaps.append(f'''<section class="chap{' chap--two' if two else ''}{' chap--flip' if flip else ''}" id="{sid}" aria-labelledby="h-{sid}">
  <div class="wrap chap__grid">
    {fig}
    <div class="chap__text" data-ctext>
      <p class="beat__story">{story}</p>
      <p class="beat__kicker"><span class="no">{n}.</span> fejezet</p>
      <h2 id="h-{sid}">{title}</h2>
      <p class="sub">{sub}</p>
      <p class="beat__lead">{lead}</p>
      {steps}
      <div class="btns">{_btns(B, pre, bts)}</div>
      {ex}
    </div>
  </div>
</section>''')

    body = f'''
<main id="tartalom">

<!-- 1–3. fejezet: megérkezés. Natív görgetés (nincs scroll-jacking), ragadós könyvlap; az illusztráció a saját arányában. -->
<section class="journey" aria-labelledby="h-meseba" data-journey style="--units:{T:.2f}">
  {anc}
  <div class="journey__sticky">
    <div class="journey__atmo" aria-hidden="true">{"".join(atmo)}</div>
    <div class="arrive wrap">
      <div class="arrive__text">
        <div class="arrive__beats">{"".join(beats)}</div>
        <ol class="trail" aria-hidden="true">{trail}</ol>
      </div>
      <div class="arrive__page" data-jframe>
        {"".join(pages)}
        <canvas class="fireflies" data-fireflies="forest" aria-hidden="true"></canvas>
      </div>
    </div>
    <p class="journey__hint" aria-hidden="true" data-jhint><span>Görgess, és indulj el az ösvényen</span><i></i></p>
  </div>
</section>

<div class="chapters">
{"".join(chaps)}
</div>

<!-- A mese utolsó lapja -->
<aside class="tortaband epilog" aria-labelledby="h-epilog">
  <div class="wrap">
    <div class="tortaband__card epilog__page" data-rv>
      <div class="wash wash--2" aria-hidden="true"></div>
      {B.LOGO.inline_mark(cls="tortaband__mark", bg="#EEE1D8")}
      <p class="epilog__orn" aria-hidden="true"><i></i><span>~</span><i></i></p>
      <h2 id="h-epilog">Itt ér véget a mese első lapja.</h2>
      <p class="epilog__txt">A folytatást a Várfok utcában meséljük el – egy csésze kávé mellett, vagy egy tortával, amit együtt álmodunk meg.</p>
      <div class="btns">{B.torta_btn(pre, label_short="Tortarendelés")}{B.btn("asztalfoglalas/", "Asztalfoglalás", "btn--ghost")}</div>
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
    k0 = ARRIVAL[0][0]
    pl = ""
    if k0 in MESE:
        W = MESE[k0][0]
        ws = [w for w in MESE_W if w < W] + [W]
        pl = (f'<link rel="preload" as="image" imagesrcset="{", ".join(f"img/mese/{k0}-{w}.webp {w}w" for w in ws)}" '
              f'imagesizes="(max-width: 899px) 100vw, min(48vw, 70vh)" fetchpriority="high">\n')
    out = B.head("Mókusch kávézó és tortaműhely – Budapest, Várfok utca 30.",
                 "Mesebeli kávézó és tortaműhely a Várfok utcában: egy erdei ösvény vezet a kávékhoz, süteményekhez, a híres nyuszis polchoz és az egyedi tortákhoz.",
                 pre, extra=pl + ld)
    out += B.header(pre) + body + B.footer(pre)
    (B.OUT / "index.html").write_text(out, encoding="utf-8")
