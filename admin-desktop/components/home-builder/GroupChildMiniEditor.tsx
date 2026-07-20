"use client";

import { Button, Form, Input, InputNumber, Select } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { MediaPicker } from "@/components/MediaPicker";
import { EntityMultiPicker } from "./EntityMultiPicker";
import { LinkTargetPicker } from "./LinkTargetPicker";
import { PRODUCT_FILTERS, SectionType } from "./section-types";
import type { EditorEntities } from "./SectionPayloadEditor";

type Props = {
  type: SectionType;
  listIndex: number;
  entities: EditorEntities;
};

function p(listIndex: number, ...fields: (string | number)[]) {
  return ["payload", "children", listIndex, "payload", ...fields];
}

function itemPrefix(listIndex: number, itemIndex: number) {
  return ["payload", "children", listIndex, "payload", "items", itemIndex];
}

export function GroupChildMiniEditor({ type, listIndex, entities }: Props) {
  const entityLists = {
    products: entities.products ?? [],
    categories: entities.categories ?? [],
    subcategories: entities.subcategories ?? [],
    tertiary: entities.tertiary ?? [],
    brands: entities.brands ?? [],
    packages: entities.packages ?? [],
    skinConcerns: entities.skinConcerns ?? [],
  };

  switch (type) {
    case "PRODUCT_LIST":
    case "FLASH_SALE":
      return (
        <>
          <Form.Item name={p(listIndex, "filter")} label="فلتر">
            <Select options={PRODUCT_FILTERS} />
          </Form.Item>
          <Form.Item name={p(listIndex, "limit")} label="عدد المنتجات">
            <InputNumber min={2} max={24} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );
    case "PROMO_STRIP":
      return (
        <>
          <Form.Item name={p(listIndex, "text")} label="النص">
            <Input.TextArea rows={2} />
          </Form.Item>
          <LinkTargetPicker
            prefix={["payload", "children", listIndex, "payload"]}
            entities={entityLists}
            optional={false}
          />
        </>
      );
    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return (
        <Form.Item name={p(listIndex, "brandIds")} label="البراندات">
          <EntityMultiPicker items={entities.brands ?? []} placeholder="كل البراندات المميزة" />
        </Form.Item>
      );
    case "SKIN_CONCERNS":
      return (
        <>
          <Form.Item name={p(listIndex, "concernIds")} label="المشاكل">
            <EntityMultiPicker items={entities.skinConcerns ?? []} />
          </Form.Item>
          <Form.Item name={p(listIndex, "display")} label="العرض">
            <Select
              options={[
                { value: "chips", label: "شرائح" },
                { value: "circles", label: "دوائر" },
              ]}
            />
          </Form.Item>
        </>
      );
    case "PACKAGES":
      return (
        <Form.Item name={p(listIndex, "packageIds")} label="الباقات">
          <EntityMultiPicker items={entities.packages ?? []} />
        </Form.Item>
      );
    case "MEDIA_GALLERY":
    case "IMAGE_MARQUEE":
    case "IMAGE_TILES":
    case "CIRCLE_TILES":
      return (
        <>
          {type === "MEDIA_GALLERY" && (
            <>
              <Form.Item name={p(listIndex, "display")} label="الحركة">
                <Select
                  options={[
                    { value: "scroll", label: "تمرير يدوي" },
                    { value: "marquee", label: "متحرك تلقائياً" },
                    { value: "grid", label: "شبكة ثابتة" },
                    { value: "stack", label: "عمود كامل" },
                  ]}
                />
              </Form.Item>
              <Form.Item name={p(listIndex, "shape")} label="الشكل">
                <Select
                  options={[
                    { value: "rect", label: "مستطيل" },
                    { value: "rounded", label: "زوايا ناعمة" },
                    { value: "circle", label: "دائرة" },
                    { value: "pill", label: "كapsule" },
                    { value: "banner", label: "بانر عريض" },
                  ]}
                />
              </Form.Item>
            </>
          )}
          <Form.List name={p(listIndex, "items")}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} className="hb-mini-item-row">
                    <Form.Item
                      {...rest}
                      name={[name, "imageId"]}
                      label={`صورة ${name + 1}`}
                      rules={[{ required: true }]}
                    >
                      <MediaPicker label="اختر صورة" />
                    </Form.Item>
                    <LinkTargetPicker prefix={itemPrefix(listIndex, name)} entities={entityLists} />
                    <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                      حذف
                    </Button>
                  </div>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>
                  + صورة
                </Button>
              </>
            )}
          </Form.List>
        </>
      );
    default:
      return (
        <Form.Item name={p(listIndex, "limit")} label="حد العناصر">
          <InputNumber min={1} max={20} style={{ width: "100%" }} />
        </Form.Item>
      );
  }
}
