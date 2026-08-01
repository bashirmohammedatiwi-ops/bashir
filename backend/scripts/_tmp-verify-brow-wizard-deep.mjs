const url = "https://radiant-professional.com/en/catalogue/brow-wizard-tattoo-pen_834/";
const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();

const blocks = t.split('data-type="product-with-shades"');
console.log("shade blocks:", blocks.length - 1);
for (const block of blocks.slice(1)) {
  const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const barcode = block.match(/data-upc="(\d+)"/)?.[1];
  const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
  const img = block.match(/data-item-image="([^"]+)"/)?.[1];
  const sku = block.match(/data-sku="([^"]+)"/)?.[1];
  const id = block.match(/data-shade-id="([^"]+)"/)?.[1];
  console.log({ name, barcode, hex, sku, id, img: img?.slice(-60) });
}

// ingredient sections often list shade + barcode
const ing = [...t.matchAll(/BROW WIZARD[^<]{0,200}/gi)].map((m) => m[0]);
for (const i of ing) console.log("ING:", i.slice(0, 150));

const barcodes = ["5201641019078", "5201641018828", "5201641018835"];
for (const b of barcodes) {
  const brocard = await fetch(`https://www.brocard.ua/media/catalog/product/5/2/${b}_1.jpg`, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
  console.log("brocard img", b, brocard.status);
}

// Map barcode to image filename number on radiant
const imgs = {
  "5201641019078": "01_light_brown",
  "5201641018828": "02_natural_brown",
  "5201641018835": "03_dark_brown",
};
for (const [b, expect] of Object.entries(imgs)) {
  const inPage = t.includes(b);
  const nearName = t.match(new RegExp(`${b}[\\s\\S]{0,300}data-shade-description="([^"]+)"`))?.[1]
    || t.match(new RegExp(`data-shade-description="([^"]+)"[\\s\\S]{0,300}${b}`))?.[1];
  console.log("barcode context", b, "inPage", inPage, "nearShade", nearName, "expect", expect);
}
