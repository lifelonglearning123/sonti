"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  Mail,
  MessageSquare,
  Phone,
  ArrowLeft,
  Hash,
  MessageCircle,
  ExternalLink,
  PanelRight,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getInitials, formatDateTime } from "@/lib/utils";
import { useSendMessage } from "@/hooks/use-conversations";
import { toast } from "sonner";
import type { Message, Conversation, ChannelType } from "@/types/conversation";

interface MessageThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  onBack?: () => void;
  onToggleContext?: () => void;
  showContextToggle?: boolean;
  isContextOpen?: boolean;
}

const CHANNELS: { type: ChannelType; label: string; icon: React.ElementType }[] = [
  { type: "SMS", label: "SMS", icon: MessageSquare },
  { type: "WhatsApp", label: "WhatsApp", icon: Phone },
  { type: "Email", label: "Email", icon: Mail },
  { type: "WhatsApp Bridge", label: "WA Bridge", icon: MessageCircle },
  { type: "Internal Comment", label: "Comment", icon: Hash },
];

function isActivity(msg: Message): boolean {
  return msg.messageType?.startsWith("TYPE_ACTIVITY") || false;
}

function getMessageTypeLabel(msg: Message): string | null {
  if (msg.messageType === "TYPE_SMS") return "SMS";
  if (msg.messageType === "TYPE_EMAIL") return msg.meta?.email?.subject || "Email";
  if (msg.messageType === "TYPE_CALL") return "Call";
  if (msg.messageType === "TYPE_WHATSAPP" || msg.messageType === "TYPE_FB_MESSENGER") return "WhatsApp";
  return null;
}

function getMessageTypeTag(msg: Message): string | null {
  if (msg.messageType === "TYPE_SMS") return "SMS";
  if (msg.messageType === "TYPE_EMAIL") return "Email";
  if (msg.messageType === "TYPE_CALL") return "Call";
  if (msg.messageType === "TYPE_WHATSAPP") return "WhatsApp";
  return msg.messageType ? msg.messageType.replace("TYPE_", "") : null;
}

// Date grouping helpers
function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot" />
      </div>
    </div>
  );
}

// Read receipt icon
function ReadReceipt({ status }: { status?: string }) {
  if (status === "delivered" || status === "read") {
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  }
  return <Check className="h-3 w-3 text-gray-400 dark:text-gray-500" />;
}

