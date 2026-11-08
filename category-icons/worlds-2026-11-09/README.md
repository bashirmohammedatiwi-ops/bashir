# World ads redesign — 2026-11-09

All five worlds (beauty-spell, care-rituals, his-elegance, gift-moments, scent-story) got new hero carousels, brand rooms,
spotlight cards, shop-by tiles and strips built from official campaign photography.

- `kit/kit.py`: headless-Chrome templates (hero/room 2150×1000, card 1080×1350, tile 800, strip 2150×600).
- `<world>/build.py` (+ helpers): renders that world's designs; photos lived in the scratchpad and are not committed.
- `<world>/plan.json`: final banner + section order applied by `kit/publish.js` (run inside the api container).
  Unlisted active items are hidden, never deleted. `"@img:<file>"` is replaced by the uploaded media id.
- `sheet_*.jpg`: reduced contact sheets of what was published.
- Rollback snapshots: `/data/uploads/world-<slug>-rollback-<stamp>.json` in the api container.
