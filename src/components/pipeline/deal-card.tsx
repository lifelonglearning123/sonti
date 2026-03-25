"use client";

import { type DragEvent, type MouseEvent } from "react";
import { DollarSign, User, Mail, GripVertical, Phone, MessageSquare, FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import type { Opportunity } from "@/types/opportunity";

interface DealCardProps {
  opportunity: Opportunity;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onClick: () => void;
}

const statusVariants: Record<string, "success" | "default" | "destructive" | "warning"> = {
  open: "success",
  won: "default",
  lost: "destructive",
  abandoned: "warning",
};

export function DealCard({ opportunity, onDragStart, onDragEnd, isDragging, onClick }: DealCardProps) {
  const handleActionClick = (e: MouseEvent, action: string) => {
    e.stopPropagation();
    console.log(`Action: ${action} for opportunity ${opportunity.id}`);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing card-hover transition-all group",
        isDragging && "opacity-50 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800 scale-[1.02] rotate-1"
      )}
      style={{
        transition: isDragging ? "transform 0.2s ease, opacity 0.2s ease" : undefined,
      }}
    >
      {/* Header: Name + Grip */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">{opportunity.name}</h4>
        <GripVertical className="h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
      </div>

      {/* Contact & Email */}
      <div className="space-y-1.5">
        {opportunity.contact && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{opportunity.contact.name || opportunity.contact.email}</span>
          </div>
        )}
        {opportunity.contact?.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{opportunity.contact.email}</span>
          </div>
        )}

        {/* Value row */}
        {opportunity.monetaryValue != null && opportunity.monetaryValue > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <DollarSign className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(opportunity.monetaryValue)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1">
            <DollarSign className="h-3 w-3 shrink-0" />
            <span>No value</span>
          </div>
        )}

        {/* Status badge & time ago */}
        <div className="flex items-center justify-between mt-2">
          <Badge variant={statusVariants[opportunity.status] || "secondary"} className="text-[10px] h-5">
            {opportunity.status}
          </Badge>
          {(opportunity.dateAdded || opportunity.createdAt) && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {timeAgo((opportunity.dateAdded || opportunity.createdAt)!)}
            </span>
          )}
        </div>
      </div>

      {/* Action icons row */}
      <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={(e) => handleActionClick(e, "call")}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Call"
        >
          <Phone className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => handleActionClick(e, "chat")}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Chat"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => handleActionClick(e, "whatsapp")}
          className="relative flex items-center justify-center h-7 w-7 rounded hover:bg-green-50 dark:hover:bg-green-950/30 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          title="WhatsApp"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.13.558 4.13 1.534 5.863L.053 23.812l6.072-1.594A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.023 0-3.957-.544-5.643-1.572l-.405-.24-3.599.944.96-3.508-.264-.42A9.775 9.775 0 012.182 12c0-5.418 4.4-9.818 9.818-9.818S21.818 6.582 21.818 12s-4.4 9.818-9.818 9.818z" />
          </svg>
        </button>
        <button
          onClick={(e) => handleActionClick(e, "documents")}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Documents"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => handleActionClick(e, "email")}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Email"
        >
          <Mail className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => handleActionClick(e, "calendar")}
          className="flex items-center justify-center h-7 w-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Calendar"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
