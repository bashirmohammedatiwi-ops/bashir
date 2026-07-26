import axios from "axios";

import { API_BASE } from "./config";
import type { Brand, Category, HomeFeed, Paginated, Product, StorePackage } from "./types";

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

/** يفكّ غلاف Nest `{ data: T }` — نفس منطق تطبيق الهاتف ولوحة التحكم. */
function unwrap<T>(body: T | { data?: T }): T {
  if (body != null && typeof body === "object" && "data" in body) {
    const inner = (body as { data?: T }).data;
    if (inner !== undefined) return inner;
  }
  return body as T;
}

export async function fetchHome(): Promise<HomeFeed> {
  const { data } = await client().get("/home");
  return unwrap<HomeFeed>(data);
}

export async function fetchProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  subcategoryId?: string;
  tertiaryCategoryId?: string;
  concernSlug?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isPromo?: boolean;
}): Promise<Paginated<Product>> {
  const { data } = await client().get("/products", { params });
  return unwrap<Paginated<Product>>(data);
}

export async function fetchOffers(): Promise<HomeFeed> {
  const { data } = await client().get("/offers");
  return unwrap<HomeFeed>(data);
}

export async function fetchPackage(slugOrId: string): Promise<StorePackage> {
  const { data } = await client().get(`/packages/slug/${encodeURIComponent(slugOrId)}`);
  return unwrap<StorePackage>(data);
}

export async function fetchProduct(slugOrId: string): Promise<Product> {
  const { data } = await client().get(`/products/${encodeURIComponent(slugOrId)}`);
  return unwrap<Product>(data);
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await client().get("/categories");
  return unwrap<Category[]>(data);
}

export async function fetchCategory(slug: string): Promise<Category> {
  const { data } = await client().get(`/categories/${encodeURIComponent(slug)}`);
  return unwrap<Category>(data);
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await client().get("/brands");
  return unwrap<Brand[]>(data);
}

export async function fetchBrand(slug: string): Promise<Brand> {
  const { data } = await client().get(`/brands/${encodeURIComponent(slug)}`);
  return unwrap<Brand>(data);
}
