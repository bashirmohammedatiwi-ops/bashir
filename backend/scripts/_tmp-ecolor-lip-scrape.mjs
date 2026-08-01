import fs from "fs";

const nums = [];
for (let n = 26; n <= 70; n++) {
  if (n >= 44 && n <= 52) continue;
  nums.push(String(n).padStart(3, "0"));
}

const results = [];
for (const num of nums) {
  const url = `https://e-color.gr/en-gb/index.php?route=product/search&search=elixir+${num}+lip+pencil`;
  try {
    const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    const link = html.match(new RegExp(`href="(https://e-color\\.gr/en-gb/[^"]*elixir[^"]*${num}[^"]*)"`, "i"))?.[1];
    if (!link) {
      results.push({ num, error: "no link" });
      continue;
    }
    const page = await (await fetch(link, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    const title = page.match(/<h1[^>]*>([^<]+)/i)?.[1]?.trim();
    const name = title?.replace(/^Lip pencil waterproof\s*/i, "").replace(/\s*Elixir\s*$/i, "").trim();
    const img =
      page.match(/og:image[^>]+content="([^"]+)"/i)?.[1] ||
      page.match(/"image"\s*:\s*"([^"]+)"/i)?.[1];
    const model = page.match(/Model:\s*([^\n<]+)/i)?.[1]?.trim();
    results.push({ num, name, model, link, img });
    console.log(`${num} | ${name} | ${model}`);
    await new Promise((r) => setTimeout(r, 400));
  } catch (e) {
    results.push({ num, error: String(e) });
  }
}

fs.writeFileSync("scripts/_tmp-ecolor-lip-pencils.json", JSON.stringify(results, null, 2));
