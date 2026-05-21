import { api } from "./api";
import { mockDB } from "./mockData";
import { uploadMediaFile } from "./uploadMedia";

// Fall back to mock data automatically when the backend is unreachable.
async function safe<T>(real: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await real();
  } catch (e: any) {
    if (!e?.response) {
      return fallback();
    }
    throw e;
  }
}

export const queries = {
  dashboard: () =>
    safe(
      () => api.get("/reports/dashboard").then((r) => r.data?.data ?? r.data),
      () => mockDB.dashboard(),
    ),
  products: (params?: any) =>
    safe(
      () =>
        api
          .get("/products", { params: { status: "all", lite: 1, ...params } })
          .then((r) => r.data),
      () => mockDB.paginate("products", params ?? {}),
    ),
  product: (id: string) =>
    safe(
      () => api.get(`/products/${id}`).then((r) => r.data?.data ?? r.data),
      () => mockDB.list("products").find((p) => p.id === id),
    ),
  categories: () =>
    safe(
      () =>
        api
          .get("/categories", { params: { all: 1, minimal: 1 } })
          .then((r) => r.data?.data ?? r.data),
      () => mockDB.list("categories"),
    ),
  categoriesFull: () =>
    safe(
      () => api.get("/categories", { params: { all: 1 } }).then((r) => r.data?.data ?? r.data),
      () => mockDB.list("categories"),
    ),
  subcategories: (params?: { parentId?: string; search?: string }) =>
    safe(
      () =>
        api
          .get("/subcategories", { params: { all: 1, ...params } })
          .then((r) => r.data?.data ?? r.data),
      () => {
        const all = mockDB.list("categories");
        const subs: any[] = [];
        for (const c of all) {
          for (const child of c.children ?? []) {
            if (params?.parentId && child.parentId !== params.parentId && c.id !== params.parentId) continue;
            subs.push({ ...child, parent: { id: c.id, name: c.name }, parentName: c.name });
          }
        }
        return subs;
      },
    ),
  brands: () =>
    safe(
      () => api.get("/brands", { params: { all: 1 } }).then((r) => r.data?.data ?? r.data),
      () => mockDB.list("brands"),
    ),
  orders: (params?: any) =>
    safe(
      () => api.get("/orders", { params }).then((r) => r.data),
      () => mockDB.paginate("orders", params ?? {}),
    ),
  order: (id: string) =>
    safe(
      () => api.get(`/orders/${id}`).then((r) => r.data?.data ?? r.data),
      () => mockDB.list("orders").find((o) => o.id === id),
    ),
  banners: () =>
    safe(
      () => api.get("/banners").then((r) => r.data?.data ?? r.data),
      () => mockDB.list("banners"),
    ),
  packages: () =>
    safe(
      () => api.get("/packages", { params: { all: 1 } }).then((r) => r.data?.data ?? r.data),
      () => mockDB.list("packages"),
    ),
  coupons: () =>
    safe(
      () => api.get("/coupons").then((r) => r.data?.data ?? r.data),
      () => mockDB.list("coupons"),
    ),
  homeBlocks: () =>
    safe(
      () => api.get("/home-blocks?active=0").then((r) => r.data?.data ?? r.data),
      () => mockDB.list("homeBlocks"),
    ),
  media: (params?: any) =>
    safe(
      () => api.get("/media", { params }).then((r) => r.data),
      () => mockDB.paginate("media", params ?? {}),
    ),
  users: (params?: any) =>
    safe(
      () => api.get("/users", { params }).then((r) => r.data),
      () => mockDB.paginate("users", params ?? {}),
    ),
  user: (id: string) =>
    safe(
      () => api.get(`/users/${id}`).then((r) => r.data?.data ?? r.data),
      () => mockDB.list("users").find((u) => u.id === id),
    ),
  reviews: (params?: any) =>
    safe(
      () => api.get("/reviews", { params }).then((r) => r.data),
      () => ({ data: [], meta: { total: 0, page: 1, limit: 15 } }),
    ),
  settings: () =>
    safe(
      () => api.get("/settings").then((r) => r.data?.data ?? r.data),
      () => {
        if (typeof window === "undefined") return {};
        try {
          return JSON.parse(localStorage.getItem("alhayaa-settings") ?? "{}");
        } catch {
          return {};
        }
      },
    ),
  notifications: (params?: any) =>
    safe(
      () => api.get("/notifications", { params: { admin: 1, ...params } }).then((r) => r.data),
      () => ({ data: [], meta: { total: 0, page: 1, limit: 15 } }),
    ),
  addresses: (userId: string) =>
    safe(
      () => api.get("/addresses", { params: { userId } }).then((r) => r.data?.data ?? r.data),
      () => [],
    ),
  loyalty: (userId: string) =>
    safe(
      () => api.get(`/loyalty/users/${userId}`).then((r) => r.data?.data ?? r.data),
      () => ({ points: 0, tier: "normal", history: [] }),
    ),
  homePreview: () =>
    safe(
      () => api.get("/home").then((r) => r.data?.data ?? r.data),
      () => ({}),
    ),
};

