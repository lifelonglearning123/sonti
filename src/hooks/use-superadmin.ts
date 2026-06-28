"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SuperAdminOrg {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "starter" | "pro";
  isActive: boolean;
  memberCount: number;
  locationName: string | null;
  ghlLocationId: string | null;
  ownerEmail: string | null;
  createdAt: string;
}

export interface AgencyStatus {
  connected: boolean;
  oauthConnected: boolean;
  pitConfigured: boolean;
  activeMethod: "oauth" | "pit" | null;
  agencyName: string | null;
  companyId: string | null;
  subAccountCount: number | null;
}

async function saFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/superadmin/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export function useAgencyStatus() {
  return useQuery<AgencyStatus>({
    queryKey: ["superadmin-agency"],
    queryFn: () => saFetch("agency"),
  });
}

export function useDisconnectAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => saFetch("agency", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-agency"] }),
  });
}

export function useOrganizations() {
  return useQuery<{ organizations: SuperAdminOrg[] }>({
    queryKey: ["superadmin-orgs"],
    queryFn: () => saFetch("organizations"),
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      slug?: string;
      ownerEmail: string;
      ownerName?: string;
      plan?: "free" | "starter" | "pro";
      subAccountName?: string;
      subAccountEmail?: string;
      subAccountPhone?: string;
      locationApiToken?: string;
    }) => saFetch("organizations", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-orgs"] }),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      plan?: "free" | "starter" | "pro";
      isActive?: boolean;
    }) => saFetch(`organizations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-orgs"] }),
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      saFetch(`organizations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-orgs"] }),
  });
}
