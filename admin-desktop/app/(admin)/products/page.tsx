"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ImageItem } from "@/components/ProductImageDropzone";
import {
  initShadePreviews,
  shadeFromApi,
} from "@/components/ProductShadesEditor";
import { buildProductPayload } from "@/lib/productPayload";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

const ProductImageDropzone = dynamic(
  () => import("@/components/ProductImageDropzone").then((m) => ({ default: m.ProductImageDropzone })),
  { ssr: false },
);

const ProductShadesEditor = dynamic(
  () => import("@/components/ProductShadesEditor").then((m) => ({ default: m.ProductShadesEditor })),
  { ssr: false },
);

const SKIN_TYPES = [
  { value: "جافة", label: "جافة" },
  { value: "دهنية", label: "دهنية" },
  { value: "مختلطة", label: "مختلطة" },
  { value: "حساسة", label: "حساسة" },
  { value: "عادية", label: "عادية" },
];

function imagesFromProduct(full: any): ImageItem[] {
  return (full?.images ?? [])
    .map((img: any) => ({
      id: img.mediaId ?? img.media?.id,
      url: mediaThumb(img.media),
    }))
    .filter((i: ImageItem) => i.id);
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>();
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string | undefined>();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  const [shadePreviews, setShadePreviews] = useState<Record<number, ImageItem | null>>({});
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["products", page, search, filterCategoryId, filterSubcategoryId],
    queryFn: () =>
      queries.products({
        page,
        limit: 15,
        search,
        categoryId: filterCategoryId,
        subcategoryId: filterSubcategoryId,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: queries.categories,
  });
  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: queries.brands,
  });

  const remove = useMutation({
    mutationFn: mutations.deleteProduct,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = buildProductPayload(values, productImages);
      if (editing?.id) return mutations.updateProduct(editing.id, payload);
      return mutations.createProduct(payload);
    },
    onSuccess: () => {
      message.success(editing?.id ? "تم تعديل المنتج" : "تم إنشاء المنتج");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  function openCreate() {
    setEditing(null);
    setActiveTab("basic");
    setProductImages([]);
    setShadePreviews({});
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      price: 0,
      stock: 0,
      originalPrice: 0,
      discountPercent: 0,
      pointsEarned: 0,
      rating: 0,
      shades: [],
      variants: [],
      skinType: [],
    });
    setOpen(true);
  }

  async function openEdit(row: any) {
    setEditing(row);
    setActiveTab("basic");
    let full = row;
    try {
      full = (await queries.product(row.id)) ?? row;
    } catch {
      /* use row */
    }
    const imgs = imagesFromProduct(full);
    setProductImages(imgs);
    setShadePreviews(initShadePreviews(full?.shades));
    form.setFieldsValue({
      ...full,
      brandId: full?.brand?.id ?? full?.brandId,
      categoryId: full?.category?.id ?? full?.categoryId,
      subcategoryId: full?.subcategory?.id ?? full?.subcategoryId,
      tags: Array.isArray(full?.tags)
        ? full.tags.join(", ")
        : typeof full?.tags === "string"
          ? (() => {
              try {
                return JSON.parse(full.tags).join(", ");
              } catch {
                return full.tags;
              }
            })()
          : "",
      skinType: Array.isArray(full?.skinType)
        ? full.skinType
        : typeof full?.skinType === "string"
          ? (() => {
              try {
                return JSON.parse(full.skinType);
              } catch {
                return [];
              }
            })()
          : [],
      shades: (full?.shades ?? []).map(shadeFromApi),
      variants: full?.variants ?? [],
    });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setProductImages([]);
      setShadePreviews({});
      form.resetFields();
    }
  }, [open, form]);

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const { data: filterSubcategories } = useQuery({
    queryKey: ["subcategories", filterCategoryId],
    queryFn: () => queries.subcategories({ parentId: filterCategoryId }),
    enabled: !!filterCategoryId,
  });

  const selectedCategoryId = Form.useWatch("categoryId", form);
  const { data: formSubcategories } = useQuery({
    queryKey: ["subcategories", selectedCategoryId],
    queryFn: () => queries.subcategories({ parentId: selectedCategoryId }),
    enabled: !!selectedCategoryId,
  });

  const subcategoryOptions = (formSubcategories ?? []).map((s: any) => ({
    value: s.id,
    label: s.name,
  }));

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>المنتجات</h2>
          <Space wrap>
            <Input.Search
              placeholder="بحث..."
              allowClear
              onSearch={(v) => {
                setPage(1);
                setSearch(v);
              }}
              style={{ width: 220 }}
            />
            <Select
              allowClear
              placeholder="فلترة: الفئة"
              style={{ width: 160 }}
              value={filterCategoryId}
              options={(categoriesData ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
              onChange={(v) => {
                setPage(1);
                setFilterCategoryId(v);
                setFilterSubcategoryId(undefined);
              }}
            />
            <Select
              allowClear
              placeholder="فلترة: القسم"
              style={{ width: 160 }}
              value={filterSubcategoryId}
              disabled={!filterCategoryId}
              options={(filterSubcategories ?? []).map((s: any) => ({
                value: s.id,
                label: s.name,
              }))}
              onChange={(v) => {
                setPage(1);
                setFilterSubcategoryId(v);
              }}
            />
            <Button type="primary" onClick={openCreate}>
              + منتج جديد
            </Button>
          </Space>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={{
              current: page,
              total,
              pageSize: 15,
              onChange: setPage,
            }}
            columns={[
              { title: "SKU", dataIndex: "sku", width: 120 },
              { title: "الاسم", dataIndex: "name" },
              {
                title: "البراند",
                render: (_: any, r: any) => <Tag>{r.brand?.name ?? "-"}</Tag>,
              },
              {
                title: "الفئة",
                render: (_: any, r: any) => <Tag>{r.category?.name ?? "-"}</Tag>,
              },
              {
                title: "القسم الفرعي",
                render: (_: any, r: any) =>
                  r.subcategory?.name ? (
                    <Tag color="blue">{r.subcategory.name}</Tag>
                  ) : (
                    "—"
                  ),
              },
              {
                title: "السعر",
                dataIndex: "price",
                render: (v) => `${v?.toLocaleString()} د.ع`,
              },
              { title: "المخزون", dataIndex: "stock" },
              {
                title: "الألوان",
                render: (_: any, r: any) => r._count?.shades ?? r.shades?.length ?? 0,
                width: 80,
              },
              {
                title: "نشط",
                dataIndex: "isActive",
                render: (v) => <Switch checked={v} disabled size="small" />,
              },
              {
                title: "إجراءات",
                key: "actions",
                width: 180,
                render: (_: any, r: any) => (
                  <Space>
                    <Button size="small" onClick={() => openEdit(r)}>
                      تعديل
                    </Button>
                    <Popconfirm
                      title="حذف المنتج؟"
                      onConfirm={() => remove.mutate(r.id)}
                      okText="حذف"
                      cancelText="إلغاء"
                    >
                      <Button danger size="small">
                        حذف
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <Drawer
        title={editing ? `تعديل: ${editing.name}` : "منتج جديد"}
        open={open}
        onClose={() => setOpen(false)}
        width={860}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="primary" loading={upsert.isPending} onClick={() => form.submit()}>
              حفظ المنتج
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "basic",
                label: "أساسي",
                children: (
                  <>
                    <Form.Item name="name" label="اسم المنتج" rules={[{ required: true }]}>
                      <Input placeholder="كريم مرطب فاخر" />
                    </Form.Item>
                    <Space.Compact block>
                      <Form.Item name="sku" label="SKU" style={{ flex: 1 }}>
                        <Input placeholder="يُولَّد تلقائياً" />
                      </Form.Item>
                      <Form.Item
                        name="slug"
                        label="Slug"
                        style={{ flex: 1, marginInlineStart: 8 }}
                      >
                        <Input placeholder="يُولَّد من الاسم" />
                      </Form.Item>
                    </Space.Compact>
                    <Form.Item name="brandId" label="البراند" rules={[{ required: true }]}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="اختر البراند"
                        options={(brandsData ?? []).map((b: any) => ({
                          value: b.id,
                          label: b.name,
                        }))}
                      />
                    </Form.Item>
                    <Space.Compact block>
                      <Form.Item
                        name="categoryId"
                        label="الفئة"
                        style={{ flex: 1 }}
                        rules={[{ required: true }]}
                      >
                        <Select
                          placeholder="اختر الفئة"
                          options={(categoriesData ?? []).map((c: any) => ({
                            value: c.id,
                            label: c.name,
                          }))}
                          onChange={() => form.setFieldValue("subcategoryId", undefined)}
                        />
                      </Form.Item>
                      {subcategoryOptions.length > 0 && (
                        <Form.Item
                          name="subcategoryId"
                          label="القسم الفرعي"
                          style={{ flex: 1, marginInlineStart: 8 }}
                          rules={[{ required: true, message: "اختر القسم الفرعي" }]}
                        >
                          <Select
                            placeholder="اختر القسم الفرعي"
                            options={subcategoryOptions}
                          />
                        </Form.Item>
                      )}
                    </Space.Compact>
                    <Form.Item name="tags" label="الوسوم (مفصولة بفاصلة)">
                      <Input placeholder="شفاه, مات, فاخر" />
                    </Form.Item>
                    <Form.Item name="skinType" label="نوع البشرة المناسب">
                      <Select mode="multiple" options={SKIN_TYPES} placeholder="اختر..." />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "pricing",
                label: "السعر والمخزون",
                children: (
                  <>
                    <Space.Compact block>
                      <Form.Item
                        name="price"
                        label="السعر (د.ع)"
                        style={{ flex: 1 }}
                        rules={[{ required: true }]}
                      >
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                      <Form.Item
                        name="originalPrice"
                        label="السعر الأصلي"
                        style={{ flex: 1, marginInlineStart: 8 }}
                      >
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Space.Compact>
                    <Space.Compact block>
                      <Form.Item name="discountPercent" label="نسبة الخصم %" style={{ flex: 1 }}>
                        <InputNumber style={{ width: "100%" }} min={0} max={100} />
                      </Form.Item>
                      <Form.Item name="stock" label="المخزون" style={{ flex: 1, marginInlineStart: 8 }} rules={[{ required: true }]}>
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                    </Space.Compact>
                    <Space.Compact block>
                      <Form.Item name="pointsEarned" label="نقاط الولاء" style={{ flex: 1 }}>
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                      <Form.Item name="rating" label="التقييم" style={{ flex: 1, marginInlineStart: 8 }}>
                        <InputNumber style={{ width: "100%" }} min={0} max={5} step={0.1} />
                      </Form.Item>
                    </Space.Compact>
                  </>
                ),
              },
              {
                key: "content",
                label: "الوصف والمواد",
                children: (
                  <>
                    <Form.Item name="description" label="وصف المنتج">
                      <Input.TextArea rows={5} placeholder="وصف تفصيلي يظهر في صفحة المنتج..." />
                    </Form.Item>
                    <Form.Item name="ingredients" label="المكونات / المواد">
                      <Input.TextArea
                        rows={4}
                        placeholder="Aqua, Glycerin, Niacinamide..."
                      />
                    </Form.Item>
                    <Form.Item name="howToUse" label="طريقة الاستخدام">
                      <Input.TextArea
                        rows={4}
                        placeholder="1. نظّفي البشرة&#10;2. ضعي كمية مناسبة..."
                      />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "images",
                label: `الصور (${productImages.length})`,
                children: (
                  <ProductImageDropzone
                    items={productImages}
                    onChange={setProductImages}
                    purpose="PRODUCT"
                    max={12}
                  />
                ),
              },
              {
                key: "shades",
                label: "الألوان",
                children: (
                  <Form.List name="shades">
                    {(fields, { add, remove }) => (
                      <ProductShadesEditor
                        fields={fields}
                        add={add}
                        remove={remove}
                        form={form}
                        shadePreviews={shadePreviews}
                        setShadePreviews={setShadePreviews}
                      />
                    )}
                  </Form.List>
                ),
              },
              {
                key: "variants",
                label: "المقاسات",
                children: (
                  <Form.List name="variants">
                    {(fields, { add, remove: rm }) => (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <strong>المقاسات / المتغيرات</strong>
                          <Button size="small" type="dashed" onClick={() => add()}>
                            + متغير
                          </Button>
                        </div>
                        {fields.map((f) => (
                          <Space key={f.key} wrap style={{ display: "flex", marginBottom: 8 }}>
                            <Form.Item
                              {...f}
                              name={[f.name, "label"]}
                              label="التسمية"
                              rules={[{ required: true }]}
                            >
                              <Input placeholder="30ml" style={{ width: 120 }} />
                            </Form.Item>
                            <Form.Item {...f} name={[f.name, "sizeLabel"]} label="المقاس">
                              <Input placeholder="30 مل" style={{ width: 100 }} />
                            </Form.Item>
                            <Form.Item {...f} name={[f.name, "priceDelta"]} label="فرق السعر">
                              <InputNumber placeholder="0" />
                            </Form.Item>
                            <Form.Item {...f} name={[f.name, "stock"]} label="مخزون">
                              <InputNumber min={0} placeholder="0" />
                            </Form.Item>
                            <Button danger type="text" onClick={() => rm(f.name)}>
                              حذف
                            </Button>
                          </Space>
                        ))}
                      </div>
                    )}
                  </Form.List>
                ),
              },
              {
                key: "flags",
                label: "الإعدادات",
                children: (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Form.Item name="isFeatured" label="منتج مميز" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="isNew" label="منتج جديد" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="isBestSeller" label="الأكثر مبيعاً" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="isPromo" label="عرض ترويجي" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="isBogo" label="اشتري واحصل على واحد (BOGO)" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Divider />
                    <Form.Item name="isActive" label="نشط ومتاح للبيع" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Space>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>
    
    </>
  );
}
