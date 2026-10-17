import { api } from "./api";

/** واجهة «مركز التحكم» وتطبيق المدير (/control) — نفس المسارات التي يستخدمها الهاتف. */

const data = <T,>(r: { data: any }) => (r.data?.data ?? r.data) as T;

export type ControlShadeDot = { colorHex: string; colorHexEnd?: string | null; isActive: boolean };

export type ControlMatchedShade = {
  id: string;
  name: string;
  barcode?: string | null;
  isActive: boolean;
  colorHex: string;
  colorHexEnd?: string | null;
  stock: number;
};

export type ControlProductSummary = {
  id: string;
  slug: string;
  sku: string;
  barcode?: string | null;
  name: string;
  nameEn?: string | null;
  isActive: boolean;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  updatedAt: string;
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  thumb?: string | null;
  imageCount: number;
  shadeCount: number;
  shadesOff: number;
  shadePreview: ControlShadeDot[];
  exactBarcode: boolean;
  matchedShades: ControlMatchedShade[];
};

export type ControlImage = {
  mediaId: string;
  url: string | null;
  large: string | null;
  thumb: string | null;
  width: number;
  height: number;
  position: number;
};

export type ControlShade = {
  id: string;
  name: string;
  colorHex: string;
  colorHexEnd?: string | null;
  barcode?: string | null;
  isActive: boolean;
  stock: number;
  price?: number | null;
  position: number;
  pos?: { price: number; stock: number; name?: string | null; syncedAt?: string } | null;
  image?: (ControlImage & { mediaId: string }) | null;
};

export type ControlProductDetail = Omit<ControlProductSummary, "thumb" | "imageCount" | "shadeCount" | "shadesOff" | "shadePreview" | "exactBarcode" | "matchedShades"> & {
  nameAr?: string | null;
  descriptionAr?: string | null;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  images: ControlImage[];
  shades: ControlShade[];
  pos?: { price: number; stock: number; name?: string | null; syncedAt?: string } | null;
};

export type ControlStats = {
  products: {
    total: number;
    active: number;
    inactive: number;
    noImages: number;
    outOfStock: number;
    shadesOff: number;
    productsWithShadesOff: number;
  };
  drafts: { pending: number; added: number; groups: number };
};

export type DraftGroup = {
  id: string;
  name: string;
  color: string;
  note?: string | null;
  isArchived: boolean;
  total: number;
  added: number;
  pending: number;
  covers: string[];
  lastDraftAt?: string | null;
  createdAt: string;
};

export type Draft = {
  id: string;
  groupId: string;
  group: { id: string; name: string; color: string };
  barcode: string;
  name?: string | null;
  note?: string | null;
  quantity?: number | null;
  status: "pending" | "added";
  addedAt?: string | null;
  createdAt: string;
  createdBy?: string | null;
  images: { mediaId: string; url: string | null; large: string | null; thumb: string | null }[];
  pos?: { name?: string | null; price: number; stock: number } | null;
  product?: { id: string; name: string; isActive: boolean; thumb?: string | null; shadeId?: string | null } | null;
};

export type Paged<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean } };

export const controlApi = {
  stats: () => api.get("/control/stats").then(data<ControlStats>),
  brands: () => api.get("/control/brands").then(data<{ id: string; name: string }[]>),
  search: (params: { q?: string; status?: string; filter?: string; brandId?: string; page?: number; limit?: number }) =>
    api.get("/control/search", { params }).then((r) => r.data as Paged<ControlProductSummary>),
  product: (id: string) => api.get(`/control/products/${id}`).then(data<ControlProductDetail>),
  patchProduct: (id: string, patch: Record<string, unknown>) =>
    api.patch(`/control/products/${id}`, patch).then(data<ControlProductDetail>),
  patchShade: (id: string, patch: Record<string, unknown>) =>
    api.patch(`/control/shades/${id}`, patch).then(data<ControlProductDetail>),
  bulkShades: (productId: string, isActive: boolean, ids?: string[]) =>
    api.post(`/control/products/${productId}/shades/bulk`, { isActive, ids }).then(data<ControlProductDetail>),
  addImages: (productId: string, mediaIds: string[], at: "start" | "end" = "end") =>
    api.post(`/control/products/${productId}/images`, { mediaIds, at }).then(data<ControlProductDetail>),
  setImages: (productId: string, mediaIds: string[]) =>
    api.put(`/control/products/${productId}/images`, { mediaIds }).then(data<ControlProductDetail>),
  removeImage: (productId: string, mediaId: string) =>
    api.delete(`/control/products/${productId}/images/${mediaId}`).then(data<ControlProductDetail>),
  replaceImage: (productId: string, from: string, to: string) =>
    api.post(`/control/products/${productId}/images/replace`, { from, to }).then(data<ControlProductDetail>),
  editImage: (mediaId: string, body: Record<string, unknown>) =>
    api
      .post(`/control/media/${mediaId}/edit`, body, { timeout: 120_000 })
      .then(data<{ mediaId: string; previousMediaId: string; unchanged: boolean; product: ControlProductDetail | null }>),
  frameAll: (productId: string, body: { mode: string; padding?: number; includeShades?: boolean }) =>
    api
      .post(`/control/products/${productId}/images/frame`, body, { timeout: 300_000 })
      .then(data<{ changed: number; unchanged: number; failed: number; swaps: { from: string; to: string }[]; product: ControlProductDetail }>),

  groups: (archived = false) => api.get("/control/draft-groups", { params: archived ? { archived: 1 } : {} }).then(data<DraftGroup[]>),
  createGroup: (body: { name: string; color?: string; note?: string }) => api.post("/control/draft-groups", body).then(data<DraftGroup>),
  updateGroup: (id: string, body: Record<string, unknown>) => api.patch(`/control/draft-groups/${id}`, body).then(data<DraftGroup>),
  deleteGroup: (id: string) => api.delete(`/control/draft-groups/${id}`).then(data<{ deletedDrafts: number }>),
  drafts: (params: { groupId?: string; status?: string; q?: string; page?: number; limit?: number }) =>
    api.get("/control/drafts", { params }).then((r) => r.data as Paged<Draft>),
  updateDraft: (id: string, body: Record<string, unknown>) => api.patch(`/control/drafts/${id}`, body).then(data<Draft>),
  createDraft: (body: Record<string, unknown>) => api.post("/control/drafts", body).then(data<Draft>),
  deleteDrafts: (ids: string[]) => api.post("/control/drafts/delete", { ids }).then(data<{ deleted: number }>),
  moveDrafts: (ids: string[], groupId: string) => api.post("/control/drafts/move", { ids, groupId }).then(data<{ moved: number; merged: number }>),
};

export const GROUP_COLORS: Record<string, { label: string; color: string }> = {
  violet: { label: "بنفسجي", color: "#7B52C4" },
  rose: { label: "وردي", color: "#D0588F" },
  gold: { label: "ذهبي", color: "#C9931A" },
  mint: { label: "نعناعي", color: "#16A085" },
  sky: { label: "سماوي", color: "#2F80ED" },
  coral: { label: "مرجاني", color: "#E8664A" },
  slate: { label: "رمادي", color: "#5B6475" },
};

export const groupColor = (key?: string | null) => GROUP_COLORS[key ?? "violet"]?.color ?? GROUP_COLORS.violet.color;
