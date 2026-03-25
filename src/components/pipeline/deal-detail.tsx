"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Save,
  DollarSign,
  User,
  Calendar,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Clock,
  MessageSquare,
  Tag,
} from "lucide-react";
import { useUpdateOpportunity, useDeleteOpportunity } from "@/hooks/use-opportunities";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import type { Opportunity, Pipeline } from "@/types/opportunity";

interface DealDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
  pipeline: Pipeline | null;
}

const statusConfig: Record<string, { label: string; activeClass: string; inactiveClass: string }> = {
  open: {
    label: "Open",
    activeClass: "bg-green-100 text-green-700 border-green-200",
    inactiveClass: "bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600",
  },
  won: {
    label: "Won",
    activeClass: "bg-blue-100 text-blue-700 border-blue-200",
    inactiveClass: "bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600",
  },
  lost: {
    label: "Lost",
    activeClass: "bg-red-100 text-red-700 border-red-200",
    inactiveClass: "bg-gray-50 text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-600",
  },
  abandoned: {
    label: "Abandoned",
    activeClass: "bg-amber-100 text-amber-700 border-amber-200",
    inactiveClass: "bg-gray-50 text-gray-500 border-gray-200 hover:bg-amber-50 hover:text-amber-600",
  },
};

export function DealDetail({ open, onOpenChange, opportunity, pipeline }: DealDetailProps) {
  const updateOpportunity = useUpdateOpportunity();
  const deleteOpportunity = useDeleteOpportunity();
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    monetaryValue: "",
    pipelineStageId: "",
    status: "",
    source: "",
  });

  // Sync form when opportunity changes
  useEffect(() => {
    if (opportunity && open) {
      setFormData({
        name: opportunity.name || "",
        monetaryValue: opportunity.monetaryValue?.toString() || "",
        pipelineStageId: opportunity.pipelineStageId || "",
        status: opportunity.status || "open",
        source: opportunity.source || "",
      });
      setIsEditing(false);
      setNewNote("");
    }
  }, [opportunity?.id, open]);

  if (!opportunity) return null;

  const stages = pipeline?.stages?.sort((a, b) => a.position - b.position) || [];
  const currentStage = stages.find((s) => s.id === opportunity.pipelineStageId);
  const currentStatus = formData.status || opportunity.status;

  const handleSave = async () => {
    await updateOpportunity.mutateAsync({
      id: opportunity.id,
      name: formData.name,
      monetaryValue: formData.monetaryValue ? parseFloat(formData.monetaryValue) : undefined,
      pipelineStageId: formData.pipelineStageId,
      status: formData.status,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this deal?")) {
      await deleteOpportunity.mutateAsync(opportunity.id);
      onOpenChange(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    await updateOpportunity.mutateAsync({ id: opportunity.id, status });
    setFormData((prev) => ({ ...prev, status }));
  };

  const handleClose = () => {
    setIsEditing(false);
    setFormData({ name: "", monetaryValue: "", pipelineStageId: "", status: "", source: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? "Edit Deal" : opportunity.name}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          /* ── Edit mode ── */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Deal Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={formData.monetaryValue}
                onChange={(e) => setFormData({ ...formData, monetaryValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={formData.pipelineStageId}
                onValueChange={(v) => setFormData({ ...formData, pipelineStageId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., Website, Referral"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateOpportunity.isPending}>
                {updateOpportunity.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <div className="space-y-5">
            {/* Status buttons */}
            <div className="flex items-center gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    currentStatus === key ? cfg.activeClass : cfg.inactiveClass
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            <Separator />

            {/* Value & Stage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Opportunity Value
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {opportunity.monetaryValue ? formatCurrency(opportunity.monetaryValue) : "\u00A30"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Stage
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {currentStage?.name || "Unknown"}
                </p>
              </div>
            </div>

            {/* Opportunity fields */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</h4>
              <div className="space-y-2.5">
                {opportunity.source && (
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-28 shrink-0">Source</span>
                    <span className="text-gray-900">{opportunity.source}</span>
                  </div>
                )}
                {opportunity.contact?.companyName && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-28 shrink-0">Business Name</span>
                    <span className="text-gray-900">{opportunity.contact.companyName}</span>
                  </div>
                )}
                {opportunity.dateAdded && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-28 shrink-0">Created</span>
                    <span className="text-gray-900">{formatDate(opportunity.dateAdded)}</span>
                  </div>
                )}
                {opportunity.dateUpdated && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-28 shrink-0">Last Updated</span>
                    <span className="text-gray-900">{formatDate(opportunity.dateUpdated)}</span>
                  </div>
                )}
                {opportunity.lastStatusChangeAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-28 shrink-0">Status Changed</span>
                    <span className="text-gray-900">{timeAgo(opportunity.lastStatusChangeAt)}</span>
                  </div>
                )}
                {currentStatus === "lost" && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-500 w-28 shrink-0">Lost Reason</span>
                    <span className="text-gray-900 italic text-gray-500">Not specified</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact info */}
            {opportunity.contact && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Contact Information
                  </h4>
                  <Link
                    href={`/contacts/${opportunity.contact.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Contact
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {opportunity.contact.name && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">{opportunity.contact.name}</span>
                    </div>
                  )}
                  {opportunity.contact.email && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${opportunity.contact.email}`}
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {opportunity.contact.email}
                      </a>
                    </div>
                  )}
                  {opportunity.contact.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{opportunity.contact.phone}</span>
                    </div>
                  )}
                  {opportunity.contact.companyName && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{opportunity.contact.companyName}</span>
                    </div>
                  )}
                  {opportunity.contact.tags && opportunity.contact.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {opportunity.contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Notes section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</h4>
              {opportunity.notes && opportunity.notes.length > 0 ? (
                <div className="space-y-2">
                  {opportunity.notes.map((note, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400 inline mr-1.5" />
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No notes yet</p>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="min-h-[60px] text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 self-end"
                  disabled={!newNote.trim()}
                  onClick={() => {
                    // Note: GHL API doesn't have a direct notes endpoint in the opportunities API,
                    // so this is a UI placeholder for now
                    setNewNote("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <Separator />

            {/* Activity timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Activity Timeline
              </h4>
              <div className="space-y-3">
                {opportunity.lastStatusChangeAt && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      <div className="w-px flex-1 bg-gray-200" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-gray-700">
                        Status changed to <span className="font-medium">{opportunity.status}</span>
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(opportunity.lastStatusChangeAt)}</p>
                    </div>
                  </div>
                )}
                {opportunity.lastStageChangeAt && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5" />
                      <div className="w-px flex-1 bg-gray-200" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-gray-700">
                        Moved to stage <span className="font-medium">{currentStage?.name || "Unknown"}</span>
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo(opportunity.lastStageChangeAt)}</p>
                    </div>
                  </div>
                )}
                {(opportunity.dateAdded || opportunity.createdAt) && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Deal created</p>
                      <p className="text-xs text-gray-400">
                        {timeAgo((opportunity.dateAdded || opportunity.createdAt)!)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Save className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
