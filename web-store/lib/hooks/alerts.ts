"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useAuth } from "../stores/auth";
import { toast } from "../stores/ui";

/** تنبيهات «أعلميني عند التوفّر» — نفس التطبيق (إشعار حين يعود المنتج). */
export function useRestockAlerts() {
  const user = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ["alerts", user?.id], enabled: !!user, queryFn: () => api<{ restock: string[] }>("/alerts/mine").then((r) => r.restock ?? []) });
  return { ids: q.data ?? [], isLoading: q.isLoading };
}

export function useRestockToggle() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  return useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => api(`/alerts/restock/${id}`, { method: on ? "POST" : "DELETE" }),
    onMutate: ({ id, on }) => {
      const key = ["alerts", user?.id];
      const prev = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData(key, on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id));
      return { prev, key };
    },
    onSuccess: (_d, { on }) => toast({ text: on ? "سنعلمكِ فور توفّره 🔔" : "ألغينا التنبيه", tone: on ? "success" : "info" }),
    onError: (e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.prev);
      toast({ text: (e as Error).message, tone: "error" });
    },
  });
}
