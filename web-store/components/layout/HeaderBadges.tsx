"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useHydrated } from "../Providers";
import { api } from "@/lib/api";
import { useWishlist } from "@/lib/hooks/wishlist";
import { useAuth } from "@/lib/stores/auth";
import type { Paged } from "@/lib/types";
import { Icon } from "../ui/Icon";

const Badge = ({ n }: { n: number }) =>
  n > 0 ? <span className="absolute -left-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[11px] font-extrabold text-white ring-2 ring-surface">{n > 9 ? "9+" : n}</span> : null;

/** الإشعارات (غير المقروءة) والمفضلة في الرأس — للمسجّلات. */
export function HeaderBadges() {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const wish = useWishlist();
  const notes = useQuery({
    queryKey: ["notifications"],
    enabled: !!user,
    refetchInterval: 120_000,
    queryFn: () => api<Paged<{ isRead: boolean }>>("/notifications", { query: { page: 1, limit: 50 } }),
  });
  const unread = (notes.data?.data ?? []).filter((n) => !n.isRead).length;
  const on = hydrated && !!user;
  return (
    <>
      {on && (
        <Link href="/account/notifications" className="relative rounded-full p-2.5 text-ink hover:bg-accent-light" aria-label={`الإشعارات${unread ? ` (${unread} جديدة)` : ""}`}>
          <Icon name="bell" />
          <Badge n={unread} />
        </Link>
      )}
      <Link href="/wishlist" className="relative hidden rounded-full p-2.5 text-ink hover:bg-accent-light md:block" aria-label="المفضلة">
        <Icon name="heart" />
        {on && <Badge n={wish.data?.length ?? 0} />}
      </Link>
    </>
  );
}
