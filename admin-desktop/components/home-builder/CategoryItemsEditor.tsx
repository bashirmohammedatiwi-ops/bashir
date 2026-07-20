"use client";

import { Button, Form, Select, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { LinkTargetPicker } from "./LinkTargetPicker";

const { Text } = Typography;

type Category = { id: string; name?: string; slug?: string };

type Props = {
  categories: Category[];
  entities: Parameters<typeof LinkTargetPicker>[0]["entities"];
  /** categoryIds from payload — used to suggest rows */
  selectedIds?: string[];
};

export function CategoryItemsEditor({ categories, entities, selectedIds = [] }: Props) {
  const options = categories.map((c) => ({
    value: c.id,
    label: c.name ?? c.slug ?? c.id,
  }));

  return (
    <>
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        تجاوز رابط فئة محددة — افتراضياً كل فئة تفتح منتجاتها. اترك فارغاً لاستخدام الافتراضي.
      </Text>
      <Form.List name={["payload", "categoryItems"]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <div key={key} className="hb-category-item-row">
                <Form.Item
                  {...rest}
                  name={[name, "categoryId"]}
                  label="الفئة"
                  rules={[{ required: true, message: "اختر فئة" }]}
                  style={{ flex: 1, marginBottom: 8 }}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={options}
                    placeholder="اختر فئة..."
                  />
                </Form.Item>
                <div className="hb-category-item-link">
                  <LinkTargetPicker
                    prefix={["payload", "categoryItems", name]}
                    entities={entities}
                    optional
                  />
                </div>
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => remove(name)}
                  className="hb-category-item-remove"
                />
              </div>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={() => add({ categoryId: selectedIds[0], linkType: undefined, linkValue: undefined })}
            >
              إضافة تجاوز رابط
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}
