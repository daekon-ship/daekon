"""Mókusch V2 – mesekönyves főoldal (görgetéses út az erdőből a kávézóba).

A build.py importálja és csak a V2 kimenetre kapcsolja be (a V3/B-változat generátora a
build.py-t másik kimeneti mappával használja – arra ez a réteg nem kerül rá).
"""
import html

SB_VER = "10"
PALETTES = [("erdei", "Erdei", "#4E5A39", "#DCC6A6"),
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
#  A főoldal a story_index.py-ban: megérkezés (ösvény → udvar → bolt) + mesekönyv-fejezetek.
#  Az előző, 11 jelenetes teljes képernyős változat a mentes/mokusch-v2-eredeti ág utáni
#  git-történetben (és a 9a97a71 commitban) visszakereshető.
# ---------------------------------------------------------------------------------------------
from story_index import index, MESE  # noqa: E402,F401
