import type { Media, Product, Shade } from "./types";

const ORDER = ["thumb", "small", "medium", "large"] as const;
type Size = (typeof ORDER)[number];

function abs(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return u;
  return `/${u}`;
}

/** رابط صورة بمقاس معيّن (webp)، أو أقرب مقاس متوفر. */
export function mediaUrl(m?: Media | null, size: Size = "medium"): string {
  if (!m) return "";
  if (m.url) return abs(m.url);
  const v = m.variants ?? {};
  const want = ORDER.indexOf(size);
  for (const s of [...ORDER.slice(want), ...ORDER.slice(0, want).reverse()]) {
    const f = v[s]?.formats;
    const u = f?.webp ?? f?.jpg;
    if (u) return abs(u);
  }
  if (m.publicUrlBase && m.filename) return abs(`${m.publicUrlBase}/${m.filename}.webp`);
  return abs(m.originalUrl);
}

/** srcset من كل المقاسات المتوفرة — المتصفح يختار الأنسب للشاشة. */
export function mediaSrcSet(m?: Media | null): string | undefined {
  if (!m?.variants) return undefined;
  const parts: string[] = [];
  for (const s of ORDER) {
    const v = m.variants[s];
    const u = v?.formats?.webp ?? v?.formats?.jpg;
    if (u && v?.width) parts.push(`${abs(u)} ${v.width}w`);
  }
  return parts.length ? parts.join(", ") : undefined;
}

export function productCover(p: Product, size: Size = "small"): string {
  const img = [...(p.images ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position)[0];
  return mediaUrl(img?.media, size);
}

export function productCoverMedia(p: Product): Media | null {
  const img = [...(p.images ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position)[0];
  return img?.media ?? null;
}

/** تدرجات تظهر للزبونة (لها باركود). */
export function listedShades(p: Product): Shade[] {
  return (p.shades ?? []).filter((s) => (s.hasBarcode ?? !!s.barcode) && s.isActive !== false);
}
