# Build the Catrice import/restructure plan from the stock file, DB state, POS snapshot and official catrice.eu data.
import json, re
from collections import defaultdict

rows = [l.rstrip('\n').split('\t') for l in open('rows.tsv')]
FILE = [r[0] for r in rows]
snap = {}
for l in open('snap.txt'):
    b, n, p, op, d, s = l.rstrip('\n').split('|')
    snap[b] = dict(price=int(p), originalPrice=int(op), discountPercent=int(d), stock=int(s))
qty = {r[0]: int(float(r[2] or 0)) for r in rows}
for l in open('db.txt'):
    f = l.rstrip('\n').split('|')
    if f[2] in qty and f[2] not in snap and int(f[5] or 0) > 0:
        snap[f[2]] = dict(price=int(f[5]), originalPrice=int(f[5]), discountPercent=0, stock=qty[f[2]])
print('no snapshot:', [b for b in qty if b not in snap])
meta = json.load(open('meta.json'))
proc = json.load(open('proc.json'))

prod = {}
for l in open('prods.txt'):
    f = l.rstrip('\n').split('|')
    prod[f[0]] = dict(id=f[0], barcode=f[1], nameAr=f[2], nameEn=f[3], cat=f[4], sub=f[5], ter=f[6], slug=f[8])
shades = defaultdict(list)
for l in open('shades_full.txt'):
    f = l.rstrip('\n').split('|')
    shades[f[1]].append(dict(id=f[0], productId=f[1], barcode=f[2], name=f[3], hex=f[4], imageId=f[5], position=int(f[6]), isActive=f[7] == 't'))
pimgs = defaultdict(list)
for l in open('pimgs.txt'):
    f = l.rstrip('\n').split('|')
    pimgs[f[0]].append(dict(mediaId=f[1], position=int(f[2])))

shade_by_bc = {s['barcode']: s for ss in shades.values() for s in ss if s['barcode']}
prod_by_bc = {p['barcode']: p for p in prod.values() if p['barcode']}

# merged product lines: target ← sources (singles that are really shades of the target line)
MERGE = {
    'b9cc2374-0426-4828-ba20-d0f783bad473': ['24c10ea6-fd81-4ca0-8af3-356d7218b5ad', 'bc624d70-7514-4c37-8268-8cdc630696b9'],
    '70730423-e5ac-448d-9bbe-5dc325ea8e8c': ['9a00e3e3-35aa-4f95-b047-22b0e2b7a619', '53106e0d-a841-433b-b6a4-aad270a4b738'],
    '7e0d7d21-b9a8-4a58-a803-a105cd4e3482': ['a8e2fd41-7649-4b5a-8cb0-ae1d8d4a7080', '7dd07159-423f-4e9b-9d21-3543bf3700d4', 'd28e1783-10c5-4279-8f0a-05848edbdef8'],
    '82ac711d-8219-4c2e-802a-48266a6e78e6': ['2ce010ef-1a69-4d91-be0b-4a9ddc86febc'],
    '71fbb592-d8e4-4b4e-b8a0-ce70fa7b70b9': ['d2230022-83f7-4ac9-af30-6458ce8f2f07'],
    '666d5dcc-323c-45f5-9243-3b67718443e2': ['a7eaeec3-91a2-4a93-8750-78d7c169355e'],
    'f5ea7019-15e7-4d1c-8864-ca4a6ecf711f': ['5a494bdf-b2cd-4b39-8fab-9518b2bdb22c'],
    '6cb8b5d4-78b0-4c40-b24a-452edba30e07': ['47d76588-dcb1-4c14-9550-8fe900bbcbbd'],
}
RENAME = {
    'b9cc2374-0426-4828-ba20-d0f783bad473': ('كاتريس ثنائي ظلال العيون ديلي ديو', 'Catrice Daily Duo Eyeshadow'),
    '82ac711d-8219-4c2e-802a-48266a6e78e6': ('كاتريس مفتّح منطقة تحت العين أندر آي برايتنر', 'Catrice Under Eye Brightener'),
    '71fbb592-d8e4-4b4e-b8a0-ce70fa7b70b9': ('كاتريس بودرة تثبيت تحت العين أندر آي برايتنر - 2.3 غ', 'Catrice Under Eye Brightener Setting Powder 2.3 g'),
    '666d5dcc-323c-45f5-9243-3b67718443e2': ('كاتريس سائل سوفت جلام فلتر', 'Catrice Soft Glam Filter Fluid'),
    'f5ea7019-15e7-4d1c-8864-ca4a6ecf711f': ('كاتريس باليت ظلال العيون تايني تريجرز', 'Catrice Tiny Treasures Eyeshadow Palette'),
}
# brand-new shades of existing shade products
ADD = {b: '429ff8fe-ba30-4150-94d6-e5a9c9e47963' for b in ['4059729356390', '4059729356437', '4059729418968', '4059729444592', '4059729514806']}
ADD.update({'4059729419637': '1093499d-21b7-4b5d-9954-433863d4ef0c', '4059729489852': '1093499d-21b7-4b5d-9954-433863d4ef0c',
            '4059729553188': '6eb92da0-a361-46ff-badb-871f253ae7a6', '4059729203274': '70730423-e5ac-448d-9bbe-5dc325ea8e8c'})
