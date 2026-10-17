"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Empty, Input, Select, Skeleton, Switch, Tag, Tooltip, message, Popconfirm } from "antd";
import { BarcodeOutlined, EyeInvisibleOutlined, PictureOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";
import { ControlProductDrawer, shadeSwatch } from "@/components/control/ControlProductDrawer";
import { controlApi, type ControlMatchedShade, type ControlProductSummary } from "@/lib/controlApi";
import { mediaUrl } from "@/lib/mediaUrl";
import { apiErrorMessage } from "@/lib/apiError";
import { useLoadMoreSentinel } from "@/hooks/useLoadMoreSentinel";
import "./control.css";

const FILTERS = [
  { key: "all|", label: "الكل" },
  { key: "active|", label: "ظاهر" },
  { key: "inactive|", label: "موقوف" },
  { key: "all|shadesOff", label: "فيه تدرج موقوف" },
  { key: "all|noImages", label: "بلا صور" },
  { key: "all|outOfStock", label: "نافد" },
  { key: "all|noBarcode", label: "بلا باركود" },
];

const fmt = (n: number) => `${Number(n).toLocaleString("en")} د.ع`;

/**
 * مركز التحكم: بحث واحد يشمل الاسم والبراند والباركود وأسماء/باركودات التدرجات — حتى الموقوف.
 * تشغيل وإيقاف المنتج أو أي تدرج مباشرة من النتائج. قارئ باركود USB يعمل في حقل البحث.
 */
export function ControlCenterPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [filterKey, setFilterKey] = useState("all|");
  const [brandId, setBrandId] = useState<string | undefined>();
  const [open, setOpen] = useState<{ id: string; shadeId?: string | null } | null>(null);
  const [status, filter] = filterKey.split("|");

  useEffect(() => {
    const t = setTimeout(() => setQ(draft.trim()), 300);
    return () => clearTimeout(t);
  }, [draft]);

  const { data: stats } = useQuery({ queryKey: ["control-stats"], queryFn: controlApi.stats, staleTime: 30_000 });
  const { data: brands } = useQuery({ queryKey: ["control-brands"], queryFn: controlApi.brands, staleTime: 5 * 60_000 });

  const queryKey = useMemo(() => ["control-search", q, status, filter, brandId], [q, status, filter, brandId]);
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      controlApi.search({ q: q || undefined, status, filter: filter || undefined, brandId, page: pageParam, limit: 30 }),
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
  });
  const items = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.meta.total ?? 0;
  const sentinel = useLoadMoreSentinel(() => void fetchNextPage(), { enabled: !!hasNextPage && !isFetchingNextPage });

  const patchLocal = useCallback(
    (id: string, fn: (p: ControlProductSummary) => ControlProductSummary) => {
      qc.setQueryData(queryKey, (old: any) =>
        old ? { ...old, pages: old.pages.map((pg: any) => ({ ...pg, data: pg.data.map((p: ControlProductSummary) => (p.id === id ? fn(p) : p)) })) } : old,
      );
    },
    [qc, queryKey],
  );

  const toggleProduct = async (p: ControlProductSummary, v: boolean) => {
    patchLocal(p.id, (x) => ({ ...x, isActive: v }));
    try {
      await controlApi.patchProduct(p.id, { isActive: v });
      message.success(v ? "المنتج ظاهر الآن" : "أُوقف المنتج");
      qc.invalidateQueries({ queryKey: ["control-stats"] });
    } catch (e) {
      patchLocal(p.id, (x) => ({ ...x, isActive: !v }));
      message.error(apiErrorMessage(e));
    }
  };

  const toggleShade = async (p: ControlProductSummary, s: ControlMatchedShade, v: boolean) => {
    const set = (val: boolean) =>
      patchLocal(p.id, (x) => ({
        ...x,
        shadesOff: x.shadesOff + (val ? -1 : 1),
        matchedShades: x.matchedShades.map((m) => (m.id === s.id ? { ...m, isActive: val } : m)),
      }));
    set(v);
    try {
      await controlApi.patchShade(s.id, { isActive: v });
      message.success(v ? `شُغّل «${s.name}»` : `أُوقف «${s.name}»`);
      qc.invalidateQueries({ queryKey: ["control-stats"] });
    } catch (e) {
      set(!v);
      message.error(apiErrorMessage(e));
    }
  };

  const onEnter = () => {
    const t = draft.trim();
    setQ(t);
    // قارئ باركود: نتيجة واحدة مطابقة تماماً → افتحها
    void qc.fetchInfiniteQuery({
      queryKey: ["control-search", t, status, filter, brandId],
      initialPageParam: 1,
      queryFn: () => controlApi.search({ q: t || undefined, status, filter: filter || undefined, brandId, page: 1, limit: 30 }),
    }).then((res) => {
      const list = res.pages[0]?.data ?? [];
      const exact = list.filter((p) => p.exactBarcode || p.matchedShades.some((s) => s.barcode === t));
      if (exact.length === 1) {
        const shade = exact[0].matchedShades.find((s) => s.barcode === t);
        setOpen({ id: exact[0].id, shadeId: shade?.id });
        setDraft("");
      }
    });
  };

  const s = stats?.products;

  return (
    <div className="control-page">
      <PageHeader
        title="مركز التحكم"
        subtitle="ابحث بالاسم أو الباركود أو اسم التدرج — وشغّل أو أوقف أي منتج أو تدرج فوراً"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching && !isFetchingNextPage}>
            تحديث
          </Button>
        }
      />

      {s ? (
        <div className="control-stats">
          {[
            { label: "ظاهر", value: s.active, color: "#1f9d63", key: "active|" },
            { label: "موقوف", value: s.inactive, color: "#d64545", key: "inactive|" },
            { label: "تدرجات موقوفة", value: s.shadesOff, sub: `في ${s.productsWithShadesOff} منتج`, color: "#c0679a", key: "all|shadesOff" },
            { label: "ظاهر بلا صور", value: s.noImages, color: "#db8b12", key: "all|noImages" },
            { label: "ظاهر ونافد", value: s.outOfStock, color: "#2f6fde", key: "all|outOfStock" },
          ].map((c) => (
            <button key={c.label} type="button" className={`control-stat${filterKey === c.key ? " active" : ""}`} onClick={() => setFilterKey(c.key)}>
              <strong style={{ color: c.color }}>{c.value.toLocaleString("en")}</strong>
              <span>{c.label}</span>
              {c.sub ? <small>{c.sub}</small> : null}
            </button>
          ))}
          <Link className="control-stat" href="/barcode-drafts/" prefetch={false}>
            <strong style={{ color: "#6e45b0" }}>{stats.drafts.pending.toLocaleString("en")}</strong>
            <span>باركودات محفوظة بانتظار</span>
            <small>{stats.drafts.added} أُضيفت لاحقاً</small>
          </Link>
        </div>
      ) : null}

      <div className="control-toolbar">
        <Input
          size="large"
          autoFocus
          allowClear
          prefix={<SearchOutlined />}
          suffix={<BarcodeOutlined style={{ color: "#999" }} />}
          placeholder="اسم المنتج، البراند، SKU، الباركود، أو اسم التدرج… (قارئ الباركود يعمل هنا)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={onEnter}
        />
        <div className="control-filters">
          {FILTERS.map((f) => (
            <Tag.CheckableTag key={f.key} checked={filterKey === f.key} onChange={() => setFilterKey(f.key)} className="control-chip">
              {f.label}
            </Tag.CheckableTag>
          ))}
          <Select
            allowClear
            showSearch
            placeholder="كل البراندات"
            style={{ minWidth: 200 }}
            value={brandId}
            onChange={setBrandId}
            optionFilterProp="label"
            options={(brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
          />
        </div>
      </div>

      <div className="control-count">{isLoading ? "جارٍ البحث…" : `${total.toLocaleString("en")} منتج`}</div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : !items.length ? (
        <Empty description={q ? `لا نتائج لـ «${q}» — إن كان باركوداً احفظه من تطبيق المدير` : "لا توجد منتجات بهذا الفلتر"} />
      ) : (
        <div className="control-list">
          {items.map((p) => (
            <div key={p.id} className={`control-row${p.isActive ? "" : " off"}`}>
              <button type="button" className="control-thumb" onClick={() => setOpen({ id: p.id })}>
                {p.thumb ? <img src={mediaUrl(p.thumb) ?? ""} alt="" loading="lazy" /> : <PictureOutlined />}
                {!p.isActive ? (
                  <span className="control-thumb-off">
                    <EyeInvisibleOutlined />
                  </span>
                ) : null}
              </button>
              <div className="control-main">
                <button type="button" className="control-name" onClick={() => setOpen({ id: p.id })}>
                  {p.name}
                </button>
                <div className="control-meta">
                  {p.brand?.name ? <span>{p.brand.name}</span> : null}
                  <span>{fmt(p.price)}</span>
                  {p.barcode ? <span dir="ltr">{p.barcode}</span> : null}
                </div>
                <div className="control-tags">
                  {p.exactBarcode ? <Tag color="blue">مطابقة الباركود</Tag> : null}
                  {p.stock <= 0 ? <Tag color="red">نافد</Tag> : <Tag>مخزون {p.stock}</Tag>}
                  {p.imageCount === 0 ? <Tag color="orange">بلا صور</Tag> : <Tag>{p.imageCount} صور</Tag>}
                  {p.shadeCount ? (
                    <Tag color={p.shadesOff ? "magenta" : "purple"}>
                      {p.shadeCount} تدرج{p.shadesOff ? ` · ${p.shadesOff} موقوف` : ""}
                    </Tag>
                  ) : null}
                  {!p.matchedShades.length && p.shadePreview.length ? (
                    <span className="control-dots">
                      {p.shadePreview.map((d, i) => (
                        <span key={i} className={`control-dot${d.isActive ? "" : " off"}`} style={shadeSwatch(d.colorHex, d.colorHexEnd)} />
                      ))}
                    </span>
                  ) : null}
                </div>
                {p.matchedShades.length ? (
                  <div className="control-matched">
                    {p.matchedShades.map((m) => (
                      <div key={m.id} className={`control-matched-row${m.isActive ? "" : " off"}`}>
                        <span className="control-swatch sm" style={shadeSwatch(m.colorHex, m.colorHexEnd)} />
                        <button type="button" onClick={() => setOpen({ id: p.id, shadeId: m.id })}>
                          {m.name}
                        </button>
                        <span dir="ltr" className="muted">
                          {m.barcode}
                        </span>
                        <Tag color={m.stock > 0 ? "green" : "red"}>{m.stock > 0 ? m.stock : "نافد"}</Tag>
                        <Switch size="small" checked={m.isActive} onChange={(v) => toggleShade(p, m, v)} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="control-actions">
                {p.isActive ? (
                  <Popconfirm title="إيقاف المنتج؟" description="سيختفي من التطبيق فوراً" okText="إيقاف" okButtonProps={{ danger: true }} onConfirm={() => toggleProduct(p, false)}>
                    <Switch checked />
                  </Popconfirm>
                ) : (
                  <Tooltip title="تشغيل">
                    <Switch checked={false} onChange={(v) => toggleProduct(p, v)} />
                  </Tooltip>
                )}
                <span className={p.isActive ? "on" : "off"}>{p.isActive ? "ظاهر" : "موقوف"}</span>
                <Button size="small" onClick={() => setOpen({ id: p.id })}>
                  {p.shadeCount ? "التدرجات والصور" : "الصور"}
                </Button>
              </div>
            </div>
          ))}
          <div ref={sentinel} style={{ height: 1 }} />
          {isFetchingNextPage ? <Skeleton active paragraph={{ rows: 2 }} /> : null}
        </div>
      )}

      <ControlProductDrawer
        productId={open?.id ?? null}
        highlightShadeId={open?.shadeId}
        onClose={() => setOpen(null)}
        onChanged={() => {
          qc.invalidateQueries({ queryKey: ["control-search"] });
          qc.invalidateQueries({ queryKey: ["control-stats"] });
        }}
      />
    </div>
  );
}
