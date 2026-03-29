"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useContact } from "@/hooks/use-contacts";
import { useCalendars } from "@/hooks/use-calendar";
import { ContactInfoPanel } from "@/components/contacts/contact-info-panel";
import { ContactConversation } from "@/components/contacts/contact-conversation";
import { ContactActivityPanel } from "@/components/contacts/contact-activity-panel";
import { BookingSheet } from "@/components/calendar/booking-sheet";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const contactId = params.id as string;
  const locationId = (session as any)?.locationId || (session as any)?.user?.locationId || "";
  const { data, isLoading } = useContact(contactId);
  const contact = data?.contact;
  const [showBooking, setShowBooking] = useState(false);

  const { data: calendarsData } = useCalendars(locationId);
  const calendars = calendarsData?.calendars || [];

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] -m-6 border-t border-gray-200">
        <div className="w-[320px] border-r border-gray-200 p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="w-[300px] border-l border-gray-200 p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <p className="text-gray-500">Contact not found</p>
      </div>
    );
  }

  const contactName =
    contact.contactName ||
    contact.name ||
    `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
    "Unknown";

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 border-t border-gray-200">
      {/* Left: Contact Info */}
      <div className="w-[320px] shrink-0">
        <ContactInfoPanel
          contact={contact}
          locationId={locationId}
          onBookMeeting={() => setShowBooking(true)}
        />
      </div>

      {/* Center: Conversation */}
      <div className="flex-1 border-l border-gray-200">
        <ContactConversation
          contactId={contactId}
          contactName={contactName}
          contactPhone={contact.phone}
          locationId={locationId}
        />
      </div>

      {/* Right: Activity */}
      <div className="w-[300px] shrink-0">
        <ContactActivityPanel contactId={contactId} contact={contact} locationId={locationId} />
      </div>

      {/* Booking dialog */}
      <BookingSheet
        open={showBooking}
        onOpenChange={setShowBooking}
        selectedDate={new Date()}
        calendars={calendars}
        locationId={locationId}
      />
    </div>
  );
}
