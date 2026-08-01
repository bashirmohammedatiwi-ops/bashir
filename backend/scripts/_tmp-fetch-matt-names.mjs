const url = "https://radiant-professional.com/en/catalogue/matt-lasting-lip-color_336/";
const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();

// Try alternate name sources in each shade block
const blocks = t.split('data-type="product-with-shades"');
for (const block of blocks.slice(1, 6)) {
  const desc = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const title = block.match(/title="([^"]+)"/)?.[1];
  const alt = block.match(/alt="([^"]+)"/)?.[1];
  const upc = block.match(/data-upc="(\d+)"/)?.[1];
  console.log({ desc, title, alt, upc });
}

const barcodes = ["5201641052341", "5201641052334", "5201641044056", "5201641723821"];
for (const b of barcodes) {
  const brocard = `https://www.brocard.ua/media/catalog/product/5/2/${b}_1.jpg`;
  const r = await fetch(brocard, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
  console.log(b, "brocard", r.status);
}
