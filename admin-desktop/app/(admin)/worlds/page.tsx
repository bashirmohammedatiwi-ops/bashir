"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, ColorPicker, Input, InputNumber, Space, Switch, Typography, message } from "antd";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BulkMediaPicker } from "@/components/home-builder/BulkMediaPicker";
import { PageHeader } from "@/components/PageHeader";
import { mediaThumb, type MediaRecord } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

type SubCategory = { id: string; name?: string; nameAr?: string };
type RootCategory = {
  id: string;
  name?: string;
  nameAr?: string;
  parentId?: string | null;
  children?: SubCategory[];
};
type BannerRow = { id: string; title?: string; worldId?: string | null };

type GalleryRow = {
  mediaId?: string;
  position?: number;
  media?: MediaRecord | null;
};

type GalleryDraft = { mediaId: string; url?: string };

type WorldRow = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  taglineAr?: string | null;
  taglineEn?: string | null;
  accentColor: string;
  canvasColor: string;
  inkColor: string;
  surfaceColor: string;
  isActive: boolean;
  position?: number;
  categories?: { categoryId: string; category?: { id: string; name?: string; nameAr?: string } }[];
  gallery?: GalleryRow[];
  budgetTiers?: BudgetTier[] | null;
};

type BudgetTier = { min?: number | null; max?: number | null };

/** النطاقات الافتراضية (تظهر في التطبيق إن لم تُحدَّد للعالم). */
const DEFAULT_BUDGET: BudgetTier[] = [
  { min: null, max: 10000 },
  { min: 10000, max: 25000 },
  { min: 25000, max: 50000 },
  { min: 50000, max: null },
];

function budgetFromWorld(world: WorldRow): BudgetTier[] {
  const list = Array.isArray(world.budgetTiers) && world.budgetTiers.length ? world.budgetTiers : DEFAULT_BUDGET;
  return [0, 1, 2, 3].map((i) => ({ min: list[i]?.min ?? null, max: list[i]?.max ?? null }));
}

const fmtIqd = (n: number) => n.toLocaleString("en-US");

/** كيف تظهر البطاقة في التطبيق. */
function budgetPreview(t: BudgetTier, last: boolean): string {
  if (t.min == null && t.max == null) return "— (لن تظهر)";
  if (t.min != null && t.max != null && t.min >= t.max) return "⚠ «من» يجب أن يكون أقل من «إلى»";
  if (t.min == null) return `أقل من ${fmtIqd(t.max!)} د.ع`;
  if (t.max == null) return `${last ? "فاخر — " : ""}أكثر من ${fmtIqd(t.min)} د.ع`;
  return `من ${fmtIqd(t.min)} إلى ${fmtIqd(t.max)} د.ع`;
}

function galleryFromWorld(world: WorldRow): GalleryDraft[] {
  return [...(world.gallery ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => ({
      mediaId: item.mediaId || item.media?.id || "",
      url: mediaThumb(item.media, "medium") ?? undefined,
    }))
    .filter((item) => item.mediaId);
}

function moveGallery(list: GalleryDraft[], index: number, dir: number) {
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

function moveItem(list: string[], index: number, dir: number) {
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

function colorValue(value: unknown, fallback: string) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toHexString" in value) {
    return String((value as { toHexString: () => string }).toHexString());
  }
  return fallback;
}

export default function WorldsAdminPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["worlds-manage"],
    queryFn: queries.worldsManage,
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: queries.categoriesFull,
  });
  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: queries.banners,
  });
  const roots = ((categories ?? []) as RootCategory[]).filter((c) => !c.parentId);

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      mutations.updateWorld(id, body),
    onSuccess: () => {
      message.success("تم حفظ العالم");
      qc.invalidateQueries({ queryKey: ["worlds-manage"] });
    },
    onError: () => message.error("تعذّر حفظ العالم"),
  });

  const worlds = (data ?? []) as WorldRow[];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="العوالم"
        subtitle="كل عالم له أقسامه وبنرات رئيسيته، وصور خاصة تظهر أعلى صفحة الفئات."
      />
      {isLoading ? <Card loading /> : null}
      {worlds.map((world, index) => (
        <WorldCard
          key={world.id}
          world={world}
          index={index}
          canUp={index > 0}
          canDown={index < worlds.length - 1}
          onMove={async (dir) => {
            const other = worlds[index + dir];
            if (!other) return;
            await Promise.all([
              mutations.updateWorld(world.id, { position: other.position ?? index + dir }),
              mutations.updateWorld(other.id, { position: world.position ?? index }),
            ]);
            qc.invalidateQueries({ queryKey: ["worlds-manage"] });
          }}
          roots={roots}
          banners={(banners ?? []) as BannerRow[]}
          saving={save.isPending}
          onSave={async (body, bannerIds) => {
            await save.mutateAsync({ id: world.id, body: { ...body, bannerIds } });
            qc.invalidateQueries({ queryKey: ["banners"] });
          }}
        />
      ))}
    </div>
  );
}

