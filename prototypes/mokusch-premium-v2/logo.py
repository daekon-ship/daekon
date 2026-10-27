from glyphs import *
import math
INK='#2E241C'; PAPER='#F6EFE4'; BERRY='#793F49'; BARK='#4A3527'
# squirrel mark in 120x120 box (visual bounds ~ x22..105, y7..107)
TAIL="M58 106 C 78 108, 100 98, 104 74 C 107 56, 100 44, 102 30 C 104 16, 96 6, 84 7 C 72 8, 64 18, 68 28 C 71 35, 81 35, 82 27 C 82 33, 76 34, 74 30 C 72 24, 78 18, 85 19 C 92 21, 91 32, 87 43 C 82 57, 85 70, 79 84 C 75 93, 69 97, 62 99 Z"
BODY="M30 106 C 26 104, 27 99, 32 98 C 33 92, 33 86, 36 80 C 33 78, 31 76, 31 73 C 28 70, 30 66, 34 66 C 37 63, 40 60, 42 56 C 37 56, 30 55, 26 51 C 22 49, 22 45, 25 43 C 28 40, 30 37, 34 35 C 37 33, 41 32, 44 33 L 46 24 C 46.6 21.6, 48.4 21.6, 49 24 L 50.5 34 C 55 37, 57 43, 56 50 C 61 56, 66 64, 69 74 C 72 86, 70 98, 64 104 C 60 107, 48 107, 30 106 Z"
def mark(fg=INK, bg=PAPER, acorn=BERRY, cap=BARK, tx=0, ty=0, s=1.0):
    return (f'<g transform="translate({tx} {ty}) scale({s})">'
            f'<path d="{TAIL}" fill="{fg}"/><path d="{BODY}" fill="{fg}"/>'
            f'<circle cx="36" cy="42.5" r="1.9" fill="{bg}"/>'
            f'<path d="M48 82 C 52 90, 58 94, 62 96" fill="none" stroke="{bg}" stroke-width="1.4" stroke-linecap="round"/>'
            f'<g transform="translate(29 63)"><ellipse cx="4" cy="6" rx="4.4" ry="5" fill="{acorn}"/><path d="M-0.8 3.6 C -0.6 0, 8.6 0, 8.8 3.6 Z" fill="{cap}"/></g></g>')
WM=('playfair-italic-var.woff',500)
def wordmark(size, x, y, fill):
    d,w=text_path('Mókusch',*WM,size,x,y,track=size*0.005)
    return f'<path d="{d}" fill="{fill}"/>', w
def tagline(txt,size,x,y,fill,track):
    d,w=text_path(txt,'manrope-var.woff',600,size,x,y,track=track)
    return f'<path d="{d}" fill="{fill}"/>', w
def svg(w,h,body,bgc=None,title='Mókusch kávézó és tortaműhely – logó'):
    bg=f'<rect width="{w}" height="{h}" fill="{bgc}"/>' if bgc else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-label="{title}"><title>{title}</title>{bg}{body}</svg>'

def horizontal(fg, bg, acorn, cap, tagc, bgc=None):
    m=mark(fg,bg if not bgc else bgc,acorn,cap,tx=0,ty=0,s=0.92)  # 110 tall
    wm,ww=wordmark(78, 112, 70, fg)
    tl,tw=tagline('KÁVÉZÓ & TORTAMŰHELY',11.5,116,96,tagc,3.1)
    W=round(max(112+ww,116+tw)+8); H=112
    return svg(W,H,m+wm+tl,bgc)
def stacked(fg,bg,acorn,cap,tagc,bgc=None):
    m=mark(fg,bgc or bg,acorn,cap,tx=0,ty=0,s=1.2)
    wm,ww=wordmark(74,0,0,fg); tl,tw=tagline('KÁVÉZÓ & TORTAMŰHELY',11,0,0,tagc,3)
    W=round(max(ww,tw,150)+40); cx=W/2
    m=mark(fg,bgc or bg,acorn,cap,tx=cx-63.5*1.2,ty=0,s=1.2)
    wm,_=wordmark(74,cx-ww/2,206,fg); tl,_=tagline('KÁVÉZÓ & TORTAMŰHELY',11,cx-tw/2,236,tagc,3)
    return svg(W,256,m+wm+tl,bgc)
