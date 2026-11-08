import json, copy, urllib.parse as U
d = json.load(open('current.json')); BID = json.load(open('brand_ids.json'))
B = {b['id'][:8]: b for b in d['blocks']}
ALL = {t['id'][:8]: t for br in d['brands'] for t in br['top']}
def ids(*pfx): return [ALL[p]['id'] for p in pfx]
MEN = '8dca642a-1194-4101-b5cc-486ca1664e89'; UNI = 'bcbfcf49-4e64-4d25-9c8e-9b9c8387bf8a'; CARE = '01300f8f-9b4d-4d15-904c-e045383c9b97'
BODY = '23aaaa07-91ee-4937-847e-d7866a9e937a'; ORAL = 'bbf672bf-58cf-4cd3-8b17-46a7ddcc1c27'; GIFT = '08770090-8df0-4f74-863f-b36521ebc8be'
groom_link = [b for b in d['banners'] if b['id'].startswith('4a37d639')][0]['linkValue']
occ = B['4521e439']['payload']['children'][0]['payload']['items']; budget_link = B['4521e439']['payload']['children'][1]['payload']['linkValue']

def cb(img, lt, lv, aspect=2.15):
    return {"type": "CUSTOM_BANNER", "title": "", "titleEn": "", "payload": {"source": "inline", "textEn": "", "imageId": "@img:" + img, "labelEn": "",
            "titleEn": "", "linkType": lt, "linkValue": lv, "showTitle": False, "subtitleEn": "", "showViewAll": False, "bannerAspect": aspect, "sectionLayout": "full"}}
def reskin(ref, img, title=None):  # replace the banner child, keep the existing product list child
    ch = copy.deepcopy(B[ref]['payload']['children']); old = ch[0]['payload']
    ch[0] = cb(img, old['linkType'], old['linkValue'])
    r = {"ref": ref, "patch": {"children": ch}}
    if title: r['title'] = title
    return r
def plist(**kw):
    p = {"limit": 14, "filter": "all", "textEn": "", "labelEn": "", "titleEn": "", "showTitle": False, "subtitleEn": "", "showViewAll": True, "sectionLayout": "carousel"}
    p.update(kw); return {"type": "PRODUCT_LIST", "title": "", "titleEn": "", "payload": p}
def room(key, title, titleEn, img, slug, lst, bg='#ECEFF3'):
    return {"new": key, "type": "SECTION_GROUP", "title": title, "payload": {"shadow": False, "textEn": "", "labelEn": "", "pattern": "none", "titleEn": titleEn,
            "children": [cb(img, "brand", slug), lst], "paddingH": 12, "showTitle": False, "paddingTop": 18, "subtitleEn": "", "paddingBottom": 16, "backgroundColor": bg}}
def brandlist(slug, n=14): return plist(brandId=BID[slug], subcategoryId=MEN, limit=n)
def item(img, lt, lv, title=''): return {"title": title, "imageId": "@img:" + img, "titleEn": "", "linkType": lt, "linkValue": lv, "subtitleEn": ""}
q = lambda s: U.quote(s)

banners = [
 {"img": "h01_chanel.jpg", "title": "شانيل — بلو دو شانيل", "linkType": "brand", "linkValue": "chanel"},
 {"img": "h02_dior.jpg", "title": "ديور — سوفاج", "linkType": "brand", "linkValue": "christian-dior"},
 {"img": "h03_tomford.jpg", "title": "توم فورد — أومبري ليذر", "linkType": "brand", "linkValue": "tom-ford"},
 {"img": "h04_rabanne.jpg", "title": "رابان — إنفيكتوس", "linkType": "brand", "linkValue": "paco-rabanne"},
 {"img": "h05_emporio.jpg", "title": "إمبوريو أرماني — سترونغر ويذ يو", "linkType": "brand", "linkValue": "emporio-armani"},
 {"img": "h06_boss.jpg", "title": "هوغو بوس — بوس بوتلد", "linkType": "brand", "linkValue": "hugo-boss"},
 {"img": "h07_versace.jpg", "title": "فيرساتشي — إيروس", "linkType": "brand", "linkValue": "versace"},
 {"img": "h08_montblanc.jpg", "title": "مونت بلانك — ليجند", "linkType": "brand", "linkValue": "montblanc"},
 {"img": "h09_creed.jpg", "title": "كريد — منذ ١٧٦٠", "linkType": "brand", "linkValue": "creed"},
 {"img": "h10_grooming.jpg", "title": "عناية الرجل اليومية", "linkType": "products", "linkValue": groom_link},
]
cards = [('c01_dior', 'christian-dior'), ('c02_chanel', 'chanel'), ('c03_armani', 'giorgio-armani'), ('c04_rabanne', 'paco-rabanne'), ('c05_jpg', 'jean-paul-gaultier'),
         ('c06_azzaro', 'azzaro'), ('c07_ysl', 'yves-saint-laurent'), ('c08_ch', 'carolina-herrera'), ('c09_prada', 'prada'), ('c10_creed', 'creed'),
         ('c11_valentino', 'valentino'), ('c12_montblanc', 'montblanc')]
spot = {"ref": "f236602a", "title": "بيوت العطور", "patch": {"items": [item(c + '.jpg', 'brand', s) for c, s in cards], "tilesPerView": 1.6, "aspectRatio": "4:5",
        "display": "scroll", "titleEn": "Fragrance houses", "subtitle": "اكتشف أيقونات أشهر دور العطور العالمية", "subtitleEn": "Discover the icons"}}