NEW_MICRO = ['4059729246455', '4059729246462']
NEW_FLAWLESS = '4059729633217'
src_to_target = {s: t for t, ss in MERGE.items() for s in ss}

def shade_name(bc, fallback):
    m = meta.get(bc)
    if not m or not m.get('num') or m['num'] == '$undefined':
        return fallback
    nm = m['cname'] if m.get('cname') and m['cname'] != '$undefined' else ''
    return f"{m['num']} {nm}".strip()

def natkey(name):
    m = re.match(r'\s*([A-Za-z]?)(\d+)', name)
    return (m.group(1).upper(), int(m.group(2))) if m else ('~', 9999)

targets = defaultdict(lambda: dict(fileShades=[], single=None))
for bc in FILE:
    if bc in NEW_MICRO or bc == NEW_FLAWLESS:
        continue
    if bc in shade_by_bc:
        s = shade_by_bc[bc]; t = src_to_target.get(s['productId'], s['productId'])
        targets[t]['fileShades'].append(dict(barcode=bc, id=s['id'] if t == s['productId'] else None, oldName=s['name'], oldHex=s['hex']))
    elif bc in prod_by_bc:
        p = prod_by_bc[bc]
        if p['id'] in src_to_target or p['id'] in MERGE:
            t = src_to_target.get(p['id'], p['id'])
            targets[t]['fileShades'].append(dict(barcode=bc, id=None, oldName=p['nameEn'], oldHex='#C8A88E'))
        else:
            targets[p['id']]['single'] = bc
    elif bc in ADD:
        targets[ADD[bc]]['fileShades'].append(dict(barcode=bc, id=None, oldName='', oldHex='#999999'))
    else:
        raise SystemExit('unmapped ' + bc)

plan = dict(products=[], deactivate=[], files=set())
for pid, t in targets.items():
    p = prod[pid]
    out = dict(id=pid, slug=p['slug'], rename=RENAME.get(pid))
    if t['fileShades']:
        fileBc = {fs['barcode'] for fs in t['fileShades']}
        sh = []
        for fs in t['fileShades']:
            bc = fs['barcode']; pr = proc.get(bc, {})
            img = pr.get('shade')
            if img: plan['files'].add(img)
            sh.append(dict(id=fs['id'], barcode=bc, name=shade_name(bc, re.sub(r'^.*?(\d{2,3}\s*\w*)$', r'\1', fs['oldName']) or fs['oldName']),
                           colorHex=pr.get('hex') or fs['oldHex'], img=img, isActive=True, **snap[bc]))
        # keep the product's other (out-of-file) shades as they are, only re-ordered
        for s in shades.get(pid, []):
            if s['barcode'] not in fileBc:
                sh.append(dict(id=s['id'], barcode=s['barcode'], name=s['name'], keep=True))
        sh.sort(key=lambda s: natkey(s['name']))
        for i, s in enumerate(sh): s['position'] = i
        out['shades'] = sh
        live = [s for s in sh if not s.get('keep')]
        lead = next((s for s in live if s['stock'] > 0), live[0])
        out['primary'] = lead['img']
        tex = next((proc.get(s['barcode'], {}).get('texture') for s in [lead] + live if proc.get(s['barcode'], {}).get('texture')), None)
    else:
        bc = t['single']; pr = proc.get(bc, {})
        out['single'] = dict(barcode=bc, **snap[bc])
        out['primary'] = pr.get('shade')
        tex = pr.get('texture')
    out['texture'] = tex
    for f in (out['primary'], tex):
        if f: plan['files'].add(f)
    out['extras'] = [im['mediaId'] for im in sorted(pimgs.get(pid, []), key=lambda x: x['position'])][1 if out['primary'] else 0:]
    plan['products'].append(out)
