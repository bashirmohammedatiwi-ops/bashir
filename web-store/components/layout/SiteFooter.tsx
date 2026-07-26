"use client";

import Link from "next/link";

import { useStore } from "@/components/StoreProvider";
import { APP_ORIGIN } from "@/lib/config";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { storeName, whatsappUrl } = useStore();

  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <div className="container footer-cta-inner">
          <div>
            <h3>حمّلي تطبيق {storeName}</h3>
            <p>تسوّقي بسهولة، تتبّعي طلباتك، واستمتعي بعروض حصرية.</p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.alhayaa.alhayaa"
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
          <h3>{storeName}</h3>
          <p className="muted">متجر مستحضرات التجميل والعناية — الدفع عند الاستلام في جميع المحافظات.</p>
        </div>
        <div>
          <h4>تسوّقي</h4>
          <ul>
            <li><Link href="/products/">المنتجات</Link></li>
            <li><Link href="/categories/">الأقسام</Link></li>
            <li><Link href="/brands/">البراندات</Link></li>
            <li><Link href="/offers/">العروض</Link></li>
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
            {whatsappUrl ? (
              <li>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">واتساب</a>
              </li>
            ) : null}
            <li><a href="mailto:support@deemaalhayat.com">support@deemaalhayat.com</a></li>
            <li><a href={APP_ORIGIN}>{APP_ORIGIN.replace("https://", "")}</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {year} {storeName}</span>
        <Link href="/admin/login/" className="admin-link">لوحة التحكم</Link>
      </div>
    </footer>
  );
}
