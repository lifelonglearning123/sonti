"use client";

import { useMemo } from "react";
import { Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CalendarEvent, Calendar as CalendarType } from "@/types/calendar";

interface AppointmentListProps {
  events: CalendarEvent[];
  calendars: CalendarType[];
  isLoading: boolean;
  onEventClick: (event: CalendarEvent) => void;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  confirmed: "success",
  showed: "success",
  completed: "success",
  new: "default",
  pending: "warning",
  cancelled: "destructive",
  noshow: "destructive",
  no_show: "destructive",
};

function getEventStatus(event: CalendarEvent): string {
  return event.appointmentStatus || event.appoinmentStatus || event.status || "scheduled";
}

function getCalendarName(calendarId: string, calendars: CalendarType[]): string {
  return calendars.find((c) => c.id === calendarId)?.name || "Unknown Calendar";
}

export function AppointmentList({ events, calendars, isLoading, onEventClick }: AppointmentListProps) {
  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    [events]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-16 text-center">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No appointments found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your date range or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Calendar</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date / Time</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-50">
        {sortedEvents.map((event) => {
          const status = getEventStatus(event);
          const calendarName = getCalendarName(event.calendarId, calendars);
          const startDate = new Date(event.startTime);
          const endDate = new Date(event.endTime);
          const timeStr = `${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
          const dateStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3.5 cursor-pointer hover:bg-blue-50/50 transition-colors items-center"
            >
              {/* Title */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.title || "Untitled"}
                </p>
                {event.notes && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{event.notes}</p>
                )}
              </div>

              {/* Contact */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-gray-400" />
                </div>
                <span className="text-sm text-gray-600 truncate">
                  {event.contactId ? `Contact` : "—"}
                </span>
              </div>

              {/* Calendar */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span className="text-sm text-gray-600 truncate">{calendarName}</span>
              </div>

              {/* Date/Time */}
              <div className="min-w-0">
                <p className="text-sm text-gray-900">{dateStr}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{timeStr}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <Badge
                  variant={STATUS_VARIANT[status] || "secondary"}
                  className="capitalize"
                >
                  {status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {sortedEvents.length} appointment{sortedEvents.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
