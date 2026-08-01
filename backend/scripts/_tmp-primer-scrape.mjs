const pages = [
  ["834", "https://beautyfree.gr/el/primers-makeup-kallintika/23480-5206929500323-elixir-face-primer-multifunctional-no-834.html"],
  ["854", "https://beautyfree.gr/el/primers-makeup-kallintika/23481-5206929500330-elixirface-primer-nourishing-effect-no-854.html"],
  ["bright", "https://beautyfree.gr/el/primers-makeup-kallintika/7765-elixir-face-primer-brightening-30ml-5206929335970.html"],
];

for (const [label, url] of pages) {
  const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  const og = html.match(/og:image" content="([^"]+)"/)?.[1];
  const imgs = [...html.matchAll(/(\d+-large_default\/[^"']+\.(?:jpg|webp|png))/gi)].map((m) => `https://beautyfree.gr/${m[1]}`);
  const uniq = [...new Set([og, ...imgs].filter(Boolean))];
  console.log(`\n${label} og:`, og);
  console.log(uniq.slice(0, 4));
}

const elixirPaths = [
  "834.jpg", "854.jpg", "935.jpg", "936.jpg", "937.jpg", "938.jpg",
  "5206929500323.jpg", "5206929500330.jpg", "5206929335970.jpg", "5206929335963.jpg",
];
for (const p of elixirPaths) {
  const u = `https://elixirmakeup.gr/wp-content/uploads/2022/09/${p}`;
  const r = await fetch(u, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
  if (r.ok) console.log("elixir OK:", u);
}

const API = "https://deemaalhayat.com/api/v1";
const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@alhayaa.com", password: "000000" }),
}).then((r) => r.json());
const token = login.data?.accessToken ?? login.accessToken;
const cats = await fetch(`${API}/categories`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
const walk = (list, depth = 0) => {
  for (const c of list ?? []) {
    if (/primer/i.test(c.nameEn || c.slug || c.nameAr || "")) {
      console.log("  ".repeat(depth), c.id, c.slug, c.nameEn);
    }
    walk(c.children, depth + 1);
  }
};
walk(cats.data ?? cats);
