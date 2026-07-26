"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { LoadingState } from "@/components/ui/LoadingState";

export function SlugQueryPage({ render }: { render: (slug: string) => ReactNode }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <SlugQueryInner render={render} />
    </Suspense>
  );
}

function SlugQueryInner({ render }: { render: (slug: string) => ReactNode }) {
  const params = useSearchParams();
  const slug = params.get("slug")?.trim() ?? "";
  return <>{render(slug)}</>;
}
