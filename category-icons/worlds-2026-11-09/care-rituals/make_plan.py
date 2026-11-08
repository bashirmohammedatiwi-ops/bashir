# Generates plan.json for the care-rituals world (read by kit/publish.js).
import json, copy
from urllib.parse import quote
cur = json.load(open('current.json'))
B = {b['id'][:8]: b for b in cur['blocks']}
BR = {'evoluderm':'413cdae6-b64e-4aea-99f1-c83a80635c06','garnier':'bbc9ef55-b46e-46f7-9915-1d5d428de7f4','loreal':'7386c27c-ec13-4b5e-8dc7-cd40897cc1fd',
      'elvive':'004d02fd-4acc-4140-9e4d-0d815a964451','revuele':'6d91ef8c-bc20-4b69-8eb7-9c771b576dea'}
CAT = dict(face='07661898-571a-4a88-aa6c-76dcdbf53029', hair='150a633e-80a7-4cb3-8f2d-8eab90a99190', body='23aaaa07-91ee-4937-847e-d7866a9e937a',
           sun='25dc8086-bffa-47af-aaf7-64d503e58a9f', derma='09146169-f9c4-4649-a365-ca1b8cda365f', korean='7d2bfaec-d963-404b-b9b5-04b64a82bf29',
           hands='01ad1f0d-7c15-469c-bf86-85abd135e68f', feet='905db637-498a-49bc-83e8-b3d0a335d5b6')
ROOT = '9f99dbf3-15c4-4561-8f53-1499a8743a47'   # care root category
T_CLEANSERS, T_MOIST = '05028a17-da64-4c66-b25f-73c758acc2f8', '21801439-d0e9-4106-b5e8-dfdd70ffeb8d'
def pv(**kw):  # products linkValue
    t = kw.pop('title'); return '&'.join(f'{k}={v}' for k, v in kw.items()) + '&title=' + quote(t)
def ids(*xs): return ','.join(xs)

SERUMS = ids('69e6125b-162f-430b-a60e-8b7c2439c29c','d142f1ee-c2d1-4fdc-ad94-7ab0d367b2d4','d844e523-660f-411f-9405-eceeb55a14ef','02270f2b-29b4-4467-a079-315f18ce2def',
             '19eb36fb-95ff-4975-a487-21a137a66e6a','b6461cc0-81fe-430c-9149-c88a0a320418','beab48e7-2b7d-4076-af0e-c095e6e8f092','a93e1301-7647-49c0-bbeb-dac203855b9b',
             'f6b27628-f360-4a46-824a-ae1b53955a98','c734475a-1624-4f6a-ada6-2a9b3e1a4610','7be58d75-c9b3-40ac-ae2f-f54c3a6910df','ceb69a7d-ab85-4994-b3bd-d83e912be12c')
AGEING = ids('68f45b9d-a8c4-4692-bc10-b7ee895167cc','806d570c-c835-4112-92e7-87467cb127b8','ae7313cc-6bef-4a6f-ad02-39734278daef','daf8a835-c712-4783-bc14-fb75281f66fe',
             '4a0aea3b-6be3-40ba-9109-f6742e7d7360','80c34a01-3fb6-4a5a-9d57-3f60573652bd','230a7b0e-955c-4664-b731-d7b6d172382c','8ac195b7-b125-4cee-a10b-7daa3591b587',
             'f6b27628-f360-4a46-824a-ae1b53955a98','b4d85fbb-9683-411c-9344-242d14f305b9','88a51430-52e0-49b8-a24e-b06647e290ee','9f505772-f6f5-48a7-8419-57beae0e7b1e')
