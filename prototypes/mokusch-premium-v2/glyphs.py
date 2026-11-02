from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import functools, math
import os
F=os.path.join(os.path.dirname(os.path.abspath(__file__)),'fonts')+'/'
@functools.lru_cache(None)
def font(name, wght):
    f=TTFont(F+name)
    if 'fvar' in f: f=instantiateVariableFont(f,{'wght':wght})
    return f
def text_path(s, name, wght, size, x=0, y=0, track=0, kern=None):
    f=font(name,wght); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
    sc=size/upm; pen=SVGPathPen(gs); cx=0
    for i,ch in enumerate(s):
        g=cmap[ord(ch)]
        tp=TransformPen(pen,(sc,0,0,-sc,x+cx,y)); gs[g].draw(tp)
        cx+=gs[g].width*sc+track+(kern.get(i,0) if kern else 0)
    return pen.getCommands(), cx-track
def circle_text(s, name, wght, size, cx, cy, r, start_deg, track=0):
    """glyphs placed along a circle, reading clockwise, baseline on circle radius r (text outside->inside)."""
    f=font(name,wght); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm; sc=size/upm
    pen=SVGPathPen(gs); ang=math.radians(start_deg)
    for ch in s:
        if ch==' ':
            w=gs[cmap[32]].width*sc
            ang+= (w+track)/r; continue
        g=cmap[ord(ch)]; w=gs[g].width*sc
        a=ang+(w/2)/r
        # position of glyph center on circle
        px=cx+r*math.sin(a); py=cy-r*math.cos(a)
        ca,sa=math.cos(a),math.sin(a)
        # glyph local: x from -w/2..w/2, y up negative; rotate by a
        tp=TransformPen(pen,(sc*ca, sc*sa, sc*sa*1, -sc*ca, 0,0))
        # build full affine: translate then rotate: [ca -sa; sa ca] * [sc*(gx - w/2/sc), -sc*gy]
        m=(sc*ca, sc*sa, sc*sa, -sc*ca, px - ca*(w/2), py - sa*(w/2))
        gs[g].draw(TransformPen(pen,m))
        ang+= (w+track)/r
    return pen.getCommands(), ang

def text_bounds(s, name, wght, size, x=0, y=0, track=0):
    from fontTools.pens.boundsPen import BoundsPen
    f=font(name,wght); gs=f.getGlyphSet(); cmap=f.getBestCmap(); sc=size/f['head'].unitsPerEm
    bp=BoundsPen(gs); cx=0
    for ch in s:
        g=cmap[ord(ch)]; gs[g].draw(TransformPen(bp,(sc,0,0,-sc,x+cx,y))); cx+=gs[g].width*sc+track
    return bp.bounds
