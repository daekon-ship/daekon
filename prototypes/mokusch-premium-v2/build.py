#!/usr/bin/env python3
"""Mókusch prémium látványterv v2 – oldalgenerátor (DAEKON).

A közös fejléc/lábléc miatt az oldalakat ez a szkript állítja elő
statikus HTML-ként a public/latvanytervek/mokusch-premium-v2/ mappába.
Futtatás a repó gyökeréből:  python3 prototypes/mokusch-premium-v2/build.py
A logófájlokat a logo.py készíti (img/logo/), a fejléc-logót innen inline-oljuk.
"""
from pathlib import Path
import html
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import logo as LOGO  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "latvanytervek" / "mokusch-premium-v2"

PHONE = "+36 30 618 4373"
PHONE_HREF = "tel:+36306184373"
EMAIL = "mokuschinfo@gmail.com"
FB = "https://www.facebook.com/mokuschkavezo"
IG = "https://www.instagram.com/mokuschkavezo/"
MAP = "https://www.google.com/maps/search/?api=1&query=M%C3%B3kusch%20k%C3%A1v%C3%A9z%C3%B3%2C%201012%20Budapest%2C%20V%C3%A1rfok%20utca%2030"
ADDR = "1012 Budapest, Várfok utca 30."

# --- A Wix-oldal saját képei (Wanda válogatása). Festett, illusztrációs hatású képek:
#     a tervben illusztrációként szerepelnek, sosem valódi termék- vagy üzletfotóként.
WIX = {
    "osveny":  ("1c02e2457c654f63bc501ea424959dbe", "png",  "Festett illusztráció: napfényes erdei ösvény páfrányokkal, virágokkal, egy Mókusch feliratú fatáblával"),
    "udvar":   ("de1100572d664c6fa755501935ba3cf6", "png",  "Festett illusztráció: lámpásokkal megvilágított, borostyános udvar kis asztalokkal és egy Mókusch feliratú táblával"),
    "bolt":    ("8c413555228144899a373d1a90d78540", "jpg",  "Festett illusztráció: polcokkal, befőttesüvegekkel és szárított virágokkal teli bolt, lépcsővel a bejáratnál"),
    "pult1":   ("b532d1c8fb82452ca1ee0c6a437521a3", "jpeg", "Festett illusztráció: kávéfőző gép a pulton, fölötte polcok sütis üvegekkel és egy függőlámpa"),
    "pult2":   ("315890bf789a4ad5aa95db1d942ada81", "jpeg", "Festett illusztráció: üveges süteményes vitrin a pulton, fölötte koszorú és bögrék"),
    "konyha":  ("cfbccf746a67484b964a2df6f863167e", "png",  "Festett illusztráció: keskeny, meleg fényű konyha munkapulttal, edényekkel és szárított gyógynövényekkel"),
    "polc1":   ("985771b104cd41dab77d14018f3442df", "jpeg", "Festett illusztráció: fa polc befőttesüvegekkel, szárított virágcsokor, koszorú és egy nyuszis doboz"),
    "polc2":   ("cbfc9cb28d9a4925bc337c8867019c7e", "jpeg", "Festett illusztráció: üvegekkel teli fa polc, kosár fonallal és egy virágokkal díszített létra"),
    "olvaso":  ("d7aecd48d9874c7fab65891cc27e88e8", "png",  "Festett illusztráció: könyvespolcokkal körülvett olvasósarok zöld fotellel, lámpával és kötögetős kosárral"),
    "posta":   ("2478afc6d240420187f710e04ce729f5", "png",  "Kép a Wix-oldalról: üzenetekkel teleragasztott fal, szárított levendula, kis lámpa és egy sütis vitrin"),
    "kepfal":  ("c2114812ce19405593f6a7dd4da29f15", "png",  "Festett illusztráció: keretezett képek egy régi falon, előtte égő lámpás, mezei virágok és egy szív alakú dísz"),
}


def wimg(key, w, h):
    mid, ext, _ = WIX[key]
    return (f"https://static.wixstatic.com/media/4f5ae5_{mid}~mv2.{ext}"
            f"/v1/fill/w_{w},h_{h},al_c,q_82,enc_auto/mokusch-{key}.{ext}")


def img(key, ratio=(4, 5), sizes="(max-width: 899px) 90vw, 460px", eager=False, parallax=False):
    rw, rh = ratio
    if parallax:  # a parallaxhoz kicsit magasabb kivágás kell
        rh = rh * 1.1
    widths = [420, 720, 1000]
    srcset = ", ".join(f"{wimg(key, w, round(w * rh / rw))} {w}w" for w in widths)
    w0 = 720
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    tag = (f'<img src="{wimg(key, w0, round(w0 * rh / rw))}" srcset="{srcset}" sizes="{sizes}" '
           f'width="{w0}" height="{round(w0 * rh / rw)}" alt="{html.escape(WIX[key][2])}" {load} decoding="async">')
    if parallax:
        tag = f'<div class="px" data-px>{tag}</div>'
    return tag


def plate(key, ratio=(4, 5), cls="", eager=False, parallax=False, sizes=None, tag=None, attrs=""):
    tag = tag if tag is not None else ("Wix-kép" if key == "posta" else "Illusztráció")
    kw = {"eager": eager, "parallax": parallax}
    if sizes:
        kw["sizes"] = sizes
    t = f'<span class="plate__tag">{tag}</span>' if tag else ""
    return (f'<figure class="plate {cls}" {attrs}><div class="plate__img" style="--ar:{ratio[0]}/{ratio[1]}">'
            f'{img(key, ratio, **kw)}{t}</div></figure>')


CAM = ('<svg class="slot__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">'
       '<path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3v10H4z"/><circle cx="12" cy="13.2" r="3.4"/></svg>')


def slot(title, code, ratio=(4, 5), cls="", tint=None):
    st = f' style="--slot:{tint[0]};--slot2:{tint[1]}"' if tint else ""
    return (f'<figure class="plate {cls}"><div class="plate__img" style="--ar:{ratio[0]}/{ratio[1]}">'
            f'<div class="slot"{st} role="img" aria-label="Fotóhely: {html.escape(title)} – a valódi Mókusch-fotó ide kerül">'
            f'{CAM}<span class="slot__t">{title}</span><span class="slot__c">Valódi fotó helye · {code}</span></div>'
            f'</div></figure>')


ROSE_TINT = ("#F1E4DB", "#E5D2C6")

ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>'
CAKE = ('<svg class="cake" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M5 20v-6.5h14V20M7 13.5V10h10v3.5M12 10V7.5"/>'
        '<path d="M12 4.2c.8.9.8 2 0 2.6-.8-.6-.8-1.7 0-2.6Z"/><path d="M5 16.4c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0"/></svg>')

SPRIG_A = ('<svg class="sprig sprig--a sway" viewBox="0 0 150 260" aria-hidden="true">'
           '<path d="M75 258 C 74 200, 78 140, 72 70 C 70 46, 74 24, 80 4"/>'
           '<path d="M74 225 C 54 214, 34 214, 16 222"/><path d="M75 225 C 96 212, 118 212, 136 220"/>'
           '<path d="M74 190 C 56 176, 38 172, 20 176"/><path d="M76 188 C 96 174, 114 170, 132 174"/>'
           '<path d="M73 152 C 58 138, 44 132, 28 132"/><path d="M75 150 C 92 136, 106 130, 122 130"/>'
           '<path d="M72 114 C 60 102, 50 96, 38 94"/><path d="M73 112 C 86 100, 96 94, 110 92"/>'
           '<path d="M72 78 C 64 68, 58 62, 50 60"/><path d="M73 76 C 82 66, 90 60, 98 58"/>'
           '<path d="M76 44 C 72 36, 68 32, 63 30"/><path d="M77 42 C 82 34, 86 30, 91 28"/></svg>')
SPRIG_B = ('<svg class="sprig sprig--b sway sway--slow" viewBox="0 0 120 220" aria-hidden="true">'
           '<path d="M60 218 C 62 160, 54 110, 64 40"/>'
           '<path d="M61 170 C 40 166, 26 150, 24 128 C 44 130, 58 146, 61 170"/>'
           '<path d="M59 120 C 80 116, 96 100, 98 78 C 78 80, 62 96, 59 120"/>'
           '<path d="M62 80 C 46 74, 38 60, 40 44 C 54 48, 62 62, 62 80"/>'
           '<circle cx="64" cy="34" r="5"/><circle cx="74" cy="42" r="4"/><circle cx="55" cy="40" r="3.5"/></svg>')
SPRIG_C = ('<svg class="sprig sprig--c sway" viewBox="0 0 110 160" aria-hidden="true">'
           '<path d="M20 158 C 30 110, 50 70, 96 20"/>'
           '<path d="M38 108 C 26 96, 24 80, 30 66 C 42 78, 44 94, 38 108"/>'
           '<path d="M52 84 C 62 72, 78 68, 92 72 C 82 84, 66 88, 52 84"/>'
           '<path d="M66 60 C 60 48, 62 36, 70 26 C 76 38, 74 50, 66 60"/></svg>')

# ---------- fejezetek és aloldalak ----------
CHAPTERS = [
    ("1", "meseba", "Hagyd magad mögött a várost", "Mese · Álmok · Programok"),
    ("2", "akik-eletre-keltik", "Akik életre keltik minden nap", "Válogatott társaság"),
    ("3", "mit-muvelunk", "Mit művelünk mi itt?", "Képek · Sztorik"),
    ("4", "finomsagok", "Finomságok", "Enni · Inni"),
    ("5", "boszorkanykonyha", "Ez a mi kis boszorkánykonyhánk", "Receptek · Tippek"),
    ("6", "nyuszis-polc", "A híres nyuszis polc", "…és ezt is ti csináltátok?"),
    ("7", "akarmicsodak", "Varázslatos akármicsodák", "Könyvek · Csecsebecsék"),
    ("8", "palackposta", "Palackposta", "Üzenek · Asztalfoglalás"),
    ("9", "tortak", "Torták és romantika", "Tortarendelés · Esküvő"),
]
CH = {c[0]: c for c in CHAPTERS}