HAIRFALL = ids('54567a7c-eb22-4d72-816a-ad6bf5afd76e','3938ec4f-ddf2-4e44-be9d-8a412d91e79e','c0623284-f30b-4d12-98a9-f892f757f97d','9d5f3633-a3fa-4e54-9329-2607d131cd90',
               'ef0d7038-f8de-443e-b8d1-096dc5c533c5','a1e0b6c7-3001-4696-9f94-00fb99bfc14e','a624909c-96ae-491a-bb07-7610d4cb6833','3923d90f-987c-4b56-b068-e484f0f1a5ac',
               '5a83378b-c004-4759-9a71-56df3757c694','f6148d76-d432-42df-9904-03b6fbd28bd9','cd9185a1-beb8-4525-bf4b-37230c218341','840de7f3-8289-4805-b9a3-31fc653e4639',
               'd29c5db0-b66d-436c-9a19-6bb5bf75291c','616b25d5-6c2b-48a8-aa4b-872d975b3698')

def item(img, lt, lv): return {'title': '', 'titleEn': '', 'subtitleEn': '', 'imageId': f'@img:{img}.jpg', 'linkType': lt, 'linkValue': lv}
def wall(items, title_en, aspect, display, subtitle='', subtitle_en='', **kw):
    p = {'gap': 10, 'items': items, 'textEn': '', 'labelEn': '', 'titleEn': title_en, 'subtitle': subtitle, 'subtitleEn': subtitle_en,
         'showTitle': True, 'showShadow': False, 'display': display, 'aspectRatio': aspect, 'borderStyle': 'none', 'overlayStyle': 'none',
         'showViewAll': False, 'tileCornerRadius': 16}
    p.update(kw); return p
def reskin(ref, img):
    ch = copy.deepcopy(B[ref]['payload']['children'])
    assert ch[0]['type'] == 'CUSTOM_BANNER'
    ch[0]['payload']['imageId'] = f'@img:{img}.jpg'; ch[0]['payload']['bannerAspect'] = 2.15
    return {'ref': ref, 'patch': {'children': ch}}
def strip_block(key, title, img, lt, lv):
    return {'new': key, 'type': 'CUSTOM_BANNER', 'title': title, 'payload': {'source': 'inline', 'imageId': f'@img:{img}.jpg', 'linkType': lt, 'linkValue': lv,
            'showTitle': False, 'showViewAll': False, 'bannerAspect': 3.58, 'sectionLayout': 'full', 'textEn': '', 'labelEn': '', 'titleEn': '', 'subtitleEn': ''}}
def room(key, title, title_en, img, lt, lv, bg, tc, list_title, brand):
    return {'new': key, 'type': 'SECTION_GROUP', 'title': title, 'payload': {
        'shadow': False, 'textEn': '', 'labelEn': '', 'pattern': 'none', 'titleEn': title_en, 'paddingH': 12, 'showTitle': False,
        'paddingTop': 16, 'paddingBottom': 18, 'subtitleEn': '', 'backgroundColor': bg, 'titleColor': tc,
        'children': [
            {'type': 'CUSTOM_BANNER', 'title': '', 'titleEn': '', 'payload': {'source': 'inline', 'textEn': '', 'imageId': f'@img:{img}.jpg', 'labelEn': '', 'titleEn': '',
             'linkType': lt, 'linkValue': lv, 'showTitle': False, 'subtitleEn': '', 'showViewAll': False, 'bannerAspect': 2.15, 'sectionLayout': 'full'}},
            {'type': 'PRODUCT_LIST', 'title': list_title, 'titleEn': '', 'payload': {'limit': 14, 'filter': 'all', 'brandId': brand, 'showTitle': True,
             'titleColor': tc, 'showViewAll': True, 'sectionLayout': 'carousel', 'textEn': '', 'labelEn': '', 'titleEn': '', 'subtitleEn': ''}}]}}

