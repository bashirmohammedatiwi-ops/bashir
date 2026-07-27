"use client";

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Collapse, Form, Input, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { BulkMediaPicker } from "./BulkMediaPicker";
import { PhotoItemStyleFields } from "./PhotoItemStyleFields";
import { CascadingLinkPicker } from "./CascadingLinkPicker";
import { buildAppLinkPath, linkTargetLabel, summarizeItemLinks } from "./link-target";
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

function itemLinkSummary(
  item: Record<string, unknown> | undefined,
  lists: ReturnType<typeof entityLists>,
) {
  const linkType = item?.linkType as string | undefined;
  const linkValue = item?.linkValue as string | undefined;
  const legacyLink = item?.link as string | undefined;
  if (!linkType && !legacyLink) return null;
  return {
    label: linkTargetLabel(linkType, linkValue, lists),
    path: buildAppLinkPath(linkType, linkValue, legacyLink),
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
        message={collage ? "فسيفساء Bento" : "معرض صور متقدم"}
        description="اختر الصورة ثم حدّد نوع الربط (قسم، منتج، براند...) واختر الهدف من القائمة. الشكل الافتراضي من تبويب «التصميم»."
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
              {fields.map(({ key, name, ...restField }, index) => {
                const item = items[index] as Record<string, unknown> | undefined;
                const link = itemLinkSummary(item, lists);

                return (
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
                      <Form.Item
                        {...restField}
                        name={[name, "imageId"]}
                        rules={[{ required: true, message: "اختر صورة" }]}
                      >
                        <MediaPicker label="صورة" />
                      </Form.Item>
                    </div>

                    <div className="hb-photo-wall-row-meta">
                      <div className="hb-photo-wall-link-block">
                        <div className="hb-photo-wall-link-head">
                          <LinkOutlined />
                          <span>عند الضغط</span>
                          {link ? (
                            <Tag color="blue" className="hb-photo-wall-link-tag">
                              {link.label}
                            </Tag>
                          ) : (
                            <Tag>بدون رابط</Tag>
                          )}
                        </div>
                        <CascadingLinkPicker
                          prefix={["payload", "items", name]}
                          entities={lists}
                        />
                        {link?.path ? (
                          <Typography.Text type="secondary" dir="ltr" className="hb-photo-wall-link-path">
                            {link.path}
                          </Typography.Text>
                        ) : null}
                      </div>

                      <Collapse
                        size="small"
                        ghost
                        className="hb-photo-wall-more"
                        items={[
                          {
                            key: "more",
                            label: "خيارات إضافية (عنوان / مظهر)",
                            children: (
                              <>
                                <Form.Item {...restField} name={[name, "title"]} label="عنوان (اختياري)">
                                  <Input placeholder="يظهر أسفل الصورة" allowClear />
                                </Form.Item>
                                <PhotoItemStyleFields
                                  prefix={["payload", "items", name]}
                                  collage={collage}
                                />
                              </>
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
                );
              })}
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
