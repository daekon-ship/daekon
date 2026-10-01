import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { BUILD, SVG_DIR, PNG_DIR, C as COL, b64, contrast } from './lib.mjs';
import { concepts, horizontal, stacked, markSvg } from './marks.mjs';

const wm = JSON.parse(fs.readFileSync(path.join(BUILD, 'wordmark.json'), 'utf8'));
const buildA = concepts.A.build;
const svgFile = (n) => fs.readFileSync(path.join(SVG_DIR, n), 'utf8');
const fontB64 = b64(path.join(BUILD, 'fonts', 'Archivo-Var.ttf'));

// fresh 16 px favicon raster for the pixelated demo
const fav16 = path.join(BUILD, 'fav16.png');
await sharp(Buffer.from(markSvg(buildA, { text: COL.white, a: COL.white, b: COL.blueDark })), { density: 300 })
  .resize({ width: 16, height: 16, fit: 'fill' }).png().toFile(fav16);
const fav16B64 = b64(fav16);

// ---- concept lockups for section 1 ----
function lockupFor(key, mode) {
  const sch = mode === 'light'
    ? { text: COL.ink, a: COL.ink, b: COL.blue }
    : { text: COL.white, a: COL.white, b: COL.blueDark };
  return horizontal(concepts[key].build, sch, wm, 36).svg;
}

// ---- clearspace diagram (X = mark height / 4 = 25 units) ----
function clearspace() {
  const H = horizontal(buildA, { text: COL.ink, a: COL.ink, b: COL.blue }, wm, 36);
  const inner = H.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const X = 25, m = 40;
  const vb = `${-X - m} ${-X - m} ${H.width + 2 * (X + m)} ${112 + 2 * (X + m)}`;
  const w = H.width + 2 * (X + m), h = 112 + 2 * (X + m);
  const label = (x, y) => `<text x="${x}" y="${y}" font-family="monospace" font-size="26" fill="#9aa0aa" text-anchor="middle">X</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="760">
  <rect x="${-X}" y="${-X}" width="${H.width + 2 * X}" height="${112 + 2 * X}" fill="none" stroke="#c9ced6" stroke-dasharray="8 7" stroke-width="2"/>
  <rect x="0" y="0" width="${H.width}" height="112" fill="none" stroke="#e3e6ea" stroke-width="1.5"/>
  <rect x="${-X - 14}" y="${-X - 14}" width="${H.width + 2 * X + 28}" height="${112 + 2 * X + 28}" fill="none" stroke="#eceef1" stroke-width="1.5"/>
  ${inner}
  ${label(-X / 2, 0)} ${label(H.width + X / 2, 0)}
  ${label(-X / 2, 118)} ${label(H.width + X / 2, 118)}
  ${label(10, -X / 2 + 9)} ${label(10, 112 + X / 2 + 9)}
  ${label(H.width - 10, -X / 2 + 9)} ${label(H.width - 10, 112 + X / 2 + 9)}
  <text x="${-X - m + 4}" y="${h - m - 34}" font-family="Archivo" font-size="26" fill="#5b616b">A védőtávolság (X) = a logójel magasságának negyede, minden irányban.</text>
</svg>`;
}

const inkWhite = contrast(COL.ink, '#FFFFFF').toFixed(1);

// ---- inventory ----
const inv = [
  ['SVG', 'daekon-logo-horizontal.svg', 'vízszintes logó, világos háttérre'],
  ['SVG', 'daekon-logo-horizontal-dark.svg', 'vízszintes logó, sötét háttérre'],
  ['SVG', 'daekon-logo-horizontal-mono-black.svg', 'egyszínű fekete (fax, bélyegző, 1 színes nyomdai munka)'],
  ['SVG', 'daekon-logo-horizontal-mono-white.svg', 'egyszínű fehér (fotó, sötét nyomdai munka)'],
  ['SVG', 'daekon-logo-stacked*.svg (4)', 'álló változat, 4 színmód'],
  ['SVG', 'daekon-mark*.svg (4)', 'önálló logójel, 4 színmód'],
  ['SVG', 'daekon-mark-padded*.svg (4)', 'logójel védőszabad térrel'],
  ['SVG', 'daekon-wordmark*.svg (4)', 'csak DAEKON felirat'],
  ['PNG', 'daekon-logo-horizontal*.png (4)', '1200 px széles, átlátszó háttér'],
  ['PNG', 'daekon-logo-stacked*.png (4)', '600 px széles, átlátszó háttér'],
  ['PNG', 'daekon-mark*.png (512/256/64/32)', 'logójel raszterizált, átlátszó'],
  ['PNG', 'daekon-app-icon-512/192.png', 'alkalmazásikon, lekerekített sötét csempén'],
  ['PNG', 'daekon-facebook-profile-1024.png', 'Facebook-profilkép, 1024×1024'],
  ['ICO', 'favicon.ico', '16/32/48 px böngészőikon'],
];