banners = [
 {'img': 'hero_evoluderm.jpg', 'title': 'إيفولوديرم — طقوس الشعر الفرنسية', 'linkType': 'products', 'linkValue': pv(brandId=BR['evoluderm'], title='إيفولوديرم الفرنسية')},
 {'ref': 'afdd83f4'},  # Lierac — Black Friday (until 28 Nov)
 {'img': 'hero_lrp.jpg', 'title': 'لاروش بوزيه — أنثيليوس', 'linkType': 'brand', 'linkValue': 'la-roche-posay'},
 {'ref': 'dd14db1b'},  # Bioderma — BF
 {'img': 'hero_cerave.jpg', 'title': 'سيرافي — غسول الأطباء', 'linkType': 'brand', 'linkValue': 'cerave'},
 {'ref': 'bb00fa76'},  # Phyto — BF
 {'img': 'hero_kbeauty.jpg', 'title': 'العناية الكورية — Seoul Glow', 'linkType': 'subcategory', 'linkValue': CAT['korean']},
 {'ref': '5f58fcf5'},  # Beesline — BF
 {'img': 'hero_garnier.jpg', 'title': 'غارنييه — فيتامين سي', 'linkType': 'brand', 'linkValue': 'garnier'},
 {'ref': 'bd70a648'},  # Revox — BF
 {'img': 'hero_eucerin.jpg', 'title': 'يوسيرين — أنتي بيغمنت', 'linkType': 'brand', 'linkValue': 'eucerin'},
 {'ref': 'ea82b5c8'},  # Dermolab — BF
 {'img': 'hero_loreal.jpg', 'title': 'لوريال باريس — ريفيتاليفت', 'linkType': 'products', 'linkValue': pv(brandId=BR['loreal'], subcategoryId=CAT['face'], title='لوريال باريس — العناية بالبشرة')},
 {'img': 'hero_elvive.jpg', 'title': 'إلفيف — غلايكوليك غلوس', 'linkType': 'brand', 'linkValue': 'loreal-paris-elvive'},
 {'img': 'hero_ordinary.jpg', 'title': 'ذا أورديناري — Clinical. Honest.', 'linkType': 'brand', 'linkValue': 'the-ordinary'},
]

cards = [('card_evoluderm','evoluderm'),('card_lrp','la-roche-posay'),('card_garnier','garnier'),('card_boj','beauty-of-joseon'),('card_anua','anua'),
         ('card_eucerin','eucerin'),('card_kerastase','kerastase'),('card_ordinary','the-ordinary'),('card_nivea','nivea'),('card_vichy','vichy'),
         ('card_elvive','loreal-paris-elvive'),('card_lierac','lierac')]
need = [('tile_face','subcategory',CAT['face']),('tile_hair','subcategory',CAT['hair']),('tile_body','subcategory',CAT['body']),('tile_sun','subcategory',CAT['sun']),
        ('tile_derma','subcategory',CAT['derma']),('tile_korean','subcategory',CAT['korean']),('tile_hands','subcategory',CAT['hands']),('tile_feet','subcategory',CAT['feet'])]
routine = [('tile_r_cleanse','tertiary',T_CLEANSERS),('tile_r_treat','products',pv(ids=SERUMS, title='الخطوة 2 — سيرومات وعلاجات')),
           ('tile_r_moist','tertiary',T_MOIST),('tile_r_protect','subcategory',CAT['sun'])]
concerns = [('tile_c_acne','skinConcern','acne'),('tile_c_spots','skinConcern','pigmentation'),('tile_c_dry','skinConcern','dryness'),
            ('tile_c_age','products',pv(ids=AGEING, title='مكافحة علامات التقدّم بالعمر')),('tile_c_hairfall','products',pv(ids=HAIRFALL, title='علاج تساقط الشعر'))]

