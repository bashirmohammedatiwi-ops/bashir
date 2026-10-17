import { rewriteMediaUrl } from "../../common/media-url.util";

type MediaRow = {
  id: string;
  publicUrlBase: string;
  filename: string;
  variants: unknown;
};

/** روابط صورة للتطبيق: الأصل (للقص بدقة كاملة)، كبيرة للعرض، ومصغّرة للقوائم. */
export function controlMediaUrls(media: MediaRow) {
  const variants = (media.variants ?? {}) as Record<string, { formats?: Record<string, string> } | undefined>;
  const pick = (key: string) => {
    const f = variants[key]?.formats;
    const path = f?.webp ?? f?.jpg ?? f?.avif;
    return path ? rewriteMediaUrl(path) : null;
  };
  const original = rewriteMediaUrl(`${media.publicUrlBase}/${media.filename}.webp`);
  return {
    mediaId: media.id,
    url: original,
    large: pick("large") ?? pick("medium") ?? original,
    thumb: pick("thumb") ?? pick("small") ?? original,
  };
}
