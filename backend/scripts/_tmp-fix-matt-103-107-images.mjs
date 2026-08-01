/** Fix shades 103-107 images after barcode rotation. */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const IMG = "https://radiant-professional.com/media/images/products";
const SLUG = "radiant-professional-matt-lasting-lip-color";

const IMAGE_FIX = {
  "103 Hazel": `${IMG}/2025/09/radiant_matt_lasting_lip_color_102_1.jpg`,
  "104 Toffee": `${IMG}/2026/04/104_TOFFEE.jpg`,
  "105 Fiery": `${IMG}/2026/04/105_FIERY.jpg`,
  "106 Flamingo": `${IMG}/2026/04/106_FLAMINGO.jpg`,
  "107 Cerise": `${IMG}/2026/04/107_CERISE.jpg`,
};

let token = "";
async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@alhayaa.com", password: "000000" }),
  });
  token = (await res.json()).data?.accessToken ?? "";
}

async function upload(url, alt) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`download ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/jpeg" }), `${alt}.jpg`);
  form.append("purpose", "PRODUCT");
  const up = await fetch(`${API_BASE}/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await up.json();
  if (!up.ok) throw new Error(JSON.stringify(json));
  return json.data.id;
}

await login();
const list = await (await fetch(`${API_BASE}/products?search=${SLUG}&status=all&limit=5`, {
  headers: { Authorization: `Bearer ${token}` },
})).json();
const product = list.data.find((p) => p.slug === SLUG);
const full = (await (await fetch(`${API_BASE}/products/${product.id}`, {
  headers: { Authorization: `Bearer ${token}` },
})).json()).data;

for (const s of full.shades) {
  const url = IMAGE_FIX[s.name];
  if (!url) continue;
  s.imageId = await upload(url, s.name);
  console.log(`✓ ${s.name} → ${url.split("/").pop()}`);
  await new Promise((r) => setTimeout(r, 400));
}

full.shades.forEach((s, i) => (s.position = i));
const imageIds = [...new Set(full.shades.map((s) => s.imageId).filter(Boolean))];
await fetch(`${API_BASE}/products/${product.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ shades: full.shades, imageIds }),
});
console.log(`\nPatched ${imageIds.length} unique images`);
