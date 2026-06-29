/** بادئة المسار العام عند النشر خلف Nginx (مثلاً /catalog-hub) */
export const PUBLIC_PREFIX = String(process.env.CATALOG_HUB_PUBLIC_PREFIX || '').replace(/\/$/, '');

export function publicPath(p = '') {
  const path = String(p || '').startsWith('/') ? String(p) : `/${p}`;
  return `${PUBLIC_PREFIX}${path}`;
}
