import { slugify } from "./slugify";

export const PACKAGE_KINDS = [
  { value: "GENERAL", label: "عامة", icon: "📦" },
  { value: "ROUTINE_MORNING", label: "روتين صباحي", icon: "☀️" },
  { value: "ROUTINE_EVENING", label: "روتين مسائي", icon: "🌙" },
  { value: "BRIDAL_KIT", label: "Kit عروس", icon: "💍" },
] as const;

export const SKIN_ROUTINE_KINDS = ["ROUTINE_MORNING", "ROUTINE_EVENING"] as const;

export type SkinRoutineKind = (typeof SKIN_ROUTINE_KINDS)[number];

export function kindLabel(kind?: string) {
  return PACKAGE_KINDS.find((k) => k.value === kind)?.label ?? kind ?? "—";
}

export function kindIcon(kind?: string) {
  return PACKAGE_KINDS.find((k) => k.value === kind)?.icon ?? "✨";
}

export function defaultSlugForKind(kind: string, name?: string) {
  if (kind === "ROUTINE_MORNING") return "morning-routine";
  if (kind === "ROUTINE_EVENING") return "evening-routine";
  return slugify(name ?? "package", "package");
}

export function toFormValues(row: any) {
  if (!row) {
    return { isActive: true, position: 0, isFeatured: true, kind: "GENERAL" };
  }
  return {
    name: row.name,
    slug: row.slug ?? "",
    kind: row.kind ?? "GENERAL",
    subtitle: row.subtitle ?? row.description ?? "",
    price: row.price,
    originalPrice: row.originalPrice,
    badge: row.badge,
    coverImageId: row.coverImageId ?? row.coverImage?.id,
    position: row.position,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
  };
}

export function toPayload(values: any, productIds: string[]) {
  const kind = values.kind ?? "GENERAL";
  return {
    name: values.name,
    slug: values.slug?.trim() || defaultSlugForKind(kind, values.name),
    kind,
    subtitle: values.subtitle,
    price: values.price,
    originalPrice: values.originalPrice,
    badge: values.badge,
    coverImageId: values.coverImageId ?? undefined,
    position: values.position,
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    productIds,
  };
}
