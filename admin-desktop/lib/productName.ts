export function displayProductName(product: {
  nameAr?: string | null;
  nameEn?: string | null;
  name?: string | null;
}) {
  return product.nameAr?.trim() || product.nameEn?.trim() || product.name?.trim() || "—";
}

export function slugSourceName(values: {
  nameAr?: string | null;
  nameEn?: string | null;
  name?: string | null;
}) {
  return values.nameAr?.trim() || values.nameEn?.trim() || values.name?.trim() || "";
}

export function productNameValidator(getOther: () => string | undefined) {
  return {
    validator: async (_: unknown, value?: string) => {
      const current = value?.trim() ?? "";
      const other = getOther()?.trim() ?? "";
      if (!current && !other) {
        throw new Error("أدخل الاسم بالعربية أو الإنجليزية (أحدهما على الأقل)");
      }
    },
  };
}
