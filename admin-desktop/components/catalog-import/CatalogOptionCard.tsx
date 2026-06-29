"use client";

import { Button, Skeleton, Tag, Tooltip } from "antd";
import {
  AppstoreOutlined,
  BgColorsOutlined,
  FolderOpenOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import type { CatalogImportOption, CatalogImportSummary } from "@/lib/catalogImport";
import { resolveCatalogImageUrl } from "@/lib/uploadFromUrl";

const STORE_COLORS: Record<string, string> = {
  niceone: "#e91e63",
  vanilla: "#9c27b0",
  elryan: "#1976d2",
  miraaya: "#00897b",
  faces: "#212121",
};

type Props = {
  option: CatalogImportOption;
  summary?: CatalogImportSummary | null;
  summaryLoading?: boolean;
  selected?: boolean;
  onSelect: (option: CatalogImportOption) => void;
};

export function CatalogOptionCard({
  option,
  summary,
  summaryLoading,
  selected,
  onSelect,
}: Props) {
  const thumb = summary?.thumb || option.thumb;
  const imageCount = summary?.imageCount;
  const shadeCount = summary?.shadeCount ?? 0;
  const categoryHint = summary?.categoryHint || "";
  const categoryHintEn = summary?.categoryHintEn || "";
  const brand = summary?.brandAr || option.brandAr;
  const nameAr = summary?.nameAr || option.nameAr;
  const nameEn = summary?.nameEn || option.nameEn;

  return (
    <article
      className={`catalog-option-card${selected ? " selected" : ""}${summaryLoading ? " loading-summary" : ""}`}
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
      <div className="catalog-option-thumb-wrap">
        <Tag className="catalog-option-store-badge" color={STORE_COLORS[option.store] || "default"}>
          {option.storeLabel}
        </Tag>
        {thumb ? (
          <img
            className="catalog-option-thumb"
            src={resolveCatalogImageUrl(thumb)}
            alt={nameAr}
            loading="lazy"
          />
        ) : (
          <div className="catalog-option-thumb-placeholder">
            <AppstoreOutlined />
          </div>
        )}
      </div>

      <div className="catalog-option-body">
        <div className="catalog-option-title">{nameAr}</div>
        {nameEn && <div className="catalog-option-subtitle">{nameEn}</div>}
        {brand && (
          <div className="catalog-option-subtitle" style={{ color: "#4a2466" }}>
            {brand}
          </div>
        )}

        {(categoryHint || categoryHintEn) && !summaryLoading && (
          <div className="catalog-option-category">
            <FolderOpenOutlined className="catalog-option-category-icon" />
            <span>
              {categoryHint || categoryHintEn}
              {categoryHint && categoryHintEn && categoryHint !== categoryHintEn ? (
                <span style={{ display: "block", opacity: 0.75, marginTop: 2 }}>{categoryHintEn}</span>
              ) : null}
            </span>
          </div>
        )}

        {summaryLoading && (
          <div style={{ display: "grid", gap: 6 }}>
            <div className="catalog-summary-skeleton" style={{ width: "90%" }} />
            <div className="catalog-summary-skeleton" style={{ width: "65%" }} />
          </div>
        )}

        <div className="catalog-option-meta">
          {summaryLoading ? (
            <>
              <Skeleton.Button active size="small" style={{ width: 72, height: 22 }} />
              <Skeleton.Button active size="small" style={{ width: 88, height: 22 }} />
            </>
          ) : (
            <>
              {imageCount != null && (
                <Tooltip title="عدد صور المنتج في الكتالوج">
                  <Tag icon={<PictureOutlined />} color="processing">
                    {imageCount} {imageCount === 1 ? "صورة" : "صور"}
                  </Tag>
                </Tooltip>
              )}
              {shadeCount > 0 && (
                <Tooltip title="عدد التدرجات اللونية">
                  <Tag icon={<BgColorsOutlined />} color="purple">
                    {shadeCount} {shadeCount === 1 ? "تدرج" : "تدرجات"}
                  </Tag>
                </Tooltip>
              )}
              {option.shadeName && shadeCount === 0 && (
                <Tag color="geekblue">{option.shadeName}</Tag>
              )}
            </>
          )}
        </div>
      </div>

      <div className="catalog-option-footer">
        <span className="catalog-option-barcode">{option.barcode || "—"}</span>
        <Button type={selected ? "primary" : "default"} size="small" onClick={(e) => {
          e.stopPropagation();
          onSelect(option);
        }}>
          {selected ? "محدد" : "اختيار"}
        </Button>
      </div>
    </article>
  );
}

export { STORE_COLORS };
