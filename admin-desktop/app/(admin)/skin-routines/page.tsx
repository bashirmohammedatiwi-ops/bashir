"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Empty,
  Popconfirm,
  Space,
  Tabs,
  Tag,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PackageFormModal } from "@/components/packages/PackageFormModal";
import { mediaThumb } from "@/lib/mediaUrl";
import {
  SKIN_ROUTINE_KINDS,
  type SkinRoutineKind,
  kindIcon,
  kindLabel,
} from "@/lib/packageForm";
import { mutations, queries } from "@/lib/queries";

export default function SkinRoutinesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<SkinRoutineKind>("ROUTINE_MORNING");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: queries.packages,
  });

  const routines = useMemo(() => {
    const all = data ?? [];
    return all.filter((p: any) => p.kind === tab);
  }, [data, tab]);

  const remove = useMutation({
    mutationFn: mutations.deletePackage,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setOpen(true);
  };

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <PageHeader
          title="روتين البشرة"
          subtitle="روتينات صباحية ومسائية — غلاف مخصص + خطوات المنتجات بالباركود"
          extra={
            <Button type="primary" onClick={openCreate}>
              + {tab === "ROUTINE_MORNING" ? "روتين صباحي" : "روتين مسائي"}
            </Button>
          }
        />

        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as SkinRoutineKind)}
          items={SKIN_ROUTINE_KINDS.map((kind) => ({
            key: kind,
            label: (
              <span>
                {kindIcon(kind)} {kindLabel(kind)}
              </span>
            ),
            children: (
              <Card loading={isLoading} bordered={false} className="alhayaa-routine-panel">
                {routines.length === 0 ? (
                  <Empty
                    description={`لا يوجد ${kindLabel(kind)} بعد`}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button type="primary" onClick={openCreate}>
                      إنشاء {kindLabel(kind)}
                    </Button>
                  </Empty>
                ) : (
                  <div className="alhayaa-routine-grid">
                    {routines.map((routine: any) => {
                      const cover = mediaThumb(routine.coverImage);
                      const steps = routine._count?.items ?? routine.items?.length ?? 0;
                      return (
                        <article key={routine.id} className="alhayaa-routine-card">
                          <div
                            className="alhayaa-routine-card-cover"
                            style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                          >
                            {!cover && (
                              <span className="alhayaa-routine-card-cover-fallback">
                                {kindIcon(routine.kind)}
                              </span>
                            )}
                            {routine.badge ? (
                              <Tag className="alhayaa-routine-card-badge">{routine.badge}</Tag>
                            ) : null}
                          </div>
                          <div className="alhayaa-routine-card-body">
                            <h3>{routine.name}</h3>
                            <p>{routine.subtitle || "—"}</p>
                            <div className="alhayaa-routine-card-meta">
                              <Tag color="blue">{steps} خطوات</Tag>
                              <strong>{routine.price?.toLocaleString()} د.ع</strong>
                              <Tag color={routine.isActive ? "green" : "red"}>
                                {routine.isActive ? "نشط" : "موقوف"}
                              </Tag>
                            </div>
                            <Space wrap>
                              <Button size="small" type="primary" ghost onClick={() => openEdit(routine)}>
                                تعديل
                              </Button>
                              <Popconfirm
                                title="حذف الروتين؟"
                                okText="حذف"
                                cancelText="إلغاء"
                                onConfirm={() => remove.mutate(routine.id)}
                              >
                                <Button size="small" danger>
                                  حذف
                                </Button>
                              </Popconfirm>
                            </Space>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Card>
            ),
          }))}
        />
      </Space>

      <PackageFormModal
        open={open}
        editing={editing}
        defaultKind={tab}
        lockKind
        coverVariant="hero"
        productsTitle="خطوات الروتين (بالباركود)"
        title={
          editing
            ? `تعديل ${kindLabel(editing.kind)}`
            : `روتين جديد — ${kindLabel(tab)}`
        }
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setEditing(null);
        }}
      />
    </>
  );
}
