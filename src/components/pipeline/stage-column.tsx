"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { PipelineStage } from "@/types/opportunity";

interface StageColumnProps {
  stage: PipelineStage;
  count: number;
  totalValue: number;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  children: ReactNode;
}

export function StageColumn({ stage, count, totalValue, onDragOver, onDrop, children }: StageColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    onDragOver(e);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      className={cn(
        "flex flex-col min-w-[300px] max-w-[300px] bg-gray-50 dark:bg-gray-900/50 rounded-xl transition-colors duration-150",
        isDragOver && "bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-300 dark:ring-blue-700 ring-inset"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          )}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stage.name}</h3>
          <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            {count}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatCurrency(totalValue)}
          </span>
        )}
      </div>

      {/* Cards area - collapsible */}
      {!isCollapsed && (
        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
          {children}
          {count === 0 && (
            <div className={cn(
              "flex items-center justify-center h-20 text-xs text-gray-400 dark:text-gray-500 border-2 border-dashed rounded-lg transition-colors",
              isDragOver ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400" : "border-gray-200 dark:border-gray-700"
            )}>
              Drop deals here
            </div>
          )}
        </div>
      )}

      {/* Collapsed placeholder to still accept drops */}
      {isCollapsed && (
        <div className="p-2">
          <div className={cn(
            "flex items-center justify-center h-12 text-xs text-gray-400 dark:text-gray-500 border-2 border-dashed rounded-lg transition-colors",
            isDragOver ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400" : "border-gray-200 dark:border-gray-700"
          )}>
            {count} deal{count !== 1 ? "s" : ""} &middot; Drop here
          </div>
        </div>
      )}
    </div>
  );
}
