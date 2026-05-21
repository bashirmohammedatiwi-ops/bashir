"use client";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Modal, Pagination, Space, Tag } from "antd";
import { useState } from "react";
import { mediaThumb } from "@/lib/mediaUrl";
import { queries } from "@/lib/queries";

type Props = {
  value?: string | null;
  onChange?: (id: string | null) => void;
  label?: string;
};

export function MediaPicker({ value, onChange, label = "اختر صورة" }: Props) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["media-picker", page],
    queryFn: () => queries.media({ page, limit: 24 }),
    enabled: open,
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? items.length;
  const selected = items.find((m: any) => m.id === value);

  return (
    <>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        {value && (
          <div
            style={{
              height: 100,
              width: 160,
              borderRadius: 8,
              background: mediaThumb(selected)
                ? `center/cover url(${mediaThumb(selected)})`
                : "#f0f0f5",
              border: "1px solid #eee",
            }}
          />
        )}
        <Space>
          <Button onClick={() => setOpen(true)}>{label}</Button>
          {value && (
            <Button danger type="link" onClick={() => onChange?.(null)}>
              إزالة
            </Button>
          )}
        </Space>
      </Space>

      <Modal
        title="مكتبة الوسائط"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={720}
        destroyOnHidden
      >
        {isLoading ? (
          <div style={{ padding: 24, textAlign: "center" }}>جاري التحميل...</div>
        ) : items.length === 0 ? (
          <Empty description="لا توجد صور — ارفع من صفحة الوسائط" />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {items.map((m: any) => {
              const url = mediaThumb(m);
              const active = m.id === value;
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onChange?.(m.id);
                    setOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onChange?.(m.id);
                      setOpen(false);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    borderRadius: 8,
                    border: active ? "2px solid #1677ff" : "1px solid #eee",
                    padding: 6,
                  }}
                >
                  <div
                    style={{
                      height: 90,
                      borderRadius: 6,
                      background: url
                        ? `center/cover url(${url})`
                        : "linear-gradient(135deg, #f1f1f4, #e6e6ee)",
                    }}
                  />
                  <div style={{ fontSize: 10, marginTop: 4, color: "#666" }}>
                    <Tag>{m.purpose ?? "GENERAL"}</Tag>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {total > 24 && (
          <Pagination
            current={page}
            total={total}
            pageSize={24}
            onChange={setPage}
            align="center"
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </>
  );
}
