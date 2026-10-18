"use client";
import { useRef } from "react";
import type { Product } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { ProductCard } from "./ProductCard";

/** صف منتجات أفقي: سحب على الهاتف، وأسهم على الشاشات الكبيرة. */
export function ProductRow({ products, priority }: { products: Product[]; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  if (!products.length) return null;
  return (
    <div className="group/row relative">
      <div ref={ref} className="scroll-row -mx-4 px-4 md:mx-0 md:px-0">
        {products.map((p, i) => (
          <div key={p.id} className="w-[46%] flex-none snap-start sm:w-[31%] md:w-[23.5%] lg:w-[18.8%]">
            <ProductCard product={p} priority={priority && i < 3} />
          </div>
        ))}
      </div>
      <button onClick={() => by(1)} className="absolute -left-5 top-[38%] hidden h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-lift transition hover:scale-105 group-hover/row:grid" aria-label="التالي">
        <Icon name="chevronLeft" />
      </button>
      <button onClick={() => by(-1)} className="absolute -right-5 top-[38%] hidden h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-lift transition hover:scale-105 group-hover/row:grid" aria-label="السابق">
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
