import type { MediaRecord } from "./mediaUrl";

export type BrandCollection = {
  id: string;
  name: string;
  slug?: string;
  position?: number;
  isActive?: boolean;
  description?: string;
};

export type BrandRow = {
  id: string;
  name: string;
  slug?: string;
  initial?: string;
  bgColorHex?: string;
  logoId?: string | null;
  logo?: MediaRecord | null;
  productCount?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  position?: number;
  collections?: BrandCollection[];
};
