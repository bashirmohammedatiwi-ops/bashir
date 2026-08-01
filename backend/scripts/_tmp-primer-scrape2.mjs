const checks = [
  ["834", "https://elixirmakeup.gr/wp-content/uploads/2022/09/834.jpg"],
  ["834-2", "https://elixirmakeup.gr/wp-content/uploads/2023/11/834.jpg"],
  ["935", "https://elixirmakeup.gr/wp-content/uploads/2022/09/935.jpg"],
  ["936", "https://elixirmakeup.gr/wp-content/uploads/2022/09/936.jpg"],
  ["937", "https://elixirmakeup.gr/wp-content/uploads/2022/09/937.jpg"],
  ["938", "https://elixirmakeup.gr/wp-content/uploads/2022/09/938.jpg"],
];

for (const [label, u] of checks) {
  const r = await fetch(u, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
  console.log(label, r.status, u);
}

const prof = await fetch(
  "https://www.profilshop.gr/omorfia-and-peripoiisi/prosopo/elixir-make-up-make-up-face-primer-makeup-extending-30ml/",
  { headers: { "User-Agent": "Mozilla/5.0" } },
).then((r) => r.text());
const imgs = [...prof.matchAll(/https:\/\/www\.profilshop\.gr[^"']+\.(?:jpg|webp|png)/gi)].slice(0, 8);
console.log("\nprofilshop imgs:", imgs.map((m) => m[0]));

const pages = [
  "https://elixirmakeup.gr/shop/prosopo/primer/elixir-face-primer-makeup-extending-30ml/",
  "https://elixirmakeup.gr/shop/prosopo/primer/elixir-face-primer-brightening-30ml/",
  "https://elixirmakeup.gr/shop/prosopo/primer/elixir-face-primer-multifunctional-no-834/",
  "https://elixirmakeup.gr/shop/prosopo/primer/elixir-face-primer-nourishing-effect-no-854/",
];
for (const url of pages) {
  const r = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0" } });
  console.log(r.status, url);
  if (r.status === 200) {
    const html = await r.text();
    const og = html.match(/og:image" content="([^"]+)"/)?.[1];
    console.log(" og:", og);
  }
}
