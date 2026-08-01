const BARCODES = {
  "92 Burnt Orange": "5201641023198",
  "93 Natural": "5201641033913",
  "94 Dalia": "5201641038253",
  "95 Strawberry": "5201641038260",
  "97 Strawberry": "5201641038277",
  "98 Metal Pink": "5201641043998",
  "99 Rose Metal": "5201641044001",
  "100 Coral": "5201641044018",
  "101 Bare": "5201641044025",
  "102 Hyacinth": "5201641044032",
  "103 Hazel": "5201641044049",
  "104 Toffee": "5201641044056",
  "105 Fiery": "5201641052310",
  "106 Flamingo": "5201641052327",
  "107 Cerise": "5201641052334",
};

const URLS = [
  (bc) => `https://milva.gr/en/${bc}.html`,
  (bc) => `https://www.ofarmakopoiosmou.gr/en/search?q=${bc}`,
  (bc) => `https://www.rouge.com.gr/en/search?q=${bc}`,
];

async function lookupBarcode(barcode) {
  for (const mk of URLS) {
    const url = mk(barcode);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
      const html = await res.text();
      const shade =
        html.match(/(?:shade|No\.?|No)\s*(\d{2,3})\b/i)?.[1] ??
        html.match(/matt lasting[^0-9]*(\d{2,3})/i)?.[1] ??
        html.match(/(\d{2,3})\s*(?:Natural|Dalia|Strawberry|Coral|Bare|Hyacinth|Hazel|Toffee|Fiery|Flamingo|Cerise|Metal|Rose|Burnt)/i)?.[1];
      const title = html.match(/<title>([^<]+)/i)?.[1]?.trim();
      if (shade || (title && title.toLowerCase().includes("matt lasting"))) {
        return { url, shade: shade ?? "?", title: title?.slice(0, 80) };
      }
    } catch { /* next */ }
  }
  return null;
}

for (const [name, barcode] of Object.entries(BARCODES)) {
  const info = await lookupBarcode(barcode);
  const match = info?.shade && name.includes(info.shade) ? "✓" : info?.shade ? `? ext=${info.shade}` : "?";
  console.log(`${match} ${name} (${barcode}) → ${info?.shade ?? "not found"} | ${info?.title ?? ""}`);
  await new Promise((r) => setTimeout(r, 400));
}
