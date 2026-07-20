"use client";

import { Alert, Button, Input, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { SectionType, normalizePayload } from "./section-types";
import { validateSection } from "./section-validation";

const { Text } = Typography;

type Props = {
  type: SectionType;
  form: ReturnType<typeof import("antd").Form.useForm>[0];
};

export function SectionJsonTab({ type, form }: Props) {
  const [json, setJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const values = form.getFieldsValue(true);
    setJson(JSON.stringify({ title: values.title, subtitle: values.subtitle, isActive: values.isActive, payload: values.payload }, null, 2));
    setParseError(null);
  }, [form, type]);

  function refreshFromForm() {
    const values = form.getFieldsValue(true);
    setJson(JSON.stringify({ title: values.title, subtitle: values.subtitle, isActive: values.isActive, payload: values.payload }, null, 2));
    setParseError(null);
  }

  function applyToForm() {
    try {
      const parsed = JSON.parse(json) as {
        title?: string;
        subtitle?: string;
        isActive?: boolean;
        payload?: Record<string, unknown>;
      };
      const payload = normalizePayload(type, parsed.payload ?? {});
      const block = {
        type,
        title: parsed.title,
        isActive: parsed.isActive,
        payload,
      };
      const warnings = validateSection(block);
      const errors = warnings.filter((w) => w.level === "error");
      if (errors.length) {
        message.warning(`تنبيه: ${errors.map((e) => e.message).join(" · ")}`);
      }
      form.setFieldsValue({
        title: parsed.title,
        subtitle: parsed.subtitle,
        isActive: parsed.isActive ?? true,
        payload,
      });
      setParseError(null);
      message.success("تم تطبيق JSON على النموذج — احفظ لتأكيد");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "JSON غير صالح");
    }
  }

  return (
    <div className="hb-json-tab">
      <Alert
        type="warning"
        showIcon
        message="تحرير متقدم"
        description="عدّل الحقول بصيغة JSON — استخدم «تطبيق» ثم «حفظ». الأخطاء في البنية تُرفض."
        style={{ marginBottom: 12 }}
      />
      <div className="hb-json-tab-actions">
        <Button size="small" onClick={refreshFromForm}>
          تحديث من النموذج
        </Button>
        <Button size="small" type="primary" onClick={applyToForm}>
          تطبيق على النموذج
        </Button>
      </div>
      {parseError && (
        <Text type="danger" style={{ display: "block", margin: "8px 0" }}>
          {parseError}
        </Text>
      )}
      <Input.TextArea
        rows={16}
        value={json}
        onChange={(e) => {
          setJson(e.target.value);
          setParseError(null);
        }}
        style={{ direction: "ltr", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
      />
    </div>
  );
}
