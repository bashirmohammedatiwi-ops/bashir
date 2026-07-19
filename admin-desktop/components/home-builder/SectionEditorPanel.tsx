"use client";

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { SectionPayloadEditor } from "./SectionPayloadEditor";
import { SectionLayoutFields } from "./SectionLayoutFields";
import { SectionType, labelForType, metaForType } from "./section-types";
import { validateSection } from "./section-validation";
import { MediaPicker } from "@/components/MediaPicker";

const { Text, Title } = Typography;

type Props = {
  editing: any | null;
  isNew: boolean;
  form: ReturnType<typeof Form.useForm>[0];
  editorTab: string;
  onTabChange: (tab: string) => void;
  onSave: () => void;
  saving: boolean;
  editorEntities: Omit<Parameters<typeof SectionPayloadEditor>[0], "type" | "form" | "tab">;
};

export function SectionEditorPanel({
  editing,
  isNew,
  form,
  editorTab,
  onTabChange,
  onSave,
  saving,
  editorEntities,
}: Props) {
  const type = Form.useWatch("type", form) as SectionType | undefined;
  const meta = type ? metaForType(type) : null;
  const payload = Form.useWatch("payload", form);
  const title = Form.useWatch("title", form);
  const isActive = Form.useWatch("isActive", form);

  const warnings =
    editing || isNew
      ? validateSection({
          type: type ?? editing?.type ?? "",
          title: title ?? editing?.title,
          isActive,
          payload: payload ?? editing?.payload,
        })
      : [];

  if (!editing && !isNew) {
    return (
      <Card className="hb-editor-card hb-editor-empty">
        <div className="hb-editor-empty-visual">
          <div className="hb-editor-empty-phone">
            <div className="hb-editor-empty-phone-bar" />
            <div className="hb-editor-empty-phone-block hero" />
            <div className="hb-editor-empty-phone-block" />
            <div className="hb-editor-empty-phone-block short" />
          </div>
        </div>
        <Title level={5} style={{ marginTop: 16 }}>
          تحرير القسم
        </Title>
        <Text type="secondary">
          اختر قسماً من القائمة أو المعاينة، أو أضف قسماً جديداً من القوالب الجاهزة.
        </Text>
        <ul className="hb-editor-hints">
          <li>الترتيب من الأعلى للأسفل = ترتيب الظهور في التطبيق</li>
          <li>المعاينة على اليمين تعكس التطبيق مباشرة</li>
          <li>التغييرات غير المحفوظة تظهر فوراً في المعاينة</li>
        </ul>
      </Card>
    );
  }

  return (
    <Card
      className="hb-editor-card"
      title={
        <Space>
          <span>{meta?.icon ?? "📦"}</span>
          <span>{isNew ? "قسم جديد" : editing?.title || labelForType(type ?? "")}</span>
          <Tag color="blue">{labelForType(type ?? "")}</Tag>
        </Space>
      }
      extra={
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
          حفظ
        </Button>
      }
    >
      {meta && (
        <Alert type="info" showIcon message={meta.description} style={{ marginBottom: 16 }} />
      )}

      {warnings.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {warnings.map((w, i) => (
            <Alert
              key={i}
              type={w.level === "error" ? "error" : w.level === "warn" ? "warning" : "info"}
              message={w.message}
              showIcon
              style={{ marginBottom: 6 }}
            />
          ))}
        </div>
      )}

      <Form form={form} layout="vertical">
        <div className="hb-editor-basics">
          <Form.Item name="title" label="العنوان في التطبيق" style={{ flex: 2 }}>
            <Input placeholder="مثال: الأكثر مبيعاً" />
          </Form.Item>
          <Form.Item name="subtitle" label="عنوان فرعي" style={{ flex: 2 }}>
            <Input placeholder="اختياري" />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        <Form.Item name="position" label="رقم الترتيب" hidden>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>

        <Tabs
          activeKey={editorTab}
          onChange={onTabChange}
          items={[
            {
              key: "content",
              label: "المحتوى",
              children: type ? (
                <SectionPayloadEditor {...editorEntities} type={type} form={form} tab="content" />
              ) : null,
            },
            {
              key: "layout",
              label: "التخطيط والأحجام",
              children: type ? (
                <SectionLayoutFields
                  type={type}
                  form={form}
                  categories={editorEntities.categories}
                  brands={editorEntities.brands}
                  banners={editorEntities.banners}
                />
              ) : null,
            },
            {
              key: "link",
              label: "الربط",
              children: type ? (
                <SectionPayloadEditor {...editorEntities} type={type} form={form} tab="link" />
              ) : null,
            },
            {
              key: "style",
              label: "التصميم",
              children: (
                <>
                  <Form.Item name={["payload", "headerImageId"]} label="صورة بجانب العنوان">
                    <MediaPicker label="اختيار صورة" />
                  </Form.Item>
                  <Form.Item name={["payload", "backgroundColor"]} label="لون الخلفية">
                    <Input type="color" style={{ width: 72, height: 32, padding: 2 }} />
                  </Form.Item>
                  {type && (
                    <SectionPayloadEditor {...editorEntities} type={type} form={form} tab="style" />
                  )}
                </>
              ),
            },
          ]}
        />
      </Form>
    </Card>
  );
}
