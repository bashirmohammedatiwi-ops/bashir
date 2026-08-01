const codes = [
  "001","002","003","004","005","006","007","008","009","010","011","012","013","014","015","016","017","018",
  "044","046","047","048","049","050","051","081","082","083",
];

const names = {
  "001":"Black Diamond","002":"Graphite","003":"Iron","004":"Silver Eclipse","005":"White Night",
  "006":"Spring Green","007":"Green Forest","008":"Metallic Ocean","009":"Royal Blue","010":"Oxford Blue",
  "011":"Midnight Mauve","012":"Dark Laventer","013":"Royal Purple","014":"Sexy Brow","015":"Navy Blue",
  "016":"Metallic Green","017":"Bondi Blue","018":"Electric Blue","044":"Ivory White","046":"Tiffany Blue",
  "047":"Olive Green","048":"Aegean Blue","049":"Sky Blue","050":"Cornflower Blue","051":"Shiny Turquoise",
  "081":"Hot Diva","082":"Sunset Glow","083":"Candy Blossom",
};

const results = [];
for (const code of codes) {
  const candidates = [
    `https://elixirmakeup.gr/wp-content/uploads/2022/09/${code}.jpg`,
    `https://elixirmakeup.fi/wp-content/uploads/2016/10/${code}.jpg`,
    `https://elixirmakeup.fi/wp-content/uploads/2021/03/${code}.jpg`,
    `https://elixirmakeup.fi/wp-content/uploads/2021/03/${code}-1.jpg`,
    `https://e-color.gr/image/catalog/product/6067/812-${code}-1.jpg`,
    `https://e-color.gr/image/catalog/product/15646/88812-${code}-1.jpg`,
    `https://e-color.gr/image/catalog/product/15647/88812-${code}-1.jpg`,
  ];
  let found = null;
  for (const u of candidates) {
    const r = await fetch(u, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.ok) { found = u; break; }
  }
  results.push({ code, name: names[code], imageUrl: found });
  console.log(found ? "OK" : "MISS", code, names[code], found ?? "-");
}

console.log("\nMissing:", results.filter((r) => !r.imageUrl).map((r) => r.code));

// beautyfree silky swatches
const bfUrl = "https://beautyfree.gr/en/eye-pencils/45643-elixir-silky-eye-pencil-812a-5206929020098.html";
const bf = await fetch(bfUrl, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
const sw = [...bf.matchAll(/data-color="(#[0-9A-Fa-f]{3,8})"/gi)].map((m) => m[1]);
console.log("\nbeautyfree swatches:", sw.length);

// try fetch e-color product page option JSON via API
const apiUrl = "https://e-color.gr/index.php?route=product/product&product_id=10095";
const h = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
const opt = h.match(/"option_value":\s*(\[[\s\S]*?\])\s*,\s*"option"/);
if (opt) {
  try {
    const vals = JSON.parse(opt[1]);
    console.log("\ne-color options:", vals.length);
    for (const v of vals.slice(0, 5)) console.log(v.name, v.image);
  } catch {}
}

// check API existing
const login = await fetch("https://deemaalhayat.com/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@alhayaa.com", password: "000000" }),
}).then((r) => r.json());
const token = login.data?.accessToken ?? login.accessToken;
for (const slug of ["elixir-eye-pencil-waterproof", "elixir-silky-eye-pencil"]) {
  const p = await fetch(`https://deemaalhayat.com/api/v1/products?search=${slug}&status=all&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  const rows = p.data ?? p;
  console.log("\nAPI", slug, rows.map?.((x) => `${x.slug} (${x.id})`));
}
