const urls = [
  "https://beautyweb.gr/elixir-hd-liquid-concealer-2.html",
  "https://beautyweb.gr/elixir-hd-liquid-concealer.html",
];

for (const url of urls) {
  console.log("\n===", url);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "el-GR,el;q=0.9,en;q=0.8",
    },
  });
  console.log("status", res.status, res.url);
  if (!res.ok) continue;
  const html = await res.text();
  console.log("title", html.match(/<title>([^<]+)/i)?.[1]);
  const og = html.match(/property="og:image" content="([^"]+)"/)?.[1];
  console.log("og", og);

  const prices = [...html.matchAll(/(\d+[.,]\d{2})\s*€/g)].map((m) => m[1]);
  console.log("prices", [...new Set(prices)].slice(0, 5));

  // Magento configurable options / swatches
  const jsonConfig = html.match(/"jsonConfig"\s*:\s*(\{[\s\S]*?\})\s*,\s*"jsonSwatchConfig"/);
  if (jsonConfig) {
    try {
      const cfg = JSON.parse(jsonConfig[1]);
      const attrs = cfg.attributes ?? {};
      for (const [k, v] of Object.entries(attrs)) {
        const attr = v;
        console.log("attr", k, attr.label, "options", attr.options?.length);
        for (const opt of attr.options ?? []) {
          console.log(" ", opt.id, opt.label, opt.products?.length ?? 0);
        }
      }
      const idx = cfg.index ?? {};
      console.log("index entries", Object.keys(idx).length);
      for (const [pid, attrsMap] of Object.entries(idx).slice(0, 3)) {
        console.log(" sample product", pid, attrsMap);
      }
      const imgs = cfg.images ?? {};
      console.log("image product ids", Object.keys(imgs).length);
      for (const [pid, arr] of Object.entries(imgs).slice(0, 2)) {
        console.log(" sample imgs", pid, arr[0]);
      }
    } catch (e) {
      console.log("jsonConfig parse fail", String(e));
    }
  }

  const swatch = html.match(/"jsonSwatchConfig"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/);
  if (swatch) {
    try {
      const sw = JSON.parse(swatch[1]);
      for (const [attrId, val] of Object.entries(sw)) {
        console.log("swatch attr", attrId);
        for (const [optId, data] of Object.entries(val)) {
          if (typeof data === "object" && data && "value" in data) {
            console.log(" ", optId, data.value ?? data.label);
          }
        }
      }
    } catch {}
  }

  // fallback: option labels in HTML
  const opts = [...html.matchAll(/option-label[^>]*>([^<]+)</gi)].map((m) => m[1].trim());
  if (opts.length) console.log("option-labels", opts.slice(0, 20));

  const skus = [...html.matchAll(/"sku"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  console.log("skus", [...new Set(skus)].slice(0, 15));

  const eans = [...html.matchAll(/5206929\d{6}/g)].map((m) => m[0]);
  console.log("eans", [...new Set(eans)].slice(0, 15));
}

// category ids
const login = await fetch("https://deemaalhayat.com/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@alhayaa.com", password: "000000" }),
}).then((r) => r.json());
const token = login.data?.accessToken ?? login.accessToken;
const cats = await fetch("https://deemaalhayat.com/api/v1/categories", {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());
const walk = (list, depth = 0) => {
  for (const c of list ?? []) {
    if (/conceal|corrector|face/i.test(`${c.nameEn} ${c.slug}`)) {
      console.log("  ".repeat(depth), c.id, c.slug, c.nameEn);
    }
    walk(c.children ?? [], depth + 1);
  }
};
console.log("\nCategories:");
walk(cats.data ?? cats);
