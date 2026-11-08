import json, os, urllib.parse
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
cur = json.load(open(f'{D}/current.json')); fam = json.load(open(f'{D}/families.json')); BID = json.load(open(f'{D}/brand_ids.json'))
CAT = '975e0e23-edd2-4181-ad6d-ecade6452b95'
SUB = {'her': '1ba9f472-af81-4708-9304-07f3435b6b24', 'him': '8dca642a-1194-4101-b5cc-486ca1664e89', 'unisex': 'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a',
       'niche': '92a95f2e-d855-4943-9875-b85e684f746a', 'gift': '13754665-184a-48c6-8dd3-b36b9c0e5f28', 'body': '453c027d-0022-455b-91a9-d4299479ec62'}
# ---- jpg export ----
os.makedirs(f'{D}/img', exist_ok=True)
for f in sorted(os.listdir(f'{D}/out')):
    if not f.endswith('.png') or f.startswith('_'): continue
    im = Image.open(f'{D}/out/{f}').convert('RGB'); o = f'{D}/img/{f[:-4]}.jpg'; q = 90
    while True:
        im.save(o, quality=q, optimize=True, progressive=True)
        if os.path.getsize(o) <= 1.5e6 or q <= 70: break
        q -= 4
def ids(k, title):
    return 'ids=' + ','.join(fam[k]) + '&title=' + urllib.parse.quote(title)
def item(img, lt, lv): return {'title': '', 'imageId': f'@img:{img}.jpg', 'titleEn': '', 'linkType': lt, 'linkValue': lv, 'subtitleEn': ''}
def banner(img, lt, lv, aspect=2.15):
    return {'source': 'inline', 'textEn': '', 'imageId': f'@img:{img}.jpg', 'labelEn': '', 'titleEn': '', 'linkType': lt, 'linkValue': lv,
            'showTitle': False, 'subtitleEn': '', 'showViewAll': False, 'bannerAspect': aspect, 'sectionLayout': 'full'}
def room(key, title, titleEn, img, slug, bg):
    return {'new': key, 'type': 'SECTION_GROUP', 'title': title, 'payload': {
        'shadow': False, 'textEn': '', 'labelEn': '', 'pattern': 'none', 'titleEn': titleEn, 'paddingH': 12, 'showTitle': False, 'paddingTop': 18,
        'subtitleEn': '', 'paddingBottom': 16, 'backgroundColor': bg,
        'children': [{'type': 'CUSTOM_BANNER', 'title': '', 'payload': banner(img, 'brand', slug), 'titleEn': ''},
                     {'type': 'PRODUCT_LIST', 'title': '', 'payload': {'limit': 12, 'filter': 'all', 'textEn': '', 'brandId': BID[slug], 'labelEn': '', 'titleEn': '',
                      'showTitle': False, 'categoryId': CAT, 'subtitleEn': '', 'showViewAll': True}, 'titleEn': ''}]}}
def reskin(ref, img, slug, bg):
    b = next(x for x in cur['blocks'] if x['id'].startswith(ref)); ch = json.loads(json.dumps(b['payload']['children']))
    ch[0]['payload'] = banner(img, 'brand', slug)
    return {'ref': ref, 'patch': {'children': ch, 'backgroundColor': bg}}
def strip(key, title, img, lt, lv):
    return {'new': key, 'type': 'CUSTOM_BANNER', 'title': title, 'payload': banner(img, lt, lv, 3.58)}

banners = [
 {'img': 'hero01_dior_jadore.jpg', 'title': "ديور — جادور", 'linkType': 'brand', 'linkValue': 'christian-dior'},
 {'img': 'hero02_ch_goodgirl.jpg', 'title': 'كارولينا هيريرا — غود غيرل', 'linkType': 'brand', 'linkValue': 'carolina-herrera'},
 {'img': 'hero03_chanel_coco.jpg', 'title': 'شانيل — كوكو مدموزيل', 'linkType': 'brand', 'linkValue': 'chanel'},
 {'img': 'hero04_armani_si.jpg', 'title': 'أرماني — سي باسيوني', 'linkType': 'brand', 'linkValue': 'giorgio-armani'},
 {'img': 'hero05_dior_sauvage.jpg', 'title': 'ديور — سوفاج', 'linkType': 'brand', 'linkValue': 'christian-dior'},
 {'img': 'hero06_ysl_opium.jpg', 'title': 'إيف سان لوران — بلاك أوبيوم', 'linkType': 'brand', 'linkValue': 'yves-saint-laurent'},
 {'img': 'hero07_lancome_lveb.jpg', 'title': 'لانكوم — لا في إي بيل', 'linkType': 'brand', 'linkValue': 'lancome'},
 {'img': 'hero08_valentino_roma.jpg', 'title': 'فالنتينو — بورن إن روما', 'linkType': 'brand', 'linkValue': 'valentino'},
 {'img': 'hero09_tomford_ombre.jpg', 'title': 'توم فورد', 'linkType': 'brand', 'linkValue': 'tom-ford'},
 {'img': 'hero10_niche_pdm.jpg', 'title': 'عطور النيش', 'linkType': 'subcategory', 'linkValue': SUB['niche']},
]
cards = [('card01_valentino', 'valentino'), ('card02_prada', 'prada'), ('card03_chanel', 'chanel'), ('card04_guerlain', 'guerlain'), ('card05_givenchy', 'givenchy'),
         ('card06_versace', 'versace'), ('card07_pdm', 'parfums-de-marly'), ('card08_xerjoff', 'xerjoff'), ('card09_montale', 'montale'), ('card10_lancome', 'lancome')]