export function MessageThread({ conversation, messages, isLoading, onBack, onToggleContext, showContextToggle, isContextOpen }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [activeChannel, setActiveChannel] = useState<ChannelType>("SMS");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  // Derive from/to numbers from conversation and messages
  const { fromNumber, toNumber } = useMemo(() => {
    const contactPhone = conversation?.phone || "";
    let locationPhone = "";
    for (const msg of messages) {
      if (msg.direction === "outbound" && msg.from) {
        locationPhone = msg.from;
        break;
      }
      if (msg.direction === "inbound" && msg.to) {
        locationPhone = msg.to;
        break;
      }
    }
    return {
      fromNumber: locationPhone || "+44 7883 303752",
      toNumber: contactPhone,
    };
  }, [conversation, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const contactId = conversation?.contactId ?? "";
  const contactName = conversation?.fullName || conversation?.contactName || conversation?.email || "Unknown";

  const handleSend = async () => {
    if (!conversation) return;
    if (!newMessage.trim()) return;
    if (activeChannel === "Email" && !emailSubject.trim()) return;
    try {
      await sendMessage.mutateAsync({
        type: activeChannel === "WhatsApp Bridge" ? "WhatsApp" : activeChannel === "Internal Comment" ? "Note" : activeChannel,
        contactId: conversation.contactId,
        conversationId: conversation.id,
        message: newMessage.trim(),
        ...(activeChannel === "Email" && emailSubject.trim() ? { subject: emailSubject.trim() } : {}),
      });
      setNewMessage("");
      setEmailSubject("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sort messages oldest first
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
  );

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { label: string; messages: Message[] }[] = [];
    let currentLabel = "";

    sortedMessages.forEach((msg) => {
      const msgDate = new Date(msg.dateAdded);
      const label = getDateLabel(msgDate);

      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [sortedMessages]);

  const isInternalComment = activeChannel === "Internal Comment";

  const placeholders: Record<ChannelType, string> = {
    SMS: "Type an SMS message...",
    WhatsApp: "Type a WhatsApp message...",
    Email: "Type your email body...",
    "WhatsApp Bridge": "Type a WhatsApp Bridge message...",
    "Internal Comment": "Add an internal note...",
  };

  // Simulate random online/offline
  const isOnline = useMemo(() => {
    if (!contactId) return false;
    let hash = 0;
    for (let i = 0; i < contactId.length; i++) {
      hash = contactId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 3 === 0;
  }, [contactId]);

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <MessageSquare className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm">Select a conversation to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Link href={`/contacts/${conversation.contactId}`} className="relative">
          <Avatar className="h-9 w-9 hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-700 transition-all cursor-pointer">
            <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800">{getInitials(contactName)}</AvatarFallback>
          </Avatar>
          {/* Online/offline status dot */}
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900",
            isOnline ? "bg-green-500 status-online" : "bg-gray-300 dark:bg-gray-600"
          )} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/contacts/${conversation.contactId}`}
              className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {contactName}
            </Link>
            {isOnline && (
              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Online</span>
            )}
            <Link
              href={`/contacts/${conversation.contactId}`}
              className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {conversation.phone && <span>{conversation.phone}</span>}
            {conversation.phone && conversation.email && <span>·</span>}
            {conversation.email && <span className="truncate">{conversation.email}</span>}
          </div>
        </div>
        {showContextToggle && onToggleContext && (
          <button
            onClick={onToggleContext}
            className={cn(
              "p-2 rounded-md transition-colors",
              isContextOpen
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title={isContextOpen ? "Hide contact info" : "Show contact info"}
          >
            <PanelRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-64" : "w-48")} />
              </div>
            ))}
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">No messages yet</div>
        ) : (
          <>
            {groupedMessages.map((group) => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 bg-gray-50 dark:bg-gray-950">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>

                {group.messages.map((msg) => {
                  if (isActivity(msg)) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                          {msg.body}
                        </span>
                      </div>
                    );
                  }

                  const isOutbound = msg.direction === "outbound";
                  const typeLabel = getMessageTypeLabel(msg);
                  const typeTag = getMessageTypeTag(msg);

                  return (
                    <div key={msg.id} className={cn("flex mb-2", isOutbound ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] space-y-1")}>
                        {typeLabel && (
                          <div className={cn("flex items-center gap-1.5", isOutbound ? "justify-end" : "justify-start")}>
                            {typeTag && (
                              <span
                                className={cn(
                                  "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                                  typeTag === "SMS" && "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400",
                                  typeTag === "Email" && "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400",
                                  typeTag === "WhatsApp" && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400",
                                  typeTag === "Call" && "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400",
                                  !["SMS", "Email", "WhatsApp", "Call"].includes(typeTag) && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                )}
                              >
                                {typeTag}
                              </span>
                            )}
                            {typeTag === "Email" && msg.meta?.email?.subject && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[180px]">
                                {msg.meta.email.subject}
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          className={cn(
                            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                            isOutbound
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md"
                          )}
                        >
                          {msg.body || "(no content)"}
                        </div>
                        <div className={cn("flex items-center gap-1.5 px-1", isOutbound ? "justify-end" : "justify-start")}>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {formatDateTime(msg.dateAdded)}
                          </span>
                          {isOutbound && (
                            <ReadReceipt status={msg.status} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Show typing indicator randomly for demo */}
            {messages.length > 0 && messages[messages.length - 1]?.direction === "outbound" && (
              <TypingIndicator />
            )}
          </>
        )}
      </div>

      {/* Compose area */}
      <div className={cn(
        "border-t bg-white dark:bg-gray-900",
        isInternalComment ? "border-amber-200 dark:border-amber-900" : "border-gray-200 dark:border-gray-800"
      )}>
        {/* Channel tabs */}
        <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-1.5 overflow-x-auto">
          {CHANNELS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setActiveChannel(type)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                activeChannel === type
                  ? type === "Internal Comment"
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700"
                    : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* From / To line */}
        {activeChannel !== "Internal Comment" && (
          <div className="px-4 py-1 flex flex-col gap-0.5 text-[11px] text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-8">From:</span>
              <span className="text-gray-600 dark:text-gray-300">
                {activeChannel === "Email" ? (conversation.email || fromNumber) : fromNumber}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-8">To:</span>
              <span className="text-gray-600 dark:text-gray-300">
                {activeChannel === "Email" ? (conversation.email || toNumber) : toNumber}
              </span>
            </div>
          </div>
        )}

        {/* Internal comment notice */}
        {isInternalComment && (
          <div className="mx-3 mt-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Internal notes are only visible to your team members.
            </p>
          </div>
        )}

        {/* Email subject field */}
        {activeChannel === "Email" && (
          <div className="px-3 pt-1.5">
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Subject..."
              className="h-8 text-sm border-gray-200 dark:border-gray-700"
            />
          </div>
        )}

        {/* Message input */}
        <div className={cn("p-3 flex items-center gap-2", isInternalComment && "bg-amber-50/40 dark:bg-amber-900/10")}>
          {/* Emoji picker button (UI only) */}
          <button
            className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
          {/* File attachment button (UI only) */}
          <button
            className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[activeChannel]}
            className={cn(
              "flex-1",
              isInternalComment && "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 placeholder:text-amber-400 dark:placeholder:text-amber-600"
            )}
          />
          <Button
            onClick={handleSend}
            disabled={
              !newMessage.trim() ||
              sendMessage.isPending ||
              (activeChannel === "Email" && !emailSubject.trim())
            }
            size="icon"
            className={cn(
              "shrink-0 btn-press",
              isInternalComment && "bg-amber-500 hover:bg-amber-600"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
