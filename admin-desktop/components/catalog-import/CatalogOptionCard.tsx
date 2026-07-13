"use client";

import { useState } from "react";
import { Tag } from "antd";
import {
  AppstoreOutlined,
  BgColorsOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { CatalogImportOption } from "@/lib/catalogImport";
import { isMiswagInternalId } from "@/lib/catalogImport";
import { resolveCatalogImageUrl } from "@/lib/resolveCatalogImageUrl";

export const STORE_COLORS: Record<string, string> = {
  miswag: "#df1c24",
  najdalatheyah: "#511952",
  alkhabeer: "#1a4d6d",
  elryan: "#0b6e4f",
  faces: "#c41e6b",
  miraaya: "#7b2d8e",
  beautyway: "#e91e8c",
  khaton: "#8b5a2b",
  orisdi: "#1a5f4a",
  waheteter: "#6b2d5c",
  niceone: "#e1306c",
  amazon: "#ff9900",
};

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
      <div className="ci-card-placeholder">
        <AppstoreOutlined />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function matchLabel(matchType?: string) {
  if (!matchType) return null;
  if (["barcode", "ean", "index", "hint", "sku", "v2_scan", "v2_shade"].includes(matchType)) {
    return { color: "blue" as const, text: "باركود" };
  }
  if (["miswag_id", "miswag_product", "miswag_shade"].includes(matchType)) {
    return { color: "orange" as const, text: "رقم مسواگ" };
  }
  return null;
}

export function CatalogOptionCard({ option, selected, onSelect }: Props) {
  const shadeCount = option.shadeCount ?? 0;
  const match = matchLabel(option.matchType);

  return (
    <article
      className={`ci-card${selected ? " is-selected" : ""}`}
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
      <div className="ci-card-media">
        <Tag className="ci-card-store" color={storeColor(option.store)}>
          {option.storeLabel}
        </Tag>
        {selected ? (
          <span className="ci-card-check">
            <CheckOutlined />
          </span>
        ) : null}
        <CatalogThumb src={option.thumb || ""} alt={option.nameAr} />
      </div>

      <div className="ci-card-body">
        {option.brandAr ? <p className="ci-card-brand">{option.brandAr}</p> : null}
        <h4 className="ci-card-title">{option.nameAr}</h4>
        {option.nameEn && option.nameEn !== option.nameAr ? (
          <p className="ci-card-sub alhayaa-ltr-input">{option.nameEn}</p>
        ) : null}

          {option.barcode && !isMiswagInternalId(option.barcode) ? (
            <p className="ci-card-sub alhayaa-ltr-input">باركود: {option.barcode}</p>
          ) : null}

        <div className="ci-card-meta">
          {match ? <Tag color={match.color}>{match.text}</Tag> : null}
          {shadeCount > 1 ? (
            <Tag icon={<BgColorsOutlined />} color="purple">
              {shadeCount} تدرج
            </Tag>
          ) : null}
          {option.category ? <Tag>{option.category}</Tag> : null}
        </div>

        <div className="ci-card-foot">
          {option.price ? <p className="ci-card-price">{option.price}</p> : <span />}
          <span className="ci-card-cta">{selected ? "محدد" : "استيراد"}</span>
        </div>
      </div>
    </article>
  );
}
