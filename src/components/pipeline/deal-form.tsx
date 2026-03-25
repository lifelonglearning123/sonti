"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Loader2, X } from "lucide-react";
import { useCreateOpportunity } from "@/hooks/use-opportunities";
import { useContacts } from "@/hooks/use-contacts";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import type { Pipeline } from "@/types/opportunity";
import type { Contact } from "@/types/contact";

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
  locationId: string;
}

export function DealForm({ open, onOpenChange, pipeline, locationId }: DealFormProps) {
  const createOpportunity = useCreateOpportunity();
  const [error, setError] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    monetaryValue: "",
    pipelineStageId: pipeline.stages?.[0]?.id || "",
    source: "",
  });

  // Search for contacts
  const { data: contactResults, isLoading: searchingContacts } = useContacts(
    locationId,
    contactSearch,
    1,
    10
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        monetaryValue: "",
        pipelineStageId: pipeline.stages?.[0]?.id || "",
        source: "",
      });
      setError("");
      setSelectedContact(null);
      setContactSearch("");
      setShowContactSearch(false);
    }
  }, [open, pipeline.stages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Deal name is required.");
      return;
    }
    if (!selectedContact) {
      setError("Please select a contact.");
      return;
    }
    if (!formData.pipelineStageId) {
      setError("Please select a stage.");
      return;
    }

    try {
      await createOpportunity.mutateAsync({
        name: formData.name,
        pipelineId: pipeline.id,
        locationId,
        pipelineStageId: formData.pipelineStageId,
        status: "open",
        contactId: selectedContact.id,
        monetaryValue: formData.monetaryValue ? parseFloat(formData.monetaryValue) : undefined,
        source: formData.source || undefined,
      });
      toast.success("Deal created successfully");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create deal");
      setError(err?.message || "Failed to create deal. Please try again.");
    }
  };

  const contactName = (c: Contact) =>
    c.contactName || c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
          <DialogDescription>Add a new deal to {pipeline.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="dealName">Deal Name <span className="text-red-500">*</span></Label>
            <Input
              id="dealName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="New website project"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Contact <span className="text-red-500">*</span></Label>
            {selectedContact ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(contactName(selectedContact))}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {contactName(selectedContact)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedContact.email || selectedContact.phone || ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContact(null);
                    setShowContactSearch(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={contactSearch}
                    onChange={(e) => {
                      setContactSearch(e.target.value);
                      setShowContactSearch(true);
                    }}
                    onFocus={() => setShowContactSearch(true)}
                    placeholder="Search contacts by name, email..."
                    className="pl-9"
                  />
                </div>
                {showContactSearch && contactSearch && (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {searchingContacts ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                      </div>
                    ) : (contactResults?.contacts || []).length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No contacts found</p>
                    ) : (
                      (contactResults?.contacts || []).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedContact(c);
                            setShowContactSearch(false);
                            setContactSearch("");
                            if (!formData.name) {
                              setFormData({ ...formData, name: contactName(c) });
                            }
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(contactName(c))}
                            </AvatarFallback>
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
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.monetaryValue}
              onChange={(e) => setFormData({ ...formData, monetaryValue: e.target.value })}
              placeholder="5000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage">Stage <span className="text-red-500">*</span></Label>
            <Select
              value={formData.pipelineStageId}
              onValueChange={(v) => setFormData({ ...formData, pipelineStageId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {pipeline.stages?.sort((a, b) => a.position - b.position).map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., Website, Referral, Cold call"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOpportunity.isPending}>
              {createOpportunity.isPending ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
