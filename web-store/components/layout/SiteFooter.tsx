import Link from "next/link";

import { APP_ORIGIN, displayStoreName } from "@/lib/config";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <div className="container footer-cta-inner">
          <div>
            <h3>حمّلي تطبيق {displayStoreName("ar")}</h3>
            <p>تسوّقي بسهولة، تتبّعي طلباتك، واستمتعي بعروض حصرية.</p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.deemaalhayat.app"
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Play
          </a>
        </div>
      </div>

      <div className="container footer-grid">
        <div>
          <h3>{displayStoreName("ar")}</h3>
          <p className="muted">متجر مستحضرات التجميل والعناية — الدفع عند الاستلام في جميع المحافظات.</p>
        </div>
        <div>
          <h4>تسوّقي</h4>
          <ul>
            <li><Link href="/products/">المنتجات</Link></li>
            <li><Link href="/categories/">الأقسام</Link></li>
            <li><Link href="/brands/">البراندات</Link></li>
          </ul>
        </div>
        <div>
          <h4>القانونية</h4>
          <ul>
            <li><Link href="/privacy/">سياسة الخصوصية</Link></li>
            <li><Link href="/terms/">شروط الاستخدام</Link></li>
          </ul>
        </div>
        <div>
          <h4>تواصلي معنا</h4>
          <ul>
            <li><a href="mailto:support@deemaalhayat.com">support@deemaalhayat.com</a></li>
            <li><a href={APP_ORIGIN}>{APP_ORIGIN.replace("https://", "")}</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {year} {displayStoreName("ar")}</span>
        <Link href="/admin/login/" className="admin-link">لوحة التحكم</Link>
      </div>
    </footer>
  );
}
