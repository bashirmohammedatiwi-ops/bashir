const QUERIES = [
  "24hr cream",
  "visible rejuvenation botox radiance",
  "matt finish transparent base",
  "magnetic palette sultry eyes",
];

for (const q of QUERIES) {
  const searchUrl = `https://radiant-professional.com/en/search/?q=${encodeURIComponent(q)}`;
  const html = await (await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const links = [...html.matchAll(/href="(\/en\/catalogue\/[^"]+)"/gi)].map((m) => m[1]);
  const unique = [...new Set(links)].filter((l) => {
    const slug = l.toLowerCase();
    return (
      slug.includes("24hr") ||
      slug.includes("botox") ||
      slug.includes("rejuvenation") ||
      slug.includes("matt-finish") ||
      slug.includes("transparent-base") ||
      slug.includes("magnetic") ||
      slug.includes("sultry")
    );
  });
  console.log("\n===", q, "===");
  console.log(unique.slice(0, 5));
}
