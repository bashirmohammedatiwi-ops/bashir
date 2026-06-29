import { resolveCatalogImageUrl } from "./resolveCatalogImageUrl";

function rgbToHex(r: number, g: number, b: number) {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** يستخرج لوناً تقريبياً من صورة الـ swatch (لمنتجات وجوه وغيرها بدون hex في الـ API) */
export async function averageColorFromImageUrl(url: string): Promise<string | null> {
  const src = resolveCatalogImageUrl(url);
  if (!src) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    const finish = (hex: string | null) => {
      img.onload = null;
      img.onerror = null;
      resolve(hex);
    };

    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 32) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n += 1;
        }
        finish(n ? rgbToHex(r / n, g / n, b / n) : null);
      } catch {
        finish(null);
      }
    };

    img.onerror = () => finish(null);
    img.src = src;
  });
}

export async function resolveShadeColorHex(shade: {
  colorHex?: string;
  colorHexEnd?: string;
  imageUrl?: string;
}): Promise<string | undefined> {
  const existing = String(shade.colorHex || "").trim();
  if (existing) return existing;
  if (!shade.imageUrl) return undefined;
  const sampled = await averageColorFromImageUrl(shade.imageUrl);
  return sampled || undefined;
}
