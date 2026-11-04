# QA contact sheets: python qa.py subset.jsonl prefix  -> /work/qa/<prefix>_<page>.jpg (40 before|after pairs, labelled by index)
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
res = [json.loads(l) for l in open(sys.argv[1])]; prefix = sys.argv[2]
items = {i['id']: i for i in json.load(open('/work/work_items.json'))}
os.makedirs('/work/qa', exist_ok=True)
T = 150; cols = 5; f = ImageFont.load_default()
for page in range(0, len(res), 40):
    ch = res[page:page + 40]; R = (len(ch) + cols - 1) // cols
    s = Image.new('RGB', (cols * (2 * T + 12), R * (T + 16)), (150, 150, 155)); d = ImageDraw.Draw(s)
    for k, r in enumerate(ch):
        x = (k % cols) * (2 * T + 12); y = (k // cols) * (T + 16)
        src = '/media/' + items[r['id']]['rel'] + '.webp'
        if not os.path.exists(src): src = src[:-5] + '.jpg'
        try:
            a = Image.open(src).convert('RGB'); a.thumbnail((T, T)); s.paste(a, (x, y + 14))
        except Exception: pass
        o = '/work/out/' + r['id'] + '.jpg'
        if os.path.exists(o):
            b = Image.open(o); b.thumbnail((T, T)); s.paste(b, (x + T + 2, y + 14))
        d.text((x + 2, y + 1), f"#{page + k}  {r['reason'][:10]} {'P' if r['primary'] else 's'}", fill=(0, 0, 0), font=f)
    s.save(f'/work/qa/{prefix}_{page // 40:02d}.jpg', quality=75)
print(prefix, len(res))
