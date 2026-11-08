# Generates plan.json for beauty-spell from current.json (keeps full payloads, swaps images to @img: refs).
import json, os, copy
HERE = os.path.dirname(os.path.abspath(__file__))
cur = json.load(open(f'{HERE}/current.json'))
B = {b['id'][:8]: b for b in cur['blocks']}
MAKEUP = 'd3c24d19-dde5-41e5-b0a9-bede45393795'
DEB = 'brand-1784986563282'

banners = [
    {'img': 'h01_rybella.jpg', 'title': 'ريبيلا — Nude, redefined', 'linkType': 'brand', 'linkValue': 'rybella'},
    {'ref': '2c8043c1'},  # GRIGI — Black & Berry (owner-approved editorial)
    {'ref': '98673f25'},  # RYBELLA — Black Friday 40%
    {'ref': 'd6f0807e'},  # GRIGI — 50% off
    {'ref': '229a5613'},  # Deborah — Black Friday
    {'img': 'h03_huda.jpg', 'title': 'هدى بيوتي — Empowered', 'linkType': 'brand', 'linkValue': 'huda-beauty'},
    {'ref': '105ede56'},  # Rose Berry — Royal look box
    {'img': 'h04_deborah.jpg', 'title': 'ديبورا — Made in Milano', 'linkType': 'brand', 'linkValue': DEB},
    {'ref': 'd7a32051'},  # Anastasia — new in
    {'img': 'h05_catrice.jpg', 'title': 'كاتريس — Bold, by nature', 'linkType': 'brand', 'linkValue': 'catrice'},
    {'ref': '397daa8e'},  # Rose Berry — pink edition
    {'img': 'h07_maybelline.jpg', 'title': 'ميبيلين — New York, in colour', 'linkType': 'brand', 'linkValue': 'maybelline'},
    {'img': 'h06_essence.jpg', 'title': 'إيسنس — Volume, extreme', 'linkType': 'brand', 'linkValue': 'essence'},
    {'ref': '1c387d5c'},  # Rose Berry — Blooming Bouquet
    {'img': 'h08_mufe.jpg', 'title': 'ميك أب فور إيفر — Skin, by artists', 'linkType': 'brand', 'linkValue': 'make-up-for-ever'},
    {'img': 'h10_sheglam.jpg', 'title': 'شيغلام — Bloom, beautifully', 'linkType': 'brand', 'linkValue': 'sheglam'},
    {'img': 'h09_astra.jpg', 'title': 'أسترا — Winter, glittered', 'linkType': 'brand', 'linkValue': 'astra'},
]

def room(ref, img):
    ch = copy.deepcopy(B[ref]['payload']['children'])
    assert ch[0]['type'] == 'CUSTOM_BANNER', ref
    ch[0]['payload']['imageId'] = f'@img:{img}'
    return {'ref': ref, 'patch': {'children': ch}}

def item(img, lt, lv):
    return {'title': '', 'imageId': f'@img:{img}', 'titleEn': '', 'linkType': lt, 'linkValue': lv, 'subtitleEn': ''}

# spotlight wall (12 portrait cards)
spot = [('c_rybella', 'rybella'), ('c_grigi', 'grigi'), ('c_huda', 'huda-beauty'), ('c_maybelline', 'maybelline'),
        ('c_deborah', DEB), ('c_catrice', 'catrice'), ('c_essence', 'essence'), ('c_sheglam', 'sheglam'),
        ('c_abh', 'anastasia-beverly-hills'), ('c_mufe', 'make-up-for-ever'), ('c_nyx', 'nyx'), ('c_astra', 'astra')]
spot_items = [item(f'{a}.jpg', 'brand', b) for a, b in spot]

# looks group: keep each look's product links, swap images; budget strip re-skinned
lk = copy.deepcopy(B['89b711c9']['payload']['children'])
for it, img in zip(lk[0]['payload']['items'], ['l1_night', 'l2_soft', 'l3_smoky', 'l4_glow', 'l5_bride']):
    it['imageId'] = f'@img:{img}.jpg'
lk[1]['payload']['imageId'] = '@img:s_budget.jpg'; lk[1]['payload']['bannerAspect'] = 3.58

