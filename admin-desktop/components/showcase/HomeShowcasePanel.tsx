"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Empty, Input, Select, Skeleton, Switch, Tag, Tooltip, message } from "antd";
import { useEffect, useState } from "react";
import { BLOCK_TYPE_LABELS, SHOWCASE_DISPLAYS } from "@/lib/beauty";
import { mutations, queries } from "@/lib/queries";

type Row = {
  world: { id: string; slug: string; nameAr: string; accentColor: string; isActive: boolean };
  shown: boolean;
  blockId: string | null;
  title: string;
  subtitle: string | null;
  display: string;
  afterBlockId: string | null;
  sections: { id: string; type: string; title: string | null; isActive: boolean }[];
  itemCount: number;
};

const NOUN: Record<string, string> = { skinGuide: "مشكلة", routines: "روتين", packages: "باقة" };

/**
 * «العرض في الصفحة الرئيسية»: لكل عالم — إظهار/إخفاء القسم، عنوانه، شكله، ومكانه بين أقسام رئيسيته.
 * التغيير يُحفظ فوراً ويظهر في التطبيق خلال ثوانٍ.
 */
export function HomeShowcasePanel({ kind, label }: { kind: "skinGuide" | "routines" | "packages"; label: string }) {
  const qc = useQueryClient();
  const key = ["showcase", kind];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => queries.showcase(kind) });
  const save = useMutation({
    mutationFn: ({ worldId, body }: { worldId: string; body: any }) => mutations.saveShowcase(kind, worldId, body),
    onSuccess: () => {
      message.success("تم الحفظ — يظهر في التطبيق خلال ثوانٍ");
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? "تعذر الحفظ"),
  });
  const rows = (data as Row[] | undefined) ?? [];

  return (
    <Card
      className="alhayaa-showcase"
      title={
        <div>
          <div style={{ fontWeight: 700 }}>🏠 العرض في الصفحة الرئيسية — {label}</div>
          <div style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>
            لكل عالم قسمه الخاص: شغّليه أو أطفئيه، غيّري العنوان والشكل ومكانه بين أقسام الرئيسية. العناصر التي تظهر
            = العامة + المخصصة لذلك العالم.
          </div>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton active />
      ) : !rows.length ? (
        <Empty description="لا توجد عوالم" />
      ) : (
        <div className="alhayaa-showcase-rows">
          {rows.map((r) => (
            <ShowcaseRow
              key={r.world.id}
              row={r}
              kind={kind}
              busy={save.isPending && save.variables?.worldId === r.world.id}
              onSave={(body) => save.mutate({ worldId: r.world.id, body })}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function ShowcaseRow({
  row,
  kind,
  busy,
  onSave,
}: {
  row: Row;
  kind: string;
  busy: boolean;
  onSave: (body: any) => void;
}) {
  const [title, setTitle] = useState(row.title);
  const [subtitle, setSubtitle] = useState(row.subtitle ?? "");
  useEffect(() => {
    setTitle(row.title);
    setSubtitle(row.subtitle ?? "");
  }, [row.title, row.subtitle]);

  const empty = row.itemCount === 0;
  const positionOptions = [
    { value: "__top", label: "⬆️ أعلى الصفحة (أول قسم)" },
    ...row.sections.map((s, i) => ({
      value: s.id,
      label: `بعد ${i + 1}. ${s.title?.trim() || BLOCK_TYPE_LABELS[s.type] || s.type}${s.isActive ? "" : " (مخفي)"}`,
    })),
  ];

  return (
    <div className={`alhayaa-showcase-row${row.shown ? " is-on" : ""}`} style={{ ["--w" as any]: row.world.accentColor }}>
      <div className="alhayaa-showcase-world">
        <span className="alhayaa-showcase-dot" />
        <div>
          <div className="alhayaa-showcase-name">{row.world.nameAr}</div>
          <Tooltip title={empty ? `لا توجد ${NOUN[kind]} متاحة لهذا العالم — القسم لن يظهر حتى تضيفي واحدة` : undefined}>
            <Tag color={empty ? "orange" : "purple"} style={{ marginTop: 4 }}>
              {empty ? `لا ${NOUN[kind]} لهذا العالم` : `${row.itemCount} ${NOUN[kind]} متاحة`}
            </Tag>
          </Tooltip>
        </div>
      </div>

      <div className="alhayaa-showcase-switch">
        <Switch
          checked={row.shown}
          loading={busy}
          checkedChildren="ظاهر"
          unCheckedChildren="مخفي"
          onChange={(v) => onSave({ shown: v })}
        />
      </div>

      <div className="alhayaa-showcase-fields">
        <Input
          value={title}
          addonBefore="العنوان"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== row.title && onSave({ shown: row.shown, title })}
          onPressEnter={() => title.trim() && title !== row.title && onSave({ shown: row.shown, title })}
        />
        <Input
          value={subtitle}
          addonBefore="سطر ثانٍ"
          placeholder="اختياري"
          onChange={(e) => setSubtitle(e.target.value)}
          onBlur={() => subtitle !== (row.subtitle ?? "") && onSave({ shown: row.shown, subtitle })}
          onPressEnter={() => subtitle !== (row.subtitle ?? "") && onSave({ shown: row.shown, subtitle })}
        />
        <div className="alhayaa-showcase-selects">
          <Select
            value={row.display}
            options={SHOWCASE_DISPLAYS[kind]}
            onChange={(v) => onSave({ shown: row.shown, display: v })}
            style={{ minWidth: 190 }}
          />
          <Select
            value={row.afterBlockId ?? "__top"}
            options={positionOptions}
            onChange={(v) => onSave({ shown: row.shown, afterBlockId: v === "__top" ? null : v })}
            style={{ minWidth: 260, flex: 1 }}
            popupMatchSelectWidth={false}
          />
        </div>
      </div>
    </div>
  );
}
