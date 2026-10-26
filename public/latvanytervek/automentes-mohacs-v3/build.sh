#!/bin/sh
# index.src.html -> index.html (logójel + FAQPage JSON-LD beillesztése)
cd "$(dirname "$0")" && python3 - <<'P'
import re, json, html
s=open('index.src.html').read()
j=open('assets/jel.svg').read()
inner=re.sub(r'<rect width="64" height="64" rx="14" fill="#121418"/>','',re.search(r'<svg[^>]*>(.*)</svg>',j,re.S).group(1))
s=s.replace('{{JEL}}',inner)
qa=re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',s)
faq={"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":html.unescape(q),"acceptedAnswer":{"@type":"Answer","text":html.unescape(re.sub('<[^>]+>','',a))}} for q,a in qa]}
s=s.replace('</head>','<script type="application/ld+json">\n'+json.dumps(faq,ensure_ascii=False,indent=1)+'\n</script>\n</head>',1)
open('index.html','w').write(s)
P
