async function fetchProduct(url) {
  const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const title = t.match(/<h1[^>]*>([^<]+)</)?.[1]?.trim();
  const price = t.match(/data-price="([^"]+)"/)?.[1] || t.match(/(\d+[.,]\d+)\s*€/)?.[1];
  const barcode =
    t.match(/data-upc="(\d+)"/)?.[1] ||
    t.match(/"sku"\s*:\s*"(\d+)"/)?.[1] ||
    t.match(/520164\d{7}/)?.[0];

  let mainImg = t.match(/property="og:image"\s+content="([^"]+)"/)?.[1] || "";
  if (!mainImg) {
    const m = t.match(/\/media\/images\/products\/[^"']+\.(jpg|jpeg|png|webp)/i);
    if (m) mainImg = "https://radiant-professional.com" + m[0];
  }

  const blocks = t.split('data-type="product-with-shades"');
  const shades = [];
  for (const block of blocks.slice(1)) {
    const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
    const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
    const upc = block.match(/data-upc="(\d+)"/)?.[1];
    let sImg = block.match(/data-item-image="([^"]+)"/)?.[1] ?? "";
    if (sImg && !sImg.startsWith("http")) sImg = "https://radiant-professional.com" + sImg;
    if (name && hex && upc) shades.push({ name, hex, barcode: upc, image: sImg });
  }

  const desc =
    t.match(/<div class="product__description[^"]*">([\s\S]*?)<\/div>/i)?.[1] ||
    t.match(/product-description[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
    "";
  const description = desc.replace(/<[^>]+>/g, "\n").replace(/\s+\n/g, "\n").replace(/\n+/g, "\n").trim();

  return { url, title, price, barcode, image: mainImg, shades, description };
}

const urls = [
  "https://radiant-professional.com/en/catalogue/cream-24hr-spf15_301/",
  "https://radiant-professional.com/en/catalogue/visible-rejuvenation-botox-radiance-effect_302/",
  "https://radiant-professional.com/en/catalogue/matt-finish-transparent-base_19/",
  "https://radiant-professional.com/en/catalogue/magnetic_palette_02_sultry_eyes_993/",
];

for (const url of urls) {
  const p = await fetchProduct(url);
  console.log("\n====", p.title, "====");
  console.log(JSON.stringify(p, null, 2));
}
