"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select, Space, Switch, Typography, message } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { GalleryEditor, GroupEditor, emptyChild, emptyGallery, galleryPayload, type GalleryDraft, type GroupChild } from "@/components/worlds/WorldStudioMedia";
import { productCoverUrl } from "@/lib/productCover";
import { mutations, queries } from "@/lib/queries";

type ProductRow = {
  id: string;
  name?: string;
  nameAr?: string;
  images?: Array<{ media?: unknown }>;
};
type BrandRow = { id: string; name?: string; nameAr?: string };
type CatNode = { id: string; name?: string; nameAr?: string; parentId?: string | null; children?: CatNode[] };
type Block = {
  id: string;
  type: string;
  title?: string | null;
  position?: number;
  isActive?: boolean;
  payload?: Record<string, unknown>;
};

type Kind = "film" | "brand" | "products" | "ribbon" | "ad" | "pair" | "gallery" | "group" | "other";

type Draft = {
  kind: Kind;
  title: string;
  text: string;
  productIds: string[];
  brandId: string;
  allBrand: boolean;
  film: boolean;
  categoryId: string;
  filter: string;
  imageId: string;
  imageId2: string;
  tileTitle: string;
  tileTitle2: string;
  speed: number;
  visible: boolean;
  gallery: GalleryDraft;
  groupColor: string;
  groupPattern: string;
  groupChildren: GroupChild[];
};

const KIND_LABEL: Record<Kind, string> = {
  film: "شريط سينمائي",
  brand: "براند ومنتجاته",
  products: "منتجات قسم",
  ribbon: "شريط جملة",
  ad: "إعلان عريض",
  pair: "صورتان",
  gallery: "معرض صور",
  group: "مجموعة",
  other: "قسم سابق",
};

function kindOf(block: Block): Kind {
  const payload = block.payload ?? {};
  if (block.type === "PROMO_STRIP") return "ribbon";
  if (block.type === "CUSTOM_BANNER" || block.type === "BANNER_FULL") return "ad";
  if (block.type === "IMAGE_TILES") return "pair";
  if (block.type === "SECTION_GROUP") return "group";
  if (block.type === "PHOTO_WALL" || block.type === "MEDIA_GALLERY" || block.type === "IMAGE_MARQUEE" || block.type === "IMAGE_COLLAGE") {
    return "gallery";
  }
  if (block.type === "PRODUCT_LIST") {
    if (payload.brandId) return "brand";
    if (payload.layout === "film" || payload.display === "film") return "film";
    return "products";
  }
  return "other";
}

function draftFrom(block?: Block): Draft {
  const payload = block?.payload ?? {};
  const items = Array.isArray(payload.items) ? (payload.items as { imageId?: string; title?: string }[]) : [];
  return {
    kind: block ? kindOf(block) : "film",
    title: block?.title || "",
    text: String(payload.text || ""),
    productIds: Array.isArray(payload.productIds) ? (payload.productIds as string[]) : [],
    brandId: String(payload.brandId || ""),
    allBrand: !Array.isArray(payload.productIds) || (payload.productIds as string[]).length === 0,
    film: payload.layout === "film" || payload.display === "film" || !block,
    categoryId: String(payload.categoryId || payload.subcategoryId || ""),
    filter: String(payload.filter || "featured"),
    imageId: String(payload.imageId || items[0]?.imageId || ""),
    imageId2: String(items[1]?.imageId || ""),
    tileTitle: String(items[0]?.title || ""),
    tileTitle2: String(items[1]?.title || ""),
    speed: Number(payload.marqueeSpeed) || 4,
    visible: block ? block.isActive !== false : true,
    gallery: galleryFrom(payload, block?.type),
    groupColor: String(payload.backgroundColor || "#FFF5F8"),
    groupPattern: String(payload.pattern || "none"),
    groupChildren: childrenFrom(payload),
  };
}

