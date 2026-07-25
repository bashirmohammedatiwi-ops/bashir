type ShadeLike = {
  name?: string;
  position?: number;
};

function shadeNumberSortKey(shade: ShadeLike, fallbackIndex = 0): Array<string | number> {
  const raw = String(shade.name || "").trim();
  const digits = raw.match(/\d+/);
  if (digits) {
    const num = Number(digits[0]);
    if (Number.isFinite(num)) return [0, num, raw.toLowerCase(), fallbackIndex];
  }
  return [1, raw.toLowerCase(), fallbackIndex];
}

/** يرتّب التدرجات تصاعدياً حسب رقم الدرجة */
export function sortShadesByNumber<T extends ShadeLike>(shades: T[] = []): T[] {
  return [...shades]
    .map((shade, index) => ({
      ...shade,
      position: Number.isFinite(Number(shade.position)) ? Number(shade.position) : index,
    }))
    .sort((a, b) => {
      const ka = shadeNumberSortKey(a, a.position ?? 0);
      const kb = shadeNumberSortKey(b, b.position ?? 0);
      for (let i = 0; i < ka.length; i += 1) {
        if (ka[i] < kb[i]) return -1;
        if (ka[i] > kb[i]) return 1;
      }
      return 0;
    })
    .map((shade, index) => ({ ...shade, position: index }));
}