export const mutations = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((r) => r.data?.data ?? r.data),

  // Products
  createProduct: (data: any) =>
    safe(
      () => api.post("/products", data).then((r) => r.data?.data ?? r.data),
      () => mockDB.create("products", data),
    ),
  updateProduct: (id: string, data: any) =>
    safe(
      () => api.patch(`/products/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("products", id, data),
    ),
  deleteProduct: (id: string) =>
    safe(
      () => api.delete(`/products/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("products", id) }),
    ),

  // Categories
  createCategory: (data: any) =>
    safe(
      () => api.post("/categories", data).then((r) => r.data?.data ?? r.data),
      () => mockDB.create("categories", data),
    ),
  updateCategory: (id: string, data: any) =>
    safe(
      () => api.patch(`/categories/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("categories", id, data),
    ),
  deleteCategory: (id: string) =>
    safe(
      () => api.delete(`/categories/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("categories", id) }),
    ),

  createSubcategory: (data: any) =>
    safe(
      () => api.post("/subcategories", data).then((r) => r.data?.data ?? r.data),
      () => data,
    ),
  updateSubcategory: (id: string, data: any) =>
    safe(
      () => api.patch(`/subcategories/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => data,
    ),
  deleteSubcategory: (id: string) =>
    safe(
      () => api.delete(`/subcategories/${id}`).then((r) => r.data),
      () => ({ success: true }),
    ),

  // Brands
  createBrand: (data: any) =>
    safe(
      () => api.post("/brands", data).then((r) => r.data?.data ?? r.data),
      () => mockDB.create("brands", data),
    ),
  updateBrand: (id: string, data: any) =>
    safe(
      () => api.patch(`/brands/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("brands", id, data),
    ),
  deleteBrand: (id: string) =>
    safe(
      () => api.delete(`/brands/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("brands", id) }),
    ),

  createBrandCollection: (brandId: string, data: any) =>
    safe(
      () => api.post(`/brands/${brandId}/collections`, data).then((r) => r.data?.data ?? r.data),
      () => data,
    ),
  updateBrandCollection: (collectionId: string, data: any) =>
    safe(
      () => api.patch(`/brands/collections/${collectionId}`, data).then((r) => r.data?.data ?? r.data),
      () => data,
    ),
  deleteBrandCollection: (collectionId: string) =>
    safe(
      () => api.delete(`/brands/collections/${collectionId}`).then((r) => r.data),
      () => ({ success: true }),
    ),

  // Orders
  updateOrderStatus: (id: string, data: any) =>
    safe(
      () => api.patch(`/orders/${id}/status`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("orders", id, data),
    ),

  updateUser: (id: string, data: any) =>
    safe(
      () => api.patch(`/users/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("users", id, data),
    ),

  updateReview: (id: string, data: any) =>
    safe(
      () => api.patch(`/reviews/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => data,
    ),

  deleteReview: (id: string) =>
    safe(
      () => api.delete(`/reviews/${id}`).then((r) => r.data),
      () => ({ success: true }),
    ),

  updateSettings: (data: any) =>
    safe(
      () => api.patch("/settings", data).then((r) => r.data?.data ?? r.data),
      () => {
        if (typeof window !== "undefined") {
          localStorage.setItem("alhayaa-settings", JSON.stringify(data));
        }
        return data;
      },
    ),

  createNotification: (data: any) =>
    safe(
      () => api.post("/notifications", data).then((r) => r.data?.data ?? r.data),
      () => data,
    ),

  deleteNotification: (id: string) =>
    safe(
      () => api.delete(`/notifications/${id}`).then((r) => r.data),
      () => ({ success: true }),
    ),

  createHomeBlock: (data: any) =>
    safe(
      () => api.post("/home-blocks", data).then((r) => r.data?.data ?? r.data),
      () => mockDB.create("homeBlocks", data),
    ),

  deleteHomeBlock: (id: string) =>
    safe(
      () => api.delete(`/home-blocks/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("homeBlocks", id) }),
    ),

  // Banners
  createBanner: (data: any) =>
    safe(
      () => api.post("/banners", data).then((r) => r.data?.data ?? r.data),
      () => mockDB.create("banners", data),
    ),
  updateBanner: (id: string, data: any) =>
    safe(
      () => api.patch(`/banners/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("banners", id, data),
    ),
  deleteBanner: (id: string) =>
    safe(
      () => api.delete(`/banners/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("banners", id) }),
    ),

  // Packages
  createPackage: (data: any) =>
    safe(
      () => api.post("/packages", data).then((r) => r.data?.data ?? r.data),
      () => mockDB.create("packages", data),
    ),
  updatePackage: (id: string, data: any) =>
    safe(
      () => api.patch(`/packages/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("packages", id, data),
    ),
  deletePackage: (id: string) =>
    safe(
      () => api.delete(`/packages/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("packages", id) }),
    ),

  // Coupons
  createCoupon: (data: any) =>
    safe(
      () => api.post("/coupons", data).then((r) => r.data?.data ?? r.data),
      () => mockDB.create("coupons", data),
    ),
  updateCoupon: (id: string, data: any) =>
    safe(
      () => api.patch(`/coupons/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("coupons", id, data),
    ),
  deleteCoupon: (id: string) =>
    safe(
      () => api.delete(`/coupons/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("coupons", id) }),
    ),

  // Home blocks
  updateHomeBlock: (id: string, data: any) =>
    safe(
      () => api.patch(`/home-blocks/${id}`, data).then((r) => r.data?.data ?? r.data),
      () => mockDB.update("homeBlocks", id, data),
    ),

  reorderHomeBlocks: (ids: string[]) =>
    safe(
      () => api.post("/home-blocks/reorder", { ids }).then((r) => r.data?.data ?? r.data),
      () => ({ success: true }),
    ),

  deleteMedia: (id: string) =>
    safe(
      () => api.delete(`/media/${id}`).then((r) => r.data),
      () => ({ success: mockDB.remove("media", id) }),
    ),

  uploadMediaBase64: (file: File, purpose?: string) => uploadMediaFile(file, purpose ?? "GENERAL"),
};