function galleryFrom(payload: Record<string, unknown>, type?: string): GalleryDraft {
  const items = Array.isArray(payload.items) ? (payload.items as { imageId?: string; title?: string }[]) : [];
  const display = String(payload.display || "");
  const columns = Number(payload.columns) || 2;
  const mode: GalleryDraft["mode"] =
    display === "marquee" || type === "IMAGE_MARQUEE"
      ? "marquee"
      : display === "pager"
        ? "pager"
        : display === "mosaic"
          ? "mosaic"
          : display === "grid"
            ? columns >= 3
              ? "three"
              : "two"
            : "full";
  return {
    mode,
    shape: String(payload.shape || "banner"),
    speed: Number(payload.marqueeSpeed) || 4,
    gap: Number(payload.gap) || 10,
    overlay: payload.overlayStyle === "none" ? "none" : "bottom",
    reverse: payload.motion === "reverse",
    images: items.filter((item) => item.imageId).map((item) => ({ id: String(item.imageId), title: item.title || "" })),
  };
}

function childrenFrom(payload: Record<string, unknown>): GroupChild[] {
  const raw = Array.isArray(payload.children) ? payload.children : [];
  return raw.slice(0, 3).map((child) => {
    const row = child as { type?: string; title?: string; payload?: Record<string, unknown> };
    const body = row.payload ?? {};
    if (row.type === "PROMO_STRIP") {
      return { ...emptyChild("ribbon"), title: row.title || "", text: String(body.text || "") };
    }
    if (row.type === "PRODUCT_LIST") {
      return {
        ...emptyChild("film"),
        title: row.title || "",
        productIds: Array.isArray(body.productIds) ? (body.productIds as string[]) : [],
      };
    }
    return { ...emptyChild("gallery"), title: row.title || "", gallery: galleryFrom(body, row.type) };
  });
}

function productName(row?: ProductRow) {
  return row?.nameAr || row?.name || "منتج";
}

function blockSummary(block: Block) {
  const payload = block.payload ?? {};
  const count = Array.isArray(payload.productIds) ? payload.productIds.length : 0;
  const kind = kindOf(block);
  const hidden = block.isActive === false ? " · مخفي" : "";
  if (kind === "film") return `${count ? `${count} منتجات بالترتيب` : "لم تُختَر منتجات"}${hidden}`;
  if (kind === "brand") return `${count ? `${count} منتجات من البراند` : "كل منتجات البراند"}${hidden}`;
  if (kind === "ribbon") return `${String(payload.text || "شريط نص")}${hidden}`;
  if (kind === "gallery") return `معرض صور${hidden}`;
  if (kind === "group") return `مجموعة${hidden}`;
  if (kind === "ad" || kind === "pair") return `صورة${hidden}`;
  return `منتجات حسب القسم${hidden}`;
}

const chipBtn: React.CSSProperties = {
  border: 0,
  background: "transparent",
  cursor: "pointer",
  fontWeight: 800,
  padding: "0 2px",
};

