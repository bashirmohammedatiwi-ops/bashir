# Writes plan.json for kit/publish.js (gift-moments). Validates curated product ids against current.json (in stock).
import json, os
from urllib.parse import quote
HERE = os.path.dirname(os.path.abspath(__file__))
cur = json.load(open(HERE + '/current.json'))
STOCK = {p['id']: p['stock'] for b in cur['brands'] for p in b['top']}
IMG = set(os.listdir(HERE + '/img'))

SUB = {'women_sets': '348650b2-18de-4e95-bf8c-1af2da1ae452', 'women_perf': '1ba9f472-af81-4708-9304-07f3435b6b24',
       'men_perf': '8dca642a-1194-4101-b5cc-486ca1664e89', 'body': '453c027d-0022-455b-91a9-d4299479ec62',
       'lips': '56da5b82-c847-4e9b-9cea-cc901236189f'}
BRAND = {'chanel': 'c0758a1f-c142-4898-b3d0-1022ce36fe36', 'christian-dior': '7e22c970-a8f8-4111-925f-270181e90a29',
         'carolina-herrera': 'caa4e1d5-77d5-4078-8d89-79778c5eb6e1', 'burberry': 'b5392ac2-c401-4482-a2d7-242cef9d0467',
         'lancome': 'bca2c344-538c-4ef1-ae91-9d12f789d8fa', 'yves-saint-laurent': 'b610d576-9fb9-4b21-a6a2-74e71b471474',
         'valentino': '948a3089-eb93-4b20-bcd0-acf8c31489e2', 'paco-rabanne': '806ba075-02c2-4e0d-85d5-005817f27ce6',
         'cartier': '79a3d221-fb99-4bea-9d75-778ea757a4e4', 'tom-ford': 'e838df0d-1ea2-472e-b5e2-39a2200cfd7a',
         'dolce--gabbana': 'c9800f1c-5aff-4e86-8b0b-728660f02b68'}

def ids_link(ids, title):
    bad = [i for i in ids if STOCK.get(i, 0) < 1]
    assert not bad, (title, bad)
    return 'ids=' + ','.join(ids) + '&title=' + quote(title)
def q(title, **kw):
    return '&'.join([f'{k}={v}' for k, v in kw.items()] + ['title=' + quote(title)])
def img(n):
    assert n in IMG, n
    return '@img:' + n

MOM = ['901178c2-301f-4003-9077-e0095b907f21', '9c7d641e-8a27-41fb-8b23-4e0a175bcd98', '1d136fee-ddae-4ebf-b789-7cdc4e60e0d1',
       'b288a7c0-52c3-4fc5-a7f0-f2e2820f5cd2', '76db715d-000e-4f4e-b269-a9230664888d', '0dad4513-02c1-41d5-844a-91e5d2f6433e',
       'a2f5f89f-3505-4e70-b3ee-132a5e22494c', '5410f945-42cb-41b5-ae1e-d3dfce9da54b', '327f5b5c-1c3d-4985-832c-e973dc983d33',
       '49490b3b-79a5-4528-b7d9-34aa5bb1c81c', '9336e914-15ee-4e3b-8a6f-8b8bc53c2997', '06a08558-4dd5-47cf-9978-410eaf468b20']
BRIDE = ['ef5734cc-dfb6-430b-8c01-4d325a1b4d4f', '2919a082-f8e7-45ce-a86b-b8a45ebdd090', '427610b7-f417-40d6-9fd7-bcebb92554b8',
         '40f858b8-2d76-49e1-8799-bf78f65ae5d1', '3a31fa2f-9df8-4f5d-b6fa-0a7b9d8e9664', '074b6187-43c1-465b-9cc5-71ec0ba38f16',
         'f9193c59-a88b-4638-afd9-d8e5e945a3e8', '35035525-9726-4162-8258-68bddf0b59a4', '5d22d034-f08b-4256-9039-34a7434a6776',
         '47af59b3-f745-41b8-82c0-d4a737d6a72f', '365ab2aa-94c6-4065-b5f4-58784e7fb0eb', 'c955fa1f-3a5d-41a3-a34e-050d100456db',
         'faf02d2e-86e4-4b1e-9ad1-75844cbf44e4', 'fceb4b64-6c03-4f55-b25c-08dfada4a8df']
