"use client";

import {
  Alert,
  Button,
  Form,
  Input,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { SectionPayloadEditor } from "./SectionPayloadEditor";
import { SectionType, labelForType, metaForType } from "./section-types";
import { MediaPicker } from "@/components/MediaPicker";

const { Text, Title } = Typography;

type Props = {
  editing: any | null;
  isNew: boolean;
  form: ReturnType<typeof Form.useForm>[0];
  editorTab: string;
  onTabChange: (tab: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  editorEntities: Omit<Parameters<typeof SectionPayloadEditor>[0], "type" | "form" | "tab">;
};

export function SectionInspector({
  editing,
  isNew,
  form,
  editorTab,
  onTabChange,
  onSave,
  onClose,
  saving,
  editorEntities,
}: Props) {
  const type = Form.useWatch("type", form) as SectionType | undefined;
  const meta = type ? metaForType(type) : null;

  if (!editing && !isNew) {
    return (
      <div className="hb-inspector-empty">
        <div className="hb-inspector-empty-icon">✨</div>
        <Title level={5}>محرّر الأقسام</Title>
        <Text type="secondary">
          اختر قسماً من القائمة أو أضف قسماً جديداً لتحرير المحتوى والصور والروابط
        </Text>
      </div>
    );
  }

  return (
    <div className="hb-inspector">
      <div className="hb-inspector-head">
        <div>
          <Space size={6}>
            <span className="hb-inspector-icon">{meta?.icon ?? "📦"}</span>
            <div>
              <Text strong>{isNew ? "قسم جديد" : editing?.title || labelForType(type ?? "")}</Text>
              <br />
              <Tag color="magenta" style={{ marginTop: 2 }}>
                {labelForType(type ?? "")}
              </Tag>
            </div>
          </Space>
        </div>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
            حفظ
          </Button>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </Space>
      </div>

      {meta && (
        <Alert type="info" showIcon message={meta.description} style={{ margin: "12px 12px 0" }} />
      )}

      <Form form={form} layout="vertical" className="hb-inspector-form">
        <Tabs
          activeKey={editorTab}
          onChange={onTabChange}
          className="hb-inspector-tabs"
          items={[
            {
              key: "content",
              label: "📝 المحتوى",
              children: (
                <div className="hb-inspector-body">
                  <Form.Item name="title" label="العنوان في التطبيق">
                    <Input placeholder="الأكثر مبيعاً" size="large" />
                  </Form.Item>
                  <Form.Item name="subtitle" label="عنوان فرعي">
                    <Input placeholder="نص صغير تحت العنوان" />
                  </Form.Item>
                  <div className="hb-inspector-row">
                    <Form.Item name="position" label="الترتيب" style={{ flex: 1 }}>
                      <Input type="number" />
                    </Form.Item>
                    <Form.Item name="isActive" label="نشط" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="type" hidden>
                    <Input />
                  </Form.Item>
                  {type && (
                    <SectionPayloadEditor
                      {...editorEntities}
                      type={type}
                      form={form}
                      tab="content"
                    />
                  )}
                </div>
              ),
            },
            {
              key: "link",
              label: "🔗 الربط",
              children: (
                <div className="hb-inspector-body">
                  {type ? (
                    <SectionPayloadEditor {...editorEntities} type={type} form={form} tab="link" />
                  ) : null}
                </div>
              ),
            },
            {
              key: "style",
              label: "🎨 التصميم",
              children: (
                <div className="hb-inspector-body">
                  <Form.Item name={["payload", "headerImageId"]} label="صورة بجانب العنوان">
                    <MediaPicker label="رفع / اختيار صورة" />
                  </Form.Item>
                  {type && (
                    <SectionPayloadEditor {...editorEntities} type={type} form={form} tab="style" />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Form>
    </div>
  );
}
