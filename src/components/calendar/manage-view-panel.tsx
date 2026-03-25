"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Calendar } from "@/types/calendar";
import type { GHLUser, ViewByType, CalendarFilters } from "@/types/calendar";

// Predefined colors for calendar/user indicators
const INDICATOR_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
];

function getColor(index: number): string {
  return INDICATOR_COLORS[index % INDICATOR_COLORS.length];
}

interface ManageViewPanelProps {
  calendars: Calendar[];
  users: GHLUser[];
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <span className="text-xs text-gray-400">{count}</span>
      </button>
      {isOpen && <div className="pb-2">{children}</div>}
    </div>
  );
}

interface CheckboxItemProps {
  label: string;
  sublabel?: string;
  color: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxItem({ label, sublabel, color, checked, onChange }: CheckboxItemProps) {
  return (
    <label className="flex items-center gap-3 px-4 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
            checked ? "border-transparent" : "border-gray-300 bg-white"
          )}
          style={checked ? { backgroundColor: color, borderColor: color } : undefined}
        >
          {checked && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 truncate">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 truncate">{sublabel}</p>}
      </div>
    </label>
  );
}

export function ManageViewPanel({ calendars, users, filters, onFiltersChange }: ManageViewPanelProps) {
  const viewByOptions: { value: ViewByType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "appointments", label: "Appointments" },
    { value: "blocked", label: "Blocked Slots" },
  ];

  const updateFilter = <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleUserId = (userId: string, checked: boolean) => {
    const next = checked
      ? [...filters.selectedUserIds, userId]
      : filters.selectedUserIds.filter((id) => id !== userId);
    updateFilter("selectedUserIds", next);
  };

  const toggleCalendarId = (calendarId: string, checked: boolean) => {
    const next = checked
      ? [...filters.selectedCalendarIds, calendarId]
      : filters.selectedCalendarIds.filter((id) => id !== calendarId);
    updateFilter("selectedCalendarIds", next);
  };

  const hasActiveFilters =
    filters.viewByType !== "all" ||
    filters.selectedUserIds.length > 0 ||
    filters.selectedCalendarIds.length > 0 ||
    filters.selectedGroupIds.length > 0 ||
    filters.searchQuery !== "";

  const clearAll = () => {
    onFiltersChange({
      viewByType: "all",
      selectedUserIds: [],
      selectedCalendarIds: [],
      selectedGroupIds: [],
      searchQuery: "",
    });
  };

  // Filter items by search query
  const filteredUsers = users.filter((u) => {
    if (!filters.searchQuery) return true;
    const q = filters.searchQuery.toLowerCase();
    const name = (u.name || `${u.firstName || ""} ${u.lastName || ""}`).toLowerCase();
    return name.includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const filteredCalendars = calendars.filter((c) => {
    if (!filters.searchQuery) return true;
    return c.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Manage View</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {/* View By Type */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">View By Type</p>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {viewByOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter("viewByType", opt.value)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-xs font-medium transition-colors border-r border-gray-200 last:border-r-0",
                  filters.viewByType === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            placeholder="Search users, calendars..."
            className="h-8 pl-8 pr-8 text-sm"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter("searchQuery", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      <ScrollArea className="flex-1">
        <div>
          {/* Users section */}
          <CollapsibleSection title="Users" count={filteredUsers.length}>
            {filteredUsers.length === 0 ? (
              <p className="px-4 py-2 text-xs text-gray-400">No users found</p>
            ) : (
              filteredUsers.map((user, idx) => {
                const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
                return (
                  <CheckboxItem
                    key={user.id}
                    label={name}
                    sublabel={user.email}
                    color={getColor(idx)}
                    checked={filters.selectedUserIds.includes(user.id)}
                    onChange={(checked) => toggleUserId(user.id, checked)}
                  />
                );
              })
            )}
          </CollapsibleSection>

          {/* Calendars section */}
          <CollapsibleSection title="Calendars" count={filteredCalendars.length}>
            {filteredCalendars.length === 0 ? (
              <p className="px-4 py-2 text-xs text-gray-400">No calendars found</p>
            ) : (
              filteredCalendars.map((cal, idx) => (
                <CheckboxItem
                  key={cal.id}
                  label={cal.name}
                  sublabel={cal.calendarType || undefined}
                  color={getColor(idx + users.length)}
                  checked={filters.selectedCalendarIds.includes(cal.id)}
                  onChange={(checked) => toggleCalendarId(cal.id, checked)}
                />
              ))
            )}
          </CollapsibleSection>

          {/* Groups section */}
          <CollapsibleSection title="Groups" count={0} defaultOpen={false}>
            <p className="px-4 py-2 text-xs text-gray-400">No groups available</p>
          </CollapsibleSection>
        </div>
      </ScrollArea>
    </div>
  );
}
