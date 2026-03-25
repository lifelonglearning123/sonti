"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getInitials,
  formatDate,
  cn,
} from "@/lib/utils";
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Columns3,
  Check,
  Users,
  Download,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Contact } from "@/types/contact";

export type SortField = "name" | "email" | "phone" | "dateAdded";
export type SortDirection = "asc" | "desc";

interface ContactTableProps {
  contacts: Contact[];
  isLoading: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  visibleColumns?: Set<string>;
}

const ALL_COLUMNS = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "company", label: "Company" },
  { id: "source", label: "Source" },
  { id: "tags", label: "Tags" },
  { id: "dateAdded", label: "Added" },
];

const DEFAULT_COLUMNS = new Set(["name", "email", "phone", "company", "tags", "dateAdded"]);

function SortIcon({ field, currentField, direction }: { field: string; currentField?: string; direction?: string }) {
  if (field !== currentField) {
    return <ChevronUp className="h-3 w-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
  }
  return direction === "asc" ? (
    <ChevronUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
  ) : (
    <ChevronDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
  );
}

// Inline edit cell component
function InlineEditCell({ value, onSave, className }: { value: string; onSave: (val: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") { setEditValue(value); setEditing(false); }
        }}
        className="text-sm bg-transparent border-b-2 border-blue-500 outline-none px-0 py-0.5 w-full text-gray-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={cn("cursor-text hover:bg-blue-50 dark:hover:bg-blue-950/30 px-1 -mx-1 py-0.5 rounded transition-colors", className)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Double-click to edit"
    >
      {value || "\u2014"}
    </span>
  );
}

// CSV export function
function exportToCSV(contacts: Contact[]) {
  const headers = ["Name", "Email", "Phone", "Company", "Tags", "Date Added"];
  const rows = contacts.map((c) => [
    c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown",
    c.email || "",
    c.phone || "",
    c.companyName || "",
    (c.tags || []).join("; "),
    c.dateAdded ? new Date(c.dateAdded).toLocaleDateString() : "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ContactTable({
  contacts,
  isLoading,
  selectedIds = new Set(),
  onSelectionChange,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  visibleColumns: externalColumns,
}: ContactTableProps) {
  const router = useRouter();
  const [internalColumns, setInternalColumns] = useState(DEFAULT_COLUMNS);
  const visibleColumns = externalColumns || internalColumns;

  const toggleColumn = (colId: string) => {
    const next = new Set(visibleColumns);
    if (next.has(colId)) {
      if (next.size > 1) next.delete(colId);
    } else {
      next.add(colId);
    }
    setInternalColumns(next);
  };

  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
  const someSelected = contacts.some((c) => selectedIds.has(c.id)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(contacts.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts found"
        description="Try adjusting your search or filters, or add your first contact to get started."
        actionLabel="Add Contact"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Column visibility dropdown + CSV export */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {selectedIds.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-500 dark:text-gray-400 gap-1.5"
            onClick={() => exportToCSV(contacts)}
            title="Export to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 dark:text-gray-400 gap-1.5">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {ALL_COLUMNS.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(col.id);
                  }}
                  className="justify-between"
                >
                  {col.label}
                  {visibleColumns.has(col.id) && (
                    <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {onSelectionChange && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </th>
              )}
              {visibleColumns.has("name") && (
                <th
                  className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3 cursor-pointer group select-none"
                  onClick={() => onSort?.("name")}
                >
                  <span className="inline-flex items-center gap-1">
                    Name
                    <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                  </span>
                </th>
              )}
              {visibleColumns.has("email") && (
                <th
                  className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3 cursor-pointer group select-none"
                  onClick={() => onSort?.("email")}
                >
                  <span className="inline-flex items-center gap-1">
                    Email
                    <SortIcon field="email" currentField={sortField} direction={sortDirection} />
                  </span>
                </th>
              )}
              {visibleColumns.has("phone") && (
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Phone
                </th>
              )}
              {visibleColumns.has("company") && (
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Company
                </th>
              )}
              {visibleColumns.has("source") && (
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Source
                </th>
              )}
              {visibleColumns.has("tags") && (
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3">
                  Tags
                </th>
              )}
              {visibleColumns.has("dateAdded") && (
                <th
                  className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3 cursor-pointer group select-none"
                  onClick={() => onSort?.("dateAdded")}
                >
                  <span className="inline-flex items-center gap-1">
                    Added
                    <SortIcon field="dateAdded" currentField={sortField} direction={sortDirection} />
                  </span>
                </th>
              )}
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {contacts.map((contact) => {
              const isSelected = selectedIds.has(contact.id);
              return (
                <tr
                  key={contact.id}
                  className={cn(
                    "group transition-colors cursor-pointer",
                    isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                  onClick={() => {
                    // Track recently viewed
                    try {
                      const recent = JSON.parse(localStorage.getItem("sonti-recent-contacts") || "[]");
                      const updated = [contact.id, ...recent.filter((id: string) => id !== contact.id)].slice(0, 5);
                      localStorage.setItem("sonti-recent-contacts", JSON.stringify(updated));
                    } catch {}
                    router.push(`/contacts/${contact.id}`);
                  }}
                >
                  {onSelectionChange && (
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(contact.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                    </td>
                  )}
                  {visibleColumns.has("name") && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                            {getInitials(
                              contact.name ||
                                `${contact.firstName || ""} ${contact.lastName || ""}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            <InlineEditCell
                              value={contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown"}
                              onSave={(val) => {
                                if (onEdit) onEdit({ ...contact, name: val });
                              }}
                            />
                          </p>
                          {contact.companyName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.has("email") && (
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <InlineEditCell
                        value={contact.email || ""}
                        onSave={(val) => {
                          if (onEdit) onEdit({ ...contact, email: val });
                        }}
                      />
                    </td>
                  )}
                  {visibleColumns.has("phone") && (
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <InlineEditCell
                        value={contact.phone || ""}
                        onSave={(val) => {
                          if (onEdit) onEdit({ ...contact, phone: val });
                        }}
                      />
                    </td>
                  )}
                  {visibleColumns.has("company") && (
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {contact.companyName || <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                  )}
                  {visibleColumns.has("source") && (
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {contact.source ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {contact.source}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has("tags") && (
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(contact.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(contact.tags || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.tags!.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.has("dateAdded") && (
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {contact.dateAdded ? formatDate(contact.dateAdded) : "\u2014"}
                    </td>
                  )}
                  <td
                    className="px-4 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(contact)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onDelete(contact)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
