export type CategoryRef = {
  id: string;
  name_ar: string;
  name_en: string;
};

/** Minimal GPT response — names only. */
export type GptMinimalResearch = {
  representative_barcode: string;
  product_name_ar: string;
  product_name_en: string;
  confidence: number;
  needs_review: boolean;
  review_notes: string | null;
  source_url: string;
};

/** @deprecated Legacy full GPT response — old cache entries only. */
export type GptProductResearch = {
  barcode: string;
  brand_ar: string;
  brand_en: string;
  product_name_ar: string;
  product_name_en: string;
  size_value: number | null;
  size_unit_ar: string;
  size_unit_en: string;
  product_type_ar: string;
  product_type_en: string;
  description_ar: string;
  description_en: string;
  usage_instructions_ar: string;
  usage_instructions_en: string;
  main_category: CategoryRef;
  subcategories: CategoryRef[];
  secondary_categories: CategoryRef[];
  source_urls: string[];
  confidence: number;
  needs_review: boolean;
  review_notes: string | null;
};

export type CategoryCatalog = {
  main: Array<{ id: string; name_ar: string; name_en: string; slug: string }>;
  sub: Array<{ id: string; name_ar: string; name_en: string; parent_id: string }>;
  tertiary: Array<{ id: string; name_ar: string; name_en: string; parent_id: string; main_id: string }>;
};

export type GptUsage = {
  input_tokens: number;
  output_tokens: number;
  web_search_count: number;
};

export type VariantInput = {
  barcode: string;
  variant_value: string;
  color_hex?: string;
  image_url?: string;
};

export type VariantGroupInput = {
  group_key?: string;
  representative_barcode: string;
  variants: VariantInput[];
};

export type ImportManifest = {
  singles?: string[];
  variant_groups?: VariantGroupInput[];
};

export type ComposerCategories = {
  main_category: CategoryRef;
  subcategories: CategoryRef[];
  secondary_categories: CategoryRef[];
};

export type ProcessResult = {
  barcode: string;
  status: "added" | "duplicate" | "needs_review" | "failed" | "cached_added";
  kind?: "single" | "variant_parent" | "variant_shade";
  group_key?: string;
  name_ar?: string;
  name_en?: string;
  brand_en?: string;
  category?: string;
  confidence?: number;
  error?: string;
  review_notes?: string | null;
  product_id?: string;
  from_cache?: boolean;
  usage?: GptUsage;
  shades_added?: number;
  shades_with_image?: number;
};

export type RunReport = {
  received: number;
  main_products_added: number;
  singles_added: number;
  variant_groups_processed: number;
  total_variants: number;
  variants_added: number;
  variants_with_image: number;
  variants_needs_review: number;
  added: number;
  duplicates: number;
  failed_identification: number;
  needs_review: number;
  gpt_api_calls: number;
  web_searches: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  results: ProcessResult[];
};
