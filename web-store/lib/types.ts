export type Media = {
  id?: string;
  thumb?: string;
  full?: string;
  url?: string;
};

export type Brand = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  slug: string;
  logo?: Media | null;
};

export type Category = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  slug: string;
  image?: Media | null;
};

export type ProductImage = {
  id: string;
  isPrimary?: boolean;
  media?: Media | null;
};

export type Product = {
  id: string;
  sku?: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  slug: string;
  description?: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stock?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  brand?: Brand | null;
  category?: Category | null;
  images?: ProductImage[];
};

export type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string | null;
  image?: Media | null;
};

export type HomeFeed = {
  banners?: Banner[];
  categories?: Category[];
  brands?: Brand[];
  newArrivals?: Product[];
  bestSellers?: Product[];
  featuredProducts?: Product[];
  promoProducts?: Product[];
  settings?: Record<string, unknown>;
};

export type Paginated<T> = {
  data: T[];
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
};
