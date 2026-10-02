"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Input, Space } from "antd";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaThumb } from "@/lib/mediaUrl";
import { productCoverUrl } from "@/lib/productCover";
import { queries } from "@/lib/queries";
import { useEffect, useState } from "react";

export type GalleryImage = { id: string; title: string };
export type GalleryDraft = {
  mode: "full" | "two" | "three" | "mosaic" | "marquee" | "pager";
  shape: string;
  speed: number;
  gap: number;
  overlay: "none" | "bottom";
  reverse: boolean;
  images: GalleryImage[];
};
export type GroupChild = {
  kind: "gallery" | "ribbon" | "film";
  title: string;
  text: string;
  productIds: string[];
  gallery: GalleryDraft;
};

const MODES: { id: GalleryDraft["mode"]; label: string }[] = [
  { id: "full", label: "عرض الشاشة" },
  { id: "two", label: "صورتان" },
  { id: "three", label: "ثلاث صور" },
  { id: "mosaic", label: "فسيفساء" },
  { id: "marquee", label: "شريط متحرك" },
  { id: "pager", label: "تقليب" },
];

const SHAPES: { id: string; label: string }[] = [
  { id: "banner", label: "بنر" },
  { id: "rounded", label: "ناعم" },
  { id: "rect", label: "حاد" },
  { id: "circle", label: "دائري" },
  { id: "arch", label: "قوس" },
  { id: "square", label: "مربع" },
];

export const GROUP_COLORS = ["#FFF5F8", "#F3FAF7", "#F4F7FB", "#F7F3FB", "#FBF7F0", "#F6F1EA", "#FFFFFF", "#2C272B"];
export const GROUP_PATTERNS: { id: string; label: string }[] = [
  { id: "none", label: "بدون نقش" },
  { id: "dots", label: "نقاط" },
  { id: "lines", label: "خطوط" },
  { id: "diamonds", label: "معينات" },
  { id: "waves", label: "موجات" },
  { id: "grid", label: "شبكة" },
  { id: "rings", label: "حلقات" },
  { id: "petals", label: "بتلات" },
];

export function emptyGallery(): GalleryDraft {
  return { mode: "full", shape: "banner", speed: 4, gap: 10, overlay: "bottom", reverse: false, images: [] };
}

export function emptyChild(kind: GroupChild["kind"] = "gallery"): GroupChild {
  return { kind, title: "", text: "", productIds: [], gallery: emptyGallery() };
}

