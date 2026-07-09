function rgbToHex(r: number, g: number, b: number) {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function saturationOf(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/**
 * يستخرج اللون الغالب من صورة درجة (سواتش أو صورة منتج).
 * يتجاهل خلفية بيضاء/سوداء/رمادية ويختار اللون الأكثر تشبّعاً وتكراراً
 * عبر تجميع البكسلات في صناديق لونية (color buckets).
 */
export async function averageColorFromImageUrl(url: string): Promise<string | null> {
  const src = String(url || "").trim();
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
        const size = 48;
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

        // تجميع البكسلات الملوّنة في صناديق (تقريب لكل 32 درجة)
        const buckets = new Map<
          string,
          { r: number; g: number; b: number; n: number; score: number }
        >();
        let fallbackR = 0;
        let fallbackG = 0;
        let fallbackB = 0;
        let fallbackN = 0;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 64) continue; // شفاف
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = saturationOf(r, g, b);

          // متوسط احتياطي لكل البكسلات غير الشفافة
          fallbackR += r;
          fallbackG += g;
          fallbackB += b;
          fallbackN += 1;

          // تجاهل الأبيض/الفاتح جداً (خلفية)
          if (min > 222) continue;
          // تجاهل الأسود/الداكن جداً (ظلال/حدود)
          if (max < 32) continue;
          // تجاهل الرمادي الباهت (تشبّع منخفض ولون متوسط)
          if (sat < 0.12 && max > 60 && max < 210) continue;

          const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
          const prev = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, score: 0 };
          prev.r += r;
          prev.g += g;
          prev.b += b;
          prev.n += 1;
          // وزن البكسل = تكراره مرجّحاً بتشبّعه (الألوان الزاهية أهم)
          prev.score += 1 + sat * 2;
          buckets.set(key, prev);
        }

        if (buckets.size) {
          let best: { r: number; g: number; b: number; n: number; score: number } | null = null;
          for (const bucket of buckets.values()) {
            if (!best || bucket.score > best.score) best = bucket;
          }
          if (best && best.n) {
            finish(rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n));
            return;
          }
        }

        // لا يوجد لون مميّز — استخدم المتوسط العام
        finish(fallbackN ? rgbToHex(fallbackR / fallbackN, fallbackG / fallbackN, fallbackB / fallbackN) : null);
      } catch {
        finish(null);
      }
    };

    img.onerror = () => finish(null);
    img.src = src;
  });
}

function hexSaturation(hex?: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || "").trim());
  if (!m) return -1;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return saturationOf(r, g, b);
}

export async function resolveShadeColorHex(shade: {
  colorHex?: string;
  colorHexEnd?: string;
  imageUrl?: string;
  swatchUrl?: string;
}): Promise<string | undefined> {
  const existing = String(shade.colorHex || "").trim();
  const swatch = String(shade.swatchUrl || "").trim();
  const full = String(shade.imageUrl || "").trim();

  // إن وُجدت صورة: استخرج اللون منها (أدق من تخمين الاسم)
  // وأبقِ القيمة الموجودة فقط إن فشل الاستخراج أو لم توجد صورة
  if (swatch || full) {
    const candidates = [...new Set([swatch, full].filter(Boolean))];
    const sampled = await Promise.all(candidates.map((u) => averageColorFromImageUrl(u)));
    let best: string | undefined;
    let bestSat = -1;
    for (const hex of sampled) {
      if (!hex) continue;
      const sat = hexSaturation(hex);
      if (sat > bestSat) {
        bestSat = sat;
        best = hex;
      }
    }
    if (best) {
      // فضّل لون الصورة إن كان أوضح من التخمين الموجود
      if (!existing || hexSaturation(existing) < 0.15 || bestSat >= hexSaturation(existing)) {
        return best;
      }
    }
  }

  return existing || undefined;
}
