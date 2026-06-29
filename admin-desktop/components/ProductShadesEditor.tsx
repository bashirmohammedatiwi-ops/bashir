"use client";
import { Button, Form, Input, Radio, Space } from "antd";
import type { FormListFieldData } from "antd/es/form";
import {
  ProductImageDropzone,
  shadeSwatchStyle,
  type ImageItem,
} from "@/components/ProductImageDropzone";
import { mediaThumb } from "@/lib/mediaUrl";
import { normalizeBarcode } from "@/lib/barcode";

type Props = {
  fields: FormListFieldData[];
  add: (initial?: Record<string, unknown>) => void;
  remove: (index: number) => void;
  form: ReturnType<typeof Form.useForm>[0];
  shadePreviews: Record<number, ImageItem | null>;
  setShadePreviews: React.Dispatch<React.SetStateAction<Record<number, ImageItem | null>>>;
  onShadeBarcodeLookup?: (shadeIndex: number, barcode: string) => void;
  shadeSyncLoading?: Record<number, boolean>;
};

export function ProductShadesEditor({
  fields,
  add,
  remove,
  form,
  shadePreviews,
  setShadePreviews,
  onShadeBarcodeLookup,
  shadeSyncLoading = {},
}: Props) {
  const shadesWatch = Form.useWatch("shades", form) ?? [];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div>
          <strong>درجات اللون</strong>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            لون صلب أو تدرج — صورة وباركود لكل درجة
          </div>
        </div>
        <Button
          size="small"
          type="dashed"
          onClick={() =>
            add({
              name: "",
              colorHex: "#E91E63",
              colorHexEnd: undefined,
              isGradient: false,
              barcode: "",
              imageId: undefined,
              price: undefined,
              originalPrice: 0,
              discountPercent: 0,
              stock: 0,
            })
          }
        >
          + درجة لون
        </Button>
      </div>

      {fields.length === 0 && (
        <div
          style={{
            padding: 16,
            textAlign: "center",
            color: "#999",
            border: "1px dashed #ddd",
            borderRadius: 8,
          }}
        >
          لا توجد درجات — أضف لوناً إن كان المنتج يحتوي ألواناً (مكياج، طلاء...)
        </div>
      )}

      {fields.map((field) => {
        const shade = shadesWatch[field.name] ?? {};
        const isGradient = shade.isGradient === true;
        const preview = shadePreviews[field.name];

        return (
          <div
            key={field.key}
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
              background: "#fafafa",
            }}
          >
            <Space align="start" wrap style={{ width: "100%" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  flexShrink: 0,
                  ...shadeSwatchStyle(shade.colorHex, isGradient ? shade.colorHexEnd : null),
                }}
              />

              <div style={{ flex: 1, minWidth: 220 }}>
                <Form.Item
                  {...field}
                  name={[field.name, "name"]}
                  label="اسم اللون"
                  rules={[{ required: true, message: "أدخل اسم اللون" }]}
                  style={{ marginBottom: 8 }}
                >
                  <Input placeholder="Ruby Red" />
                </Form.Item>

                <Form.Item
                  {...field}
                  name={[field.name, "isGradient"]}
                  label="نوع اللون"
                  style={{ marginBottom: 8 }}
                >
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                      { value: false, label: "لون واحد" },
                      { value: true, label: "تدرج" },
                    ]}
                  />
                </Form.Item>

                <Space wrap align="end">
                  <Form.Item
                    {...field}
                    name={[field.name, "colorHex"]}
                    label="اللون"
                    rules={[{ required: true }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="#E91E63"
                      style={{ width: 110 }}
                      addonBefore={
                        <input
                          type="color"
                          value={shade.colorHex || "#E91E63"}
                          onChange={(e) =>
                            form.setFieldValue(["shades", field.name, "colorHex"], e.target.value)
                          }
                          style={{ width: 28, height: 24, border: "none", padding: 0, cursor: "pointer" }}
                        />
                      }
                    />
                  </Form.Item>
                  {isGradient && (
                    <Form.Item
                      {...field}
                      name={[field.name, "colorHexEnd"]}
                      label="نهاية التدرج"
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="#FF5722"
                        style={{ width: 110 }}
                        addonBefore={
                          <input
                            type="color"
                            value={shade.colorHexEnd || "#FF5722"}
                            onChange={(e) =>
                              form.setFieldValue(
                                ["shades", field.name, "colorHexEnd"],
                                e.target.value,
                              )
                            }
                            style={{ width: 28, height: 24, border: "none", padding: 0, cursor: "pointer" }}
                          />
                        }
                      />
                    </Form.Item>
                  )}
                </Space>

                <Form.Item
                  {...field}
                  name={[field.name, "barcode"]}
                  label="الباركود"
                  style={{ marginTop: 8, marginBottom: 0 }}
                >
                  <Input.Search
                    className="alhayaa-ltr-input"
                    placeholder="AV_018_2025"
                    style={{ maxWidth: 320 }}
                    loading={shadeSyncLoading[field.name] === true}
                    enterButton="جلب"
                    onSearch={(v) => onShadeBarcodeLookup?.(field.name, v)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v) onShadeBarcodeLookup?.(field.name, v);
                    }}
                  />
                </Form.Item>

                {(shade.price != null || (shade.stock ?? 0) > 0) && (
                  <div className="alhayaa-shade-sync-grid">
                    <div>
                      <span>السعر</span>
                      <strong>{Number(shade.price ?? 0).toLocaleString("ar-IQ")} د.ع</strong>
                    </div>
                    <div>
                      <span>الأصلي</span>
                      <strong>{Number(shade.originalPrice ?? 0).toLocaleString("ar-IQ")} د.ع</strong>
                    </div>
                    <div>
                      <span>الخصم</span>
                      <strong>{Number(shade.discountPercent ?? 0)}%</strong>
                    </div>
                    <div>
                      <span>المخزون</span>
                      <strong>{Number(shade.stock ?? 0)}</strong>
                    </div>
                  </div>
                )}

                <Form.Item {...field} name={[field.name, "price"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item {...field} name={[field.name, "originalPrice"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item {...field} name={[field.name, "discountPercent"]} hidden>
                  <Input />
                </Form.Item>
                <Form.Item {...field} name={[field.name, "stock"]} hidden>
                  <Input />
                </Form.Item>
              </div>

              <div style={{ width: 160 }}>
                <div style={{ fontSize: 12, marginBottom: 4, color: "#666" }}>صورة اللون</div>
                <ProductImageDropzone
                  compact
                  max={1}
                  purpose="PRODUCT"
                  items={preview ? [preview] : []}
                  onChange={(imgs) => {
                    const id = imgs[0]?.id;
                    form.setFieldValue(["shades", field.name, "imageId"], id ?? undefined);
                    setShadePreviews((p) => ({
                      ...p,
                      [field.name]: imgs[0] ?? null,
                    }));
                  }}
                />
                <Form.Item {...field} name={[field.name, "imageId"]} hidden>
                  <Input />
                </Form.Item>
              </div>

              <Button
                danger
                type="text"
                onClick={() => {
                  setShadePreviews((p) => {
                    const next = { ...p };
                    delete next[field.name];
                    return next;
                  });
                  remove(field.name);
                }}
              >
                حذف
              </Button>
            </Space>
          </div>
        );
      })}
    </div>
  );
}

