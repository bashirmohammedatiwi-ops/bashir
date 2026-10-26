import type { Metadata } from "next";
import { DeleteAccountPanel } from "@/components/account/DeleteAccountPanel";
import { PageHero } from "@/components/catalog/PageHero";
import { currentWorld, getHome } from "@/lib/data";

export const metadata: Metadata = {
  title: "حذف الحساب",
  description: "احذفي حسابكِ في ديما الحياة وبياناتكِ الشخصية — من الموقع أو التطبيق أو بطلب لخدمة العملاء.",
  alternates: { canonical: "/delete-account" },
};

/** صفحة حذف الحساب العامة — رابطها مطلوب في Google Play و App Store (حذف بدون التطبيق). */
export default async function DeleteAccountPage() {
  const world = await currentWorld();
  const feed = await getHome(world?.slug).catch(() => null);
  const s = feed?.settings ?? {};
  return (
    <div className="animate-fade-up">
      <PageHero title="حذف الحساب" subtitle="يمكنكِ حذف حسابكِ وبياناتكِ الشخصية في أي وقت." crumbs={[{ label: "حذف الحساب" }]} />
      <div className="container max-w-3xl pb-16">
        <DeleteAccountPanel whatsapp={s.whatsapp?.replace(/\D/g, "") || null} phone={s.supportPhone ?? null} />
      </div>
    </div>
  );
}