SUBS = [
    ("a-mokusch-meseje", "1", "A Mókusch meséje", "Hogyan lett egy budai utcában erdei kuckó – a Mókusch története."),
    ("almok-vagyak-tervek", "1", "Álmok, vágyak, tervek", "Amiről a Mókusch álmodik, amit szeretne, és amin már dolgozik."),
    ("mesebeli-programok", "1", "Mesebeli programok", "Délutánok, műhelyek és mesés alkalmak a Mókuschban."),
    ("valogatott-tarsasag", "2", "Válogatott társaság", "A három Mókusch-lány és a csapat bemutatkozása."),
    ("kepek", "3", "Képek", "Képek a Mókusch mindennapjaiból: kávé, sütés, tortadíszítés, kézművesség."),
    ("sztorik", "3", "Sztorik", "Rövid történetek a pult mögül és a műhelyből."),
    ("enni", "4", "Enni", "Sütemények, reggelik és apró finomságok a Mókuschban."),
    ("inni", "4", "Inni", "Kávék, teák és más italok a Mókuschban."),
    ("nehany-artatlan-recept", "5", "Néhány ártatlan recept", "Receptek a Mókusch boszorkánykonyhájából."),
    ("tippek-trukkok", "5", "Tippek-trükkök", "Praktikák sütéshez, díszítéshez és kézműveskedéshez."),
    ("nyuszis-polc", "6", "…és ezt is mind ti csináltátok?", "A híres nyuszis polc: minden, ami egy erdei teadélutánhoz kellhet."),
    ("konyvek", "7", "Könyvek", "Gondosan válogatott, varázslatos-mesés könyvek."),
    ("csodas-csecsebecsek", "7", "Csodás csecsebecsék", "Apró, különleges tárgyak a Mókusch polcairól."),
    ("uzenek", "8", "Üzenek!", "Írj a Mókuschnak – kérdés, ötlet vagy köszönet."),
    ("asztalfoglalas", "8", "Asztalfoglalás", "Asztalfoglalás a Mókusch kávézóba, Budapest I. kerület."),
    ("uzenetek", "8", "Üzenetek", "Levelek és üzenetek a Mókusch falára tűzve."),
    ("mokassagok", "8", "Mókásságok", "Apró vidámságok a Mókusch világából."),
    ("tortarendeles", "9", "Tortarendelés", "Egyedi torta ajánlatkérése nyolc rövid lépésben a Mókusch tortaműhelytől."),
    ("eskuvo", "9", "Esküvő", "Esküvői torták a Mókusch tortaműhelytől – egyedi ajánlatkérés."),
]
SUB = {s[0]: s for s in SUBS}
SUB["arculat"] = ("arculat", None, "Arculat és logó", "A Mókusch új logója, színei és betűi – arculati javaslat.")


def p(prefix, path):
    return prefix + path


def head(title, desc, prefix, extra=""):
    return f'''<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{html.escape(desc)}">
<!-- Látványterv: ne indexelje a kereső -->
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#DCC6B9">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="Mókusch kávézó és tortaműhely">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<link rel="icon" href="{prefix}img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://static.wixstatic.com" crossorigin>
<link rel="preload" href="{prefix}fonts/playfair-normal-400_900-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{prefix}fonts/manrope-normal-200_800-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{prefix}css/site.css?v=9">
<script>
  /* Animációs mód: teljes, vagy – csökkentett mozgást kérő eszközön – visszafogott (csak áttűnések,
     feltárások, ikonmozgás). A láblécben a látogató átkapcsolhat (localStorage). */
  (function(){{var d=document.documentElement,m='';d.classList.add('js');
  try{{m=localStorage.getItem('mokusch-motion')||''}}catch(e){{}}
  var red=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(m!=='off'){{d.classList.add('anim',(red&&m!=='full')?'anim-soft':'anim-full');
  setTimeout(function(){{if(!window.Motion){{d.classList.remove('anim')}}}},2500);}}}})();
</script>
{extra}</head>
'''


def _cloud_path(seed=1, n=17):
    """Szabálytalan felhőszegély (alap: y=60, a púpok felfelé)."""
    import random
    r = random.Random(seed)
    x = -60.0
    d = "M-60 60 L-60 44"
    while x < 1500:
        w = r.uniform(70, 150)
        h = r.uniform(18, 40)
        x2 = min(1500, x + w)
        d += f" C {x + w*0.05:.0f} {44 - h:.0f}, {x2 - w*0.05:.0f} {44 - h:.0f}, {x2:.0f} 44"
        x = x2
    return d + " L1500 60 Z"


def cloud(where="top", seed=1, extra=""):
    return (f'<svg class="cloud cloud--{where}" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" {extra}>'
            f'<path d="{_cloud_path(seed)}"/></svg>')


BRAND_INLINE = None


def brand(home, dark=False):
    global BRAND_INLINE
    if BRAND_INLINE is None:
        BRAND_INLINE = (LOGO.inline_mark(bg="#DCC6B9"), LOGO.inline_wordmark())
    m, w = BRAND_INLINE
    if dark:
        m = LOGO.inline_mark(bg="#C9AFA0")
    return (f'<a class="brand" href="{home}" aria-label="Mókusch kávézó és tortaműhely – főoldal">{m}'
            f'<span class="brand__t">{w}<span>kávézó és tortaműhely</span></span></a>')


def torta_btn(prefix, label_long="Tortarendelés", label_short="Torta", cls="btn btn--berry", cur=""):
    return (f'<a class="{cls}" href="{p(prefix, "tortarendeles/")}"{cur}>{CAKE}<span class="lbl-long">{label_long}</span>'
            f'<span class="lbl-short">{label_short}</span></a>')


def header(prefix, current=None):
    home = prefix if prefix else "./"

    def a(href, label, key):
        cur = ' aria-current="page"' if current == key else ""
        return f'<li><a href="{href}"{cur}>{label}</a></li>'
    # a Wix-oldal menüje, ugyanebben a sorrendben
    nav = "".join([
        a(f"{home}#finomsagok", "Finomságok", "finom"),
        a(f"{home}#tortak", "Torták és esküvő", "tortak"),
        a(p(prefix, "asztalfoglalas/"), "Asztalfoglalás", "asztalfoglalas"),
        a(p(prefix, "konyvek/"), "Könyvek", "konyvek"),
        a(f"{home}#hol-vagyunk", "Hol vagyunk?", "hol"),
    ])
    toc = "".join(f'<li{" class=\"is-torta\"" if c[0] == "9" else ""}><a href="{home}#{c[1]}"><span class="n">{c[0]}.</span><span>{c[2]}</span></a></li>' for c in CHAPTERS)
    cta_cur = ' aria-current="page"' if current == "tortarendeles" else ""
    return f'''<body>
<a class="skip" href="#tartalom">Ugrás a tartalomra</a>
<div class="topbar"><div class="wrap">
  <span class="topbar__l"><span class="dot" data-open-dot></span><span data-open-text>H–P 7:30–18:00 · Szo 9–16 · V 9–13</span></span>
  <span class="topbar__r"><a class="opt" href="{MAP}" target="_blank" rel="noopener">Várfok utca 30.</a><a href="{PHONE_HREF}">{PHONE}</a></span>
</div></div>
<header class="hdr" id="fejlec">
  <div class="wrap hdr__in">
    {brand(home)}
    <nav class="nav" aria-label="Fő navigáció"><ul>{nav}</ul></nav>
    {torta_btn(prefix, cur=cta_cur)}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu"><i aria-hidden="true"></i><span class="lbl">Fejezetek</span><span class="sr-only">Menü és fejezetek</span></button>
  </div>
  <svg class="cloud" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="{_cloud_path(7)}"/></svg>
</header>
<div class="sheet" id="menu" role="dialog" aria-modal="true" aria-label="Fejezetek és menü" hidden>
  <div class="sheet__bg" data-close></div>
  <div class="sheet__panel">
    <div class="sheet__top"><p>Tartalom</p><button class="menu-btn" type="button" data-close aria-label="Menü bezárása" aria-expanded="true"><i aria-hidden="true"></i></button></div>
    <a class="btn btn--berry" href="{p(prefix, 'tortarendeles/')}">{CAKE} Tortarendelés</a>
    <ol class="toc">{toc}</ol>
    <div class="sheet__meta">
      <p><a href="{p(prefix, 'eskuvo/')}">Esküvői torták</a> · <a href="{p(prefix, 'asztalfoglalas/')}">Asztalfoglalás</a> · <a href="{home}#hol-vagyunk">Hol vagyunk?</a></p>
      <p>{ADDR}<br><a href="{PHONE_HREF}">{PHONE}</a> · <a href="mailto:{EMAIL}">{EMAIL}</a></p>
    </div>
  </div>
</div>
'''


HOURS = '''<dl class="hours"><dt>Hétfő–péntek</dt><dd>7:30–18:00</dd><dt>Szombat</dt><dd>9:00–16:00</dd><dt>Vasárnap</dt><dd>9:00–13:00</dd></dl>'''


def footer(prefix, page_js="", float_cta=True):
    home = prefix if prefix else "./"
    fl = (f'<a class="btn btn--berry float-cta" href="{p(prefix, "tortarendeles/")}" data-float>{CAKE} Tortarendelés</a>'
          if float_cta else "")
    return f'''<footer class="ftr">
  {cloud("top", 11)}
  <div class="wrap">
    <div class="ftr__grid">
      <div>
        {brand(home, dark=True)}
        <p class="ftr__cta">{torta_btn(prefix, label_short="Tortarendelés")}</p>
      </div>
      <div>
        <h3>Itt találsz minket</h3>
        <p>{ADDR}<br><a href="{MAP}" target="_blank" rel="noopener">Útvonal a térképen</a></p>
      </div>
      <div>
        <h3>Nyitvatartás</h3>
        {HOURS}
      </div>
      <div>
        <h3>Üzenj nekünk</h3>
        <ul>
          <li><a href="{PHONE_HREF}">{PHONE}</a></li>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li><a href="{FB}" target="_blank" rel="noopener">Facebook</a> · <a href="{IG}" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="{p(prefix, 'asztalfoglalas/')}">Asztalfoglalás</a> · <a href="{p(prefix, 'eskuvo/')}">Esküvő</a></li>
        </ul>
      </div>
    </div>
    <div class="ftr__bottom">
      <span>© 2026 Mókusch kávézó és tortaműhely · <a href="{p(prefix, 'arculat/')}">Arculat és logó</a></span>
      <span>Látványterv (DAEKON) · mintatartalmakkal, az adatok egyeztetendők · <button class="motion-toggle" type="button" data-motion-toggle>Animációk</button></span>
    </div>
  </div>
</footer>
{fl}
<script src="{prefix}js/vendor/motion-11.18.2.min.js" defer></script>
<script src="{prefix}js/site.js?v=7" defer></script>
<script src="{prefix}js/motion-fx.js?v=4" defer></script>
{page_js}</body>
</html>
'''


