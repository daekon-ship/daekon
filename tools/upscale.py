# Vanda saját Wix-képeinek felskálázása (Real-ESRGAN x4plus), majd 3840 px hosszabb oldalra igazítás.
# Új tartalmat nem talál ki: ugyanazt a festményt nagyítja fel, élesebb részletekkel.
import sys, os, math, urllib.request, torch, numpy as np
from PIL import Image
from spandrel import ModelLoader
IDS = {"osveny":("1c02e2457c654f63bc501ea424959dbe","png"),"udvar":("de1100572d664c6fa755501935ba3cf6","png"),
 "bolt":("8c413555228144899a373d1a90d78540","jpg"),"pult1":("b532d1c8fb82452ca1ee0c6a437521a3","jpeg"),
 "pult2":("315890bf789a4ad5aa95db1d942ada81","jpeg"),"konyha":("cfbccf746a67484b964a2df6f863167e","png"),
 "polc1":("985771b104cd41dab77d14018f3442df","jpeg"),"polc2":("cbfc9cb28d9a4925bc337c8867019c7e","jpeg"),
 "olvaso":("d7aecd48d9874c7fab65891cc27e88e8","png"),"posta":("2478afc6d240420187f710e04ce729f5","png"),
 "kepfal":("c2114812ce19405593f6a7dd4da29f15","png")}
os.makedirs("orig", exist_ok=True); os.makedirs("out4k", exist_ok=True)
torch.set_num_threads(os.cpu_count() or 4)
model = ModelLoader().load_from_file("RealESRGAN_x4plus.pth").model.eval()
def run(img, tile=192, pad=16):
    x = torch.from_numpy(np.asarray(img, dtype=np.float32) / 255.).permute(2, 0, 1)[None]
    _, _, H, W = x.shape; out = torch.zeros(1, 3, H * 4, W * 4)
    for y0 in range(0, H, tile):
        for x0 in range(0, W, tile):
            y1, x1 = min(y0 + tile, H), min(x0 + tile, W)
            ya, xa, yb, xb = max(y0 - pad, 0), max(x0 - pad, 0), min(y1 + pad, H), min(x1 + pad, W)
            with torch.no_grad(): o = model(x[:, :, ya:yb, xa:xb])
            out[:, :, y0*4:y1*4, x0*4:x1*4] = o[:, :, (y0-ya)*4:(y0-ya)*4+(y1-y0)*4, (x0-xa)*4:(x0-xa)*4+(x1-x0)*4]
    return Image.fromarray((out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255 + .5).astype(np.uint8))
ONLY = sys.argv[1:] or list(IDS)
for k, (m, e) in IDS.items():
    if k not in ONLY: continue
    p = f"orig/{k}.{e}"
    if not os.path.exists(p):
        urllib.request.urlretrieve(f"https://static.wixstatic.com/media/4f5ae5_{m}~mv2.{e}", p)
    im = Image.open(p).convert("RGB")
    up = run(im)
    s = 3840 / max(up.size); up = up.resize((round(up.width * s), round(up.height * s)), Image.LANCZOS)
    up.save(f"out4k/{k}.webp", quality=94, method=6)
    print(k, im.size, "->", up.size, flush=True)
