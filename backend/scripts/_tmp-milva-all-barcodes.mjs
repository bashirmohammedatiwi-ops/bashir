const ALL = [
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

function parseMilvaShade(h1) {
  const n = h1.match(/\b(\d{2,3})\b(?!.*\b\d{2,3}\b)/)?.[1] ?? h1.match(/- (\d{2,3})$/)?.[1];
  if (n) return n;
  const names = ["Azalea", "Burnt Orange", "Natural", "Dalia", "Strawberry", "Metal Pink", "Rose Metal", "Coral", "Bare", "Hyacinth", "Hazel", "Toffee", "Fiery", "Flamingo", "Cerise", "Nude"];
  for (const nm of names) if (h1.toLowerCase().includes(nm.toLowerCase())) return nm;
  return h1.slice(0, 50);
}

const milvaMap = new Map();
const mismatches = [];

for (const [ourName, bc] of ALL) {
  try {
    const html = await (await fetch(`https://milva.gr/en/${bc}.html`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })).text();
    if (html.includes("404") || html.includes("not found")) {
      mismatches.push({ ourName, bc, milva: "NOT FOUND" });
      continue;
    }
    const h1 = html.match(/<h1[^>]*>([^<]+)/i)?.[1]?.trim() ?? "?";
    const milvaShade = parseMilvaShade(h1);
    milvaMap.set(bc, { milvaShade, h1 });
    const ourNum = ourName.match(/^\d+/)?.[0] ?? ourName;
    const ok = ourName.includes(String(milvaShade)) || ourNum === String(milvaShade);
    if (!ok) mismatches.push({ ourName, bc, milva: milvaShade, h1: h1.slice(0, 65) });
  } catch {
    mismatches.push({ ourName, bc, milva: "ERROR" });
  }
  await new Promise((r) => setTimeout(r, 300));
}

console.log(`Mismatches: ${mismatches.length}/41\n`);
for (const m of mismatches) {
  console.log(`✗ ${m.ourName.padEnd(16)} ${m.bc} → milva: ${m.milva} | ${m.h1 ?? ""}`);
}

// Build inverse: shade number -> barcode from milva
console.log("\n--- Milva authoritative shade→barcode ---");
const byShade = new Map();
for (const [bc, { milvaShade }] of milvaMap) {
  if (/^\d+$/.test(milvaShade)) byShade.set(milvaShade, bc);
}
for (const n of ["71", "86", "92", "93", "94", "95", "97", "98", "99", "100", "101", "102", "103", "104", "105", "106", "107"]) {
  console.log(`  ${n}: ${byShade.get(n) ?? "?"}`);
}
