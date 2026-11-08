# Task: identify staff-scanned barcodes so they can be added to an Iraqi cosmetics/perfume store (Deema Alhayat)

Folder: /private/tmp/claude-502/-Volumes-ADATA-SD810-Projects-full-app-worktrees-puf/a24a93fb-b78e-45ce-b2d4-ece50b1ff8e8/scratchpad/dr2
- Your batch file (given in your prompt) is a JSON list of drafts: {id, barcode, name, note, pos:{name,price,orig,stock}, imgs}.
  - `pos.name` is the shop's POS name — often abbreviated, misspelled or wrong. Trust the PHOTO + barcode over it.
  - Staff phone photos are at photos/<first 8 chars of draft id>_<n>.webp — LOOK AT EVERY PHOTO with the Read tool.
- catalog.txt: every existing product: `id | brandSlug | nameEn | nameAr | A(active)/I(inactive) | bc barcode | shade names`.
- brands.txt: `slug | id | name`. categories.txt: `id | English path | Arabic path`.

## For each draft decide
1. **What exactly it is**: brand, product line, variant/flanker, concentration (EDP/EDT/Parfum/Extrait), size, shade name/number. Verify on the web (WebSearch; search the barcode/EAN itself, official brand site, big retailers). Be precise — flankers matter (e.g. "Black Opium Over Red" ≠ "Black Opium").
2. **Does it already exist in catalog.txt?** (search by brand + name; inactive ones count too)
   - same product, same size → `decision:"duplicate"` with `existingProductId` (we'll relink/activate).
   - it's another shade/colour of an existing product (same line, shades listed) → `decision:"shade"` with `existingProductId` and `shadeName` and `colorHex`.
   - otherwise `decision:"new"`. If several drafts in YOUR batch are shades of the same NEW product, give them the same `groupKey` (e.g. "maybelline-superstay-vinyl-ink") and set `shadeName`/`colorHex` on each.
   - can't identify confidently → `decision:"unknown"` with notes.
3. **Brand**: `brandSlug` from brands.txt if it exists; else `newBrand: {name, nameAr}`.
4. **Names**: `nameEn` in store style "<Brand> <Line> <Type> <size>" e.g. "Dior Sauvage Eau de Parfum 100ml"; `nameAr` natural Arabic as Iraqi shoppers write it, e.g. "ديور سوفاج أو دو بارفان 100 مل" (perfumes: include للرجال / للنساء / للجنسين when relevant).
5. **Category**: pick the deepest fitting ids from categories.txt: `categoryId` (root), `subcategoryId`, `tertiaryCategoryId` (or null). Perfumes: root Perfumes → Women/Men/Unisex/Niche… by real gender.
6. **Image**: find 1–3 high-quality official/retailer product images (packshot, ideally white or transparent background, ≥800px, exact variant/shade). Give DIRECT image URLs that download with a plain GET (verify with `curl -sIL -A "Mozilla/5.0" <url>` → 200 + image content-type; open a couple with Read to confirm it's the exact item). Prefer: brand site, Sephora/Notino/Douglas/Boots/fragrancenet/Shopify stores (`/products/<handle>.json` gives full-size images + variant barcodes). If nothing exact exists online (local/dupe brands), set `imageSource:"staff_photo"` and name the best staff photo file to use.
7. **Description**: short Arabic + English descriptions in this style (keep it accurate; don't invent notes/claims you can't verify):
   - perfumes: "<Arabic name> — <one sentence>.\n\n◆ عائلة العطر: …\n◆ النوتات الرئيسية: …\n◆ الطابع: …\n◆ الأنسب لـ: …\n◆ الثبات: …" (English: ◆ Scent family / Key notes / Character / Best for / Longevity)
   - others: "<Arabic short name> — <benefit sentence>.\n\n• …\n• …\n• <size>" (4–6 bullets)
8. Note anything odd (expired note, damaged box, tester, gift set contents, POS name contradicts photo…).

## Output
Write JSON to the output file named in your prompt: a list with one object per draft:
{draftId, barcode, decision, existingProductId, groupKey, brandSlug, newBrand, nameEn, nameAr, shadeName, colorHex, categoryId, subcategoryId, tertiaryCategoryId, imageUrls:[...], imageSource:"web"|"staff_photo", staffPhoto, descriptionAr, descriptionEn, confidence:"high"|"medium"|"low", notes}
Every draft in your batch must appear exactly once. Valid JSON. Do not modify the database or any other files. Do not log in anywhere.
Reply with a short summary: counts per decision, and the low-confidence/unknown ones.