const invRows = inv.map(([t, n, d]) =>
  `<tr><td class="tag">${t}</td><td class="mono">${n}</td><td>${d}</td></tr>`).join('');

const swatches = [
  ['DAEKON kék', COL.blue, '#1636E7', 'fő akcentszín, világos háttéren', 'kék/fehér kontraszt: 7,7:1'],
  ['Fénykék', COL.blueDark, '#2B50FF', 'kék sötét háttéren', 'kék/sötét kontraszt: 3,4:1'],
  ['Grafit', COL.ink, '#14161B', 'felirat, mono logó', 'grafit/fehér: ' + inkWhite + ':1'],
  ['Éjszaka', COL.bgDark, '#0E1013', 'sötét felületek', 'fehér/sötét: 19,1:1'],
  ['Fehér', '#FFFFFF', '#FFFFFF', 'világos felületek, negatív felirat', '—'],
].map(([name, hex, code, use, note]) => `
  <div class="sw"><div class="chip" style="background:${hex}"></div>
  <b>${name}</b><span class="mono">${code}</span><span>${use}</span><span class="dim">${note}</span></div>`).join('');

const html = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DAEKON — Márka kézikönyv v1.0</title>
<style>
@font-face{font-family:'Archivo';src:url(data:font/ttf;base64,${fontB64}) format('truetype');font-weight:100 900;font-style:normal;}
*{box-sizing:border-box;margin:0}
body{font-family:Archivo,system-ui,sans-serif;background:#F3F4F6;color:#14161B;line-height:1.55}
.wrap{max-width:1060px;margin:0 auto;padding:0 28px}
h1{font-size:30px;font-weight:650;letter-spacing:.01em}
h2{font-size:22px;font-weight:650;margin:0 0 18px}
h3{font-size:15px;font-weight:600;color:#5b616b;margin:22px 0 10px;text-transform:uppercase;letter-spacing:.12em}
section{margin:54px 0}
.panel{background:#fff;border-radius:16px;padding:34px;box-shadow:0 1px 2px rgba(10,12,16,.06),0 8px 28px rgba(10,12,16,.05)}
.panel.dark{background:#0E1013;color:#fff}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}
@media(max-width:860px){.grid2,.grid3{grid-template-columns:1fr}}
.card{border:1px solid #E4E6EA;border-radius:14px;padding:24px;background:#fff;position:relative}
.card .badge{position:absolute;top:14px;right:14px;background:#1636E7;color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;padding:5px 10px;border-radius:99px}
.card .mark{height:150px;display:flex;align-items:center}
.card p{font-size:13.5px;color:#4a505a;margin-top:14px}
.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px}
.dim{color:#878d97;font-size:12.5px}
.tag{display:inline-block;background:#EDF0FF;color:#1636E7;font-weight:700;font-size:11px;border-radius:6px;padding:2px 8px}
.hero{background:#0E1013;color:#fff;border-radius:18px;padding:70px 30px 60px;text-align:center}
.hero .stacked{width:240px;margin:0 auto 26px;display:block}
.hero h1{color:#fff}
.hero p{color:#9aa0aa;margin-top:10px;font-size:15px}
.demo-frame{border-radius:12px;overflow:hidden;border:1px solid #E4E6EA}
.nav{display:flex;align-items:center;gap:26px;padding:14px 26px;font-size:14.5px;font-weight:500}
.nav .logo svg{display:block}
.nav .links{margin-left:auto;display:flex;gap:22px;color:#4a505a}
.nav .cta{background:#1636E7;color:#fff;padding:8px 16px;border-radius:8px;font-weight:600}
.nav.dark{background:#14161B;color:#fff}
.nav.dark .links{color:#b9bec7}
.nav.mobile{width:375px;padding:11px 16px}
.burger{margin-left:auto;width:20px}.burger i{display:block;height:2px;background:#14161B;margin:4px 0;border-radius:2px}
.fb{max-width:620px;border:1px solid #E4E6EA;border-radius:12px;overflow:hidden;background:#fff}
.fb .cover{height:190px;background:#0E1013;position:relative}
.fb .cover svg{position:absolute;inset:0;margin:auto;width:150px;opacity:.16}
.fb .row{display:flex;gap:16px;padding:0 22px;align-items:flex-end;margin-top:-42px;position:relative}
.fb .ava{width:118px;height:118px;border-radius:50%;border:4px solid #fff;overflow:hidden;flex:none;background:#0E1013}
.fb .name{padding-bottom:10px}
.fb .name b{font-size:23px;font-weight:700}
.fb .name span{display:block;color:#5b616b;font-size:13px}
.fb .actions{display:flex;gap:10px;padding:14px 22px 18px;border-top:1px solid #ECEEF1;margin-top:14px}
.fb .btn{padding:8px 18px;border-radius:8px;font-size:13.5px;font-weight:600}
.fb .btn.p{background:#1636E7;color:#fff}.fb .btn.s{background:#EEF0F3;color:#14161B}
.sw{display:grid;grid-template-columns:56px 1fr;grid-template-rows:auto auto;column-gap:14px;align-items:center;border:1px solid #E4E6EA;border-radius:12px;padding:14px;background:#fff}
.chip{width:56px;height:56px;border-radius:10px;border:1px solid rgba(0,0,0,.08);grid-row:1/3}
.sw b{font-size:14.5px}.sw span{font-size:12.5px;color:#5b616b}.sw .mono{color:#14161B}
.swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:14px}
.rule{display:flex;gap:10px;font-size:14px;margin:8px 0}
.rule .no{color:#B3261E;font-weight:700}.rule .yes{color:#1B7F3B;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:13.5px}
td{padding:9px 10px;border-bottom:1px solid #ECEEF1;vertical-align:top}
.sig{display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #E4E6EA;border-radius:12px;padding:18px 22px;max-width:560px}
.sig .div{width:1px;height:54px;background:#E4E6EA}
.sig .who{font-size:13px;color:#4a505a}
.sig .who b{display:block;color:#14161B;font-size:14.5px}
footer{padding:30px 0 60px;color:#878d97;font-size:12.5px;text-align:center}
img.px{image-rendering:pixelated;border-radius:4px}
.seclabel{font-size:12px;letter-spacing:.14em;font-weight:700;color:#878d97;text-transform:uppercase;margin-bottom:6px}
</style></head><body><div class="wrap">

<section>
  <div class="hero">
    <div class="stacked">${svgFile('daekon-logo-stacked-dark.svg')}</div>
    <h1>DAEKON — márkaidentitás v1.0</h1>
    <p>Egyedi szoftverfejlesztés · Ötlettől a működő rendszerig</p>
  </div>
</section>

<section>
  <div class="seclabel">1. lépés</div>
  <h2>Három irány — a kiválasztott: A</h2>
  <div class="grid3">
    <div class="card"><span class="badge">KIVÁLASZTVA</span>
      <div class="mark">${lockupFor('A','light')}</div>
      <h3>A — SPLIT D</h3>
      <p>Egy erős D két precíz félre vágva: a bal grafit „váz", a jobb kék „rendszer" — pontosan azt csináljuk, amit a DAEKON: két oldalt találkozó, illeszkedő megoldás. A varrat és a nyitott counter adja a saját karaktert, 16 px alatt is azonosítható. Semmi közhely: csak a D betű, okosabban.</p>
    </div>
    <div class="card">
      <div class="mark">${lockupFor('B','light')}</div>
      <h3>B — KAPU</h3>
      <p>Ív forma, amelyben a D és egy A keresztléc lapul: az „átlépés a digitális korba" metaforája. Barátságos és megjegyezhető, viszont kicsiben a belső ív eldeformálódik, és a felirat nélküli jel kevésbé egyedi.</p>
    </div>
    <div class="card">
      <div class="mark">${lockupFor('C','light')}</div>
      <h3>C — SAROK</h3>
      <p>Két összefonódó sarokzáró keret — a „külső igény + belső rendszer" kapcsolata. Elegáns, absztrakt és időtálló, de betűutalás nélkül bármelyik cég lehetne; a DAEKON-név nem ragad rá.</p>
    </div>
  </div>
</section>

<section>
  <div class="seclabel">2. lépés</div>
  <h2>A végleges logórendszer</h2>
  <div class="grid2">
    <div class="panel" style="display:flex;align-items:center;justify-content:center">${svgFile('daekon-logo-horizontal.svg')}</div>
    <div class="panel dark" style="display:flex;align-items:center;justify-content:center">${svgFile('daekon-logo-horizontal-dark.svg')}</div>
    <div class="panel" style="display:flex;align-items:center;justify-content:center">${svgFile('daekon-logo-horizontal-mono-black.svg')}</div>
    <div class="panel" style="background:#14161B;display:flex;align-items:center;justify-content:center">${svgFile('daekon-logo-horizontal-mono-white.svg')}</div>
  </div>
  <h3>Álló változat és önálló jel</h3>
  <div class="grid3">
    <div class="card" style="display:flex;align-items:center;justify-content:center;min-height:300px">${svgFile('daekon-logo-stacked.svg')}</div>
    <div class="card" style="display:flex;align-items:center;justify-content:center;min-height:300px">${svgFile('daekon-mark.svg')}</div>
    <div class="card" style="display:flex;align-items:center;justify-content:center;min-height:300px;background:#F7F8FA">${svgFile('daekon-wordmark.svg')}</div>
  </div>
  <p class="dim" style="margin-top:10px">Balrol: álló változat (pl. névjegy hátlap) · középen: önálló logójel (pl. avatar) · jobbra: csak a DAEKON felirat (pl. lábléc).</p>
</section>

<section>
  <div class="seclabel">3. lépés</div>
  <h2>Alkalmazás a valóságban</h2>
  <h3>Weboldal fejléc — világos és sötét</h3>
  <div class="demo-frame"><div class="nav">
    <span class="logo">${svgFile('daekon-logo-horizontal.svg').replace('<svg ','<svg height="34" ')}</span>
    <span class="links"><span>Szolgáltatások</span><span>Referencia</span><span>Rólunk</span></span>
    <span class="cta">Ajánlatkérés</span>
  </div></div>
  <div class="demo-frame" style="margin-top:14px"><div class="nav dark">
    <span class="logo">${svgFile('daekon-logo-horizontal-dark.svg').replace('<svg ','<svg height="34" ')}</span>
    <span class="links"><span>Szolgáltatások</span><span>Referencia</span><span>Rólunk</span></span>
    <span class="cta">Ajánlatkérés</span>
  </div></div>
  <h3>Mobil fejléc (375 px)</h3>
  <div class="demo-frame" style="width:375px"><div class="nav mobile">
    <span class="logo">${svgFile('daekon-logo-horizontal.svg').replace('<svg ','<svg height="26" ')}</span>
    <span class="burger"><i></i><i></i><i></i></span>
  </div></div>
  <h3>Facebook-profil</h3>
  <div class="fb">
    <div class="cover">${svgFile('daekon-mark-dark.svg')}</div>
    <div class="row">
      <div class="ava"><img src="data:image/png;base64,${b64(path.join(PNG_DIR, 'daekon-facebook-profile-1024.png'))}" style="width:100%;height:100%;object-fit:cover"></div>
      <div class="name"><b>DAEKON</b><span>Egyedi szoftverfejlesztés · Weboldalak, webes rendszerek</span></div>
    </div>
    <div class="actions"><span class="btn p">Tetszik</span><span class="btn s">Követés</span><span class="btn s">Üzenet</span></div>
  </div>
  <h3>E-mail-aláírás</h3>
  <div class="sig">
    ${svgFile('daekon-logo-horizontal.svg').replace('<svg ','<svg height="30" ')}
    <div class="div"></div>
    <div class="who"><b>DAEKON</b>Egyedi szoftverfejlesztés<br><span class="mono">daekon.hu</span></div>
  </div>
  <h3>Alkalmazásikon és favicon</h3>
  <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
    <img src="data:image/png;base64,${b64(path.join(PNG_DIR, 'daekon-app-icon-512.png'))}" width="84" style="border-radius:18px">
    <img src="data:image/png;base64,${b64(path.join(PNG_DIR, 'daekon-app-icon-192.png'))}" width="48" style="border-radius:10px">
    <img class="px" src="data:image/png;base64,${fav16B64}" width="64" height="64" style="width:64px">
    <div><img class="px" src="data:image/png;base64,${fav16B64}" style="width:16px;vertical-align:middle"> <span class="dim">favicon 16×16 px (valódi méret)</span></div>
  </div>
</section>

<section>
  <div class="seclabel">4. lépés</div>
  <h2>Színek és tipográfia</h2>
  <div class="swatches">${swatches}</div>
  <h3>Betűtípus</h3>
  <div class="panel" style="padding:26px">
    <div style="font-size:30px;font-weight:650;letter-spacing:.01em">Archivo — SemiBold 640</div>
    <p style="font-size:13.5px;color:#4a505a;margin-top:8px">A logóban a „DAEKON" felirat <b>Archivo SemiBold (640)</b>, kézzel hangolt betűközzel (+16/100 cap egység) — a felirat a logókban <b>körvonalazott vektor</b>, így font nélkül is pontosan jelenik meg bárhol.
    Webes felületeken ugyanez a család: Archivo Regular szövegre, Medium gombokra, SemiBold/Bold címekre.<br>
    <span class="dim">Licenc: SIL Open Font License 1.1 — ingyenes, kereskedelmi használatra is. Forrás: google/fonts / Archivo.</span></p>
    <p class="dim" style="margin-top:6px">Helyettesítő (ha a font nem tölthető be): Inter vagy Helvetica Neue, hasonló súlyokkal.</p>
  </div>
</section>

<section>
  <div class="seclabel">5. lépés</div>
  <h2>Szabályok: méret és védőtávolság</h2>
  <div class="grid2">
    <div class="panel">${clearspace()}</div>
    <div>
      <div class="panel" style="margin-bottom:16px">
        <h3 style="margin-top:0">Minimális méretek</h3>
        <div class="rule"><span class="yes">✓</span> Vízszintes logó: <b>&nbsp;140 px&nbsp;</b> szélesség (képernyő) / 35 mm (nyomtatvány)</div>
        <div class="rule"><span class="yes">✓</span> Logójel: <b>&nbsp;24 px&nbsp;</b> magasság</div>
        <div class="rule"><span class="yes">✓</span> Favicon / alkalmazásikon: a kész fájl használata 16 px-től</div>
        <div class="rule"><span class="no">✗</span> A felirat soha nem kisebb, mint a logójel magasságának 45%-a</div>
      </div>
      <div class="panel">
        <h3 style="margin-top:0">Ne tedd</h3>
        <div class="rule"><span class="no">✗</span> Ne nyújtsd, ne döntsd, ne add hozzá árnyékot vagy ragyogást</div>
        <div class="rule"><span class="no">✗</span> Ne színezd át más színre — csak a megadott kék / grafit / fehér kombók</div>
        <div class="rule"><span class="no">✗</span> Ne tedd a feliratot a jel fölé vagy alá módosított szóközökkel</div>
        <div class="rule"><span class="no">✗</span> Fotós háttéren: csak mono-fehér vagy mono-fekete + szükség esetén 30%-os szkrim</div>
      </div>
    </div>
  </div>
  <h3>Fekete-fehér bizonyítvány (szín nélkül is működik)</h3>
  <div class="grid2">
    <div class="panel" style="display:flex;align-items:center;justify-content:center">${svgFile('daekon-mark-mono-black.svg')}</div>
    <div class="panel" style="background:#14161B;display:flex;align-items:center;justify-content:center">${svgFile('daekon-mark-mono-white.svg')}</div>
  </div>
</section>

<section>
  <div class="seclabel">6. lépés</div>
  <h2>Fájlrendszer</h2>
  <div class="panel">
    <table><tr style="color:#878d97;text-align:left"><td>TÍPUS</td><td>FÁJL</td><td>MIRE VALÓ</td></tr>${invRows}</table>
    <p class="dim" style="margin-top:12px">Mappa: <span class="mono">daekon/brand/</span> — <span class="mono">svg/</span> szerkeszthető vektor, <span class="mono">png/</span> kész raszter, <span class="mono">DAEKON-brand.html</span> ez a kézikönyv.</p>
  </div>
</section>

<footer>DAEKON brand system v1.0 — logó: egyedi vektor (Archivo OFL 1.1 alapfelirattal) · készült: ${new Date().getFullYear()}</footer>
</div></body></html>`;

const outPath = path.join(BUILD, '..', 'DAEKON-brand.html');
fs.writeFileSync(outPath, html);
console.log('written', outPath, (html.length / 1024).toFixed(0) + ' KB');
