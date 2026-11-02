#!/usr/bin/env python3
"""Mókusch – B-változat (mokusch-premium-v3) generátora.

Ugyanaz a tartalom és aloldal-szerkezet, mint a v2-ben (build.py), de:
- képek helyett saját, rajzolt papírkivágásos jelenetek (scenes.py) – Wix/AI-kép nincs,
- más elrendezés, Literata + Figtree betűk, erdőzöld–krém–bogyó színvilág,
- a Wix-oldalra csak a fejezetcímek, a mókus és a púder kiemelés emlékeztet.
Futtatás a repó gyökeréből:  python3 prototypes/mokusch-premium-v2/build_v3.py
"""
import re
import sys
import html
import shutil
import itertools
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build as B   # noqa: E402
import scenes as S  # noqa: E402
import logo as LOGO  # noqa: E402

B.OUT = HERE.parents[1] / "public" / "latvanytervek" / "mokusch-premium-v3"
OUT = B.OUT
_ids = itertools.count(1)


def scene_inline(key, label=None):
    """Inline SVG-jelenet egyedi azonosítókkal (több is lehet egy oldalon)."""
    svg = S.scene(key)
    n = next(_ids)
    for i in ("pc", "grain", "glow"):
        svg = svg.replace(f'id="{i}"', f'id="{i}{n}"').replace(f'url(#{i})', f'url(#{i}{n})')
    return svg


def v3_img(key, ratio=(4, 5), sizes=None, eager=False, parallax=False):
    return scene_inline(key)


B.img = v3_img


def v3_pic(key, ratio=(4, 5), eager=False, sizes=None, tag=None, reveal=True, parallax=True):
    return f'<div class="pic pic--scene">{scene_inline(key)}</div>'


B.pic = v3_pic


def v3_cloud_path(seed=1, n=17):
    """Lágy hullám (papírszél) a v2 felhői helyett."""
    d = "M-60 60 L-60 40"
    x = -60
    while x < 1500:
        d += f" Q {x + 90} 18, {x + 180} 40 T {x + 360} 40"
        x += 360
    return d + " L1500 60 Z"


B._cloud_path = v3_cloud_path


def v3_head(title, desc, prefix, extra=""):
    h = B.__dict__["_orig_head"](title, desc, prefix, extra)
    h = h.replace('<meta name="theme-color" content="#DCC6B9">', '<meta name="theme-color" content="#24382B">')
    h = re.sub(r'<link rel="preload" href="[^"]*fonts/[^"]*"[^>]*>\n', '', h)
    h = h.replace(f'<link rel="stylesheet"', f'<link rel="preload" href="{prefix}fonts/literata.woff" as="font" type="font/woff" crossorigin>\n'
                  f'<link rel="preload" href="{prefix}fonts/figtree-var.woff" as="font" type="font/woff" crossorigin>\n<link rel="stylesheet"', 1)
    h = re.sub(r'css/site\.css\?v=\d+', 'css/site.css?v=1', h)
    return h


B.__dict__["_orig_head"] = B.head
B.head = v3_head


def v3_brand(home, dark=False):
    if dark:
        m = LOGO.inline_mark(bg="#24382B", acorn="#C68B3E", cap="#EBCFC3")
    else:
        m = LOGO.inline_mark(bg="#FBF6EC", acorn="#C68B3E", cap="#7A5640")
    w = LOGO.inline_wordmark()
    return (f'<a class="brand" href="{home}" aria-label="Mókusch kávézó és tortaműhely – főoldal">{m}'
            f'<span class="brand__t">{w}<span>kávézó és tortaműhely</span></span></a>')


B.brand = v3_brand


def v3_footer(prefix, page_js="", float_cta=True):
    f = B.__dict__["_orig_footer"](prefix, page_js, float_cta)
    f = re.sub(r'js/site\.js\?v=\d+', 'js/site.js?v=1', f)
    f = re.sub(r'js/motion-fx\.js\?v=\d+', 'js/motion-fx.js?v=1', f)
    f = f.replace('<script src="' + prefix + 'js/motion-fx.js?v=1" defer></script>',
                  '<script src="' + prefix + 'js/motion-fx.js?v=1" defer></script>\n<script src="' + prefix + 'js/scenes.js?v=1" defer></script>')
    f = f.replace("Látványterv (DAEKON) · mintatartalmakkal", "Látványterv B-változat (DAEKON) · rajzolt illusztrációkkal, mintatartalmakkal")
    return f