for t, ss in MERGE.items():
    plan['deactivate'] += ss

# brand-new products
plan['new'] = [
    dict(slug='catrice-micro-slim-eye-pencil-waterproof', sku='CAT-MICRO-SLIM-WP', nameAr='كاتريس - قلم كحل مايكرو سليم مقاوم للماء', nameEn='Catrice Micro Slim Eye Pencil Waterproof',
         descriptionAr='قلم كحل مقاوم للماء من كاتريس برأس فائق النحافة لرسم خطوط دقيقة جداً على الجفن.\n\n• رأس رفيع جداً لخطوط دقيقة وأنيقة.\n• تركيبة مقاومة للماء تدوم طويلاً.\n• ألوان غنية عالية التصبّغ.\n• مناسب للخط العلوي والسفلي ولإطلالة التايت لاين.\n• نباتي وخالٍ من القسوة على الحيوانات.',
         descriptionEn='Waterproof eye pencil with an ultra-fine tip for super-precise lines.\n\n• Ultra-fine tip for precise, elegant lines.\n• Long-lasting waterproof formula.\n• Highly pigmented shades.\n• Suits upper and lower lash lines and tightlining.\n• Vegan and cruelty-free.',
         cat='d3c24d19-dde5-41e5-b0a9-bede45393795', sub='be0ba95f-62a6-4245-8012-5f6943ea5cab', ter='c8866117-67e0-4509-a887-60100775524b',
         shades=[dict(barcode=b, name=n, colorHex=proc[b]['hex'], img=proc[b]['shade'], **snap[b]) for b, n in [('4059729246455', '010 Black Perfection'), ('4059729246462', '020 Grey Definition')]]),
    dict(slug='catrice-flawless-fusion-dual-phase-primer-c010', sku='CAT-FLAWLESS-FUSION-C010', barcode=NEW_FLAWLESS, nameAr='كاتريس - برايمر فلوليس فيوجن ثنائي الطور C010',
         nameEn='Catrice Flawless Fusion Dual-Phase Primer C010',
         descriptionAr='برايمر ثنائي الطور من كاتريس يجمع بين طبقتين في عبوة واحدة لتحضير البشرة قبل المكياج.\n\n• يُرجّ قبل الاستخدام لدمج الطورين.\n• يمنح البشرة ملمساً ناعماً وإشراقة طبيعية.\n• يساعد على ثبات المكياج لفترة أطول.\n• خفيف على البشرة ومناسب للاستخدام اليومي.\n• يُطبّق على بشرة نظيفة قبل كريم الأساس.',
         descriptionEn='Dual-phase primer that combines two layers in one bottle to prep the skin before make-up.\n\n• Shake before use to mix both phases.\n• Leaves skin smooth with a natural radiance.\n• Helps make-up last longer.\n• Lightweight for everyday use.\n• Apply to clean skin before foundation.',
         cat='d3c24d19-dde5-41e5-b0a9-bede45393795', sub='2bbecee1-084d-446c-b4fd-65f769130de9', ter='d179ae24-9cf5-4a70-8dbd-bedd0cfbef0b',
         img=proc[NEW_FLAWLESS]['shade'], texture=proc[NEW_FLAWLESS].get('texture'), **snap[NEW_FLAWLESS]),
]
for n in plan['new']:
    for s in n.get('shades', []): plan['files'].add(s['img'])
    for k in ('img', 'texture'):
        if n.get(k): plan['files'].add(n[k])
plan['files'] = sorted(plan['files'])
json.dump(plan, open('plan.json', 'w'), ensure_ascii=False, indent=1)
fileCovered = sum(len([s for s in p.get('shades', []) if not s.get('keep')]) + (1 if p.get('single') else 0) for p in plan['products']) + 3
print('products', len(plan['products']), 'deactivate', len(plan['deactivate']), 'files', len(plan['files']), 'barcodes covered', fileCovered, '/', len(FILE))
print('no primary:', [p['slug'] for p in plan['products'] if not p['primary']])
