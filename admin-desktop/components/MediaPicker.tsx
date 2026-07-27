"use client";
import { useQuery } from "@tanstack/react-query";
import { Button, Empty, Modal, Pagination, Space, Spin, Tag, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { mediaThumb } from "@/lib/mediaUrl";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { queries } from "@/lib/queries";

const IMAGE_EXT = /\.(png|jpe?g|webp|avif|heic|heif|gif|bmp)$/i;
const ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif";

function isImageFile(f: File) {
  if (f.type.startsWith("image/")) return true;
  if (!f.type && IMAGE_EXT.test(f.name)) return true;
  return IMAGE_EXT.test(f.name);
}

type Props = {
  value?: string | null;
  onChange?: (id: string | null) => void;
  onPickUrl?: (url: string | null) => void;
  label?: string;
  purpose?: string;
  previewUrl?: string | null;
};

export function MediaPicker({
  value,
  onChange,
  onPickUrl,
  label = "اختر صورة",
  purpose = "GENERAL",
  previewUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["media-picker", page],
    queryFn: () => queries.media({ page, limit: 24 }),
    enabled: open,
  });

  const { data: fetchedById } = useQuery({
    queryKey: ["media-by-id", value],
    queryFn: () => queries.mediaById(value!),
    enabled: !!value && !localPreview && !previewUrl,
    staleTime: 5 * 60_000,
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? items.length;
  const selected = items.find((m: any) => m.id === value) ?? fetchedById;
  const thumb = localPreview || previewUrl || mediaThumb(selected) || undefined;

  const uploadFile = useCallback(
    async (file: File) => {
      if (!isImageFile(file)) {
        message.warning("يرجى اختيار صورة (JPG / PNG / WebP / AVIF / HEIC)");
        return;
      }
      setUploading(true);
      try {
        const media = await uploadMediaFile(file, purpose);
        const url = media.previewUrl ?? mediaThumb(media, "medium") ?? mediaThumb(media);
        setLocalPreview(url);
        onChange?.(media.id);
        onPickUrl?.(url ?? null);
        message.success("تم رفع الصورة");
      } catch (e: unknown) {
        const err = e as { message?: string };
        message.error(err.message ?? "فشل الرفع");
      } finally {
        setUploading(false);
      }
    },
    [onChange, onPickUrl, purpose],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(isImageFile);
      if (!list.length) {
        message.warning("يرجى اختيار صورة (JPG / PNG / WebP / AVIF / HEIC)");
        return;
      }
      await uploadFile(list[0]);
    },
    [uploadFile],
  );

  useEffect(() => {
    if (!value) setLocalPreview(null);
  }, [value]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const active = document.activeElement;
      const inScope =
        active instanceof HTMLElement &&
        (root.contains(active) ||
          active.tagName === "BODY" ||
          active.closest(".ant-modal, .ant-drawer"));
      if (!inScope) return;
      const files = e.clipboardData?.files;
      if (files?.length) {
        e.preventDefault();
        uploadFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadFiles]);

  return (
    <>
      <div ref={rootRef}>
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
            }}
            style={{
              width: "100%",
              minHeight: thumb ? 120 : 140,
              borderRadius: 10,
              border: `2px dashed ${dragOver ? "#1677ff" : "#d9d9d9"}`,
              background: dragOver ? "#f0f7ff" : "#fafafa",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 12,
              overflow: "hidden",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {uploading ? (
              <Spin tip="جاري رفع الصورة..." />
            ) : thumb ? (
              <div
                style={{
                  height: 100,
                  width: "100%",
                  maxWidth: 200,
                  borderRadius: 8,
                  background: `center/contain no-repeat url(${thumb})`,
                  border: "1px solid #eee",
                }}
              />
            ) : (
              <>
                <div style={{ fontSize: 28 }}>📷</div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>اسحب الصورة هنا أو انقر للاختيار</div>
              </>
            )}
            {!uploading ? (
              <div style={{ fontSize: 12, color: "#888" }}>
                JPG · PNG · WebP · AVIF · HEIC — أو الصق من الحافظة (Ctrl+V)
              </div>
            ) : null}
          </div>
          <Space wrap>
            <Upload
              showUploadList={false}
              accept={ACCEPT}
              beforeUpload={async (file) => {
                await uploadFile(file as File);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                رفع صورة
              </Button>
            </Upload>
            <Button onClick={() => setOpen(true)}>{label}</Button>
            {value && (
              <Button
                danger
                type="link"
                onClick={() => {
                  setLocalPreview(null);
                  onChange?.(null);
                  onPickUrl?.(null);
                }}
              >
                إزالة
              </Button>
            )}
          </Space>
        </Space>
      </div>

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
                    setLocalPreview(url);
                    onChange?.(m.id);
                    onPickUrl?.(url ?? null);
                    setOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setLocalPreview(url);
                      onChange?.(m.id);
                      onPickUrl?.(url ?? null);
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
