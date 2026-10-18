const nf = new Intl.NumberFormat("en-US");

export const formatNumber = (n: number) => nf.format(Math.round(n || 0));
export const formatPrice = (n: number) => `${nf.format(Math.round(n || 0))} د.ع`;

/** «3 منتجات» / «15 منتج» / «منتجان». */
export function arCount(n: number, one: string, two: string, few: string, many: string) {
  const m = n % 100;
  if (n === 1) return one;
  if (n === 2) return two;
  if (m >= 3 && m <= 10) return `${formatNumber(n)} ${few}`;
  return `${formatNumber(n)} ${many}`;
}
export const arProducts = (n: number) => arCount(n, "منتج واحد", "منتجان", "منتجات", "منتج");
export const arPoints = (n: number) => arCount(n, "نقطة واحدة", "نقطتين", "نقاط", "نقطة");

const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return "اليوم";
  if (diff === 1) return "أمس";
  return `${d.getDate()} ${months[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ""}`;
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)} • ${h}:${m} ${d.getHours() < 12 ? "ص" : "م"}`;
}

export const productName = (p: { name: string; nameAr?: string | null }) => p.nameAr || p.name;

/** اسم البراند الظاهر: الجزء اللاتيني من «عربي English» إن وُجد. */
export function brandLabel(name?: string | null) {
  if (!name) return "";
  const en = name.split(/\s+/).filter((w) => !/[؀-ۿ]/.test(w)).join(" ").trim();
  return en || name;
}
export function brandArabic(name?: string | null) {
  if (!name) return "";
  const ar = name.split(/\s+/).filter((w) => /[؀-ۿ]/.test(w)).join(" ").trim();
  return ar || name;
}
