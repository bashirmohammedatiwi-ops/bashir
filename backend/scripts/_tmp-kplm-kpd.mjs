const shades = [
  ["001", "red-wine", "Red Wine"],
  ["002", "love-red", "Love Red"],
  ["003", "toffee", "Toffee"],
  ["004", "bean-red", "Bean Red"],
  ["005", "cocoa", "Cocoa"],
  ["006", "valentine-red", "Valentine Red"],
  ["007", "malt", "Malt"],
  ["008", "peach-melody", "Peach Melody"],
  ["009", "tapioca-cream", "Tapioca Cream"],
  ["010", "speckletone-wine", "Speckletone Wine"],
  ["011", "milky-chocolate", "Milky Chocolate"],
  ["012", "rust", "Rust"],
  ["013", "irish-cream", "Irish Cream"],
  ["014", "almond-joy", "Almond Joy"],
  ["015", "cranberry", "Cranberry"],
  ["016", "moonshine", "Moonshine"],
  ["017", "crimson-silk", "Crimson Silk"],
  ["018", "candy-floss", "Candy Floss"],
  ["019", "guava-jelly", "Guava Jelly"],
  ["020", "chilli-red", "Chilli Red"],
  ["021", "indian-red", "Indian Red"],
  ["022", "brown-sugar", "Brown Sugar"],
  ["023", "burgundy", "Burgundy"],
  ["024", "bohemian-princess", "Bohemian Princess"],
  ["025", "pecan", "Pecan"],
  ["026", "rouge", "Rouge"],
  ["027", "dark-pink", "Dark Pink"],
  ["028", "chestnut", "Chestnut"],
  ["029", "pine-cone", "Pine Cone"],
  ["030", "brick-red", "Brick Red"],
];

const current = {
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

for (const [num, slug, name] of shades) {
  const q = encodeURIComponent(`kissproof lip mat ${num}`);
  const html = await (await fetch(`https://kpdhellas.gr/?s=${q}&post_type=product`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  })).text();

  const links = [...html.matchAll(/href="(https:\/\/kpdhellas\.gr\/elixir-kissproof-lip-mat[^"]+)"/gi)].map((m) =>
    m[1].replace(/\\\/$/, ""),
  );

  let barcode = null;
  let url = null;

  for (const link of [...new Set(links)]) {
    if (!new RegExp(`${num}|#${num.replace(/^0/, "")}`, "i").test(link)) continue;
    const bcFromUrl = link.match(/520692901\d{4}/)?.[0];
    if (bcFromUrl) {
      barcode = bcFromUrl;
      url = link;
      break;
    }
    const page = await (await fetch(link, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    const bc =
      page.match(/Κωδικός:\s*(520692901\d{4})/i)?.[1] ??
      page.match(/"gtin13"\s*:\s*"(520692901\d{4})"/)?.[1] ??
      [...page.matchAll(/5206929012\d{3}|5206929013\d{3}/g)].map((m) => m[0])[0];
    if (bc) {
      barcode = bc;
      url = link;
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const old = current[num];
  const status = !barcode ? "MISSING" : barcode === old ? "OK" : "FIX";
  out.push({ num, name, old, barcode, status, url });
  console.log(`${num} ${name}: ${old} -> ${barcode ?? "?"} ${status}`);
  await new Promise((r) => setTimeout(r, 350));
}

import fs from "fs";
fs.writeFileSync("scripts/_tmp-kplm-kpd.json", JSON.stringify(out, null, 2));
console.log("fixes:", out.filter((r) => r.status === "FIX").length);
