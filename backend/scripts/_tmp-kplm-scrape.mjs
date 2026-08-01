async function scrapeKpdPages() {
  const links = new Set();
  for (let page = 1; page <= 5; page++) {
    const url =
      page === 1
        ? "https://kpdhellas.gr/?s=kissproof+lip+mat&post_type=product"
        : `https://kpdhellas.gr/page/${page}/?s=kissproof+lip+mat&post_type=product`;
    const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    for (const m of html.matchAll(/href="(https:\/\/kpdhellas\.gr\/elixir-kissproof-lip-mat[^"]+)"/gi)) {
      links.add(m[1].replace(/\\\/$/, ""));
    }
    if (!html.includes("kissproof")) break;
    await new Promise((r) => setTimeout(r, 400));
  }
  return [...links].sort();
}

async function scrapeBeautyfree() {
  const html = await (
    await fetch("https://beautyfree.gr/index.php?route=product/search&search=elixir+kissproof+lip+mat", {
      headers: { "User-Agent": "Mozilla/5.0" },
    })
  ).text();
  const productLinks = [...html.matchAll(/href="(https:\/\/beautyfree\.gr\/[^"]*kissproof[^"]*)"/gi)].map((m) => m[1]);
  return [...new Set(productLinks)];
}

function parseProduct(html, url) {
  const bcs = [...new Set([...html.matchAll(/5206929012\d{3}|5206929013\d{3}/g)].map((m) => m[0]))];
  const title = html.match(/<title>([^<]+)/i)?.[1] ?? "";
  const num = url.match(/-(\d{3})-/)?.[1] ?? title.match(/#?(\d{3})/)?.[1] ?? title.match(/\b(0\d{2})\b/)?.[1];
  const gtin = html.match(/"gtin13"\s*:\s*"(520692901\d{4})"/)?.[1];
  return { url, title: title.slice(0, 80), num, barcodes: bcs, gtin };
}

const kpdLinks = await scrapeKpdPages();
console.log("kpd links:", kpdLinks.length);
const bfLinks = await scrapeBeautyfree();
console.log("beautyfree links:", bfLinks.length);

const map = new Map();

for (const url of [...kpdLinks, ...bfLinks]) {
  try {
    const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    const p = parseProduct(html, url);
    const bc = p.gtin ?? (p.barcodes.length === 1 ? p.barcodes[0] : p.barcodes.find((b) => url.includes(b)));
    if (p.num && bc) {
      map.set(p.num, { num: p.num, barcode: bc, url, title: p.title, all: p.barcodes });
      console.log(`${p.num} -> ${bc} | ${p.title}`);
    } else {
      console.log("skip", url.slice(0, 70), p.barcodes.join(","));
    }
  } catch (e) {
    console.log("err", url, e.message);
  }
  await new Promise((r) => setTimeout(r, 250));
}

const sorted = [...map.values()].sort((a, b) => a.num.localeCompare(b.num));
import fs from "fs";
fs.writeFileSync("scripts/_tmp-kplm-map.json", JSON.stringify(sorted, null, 2));
console.log("\nTotal mapped:", sorted.length);
