"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Contact, ContactSearchResponse, CreateContactInput } from "@/types/contact";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`/api/ghl/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Error ${res.status}`);
  }
  return res.json();
}

export function useContacts(locationId: string, search?: string, page = 1, limit = 20) {
  return useQuery<ContactSearchResponse>({
    queryKey: ["contacts", locationId, search, page],
    queryFn: () =>
      fetchAPI("contacts/search", {
        method: "POST",
        body: JSON.stringify({
          locationId,
          query: search || undefined,
          pageLimit: limit,
          page,
        }),
      }),
    enabled: !!locationId,
  });
}

export function useContact(contactId: string) {
  return useQuery<{ contact: Contact }>({
    queryKey: ["contact", contactId],
    queryFn: () => fetchAPI(`contacts/${contactId}`),
    enabled: !!contactId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactInput) =>
      fetchAPI("contacts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Contact> & { id: string }) =>
      fetchAPI(`contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", variables.id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) =>
      fetchAPI(`contacts/${contactId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// --- Notes ---

export function useContactNotes(contactId: string) {
  return useQuery<{ notes: Array<{ id: string; body: string; dateAdded: string; userId?: string }> }>({
    queryKey: ["contact-notes", contactId],
    queryFn: () => fetchAPI(`contacts/${contactId}/notes`),
    enabled: !!contactId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, body }: { contactId: string; body: string }) =>
      fetchAPI(`contacts/${contactId}/notes`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-notes", variables.contactId] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, noteId }: { contactId: string; noteId: string }) =>
      fetchAPI(`contacts/${contactId}/notes/${noteId}`, { method: "DELETE" }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-notes", variables.contactId] });
    },
  });
}

// --- Tasks ---

export function useContactTasks(contactId: string) {
  return useQuery<{ tasks: Array<{ id: string; title: string; body?: string; dueDate?: string; completed: boolean; dateAdded: string }> }>({
    queryKey: ["contact-tasks", contactId],
    queryFn: () => fetchAPI(`contacts/${contactId}/tasks`),
    enabled: !!contactId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, ...data }: { contactId: string; title: string; dueDate?: string; description?: string }) =>
      fetchAPI(`contacts/${contactId}/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-tasks", variables.contactId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, taskId, ...data }: { contactId: string; taskId: string; completed?: boolean; title?: string }) =>
      fetchAPI(`contacts/${contactId}/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-tasks", variables.contactId] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, taskId }: { contactId: string; taskId: string }) =>
      fetchAPI(`contacts/${contactId}/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-tasks", variables.contactId] });
    },
  });
}

// --- Appointments ---

export function useContactAppointments(contactId: string) {
  return useQuery<{
    events: Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      status?: string;
      appointmentStatus?: string;
      calendarId?: string;
    }>;
  }>({
    queryKey: ["contact-appointments", contactId],
    queryFn: () => fetchAPI(`contacts/${contactId}/appointments`),
    enabled: !!contactId,
  });
}

// --- Tags ---

export function useAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, tags }: { contactId: string; tags: string[] }) =>
      fetchAPI(`contacts/${contactId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact", variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// --- Location Tags ---

export function useLocationTags(locationId: string) {
  return useQuery<{ tags: Array<{ id: string; name: string }> }>({
    queryKey: ["location-tags", locationId],
    queryFn: () => fetchAPI(`locations/${locationId}/tags`),
    enabled: !!locationId,
  });
}

// --- DND ---

export function useUpdateDnd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, dnd, dndSettings }: { contactId: string; dnd: boolean; dndSettings: Record<string, { status: string; message: string; code: string }> }) =>
      fetchAPI(`contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({ dnd, dndSettings }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact", variables.contactId] });
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, tags }: { contactId: string; tags: string[] }) =>
      fetchAPI(`contacts/${contactId}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact", variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useContactOpportunities(locationId: string, contactId: string) {
  return useQuery({
    queryKey: ["contact-opportunities", contactId],
    queryFn: () =>
      fetchAPI(
        `opportunities/search?location_id=${locationId}&contact_id=${contactId}&limit=50`
      ).then((d) => d.opportunities || []),
    enabled: !!locationId && !!contactId,
  });
}

export function useWorkflows(locationId: string) {
  return useQuery({
    queryKey: ["workflows", locationId],
    queryFn: () =>
      fetchAPI(`workflows?locationId=${locationId}`).then(
        (d) => d.workflows || []
      ),
    enabled: !!locationId,
  });
}

export function useEnrollWorkflow() {
  return useMutation({
    mutationFn: ({ contactId, workflowId }: { contactId: string; workflowId: string }) =>
      fetchAPI(`contacts/${contactId}/workflow/${workflowId}`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
  });
}

export function useCreateOpportunityForContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      pipelineId: string;
      pipelineStageId: string;
      locationId: string;
      contactId: string;
      name: string;
      status?: string;
      monetaryValue?: number;
    }) =>
      fetchAPI("opportunities", {
        method: "POST",
        body: JSON.stringify({
          pipelineId: data.pipelineId,
          pipelineStageId: data.pipelineStageId,
          locationId: data.locationId,
          contactId: data.contactId,
          name: data.name,
          status: data.status || "open",
          monetaryValue: data.monetaryValue || 0,
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-opportunities", variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}

export function usePipelines(locationId: string) {
  return useQuery({
    queryKey: ["pipelines", locationId],
    queryFn: () =>
      fetchAPI(`opportunities/pipelines?locationId=${locationId}`).then(
        (d) => d.pipelines || []
      ),
    enabled: !!locationId,
  });
}
