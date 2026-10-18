import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/catalog/PageHero";
import { Icon } from "@/components/ui/Icon";
import { serverTry } from "@/lib/api";
import { currentWorld, getHome } from "@/lib/data";
import { formatNumber, formatPrice } from "@/lib/format";
import type { ShippingZone } from "@/lib/types";

export const metadata: Metadata = {
  title: "المساعدة والتواصل",
  description: "أسعار ومدة التوصيل لكل محافظة، طرق الدفع، نقاط الولاء، والتواصل مع خدمة عملاء ديما الحياة.",
  alternates: { canonical: "/help" },
};

const days = (z: ShippingZone) => {
  const a = z.deliveryDaysMin ?? 1;
  const b = Math.max(a, z.deliveryDaysMax ?? a);
  const w = (n: number) => (n === 1 ? "يوم" : n === 2 ? "يومين" : `${n} أيام`);
  return a === b ? w(a) : `${a}–${b} أيام`;
};

export default async function HelpPage() {
  const world = await currentWorld();
  const [feed, zones] = await Promise.all([getHome(world?.slug).catch(() => null), serverTry<ShippingZone[]>("/shipping/zones", { revalidate: 600 })]);
  const s = feed?.settings ?? {};
  const loyalty = s.loyalty;
  const wa = s.whatsapp?.replace(/\D/g, "");
  const faqs: [string, React.ReactNode][] = [
    ["هل المنتجات أصلية؟", "نعم، كل منتجاتنا أصلية 100% ومن الوكلاء والموزعين المعتمدين، ولا نبيع أي منتج مقلّد."],
    [
      "كم سعر التوصيل وكم يستغرق؟",
      <>
        يختلف حسب المحافظة (الجدول بالأسفل).{" "}
        {s.freeShippingThreshold ? <b>التوصيل مجاني للطلبات فوق {formatPrice(s.freeShippingThreshold)}.</b> : null} يوم الجمعة عطلة التوصيل.
      </>,
    ],
    ["كيف أدفع؟", "نقداً عند الاستلام، أو بالبطاقة (كي كارد / ماستركارد) عند إتمام الطلب حين تكون متاحة لحسابكِ."],
    [
      "كيف تعمل نقاط الولاء؟",
      loyalty ? (
        <>
          تكسبين {loyalty.earnPercent}% من قيمة كل طلب نقاطاً بعد توصيله، وكل نقطة = {loyalty.pointValue} د.ع خصم. تستخدمينها عند الدفع بمضاعفات {formatNumber(loyalty.redeemStep)}
          {loyalty.firstOrderBonus ? `، ومع أول طلب هدية ${formatNumber(loyalty.firstOrderBonus)} نقطة` : ""}.
        </>
      ) : (
        "تكسبين نقاطاً مع كل طلب وتستخدمينها خصماً على طلباتكِ القادمة."
      ),
    ],
    ["هل أقدر ألغي طلبي؟", "نعم، من «طلباتي» ما دام الطلب بانتظار التأكيد أو مؤكداً ولم يُجهَّز بعد. وتُعاد نقاطكِ المستخدمة تلقائياً."],
    ["كيف أعرف اللون المناسب أو المنتج المناسب لبشرتي؟", <>اسألي <Link href="/advisor" className="font-bold text-accent-dark underline">ديما</Link> مستشارتنا الجمالية، أو جرّبي <Link href="/skin-quiz" className="font-bold text-accent-dark underline">اختبار البشرة</Link>.</>],
    ["أقدر أرسل الطلب هدية؟", "أكيد — فعّلي «هذا الطلب هدية» عند الدفع، نغلّفه ونرفق بطاقة برسالتكِ، ونقدر نخفي الأسعار من الفاتورة."],
    ["منتج أحبه نفد، شلون أعرف إذا رجع؟", "اضغطي «أعلميني عند التوفّر» في صفحة المنتج وسنرسل لكِ إشعاراً فور توفّره."],
  ];
  return (
    <div className="animate-fade-up">
      <PageHero title="كيف نقدر نساعدكِ؟" subtitle="أجوبة سريعة عن التوصيل والدفع والطلبات — وفريقنا جاهز للتواصل" crumbs={[{ label: "المساعدة" }]} />
      <div className="container grid items-start gap-8 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="space-y-3">
            {faqs.map(([q, a]) => (
              <details key={q} className="card group p-5 open:shadow-lift">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold">
                  {q}
                  <Icon name="chevronDown" size={18} className="flex-none text-ink-muted transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-8 text-ink-soft">{a}</p>
              </details>
            ))}
          </section>
          {!!zones?.length && (
            <section id="delivery" className="scroll-mt-40">
              <h2 className="section-title mb-4">التوصيل حسب المحافظة 🚚</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-canvas text-ink-muted">
                    <tr>
                      <th className="p-3 text-start">المحافظة</th>
                      <th className="p-3 text-start">السعر</th>
                      <th className="p-3 text-start">المدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {zones.map((z) => (
                      <tr key={z.id}>
                        <td className="p-3 font-bold">{z.governorate}</td>
                        <td className="p-3 tabular-nums">{formatPrice(z.standardFee)}</td>
                        <td className="p-3 text-ink-soft">{days(z)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-36">
          <div className="card space-y-3 p-5">
            <h2 className="text-lg font-extrabold">تواصلي معنا</h2>
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 font-bold text-success hover:brightness-95">
                <Icon name="chat" /> واتساب <span className="ms-auto text-sm" dir="ltr">+{wa}</span>
              </a>
            )}
            {s.supportPhone && (
              <a href={`tel:${s.supportPhone}`} className="flex items-center gap-3 rounded-2xl bg-canvas p-3 font-bold hover:bg-accent-light">
                <Icon name="phone" /> اتصال <span className="ms-auto text-sm" dir="ltr">{s.supportPhone}</span>
              </a>
            )}
            <Link href="/advisor" className="flex items-center gap-3 rounded-2xl bg-accent-light p-3 font-bold text-accent-dark hover:brightness-95">
              <Icon name="sparkle" /> اسألي ديما عن المنتجات
            </Link>
          </div>
          {s.pickupEnabled && s.pickupAddress && (
            <div className="card p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-extrabold">
                <Icon name="location" className="text-accent-dark" /> فرعنا
              </h2>
              <p className="text-ink-soft">{s.pickupAddress}</p>
              {s.pickupHours && <p className="mt-1 text-sm text-ink-muted">🕙 {s.pickupHours}</p>}
            </div>
          )}
          <div className="card p-5 text-sm">
            <Link href="/account/orders" className="flex items-center justify-between font-bold hover:text-accent-dark">
              تتبّع طلبي <Icon name="chevronLeft" size={16} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
