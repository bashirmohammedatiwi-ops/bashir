/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { PLAY_STORE_URL, APP_STORE_URL } from "@/lib/config";
import { categoryHref } from "@/lib/links";
import type { Category, HomeFeed } from "@/lib/types";
import { Icon } from "../ui/Icon";

export function SiteFooter({ settings, categories }: { settings: HomeFeed["settings"]; categories: Category[] }) {
  const wa = (settings.whatsapp ?? "").replace(/[^\d]/g, "");
  return (
    <footer className="mt-16 border-t border-hairline bg-surface">
      <div className="container grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["truck", "توصيل لكل العراق", "سريع ومتتبَّع حتى باب بيتكِ"],
          ["shield", "منتجات أصلية 100%", "من الوكلاء والموزعين المعتمدين"],
          ["cash", "ادفعي كما تحبين", "نقداً عند الاستلام أو بالبطاقة"],
          ["chat", "نساعدكِ دائماً", "دعم مباشر عبر واتساب"],
        ].map(([icon, title, sub]) => (
          <div key={title} className="flex items-center gap-4 rounded-3xl bg-canvas p-4">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-accent-light text-accent-dark">
              <Icon name={icon as never} />
            </span>
            <span>
              <span className="block font-extrabold">{title}</span>
              <span className="text-sm text-ink-muted">{sub}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-hairline">
        <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-12 w-12 rounded-2xl" />
              <div>
                <div className="text-xl font-extrabold">ديما الحياة</div>
                <div className="text-xs text-ink-muted">deema alhayat</div>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-7 text-ink-soft">
              متجركِ لمستحضرات التجميل والعناية والعطور الأصلية في العراق — اختيارات مدروسة، أسعار واضحة، وتوصيل لكل المحافظات.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener" className="btn-ghost h-11 gap-2 px-4 text-sm">
                <Icon name="box" size={18} /> Google Play
              </a>
              {APP_STORE_URL && (
                <a href={APP_STORE_URL} target="_blank" rel="noopener" className="btn-ghost h-11 gap-2 px-4 text-sm">
                  <Icon name="box" size={18} /> App Store
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-4 font-extrabold">الأقسام</h4>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              {categories.slice(0, 7).map((c) => (
                <li key={c.id}>
                  <Link href={categoryHref(c.slug)} className="hover:text-accent-dark">{c.nameAr || c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-extrabold">تسوّقي</h4>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              {[
                ["/offers", "العروض"],
                ["/brands", "البراندات"],
                ["/skin-guide", "دليل البشرة"],
                ["/skin-quiz", "اختبار البشرة"],
                ["/packages", "الباقات والروتين"],
                ["/account/orders", "تتبّع طلبي"],
                ["/about", "من نحن"],
              ].map(([h, l]) => (
                <li key={h}>
                  <Link href={h} className="hover:text-accent-dark">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-extrabold">تواصلي معنا</h4>
            <ul className="space-y-3 text-sm text-ink-soft">
              {wa && (
                <li>
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-accent-dark">
                    <Icon name="chat" size={18} /> واتساب: <span dir="ltr">{settings.whatsapp}</span>
                  </a>
                </li>
              )}
              {settings.supportPhone && (
                <li>
                  <a href={`tel:${settings.supportPhone}`} className="flex items-center gap-2 hover:text-accent-dark">
                    <Icon name="phone" size={18} /> <span dir="ltr">{settings.supportPhone}</span>
                  </a>
                </li>
              )}
              {settings.pickupEnabled && settings.pickupAddress && (
                <li className="flex items-start gap-2">
                  <Icon name="location" size={18} className="mt-0.5 flex-none" />
                  <span>
                    {settings.pickupAddress}
                    {settings.pickupHours && <span className="block text-ink-muted">{settings.pickupHours}</span>}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-muted sm:flex-row">
          <span>© {new Date().getFullYear()} ديما الحياة — جميع الحقوق محفوظة</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">سياسة الخصوصية</Link>
            <Link href="/terms" className="hover:text-ink">شروط الاستخدام</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