B.__dict__["_orig_footer"] = B.footer
B.footer = v3_footer

CH_ICON = {  # apró vonalas ikonok a fejezet-kártyákhoz
    "1": '<path d="M4 20c4-6 6-12 8-16 2 4 4 10 8 16" /><path d="M9 20c1-3 2-5 3-7 1 2 2 4 3 7"/>',
    "2": '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c1-4 3-6 5-6s4 2 5 6M11 20c1-4 3-6 5-6s4 2 5 6"/>',
    "3": '<path d="M5 20V10l7-5 7 5v10"/><path d="M10 20v-5h4v5"/>',
    "4": '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M9 3c-1 1.5 1 2 0 4M12 3c-1 1.5 1 2 0 4"/>',
    "5": '<path d="M4 11h16c0 5-3 8-8 8s-8-3-8-8z"/><path d="M8 7c-1-1.5 1-2 0-4M12 7c-1-1.5 1-2 0-4M16 7c-1-1.5 1-2 0-4"/>',
    "6": '<path d="M9 12c-3-1-3-8-1-8s2 6 1 8zM15 12c3-1 3-8 1-8s-2 6-1 8z"/><circle cx="12" cy="16" r="5"/>',
    "7": '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
    "8": '<path d="M10 3h4v3l2 3v11H8V9l2-3z"/><path d="M10 13h4"/>',
    "9": '<path d="M5 20h14M6 20v-6h12v6M8 14v-4h8v4M12 10V7"/><path d="M12 3.5c1 1 1 2 0 2.6-1-.6-1-1.6 0-2.6z"/>',
}


def icon(no):
    return f'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">{CH_ICON[no]}</svg>'


def chap(no, sid, title, sub, lead, btns, key, flip=False, tone="paper", extra=""):
    return f'''<section class="chap chap--{tone}{' chap--flip' if flip else ''}{' on-dark' if tone == 'forest' else ''}" id="{sid}" aria-labelledby="h-{sid}">
  <div class="wrap chap__grid">
    <figure class="stage-card" data-stage>{scene_inline(key)}</figure>
    <div class="chap__text">
      <p class="chap__no" data-rv><span>{no}</span> {CH_ICONS_LABEL.get(no, "fejezet")}</p>
      <h2 id="h-{sid}">{title}</h2>
      {f'<p class="sub" data-rv>{sub}</p>' if sub else ''}
      <p class="lead" data-rv>{lead}</p>
      {extra}
      {f'<div class="btns" data-rv>{btns}</div>' if btns else ''}
    </div>
  </div>
</section>'''


CH_ICONS_LABEL = {}


