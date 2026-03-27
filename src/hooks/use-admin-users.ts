"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  ghlLocationId: string | null;
  hasToken: boolean;
  createdAt: string;
}

async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/admin/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

export function useAdminUsers() {
  return useQuery<{ users: AdminUser[] }>({
    queryKey: ["admin-users"],
    queryFn: () => adminFetch("users"),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; password: string; role?: string; ghlLocationId?: string; ghlAccessToken?: string }) =>
      adminFetch("users", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; username?: string; password?: string; role?: string; ghlLocationId?: string; ghlAccessToken?: string }) =>
      adminFetch(`users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

// Agency settings hooks
interface AgencySettings {
  hasToken: boolean;
  companyId: string | null;
  agencyName: string | null;
}

export function useAgencySettings() {
  return useQuery<AgencySettings>({
    queryKey: ["agency-settings"],
    queryFn: () => adminFetch("settings"),
  });
}

export function useSaveAgencyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agencyToken: string) =>
      adminFetch("settings", { method: "PUT", body: JSON.stringify({ agencyToken }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency-settings"] });
      qc.invalidateQueries({ queryKey: ["ghl-locations"] });
    },
  });
}

// GHL locations hooks
interface GhlLocation {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
}

export function useGhlLocations(enabled = true) {
  return useQuery<{ locations: GhlLocation[] }>({
    queryKey: ["ghl-locations"],
    queryFn: () => adminFetch("locations"),
    enabled,
  });
}

export function useCreateGhlLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string; address?: string; city?: string; country?: string }) =>
      adminFetch("locations", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ghl-locations"] }),
  });
}
