"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trash2,
  Pencil,
  Clock,
  Calendar,
  User,
  ExternalLink,
  MapPin,
  StickyNote,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useUpdateEvent, useDeleteEvent } from "@/hooks/use-calendar";
import { formatDateTime } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

interface EventDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed", icon: CheckCircle2, color: "text-green-600" },
  { value: "new", label: "New", icon: AlertCircle, color: "text-blue-600" },
  { value: "showed", label: "Showed", icon: CheckCircle2, color: "text-green-600" },
  { value: "noshow", label: "No Show", icon: XCircle, color: "text-red-600" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-gray-500" },
];

export function EventDetail({ open, onOpenChange, event }: EventDetailProps) {
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    notes: "",
  });

  if (!event) return null;

  const status = event.appointmentStatus || event.appoinmentStatus || event.status || "new";
  const contactId = event.contactId;

  const statusColors: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    confirmed: "success",
    new: "secondary",
    pending: "warning",
    cancelled: "destructive",
    showed: "success",
    noshow: "destructive",
  };

  const startEdit = () => {
    const s = new Date(event.startTime);
    const e = new Date(event.endTime);
    setEditData({
      title: event.title || "",
      startDate: s.toISOString().split("T")[0],
      startTime: `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`,
      endDate: e.toISOString().split("T")[0],
      endTime: `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`,
      notes: event.notes || event.description || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateEvent.mutateAsync({
      eventId: event.id,
      title: editData.title,
      startTime: `${editData.startDate}T${editData.startTime}:00`,
      endTime: `${editData.endDate}T${editData.endTime}:00`,
    });
    setIsEditing(false);
    onOpenChange(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateEvent.mutateAsync({
      eventId: event.id,
      status: newStatus,
    });
  };

  const handleDelete = async () => {
    if (confirm("Delete this event?")) {
      await deleteEvent.mutateAsync(event.id);
      onOpenChange(false);
    }
  };

  const startDt = new Date(event.startTime);
  const endDt = new Date(event.endTime);
  const duration = Math.round((endDt.getTime() - startDt.getTime()) / 60000);
  const durationStr = duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60 > 0 ? `${duration % 60}m` : ""}` : `${duration}m`;

  return (
    <Dialog open={open} onOpenChange={(o) => { setIsEditing(false); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            {isEditing ? "Edit Appointment" : event.title || "Appointment"}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={editData.startDate} onChange={e => setEditData({ ...editData, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={editData.startTime} onChange={e => setEditData({ ...editData, startTime: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={editData.endDate} onChange={e => setEditData({ ...editData, endDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={editData.endTime} onChange={e => setEditData({ ...editData, endTime: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateEvent.isPending}>
                {updateEvent.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={statusColors[status] || "secondary"}>
                  {status}
                </Badge>
                <span className="text-xs text-gray-400">{durationStr}</span>
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-1.5">
                        <opt.icon className={`h-3 w-3 ${opt.color}`} />
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-900 font-medium">
                    {startDt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {startDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    {" — "}
                    {endDt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </p>
                </div>
              </div>

              {/* Contact link */}
              {contactId && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <Link
                    href={`/contacts/${contactId}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    {event.title || "View contact"}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Meeting link */}
              {event.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <a
                    href={event.address}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate flex items-center gap-1"
                  >
                    {event.address.includes("meet.google") ? "Google Meet" :
                     event.address.includes("zoom") ? "Zoom Meeting" :
                     "Meeting Link"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Notes */}
              {(event.notes || event.description) && (
                <div className="flex items-start gap-3 text-sm">
                  <StickyNote className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-600 text-xs">{event.description || event.notes}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleteEvent.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {deleteEvent.isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
