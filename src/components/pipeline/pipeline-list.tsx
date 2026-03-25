"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import type { Opportunity, PipelineStage } from "@/types/opportunity";

interface PipelineListProps {
  opportunities: Opportunity[];
  stages: PipelineStage[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

const statusVariants: Record<string, "success" | "default" | "destructive" | "warning"> = {
  open: "success",
  won: "default",
  lost: "destructive",
  abandoned: "warning",
};

type ColumnDef = {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
};

const columns: ColumnDef[] = [
  { key: "name", label: "Name", sortable: true, className: "min-w-[200px]" },
  { key: "contact", label: "Contact", sortable: false, className: "min-w-[160px]" },
  { key: "monetaryValue", label: "Value", sortable: true, className: "min-w-[100px]" },
  { key: "stage", label: "Stage", sortable: false, className: "min-w-[120px]" },
  { key: "status", label: "Status", sortable: false, className: "min-w-[90px]" },
  { key: "source", label: "Source", sortable: false, className: "min-w-[100px]" },
  { key: "dateAdded", label: "Created", sortable: true, className: "min-w-[110px]" },
];

function SortIcon({ field, sortField, sortDirection }: { field: string; sortField: string; sortDirection: "asc" | "desc" }) {
  if (field !== sortField) {
    return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="h-3 w-3 text-gray-700" />
  ) : (
    <ArrowDown className="h-3 w-3 text-gray-700" />
  );
}

export function PipelineList({
  opportunities,
  stages,
  selectedIds,
  onSelectionChange,
  sortField,
  sortDirection,
  onSort,
}: PipelineListProps) {
  const router = useRouter();

  const allSelected = opportunities.length > 0 && selectedIds.size === opportunities.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < opportunities.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(opportunities.map((o) => o.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const getStage = (stageId: string) => stages.find((s) => s.id === stageId);

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-gray-200 rounded-lg bg-white">
        <div className="text-gray-400 text-sm">No deals found matching your filters.</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    col.sortable && "cursor-pointer select-none hover:text-gray-700",
                    col.className
                  )}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <SortIcon field={col.key} sortField={sortField} sortDirection={sortDirection} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp, index) => {
              const stage = getStage(opp.pipelineStageId);
              const isSelected = selectedIds.has(opp.id);
              return (
                <tr
                  key={opp.id}
                  className={cn(
                    "border-b border-gray-100 transition-colors cursor-pointer",
                    isSelected
                      ? "bg-blue-50 hover:bg-blue-100"
                      : index % 2 === 0
                      ? "bg-white hover:bg-gray-50"
                      : "bg-gray-50/50 hover:bg-gray-100/50"
                  )}
                  onClick={() => router.push(`/pipeline/${opp.id}`)}
                >
                  <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(opp.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-gray-900 line-clamp-1">{opp.name}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    {opp.contact ? (
                      <div className="line-clamp-1">
                        {opp.contact.name || opp.contact.email || "Unknown"}
                      </div>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {opp.monetaryValue != null && opp.monetaryValue > 0 ? (
                      <span className="font-semibold text-green-600">
                        {formatCurrency(opp.monetaryValue)}
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-gray-700">{stage?.name || "Unknown"}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={statusVariants[opp.status] || "secondary"}
                      className="text-[10px] h-5"
                    >
                      {opp.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-gray-500">
                    {opp.source || <span className="text-gray-400">--</span>}
                  </td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                    {opp.dateAdded || opp.createdAt
                      ? formatDate((opp.dateAdded || opp.createdAt)!)
                      : "--"}
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