fams = [('fam_floral', 'floral', 'عطور زهرية'), ('fam_amber', 'amber', 'عطور عنبرية شرقية'), ('fam_woody', 'woody', 'عطور خشبية'),
        ('fam_fresh', 'fresh', 'عطور منعشة'), ('fam_gourmand', 'gourmand', 'عطور حلوة غورماند'), ('fam_oud', 'oud', 'عطور العود')]
blocks = [
 {'ref': '96ceb4a2', 'title': 'بيوت العطور', 'patch': {'items': [item(c, 'brand', s) for c, s in cards], 'display': 'scroll', 'aspectRatio': '4:5', 'tilesPerView': 1.6,
   'titleEn': 'The fragrance houses', 'showShadow': False, 'gap': 12, 'tileCornerRadius': 16}},
 {'ref': 'adc2613f'},
 {'ref': '5219ea19', 'title': 'لمن العطر؟', 'patch': {'items': [item('tile_for_her', 'subcategory', SUB['her']), item('tile_for_him', 'subcategory', SUB['him']),
   item('tile_unisex', 'subcategory', SUB['unisex']), item('tile_niche', 'subcategory', SUB['niche'])], 'columns': 2, 'aspectRatio': '1:1',
   'titleEn': 'Who is it for?', 'showShadow': False, 'tileCornerRadius': 16}},
 room('scent-room-dior', 'عالم ديور', 'Dior', 'room_dior', 'christian-dior', '#F3E9E4'),
 {'ref': '83388aed'},
 room('scent-room-chanel', 'عالم شانيل', 'Chanel', 'room_chanel', 'chanel', '#E6ECF4'),
 {'new': 'scent-families', 'type': 'PHOTO_WALL', 'title': 'عائلات العطور', 'payload': {'gap': 10, 'items': [item(i, 'products', ids(k, t)) for i, k, t in fams],
   'textEn': '', 'columns': 3, 'display': 'grid', 'labelEn': '', 'titleEn': 'Scent families', 'showTitle': True, 'showShadow': False, 'subtitleEn': '',
   'aspectRatio': '1:1', 'borderStyle': 'none', 'showViewAll': False, 'overlayStyle': 'none', 'tileCornerRadius': 14}},
 reskin('73b8e5f3', 'room_ch', 'carolina-herrera', '#E9EAF4'),
 {'ref': '20ae9374'},
 room('scent-room-ysl', 'عالم إيف سان لوران', 'Yves Saint Laurent', 'room_ysl', 'yves-saint-laurent', '#F1EBE2'),
 strip('scent-strip-gifts', 'أطقم الهدايا', 'strip_gifts', 'subcategory', SUB['gift']),
 {'ref': 'b02f8b12'},
 reskin('b663d474', 'room_armani', 'giorgio-armani', '#ECEDEE'),
 {'ref': '28f2977f'},
 room('scent-room-lancome', 'عالم لانكوم', 'Lancôme', 'room_lancome', 'lancome', '#F6EAE8'),
 {'ref': 'efc67343'},
 room('scent-room-versace', 'عالم فرساتشي', 'Versace', 'room_versace', 'versace', '#F2EDE2'),
 strip('scent-strip-budget', 'فخامة بسعر أقل', 'strip_budget', 'products', f'maxPrice=60000&categoryId={CAT}&title=' + urllib.parse.quote('عطور أصلية بأقل من 60,000 د.ع')),
 room('scent-room-dg', 'عالم دولتشي آند غابانا', 'Dolce & Gabbana', 'room_dg', 'dolce--gabbana', '#F3ECE4'),
 {'ref': '4b3e1129'},
 reskin('23240bb4', 'room_tomford', 'tom-ford', '#EEEBEE'),
 room('scent-room-mancera', 'عالم مانسيرا', 'Mancera', 'room_mancera', 'mancera', '#F4EBDD'),
 {'ref': '79da637c'},
 strip('scent-strip-mists', 'معطرات الجسم والشعر', 'strip_mists', 'subcategory', SUB['body']),
 {'ref': 'eee4c280'},
 {'ref': '7c73e9da'},
 {'ref': '92da5ab6'},
]
plan = {'world': 'scent-story', 'banners': banners, 'blocks': blocks}
# sanity: every @img exists
s = json.dumps(plan)
import re
for m in set(re.findall(r'@img:([^"]+)', s)) | {b['img'] for b in banners}:
    assert os.path.exists(f'{D}/img/{m}'), m
json.dump(plan, open(f'{D}/plan.json', 'w'), ensure_ascii=False, indent=1)
print('banners', len(banners), 'blocks', len(blocks), 'imgs', len(os.listdir(f'{D}/img')))
