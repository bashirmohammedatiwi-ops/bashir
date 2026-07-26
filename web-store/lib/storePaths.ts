export function productHref(slug: string) {
  return `/product/?slug=${encodeURIComponent(slug)}`;
}

export function categoryHref(slug: string) {
  return `/category/?slug=${encodeURIComponent(slug)}`;
}

export function brandHref(slug: string) {
  return `/brand/?slug=${encodeURIComponent(slug)}`;
}
