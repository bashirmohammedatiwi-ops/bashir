const urls = [
  ["872C", "https://beautyfree.gr/el/paletes-skiwn-makeup-kallintika/20976-elixir-eyeshadow-palette-15-clrs-872c-5206929500484.html"],
  ["872A", "https://beautyfree.gr/el/paletes-skiwn-makeup-kallintika/20974-elixir-eyeshadow-palette-15-clrs-872a-5206929500460.html"],
];
for (const [code, url] of urls) {
  const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const og = t.match(/property="og:image" content="([^"]+)"/)?.[1];
  const imgs = [...t.matchAll(/(\d+-large_default\/[^"']+872[^"']+\.(?:jpg|jpeg|png))/gi)].map((m) => "https://beautyfree.gr/" + m[1]);
  console.log("\n", code, og);
  console.log([...new Set(imgs)]);
}

const base = "https://elixirmakeup.gr/wp-content/uploads";
for (const folder of ["2022/09", "2023/11", "2024/04", "2024/06"]) {
  for (const f of ["872A.jpg", "872A-1.jpg", "872A_mockup.jpg", "872C.jpg", "872C-1.jpg", "872C_mockup.jpg"]) {
    const u = `${base}/${folder}/${f}`;
    const r = await fetch(u, { method: "HEAD" });
    if (r.status === 200) console.log("FOUND", u);
  }
}

const pages = [
  ["872A", "https://elixirmakeup.gr/shop/paletes/paletes-skion/elixir-eyeshadow-palette-872a-pink-bloom/"],
  ["872C", "https://elixirmakeup.gr/shop/paletes/paletes-skion/elixir-eyeshadow-palette-872c-dizzy-fuchsia/"],
  ["872A2", "https://elixirmakeup.gr/?s=872A&post_type=product"],
  ["872C2", "https://elixirmakeup.gr/?s=872C&post_type=product"],
];
for (const [code, url] of pages) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (r.status !== 200) { console.log(code, "404"); continue; }
  const t = await r.text();
  const og = t.match(/property="og:image" content="([^"]+)"/)?.[1];
  console.log(code, og);
}

const login = await fetch("https://deemaalhayat.com/api/v1/auth/login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@alhayaa.com", password: "000000" }),
});
const { data } = await login.json();
const res = await fetch("https://deemaalhayat.com/api/v1/categories?includeChildren=true", {
  headers: { Authorization: `Bearer ${data.accessToken}`, Accept: "application/json" },
});
const rows = (await res.json()).data;
function walk(list, depth = 0) {
  for (const c of list ?? []) {
    if (/palette|eyeshadow|palettes/i.test(c.nameEn || c.slug || "")) {
      console.log("  ".repeat(depth) + c.id, c.slug, c.nameEn);
    }
    walk(c.children ?? c.subcategories ?? c.tertiaryCategories, depth + 1);
  }
}
walk(rows);
