"use client";

import { useState } from "react";
import { Button, Tag } from "antd";
import {
  AppstoreOutlined,
  BgColorsOutlined,
  CheckOutlined,
  PictureOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { CatalogImportOption } from "@/lib/catalogImport";
import { resolveCatalogImageUrl } from "@/lib/resolveCatalogImageUrl";

export const STORE_COLORS: Record<string, string> = {
  miswag: "#df1c24",
  najdalatheyah: "#511952",
};

/** لون ثابت تلقائي للمتاجر المستقبلية غير المعرّفة في STORE_COLORS */
const AUTO_COLORS = ["#0958d9", "#08979c", "#d46b08", "#531dab", "#c41d7f", "#3f6600"];

export function storeColor(storeId: string): string {
  if (STORE_COLORS[storeId]) return STORE_COLORS[storeId];
  let hash = 0;
  for (let i = 0; i < storeId.length; i++) hash = (hash * 31 + storeId.charCodeAt(i)) | 0;
  return AUTO_COLORS[Math.abs(hash) % AUTO_COLORS.length];
}

type Props = {
  option: CatalogImportOption;
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

export function CatalogOptionCard({ option, selected, onSelect }: Props) {
  const shadeCount = option.shadeCount ?? 0;

  return (
    <article
      className={`catalog-option-row${selected ? " selected" : ""}`}
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
        <CatalogThumb src={option.thumb || ""} alt={option.nameAr} />
      </div>

      <div className="catalog-option-row-main">
        <div className="catalog-option-row-top">
          <Tag className="catalog-option-row-store" color={storeColor(option.store)}>
            {option.storeLabel}
          </Tag>
          {(option.matchType === "barcode" || option.matchType === "ean" || option.matchType === "index" || option.matchType === "hint" || option.matchType === "sku") && (
            <Tag color="blue">باركود EAN</Tag>
          )}
          {option.matchType === "miswag_id" || option.matchType === "miswag_product" || option.matchType === "miswag_shade" ? (
            <Tag color="orange">رقم مسواگ</Tag>
          ) : null}
          {shadeCount > 1 && (
            <Tag icon={<BgColorsOutlined />} color="purple">
              {shadeCount} تدرج
            </Tag>
          )}
        </div>

        <h4 className="catalog-option-row-title">{option.nameAr}</h4>
        {option.nameEn && option.nameEn !== option.nameAr && (
          <p className="catalog-option-row-sub">{option.nameEn}</p>
        )}
        {option.brandAr && <p className="catalog-option-row-brand">{option.brandAr}</p>}
        {option.category && <p className="catalog-option-row-category">{option.category}</p>}
        {option.price && <p className="catalog-option-row-price">{option.price}</p>}
      </div>

      <div className="catalog-option-row-action">
        {selected ? (
          <CheckOutlined className="catalog-option-check" />
        ) : (
          <>
            <PictureOutlined />
            <RightOutlined />
          </>
        )}
      </div>
    </article>
  );
}
