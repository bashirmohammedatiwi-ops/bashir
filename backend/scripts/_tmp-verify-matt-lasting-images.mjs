const url = "https://radiant-professional.com/en/catalogue/matt-lasting-lip-color_336/";
const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const blocks = t.split('data-type="product-with-shades"');
const shades = [];
for (const block of blocks.slice(1)) {
  const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
  const barcode = block.match(/data-upc="(\d+)"/)?.[1];
  let img = block.match(/data-item-image="([^"]+)"/)?.[1] ?? "";
  img = img.replace(/https:\/\/radiant-professional\.com/g, "");
  if (img && !img.startsWith("http")) img = "https://radiant-professional.com" + img;
  if (name && hex && barcode) shades.push({ name, hex, barcode, radiantImg: img });
}

const seen = new Set();
const unique = shades.filter((s) => {
  if (seen.has(s.barcode)) return false;
  seen.add(s.barcode);
  return true;
});

function bestImage(barcode, radiantImg) {
  if (radiantImg && radiantImg.includes(barcode)) return radiantImg;
  return `https://www.brocard.ua/media/catalog/product/5/2/${barcode}_1.jpg`;
}

for (const s of unique) {
  const chosen = bestImage(s.barcode, s.radiantImg);
  const radiantOk = s.radiantImg?.includes(s.barcode);
  console.log(JSON.stringify({ name: s.name, barcode: s.barcode, radiantOk, radiantImg: s.radiantImg, chosen }));
}

console.log("count", unique.length);

// Also list radiant filenames with shade numbers for 93-107
const allImgs = [...t.matchAll(/\/media\/images\/products\/[^"']*matt_lasting[^"']*/gi)].map((m) => m[0]);
console.log("\nMatt lasting images on page:", [...new Set(allImgs)]);
