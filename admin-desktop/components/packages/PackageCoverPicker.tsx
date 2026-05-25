"use client";

import { useQuery } from "@tanstack/react-query";
import { Space } from "antd";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaThumb } from "@/lib/mediaUrl";
import { queries } from "@/lib/queries";

type PackageCoverPickerProps = {
  value?: string | null;
  onChange?: (id: string | null) => void;
  previewImage?: unknown;
  variant?: "default" | "hero";
  hint?: string;
};

export function PackageCoverPicker({
  value,
  onChange,
  previewImage,
  variant = "default",
  hint,
}: PackageCoverPickerProps) {
  const { data: mediaPage } = useQuery({
    queryKey: ["media-cover-pick", value],
    queryFn: () => queries.media({ page: 1, limit: 100 }),
    enabled: !!value && !previewImage,
    staleTime: 60_000,
  });

  const pickedFromList = value
    ? mediaPage?.data?.find((m: any) => m.id === value)
    : null;
  const picked = previewImage ?? pickedFromList ?? null;
  const url = mediaThumb(picked as any);
  const hero = variant === "hero";

  return (
    <div className={`alhayaa-package-cover${hero ? " alhayaa-package-cover--hero" : ""}`}>
      <div
        className="alhayaa-package-cover-preview"
        style={url ? { backgroundImage: `url(${url})` } : undefined}
      >
        {!url && (
          <div className="alhayaa-package-cover-placeholder">
            <span>{hero ? "🧴" : "📷"}</span>
            <p>{hero ? "صورة غلاف الروتين" : "صورة الغلاف"}</p>
          </div>
        )}
      </div>
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <MediaPicker
          value={value}
          onChange={onChange}
          label={url ? "تغيير الغلاف" : "رفع / اختيار غلاف"}
        />
        {hint ? <p className="alhayaa-package-cover-hint">{hint}</p> : null}
      </Space>
    </div>
  );
}
