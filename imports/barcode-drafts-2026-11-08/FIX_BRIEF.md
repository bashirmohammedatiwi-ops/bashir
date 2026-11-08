# Fix product images built from staff phone photos
Folder: /private/tmp/claude-502/-Volumes-ADATA-SD810-Projects-full-app-worktrees-puf/a24a93fb-b78e-45ce-b2d4-ece50b1ff8e8/scratchpad/dr2
Your list (fix_A.json or fix_B.json) has items {idx, draftId, key, nameEn, barcode, photos:[staff photo files in photos/], current}.
`final_prev/<key>.jpg` is the CURRENT automatic result (AI cutout placed on white). Problems: a hand holding the product is included, product lying sideways/tilted, cutout grabbed the wrong object, box shot at an angle, etc.

For EACH item: look at the current result and ALL its staff photos (Read tool), then output ONE fix:
- First try to find a proper online product image (exact product/variant; white/transparent background; >=700px) via WebSearch: barcode, brand site, retailers, Shopify `/products/<handle>.json`. Verify with `curl -sIL -A "Mozilla/5.0" URL` (200 + image/*) and by viewing it. If found: {"key", "mode":"web", "url"}.
- Otherwise specify how to re-cut the best staff photo: {"key", "mode":"photo", "photo":"<file>", "rotate": degrees counter-clockwise to make the product upright (0/90/180/270 or small values like -7), "crop":[l,t,r,b] fractions of the ORIGINAL (un-rotated) image to keep: tight around the product, excluding hands/fingers/background objects as much as possible, "flatbox": true if it's a flat box/card photographed at an angle that should be perspective-straightened, else false}.
  Crop is applied BEFORE rotation. Fractions 0..1, (l,t) top-left, (r,b) bottom-right.
- If no photo can make a decent product image: {"key","mode":"keep","note":"why"}.
Write the JSON list to fix_out_A.json or fix_out_B.json (as told). Every key exactly once. Do not change anything else. Reply with a short summary.
