"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Trash2, Mail, Phone, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useOpportunity, usePipelines, useUpdateOpportunity, useDeleteOpportunity } from "@/hooks/use-opportunities";
import { useContact } from "@/hooks/use-contacts";
import { ContactConversation } from "@/components/contacts/contact-conversation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getInitials, cn } from "@/lib/utils";

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locationId = (session as any)?.locationId || (session as any)?.user?.locationId || "";
  const oppId = params.id as string;

  const { data: oppData, isLoading: oppLoading } = useOpportunity(oppId);
  const { data: pipelinesData } = usePipelines(locationId);
  const updateOpp = useUpdateOpportunity();
  const deleteOpp = useDeleteOpportunity();

  const opportunity = oppData?.opportunity;
  const pipelines = pipelinesData?.pipelines || [];
  const pipeline = pipelines.find((p) => p.id === opportunity?.pipelineId);
  const stages = pipeline?.stages?.sort((a, b) => a.position - b.position) || [];

  // Get linked contact
  const { data: contactData } = useContact(opportunity?.contactId || "");
  const contact = contactData?.contact;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [editingValue, setEditingValue] = useState(false);
  const [moneyValue, setMoneyValue] = useState("");

  if (oppLoading) {
    return (
      <div className="flex h-[calc(100vh-7rem)] -m-6 border-t border-gray-200">
        <div className="w-[320px] border-r border-gray-200 p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-full" />
        </div>
        <div className="w-[300px] border-l border-gray-200 p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <p className="text-gray-500">Opportunity not found</p>
      </div>
    );
  }

  const handleStatusChange = async (status: string) => {
    await updateOpp.mutateAsync({ id: opportunity.id, status });
  };

  const handleStageChange = async (stageId: string) => {
    await updateOpp.mutateAsync({ id: opportunity.id, pipelineStageId: stageId });
  };

  const handleNameSave = async () => {
    if (nameValue && nameValue !== opportunity.name) {
      await updateOpp.mutateAsync({ id: opportunity.id, name: nameValue });
    }
    setEditingName(false);
  };

  const handleValueSave = async () => {
    const parsed = parseFloat(moneyValue);
    if (!isNaN(parsed) && parsed !== opportunity.monetaryValue) {
      await updateOpp.mutateAsync({ id: opportunity.id, monetaryValue: parsed });
    }
    setEditingValue(false);
  };

  const handleDelete = async () => {
    if (confirm("Delete this deal permanently?")) {
      await deleteOpp.mutateAsync(opportunity.id);
      router.push("/pipeline");
    }
  };

  const contactName =
    contact?.contactName ||
    contact?.name ||
    `${contact?.firstName || ""} ${contact?.lastName || ""}`.trim() ||
    opportunity.contact?.name ||
    "Unknown";

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 border-t border-gray-200">
      {/* Left: Deal Info */}
      <div className="w-[320px] shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => router.push("/pipeline")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to pipeline
          </button>
          {editingName ? (
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave();
              }}
              className="text-lg font-semibold"
              autoFocus
            />
          ) : (
            <h2
              onClick={() => {
                setNameValue(opportunity.name);
                setEditingName(true);
              }}
              className="text-lg font-semibold text-gray-900 cursor-text hover:bg-gray-50 rounded px-1 -mx-1"
            >
              {opportunity.name}
            </h2>
          )}
          {pipeline && <p className="text-xs text-gray-500 mt-1">{pipeline.name}</p>}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Monetary value */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Deal Value
              </label>
              {editingValue ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-600 text-lg">£</span>
                  <Input
                    type="number"
                    value={moneyValue}
                    onChange={(e) => setMoneyValue(e.target.value)}
                    onBlur={handleValueSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleValueSave();
                    }}
                    className="text-lg font-bold"
                    autoFocus
                  />
                </div>
              ) : (
                <p
                  onClick={() => {
                    setMoneyValue(opportunity.monetaryValue?.toString() || "0");
                    setEditingValue(true);
                  }}
                  className="text-2xl font-bold text-green-600 cursor-text hover:bg-gray-50 rounded px-1 -mx-1 mt-1"
                >
                  {formatCurrency(opportunity.monetaryValue || 0)}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Status
              </label>
              <div className="flex gap-1.5">
                {["open", "won", "lost", "abandoned"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      opportunity.status === s
                        ? s === "open"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : s === "won"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : s === "lost"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Stage
              </label>
              <Select value={opportunity.pipelineStageId} onValueChange={handleStageChange}>
                <SelectTrigger className="h-9">
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

            <Separator />

            {/* Contact card */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Contact
              </label>
              <Card className="shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {getInitials(contactName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/contacts/${opportunity.contactId}`}
                        className="text-sm font-medium text-blue-600 hover:underline truncate block"
                      >
                        {contactName}
                      </Link>
                    </div>
                    <Link href={`/contacts/${opportunity.contactId}`}>
                      <ExternalLink className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                    </Link>
                  </div>
                  {(contact?.email || opportunity.contact?.email) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">
                        {contact?.email || opportunity.contact?.email}
                      </span>
                    </div>
                  )}
                  {(contact?.phone || opportunity.contact?.phone) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      <span>{contact?.phone || opportunity.contact?.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-2 text-xs text-gray-400">
              {(opportunity.dateAdded || opportunity.createdAt) && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Created: {formatDate((opportunity.dateAdded || opportunity.createdAt)!)}
                </div>
              )}
              {opportunity.lastStageChangeAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Stage changed: {formatDate(opportunity.lastStageChangeAt)}
                </div>
              )}
            </div>

            <Separator />

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Deal
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Center: Conversation with linked contact */}
      <div className="flex-1 border-l border-gray-200">
        {opportunity.contactId ? (
          <ContactConversation
            contactId={opportunity.contactId}
            contactName={contactName}
            locationId={locationId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No contact linked to this deal
          </div>
        )}
      </div>

      {/* Right: Details */}
      <div className="w-[300px] shrink-0 border-l border-gray-200 bg-white">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Details</h3>

            {opportunity.source && (
              <div>
                <label className="text-xs text-gray-500">Source</label>
                <p className="text-sm text-gray-900">{opportunity.source}</p>
              </div>
            )}

            {opportunity.assignedTo && (
              <div>
                <label className="text-xs text-gray-500">Assigned To</label>
                <p className="text-sm text-gray-900">{opportunity.assignedTo}</p>
              </div>
            )}

            {/* Contact tags */}
            {contact?.tags && contact.tags.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Contact Tags</label>
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Custom fields */}
            {opportunity.customFields && opportunity.customFields.length > 0 && (
              <>
                <Separator />
                <h4 className="text-xs font-medium text-gray-500 uppercase">Custom Fields</h4>
                {opportunity.customFields.map((cf) => (
                  <div key={cf.id}>
                    <label className="text-xs text-gray-500">{cf.id}</label>
                    <p className="text-sm text-gray-900">{cf.value}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
