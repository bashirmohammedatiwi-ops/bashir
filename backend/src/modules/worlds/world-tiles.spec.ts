/** تشغيل: npx tsx src/modules/worlds/world-tiles.spec.ts */
import assert from "node:assert/strict";
import { worldTileKind, worldTiles } from "./world-tiles.util";

const lenses = {
  id: "lenses",
  parentId: null,
  parent: null,
  children: [{ id: "diva" }, { id: "freshgo" }, { id: "magister" }],
};
const face = { id: "face", parentId: "makeup", parent: { parentId: null }, children: [{ id: "foundation" }] };
const foundation = { id: "foundation", parentId: "face", parent: { parentId: "makeup" }, children: [] };

assert.equal(worldTileKind(lenses), "category", "root category");
assert.equal(worldTileKind(face), "subcategory", "subcategory");
assert.equal(worldTileKind(foundation), "tertiary", "tertiary");

const tiles = worldTiles([face, lenses, foundation]);
assert.deepEqual(
  tiles.map((t) => t.id),
  ["face", "lenses", "foundation"],
  "a linked root stays one tile, in link order (not one tile per subcategory)",
);
assert.deepEqual(tiles.map((t) => t.listingKind), ["subcategory", "category", "tertiary"], "listing kinds");
assert.ok(tiles.every((t) => t.parentId === null), "tiles are flat");
assert.deepEqual(tiles[1].children, [], "root tile opens itself, not its subcategories as tertiaries");
assert.deepEqual(tiles[0].children, face.children, "subcategory keeps its tertiary children");
console.log("world tiles: 7 passed");
