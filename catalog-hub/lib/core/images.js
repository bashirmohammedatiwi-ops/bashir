/**
 * تجميع روابط صور فريدة من مصادر متعددة (نصوص، كائنات، مصفوفات).
 */
export function collectImageUrls(...sources) {
  const out = [];

  const visit = (val) => {
    if (!val) return;
    if (typeof val === 'string') {
      const s = val.trim();
      if (s.startsWith('http') || s.startsWith('//')) out.push(s);
      return;
    }
    if (Array.isArray(val)) {
      for (const item of val) visit(item);
      return;
    }
    if (typeof val === 'object') {
      visit(val.url || val.absUrl || val.src || val.href || val.image || val.file);
    }
  };

  for (const src of sources) visit(src);
  return [...new Set(out.filter(Boolean))];
}
