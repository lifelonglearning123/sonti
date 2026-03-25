"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface CalendarGridProps {
  events: CalendarEvent[];
  isLoading: boolean;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarGrid({ events, isLoading, currentDate, onDateSelect, onEventClick }: CalendarGridProps) {

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();

  const days = useMemo(() => {
    const result: Array<{ date: number; isCurrentMonth: boolean; events: CalendarEvent[] }> = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      result.push({ date: prevMonthDays - i, isCurrentMonth: false, events: [] });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = events.filter((e) => {
        const eDate = new Date(e.startTime);
        return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === d;
      });
      result.push({ date: d, isCurrentMonth: true, events: dayEvents });
    }

    // Next month padding
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ date: i, isCurrentMonth: false, events: [] });
    }

    return result;
  }, [year, month, daysInMonth, firstDayOfWeek, events]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((day) => (
            <div key={day} className="px-3 py-2 text-xs font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isToday =
              day.isCurrentMonth &&
              day.date === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <div
                key={idx}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    onDateSelect(new Date(year, month, day.date));
                  }
                }}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                  !day.isCurrentMonth && "bg-gray-50/50"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-7 w-7 rounded-full text-sm",
                    isToday && "bg-blue-600 text-white font-semibold",
                    !isToday && day.isCurrentMonth && "text-gray-900",
                    !day.isCurrentMonth && "text-gray-300"
                  )}
                >
                  {day.date}
                </span>
                <div className="mt-1 space-y-0.5">
                  {day.events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 truncate cursor-pointer hover:bg-blue-200 transition-colors"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-[10px] text-gray-400 px-1.5">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
