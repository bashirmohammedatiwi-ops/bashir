/** Safe slugify — never throws on undefined/null. */
export function slugify(name?: string | null, fallbackPrefix = "item") {
  const base = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 80);
  return base || `${fallbackPrefix}-${Date.now()}`;
}
