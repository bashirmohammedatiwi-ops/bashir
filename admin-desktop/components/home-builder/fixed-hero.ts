import type { EditorEntities } from "./SectionPayloadEditor";

/** أنواع ثابتة في أعلى الصفحة — تُدار من صفحات البنرات والفئات، وليس من البناء. */
export const FIXED_TOP_SECTION_TYPES = ["HERO_BANNER"] as const;

export function isFixedTopSection(type: string) {
  return (FIXED_TOP_SECTION_TYPES as readonly string[]).includes(type);
}

export function filterBuilderBlocks<T extends { type: string }>(blocks: T[]): T[] {
  return blocks.filter((b) => !isFixedTopSection(b.type));
}

export function pickHeroBanners(entities: EditorEntities, limit = 6) {
  const active = (entities.banners ?? []).filter((b: any) => b.isActive !== false);
  return active.slice(0, limit);
}

export function pickHeroCategories(entities: EditorEntities, limit = 8) {
  const roots = (entities.categories ?? []).filter((c: any) => !c.parentId && c.isActive !== false);
  return roots.slice(0, limit);
}
