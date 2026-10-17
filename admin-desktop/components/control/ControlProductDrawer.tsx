"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Image,
  Input,
  Popconfirm,
  Segmented,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Upload,
  message,
} from "antd";
import {
  ExpandOutlined,
  MoreOutlined,
  PlusOutlined,
  StarFilled,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { controlApi, type ControlProductDetail, type ControlShade } from "@/lib/controlApi";
import { mediaUrl } from "@/lib/mediaUrl";
import { apiErrorMessage } from "@/lib/apiError";
import { uploadMediaFile } from "@/lib/uploadMedia";

const fmt = (n?: number | null) => (n == null ? "—" : `${Number(n).toLocaleString("en")} د.ع`);

export function shadeSwatch(hex?: string | null, end?: string | null): React.CSSProperties {
  return end
    ? { background: `linear-gradient(135deg, ${hex ?? "#ddd"}, ${end})` }
    : { background: hex ?? "#ddd" };
}

/** تفاصيل منتج للتحكم السريع: الظهور، الصور (ترتيب/حذف/تأطير/رفع)، وتشغيل وإيقاف كل تدرج. */
export function ControlProductDrawer({
  productId,
  highlightShadeId,
  onClose,
  onChanged,
}: {
  productId: string | null;
  highlightShadeId?: string | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const qc = useQueryClient();
  const [p, setP] = useState<ControlProductDetail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [shadeQ, setShadeQ] = useState("");
  const [shadeFilter, setShadeFilter] = useState<"all" | "on" | "off" | "empty">("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["control-product", productId],
    queryFn: () => controlApi.product(productId!),
    enabled: !!productId,
  });
  useEffect(() => setP(data ?? null), [data]);
  useEffect(() => {
    setShadeQ("");
    setShadeFilter("all");
  }, [productId]);

  const run = async (label: string, op: () => Promise<ControlProductDetail>, ok?: string) => {
    setBusy(label);
    try {
      const next = await op();
      setP(next);
      qc.setQueryData(["control-product", productId], next);
      onChanged?.();
      if (ok) message.success(ok);
      return next;
    } catch (e) {
      message.error(apiErrorMessage(e));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const shades = useMemo(() => {
    const q = shadeQ.trim().toLowerCase();
    return (p?.shades ?? []).filter((s) => {
      if (shadeFilter === "on" && !s.isActive) return false;
      if (shadeFilter === "off" && s.isActive) return false;
      if (shadeFilter === "empty" && s.stock > 0) return false;
      return !q || s.name.toLowerCase().includes(q) || (s.barcode ?? "").includes(q);
    });
  }, [p, shadeQ, shadeFilter]);

  const toggleShade = async (s: ControlShade, v: boolean) => {
    setP((cur) => (cur ? { ...cur, shades: cur.shades.map((x) => (x.id === s.id ? { ...x, isActive: v } : x)) } : cur));
    await run(`shade-${s.id}`, () => controlApi.patchShade(s.id, { isActive: v }), v ? `شُغّل «${s.name}»` : `أُوقف «${s.name}»`);
  };

  const edit = async (mediaId: string, mode: "trim" | "trimSquare") => {
    if (!p) return;
    setBusy(`img-${mediaId}`);
    try {
      const r = await controlApi.editImage(mediaId, { mode, padding: mode === "trimSquare" ? 0.06 : undefined, productId: p.id });
      if (r.unchanged || !r.product) {
        message.info("الصورة لا تحتاج تعديلاً");
      } else {
        setP(r.product);
        onChanged?.();
        message.success({
          content: (
            <span>
              تم.{" "}
              <a onClick={() => run("undo", () => controlApi.replaceImage(p.id, r.mediaId, r.previousMediaId), "تم التراجع")}>تراجع</a>
            </span>
          ),
          duration: 6,
        });
      }
    } catch (e) {
      message.error(apiErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const frameAll = async (mode: "trim" | "trimSquare", includeShades = false) => {
    if (!p) return;
    setBusy("frame");
    try {
      const r = await controlApi.frameAll(p.id, { mode, padding: mode === "trimSquare" ? 0.06 : undefined, includeShades });
      setP(r.product);
      onChanged?.();
      message.success(`عُدّلت ${r.changed} · جاهزة مسبقاً ${r.unchanged}${r.failed ? ` · فشل ${r.failed}` : ""}`);
    } catch (e) {
      message.error(apiErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const move = (from: number, to: number) => {
    if (!p) return;
    const ids = p.images.map((i) => i.mediaId);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    void run("order", () => controlApi.setImages(p.id, ids), to === 0 ? "أصبحت صورة الغلاف" : undefined);
  };

  const off = p?.shades.filter((s) => !s.isActive).length ?? 0;

  return (
    <Drawer
      open={!!productId}
      onClose={onClose}
      width={720}
      title={p ? p.name : "المنتج"}
      destroyOnHidden
      extra={
        p ? (
          <Space>
            <a href={`/products/?edit=${p.id}`} target="_blank" rel="noreferrer">
              <Button>التعديل الكامل</Button>
            </a>
          </Space>
        ) : null
      }
    >
      {isLoading && !p ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : error ? (
        <Alert type="error" message={apiErrorMessage(error)} action={<Button onClick={() => refetch()}>إعادة</Button>} />
      ) : p ? (
        <Spin spinning={!!busy && !busy.startsWith("shade-")} tip={busy === "frame" ? "تأطير الصور..." : undefined}>
          <div className={`control-status ${p.isActive ? "on" : "off"}`}>
            <div>
              <div className="control-status-title">{p.isActive ? "ظاهر في التطبيق" : "موقوف — لا يظهر للزبائن"}</div>
              <div className="control-status-sub">
                {p.brand?.name} · {fmt(p.price)} · مخزون {p.stock}
                {p.barcode ? ` · ${p.barcode}` : ""}
                {p.pos ? ` · الكاشير: ${p.pos.stock} قطعة` : ""}
              </div>
            </div>
            <Switch
              checked={p.isActive}
              onChange={(v) => run("active", () => controlApi.patchProduct(p.id, { isActive: v }), v ? "المنتج ظاهر الآن" : "أُوقف المنتج")}
            />
          </div>

          <div className="control-section-head">
            <h3>الصور ({p.images.length})</h3>
            <Space wrap>
              <Dropdown
                menu={{
                  items: [
                    { key: "sq", label: "إطار مربع موحّد لكل الصور" },
                    { key: "trim", label: "قص الحواف الفارغة لكل الصور" },
                    ...(p.shades.some((s) => s.image) ? [{ key: "sqs", label: "مربع موحّد + صور التدرجات" }] : []),
                  ],
                  onClick: ({ key }) => frameAll(key === "trim" ? "trim" : "trimSquare", key === "sqs"),
                }}
              >
                <Button icon={<ThunderboltOutlined />} disabled={!p.images.length}>
                  تأطير الكل
                </Button>
              </Dropdown>
              <Upload
                multiple
                accept="image/*"
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  try {
                    setBusy("upload");
                    const media = await uploadMediaFile(file as File, "PRODUCT");
                    const next = await controlApi.addImages(p.id, [media.id]);
                    setP(next);
                    onChanged?.();
                    onSuccess?.(media);
                    message.success("أُضيفت الصورة");
                  } catch (e) {
                    message.error(apiErrorMessage(e));
                    onError?.(e as Error);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  رفع صور
                </Button>
              </Upload>
            </Space>
          </div>
          {p.images.length === 0 ? (
            <Empty description="لا توجد صور" />
          ) : (
            <Image.PreviewGroup>
              <div className="control-images">
                {p.images.map((img, i) => (
                  <div key={img.mediaId} className={`control-image${i === 0 ? " cover" : ""}`}>
                    <Image src={mediaUrl(img.thumb) ?? undefined} preview={{ src: mediaUrl(img.url ?? img.large) ?? undefined }} alt="" />
                    {i === 0 ? (
                      <Tag color="purple" className="control-image-badge">
                        <StarFilled /> غلاف
                      </Tag>
                    ) : null}
                    <div className="control-image-size">
                      {img.width}×{img.height}
                    </div>
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          ...(i > 0 ? [{ key: "cover", label: "تعيين كغلاف" }] : []),
                          ...(i > 0 ? [{ key: "left", label: "تقديم خطوة" }] : []),
                          ...(i < p.images.length - 1 ? [{ key: "right", label: "تأخير خطوة" }] : []),
                          { key: "trim", label: "قص الحواف تلقائياً" },
                          { key: "square", label: "إطار مربع أبيض" },
                          { type: "divider" as const },
                          { key: "delete", label: "حذف من المنتج", danger: true },
                        ],
                        onClick: ({ key }) => {
                          if (key === "cover") move(i, 0);
                          if (key === "left") move(i, i - 1);
                          if (key === "right") move(i, i + 1);
                          if (key === "trim") void edit(img.mediaId, "trim");
                          if (key === "square") void edit(img.mediaId, "trimSquare");
                          if (key === "delete") {
                            const before = p.images.map((x) => x.mediaId);
                            void run("del", () => controlApi.removeImage(p.id, img.mediaId)).then((r) => {
                              if (r)
                                message.success({
                                  content: (
                                    <span>
                                      حُذفت الصورة.{" "}
                                      <a onClick={() => run("undo", () => controlApi.setImages(p.id, before), "أُعيدت")}>تراجع</a>
                                    </span>
                                  ),
                                  duration: 6,
                                });
                            });
                          }
                        },
                      }}
                    >
                      <Button size="small" shape="circle" icon={<MoreOutlined />} className="control-image-menu" loading={busy === `img-${img.mediaId}`} />
                    </Dropdown>
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          )}

          {p.shades.length > 0 ? (
            <>
              <div className="control-section-head">
                <h3>
                  التدرجات ({p.shades.length}){" "}
                  {off ? <Tag color="red">{off} موقوف</Tag> : <Tag color="green">كلها ظاهرة</Tag>}
                </h3>
                <Space wrap>
                  <Popconfirm title="تشغيل كل التدرجات؟" onConfirm={() => run("bulk", () => controlApi.bulkShades(p.id, true), "شُغّلت كل التدرجات")}>
                    <Button>تشغيل الكل</Button>
                  </Popconfirm>
                  <Popconfirm title="إيقاف كل التدرجات؟" okButtonProps={{ danger: true }} onConfirm={() => run("bulk", () => controlApi.bulkShades(p.id, false), "أُوقفت كل التدرجات")}>
                    <Button danger>إيقاف الكل</Button>
                  </Popconfirm>
                  <Tooltip title="إيقاف كل تدرج مخزونه صفر">
                    <Button
                      onClick={() => {
                        const ids = p.shades.filter((s) => s.isActive && s.stock <= 0).map((s) => s.id);
                        if (!ids.length) return message.info("لا توجد تدرجات نافدة شغّالة");
                        void run("bulk", () => controlApi.bulkShades(p.id, false, ids), `أُوقف ${ids.length} تدرج نافد`);
                      }}
                    >
                      إيقاف النافدة
                    </Button>
                  </Tooltip>
                </Space>
              </div>
              <Space wrap style={{ marginBottom: 10 }}>
                <Input.Search allowClear placeholder="بحث في التدرجات" value={shadeQ} onChange={(e) => setShadeQ(e.target.value)} style={{ width: 240 }} />
                <Segmented
                  value={shadeFilter}
                  onChange={(v) => setShadeFilter(v as typeof shadeFilter)}
                  options={[
                    { value: "all", label: "الكل" },
                    { value: "on", label: "ظاهر" },
                    { value: "off", label: "موقوف" },
                    { value: "empty", label: "نافد" },
                  ]}
                />
              </Space>
              <div className="control-shades">
                {shades.map((s) => (
                  <div key={s.id} className={`control-shade${s.isActive ? "" : " off"}${s.id === highlightShadeId ? " hl" : ""}`}>
                    {s.image ? (
                      <Image className="control-shade-img" src={mediaUrl(s.image.thumb) ?? undefined} preview={{ src: mediaUrl(s.image.url) ?? undefined }} alt="" />
                    ) : (
                      <span className="control-swatch" style={shadeSwatch(s.colorHex, s.colorHexEnd)} />
                    )}
                    <div className="control-shade-text">
                      <strong>{s.name}</strong>
                      <span dir="ltr">{s.barcode ?? "—"}</span>
                    </div>
                    <Tag color={s.stock > 0 ? "green" : "red"}>{s.stock > 0 ? `متوفر ${s.stock}` : "نافد"}</Tag>
                    <Switch checked={s.isActive} loading={busy === `shade-${s.id}`} onChange={(v) => toggleShade(s, v)} />
                  </div>
                ))}
                {!shades.length ? <Empty description="لا توجد تدرجات بهذا الفلتر" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
              </div>
            </>
          ) : null}

          <div className="control-section-head">
            <h3>الشارات</h3>
          </div>
          <Space wrap>
            {(
              [
                ["isNew", "جديد"],
                ["isBestSeller", "الأكثر مبيعاً"],
                ["isFeatured", "مميّز"],
              ] as const
            ).map(([key, label]) => (
              <Tag.CheckableTag
                key={key}
                checked={!!p[key]}
                onChange={(v) => run(key, () => controlApi.patchProduct(p.id, { [key]: v }))}
                style={{ padding: "4px 12px", fontSize: 14, border: "1px solid #e8e0f0" }}
              >
                {label}
              </Tag.CheckableTag>
            ))}
          </Space>
          <div style={{ marginTop: 18, color: "#888", fontSize: 12 }}>
            <ExpandOutlined /> القص اليدوي الدقيق متاح من تطبيق المدير على الهاتف.
          </div>
        </Spin>
      ) : null}
    </Drawer>
  );
}