# shop-by tiles (9, grid of 3)
tiles = [('t_lips', 'subcategory', '56da5b82-c847-4e9b-9cea-cc901236189f'), ('t_eyes', 'subcategory', 'be0ba95f-62a6-4245-8012-5f6943ea5cab'),
         ('t_face', 'subcategory', '2bbecee1-084d-446c-b4fd-65f769130de9'), ('t_cheeks', 'subcategory', '7b95190f-d5b7-4dff-8456-3c6d10fdafe6'),
         ('t_brows', 'subcategory', '92ebe64a-9091-4460-9f12-68ecbdf4e1e9'), ('t_glow', 'subcategory', '774d62c3-8119-4c0c-983b-2513fc46df24'),
         ('t_lashes', 'tertiary', 'e1032b57-c1af-49e3-a408-130468f22736'), ('t_nails', 'subcategory', '335e8fa7-2ab1-4a3d-894e-607c434898b5'),
         ('t_brushes', 'subcategory', 'c7a90d6f-6fd4-40df-9b02-4cb33b8efce1')]
tile_items = [item(f'{a}.jpg', b, c) for a, b, c in tiles]

delivery = {'new': 'bs-w5-delivery-strip', 'type': 'CUSTOM_BANNER', 'title': 'توصيل مجاني فوق ٥٠ ألف',
            'payload': {'source': 'inline', 'textEn': '', 'imageId': '@img:s_delivery.jpg', 'labelEn': '', 'titleEn': '',
                        'linkType': 'category', 'linkValue': MAKEUP, 'showTitle': False, 'subtitleEn': '', 'showViewAll': False,
                        'bannerAspect': 3.58, 'sectionLayout': 'full'}}

blocks = [
    {'ref': 'f52ab320'},                      # Black Friday marquee strip (owner promo)
    {'ref': '3f03e5e6'},                      # post-BF strip (visibleFrom 28 Nov)
    {'ref': 'cfa14acf'},                      # RYBELLA Black Friday group (owner)
    {'ref': 'a232ceca'},                      # Deborah Black Friday group (owner)
    {'ref': '07fb847f'},                      # Rose Berry gift boxes (owner)
    room('9bd4e9cd', 'r_rybella.jpg'),        # RYBELLA room
    room('26b2c8ba', 'r_grigi.jpg'),          # GRIGI room
    {'ref': '5e746e39', 'patch': {'items': spot_items}},   # Brand spotlight wall
    {'ref': '30db6b4e'},                      # Flash deals
    {'ref': '8404f661'},                      # Anastasia new-in group (owner)
    {'ref': '135282e0', 'patch': {'items': tile_items}},   # اختاري لمستك
    {'ref': '60a2253e'},                      # Lips list
    room('aa2e74da', 'r_maybelline.jpg'),
    {'ref': '89b711c9', 'patch': {'children': lk}},        # إطلالات الموسم + budget strip
    {'ref': 'a70fd02f'},                      # Eyes list
    room('6a30873f', 'r_deborah.jpg'),
    room('bed123ac', 'r_huda.jpg'),
    {'ref': '00070af7'},                      # Face list
    room('9075fffc', 'r_catrice.jpg'),
    room('d686fe03', 'r_sheglam.jpg'),
    delivery,
    room('7f51301a', 'r_essence.jpg'),
    room('1f7edf96', 'r_astra.jpg'),
    room('4deb3a52', 'r_mufe.jpg'),
    room('5ed21142', 'r_nyx.jpg'),
    room('ce951b11', 'r_artdeco.jpg'),
    {'ref': '32141870'},                      # KOST list
    {'ref': '87c31f33'},                      # All makeup brands
]
plan = {'world': 'beauty-spell', 'banners': banners, 'blocks': blocks}
# sanity: every @img exists, every ref resolves uniquely
s = json.dumps(plan)
import re
imgs = set(re.findall(r'@img:([\w.-]+)', s)) | {b['img'] for b in banners if 'img' in b}
missing = [i for i in imgs if not os.path.exists(f'{HERE}/img/{i}')]
assert not missing, missing
bids = [b['id'] for b in cur['banners']]
for b in banners:
    if 'ref' in b: assert sum(x.startswith(b['ref']) for x in bids) == 1, b
for b in blocks:
    if 'ref' in b: assert sum(x['id'].startswith(b['ref']) for x in cur['blocks']) == 1, b
json.dump(plan, open(f'{HERE}/plan.json', 'w'), ensure_ascii=False, indent=1)
used = imgs; allimg = set(os.listdir(f'{HERE}/img'))
print('banners', len(banners), 'blocks', len(blocks), 'imgs used', len(used), 'unused', sorted(allimg - used))
hidden = [ (b['id'][:8], b['title']) for b in cur['blocks'] if not any('ref' in x and b['id'].startswith(x['ref']) for x in blocks)]
print('hidden blocks', hidden)
print('hidden banners', [(b['id'][:8], b['title']) for b in cur['banners'] if not any('ref' in x and b['id'].startswith(x['ref']) for x in banners)])