FRIEND = ['49caebce-e0d8-40f8-945e-fb8b13c121c2', 'f86d5a20-a8bb-4817-950a-848de9de9e2e', '3e3b97a8-0862-46b2-876a-84ca50d1d733',
          '7cd05ccc-9802-4293-8579-4bee048abf64', '47af59b3-f745-41b8-82c0-d4a737d6a72f', '3cedfe25-e337-45a3-93ab-3c6a767aa871',
          '32438eda-2a96-41de-8344-41008303eadc', '040b160a-2243-4e4f-9b36-abdce9ab63cb', 'abe3daad-b6ea-4719-a560-a6859c51cff6',
          'f05a4d51-8ad0-4db2-942b-1f7da31e120e', '45aeabe3-095e-4ca5-99d3-2b5d34e29a5e', '2d55274e-251f-4024-924c-71555aa1dcf2',
          '7dee9e9c-523f-4760-aac4-dda0a18e1b26']
BIRTHDAY = ['7e2d811b-7116-4dc9-9b32-6cb63674891c', '795eb28f-d2ce-448a-ba08-7a399a9aa654', 'f978eb70-a28f-41e4-b90e-3cbfe34e2d8a',
            'fc4a613b-4603-40ee-bdcf-10635f129714', 'b393653d-37e7-4c1e-bc7b-46fee445df98', '0dec243f-5b47-4602-9b42-618d81c9a8d9',
            '14560c30-a143-4e86-9b97-1fa1dd7249a7', '3359dd40-01b9-44f5-ae83-35dfb4231dc0', 'ac90eb07-4487-439b-b48a-b514688fca1a',
            '705eb41b-cc3b-4fce-8217-22c7c1001c6c', 'f9193c59-a88b-4638-afd9-d8e5e945a3e8', 'ed299035-4d04-4926-87d1-8085d2382fad']
EID = ['769cd4a8-a093-4946-b0d1-bf00fa753a9a', '50497d40-1360-4525-b19f-c81b4bcdb47e', 'c3da6845-f769-444e-be55-4f1e8cf0bda6',
       'd713927e-dcb9-4e5b-a5ae-234195608cb9', 'a8c9ac9e-a683-45d9-8413-571e1f74b02c', '7518ac5c-f680-43b1-8b18-002c17d0cde0',
       '2e5c22a0-32d0-45f9-9f49-b656a448161a', '66ff55ad-4f56-4d53-93ce-c3e58858e7b2', '34e0cafe-77f9-435a-9feb-c1ada726f6ce',
       '0040aa6a-ec13-40f5-a2f6-44976e199a74', '66c01d88-fa60-4484-8ad2-6a59ef52af42', '24ed71e7-4139-4a58-bb53-10d5a039c632']
ANNIV = ['54041c96-1256-4c53-ab89-5e38fda52428', 'ad394f2b-d456-400a-824e-32165672d67e', '0af0c7d0-6e35-4408-b244-02081e0aa125',
         'ac90eb07-4487-439b-b48a-b514688fca1a', '67cab8c4-d1ba-4a0b-a173-90ca78c98b90', '66ff55ad-4f56-4d53-93ce-c3e58858e7b2',
         'd1e5458e-fbcf-4596-83f1-a4a00f4d8f5e', '7e2d811b-7116-4dc9-9b32-6cb63674891c', '0c302857-738c-462d-aa72-e6ad39139cdd',
         'ddb10204-32fd-43e5-b02d-c8c2a8d5fd5a', '68d09272-0ceb-4ccd-908f-223fb70e1fc1', '04bc9930-4a5d-4d70-b7c3-349bd2ddf3c3']
