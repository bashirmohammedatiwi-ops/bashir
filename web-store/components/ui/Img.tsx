/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import { mediaSrcSet, mediaUrl } from "@/lib/media";
import type { Media } from "@/lib/types";

/** صورة بمقاسات متعددة (srcset) وتحميل كسول وظهور ناعم. */
export function Img({
  media,
  src,
  alt = "",
  sizes = "(max-width: 768px) 50vw, 25vw",
  className,
  priority,
  fit = "cover",
}: {
  media?: Media | null;
  src?: string | null;
  alt?: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}) {
  const url = src || mediaUrl(media, "medium");
  if (!url) return <div className={clsx("bg-accent-light", className)} aria-hidden />;
  return (
    <img
      src={url}
      srcSet={src ? undefined : mediaSrcSet(media)}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // @ts-expect-error fetchpriority attribute
      fetchpriority={priority ? "high" : undefined}
      className={clsx(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
