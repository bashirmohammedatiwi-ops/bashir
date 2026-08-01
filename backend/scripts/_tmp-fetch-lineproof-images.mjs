const url = "https://radiant-professional.com/en/catalogue/lineproof-eye-liner_632/";
const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();

const blocks = t.split('data-type="product-with-shades"');
for (const block of blocks.slice(1)) {
  const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const barcode = block.match(/data-upc="(\d+)"/)?.[1];
  const img = block.match(/data-item-image="([^"]+)"/)?.[1];
  console.log({ name, barcode, img });
}

console.log("\nAll lineproof images in page:");
const imgs = [...t.matchAll(/\/media\/images\/products\/[^"']*lineproof[^"']*/gi)].map((m) => m[0]);
for (const i of [...new Set(imgs)]) console.log(i);

const barcodes = ["5201641021866", "5201641747155", "5201641021835", "5201641021842"];
console.log("\nBrocard check:");
for (const b of barcodes) {
  const r = await fetch(`https://www.brocard.ua/media/catalog/product/5/2/${b}_1.jpg`, {
    method: "HEAD",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  console.log(b, r.status);
}

console.log("\nDescription snippet:");
const p = t.match(/Details([\s\S]{0,1200})/i)?.[1];
console.log(p?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600));
