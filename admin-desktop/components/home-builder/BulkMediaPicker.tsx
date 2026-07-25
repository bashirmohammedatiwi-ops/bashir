"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Modal, Pagination, Space, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { mediaThumb } from "@/lib/mediaUrl";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { queries } from "@/lib/queries";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (imageIds: string[]) => void;
};

export function BulkMediaPicker({ open, onClose, onSelect }: Props) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["media-picker-bulk", page],
    queryFn: () => queries.media({ page, limit: 24 }),
    enabled: open,
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? items.length;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirm = () => {
    if (selected.length === 0) {
      message.warning("اختر صورة واحدة على الأقل");
      return;
    }
    onSelect(selected);
    setSelected([]);
    onClose();
  };

  return (
    <Modal
      title="إضافة صور متعددة"
      open={open}
      onCancel={() => {
        setSelected([]);
        onClose();
      }}
      onOk={confirm}
      okText={`إضافة (${selected.length})`}
      cancelText="إلغاء"
      width={760}
      destroyOnHidden
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Upload
          showUploadList={false}
          accept="image/*"
          multiple
          beforeUpload={async (file, fileList) => {
            const idx = fileList.indexOf(file);
            if (idx !== fileList.length - 1) return false;
            try {
              const ids: string[] = [];
              for (const f of fileList) {
                const media = await uploadMediaFile(f as File, "GENERAL");
                ids.push(media.id);
              }
              onSelect(ids);
              message.success(`تم رفع ${ids.length} صورة`);
              onClose();
            } catch (e: any) {
              message.error(e.message ?? "فشل الرفع");
            }
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>رفع عدة صور</Button>
        </Upload>
        <Button type="link" onClick={() => setSelected(items.map((m: any) => m.id))}>
          تحديد الصفحة
        </Button>
        <Button type="link" onClick={() => setSelected([])}>
          إلغاء التحديد
        </Button>
      </Space>

      {isLoading ? (
        <div style={{ padding: 24, textAlign: "center" }}>جاري التحميل...</div>
      ) : items.length === 0 ? (
        <Empty description="لا توجد صور" />
      ) : (
        <>
          <div className="hb-bulk-media-grid">
            {items.map((m: any) => {
              const url = mediaThumb(m);
              const active = selected.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`hb-bulk-media-tile${active ? " active" : ""}`}
                  onClick={() => toggle(m.id)}
                >
                  <div
                    style={{
                      height: 92,
                      borderRadius: 6,
                      background: url ? `center/cover url(${url})` : "#f0f0f5",
                    }}
                  />
                </button>
              );
            })}
          </div>
          <Pagination
            size="small"
            current={page}
            total={total}
            pageSize={24}
            onChange={setPage}
            style={{ marginTop: 12, textAlign: "center" }}
          />
        </>
      )}
    </Modal>
  );
}
