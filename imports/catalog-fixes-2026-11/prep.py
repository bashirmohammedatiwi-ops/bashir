# Download found shade/product images and frame them on white like the rest of the catalogue.
import json, os, sys, urllib.request, io
sys.path.insert(0, '/work')
from PIL import Image
from std import process
items = json.load(open('/work/shadefix/items.json'))
os.makedirs('/work/shadefix/src', exist_ok=True); os.makedirs('/work/shadefix/out', exist_ok=True)
res = []
for it in items:
    key = it.get('shade_id') or it.get('product_id')
    try:
        req = urllib.request.Request(it['url'], headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'Accept': 'image/*,*/*'})
        data = urllib.request.urlopen(req, timeout=40).read()
        im = Image.open(io.BytesIO(data)); im.load()
        src = f'/work/shadefix/src/{key}.png'
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA'); base = Image.new('RGBA', im.size, (255, 255, 255, 255)); base.alpha_composite(im); im = base
        im.convert('RGB').save(src)
        out = f'/work/shadefix/out/{key}.jpg'
        r = process(src, out, True)
        if r['action'] != 'process':
            Image.open(src).convert('RGB').save(out, quality=92)
        res.append(dict(key=key, kind='shade' if it.get('shade_id') else 'product', w=im.width, h=im.height, **{k: r.get(k) for k in ('action', 'reason')}))
    except Exception as e:
        res.append(dict(key=key, error=str(e)[:150]))
json.dump(res, open('/work/shadefix/prep.json', 'w'), indent=1)
print(sum('error' not in r for r in res), 'ok of', len(res))
