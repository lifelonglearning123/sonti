"use client";

import { useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7AM to 8PM
const HOUR_HEIGHT = 64; // pixels per hour

// Color palette for calendar events (by calendarId hash)
const EVENT_COLORS = [
  { bg: "bg-blue-500", hover: "hover:bg-blue-600", light: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-purple-500", hover: "hover:bg-purple-600", light: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-green-500", hover: "hover:bg-green-600", light: "bg-green-100 dark:bg-green-900/50", text: "text-green-700 dark:text-green-300" },
  { bg: "bg-amber-500", hover: "hover:bg-amber-600", light: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-pink-500", hover: "hover:bg-pink-600", light: "bg-pink-100 dark:bg-pink-900/50", text: "text-pink-700 dark:text-pink-300" },
  { bg: "bg-cyan-500", hover: "hover:bg-cyan-600", light: "bg-cyan-100 dark:bg-cyan-900/50", text: "text-cyan-700 dark:text-cyan-300" },
];

function getEventColor(calendarId?: string): (typeof EVENT_COLORS)[0] {
  if (!calendarId) return EVENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < calendarId.length; i++) {
    hash = calendarId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Go to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isAllDayEvent(event: CalendarEvent): boolean {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const durationHours = (end.getTime() - start.getTime()) / 3600000;
  return durationHours >= 23;
}

export function WeekView({
  events,
  currentDate,
  onEventClick,
  onSlotClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const today = new Date();
  const now = new Date();
  const gridRef = useRef<HTMLDivElement>(null);

  // Separate all-day events
  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDay: CalendarEvent[] = [];
    const timed: CalendarEvent[] = [];
    events.forEach((e) => {
      if (isAllDayEvent(e)) allDay.push(e);
      else timed.push(e);
    });
    return { allDayEvents: allDay, timedEvents: timed };
  }, [events]);

  // Scroll to current time on mount
  useEffect(() => {
    if (gridRef.current) {
      const currentHour = now.getHours();
      const scrollTo = Math.max(0, (currentHour - 7) * HOUR_HEIGHT - 100);
      gridRef.current.scrollTo({ top: scrollTo, behavior: "smooth" });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header - day names and dates */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="px-2 py-3 text-xs text-gray-400 dark:text-gray-500 text-center border-r border-gray-100 dark:border-gray-800">
          GMT
        </div>
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={cn(
                "px-2 py-3 text-center border-r border-gray-100 dark:border-gray-800 last:border-r-0",
                isToday && "bg-blue-50 dark:bg-blue-950/30"
              )}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {dayNames[i]}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold mt-0.5",
                  isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                )}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      {allDayEvents.length > 0 && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="px-2 py-2 text-[10px] text-gray-400 dark:text-gray-500 text-center border-r border-gray-100 dark:border-gray-800 flex items-center justify-center">
            All Day
          </div>
          {weekDays.map((day, i) => {
            const dayAllDay = allDayEvents.filter((e) => isSameDay(new Date(e.startTime), day));
            return (
              <div key={i} className="px-1 py-1.5 border-r border-gray-100 dark:border-gray-800 last:border-r-0 space-y-0.5">
                {dayAllDay.map((event) => {
                  const color = getEventColor(event.calendarId);
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn("w-full text-left px-2 py-0.5 rounded text-[10px] font-medium truncate", color.light, color.text, "hover:opacity-80 transition-opacity")}
                    >
                      {event.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 320px)" }}
      >
        {/* Hours column + day columns */}
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            {/* Hour label */}
            <div
              className="px-2 border-r border-gray-100 dark:border-gray-800 text-right pr-3 relative"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="text-[10px] text-gray-400 dark:text-gray-500 absolute -top-2 right-3">
                {hour === 0
                  ? "12AM"
                  : hour < 12
                    ? `${hour}AM`
                    : hour === 12
                      ? "12PM"
                      : `${hour - 12}PM`}
              </span>
            </div>
            {/* Day cells */}
            {weekDays.map((day, dayIdx) => {
              const isToday = isSameDay(day, today);
              const slotDate = new Date(day);
              slotDate.setHours(hour, 0, 0, 0);

              // Events that start in this hour
              const hourEvents = timedEvents.filter((e) => {
                const eStart = new Date(e.startTime);
                return isSameDay(eStart, day) && eStart.getHours() === hour;
              });

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "border-r border-b border-gray-50 dark:border-gray-800/50 relative cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors last:border-r-0",
                    isToday && "bg-blue-50/30 dark:bg-blue-950/10"
                  )}
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => onSlotClick(slotDate)}
                >
                  {/* Render events */}
                  {hourEvents.map((event) => {
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(event.endTime);
                    const durationHours =
                      (endTime.getTime() - startTime.getTime()) / 3600000;
                    const timeStr = `${startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${endTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
                    const color = getEventColor(event.calendarId);

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className={cn(
                          "absolute left-0.5 right-0.5 rounded-md px-2 py-1 overflow-hidden cursor-pointer text-white transition-all z-[1]",
                          color.bg,
                          color.hover,
                          "hover:shadow-md"
                        )}
                        style={{
                          top: `${(startTime.getMinutes() / 60) * HOUR_HEIGHT}px`,
                          height: `${Math.max(durationHours * HOUR_HEIGHT, 24)}px`,
                        }}
                      >
                        <p className="text-xs font-medium truncate">
                          {event.title}
                        </p>
                        <p className="text-[10px] opacity-80 truncate">
                          {timeStr}
                        </p>
                      </div>
                    );
                  })}

                  {/* Current time line */}
                  {isToday && hour === now.getHours() && (
                    <div
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-[2]"
                      style={{
                        top: `${(now.getMinutes() / 60) * HOUR_HEIGHT}px`,
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -mt-[5px] -ml-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
