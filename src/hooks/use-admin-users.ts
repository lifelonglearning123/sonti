"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminMember {
  id: string; // profileId
  email: string;
  fullName: string | null;
  role: "owner" | "admin" | "member";
  ghlLocationId: string | null;
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
  return useQuery<{ users: AdminMember[] }>({
    queryKey: ["admin-users"],
    queryFn: () => adminFetch("users"),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; fullName?: string; role?: "admin" | "member" }) =>
      adminFetch("users", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      fullName?: string;
      role?: "admin" | "member";
      password?: string;
    }) => adminFetch(`users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminFetch(`users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

// ─── Sub-account GHL connection (location PIT) ──────────────
export interface ConnectionStatus {
  locationName: string | null;
  ghlLocationId: string | null;
  hasToken: boolean;
  oauthAvailable: boolean;
  connected: boolean;
}

export function useConnectionStatus() {
  return useQuery<ConnectionStatus>({
    queryKey: ["admin-connection"],
    queryFn: () => adminFetch("connection"),
  });
}

export function useSaveConnectionToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apiToken: string) =>
      adminFetch("connection", { method: "PUT", body: JSON.stringify({ apiToken }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-connection"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