def seal(fg,bg,acorn,cap,bgc=None):
    S=320; c=S/2
    rings=(f'<circle cx="{c}" cy="{c}" r="152" fill="{bgc or "none"}" stroke="{fg}" stroke-width="2"/>'
           f'<circle cx="{c}" cy="{c}" r="146" fill="none" stroke="{fg}" stroke-width=".8"/>'
           f'<circle cx="{c}" cy="{c}" r="104" fill="none" stroke="{fg}" stroke-width=".8"/>')
    t1='KÁVÉZÓ ÉS TORTAMŰHELY'; t2='BUDAPEST · VÁRFOK UTCA'
    # measure arc for centering
    def arc_text(t,size,r,center_deg,track,flip=False):
        f=font('manrope-var.woff',600); gs=f.getGlyphSet(); cmap=f.getBestCmap(); sc=size/f['head'].unitsPerEm
        L=sum(gs[cmap[ord(ch)]].width*sc+track for ch in t)-track
        if not flip:
            d,_=circle_text(t,'manrope-var.woff',600,size,c,c,r,center_deg-math.degrees(L/r)/2,track)
            return d
        # bottom text reading left->right: place on circle counter-clockwise with glyphs upright
        pen_d=[]; f=font('manrope-var.woff',600)
        from fontTools.pens.svgPathPen import SVGPathPen
        from fontTools.pens.transformPen import TransformPen
        pen=SVGPathPen(gs); ang=math.radians(center_deg)+ (L/r)/2
        for ch in t:
            w=gs[cmap[ord(ch)]].width*sc
            if ch==' ': ang-=(w+track)/r; continue
            a=ang-(w/2)/r
            px=c+r*math.sin(a); py=c-r*math.cos(a)
            ca,sa=math.cos(a+math.pi),math.sin(a+math.pi)
            m=(sc*ca, sc*sa, sc*sa, -sc*ca, px - ca*(w/2), py - sa*(w/2))
            gs[cmap[ord(ch)]].draw(TransformPen(pen,m)); ang-=(w+track)/r
        return pen.getCommands()
    d1=arc_text(t1,15,118,0,3.2)
    d2=arc_text(t2,13.5,134,180,3.0,flip=True)
    dots=''.join(f'<circle cx="{c+125*math.sin(math.radians(a))}" cy="{c-125*math.cos(math.radians(a))}" r="2.6" fill="{acorn}"/>' for a in (90,270))
    m=mark(fg,bgc or bg,acorn,cap,tx=c-63.5*0.98,ty=c-57*0.98,s=0.98)
    wm,ww=wordmark(30,0,0,fg)
    return svg(S,S,rings+f'<path d="{d1}" fill="{fg}"/><path d="{d2}" fill="{fg}"/>'+dots+m)
def favicon():
    return svg(64,64,f'<rect width="64" height="64" rx="14" fill="#64613F"/>'+mark(PAPER,'#64613F',PAPER,'#C9AFA0',tx=-2,ty=2,s=0.53))
def markonly(fg,bg,acorn,cap,bgc=None):
    return svg(120,120,mark(fg,bgc or bg,acorn,cap),bgc)
if __name__=='__main__':
    import sys,os
    out=sys.argv[1]; os.makedirs(out,exist_ok=True)
    files={
     'mokusch-logo.svg':horizontal(INK,PAPER,BERRY,BARK,'#6B5A47'),
     'mokusch-logo-vilagos.svg':horizontal(PAPER,'#263A2D','#C9AFA0','#E6D6CB','#C9AFA0',bgc=None).replace(f'fill="{PAPER}"/><circle',f'fill="{PAPER}"/><circle'),
     'mokusch-logo-allo.svg':stacked(INK,PAPER,BERRY,BARK,'#6B5A47'),
     'mokusch-jel.svg':markonly(INK,PAPER,BERRY,BARK),
     'mokusch-pecset.svg':seal(INK,PAPER,BERRY,BARK),
     'mokusch-pecset-vilagos.svg':seal(PAPER,'#263A2D','#C9AFA0','#EBDDD3'),
     'mokusch-jel-vilagos.svg':markonly(PAPER,'#263A2D','#C9AFA0','#EBDDD3'),
     'favicon.svg':favicon(),
    }
    for k,v in files.items():
        dest=os.path.join(out,'..',k) if k=='favicon.svg' else os.path.join(out,k)
        open(dest,'w').write(v)
    print('ok', list(files))

# --- inline változatok a weboldalhoz ---
def inline_mark(cls='brand__mark', fg='currentColor', bg='#F6EFE4', acorn=BERRY, cap=BARK, label=None):
    aria = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    return f'<svg class="{cls}" viewBox="20 4 88 106" {aria}>{mark(fg,bg,acorn,cap)}</svg>'
def inline_wordmark(cls='brand__word', fg='currentColor'):
    d,w=text_path('Mókusch',*WM,78,0,62,track=78*0.005)
    x0,y0,x1,y1=text_bounds('Mókusch',*WM,78,0,62,track=78*0.005); x0-=1;y0-=1;x1+=1;y1+=1
    return f'<svg class="{cls}" viewBox="{x0:.1f} {y0:.1f} {x1-x0:.1f} {y1-y0:.1f}" aria-hidden="true"><path d="{d}" fill="{fg}"/></svg>'
