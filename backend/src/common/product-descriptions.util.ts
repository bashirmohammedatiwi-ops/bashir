export type ProductDescriptionInput = {
  description?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
};

export type ResolvedProductDescriptions = {
  description: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
};

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveProductDescriptions(
  input: ProductDescriptionInput,
): ResolvedProductDescriptions {
  const descriptionAr = trimOrNull(input.descriptionAr);
  const descriptionEn = trimOrNull(input.descriptionEn);
  const legacy = trimOrNull(input.description);
  const description = descriptionAr ?? descriptionEn ?? legacy ?? "";

  return { description, descriptionAr, descriptionEn };
}

export function primaryProductDescription(
  product: {
    description?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
  },
  locale: "ar" | "en" = "ar",
): string {
  if (locale === "en") {
    return product.descriptionEn ?? product.descriptionAr ?? product.description ?? "";
  }
  return product.descriptionAr ?? product.descriptionEn ?? product.description ?? "";
}
