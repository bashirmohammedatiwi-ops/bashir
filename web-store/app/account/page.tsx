"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BuyAgain } from "@/components/account/BuyAgain";
import { OrderCard } from "@/components/account/OrderCard";
import { useLoyaltyRules } from "@/components/Providers";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatNumber, formatPrice } from "@/lib/format";
import { useWishlist } from "@/lib/hooks/wishlist";
import { useAuth } from "@/lib/stores/auth";
import type { Order, Paged } from "@/lib/types";

export default function AccountHome() {
  const user = useAuth((s) => s.user)!;
  const rules = useLoyaltyRules();
  const orders = useQuery({ queryKey: ["orders", user.id, "recent"], queryFn: () => api<Paged<Order>>("/orders", { query: { page: 1, limit: 3, preview: true } }) });
  const wish = useWishlist();
  const points = user.points ?? 0;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "صباح الخير" : "مساء الخير";

  const stats: [string, string, string, IconName, string][] = [
    ["طلباتي", formatNumber(orders.data?.meta.total ?? 0), "/account/orders", "box", "from-sky-400 to-indigo-500"],
    ["نقاطي", formatNumber(points), "/account/points", "sparkle", "from-accent to-accent-dark"],
    ["المفضلة", formatNumber(wish.data?.length ?? 0), "/wishlist", "heart", "from-rose to-rose-deep"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">
          {hello}، {user.name?.split(" ")[0]} 💜
        </h1>
        <p className="mt-1 text-ink-muted">كل ما يخص طلباتكِ ونقاطكِ في مكان واحد</p>
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {stats.map(([label, value, href, icon, grad]) => (
          <Link key={href} href={href} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${grad} p-4 text-white shadow-lift transition hover:-translate-y-0.5 md:p-5`}>
            <Icon name={icon} size={56} className="absolute -left-2 -top-2 opacity-20" />
            <p className="text-2xl font-extrabold tabular-nums md:text-3xl">{value}</p>
            <p className="text-sm font-bold opacity-90">{label}</p>
          </Link>
        ))}
      </div>
      {points >= rules.redeemStep && (
        <div className="card flex items-center gap-3 bg-gradient-to-l from-accent-light to-surface p-4">
          <span className="text-3xl">🎁</span>
          <p className="flex-1 text-sm">
            رصيدكِ يساوي <b className="text-accent-dark">{formatPrice(Math.floor(points * rules.pointValue))}</b> — استخدميه كخصم في طلبكِ القادم
          </p>
          <Link href="/" className="btn-soft h-10 flex-none px-4 text-sm">
            تسوّقي
          </Link>
        </div>
      )}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">آخر الطلبات</h2>
          <Link href="/account/orders" className="text-sm font-bold text-accent-dark">
            كل الطلبات
          </Link>
        </div>
        {orders.isLoading ? (
          <Skeleton className="h-32" />
        ) : orders.data?.data.length ? (
          <div className="space-y-3">
            {orders.data.data.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="font-bold">لا طلبات بعد</p>
            <p className="mt-1 text-sm text-ink-muted">{rules.firstOrderBonus ? `اطلبي أول طلب واحصلي على ${formatNumber(rules.firstOrderBonus)} نقطة هدية` : "ابدئي التسوّق الآن"}</p>
            <Link href="/" className="btn-primary mt-4">
              تسوّقي الآن
            </Link>
          </div>
        )}
      </section>
      <BuyAgain boxed />
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["/skin-quiz", "اختبار البشرة", "اعرفي نوع بشرتكِ وروتينكِ المناسب", "sparkle"],
            ["/account/addresses", "عناويني", "أضيفي وعدّلي عناوين التوصيل", "location"],
          ] as [string, string, string, IconName][]
        ).map(([href, t, s, i]) => (
          <Link key={href} href={href} className="card flex items-center gap-3 p-4 transition hover:shadow-lift">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-light text-accent-dark">
              <Icon name={i} />
            </span>
            <span className="flex-1">
              <span className="block font-extrabold">{t}</span>
              <span className="block text-xs text-ink-muted">{s}</span>
            </span>
            <Icon name="chevronLeft" size={18} className="text-ink-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
