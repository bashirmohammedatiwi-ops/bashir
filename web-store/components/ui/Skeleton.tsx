/// Skeleton primitives — shimmer placeholders matching real layouts
/// (product grids, detail pages, category pages) instead of a bare spinner.

export function SkeletonBox({ className = "", circle = false }: { className?: string; circle?: boolean }) {
  return <div className={`skeleton ${circle ? "skeleton-circle" : ""} ${className}`} aria-hidden />;
}

export function SkeletonLine({ width = "100%", className = "" }: { width?: string; className?: string }) {
  return <div className={`skeleton skeleton-line ${className}`} style={{ width }} aria-hidden />;
}

/** بطاقة منتج هيكلية — تطابق ProductCard تماماً لتجنب قفزات التخطيط. */
export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden>
      <div className="product-image-wrap skeleton" />
      <div className="product-body">
        <SkeletonLine width="40%" className="skeleton-tiny" />
        <div style={{ height: 8 }} />
        <SkeletonLine width="85%" />
        <div style={{ height: 6 }} />
        <SkeletonLine width="60%" />
        <div style={{ height: 10 }} />
        <SkeletonLine width="35%" className="skeleton-tiny" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" role="status" aria-label="جاري تحميل المنتجات">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** هيكل صفحة قسم/براند: ترويسة + شريط + شبكة. */
export function CategoryPageSkeleton() {
  return (
    <div className="page-skeleton">
      <SkeletonLine width="30%" className="skeleton-title" />
      <div style={{ height: 18 }} />
      <SkeletonLine width="70%" />
      <div style={{ height: 26 }} />
      <ProductGridSkeleton />
    </div>
  );
}

/** هيكل الرئيسية: بانر عريض + صفوف أقسام. */
export function HomePageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="جاري تحميل الصفحة الرئيسية">
      <div className="skeleton skeleton-hero" />
      <div style={{ height: 26 }} />
      <SkeletonLine width="25%" className="skeleton-title" />
      <div style={{ height: 14 }} />
      <ProductGridSkeleton count={4} />
      <div style={{ height: 30 }} />
      <SkeletonLine width="25%" className="skeleton-title" />
      <div style={{ height: 14 }} />
      <ProductGridSkeleton count={4} />
    </div>
  );
}

/** هيكل صفحة تفاصيل المنتج: معرض + معلومات. */
export function ProductDetailSkeleton() {
  return (
    <div className="product-detail-skeleton" role="status" aria-label="جاري تحميل المنتج">
      <div className="skeleton skeleton-gallery" />
      <div className="product-detail-skeleton-info">
        <SkeletonLine width="35%" className="skeleton-tiny" />
        <div style={{ height: 10 }} />
        <SkeletonLine width="90%" className="skeleton-title" />
        <div style={{ height: 8 }} />
        <SkeletonLine width="55%" />
        <div style={{ height: 18 }} />
        <SkeletonLine width="30%" className="skeleton-title" />
        <div style={{ height: 16 }} />
        <SkeletonLine />
        <div style={{ height: 8 }} />
        <SkeletonLine width="85%" />
        <div style={{ height: 8 }} />
        <SkeletonLine width="70%" />
      </div>
    </div>
  );
}
