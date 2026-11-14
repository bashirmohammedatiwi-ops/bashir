/** نوع قائمة بلاطة قسم في رئيسية العالم — يحدد المعامل الذي تُفتح به قائمة المنتجات. */
export type WorldTileKind = "category" | "subcategory" | "tertiary";

type TileNode = { parentId?: string | null; parent?: { parentId?: string | null } | null };

/**
 * القسم المربوط بالعالم يظهر بلاطة واحدة بحسب مستواه:
 * رئيسي → categoryId (كل منتجاته، مثل «عدسات» بكل ماركاتها)، فرعي → subcategoryId، دقيق → tertiaryCategoryId.
 * القسم الرئيسي لا يُوسَّع إلى أقسامه الفرعية — وإلا ظهرت كل ماركة عدسات بلاطة مستقلة،
 * وكل قسم فرعي جديد تحته بلاطة إضافية.
 */
export function worldTileKind(node: TileNode): WorldTileKind {
  if (!node.parentId) return "category";
  return node.parent?.parentId ? "tertiary" : "subcategory";
}

/**
 * بلاطات العالم بترتيب ربطها. القسم الرئيسي يُرسل بلا children: شاشة العالم في التطبيق
 * تفتح أبناء البلاطة كأقسام دقيقة تحتها، وأبناء الرئيسي أقسام فرعية — فتُفتح البلاطة نفسها.
 */
export function worldTiles<T extends TileNode & { children?: unknown[] }>(linked: T[]) {
  return linked.map((node) => {
    const listingKind = worldTileKind(node);
    return {
      ...node,
      parentId: null,
      listingKind,
      ...(listingKind === "category" ? { children: [] as T["children"] } : {}),
    };
  });
}
