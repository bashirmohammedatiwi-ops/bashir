const url = "https://radiant-professional.com/en/catalogue/lineproof-eye-liner_632/";
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
unique.sort((a, b) => parseInt(a.name.match(/(\d+)/)?.[1] ?? "999") - parseInt(b.name.match(/(\d+)/)?.[1] ?? "999"));
console.log("RADIANT (may have rotated data):");
console.log(JSON.stringify(unique, null, 2));

const ing = [...t.matchAll(/LINEPROOF EYE LINER No\.?(\d+[^<\n]{0,40})/gi)].map((m) => m[0]);
for (const i of ing) console.log("ING:", i.trim());
