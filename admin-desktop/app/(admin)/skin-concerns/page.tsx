"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MediaPicker } from "@/components/MediaPicker";
import { PackageProductsEditor } from "@/components/packages/PackageProductsEditor";
import { HomeShowcasePanel } from "@/components/showcase/HomeShowcasePanel";
import { WorldSlugsSelect } from "@/components/WorldSlugsSelect";
import { SKIN_TYPES, skinTypeLabel } from "@/lib/beauty";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";
import {
  type ResolvedPackageProduct,
  packageProductFromItem,
} from "@/lib/resolveProductByBarcode";
import { slugify } from "@/lib/slugify";

const COLORS = ["#E8577E", "#B65FCF", "#3BA6A0", "#E8A13A", "#5B7FDB", "#D1495B", "#7A9E3B", "#8C6A5D"];

/** قائمة نصوص: كل سطر عنصر. */
const LinesField = ({ value, onChange, placeholder }: { value?: string[]; onChange?: (v: string[]) => void; placeholder?: string }) => (
  <Input.TextArea
    rows={4}
    value={(value ?? []).join("\n")}
    onChange={(e) => onChange?.(e.target.value.split("\n"))}
    placeholder={placeholder}
  />
);

const cleanLines = (v?: string[]) => (v ?? []).map((x) => x.trim()).filter(Boolean);

