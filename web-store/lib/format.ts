export function formatPrice(iqd: number): string {
  return `${iqd.toLocaleString("ar-IQ")} د.ع`;
}

export function localizedName(
  item: { name?: string; nameAr?: string | null; nameEn?: string | null },
  lang: "ar" | "en" = "ar",
): string {
  if (lang === "ar") return item.nameAr || item.name || item.nameEn || "";
  return item.nameEn || item.name || item.nameAr || "";
}
