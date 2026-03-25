"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, X, Loader2 } from "lucide-react";
import { useCreateEvent } from "@/hooks/use-calendar";
import { useContacts } from "@/hooks/use-contacts";
import { getInitials } from "@/lib/utils";
import type { Calendar as CalendarType } from "@/types/calendar";
import type { Contact } from "@/types/contact";

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  calendars: CalendarType[];
  locationId: string;
}

export function BookingSheet({ open, onOpenChange, selectedDate, calendars, locationId }: BookingSheetProps) {
  const createEvent = useCreateEvent();
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [formData, setFormData] = useState({
    calendarId: "",
    title: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const { data: contactResults, isLoading: searchingContacts } = useContacts(
    locationId,
    contactSearch,
    1,
    8
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        calendarId: calendars[0]?.id || "",
        title: "",
        startTime: selectedDate ? `${String(selectedDate.getHours()).padStart(2, "0")}:00` : "",
        endTime: selectedDate ? `${String(Math.min(selectedDate.getHours() + 1, 23)).padStart(2, "0")}:00` : "",
        notes: "",
      });
      setSelectedContact(null);
      setContactSearch("");
      setShowContactSearch(false);
    }
  }, [open, calendars, selectedDate]);

  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : new Date().toISOString().split("T")[0];

  const contactName = (c: Contact) =>
    c.contactName || c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent.mutateAsync({
        calendarId: formData.calendarId,
        locationId,
        title: formData.title,
        startTime: `${dateStr}T${formData.startTime}:00`,
        endTime: `${dateStr}T${formData.endTime}:00`,
        notes: formData.notes,
        contactId: selectedContact?.id || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Schedule for {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {calendars.length > 1 && (
            <div className="space-y-2">
              <Label>Calendar</Label>
              <Select
                value={formData.calendarId}
                onValueChange={(v) => setFormData({ ...formData, calendarId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Meeting with client"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Time</Label>
              <Input
                id="start"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Time</Label>
              <Input
                id="end"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          {/* Contact search */}
          <div className="space-y-2">
            <Label>Contact (optional)</Label>
            {selectedContact ? (
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(contactName(selectedContact))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{contactName(selectedContact)}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedContact.email || selectedContact.phone || ""}</p>
                </div>
                <button type="button" onClick={() => setSelectedContact(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={contactSearch}
                    onChange={(e) => { setContactSearch(e.target.value); setShowContactSearch(true); }}
                    onFocus={() => setShowContactSearch(true)}
                    placeholder="Search contacts..."
                    className="pl-9"
                  />
                </div>
                {showContactSearch && contactSearch && (
                  <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {searchingContacts ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                      </div>
                    ) : (contactResults?.contacts || []).length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">No contacts found</p>
                    ) : (
                      (contactResults?.contacts || []).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedContact(c);
                            setShowContactSearch(false);
                            setContactSearch("");
                            if (!formData.title) setFormData({ ...formData, title: contactName(c) });
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px]">{getInitials(contactName(c))}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{contactName(c)}</p>
                            <p className="text-xs text-gray-500 truncate">{c.email || c.phone || ""}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
