export type CategoryLevel = "root" | "sub" | "tertiary";

export type CatalogCategory = {
  id: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
  image?: unknown;
  level: CategoryLevel;
  levelLabel: string;
  parentName?: string;
};

export type RawCat = {
  id: string;
  name?: string;
  nameAr?: string;
  slug?: string;
  parentId?: string | null;
  parentName?: string;
  image?: unknown;
};

const LEVEL_LABEL: Record<CategoryLevel, string> = {
  root: "رئيسي",
  sub: "فرعي",
  tertiary: "ثانوي",
};

export function categoryDisplayName(c: RawCat) {
  return c.name ?? c.nameAr ?? c.slug ?? c.id;
}

/** دمج الأقسام الرئيسية والفرعية والثانوية لاختيارها في باني الصفحة. */
export function buildCategoryCatalog(
  roots: RawCat[] = [],
  subs: RawCat[] = [],
  tertiary: RawCat[] = [],
): CatalogCategory[] {
  const out: CatalogCategory[] = [];
  for (const c of roots) {
    out.push({
      id: c.id,
      name: categoryDisplayName(c),
      slug: c.slug,
      parentId: null,
      image: c.image,
      level: "root",
      levelLabel: LEVEL_LABEL.root,
    });
  }
  for (const c of subs) {
    out.push({
      id: c.id,
      name: categoryDisplayName(c),
      slug: c.slug,
      parentId: c.parentId ?? null,
      image: c.image,
      level: "sub",
      levelLabel: LEVEL_LABEL.sub,
      parentName: c.parentName,
    });
  }
  for (const c of tertiary) {
    out.push({
      id: c.id,
      name: categoryDisplayName(c),
      slug: c.slug,
      parentId: c.parentId ?? null,
      image: c.image,
      level: "tertiary",
      levelLabel: LEVEL_LABEL.tertiary,
      parentName: c.parentName,
    });
  }
  return out;
}

export function catalogPickerItems(catalog: CatalogCategory[]) {
  return catalog.map((c) => ({
    ...c,
    name: c.parentName
      ? `${c.levelLabel} · ${c.name} (${c.parentName})`
      : `${c.levelLabel} · ${c.name}`,
  }));
}

export function catalogSelectOptions(catalog: CatalogCategory[]) {
  const groups: { label: string; options: { value: string; label: string }[] }[] = [];
  const byLevel: { level: CategoryLevel; title: string }[] = [
    { level: "root", title: "أقسام رئيسية" },
    { level: "sub", title: "أقسام فرعية" },
    { level: "tertiary", title: "أقسام ثانوية" },
  ];
  for (const g of byLevel) {
    const items = catalog.filter((c) => c.level === g.level);
    if (!items.length) continue;
    groups.push({
      label: g.title,
      options: items.map((c) => ({
        value: c.id,
        label: c.parentName ? `${c.name} — ${c.parentName}` : c.name ?? c.id,
      })),
    });
  }
  return groups;
}

export function pickCatalogByIds(catalog: CatalogCategory[], ids?: unknown): CatalogCategory[] {
  const list = Array.isArray(ids) ? (ids as string[]) : [];
  if (!list.length) return catalog.filter((c) => c.level === "root").slice(0, 12);
  const map = new Map(catalog.map((c) => [c.id, c]));
  return list.map((id) => map.get(id)).filter(Boolean) as CatalogCategory[];
}
