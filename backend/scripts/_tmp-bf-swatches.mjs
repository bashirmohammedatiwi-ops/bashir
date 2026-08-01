const url =
  "https://beautyfree.gr/el/molybia-mation-makeup-kallintika/45643-elixir-silky-eye-pencil-812a-5206929020098.html";
const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
const sw = [...html.matchAll(/data-color="(#[0-9A-Fa-f]{3,8})"/gi)].map((m) => m[1]);
const labels = [...html.matchAll(/title="(\d{3} [^"]+)"/gi)].map((m) => m[1]);
console.log("swatches", sw.length, "labels", labels.length);
for (let i = 0; i < Math.min(labels.length, sw.length); i++) console.log(labels[i], sw[i]);
const og = html.match(/og:image" content="([^"]+)"/);
console.log("og", og?.[1]);
