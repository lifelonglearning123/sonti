"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Zap,
  DollarSign,
  Tag,
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  Users,
  Plus,
  Play,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useUpdateContact,
  useDeleteContact,
  useAddTag,
  useRemoveTag,
  useLocationTags,
  useUpdateDnd,
  useContactOpportunities,
  useWorkflows,
  useEnrollWorkflow,
  useCreateOpportunityForContact,
  usePipelines,
} from "@/hooks/use-contacts";
import { getInitials, cn } from "@/lib/utils";
import type { Contact } from "@/types/contact";
import Link from "next/link";

interface ContactInfoPanelProps {
  contact: Contact;
  locationId?: string;
  onBookMeeting?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Editable Field                                                     */
/* ------------------------------------------------------------------ */

function EditableField({
  label,
  value,
  field,
  onSave,
  type = "text",
}: {
  label: string;
  value: string;
  field: string;
  onSave: (field: string, value: string) => void;
  type?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(field, localValue);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {isEditing ? (
        <Input
          ref={inputRef}
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setLocalValue(value);
              setIsEditing(false);
            }
          }}
          className="h-8 text-sm"
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="h-8 flex items-center px-2.5 rounded-md text-sm cursor-text hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
        >
          <span className={value ? "text-gray-900" : "text-gray-400 italic"}>
            {value || `Add ${label.toLowerCase()}...`}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  count,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-1.5 group"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        )}
        {icon}
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-medium">
            {count}
          </span>
        )}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tag Colors                                                         */
/* ------------------------------------------------------------------ */

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Tags Dropdown                                                      */
/* ------------------------------------------------------------------ */

