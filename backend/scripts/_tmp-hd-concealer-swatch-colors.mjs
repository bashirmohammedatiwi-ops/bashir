import sharp from "sharp";

const codes = ["001","002","003","004","005","006","007","008","009","010"];

for (const code of codes) {
  const url = `https://e-color.gr/image/catalog/colors/88744A-${code}.jpg`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.log(code, "MISSING swatch");
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 50;
  const h = meta.height ?? 50;
  const { data } = await sharp(buf)
    .extract({ left: Math.floor(w * 0.2), top: Math.floor(h * 0.2), width: Math.floor(w * 0.6), height: Math.floor(h * 0.6) })
    .resize(1, 1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const hex = `#${[data[0], data[1], data[2]].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  console.log(code, hex);
}
