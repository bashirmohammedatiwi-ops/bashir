const searchUrl = "https://radiant-professional.com/en/search/?q=time+proof+eye+brow+pencil";
const searchHtml = await (await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const catalogueMatch = searchHtml.match(/\/en\/catalogue\/time-proof-eye-brow-pencil_\d+\//i);
if (!catalogueMatch) {
  console.error("No catalogue URL found");
  console.log(searchHtml.slice(0, 2000));
  process.exit(1);
}
const url = "https://radiant-professional.com" + catalogueMatch[0];
console.log("URL:", url);

const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const blocks = t.split('data-type="product-with-shades"');
const shades = [];
for (const block of blocks.slice(1)) {
  const desc = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
  const upc = block.match(/data-upc="(\d+)"/)?.[1];
  let img = block.match(/data-item-image="([^"]+)"/)?.[1] ?? "";
  img = img.replace(/https:\/\/radiant-professional\.com/g, "");
  if (!img.startsWith("http")) img = "https://radiant-professional.com" + img;
  if (desc && hex && upc && img.includes("/media/")) shades.push({ name: desc, hex, barcode: upc, image: img });
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
const title = t.match(/<h1[^>]*>([^<]+)</)?.[1]?.trim();
console.log("title", title);