export function GalleryEditor({
  value,
  accent,
  onChange,
}: {
  value: GalleryDraft;
  accent: string;
  onChange: (next: GalleryDraft) => void;
}) {
  const addImage = (id: string | null) => {
    if (!id || value.images.some((image) => image.id === id)) return;
    onChange({ ...value, images: [...value.images, { id, title: "" }] });
  };
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ChoiceRow
        accent={accent}
        options={MODES}
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode: mode as GalleryDraft["mode"] })}
      />
      <ChoiceRow accent={accent} options={SHAPES} value={value.shape} onChange={(shape) => onChange({ ...value, shape })} />
      <ChoiceRow
        accent={accent}
        options={[
          { id: "bottom", label: "عنوان على الصورة" },
          { id: "none", label: "بدون عنوان فوقها" },
        ]}
        value={value.overlay}
        onChange={(overlay) => onChange({ ...value, overlay: overlay as GalleryDraft["overlay"] })}
      />
      {value.mode === "marquee" || value.mode === "pager" ? (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            {value.mode === "pager" ? "سرعة التقليب" : "سرعة الحركة"}
            <Input
              type="number"
              min={1}
              max={10}
              value={value.speed}
              onChange={(e) => onChange({ ...value, speed: Number(e.target.value) || 4 })}
              style={{ width: 90, marginInlineStart: 8 }}
            />
          </label>
          {value.mode === "marquee" ? (
            <label>
              <input type="checkbox" checked={value.reverse} onChange={(e) => onChange({ ...value, reverse: e.target.checked })} /> عكس الاتجاه
            </label>
          ) : null}
        </div>
      ) : null}
      <LayoutPreview mode={value.mode} count={Math.max(value.images.length, value.mode === "three" ? 3 : 2)} accent={accent} />
      <div style={{ display: "grid", gap: 8 }}>
        {value.images.map((image, index) => (
          <div key={`${image.id}-${index}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <MediaThumb id={image.id} />
            <span style={{ width: 22, fontWeight: 800 }}>{index + 1}</span>
            <Input
              value={image.title}
              placeholder="عنوان اختياري"
              onChange={(e) => {
                const images = value.images.slice();
                images[index] = { ...image, title: e.target.value };
                onChange({ ...value, images });
              }}
            />
            <Button size="small" disabled={index === 0} onClick={() => onChange({ ...value, images: move(value.images, index, -1) })}>قبل</Button>
            <Button size="small" disabled={index === value.images.length - 1} onClick={() => onChange({ ...value, images: move(value.images, index, 1) })}>بعد</Button>
            <Button size="small" danger onClick={() => onChange({ ...value, images: value.images.filter((_, i) => i !== index) })}>حذف</Button>
          </div>
        ))}
      </div>
      <MediaPicker label="إضافة صورة" purpose="BANNER" onChange={addImage} />
    </div>
  );
}

export function GroupEditor({
  colors,
  pattern,
  children,
  accent,
  onColors,
  onChildren,
}: {
  colors: string;
  pattern: string;
  children: GroupChild[];
  accent: string;
  onColors: (color: string, pattern: string) => void;
  onChildren: (children: GroupChild[]) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {GROUP_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColors(color, pattern)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 99,
              background: color,
              border: colors === color ? `2px solid ${accent}` : "1px solid #ddd",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: 72,
          borderRadius: 16,
          backgroundColor: colors,
          border: "1px solid #eadfe4",
          backgroundImage: patternPreview(pattern, colors),
          backgroundSize: pattern === "grid" ? "18px 18px" : pattern === "rings" ? "28px 28px" : "16px 16px",
        }}
      />
      <ChoiceRow accent={accent} options={GROUP_PATTERNS} value={pattern} onChange={(next) => onColors(colors, next)} />
      <label>
        لون مخصص
        <Input value={colors} onChange={(e) => onColors(e.target.value, pattern)} style={{ width: 120, marginInlineStart: 8 }} />
      </label>
      {children.map((child, index) => (
        <div key={index} style={{ border: "1px solid #eadfe4", borderRadius: 16, padding: 12, display: "grid", gap: 8 }}>
          <Space>
            <strong>القسم {index + 1}</strong>
            <Button size="small" danger onClick={() => onChildren(children.filter((_, i) => i !== index))}>إزالة</Button>
          </Space>
          <ChoiceRow
            accent={accent}
            options={[
              { id: "gallery", label: "صور" },
              { id: "ribbon", label: "جملة" },
              { id: "film", label: "منتجات متحركة" },
            ]}
            value={child.kind}
            onChange={(kind) => {
              const next = children.slice();
              next[index] = { ...child, kind: kind as GroupChild["kind"] };
              onChildren(next);
            }}
          />
          <Input
            value={child.title}
            placeholder="عنوان القسم داخل المجموعة"
            onChange={(e) => {
              const next = children.slice();
              next[index] = { ...child, title: e.target.value };
              onChildren(next);
            }}
          />
          {child.kind === "ribbon" ? (
            <Input.TextArea
              value={child.text}
              rows={2}
              placeholder="نص الشريط"
              onChange={(e) => {
                const next = children.slice();
                next[index] = { ...child, text: e.target.value };
                onChildren(next);
              }}
            />
          ) : null}
          {child.kind === "gallery" ? (
            <GalleryEditor
              accent={accent}
              value={child.gallery}
              onChange={(gallery) => {
                const next = children.slice();
                next[index] = { ...child, gallery };
                onChildren(next);
              }}
            />
          ) : null}
          {child.kind === "film" ? (
            <FilmPick
              accent={accent}
              ids={child.productIds}
              onChange={(productIds) => {
                const next = children.slice();
                next[index] = { ...child, productIds };
                onChildren(next);
              }}
            />
          ) : null}
        </div>
      ))}
      {children.length < 3 ? (
        <Button onClick={() => onChildren([...children, emptyChild()])}>إضافة قسم داخل المجموعة</Button>
      ) : null}
    </div>
  );
}

export function galleryPayload(gallery: GalleryDraft) {
  const full = gallery.mode === "full";
  const display =
    gallery.mode === "two" || gallery.mode === "three"
      ? "grid"
      : gallery.mode === "mosaic"
        ? "mosaic"
        : gallery.mode === "pager"
          ? "pager"
          : gallery.mode === "marquee"
            ? "marquee"
            : "stack";
  return {
    display,
    columns: gallery.mode === "three" ? 3 : 2,
    shape: gallery.shape,
    aspectRatio: full || gallery.mode === "pager" || gallery.mode === "mosaic" ? "16:9" : gallery.shape === "circle" || gallery.shape === "square" ? "1:1" : "4:5",
    fullBleed: full,
    tilesPerView: full || gallery.mode === "pager" ? 1 : undefined,
    marqueeSpeed: gallery.speed,
    motion: gallery.reverse ? "reverse" : "forward",
    overlayStyle: gallery.overlay,
    gap: gallery.gap || 10,
    showTitle: false,
    showShadow: true,
    items: gallery.images.filter((image) => image.id).map((image) => ({ imageId: image.id, title: image.title })),
  };
}

function MediaThumb({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["media-thumb", id],
    queryFn: () => queries.mediaById(id),
    staleTime: 60_000,
  });
  const url = mediaThumb(query.data, "thumb");
  return (
    <div style={{ width: 72, height: 48, borderRadius: 8, overflow: "hidden", background: "#f3eef1", flex: "0 0 auto" }}>
      {url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
    </div>
  );
}

function LayoutPreview({ mode, count, accent }: { mode: GalleryDraft["mode"]; count: number; accent: string }) {
  const cells = Array.from({ length: Math.min(count, 6) });
  const box = (flex: number, key: number) => (
    <div key={key} style={{ flex, height: mode === "full" || mode === "pager" ? 42 : 28, borderRadius: 6, background: accent, opacity: 0.35 + (key % 2) * 0.2 }} />
  );
  if (mode === "full" || mode === "pager") {
    return <div style={{ display: "grid", gap: 6 }}>{cells.slice(0, mode === "pager" ? 1 : 3).map((_, i) => box(1, i))}</div>;
  }
  if (mode === "three") return <div style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map((i) => box(1, i))}</div>;
  if (mode === "mosaic") {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        {box(1, 0)}
        <div style={{ display: "flex", gap: 6 }}>{box(1, 1)}{box(1, 2)}</div>
      </div>
    );
  }
  return <div style={{ display: "flex", gap: 6 }}>{cells.slice(0, 4).map((_, i) => box(1, i))}</div>;
}

function FilmPick({ ids, accent, onChange }: { ids: string[]; accent: string; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const query = useQuery({
    queryKey: ["group-film", search],
    enabled: search.trim().length >= 2,
    queryFn: () => queries.products({ search, limit: 24, page: 1 }),
  });
  const rows = (query.data?.data ?? []) as { id: string; name?: string; nameAr?: string; images?: Array<{ media?: unknown }> }[];
  useEffect(() => {
    if (!rows.length) return;
    setNames((prev) => {
      const next = { ...prev };
      for (const row of rows) next[row.id] = row.nameAr || row.name || "منتج";
      return next;
    });
  }, [query.data]);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Input value={search} placeholder="ابحثي عن منتج" onChange={(e) => setSearch(e.target.value)} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ids.map((id, index) => (
          <button key={id} type="button" onClick={() => onChange(ids.filter((item) => item !== id))} style={{ borderRadius: 99, border: `1px solid ${accent}`, background: "#fff", padding: "4px 8px" }}>
            {index + 1}. {names[id] || "منتج"} ×
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
        {rows.map((row) => {
          const cover = productCoverUrl(row);
          const on = ids.includes(row.id);
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onChange(on ? ids.filter((id) => id !== row.id) : [...ids, row.id])}
              style={{ borderRadius: 12, border: on ? `2px solid ${accent}` : "1px solid #eadfe4", background: "#fff", padding: 4, textAlign: "start" }}
            >
              <div style={{ height: 72, borderRadius: 8, background: "#f6f3f4", overflow: "hidden" }}>
                {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceRow({
  options,
  value,
  accent,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  accent: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          style={{
            borderRadius: 999,
            border: value === option.id ? `1px solid ${accent}` : "1px solid #eadfe4",
            background: value === option.id ? accent : "#fff",
            color: value === option.id ? "#fff" : "#2C272B",
            padding: "6px 10px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function patternPreview(pattern: string, color: string) {
  const ink = color.toLowerCase() === "#2c272b" ? "rgba(255,255,255,0.35)" : "rgba(44,39,43,0.18)";
  if (pattern === "dots") return `radial-gradient(${ink} 1.5px, transparent 1.6px)`;
  if (pattern === "lines") return `repeating-linear-gradient(135deg, transparent, transparent 8px, ${ink} 8px, ${ink} 9px)`;
  if (pattern === "grid") return `linear-gradient(${ink} 1px, transparent 1px), linear-gradient(90deg, ${ink} 1px, transparent 1px)`;
  if (pattern === "rings") return `radial-gradient(circle, transparent 5px, ${ink} 6px, transparent 7px)`;
  if (pattern === "waves") return `repeating-radial-gradient(circle at 0 0, transparent 0 10px, ${ink} 11px 12px)`;
  if (pattern === "diamonds" || pattern === "petals") return `radial-gradient(${ink} 2px, transparent 2.5px)`;
  return undefined;
}

function move<T>(list: T[], index: number, dir: number) {
  const next = list.slice();
  const target = index + dir;
  if (target < 0 || target >= next.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}
