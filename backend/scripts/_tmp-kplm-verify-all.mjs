const shades = [
  ["001", "red-wine", "Red Wine", "5206929012925"],
  ["002", "love-red", "Love Red", "5206929012935"],
  ["003", "toffee", "Toffee", "5206929012945"],
  ["004", "bean-red", "Bean Red", "5206929012955"],
  ["005", "cocoa", "Cocoa", "5206929012963"],
  ["006", "valentine-red", "Valentine Red", "5206929012975"],
  ["007", "malt", "Malt", "5206929012985"],
  ["008", "peach-melody", "Peach Melody", "5206929012995"],
  ["009", "tapioca-cream", "Tapioca Cream", "5206929013005"],
  ["010", "speckletone-wine", "Speckletone Wine", "5206929013014"],
  ["011", "milky-chocolate", "Milky Chocolate", "5206929013025"],
  ["012", "rust", "Rust", "5206929013038"],
  ["013", "irish-cream", "Irish Cream", "5206929013045"],
  ["014", "almond-joy", "Almond Joy", "5206929013055"],
  ["015", "cranberry", "Cranberry", "5206929013065"],
  ["016", "moonshine", "Moonshine", "5206929013075"],
  ["017", "crimson-silk", "Crimson Silk", "5206929013085"],
  ["018", "candy-floss", "Candy Floss", "5206929013095"],
  ["019", "guava-jelly", "Guava Jelly", "5206929013105"],
  ["020", "chilli-red", "Chilli Red", "5206929013113"],
  ["021", "indian-red", "Indian Red", "5206929013125"],
  ["022", "brown-sugar", "Brown Sugar", "5206929013135"],
  ["023", "burgundy", "Burgundy", "5206929013145"],
  ["024", "bohemian-princess", "Bohemian Princess", "5206929013155"],
  ["025", "pecan", "Pecan", "5206929013165"],
  ["026", "rouge", "Rouge", "5206929013175"],
  ["027", "dark-pink", "Dark Pink", "5206929013185"],
  ["028", "chestnut", "Chestnut", "5206929013195"],
  ["029", "pine-cone", "Pine Cone", "5206929013205"],
  ["030", "brick-red", "Brick Red", "5206929013212"],
];

function slugVariants(num, slug, name) {
  return [
    `https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-${num}-${slug}-4-5gr-520692901${num.padStart(3, "0").slice(-3)}/`,
    `https://kpdhellas.gr/?s=${encodeURIComponent(`kissproof lip mat ${num} ${name}`)}&post_type=product`,
    `https://pharmacymegastore.gr/vendors/elixir/elixir-kissproof-lip-mat-no-${num}-${slug}-45gr.htm`,
    `https://pharmacymegastore.gr/vendors/elixir/elixir-kissproof-lip-mat-${num}-${slug}-45gr.htm`,
  ];
}

const results = [];

for (const [num, slug, name, current] of shades) {
  let verified = null;
  let source = null;

  // Direct URL probe with barcode in path (kpdhellas pattern)
  const directUrls = [
    `https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-${num}-${slug}-4-5gr-${current}/`,
    `https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-${num}-${slug.replace(/-/g, "-")}-4-5gr/`,
  ];

  for (const url of [...directUrls, ...slugVariants(num, slug, name)]) {
    try {
      const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" })).text();
      const bcs = [...new Set([...html.matchAll(/5206929012\d{3}|5206929013\d{3}/g)].map((m) => m[0]))];
      const title = html.match(/<title>([^<]+)/i)?.[1] ?? "";
      const hasShade = new RegExp(`#?0?${num.replace(/^0/, "")}|${num}|${name}`, "i").test(title + html.slice(0, 8000));
      if (bcs.length === 1 && hasShade) {
        verified = bcs[0];
        source = url.split("/")[2];
        break;
      }
      if (bcs.includes(current)) {
        verified = current;
        source = url.split("/")[2] + " (matched current)";
        break;
      }
      // pick barcode ending near shade number if single product page
      const pageBc = bcs.find((b) => b === current) ?? (bcs.length === 1 ? bcs[0] : null);
      if (pageBc && /kissproof|lip.?mat|kragion/i.test(html)) {
        verified = pageBc;
        source = url.split("/")[2];
        if (verified !== current) break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }

  const status = verified === current ? "OK" : verified ? "MISMATCH" : "UNVERIFIED";
  results.push({ num, name, current, verified, status, source });
  console.log(`${num} ${name}: current=${current} verified=${verified ?? "?"} ${status} ${source ?? ""}`);
}

import fs from "fs";
fs.writeFileSync("scripts/_tmp-kplm-verify.json", JSON.stringify(results, null, 2));
const bad = results.filter((r) => r.status !== "OK");
console.log("\nSummary:", results.filter((r) => r.status === "OK").length, "OK,", bad.length, "issues");
if (bad.length) console.log(JSON.stringify(bad, null, 2));
