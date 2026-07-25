"use client";

import { Select, Typography } from "antd";
import { useMemo, useState } from "react";
import { EntityMultiPicker } from "./EntityMultiPicker";
import {
  buildCategoryCatalog,
  catalogPickerItems,
  type CategoryLevel,
  type CatalogCategory,
} from "./category-catalog";

const { Text } = Typography;

type RawCat = Parameters<typeof buildCategoryCatalog>[0][number];

type Props = {
  categories?: RawCat[];
  subcategories?: RawCat[];
  tertiary?: RawCat[];
  value?: string[];
  onChange?: (ids: string[]) => void;
  max?: number;
  placeholder?: string;
};

export function CategoryCatalogPicker({
  categories = [],
  subcategories = [],
  tertiary = [],
  value,
  onChange,
  max,
  placeholder = "ابحث عن قسم رئيسي، فرعي، أو ثانوي...",
}: Props) {
  const [level, setLevel] = useState<"all" | CategoryLevel>("all");

  const catalog = useMemo(
    () => buildCategoryCatalog(categories, subcategories, tertiary),
    [categories, subcategories, tertiary],
  );

  const filteredCatalog = useMemo(() => {
    if (level === "all") return catalog;
    return catalog.filter((c) => c.level === level);
  }, [catalog, level]);

  const pickerItems = useMemo(() => catalogPickerItems(filteredCatalog), [filteredCatalog]);

  const counts = useMemo(
    () => ({
      root: catalog.filter((c) => c.level === "root").length,
      sub: catalog.filter((c) => c.level === "sub").length,
      tertiary: catalog.filter((c) => c.level === "tertiary").length,
    }),
    [catalog],
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          المستوى:
        </Text>
        <Select
          size="small"
          value={level}
          onChange={setLevel}
          style={{ minWidth: 160 }}
          options={[
            { value: "all", label: `الكل (${catalog.length})` },
            { value: "root", label: `رئيسي (${counts.root})` },
            { value: "sub", label: `فرعي (${counts.sub})` },
            { value: "tertiary", label: `ثانوي (${counts.tertiary})` },
          ]}
        />
      </div>
      <EntityMultiPicker
        items={pickerItems}
        value={value}
        onChange={onChange}
        max={max}
        placeholder={placeholder}
      />
    </div>
  );
}

export type { CatalogCategory };
