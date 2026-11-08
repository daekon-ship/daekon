# Pizza-kivágás: a pizza körvonalára illesztett ellipszis -> enyhe perspektíva-korrekció
# (kerekre igazítás) -> a pizza saját körvonala mentén kivágás (háttér nélkül)
# -> finom, valósághű tónusjavítás. Generatív/AI eszköz nincs; az eredeti fájl változatlan.
import numpy as np, pathlib
from PIL import Image, ImageFilter
from scipy import ndimage
root=pathlib.Path(__file__).resolve().parents[2]
def disk(r):
    y,x=np.ogrid[-r:r+1,-r:r+1]; return x*x+y*y<=r*r
def pizza_mask(a):
    warm=(a[...,0]-a[...,2])>16
    m=ndimage.binary_opening(warm,structure=disk(4))
    lab,n=ndimage.label(m); s=ndimage.sum(m,lab,range(1,n+1)); m=lab==(np.argmax(s)+1)
    m=ndimage.binary_closing(m,structure=disk(28),iterations=1); m=ndimage.binary_fill_holes(m)
    m=ndimage.binary_opening(m,structure=disk(10))
    # a perem megégett, sötét foltjai is a pizzához tartoznak
    dark=(a.max(2)<125)&(a[...,0]>=a[...,2]+2)&ndimage.binary_dilation(m,structure=disk(45))  # meleg-sötét = égett perem; a hideg-sötét betonárnyék kimarad
    dark=ndimage.binary_opening(dark,structure=disk(3))
    m=ndimage.binary_fill_holes(ndimage.binary_closing(m|dark,structure=disk(12)))
    return m
def grade(im):
    a=np.asarray(im).astype(np.float32)/255
    a=a*np.array([1.02,1.0,0.97])                    # enyhe melegítés
    l=(a*[0.299,0.587,0.114]).sum(2,keepdims=True)
    sat=np.abs(a-l).max(2,keepdims=True)
    a=l+(a-l)*(1.0+0.16*(1-np.clip(sat*3,0,1)))      # vibrance: a fakóbb színek kapnak többet
    a=np.clip(a,0,1)
    a=a+0.07*(a-0.5)*(1-np.abs(2*a-1))               # lágy S-görbe (kontraszt)
    a=np.clip(a,0,1)
    out=Image.fromarray((a*255+.5).astype('uint8'))
    return out.filter(ImageFilter.UnsharpMask(radius=1.6,percent=55,threshold=3))
info={}
for k in ['tonhalas','magyaros','hawaii']:
    src=Image.open(root/f'_forras/eredeti/foto-{k}-eredeti.jpg').convert('RGB')
    a=np.asarray(src).astype(float); m=pizza_mask(a)
    ys,xs=np.nonzero(m); cy,cx=ys.mean(),xs.mean()
    ev,V=np.linalg.eigh(np.cov(np.vstack([xs-cx,ys-cy]))); ax=2*np.sqrt(ev); R=np.sqrt(ax[0]*ax[1])
    S=V@np.diag(ax/R)@V.T
    pad=36; side=int(2*R+2*pad); co=side/2
    off=np.array([cx,cy])-S@np.array([co,co])
    T=(S[0,0],S[0,1],off[0],S[1,0],S[1,1],off[1])
    w=src.transform((side,side),Image.AFFINE,T,resample=Image.BICUBIC)
    mk=Image.fromarray((m*255).astype('uint8')).transform((side,side),Image.AFFINE,T,resample=Image.BILINEAR)
    # körvonal szögenként: r(θ) = a maszk legkülső pontja; a perem szélén lévő sötét,
    # megégett foltok miatti bevágásokat 9°-os csúszó mediánnal simítjuk, majd sokszögből rajzoljuk.
    mb=np.asarray(mk)>127
    N=1440; th=np.linspace(0,2*np.pi,N,endpoint=False); rr=np.arange(0,co,0.5)
    X=co+np.outer(np.cos(th),rr); Y=co+np.outer(np.sin(th),rr)
    inside=mb[np.clip(Y.astype(int),0,side-1),np.clip(X.astype(int),0,side-1)]
    rad=np.array([rr[np.nonzero(row)[0].max()] if row.any() else 0 for row in inside])
    win=36; ext=np.r_[rad[-win:],rad,rad[:win]]
    med=np.array([np.median(ext[i:i+2*win+1]) for i in range(N)])
    rs=np.maximum(rad,med-1.0)                      # csak kitöltünk, nem vágunk bele a peremekbe
    sm=np.r_[rs[-3:],rs,rs[:3]]; rs=np.convolve(sm,np.ones(7)/7,'valid')
    from PIL import ImageDraw
    q=4; big=Image.new('L',(side*q,side*q),0)
    ImageDraw.Draw(big).polygon([(q*(co+r*np.cos(t)),q*(co+r*np.sin(t))) for t,r in zip(th,rs)],fill=255)
    alpha=big.resize((side,side),Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.9))
    out=grade(w).convert('RGBA'); out.putalpha(alpha)
    bb=alpha.point(lambda v:255 if v>8 else 0).getbbox()
    # négyzetes vászon a pizza középpontja (co,co) körül, hogy a gyűrű koncentrikus legyen
    half=int(max(co-bb[0],bb[2]-co,co-bb[1],bb[3]-co))+6
    out=out.crop((int(co-half),int(co-half),int(co+half),int(co+half)))
    dist=np.hypot(*(np.nonzero(np.asarray(alpha)>128)[::-1]-np.array([[co],[co]])))
    info[k]=dict(stretch=round(float(ax.max()/ax.min()),3),side=out.size[0],r_p50=round(float(np.percentile(dist,99.5)),1),R=round(float(R),1))
    out.save(root/f'_forras/feldolgozas/{k}-kivagas.png')
    full=out.size[0]
    for px in sorted({full,1080,720,360}):
        if px<=full: out.resize((px,px),Image.LANCZOS).save(root/f'img/{k}-kivagas-{px if px!=full else "max"}.webp',quality=90,method=6)
print(info)
