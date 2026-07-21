"use client";

import { Button, Card, Col, Collapse, Form, Input, InputNumber, Row, Select, Switch } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { MediaPicker } from "@/components/MediaPicker";
import { LinkTargetPicker } from "./LinkTargetPicker";
import {
  IMAGE_ASPECT_OPTIONS,
  IMAGE_BORDER_OPTIONS,
  IMAGE_OVERLAY_OPTIONS,
  IMAGE_SHAPE_OPTIONS,
  IMAGE_SIZE_OPTIONS,
} from "./image-section-options";
import { ShapePreviewChip } from "./ShapePreviewChip";
import type { EditorEntities } from "./SectionPayloadEditor";

type Props = {
  listName: (string | number)[];
  fieldName: number;
  fieldKey: number;
  restField: Record<string, unknown>;
  entities: EditorEntities;
  itemLabel?: string;
  /** مستوى التفاصيل */
  mode?: "basic" | "rich" | "collage";
  onRemove?: () => void;
  defaultExpanded?: boolean;
};

function itemPrefix(listName: (string | number)[], fieldName: number) {
  return [...listName, fieldName];
}

export function TileItemEditor({
  listName,
  fieldName,
  fieldKey,
  restField,
  entities,
  itemLabel = "صورة",
  mode = "rich",
  onRemove,
  defaultExpanded = false,
}: Props) {
  const prefix = itemPrefix(listName, fieldName);
  const entityLists = {
    products: entities.products ?? [],
    categories: entities.categories ?? [],
    subcategories: entities.subcategories ?? [],
    tertiary: entities.tertiary ?? [],
    brands: entities.brands ?? [],
    packages: entities.packages ?? [],
    skinConcerns: entities.skinConcerns ?? [],
  };

  const title = (
    <span>
      {itemLabel} {fieldName + 1}
    </span>
  );

  const body = (
    <>
      <Form.Item {...restField} name={[fieldName, "imageId"]} label="الصورة">
        <MediaPicker label="اختر صورة" />
      </Form.Item>

      <Row gutter={12}>
        <Col xs={24} sm={12}>
          <Form.Item {...restField} name={[fieldName, "title"]} label="عنوان على الصورة">
            <Input placeholder="اختياري" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item {...restField} name={[fieldName, "subtitle"]} label="نص فرعي">
            <Input placeholder="اختياري" />
          </Form.Item>
        </Col>
      </Row>

      {(mode === "rich" || mode === "collage") && (
        <Form.Item {...restField} name={[fieldName, "badge"]} label="شارة / تسمية صغيرة">
          <Input placeholder="مثال: جديد · -30%" />
        </Form.Item>
      )}

      <Collapse
        size="small"
        ghost
        defaultActiveKey={defaultExpanded ? ["design", "link"] : []}
        items={[
          {
            key: "design",
            label: "🎨 الشكل والنسبة",
            children: (
              <>
                <Row gutter={12}>
                  <Col xs={24} sm={8}>
                    <Form.Item {...restField} name={[fieldName, "shape"]} label="الشكل">
                      <Select
                        allowClear
                        placeholder="افتراضي القسم"
                        options={IMAGE_SHAPE_OPTIONS.map((o) => ({
                          value: o.value,
                          label: `${o.preview} ${o.label}`,
                        }))}
                      />
                    </Form.Item>
                    <ShapePreviewChip name={[...prefix, "shape"]} />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item {...restField} name={[fieldName, "aspectRatio"]} label="نسبة العرض">
                      <Select
                        allowClear
                        placeholder="افتراضي القسم"
                        options={IMAGE_ASPECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item {...restField} name={[fieldName, "size"]} label="الحجم">
                      <Select
                        allowClear
                        placeholder="افتراضي"
                        options={IMAGE_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) =>
                    getFieldValue([...prefix, "aspectRatio"]) === "custom" ? (
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[fieldName, "customWidth"]} label="عرض (px)">
                            <InputNumber min={40} max={800} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[fieldName, "customHeight"]} label="ارتفاع (px)">
                            <InputNumber min={40} max={800} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    ) : null
                  }
                </Form.Item>
                {mode === "collage" && (
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item {...restField} name={[fieldName, "spanCols"]} label="امتداد أعمدة (bento)">
                        <InputNumber min={1} max={4} style={{ width: "100%" }} placeholder="1" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item {...restField} name={[fieldName, "spanRows"]} label="امتداد صفوف">
                        <InputNumber min={1} max={3} style={{ width: "100%" }} placeholder="1" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item {...restField} name={[fieldName, "overlayStyle"]} label="طبقة النص">
                      <Select allowClear placeholder="افتراضي القسم" options={[...IMAGE_OVERLAY_OPTIONS]} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item {...restField} name={[fieldName, "borderStyle"]} label="إطار الصورة">
                      <Select allowClear placeholder="بدون" options={[...IMAGE_BORDER_OPTIONS]} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item {...restField} name={[fieldName, "showShadow"]} label="ظل" valuePropName="checked">
                  <Switch checkedChildren="نعم" unCheckedChildren="لا" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "link",
            label: "🔗 الربط",
            children: (
              <LinkTargetPicker prefix={prefix} entities={entityLists} optional showLegacyLink />
            ),
          },
        ]}
      />
    </>
  );

  if (mode === "basic") {
    return (
      <Card
        key={fieldKey}
        size="small"
        title={title}
        style={{ marginBottom: 10 }}
        extra={
          onRemove ? (
            <Button danger type="link" icon={<MinusCircleOutlined />} onClick={onRemove}>
              حذف
            </Button>
          ) : null
        }
      >
        {body}
      </Card>
    );
  }

  return (
    <Card
      key={fieldKey}
      size="small"
      className="hb-tile-item-card"
      title={title}
      style={{ marginBottom: 12 }}
      extra={
        onRemove ? (
          <Button danger type="link" icon={<MinusCircleOutlined />} onClick={onRemove}>
            حذف
          </Button>
        ) : null
      }
    >
      {body}
    </Card>
  );
}

/** قائمة صور موحّدة لكل أقسام الصور */
export function TileItemsList({
  entities,
  itemLabel = "صورة",
  mode = "rich" as "basic" | "rich" | "collage",
  addLabel = "+ صورة",
  emptyItem = {},
}: {
  entities: EditorEntities;
  itemLabel?: string;
  mode?: "basic" | "rich" | "collage";
  addLabel?: string;
  emptyItem?: Record<string, unknown>;
}) {
  return (
    <Form.List name={["payload", "items"]}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <TileItemEditor
              key={key}
              listName={["payload", "items"]}
              fieldName={name}
              fieldKey={key}
              restField={restField}
              entities={entities}
              itemLabel={itemLabel}
              mode={mode}
              onRemove={() => remove(name)}
            />
          ))}
          <Button type="dashed" onClick={() => add(emptyItem)} block icon={<PlusOutlined />}>
            {addLabel}
          </Button>
        </>
      )}
    </Form.List>
  );
}
