# Elrendezés-ellenőrzés: vízszintes túlcsordulás, konzolhiba, képernyőképek (vevői oldal + konyhai admin)
import json, sys
from playwright.sync_api import sync_playwright
B='http://localhost:8765/limit-pizza/'; OUT=sys.argv[1] if len(sys.argv)>1 else None
SIZES=[(320,640),(360,740),(390,844),(430,932),(768,1024),(1024,768),(1024,1366),(1440,900),(1920,1080)]
OVF='''()=>{const W=document.documentElement.clientWidth;const bad=[];document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&(r.right>W+1||r.left<-1)&&getComputedStyle(el).position!=='fixed'){let p=el.parentElement,clip=false;while(p&&p!==document.body){if(getComputedStyle(p).overflowX!=='visible'){clip=true;break}p=p.parentElement}if(!clip)bad.push((el.className&&el.className.baseVal===undefined?el.className:el.tagName)+'')}});return {sw:document.documentElement.scrollWidth,W,bad:[...new Set(bad)].slice(0,6)}}'''
TINY='''()=>[...document.querySelectorAll('button:not([hidden]), a.btn, a.abtn, .chip, .cn')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden'&&(r.height<36)}).map(e=>(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,24)).slice(0,6)'''
res={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for page in ('', 'admin.html'):
        for w,h in SIZES:
            ctx=b.new_context(viewport={'width':w,'height':h},timezone_id='Europe/Budapest'); pg=ctx.new_page(); errs=[]
            pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type in ('error','warning') else None)
            pg.goto(B+page,wait_until='networkidle'); pg.wait_for_timeout(900)
            if page: pg.click('[data-simulate]'); pg.wait_for_timeout(500)
            H=pg.evaluate('document.body.scrollHeight')
            for y in range(0,H,600): pg.evaluate(f'scrollTo(0,{y})'); pg.wait_for_timeout(40)
            pg.wait_for_timeout(500); pg.evaluate('scrollTo(0,0)'); pg.wait_for_timeout(200)
            o=pg.evaluate(OVF); t=pg.evaluate(TINY)
            if OUT:
                n=(page.replace('.html','') or 'site')+f'-{w}x{h}'
                pg.screenshot(path=f'{OUT}/{n}-top.png'); pg.screenshot(path=f'{OUT}/{n}-full.png',full_page=True)
            res[f'{page or "index"} {w}x{h}']={'ovf':o['sw']-o['W'],'bad':o['bad'],'kicsi_gomb':t,'hibak':errs}
            ctx.close()
    b.close()
for k,v in res.items(): print(k, 'túlcsordulás:',v['ovf'], v['bad'] or '', '| 36px alatti gomb:', v['kicsi_gomb'] or '-', '| hibák:', v['hibak'] or '-')
