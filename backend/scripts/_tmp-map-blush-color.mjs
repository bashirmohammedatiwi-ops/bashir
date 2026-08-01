const IMG_BASE = "https://radiant-professional.com/media/images/products/2021/10";
const radiant = [
  ["107 Pink Rose", "#D8ADAD", "5201641033777", "radiant_blush_color_102_fxH6CHN.jpg"],
  ["109 Shimmering Sand", "#b17b69", "5201641641224", "radiant_blush_color_107_59gZnnm.jpg"],
  ["111 Plum", "#bf707a", "5201641641248", "radiant_blush_color_109_f8FWlWO.jpg"],
  ["112 Apricot", "#c17a6a", "5201641645802", "radiant_blush_color_111_jHvdnUU.jpg"],
  ["113 Winter Plum", "#b46f69", "5201641648599", "radiant_blush_color_112_I75Py8F.jpg"],
  ["116 Rose", "#bf9092", "5201641648605", "radiant_blush_color_113_8Tvvdn3.jpg"],
  ["117 Rosy Apricot", "#e08987", "5201641657874", "radiant_blush_color_116_RKdlenw.jpg"],
  ["119 Red Earth", "#c16d4d", "5201641657881", "radiant_blush_color_117_pS5sfYS.jpg"],
  ["120 Apple Rose", "#d87e73", "5201641666302", "radiant_blush_color_119_e4BYfG0.jpg"],
  ["121 Winter Rose", "#b65e6b", "5201641668719", "radiant_blush_color_120_PVujBpn.jpg"],
  ["123 Ceramic Brown", "#b26352", "5201641668726", "radiant_blush_color_121_kXBiwbi.jpg"],
  ["127 Pearly Apricot", "#d77c6b", "5201641678534", "radiant_blush_color_123_rOv7Ak4.jpg"],
  ["129 Pearly Peach", "#e0886d", "5201641684696", "radiant_blush_color_127_ZhFsQ64.jpg"],
  ["135", "#9F785A", "5201641698037", "radiant_blush_color_129_BkDWa0C.jpg"],
  ["136 Blush Color", "#c0647e", "5201641714263", "radiant_blush_color_135_YGUSWkH.jpg"],
  ["138 Brilliant Rose", "#e57c83", "5201641731819", "radiant_blush_color_136_yOUSJmZ.jpg"],
  ["139 Pomegranate", "#c3555e", "5201641739983", "radiant_blush_color_138_aR3kIek.jpg"],
  ["102 Apple Brown", "#a76548", "5201641739990", "radiant_blush_color_139_PdP7ROU.jpg"],
];

// Build image lookup by number in filename
const imgByNum = new Map();
for (const [name, hex, bc, file] of radiant) {
  const num = file.match(/blush_color_(\d+)/)?.[1];
  if (num) imgByNum.set(num, file);
}

function shadeNum(name) {
  const m = name.match(/^(\d+)/);
  return m?.[1] ?? null;
}

// Correct image = filename matching shade number
console.log("=== Correct images by shade number in filename ===");
for (const [name, hex] of radiant.map((r) => [r[0], r[1]])) {
  const n = shadeNum(name);
  const file = n ? imgByNum.get(n) : null;
  console.log(`${name.padEnd(22)} #${n} → ${file ?? "MISSING"}`);
}

// Forward rotate barcodes in numeric shade order
const sorted = [...radiant].sort((a, b) => Number(shadeNum(a[0]) ?? 999) - Number(shadeNum(b[0]) ?? 999));
console.log("\n=== Forward rotate barcodes ===");
for (let i = 0; i < sorted.length; i++) {
  const [name, hex] = sorted[i];
  const nextBc = sorted[(i + 1) % sorted.length][2];
  const n = shadeNum(name);
  const file = n ? imgByNum.get(n) : sorted[i][3];
  console.log(JSON.stringify({ name, colorHex: hex, barcode: nextBc, image: file }));
}
