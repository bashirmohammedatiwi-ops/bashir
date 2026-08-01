import { writeFileSync } from "fs";

const url = "https://e-color.gr/en-gb/make-up/face/concealers-3-223/elixir-hd-liquid-concealer-8ml-88744a";
const html = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
writeFileSync("scripts/_tmp-ecolor-hd.html", html);

const optionBlock = html.match(/class="form-group required options[\s\S]{0,12000}/)?.[0] ?? "";
console.log("option block len", optionBlock.length);
console.log(optionBlock.slice(0, 4000));

const sw = [...html.matchAll(/data-color="(#[0-9A-Fa-f]{3,8})"/gi)].map((m) => m[1]);
console.log("\ndata-color count", sw.length, sw);

const labels = [...html.matchAll(/title="(\d{3})"/gi)].map((m) => m[1]);
console.log("title codes", labels);

// extract option product images from radio labels
for (const m of html.matchAll(/<img[^>]*src="([^"]*744A[^"]*)"[^>]*alt="([^"]*)"/gi)) {
  console.log("img alt", m[2], m[1]);
}
