"use client";

import { useState } from "react";
import { Button, Tag, Tooltip } from "antd";
import {
  AppstoreOutlined,
  BgColorsOutlined,
  CheckOutlined,
  PictureOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { CatalogImportOption, CatalogImportSummary } from "@/lib/catalogImport";
import { resolveCatalogImageUrl } from "@/lib/resolveCatalogImageUrl";

const STORE_COLORS: Record<string, string> = {
  niceone: "#e91e63",
  elryan: "#1976d2",
  miraaya: "#00897b",
  faces: "#212121",
  amazon: "#ff9900",
  miswag: "#df1c24",
  orisdi: "#02c0ef",
  beautyway: "#8b2c9e",
  vaneersa: "#5b8666",
  najd: "#8b6914",
};

type Props = {
  option: CatalogImportOption;
  summary?: CatalogImportSummary | null;
  summaryLoading?: boolean;
  selected?: boolean;
  onSelect: (option: CatalogImportOption) => void;
};

function CatalogThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveCatalogImageUrl(src);

  if (!resolved || failed) {
    return (
      <div className="catalog-option-thumb-placeholder">
        <AppstoreOutlined />
      </div>
    );
  }

  return (
    <img
      className="catalog-option-thumb"
      src={resolved}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function CatalogOptionCard({
  option,
  summary,
  summaryLoading,
  selected,
  onSelect,
}: Props) {
  const thumb = summary?.thumb || option.thumb || "";
  const imageCount = summary?.imageCount ?? option.imageCount;
  const shadeCount = summary?.shadeCount ?? option.shadeCount ?? 0;
  const categoryHint = summary?.categoryHint || option.categoryHint || "";
  const brand = summary?.brandAr || option.brandAr;
  const nameAr = summary?.nameAr || option.nameAr;
  const nameEn = summary?.nameEn || option.nameEn;

  const categoryText = Array.isArray(categoryHint)
    ? categoryHint.join(" › ")
    : String(categoryHint || "").trim();

  return (
    <article
      className={`catalog-option-row${selected ? " selected" : ""}${summaryLoading ? " loading" : ""}`}
      onClick={() => onSelect(option)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(option);
        }
      }}
    >
      <div className="catalog-option-row-thumb">
        <CatalogThumb src={thumb} alt={nameAr} />
      </div>

      <div className="catalog-option-row-main">
        <div className="catalog-option-row-top">
          <Tag className="catalog-option-row-store" color={STORE_COLORS[option.store] || "default"}>
            {option.storeLabel}
          </Tag>
          {brand && <span className="catalog-option-row-brand">{brand}</span>}
          {summaryLoading && <span className="catalog-option-row-loading">جاري التحميل...</span>}
        </div>

        <div className="catalog-option-row-title">{nameAr}</div>
        {nameEn && nameEn !== nameAr && (
          <div className="catalog-option-row-subtitle" dir="ltr">
            {nameEn}
          </div>
        )}

        <div className="catalog-option-row-meta">
          {categoryText && !summaryLoading && (
            <span className="catalog-option-row-category">{categoryText}</span>
          )}
          {imageCount != null && imageCount > 0 && (
            <Tooltip title="عدد الصور">
              <Tag bordered={false} className="catalog-option-pill" icon={<PictureOutlined />}>
                {imageCount}
              </Tag>
            </Tooltip>
          )}
          {shadeCount > 0 && (
            <Tooltip title="التدرجات اللونية">
              <Tag bordered={false} className="catalog-option-pill catalog-option-pill--shade" icon={<BgColorsOutlined />}>
                {shadeCount}
              </Tag>
            </Tooltip>
          )}
          {option.shadeName && shadeCount === 0 && (
            <Tag bordered={false} className="catalog-option-pill">
              {option.shadeName}
            </Tag>
          )}
          <span className="catalog-option-row-barcode" dir="ltr">
            {option.barcode || "—"}
          </span>
        </div>
      </div>

      <div className="catalog-option-row-action">
        <Button
          type={selected ? "primary" : "default"}
          size="small"
          icon={selected ? <CheckOutlined /> : <RightOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(option);
          }}
        >
          {selected ? "محدد" : "اختيار"}
        </Button>
      </div>
    </article>
  );
}

export { STORE_COLORS };
