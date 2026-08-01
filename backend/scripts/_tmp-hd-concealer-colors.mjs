import sharp from "sharp";

const IMG = "https://elixirmakeup.gr/wp-content/uploads/2024/05";
const codes = ["001","002","003","004","005","006","007","008","009","010"];

for (const code of codes) {
  const url = `${IMG}/744A-${code}.jpg`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 100;
  const h = meta.height ?? 100;
  // sample center region where swatch usually is
  const left = Math.floor(w * 0.35);
  const top = Math.floor(h * 0.35);
  const width = Math.floor(w * 0.3);
  const height = Math.floor(h * 0.3);
  const { data, info } = await sharp(buf).extract({ left, top, width, height }).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const r = data[0], g = data[1], b = data[2];
  const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  console.log(code, hex, `rgb(${r},${g},${b})`);
}
