"use client";

import { Button, Card, Form, Select, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { MediaPicker } from "@/components/MediaPicker";
import { CardSizePicker } from "./CardSizePicker";
import { LinkTargetPicker } from "./LinkTargetPicker";
import { buildCategoryCatalog, catalogSelectOptions } from "./category-catalog";

const { Text } = Typography;

type Category = { id: string; name?: string; slug?: string; parentName?: string };

type Props = {
  categories: Category[];
  subcategories?: Category[];
  tertiary?: Category[];
  entities: Parameters<typeof LinkTargetPicker>[0]["entities"];
  selectedIds?: string[];
};

export function CategoryItemsEditor({
  categories,
  subcategories = [],
  tertiary = [],
  entities,
  selectedIds = [],
}: Props) {
  const catalog = buildCategoryCatalog(categories, subcategories, tertiary);
  const groupedOptions = catalogSelectOptions(catalog);

  return (
    <>
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        خصّص صورة وحجم وربط لكل قسم. اترك الصورة فارغة لاستخدام صورة القسم من الكتالوج.
      </Text>
      <Form.List name={["payload", "categoryItems"]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Card
                key={key}
                size="small"
                title={`تخصيص قسم ${name + 1}`}
                style={{ marginBottom: 10 }}
                extra={
                  <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                    حذف
                  </Button>
                }
              >
                <Form.Item
                  {...rest}
                  name={[name, "categoryId"]}
                  label="القسم"
                  rules={[{ required: true, message: "اختر قسماً" }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={groupedOptions}
                    placeholder="رئيسي / فرعي / ثانوي..."
                  />
                </Form.Item>
                <Form.Item {...rest} name={[name, "imageId"]} label="صورة مخصصة (اختياري)">
                  <MediaPicker label="ارفع أو اختر صورة بأي مقاس" />
                </Form.Item>
                <Form.Item {...rest} name={[name, "cardSize"]} label="حجم العرض" initialValue="md">
                  <CardSizePicker context="category" compact />
                </Form.Item>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  رابط مخصص (اختياري)
                </Text>
                <LinkTargetPicker
                  prefix={["payload", "categoryItems", name]}
                  entities={entities}
                  optional
                />
              </Card>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={() =>
                add({
                  categoryId: selectedIds[0],
                  cardSize: "md",
                  linkType: undefined,
                  linkValue: undefined,
                })
              }
            >
              إضافة تخصيص (صورة / حجم / رابط)
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}
