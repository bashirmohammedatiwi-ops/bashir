const url =
  "https://e-color.gr/en-gb/make-up/eyes/eye-pencils/elixir-eye-pencil-waterproof-no-044-ivory-white-5206929444443";

const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());

// shade option links
const optionLinks = [...html.matchAll(/href="([^"]*elixir-eye-pencil-waterproof[^"]*)"/gi)].map((m) => m[1]);
console.log("option links:", [...new Set(optionLinks)].length);

// shade swatches in radio/select area
const shadeBlocks = [...html.matchAll(/(\d{3})\s+([A-Za-z][A-Za-z\s]+?)(?:\s+\1|\s+<)/g)];
console.log("shade text matches:", shadeBlocks.length);

// product images
const imgs = [...html.matchAll(/(?:src|href)="(https:\/\/e-color\.gr\/image\/catalog\/product\/[^"]+)"/gi)].map((m) => m[1]);
console.log("\nproduct imgs:", [...new Set(imgs)].slice(0, 10));

// option value images from select/radio
const optImgs = [...html.matchAll(/data-image="([^"]+)"/gi)].map((m) => m[1]);
console.log("\ndata-image:", optImgs.length, optImgs.slice(0, 5));

// color swatches
const swatches = [...html.matchAll(/data-color="(#[0-9A-Fa-f]{3,8})"/gi)].map((m) => m[1]);
console.log("\nswatches:", swatches.length, swatches.slice(0, 10));

// JSON-LD or product options script
const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (jsonLd) console.log("\njsonld snippet:", jsonLd[1].slice(0, 500));

// look for product_option
const optMatch = html.match(/var\s+option\s*=\s*(\[[\s\S]*?\]);/);
if (optMatch) console.log("\noption var found", optMatch[1].slice(0, 800));

// scrape each shade page for image pattern
const shadeCodes = [
  "001","002","003","004","005","006","007","008","009","010","011","012","013","014","015","016","017","018",
  "044","046","047","048","049","050","051","081","082","083",
];

for (const code of shadeCodes.slice(0, 3)) {
  const u = `https://e-color.gr/en-gb/make-up/eyes/eye-pencils/elixir-eye-pencil-waterproof-no-${code}`;
  const h = await fetch(u, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  const og = h.match(/og:image" content="([^"]+)"/)?.[1];
  const main = [...h.matchAll(/image\/catalog\/product\/[^"']+\.(?:jpg|webp|png)/gi)].map((m) => `https://e-color.gr/${m[0]}`);
  console.log(`\n${code}:`, og, main.slice(0, 3));
}

// probe e-color image pattern 812-XXX
for (const code of ["001","015","044","050","081","082","083"]) {
  const paths = [
    `https://e-color.gr/image/catalog/product/6067/812-${code}-1.jpg`,
    `https://e-color.gr/image/catalog/product/15646/88812-${code}-1.jpg`,
    `https://e-color.gr/image/catalog/product/15647/88812-${code}-1.jpg`,
  ];
  for (const p of paths) {
    const r = await fetch(p, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.ok) console.log("OK", p);
  }
}

// beautyfree
const bf = await fetch("https://beautyfree.gr/el/14-kallintika-makeup", { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
const bfLink = bf.match(/elixir.*eye.*pencil.*waterproof[^"']*/i)?.[0];
console.log("\nbeautyfree link hint:", bfLink);
