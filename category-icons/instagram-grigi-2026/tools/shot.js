const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
// usage: node shot.js in.html out.(png|jpg) width height [full|view] [scale]
(async () => {
  const [inp, out, w, h, full, scale] = process.argv.slice(2);
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(scale || 1) });
  await page.goto(pathToFileURL(inp).href, { waitUntil: 'networkidle', timeout: 180000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(500);
  const jpg = out.endsWith('.jpg');
  await page.screenshot({ path: out, fullPage: full === 'full', type: jpg ? 'jpeg' : 'png', ...(jpg ? { quality: 92 } : {}) });
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
