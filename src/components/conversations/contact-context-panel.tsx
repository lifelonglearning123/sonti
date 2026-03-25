"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Building2,
  Tag,
  StickyNote,
  DollarSign,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useContact,
  useContactNotes,
  useCreateNote,
  useContactAppointments,
  useContactOpportunities,
  useAddTag,
  useRemoveTag,
} from "@/hooks/use-contacts";
import { getInitials, cn, timeAgo } from "@/lib/utils";

interface ContactContextPanelProps {
  contactId: string;
  locationId: string;
}

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-red-100 text-red-700",
  "bg-indigo-100 text-indigo-700",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function ContactContextPanel({ contactId, locationId }: ContactContextPanelProps) {
  const { data: contactData, isLoading: contactLoading } = useContact(contactId);
  const { data: notesData } = useContactNotes(contactId);
  const { data: apptData } = useContactAppointments(contactId);
  const { data: opps } = useContactOpportunities(locationId, contactId);
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const createNote = useCreateNote();

  const [showNotes, setShowNotes] = useState(true);
  const [showOpps, setShowOpps] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showAppts, setShowAppts] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const contact = contactData?.contact;
  const notes = notesData?.notes || [];
  const appointments = apptData?.events || [];
  const opportunities = opps || [];

  if (contactLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Contact not found
      </div>
    );
  }

  const name = `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown";

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Contact header */}
        <div className="text-center">
          <Link href={`/contacts/${contactId}`} className="inline-block group">
            <Avatar className="h-14 w-14 mx-auto group-hover:ring-2 group-hover:ring-blue-300 transition-all">
              <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <h3 className="mt-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
          </Link>
          <Link
            href={`/contacts/${contactId}`}
            className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="h-3 w-3" />
            View full profile
          </Link>
        </div>

        {/* Contact info */}
        <div className="space-y-2 bg-gray-50 rounded-lg p-3">
          {contact.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-700 truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-700">{contact.phone}</span>
            </div>
          )}
          {contact.companyName && (
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-700">{contact.companyName}</span>
            </div>
          )}
          {contact.source && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-500">Source:</span>
              <span className="text-gray-700">{contact.source}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Tags */}
        <div>
          <button
            onClick={() => setShowTags(!showTags)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Tags
              {(contact.tags?.length ?? 0) > 0 && (
                <span className="text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">
                  {contact.tags!.length}
                </span>
              )}
            </div>
            {showTags ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {showTags && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1">
                {(contact.tags || []).map((tag: string) => (
                  <span
                    key={tag}
                    className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium", tagColor(tag))}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag.mutate({ contactId, tags: [tag] })}
                      className="hover:opacity-70"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag.trim()) {
                      addTag.mutate({ contactId, tags: [newTag.trim()] });
                      setNewTag("");
                    }
                  }}
                  className="h-6 text-[10px] flex-1"
                />
                <Button
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={!newTag.trim()}
                  onClick={() => {
                    if (newTag.trim()) {
                      addTag.mutate({ contactId, tags: [newTag.trim()] });
                      setNewTag("");
                    }
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <StickyNote className="h-3 w-3" />
              Notes
              {notes.length > 0 && (
                <span className="text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">
                  {notes.length}
                </span>
              )}
            </div>
            {showNotes ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {showNotes && (
            <div className="mt-2 space-y-2">
              {/* Add note */}
              {addingNote ? (
                <div className="space-y-1.5">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a note..."
                    className="w-full text-xs border rounded-md p-2 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] flex-1"
                      disabled={!newNote.trim() || createNote.isPending}
                      onClick={() => {
                        createNote.mutate(
                          { contactId, body: newNote.trim() },
                          { onSuccess: () => { setNewNote(""); setAddingNote(false); } }
                        );
                      }}
                    >
                      {createNote.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setAddingNote(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingNote(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  Add note
                </button>
              )}

              {/* Notes list */}
              {notes.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {notes.map((note: { id: string; body: string; dateAdded: string }) => (
                    <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{note.body}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {timeAgo(note.dateAdded)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">No notes yet</p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Opportunities */}
        <div>
          <button
            onClick={() => setShowOpps(!showOpps)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              Opportunities
              {opportunities.length > 0 && (
                <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5">
                  {opportunities.length}
                </span>
              )}
            </div>
            {showOpps ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {showOpps && (
            <div className="mt-2 space-y-1.5">
              {opportunities.length > 0 ? (
                opportunities.map((opp: { id: string; name: string; status: string; monetaryValue?: number }) => (
                  <Link
                    key={opp.id}
                    href="/pipeline"
                    className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <DollarSign className="h-3 w-3 text-green-400 shrink-0" />
                      <span className="truncate text-gray-700">{opp.name}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                        opp.status === "open" ? "bg-blue-100 text-blue-700" :
                        opp.status === "won" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      )}
                    >
                      {opp.status}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-[10px] text-gray-400">No opportunities</p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Appointments */}
        <div>
          <button
            onClick={() => setShowAppts(!showAppts)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Appointments
              {appointments.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5">
                  {appointments.length}
                </span>
              )}
            </div>
            {showAppts ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {showAppts && (
            <div className="mt-2 space-y-1.5">
              {appointments.length > 0 ? (
                appointments.map((appt: { id: string; title?: string; startTime?: string; appointmentStatus?: string }) => (
                  <Link
                    key={appt.id}
                    href="/calendar"
                    className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="truncate text-gray-700">{appt.title || "Appointment"}</span>
                    </div>
                    {appt.startTime && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(appt.startTime).toLocaleDateString()}
                      </span>
                    )}
                  </Link>
                ))
              ) : (
                <p className="text-[10px] text-gray-400">No appointments</p>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <Separator />
        <div className="space-y-1.5">
          <Link
            href={`/contacts/${contactId}`}
            className="flex items-center gap-2 w-full py-2 px-3 rounded-md text-xs text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="h-3.5 w-3.5 text-gray-400" />
            View full contact
            <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
          </Link>
          <Link
            href="/pipeline"
            className="flex items-center gap-2 w-full py-2 px-3 rounded-md text-xs text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
            View pipeline
            <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
          </Link>
          <Link
            href="/calendar"
            className="flex items-center gap-2 w-full py-2 px-3 rounded-md text-xs text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            View calendar
            <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </ScrollArea>
  );
}
