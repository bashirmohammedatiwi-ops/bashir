export type MediaForDedupe = {
  id: string;
  hash: string;
  filename: string;
  storagePath: string;
  publicUrlBase: string;
  originalName: string;
  width: number;
  height: number;
  bytes: number;
};

function normPath(s: string) {
  return s.replace(/\\/g, "/").trim().toLowerCase();
}

/** مفاتيح لمطابقة الصور المكررة فعلياً (نفس الملف — وليس مجرد اسم ملف متشابه). */
export function dedupeKeysForMedia(media: MediaForDedupe): string[] {
  const keys = new Set<string>();
  keys.add(`id:${media.id}`);
  keys.add(`hash:${media.hash}`);

  const path = normPath(`${media.storagePath}/${media.filename}`);
  if (path) keys.add(`path:${path}`);

  const url = normPath(`${media.publicUrlBase}/${media.filename}`);
  if (url) keys.add(`url:${url}`);

  return [...keys];
}

export type ProductImageRow = {
  id: string;
  mediaId: string;
  media: MediaForDedupe;
};

export function partitionDuplicateProductImages(images: ProductImageRow[]) {
  const seen = new Set<string>();
  const keep: ProductImageRow[] = [];
  const removeIds: string[] = [];

  for (const img of images) {
    const keys = dedupeKeysForMedia(img.media);
    const isDuplicate = keys.some((k) => seen.has(k));
    if (isDuplicate) {
      removeIds.push(img.id);
      continue;
    }
    for (const k of keys) seen.add(k);
    keep.push(img);
  }

  return { keep, removeIds };
}
