"use client";
import Link from "next/link";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { Icon } from "@/components/ui/Icon";
import { arProducts } from "@/lib/format";
import { useWishlist } from "@/lib/hooks/wishlist";

export default function WishlistPage() {
  const q = useWishlist();
  const items = q.data ?? [];
  return (
    <div>
      <h1 className="text-2xl font-extrabold">
        المفضلة {items.length > 0 && <span className="text-base font-bold text-ink-muted">({arProducts(items.length)})</span>}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">ننبّهكِ فور انخفاض سعر أي منتج هنا 💜</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 xl:grid-cols-4">
        {q.isLoading ? (
          [0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)
        ) : items.length ? (
          items.map((p) => <ProductCard key={p.id} product={p} />)
        ) : (
          <div className="card col-span-full p-10 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-soft text-sale">
              <Icon name="heart" size={34} />
            </span>
            <p className="mt-3 font-extrabold">قائمتكِ فارغة</p>
            <p className="mt-1 text-sm text-ink-muted">اضغطي ♡ على أي منتج لحفظه هنا</p>
            <Link href="/" className="btn-primary mt-4">
              اكتشفي المنتجات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
