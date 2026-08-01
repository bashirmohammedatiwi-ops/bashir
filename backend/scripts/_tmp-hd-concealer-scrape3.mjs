const codes = ["001","002","003","004","005","006","007","008","009","010"];
const dirs = ["2024/05","2024/04","2024/03","2023/11"];

for (const code of codes) {
  let found = null;
  for (const dir of dirs) {
    for (const suffix of [`744A-${code}-1.jpg`, `744A-${code}.jpg`, `744-${code}-1.jpg`, `744-${code}.jpg`]) {
      const u = `https://elixirmakeup.gr/wp-content/uploads/${dir}/${suffix}`;
      const r = await fetch(u, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
      if (r.ok) { found = u; break; }
    }
    if (found) break;
  }
  console.log(code, found ?? "MISSING");
}

const ecolor = await fetch(
  "https://e-color.gr/en-gb/make-up/face/concealers-3-223/elixir-hd-liquid-concealer-8ml-88744a",
  { headers: { "User-Agent": "Mozilla/5.0" } },
).then((r) => r.text());

const shadeLines = [...ecolor.matchAll(/(\d{3})\s+([A-Za-z][A-Za-z\s]+?)(?:\s+\1|\s+<|\s+€)/g)];
console.log("\ne-color shade lines", shadeLines.map((m) => `${m[1]} ${m[2].trim()}`));

const optImgs = [...ecolor.matchAll(/88812-(\d{3})-1\.jpg|88744A-(\d{3})-1\.jpg|812-(\d{3})-1\.jpg|744A-(\d{3})/gi)];
console.log("opt img refs", [...new Set(optImgs.map((m) => m[0]))]);

for (const code of codes) {
  const paths = [
    `https://e-color.gr/image/catalog/product/12866/88744A-${code}-1.jpg`,
    `https://e-color.gr/image/catalog/product/12866/888744A-${code}-1.jpg`,
    `https://e-color.gr/image/cache/catalog/product/12866/88744A-${code}-1-1200x1190w.jpg`,
  ];
  for (const p of paths) {
    const r = await fetch(p, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.ok) console.log("ecolor img", code, p);
  }
}

// scrape product pages for shade names/colors from elixirmakeup
const pages = {
  "001": "https://elixirmakeup.gr/shop/prosopo/concealer/hd-liquid-concealer/xtra-coverage-liquid-concealer-744-001/",
  "002": "https://elixirmakeup.gr/shop/prosopo/concealer/hd-liquid-concealer/xtra-coverage-liquid-concealer-744-002/",
  "007": "https://elixirmakeup.gr/shop/prosopo/concealer/hd-liquid-concealer/xtra-coverage-liquid-concealer-744-007/",
  "008": "https://elixirmakeup.gr/shop/prosopo/concealer/hd-liquid-concealer/xtra-coverage-liquid-concealer-744-008/",
  "009": "https://elixirmakeup.gr/shop/prosopo/concealer/hd-liquid-concealer/xtra-coverage-liquid-concealer-744-009/",
  "010": "https://elixirmakeup.gr/shop/prosopo/concealer/hd-liquid-concealer/xtra-coverage-liquid-concealer-744-010/",
};
for (const [code, url] of Object.entries(pages)) {
  const h = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  const og = h.match(/og:image" content="([^"]+)"/)?.[1];
  const color = h.match(/Χρώμα[^<]*<[^>]*>([^<]+)/i)?.[1]?.trim();
  console.log("\n", code, color, og);
}
