const url = "https://radiant-professional.com/en/catalogue/brow-wizard-tattoo-pen_834/";
const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const blocks = t.split('data-type="product-with-shades"');
const shades = [];
for (const block of blocks.slice(1)) {
  const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
  const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
  const barcode = block.match(/data-upc="(\d+)"/)?.[1];
  if (name && hex && barcode) shades.push({ name, hex, barcode });
}
const seen = new Set();
const unique = shades.filter((s) => {
  if (seen.has(s.barcode)) return false;
  seen.add(s.barcode);
  return true;
});
unique.sort((a, b) => parseInt(a.name.match(/(\d+)/)?.[1] ?? "999") - parseInt(b.name.match(/(\d+)/)?.[1] ?? "999"));
console.log("RADIANT SOURCE:");
console.log(JSON.stringify(unique, null, 2));
