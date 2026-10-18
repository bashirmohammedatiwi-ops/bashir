import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { serverGet, serverTry } from "./api";
import type { Brand, Category, HomeFeed, Paged, Product, World } from "./types";

export const getWorlds = cache(() => serverTry<World[]>("/worlds", { revalidate: 300 }).then((w) => w ?? []));

/** العالم الحالي: من الرابط (?world=) أو الكوكي، وإلا أول عالم. */
export const currentWorld = cache(async (requested?: string | null): Promise<World | null> => {
  const worlds = await getWorlds();
  if (!worlds.length) return null;
  const slug = requested || cookies().get("world")?.value;
  return worlds.find((w) => w.slug === slug) ?? worlds[0];
});

export const getHome = cache((world?: string | null) =>
  serverGet<HomeFeed>(world ? `/home?world=${encodeURIComponent(world)}` : "/home", { revalidate: 60 }),
);

export const getCategories = cache(() => serverTry<Category[]>("/categories", { revalidate: 300 }).then((c) => c ?? []));
export const getBrands = cache(() => serverTry<Brand[]>("/brands?all=1", { revalidate: 300 }).then((b) => b ?? []));

export const getProduct = cache((slug: string) => serverGet<Product>(`/products/${encodeURIComponent(slug)}`, { revalidate: 60 }));

export function getProducts(query: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return serverGet<Paged<Product>>(`/products?${qs}`, { revalidate: 60 });
}

/** يبحث عن قسم بأي مستوى (رئيسي، فرعي، ثالث) ويعيد مساره من الجذر. */
export async function findCategory(slug: string): Promise<{ node: Category; path: Category[] } | null> {
  const tree = await getCategories();
  const walk = (list: Category[], path: Category[]): { node: Category; path: Category[] } | null => {
    for (const c of list) {
      if (c.slug === slug || c.id === slug) return { node: c, path };
      const hit = walk(c.children ?? [], [...path, c]);
      if (hit) return hit;
    }
    return null;
  };
  return walk(tree, []);
}

export const getBrand = cache((slug: string) => serverTry<Brand & { collections?: { id: string; name: string; slug?: string }[]; description?: string | null }>(`/brands/${encodeURIComponent(slug)}`, { revalidate: 300 }));