cats = {"ref": "3e2f8c65", "patch": {"items": [
  {**item('t_perf.jpg', 'subcategory', MEN), "subtitle": ""}, {**item('t_unisex.jpg', 'subcategory', UNI), "subtitle": ""},
  {**item('t_care.jpg', 'subcategory', CARE), "subtitle": ""}, {**item('t_body.jpg', 'subcategory', BODY), "subtitle": ""},
  {**item('t_oral.jpg', 'subcategory', ORAL), "subtitle": ""}, {**item('t_gifts.jpg', 'subcategory', GIFT), "subtitle": ""}]}}
occ_children = copy.deepcopy(B['4521e439']['payload']['children'])
o = occ_children[0]['payload']
o['items'] = [item('o_office.jpg', 'products', occ[0]['linkValue']), item('o_evening.jpg', 'products', occ[1]['linkValue']),
              item('o_sport.jpg', 'products', occ[2]['linkValue'].replace(q('عطور الصيف'), q('عطور منعشة ورياضية'))),
              item('o_winter.jpg', 'products', occ[3]['linkValue']), item('o_gift.jpg', 'products', occ[4]['linkValue'])]
o.update({"aspectRatio": "1:1", "tilesPerView": 2.2, "display": "scroll"})
occ_children[1] = cb('s_budget.jpg', 'products', budget_link, aspect=3.58)
occasion = {"ref": "4521e439", "patch": {"children": occ_children}}
featured = {"ref": "b438bd87", "title": "عائلات العطور", "patch": {"children": [B['b438bd87']['payload']['children'][1]]}}

armani_ids = ids('8c7890e0', 'e1ad35de', '0c302857', 'd5b9f9ce', 'c340babe', 'dc9b887e', '7b69101b', 'c3c28174', 'd6bce30d', 'a2b8b0d6', '7bd138a0', '94aff4c7', '0d2f932f', '0eac0150')
gift = {"new": "he-gift-edit", "type": "SECTION_GROUP", "title": "هدايا رجالية", "payload": {"shadow": False, "textEn": "", "labelEn": "", "pattern": "none", "titleEn": "The gift edit",
        "children": [cb('s_gifts.jpg', 'subcategory', GIFT, aspect=3.58), plist(subcategoryId=GIFT, limit=14)],
        "paddingH": 12, "showTitle": False, "paddingTop": 18, "subtitleEn": "", "paddingBottom": 16, "backgroundColor": "#F3ECE4"}}
trust = {"new": "he-trust-strip", "type": "CUSTOM_BANNER", "title": "أصلي ١٠٠٪ — توصيل مجاني فوق ٥٠ ألف", "payload": {"source": "inline", "textEn": "", "imageId": "@img:s_trust.jpg",
         "labelEn": "", "titleEn": "", "linkType": "subcategory", "linkValue": MEN, "showTitle": False, "subtitleEn": "", "showViewAll": False, "bannerAspect": 3.58, "sectionLayout": "full"}}
groom = reskin('4d295aad', 'r_groom.jpg')
blocks = [
 spot, {"ref": "e5436a65"}, cats, occasion,
 reskin('14efef8a', 'r_dior.jpg'),
 room('he-room-chanel', 'شانيل', 'Chanel', 'r_chanel.jpg', 'chanel', brandlist('chanel')),
 reskin('d7c207d0', 'r_tomford.jpg'),
 featured,
 room('he-room-armani', 'أرماني', 'Armani', 'r_armani.jpg', 'giorgio-armani', plist(productIds=armani_ids, limit=14)),
 reskin('1c013b46', 'r_rabanne.jpg'),
 gift,
 room('he-room-boss', 'هوغو بوس', 'Hugo Boss', 'r_boss.jpg', 'hugo-boss', brandlist('hugo-boss')),
 reskin('bffd16a6', 'r_versace.jpg'),
 reskin('441abf3f', 'r_pdm.jpg'),
 room('he-room-ysl', 'إيف سان لوران', 'Yves Saint Laurent', 'r_ysl.jpg', 'yves-saint-laurent', brandlist('yves-saint-laurent')),
 {"ref": "f4addf84"},
 room('he-room-montblanc', 'مونت بلانك', 'Montblanc', 'r_montblanc.jpg', 'montblanc', brandlist('montblanc')),
 room('he-room-azzaro', 'أزارو', 'Azzaro', 'r_azzaro.jpg', 'azzaro', brandlist('azzaro')),
 room('he-room-valentino', 'فالنتينو', 'Valentino', 'r_valentino.jpg', 'valentino', brandlist('valentino', 10)),
 reskin('65b5eb50', 'r_jpg.jpg'),
 reskin('d8f10d40', 'r_xerjoff.jpg'),
 reskin('de3323d5', 'r_amouage.jpg'),
 trust,
 reskin('cdc4a0ea', 'r_mancera.jpg'),
 reskin('33d3da80', 'r_montale.jpg'),
 groom, {"ref": "ea91dc1a"}, {"ref": "deb5a181"}, {"ref": "b940ef0b"},
]
plan = {"world": "his-elegance", "banners": banners, "blocks": blocks}
s = json.dumps(plan, ensure_ascii=False, indent=1)
import os, re
missing = [m for m in set(re.findall(r'@img:([\w.]+)', s) + [b['img'] for b in banners]) if not os.path.exists('img/' + m)]
assert not missing, missing
open('plan.json', 'w').write(s); print(len(banners), 'banners', len(blocks), 'blocks; images referenced:', len(set(re.findall(r'@img:([\w.]+)', s))) + len(banners))
