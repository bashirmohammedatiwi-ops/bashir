const urls = [
  "https://radiant-professional.com/en/catalogue/cream-24hr-spf15_301/",
  "https://radiant-professional.com/en/catalogue/visible-rejuvenation-botox-radiance-effect_302/",
  "https://radiant-professional.com/en/catalogue/matt-finish-transparent-base_19/",
  "https://radiant-professional.com/en/catalogue/magnetic_palette_02_sultry_eyes_993/",
];

for (const url of urls) {
  const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const title = t.match(/<h1[^>]*>([^<]+)</)?.[1]?.trim();
  console.log("\n====", title, "====");

  const sections = [
    ...t.matchAll(/<(?:h2|h3|strong)[^>]*>([^<]{3,80})<\/[^>]+>[\s\S]{0,800}?/gi),
  ];
  for (const m of sections.slice(0, 8)) console.log("SEC:", m[1].trim());

  const textBlocks = [...t.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((x) => x.length > 30);
  for (const p of textBlocks.slice(0, 6)) console.log("P:", p.slice(0, 300));

  const li = [...t.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((x) => x.length > 10);
  for (const l of li.slice(0, 10)) console.log("LI:", l.slice(0, 200));

  const jsonLd = t.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  if (jsonLd) console.log("LD:", jsonLd.slice(0, 500));
}