export function initShadePreviews(
  shades: any[] | undefined,
): Record<number, ImageItem | null> {
  const map: Record<number, ImageItem | null> = {};
  (shades ?? []).forEach((s, i) => {
    if (s?.imageId) {
      map[i] = {
        id: s.imageId,
        url: mediaThumb(s.image),
      };
    }
  });
  return map;
}

export function shadeFromApi(s: any) {
  return {
    name: s.name,
    colorHex: s.colorHex,
    colorHexEnd: s.colorHexEnd ?? undefined,
    isGradient: Boolean(s.colorHexEnd),
    barcode: s.barcode ?? "",
    imageId: s.imageId ?? undefined,
    price: s.price ?? undefined,
    originalPrice: s.originalPrice ?? 0,
    discountPercent: s.discountPercent ?? 0,
    stock: s.stock ?? 0,
  };
}

export function shadeToPayload(s: any, index: number) {
  if (!s?.name || !s?.colorHex) return null;
  return {
    name: s.name,
    colorHex: s.colorHex,
    colorHexEnd: s.isGradient && s.colorHexEnd ? s.colorHexEnd : undefined,
    barcode: typeof s.barcode === "string" ? normalizeBarcode(s.barcode) || undefined : undefined,
    imageId: s.imageId || undefined,
    price: s.price != null ? Number(s.price) : undefined,
    originalPrice: Number(s.originalPrice ?? 0),
    discountPercent: Number(s.discountPercent ?? 0),
    stock: Number(s.stock ?? 0),
    position: index,
  };
}
