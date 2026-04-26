import { useQuery } from "@tanstack/react-query";
import type { Contractor } from "@shared/schema";

export function useContractors(status?: string) {
  return useQuery<Contractor[]>({
    queryKey: ["/api/contractors", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      const res = await fetch(`./api/contractors?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contractors");
      return res.json();
    },
  });
}
