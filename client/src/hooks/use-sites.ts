import { useQuery } from "@tanstack/react-query";
import type { Site } from "@shared/schema";
import { useState } from "react";

export function useSites() {
  return useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });
}

export function useSiteSelector() {
  const { data: sites = [], isLoading } = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);

  // Auto-select first active site
  const activeSites = sites.filter((s) => s.status === "active");
  const effectiveId = selectedSiteId ?? activeSites[0]?.id ?? sites[0]?.id ?? null;
  const selectedSite = sites.find((s) => s.id === effectiveId);

  return {
    sites,
    activeSites,
    selectedSiteId: effectiveId,
    selectedSite,
    setSelectedSiteId,
    isLoading,
  };
}
