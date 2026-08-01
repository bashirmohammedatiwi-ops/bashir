const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  return res.text();
}

// Search bone.ua
const searchHtml = await fetchText("https://bone.ua/en/search?q=kissproof+lip+mat");
const linkRe = /\/en\/product\/elixir-pomada-dlja-gub-ridka-matova-kissproof-lip-mat-ton-(\d+)-([a-z0-9-]+)/gi;
const urls = new Map();
for (const m of searchHtml.matchAll(linkRe)) {
  const num = m[1].padStart(3, "0");
  urls.set(num, { num, slug: m[2], url: `https://bone.ua/en/product/elixir-pomada-dlja-gub-ridka-matova-kissproof-lip-mat-ton-${m[1]}-${m[2]}` });
}

// Also try UA search
const searchUa = await fetchText("https://bone.ua/search?q=kissproof+lip+mat");
for (const m of searchUa.matchAll(/\/product\/elixir-pomada-dlja-gub-ridka-matova-kissproof-lip-mat-ton-(\d+)-([a-z0-9-]+)/gi)) {
  const num = m[1].padStart(3, "0");
  if (!urls.has(num)) {
    urls.set(num, { num, slug: m[2], url: `https://bone.ua/en/product/elixir-pomada-dlja-gub-ridka-matova-kissproof-lip-mat-ton-${m[1]}-${m[2]}` });
  }
}

console.log(`Found ${urls.size} URLs from search\n`);

const results = [];
for (const { num, slug, url } of [...urls.values()].sort((a, b) => a.num.localeCompare(b.num))) {
  try {
    const html = await fetchText(url);
    const title = html.match(/<h1[^>]*>\s*([^<]+)/i)?.[1]?.trim();
    const sku = html.match(/Elixir SKU\s*(\d{13})/i)?.[1] ?? html.match(/520692901\d{4}/)?.[0];
    const img = html.match(/og:image[^>]+content="([^"]+)"/i)?.[1]
      ?? html.match(/"image"\s*:\s*"([^"]+)"/i)?.[1]
      ?? html.match(/src="(https:\/\/bone\.ua[^"]*upload[^"]+)"/i)?.[1];
    const nameFromTitle = title?.replace(/^Liquid Lipstick Elixir Kissproof Lip Mat\s*/i, "").trim();
    const nameFromSlug = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    results.push({ num, slug, name: nameFromTitle || `${num} ${nameFromSlug}`, sku, img, url });
    console.log(`${num} | ${nameFromTitle || nameFromSlug} | ${sku ?? "?"}`);
    await new Promise((r) => setTimeout(r, 300));
  } catch (e) {
    console.log(`${num} ERROR: ${e.message}`);
  }
}

import fs from "fs";
fs.writeFileSync("scripts/_tmp-bone-kplm.json", JSON.stringify(results, null, 2));
console.log(`\nSaved ${results.length} shades`);
