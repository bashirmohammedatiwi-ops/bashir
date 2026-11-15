# Offer ads — 2026-11-15 (Deema Alhayat app)

The owner wants NEW promotional ads for brands that currently have real discounts, placed FIRST in their world's hero carousel.
Quality bar = the 2026-11-09 world redesign (see ../beauty-spell/out/sheet_heroes.jpg, ../care-rituals/out/*, ../kit/kit.py, ../beauty-spell/bs.py).
Use OFFICIAL campaign photography only (brand sites, Shopify stores, Sephora/Notino/lookfantastic/Boots/faces galleries); never product-cutout podiums.
Re-use photos already downloaded in ../beauty-spell/photos/<brand>/ and ../care-rituals/photos/<brand>/ where good — but pick DIFFERENT shots than the live
banners where possible so the offer ads look fresh.

## Real discounts (from the database — do NOT invent bigger numbers)
| brand | slug | brandId | discount | world |
|---|---|---|---|---|
| GRIGI | grigi | 0c940ed6-fa52-40b4-9d01-aa2cd9c14ed4 | 50% on all 53 | beauty-spell |
| ARTDECO | artdeco | 035854fa-41b8-4e06-a7ad-19b09cfea003 | 50% on all 107 | beauty-spell |
| essence | essence | 9c5204f9-10be-484a-8e65-23b3ad53bb3c | up to 50% (95 items) | beauty-spell |
| Deborah Milano | brand-1784986563282 | 03bf1748-150d-47b0-9ffc-8aa13f1142d0 | up to 50% (102) | beauty-spell |
| RYBELLA | rybella | 1b83af76-aa9e-4808-b3a8-85ded4e88675 | 40% on all 37 | beauty-spell |
| Huda Beauty | huda-beauty | cae7565f-0e4c-4eec-b75c-84a210be0dfc | up to 25% (59) | beauty-spell |
| Axis-Y | axis-y | 9e7126ef-5073-48e6-951c-8652a0fe5782 | 20% (7) | care-rituals |
| Centella (Madagascar centella line, brand "CENTELLA") | centella | 7f45a2ad-1adc-4081-8012-8f7cf7a80390 | up to 20% (8) | care-rituals |
| Eucerin | eucerin | b5636e4d-7456-4be9-ac3d-971eb22b7168 | up to 15% (11) | care-rituals |
Use "50% OFF" only where it's on all items; otherwise "UP TO 50% OFF" / Arabic «خصم حتى ٥٠٪». Arabic: «خصم ٤٠٪ على كل منتجات ريبيلا».
GRIGI and RYBELLA are the store's exclusive Iraq brands — may carry «الوكيل الحصري في العراق». Others must NOT be called exclusive.

## Deliverables (in offers-1115/<world>/)
1. Hero banners 2150×1000 (one per brand) — luxury editorial + a clear, elegant discount element (big % numeral in Bodoni/Playfair, thin rule,
   "OFFER"/"LIMITED TIME" small caps). English headline, Arabic sub-line + Arabic CTA «تسوّقي العرض ←». Women's address (feminine).
   Bodoni Moda: always set `font-variation-settings:'opsz' 9` (kit.py already does this globally) — hairlines must survive phone size.
2. One portrait card 1080×1350 per brand for an «عروض الأسبوع» PHOTO_WALL (same photo family, % big).
3. JPG q90 ≤1.5 MB into offers-1115/<world>/img/. Contact sheets out/sheet_heroes.jpg, out/sheet_cards.jpg.
4. plan.json fragment `offers-1115/<world>/offers.json`:
   {"banners":[{"img":"…","title":"<Arabic brand> — عرض …","linkType":"products","linkValue":"brandId=<id>&minDiscount=1&title=<url-encoded Arabic title e.g. عروض ريبيلا>"}…],
    "wall":{"new":"offers-1115-wall","type":"PHOTO_WALL","title":"عروض الأسبوع","payload":{"display":"scroll","aspectRatio":"4:5","tilesPerView":1.6,
      "items":[{"imageId":"@img:<card>.jpg","linkType":"products","linkValue":"…same…","title":"…"}]}}}
   Look at an existing PHOTO_WALL payload in ../<world>/current.json and copy its exact item key names.
5. Self-QA every image at full size (no text over faces/products, nothing clipped, Arabic correct RTL, % correct per table). Re-render until excellent.
Do NOT publish or touch the server/DB. Report: files, anything weak.
