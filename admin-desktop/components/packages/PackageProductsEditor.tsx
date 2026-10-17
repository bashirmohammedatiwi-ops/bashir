"use client";

import { AutoComplete, Button, Input, InputNumber, Space, Table, Tag, message } from "antd";
import { STEP_TITLES } from "@/lib/beauty";
import { useCallback, useState } from "react";
import { ProductThumb } from "@/components/ProductThumb";
import { normalizeBarcodeInput } from "@/lib/inventorySync";
import {
  type ResolvedPackageProduct,
  resolveProductByBarcode,
} from "@/lib/resolveProductByBarcode";

type PackageProductsEditorProps = {
  products: ResolvedPackageProduct[];
  onChange: (products: ResolvedPackageProduct[]) => void;
  ordered?: boolean;
  title?: string;
  emptyText?: string;
  scopeLabel?: string;
  /** أعمدة الخطوة (الاسم والملاحظة) والكمية. */
  withSteps?: boolean;
  withQuantity?: boolean;
};

export function PackageProductsEditor({
  products,
  onChange,
  ordered = false,
  title = "منتجات الباقة (بالباركود)",
  emptyText = "لم تُضف منتجات بعد — استخدم الباركود",
  scopeLabel = "الباقة",
  withSteps = false,
  withQuantity = false,
}: PackageProductsEditorProps) {
  const patch = (id: string, change: Partial<ResolvedPackageProduct>) =>
    onChange(products.map((p) => (p.id === id ? { ...p, ...change } : p)));
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);

  const move = useCallback(
    (index: number, dir: -1 | 1) => {
      const next = [...products];
      const target = index + dir;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    },
    [onChange, products],
  );

  const addByBarcode = useCallback(async () => {
    const code = normalizeBarcodeInput(barcode);
    if (!code) {
      message.warning("أدخل الباركود");
      return;
    }

    if (products.some((p) => normalizeBarcodeInput(p.barcode ?? "") === code)) {
      message.warning(`هذا المنتج مضاف مسبقاً ل${scopeLabel}`);
      return;
    }

    setLoading(true);
    try {
      const result = await resolveProductByBarcode(code);
      if (!result.ok) {
        message.warning(result.reason);
        return;
      }

      if (products.some((p) => p.id === result.product.id)) {
        message.warning(`هذا المنتج مضاف مسبقاً ل${scopeLabel}`);
        return;
      }

      onChange([...products, result.product]);
      setBarcode("");
      message.success(`تمت إضافة: ${result.product.name}`);
    } finally {
      setLoading(false);
    }
  }, [barcode, onChange, products, scopeLabel]);

  return (
    <div className="alhayaa-package-products">
      <div className="alhayaa-package-products-head">
        <div>
          <div className="alhayaa-package-products-title">{title}</div>
          {ordered ? (
            <div className="alhayaa-package-products-sub">
              ترتيب الخطوات مهم — أضف المنتجات بالتسلسل (1، 2، 3...)
            </div>
          ) : null}
        </div>
        <Tag color="purple">{products.length} منتج</Tag>
      </div>

      <Space.Compact block className="alhayaa-package-products-scan">
        <Input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="امسح أو اكتب الباركود..."
          onPressEnter={() => void addByBarcode()}
          disabled={loading}
          autoComplete="off"
        />
        <Button type="primary" onClick={() => void addByBarcode()} loading={loading}>
          إضافة
        </Button>
      </Space.Compact>

      <Table
        size="small"
        rowKey="id"
        pagination={false}
        locale={{ emptyText }}
        dataSource={products}
        columns={[
          ...(ordered
            ? [
                {
                  title: "الخطوة",
                  width: 64,
                  render: (_: unknown, __: ResolvedPackageProduct, index: number) => (
                    <Tag color="geekblue">{index + 1}</Tag>
                  ),
                },
              ]
            : []),
          {
            title: "",
            width: 52,
            render: (_: unknown, row: ResolvedPackageProduct) => (
              <ProductThumb product={row.product ?? row} size={40} />
            ),
          },
          {
            title: "المنتج",
            render: (_: unknown, row: ResolvedPackageProduct) => (
              <div>
                <div style={{ fontWeight: 500 }}>{row.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {row.sku ? `SKU: ${row.sku}` : null}
                  {row.barcode ? ` · ${row.barcode}` : null}
                </div>
              </div>
            ),
          },
          ...(withSteps
            ? [
                {
                  title: "اسم الخطوة / ملاحظة الاستخدام",
                  width: 260,
                  render: (_: unknown, row: ResolvedPackageProduct) => (
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <AutoComplete
                        size="small"
                        value={row.stepTitle ?? ""}
                        options={STEP_TITLES.map((t) => ({ value: t }))}
                        placeholder="غسول، سيروم، مرطب…"
                        onChange={(v) => patch(row.id, { stepTitle: v })}
                        filterOption={(input, o) => String(o?.value ?? "").includes(input)}
                        style={{ width: "100%" }}
                      />
                      <Input
                        size="small"
                        value={row.note ?? ""}
                        placeholder="مثال: على بشرة رطبة، قطرتين"
                        onChange={(e) => patch(row.id, { note: e.target.value })}
                      />
                    </Space>
                  ),
                },
              ]
            : []),
          ...(withQuantity
            ? [
                {
                  title: "الكمية",
                  width: 76,
                  render: (_: unknown, row: ResolvedPackageProduct) => (
                    <InputNumber
                      size="small"
                      min={1}
                      max={10}
                      value={row.quantity ?? 1}
                      onChange={(v) => patch(row.id, { quantity: Number(v) || 1 })}
                      style={{ width: 60 }}
                    />
                  ),
                },
              ]
            : []),
          {
            title: "البراند",
            width: 96,
            render: (_: unknown, row: ResolvedPackageProduct) =>
              row.brandName ? <Tag>{row.brandName}</Tag> : "—",
          },
          {
            title: "السعر",
            width: 96,
            render: (_: unknown, row: ResolvedPackageProduct) =>
              row.price != null ? `${row.price.toLocaleString()} د.ع` : "—",
          },
          {
            title: "المخزون",
            width: 70,
            dataIndex: "stock",
            render: (v: number | undefined) => (v != null ? v : "—"),
          },
          {
            title: "",
            width: ordered ? 120 : 72,
            render: (_: unknown, row: ResolvedPackageProduct, index: number) => (
              <Space size={0}>
                {ordered ? (
                  <>
                    <Button
                      type="text"
                      size="small"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      disabled={index === products.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </Button>
                  </>
                ) : null}
                <Button
                  size="small"
                  danger
                  type="link"
                  onClick={() => onChange(products.filter((p) => p.id !== row.id))}
                >
                  حذف
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
