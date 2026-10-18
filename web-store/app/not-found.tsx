import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <div className="container grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="bg-gradient-to-l from-accent to-accent-dark bg-clip-text text-8xl font-extrabold text-transparent">404</p>
        <h1 className="mt-3 text-2xl font-extrabold">الصفحة غير موجودة</h1>
        <p className="mt-2 text-ink-muted">ربما نُقلت أو انتهى العرض — جرّبي البحث أو تصفّحي الأقسام</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            <Icon name="home" size={18} /> الرئيسية
          </Link>
          <Link href="/categories" className="btn-soft">
            الأقسام
          </Link>
          <Link href="/search" className="btn-ghost">
            <Icon name="search" size={18} /> البحث
          </Link>
        </div>
      </div>
    </div>
  );
}
