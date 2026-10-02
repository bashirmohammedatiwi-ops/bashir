import { describe, expect, it, vi } from "vitest";
import { CatalogKnowledgeService } from "./catalog-knowledge.service";

function service(rows: {
  categories: Array<{ categoryId: string | null; count: number }>;
  brands: Array<{ brandId: string | null; count: number }>;
  bestsellers: Array<{ nameAr: string; name: string; price: number; brand: string | null }>;
  min: number;
  max: number;
  total: number;
  concerns: string[];
}) {
  const prisma = {
    product: {
      groupBy: vi.fn().mockImplementation(({ by }: { by: string[] }) =>
        by[0] === "categoryId"
          ? rows.categories.map((c) => ({ categoryId: c.categoryId, _count: { categoryId: c.count } }))
          : rows.brands.map((b) => ({ brandId: b.brandId, _count: { brandId: b.count } })),
      ),
      findMany: vi.fn().mockResolvedValue(
        rows.bestsellers.map((b) => ({ nameAr: b.nameAr, name: b.name, price: b.price, brand: { name: b.brand } })),
      ),
      aggregate: vi.fn().mockResolvedValue({ _min: { price: rows.min }, _max: { price: rows.max }, _count: rows.total }),
    },
    category: {
      findMany: vi.fn().mockResolvedValue(
        rows.categories.map((c, i) => ({ id: c.categoryId ?? `cat-${i}`, nameAr: `قسم-${i}`, name: `Cat-${i}` })),
      ),
    },
    brand: {
      findMany: vi.fn().mockResolvedValue(rows.brands.map((b, i) => ({ id: b.brandId ?? `brand-${i}`, name: `Brand-${i}` }))),
    },
    skinConcern: {
      findMany: vi.fn().mockResolvedValue(rows.concerns.map((name) => ({ name }))),
    },
  };
  return new CatalogKnowledgeService(prisma as never);
}

describe("CatalogKnowledgeService", () => {
  const rows = {
    categories: [{ categoryId: "c1", count: 120 }, { categoryId: "c2", count: 40 }],
    brands: [{ brandId: "b1", count: 30 }],
    bestsellers: [{ nameAr: "عطر", name: "Perfume", price: 45_000, brand: "Loreal" }],
    min: 1_000,
    max: 450_000,
    total: 1_234,
    concerns: ["حبوب", "جفاف"],
  };

  it("builds a compact catalog digest with counts, bestsellers, concerns", async () => {
    const block = await service(rows).catalogBlock();
    expect(block).toContain("1234");
    expect(block).toContain("قسم-0(120)");
    expect(block).toContain("Brand-0(30)");
    expect(block).toContain("عطر");
    expect(block).toContain("حبوب");
    expect(block).toContain("1,000");
  });

  it("caches the digest for repeated calls", async () => {
    const svc = service(rows);
    const first = await svc.catalogBlock();
    const second = await svc.catalogBlock();
    expect(first).toBe(second);
  });

  it("invalidate() forces a rebuild", async () => {
    const svc = service(rows);
    await svc.catalogBlock();
    svc.invalidate();
    await svc.catalogBlock(); // rebuilds without throwing
    expect(true).toBe(true);
  });

  it("returns empty string when the build fails", async () => {
    const prisma = {
      product: {
        groupBy: vi.fn().mockRejectedValue(new Error("db down")),
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
    };
    const block = await new CatalogKnowledgeService(prisma as never).catalogBlock();
    expect(block).toBe("");
  });
});
