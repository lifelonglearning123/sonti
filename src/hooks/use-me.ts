"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface OrgLocationSummary {
  ghlLocationId: string;
  name: string | null;
}

export interface MeOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  brandName: string | null;
  brandColor: string | null;
  brandLogoUrl: string | null;
}

export interface Me {
  authenticated: boolean;
  userId: string;
  email: string;
  fullName: string | null;
  platformRole: "user" | "superadmin";
  orgRole: "owner" | "admin" | "member" | null;
  organization: MeOrganization | null;
  hasGhlConnection: boolean;
  locations: OrgLocationSummary[];
  activeLocationId: string | null;
}

async function fetchMe(): Promise<Me> {
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** Convenience: the active location id, or null while loading. */
export function useActiveLocationId(): string | null {
  const { data } = useMe();
  return data?.activeLocationId ?? null;
}

export function useSetActiveLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (locationId: string) => {
      const res = await fetch("/api/active-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId }),
      });
      if (!res.ok) throw new Error("Failed to switch location");
      return res.json();
    },
    onSuccess: () => {
      // Refresh identity + all location-scoped data.
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries();
    },
  });
}
