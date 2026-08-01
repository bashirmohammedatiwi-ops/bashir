const BARCODES = [
  ["86 Azalea", "5201641747988"],
  ["92 Burnt Orange", "5201641023198"],
  ["93 Natural", "5201641033913"],
  ["94 Dalia", "5201641038253"],
  ["95 Strawberry", "5201641038260"],
  ["97 Strawberry", "5201641038277"],
  ["98 Metal Pink", "5201641043998"],
  ["99 Rose Metal", "5201641044001"],
  ["100 Coral", "5201641044018"],
  ["101 Bare", "5201641044025"],
  ["102 Hyacinth", "5201641044032"],
  ["103 Hazel", "5201641044049"],
  ["104 Toffee", "5201641044056"],
  ["105 Fiery", "5201641052310"],
  ["106 Flamingo", "5201641052327"],
  ["107 Cerise", "5201641052334"],
];

for (const [ourName, bc] of BARCODES) {
  try {
    const html = await (await fetch(`https://milva.gr/en/${bc}.html`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })).text();
    const h1 = html.match(/<h1[^>]*>([^<]+)/i)?.[1]?.trim() ?? "?";
    const shade = h1.match(/(\d{2,3})\b/)?.[1] ?? h1.match(/(Azalea|Burnt Orange|Natural|Dalia|Strawberry|Metal|Rose|Coral|Bare|Hyacinth|Hazel|Toffee|Fiery|Flamingo|Cerise)/i)?.[0];
    const ok = ourName.toLowerCase().includes(String(shade).toLowerCase()) || ourName.startsWith(String(shade));
    console.log(`${ok ? "✓" : "✗"} ${ourName} | barcode ${bc} | milva: ${h1.slice(0, 70)}`);
  } catch (e) {
    console.log(`? ${ourName} | ${bc} | error`);
  }
  await new Promise((r) => setTimeout(r, 350));
}
