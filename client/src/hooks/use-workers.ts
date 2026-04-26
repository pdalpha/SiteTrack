import { useQuery } from "@tanstack/react-query";
import type { Worker } from "@shared/schema";

export function useWorkers(siteId?: number | null, status?: string) {
  return useQuery<Worker[]>({
    queryKey: ["/api/workers", siteId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (siteId) params.set("site_id", String(siteId));
      if (status && status !== "all") params.set("status", status);
      const res = await fetch(`./api/workers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch workers");
      return res.json();
    },
  });
}