def btn(href, label, kind="", extra=""):
    cls = f"btn {kind}".strip()
    return f'<a class="{cls}{extra}" href="{href}">{label}</a>'


def pic(key, ratio=(4, 5), eager=False, sizes="(max-width: 959px) 100vw, 50vw", tag="Illusztráció", reveal=True, parallax=True):
    t = f'<span class="pic__tag">{tag}</span>' if tag else ""
    rv = " data-reveal" if reveal else ""
    return f'<div class="pic"{rv}>{img(key, ratio, sizes=sizes, eager=eager, parallax=parallax)}{t}</div>'


def inset(key):
    return f'<div class="inset" data-rv>{pic(key, (3, 4), sizes="220px", tag="", reveal=False, parallax=False)}</div>'


def spread(no, sid, title, sub, lead, btns, key, tone="paper", flip=False, extra="", inset_key=None, tag="Illusztráció", h="h2"):
    dark = tone in ("olive", "forest")
    cls = f"spread spread--{tone}{' spread--flip' if flip else ''}{' on-dark' if dark else ''}"
    sub_html = f'<p class="sub" data-rv>{sub}</p>' if sub else ""
    ins = inset(inset_key) if inset_key else ""
    return f'''<section class="{cls}" id="{sid}" aria-labelledby="h-{sid}">
  <div class="spread__media">{pic(key, (4, 5), tag=tag, reveal=False)}{ins}</div>
  <div class="spread__text">
    <span class="no" data-rv>{no}.</span>
    <{h} id="h-{sid}" data-rv>{title}</{h}>
    {sub_html}
    <p class="lead" data-rv>{lead}</p>
    {extra}
    {f'<div class="btns" data-rv>{btns}</div>' if btns else ''}
  </div>
</section>'''


# =====================================================================
#   FŐOLDAL
# =====================================================================
def index():
    pre = ""
    marquee_words = ["kávék", "sütik", "kutyafülék", "torták", "receptek", "mesék", "könyvek", "csecsebecsék", "erdei teadélután"]
    mq = "".join(f"<span>{w}</span>" for w in marquee_words)
    posta_extra = f'''<div class="pins" data-rv>{btn("uzenek/", "Üzenek!", "btn--berry")}{btn("asztalfoglalas/", "Asztalfoglalás")}{btn("uzenetek/", "Üzenetek", "btn--ghost")}{btn("mokassagok/", "Mókásságok", "btn--ghost")}</div>
    <div class="visit" id="hol-vagyunk" data-rv><span><b>Hol vagyunk?</b> {ADDR} · <a href="{MAP}" target="_blank" rel="noopener">térkép</a></span><span><a href="{PHONE_HREF}">{PHONE}</a> · <a href="mailto:{EMAIL}">{EMAIL}</a></span></div>'''
    body = f'''
<main id="tartalom">

<!-- 1. fejezet – nyitó -->
<section class="hero on-dark" id="meseba" aria-labelledby="h-meseba">
  <div class="hero__grid">
    <div class="hero__text">
      {SPRIG_A}
      <span class="no" data-rv>1.</span>
      <h1 id="h-meseba"><span class="ln">Hagyd magad mögött a várost,</span> <span class="ln">és lépj be <em>egy mesébe</em></span></h1>
      <p class="hero__quote" data-rv>Kézzel készített sütemények, illatos kávék és mesebeli pillanatok egy természetközeli kuckóban.</p>
      <div class="btns" data-rv>
        {btn("a-mokusch-meseje/", "A Mókusch meséje", "btn--cream")}
        {btn("almok-vagyak-tervek/", "Álmok, vágyak, tervek")}
        {btn("mesebeli-programok/", "Mesebeli programok", "btn--ghost")}
      </div>
      <div class="hero__facts" data-rv>
        <span><b>Várfok utca 30.</b> · <a href="{MAP}" target="_blank" rel="noopener">1012 Budapest</a></span>
        <span>H–P 7:30–18 · Szo 9–16 · V 9–13</span>
      </div>
    </div>
    <div class="hero__media">
      <div class="pic" data-kb>{img("osveny", (4, 5), sizes="(max-width: 959px) 100vw, 50vw", eager=True)}</div>
      <div class="hero__shade"></div>
      <div class="seal" data-seal><img src="img/logo/mokusch-pecset.svg" alt="" width="124" height="124"></div>
    </div>
  </div>
  {cloud("bot", 3)}
</section>


{spread(2, "akik-eletre-keltik", "Akik életre keltik <em>minden nap</em>", "Rólunk, minden mókuschról",
        "Három lány, aki minden reggel kinyitja az ajtót, kávét főz, süt és díszít.",
        btn("valogatott-tarsasag/", "Válogatott társaság", "btn--cream"), "udvar", tone="olive",
        extra='<div class="trio" data-rv><figure><div class="oval"><div class="slot" role="img" aria-label="Portré helye: Wanda">' + CAM + '</div></div><figcaption><b>Wanda</b>alapító</figcaption></figure><figure><div class="oval"><div class="slot" role="img" aria-label="Portré helye: második alapító">' + CAM + '</div></div><figcaption><b>…</b>alapító</figcaption></figure><figure><div class="oval"><div class="slot" role="img" aria-label="Portré helye: harmadik alapító">' + CAM + '</div></div><figcaption><b>…</b>alapító</figcaption></figure></div>')}

{spread(3, "mit-muvelunk", "Mit művelünk <em>mi itt?</em>", "kávéfőzés · sütés · tortadíszítés · kézművesség",
        "A Mókusch hétköznapjai – képekben és rövid történetekben.",
        btn("kepek/", "Képek") + btn("sztorik/", "Sztorik", "btn--ghost"), "bolt", tone="paper", flip=True, inset_key="pult1")}

{spread(4, "finomsagok", "Finomságok", "kávék – sütik – kutyafülék",
        "Mit lehet itt? Enni és inni – egy csésze mellett, kényelmesen.",
        btn("enni/", "Enni") + btn("inni/", "Inni", "btn--ghost"), "pult2", tone="rose",
        extra='<ul class="menu-idx" data-rv><li>kávék</li><li>sütemények</li><li>reggelik</li><li>kutyafülék</li></ul>')}

{spread(5, "boszorkanykonyha", "Ez a mi kis <em>boszorkánykonyhánk</em>", "receptek, praktikák, kézműves ötletek",
        "Amit nálunk megszerettél, otthon is kipróbálhatod.",
        btn("nehany-artatlan-recept/", "Néhány ártatlan recept") + btn("tippek-trukkok/", "Tippek-trükkök", "btn--ghost"),
        "konyha", tone="paper2", flip=True)}

<aside class="ribbon on-dark" aria-label="Tortarendelés">
  <div class="wrap ribbon__in">
    <div class="ribbon__l">{LOGO.inline_mark(cls="ribbon__mark", fg="#EEE1D8", bg="#793F49", acorn="#C9AFA0", cap="#F6EFE4")}
      <div><h2>Tortát álmodnál?</h2><p>születésnapra, esküvőre, vagy csak úgy</p></div></div>
    <div class="btns" style="margin:0">{torta_btn(pre, cls="btn btn--cream", label_short="Tortarendelés")}</div>
  </div>
</aside>

{spread(6, "nyuszis-polc", "A híres <em>nyuszis polc</em>", "minden, ami egy erdei teadélutánhoz kellhet",
        "Egy polc, amely előtt mindenki megáll egy pillanatra.",
        btn("nyuszis-polc/", "…és ezt is mind ti csináltátok?"), "polc1", tone="paper", inset_key="polc2")}

{spread(7, "akarmicsodak", "Varázslatos <em>akármicsodák</em>", "varázslatos-mesés könyvek, csodás csecsebecsék",
        "Egy sarok, ahol leülhetsz egy könyvvel – és apróságok, amiket haza is vihetsz.",
        btn("konyvek/", "Könyvek", "btn--cream") + btn("csodas-csecsebecsek/", "Csodás csecsebecsék", "btn--ghost"),
        "olvaso", tone="forest", flip=True)}

{spread(8, "palackposta", "Palackposta", "minden levél ideér",
        "Írj nekünk, foglalj asztalt, vagy olvasd el, mit üzentek mások.",
        "", "posta", tone="rose", tag="Wix-kép",
        extra=posta_extra)}

<!-- 9. fejezet – finálé -->
<section class="finale on-dark" id="tortak" aria-labelledby="h-tortak">
  {cloud("top", 5)}
  <div class="finale__bg"><div class="pic" data-kb>{img("kepfal", (16, 10), sizes="100vw")}</div></div>
  <div class="finale__in">
    <span class="no" data-rv>9.</span>
    <h2 id="h-tortak" data-rv>Torták <em>és romantika</em></h2>
    <p class="sub" data-rv>Meséld el, milyen tortát álmodtál – a műhely megsüti.</p>
    <div class="btns" data-rv>{torta_btn(pre, cls="btn btn--cream", label_short="Tortarendelés")}{btn("eskuvo/", "Esküvő", "btn--ghost")}</div>
    <ol class="steps3" data-rv><li>meséld el</li><li>ajánlatot kapsz</li><li>a műhely megsüti</li></ol>
  </div>
</section>

</main>
'''
    ld = f'''<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"CafeOrCoffeeShop","name":"Mókusch kávézó és tortaműhely",
"address":{{"@type":"PostalAddress","streetAddress":"Várfok utca 30.","postalCode":"1012","addressLocality":"Budapest","addressCountry":"HU"}},
"telephone":"{PHONE}","email":"{EMAIL}","sameAs":["{FB}","{IG}"],
"openingHoursSpecification":[
{{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"07:30","closes":"18:00"}},
{{"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"09:00","closes":"16:00"}},
{{"@type":"OpeningHoursSpecification","dayOfWeek":"Sunday","opens":"09:00","closes":"13:00"}}]}}
</script>
'''
    out = head("Mókusch kávézó és tortaműhely – Budapest, Várfok utca 30.",
               "Mesebeli kávézó és tortaműhely a Várfok utcában: kávék, sütemények, receptek, a híres nyuszis polc, könyvek és egyedi torták ajánlatkéréssel.",
               pre, extra=ld)
    out += header(pre) + body + footer(pre)
    (OUT / "index.html").write_text(out, encoding="utf-8")


