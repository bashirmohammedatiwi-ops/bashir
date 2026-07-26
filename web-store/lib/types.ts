import type { MediaRecord } from "./mediaUrl";

export type Media = MediaRecord;

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
  isPromo?: boolean;
  brand?: Brand | null;
  category?: Category | null;
  images?: ProductImage[];
};

export type Banner = {
  id: string;
  title?: string;
  subtitle?: string;
  tag?: string;
  linkUrl?: string | null;
  link?: string | null;
  linkType?: string | null;
  linkValue?: string | null;
  imageUrl?: string | null;
  backgroundColor?: string | null;
  image?: Media | null;
};

export type PromoStrip = {
  text?: string;
  items?: string[];
  link?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  marquee?: boolean;
};

export type HomeSection = {
  id: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  position: number;
  layout?: string;
  showTitle?: boolean;
  showViewAll?: boolean;
  viewAllQuery?: string;
  headerImageUrl?: string;
  endsAt?: string | null;
  backgroundColor?: string;
  banners?: Banner[];
  categories?: Category[];
  products?: Product[];
  brands?: Brand[];
  promoStrip?: PromoStrip;
  skinConcerns?: Array<{ id: string; name?: string; nameAr?: string; imageUrl?: string; image?: Media }>;
  items?: Array<Record<string, unknown>>;
  children?: HomeSection[];
};

export type StoreSettings = {
  storeName?: string;
  whatsapp?: string;
  supportPhone?: string;
  freeShippingThreshold?: number;
};

export type HomeFeed = {
  sections?: HomeSection[];
  banners?: Banner[];
  categories?: Category[];
  brands?: Brand[];
  newArrivals?: Product[];
  bestSellers?: Product[];
  featuredProducts?: Product[];
  promoProducts?: Product[];
  flashSale?: { endsAt?: string | null; products?: Product[] };
  settings?: StoreSettings;
};

export type Paginated<T> = {
  data: T[];
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
};
