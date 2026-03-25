export interface Calendar {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  slug?: string;
  widgetSlug?: string;
  calendarType?: string;
  widgetType?: string;
  eventTitle?: string;
  eventColor?: string;
  meetingLocation?: string;
  slotDuration?: number;
  slotInterval?: number;
  isActive?: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  locationId: string;
  contactId?: string;
  title: string;
  status?: string;
  appointmentStatus?: string;
  appoinmentStatus?: string;
  assignedUserId?: string;
  notes?: string;
  description?: string;
  address?: string;
  startTime: string;
  endTime: string;
  dateAdded?: string;
  dateUpdated?: string;
  isRecurring?: boolean;
}

export interface FreeSlot {
  slots: string[];
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

export interface GHLUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles?: { type: string; role: string; locationIds: string[] };
}

export interface CalendarGroup {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  calendarIds?: string[];
  isActive?: boolean;
}

export type ViewByType = "all" | "appointments" | "blocked";

export interface CalendarFilters {
  viewByType: ViewByType;
  selectedUserIds: string[];
  selectedCalendarIds: string[];
  selectedGroupIds: string[];
  searchQuery: string;
}
