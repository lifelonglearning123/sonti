"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContacts, useDeleteContact, useLocationTags } from "@/hooks/use-contacts";
import { ContactTable, type SortField, type SortDirection } from "@/components/contacts/contact-table";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { ContactForm } from "@/components/contacts/contact-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Trash2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import type { Contact } from "@/types/contact";

export default function ContactsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [recentContactIds, setRecentContactIds] = useState<string[]>([]);

  const locationId = (session as any)?.locationId || (session as any)?.user?.locationId || "";
  const { data, isLoading } = useContacts(locationId, search, page);
  const deleteContact = useDeleteContact();
  const { data: tagsData } = useLocationTags(locationId);
  const availableTags = tagsData?.tags || [];

  const pageSize = 20;
  const totalContacts = data?.total || 0;
  const totalPages = Math.ceil(totalContacts / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalContacts);

  // Load recently viewed contacts
  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem("sonti-recent-contacts") || "[]");
      setRecentContactIds(recent);
    } catch {}
  }, []);

  // Listen for new contact shortcut
  useEffect(() => {
    const handler = () => {
      setEditContact(null);
      setShowForm(true);
    };
    document.addEventListener("shortcut-new-contact", handler);
    return () => document.removeEventListener("shortcut-new-contact", handler);
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search]);

  // Client-side sort and tag filter (on the current page of data)
  const processedContacts = useMemo(() => {
    let contacts = data?.contacts || [];

    // Filter by tags
    if (filterTags.length > 0) {
      contacts = contacts.filter((c) =>
        filterTags.every((tag) => (c.tags || []).includes(tag))
      );
    }

    // Sort
    if (sortField) {
      contacts = [...contacts].sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "name": {
            const nameA = a.name || `${a.firstName || ""} ${a.lastName || ""}`.trim();
            const nameB = b.name || `${b.firstName || ""} ${b.lastName || ""}`.trim();
            cmp = nameA.localeCompare(nameB);
            break;
          }
          case "email":
            cmp = (a.email || "").localeCompare(b.email || "");
            break;
          case "dateAdded":
            cmp =
              new Date(a.dateAdded || 0).getTime() -
              new Date(b.dateAdded || 0).getTime();
            break;
          default:
            break;
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return contacts;
  }, [data?.contacts, filterTags, sortField, sortDirection]);

  // Count contacts per tag (from current page data)
  const tagCounts = useMemo(() => {
    const allContacts = data?.contacts || [];
    const counts: Record<string, number> = {};
    allContacts.forEach((c) => {
      (c.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [data?.contacts]);

  // Recently viewed contacts from current page data
  const recentContacts = useMemo(() => {
    const allContacts = data?.contacts || [];
    return recentContactIds
      .map((id) => allContacts.find((c) => c.id === id))
      .filter(Boolean) as Contact[];
  }, [data?.contacts, recentContactIds]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setShowForm(true);
  };

  const handleDelete = (contact: Contact) => {
    setDeleteTarget(contact);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContact.mutateAsync(deleteTarget.id);
      toast.success("Contact deleted successfully");
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedIds).map((id) =>
        deleteContact.mutateAsync(id)
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} contact(s) deleted`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to delete some contacts");
    }
  };

  const toggleTagFilter = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Page number buttons
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div>
      <ContactFilters
        searchValue={search}
        onSearch={setSearch}
        onCreateClick={() => {
          setEditContact(null);
          setShowForm(true);
        }}
      />

      {/* Recently Viewed */}
      {recentContacts.length > 0 && !search && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Recently Viewed</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => router.push(`/contacts/${contact.id}`)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors shrink-0"
              >
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[8px] bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {getInitials(contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag filter pills with counts */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Tags:</span>
          {availableTags.slice(0, 10).map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTagFilter(tag.name)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                filterTags.includes(tag.name)
                  ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {tag.name}
              {tagCounts[tag.name] != null && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-0.5">
                  {tagCounts[tag.name]}
                </span>
              )}
              {filterTags.includes(tag.name) && (
                <X className="h-3 w-3" />
              )}
            </button>
          ))}
          {filterTags.length > 0 && (
            <button
              onClick={() => setFilterTags([])}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-blue-600 text-white rounded-lg animate-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium">
            {selectedIds.size} contact{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px bg-blue-400" />
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-500 hover:text-white h-7 text-xs"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <ContactTable
        contacts={processedContacts}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Enhanced Pagination */}
      {totalContacts > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {startItem}-{endItem}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {totalContacts.toLocaleString()}
            </span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(p)}
                className="h-8 w-8 p-0 text-xs"
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || processedContacts.length < pageSize}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ContactForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditContact(null);
        }}
        contact={editContact}
        locationId={locationId}
      />

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Contact"
        description={`Are you sure you want to delete ${
          deleteTarget?.name ||
          `${deleteTarget?.firstName || ""} ${deleteTarget?.lastName || ""}`.trim() ||
          "this contact"
        }? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        isPending={deleteContact.isPending}
      />
    </div>
  );
}
