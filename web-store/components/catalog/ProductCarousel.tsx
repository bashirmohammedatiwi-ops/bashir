import type { Product } from "@/lib/types";

import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return <p className="empty-state">لا توجد منتجات حالياً.</p>;
  }
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductCarousel({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <div className="product-carousel" tabIndex={0}>
      {products.map((p) => (
        <div key={p.id} className="product-carousel-item">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
