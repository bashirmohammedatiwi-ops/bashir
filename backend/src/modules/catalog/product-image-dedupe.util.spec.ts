import assert from "node:assert/strict";
import {
  dedupeKeysForMedia,
  partitionDuplicateProductImages,
  type MediaForDedupe,
} from "./product-image-dedupe.util";

function media(overrides: Partial<MediaForDedupe> & { id: string }): MediaForDedupe {
  return {
    hash: `hash-${overrides.id}`,
    filename: `file-${overrides.id}`,
    storagePath: "products/2026/01",
    publicUrlBase: "/media/products/2026/01",
    originalName: `photo-${overrides.id}.jpg`,
    width: 800,
    height: 800,
    bytes: 120_000,
    ...overrides,
  };
}

// same original filename but different files — must keep both
const sameNameDifferentFiles = partitionDuplicateProductImages([
  { id: "pi-1", mediaId: "m-1", media: media({ id: "m-1", originalName: "a.jpg" }) },
  { id: "pi-2", mediaId: "m-2", media: media({ id: "m-2", originalName: "a.jpg", width: 800, height: 800 }) },
]);
assert.equal(sameNameDifferentFiles.removeIds.length, 0);
assert.equal(sameNameDifferentFiles.keep.length, 2);

// same content hash (true duplicate)
const sameHash = partitionDuplicateProductImages([
  { id: "pi-1", mediaId: "m-1", media: media({ id: "m-1", hash: "dup-hash" }) },
  { id: "pi-2", mediaId: "m-2", media: media({ id: "m-2", hash: "dup-hash", originalName: "other.jpg" }) },
]);
assert.equal(sameHash.removeIds.length, 1);
assert.equal(sameHash.keep.length, 1);

// same display url path
const byUrl = partitionDuplicateProductImages([
  {
    id: "pi-1",
    mediaId: "m-1",
    media: media({ id: "m-1", filename: "abc", publicUrlBase: "/media/x" }),
  },
  {
    id: "pi-2",
    mediaId: "m-2",
    media: media({ id: "m-2", hash: "other", filename: "abc", publicUrlBase: "/media/x" }),
  },
]);
assert.equal(byUrl.removeIds.length, 1);

assert.ok(dedupeKeysForMedia(media({ id: "x" })).length >= 4);

console.log("product-image-dedupe.util.spec.ts OK");