blocks = [
 {'ref': '7ca9b92e'},                       # BF promo strip (visibleUntil 28 Nov)
 {'ref': 'a19ad0b8'},                       # post-BF promo strip (visibleFrom 28 Nov)
 reskin('f1d237b1', 'room_evoluderm'),      # Evoluderm exclusive world — leads
 {'ref': '2f695dff'},                       # Black Friday group (owner campaign, untouched)
 {'new': 'care5-spotlight', 'type': 'PHOTO_WALL', 'title': 'براندات نحبّها',
  'payload': wall([item(c, 'brand', s) for c, s in cards], 'Brands we love', '4:5', 'scroll', 'مختارات من أهم دور العناية في العالم',
                  'The world’s leading care houses', tilesPerView=1.6)},
 {'ref': '934d2533'},                       # promo product list (flash deals)
 {'new': 'care5-routine', 'type': 'PHOTO_WALL', 'title': 'روتينكِ في أربع خطوات',
  'payload': wall([item(i, lt, lv) for i, lt, lv in routine], 'Your 4-step routine', '1:1', 'grid', 'تنظيف • علاج • ترطيب • حماية',
                  'Cleanse • Treat • Moisturise • Protect', sectionLayout='grid2')},
 {'ref': '73cbc22e', 'patch': {'items': [item(i, lt, lv) for i, lt, lv in need], 'display': 'scroll', 'tilesPerView': 2.4, 'aspectRatio': '1:1'}},
 reskin('fe88c58e', 'room_face'),
 strip_block('care5-strip-sun', 'واقي الشمس', 'strip_sun', 'subcategory', CAT['sun']),
 {'new': 'care5-concerns', 'type': 'PHOTO_WALL', 'title': 'حسب احتياجكِ',
  'payload': wall([item(i, lt, lv) for i, lt, lv in concerns], 'Shop by concern', '1:1', 'scroll', 'حلول مختارة لكل مشكلة', 'Targeted solutions', tilesPerView=2.4)},
 room('care5-room-garnier', 'غارنييه', 'Garnier', 'room_garnier', 'brand', 'garnier', '#FDF0F6', '#7A1F4E', 'الأكثر طلباً من غارنييه', BR['garnier']),
 reskin('95ec1719', 'room_hair'),
 room('care5-room-elvive', 'إلفيف', 'Elvive', 'room_elvive', 'brand', 'loreal-paris-elvive', '#FBF1E6', '#5A2E0E', 'الأكثر طلباً من إلفيف', BR['elvive']),
 reskin('1af80d62', 'room_korean'),
 strip_block('care5-strip-budget', 'عناية بأقل من 15,000 د.ع', 'strip_budget', 'products', pv(maxPrice=15000, categoryId=ROOT, title='عناية بأقل من 15,000 د.ع')),
 reskin('bacd865c', 'room_derma'),
 room('care5-room-revuele', 'ريفويل', 'Revuele', 'room_revuele', 'brand', 'revuele', '#EEF7F2', '#0F4D3A', 'الأكثر طلباً من ريفويل', BR['revuele']),
 reskin('eb197374', 'room_body'),
 reskin('f6c1159a', 'room_sun'),
 strip_block('care5-strip-delivery', 'أصلي 100% — توصيل مجاني فوق 50,000 د.ع', 'strip_delivery', 'products', pv(categoryId=ROOT, title='طقوس العناية')),
 {'ref': 'd1539da4'},                       # all care brands (logos)
]
json.dump({'world': 'care-rituals', 'banners': banners, 'blocks': blocks}, open('plan.json', 'w'), ensure_ascii=False, indent=1)
# sanity
import os, re
s = json.dumps(blocks) + json.dumps(banners)
imgs = set(re.findall(r'@img:([\w.-]+)', s)) | {b['img'] for b in banners if 'img' in b}
miss = [i for i in imgs if not os.path.exists('img/' + i)]
print('images referenced', len(imgs), 'missing', miss, 'unused', sorted(set(os.listdir('img')) - imgs))
for b in banners + blocks:
    r = b.get('ref')
    if r: assert sum(x['id'].startswith(r) for x in cur['blocks'] + cur['banners']) == 1, r
print('banners', len(banners), 'blocks', len(blocks))
