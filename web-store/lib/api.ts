import axios from "axios";

import { API_BASE } from "./config";
import type { Brand, Category, HomeFeed, Paginated, Product } from "./types";

function apiBaseForContext(): string {
  if (typeof window !== "undefined") return API_BASE;
  return (
    process.env.STORE_BUILD_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://127.0.0.1:3000/api/v1"
  );
}

function client() {
  return axios.create({
    baseURL: apiBaseForContext(),
    timeout: 30000,
    headers: { Accept: "application/json" },
  });
}

export async function fetchHome(): Promise<HomeFeed> {
  const { data } = await client().get<HomeFeed>("/home");
  return data;
}

export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
}): Promise<Paginated<Product>> {
  const { data } = await client().get<Paginated<Product>>("/products", { params });
  return data;
}

export async function fetchProduct(slugOrId: string): Promise<Product> {
  const { data } = await client().get<Product>(`/products/${encodeURIComponent(slugOrId)}`);
  return data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await client().get<Category[]>("/categories");
  return data;
}

export async function fetchCategory(slug: string): Promise<Category> {
  const { data } = await client().get<Category>(`/categories/${encodeURIComponent(slug)}`);
  return data;
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await client().get<Brand[]>("/brands");
  return data;
}

export async function fetchBrand(slug: string): Promise<Brand> {
  const { data } = await client().get<Brand>(`/brands/${encodeURIComponent(slug)}`);
  return data;
}

export async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await fetchProducts({ page, limit });
    for (const p of res.data) {
      if (p.slug) slugs.push(p.slug);
    }
    const totalPages = res.meta?.totalPages ?? 1;
    if (page >= totalPages || res.data.length === 0) break;
    page += 1;
  }
  return slugs;
}

export async function fetchAllCategorySlugs(): Promise<string[]> {
  const cats = await fetchCategories();
  return cats.map((c) => c.slug).filter(Boolean);
}

export async function fetchAllBrandSlugs(): Promise<string[]> {
  const brands = await fetchBrands();
  return brands.map((b) => b.slug).filter(Boolean);
}
