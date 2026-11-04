# Registry of every evaluated media id → action/reason (+ new media id when replaced), so later runs skip them.
import json, sys
res = [json.loads(l) for l in open(sys.argv[1])]
m = json.load(open(sys.argv[2])) if len(sys.argv) > 3 else {}
rej = set(json.load(open(sys.argv[3]))) if len(sys.argv) > 3 else set()
out = {'date': '2026-11-04', 'scope': 'active products only (ProductImage + ProductShade images)',
       'marker': 'replacement media originalName = std1-<oldMediaId>.jpg', 'items': {}}
for r in res:
    a, why = r['action'], r['reason']
    if r['id'] in rej: a, why = 'skip', 'qa-rejected'
    e = {'action': a, 'reason': why, 'primary': r['primary']}
    if a == 'process' and r['id'] in m: e['new'] = m[r['id']]
    out['items'][r['id']] = e
json.dump(out, open(sys.argv[4] if len(sys.argv) > 4 else 'registry.json', 'w'), indent=0)
