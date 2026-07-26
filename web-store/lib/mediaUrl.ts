import { MEDIA_BASE } from "./config";

export function resolveMediaUrl(url?: string | null): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/media/")) return u;
  if (u.startsWith("/")) return `${MEDIA_BASE}${u}`;
  return `${MEDIA_BASE}/${u}`;
}

export function productImageUrl(product: {
  images?: Array<{ isPrimary?: boolean; media?: { thumb?: string; full?: string } | null }>;
}): string {
  const imgs = product.images ?? [];
  const primary = imgs.find((i) => i.isPrimary) ?? imgs[0];
  return resolveMediaUrl(primary?.media?.thumb || primary?.media?.full);
}