def v3_index():
    pre = ""
    btn = B.btn
    chips = "".join(
        f'<li{" class=\"is-torta\"" if c[0] == "9" else ""}><a href="#{c[1]}">{icon(c[0])}<span class="n">{c[0]}.</span><span class="t">{c[2]}</span></a></li>'
        for c in B.CHAPTERS)
    trio = ('<div class="trio" data-rv>' + "".join(
        f'<figure><div class="oval"><div class="slot" role="img" aria-label="Portré helye: {n}">{B.CAM}</div></div><figcaption><b>{n}</b>alapító</figcaption></figure>'
        for n in ("Wanda", "…", "…")) + '</div>')
    posta_extra = (f'<div class="pins" data-rv>{btn("uzenek/", "Üzenek!", "btn--berry")}{btn("asztalfoglalas/", "Asztalfoglalás")}'
                   f'{btn("uzenetek/", "Üzenetek", "btn--ghost")}{btn("mokassagok/", "Mókásságok", "btn--ghost")}</div>'
                   f'<p class="visit" id="hol-vagyunk" data-rv><span><b>Hol vagyunk?</b> {B.ADDR} · <a href="{B.MAP}" target="_blank" rel="noopener">térkép</a></span>'
                   f'<span><a href="{B.PHONE_HREF}">{B.PHONE}</a> · <a href="mailto:{B.EMAIL}">{B.EMAIL}</a></span></p>')
    body = f'''
<main id="tartalom">

<!-- 1. fejezet – papírszínház nyitókép -->
<section class="stage" id="meseba" aria-labelledby="h-meseba">
  <div class="stage__art" data-stage-hero>{scene_inline("osveny")}</div>
  <div class="wrap stage__in">
    <div class="stage__card">
      <p class="chap__no"><span>1</span> Várfok utca 30. · Budapest</p>
      <h1 id="h-meseba"><span class="ln">Hagyd magad mögött a várost,</span> <span class="ln">és lépj be <em>egy mesébe.</em></span></h1>
      <p class="lead" data-rv>Kézzel készített sütemények, illatos kávék és mesebeli pillanatok egy természetközeli kuckóban.</p>
      <div class="btns" data-rv>{B.torta_btn(pre, label_short="Tortarendelés")}{btn("a-mokusch-meseje/", "A Mókusch meséje", "btn--ghost")}</div>
      <p class="stage__more" data-rv><a class="link" href="almok-vagyak-tervek/">Álmok, vágyak, tervek {B.ARROW}</a><a class="link" href="mesebeli-programok/">Mesebeli programok {B.ARROW}</a></p>
    </div>
  </div>
</section>

<nav class="chips" aria-labelledby="h-chips">
  <div class="wrap">
    <h2 id="h-chips" class="sr-only">Fejezetek</h2>
    <ol>{chips}</ol>
  </div>
</nav>

{chap("2", "akik-eletre-keltik", "Akik életre keltik <em>minden nap</em>", "Rólunk, minden mókuschról",
      "Három lány, aki minden reggel kinyitja az ajtót, kávét főz, süt és díszít.",
      btn("valogatott-tarsasag/", "Válogatott társaság"), "udvar", extra=trio)}

{chap("3", "mit-muvelunk", "Mit művelünk <em>mi itt?</em>", "kávéfőzés · sütés · tortadíszítés · kézművesség",
      "A Mókusch hétköznapjai – képekben és rövid történetekben.",
      btn("kepek/", "Képek") + btn("sztorik/", "Sztorik", "btn--ghost"), "bolt", flip=True, tone="tint")}

{chap("4", "finomsagok", "Finomságok", "kávék · sütik · kutyafülék",
      "Mit lehet itt? Enni és inni – egy csésze mellett, kényelmesen.",
      btn("enni/", "Enni") + btn("inni/", "Inni", "btn--ghost") + btn("tortarendeles/", "Egyedi torta", "btn--ghost"), "pult1")}

{chap("5", "boszorkanykonyha", "Ez a mi kis <em>boszorkánykonyhánk</em>", "receptek · praktikák · kézműves ötletek",
      "Amit nálunk megszerettél, otthon is kipróbálhatod.",
      btn("nehany-artatlan-recept/", "Néhány ártatlan recept") + btn("tippek-trukkok/", "Tippek-trükkök", "btn--ghost"), "konyha", flip=True, tone="tint")}

<aside class="ribbon" aria-label="Tortarendelés">
  <div class="wrap ribbon__in">
    <div class="ribbon__l">{LOGO.inline_mark(cls="ribbon__mark", fg="#FBF6EC", bg="#7B3446", acorn="#E2B868", cap="#EBCFC3")}
      <div><h2>Tortát álmodnál?</h2><p>Születésnapra, esküvőre, vagy csak úgy – nyolc rövid lépésben.</p></div></div>
    {B.torta_btn(pre, cls="btn btn--cream", label_short="Tortarendelés")}
  </div>
</aside>

{chap("6", "nyuszis-polc", "A híres <em>nyuszis polc</em>", "minden, ami egy erdei teadélutánhoz kellhet",
      "Egy polc, amely előtt mindenki megáll egy pillanatra.",
      btn("nyuszis-polc/", "…és ezt is mind ti csináltátok?"), "polc1")}

{chap("7", "akarmicsodak", "Varázslatos <em>akármicsodák</em>", "mesés könyvek · csodás csecsebecsék",
      "Egy sarok, ahol leülhetsz egy könyvvel – és apróságok, amiket haza is vihetsz.",
      btn("konyvek/", "Könyvek", "btn--cream") + btn("csodas-csecsebecsek/", "Csodás csecsebecsék", "btn--ghost"), "olvaso", flip=True, tone="forest")}

{chap("8", "palackposta", "Palackposta", "minden levél ideér",
      "Írj nekünk, foglalj asztalt, vagy olvasd el, mit üzentek mások.", "", "posta", extra=posta_extra)}

<!-- 9. fejezet – torta-finálé -->
<section class="finale2" id="tortak" aria-labelledby="h-tortak">
  <div class="finale2__art" data-stage-hero>{scene_inline("kepfal")}</div>
  <div class="wrap finale2__in">
    <div class="finale2__card">
      <p class="chap__no"><span>9</span> fejezet</p>
      <h2 id="h-tortak">Torták <em>és romantika</em></h2>
      <p class="lead" data-rv>Meséld el, milyen tortát álmodtál – a műhely ajánlattal jelentkezik.</p>
      <ol class="steps3" data-rv><li><b>1</b> Meséld el</li><li><b>2</b> Ajánlatot kapsz</li><li><b>3</b> A műhely megsüti</li></ol>
      <div class="btns" data-rv>{B.torta_btn(pre, label_short="Tortarendelés")}{btn("eskuvo/", "Esküvői torták", "btn--ghost")}</div>
    </div>
  </div>
</section>

</main>
'''
    out = B.head("Mókusch kávézó és tortaműhely – B-változat",
                 "Mesebeli kávézó és tortaműhely a Várfok utcában – rajzolt, papírkivágásos látványterv.", pre)
    out += B.header(pre) + body + B.footer(pre)
    (OUT / "index.html").write_text(out, encoding="utf-8")


