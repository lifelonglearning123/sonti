"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  usePipelines,
  useOpportunities,
  useUpdateOpportunity,
  useDeleteOpportunity,
} from "@/hooks/use-opportunities";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { PipelineList } from "@/components/pipeline/pipeline-list";
import { DealForm } from "@/components/pipeline/deal-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  X,
  Check,
  Trash2,
  ChevronRight,
  Search,
} from "lucide-react";
import type { Opportunity, PipelineStage } from "@/types/opportunity";

type ViewMode = "board" | "list";
type SortField = "dateAdded" | "monetaryValue" | "name";
type SortDirection = "asc" | "desc";

interface ActiveFilters {
  status: string[];
  stageId: string[];
  hasContact: boolean | null;
}

const EMPTY_FILTERS: ActiveFilters = {
  status: [],
  stageId: [],
  hasContact: null,
};

function hasActiveFilters(filters: ActiveFilters): boolean {
  return filters.status.length > 0 || filters.stageId.length > 0 || filters.hasContact !== null;
}

export default function PipelinePage() {
  const { data: session } = useSession();
  const locationId = (session as any)?.locationId || (session as any)?.user?.locationId || "";
  const { data: pipelinesData, isLoading: pipelinesLoading, error: pipelinesError } = usePipelines(locationId);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");

  const pipelines = pipelinesData?.pipelines || [];

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

  const { data: oppsData, isLoading: oppsLoading, error: oppsError } = useOpportunities(locationId, selectedPipelineId);
  const updateOpportunity = useUpdateOpportunity();
  const deleteOpportunity = useDeleteOpportunity();

  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [sortField, setSortField] = useState<SortField>("dateAdded");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages = useMemo(
    () => selectedPipeline?.stages?.sort((a, b) => a.position - b.position) || [],
    [selectedPipeline]
  );
  const allOpportunities = oppsData?.opportunities || [];

  // Clear selection when switching views or pipelines
  useEffect(() => {
    setSelectedIds(new Set());
  }, [viewMode, selectedPipelineId]);

  // Listen for new deal shortcut
  useEffect(() => {
    const handler = () => setShowForm(true);
    document.addEventListener("shortcut-new-deal", handler);
    return () => document.removeEventListener("shortcut-new-deal", handler);
  }, []);

  // Apply search
  const searchedOpportunities = useMemo(() => {
    if (!searchQuery.trim()) return allOpportunities;
    const q = searchQuery.toLowerCase();
    return allOpportunities.filter((o) => {
      const name = (o.name || "").toLowerCase();
      const contactName = (o.contact?.name || "").toLowerCase();
      const contactEmail = (o.contact?.email || "").toLowerCase();
      return name.includes(q) || contactName.includes(q) || contactEmail.includes(q);
    });
  }, [allOpportunities, searchQuery]);

  // Apply filters
  const filteredOpportunities = useMemo(() => {
    let result = searchedOpportunities;

    if (filters.status.length > 0) {
      result = result.filter((o) => filters.status.includes(o.status));
    }
    if (filters.stageId.length > 0) {
      result = result.filter((o) => filters.stageId.includes(o.pipelineStageId));
    }
    if (filters.hasContact === true) {
      result = result.filter((o) => o.contact != null);
    } else if (filters.hasContact === false) {
      result = result.filter((o) => o.contact == null);
    }

    return result;
  }, [searchedOpportunities, filters]);

  // Apply sort
  const sortedOpportunities = useMemo(() => {
    const sorted = [...filteredOpportunities];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "monetaryValue":
          cmp = (a.monetaryValue || 0) - (b.monetaryValue || 0);
          break;
        case "dateAdded": {
          const da = new Date(a.dateAdded || a.createdAt || 0).getTime();
          const db = new Date(b.dateAdded || b.createdAt || 0).getTime();
          cmp = da - db;
          break;
        }
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredOpportunities, sortField, sortDirection]);

  const handleSort = useCallback(
    (field: string) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field as SortField);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  // Filter helpers
  const toggleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const toggleStageFilter = (stageId: string) => {
    setFilters((prev) => ({
      ...prev,
      stageId: prev.stageId.includes(stageId)
        ? prev.stageId.filter((s) => s !== stageId)
        : [...prev.stageId, stageId],
    }));
  };

  const toggleHasContactFilter = (value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      hasContact: prev.hasContact === value ? null : value,
    }));
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const removeFilter = (type: string, value?: string) => {
    if (type === "status" && value) {
      setFilters((prev) => ({ ...prev, status: prev.status.filter((s) => s !== value) }));
    } else if (type === "stageId" && value) {
      setFilters((prev) => ({ ...prev, stageId: prev.stageId.filter((s) => s !== value) }));
    } else if (type === "hasContact") {
      setFilters((prev) => ({ ...prev, hasContact: null }));
    }
  };

  // Bulk actions
  const handleBulkChangeStage = async (stageId: string) => {
    const promises = Array.from(selectedIds).map((id) =>
      updateOpportunity.mutateAsync({ id, pipelineStageId: stageId })
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  const handleBulkChangeStatus = async (status: string) => {
    const promises = Array.from(selectedIds).map((id) =>
      updateOpportunity.mutateAsync({ id, status })
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} deal(s)? This cannot be undone.`)) return;
    const promises = Array.from(selectedIds).map((id) =>
      deleteOpportunity.mutateAsync(id)
    );
    await Promise.all(promises);
    setSelectedIds(new Set());
  };

  // Error state
  if (pipelinesError || oppsError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">Failed to load pipeline data</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          {(pipelinesError as Error)?.message || (oppsError as Error)?.message || "Please check your API connection and try again."}
        </p>
      </div>
    );
  }

  // Loading state
  if (pipelinesLoading || oppsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[300px] space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filterCount = filters.status.length + filters.stageId.length + (filters.hasContact !== null ? 1 : 0);
  const opportunityCount = allOpportunities.length;

  return (
    <div>
      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-blue-600 text-white rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} deal{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="h-4 w-px bg-blue-400" />

          {/* Bulk Change Stage */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-500 hover:text-white h-7 text-xs"
              >
                Change Stage
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stages.map((stage) => (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => handleBulkChangeStage(stage.id)}
                >
                  {stage.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Change Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-500 hover:text-white h-7 text-xs"
              >
                Change Status
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Set status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["open", "won", "lost", "abandoned"].map((s) => (
                <DropdownMenuItem key={s} onClick={() => handleBulkChangeStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-red-500 hover:text-white h-7 text-xs ml-auto"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-500 hover:text-white h-7 text-xs"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Pipeline selector with opportunity count */}
          {pipelines.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {opportunityCount} opportunit{opportunityCount === 1 ? "y" : "ies"}
              </span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunities..."
              className="pl-8 h-9 w-[200px] text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center justify-center h-9 w-9 transition-colors ${
                viewMode === "board"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title="Board view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center h-9 w-9 transition-colors ${
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filter
                {filterCount > 0 && (
                  <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-medium">
                    {filterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {["open", "won", "lost", "abandoned"].map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleStatusFilter(s);
                  }}
                  className="justify-between"
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {filters.status.includes(s) && <Check className="h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Stage</DropdownMenuLabel>
              {stages.map((stage) => (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleStageFilter(stage.id);
                  }}
                  className="justify-between"
                >
                  {stage.name}
                  {filters.stageId.includes(stage.id) && <Check className="h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Contact</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  toggleHasContactFilter(true);
                }}
                className="justify-between"
              >
                Has contact
                {filters.hasContact === true && <Check className="h-4 w-4 text-blue-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  toggleHasContactFilter(false);
                }}
                className="justify-between"
              >
                No contact
                {filters.hasContact === false && <Check className="h-4 w-4 text-blue-600" />}
              </DropdownMenuItem>
              {hasActiveFilters(filters) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters} className="text-red-600 justify-center font-medium">
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { field: "dateAdded" as SortField, label: "Created date" },
                { field: "monetaryValue" as SortField, label: "Value" },
                { field: "name" as SortField, label: "Name" },
              ].map(({ field, label }) => (
                <DropdownMenuItem
                  key={field}
                  onClick={() => handleSort(field)}
                  className="justify-between"
                >
                  {label}
                  {sortField === field && (
                    <span className="text-[10px] text-gray-500 uppercase">
                      {sortDirection === "asc" ? "A-Z" : "Z-A"}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters(filters) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">Filters:</span>
          {filters.status.map((s) => (
            <Badge key={`status-${s}`} variant="outline" className="gap-1 pr-1 cursor-pointer">
              Status: {s}
              <button
                onClick={() => removeFilter("status", s)}
                className="ml-0.5 rounded-full hover:bg-gray-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.stageId.map((sid) => {
            const stage = stages.find((s) => s.id === sid);
            return (
              <Badge key={`stage-${sid}`} variant="outline" className="gap-1 pr-1 cursor-pointer">
                Stage: {stage?.name || sid}
                <button
                  onClick={() => removeFilter("stageId", sid)}
                  className="ml-0.5 rounded-full hover:bg-gray-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {filters.hasContact !== null && (
            <Badge variant="outline" className="gap-1 pr-1 cursor-pointer">
              {filters.hasContact ? "Has contact" : "No contact"}
              <button
                onClick={() => removeFilter("hasContact")}
                className="ml-0.5 rounded-full hover:bg-gray-200 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Search results indicator */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">
            Showing {sortedOpportunities.length} result{sortedOpportunities.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
          </span>
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Main content */}
      {viewMode === "board" ? (
        <PipelineBoard
          pipeline={selectedPipeline}
          opportunities={sortedOpportunities}
          isLoading={false}
        />
      ) : (
        <PipelineList
          opportunities={sortedOpportunities}
          stages={stages}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      {/* Deal creation form */}
      {selectedPipeline && (
        <DealForm
          open={showForm}
          onOpenChange={setShowForm}
          pipeline={selectedPipeline}
          locationId={locationId}
        />
      )}
    </div>
  );
}
