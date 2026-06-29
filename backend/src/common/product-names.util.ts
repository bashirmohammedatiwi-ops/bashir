import { BadRequestException } from "@nestjs/common";

export type ProductNameInput = {
  name?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
};

export type ResolvedProductNames = {
  name: string;
  nameAr: string | null;
  nameEn: string | null;
};

function trimOrNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveProductNames(input: ProductNameInput): ResolvedProductNames {
  const nameAr = trimOrNull(input.nameAr);
  const nameEn = trimOrNull(input.nameEn);
  const legacyName = trimOrNull(input.name);
  const name = nameAr ?? nameEn ?? legacyName;

  if (!name) {
    throw new BadRequestException("At least one product name is required (Arabic or English)");
  }

  return { name, nameAr, nameEn };
}

export function primaryProductName(
  product: { name?: string | null; nameAr?: string | null; nameEn?: string | null },
  locale: "ar" | "en" = "ar",
): string {
  if (locale === "en") {
    return product.nameEn ?? product.nameAr ?? product.name ?? "";
  }
  return product.nameAr ?? product.nameEn ?? product.name ?? "";
}
