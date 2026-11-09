"use client";
import { Alert, DatePicker, Form, Input, Segmented, Switch } from "antd";
import dayjs from "dayjs";
import { MediaPicker } from "@/components/MediaPicker";
import { LinkTargetPicker } from "@/components/home-builder/LinkTargetPicker";

type EntityLists = Parameters<typeof LinkTargetPicker>[0]["entities"];

const P = "launchPopup";

/** تاريخ ISO في الإعدادات ↔ dayjs في DatePicker. */
const dateProps = {
  getValueProps: (v: unknown) => ({ value: v ? dayjs(String(v)) : null }),
  normalize: (d: { toISOString?: () => string } | null) => (d?.toISOString ? d.toISOString() : null),
};

/** «إعلان عند فتح التطبيق» — حقول داخل نموذج الإعدادات (تُحفظ في launchPopup). */
export function LaunchPopupFields({ entities }: { entities: EntityLists }) {
  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="كيف يعمل؟"
        description={
          <div style={{ lineHeight: 1.9 }}>
            <div>عند فتح التطبيق تظهر الصورة فوق الصفحة الرئيسية بزر إغلاق، والضغط عليها يفتح الرابط (منتج، براند، قسم…).</div>
            <div>
              الصورة <b>طولية 1080×1350</b> (أو 1080×1500) بتصميم كامل — النص والسعر داخل الصورة.
            </div>
            <div>تغيير الصورة أو الرابط أو المدة = إعلان جديد يظهر مرة أخرى حتى لمن أغلقت السابق.</div>
            <div>يحتاج نسخة التطبيق التي تدعم الإعلان — النسخ الأقدم تتجاهله دون مشاكل.</div>
          </div>
        }
      />
      <Form.Item name={[P, "enabled"]} label="تفعيل الإعلان" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name={[P, "imageId"]} label="صورة الإعلان (طولية)">
        <MediaPicker label="اختر صورة" purpose="BANNER" />
      </Form.Item>
      <Form.Item name={[P, "title"]} label="اسم الإعلان (داخلي)" extra="لتمييزه في اللوحة — لا يظهر للزبونة">
        <Input placeholder="شموع فكتوريا سيكريت — تشرين الثاني" maxLength={80} />
      </Form.Item>
      <LinkTargetPicker prefix={[P]} entities={entities} optional />
      <Form.Item name={[P, "frequency"]} label="كم مرة يظهر للزبونة؟" initialValue="daily">
        <Segmented
          options={[
            { value: "once", label: "مرة واحدة فقط" },
            { value: "daily", label: "مرة كل يوم" },
            { value: "always", label: "كل فتح للتطبيق" },
          ]}
        />
      </Form.Item>
      <div style={{ display: "flex", gap: 12 }}>
        <Form.Item name={[P, "startsAt"]} label="يبدأ (اختياري)" style={{ flex: 1 }} {...dateProps}>
          <DatePicker showTime format="YYYY/MM/DD HH:mm" style={{ width: "100%" }} placeholder="فوراً" />
        </Form.Item>
        <Form.Item name={[P, "endsAt"]} label="ينتهي (اختياري)" style={{ flex: 1 }} {...dateProps}>
          <DatePicker showTime format="YYYY/MM/DD HH:mm" style={{ width: "100%" }} placeholder="بلا نهاية" />
        </Form.Item>
      </div>
    </>
  );
}
