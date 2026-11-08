# World redesign brief — Deema Alhayat (Iraqi beauty & fragrance store app)

The owner wants each "world" (a themed home page in the app) to look like a world-class luxury beauty retailer
(think Sephora Middle East, Harrods Beauty, Net-a-Porter, Selfridges, Boots No7 campaigns). Current designs are "good but not
professional enough". You own ONE world (given in your prompt). Take your time; quality over speed.

Root: /private/tmp/claude-502/-Volumes-ADATA-SD810-Projects-full-app-worktrees-puf/a24a93fb-b78e-45ce-b2d4-ece50b1ff8e8/scratchpad/w5
- `<world>/current.json`: the world's live state — `banners` (hero carousel, with image URLs — LOOK at them), `blocks` (page sections in order, full payloads),
  `brands` (in-stock brands in this world, sorted by product count, each with `top` products: id, names, price, stock, image URL), `categories`, `recentBlocks`.
- `kit/kit.py`: rendering templates (headless Chrome) — `editorial()` hero/room banner 2150×1000, `card()` 1080×1350 portrait, `tile()` 800×800, `strip()` 2150×600, `WM()` wordmark, `sheet()` contact sheet.
  Read it fully. You may extend/copy it into your folder for world-specific variants (better type, frames, ornaments), but keep the same sizes.
- `kit/publish.js`: the publisher I (the lead) will run. Read its header for the plan format.

## What to deliver (in `<world>/`)
1. **Photography** in `<world>/photos/<brand-or-theme>/`: OFFICIAL campaign / editorial imagery from brand websites, brand press/media pages,
   official catalogues/lookbooks (PDFs are fine — extract images with PyMuPDF `pip install --user pymupdf` if needed), official Shopify stores
   (`/products/<handle>.json`, `/collections/…`), big retailers' brand pages (Sephora, Notino, Douglas, Boots, Harrods, Selfridges, Ounass, Faces).
   - High resolution: ≥1600px long side for heroes/rooms, ≥1000px for cards/tiles. No baked-in big text, prices, "shop now" buttons or watermarks.
   - Model beauty shots, mood/lifestyle, premium still-life of the hero product, textures/swatches. NOT plain white-background packshots (except as small accents).
   - Prefer imagery of product lines the store actually stocks (see `brands[].top`).
   - Use `curl -sL -A "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36"`. If a site blocks downloads (403/429), move on to another source; never log in.
   - View every image you keep (Read tool). Delete rejects you downloaded.
2. **Designs** via a `<world>/build.py` that imports the kit (`sys.path.insert(0, ROOT+'/kit')`; `set_out(ROOT+'/<world>/out')`):
   - **Hero carousel: 8–10 banners** (2150×1000, `editorial`). Main headline in ENGLISH (short, campaign-grade copy, Playfair/Bodoni italic or the brand's feel),
     Arabic sub-line (natural Iraqi-friendly Modern Standard Arabic), Arabic CTA ("تسوّقي …" / "تسوّق …" for men's world). Balance brands; strongest first.
   - **Brand rooms**: re-skin the world's existing brand SECTION_GROUP banners (2150×1000) and add rooms for important brands that lack one
     (SECTION_GROUP with children [CUSTOM_BANNER inline bannerAspect 2.15, PRODUCT_LIST brandId …] — copy the shape from an existing room in current.json).
   - **Spotlight wall**: PHOTO_WALL of 8–12 portrait cards (`card`, 4:5) linking to brands (`linkType:"brand", linkValue: slug`) — display "scroll", aspectRatio "4:5", tilesPerView 1.6.
   - **Shop-by tiles**: an IMAGE_TILES or PHOTO_WALL of 6–8 square lifestyle `tile`s for the world's categories / needs / occasions
     (link `linkType:"subcategory"|"category"` with the category id, or `products` with `ids=…&title=…`).
   - **1–3 strips** (`strip`) for themes: budget (`linkType:"products"`, linkValue `maxPrice=…&categoryId=…&title=…`), new arrivals, gift guide, free delivery over 50,000 IQD, 100% original.
   - Convert every final PNG to JPG (quality 90, ≤1.5 MB) into `<world>/img/<name>.jpg`. Those filenames are what the plan references.
3. **Self-QA (mandatory)**: open EVERY final image at full size. Check: no text over faces/products, nothing clipped, Arabic renders correctly (RTL, no broken
   letters), headline fits, photo sharp (not upscaled blur), colours harmonious with the photo, brand name spelled right. Fix and re-render until it's excellent.
   Make contact sheets `out/sheet_heroes.jpg`, `out/sheet_rooms.jpg`, `out/sheet_cards.jpg`, `out/sheet_tiles.jpg`.
4. **Page plan** `<world>/plan.json` (format in publish.js header):
   - `banners`: final hero order. Keep the owner's promotional / campaign banners that are recent or time-limited (e.g. titles with الجمعة السوداء، خصم، عرض, or createdAt ≥ 2026-11-05) as `{"ref": id}` — never drop live promotions; position them sensibly near the front. Replace older generic banners with your new designs.
   - `blocks`: final section order. Keep sections that work (product lists, flash sale, promo strips, featured brands, recent owner campaigns in `recentBlocks` created ≥ 2026-11-05) via `{"ref": id}`; re-skin with `patch` (replace the payload keys you change — e.g. a SECTION_GROUP's full `children` array with the new `"@img:…"` banner); add new sections with `{"new": "<key>", …}`. Anything you leave out gets hidden (not deleted) — only drop sections that are genuinely redundant or weak.
   - Great page rhythm: hero → owner promos → spotlight/curation → flash deals → shop-by tiles → product lists interleaved with rich brand rooms → strips → all brands.
   - Product lists: prefer existing PRODUCT_LIST blocks; new ones can use `brandId`, `categoryId`/`subcategoryId`, `productIds`, `limit` 12–18, `showViewAll` true.
5. **Report** in your final reply: what you built, image count, any brand you couldn't get photography for, and anything the lead must know. Do NOT run publish.js and do not touch the database/server — the lead reviews and publishes.

House rules: the store sells genuine products; it is the EXCLUSIVE Iraq distributor of GRIGI and RYBELLA (beauty) and EVOLUDERM (care) — those lead their worlds but other brands must still be present and balanced. Women-facing worlds address the customer in the feminine (تسوّقي، اكتشفي); his-elegance uses the masculine (تسوّق، اكتشف). Free delivery threshold: 50,000 IQD. Cash on delivery. Delivery to all Iraqi governorates.
