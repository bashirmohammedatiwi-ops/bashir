export { arPoints, brandLabel, formatPrice, productName } from "@/lib/format";
import type { CartLine } from "@/lib/stores/cart";

/** مجموع السلة إن أُضيف هذا المنتج (لا يُحسب مرتين إن كان فيها). */
export function cartSubtotalSafe(lines: CartLine[], productId: string, addition: number) {
  const sum = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  return lines.some((l) => l.productId === productId) ? sum : sum + addition;
}
