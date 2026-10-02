"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageBuilderStudio } from "@/components/home-builder/PageBuilderStudio";
import { WorldHomeStudio } from "@/components/worlds/WorldHomeStudio";
import { queries } from "@/lib/queries";

function WorldHomeBuilder() {
  const params = useSearchParams();
  const worldId = params.get("id") ?? "";
  const advanced = params.get("advanced") === "1";
  const { data } = useQuery({
    queryKey: ["worlds-manage"],
    queryFn: queries.worldsManage,
  });
  const world = ((data ?? []) as { id: string; nameAr?: string; accentColor?: string; canvasColor?: string }[]).find(
    (item) => item.id === worldId,
  );
  const name = world?.nameAr || "العالم";

  if (!worldId) {
    return <p>اختاري عالماً من صفحة العوالم.</p>;
  }

  if (!advanced) {
    return (
      <WorldHomeStudio
        worldId={worldId}
        worldName={name}
        accent={world?.accentColor || "#2C272B"}
        canvas={world?.canvasColor || "#F7F4F5"}
      />
    );
  }

  return (
    <PageBuilderStudio
      pageKey="HOME"
      worldId={worldId}
      blocksQueryKey={`home-blocks-${worldId}`}
      exportFilePrefix={`world-${worldId}`}
      title={`رئيسية ${name}`}
      subtitle="نفس أدوات الصفحة الرئيسية: منتجات، إعلانات، صور، ومعارض. تظهر داخل هذا العالم فقط."
      infoBanner={{
        message: `هذه الصفحة خاصة بعالم ${name}`,
        description:
          "أضيفي أقسام المنتجات والبنرات والصور كما في الرئيسية الأساسية. لن تظهر في المتجر الكامل، فقط عندما تفتح الزبونة هذا العالم.",
      }}
    />
  );
}

export default function WorldHomeBuilderPage() {
  return (
    <Suspense fallback={null}>
      <WorldHomeBuilder />
    </Suspense>
  );
}
