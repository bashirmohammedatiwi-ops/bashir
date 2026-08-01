const searchUrl = "https://radiant-professional.com/en/search/?q=brow+definer+fix+color+waterproof";
const searchHtml = await (await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const catalogueMatch = searchHtml.match(/\/en\/catalogue\/[^"']*brow[^"']*_(\d+)\//i)
  ?? searchHtml.match(/\/en\/catalogue\/([^"']+)_(\d+)\//i);
console.log("search matches:", [...searchHtml.matchAll(/\/en\/catalogue\/[^"']+brow[^"']+/gi)].map(m => m[0]).slice(0, 10));

const url = searchHtml.match(/\/en\/catalogue\/brow-definer[^"']+/)?.[0]
  ?? searchHtml.match(/\/en\/catalogue\/[^"']*definer[^"']*_(\d+)\//)?.[0];
if (!url) {
  // try direct
  const direct = "https://radiant-professional.com/en/catalogue/brow-definer-fix-color-waterproof_";
  for (const id of [400, 500, 600, 700, 800, 900, 1000, 1100, 1200]) {
    const u = direct + id + "/";
    const r = await fetch(u, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
    if (r.ok) console.log("found", u);
  }
  process.exit(1);
}
const fullUrl = url.startsWith("http") ? url : "https://radiant-professional.com" + url;
console.log("URL:", fullUrl);

const t = await (await fetch(fullUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const blocks = t.split('data-type="product-with-shades"');
const shades = [];
for (const block of blocks.slice(1)) {
  const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
  const barcode = block.match(/data-upc="(\d+)"/)?.[1];
  let img = block.match(/data-item-image="([^"]+)"/)?.[1] ?? "";
  if (img && !img.startsWith("http")) img = "https://radiant-professional.com" + img;
  if (name && hex && barcode) shades.push({ name, hex, barcode, img, imgHasBarcode: img.includes(barcode) });
}
const seen = new Set();
const unique = shades.filter((s) => {
  if (seen.has(s.barcode)) return false;
  seen.add(s.barcode);
  return true;
});
console.log("count", unique.length);
for (const s of unique) console.log(JSON.stringify(s));

const price = t.match(/data-price="([^"]+)"/)?.[1] ?? t.match(/(\d+[.,]\d{2})\s*€/)?.[1];
console.log("price hint:", price);
