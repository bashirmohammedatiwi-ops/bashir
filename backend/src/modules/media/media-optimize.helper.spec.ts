import assert from "node:assert/strict";
import sharp from "sharp";
import { flattenAlphaToWhite, optimizeForStorage } from "./media-optimize.helper";

async function transparentPng(): Promise<Buffer> {
  return sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
}

async function run() {
  const input = await transparentPng();

  const optimized = await optimizeForStorage(input);
  const webpMeta = await sharp(optimized.webpBuffer).metadata();
  const thumbMeta = await sharp(optimized.thumbWebpBuffer).metadata();
  const jpegMeta = await sharp(optimized.jpegBuffer).metadata();

  assert.equal(webpMeta.hasAlpha, true, "master webp should keep alpha");
  assert.equal(thumbMeta.hasAlpha, true, "thumb webp should keep alpha");
  assert.equal(jpegMeta.hasAlpha, false, "jpeg should not have alpha channel");

  const flattened = await (await flattenAlphaToWhite(sharp(input))).webp().toBuffer();
  const flatMeta = await sharp(flattened).metadata();
  assert.notEqual(flatMeta.hasAlpha, true, "flatten helper removes transparency");

  const legacy = await optimizeForStorage(input, { preserveAlpha: false });
  const legacyWebpMeta = await sharp(legacy.webpBuffer).metadata();
  assert.notEqual(legacyWebpMeta.hasAlpha, true, "legacy mode flattens all outputs");

  console.log("media-optimize.helper.spec.ts OK");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
