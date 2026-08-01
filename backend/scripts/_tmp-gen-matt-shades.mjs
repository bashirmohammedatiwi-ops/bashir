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
  if (!img.startsWith("http")) img = "https://radiant-professional.com" + img;
  if (name && hex && barcode && img.includes("/media/")) shades.push({ name, hex, barcode, image: img });
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

function normalizeName(name) {
  return name
    .replace(/\bNUDE\b/g, "Nude")
    .replace(/\bTOFFEE\b/g, "Toffee")
    .replace(/\bFIERY\b/g, "Fiery")
    .replace(/\bFLAMINGO\b/g, "Flamingo")
    .replace(/\bCERISE\b/g, "Cerise");
}

function imageUrl(barcode, radiant) {
  if (radiant.includes(barcode)) return radiant;
  return `https://www.brocard.ua/media/catalog/product/5/2/${barcode}_1.jpg`;
}

const lines = unique.map((s, i) => {
  const name = normalizeName(s.name);
  const img = imageUrl(s.barcode, s.image);
  return `  { name: ${JSON.stringify(name)}, colorHex: ${JSON.stringify(s.hex)}, barcode: ${JSON.stringify(s.barcode)}, imageUrl: ${JSON.stringify(img)}, position: ${i} },`;
});

console.log(lines.join("\n"));
console.error("count", unique.length);
