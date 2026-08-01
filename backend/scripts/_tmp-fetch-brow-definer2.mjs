const urls = [
  "https://radiant-professional.com/en/catalogue/brow-definer-fix-color_442/",
  "https://radiant-professional.com/en/search/?q=brow+definer+waterproof",
];

for (const searchUrl of ["https://radiant-professional.com/en/search/?q=brow+definer+fix+color+waterproof"]) {
  const html = await (await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const links = [...html.matchAll(/href="(\/en\/catalogue\/[^"]+)"/gi)].map((m) => m[1]).filter((l) => /brow|definer/i.test(l));
  console.log("search links:", [...new Set(links)]);
}

async function parse(url) {
  const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  if (!t.includes("product-with-shades")) {
    console.log(url, "no shades, title:", t.match(/<title>([^<]+)/i)?.[1]);
    return;
  }
  const title = t.match(/<h1[^>]*>([^<]+)/i)?.[1]?.trim();
  const blocks = t.split('data-type="product-with-shades"');
  const shades = [];
  for (const block of blocks.slice(1)) {
    const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
    const hex = block.match(/data-shade-hex="(#[0-9A-Fa-f]{6})"/)?.[1];
    const barcode = block.match(/data-upc="(\d+)"/)?.[1];
    let img = block.match(/data-item-image="([^"]+)"/)?.[1] ?? "";
    if (img && !img.startsWith("http")) img = "https://radiant-professional.com" + img;
    if (name && hex && barcode) shades.push({ name, hex, barcode, img, ok: img.includes(barcode) });
  }
  const seen = new Set();
  const unique = shades.filter((s) => {
    if (seen.has(s.barcode)) return false;
    seen.add(s.barcode);
    return true;
  });
  console.log("\n===", title, url, "shades:", unique.length);
  for (const s of unique) console.log(JSON.stringify(s));
}

await parse("https://radiant-professional.com/en/catalogue/brow-definer-fix-color_442/");

// probe waterproof slug
for (const slug of [
  "brow-definer-fix-color-waterproof",
  "brow-definer-fix-and-color-waterproof",
  "brow-definer-waterproof",
]) {
  const s = await (await fetch(`https://radiant-professional.com/en/search/?q=${slug.replace(/-/g, "+")}`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const m = s.match(new RegExp(`/en/catalogue/${slug}_(\\d+)/`));
  if (m) console.log("found slug", slug, m[0]);
}
