"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  FileText,
  ListTodo,
  Clock,
  Activity,
  MessageSquare,
  CalendarCheck,
  Globe,
  User,
  Link2,
  Tag,
  ArrowUpRight,
  ExternalLink,
  FormInput,
  Copy,
  Check,
  Info,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  cn,
  timeAgo,
  formatDate,
  formatDateTime,
  formatTimelineTimestamp,
  formatDateGroupHeader,
} from "@/lib/utils";
import {
  useContactNotes,
  useCreateNote,
  useDeleteNote,
  useContactTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useContactAppointments,
} from "@/hooks/use-contacts";
import { useConversations, useMessages } from "@/hooks/use-conversations";
import type { Contact } from "@/types/contact";

interface ContactActivityPanelProps {
  contactId: string;
  contact?: Contact;
  locationId?: string;
}

/* ------------------------------------------------------------------ */
/*  Notes Section                                                      */
/* ------------------------------------------------------------------ */

function NotesSection({ contactId }: { contactId: string }) {
  const { data, isLoading } = useContactNotes(contactId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [noteBody, setNoteBody] = useState("");

  const handleAdd = async () => {
    if (!noteBody.trim()) return;
    await createNote.mutateAsync({ contactId, body: noteBody.trim() });
    setNoteBody("");
  };

  const handleDelete = (noteId: string) => {
    if (confirm("Delete this note? This cannot be undone.")) {
      deleteNote.mutate({ contactId, noteId });
    }
  };

  return (
    <div className="space-y-3">
      {/* Add note */}
      <div className="space-y-2">
        <Textarea
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          className="text-sm resize-none border-gray-200 focus:border-blue-300"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!noteBody.trim() || createNote.isPending}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {createNote.isPending ? "Adding..." : "Add Note"}
        </Button>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.notes || []).length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <FileText className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No notes yet</p>
              <p className="text-[10px] text-gray-300 mt-0.5">
                Add a note above to get started
              </p>
            </div>
          ) : (
            (data?.notes || []).map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg bg-gray-50 border border-gray-100 group hover:border-gray-200 transition-colors"
              >
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {note.body}
                </p>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {note.userId && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                        <User className="h-2.5 w-2.5" />
                        {note.userId}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {note.dateAdded ? timeAgo(note.dateAdded) : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tasks Section                                                      */
/* ------------------------------------------------------------------ */

function TasksSection({ contactId }: { contactId: string }) {
  const { data, isLoading } = useContactTasks(contactId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) return;
    await createTask.mutateAsync({
      contactId,
      title: title.trim(),
      dueDate: dueDate || undefined,
    });
    setTitle("");
    setDueDate("");
    setShowForm(false);
  };

  const tasks = data?.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-3">
      {/* Progress indicator */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-gray-400 shrink-0">
            {completedCount}/{totalCount}
          </span>
        </div>
      )}

      {/* Add task */}
      {showForm ? (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="text-sm h-9"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setShowForm(false);
            }}
          />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-sm h-9"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!title.trim() || createTask.isPending}
              className="flex-1"
            >
              {createTask.isPending ? "Adding..." : "Add"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Task
        </Button>
      )}

      {/* Tasks list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <ListTodo className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No tasks yet</p>
              <p className="text-[10px] text-gray-300 mt-0.5">
                Create a task to track work
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-gray-50 group transition-colors"
              >
                <button
                  onClick={() =>
                    updateTask.mutate({
                      contactId,
                      taskId: task.id,
                      completed: !task.completed,
                    })
                  }
                  className="mt-0.5 shrink-0"
                >
                  {task.completed ? (
                    <CheckSquare className="h-4 w-4 text-green-500" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-300 hover:text-blue-500" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      task.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    )}
                  >
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    deleteTask.mutate({ contactId, taskId: task.id })
                  }
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Copyable URL helper                                                */
/* ------------------------------------------------------------------ */

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const truncated =
    url.length > 50 ? url.slice(0, 24) + "..." + url.slice(-20) : url;

  return (
    <span className="inline-flex items-center gap-1 min-w-0">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline truncate"
        title={url}
        onClick={(e) => e.stopPropagation()}
      >
        {truncated}
      </a>
      <button
        onClick={handleCopy}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        title="Copy URL"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Source Type Badge                                                   */
/* ------------------------------------------------------------------ */

function getSourceTypeBadge(medium?: string, sessionSource?: string) {
  const m = (medium || "").toLowerCase();
  const s = (sessionSource || "").toLowerCase();

  if (m.includes("form") || m.includes("order_form"))
    return { label: "Form", className: "bg-green-100 text-green-700" };
  if (s.includes("organic") || m.includes("organic"))
    return { label: "Organic", className: "bg-emerald-100 text-emerald-700" };
  if (s.includes("direct") || m === "direct")
    return { label: "Direct", className: "bg-gray-100 text-gray-700" };
  if (
    m.includes("cpc") ||
    m.includes("paid") ||
    m.includes("ppc") ||
    s.includes("paid")
  )
    return { label: "Paid", className: "bg-amber-100 text-amber-700" };
  if (m.includes("social") || s.includes("social"))
    return {
      label: "Social Media",
      className: "bg-indigo-100 text-indigo-700",
    };
  if (m.includes("referral") || s.includes("referral"))
    return { label: "Referral", className: "bg-purple-100 text-purple-700" };
  if (m || s)
    return {
      label: m || s || "Unknown",
      className: "bg-blue-50 text-blue-600",
    };
  return { label: "Direct", className: "bg-gray-100 text-gray-700" };
}

/* ------------------------------------------------------------------ */
/*  Attribution Source interface (enriched)                             */
/* ------------------------------------------------------------------ */

interface AttributionSource {
  url?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmContent?: string;
  utmTerm?: string;
  utmCampaign?: string;
  referrer?: string;
  medium?: string;
  mediumId?: string;
  fbclid?: string;
  fbp?: string;
  gclid?: string;
  gaClientId?: string;
  gaSessionId?: string;
  sessionSource?: string;
  userAgent?: string;
  ip?: string;
}

/* ------------------------------------------------------------------ */
/*  Detail Table Row                                                   */
/* ------------------------------------------------------------------ */

function DetailRow({
  label,
  value,
  isUrl,
}: {
  label: string;
  value?: string | null;
  isUrl?: boolean;
}) {
  if (!value) return null;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-4 text-xs text-gray-500 font-medium whitespace-nowrap align-top">
        {label}
      </td>
      <td className="py-2 text-xs text-gray-800 text-right break-all">
        {isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            {value.length > 60
              ? value.slice(0, 30) + "..." + value.slice(-25)
              : value}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          value
        )}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail Table Section                                               */
/* ------------------------------------------------------------------ */

function DetailSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value?: string | null; isUrl?: boolean }>;
}) {
  const visibleRows = rows.filter((r) => r.value);
  if (visibleRows.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <tbody>
            {visibleRows.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Detail Dialog                                             */
/* ------------------------------------------------------------------ */

function ActivityDetailDialog({
  event,
  open,
  onClose,
  contact,
}: {
  event: TimelineEvent | null;
  open: boolean;
  onClose: () => void;
  contact?: Contact;
}) {
  if (!event) return null;

  const attribution =
    contact?.attributionSource || contact?.lastAttributionSource;

  const renderContent = () => {
    switch (event.type) {
      case "system": {
        if (event.title === "Contact created") {
          return (
            <div className="space-y-4">
              <DetailSection
                title="Page Details"
                rows={[
                  {
                    label: "Page Url",
                    value: attribution?.url,
                    isUrl: true,
                  },
                  {
                    label: "Utm Event Source",
                    value:
                      attribution?.utmSource ||
                      attribution?.sessionSource ||
                      undefined,
                  },
                  {
                    label: "Fb Event Id",
                    value: attribution?.fbp || undefined,
                  },
                  { label: "Fbp", value: attribution?.fbp || undefined },
                  {
                    label: "Source",
                    value:
                      event.source ||
                      attribution?.sessionSource ||
                      contact?.source ||
                      undefined,
                  },
                ]}
              />
              <DetailSection
                title="Event Data"
                rows={[
                  {
                    label: "Source Event Type",
                    value:
                      attribution?.medium ||
                      attribution?.utmMedium ||
                      undefined,
                  },
                  {
                    label: "Parent Id",
                    value: attribution?.mediumId || undefined,
                  },
                  {
                    label: "Parent Name",
                    value: event.source || contact?.source || undefined,
                  },
                  {
                    label: "Contact Created At",
                    value: contact?.dateAdded
                      ? formatDateTime(contact.dateAdded)
                      : undefined,
                  },
                ]}
              />
              {attribution && (
                <DetailSection
                  title="Tracking Details"
                  rows={[
                    {
                      label: "Google Click ID (gclid)",
                      value: attribution.gclid || undefined,
                    },
                    {
                      label: "FB Click ID (fbclid)",
                      value: attribution.fbclid || undefined,
                    },
                    {
                      label: "GA Client ID",
                      value: attribution.gaClientId || undefined,
                    },
                    {
                      label: "GA Session ID",
                      value: attribution.gaSessionId || undefined,
                    },
                    {
                      label: "UTM Campaign",
                      value:
                        attribution.utmCampaign ||
                        attribution.campaign ||
                        undefined,
                    },
                    {
                      label: "UTM Content",
                      value: attribution.utmContent || undefined,
                    },
                    {
                      label: "UTM Term",
                      value: attribution.utmTerm || undefined,
                    },
                    {
                      label: "Referrer",
                      value: attribution.referrer || undefined,
                      isUrl: !!attribution.referrer,
                    },
                    {
                      label: "User Agent",
                      value: attribution.userAgent
                        ? attribution.userAgent.length > 80
                          ? attribution.userAgent.slice(0, 80) + "..."
                          : attribution.userAgent
                        : undefined,
                    },
                    { label: "IP Address", value: attribution.ip || undefined },
                  ]}
                />
              )}
            </div>
          );
        }
        // Contact updated
        return (
          <div className="space-y-4">
            <DetailSection
              title="Event Data"
              rows={[
                { label: "Event", value: event.title },
                {
                  label: "Timestamp",
                  value: formatDateTime(event.timestamp),
                },
              ]}
            />
          </div>
        );
      }

      case "page_visit":
        return (
          <div className="space-y-4">
            <DetailSection
              title="Page Details"
              rows={[
                { label: "URL", value: event.link, isUrl: true },
                {
                  label: "UTM Source",
                  value: attribution?.utmSource || undefined,
                },
                {
                  label: "Source",
                  value:
                    attribution?.sessionSource ||
                    contact?.source ||
                    undefined,
                },
              ]}
            />
            <DetailSection
              title="Event Data"
              rows={[
                {
                  label: "Timestamp",
                  value: formatDateTime(event.timestamp),
                },
              ]}
            />
          </div>
        );

      case "form":
        return (
          <div className="space-y-4">
            <DetailSection
              title="Page Details"
              rows={[
                {
                  label: "Form URL",
                  value: event.link || attribution?.url,
                  isUrl: true,
                },
                {
                  label: "UTM Source",
                  value: attribution?.utmSource || undefined,
                },
                {
                  label: "Source",
                  value:
                    attribution?.sessionSource ||
                    contact?.source ||
                    undefined,
                },
              ]}
            />
            <DetailSection
              title="Event Data"
              rows={[
                { label: "Source Event Type", value: "form" },
                { label: "Parent Name", value: event.title },
                {
                  label: "Timestamp",
                  value: formatDateTime(event.timestamp),
                },
              ]}
            />
          </div>
        );

      case "message":
        return (
          <div className="space-y-4">
            <DetailSection
              title="Message Details"
              rows={[
                { label: "Channel", value: event.rawData?.channel },
                { label: "Direction", value: event.rawData?.direction },
                {
                  label: "Body",
                  value: event.rawData?.body || event.description,
                },
                {
                  label: "Status",
                  value: event.meta || undefined,
                },
                {
                  label: "Timestamp",
                  value: formatDateTime(event.timestamp),
                },
              ]}
            />
          </div>
        );

      case "appointment":
        return (
          <div className="space-y-4">
            <DetailSection
              title="Appointment Details"
              rows={[
                { label: "Title", value: event.title },
                {
                  label: "Calendar",
                  value: event.rawData?.calendarId || undefined,
                },
                {
                  label: "Start Time",
                  value: event.rawData?.startTime
                    ? formatDateTime(event.rawData.startTime)
                    : undefined,
                },
                {
                  label: "End Time",
                  value: event.rawData?.endTime
                    ? formatDateTime(event.rawData.endTime)
                    : undefined,
                },
                { label: "Status", value: event.meta || undefined },
              ]}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <DetailSection
              title="Event Data"
              rows={[
                { label: "Event", value: event.title },
                {
                  label: "Timestamp",
                  value: formatDateTime(event.timestamp),
                },
                { label: "Description", value: event.description },
              ]}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Activity details</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {event.title} &middot;{" "}
            {formatTimelineTimestamp(event.timestamp)}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Attribution Detail Dialog (from card "View details")               */
/* ------------------------------------------------------------------ */

function AttributionDetailDialog({
  label,
  source,
  open,
  onClose,
}: {
  label: string;
  source: AttributionSource;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Activity details</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {label}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <DetailSection
            title="Page Details"
            rows={[
              { label: "Page Url", value: source.url, isUrl: true },
              {
                label: "Session Source",
                value: source.sessionSource || undefined,
              },
              {
                label: "Utm Source",
                value: source.utmSource || undefined,
              },
              {
                label: "Utm Medium",
                value: source.utmMedium || undefined,
              },
              {
                label: "Utm Content",
                value: source.utmContent || undefined,
              },
              { label: "Utm Term", value: source.utmTerm || undefined },
              {
                label: "Utm Campaign",
                value:
                  source.utmCampaign || source.campaign || undefined,
              },
              { label: "Fb Event Id", value: source.fbp || undefined },
              { label: "Fbp", value: source.fbp || undefined },
              {
                label: "Source",
                value:
                  source.sessionSource || source.medium || undefined,
              },
            ]}
          />
          <DetailSection
            title="Event Data"
            rows={[
              {
                label: "Source Event Type",
                value: source.medium || undefined,
              },
              { label: "Medium ID", value: source.mediumId || undefined },
              {
                label: "Referrer",
                value: source.referrer || undefined,
                isUrl: !!source.referrer,
              },
            ]}
          />
          <DetailSection
            title="Tracking & Identifiers"
            rows={[
              {
                label: "Google Click ID (gclid)",
                value: source.gclid || undefined,
              },
              {
                label: "FB Click ID (fbclid)",
                value: source.fbclid || undefined,
              },
              {
                label: "GA Client ID",
                value: source.gaClientId || undefined,
              },
              {
                label: "GA Session ID",
                value: source.gaSessionId || undefined,
              },
              {
                label: "User Agent",
                value: source.userAgent
                  ? source.userAgent.length > 80
                    ? source.userAgent.slice(0, 80) + "..."
                    : source.userAgent
                  : undefined,
              },
              { label: "IP Address", value: source.ip || undefined },
            ]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Attribution Card (enriched)                                        */
/* ------------------------------------------------------------------ */

function AttributionCard({
  label,
  source,
}: {
  label: string;
  source?: AttributionSource;
}) {
  const [showDetail, setShowDetail] = useState(false);

  if (!source) return null;
  const hasData =
    source.url ||
    source.utmSource ||
    source.medium ||
    source.campaign ||
    source.sessionSource;
  if (!hasData) return null;

  const badge = getSourceTypeBadge(source.medium, source.sessionSource);

  // Collect UTM params for display
  const utmParts: string[] = [];
  if (source.utmSource) utmParts.push(`source=${source.utmSource}`);
  if (source.utmMedium) utmParts.push(`medium=${source.utmMedium}`);
  if (source.utmContent) utmParts.push(`content=${source.utmContent}`);
  if (source.utmTerm) utmParts.push(`term=${source.utmTerm}`);
  if (source.utmCampaign || source.campaign)
    utmParts.push(`campaign=${source.utmCampaign || source.campaign}`);

  return (
    <>
      <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
              badge.className
            )}
          >
            {badge.label}
          </span>
        </div>

        {/* URL with copy */}
        {source.url && (
          <div className="flex items-start gap-2 text-xs">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-blue-500 mt-0.5" />
            <CopyableUrl url={source.url} />
          </div>
        )}

        {/* UTM params */}
        {utmParts.length > 0 && (
          <p className="text-[10px] text-gray-400 leading-relaxed">
            UTM: {utmParts.join(" | ")}
          </p>
        )}

        {/* Tracking badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {source.gclid && (
            <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              Google Ads
            </span>
          )}
          {(source.fbclid || source.fbp) && (
            <span className="inline-flex items-center rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
              Facebook
            </span>
          )}
          {source.gaClientId && (
            <span className="inline-flex items-center rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">
              GA Tracked
            </span>
          )}
          {source.referrer && (
            <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
              Has Referrer
            </span>
          )}
        </div>

        {/* Extra info */}
        {source.ip && (
          <p className="text-[10px] text-gray-400">IP: {source.ip}</p>
        )}
        {source.userAgent && (
          <p className="text-[10px] text-gray-400 truncate" title={source.userAgent}>
            UA: {source.userAgent.slice(0, 60)}...
          </p>
        )}

        {/* View details link */}
        <button
          onClick={() => setShowDetail(true)}
          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-medium mt-1"
        >
          <Eye className="h-3 w-3" />
          View details
        </button>
      </div>

      <AttributionDetailDialog
        label={label}
        source={source}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline Types & Icons                                             */
/* ------------------------------------------------------------------ */

type TimelineEventType =
  | "message"
  | "appointment"
  | "system"
  | "note"
  | "task"
  | "form"
  | "page_visit";

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  meta?: string;
  source?: string;
  link?: string;
  rawData?: Record<string, string | undefined>;
}

const iconBgColors: Record<TimelineEventType, string> = {
  system: "bg-green-500",
  form: "bg-green-500",
  page_visit: "bg-blue-500",
  message: "bg-purple-500",
  appointment: "bg-orange-500",
  note: "bg-amber-500",
  task: "bg-gray-500",
};

const eventIcons: Record<TimelineEventType, React.ReactNode> = {
  message: <MessageSquare className="h-3 w-3 text-white" />,
  appointment: <CalendarCheck className="h-3 w-3 text-white" />,
  system: <User className="h-3 w-3 text-white" />,
  note: <FileText className="h-3 w-3 text-white" />,
  task: <ListTodo className="h-3 w-3 text-white" />,
  form: <FormInput className="h-3 w-3 text-white" />,
  page_visit: <Globe className="h-3 w-3 text-white" />,
};

/* ------------------------------------------------------------------ */
/*  Timeline Item (clickable)                                          */
/* ------------------------------------------------------------------ */

function TimelineItem({
  event,
  isLast,
  onClick,
}: {
  event: TimelineEvent;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative flex gap-3 pb-5 last:pb-0 cursor-pointer rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-gray-50 transition-colors"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }}
          >
            {/* Vertical line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0 ring-2 ring-white",
                  iconBgColors[event.type]
                )}
              >
                {eventIcons[event.type]}
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-gray-800">
                  {event.title}
                </p>
                <Info className="h-3 w-3 text-gray-300 shrink-0" />
              </div>
              {event.source && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 mt-1">
                  Source: {event.source}
                </span>
              )}
              {event.description && (
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                  {event.description}
                </p>
              )}
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {event.link.length > 50
                    ? event.link.slice(0, 25) + "..." + event.link.slice(-20)
                    : event.link}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-gray-400">
                  {event.timestamp
                    ? formatTimelineTimestamp(event.timestamp)
                    : ""}
                </span>
                {event.meta && (
                  <>
                    <span className="text-[10px] text-gray-300">-</span>
                    <span className="text-[10px] text-gray-400 italic">
                      {event.meta}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Click for details</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Section                                                   */
/* ------------------------------------------------------------------ */

function ActivitySection({
  contactId,
  contact,
  locationId,
}: {
  contactId: string;
  contact?: Contact;
  locationId?: string;
}) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: appointmentsData, isLoading: apptLoading } =
    useContactAppointments(contactId);
  const { data: conversationsData } = useConversations(
    locationId || "",
    undefined,
    contactId
  );
  const conversationId = conversationsData?.conversations?.[0]?.id || "";
  const { data: messagesData, isLoading: msgsLoading } =
    useMessages(conversationId);

  const isLoading = apptLoading || msgsLoading;

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  // Build a unified, sorted timeline
  const events = useMemo(() => {
    const items: TimelineEvent[] = [];

    // Recent messages (last 5)
    const messages = messagesData?.messages?.messages || [];
    messages.slice(0, 5).forEach((msg) => {
      const direction = msg.direction === "inbound" ? "Received" : "Sent";
      const channelLabel = msg.messageType
        ? msg.messageType.replace("TYPE_", "").charAt(0).toUpperCase() +
          msg.messageType.replace("TYPE_", "").slice(1).toLowerCase()
        : "Message";
      items.push({
        id: `msg-${msg.id}`,
        type: "message",
        title: `${direction} ${channelLabel}`,
        description: msg.body
          ? msg.body.length > 80
            ? msg.body.slice(0, 80) + "..."
            : msg.body
          : undefined,
        timestamp: msg.dateAdded,
        meta: msg.status || undefined,
        rawData: {
          channel: channelLabel,
          direction: msg.direction || undefined,
          body: msg.body || undefined,
        },
      });
    });

    // Appointments
    const appointments = appointmentsData?.events || [];
    appointments.forEach((appt) => {
      const statusLabel =
        appt.appointmentStatus || appt.status || "scheduled";
      items.push({
        id: `appt-${appt.id}`,
        type: "appointment",
        title: appt.title || "Appointment",
        description: `${formatDateTime(appt.startTime)} - ${formatDateTime(appt.endTime)}`,
        timestamp: appt.startTime,
        meta: statusLabel,
        rawData: {
          calendarId: appt.calendarId || undefined,
          startTime: appt.startTime || undefined,
          endTime: appt.endTime || undefined,
        },
      });
    });

    // System events
    if (contact?.dateAdded) {
      items.push({
        id: "sys-created",
        type: "system",
        title: "Contact created",
        source: contact.source || undefined,
        timestamp: contact.dateAdded,
      });
    }
    if (contact?.dateUpdated && contact.dateUpdated !== contact.dateAdded) {
      items.push({
        id: "sys-updated",
        type: "system",
        title: "Contact updated",
        timestamp: contact.dateUpdated,
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return items;
  }, [messagesData, appointmentsData, contact]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { dateLabel: string; events: TimelineEvent[] }[] = [];
    let currentLabel = "";

    for (const event of events) {
      const label = formatDateGroupHeader(event.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ dateLabel: label, events: [event] });
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }
    return groups;
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Attribution section */}
      {(contact?.attributionSource || contact?.lastAttributionSource) && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="h-3 w-3" />
            Attribution
          </p>
          <div className="grid grid-cols-1 gap-2">
            <AttributionCard
              label="First Attribution"
              source={contact.attributionSource}
            />
            <AttributionCard
              label="Latest Attribution"
              source={contact.lastAttributionSource}
            />
          </div>
        </div>
      )}

      {/* Source badge (fallback) */}
      {contact?.source &&
        !contact.attributionSource &&
        !contact.lastAttributionSource && (
          <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Source
            </p>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {contact.source}
            </span>
          </div>
        )}

      {/* Timeline */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          Timeline
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Activity className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedEvents.map((group) => (
              <div key={group.dateLabel}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                    {group.dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div>
                  {group.events.map((event, idx) => (
                    <TimelineItem
                      key={event.id}
                      event={event}
                      isLast={idx === group.events.length - 1}
                      onClick={() => handleEventClick(event)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Detail Dialog */}
      <ActivityDetailDialog
        event={selectedEvent}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedEvent(null);
        }}
        contact={contact}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Panel                                                         */
/* ------------------------------------------------------------------ */

export function ContactActivityPanel({
  contactId,
  contact,
  locationId,
}: ContactActivityPanelProps) {
  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      <Tabs defaultValue="activity" className="flex flex-col h-full">
        <div className="px-3 pt-3 border-b border-gray-100">
          <TabsList className="w-full h-8">
            <TabsTrigger
              value="activity"
              className="flex-1 text-xs gap-1.5 h-7"
            >
              <Activity className="h-3 w-3" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex-1 text-xs gap-1.5 h-7"
            >
              <FileText className="h-3 w-3" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex-1 text-xs gap-1.5 h-7"
            >
              <ListTodo className="h-3 w-3" />
              Tasks
            </TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3">
            <TabsContent value="activity" className="mt-0">
              <ActivitySection
                contactId={contactId}
                contact={contact}
                locationId={locationId}
              />
            </TabsContent>
            <TabsContent value="notes" className="mt-0">
              <NotesSection contactId={contactId} />
            </TabsContent>
            <TabsContent value="tasks" className="mt-0">
              <TasksSection contactId={contactId} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