export function WorldHomeStudio({
  worldId,
  worldName,
  accent,
  canvas,
}: {
  worldId: string;
  worldName: string;
  accent: string;
  canvas: string;
}) {
  const qc = useQueryClient();
  const blocksKey = ["world-home-studio", worldId];
  const { data, isLoading } = useQuery({
    queryKey: blocksKey,
    queryFn: () => queries.homeBlocks(worldId),
  });
  const { data: brandsData } = useQuery({ queryKey: ["brands-all"], queryFn: () => queries.brands() });
  const { data: categoriesData } = useQuery({ queryKey: ["categories-full"], queryFn: queries.categoriesFull });
  const blocks = ((data ?? []) as Block[]).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const brands = (Array.isArray(brandsData) ? brandsData : []) as BrandRow[];
  const roots = ((categoriesData ?? []) as CatNode[]).filter((c) => !c.parentId);

  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(draftFrom());
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Record<string, ProductRow>>({});

  const selected = blocks.find((b) => b.id === selectedId);
  const productQuery = useQuery({
    queryKey: ["studio-products", draft.kind, draft.brandId, search],
    enabled:
      selectedId != null &&
      ((draft.kind === "film" && search.trim().length >= 2) || (draft.kind === "brand" && Boolean(draft.brandId))),
    queryFn: () =>
      queries.products({
        search: draft.kind === "film" ? search || undefined : undefined,
        brandId: draft.kind === "brand" ? draft.brandId || undefined : undefined,
        limit: 48,
        page: 1,
      }),
  });
  const catalog = (productQuery.data?.data ?? []) as ProductRow[];

  useEffect(() => {
    if (!catalog.length) return;
    setPicked((prev) => {
      const next = { ...prev };
      for (const product of catalog) next[product.id] = product;
      return next;
    });
  }, [catalog]);

  useEffect(() => {
    const missing = draft.productIds.filter((id) => !picked[id]);
    if (!missing.length) return;
    let cancel = false;
    Promise.all(
      missing.map(async (id) => {
        const row = await queries.product(id).catch(() => null);
        return row && typeof row === "object" ? ({ ...row, id } as ProductRow) : null;
      }),
    ).then((rows) => {
      if (cancel) return;
      setPicked((prev) => {
        const next = { ...prev };
        for (const row of rows) if (row?.id) next[row.id] = row;
        return next;
      });
    });
    return () => {
      cancel = true;
    };
  }, [draft.productIds]);

  const save = useMutation({
    mutationFn: async () => {
      if (draft.kind === "film" && draft.productIds.length < 2) {
        throw new Error("اختاري منتجين على الأقل حتى يتحرك الشريط");
      }
      if (draft.kind === "brand" && !draft.brandId) {
        throw new Error("اختاري البراند أولاً");
      }
      if (draft.kind === "brand" && !draft.allBrand && draft.productIds.length === 0) {
        throw new Error("اختاري منتجات البراند، أو فعّلي كل المنتجات");
      }
      if (draft.kind === "gallery" && draft.gallery.images.length === 0) {
        throw new Error("أضيفي صورة واحدة على الأقل");
      }
      if (draft.kind === "group" && draft.groupChildren.length === 0) {
        throw new Error("أضيفي قسماً واحداً داخل المجموعة");
      }
      const subIds = new Set(roots.flatMap((root) => (root.children ?? []).map((sub) => sub.id)));
      const body = toBlock(draft, worldId, subIds);
      if (selectedId && selectedId !== "new") return mutations.updateHomeBlock(selectedId, body);
      return mutations.createHomeBlock({ ...body, position: blocks.length });
    },
    onSuccess: () => {
      message.success("تم حفظ القسم");
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: blocksKey });
    },
    onError: (error: Error) => message.error(error.message || "تعذّر حفظ القسم"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => mutations.deleteHomeBlock(id),
    onSuccess: () => {
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: blocksKey });
    },
  });

  const move = async (index: number, dir: number) => {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    await mutations.reorderHomeBlocks(next.map((b) => b.id));
    qc.invalidateQueries({ queryKey: blocksKey });
  };

  const openNew = (kind: Kind) => {
    const fresh = draftFrom();
    fresh.kind = kind;
    fresh.title =
      kind === "film"
        ? "مختارات تتحرك"
        : kind === "brand"
          ? "من البراند"
          : kind === "products"
            ? "منتجات القسم"
            : kind === "ribbon"
              ? "جملة العالم"
              : kind === "gallery"
                ? "معرض الصور"
                : kind === "group"
                  ? "مجموعة"
                  : "";
    fresh.film = kind === "film" || kind === "brand";
    setDraft(fresh);
    setSearch("");
    setSelectedId("new");
  };

  const knownProducts = useMemo(
    () => draft.productIds.map((id) => picked[id] || ({ id } as ProductRow)),
    [draft.productIds, picked],
  );

  const shiftProduct = (index: number, dir: number) => {
    const next = [...draft.productIds];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setDraft({ ...draft, productIds: next });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          رئيسية {worldName}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: "6px 0 0" }}>
          هذه الصفحة لما يظهر تحت أقسام العالم. البنر العلوي وصور صفحة الفئات تبقى من صفحة العوالم.
        </Typography.Paragraph>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(["gallery", "group", "film", "brand", "products", "ribbon", "ad", "pair"] as Kind[]).map((kind) => (
          <Button key={kind} type={kind === "gallery" || kind === "group" || kind === "film" ? "primary" : "default"} onClick={() => openNew(kind)}>
            + {KIND_LABEL[kind]}
          </Button>
        ))}
        <Link href={`/worlds/builder?id=${worldId}&advanced=1`} style={{ marginInlineStart: "auto", alignSelf: "center" }}>
          الأدوات المتقدمة
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 320px) 1fr", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 8 }}>
          {isLoading ? <Typography.Text>جارٍ التحميل…</Typography.Text> : null}
          {!isLoading && blocks.length === 0 ? (
            <Typography.Text type="secondary">لا توجد أقسام بعد. ابدئي بشريط سينمائي أو براند.</Typography.Text>
          ) : null}
          {blocks.map((block, index) => {
            const kind = kindOf(block);
            const on = selectedId === block.id;
            return (
              <div
                key={block.id}
                style={{
                  border: on ? `1px solid ${accent}` : "1px solid #eadfe4",
                  background: on ? canvas : "#fff",
                  borderRadius: 16,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDraft(draftFrom(block));
                    setSelectedId(block.id);
                    setSearch("");
                  }}
                  style={{ textAlign: "start", background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
                >
                  <strong>{KIND_LABEL[kind]}</strong>
                  <div style={{ color: "#6d656a", marginTop: 2 }}>{block.title || "بدون عنوان"}</div>
                  <div style={{ color: "#8a8488", fontSize: 12 }}>{blockSummary(block)}</div>
                </button>
                <Space>
                  <Button size="small" disabled={index === 0} onClick={() => move(index, -1)}>أعلى</Button>
                  <Button size="small" disabled={index === blocks.length - 1} onClick={() => move(index, 1)}>أسفل</Button>
                  <Button size="small" danger onClick={() => remove.mutate(block.id)}>حذف</Button>
                </Space>
              </div>
            );
          })}
        </div>

        <div style={{ border: "1px solid #eadfe4", borderRadius: 20, padding: 18, background: "#fff", minHeight: 360 }}>
          {selectedId == null ? (
            <Typography.Text type="secondary">اختاري قسماً من القائمة، أو أضيفي قسماً جديداً من الأزرار.</Typography.Text>
          ) : draft.kind === "other" ? (
            <Typography.Text>هذا القسم من الأدوات المتقدمة. يمكن ترتيبه أو حذفه من القائمة.</Typography.Text>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <Typography.Title level={4} style={{ margin: 0 }}>{KIND_LABEL[draft.kind]}</Typography.Title>
              <Input
                value={draft.title}
                placeholder="عنوان القسم"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />

              {draft.kind === "ribbon" ? (
                <Input.TextArea
                  value={draft.text}
                  rows={3}
                  placeholder="الجملة التي تتحرك في الشريط"
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                />
              ) : null}

              {draft.kind === "products" ? (
                <Space wrap>
                  <Select
                    style={{ minWidth: 240 }}
                    placeholder="القسم"
                    value={draft.categoryId || undefined}
                    onChange={(categoryId) => setDraft({ ...draft, categoryId })}
                    options={roots.flatMap((root) => [
                      { value: root.id, label: root.nameAr || root.name || root.id },
                      ...(root.children ?? []).map((sub) => ({
                        value: sub.id,
                        label: `${root.nameAr || root.name} › ${sub.nameAr || sub.name}`,
                      })),
                    ])}
                  />
                  <Select
                    style={{ width: 160 }}
                    value={draft.filter}
                    onChange={(filter) => setDraft({ ...draft, filter })}
                    options={[
                      { value: "featured", label: "مميزة" },
                      { value: "new", label: "جديدة" },
                      { value: "bestSeller", label: "الأكثر مبيعاً" },
                      { value: "promo", label: "عروض" },
                    ]}
                  />
                </Space>
              ) : null}

              {draft.kind === "brand" ? (
                <Space wrap>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    style={{ minWidth: 260 }}
                    placeholder="اختاري البراند"
                    value={draft.brandId || undefined}
                    onChange={(brandId) => setDraft({ ...draft, brandId, productIds: [] })}
                    options={brands.map((b) => ({ value: b.id, label: b.nameAr || b.name || b.id }))}
                  />
                  <span>كل المنتجات</span>
                  <Switch checked={draft.allBrand} onChange={(allBrand) => setDraft({ ...draft, allBrand, productIds: allBrand ? [] : draft.productIds })} />
                  <span>حركة سينمائية</span>
                  <Switch checked={draft.film} onChange={(film) => setDraft({ ...draft, film })} />
                </Space>
              ) : null}

              {draft.kind === "brand" && draft.brandId && draft.allBrand ? (
                <Typography.Text>
                  تظهر كل منتجات هذا البراند في الصف، بلا حد للعدد.
                </Typography.Text>
              ) : null}

              {draft.kind === "film" || (draft.kind === "brand" && !draft.allBrand) ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {draft.kind === "film" ? (
                    <Input value={search} placeholder="ابحثي عن منتج ثم اضغطي لإضافته" onChange={(e) => setSearch(e.target.value)} />
                  ) : (
                    <Typography.Text type="secondary">منتجات البراند. اضغطي على ما تريدين إظهاره، بالترتيب.</Typography.Text>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {knownProducts.map((product, index) => (
                      <div
                        key={product.id}
                        style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 999, border: `1px solid ${accent}`, background: canvas, padding: "4px 8px" }}
                      >
                        <button type="button" onClick={() => shiftProduct(index, -1)} style={chipBtn}>تقديم</button>
                        <span style={{ fontWeight: 700 }}>{index + 1}. {productName(product)}</span>
                        <button type="button" onClick={() => shiftProduct(index, 1)} style={chipBtn}>تأخير</button>
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, productIds: draft.productIds.filter((id) => id !== product.id) })}
                          style={chipBtn}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {productQuery.isFetching ? <Typography.Text type="secondary">جارٍ جلب المنتجات…</Typography.Text> : null}
                  {!productQuery.isFetching && catalog.length === 0 ? (
                    <Typography.Text type="secondary">
                      {draft.kind === "film" ? "اكتبي حرفين على الأقل للبحث." : "اختاري البراند لتظهر منتجاته."}
                    </Typography.Text>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 8 }}>
                    {catalog.map((product) => {
                      const on = draft.productIds.includes(product.id);
                      const cover = productCoverUrl(product);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              productIds: on ? draft.productIds.filter((id) => id !== product.id) : [...draft.productIds, product.id],
                            })
                          }
                          style={{
                            textAlign: "start",
                            borderRadius: 14,
                            border: on ? `2px solid ${accent}` : "1px solid #eadfe4",
                            background: "#fff",
                            padding: 6,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ height: 84, borderRadius: 10, background: "#f6f3f4", overflow: "hidden" }}>
                            {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{productName(product)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {draft.kind === "gallery" ? (
                <GalleryEditor accent={accent} value={draft.gallery} onChange={(gallery) => setDraft({ ...draft, gallery })} />
              ) : null}

              {draft.kind === "group" ? (
                <GroupEditor
                  accent={accent}
                  colors={draft.groupColor}
                  pattern={draft.groupPattern}
                  children={draft.groupChildren}
                  onColors={(groupColor, groupPattern) => setDraft({ ...draft, groupColor, groupPattern })}
                  onChildren={(groupChildren) => setDraft({ ...draft, groupChildren })}
                />
              ) : null}

              {draft.kind === "ad" ? (
                <MediaPicker label="صورة الإعلان" purpose="BANNER" value={draft.imageId} onChange={(id) => setDraft({ ...draft, imageId: id || "" })} />
              ) : null}

              {draft.kind === "pair" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Input value={draft.tileTitle} placeholder="عنوان الصورة الأولى" onChange={(e) => setDraft({ ...draft, tileTitle: e.target.value })} />
                    <MediaPicker label="الصورة الأولى" purpose="BANNER" value={draft.imageId} onChange={(id) => setDraft({ ...draft, imageId: id || "" })} />
                  </div>
                  <div>
                    <Input value={draft.tileTitle2} placeholder="عنوان الصورة الثانية" onChange={(e) => setDraft({ ...draft, tileTitle2: e.target.value })} />
                    <MediaPicker label="الصورة الثانية" purpose="BANNER" value={draft.imageId2} onChange={(id) => setDraft({ ...draft, imageId2: id || "" })} />
                  </div>
                </div>
              ) : null}

              {draft.kind === "film" || (draft.kind === "brand" && draft.film) ? (
                <label>
                  سرعة الحركة
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={draft.speed}
                    onChange={(e) => setDraft({ ...draft, speed: Number(e.target.value) || 4 })}
                    style={{ width: 90, marginInlineStart: 8 }}
                  />
                </label>
              ) : null}

              <Space>
                <span>ظاهر في التطبيق</span>
                <Switch checked={draft.visible} onChange={(visible) => setDraft({ ...draft, visible })} />
              </Space>
              <Space>
                <Button type="primary" loading={save.isPending} onClick={() => save.mutate()} style={{ background: accent }}>
                  {selectedId === "new" ? "إضافة إلى الصفحة" : "حفظ القسم"}
                </Button>
                <Button onClick={() => setSelectedId(null)}>إغلاق</Button>
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toBlock(draft: Draft, worldId: string, subIds: Set<string>) {
  const title = draft.title.trim() || KIND_LABEL[draft.kind];
  const film = draft.kind === "film" || (draft.kind === "brand" && draft.film);
  if (draft.kind === "film") {
    return {
      type: "PRODUCT_LIST",
      pageKey: "HOME",
      worldId,
      isActive: draft.visible,
      title,
      payload: {
        layout: "film",
        display: "film",
        productIds: draft.productIds,
        showTitle: true,
        showViewAll: false,
        marqueeSpeed: draft.speed,
      },
    };
  }
  if (draft.kind === "brand") {
    const viewAll = draft.brandId ? `brandId=${encodeURIComponent(draft.brandId)}&title=${encodeURIComponent(title)}` : undefined;
    return {
      type: "PRODUCT_LIST",
      pageKey: "HOME",
      worldId,
      isActive: draft.visible && Boolean(draft.brandId),
      title,
      payload: {
        brandId: draft.brandId,
        ...(draft.allBrand ? {} : { productIds: draft.productIds }),
        filter: "all",
        layout: film ? "film" : "carousel",
        display: film ? "film" : "carousel",
        showTitle: true,
        showViewAll: true,
        viewAllQuery: viewAll,
        marqueeSpeed: draft.speed,
      },
    };
  }
  if (draft.kind === "products") {
    const isSub = subIds.has(draft.categoryId);
    return {
      type: "PRODUCT_LIST",
      pageKey: "HOME",
      worldId,
      isActive: draft.visible,
      title,
      payload: {
        ...(isSub ? { subcategoryId: draft.categoryId } : { categoryId: draft.categoryId }),
        filter: draft.filter,
        showTitle: true,
        showViewAll: true,
      },
    };
  }
  if (draft.kind === "gallery") {
    return {
      type: "PHOTO_WALL",
      pageKey: "HOME",
      worldId,
      isActive: draft.visible && draft.gallery.images.length > 0,
      title,
      payload: galleryPayload(draft.gallery),
    };
  }
  if (draft.kind === "group") {
    return {
      type: "SECTION_GROUP",
      pageKey: "HOME",
      worldId,
      isActive: draft.visible && draft.groupChildren.length > 0,
      title,
      payload: {
        backgroundColor: draft.groupColor,
        pattern: draft.groupPattern,
        showTitle: true,
        borderRadius: 24,
        shadow: true,
        children: draft.groupChildren.map((child) => {
          if (child.kind === "ribbon") {
            return {
              type: "PROMO_STRIP",
              title: child.title,
              payload: { text: child.text || child.title, items: [], marquee: true, showTitle: false },
            };
          }
          if (child.kind === "film") {
            return {
              type: "PRODUCT_LIST",
              title: child.title,
              payload: { layout: "film", display: "film", productIds: child.productIds, showTitle: Boolean(child.title), showViewAll: false, marqueeSpeed: 4 },
            };
          }
          return { type: "PHOTO_WALL", title: child.title, payload: galleryPayload(child.gallery) };
        }),
      },
    };
  }
  if (draft.kind === "ribbon") {
    return {
      type: "PROMO_STRIP",
      pageKey: "HOME",
      worldId,
      isActive: draft.visible,
      title,
      payload: {
        text: draft.text || title,
        items: [],
        marquee: true,
        variant: "strip",
        showTitle: false,
      },
    };
  }
  if (draft.kind === "ad") {
    return {
      type: "CUSTOM_BANNER",
      pageKey: "HOME",
      worldId,
      isActive: draft.visible && Boolean(draft.imageId),
      title,
      payload: {
        source: "inline",
        imageId: draft.imageId,
        sectionLayout: "full",
        aspectRatio: "16:9",
        showTitle: false,
      },
    };
  }
  return {
    type: "IMAGE_TILES",
    pageKey: "HOME",
    worldId,
    isActive: draft.visible && Boolean(draft.imageId || draft.imageId2),
    title,
    payload: {
      columns: 2,
      sectionLayout: "grid",
      shape: "rect",
      aspectRatio: "1:1",
      showTitle: false,
      items: [
        { imageId: draft.imageId, title: draft.tileTitle },
        { imageId: draft.imageId2, title: draft.tileTitle2 },
      ].filter((item) => item.imageId),
    },
  };
}
