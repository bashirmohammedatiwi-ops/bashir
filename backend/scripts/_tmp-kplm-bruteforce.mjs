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

const current = Object.fromEntries(
  shades.map(([n], i) => [
    n,
    [
      "5206929012925", "5206929012935", "5206929012945", "5206929012955", "5206929012963",
      "5206929012975", "5206929012985", "5206929012995", "5206929013005", "5206929013014",
      "5206929013025", "5206929013038", "5206929013045", "5206929013055", "5206929013065",
      "5206929013075", "5206929013085", "5206929013095", "5206929013105", "5206929013113",
      "5206929013125", "5206929013135", "5206929013145", "5206929013155", "5206929013165",
      "5206929013175", "5206929013185", "5206929013195", "5206929013205", "5206929013212",
    ][i],
  ]),
);

const verified = [];

for (const [num, slug, name] of shades) {
  const n = parseInt(num, 10);
  const base = 2925 + (n - 1) * 10;
  let found = null;

  for (let delta = -12; delta <= 12; delta++) {
    const suffix = base + delta;
    const barcode = `520692901${String(suffix).padStart(4, "0")}`;
    const urls = [
      `https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-${num}-${slug}-4-5gr-${barcode}/`,
      `https://kpdhellas.gr/elixir-kissproof-lip-mat-${num}-${slug}-4-5gr-${barcode}/`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
        if (!res.ok) continue;
        const html = await res.text();
        const code = html.match(/Κωδικός:\s*(520692901\d{4})/i)?.[1];
        if (code === barcode && new RegExp(`#${num.replace(/^0/, "")}?0?${num.slice(-1)}|#${num}|${num}`, "i").test(html.slice(0, 5000))) {
          found = code;
          break;
        }
      } catch {}
    }
    if (found) break;
  }

  const old = current[num];
  verified.push({ num, name, old, barcode: found, status: !found ? "MISSING" : found === old ? "OK" : "FIX" });
  console.log(`${num} ${name}: ${old} -> ${found ?? "?"} ${verified.at(-1).status}`);
}

import fs from "fs";
fs.writeFileSync("scripts/_tmp-kplm-bruteforce.json", JSON.stringify(verified, null, 2));