function WorldCard({
  world,
  index,
  canUp,
  canDown,
  onMove,
  roots,
  banners,
  saving,
  onSave,
}: {
  world: WorldRow;
  index: number;
  canUp: boolean;
  canDown: boolean;
  onMove: (dir: number) => void;
  roots: RootCategory[];
  banners: BannerRow[];
  saving: boolean;
  onSave: (body: Record<string, unknown>, bannerIds: string[]) => void;
}) {
  const [nameAr, setNameAr] = useState(world.nameAr);
  const [nameEn, setNameEn] = useState(world.nameEn ?? "");
  const [taglineAr, setTaglineAr] = useState(world.taglineAr ?? "");
  const [taglineEn, setTaglineEn] = useState(world.taglineEn ?? "");
  const [accent, setAccent] = useState(world.accentColor);
  const [canvas, setCanvas] = useState(world.canvasColor);
  const [ink, setInk] = useState(world.inkColor);
  const [active, setActive] = useState(world.isActive);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    (world.categories ?? []).map((link) => link.category?.id || link.categoryId),
  );
  const [bannerIds, setBannerIds] = useState<string[]>(
    banners.filter((b) => b.worldId === world.id).map((b) => b.id),
  );
  const [gallery, setGallery] = useState<GalleryDraft[]>(() => galleryFromWorld(world));
  const [budget, setBudget] = useState<BudgetTier[]>(() => budgetFromWorld(world));
  const setTier = (i: number, key: "min" | "max", v: number | null) =>
    setBudget((list) => list.map((t, k) => (k === i ? { ...t, [key]: v } : t)));
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setNameAr(world.nameAr);
    setNameEn(world.nameEn ?? "");
    setTaglineAr(world.taglineAr ?? "");
    setTaglineEn(world.taglineEn ?? "");
    setAccent(world.accentColor);
    setCanvas(world.canvasColor);
    setInk(world.inkColor);
    setActive(world.isActive);
    setCategoryIds((world.categories ?? []).map((link) => link.category?.id || link.categoryId));
    setBannerIds(banners.filter((b) => b.worldId === world.id).map((b) => b.id));
    setGallery(galleryFromWorld(world));
    setBudget(budgetFromWorld(world));
  }, [world, banners]);

  return (
    <Card
      title={
        <Space>
          <span style={{ width: 22, height: 22, borderRadius: 99, background: accent, color: "#fff", display: "inline-grid", placeItems: "center", fontSize: 12 }}>{index + 1}</span>
          {nameAr}
        </Space>
      }
      extra={
        <Space>
          <Link href={`/worlds/builder?id=${world.id}`}><Button type="primary" size="small">إدارة الصفحة الرئيسية</Button></Link>
          <Button size="small" disabled={!canUp} onClick={() => onMove(-1)}>أعلى</Button>
          <Button size="small" disabled={!canDown} onClick={() => onMove(1)}>أسفل</Button>
          <Switch checked={active} onChange={setActive} checkedChildren="ظاهر" unCheckedChildren="مخفي" />
        </Space>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", gap: 18 }}>
        <div
          style={{
            borderRadius: 28,
            minHeight: 220,
            padding: 18,
            background: `linear-gradient(160deg, ${canvas}, #fff)`,
            border: `1px solid ${accent}55`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            color: ink,
          }}
        >
          <span style={{ width: 36, height: 5, borderRadius: 99, background: accent, marginBottom: 16 }} />
          <strong style={{ fontSize: 22, lineHeight: 1.2 }}>{nameAr || "عالم"}</strong>
          <span style={{ opacity: 0.7, marginTop: 6 }}>{taglineAr || "سطر قصير يظهر تحت الاسم"}</span>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
        <Space wrap>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="الاسم العربي" style={{ width: 220 }} />
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="English name" style={{ width: 220 }} />
        </Space>
        <Space wrap>
          <Input value={taglineAr} onChange={(e) => setTaglineAr(e.target.value)} placeholder="سطر عربي قصير" style={{ width: 280 }} />
          <Input value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)} placeholder="English line" style={{ width: 280 }} />
        </Space>
        <Space wrap>
          <label>اللون <ColorPicker value={accent} onChange={(v) => setAccent(colorValue(v, accent))} /></label>
          <label>الخلفية <ColorPicker value={canvas} onChange={(v) => setCanvas(colorValue(v, canvas))} /></label>
          <label>النص <ColorPicker value={ink} onChange={(v) => setInk(colorValue(v, ink))} /></label>
        </Space>
        <div>
          <Typography.Text strong>تسوّقي حسب ميزانيتكِ</Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            أربع بطاقات أسعار تظهر في رئيسية هذا العالم (بالدينار). اتركي «من» فارغاً لـ«أقل من»، و«إلى» فارغاً لـ«أكثر من».
          </Typography.Text>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {budget.map((tier, i) => (
              <Space key={i} wrap>
                <span style={{ width: 22, height: 22, borderRadius: 99, background: canvas, border: `1px solid ${accent}`, display: "inline-grid", placeItems: "center", fontSize: 12 }}>{i + 1}</span>
                <InputNumber
                  value={tier.min ?? undefined}
                  onChange={(v) => setTier(i, "min", v == null ? null : Number(v))}
                  min={0}
                  step={1000}
                  placeholder="من"
                  formatter={(v) => (v ? Number(v).toLocaleString("en-US") : "")}
                  parser={(v) => Number((v ?? "").replace(/[^0-9]/g, "")) as unknown as 0}
                  style={{ width: 140 }}
                />
                <InputNumber
                  value={tier.max ?? undefined}
                  onChange={(v) => setTier(i, "max", v == null ? null : Number(v))}
                  min={0}
                  step={1000}
                  placeholder="إلى"
                  formatter={(v) => (v ? Number(v).toLocaleString("en-US") : "")}
                  parser={(v) => Number((v ?? "").replace(/[^0-9]/g, "")) as unknown as 0}
                  style={{ width: 140 }}
                />
                <Typography.Text type={budgetPreview(tier, i === 3).startsWith("⚠") ? "danger" : "secondary"}>
                  {budgetPreview(tier, i === 3)}
                </Typography.Text>
              </Space>
            ))}
            <Button size="small" style={{ justifySelf: "start" }} onClick={() => setBudget(DEFAULT_BUDGET.map((t) => ({ ...t })))}>
              استرجاع الافتراضي
            </Button>
          </div>
        </div>
        <div>
          <Typography.Text strong>الأقسام الفرعية لهذا العالم</Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            اختاري الأقسام الفرعية التي تظهر في الصفحة الرئيسية لهذا العالم، ثم رتّبيها.
          </Typography.Text>
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            {roots.map((root) => {
              const subs = root.children ?? [];
              if (!subs.length) return null;
              const parentName = root.nameAr || root.name;
              return (
                <div key={root.id}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>{parentName}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {subs.map((sub) => {
                      const on = categoryIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() =>
                            setCategoryIds((current) =>
                              on ? current.filter((id) => id !== sub.id) : [...current, sub.id],
                            )
                          }
                          style={{
                            borderRadius: 999,
                            border: on ? `1px solid ${accent}` : "1px solid #eadfe4",
                            background: on ? canvas : "#fff",
                            color: ink,
                            padding: "8px 12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {sub.nameAr || sub.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {categoryIds.length > 0 ? (
            <div style={{ display: "grid", gap: 6, marginTop: 14 }}>
              <Typography.Text strong>ترتيب الظهور في الرئيسية</Typography.Text>
              {categoryIds.map((id, i) => {
                const match = roots.flatMap((root) =>
                  (root.children ?? []).filter((sub) => sub.id === id).map((sub) => ({
                    name: sub.nameAr || sub.name,
                    parent: root.nameAr || root.name,
                  })),
                )[0];
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 22, textAlign: "center", fontWeight: 800 }}>{i + 1}</span>
                    <span style={{ flex: 1 }}>{match ? `${match.parent} › ${match.name}` : id}</span>
                    <Button size="small" disabled={i === 0} onClick={() => setCategoryIds((list) => moveItem(list, i, -1))}>↑</Button>
                    <Button size="small" disabled={i === categoryIds.length - 1} onClick={() => setCategoryIds((list) => moveItem(list, i, 1))}>↓</Button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        <div>
          <Typography.Text strong>صور صفحة الفئات</Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            صور خاصة بهذا العالم تظهر أعلى صفحة الفئات. يمكن إضافة أكثر من صورة، وهي مستقلة عن بنرات الرئيسية.
          </Typography.Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {gallery.map((item, i) => (
              <div key={`${item.mediaId}-${i}`} style={{ width: 156 }}>
                <div
                  style={{
                    height: 88,
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#f4f1f2",
                    border: "1px solid #eadfe4",
                  }}
                >
                  {item.url ? (
                    <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : null}
                </div>
                <Space size={4} style={{ marginTop: 6 }}>
                  <Button size="small" disabled={i === 0} onClick={() => setGallery((list) => moveGallery(list, i, -1))}>↑</Button>
                  <Button size="small" disabled={i === gallery.length - 1} onClick={() => setGallery((list) => moveGallery(list, i, 1))}>↓</Button>
                  <Button size="small" danger onClick={() => setGallery((list) => list.filter((_, index) => index !== i))}>حذف</Button>
                </Space>
              </div>
            ))}
          </div>
          <Button style={{ marginTop: 10 }} onClick={() => setPickerOpen(true)}>إضافة صور</Button>
          <BulkMediaPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={(ids) => {
              void (async () => {
                const fresh = ids.filter((id) => !gallery.some((item) => item.mediaId === id));
                const resolved = await Promise.all(
                  fresh.map(async (id) => {
                    try {
                      const media = await queries.mediaById(id);
                      return { mediaId: id, url: mediaThumb(media, "medium") ?? undefined };
                    } catch {
                      return { mediaId: id };
                    }
                  }),
                );
                setGallery((current) => [...current, ...resolved]);
              })();
            }}
          />
        </div>
        <div>
          <Typography.Text strong>بنرات الصفحة الرئيسية لهذا العالم</Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            اختاري البنر ثم اضغطي حفظ. يظهر أعلى صفحة العالم في التطبيق.
          </Typography.Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {banners.map((banner) => {
              const on = bannerIds.includes(banner.id);
              const taken = banner.worldId && banner.worldId !== world.id && !on;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() =>
                    setBannerIds((current) =>
                      on ? current.filter((id) => id !== banner.id) : [...current, banner.id],
                    )
                  }
                  style={{
                    borderRadius: 999,
                    border: on ? `1px solid ${accent}` : "1px solid #eadfe4",
                    background: on ? canvas : "#fff",
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: taken ? 0.55 : 1,
                  }}
                >
                  {banner.title || "بنر"}
                </button>
              );
            })}
          </div>
        </div>
        <Button
          type="primary"
          loading={saving}
          onClick={() =>
            onSave({
              nameAr,
              nameEn,
              taglineAr,
              taglineEn,
              accentColor: accent,
              canvasColor: canvas,
              inkColor: ink,
              isActive: active,
              categoryIds,
              galleryMediaIds: gallery.map((item) => item.mediaId),
              budgetTiers: budget.filter((t) => t.min != null || t.max != null),
            }, bannerIds)
          }
          style={{ justifySelf: "start" }}
        >
          حفظ هذا العالم
        </Button>
        </div>
      </div>
    </Card>
  );
}
