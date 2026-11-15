# PNG -> img/*.jpg (q90, <=1.5MB), contact sheets, offers.json
import os, sys, json, urllib.parse
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)) + '/kit')
import kit; kit.set_out(HERE + '/out')
from PIL import Image
sys.path.insert(0, HERE)
H = ['oh1_rybella', 'oh2_grigi', 'oh3_huda', 'oh4_artdeco', 'oh5_essence', 'oh6_deborah']
C = ['oc1_rybella', 'oc2_grigi', 'oc3_huda', 'oc4_artdeco', 'oc5_essence', 'oc6_deborah']
os.makedirs(HERE + '/img', exist_ok=True)
for n in H + C:
    p = f'{HERE}/img/{n}.jpg'; q = 90
    Image.open(f'{HERE}/out/{n}.png').convert('RGB').save(p, quality=q, optimize=True, progressive=True)
    while os.path.getsize(p) > 1.5e6 and q > 70:
        q -= 4; Image.open(f'{HERE}/out/{n}.png').convert('RGB').save(p, quality=q, optimize=True, progressive=True)
    print(n, q, os.path.getsize(p) // 1024, 'KB')
kit.sheet(H, 'sheet_heroes', w=1075, cols=2); kit.sheet(C, 'sheet_cards', w=540, cols=3)
AR = {'rybella': ('ريبيلا', '1b83af76-aa9e-4808-b3a8-85ded4e88675', 'خصم ٤٠٪'),
      'grigi': ('كريجي', '0c940ed6-fa52-40b4-9d01-aa2cd9c14ed4', 'خصم ٥٠٪'),
      'huda': ('هدى بيوتي', 'cae7565f-0e4c-4eec-b75c-84a210be0dfc', 'خصم حتى ٢٥٪'),
      'artdeco': ('آرتديكو', '035854fa-41b8-4e06-a7ad-19b09cfea003', 'خصم ٥٠٪'),
      'essence': ('إيسنس', '9c5204f9-10be-484a-8e65-23b3ad53bb3c', 'خصم حتى ٥٠٪'),
      'deborah': ('ديبورا ميلانو', '03bf1748-150d-47b0-9ffc-8aa13f1142d0', 'خصم حتى ٥٠٪')}
def link(k):
    ar, bid, _ = AR[k]
    return f'brandId={bid}&minDiscount=1&title=' + urllib.parse.quote(f'عروض {ar}')
banners = [{'img': f'{h}.jpg', 'title': f'{AR[h.split("_")[1]][0]} — عرض {AR[h.split("_")[1]][2]}', 'linkType': 'products', 'linkValue': link(h.split('_')[1])} for h in H]
items = [{'title': f'عروض {AR[c.split("_")[1]][0]}', 'imageId': f'@img:{c}.jpg', 'titleEn': '', 'linkType': 'products', 'linkValue': link(c.split('_')[1]), 'subtitleEn': ''} for c in C]
wall = {'new': 'offers-1115-wall', 'type': 'PHOTO_WALL', 'title': 'عروض الأسبوع',
        'payload': {'gap': 10, 'items': items, 'textEn': '', 'display': 'scroll', 'labelEn': '', 'titleEn': '', 'showTitle': True, 'showShadow': False,
                    'subtitleEn': '', 'aspectRatio': '4:5', 'borderStyle': 'none', 'showViewAll': False, 'overlayStyle': 'none', 'tilesPerView': 1.6, 'tileCornerRadius': 16}}
json.dump({'world': 'beauty-spell', 'banners': banners, 'wall': wall}, open(HERE + '/offers.json', 'w'), ensure_ascii=False, indent=1)
print('offers.json written')
