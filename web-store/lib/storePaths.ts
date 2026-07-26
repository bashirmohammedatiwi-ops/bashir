export function productHref(slug: string) {
  return `/product/?slug=${encodeURIComponent(slug)}`;
}

export function categoryHref(slug: string) {
  return `/category/?slug=${encodeURIComponent(slug)}`;
}

export function brandHref(slug: string) {
  return `/brand/?slug=${encodeURIComponent(slug)}`;
}

export function packageHref(slug: string) {
  return `/package/?slug=${encodeURIComponent(slug)}`;
}

export function offersHref() {
  return "/offers/";
}

export function productsHref(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return "/products/";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const q = qs.toString();
  return q ? `/products/?${q}` : "/products/";
}
