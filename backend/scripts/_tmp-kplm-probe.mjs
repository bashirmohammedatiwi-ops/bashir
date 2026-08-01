const shades = [
  ["001", "red-wine"], ["002", "love-red"], ["003", "toffee"], ["004", "bean-red"],
  ["005", "cocoa"], ["006", "valentine-red"], ["007", "malt"], ["008", "peach-melody"],
  ["009", "tapioca-cream"], ["010", "speckletone-wine"], ["011", "milky-chocolate"],
  ["012", "rust"], ["013", "irish-cream"], ["014", "almond-joy"], ["015", "cranberry"],
  ["016", "moonshine"], ["017", "crimson-silk"], ["018", "candy-floss"], ["019", "guava-jelly"],
  ["020", "chilli-red"], ["021", "indian-red"], ["022", "brown-sugar"], ["023", "burgundy"],
  ["024", "bohemian-princess"], ["025", "pecan"], ["026", "rouge"], ["027", "dark-pink"],
  ["028", "chestnut"], ["029", "pine-cone"], ["030", "brick-red"],
];

const out = [];

for (const [num, slug] of shades) {
  const prefixes = [
    `https://kpdhellas.gr/elixir-kissproof-lip-mat-kragion-${num}-${slug}-4-5gr`,
    `https://kpdhellas.gr/elixir-kissproof-lip-mat-${num}-${slug}-4-5gr`,
    `https://pharmacymegastore.gr/vendors/elixir/elixir-kissproof-lip-mat-no-${num}-${slug}-45gr.htm`,
    `https://pharmacymegastore.gr/vendors/elixir/elixir-kissproof-lip-mat-${num}-${slug}-45gr.htm`,
  ];

  let barcode = null;
  let source = null;

  for (const base of prefixes) {
    for (const url of [base, `${base}/`]) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
        const html = await res.text();
        if (html.length < 800) continue;
        const bc =
          html.match(/Κωδικός:\s*(520692901\d{4})/i)?.[1] ??
          html.match(/Barcode:\s*(520692901\d{4})/i)?.[1] ??
          html.match(/"gtin13"\s*:\s*"(520692901\d{4})"/)?.[1] ??
          url.match(/520692901\d{4}/)?.[0];
        if (bc && /kissproof|lip.?mat|kragion|740/i.test(html.slice(0, 15000))) {
          barcode = bc;
          source = res.url;
          break;
        }
      } catch {}
    }
    if (barcode) break;
    await new Promise((r) => setTimeout(r, 150));
  }

  out.push({ num, slug, barcode, source });
  console.log(`${num} ${slug}: ${barcode ?? "NOT FOUND"}`);
  await new Promise((r) => setTimeout(r, 200));
}

import fs from "fs";
fs.writeFileSync("scripts/_tmp-kplm-authoritative.json", JSON.stringify(out, null, 2));