# =====================================================================
#   ALOLDALAK
# =====================================================================
CH_IMG = {"1": "osveny", "2": "udvar", "3": "bolt", "4": "pult2", "5": "konyha",
          "6": "polc1", "7": "olvaso", "8": "posta", "9": "kepfal"}
SUB_ORDER = [s[0] for s in SUBS]


def cake_cta(pre):
    return (f'<div class="wrap"><aside class="cake-cta on-dark" aria-label="Tortarendelés">'
            f'{LOGO.inline_mark(cls="cake-cta__mark", fg="#EEE1D8", bg="#793F49", acorn="#C9AFA0", cap="#F6EFE4")}'
            f'<div><h2>Tortát álmodnál?</h2><p>születésnapra, esküvőre, vagy csak úgy</p></div>'
            f'{torta_btn(pre, cls="btn", label_short="Tortarendelés")}</aside></div>')


def sub_page(slug, lead, body, plain=False, page_js="", hero_img=None, h1=None, current=None, cta=True):
    ch_no, title, desc = SUB[slug][1], SUB[slug][2], SUB[slug][3]
    pre = "../"
    if ch_no:
        ch = CH[ch_no]
        crumb = f'<a class="crumb" href="../#{ch[1]}">{ARROW} {ch[0]}. fejezet – {ch[2]}</a>'
        no = f'<span class="no" data-rv>{ch[0]}.</span>'
        idx = SUB_ORDER.index(slug)
        prv, nxt = SUBS[idx - 1], SUBS[(idx + 1) % len(SUBS)]
        np = f'''<div class="wrap"><nav class="next-prev" aria-label="Lapozás az aloldalak között">
  <a href="../{prv[0]}/"><span>← Előző lap</span><b>{prv[2]}</b></a>
  <a class="nx" href="../{nxt[0]}/"><span>Következő lap →</span><b>{nxt[2]}</b></a>
</nav></div>'''
        img_key = hero_img or CH_IMG[ch_no]
    else:
        crumb = f'<a class="crumb" href="../">{ARROW} Főoldal</a>'
        no = ""
        np = ""
        img_key = hero_img
    text = f'''{crumb}
      {no}
      <h1 id="h1" data-rv>{h1 or title}</h1>
      <p class="lead" data-rv>{lead}</p>'''
    if plain or not img_key:
        hero_html = f'''<section class="sub-hero sub-hero--plain on-dark" aria-labelledby="h1">
  <div class="wrap sub-hero__in">{text}</div>
  {cloud("bot", 9)}
</section>'''
    else:
        hero_html = f'''<section class="sub-hero on-dark" aria-labelledby="h1">
  <div class="spread spread--flip">
    <div class="spread__media">{pic(img_key, (4, 5), eager=True, reveal=False, tag="Wix-kép" if img_key == "posta" else "Illusztráció")}</div>
    <div class="spread__text">{text}</div>
  </div>
  {cloud("bot", 9)}
</section>'''
    out = head(f"{title} – Mókusch kávézó és tortaműhely", desc, pre)
    out += header(pre, current=current or slug)
    out += f'''<main id="tartalom">
{hero_html}
{body}
{cake_cta(pre) if cta else ""}
{np}
</main>
'''
    out += footer(pre, page_js, float_cta=(slug != "tortarendeles"))
    d = OUT / slug
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(out, encoding="utf-8")


def ph_lines(n=3, label="Tétel neve", meta="ár ügyféltől"):
    return "".join(f'<li><span class="muted it">{label}</span><span class="dots" aria-hidden="true"></span><span class="ar">{meta}</span></li>' for _ in range(n))


DEMO = '<div class="demo-banner" role="note"><span aria-hidden="true">✳</span><span><b>Bemutató űrlap.</b> A látványtervben semmi nem kerül elküldésre; az éles oldalon itt indul a valódi {what}.</span></div>'


