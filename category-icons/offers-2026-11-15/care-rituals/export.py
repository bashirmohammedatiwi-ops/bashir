import sys, os, json, urllib.parse
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE + '/_tools')
from kit import *
from PIL import Image
set_out(HERE + '/out')
os.makedirs(HERE + '/img', exist_ok=True)
H = ['offer_hero_centella', 'offer_hero_axisy', 'offer_hero_eucerin']
C = ['offer_card_centella', 'offer_card_axisy', 'offer_card_eucerin']
for n in H + C:
    p = f'{HERE}/img/{n}.jpg'; Image.open(f'{HERE}/out/{n}.png').convert('RGB').save(p, quality=90, optimize=True, progressive=True)
    print(n, round(os.path.getsize(p) / 1e6, 2), 'MB')
sheet(H, 'sheet_heroes', w=1075, cols=1); sheet(C, 'sheet_cards', w=700, cols=3)
B = {'centella': ('7f45a2ad-1adc-4081-8012-8f7cf7a80390', 'سنتيلا — عرض خصم حتى ٢٠٪', 'عروض سنتيلا'),
     'axisy': ('9e7126ef-5073-48e6-951c-8652a0fe5782', 'أكسيس واي — عرض خصم ٢٠٪ على كل المنتجات', 'عروض أكسيس واي'),
     'eucerin': ('b5636e4d-7456-4be9-ac3d-971eb22b7168', 'يوسيرين — عرض خصم حتى ١٥٪', 'عروض يوسيرين')}
def lv(k): bid, _, t = B[k]; return f'brandId={bid}&minDiscount=1&title={urllib.parse.quote(t)}'
order = ['centella', 'axisy', 'eucerin']
out = {'banners': [{'img': f'offer_hero_{k}.jpg', 'title': B[k][1], 'linkType': 'products', 'linkValue': lv(k)} for k in order],
       'wall': {'new': 'offers-1115-wall', 'type': 'PHOTO_WALL', 'title': 'عروض الأسبوع',
                'payload': {'gap': 10, 'items': [{'title': '', 'titleEn': '', 'subtitleEn': '', 'imageId': f'@img:offer_card_{k}.jpg', 'linkType': 'products', 'linkValue': lv(k)} for k in order],
                            'textEn': '', 'display': 'scroll', 'labelEn': '', 'titleEn': "This week's offers", 'showTitle': True, 'showShadow': False,
                            'subtitleEn': '', 'aspectRatio': '4:5', 'borderStyle': 'none', 'showViewAll': False, 'overlayStyle': 'none',
                            'tilesPerView': 1.6, 'tileCornerRadius': 16}}}
json.dump(out, open(HERE + '/offers.json', 'w'), ensure_ascii=False, indent=1)
print('offers.json ok')
