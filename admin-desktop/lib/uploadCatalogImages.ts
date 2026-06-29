import type { ImageItem } from "@/components/ProductImageDropzone";
import type { CatalogImportProduct } from "./catalogImport";
import {
  resolveCatalogImageUrl,
  uploadImageFromUrlWithFallback,
} from "./uploadFromUrl";
import { mediaThumb } from "./mediaUrl";

const UPLOAD_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  limit: number,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

export type CatalogImageUploadProgress = {
  done: number;
  total: number;
  failed: number;
};

export type CatalogImageUploadResult = {
  productImages: ImageItem[];
  shadeImageIds: Map<string, string>;
  failed: number;
};

/**
 * Upload all catalog images once (deduped), preserving product image order.
 * Uses the same /media/upload compression as manual product creation.
 */
export async function uploadCatalogImportImages(
  preview: CatalogImportProduct,
  onProgress?: (progress: CatalogImageUploadProgress) => void,
): Promise<CatalogImageUploadResult> {
  const purpose = "PRODUCT";
  const orderedProductUrls = preview.images.map((img) => img.url).filter(Boolean) as string[];
  const shadeUrls = (preview.shades || []).map((s) => s.imageUrl).filter(Boolean) as string[];

  const uniqueUrls: string[] = [];
  const seen = new Set<string>();
  const register = (raw: string) => {
    const resolved = resolveCatalogImageUrl(raw);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    uniqueUrls.push(raw);
  };

  for (const url of orderedProductUrls) register(url);
  for (const url of shadeUrls) register(url);

  const total = uniqueUrls.length;
  let done = 0;
  let failed = 0;
  const urlToItem = new Map<string, ImageItem>();

  const report = () => onProgress?.({ done, total, failed });

  report();

  await mapWithConcurrency(
    uniqueUrls,
    async (rawUrl) => {
      const resolved = resolveCatalogImageUrl(rawUrl);
      try {
        const media = await uploadImageFromUrlWithFallback(rawUrl, purpose);
        urlToItem.set(resolved, {
          id: media.id,
          url: media.previewUrl || mediaThumb(media) || null,
        });
      } catch {
        failed += 1;
      } finally {
        done += 1;
        report();
      }
    },
    UPLOAD_CONCURRENCY,
  );

  const productImages: ImageItem[] = [];
  for (const rawUrl of orderedProductUrls) {
    const item = urlToItem.get(resolveCatalogImageUrl(rawUrl));
    if (item) productImages.push(item);
  }

  const shadeImageIds = new Map<string, string>();
  for (const shade of preview.shades || []) {
    if (!shade.imageUrl) continue;
    const item = urlToItem.get(resolveCatalogImageUrl(shade.imageUrl));
    if (item) shadeImageIds.set(shade.imageUrl, item.id);
  }

  return { productImages, shadeImageIds, failed };
}
