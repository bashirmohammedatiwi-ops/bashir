"use client";

import { Button, Input, Segmented, Space, message } from "antd";
import { useState } from "react";
import { AiImageSearchGrid } from "./AiImageSearchGrid";
import { aiSearchImages } from "@/lib/aiProductApi";
import { catalogThumbToImage, enrichBarcodeFromCatalog, mergeUniqueImages } from "@/lib/aiCatalogEnrich";
import type { AiAutofillImage } from "@/lib/aiProductTypes";
import { normalizeBarcode } from "@/lib/barcode";

type Mode = "barcode" | "name" | "catalog";

type Props = {
  barcode: string;
  nameHints?: string[];
  images: AiAutofillImage[];
  selected: Set<string>;
  onImagesChange: (images: AiAutofillImage[]) => void;
  onToggle: (url: string) => void;
};

export function AiImageSearchPanel({
  barcode,
  nameHints = [],
  images,
  selected,
  onImagesChange,
  onToggle,
}: Props) {
  const [mode, setMode] = useState<Mode>("barcode");
  const [query, setQuery] = useState(nameHints.filter(Boolean).join(" "));
  const [loading, setLoading] = useState(false);

  const runSearch = async (forcedMode?: Mode) => {
    const bc = normalizeBarcode(barcode);
    if (bc.length < 6) {
      message.warning("أدخل باركود صالح أولاً");
      return;
    }
    const active = forcedMode ?? mode;
    setLoading(true);
    try {
      if (active === "catalog") {
        const hit = await enrichBarcodeFromCatalog(bc);
        if (!hit) {
          message.info("لم يُعثر على المنتج في المتاجر");
          return;
        }
        const img = catalogThumbToImage(hit);
        if (!img) {
          message.info("لا توجد صورة في نتيجة المتجر");
          return;
        }
        onImagesChange(mergeUniqueImages(images, [img]));
        onToggle(img.url);
        return;
      }

      const hint = query.trim() || nameHints.filter(Boolean).join(" ");
      const hits = await aiSearchImages({
        barcode: bc,
        mode: active === "name" ? "name" : "barcode",
        query: active === "name" ? hint : undefined,
        nameHint: hint,
      });
      onImagesChange(mergeUniqueImages(images, hits));
      if (hits.length && !selected.size) onToggle(hits[0].url);
    } catch (e) {
      message.error((e as Error).message || "فشل جلب الصور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Segmented
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        options={[
          { label: "باركود (مثل Google)", value: "barcode" },
          { label: "بالاسم", value: "name" },
          { label: "متاجر", value: "catalog" },
        ]}
      />
      <Space.Compact style={{ width: "100%" }}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "barcode" ? "تلميح اختياري لتحسين نتائج الباركود" : "اسم المنتج للبحث"}
          onPressEnter={() => runSearch()}
        />
        <Button type="primary" onClick={() => runSearch()} loading={loading}>
          بحث
        </Button>
      </Space.Compact>
      <AiImageSearchGrid images={images} selected={selected} onToggle={onToggle} loading={loading} />
      <div style={{ color: "#8a8194", fontSize: 13 }}>
        محدد: {selected.size} · معروض: {images.length}
      </div>
    </Space>
  );
}
