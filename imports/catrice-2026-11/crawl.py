import re, json, os, sys, subprocess, urllib.parse, hashlib
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36'
def get(url):
    f='pages/'+hashlib.md5(url.encode()).hexdigest()+'.html'
    if not os.path.exists(f):
        subprocess.run(['curl','-sL','-A',UA,'-o',f,url],timeout=60)
    return open(f,encoding='utf8',errors='ignore').read() if os.path.exists(f) else ''
def variants(html):
    s=html.replace('\\"','"')
    out={}
    D=json.JSONDecoder()
    for m in re.finditer(r'"gtin":"(\d+)"',s):
        g=m.group(1); best=None
        lo=max(0,m.start()-2500)
        i=m.start()
        while True:
            i=s.rfind('{',lo,i)
            if i<0: break
            try:
                obj,_=D.raw_decode(s[i:])
                if isinstance(obj,dict) and obj.get('gtin')==g:
                    best=obj; 
                    if 'medias' in obj: break
            except Exception: pass
        if best:
            if g not in out or ('medias' in best and 'medias' not in out[g]): out[g]=best
    return out
rows=[l.rstrip('\n').split('\t') for l in open('rows.tsv')]
want={r[0] for r in rows}
db=[l.rstrip('\n').split('|') for l in open('db.txt')]
names=sorted({r[3] for r in db if r[0]=='P'})
queries=set()
for n in names+[r[1] for r in rows]:
    q=re.sub(r'(?i)catrice|\b(no\.?|n°)\s*\d+|\b[cC]?\d{2,3}[a-zA-Z]?\b|\d+(\.\d+)?\s*(ml|g)\b|-.*$','',n)
    q=re.sub(r'[^A-Za-z&\' ]',' ',q); q=' '.join(q.split()[:6])
    if len(q)>3: queries.add(q.lower())
G={}; pages=set()
for q in sorted(queries):
    h=get('https://www.catrice.eu/en-gb/search?q='+urllib.parse.quote(q))
    G.update(variants(h))
    for p in re.findall(r'href="(/en-gb/p/\d+/[^"]+)"',h)[:4]: pages.add(p)
print('queries',len(queries),'pages',len(pages),file=sys.stderr)
for p in sorted(pages):
    G.update(variants(get('https://www.catrice.eu'+p)))
json.dump(G,open('gtin.json','w'))
hit=[b for b in want if b in G]
print('variants',len(G),'file hit',len(hit),'/',len(want))