# women's gift sets currently in stock (live list 356ace1d minus sold-out ids)
SETS_HER = ['7dbefeef-fdfd-47ca-9272-1778d6cebc03', '264f3e0a-6f24-40df-8771-da96f0d6f889', 'abe3daad-b6ea-4719-a560-a6859c51cff6',
            '5dad41a2-ff74-400f-85ce-c63679c36e99', '4fd0e72e-7356-44cc-b2bf-077768c1dc95', 'df5c4ed8-60a5-4a6e-89ba-b1e035413a9d',
            'd4c958b9-e4ae-43a0-aa58-f053b6cc09cd', 'b6fdc81a-06eb-4d44-84d8-e5c25a37f73d', '779a1234-1c22-4e2c-823b-4cc5f000c72b',
            'dc2afec2-f567-4efa-a451-3842d7790949', '6cceadc8-56e4-4bf7-b12c-73522eaf6225', '04e6bd64-84e2-49d2-8000-a9241a352502']
for i in SETS_HER:  # sets are not all in brands[].top — verified live via the public API on 2026-11-08 (stock >= 1)
    STOCK.setdefault(i, 1)

def item(image, linkType, linkValue):
    return {'title': '', 'imageId': img(image), 'titleEn': '', 'linkType': linkType, 'linkValue': linkValue, 'subtitleEn': ''}

TINT = {'chanel': '#F3F1EE', 'christian-dior': '#F4EBE0', 'carolina-herrera': '#E9ECF5', 'cartier': '#E9EFEA', 'tom-ford': '#EEECE9',
        'dolce--gabbana': '#F6E9E9', 'burberry': '#F3ECE4', 'lancome': '#EEEAF3', 'yves-saint-laurent': '#F3E8E8',
        'valentino': '#F5E9EE', 'paco-rabanne': '#F3EEE2'}
def room(key, title_ar, title_en, slug, image):
    return {'new': key, 'type': 'SECTION_GROUP', 'title': title_ar, 'payload': {
        'shadow': False, 'textEn': '', 'labelEn': '', 'pattern': 'none', 'titleEn': title_en, 'showTitle': False, 'subtitleEn': '',
        'paddingH': 12, 'paddingTop': 18, 'paddingBottom': 16, 'backgroundColor': TINT[slug],
        'children': [
            {'type': 'CUSTOM_BANNER', 'title': '', 'titleEn': '', 'payload': {
                'source': 'inline', 'textEn': '', 'imageId': img(image), 'labelEn': '', 'titleEn': '', 'linkType': 'brand', 'linkValue': slug,
                'showTitle': False, 'subtitleEn': '', 'showViewAll': False, 'bannerAspect': 2.15, 'sectionLayout': 'full'}},
            {'type': 'PRODUCT_LIST', 'title': '', 'titleEn': '', 'payload': {
                'limit': 14, 'filter': 'all', 'textEn': '', 'brandId': BRAND[slug], 'labelEn': '', 'titleEn': '', 'showTitle': False,
                'subtitleEn': '', 'showViewAll': True}}]}}

def strip_block(key, title, image, linkType, linkValue):
    return {'new': key, 'type': 'CUSTOM_BANNER', 'title': title, 'payload': {
        'source': 'inline', 'textEn': '', 'imageId': img(image), 'labelEn': '', 'titleEn': '', 'linkType': linkType, 'linkValue': linkValue,
        'showTitle': False, 'subtitleEn': '', 'showViewAll': False, 'bannerAspect': round(2150 / 600, 3), 'sectionLayout': 'full'}}

def wall(key, title_ar, title_en, items, display='grid', columns=None, aspect='1:1', tpv=None, subtitle=None):
    p = {'gap': 10, 'items': items, 'textEn': '', 'display': display, 'labelEn': '', 'titleEn': title_en, 'showTitle': True,
         'showShadow': True, 'subtitleEn': '', 'aspectRatio': aspect, 'borderStyle': 'none', 'showViewAll': False,
         'overlayStyle': 'none', 'tileCornerRadius': 14}
    if columns: p['columns'] = columns
    if tpv: p['tilesPerView'] = tpv
    if subtitle: p['subtitle'] = subtitle
    return {'new': key, 'type': 'PHOTO_WALL', 'title': title_ar, 'payload': p}

