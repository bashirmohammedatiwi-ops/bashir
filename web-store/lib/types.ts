export type Variant = { width?: number; formats?: { webp?: string; jpg?: string; avif?: string } };
export type Media = {
  id: string;
  filename?: string;
  publicUrlBase?: string;
  variants?: Record<string, Variant>;
  originalUrl?: string;
  alt?: string | null;
  url?: string;
};

export type BrandRef = { id: string; name: string; slug: string; logo?: Media | null; initial?: string };
export type Brand = BrandRef & {
  isFeatured?: boolean;
  productCount?: number;
  bgColorHex?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
};

export type Category = {
  id: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  slug: string;
  icon?: string | null;
  image?: Media | null;
  imageUrl?: string;
  parentId?: string | null;
  children?: Category[];
  productCount?: number;
  description?: string | null;
};

export type Shade = {
  id: string;
  name: string;
  colorHex: string;
  colorHexEnd?: string | null;
  barcode?: string | null;
  price?: number | null;
  stock: number;
  image?: Media | null;
  isActive?: boolean;
  hasBarcode?: boolean;
};

export type ProductImage = { id: string; position: number; isPrimary?: boolean; media: Media | null };

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  sku?: string;
  barcode?: string | null;
  description?: string | null;
  ingredients?: string | null;
  howToUse?: string | null;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  soldCount?: number;
  stock: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  isPromo?: boolean;
  tags?: string[] | string;
  skinType?: string[] | string;
  brand?: BrandRef | null;
  category?: { id: string; name: string; slug: string } | null;
  subcategory?: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
  shades: Shade[];
  _count?: { shades?: number };
  shadeCount?: number;
  reviews?: Review[];
};

export type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: { name?: string | null } | null;
};

export type Paged<T> = { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean } };

export type World = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  taglineAr?: string | null;
  taglineEn?: string | null;
  accentColor: string;
  canvasColor: string;
  inkColor: string;
  surfaceColor: string;
  coverImage?: Media | null;
  icon?: Media | null;
  iconUrl?: string;
  categoryCount?: number;
  categories?: Category[];
};

export type Banner = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  tag?: string | null;
  ctaLabel?: string | null;
  discountText?: string | null;
  link?: string | null;
  linkType?: string | null;
  linkValue?: string | null;
  backgroundColor?: string | null;
  image?: Media | null;
  imageUrl?: string;
};

export type SectionItem = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string;
  image?: Media | null;
  link?: string | null;
  linkType?: string | null;
  linkValue?: string | null;
  cardSize?: string;
};

export type PromoStrip = {
  text: string;
  items?: string[];
  link?: string | null;
  linkType?: string | null;
  linkValue?: string | null;
  backgroundColor?: string;
  textColor?: string;
  marquee?: boolean;
  label?: string;
  variant?: string;
};

export type BeautyPackageItem = { id: string; stepTitle?: string | null; note?: string | null; quantity: number; product: Product };
export type BeautyPackage = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  kind: string;
  isRoutine: boolean;
  badge?: string | null;
  price: number;
  originalPrice: number;
  itemsTotal: number;
  saving: number;
  savingPercent: number;
  endsAt?: string | null;
  inStock: boolean;
  coverUrl?: string | null;
  thumbs: string[];
  stepCount: number;
  concernSlugs: string[];
  skinTypes: string[];
  items: BeautyPackageItem[];
  related?: BeautyPackage[];
};

export type SkinConcern = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  description: string;
  icon?: string | null;
  color?: string | null;
  imageUrl?: string | null;
  productCount?: number;
  causes: string[];
  tips: string[];
  ingredients: string[];
  avoid: string[];
  skinTypes: string[];
};

export type HomeSection = {
  id: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  position: number;
  layout?: string;
  sectionLayout?: string;
  display?: string;
  showTitle?: boolean;
  showViewAll?: boolean;
  viewAllQuery?: string;
  backgroundColor?: string | null;
  products?: Product[];
  banners?: Banner[];
  items?: SectionItem[];
  brands?: Brand[];
  categories?: Category[];
  packages?: BeautyPackage[];
  skinConcerns?: SkinConcern[];
  promoStrip?: PromoStrip;
  children?: HomeSection[];
  endsAt?: string | null;
  bannerAspect?: number;
  shape?: string;
  kind?: string;
};

export type LoyaltyRules = { pointValue: number; earnPercent: number; redeemStep: number; firstOrderBonus: number };

export type HomeFeed = {
  world?: World | null;
  sections: HomeSection[];
  banners: Banner[];
  categories: Category[];
  brands: Brand[];
  skinConcerns: SkinConcern[];
  flashSale?: { endsAt?: string | null; products: Product[] };
  settings: {
    storeName?: string;
    whatsapp?: string;
    supportPhone?: string;
    freeShippingThreshold?: number;
    pickupEnabled?: boolean;
    pickupAddress?: string;
    pickupHours?: string;
    /** رسوم تغليف الهدية (د.ع) لطلب «هذا الطلب هدية». */
    giftWrapFee?: number;
    loyalty?: LoyaltyRules;
  };
};

export type User = { id: string; name: string; phone?: string | null; email?: string | null; points?: number; role?: string };

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  city?: string;
  governorate?: string | null;
  area?: string | null;
  street?: string | null;
  house?: string | null;
  notes?: string | null;
  isDefault?: boolean;
};

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shadeId?: string | null;
  product?: Product | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discountTotal: number;
  packageDiscount?: number;
  shippingTotal: number;
  /** رسوم تغليف الهدية وقت الطلب. */
  giftWrapFee?: number;
  total: number;
  loyaltyEarned: number;
  loyaltySpent: number;
  loyaltyDiscount?: number;
  deliveryOption: string;
  notes?: string | null;
  isGift?: boolean;
  giftMessage?: string | null;
  createdAt: string;
  items: OrderItem[];
  address?: Address | null;
  coupon?: { code: string } | null;
};

export type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  title?: string | null;
  subtitle?: string | null;
  description?: string;
  minOrder: number;
  maxDiscount?: number | null;
  theme?: string;
  endsAt?: string | null;
  remaining?: number | null;
};

export type ShippingZone = {
  id: string;
  governorate: string;
  standardFee: number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  areas: { id: string; name: string; fee?: number | null }[];
};
