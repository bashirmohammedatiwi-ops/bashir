/**
 * Full verify: API vs add-script vs radiant site barcodes/images
 */
const API_BASE = "https://deemaalhayat.com/api/v1";
const SLUG = "radiant-professional-matt-lasting-lip-color";
const RADIANT_URL = "https://radiant-professional.com/en/catalogue/matt-lasting-lip-color_336/";

// Expected from add script (authoritative after prior fixes)
const EXPECTED = [
  ["01", "5201641052341"], ["02", "5201641723821"], ["04", "5201641723838"], ["05", "5201641723852"],
  ["06", "5201641723869"], ["07", "5201641723876"], ["08", "5201641723883"], ["11", "5201641723890"],
  ["13", "5201641723920"], ["14", "5201641725047"], ["15", "5201641725054"], ["17", "5201641725061"],
  ["18", "5201641725085"], ["19", "5201641727331"], ["21", "5201641727379"], ["22", "5201641727393"],
  ["33", "5201641727430"], ["35", "5201641734094"], ["42", "5201641734117"], ["43", "5201641737132"],
  ["50", "5201641737149"], ["51", "5201641740149"], ["59", "5201641740156"], ["60", "5201641742051"],
  ["71 Nude", "5201641742068"], ["86 Azalea", "5201641747988"], ["92 Burnt Orange", "5201641023198"],
  ["93 Natural", "5201641033913"], ["94 Dalia", "5201641038253"], ["95 Strawberry", "5201641038260"],
  ["97 Strawberry", "5201641038277"], ["98 Metal Pink", "5201641043998"], ["99 Rose Metal", "5201641044001"],
  ["100 Coral", "5201641044018"], ["101 Bare", "5201641044025"], ["102 Hyacinth", "5201641044032"],
  ["103 Hazel", "5201641044049"], ["104 Toffee", "5201641044056"], ["105 Fiery", "5201641052310"],
  ["106 Flamingo", "5201641052327"], ["107 Cerise", "5201641052334"],
];

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@alhayaa.com", password: "000000" }),
  });
  const j = await res.json();
  return j.data?.accessToken ?? j.accessToken;
}

async function fetchRadiant() {
  const t = await (await fetch(RADIANT_URL, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const blocks = t.split('data-type="product-with-shades"');
  const shades = [];
  for (const block of blocks.slice(1)) {
    const name = block.match(/data-shade-description="([^"]+)"/)?.[1];
    const barcode = block.match(/data-upc="(\d+)"/)?.[1];
    let img = block.match(/data-item-image="([^"]+)"/)?.[1] ?? "";
    if (img && !img.startsWith("http")) img = "https://radiant-professional.com" + img;
    if (name && barcode) shades.push({ name, barcode, img });
  }
  return shades;
}

const token = await login();
const list = await (await fetch(`${API_BASE}/products?search=${SLUG}&status=all&limit=5`, {
  headers: { Authorization: `Bearer ${token}` },
})).json();
const rows = list.data ?? list;
const product = rows.find((p) => p.slug === SLUG);
const full = await (await fetch(`${API_BASE}/products/${product.id}`, {
  headers: { Authorization: `Bearer ${token}` },
})).json();
const apiShades = (full.data ?? full).shades.sort((a, b) => a.position - b.position);

const radiant = await fetchRadiant();
const radiantByName = new Map(radiant.map((s) => [s.name.trim(), s]));

console.log(`API shades: ${apiShades.length}, Expected: ${EXPECTED.length}, Radiant: ${radiant.length}\n`);

const barcodeMismatches = [];
const radiantBarcodeMismatches = [];
const dupBarcodes = new Map();
const dupImages = new Map();

for (const s of apiShades) {
  const bc = s.barcode?.trim();
  if (bc) dupBarcodes.set(bc, (dupBarcodes.get(bc) ?? 0) + 1);
  if (s.imageId) dupImages.set(s.imageId, (dupImages.get(s.imageId) ?? 0) + 1);
}

const expMap = new Map(EXPECTED.map(([n, b]) => [n, b]));

for (const s of apiShades) {
  const exp = expMap.get(s.name);
  if (!exp) {
    console.log(`? Unknown shade in API: ${s.name}`);
    continue;
  }
  if (s.barcode !== exp) barcodeMismatches.push({ name: s.name, api: s.barcode, expected: exp });

  const rad = radiantByName.get(s.name);
  if (rad && rad.barcode !== exp) {
    radiantBarcodeMismatches.push({ name: s.name, radiant: rad.barcode, expected: exp, ours: s.barcode });
  }
}

const dupBc = [...dupBarcodes.entries()].filter(([, c]) => c > 1);
const dupImg = [...dupImages.entries()].filter(([, c]) => c > 1);

console.log("=== Barcode vs add-script ===");
if (!barcodeMismatches.length) console.log("✓ All 41 barcodes match add-script");
else {
  console.log(`✗ ${barcodeMismatches.length} mismatches:`);
  for (const m of barcodeMismatches) console.log(`  ${m.name}: API=${m.api} expected=${m.expected}`);
}

console.log("\n=== Barcode vs radiant site (expected = brocard/epharmadora) ===");
if (!radiantBarcodeMismatches.length) console.log("✓ Our barcodes differ from radiant where radiant is wrong — checking...");
else {
  console.log(`${radiantBarcodeMismatches.length} shades where radiant barcode ≠ our expected:`);
  for (const m of radiantBarcodeMismatches.slice(0, 15)) {
    console.log(`  ${m.name}: radiant=${m.radiant} ours=${m.ours} (expected=${m.expected})`);
  }
  if (radiantBarcodeMismatches.length > 15) console.log(`  ... +${radiantBarcodeMismatches.length - 15} more`);
}

console.log("\n=== Duplicate barcodes in API ===");
if (!dupBc.length) console.log("✓ No duplicate barcodes");
else for (const [bc, c] of dupBc) console.log(`✗ ${bc} used ${c} times`);

console.log("\n=== Duplicate images in API ===");
if (!dupImg.length) console.log(`✓ All ${apiShades.length} shades have unique imageIds`);
else {
  console.log(`✗ ${dupImg.length} imageIds shared by multiple shades:`);
  for (const [id, c] of dupImg) console.log(`  ${id}: ${c} shades`);
}

// Spot-check epharmadora for shades 93-107 and a few random
const epharmChecks = [
  ["93 Natural", "5201641033913"],
  ["94 Dalia", "5201641038253"],
  ["104 Toffee", "5201641044056"],
  ["01", "5201641052341"],
  ["92 Burnt Orange", "5201641023198"],
];

console.log("\n=== Spot epharmadora search ===");
for (const [name, barcode] of epharmChecks) {
  const q = encodeURIComponent(`radiant matt lasting ${name.split(" ")[0]}`);
  const url = `https://www.epharmadora.com/en/search?q=${q}`;
  try {
    const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" })).text();
    const found = html.includes(barcode) ? "FOUND" : "not found";
    console.log(`  ${name} (${barcode}): ${found}`);
  } catch (e) {
    console.log(`  ${name}: fetch error`);
  }
  await new Promise((r) => setTimeout(r, 300));
}
