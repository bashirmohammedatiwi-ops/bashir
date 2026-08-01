import * as fs from "node:fs";
import * as path from "node:path";

const html = fs.readFileSync(
  path.resolve(process.cwd(), "..", "ilove-brand-export", "drive-folder.html"),
  "utf8",
);

const barcodes = html.match(/5060[0-9]{10}/g);
console.log("barcodes in html:", barcodes ? new Set(barcodes).size : 0);

const folderMime = (html.match(/application\/vnd\.google-apps\.folder/g) || []).length;
console.log("folder mime count:", folderMime);

// Google Drive often embeds: "filename","5060..."
const pairs: Array<{ name: string; id: string }> = [];
const idRe = /"([a-zA-Z0-9_-]{20,44})"/g;
const nameRe = /"(5060[0-9]{10}|SKU-[0-9]+)"/g;

// Try AF_initDataCallback chunks
const chunks = html.match(/AF_initDataCallback\([\s\S]*?\);/g) || [];
console.log("AF_initDataCallback chunks:", chunks.length);

for (const chunk of chunks.slice(0, 3)) {
  const names = chunk.match(/5060[0-9]{10}/g);
  if (names) console.log("chunk barcodes:", names.slice(0, 5));
}

// Generic: find ["5060...", ..., "FOLDER_ID"]
const combo =
  /\["(5060[0-9]{10}|SKU-[0-9]+)"[^\]]{0,200}?"([a-zA-Z0-9_-]{25,44})"/g;
let m;
while ((m = combo.exec(html)) !== null) {
  pairs.push({ name: m[1], id: m[2] });
}
console.log("combo pairs:", pairs.length);
if (pairs.length) console.log(pairs.slice(0, 10));
