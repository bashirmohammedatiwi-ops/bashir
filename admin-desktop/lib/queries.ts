import { api } from "./api";
import { uploadMediaFile } from "./uploadMedia";

export const queries = {
  dashboard: () => api.get("/reports/dashboard").then((r) => r.data?.data ?? r.data),
  products: (params?: any) =>
    api
      .get("/products", { params: { status: "all", lite: 1, ...params } })
      .then((r) => r.data),
  product: (id: string) => api.get(`/products/${id}`).then((r) => r.data?.data ?? r.data),
  productBarcodeCheck: (barcode: string) =>
    api
      .get("/products/barcode-check", { params: { barcode } })
      .then((r) => r.data?.data ?? r.data),
  categories: () =>
    api.get("/categories", { params: { all: 1, minimal: 1 } }).then((r) => r.data?.data ?? r.data),
  categoriesFull: () =>
    api.get("/categories", { params: { all: 1 } }).then((r) => r.data?.data ?? r.data),
  subcategories: (params?: { parentId?: string; search?: string }) =>
    api
      .get("/subcategories", { params: { all: 1, ...params } })
      .then((r) => r.data?.data ?? r.data),
  tertiarySections: (params?: { parentId?: string; search?: string }) =>
    api
      .get("/tertiary-sections", { params: { all: 1, ...params } })
      .then((r) => r.data?.data ?? r.data),
  brands: () => api.get("/brands", { params: { all: 1 } }).then((r) => r.data?.data ?? r.data),
  orders: (params?: any) =>
    api.get("/orders", { params: { preview: 1, ...params } }).then((r) => r.data),
  order: (id: string) => api.get(`/orders/${id}`).then((r) => r.data?.data ?? r.data),
  banners: () => api.get("/banners").then((r) => r.data?.data ?? r.data),
  packages: () =>
    api.get("/packages", { params: { all: 1, lite: 1 } }).then((r) => r.data?.data ?? r.data),
  coupons: () => api.get("/coupons").then((r) => r.data?.data ?? r.data),
  homeBlocks: () => api.get("/home-blocks?active=0").then((r) => r.data?.data ?? r.data),
  media: (params?: any) => api.get("/media", { params }).then((r) => r.data),
  mediaStats: () => api.get("/media/stats").then((r) => r.data?.data ?? r.data),
  users: (params?: any) => api.get("/users", { params }).then((r) => r.data),
  user: (id: string) => api.get(`/users/${id}`).then((r) => r.data?.data ?? r.data),
  reviews: (params?: any) => api.get("/reviews", { params }).then((r) => r.data),
  settings: () => api.get("/settings").then((r) => r.data?.data ?? r.data),
  inventoryOverview: () =>
    api.get("/sync/inventory/overview").then((r) => r.data?.data ?? r.data),
  inventoryStockAlerts: (params?: any) =>
    api.get("/sync/inventory/stock-alerts", { params }).then((r) => r.data),
  inventoryRuns: (params?: any) =>
    api.get("/sync/inventory/runs", { params }).then((r) => r.data),
  notifications: (params?: any) =>
    api.get("/notifications", { params: { admin: 1, ...params } }).then((r) => r.data),
  notificationStats: () => api.get("/notifications/stats").then((r) => r.data?.data ?? r.data),
  skinConcerns: (all = true) =>
    api.get("/skin-concerns", { params: { all: all ? 1 : 0 } }).then((r) => r.data?.data ?? r.data),
  shippingZones: () => api.get("/shipping/zones/all").then((r) => r.data?.data ?? r.data),
  salesReport: (params?: { from?: string; to?: string }) =>
    api.get("/reports/sales", { params }).then((r) => r.data?.data ?? r.data),
  addresses: (userId: string) =>
    api.get("/addresses", { params: { userId } }).then((r) => r.data?.data ?? r.data),
  loyalty: (userId: string) =>
    api.get(`/loyalty/users/${userId}`).then((r) => r.data?.data ?? r.data),
  homePreview: () => api.get("/home").then((r) => r.data?.data ?? r.data),
};

