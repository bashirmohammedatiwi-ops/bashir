const codes = ["001","002","003","004","005","006","007","008","009","010"];
for (const code of codes) {
  const paths = [
    `https://e-color.gr/image/catalog/colors/88744A-${code}.jpg`,
    `https://e-color.gr/image/cache/catalog/colors/88744A-${code}-100x100.jpg`,
  ];
  for (const p of paths) {
    const r = await fetch(p, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.ok) console.log("OK", code, p);
  }
}
