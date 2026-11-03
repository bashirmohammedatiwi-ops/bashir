import json, sys, re
exec(open('crawl.py').read().split("rows=[l.rstrip")[0])
from concurrent.futures import ThreadPoolExecutor
G=json.load(open('gtin.json'))
rows=[l.rstrip('\n').split('\t') for l in open('rows.tsv')]
def run(urls):
    seen={};
    for u in urls: seen.setdefault(u.rsplit('/',1)[1],u)
    with ThreadPoolExecutor(6) as ex: hs=list(ex.map(get,seen.values()))
    for h in hs:
        for k,v in variants(h).items(): G.setdefault(k,v)
run([l.strip() for l in open(sys.argv[1]) if l.strip()])
json.dump(G,open('gtin.json','w'))
miss=[r for r in rows if r[0] not in G]
print('variants',len(G),'hit',len(rows)-len(miss),'/',len(rows))
open('miss.txt','w').write('\n'.join('\t'.join(r) for r in miss))
