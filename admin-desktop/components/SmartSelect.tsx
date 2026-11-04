"use client";

import { Select } from "antd";
import type { SelectProps } from "antd";
import { isValidElement, type ReactNode } from "react";
import { smartScore } from "@/lib/smartSearch";

/** نص عنصر React — لعناوين الخيارات التي تحتوي صوراً أو وسوماً. */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join(" ");
  if (isValidElement(node)) return nodeText((node.props as { children?: ReactNode }).children);
  return "";
}

/**
 * النصوص التي يُبحث فيها لكل خيار: حقل `search` الإضافي (مثل الاسم الإنجليزي والرابط)
 * ثم العنوان المعروض.
 */
function optionTexts(option: any, filterProp?: string | string[]): string[] {
  if (!option) return [];
  const out: string[] = [];
  for (const extra of [option.search, option.searchLabel]) {
    if (Array.isArray(extra)) out.push(...extra.filter(Boolean).map(String));
    else if (extra) out.push(String(extra));
  }
  const props = filterProp ? (Array.isArray(filterProp) ? filterProp : [filterProp]) : ["label", "children"];
  for (const p of props) {
    const t = nodeText(option[p]);
    if (t) out.push(t);
  }
  if (!out.length && typeof option.value === "string") out.push(option.value);
  return out;
}

/**
 * Select مع بحث ذكي: عربي/إنجليزي، بلا همزات وتشكيل، أي جزء من الاسم وبأي ترتيب،
 * تقارب النطق (لوريال ↔ loreal) وتسامح مع الأخطاء الإملائية، والأقرب أولاً.
 * إن مرّر المستدعي `filterOption` خاصاً (مثل بحث الخادم) يبقى كما هو.
 */
export default function SmartSelect(props: SelectProps<any, any>) {
  const { showSearch, filterOption, filterSort, optionFilterProp, ...rest } = props;
  const config = typeof showSearch === "object" ? showSearch : {};
  if (showSearch === false || filterOption !== undefined || config.filterOption !== undefined) {
    return <Select {...props} />;
  }
  const prop = config.optionFilterProp ?? optionFilterProp;
  return (
    <Select
      {...rest}
      showSearch={{
        ...config,
        filterOption: (input, option) => smartScore(input, optionTexts(option, prop)) > 0,
        filterSort:
          config.filterSort ??
          filterSort ??
          ((a, b, { searchValue }) =>
            searchValue ? smartScore(searchValue, optionTexts(b, prop)) - smartScore(searchValue, optionTexts(a, prop)) : 0),
      }}
    />
  );
}
