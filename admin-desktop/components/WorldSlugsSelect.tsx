"use client";

import { useQuery } from "@tanstack/react-query";
import { Select } from "antd";
import { queries } from "@/lib/queries";

/** اختيار العوالم التي يظهر فيها العنصر — فارغ = كل العوالم. */
export function WorldSlugsSelect({
  value,
  onChange,
}: {
  value?: string[];
  onChange?: (v: string[]) => void;
}) {
  const { data: worlds } = useQuery({ queryKey: ["worlds-manage"], queryFn: queries.worldsManage });
  return (
    <Select
      mode="multiple"
      allowClear
      value={value ?? []}
      onChange={onChange}
      placeholder="كل العوالم"
      optionFilterProp="label"
      options={((worlds as any[]) ?? []).map((w) => ({
        value: w.slug,
        label: w.nameAr,
        color: w.accentColor,
      }))}
      optionRender={(o) => (
        <span>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 5,
              background: (o.data as any).color,
              marginInlineEnd: 8,
            }}
          />
          {o.label}
        </span>
      )}
    />
  );
}
