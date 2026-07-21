"use client";

import { Select, Spin, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { queries } from "@/lib/queries";

type ProductRow = {
  id: string;
  name?: string;
  slug?: string;
  sku?: string;
  barcode?: string;
  brand?: { name?: string };
};

type Option = { value: string; label: string; searchLabel: string; product: ProductRow };

function productKey(p: ProductRow) {
  return p.slug?.trim() || p.id;
}

function productLabel(p: ProductRow) {
  const name = p.name ?? p.id;
  const brand = p.brand?.name ?? "";
  const sku = p.sku ? ` · ${p.sku}` : "";
  return brand ? `${name} — ${brand}${sku}` : `${name}${sku}`;
}

function toOption(p: ProductRow): Option {
  return {
    value: productKey(p),
    label: productLabel(p),
    searchLabel: [p.name, p.slug, p.id, p.brand?.name, p.sku, p.barcode].filter(Boolean).join(" "),
    product: p,
  };
}

type Props = {
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  /** منتجات محمّلة مسبقاً للعرض السريع */
  seedProducts?: ProductRow[];
};

export function ProductSearchSelect({
  value,
  onChange,
  placeholder = "ابحث بالاسم، البراند، SKU، أو الباركود...",
  seedProducts = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 280);
    return () => clearTimeout(t);
  }, [search]);

  const { data: searchResult, isFetching } = useQuery({
    queryKey: ["product-search", debounced],
    queryFn: () =>
      queries.products({
        search: debounced || undefined,
        limit: 40,
        lite: 1,
        status: "all",
      }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  const searchItems: ProductRow[] = searchResult?.items ?? searchResult ?? [];

  const { data: resolvedProduct } = useQuery({
    queryKey: ["product-resolve", value],
    queryFn: async () => {
      if (!value) return null;
      const list = await queries.products({ search: value, limit: 5, lite: 1, status: "all" });
      const items: ProductRow[] = list?.items ?? list ?? [];
      return items.find((p) => productKey(p) === value || p.id === value || p.slug === value) ?? null;
    },
    enabled: Boolean(value) && debounced.length < 2,
    staleTime: 60_000,
  });

  const options = useMemo(() => {
    const map = new Map<string, Option>();
    for (const p of seedProducts) map.set(productKey(p), toOption(p));
    for (const p of searchItems) map.set(productKey(p), toOption(p));
    if (resolvedProduct) map.set(productKey(resolvedProduct), toOption(resolvedProduct));
    if (value && !map.has(value)) {
      map.set(value, { value, label: value, searchLabel: value, product: { id: value, name: value } });
    }
    return Array.from(map.values());
  }, [seedProducts, searchItems, resolvedProduct, value]);

  return (
    <div className="hb-product-search">
      <Select
        showSearch
        allowClear
        filterOption={false}
        value={value || undefined}
        placeholder={placeholder}
        notFoundContent={
          isFetching ? (
            <Spin size="small" />
          ) : debounced.length >= 2 ? (
            "لا توجد نتائج — جرّب كلمة أخرى"
          ) : (
            "اكتب حرفين على الأقل للبحث في كل المنتجات"
          )
        }
        options={options.map((o) => ({ value: o.value, label: o.label }))}
        onSearch={setSearch}
        onChange={(v) => onChange?.(v ?? undefined)}
        loading={isFetching}
        style={{ width: "100%" }}
        popupMatchSelectWidth={520}
      />
      <Typography.Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
        بحث مباشر في السيرفر — يعمل في كل أقسام الصور والروابط
      </Typography.Text>
    </div>
  );
}