W = 'gift-moments'
banners = [
    {'img': 'h01_chanel.jpg', 'title': 'شانيل — فن الإهداء', 'linkType': 'brand', 'linkValue': 'chanel'},
    {'img': 'h02_dior.jpg', 'title': 'ديور — هدايا ورشة الأحلام', 'linkType': 'brand', 'linkValue': 'christian-dior'},
    {'img': 'h03_ch.jpg', 'title': 'كارولينا هيريرا — هدايا لها وله', 'linkType': 'brand', 'linkValue': 'carolina-herrera'},
    {'img': 'h04_dg.jpg', 'title': 'دولتشي آند غابانا — احتفالات الأعياد', 'linkType': 'brand', 'linkValue': 'dolce--gabbana'},
    {'img': 'h08_lancome.jpg', 'title': 'هدايا الأم', 'linkType': 'products', 'linkValue': ids_link(MOM, 'هدايا الأم')},
    {'img': 'h05_cartier.jpg', 'title': 'كارتييه — لا بانتير', 'linkType': 'brand', 'linkValue': 'cartier'},
    {'img': 'h07_tomford.jpg', 'title': 'توم فورد — هدايا له', 'linkType': 'brand', 'linkValue': 'tom-ford'},
    {'img': 'h06_burberry.jpg', 'title': 'بربري — حب من لندن', 'linkType': 'brand', 'linkValue': 'burberry'},
    {'img': 'h09_armani.jpg', 'title': 'أرماني — سي باسيوني', 'linkType': 'brand', 'linkValue': 'giorgio-armani'},
]

cards = [item('c01_chanel.jpg', 'brand', 'chanel'), item('c02_dior.jpg', 'brand', 'christian-dior'),
         item('c03_ch.jpg', 'brand', 'carolina-herrera'), item('c04_cartier.jpg', 'brand', 'cartier'),
         item('c10_lancome.jpg', 'brand', 'lancome'), item('c05_burberry.jpg', 'brand', 'burberry'),
         item('c06_tomford.jpg', 'brand', 'tom-ford'), item('c08_valentino.jpg', 'brand', 'valentino'),
         item('c09_rabanne.jpg', 'brand', 'paco-rabanne')]

recipients = [
    item('t01_forher.jpg', 'products', q('هدايا لها', subcategoryId=SUB['women_perf'])),
    item('t02_forhim.jpg', 'products', q('هدايا له', subcategoryId=SUB['men_perf'])),
    item('t03_formom.jpg', 'products', ids_link(MOM, 'هدايا الأم')),
    item('t04_friend.jpg', 'products', ids_link(FRIEND, 'هدايا لصديقتي')),
    item('t05_bride.jpg', 'products', ids_link(BRIDE, 'هدايا العروس')),
    item('t06_treats.jpg', 'products', q('لمسات صغيرة', subcategoryId=SUB['body'])),
]
occasions = [
    item('o01_birthday.jpg', 'products', ids_link(BIRTHDAY, 'هدايا عيد الميلاد')),
    item('o02_eid.jpg', 'products', ids_link(EID, 'هدايا العيد')),
    item('o03_anniversary.jpg', 'products', ids_link(ANNIV, 'هدايا ذكرى الزواج')),
]
budget = [
    item('b01_25k.jpg', 'products', q('هدايا بأقل من 25 ألف', world=W, maxPrice=25000)),
    item('b02_50k.jpg', 'products', q('هدايا بأقل من 50 ألف', world=W, maxPrice=50000)),
    item('b03_100k.jpg', 'products', q('هدايا بأقل من 100 ألف', world=W, maxPrice=100000)),
]

