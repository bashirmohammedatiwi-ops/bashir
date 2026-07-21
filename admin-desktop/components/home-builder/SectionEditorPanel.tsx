"use client";

import {
  Alert,
  Button,
  Card,
  Divider,
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
import { SectionLinksEditor } from "./SectionLinksEditor";
import { SectionJsonTab } from "./SectionJsonTab";
import { SectionType, labelForType, metaForType } from "./section-types";
import { validateSection } from "./section-validation";
import { FrameStyleFields, MediaGalleryStyleFields, PhotoWallStyleFields } from "./FrameStyleFields";
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
        <div className="hb-editor-empty-visual hb-editor-empty-studio">
          <div className="hb-empty-frame-demo">
            <span className="hb-empty-frame-label">🖼️ إطار مجموعة</span>
          </div>
          <div className="hb-empty-media-demo">
            <span>🎞️</span>
            <span>📋</span>
            <span>⚡</span>
          </div>
        </div>
        <Title level={4} style={{ marginTop: 20 }}>
          اختر قسماً أو أضف جديداً
        </Title>
        <Text type="secondary">
          زر «إضافة قسم» → اختر قالباً سريعاً → عدّل المحتوى والربط في تبويب واحد → احفظ
        </Text>
        <ul className="hb-editor-hints">
          <li>① العنوان والحالة · ② المحتوى والروابط · ③ التصميم</li>
          <li>إطار مجموعة: عدة أقسام داخل خلفية ملونة</li>
          <li>⌘S حفظ · ↑↓ التنقل · اسحب للترتيب</li>
        </ul>
      </Card>
    );
  }

  return (
    <Card
      className="hb-editor-card"
      title={
        <Space wrap>
          <span>{meta?.icon ?? "📦"}</span>
          <span>{isNew ? "قسم جديد" : editing?.title || labelForType(type ?? "")}</span>
          <Tag color="blue">{labelForType(type ?? "")}</Tag>
          {isNew && <Tag color="orange">غير محفوظ</Tag>}
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
        <Form.Item name="position" label="رقم الترتيب" hidden>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>

        <Tabs
          activeKey={editorTab}
          onChange={onTabChange}
          destroyInactiveTabPane
          className="hb-editor-tabs"
          items={[
            {
              key: "basics",
              label: "① أساسيات",
              children: (
                <div className="hb-editor-basics-panel">
                  <Form.Item name="title" label="العنوان في التطبيق">
                    <Input placeholder="مثال: الأكثر مبيعاً" size="large" />
                  </Form.Item>
                  <Form.Item name="subtitle" label="عنوان فرعي">
                    <Input placeholder="اختياري — يظهر تحت العنوان" />
                  </Form.Item>
                  <Form.Item name="isActive" label="حالة القسم" valuePropName="checked">
                    <Switch checkedChildren="نشط" unCheckedChildren="مخفي" />
                  </Form.Item>
                  {type && (
                    <Alert
                      type="success"
                      showIcon={false}
                      message={
                        <Space>
                          <span>{meta?.icon}</span>
                          <Text strong>{labelForType(type)}</Text>
                          <Text type="secondary">— {meta?.group}</Text>
                        </Space>
                      }
                    />
                  )}
                </div>
              ),
            },
            {
              key: "setup",
              label: "② المحتوى والربط",
              children: type ? (
                <div className="hb-editor-setup-panel">
                  <SectionPayloadEditor {...editorEntities} type={type} form={form} tab="content" />
                  <Divider plain className="hb-setup-divider">
                    الربط والوجهات
                  </Divider>
                  <SectionLinksEditor type={type} form={form} {...editorEntities} />
                </div>
              ) : null,
            },
            {
              key: "design",
              label: "③ التصميم",
              children: type ? (
                <>
                  {type === "SECTION_GROUP" && (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        message="إطار المجموعة"
                        description="اللون، الحواف، والظل — يظهر حول كل الأقسام الفرعية في التطبيق"
                        style={{ marginBottom: 16 }}
                      />
                      <FrameStyleFields />
                      <Divider plain style={{ margin: "20px 0 12px" }}>
                        تخطيط الأقسام الفرعية
                      </Divider>
                    </>
                  )}
                  {type === "MEDIA_GALLERY" && (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        message="شكل المعرض"
                        description="طريقة العرض، الحجم، والحركة — الصور من تبويب المحتوى"
                        style={{ marginBottom: 16 }}
                      />
                      <MediaGalleryStyleFields />
                      <Divider plain style={{ margin: "20px 0 12px" }}>
                        مظهر القسم
                      </Divider>
                    </>
                  )}
                  {type === "PHOTO_WALL" && (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        message="معرض صور متقدم"
                        description="9+ أشكال · 11 نسبة · carousel · bento · overlay · ظل"
                        style={{ marginBottom: 16 }}
                      />
                      <PhotoWallStyleFields />
                      <Divider plain style={{ margin: "20px 0 12px" }}>
                        مظهر القسم
                      </Divider>
                    </>
                  )}
                  {type === "IMAGE_COLLAGE" && (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        message="شبكة Bento"
                        description="بلاطات بامتداد أعمدة/صفوف مختلف — من تبويب المحتوى"
                        style={{ marginBottom: 16 }}
                      />
                      <PhotoWallStyleFields collage />
                      <Divider plain style={{ margin: "20px 0 12px" }}>
                        مظهر القسم
                      </Divider>
                    </>
                  )}
                  <SectionLayoutFields
                    type={type}
                    form={form}
                    categories={editorEntities.categories}
                    brands={editorEntities.brands}
                    banners={editorEntities.banners}
                  />
                  {type !== "SECTION_GROUP" && (
                    <>
                      <Divider plain style={{ margin: "20px 0 12px" }}>
                        ألوان وصور القسم
                      </Divider>
                      <Form.Item
                        name={["payload", "headerImageId"]}
                        label="صورة بجانب العنوان"
                        tooltip="تظهر بجانب عنوان القسم في التطبيق"
                      >
                        <MediaPicker label="اختيار صورة" />
                      </Form.Item>
                      <Form.Item name={["payload", "backgroundColor"]} label="لون خلفية القسم">
                        <Input type="color" style={{ width: 72, height: 32, padding: 2 }} />
                      </Form.Item>
                    </>
                  )}
                  <SectionPayloadEditor {...editorEntities} type={type} form={form} tab="style" />
                </>
              ) : null,
            },
            {
              key: "json",
              label: "JSON",
              children: type ? <SectionJsonTab type={type} form={form} /> : null,
            },
          ]}
        />
      </Form>
    </Card>
  );
}
