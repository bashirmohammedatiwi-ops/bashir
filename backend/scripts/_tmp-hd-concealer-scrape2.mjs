const catUrl = "https://elixirmakeup.gr/product-category/prosopo/concealer/hd-liquid-concealer/";
const html = await fetch(catUrl, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
const links = [...html.matchAll(/href="(https:\/\/elixirmakeup\.gr\/[^"]*744[^"]*)"/gi)].map((m) => m[1]);
const uniq = [...new Set(links)];
console.log("links", uniq.length);
for (const u of uniq) console.log(u);

// also search beautyfree, e-color, profilshop
const sources = [
  "https://beautyfree.gr/el/14-kallintika-makeup",
  "https://e-color.gr/en-gb/make-up/face/concealers",
];
for (const u of sources) {
  const h = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text()).catch(() => "");
  const found = [...h.matchAll(/hd[^"']*liquid[^"']*concealer[^"']*|744a[^"']*|744A[^"']*/gi)].slice(0, 10);
  console.log("\n", u, "matches", found.map((m) => m[0]));
}

// probe image paths 744A-001 etc
for (let i = 1; i <= 12; i++) {
  const code = String(i).padStart(3, "0");
  const paths = [
    `https://elixirmakeup.gr/wp-content/uploads/2024/04/744A-${code}-1.jpg`,
    `https://elixirmakeup.gr/wp-content/uploads/2024/03/744A-${code}-1.jpg`,
    `https://elixirmakeup.gr/wp-content/uploads/2023/11/744A-${code}-1.jpg`,
    `https://elixirmakeup.gr/wp-content/uploads/2022/09/744A-${code}-1.jpg`,
    `https://elixirmakeup.gr/wp-content/uploads/2024/04/744-${code}-1.jpg`,
  ];
  for (const p of paths) {
    const r = await fetch(p, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.ok) console.log("IMG", code, p);
  }
}

// fetch one product page for og image pattern
if (uniq[0]) {
  const p = await fetch(uniq[0], { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  const og = p.match(/og:image" content="([^"]+)"/)?.[1];
  const title = p.match(/<title>([^<]+)/)?.[1];
  const sku = p.match(/Κωδικός Προϊόντος[^<]*<[^>]*>([^<]+)/i)?.[1] ?? p.match(/744A-\d+/i)?.[0];
  console.log("\nproduct sample:", title, sku, og);
}

// beautyfree direct search
const bfSearch = await fetch("https://beautyfree.gr/el/module/iqitsearch/searchiqit?s=elixir+hd+liquid+concealer", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text()).catch(() => "");
console.log("\nbeautyfree search len", bfSearch.length);
