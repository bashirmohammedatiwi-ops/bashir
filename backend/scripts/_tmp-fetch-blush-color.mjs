const searchUrl = "https://radiant-professional.com/en/search/?q=blush+color";
const searchHtml = await (await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const links = [...searchHtml.matchAll(/href="(\/en\/catalogue\/[^"]+)"/gi)]
  .map((m) => m[1])
  .filter((l) => /blush/i.test(l));
console.log("catalogue links:", [...new Set(links)].slice(0, 15));

const url = links.find((l) => /blush-color/i.test(l)) ?? links[0];
if (!url) {
  console.log("trying direct blush-color_");
  process.exit(1);
}
const fullUrl = url.startsWith("http") ? url : "https://radiant-professional.com" + url;
console.log("URL:", fullUrl);

const t = await (await fetch(fullUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const title = t.match(/<h1[^>]*>([^<]+)/i)?.[1]?.trim();
const blocks = t.split('data-type="product-with-shades"');
const shades = [];
for (const block of blocks.slice(1)) {
  const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
  const barcode = block.match(/data-upc="(\d+)"/)?.[1];
  let img = block.match(/data-item-image="([^"]+)"/)?.[1] ?? "";
  img = img.replace(/https:\/\/radiant-professional\.com/g, "");
  if (img && !img.startsWith("http")) img = "https://radiant-professional.com" + img;
  if (name && hex && barcode) shades.push({ name, hex, barcode, img, ok: img.includes(barcode) });
}
const seen = new Set();
const unique = shades.filter((s) => {
  if (seen.has(s.barcode)) return false;
  seen.add(s.barcode);
  return true;
});
console.log("title:", title);
console.log("count", unique.length);
for (const s of unique) console.log(JSON.stringify(s));

const price = t.match(/(\d+[.,]\d{2})\s*€/)?.[1];
console.log("price:", price);