B.index = v3_index

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    v2 = OUT.parent / "mokusch-premium-v2"
    # közös statikus fájlok átvétele a v2-ből (a CSS-t és a scenes.js-t a v3 saját fájljai írják felül)
    for sub in ("js/vendor", "img/logo"):
        shutil.copytree(v2 / sub, OUT / sub, dirs_exist_ok=True)
    shutil.copy(v2 / "img/favicon.svg", OUT / "img/favicon.svg")
    for f in ("site.js", "motion-fx.js"):
        shutil.copy(v2 / "js" / f, OUT / "js" / f)
    (OUT / "fonts").mkdir(exist_ok=True)
    src = OUT.parent / "balogh-beatrix" / "fonts"
    for f in ("literata.woff", "literata-italic.woff", "figtree-var.woff", "OFL-Literata.txt", "OFL-Figtree.txt"):
        shutil.copy(src / f, OUT / "fonts" / f)
    (OUT / "css").mkdir(exist_ok=True)
    base = (v2 / "css" / "site.css").read_text(encoding="utf-8")
    base = re.sub(r'@font-face\{font-family:"Playfair Display"[^\n]*\n', '', base)
    (OUT / "css" / "site.css").write_text("/* Közös alap a v2-ből (build_v3.py másolja) + B-változat felülírásai */\n" + base + (HERE / "v3.css").read_text(encoding="utf-8"), encoding="utf-8")
    shutil.copy(HERE / "scenes.js", OUT / "js" / "scenes.js")
    B.index()
    B.build_subs()
    B.build_arculat()
    arc = OUT / "arculat" / "index.html"
    t = arc.read_text(encoding="utf-8")
    t = re.sub(r'<div class="swatches">.*?</div>\n</div></section>',
               '<div class="swatches">'
               + "".join(f'<div class="sw" data-rv><i style="--c:{v}"></i><div><b>{n}</b><span>{v} · {u}</span></div></div>' for n, v, u in [
                   ("Papír", "#F4ECDD", "alap"), ("Erdő", "#24382B", "sötét felületek"), ("Moha", "#3E5134", "illusztráció"), ("Bogyó", "#7B3446", "tortarendelés"),
                   ("Púder", "#D9B4A6", "kiemelés (Wix)"), ("Méz", "#E2B868", "fények"), ("Okker", "#C68B3E", "keretek"), ("Kéreg", "#5A3D2B", "szöveg, mókus")])
               + '</div>\n</div></section>', t, flags=re.S)
    t = t.replace('<span class="tag">A Wix-oldal színeiből</span>', '<span class="tag">B-változat</span>')
    t = t.replace("Címek · Playfair Display", "Címek · Literata").replace("Elegáns, jól olvasható antikva, dőlt kiemelésekkel.", "Könyvekhez tervezett, nagyon jól olvasható antikva – mesekönyv-hangulat, dőlt kiemelésekkel.")
    t = t.replace("Szöveg · Manrope", "Szöveg · Figtree")
    arc.write_text(t, encoding="utf-8")
    print("kész:", OUT)
