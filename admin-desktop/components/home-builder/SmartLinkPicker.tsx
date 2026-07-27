"use client";

import { AutoComplete, Form, Input, Space, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { queries } from "@/lib/queries";
import { paginatedItems } from "@/lib/paginated";
import {
  LINK_TARGET_TYPES,
  LinkTargetType,
  QUICK_LINK_PRESETS,
  buildAppLinkPath,
  linkTargetLabel,
} from "./link-target";
import { LinkPreviewChip } from "./LinkPreviewChip";
import { QuickLinkBar } from "./QuickLinkBar";

type EntityLists = {
  products?: any[];
  categories?: any[];
  subcategories?: any[];
  tertiary?: any[];
  brands?: any[];
  packages?: any[];
  skinConcerns?: any[];
};

type SearchHit = {
  key: string;
  linkType: LinkTargetType;
  linkValue: string;
  label: string;
  hint?: string;
  icon: string;
  searchText: string;
};

type Props = {
  prefix?: (string | number)[];
  entities: EntityLists;
  optional?: boolean;
  compact?: boolean;
  showQuickBar?: boolean;
  showPreview?: boolean;
  showAdvanced?: boolean;
  minimal?: boolean;
};

function namePath(prefix: (string | number)[], field: string) {
  return prefix.length ? [...prefix, field] : field;
}

function norm(s: unknown) {
  return String(s ?? "")
    .toLowerCase()
    .trim();
}

function includesAll(hay: string, q: string) {
  const parts = q.split(/\s+/).filter(Boolean);
  return parts.every((p) => hay.includes(p));
}

function productKey(p: any) {
  return p.slug?.trim() || p.id;
}

function productHits(products: any[]): SearchHit[] {
  return (products ?? []).map((p) => {
    const name = p.name ?? p.id;
    const brand = p.brand?.name ?? "";
    const barcode = p.barcode ? ` · ${p.barcode}` : "";
    const sku = p.sku ? ` · SKU ${p.sku}` : "";
    return {
      key: `product:${productKey(p)}`,
      linkType: "product",
      linkValue: productKey(p),
      icon: "🛍️",
      label: brand ? `${name} — ${brand}` : name,
      hint: `${barcode}${sku}`.trim() || undefined,
      searchText: [name, brand, p.slug, p.id, p.sku, p.barcode].filter(Boolean).join(" "),
    };
  });
}

function localHits(
  q: string,
  entities: EntityLists,
): SearchHit[] {
  const out: SearchHit[] = [];
  if (!q) return out;

  for (const c of entities.categories ?? []) {
    if (!c.parentId) {
      const label = c.name ?? c.id;
      const searchText = [label, c.slug, c.id].filter(Boolean).join(" ");
      if (includesAll(norm(searchText), q)) {
        out.push({
          key: `category:${c.id}`,
          linkType: "category",
          linkValue: c.id,
          icon: "📁",
          label,
          searchText,
        });
      }
    }
  }

  for (const c of entities.subcategories ?? []) {
    const label = c.parent?.name ? `${c.parent.name} › ${c.name}` : (c.name ?? c.id);
    const searchText = [c.parent?.name, c.name, c.slug, c.id].filter(Boolean).join(" ");
    if (includesAll(norm(searchText), q)) {
      out.push({
        key: `subcategory:${c.id}`,
        linkType: "subcategory",
        linkValue: c.id,
        icon: "📂",
        label,
        searchText,
      });
    }
  }

  for (const c of entities.tertiary ?? []) {
    const label = c.name ?? c.id;
    const searchText = [label, c.slug, c.id].filter(Boolean).join(" ");
    if (includesAll(norm(searchText), q)) {
      out.push({
        key: `tertiary:${c.id}`,
        linkType: "tertiary",
        linkValue: c.id,
        icon: "🗂️",
        label,
        searchText,
      });
    }
  }

  for (const b of entities.brands ?? []) {
    const label = b.name ?? b.slug ?? b.id;
    const searchText = [label, b.slug, b.id].filter(Boolean).join(" ");
    if (includesAll(norm(searchText), q)) {
      out.push({
        key: `brand:${b.slug || b.id}`,
        linkType: "brand",
        linkValue: b.id,
        icon: "🏷️",
        label,
        searchText,
      });
    }
  }

  for (const p of entities.packages ?? []) {
    const label = p.name ?? p.slug ?? p.id;
    const searchText = [label, p.slug, p.id].filter(Boolean).join(" ");
    if (includesAll(norm(searchText), q)) {
      out.push({
        key: `package:${p.slug || p.id}`,
        linkType: "package",
        linkValue: p.id || p.slug,
        icon: "🎁",
        label,
        searchText,
      });
    }
  }

  for (const c of entities.skinConcerns ?? []) {
    const label = c.name ?? c.slug ?? c.id;
    const searchText = [label, c.slug, c.id].filter(Boolean).join(" ");
    if (includesAll(norm(searchText), q)) {
      out.push({
        key: `skinConcern:${c.slug || c.id}`,
        linkType: "skinConcern",
        linkValue: c.slug || c.id,
        icon: "✨",
        label,
        searchText,
      });
    }
  }

  for (const preset of QUICK_LINK_PRESETS) {
    const searchText = `${preset.label} ${preset.linkType} ${preset.linkValue ?? ""}`;
    if (includesAll(norm(searchText), q)) {
      out.push({
        key: `preset:${preset.id}`,
        linkType: preset.linkType,
        linkValue: preset.linkValue ?? "",
        icon: preset.icon,
        label: preset.label,
        searchText,
      });
    }
  }

  return out.slice(0, 12);
}

export function SmartLinkPicker({
  prefix = [],
  entities,
  optional = true,
  compact = false,
  showQuickBar = !compact,
  showPreview = !compact,
  showAdvanced = !compact,
  minimal = false,
}: Props) {
  const form = Form.useFormInstance();
  const linkType = Form.useWatch(namePath(prefix, "linkType"), form) as string | undefined;
  const linkValue = Form.useWatch(namePath(prefix, "linkValue"), form) as string | undefined;
  const legacyLink = Form.useWatch(namePath(prefix, "link"), form) as string | undefined;

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const isBarcodeQuery = /^\d{4,}$/.test(debounced);
  const minSearch = isBarcodeQuery ? 4 : 2;

  const { data: searchResult, isFetching } = useQuery({
    queryKey: ["smart-link-products", debounced],
    queryFn: () =>
      queries.products({
        search: debounced,
        limit: 25,
        lite: 1,
        status: "all",
      }),
    enabled: debounced.length >= minSearch,
    staleTime: 30_000,
  });

  const remoteProducts: any[] = paginatedItems(searchResult);

  const options = useMemo(() => {
    const q = norm(debounced);
    const hits: SearchHit[] = [];

    if (q.length >= minSearch) {
      hits.push(...productHits(remoteProducts));
      hits.push(...localHits(q, entities));
    } else if (!q) {
      hits.push(
        ...QUICK_LINK_PRESETS.map((p) => ({
          key: `preset:${p.id}`,
          linkType: p.linkType,
          linkValue: p.linkValue ?? "",
          icon: p.icon,
          label: p.label,
          searchText: p.label,
        })),
      );
    }

    const seen = new Set<string>();
    const unique = hits.filter((h) => {
      const id = `${h.linkType}:${h.linkValue}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return unique.map((h) => ({
      value: h.key,
      label: (
        <div className="hb-smart-link-option">
          <span className="hb-smart-link-option-icon">{h.icon}</span>
          <span className="hb-smart-link-option-body">
            <span className="hb-smart-link-option-title">{h.label}</span>
            {h.hint ? <span className="hb-smart-link-option-hint">{h.hint}</span> : null}
          </span>
          <Tag className="hb-smart-link-option-tag">
            {LINK_TARGET_TYPES.find((t) => t.value === h.linkType)?.label ?? h.linkType}
          </Tag>
        </div>
      ),
      hit: h,
    }));
  }, [debounced, minSearch, remoteProducts, entities]);

  const currentLabel = linkTargetLabel(linkType, linkValue, entities);
  const currentPath = buildAppLinkPath(linkType, linkValue, legacyLink);

  const applyHit = (hit: SearchHit) => {
    form.setFieldValue(namePath(prefix, "linkType"), hit.linkType);
    form.setFieldValue(namePath(prefix, "linkValue"), hit.linkValue || undefined);
    form.setFieldValue(namePath(prefix, "link"), undefined);
    setQuery("");
  };

  const clearLink = () => {
    form.setFieldValue(namePath(prefix, "linkType"), undefined);
    form.setFieldValue(namePath(prefix, "linkValue"), undefined);
    form.setFieldValue(namePath(prefix, "link"), undefined);
    setQuery("");
  };

  return (
    <div className={`hb-smart-link${compact ? " hb-smart-link-compact" : ""}${minimal ? " hb-smart-link-minimal" : ""}`}>
      {showQuickBar && <QuickLinkBar prefix={prefix} />}

      {!minimal && (linkType || legacyLink) && (
        <div className="hb-smart-link-current">
          <Space wrap size={[6, 6]}>
            <Tag color={currentPath ? "blue" : "default"} className="hb-smart-link-current-tag">
              {currentLabel}
            </Tag>
            {currentPath ? (
              <Typography.Text type="secondary" dir="ltr" style={{ fontSize: 11 }}>
                {currentPath}
              </Typography.Text>
            ) : null}
            {optional && (
              <Typography.Link onClick={clearLink} style={{ fontSize: 12 }}>
                إزالة
              </Typography.Link>
            )}
          </Space>
        </div>
      )}

      <AutoComplete
        value={query}
        options={options}
        onSearch={setQuery}
        onSelect={(_, option) => {
          const hit = (option as { hit?: SearchHit }).hit;
          if (hit) applyHit(hit);
        }}
        placeholder={minimal ? "ابحث: منتج، قسم، براند..." : "ابحث: منتج، باركود، قسم، براند، باقة..."}
        notFoundContent={
          isFetching
            ? "جاري البحث..."
            : debounced.length >= minSearch
              ? "لا توجد نتائج"
              : isBarcodeQuery
                ? "أدخل 4 أرقام على الأقل للباركود"
                : "اكتب حرفين على الأقل — أو امسح الباركود"
        }
        style={{ width: "100%" }}
        popupMatchSelectWidth={compact ? 420 : 560}
      />

      {!minimal && (
        <Typography.Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
          بحث موحّد في المنتجات (اسم / SKU / باركود) + الأقسام والبراندات — يعمل في كل أقسام الصفحة
        </Typography.Text>
      )}

      {showPreview && <LinkPreviewChip prefix={prefix} entities={entities} />}

      <Form.Item name={namePath(prefix, "linkType")} hidden>
        <Input />
      </Form.Item>
      <Form.Item name={namePath(prefix, "linkValue")} hidden>
        <Input />
      </Form.Item>

      {showAdvanced && (
        <details className="hb-smart-link-advanced">
          <summary>تعديل يدوي لنوع الرابط</summary>
          <Typography.Text type="secondary" style={{ display: "block", margin: "8px 0" }}>
            النوع الحالي: {linkType || "—"} · القيمة: {linkValue || "—"}
          </Typography.Text>
        </details>
      )}
    </div>
  );
}