function TagsDropdown({
  contactId,
  contactTags,
  locationId,
}: {
  contactId: string;
  contactTags: string[];
  locationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addTag = useAddTag();
  const { data: tagsData } = useLocationTags(locationId);

  const availableTags = useMemo(() => {
    const allTags = (tagsData?.tags || []).map((t) => t.name);
    const filtered = allTags.filter(
      (t) =>
        !contactTags.includes(t) &&
        t.toLowerCase().includes(search.toLowerCase())
    );
    return filtered;
  }, [tagsData, contactTags, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (tag: string) => {
    addTag.mutate({ contactId, tags: [tag] });
    setSearch("");
  };

  const handleCreateTag = () => {
    if (search.trim() && !contactTags.includes(search.trim())) {
      addTag.mutate({ contactId, tags: [search.trim()] });
      setSearch("");
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="h-6 px-2.5 rounded-full border border-dashed border-gray-300 text-xs text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-1"
      >
        + Add Tag
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTag();
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Search or create tag..."
                className="h-8 text-xs pl-7"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto px-1 pb-1">
            {availableTags.length === 0 && search.trim() ? (
              <button
                onClick={handleCreateTag}
                className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                Create &quot;{search.trim()}&quot;
              </button>
            ) : (
              availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSelect(tag)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      getTagColor(tag).split(" ")[0]
                    )}
                  />
                  {tag}
                </button>
              ))
            )}
            {availableTags.length === 0 && !search.trim() && (
              <p className="text-xs text-gray-400 text-center py-2">
                No more tags available
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DND Toggle                                                         */
/* ------------------------------------------------------------------ */

const DND_CHANNELS = [
  { key: "all", label: "All", icon: BellOff },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "call", label: "Calls", icon: Phone },
  { key: "whatsApp", label: "WhatsApp", icon: Phone },
  { key: "gmb", label: "GMB", icon: Globe },
  { key: "fb", label: "FB", icon: Users },
] as const;

function DndSection({
  contact,
}: {
  contact: Contact;
}) {
  const updateDnd = useUpdateDnd();

  const isChannelActive = (key: string): boolean => {
    if (key === "all") return !!contact.dnd;
    const settings = contact.dndSettings;
    if (!settings) return false;
    const channel = settings[key as keyof typeof settings];
    return channel?.status === "active";
  };

  const handleToggle = (key: string) => {
    const currentSettings = contact.dndSettings || {};
    const newActive = !isChannelActive(key);

    if (key === "all") {
      const allSettings: Record<string, { status: string; message: string; code: string }> = {};
      for (const ch of DND_CHANNELS) {
        allSettings[ch.key] = {
          status: newActive ? "active" : "inactive",
          message: "",
          code: "",
        };
      }
      updateDnd.mutate({
        contactId: contact.id,
        dnd: newActive,
        dndSettings: allSettings,
      });
    } else {
      const newSettings: Record<string, { status: string; message: string; code: string }> = {};
      for (const ch of DND_CHANNELS) {
        if (ch.key === "all") continue;
        const existing = currentSettings[ch.key as keyof typeof currentSettings];
        newSettings[ch.key] = {
          status: ch.key === key ? (newActive ? "active" : "inactive") : (existing?.status || "inactive"),
          message: existing?.message || "",
          code: existing?.code || "",
        };
      }
      const anyActive = Object.values(newSettings).some((v) => v.status === "active");
      newSettings.all = { status: anyActive ? "active" : "inactive", message: "", code: "" };
      updateDnd.mutate({
        contactId: contact.id,
        dnd: anyActive,
        dndSettings: newSettings,
      });
    }
  };

  return (
    <div className="space-y-2">
      {DND_CHANNELS.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="flex items-center justify-between py-1 px-1"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
          <button
            onClick={() => handleToggle(key)}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              isChannelActive(key) ? "bg-red-500" : "bg-gray-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                isChannelActive(key) ? "translate-x-4.5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Panel                                                         */
/* ------------------------------------------------------------------ */

export function ContactInfoPanel({
  contact,
  locationId,
  onBookMeeting,
}: ContactInfoPanelProps) {
  const router = useRouter();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const removeTag = useRemoveTag();

  const handleDeleteContact = async () => {
    if (confirm(`Delete "${name}" permanently? This cannot be undone.`)) {
      await deleteContact.mutateAsync(contact.id);
      router.push("/contacts");
    }
  };

  const handleFieldSave = (field: string, value: string) => {
    updateContact.mutate({ id: contact.id, [field]: value } as any);
  };

  const name =
    contact.contactName ||
    contact.name ||
    `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
    "Unknown";

  const [showAutomation, setShowAutomation] = useState(false);
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [showAddOpp, setShowAddOpp] = useState(false);
  const [newOppName, setNewOppName] = useState("");
  const [newOppPipeline, setNewOppPipeline] = useState("");
  const [newOppStage, setNewOppStage] = useState("");
  const [newOppValue, setNewOppValue] = useState("");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const { data: workflows } = useWorkflows(locationId || "");
  const { data: opportunities } = useContactOpportunities(
    locationId || "",
    contact.id
  );
  const { data: pipelines } = usePipelines(locationId || "");
  const enrollWorkflow = useEnrollWorkflow();
  const createOpp = useCreateOpportunityForContact();
  const opportunityCount = opportunities?.length || contact.opportunities?.length || 0;

  const selectedPipelineStages = useMemo(() => {
    if (!pipelines || !newOppPipeline) return [];
    const p = pipelines.find((p: { id: string }) => p.id === newOppPipeline);
    return p?.stages || [];
  }, [pipelines, newOppPipeline]);

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white">
      {/* Header with avatar */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/contacts")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xs text-gray-400">Back to contacts</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-sm font-semibold bg-blue-100 text-blue-700">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {name}
            </h2>
            {contact.companyName && (
              <p className="text-xs text-gray-500 truncate">
                {contact.companyName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
        {onBookMeeting && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={onBookMeeting}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Book Meeting
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleDeleteContact}
          disabled={deleteContact.isPending}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          {deleteContact.isPending ? "..." : "Delete"}
        </Button>
      </div>

      {/* Fields */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Contact section */}
          <CollapsibleSection title="Contact" defaultOpen={true}>
            <div className="space-y-3 mt-1">
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="First Name"
                  value={contact.firstName || ""}
                  field="firstName"
                  onSave={handleFieldSave}
                />
                <EditableField
                  label="Last Name"
                  value={contact.lastName || ""}
                  field="lastName"
                  onSave={handleFieldSave}
                />
              </div>
              <EditableField
                label="Email"
                value={contact.email || ""}
                field="email"
                onSave={handleFieldSave}
                type="email"
              />
              <EditableField
                label="Phone"
                value={contact.phone || ""}
                field="phone"
                onSave={handleFieldSave}
                type="tel"
              />
              <EditableField
                label="Company"
                value={contact.companyName || ""}
                field="companyName"
                onSave={handleFieldSave}
              />
            </div>
          </CollapsibleSection>

          <Separator />

          {/* Location section */}
          <CollapsibleSection title="Location" defaultOpen={true}>
            <div className="space-y-3 mt-1">
              <EditableField
                label="Address"
                value={contact.address1 || ""}
                field="address1"
                onSave={handleFieldSave}
              />
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="City"
                  value={contact.city || ""}
                  field="city"
                  onSave={handleFieldSave}
                />
                <EditableField
                  label="State"
                  value={contact.state || ""}
                  field="state"
                  onSave={handleFieldSave}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  label="Postal Code"
                  value={contact.postalCode || ""}
                  field="postalCode"
                  onSave={handleFieldSave}
                />
                <EditableField
                  label="Country"
                  value={contact.country || ""}
                  field="country"
                  onSave={handleFieldSave}
                />
              </div>
            </div>
          </CollapsibleSection>

          <Separator />

          {/* Additional Info section */}
          <CollapsibleSection title="Additional Info" defaultOpen={false}>
            <div className="space-y-3 mt-1">
              <EditableField
                label="Date of Birth"
                value={contact.dateOfBirth || ""}
                field="dateOfBirth"
                onSave={handleFieldSave}
              />
              <EditableField
                label="Source"
                value={contact.source || ""}
                field="source"
                onSave={handleFieldSave}
              />
              <EditableField
                label="Website"
                value={contact.website || ""}
                field="website"
                onSave={handleFieldSave}
              />
              {/* Custom fields */}
              {(contact.customFields || []).map((cf) => (
                <div key={cf.id} className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    {cf.id}
                  </label>
                  <div className="h-8 flex items-center px-2.5 rounded-md text-sm border border-transparent">
                    <span className={cf.value ? "text-gray-900" : "text-gray-400 italic"}>
                      {cf.value || "Not set"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <Separator />

          {/* Tags section */}
          <CollapsibleSection
            title="Tags"
            icon={<Tag className="h-3 w-3 text-gray-500" />}
            defaultOpen={true}
            count={(contact.tags || []).length}
          >
            <div className="space-y-2 mt-1">
              <div className="flex flex-wrap gap-1.5">
                {(contact.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      getTagColor(tag)
                    )}
                  >
                    {tag}
                    <button
                      onClick={() =>
                        removeTag.mutate({ contactId: contact.id, tags: [tag] })
                      }
                      className="ml-0.5 hover:opacity-70 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {locationId && (
                <TagsDropdown
                  contactId={contact.id}
                  contactTags={contact.tags || []}
                  locationId={locationId}
                />
              )}
            </div>
          </CollapsibleSection>

          <Separator />

          {/* Actions section */}
          <CollapsibleSection title="Actions" defaultOpen={true}>
            <div className="space-y-1 mt-1">
              {/* Automation - expandable */}
              <div>
                <div
                  onClick={() => setShowAutomation(!showAutomation)}
                  className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-gray-700">Automation</span>
                    {workflows && workflows.length > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">
                        {workflows.length}
                      </span>
                    )}
                  </div>
                  {showAutomation ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </div>
                {showAutomation && (
                  <div className="ml-6 mt-1 space-y-1 max-h-60 overflow-y-auto">
                    {workflows && workflows.length > 0 ? (
                      workflows
                        .filter((w: { status: string }) => w.status === "published")
                        .map((w: { id: string; name: string; status: string }) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-amber-50 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Zap className="h-3 w-3 text-amber-400 flex-shrink-0" />
                            <span className="truncate text-gray-700">{w.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              setEnrollingId(w.id);
                              enrollWorkflow.mutate(
                                { contactId: contact.id, workflowId: w.id },
                                {
                                  onSuccess: () => {
                                    setEnrollingId(null);
                                    alert(`Enrolled in "${w.name}"`);
                                  },
                                  onError: () => setEnrollingId(null),
                                }
                              );
                            }}
                            disabled={enrollingId === w.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-700 rounded px-1.5 py-0.5 font-medium"
                          >
                            {enrollingId === w.id ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <Play className="h-2.5 w-2.5" />
                            )}
                            Enroll
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 py-1 px-2">No workflows found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Opportunities - expandable */}
              <div>
                <div
                  onClick={() => setShowOpportunities(!showOpportunities)}
                  className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-gray-700">Opportunities</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {opportunityCount > 0 && (
                      <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-medium">
                        {opportunityCount}
                      </span>
                    )}
                    {showOpportunities ? (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </div>
                </div>
                {showOpportunities && (
                  <div className="ml-6 mt-1 space-y-1 max-h-64 overflow-y-auto">
                    {opportunities && opportunities.length > 0 ? (
                      opportunities.map(
                        (opp: {
                          id: string;
                          name: string;
                          status: string;
                          monetaryValue?: number;
                          pipelineStageId?: string;
                        }) => (
                          <Link
                            key={opp.id}
                            href="/pipeline"
                            className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-green-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <DollarSign className="h-3 w-3 text-green-400 flex-shrink-0" />
                              <span className="truncate text-gray-700">{opp.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {opp.monetaryValue != null && opp.monetaryValue > 0 && (
                                <span className="text-[10px] text-gray-500">
                                  £{opp.monetaryValue.toLocaleString()}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                  opp.status === "open"
                                    ? "bg-blue-100 text-blue-700"
                                    : opp.status === "won"
                                      ? "bg-green-100 text-green-700"
                                      : opp.status === "lost"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-500"
                                )}
                              >
                                {opp.status}
                              </span>
                            </div>
                          </Link>
                        )
                      )
                    ) : (
                      <p className="text-xs text-gray-400 py-1 px-2">No opportunities yet</p>
                    )}

                    {/* Add opportunity form */}
                    {showAddOpp ? (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md space-y-2">
                        <Input
                          placeholder="Opportunity name"
                          value={newOppName}
                          onChange={(e) => setNewOppName(e.target.value)}
                          className="h-7 text-xs"
                        />
                        <select
                          value={newOppPipeline}
                          onChange={(e) => {
                            setNewOppPipeline(e.target.value);
                            setNewOppStage("");
                          }}
                          className="w-full h-7 text-xs border rounded-md px-2 bg-white"
                        >
                          <option value="">Select pipeline...</option>
                          {pipelines?.map((p: { id: string; name: string }) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        {newOppPipeline && (
                          <select
                            value={newOppStage}
                            onChange={(e) => setNewOppStage(e.target.value)}
                            className="w-full h-7 text-xs border rounded-md px-2 bg-white"
                          >
                            <option value="">Select stage...</option>
                            {selectedPipelineStages.map((s: { id: string; name: string }) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        )}
                        <Input
                          placeholder="Value (£)"
                          type="number"
                          value={newOppValue}
                          onChange={(e) => setNewOppValue(e.target.value)}
                          className="h-7 text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-6 text-[10px] flex-1"
                            disabled={!newOppName || !newOppPipeline || !newOppStage || createOpp.isPending}
                            onClick={() => {
                              createOpp.mutate(
                                {
                                  pipelineId: newOppPipeline,
                                  pipelineStageId: newOppStage,
                                  locationId: locationId || "",
                                  contactId: contact.id,
                                  name: newOppName,
                                  monetaryValue: parseFloat(newOppValue) || 0,
                                },
                                {
                                  onSuccess: () => {
                                    setShowAddOpp(false);
                                    setNewOppName("");
                                    setNewOppPipeline("");
                                    setNewOppStage("");
                                    setNewOppValue("");
                                  },
                                }
                              );
                            }}
                          >
                            {createOpp.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Create"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px]"
                            onClick={() => setShowAddOpp(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddOpp(true)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 py-1.5 px-2 hover:bg-green-50 rounded w-full"
                      >
                        <Plus className="h-3 w-3" />
                        Add Opportunity
                      </button>
                    )}

                    <Link
                      href="/pipeline"
                      className="block text-xs text-blue-600 hover:text-blue-700 py-1 px-2"
                    >
                      View all in Pipeline →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          <Separator />

          {/* DND section */}
          <CollapsibleSection
            title="Do Not Disturb"
            icon={
              contact.dnd ? (
                <BellOff className="h-3 w-3 text-red-500" />
              ) : (
                <Bell className="h-3 w-3 text-gray-500" />
              )
            }
            defaultOpen={false}
          >
            <div className="mt-1">
              <DndSection contact={contact} />
            </div>
          </CollapsibleSection>

          {/* Meta info */}
          {contact.dateAdded && (
            <>
              <Separator />
              <div className="text-xs text-gray-400 space-y-1">
                <p>Added: {new Date(contact.dateAdded).toLocaleDateString()}</p>
                {contact.dateUpdated && (
                  <p>
                    Updated:{" "}
                    {new Date(contact.dateUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
