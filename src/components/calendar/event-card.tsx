import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
  const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
    confirmed: "success",
    pending: "warning",
    cancelled: "destructive",
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatDateTime(event.startTime)}</span>
        </div>
      </div>
      <Badge variant={statusColors[event.appointmentStatus || event.appoinmentStatus || event.status || ""] || "secondary"} className="shrink-0">
        {event.appointmentStatus || event.appoinmentStatus || event.status || "scheduled"}
      </Badge>
    </div>
  );
}