def build_subs():
    # 1 / A Mókusch meséje
    sub_page("a-mokusch-meseje",
             "Hogyan lett egy budai utcában erdei kuckó? Ez a lap a Mókusch születéséről szól – ahogy a három alapító elmeséli.",
             f'''<section class="sec"><div class="wrap">
  <div class="prose" data-rv><p class="dropcap">Az erdő mélyén, ahol a lombok között átszűrődik a napfény, egy apró hely várja azokat, akik szeretnének egy pillanatra megállni. Kézzel készített sütemények, illatos kávék és mesebeli pillanatok egy természetközeli kuckóban.</p></div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>A mese fejezetei</h2><span class="tag tag--minta">Tervezett szerkezet</span></div>
  <div class="cards cards--3">
    <article class="card card--tint" data-rv><span class="tag">Első lap</span><h3>Az első ötlet</h3><p>Honnan jött a név, és ki mondta ki először, hogy „legyen egy mókusos kávézó”?</p></article>
    <article class="card card--tint" data-rv><span class="tag">Második lap</span><h3>A hely</h3><p>Hogyan lett a Várfok utcai helyiségből kuckó – kéz alatt készült dekorációk, első bútorok, első sütés.</p></article>
    <article class="card card--tint" data-rv><span class="tag">Harmadik lap</span><h3>Ma</h3><p>Milyen egy nap most a Mókuschban, és mi az, ami azóta sem változott.</p></article>
  </div>
  <div class="btns" data-rv>{btn("../almok-vagyak-tervek/", "Álmok, vágyak, tervek")}{btn("../valogatott-tarsasag/", "Akik írják a mesét", "btn--ghost")}</div>
</div></section>''')

    # 1 / Álmok, vágyak, tervek
    sub_page("almok-vagyak-tervek",
             "Amiről álmodunk, amit szeretnénk, és amin már dolgozunk. Egy lap, ami időről időre újraíródik.",
             f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Három lépcső</h2><span class="tag tag--minta">Tartalom ügyféltől</span></div>
  <ol class="timeline">
    <li data-rv><h3>Álmok</h3><p>Nagy, messzi ötletek – ami egyszer talán megvalósul.</p><p class="note"><b>Ügyféltől:</b> 1–3 álom, néhány mondatban.</p></li>
    <li data-rv><h3>Vágyak</h3><p>Amit szeretnénk a következő hónapokban: új ízek, új programok, új sarkok.</p><p class="note"><b>Ügyféltől:</b> aktuális vágyak listája.</p></li>
    <li data-rv><h3>Tervek</h3><p>Amin már most dolgozunk – dátummal, ha van.</p><p class="note"><b>Ügyféltől:</b> folyamatban lévő tervek.</p></li>
  </ol>
  <div class="btns" data-rv>{btn("../mesebeli-programok/", "Mesebeli programok")}{btn("../uzenek/?targy=otlet", "Van egy ötletem", "btn--ghost")}</div>
</div></section>''')

    # 1 / Mesebeli programok
    ev = lambda d, m, t, s: f'''<li data-rv><div class="date"><b>{d}</b><span>{m}</span></div><div><h3>{t}</h3><p>{s}</p></div><a class="btn btn--ghost" href="../uzenek/?targy=program">Érdeklődöm {ARROW}</a></li>'''
    sub_page("mesebeli-programok",
             "Délutánok, műhelyek és mesés alkalmak – ami épp készül a Mókuschban.",
             f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Közelgő programok</h2><span class="tag tag--minta">Minta</span></div>
  <ul class="events">
    {ev("––", "dátum", "Minta: meseolvasó délután", "Program leírása, időpont, létszám és jelentkezés módja – a tulajdonosok töltik ki.")}
    {ev("––", "dátum", "Minta: kézműves műhely", "A programok listáját a Mókusch frissíti; a terv csak az elrendezést mutatja.")}
    {ev("––", "dátum", "Minta: erdei teadélután", "Ha nincs aktuális program, itt egy barátságos „hamarosan” üzenet áll.")}
  </ul>
  <p class="note" data-rv><b>Megjegyzés:</b> a programnevek mintaként szerepelnek, valódi eseményt nem jelentenek. A jelentkezés jelenleg üzenetben történik.</p>
</div></section>''')

    # 2 / Válogatott társaság
    person = lambda n, r, c: f'''<article class="card" data-rv>{slot("Portré: " + n, c, (4, 5))}<h3>{n}</h3><p>{r}</p><p class="note" style="margin:0"><b>Ügyféltől:</b> bemutatkozás pár mondatban – mit szeret a Mókuschban, mit csinál a legszívesebben.</p></article>'''
    sub_page("valogatott-tarsasag",
             "A Mókusch három alapítója és a csapat – akik minden nap életre keltik a mesét.",
             f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>A három Mókusch-lány</h2><span class="tag">Portrék: valódi fotóból</span></div>
  <div class="cards cards--3">{person("Wanda", "alapító", "P-01")}{person("Név egyeztetendő", "alapító", "P-02")}{person("Név egyeztetendő", "alapító", "P-03")}</div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>A csapat</h2><span class="tag tag--minta">Tartalom ügyféltől</span></div>
  <div class="cards cards--3">
    <article class="card card--tint" data-rv><h3>Munkatársak</h3><p>Név, szerep és egy kedvenc a pultból – fotóval, ha a munkatárs hozzájárul.</p></article>
    <article class="card card--tint" data-rv><h3>Barátok és alkotók</h3><p>Akikkel együtt készülnek a kézműves dolgok, könyvek, programok.</p></article>
    <article class="card card--tint" data-rv><h3>Csatlakoznál?</h3><p>Ha a Mókusch épp keres valakit, itt jelenik meg.</p><div class="meta"><a href="../uzenek/?targy=csapat">Írj nekünk →</a></div></article>
  </div>
</div></section>''', hero_img="udvar")

    # 3 / Képek
    g = []
    items = [("ill", "bolt", "hely"), ("slot", "Kávéfőzés a pult mögött", "kave", "K-01"), ("ill", "pult1", "kave"),
             ("slot", "Sütés a műhelyben", "sutes", "K-02"), ("slot", "Tortadíszítés közben", "torta", "K-03"),
             ("ill", "konyha", "sutes"), ("slot", "Kézműves alkotás", "kezmuves", "K-04"), ("ill", "udvar", "hely"),
             ("slot", "Kész torta a pulton", "torta", "K-05"), ("ill", "polc2", "kezmuves"), ("slot", "Reggeli fény a teremben", "hely", "K-06")]
    for it in items:
        if it[0] == "ill":
            g.append(f'<div data-cat="{it[2]}" data-rv>{plate(it[1], (4, 5), sizes="(max-width: 899px) 46vw, 360px")}</div>')
        else:
            ratio = (4, 5)
            g.append(f'<div data-cat="{it[2]}" data-rv>{slot(it[1], it[3], ratio)}</div>')
    chips = "".join(f'<button class="chip" type="button" data-filter="{k}" aria-pressed="{"true" if k == "mind" else "false"}">{v}</button>'
                    for k, v in [("mind", "Mind"), ("kave", "Kávé"), ("sutes", "Sütés"), ("torta", "Torták"), ("kezmuves", "Kézművesség"), ("hely", "A hely")])
    sub_page("kepek",
             "Kávé, sütés, tortadíszítés, kézművesség – a Mókusch hétköznapjai képekben. Az albumot témák szerint lapozhatod.",
             f'''<section class="sec"><div class="wrap">
  <div class="filters" role="group" aria-label="Képek szűrése téma szerint">{chips}</div>
  <div class="gallery" data-gallery>{"".join(g)}</div>
  <p class="note"><b>Képcsere:</b> a „valódi fotó helye” kockák a Mókusch saját fotóival töltendők fel; az illusztrációk egyértelműen jelölve maradnak.</p>
</div></section>''', plain=True)

    # 3 / Sztorik
    story = lambda t, s, c: f'''<article class="card" data-rv>{slot(t, c, (4, 3))}<span class="tag tag--minta">Minta</span><h3>{t}</h3><p>{s}</p></article>'''
    sub_page("sztorik",
             "Rövid történetek a pult mögül és a műhelyből – amiket képek nélkül is jó elmesélni.",
             f'''<section class="sec"><div class="wrap">
  <div class="cards cards--3">
    {story("Egy történet címe", "Két-három mondatos bevezető, ami kedvet ad a továbbolvasáshoz.", "S-01")}
    {story("Egy másik történet", "A sztorik bővíthető listában jelennek meg, a legfrissebb elöl.", "S-02")}
    {story("Harmadik történet", "Címke szerint is szűrhetők: sütés, vendégek, kézművesség, évszakok.", "S-03")}
  </div>
</div></section>''')

    # 4 / Enni, Inni
    grp = lambda t, n: f'<div class="menu-group" data-rv><h3>{t}<span class="tag tag--minta">Minta</span></h3><ul>{ph_lines(n)}</ul></div>'
    sub_page("enni",
             "Sütemények, reggelik és apró finomságok. A pontos kínálatot és az árakat a Mókusch adja meg – itt az étlap formája látszik.",
             f'''<section class="sec"><div class="wrap">
  <div class="menu-list">{grp("Reggelik", 3)}{grp("Sütemények", 4)}{grp("Kutyafülék és apróságok", 3)}{grp("Sós finomságok", 3)}</div>
</div></section>''', hero_img="pult2")
    sub_page("inni",
             "Kávék, teák és más italok. A pontos itallapot a Mókusch adja meg – itt az elrendezés látszik.",
             f'''<section class="sec"><div class="wrap">
  <div class="menu-list">{grp("Kávék", 4)}{grp("Teák és meleg italok", 3)}{grp("Hideg italok", 3)}{grp("Ami épp szezonban van", 2)}</div>
</div></section>''', hero_img="pult1")

    # 5 / Receptek, tippek
    sub_page("nehany-artatlan-recept",
             "Receptek a boszorkánykonyhából – egyszerű lépésekben, hogy otthon is sikerüljön.",
             f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Így néz ki egy recept</h2><span class="tag tag--minta">Minta-szerkezet</span></div>
  <div class="recipe">
    <div data-rv>{slot("A recept fotója", "R-01", (4, 5))}</div>
    <div class="recipe-card" data-rv>
      <p class="kicker">Recept címe</p>
      <h3>Hozzávalók</h3>
      <ul><li class="muted it">hozzávaló és mennyiség</li><li class="muted it">hozzávaló és mennyiség</li><li class="muted it">hozzávaló és mennyiség</li></ul>
      <h3 style="margin-top:1.2em">Elkészítés</h3>
      <ol><li class="muted it">első lépés</li><li class="muted it">második lépés</li><li class="muted it">harmadik lépés</li></ol>
      <p class="note"><b>Tipp a műhelyből:</b> egy mondat, amit csak az tud, aki már százszor megsütötte.</p>
    </div>
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Recepttár</h2><span class="tag tag--minta">Bővíthető</span></div>
  <div class="cards cards--3">
    <article class="card card--tint" data-rv><span class="tag">Sütemény</span><h3>Recept helye</h3><p>Rövid leírás és elkészítési idő.</p></article>
    <article class="card card--tint" data-rv><span class="tag">Ital</span><h3>Recept helye</h3><p>Rövid leírás és elkészítési idő.</p></article>
    <article class="card card--tint" data-rv><span class="tag">Kamra</span><h3>Recept helye</h3><p>Rövid leírás és elkészítési idő.</p></article>
  </div>
</div></section>''')
    tip = lambda n, t, s: f'''<article class="card" data-rv><span class="it" style="color:var(--berry);font-size:1.4rem">{n}</span><h3>{t}</h3><p>{s}</p><div class="meta"><span class="tag tag--minta">Minta</span></div></article>'''
    sub_page("tippek-trukkok",
             "Praktikák sütéshez, díszítéshez és kézműveskedéshez – röviden, kipróbálva.",
             f'''<section class="sec"><div class="wrap">
  <div class="cards cards--3">
    {tip("01", "Sütés", "Egy tipp címe és két-három mondatos magyarázata.")}
    {tip("02", "Tortadíszítés", "Egy tipp címe és két-három mondatos magyarázata.")}
    {tip("03", "Kávé otthon", "Egy tipp címe és két-három mondatos magyarázata.")}
    {tip("04", "Kézműveskedés", "Egy tipp címe és két-három mondatos magyarázata.")}
    {tip("05", "Kamra", "Egy tipp címe és két-három mondatos magyarázata.")}
    {tip("06", "Teríték", "Egy tipp címe és két-három mondatos magyarázata.")}
  </div>
</div></section>''', hero_img="konyha")

    # 6 / Nyuszis polc
    prod = lambda c: f'''<article class="card" data-rv>{slot("Termékfotó", c, (1, 1))}<h3 class="muted it" style="font-weight:400">Darab neve</h3><p>Ki készítette, miből, és miért pont a polcra került.</p></article>'''
    sub_page("nyuszis-polc",
             "Minden, ami egy erdei teadélutánhoz kellhet. A polc darabjai a Mókusch saját világából valók.",
             f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>A polc darabjai</h2><span class="tag tag--minta">Fotók ügyféltől</span></div>
  <div class="cards cards--3">{prod("N-01")}{prod("N-02")}{prod("N-03")}{prod("N-04")}{prod("N-05")}{prod("N-06")}</div>
  <p class="note" data-rv><b>Vásárlás:</b> a terv nem feltételez webshopot. Hogy a darabok megvásárolhatók-e, és hogyan, a tulajdonosok döntik el.</p>
  <div class="btns" data-rv>{btn("../uzenek/?targy=nyuszis-polc", "Kérdezek egy darabról")}</div>
</div></section>''', h1="…és ezt is <em>mind ti csináltátok?</em>")

    # 7 / Könyvek, csecsebecsék
    spines = "".join(f'<span class="book" style="--w:{w}px;--h:{h}px;--c:{c}"></span>' for w, h, c in
                     [(26, 160, "#7a3f49"), (32, 176, "#a6b19a"), (22, 150, "#c9afa0"), (36, 184, "#5b4130"), (24, 166, "#817e56"),
                      (30, 172, "#4a3527"), (20, 148, "#e6d6cb"), (34, 180, "#793f49"), (26, 158, "#a6b19a"), (28, 170, "#5b4130"),
                      (22, 152, "#c9afa0"), (32, 178, "#64613f"), (24, 160, "#7a3f49"), (30, 168, "#4a3527")])
    bk = lambda c: f'''<article class="card" data-rv>{slot("Borítófotó", c, (2, 3))}<h3 class="muted it" style="font-weight:400">Könyv címe</h3><p>Szerző · és egy mondat arról, miért szeretjük.</p></article>'''
    sub_page("konyvek",
             "Gondosan válogatott, varázslatos-mesés könyvek – amiket a Mókuschban is fellapozhatsz.",
             f'''<section class="sec"><div class="wrap">
  <div data-rv aria-hidden="true"><div class="spines">{spines}</div><div class="spines-plank"></div></div>
  <div class="sec__head"><h2 data-rv>A polcról</h2><span class="tag tag--minta">Könyvlista ügyféltől</span></div>
  <div class="cards cards--3">{bk("B-01")}{bk("B-02")}{bk("B-03")}</div>
  <p class="note" data-rv><b>Vásárlás:</b> online rendelés nincs a tervben; ha a tulajdonosok szeretnék, külön lépésben építhető.</p>
</div></section>''')
    sub_page("csodas-csecsebecsek",
             "Apró, különleges tárgyak a Mókusch polcairól – amelyek egy délután emlékét viszik haza.",
             f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Csecsebecsék</h2><span class="tag tag--minta">Fotók ügyféltől</span></div>
  <div class="cards cards--3">{prod("C-01")}{prod("C-02")}{prod("C-03")}</div>
  <p class="note" data-rv><b>Vásárlás:</b> a terv nem feltételez webshopot; a tárgyak megjelenítése bemutató jellegű.</p>
</div></section>''', hero_img="polc2")

    # 8 / Üzenek
    sub_page("uzenek",
             "Kérdés, ötlet, köszönet – vagy csak egy kedves szó. Írj nekünk, és válaszolunk.",
             f'''<section class="sec"><div class="wrap">
  <div class="grid-2">
    <div>
      <form class="form" data-demo-form novalidate>
        {DEMO.format(what="üzenetküldés")}
        <div class="f-row f-row--2">
          <div class="field"><label for="u-nev">Név</label><input class="input" id="u-nev" name="nev" autocomplete="name" required><p class="err" id="u-nev-e">Kérjük, add meg a neved.</p></div>
          <div class="field"><label for="u-mail">E-mail</label><input class="input" id="u-mail" name="email" type="email" autocomplete="email" required><p class="err" id="u-mail-e">Érvényes e-mail címet adj meg.</p></div>
        </div>
        <div class="field"><label for="u-targy">Miről írsz?</label>
          <select class="select" id="u-targy" name="targy">
            <option value="kerdes">Kérdés</option><option value="otlet">Ötlet</option><option value="program">Mesebeli program</option>
            <option value="nyuszis-polc">A nyuszis polc</option><option value="csapat">Csatlakoznék a csapathoz</option><option value="egyeb">Egyéb</option>
          </select></div>
        <div class="field"><label for="u-uzi">Üzenet</label><textarea class="textarea" id="u-uzi" name="uzenet" required></textarea><p class="err" id="u-uzi-e">Írj pár szót, kérjük.</p></div>
        <label class="check"><input type="checkbox" name="hozzajarulas" required> <span>Hozzájárulok, hogy a Mókusch a megadott elérhetőségen válaszoljon.</span></label>
        <p class="err" data-consent-err>A küldéshez szükség van a hozzájárulásra.</p>
        <div><button class="btn" type="submit">Üzenet elküldése {ARROW}</button></div>
      </form>
      <div class="done" role="status" tabindex="-1"><h2>Köszönjük!</h2><p>Ez egy látványterv, ezért az üzenet nem ment el. Az éles oldalon itt kapnál visszaigazolást.</p><p><a href="../">Vissza a főoldalra</a></p></div>
    </div>
    <aside data-rv>
      <div class="card card--tint"><h3>Közvetlenül is elérsz</h3><p>Ezek valódi elérhetőségek:</p><p><a href="mailto:{EMAIL}">{EMAIL}</a><br><a href="{PHONE_HREF}">{PHONE}</a></p><p class="muted">{ADDR}</p></div>
    </aside>
  </div>
</div></section>''', plain=True)

    # 8 / Asztalfoglalás
    sub_page("asztalfoglalas",
             "Válassz napot, időpontot és létszámot. A foglalást a Mókusch visszaigazolja – addig nem végleges.",
             f'''<section class="sec"><div class="wrap">
  <div class="grid-2">
    <div>
      <form class="form panel" data-demo-form data-booking novalidate>
        {DEMO.format(what="asztalfoglalás")}
        <div class="f-row f-row--3">
          <div class="field"><label for="a-nap">Nap</label><input class="input" id="a-nap" name="nap" type="date" required><p class="err" id="a-nap-e">Válassz egy mai vagy későbbi napot.</p></div>
          <div class="field"><label for="a-ido">Időpont</label><select class="select" id="a-ido" name="ido" required><option value="">Előbb válassz napot</option></select><p class="err" id="a-ido-e">Válassz időpontot.</p></div>
          <div class="field"><label for="a-fo">Létszám</label><select class="select" id="a-fo" name="letszam">{"".join(f'<option>{i} fő</option>' for i in range(1, 9))}<option>9 fő vagy több</option></select></div>
        </div>
        <p class="hint">Az időpontok a Wix-oldalon szereplő nyitvatartásból számolódnak; a foglalható sávok ügyféllel egyeztetendők.</p>
        <div class="f-row f-row--2">
          <div class="field"><label for="a-nev">Név</label><input class="input" id="a-nev" name="nev" autocomplete="name" required><p class="err" id="a-nev-e">Kérjük, add meg a neved.</p></div>
          <div class="field"><label for="a-tel">Telefonszám</label><input class="input" id="a-tel" name="tel" type="tel" autocomplete="tel" inputmode="tel" required><p class="err" id="a-tel-e">Adj meg egy telefonszámot.</p></div>
        </div>
        <div class="field"><label for="a-megj">Megjegyzés <span class="opt">(nem kötelező)</span></label><textarea class="textarea" id="a-megj" name="megjegyzes" style="min-height:96px"></textarea></div>
        <label class="check"><input type="checkbox" name="hozzajarulas" required> <span>Hozzájárulok, hogy a Mókusch a foglalással kapcsolatban felhívjon.</span></label>
        <p class="err" data-consent-err>A küldéshez szükség van a hozzájárulásra.</p>
        <div><button class="btn" type="submit">Foglalási kérés küldése {ARROW}</button></div>
      </form>
      <div class="done" role="status" tabindex="-1"><h2>Köszönjük!</h2><p>Ez egy látványterv, így a foglalás nem ment el. Az éles oldalon a Mókusch visszaigazolná – addig a foglalás nem végleges.</p><p><a href="../">Vissza a főoldalra</a></p></div>
    </div>
    <aside data-rv>
      <div class="card card--tint"><h3>Most még telefonon</h3><p>Asztalt jelenleg telefonon tudsz foglalni:</p><p><a class="btn" href="{PHONE_HREF}">{PHONE}</a></p><h3 style="margin-top:1em">Nyitvatartás</h3>{HOURS}</div>
    </aside>
  </div>
</div></section>''', plain=True)

    # 8 / Üzenetek
    sub_page("uzenetek",
             "Levelek, rajzok és üzenetek – a Mókusch falára tűzve, ahogy a kávézóban is.",
             f'''<section class="sec"><div class="wrap">
  <div class="notes" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
    <div class="pin pin--main" data-rv><b>Hogy kerül ide üzenet?</b><span>A vendégek leveleiből a Mókusch válogat, és engedéllyel teszi ki őket.</span><i>Moderált fal</i></div>
    <div class="pin" data-rv><b class="muted it" style="font-weight:400">Üzenet helye</b><span>Valódi vendégüzenet – aláírással vagy anélkül.</span><i>Minta</i></div>
    <div class="pin" data-rv><b class="muted it" style="font-weight:400">Üzenet helye</b><span>Rajz vagy kézzel írt cetli fotója is lehet.</span><i>Minta</i></div>
    <div class="pin" data-rv><b class="muted it" style="font-weight:400">Üzenet helye</b><span>Kitalált vélemény nem kerül ki.</span><i>Minta</i></div>
  </div>
  <div class="btns" data-rv>{btn("../uzenek/", "Én is üzenek!")}</div>
</div></section>''', hero_img="posta")

    # 8 / Mókásságok
    fun = lambda t, s: f'''<article class="card card--tint" data-rv><span class="tag tag--minta">Ötlet</span><h3>{t}</h3><p>{s}</p></article>'''
    sub_page("mokassagok",
             "Apró vidámságok a Mókusch világából – amiért érdemes néha visszanézni.",
             f'''<section class="sec"><div class="wrap">
  <div class="cards cards--3">
    {fun("Mókás pillanatok", "Vicces fotók és jelenetek a pultból – a Mókusch saját képeivel.")}
    {fun("Letölthető apróságok", "Például színező vagy könyvjelző, ha a tulajdonosok készítenek ilyet.")}
    {fun("Évszakos meglepetés", "Ami épp aktuális – ünnep, évszakváltás, kis játék.")}
  </div>
</div></section>''', hero_img="polc1")

    # 9 / Esküvő
    styles = lambda t, s: f'<article class="card" data-rv><h3>{t}</h3><p>{s}</p><div class="meta"><span class="tag tag--minta">Minta</span></div></article>'
    wed_js = ''
    sub_page("eskuvo",
             "Esküvői torták a Mókusch tortaműhelytől. Végleges árlista helyett egyedi ajánlat – a nagy napotokhoz igazítva.",
             f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Korábbi alkotások</h2><span class="tag">Valódi fotók ügyféltől</span></div>
  <div class="gallery">
    <div data-rv>{slot("Esküvői torta", "E-01", (4, 5), tint=ROSE_TINT)}</div>
    <div data-rv>{slot("Részlet közelről", "E-02", (4, 5), tint=ROSE_TINT)}</div>
    <div data-rv>{slot("Torta a helyszínen", "E-03", (4, 5), tint=ROSE_TINT)}</div>
    <div data-rv>{slot("Díszítés készül", "E-04", (4, 5), tint=ROSE_TINT)}</div>
    <div data-rv>{slot("Emeletes torta", "E-05", (4, 5), tint=ROSE_TINT)}</div>
    <div data-rv>{slot("Virágos részlet", "E-06", (4, 5), tint=ROSE_TINT)}</div>
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Díszítési stílusok</h2><span class="tag tag--minta">Egyeztetendő</span></div>
  <div class="cards cards--3">
    {styles("Természetes, virágos", "Friss vagy szárított virágokkal, levelekkel – a helyszín hangulatához.")}
    {styles("Letisztult, fehér", "Egyszerű vonalak, finom textúra, kevés dísz.")}
    {styles("Erdei, mesés", "Termések, ágak, a Mókusch saját világa.")}
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="grid-2">
    <div>
      <div class="sec__head"><h2 data-rv>Esküvői ajánlatkérés</h2></div>
      <form class="form panel" data-demo-form novalidate>
        {DEMO.format(what="ajánlatkérés")}
        <div class="f-row f-row--2">
          <div class="field"><label for="e-nap">Az esküvő napja</label><input class="input" id="e-nap" name="datum" type="date" required><p class="err" id="e-nap-e">Adj meg egy jövőbeli dátumot.</p></div>
          <div class="field"><label for="e-fo">Vendégszám (kb.)</label><input class="input" id="e-fo" name="vendeg" type="number" min="1" max="1000" inputmode="numeric" required><p class="err" id="e-fo-e">Add meg a vendégek számát.</p></div>
        </div>
        <div class="field"><label for="e-hely">Helyszín <span class="opt">(nem kötelező)</span></label><input class="input" id="e-hely" name="helyszin"></div>
        <fieldset class="field"><legend>Stílus <span class="opt">(többet is választhatsz)</span></legend>
          <div class="choices">
            <label class="choice"><input type="checkbox" name="stilus" value="Természetes, virágos"><span>Természetes, virágos</span></label>
            <label class="choice"><input type="checkbox" name="stilus" value="Letisztult, fehér"><span>Letisztult, fehér</span></label>
            <label class="choice"><input type="checkbox" name="stilus" value="Erdei, mesés"><span>Erdei, mesés</span></label>
            <label class="choice"><input type="checkbox" name="stilus" value="Még nem tudjuk"><span>Még nem tudjuk</span></label>
          </div></fieldset>
        <div class="field"><span class="lbl">Referenciaképek <span class="opt">(max. 3)</span></span>
          <label class="drop" data-drop><input type="file" accept="image/*" multiple data-files="3" aria-label="Referenciaképek kiválasztása"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 15v4h16v-4"/></svg><b>Húzd ide a képeket, vagy kattints</b><span class="hint">A képek csak itt, a böngésződben jelennek meg – nem töltődnek fel.</span></label>
          <ul class="thumbs" data-thumbs></ul><p class="err" data-file-err></p></div>
        <div class="field"><label for="e-kul">Különleges kérések</label><textarea class="textarea" id="e-kul" name="kulonleges" placeholder="Ízek, allergiák, színek, a nap története – bármi, ami fontos."></textarea></div>
        <div class="f-row f-row--2">
          <div class="field"><label for="e-nev">Név</label><input class="input" id="e-nev" name="nev" autocomplete="name" required><p class="err" id="e-nev-e">Kérjük, add meg a neved.</p></div>
          <div class="field"><label for="e-mail">E-mail</label><input class="input" id="e-mail" name="email" type="email" autocomplete="email" required><p class="err" id="e-mail-e">Érvényes e-mail címet adj meg.</p></div>
        </div>
        <label class="check"><input type="checkbox" name="hozzajarulas" required> <span>Hozzájárulok, hogy a Mókusch az ajánlatkéréssel kapcsolatban megkeressen.</span></label>
        <p class="err" data-consent-err>A küldéshez szükség van a hozzájárulásra.</p>
        <div><button class="btn btn--berry" type="submit">Ajánlatot kérünk {ARROW}</button></div>
      </form>
      <div class="done" role="status" tabindex="-1"><h2>Köszönjük!</h2><p>Ez egy látványterv, így az ajánlatkérés nem ment el. Az éles oldalon a műhely egyedi ajánlattal válaszolna – az ajánlatkérés nem jelent visszaigazolt rendelést.</p></div>
    </div>
    <aside data-rv>
      <div class="card card--tint"><h3>Ár helyett ajánlat</h3><p>Minden esküvői torta más – méret, ízek, díszítés és szállítás szerint. Ezért nincs fix árlista: az ajánlatot a műhely állítja össze.</p><p style="margin-top:.8em"><a href="../tortarendeles/?alkalom=eskuvo">Inkább a lépésenkénti rendelőt használnám →</a></p></div>
    </aside>
  </div>
</div></section>''', h1="Esküvői <em>torták</em>", cta=False)

    # 9 / Tortarendelés
    build_wizard()


# =====================================================================
#   TORTARENDELŐ VARÁZSLÓ
# =====================================================================
def build_wizard():
    steps = ["Alkalom", "Dátum", "Méret", "Ízvilág", "Díszítés", "Referenciakép", "Elérhetőség", "Összegzés"]
    nav = "".join(f'<li><button type="button" data-goto="{i}"{" aria-current=\"step\"" if i == 0 else ""}{"" if i == 0 else " disabled"}><span class="n">{i+1}</span><span class="t">{t}</span></button></li>' for i, t in enumerate(steps))

    def ch(name, val, label, small="", kind="radio"):
        sm = f"<small>{small}</small>" if small else ""
        return f'<label class="choice"><input type="{kind}" name="{name}" value="{val}"><span>{label}{sm}</span></label>'

    def step(i, title, hint, inner):
        return f'''<section class="step{" is-on" if i == 0 else ""}" data-step="{i}" aria-labelledby="st-{i}" tabindex="-1">
  <p class="panel__count">{i+1} / 8 · {steps[i]}</p>
  <h2 id="st-{i}">{title}</h2>
  <p class="hint">{hint}</p>
  {inner}
</section>'''

    s0 = step(0, "Milyen alkalomra készül a torta?", "Válassz egyet – ha egyik sem illik, jelöld az „Egyéb alkalom” lehetőséget.",
              '<fieldset><legend class="sr-only">Alkalom</legend><div class="choices">' +
              ch("alkalom", "Születésnap", "Születésnap") + ch("alkalom", "Esküvő", "Esküvő") + ch("alkalom", "Keresztelő", "Keresztelő") +
              ch("alkalom", "Évforduló", "Évforduló") + ch("alkalom", "Céges alkalom", "Céges alkalom") + ch("alkalom", "Csak úgy", "Csak úgy, magunknak") +
              ch("alkalom", "Egyéb alkalom", "Egyéb alkalom") +
              '</div></fieldset><p class="err" data-err="alkalom">Válassz egy alkalmat a folytatáshoz.</p>')
    s1 = step(1, "Mikorra szeretnéd?", "Add meg a kért átvételi napot. A vállalható határidőt a műhely visszaigazolja – a kért dátum még nem foglalás.",
              '''<div class="f-row f-row--2">
  <div class="field"><label for="w-datum">Kért átvételi nap</label><input class="input" id="w-datum" name="datum" type="date" required aria-describedby="w-datum-h"><p class="hint" id="w-datum-h">A minimális előrendelési idő ügyféllel egyeztetendő; a terv csak a múltbeli dátumot zárja ki.</p></div>
  <div class="field"><label for="w-ido">Átvétel napszaka <span class="opt">(nem kötelező)</span></label><select class="select" id="w-ido" name="napszak"><option value="">Mindegy</option><option>Délelőtt</option><option>Délután</option></select></div>
</div>
<label class="check" style="margin-top:1rem"><input type="checkbox" name="rugalmas" value="igen"> <span>Rugalmas vagyok, pár nap eltérés belefér.</span></label>
<p class="err" data-err="datum">Adj meg egy mai vagy későbbi dátumot.</p>''')
    s2 = step(2, "Mekkora legyen?", "Elég egy becslés a vendégek számáról – a pontos méretet a műhely javasolja.",
              '<p><span class="tag tag--minta">Mintaopciók – a valódi méretkínálat egyeztetendő</span></p><fieldset><legend class="sr-only">Méret</legend><div class="choices">' +
              ch("meret", "kb. 6–10 szelet", "Kisebb", "kb. 6–10 szelet") + ch("meret", "kb. 12–16 szelet", "Közepes", "kb. 12–16 szelet") +
              ch("meret", "kb. 18–25 szelet", "Nagyobb", "kb. 18–25 szelet") + ch("meret", "Emeletes, 25 szelet felett", "Emeletes", "25 szelet felett") +
              ch("meret", "Nem tudom – javasoljatok", "Nem tudom", "javasoljatok") +
              '''</div></fieldset>
<div class="field" style="margin-top:1rem;max-width:260px"><label for="w-fo">Vendégek száma <span class="opt">(ha tudod)</span></label><input class="input" id="w-fo" name="vendeg" type="number" min="1" max="1000" inputmode="numeric"></div>
<p class="err" data-err="meret">Válassz egy méretet, vagy a „Nem tudom” lehetőséget.</p>''')
    s3 = step(3, "Milyen ízvilágot szeretnél?", "Többet is jelölhetsz. A párosításokat a műhely javasolja.",
              '<p><span class="tag tag--minta">Minta-ízek – a valódi kínálat egyeztetendő</span></p><fieldset><legend class="sr-only">Ízvilág</legend><div class="choices">' +
              "".join(ch("iz", v, v, kind="checkbox") for v in ["Csokoládés", "Vaníliás-krémes", "Gyümölcsös", "Diós, mogyorós", "Citrusos", "Karamelles"]) +
              ch("iz", "Meglepetés a műhelytől", "Meglepetés", "a műhely választ", kind="checkbox") +
              '''</div></fieldset>
<div class="field" style="margin-top:1rem"><label for="w-allerg">Allergia, étrend <span class="opt">(nem kötelező)</span></label><input class="input" id="w-allerg" name="allergia" placeholder="pl. dióallergia, laktózmentes kérés"></div>
<p class="err" data-err="iz">Jelölj meg legalább egy ízvilágot.</p>''')
    s4 = step(4, "Meséld el az elképzelésed", "Színek, hangulat, felirat, figurák – és az is, amit szeretnél elkerülni.",
              '<fieldset><legend class="lbl" style="margin-bottom:.6em">Stílus <span class="opt">(nem kötelező)</span></legend><div class="choices">' +
              "".join(ch("stilus", v, v) for v in ["Természetes, virágos", "Letisztult", "Erdei, mesés", "Játékos", "Még nem tudom"]) +
              '''</div></fieldset>
<div class="field" style="margin-top:1rem"><label for="w-leiras">Elképzelés</label><textarea class="textarea" id="w-leiras" name="leiras" maxlength="800" required aria-describedby="w-leiras-c"></textarea><p class="hint" id="w-leiras-c"><span data-count>0</span> / 800 karakter</p></div>
<div class="field" style="margin-top:.6rem"><label for="w-felirat">Felirat a tortán <span class="opt">(nem kötelező)</span></label><input class="input" id="w-felirat" name="felirat" maxlength="60"></div>
<p class="err" data-err="leiras">Írj legalább pár szót az elképzelésedről.</p>''')
    s5 = step(5, "Van referenciaképed?", "Ha láttál egy tortát, ami tetszett, csatold. Ez a lépés kihagyható.",
              '''<label class="drop" data-drop><input type="file" accept="image/*" multiple data-files="3" aria-label="Referenciaképek kiválasztása, legfeljebb 3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 15v4h16v-4"/></svg><b>Húzd ide a képeket, vagy kattints</b><span class="hint">Legfeljebb 3 kép, egyenként max. 8 MB</span></label>
<ul class="thumbs" data-thumbs></ul><p class="err" data-file-err></p>
<p class="note"><b>Látványterv:</b> a képek csak a böngésződben jelennek meg, nem töltődnek fel, és oldalfrissítéskor eltűnnek. A valódi feltöltés tárhelyet és adatkezelést igényel – külön fejlesztési lépés.</p>''')
    s6 = step(6, "Hogyan érünk el?", "Az ajánlatot ide küldjük. A *-gal jelölt mezők kötelezők.",
              '''<div class="f-row f-row--2">
  <div class="field"><label for="w-nev">Név *</label><input class="input" id="w-nev" name="nev" autocomplete="name" required></div>
  <div class="field"><label for="w-mail">E-mail *</label><input class="input" id="w-mail" name="email" type="email" autocomplete="email" required></div>
</div>
<div class="f-row f-row--2" style="margin-top:1rem">
  <div class="field"><label for="w-tel">Telefonszám <span class="opt">(nem kötelező)</span></label><input class="input" id="w-tel" name="tel" type="tel" autocomplete="tel" inputmode="tel"></div>
  <div class="field"><label for="w-atvetel">Átvétel</label><select class="select" id="w-atvetel" name="atvetel"><option>Személyesen, a Várfok utcában</option><option>Egyeztetnék a lehetőségekről</option></select></div>
</div>
<label class="check" style="margin-top:1.2rem"><input type="checkbox" name="hozzajarulas" value="igen"> <span>Hozzájárulok, hogy a Mókusch az ajánlatkéréssel kapcsolatban megkeressen. Az adataimat csak erre használja.</span></label>
<p class="err" data-err="kapcsolat">Add meg a neved, egy érvényes e-mail címet, és pipáld be a hozzájárulást.</p>''')
    s7 = step(7, "Nézd át, és küldd el", "Bármelyik sort javíthatod a „Módosítás” gombbal – a többi adat megmarad.",
              '''<dl class="summary" data-summary></dl>
<label class="check" style="margin-top:1.2rem"><input type="checkbox" name="ellenorizve" value="igen"> <span>Átnéztem az adatokat. Tudom, hogy ez ajánlatkérés, nem végleges rendelés.</span></label>
<p class="err" data-err="ellenorizve">A küldés előtt pipáld be az ellenőrzést.</p>''')

    body = f'''<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="wiz" data-wizard>
    <div>
      <ol class="steps" aria-label="A rendelés lépései">{nav}</ol>
      <div class="progress" aria-hidden="true"><i></i></div>
      <p class="wiz-aside">A megadott adatok lépésről lépésre megmaradnak (a böngésző munkamenetében). Képek nélkül, frissítés után is.</p>
    </div>
    <div>
      <form class="panel" id="torta" novalidate aria-live="off">
        {DEMO.format(what="ajánlatkérés")}
        <div style="height:1.4rem"></div>
        {s0}{s1}{s2}{s3}{s4}{s5}{s6}{s7}
        <div class="wiz-nav">
          <button class="btn btn--ghost" type="button" data-prev hidden>← Vissza</button>
          <span class="save" data-saved aria-live="polite"></span>
          <button class="btn" type="button" data-next>Tovább {ARROW}</button>
          <button class="btn btn--berry" type="submit" data-submit hidden>Ajánlatkérés elküldése {ARROW}</button>
        </div>
      </form>
      <div class="done" role="status" tabindex="-1" data-done>
        <h2>Megkaptuk az elképzelésed – <em>a látványtervben</em></h2>
        <p>Ez egy bemutató, így semmi nem ment el. Az éles oldalon itt visszaigazoló e-mail menne, és a műhely ajánlattal jelentkezne. Az ajánlatkérés nem jelent visszaigazolt rendelést.</p>
        <p><button class="btn btn--ghost" type="button" data-restart>Új ajánlatkérés</button> <a class="btn" href="../">Vissza a főoldalra</a></p>
      </div>
    </div>
  </div>
</div></section>'''
    sub_page("tortarendeles",
             "Nyolc rövid lépés, és a műhely pontosan tudja, mit szeretnél. Ez ajánlatkérés: a végleges rendelést a Mókusch visszaigazolja.",
             body, plain=True, h1="Tortarendelés <em>nyolc lépésben</em>", cta=False)


# =====================================================================
#   ARCULAT – logó és rendszer
# =====================================================================
def build_arculat():
    L = "../img/logo/"
    sw = lambda n, v, use: f'<div class="sw" data-rv><i style="--c:{v}"></i><div><b>{n}</b><span>{v} · {use}</span></div></div>'
    body = f'''<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>A logó</h2><span class="tag">Javaslat – jóváhagyásra</span></div>
  <div class="brandboard">
    <figure class="bb bb--wide" data-rv><img src="{L}mokusch-logo.svg" alt="Mókusch logó: makkot tartó mókus és a Mókusch felirat" width="420" height="112"><figcaption>Elsődleges, fekvő</figcaption></figure>
    <figure class="bb bb--half bb--forest" data-rv><img src="{L}mokusch-logo-vilagos.svg" alt="Mókusch logó világos változata sötét háttéren" width="420" height="112"><figcaption>Sötét háttérre</figcaption></figure>
    <figure class="bb bb--half bb--rose" data-rv><img src="{L}mokusch-logo-allo.svg" alt="Mókusch álló logó" width="260" height="256" style="max-height:200px"><figcaption>Álló</figcaption></figure>
    <figure class="bb bb--third" data-rv><img src="{L}mokusch-pecset.svg" alt="Mókusch kerek pecsét: kávézó és tortaműhely, Budapest, Várfok utca" width="320" height="320" style="max-height:190px"><figcaption>Pecsét – dobozra, matricára</figcaption></figure>
    <figure class="bb bb--third bb--moss" data-rv><img src="{L}mokusch-jel-vilagos.svg" alt="A mókus jel önmagában" width="120" height="120" style="max-height:130px"><figcaption>Jel önmagában</figcaption></figure>
    <figure class="bb bb--third" data-rv><img src="../img/favicon.svg" alt="Mókusch ikon olívazöld négyzetben" width="64" height="64" style="max-height:96px"><figcaption>Ikon, profilkép</figcaption></figure>
  </div>
  <div class="prose" style="margin-top:var(--s6)" data-rv>
    <p class="dropcap">A jel egy ülő mókus, a mancsában makkal – a Mókusch neve és a mesebeli, erdei világ egyetlen képben. A felirat elegáns, dőlt antikva – ugyanaz a Playfair, ami a weboldal címeiben is szerepel.</p>
    <p>A makk bordó pöttye az egyetlen színes részlet: kicsiben is felismerhető, és visszaköszön a weboldal tortarendelő gombjain.</p>
  </div>
  <div class="dl-list" data-rv>
    <a class="btn btn--ghost" href="{L}mokusch-logo.svg" download>Logó (SVG)</a>
    <a class="btn btn--ghost" href="{L}mokusch-logo-vilagos.svg" download>Világos logó (SVG)</a>
    <a class="btn btn--ghost" href="{L}mokusch-logo-allo.svg" download>Álló logó (SVG)</a>
    <a class="btn btn--ghost" href="{L}mokusch-pecset.svg" download>Pecsét (SVG)</a>
    <a class="btn btn--ghost" href="{L}mokusch-logo.png" download>Logó (PNG)</a>
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Színek</h2><span class="tag">A Wix-oldal színeiből</span></div>
  <div class="swatches">
    {sw("Papír", "#F6EFE4", "alap")}{sw("Moha", "#5F5C3C", "sávok")}{sw("Erdő", "#263A2D", "sötét felületek")}{sw("Bogyó", "#793F49", "tortarendelés, kiemelés")}
    {sw("Púder", "#C9AFA0", "díszítés")}{sw("Étcsoki", "#2E241C", "szöveg, logó")}{sw("Zsálya", "#A6B19A", "apró jelölések")}{sw("Sárgaréz", "#A68A5B", "hajszálvonalak")}
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="sec__head"><h2 data-rv>Betűk</h2></div>
  <div class="type-spec">
    <div class="card" data-rv><span class="tag">Címek · Playfair Display</span><p class="big">Hagyd magad mögött <em>a várost</em></p><p>Elegáns, jól olvasható antikva, dőlt kiemelésekkel.</p></div>
    <div class="card" data-rv><span class="tag">Szöveg · Manrope</span><p class="big big--sans">Kávék, sütik, kutyafülék</p><p>Modern, jól olvasható betű a szövegekhez, gombokhoz és űrlapokhoz.</p></div>
  </div>
  <p class="note" data-rv><b>Licenc:</b> mindkét betű szabad (SIL Open Font License), a logó feliratai görbékké alakítva – betűtelepítés nélkül is pontos.</p>
</div></section>'''
    sub_page("arculat", "Új logó a Mókuschnak: egy makkot tartó mókus, mesekönyv-betűs felirattal – hozzá színek és betűk, amelyek a Wix-oldal világából nőttek ki.",
             body, plain=True, h1="Arculat <em>és logó</em>", current="arculat")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "img").mkdir(exist_ok=True)
    index()
    build_subs()
    build_arculat()
    print("kész:", OUT)