export default function SkinConcernsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [products, setProducts] = useState<ResolvedPackageProduct[]>([]);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["skin-concerns-admin"],
    queryFn: () => queries.skinConcerns(true),
  });
  const { data: packages } = useQuery({ queryKey: ["packages"], queryFn: queries.packages });
  const { data: worlds } = useQuery({ queryKey: ["worlds-manage"], queryFn: queries.worldsManage });
  const worldName = (slug: string) => ((worlds as any[]) ?? []).find((w) => w.slug === slug)?.nameAr ?? slug;

  // منتجات المشكلة الحالية (للتعديل بالباركود).
  const linked = useQuery({
    queryKey: ["skin-concern-products", editing?.id],
    queryFn: () => queries.skinConcernProducts(editing!.id),
    enabled: open && !!editing?.id,
    staleTime: 0,
  });
  useEffect(() => {
    if (!open) return;
    if (!editing?.id) {
      setProducts([]);
      return;
    }
    if (linked.data) {
      setProducts(
        ((linked.data as any[]) ?? [])
          .map((p) => packageProductFromItem({ productId: p.id, product: p }))
          .filter(Boolean) as ResolvedPackageProduct[],
      );
    }
  }, [open, editing?.id, linked.data]);

  const routinesFor = (slug: string) =>
    ((packages as any[]) ?? []).filter((p) => (p.concernSlugs ?? []).includes(slug)).length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["skin-concerns-admin"] });
    qc.invalidateQueries({ queryKey: ["skin-concerns"] });
    qc.invalidateQueries({ queryKey: ["showcase"] });
  };

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const color = values.color;
      const payload = {
        ...values,
        color: typeof color === "string" ? color : color?.toHexString?.() ?? null,
        slug: values.slug?.trim() || slugify(values.name, "concern"),
        causes: cleanLines(values.causes),
        tips: cleanLines(values.tips),
        ingredients: cleanLines(values.ingredients),
        avoid: cleanLines(values.avoid),
        // لا نلمس المنتجات قبل أن تُحمَّل القائمة الحالية.
        ...(editing?.id && !linked.data ? {} : { productIds: products.map((p) => p.id) }),
      };
      return editing?.id ? mutations.updateSkinConcern(editing.id, payload) : mutations.createSkinConcern(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      invalidate();
      qc.invalidateQueries({ queryKey: ["skin-concern-products"] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? "تعذر حفظ القسم"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteSkinConcern,
    onSuccess: () => {
      message.success("تم الحذف");
      invalidate();
    },
  });

  const openEdit = (r: any | null) => {
    setEditing(r);
    form.resetFields();
    form.setFieldsValue(
      r
        ? {
            name: r.name,
            slug: r.slug,
            subtitle: r.subtitle,
            description: r.description,
            icon: r.icon,
            color: r.color ?? undefined,
            imageId: r.imageId,
            position: r.position,
            isActive: r.isActive,
            worldSlugs: r.worldSlugs ?? [],
            skinTypes: r.skinTypes ?? [],
            causes: r.causes ?? [],
            tips: r.tips ?? [],
            ingredients: r.ingredients ?? [],
            avoid: r.avoid ?? [],
          }
        : { isActive: true, position: (data as any[])?.length ?? 0, worldSlugs: [], skinTypes: [] },
    );
    setOpen(true);
  };

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <PageHeader
          title="دليل البشرة"
          subtitle="مشاكل البشرة (حب شباب، تصبغات، جفاف…) — لكل مشكلة صفحة دليل في التطبيق: الأسباب، النصائح، المكونات، المنتجات والروتينات المناسبة، واختبار البشرة"
          extra={
            <Button type="primary" onClick={() => openEdit(null)}>
              + مشكلة جديدة
            </Button>
          }
        />
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={(data as any[]) ?? []}
            pagination={false}
            columns={[
              {
                title: "",
                width: 64,
                render: (_: any, r: any) => {
                  const url = mediaThumb(r.image);
                  return (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: url ? `center/cover url(${url})` : r.color ?? "#f3eefc",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 22,
                      }}
                    >
                      {url ? null : r.icon}
                    </div>
                  );
                },
              },
              {
                title: "المشكلة",
                render: (_: any, r: any) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {r.color ? <span className="alhayaa-concern-swatch" style={{ background: r.color, marginInlineEnd: 6 }} /> : null}
                      {r.icon} {r.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>{r.subtitle || r.slug}</div>
                  </div>
                ),
              },
              {
                title: "محتوى الدليل",
                render: (_: any, r: any) => {
                  const n = (r.causes?.length ?? 0) + (r.tips?.length ?? 0) + (r.ingredients?.length ?? 0) + (r.avoid?.length ?? 0);
                  return n ? (
                    <Space size={[4, 4]} wrap>
                      {r.tips?.length ? <Tag>{r.tips.length} نصيحة</Tag> : null}
                      {r.ingredients?.length ? <Tag>{r.ingredients.length} مكوّن</Tag> : null}
                      {r.causes?.length ? <Tag>{r.causes.length} سبب</Tag> : null}
                    </Space>
                  ) : (
                    <Tag color="orange">بلا محتوى بعد</Tag>
                  );
                },
              },
              {
                title: "المنتجات",
                dataIndex: "productCount",
                width: 90,
                render: (v) => <Tag color={v ? "purple" : "orange"}>{v ?? 0}</Tag>,
              },
              {
                title: "روتينات/باقات",
                width: 110,
                render: (_: any, r: any) => routinesFor(r.slug) || "—",
              },
              {
                title: "العوالم",
                render: (_: any, r: any) =>
                  r.worldSlugs?.length ? r.worldSlugs.map((w: string) => <Tag key={w}>{worldName(w)}</Tag>) : <Tag color="blue">كل العوالم</Tag>,
              },
              { title: "الترتيب", dataIndex: "position", width: 70 },
              {
                title: "نشط",
                dataIndex: "isActive",
                width: 80,
                render: (v) => <Tag color={v ? "green" : "red"}>{v ? "نشط" : "موقوف"}</Tag>,
              },
              {
                title: "",
                width: 150,
                render: (_: any, r: any) => (
                  <Space>
                    <Button size="small" onClick={() => openEdit(r)}>
                      تعديل
                    </Button>
                    <Popconfirm title="حذف المشكلة؟" okText="حذف" cancelText="إلغاء" onConfirm={() => remove.mutate(r.id)}>
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

        <HomeShowcasePanel kind="skinGuide" label="دليل البشرة" />
      </Space>

      <Modal
        title={editing ? `تعديل: ${editing.name}` : "مشكلة بشرة جديدة"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
        width={920}
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Tabs
            items={[
              {
                key: "basic",
                label: "الأساسي",
                forceRender: true,
                children: (
                  <div className="alhayaa-package-form-grid">
                    <div>
                      <Form.Item name="imageId" label="الصورة (تظهر كبيرة في البطاقة والصفحة)">
                        <MediaPicker label="اختاري صورة المشكلة" />
                      </Form.Item>
                      <Form.Item name="color" label="لون البطاقة" extra="يُستخدم إن لم توجد صورة، وللتدرّج فوقها">
                        <ColorPicker presets={[{ label: "مقترحة", colors: COLORS }]} showText format="hex" />
                      </Form.Item>
                    </div>
                    <div>
                      <Space.Compact block>
                        <Form.Item name="name" label="الاسم" rules={[{ required: true, message: "الاسم مطلوب" }]} style={{ flex: 3 }}>
                          <Input placeholder="حب الشباب" />
                        </Form.Item>
                        <Form.Item name="icon" label="أيقونة" style={{ flex: 1, marginInlineStart: 8 }}>
                          <Input placeholder="🔴" />
                        </Form.Item>
                      </Space.Compact>
                      <Form.Item name="subtitle" label="سطر قصير تحت الاسم">
                        <Input placeholder="بثور والتهابات ومسام مسدودة" />
                      </Form.Item>
                      <Form.Item name="description" label="نبذة (أعلى صفحة الدليل)">
                        <Input.TextArea rows={3} placeholder="ما هي المشكلة ولماذا تظهر، بأسلوب بسيط ودافئ" />
                      </Form.Item>
                      <Form.Item name="worldSlugs" label="العوالم" extra="فارغ = تظهر في كل العوالم">
                        <WorldSlugsSelect />
                      </Form.Item>
                      <Space.Compact block>
                        <Form.Item name="slug" label="Slug" style={{ flex: 2 }}>
                          <Input placeholder="acne" />
                        </Form.Item>
                        <Form.Item name="position" label="الترتيب" style={{ flex: 1, marginInlineStart: 8 }}>
                          <InputNumber style={{ width: "100%" }} min={0} />
                        </Form.Item>
                        <Form.Item name="isActive" label="نشط" valuePropName="checked" style={{ flex: 1, marginInlineStart: 8 }}>
                          <Switch />
                        </Form.Item>
                      </Space.Compact>
                    </div>
                  </div>
                ),
              },
              {
                key: "guide",
                label: "محتوى الدليل",
                forceRender: true,
                children: (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message="كل سطر = عنصر مستقل في التطبيق. المكونات تصبح أزراراً تبحث عن منتجاتها مباشرة."
                    />
                    <div className="alhayaa-package-form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <Form.Item name="tips" label="💡 نصائح">
                        <LinesField placeholder={"اغسلي وجهك مرتين يومياً بغسول لطيف\nلا تعصري الحبوب\nغيّري غطاء الوسادة كل أسبوع"} />
                      </Form.Item>
                      <Form.Item name="causes" label="🔍 الأسباب">
                        <LinesField placeholder={"زيادة إفراز الدهون\nتغيّرات هرمونية\nمكياج يسد المسام"} />
                      </Form.Item>
                      <Form.Item name="ingredients" label="✅ مكونات تبحثين عنها">
                        <LinesField placeholder={"حمض الساليسيليك\nنياسيناميد\nزيت شجرة الشاي"} />
                      </Form.Item>
                      <Form.Item name="avoid" label="⛔ تجنّبي">
                        <LinesField placeholder={"الكريمات الثقيلة الزيتية\nالتقشير القاسي اليومي"} />
                      </Form.Item>
                    </div>
                    <Form.Item
                      name="skinTypes"
                      label="أنواع البشرة الأكثر عرضة لها"
                      extra="تُستخدم في اختبار البشرة لاقتراح هذه المشكلة"
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        options={SKIN_TYPES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
                        tagRender={(p) => <Tag closable={p.closable} onClose={p.onClose}>{skinTypeLabel(String(p.value))}</Tag>}
                      />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "products",
                label: `المنتجات (${products.length})`,
                forceRender: true,
                children: (
                  <Spin spinning={!!editing?.id && linked.isLoading}>
                    <PackageProductsEditor
                      products={products}
                      onChange={setProducts}
                      title="منتجات تعالج هذه المشكلة (بالباركود)"
                      emptyText="امسحي باركود المنتجات المناسبة — تظهر في صفحة المشكلة وفي «تسوقي حسب مشكلتك»"
                      scopeLabel="هذه المشكلة"
                    />
                  </Spin>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </>
  );
}
