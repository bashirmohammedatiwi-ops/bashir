const url = "https://e-color.gr/en-gb/make-up/face/concealers-3-223/elixir-hd-liquid-concealer-8ml-88744a";
const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());

// radio options
for (const m of html.matchAll(/<input[^>]*type="radio"[^>]*value="(\d+)"[^>]*>/gi)) {
  console.log("radio", m[1]);
}
for (const m of html.matchAll(/<label[^>]*for="option-value-\d+"[^>]*>([\s\S]*?)<\/label>/gi)) {
  console.log("label", m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

// option images in select
for (const m of html.matchAll(/option-value-(\d+)[^"]*"[^>]*data-image="([^"]+)"/gi)) {
  console.log("optimg", m[1], m[2]);
}

// product_option_value in script
for (const m of html.matchAll(/"option_value_id"\s*:\s*"(\d+)"[\s\S]*?"name"\s*:\s*"([^"]+)"/g)) {
  console.log("json opt", m[1], m[2]);
}

// simpler: all 744A-xxx refs
const refs = [...html.matchAll(/744A-(\d{3})/g)].map((m) => m[1]);
console.log("\n744A refs", [...new Set(refs)].sort());

// image catalog refs
const imgs = [...html.matchAll(/image\/catalog\/product\/12866\/([^"' ]+)/g)].map((m) => m[1]);
console.log("\ncatalog imgs", [...new Set(imgs)].sort());

// search elixir ks for shade names
const ks = await fetch("https://elixir-ks.com/en/product-category/face/concealer/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text()).catch(() => "");
const ks744 = [...ks.matchAll(/744A[^<"']*/gi)].map((m) => m[0]);
console.log("\nks refs", [...new Set(ks744)].slice(0, 20));

// fetch each elixirmakeup page title for any color name in description
for (let i = 1; i <= 10; i++) {
  const code = String(i).padStart(3, "0");
  const url2 = `https://elixirmakeup.gr/shop/prosopo/concealer/hd-liquid-concealer/xtra-coverage-liquid-concealer-744-${code}/`;
  const h = await fetch(url2, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text()).catch(() => "");
  if (!h || h.length < 1000) {
    console.log(code, "404/no page");
    continue;
  }
  const title = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
  const specColor = h.match(/Χρώμα[\s\S]{0,80}?<td[^>]*>([^<]+)/i)?.[1]?.trim();
  const green = /πράσινο|green|corrector|ερυθρά/i.test(h) ? "GREEN/CORRECTOR" : "";
  console.log(code, title, specColor ?? green);
}
