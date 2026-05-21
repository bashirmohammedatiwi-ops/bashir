"use client";
import { Spin, message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { mediaThumb } from "@/lib/mediaUrl";
import { uploadMediaFile } from "@/lib/uploadMedia";

export type ImageItem = { id: string; url: string | null };

type Props = {
  items: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  purpose?: string;
  max?: number;
  compact?: boolean;
  label?: string;
};

async function uploadOne(file: File, purpose: string): Promise<ImageItem> {
  const media = await uploadMediaFile(file, purpose);
  return { id: media.id, url: media.previewUrl ?? mediaThumb(media) };
}

export function ProductImageDropzone({
  items,
  onChange,
  purpose = "PRODUCT",
  max = 12,
  compact = false,
  label,
}: Props) {
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter(
        (f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|avif)$/i.test(f.name),
      );
      if (!list.length) {
        message.warning("يرجى اختيار ملفات صور فقط");
        return;
      }
      const remaining = max - items.length;
      if (remaining <= 0) {
        message.warning(`الحد الأقصى ${max} صور`);
        return;
      }
      const batch = list.slice(0, remaining);
      setUploading(batch.length);
      const results = await Promise.allSettled(
        batch.map((file) => uploadOne(file, purpose)),
      );
      const added: ImageItem[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") added.push(result.value);
        else {
          const reason =
            result.reason instanceof Error ? result.reason.message : "خطأ غير معروف";
          message.error(`فشل رفع: ${batch[i]?.name ?? "صورة"} — ${reason}`);
        }
      });
      setUploading(0);
      if (added.length) {
        onChange([...items, ...added]);
        message.success(`تم رفع ${added.length} صورة`);
      }
    },
    [items, onChange, max, purpose],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const zone = zoneRef.current;
      if (!zone) return;
      const active = document.activeElement;
      const inForm =
        active instanceof HTMLElement &&
        (zone.contains(active) || active.tagName === "BODY" || active.closest(".ant-modal, .ant-drawer"));
      if (!inForm) return;
      const files = e.clipboardData?.files;
      if (files?.length) {
        e.preventDefault();
        uploadFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadFiles]);

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  const zoneHeight = compact ? 72 : 140;

  return (
    <div ref={zoneRef}>
      {label && (
        <div style={{ fontSize: 13, marginBottom: 6, color: "#444" }}>{label}</div>
      )}
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
          border: `2px dashed ${dragOver ? "#1677ff" : "#d9d9d9"}`,
          borderRadius: 10,
          padding: compact ? 10 : 16,
          textAlign: "center",
          background: dragOver ? "#f0f7ff" : "#fafafa",
          cursor: "pointer",
          minHeight: zoneHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading > 0 ? (
          <Spin size="small" />
        ) : (
          <>
            <div style={{ fontSize: compact ? 20 : 28 }}>📷</div>
            {!compact && (
              <>
                <div style={{ fontWeight: 500 }}>اسحب الصور هنا أو انقر للاختيار</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  يمكنك أيضاً لصق صورة من الحافظة (Ctrl+V)
                </div>
              </>
            )}
            {compact && (
              <div style={{ fontSize: 11, color: "#888" }}>سحب / لصق / اختيار</div>
            )}
          </>
        )}
      </div>

      {items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: compact
              ? "repeat(auto-fill, minmax(56px, 1fr))"
              : "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 8,
            marginTop: 10,
          }}
        >
          {items.map((item, idx) => (
            <div key={item.id} style={{ position: "relative" }}>
              <div
                style={{
                  height: compact ? 56 : 100,
                  borderRadius: 8,
                  border: idx === 0 ? "2px solid #1677ff" : "1px solid #eee",
                  background: item.url
                    ? `center/cover url(${item.url})`
                    : "linear-gradient(135deg, #f0f0f5, #e8e8ee)",
                }}
              />
              {idx === 0 && !compact && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    insetInlineStart: 4,
                    fontSize: 10,
                    background: "#1677ff",
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  رئيسية
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(item.id);
                }}
                style={{
                  position: "absolute",
                  top: 4,
                  insetInlineEnd: 4,
                  width: 22,
                  height: 22,
                  border: "none",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                }}
                aria-label="حذف"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function shadeSwatchStyle(colorHex?: string, colorHexEnd?: string | null) {
  if (!colorHex) return { background: "#eee" };
  if (colorHexEnd) {
    return { background: `linear-gradient(135deg, ${colorHex}, ${colorHexEnd})` };
  }
  return { background: colorHex };
}
