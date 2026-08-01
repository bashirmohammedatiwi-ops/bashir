const barcodes = [
  { shade: "01 Light Brown", barcode: "5201641019078" },
  { shade: "02 Natural Brown", barcode: "5201641018828" },
  { shade: "03 Dark Brown", barcode: "5201641018835" },
];

for (const { shade, barcode } of barcodes) {
  const brocard = `https://www.brocard.ua/en/catalogsearch/result/?q=${barcode}`;
  const res = await fetch(brocard, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
  const html = await res.text();
  const title = html.match(/<title>([^<]+)</)?.[1]?.trim();
  const productLink = html.match(/href="(\/en\/[^"]+)"[^>]*class="[^"]*product[^"]*"/i)?.[1];
  const h1 = html.match(/<h1[^>]*>([^<]+)</)?.[1]?.trim();
  console.log("\n===", shade, barcode, "===");
  console.log("title:", title);
  console.log("h1:", h1);
  if (productLink) {
    const pRes = await fetch("https://www.brocard.ua" + productLink, { headers: { "User-Agent": "Mozilla/5.0" } });
    const pHtml = await pRes.text();
    const pTitle = pHtml.match(/<h1[^>]*>([^<]+)</)?.[1]?.trim();
    const sku = pHtml.match(/SKU[^0-9]*(\d{13})/i)?.[1];
    console.log("product:", pTitle, "sku:", sku);
  }
}

// Also verify barcode-check on our API
const API = "https://deemaalhayat.com/api/v1";
const login = await fetch(API + "/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@alhayaa.com", password: "000000" }),
});
const { data } = await login.json();
const token = data.accessToken;
console.log("\n=== API barcode-check ===");
for (const { shade, barcode } of barcodes) {
  const r = await fetch(API + `/products/barcode-check?barcode=${barcode}`, {
    headers: { Authorization: "Bearer " + token },
  });
  const j = await r.json();
  const hit = j.data || j;
  console.log(barcode, "->", hit.product?.nameEn, "| shade:", hit.matchedShade?.name);
}
