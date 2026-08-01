const shades = (await (await fetch("https://elixirmakeup.gr/wp-json/wc/store/products?search=kissproof+lip+mat&per_page=100")).json())
  .filter((p) => p.sku?.startsWith("740-"))
  .sort((a, b) => a.sku.localeCompare(b.sku));

function cleanName(raw) {
  return raw
    .replace(/&#8211;/g, "–")
    .replace(/Kissproof Lip Mat\s*Κραγιόν\s*/i, "")
    .replace(/Kissproof Lip Mat\s*/i, "")
    .replace(/^#\d+\s*–\s*/i, "")
    .trim();
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
  return { url: res.url, html: await res.text(), ok: res.ok };
}

function extractBarcodes(html) {
  const fromJsonLd = [...html.matchAll(/"gtin13"\s*:\s*"(520692901\d{4})"/g)].map((m) => m[1]);
  const fromSku = [...html.matchAll(/5206929012\d{3}|5206929013\d{3}/g)].map((m) => m[0]);
  return [...new Set([...fromJsonLd, ...fromSku])];
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const currentMap = {
  "001": "5206929012925", "002": "5206929012935", "003": "5206929012945", "004": "5206929012955",
  "005": "5206929012963", "006": "5206929012975", "007": "5206929012985", "008": "5206929012995",
  "009": "5206929013005", "010": "5206929013014", "011": "5206929013025", "012": "5206929013038",
  "013": "5206929013045", "014": "5206929013055", "015": "5206929013065", "016": "5206929013075",
  "017": "5206929013085", "018": "5206929013095", "019": "5206929013105", "020": "5206929013113",
  "021": "5206929013125", "022": "5206929013135", "023": "5206929013145", "024": "5206929013155",
  "025": "5206929013165", "026": "5206929013175", "027": "5206929013185", "028": "5206929013195",
  "029": "5206929013205", "030": "5206929013212",
};

const out = [];

for (const p of shades) {
  const num = p.sku.replace("740-", "");
  const shade = cleanName(p.name);
  const slug = slugify(shade);
  const current = currentMap[num];
  let verified = null;
  let source = null;

  const tryUrls = [
    `https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-${num}-${slug}-4-5gr-${current}/`,
    `https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-${num}-${slug}-4-5gr/`,
    `https://pharmacymegastore.gr/vendors/elixir/elixir-kissproof-lip-mat-no-${num}-${slug}-45gr.htm`,
    `https://pharmacymegastore.gr/vendors/elixir/elixir-kissproof-lip-mat-${num}-${slug}-45gr.htm`,
    `https://beautyfree.gr/el/krayon/${num}-elixir-kissproof-lip-mat-${slug.replace(/-/g, "-")}-4gr-${current}.html`,
  ];

  for (const url of tryUrls) {
    try {
      const { html, ok, url: finalUrl } = await fetchPage(url);
      if (!ok || html.length < 500) continue;
      const bcs = extractBarcodes(html);
      const title = html.match(/<title>([^<]+)/i)?.[1] ?? "";
      const relevant = bcs.filter((b) => b.startsWith("5206929012") || b.startsWith("5206929013"));
      if (!relevant.length) continue;
      // Prefer barcode in URL if page loads
      if (relevant.includes(current) && /kissproof|lip.?mat|kragion|740/i.test(title + html.slice(0, 12000))) {
        verified = current;
        source = finalUrl;
        break;
      }
      if (relevant.length === 1 && /kissproof|lip.?mat|740/i.test(title + html.slice(0, 12000)) && new RegExp(num.replace(/^0+/, "") || num).test(title + html.slice(0, 12000))) {
        verified = relevant[0];
        source = finalUrl;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!verified) {
    const q = encodeURIComponent(`elixir kissproof lip mat ${num} ${shade}`);
    const search = await fetchPage(`https://kpdhellas.gr/?s=${q}&post_type=product`);
    const links = [...search.html.matchAll(/href="(https:\/\/kpdhellas\.gr\/[^"]*kissproof[^"]*${num}[^"]*)"/gi)].map((m) => m[1]);
    for (const link of [...new Set(links)].slice(0, 3)) {
      const { html } = await fetchPage(link);
      const bcs = extractBarcodes(html);
      if (bcs.length === 1) {
        verified = bcs[0];
        source = link;
        break;
      }
      if (bcs.includes(current)) {
        verified = current;
        source = link;
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const status = verified === current ? "OK" : verified ? "FIX" : "UNKNOWN";
  out.push({ num, shade, current, verified: verified ?? current, status, source });
  console.log(`${num} ${shade}: ${current} -> ${verified ?? "?"} ${status}`);
  await new Promise((r) => setTimeout(r, 300));
}

import fs from "fs";
fs.writeFileSync("scripts/_tmp-kplm-final.json", JSON.stringify(out, null, 2));
console.log("fixes:", out.filter((r) => r.status === "FIX").length);
