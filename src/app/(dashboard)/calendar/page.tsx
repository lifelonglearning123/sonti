"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal, CalendarDays, List } from "lucide-react";
import { useCalendars, useCalendarEvents, useUsers } from "@/hooks/use-calendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { WeekView } from "@/components/calendar/week-view";
import { BookingSheet } from "@/components/calendar/booking-sheet";
import { EventDetail } from "@/components/calendar/event-detail";
import { ManageViewPanel } from "@/components/calendar/manage-view-panel";
import { AppointmentList } from "@/components/calendar/appointment-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";
import type { CalendarFilters } from "@/types/calendar";

type ViewMode = "month" | "week";
type PageTab = "calendar" | "appointments";

const DEFAULT_FILTERS: CalendarFilters = {
  viewByType: "all",
  selectedUserIds: [],
  selectedCalendarIds: [],
  selectedGroupIds: [],
  searchQuery: "",
};

function getWeekRange(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { start, end };
}

function formatWeekRange(date: Date): string {
  const { start, end } = getWeekRange(date);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} \u2013 ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

// Mini Calendar component for quick date navigation
function MiniCalendar({ currentDate, onDateSelect }: { currentDate: Date; onDateSelect: (date: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  const days = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startPad = firstDay.getDay();
    const result: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) result.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    return result;
  }, [viewMonth]);

  const today = new Date();
  const isToday = (d: Date) => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  const isSelected = (d: Date) => d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth() && d.getDate() === currentDate.getDate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-medium text-gray-400 dark:text-gray-500 text-center py-1">{d}</div>
        ))}
        {days.map((day, i) => (
          <button
            key={i}
            disabled={!day}
            onClick={() => day && onDateSelect(day)}
            className={cn(
              "text-[11px] h-7 w-7 mx-auto rounded-full flex items-center justify-center transition-colors",
              !day && "invisible",
              day && isToday(day) && !isSelected(day) && "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold",
              day && isSelected(day) && "bg-blue-600 text-white font-bold",
              day && !isToday(day) && !isSelected(day) && "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {day?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const locationId = (session as any)?.locationId || "";

  // Page-level state
  const [activeTab, setActiveTab] = useState<PageTab>("calendar");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showManageView, setShowManageView] = useState(true);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);

  // Listen for new appointment shortcut
  useEffect(() => {
    const handler = () => {
      setSelectedDate(new Date());
      setShowBooking(true);
    };
    document.addEventListener("shortcut-new-appointment", handler);
    return () => document.removeEventListener("shortcut-new-appointment", handler);
  }, []);

  // Data fetching
  const { data: calendarsData } = useCalendars(locationId);
  const calendars = calendarsData?.calendars || [];
  const { data: usersData } = useUsers(locationId);
  const users = usersData?.users || [];

  // Determine which calendar IDs to fetch based on filters
  const calendarIdsToFetch = useMemo(() => {
    const allIds = calendars.map((c) => c.id);
    if (filters.selectedCalendarIds.length > 0) {
      return filters.selectedCalendarIds.filter((id) => allIds.includes(id));
    }
    return allIds;
  }, [calendars, filters.selectedCalendarIds]);

  // Date range based on view mode
  const range =
    viewMode === "week"
      ? getWeekRange(currentDate)
      : getMonthRange(currentDate);
  const startDate = range.start.toISOString();
  const endDate = range.end.toISOString();

  const { data: eventsData, isLoading } = useCalendarEvents(
    locationId,
    calendarIdsToFetch,
    startDate,
    endDate
  );
  const rawEvents = eventsData?.events || [];

  // Apply filters to events
  const events = useMemo(() => {
    let filtered = rawEvents;

    // Filter by view type
    if (filters.viewByType === "appointments") {
      filtered = filtered.filter(
        (e) => e.appointmentStatus !== "blocked" && e.status !== "blocked"
      );
    } else if (filters.viewByType === "blocked") {
      filtered = filtered.filter(
        (e) => e.appointmentStatus === "blocked" || e.status === "blocked"
      );
    }

    // Filter by assigned user
    if (filters.selectedUserIds.length > 0) {
      filtered = filtered.filter(
        (e) => e.assignedUserId && filters.selectedUserIds.includes(e.assignedUserId)
      );
    }

    return filtered;
  }, [rawEvents, filters.viewByType, filters.selectedUserIds]);

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleSlotClick = (date: Date) => {
    setSelectedDate(date);
    setShowBooking(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowBooking(true);
  };

  const handleMiniCalendarSelect = (date: Date) => {
    setCurrentDate(date);
  };

  const handleFiltersChange = useCallback((newFilters: CalendarFilters) => {
    setFilters(newFilters);
  }, []);

  const titleText =
    viewMode === "week"
      ? formatWeekRange(currentDate)
      : currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

  return (
    <div>
      {/* Page-level tabs (GHL style) */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 mb-4">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setActiveTab("calendar")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "calendar"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === "appointments"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            )}
          >
            <List className="h-4 w-4" />
            Appointment List View
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToday} className="btn-press">
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center tracking-tight">
              {titleText}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {/* View toggle - only show in calendar tab */}
          {activeTab === "calendar" && (
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "week" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${viewMode === "month" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                Month
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => { setSelectedDate(new Date()); setShowBooking(true); }} className="btn-press">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          <Button
            variant={showManageView ? "default" : "outline"}
            size="sm"
            onClick={() => setShowManageView(!showManageView)}
            className={cn(
              showManageView && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Manage View
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "grid gap-6",
          showManageView ? "grid-cols-[1fr_300px]" : "grid-cols-1"
        )}
      >
        {/* Main content */}
        <div>
          {activeTab === "calendar" ? (
            viewMode === "week" ? (
              <WeekView
                events={events}
                currentDate={currentDate}
                onEventClick={setSelectedEvent}
                onSlotClick={handleSlotClick}
              />
            ) : (
              <CalendarGrid
                events={events}
                isLoading={isLoading}
                currentDate={currentDate}
                onDateSelect={handleDateSelect}
                onEventClick={setSelectedEvent}
              />
            )
          ) : (
            <AppointmentList
              events={events}
              calendars={calendars}
              isLoading={isLoading}
              onEventClick={setSelectedEvent}
            />
          )}
        </div>

        {/* Right sidebar - Mini Calendar + Manage View Panel */}
        {showManageView && (
          <div className="h-[calc(100vh-240px)]">
            <MiniCalendar currentDate={currentDate} onDateSelect={handleMiniCalendarSelect} />
            <ManageViewPanel
              calendars={calendars}
              users={users}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        )}
      </div>

      <BookingSheet
        open={showBooking}
        onOpenChange={setShowBooking}
        selectedDate={selectedDate}
        calendars={calendars}
        locationId={locationId}
      />

      <EventDetail
        open={!!selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </div>
  );
}