export const mutations = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((r) => r.data?.data ?? r.data),

  createProduct: (data: any) => api.post("/products", data).then((r) => r.data?.data ?? r.data),
  updateProduct: (id: string, data: any) =>
    api.patch(`/products/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),

  createCategory: (data: any) => api.post("/categories", data).then((r) => r.data?.data ?? r.data),
  updateCategory: (id: string, data: any) =>
    api.patch(`/categories/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),

  createSubcategory: (data: any) =>
    api.post("/subcategories", data).then((r) => r.data?.data ?? r.data),
  updateSubcategory: (id: string, data: any) =>
    api.patch(`/subcategories/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteSubcategory: (id: string) => api.delete(`/subcategories/${id}`).then((r) => r.data),

  createTertiarySection: (data: any) =>
    api.post("/tertiary-sections", data).then((r) => r.data?.data ?? r.data),
  updateTertiarySection: (id: string, data: any) =>
    api.patch(`/tertiary-sections/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteTertiarySection: (id: string) => api.delete(`/tertiary-sections/${id}`).then((r) => r.data),

  createBrand: (data: any) => api.post("/brands", data).then((r) => r.data?.data ?? r.data),
  updateBrand: (id: string, data: any) =>
    api.patch(`/brands/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteBrand: (id: string, opts?: { reassignTo?: string }) =>
    api
      .delete(`/brands/${id}`, {
        params: opts?.reassignTo ? { reassignTo: opts.reassignTo } : undefined,
      })
      .then((r) => r.data),

  /** مطابقة براند أو إنشاؤه من اسم الكتالوج */
  resolveBrand: (data: {
    brandAr?: string;
    brandEn?: string;
    name?: string;
    logoUrl?: string;
    logoIsProductImage?: boolean;
    createIfMissing?: boolean;
  }) => api.post("/brands/resolve", data).then((r) => r.data?.data ?? r.data),

  /** مزامنة براندات المتاجر مع إزالة التكرار */
  syncBrandsFromCatalog: (data: {
    brands: Array<{
      name?: string;
      nameAr?: string;
      nameEn?: string;
      logoUrl?: string;
      logoIsProductImage?: boolean;
    }>;
    attachLogos?: boolean;
  }) => api.post("/brands/sync-from-catalog", data).then((r) => r.data?.data ?? r.data),

  createBrandCollection: (brandId: string, data: any) =>
    api.post(`/brands/${brandId}/collections`, data).then((r) => r.data?.data ?? r.data),
  updateBrandCollection: (collectionId: string, data: any) =>
    api.patch(`/brands/collections/${collectionId}`, data).then((r) => r.data?.data ?? r.data),
  deleteBrandCollection: (collectionId: string) =>
    api.delete(`/brands/collections/${collectionId}`).then((r) => r.data),

  updateOrderStatus: (id: string, data: any) =>
    api.patch(`/orders/${id}/status`, data).then((r) => r.data?.data ?? r.data),

  updateUser: (id: string, data: any) =>
    api.patch(`/users/${id}`, data).then((r) => r.data?.data ?? r.data),

  updateReview: (id: string, data: any) =>
    api.patch(`/reviews/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`).then((r) => r.data),

  updateSettings: (data: any) => api.patch("/settings", data).then((r) => r.data?.data ?? r.data),

  sendStockAlert: (data: { barcode: string; alertType: "RESTOCK" | "LOW_STOCK" }) =>
    api.post("/sync/inventory/stock-alerts/send", data).then((r) => r.data?.data ?? r.data),
  createNotification: (data: any) =>
    api.post("/notifications/send", data).then((r) => r.data?.data ?? r.data),
  resendNotification: (id: string) =>
    api.post(`/notifications/${id}/resend`).then((r) => r.data?.data ?? r.data),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`).then((r) => r.data),

  createHomeBlock: (data: any) =>
    api.post("/home-blocks", data).then((r) => r.data?.data ?? r.data),
  deleteHomeBlock: (id: string) => api.delete(`/home-blocks/${id}`).then((r) => r.data),

  createBanner: (data: any) => api.post("/banners", data).then((r) => r.data?.data ?? r.data),
  updateBanner: (id: string, data: any) =>
    api.patch(`/banners/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteBanner: (id: string) => api.delete(`/banners/${id}`).then((r) => r.data),

  createPackage: (data: any) => api.post("/packages", data).then((r) => r.data?.data ?? r.data),
  updatePackage: (id: string, data: any) =>
    api.patch(`/packages/${id}`, data).then((r) => r.data?.data ?? r.data),
  deletePackage: (id: string) => api.delete(`/packages/${id}`).then((r) => r.data),

  createSkinConcern: (data: any) =>
    api.post("/skin-concerns", data).then((r) => r.data?.data ?? r.data),
  updateSkinConcern: (id: string, data: any) =>
    api.patch(`/skin-concerns/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteSkinConcern: (id: string) => api.delete(`/skin-concerns/${id}`).then((r) => r.data),

  createShippingZone: (data: any) =>
    api.post("/shipping/zones", data).then((r) => r.data?.data ?? r.data),
  updateShippingZone: (id: string, data: any) =>
    api.patch(`/shipping/zones/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteShippingZone: (id: string) => api.delete(`/shipping/zones/${id}`).then((r) => r.data),
  createShippingArea: (data: any) =>
    api.post("/shipping/areas", data).then((r) => r.data?.data ?? r.data),
  updateShippingArea: (id: string, data: any) =>
    api.patch(`/shipping/areas/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteShippingArea: (id: string) => api.delete(`/shipping/areas/${id}`).then((r) => r.data),

  createCoupon: (data: any) => api.post("/coupons", data).then((r) => r.data?.data ?? r.data),
  updateCoupon: (id: string, data: any) =>
    api.patch(`/coupons/${id}`, data).then((r) => r.data?.data ?? r.data),
  deleteCoupon: (id: string) => api.delete(`/coupons/${id}`).then((r) => r.data),

  updateHomeBlock: (id: string, data: any) =>
    api.patch(`/home-blocks/${id}`, data).then((r) => r.data?.data ?? r.data),
  reorderHomeBlocks: (ids: string[]) =>
    api.post("/home-blocks/reorder", { ids }).then((r) => r.data?.data ?? r.data),

  deleteMedia: (id: string) => api.delete(`/media/${id}`).then((r) => r.data),

  uploadMediaBase64: (file: File, purpose?: string) => uploadMediaFile(file, purpose ?? "GENERAL"),
};
