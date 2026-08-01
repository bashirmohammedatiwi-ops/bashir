const searchUrl = "https://radiant-professional.com/en/search/?q=brow+wizard+tattoo+pen";
const searchHtml = await (await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const catalogueMatch = searchHtml.match(/\/en\/catalogue\/brow-wizard[^"]*_\d+\//i);
if (!catalogueMatch) {
  console.error("No catalogue URL found");
  console.log([...searchHtml.matchAll(/\/en\/catalogue\/[^"]*brow[^"]*/gi)].map((m) => m[0]).slice(0, 15));
  process.exit(1);
}
const url = "https://radiant-professional.com" + catalogueMatch[0];
console.log("URL:", url);

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
  if (name && hex && barcode) shades.push({ name, hex, barcode, image: img });
}

const seen = new Set();
const unique = shades.filter((s) => {
  if (seen.has(s.barcode)) return false;
  seen.add(s.barcode);
  return true;
});

unique.sort((a, b) => {
  const na = parseInt(a.name.match(/(\d+)/)?.[1] ?? "999", 10);
  const nb = parseInt(b.name.match(/(\d+)/)?.[1] ?? "999", 10);
  return na - nb;
});

console.log(JSON.stringify(unique, null, 2));
console.log("count", unique.length);
console.log("price", t.match(/data-price="([^"]+)"/)?.[1]);
console.log("title", t.match(/<h1[^>]*>([^<]+)</)?.[1]?.trim());

const paras = [...t.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
  .filter((x) => x.length > 40 && /brow|wizard|tattoo|pen/i.test(x));
for (const p of paras.slice(0, 4)) console.log("DESC:", p.slice(0, 350));
