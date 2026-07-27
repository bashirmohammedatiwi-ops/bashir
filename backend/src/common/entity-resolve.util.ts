import type { PrismaClient } from "@prisma/client";
import { isUuid } from "./link-target.util";

export async function resolveBrandId(prisma: PrismaClient, raw?: string | null) {
  const value = raw?.trim();
  if (!value) return undefined;
  if (isUuid(value)) return value;
  const row = await prisma.brand.findFirst({
    where: { OR: [{ id: value }, { slug: value }] },
    select: { id: true },
  });
  return row?.id;
}

export async function resolveCategoryId(prisma: PrismaClient, raw?: string | null) {
  const value = raw?.trim();
  if (!value) return undefined;
  if (isUuid(value)) return value;
  const row = await prisma.category.findFirst({
    where: { OR: [{ id: value }, { slug: value }] },
    select: { id: true },
  });
  return row?.id;
}