blocks = [
    {'ref': '3edc1826'},                                                     # marquee promo strip (ready gift sets • 100% original)
    wall('gm5_spotlight', 'بيوت الهدايا', 'Gift houses', cards, display='scroll', aspect='4:5', tpv=1.6),
    {'ref': 'f55bee2d', 'patch': {'items': recipients, 'columns': 2, 'bannerAspect': 1, 'sectionLayout': 'grid2'}},  # لمن الهدية؟
    {'ref': '356ace1d', 'patch': {'productIds': SETS_HER, 'viewAllQuery': ids_link(SETS_HER, 'أطقم هدايا لها')}},       # gift sets for her
    strip_block('gm5_strip_wrap', 'تغليف الهدايا مع رسالة', 's01_giftwrap.jpg', 'products', q('لحظات تُهدى', world=W)),
    room('gm5_room_chanel', 'شانيل', 'Chanel', 'chanel', 'r01_chanel.jpg'),
    {'ref': 'ec6dcb0e'},                                                     # perfumes for her
    room('gm5_room_dior', 'ديور', 'Dior', 'christian-dior', 'r02_dior.jpg'),
    wall('gm5_occasions', 'هدايا حسب المناسبة', 'By occasion', occasions, columns=3),
    room('gm5_room_ch', 'كارولينا هيريرا', 'Carolina Herrera', 'carolina-herrera', 'r03_ch.jpg'),
    {'ref': '695d62b2', 'patch': {'imageId': img('r07_forhim.jpg'), 'bannerAspect': 2.15}},   # men gift sets banner (re-skinned)
    {'ref': 'd9237bfc'},                                                     # gifts for him list
    {'ref': '3fef3192'},                                                     # perfumes for him
    room('gm5_room_cartier', 'كارتييه', 'Cartier', 'cartier', 'r04_cartier.jpg'),
    room('gm5_room_tomford', 'توم فورد', 'Tom Ford', 'tom-ford', 'r05_tomford.jpg'),
    wall('gm5_budget', 'هدايا حسب الميزانية', 'By budget', budget, columns=3),
    {'ref': '634f21a8'},                                                     # gifts under 60K (film)
    {'ref': 'fd3ef725'},                                                     # Guess gift sets
    room('gm5_room_dg', 'دولتشي آند غابانا', 'Dolce & Gabbana', 'dolce--gabbana', 'r06_dg.jpg'),
    room('gm5_room_lancome', 'لانكوم', 'Lancôme', 'lancome', 'r09_lancome.jpg'),
    strip_block('gm5_strip_under50', 'هدايا بأقل من 50 ألف', 's02_under50.jpg', 'products', q('هدايا بأقل من 50 ألف', world=W, maxPrice=50000)),
    room('gm5_room_ysl', 'إيف سان لوران', 'Yves Saint Laurent', 'yves-saint-laurent', 'r10_ysl.jpg'),
    room('gm5_room_burberry', 'بربري', 'Burberry', 'burberry', 'r08_burberry.jpg'),
    {'ref': 'a9bb00f7'},                                                     # body mists (film)
    room('gm5_room_valentino', 'فالنتينو', 'Valentino', 'valentino', 'r11_valentino.jpg'),
    room('gm5_room_rabanne', 'رابان', 'Rabanne', 'paco-rabanne', 'r12_rabanne.jpg'),
    {'new': 'gm5_lips', 'type': 'PRODUCT_LIST', 'title': 'هدايا الشفاه', 'payload': {
        'limit': 14, 'filter': 'all', 'layout': 'film', 'marqueeSpeed': 3, 'textEn': '', 'labelEn': '', 'titleEn': 'Lip gifts',
        'showTitle': True, 'subtitleEn': '', 'showViewAll': True, 'subcategoryId': SUB['lips']}},
    {'ref': '80abd2dc'},                                                     # gifts for kids
    strip_block('gm5_strip_original', 'أصلية 100٪ — الدفع عند الاستلام', 's03_original.jpg', 'products', q('هدايا أصلية', world=W)),
]
# room payload needs giorgio-armani? (Armani has a hero only; brand room skipped on purpose)
used = {json.dumps(x) for x in []}
plan = {'world': W, 'banners': banners, 'blocks': blocks}
s = json.dumps(plan, ensure_ascii=False, indent=1)
refs = [i for i in IMG if ('@img:' + i) not in s and i not in s]
print('unused images:', refs)
open(HERE + '/plan.json', 'w').write(s)
print('banners', len(banners), 'blocks', len(blocks))
