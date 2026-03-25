"use client";

import { Search, X, MessageSquare, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getInitials, timeAgo } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";
import { useState, useCallback, useMemo } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onSearch: (query: string) => void;
  searchValue: string;
}

function getMessageTypeIcon(type?: string) {
  switch (type) {
    case "TYPE_SMS": return <MessageSquare className="h-3 w-3" />;
    case "TYPE_EMAIL": return <Mail className="h-3 w-3" />;
    case "TYPE_CALL": return <Phone className="h-3 w-3" />;
    default: return <MessageSquare className="h-3 w-3" />;
  }
}

// Deterministic "online" status based on contactId
function isContactOnline(contactId: string): boolean {
  let hash = 0;
  for (let i = 0; i < contactId.length; i++) {
    hash = contactId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 3 === 0;
}

export function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  onSearch,
  searchValue,
}: ConversationListProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value);
      const timeout = setTimeout(() => onSearch(value), 300);
      return () => clearTimeout(timeout);
    },
    [onSearch]
  );

  if (isLoading) {
    return (
      <div className="space-y-1 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search conversations..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {localSearch && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-1.5">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              No conversations found
            </div>
          ) : (
            conversations.map((conv) => {
              const name = conv.fullName || conv.contactName || conv.email || conv.phone || "Unknown";
              const isSelected = selectedId === conv.id;
              const online = isContactOnline(conv.contactId);

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "flex items-start gap-3 w-full p-3 rounded-lg text-left transition-colors",
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={cn("text-xs", isSelected && "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300")}>
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online/offline status dot */}
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2",
                      isSelected ? "border-blue-50 dark:border-blue-950" : "border-white dark:border-gray-900",
                      online ? "bg-green-500 status-online" : "bg-gray-300 dark:bg-gray-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm font-medium truncate", isSelected ? "text-blue-900 dark:text-blue-200" : "text-gray-900 dark:text-white")}>
                        {name}
                      </span>
                      {conv.lastMessageDate && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                          {timeAgo(typeof conv.lastMessageDate === 'number' ? new Date(conv.lastMessageDate).toISOString() : conv.lastMessageDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-gray-400 dark:text-gray-500">
                        {getMessageTypeIcon(conv.lastMessageType)}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conv.lastMessageBody || "No messages yet"}
                      </p>
                    </div>
                  </div>
                  {(conv.unreadCount || 0) > 0 && (
                    <Badge className="shrink-0 h-5 min-w-[20px] flex items-center justify-center text-[10px]">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
