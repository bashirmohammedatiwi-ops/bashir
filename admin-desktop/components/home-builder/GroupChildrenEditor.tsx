"use client";

import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { BUILDER_SECTION_TYPES, SectionType, normalizePayload } from "./section-types";
import { GroupChildMiniEditor } from "./GroupChildMiniEditor";

const { Text } = Typography;

const GROUP_CHILD_TYPES = BUILDER_SECTION_TYPES.filter(
  (t) => t.value !== "SECTION_GROUP" && t.value !== "HERO_BANNER",
);

const QUICK_CHILD_PRESETS: {
  label: string;
  type: SectionType;
  title?: string;
  payload?: Record<string, unknown>;
}[] = [
  { label: "سلايدر منتجات", type: "PRODUCT_LIST", title: "منتجات مختارة", payload: { filter: "featured", limit: 8 } },
  { label: "عروض", type: "FLASH_SALE", title: "أقوى العروض", payload: { filter: "promo", limit: 8 } },
  { label: "شريط ترويج", type: "PROMO_STRIP", payload: { text: "عرض خاص — اضغط للتفاصيل", linkType: "offers" } },
  { label: "براندات", type: "FEATURED_BRANDS", title: "براندات مميزة" },
  { label: "مشاكل البشرة", type: "SKIN_CONCERNS", title: "تسوق حسب مشكلتك" },
  { label: "معرض صور", type: "PHOTO_WALL", title: "اكتشفي المزيد", payload: { display: "scroll", aspectRatio: "4:3", items: [] } },
  { label: "Bento", type: "IMAGE_COLLAGE", title: "عروض", payload: { display: "bento", columns: 4, items: [] } },
];

type Props = {
  entities: Parameters<typeof GroupChildMiniEditor>[0]["entities"];
};

export function GroupChildrenEditor({ entities }: Props) {
  const form = Form.useFormInstance();

  return (
    <div className="hb-group-children">
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        أضف أقساماً داخل الإطار — كل قسم فرعي يُعرض داخل الخلفية الملونة في التطبيق.
      </Text>

      <Space wrap size={[6, 6]} style={{ marginBottom: 14 }}>
        {QUICK_CHILD_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size="small"
            className="hb-quick-link-btn"
            onClick={() => {
              const children = (form.getFieldValue(["payload", "children"]) as unknown[]) ?? [];
              const def = GROUP_CHILD_TYPES.find((t) => t.value === preset.type);
              form.setFieldValue(["payload", "children"], [
                ...children,
                {
                  type: preset.type,
                  title: preset.title ?? "",
                  payload: normalizePayload(preset.type, { ...def?.defaultPayload, ...preset.payload }),
                },
              ]);
            }}
          >
            + {preset.label}
          </Button>
        ))}
      </Space>

      <Form.List name={["payload", "children"]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => {
              const childType = form.getFieldValue(["payload", "children", name, "type"]) as SectionType | undefined;
              const meta = GROUP_CHILD_TYPES.find((t) => t.value === childType);
              return (
                <Card
                  key={key}
                  size="small"
                  className="hb-group-child-card"
                  title={
                    <Space>
                      <span>{meta?.icon ?? "📦"}</span>
                      <span>{meta?.label ?? "قسم فرعي"}</span>
                    </Space>
                  }
                  extra={
                    <Button danger type="link" icon={<DeleteOutlined />} onClick={() => remove(name)}>
                      حذف
                    </Button>
                  }
                >
                  <Form.Item {...rest} name={[name, "type"]} label="نوع القسم" rules={[{ required: true }]}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={GROUP_CHILD_TYPES.map((t) => ({
                        value: t.value,
                        label: `${t.icon} ${t.label}`,
                      }))}
                      onChange={(v: SectionType) => {
                        const def = GROUP_CHILD_TYPES.find((t) => t.value === v);
                        if (def) {
                          form.setFieldValue(
                            ["payload", "children", name, "payload"],
                            { ...def.defaultPayload },
                          );
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "title"]} label="عنوان (اختياري)">
                    <Input placeholder="يظهر داخل الإطار" />
                  </Form.Item>
                  {childType ? (
                    <Collapse
                      size="small"
                      ghost
                      items={[
                        {
                          key: "cfg",
                          label: "إعدادات القسم الفرعي",
                          children: (
                            <GroupChildMiniEditor
                              type={childType}
                              listIndex={name}
                              entities={entities}
                            />
                          ),
                        },
                      ]}
                    />
                  ) : null}
                </Card>
              );
            })}
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() =>
                add({
                  type: "PRODUCT_LIST",
                  title: "",
                  payload: normalizePayload("PRODUCT_LIST", {}),
                })
              }
            >
              + قسم فرعي
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
}
