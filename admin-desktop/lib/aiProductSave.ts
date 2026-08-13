import type { ImageItem } from "@/components/ProductImageDropzone";
import { uploadImageFromUrlWithFallback } from "./uploadFromUrl";
import { buildProductPayload } from "./productPayload";
import { mutations } from "./queries";
import { normalizeBarcode } from "./barcode";
import { slugify } from "./slugify";

export async function uploadUrlsToImages(urls: string[], purpose = "PRODUCT"): Promise<Map<string, ImageItem>> {
  const out = new Map<string, ImageItem>();
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || out.has(url)) continue;
    try {
      const media = await uploadImageFromUrlWithFallback(url, purpose);
      out.set(url, {
        id: media.id,
        url: media.previewUrl || media.url || url,
      });
    } catch {
      /* skip failed */
    }
  }
  return out;
}

export async function saveAiProduct(input: {
  values: Record<string, unknown>;
  galleryUrls: string[];
  shadeRows?: Array<{
    name: string;
    barcode?: string;
    colorHex?: string;
    imageUrl?: string | null;
    price?: number;
    stock?: number;
    position?: number;
  }>;
}) {
  const uniqueGallery = [...new Set(input.galleryUrls.filter(Boolean))];
  const shadeUrls = (input.shadeRows ?? [])
    .map((s) => s.imageUrl)
    .filter((u): u is string => !!u && !uniqueGallery.includes(u));

  const allUrls = [...uniqueGallery, ...shadeUrls];
  const uploaded = await uploadUrlsToImages(allUrls);

  const productImages: ImageItem[] = [];
  for (const url of uniqueGallery) {
    const item = uploaded.get(url);
    if (item) productImages.push(item);
  }
  if (!productImages.length) throw new Error("تعذّر رفع صور المنتج");

  const shades = (input.shadeRows ?? []).map((s, i) => ({
    name: s.name,
    colorHex: s.colorHex || "#CCCCCC",
    barcode: s.barcode ? normalizeBarcode(s.barcode) : undefined,
    imageId: s.imageUrl ? uploaded.get(s.imageUrl)?.id : undefined,
    price: s.price,
    stock: s.stock,
    position: s.position ?? i,
  }));

  const payload = buildProductPayload(
    {
      ...input.values,
      shades,
      variants: [],
      tags: ["ai-add"],
      skinType: [],
      concernIds: [],
      isActive: true,
    },
    productImages,
  );

  return mutations.createProduct(payload);
}

export function defaultSku(barcode: string, prefix = "AI") {
  const bc = normalizeBarcode(barcode);
  return bc ? `${prefix}-${bc}` : `${prefix}-${Date.now()}`;
}

export function defaultSlug(name: string) {
  return slugify(name || "product", "ai");
}
