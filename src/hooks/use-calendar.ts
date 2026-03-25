"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Calendar, CalendarEvent, CalendarEventsResponse, GHLUser } from "@/types/calendar";

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

export function useCalendars(locationId: string) {
  return useQuery<{ calendars: Calendar[] }>({
    queryKey: ["calendars", locationId],
    queryFn: () => fetchAPI(`calendars?locationId=${locationId}`),
    enabled: !!locationId,
  });
}

export function useCalendarEvents(locationId: string, calendarIds: string[], startDate: string, endDate: string) {
  return useQuery<CalendarEventsResponse>({
    queryKey: ["calendar-events", locationId, calendarIds, startDate, endDate],
    queryFn: async () => {
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();
      // Fetch events from ALL calendars in parallel
      const results = await Promise.all(
        calendarIds.map((calId) =>
          fetchAPI(
            `calendars/events?locationId=${locationId}&calendarId=${calId}&startTime=${startTime}&endTime=${endTime}`
          ).catch((err) => {
            console.warn(`Failed to fetch events for calendar ${calId}:`, err);
            return { events: [] };
          })
        )
      );
      const allEvents = results.flatMap((r) => r.events || []);
      return { events: allEvents };
    },
    enabled: !!locationId && calendarIds.length > 0 && !!startDate && !!endDate,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useUsers(locationId: string) {
  return useQuery<{ users: GHLUser[] }>({
    queryKey: ["users", locationId],
    queryFn: () => fetchAPI(`users?locationId=${locationId}`),
    enabled: !!locationId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CalendarEvent> & { calendarId: string; locationId: string; startTime: string; endTime: string }) =>
      fetchAPI("calendars/events", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...data }: { eventId: string; title?: string; startTime?: string; endTime?: string; status?: string }) =>
      fetchAPI(`calendars/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      fetchAPI(`calendars/events/${eventId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}
