const url = "https://radiant-professional.com/en/catalogue/lineproof-eye-liner_632/";
const t = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const paras = [...t.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
  .filter((x) => x.length > 40 && /liner|lineproof|waterproof|lash|eye/i.test(x));
for (const p of paras.slice(0, 8)) console.log(p.slice(0, 400));
