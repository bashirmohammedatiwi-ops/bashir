"use client";

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Collapse, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { BulkMediaPicker } from "./BulkMediaPicker";
import { PhotoItemStyleFields } from "./PhotoItemStyleFields";
import { SmartLinkPicker } from "./SmartLinkPicker";
import { summarizeItemLinks } from "./link-target";
import type { EditorEntities } from "./SectionPayloadEditor";

type Props = {
  entities: EditorEntities;
  collage?: boolean;
};

function entityLists(entities: EditorEntities) {
  return {
    products: entities.products ?? [],
    categories: entities.categories ?? [],
    subcategories: entities.subcategories ?? [],
    tertiary: entities.tertiary ?? [],
    brands: entities.brands ?? [],
    packages: entities.packages ?? [],
    skinConcerns: entities.skinConcerns ?? [],
  };
}

export function PhotoWallItemsEditor({ entities, collage = false }: Props) {
  const form = Form.useFormInstance();
  const [bulkOpen, setBulkOpen] = useState(false);
  const lists = entityLists(entities);
  const items = (Form.useWatch(["payload", "items"], form) ?? []) as Record<string, unknown>[];
  const stats = summarizeItemLinks(items);

  const moveItem = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    const list = [...((form.getFieldValue(["payload", "items"]) as unknown[]) ?? [])];
    if (to < 0 || to >= list.length) return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    form.setFieldValue(["payload", "items"], list);
  };

  const addMany = (imageIds: string[]) => {
    const list = [...((form.getFieldValue(["payload", "items"]) as unknown[]) ?? [])];
    for (const imageId of imageIds) {
      list.push({ imageId });
    }
    form.setFieldValue(["payload", "items"], list);
  };

  return (
    <div className="hb-photo-wall-items">
      <Alert
        type="info"
        showIcon
        message={collage ? "فسيفساء Bento — رتّب الصور واربط كل واحدة" : "معرض صور متقدم — بسيط وسريع"}
        description="الشكل والحجم والإطار الافتراضي من تبويب «التصميم». يمكن تخصيص أي صورة من «مظهر هذه الصورة»."
        style={{ marginBottom: 12 }}
      />

      <div className="hb-photo-wall-stats">
        <Typography.Text type="secondary">
          {items.length} صورة · {stats.linked}/{stats.total || 0} مربوطة
        </Typography.Text>
      </div>

      <Form.List name={["payload", "items"]}>
        {(fields, { add, remove }) => (
          <>
            <div className="hb-photo-wall-rows">
              {fields.map(({ key, name, ...restField }, index) => (
                <div key={key} className="hb-photo-wall-row">
                  <Space direction="vertical" size={2} className="hb-photo-wall-row-order">
                    <Button
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      onClick={() => moveItem(name, -1)}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 11, textAlign: "center" }}>
                      {index + 1}
                    </Typography.Text>
                    <Button
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={index === fields.length - 1}
                      onClick={() => moveItem(name, 1)}
                    />
                  </Space>

                  <div className="hb-photo-wall-row-image">
                    <Form.Item {...restField} name={[name, "imageId"]} rules={[{ required: true, message: "اختر صورة" }]}>
                      <MediaPicker label="صورة" />
                    </Form.Item>
                  </div>

                  <div className="hb-photo-wall-row-meta">
                    <Form.Item {...restField} name={[name, "title"]} label="عنوان (اختياري)">
                      <Input placeholder="يظهر أسفل الصورة" allowClear />
                    </Form.Item>
                    <Form.Item label="الربط" style={{ marginBottom: 8 }}>
                      <SmartLinkPicker
                        prefix={["payload", "items", name]}
                        entities={lists}
                        compact
                        showQuickBar={false}
                        showPreview={false}
                      />
                    </Form.Item>
                    <Collapse
                      size="small"
                      ghost
                      items={[
                        {
                          key: "style",
                          label: "🎨 مظهر هذه الصورة (اختياري)",
                          children: (
                            <PhotoItemStyleFields
                              prefix={["payload", "items", name]}
                              collage={collage}
                            />
                          ),
                        },
                      ]}
                    />
                  </div>

                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    className="hb-photo-wall-row-delete"
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
            </div>

            <Space wrap style={{ marginTop: 12 }}>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({})}>
                + صورة واحدة
              </Button>
              <Button type="primary" ghost onClick={() => setBulkOpen(true)}>
                + إضافة عدة صور
              </Button>
            </Space>
          </>
        )}
      </Form.List>

      <BulkMediaPicker open={bulkOpen} onClose={() => setBulkOpen(false)} onSelect={addMany} />
    </div>
  );
}
