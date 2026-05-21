"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Empty,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Tag,
  Upload,
  message,
} from "antd";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

const PURPOSES = [
  { value: "", label: "الكل" },
  { value: "GENERAL", label: "عام" },
  { value: "PRODUCT", label: "منتج" },
  { value: "BANNER", label: "بنر" },
  { value: "BRAND", label: "براند" },
  { value: "CATEGORY", label: "فئة" },
];

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const [purpose, setPurpose] = useState<string>("");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["media", page, purpose],
    queryFn: () =>
      queries.media({
        page,
        limit: 24,
        ...(purpose ? { purpose } : {}),
      }),
  });

  const upload = useMutation({
    mutationFn: (file: File) => mutations.uploadMediaBase64(file, "GENERAL"),
    onSuccess: () => {
      message.success("تم الرفع");
      qc.invalidateQueries({ queryKey: ["media"] });
    },
    onError: () => message.error("تعذر رفع الصورة"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteMedia,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["media"] });
    },
    onError: () => message.error("تعذر الحذف"),
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? items.length;

  return (
    <Shell>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>إدارة الوسائط</h2>
          <Space>
            <Select
              style={{ width: 140 }}
              value={purpose}
              options={PURPOSES}
              onChange={(v) => {
                setPurpose(v);
                setPage(1);
              }}
            />
            <Upload
              accept="image/*"
              multiple
              showUploadList={false}
              beforeUpload={(file) => {
                upload.mutate(file as File);
                return false;
              }}
            >
              <a>+ رفع صورة</a>
            </Upload>
          </Space>
        </div>

        {isLoading ? (
          <Card loading />
        ) : items.length === 0 ? (
          <Card>
            <Empty description="لا توجد صور بعد" />
          </Card>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((m: any) => {
              const url = mediaThumb(m);
              return (
                <Card key={m.id} styles={{ body: { padding: 10 } }}>
                  <div
                    style={{
                      height: 140,
                      borderRadius: 8,
                      background: url
                        ? `center/cover url(${url})`
                        : "linear-gradient(135deg, #f1f1f4, #e6e6ee)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                      fontSize: 28,
                    }}
                  >
                    {!url && "🖼️"}
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
                    {m.originalName ?? m.filename}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <Tag color="purple">{m.purpose ?? "GENERAL"}</Tag>
                    <span>{((m.bytes ?? 0) / 1024).toFixed(0)} KB</span>
                  </div>
                  <Popconfirm
                    title="حذف الصورة؟"
                    okText="حذف"
                    cancelText="إلغاء"
                    onConfirm={() => remove.mutate(m.id)}
                  >
                    <a style={{ fontSize: 12, color: "#ff4d4f" }}>حذف</a>
                  </Popconfirm>
                </Card>
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
          />
        )}
      </Space>
    </Shell>
  );
}
