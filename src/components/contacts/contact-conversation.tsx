"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  MessageSquare,
  Mail,
  Loader2,
  Phone,
  Hash,
  MessageCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDateTime, formatTimelineTimestamp } from "@/lib/utils";
import {
  useConversations,
  useMessages,
  useSendMessage,
} from "@/hooks/use-conversations";
import type { Message, ChannelType } from "@/types/conversation";

interface ContactConversationProps {
  contactId: string;
  contactName: string;
  contactPhone?: string;
  locationId: string;
}

const CHANNELS: {
  type: ChannelType;
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}[] = [
  { type: "SMS", label: "SMS", icon: MessageSquare, color: "bg-green-100 text-green-700", activeColor: "bg-green-500 text-white ring-1 ring-green-600" },
  { type: "WhatsApp", label: "WhatsApp", icon: Phone, color: "bg-emerald-100 text-emerald-700", activeColor: "bg-emerald-500 text-white ring-1 ring-emerald-600" },
  { type: "Email", label: "Email", icon: Mail, color: "bg-purple-100 text-purple-700", activeColor: "bg-purple-500 text-white ring-1 ring-purple-600" },
  { type: "WhatsApp Bridge", label: "WA Bridge", icon: MessageCircle, color: "bg-teal-100 text-teal-700", activeColor: "bg-teal-500 text-white ring-1 ring-teal-600" },
  { type: "Internal Comment", label: "Comment", icon: Hash, color: "bg-amber-100 text-amber-700", activeColor: "bg-amber-500 text-white ring-1 ring-amber-600" },
];

function isActivity(msg: Message): boolean {
  return msg.messageType?.startsWith("TYPE_ACTIVITY") || false;
}

function getMessageTypeTag(msg: Message): string | null {
  if (msg.messageType === "TYPE_SMS") return "SMS";
  if (msg.messageType === "TYPE_EMAIL") return "Email";
  if (msg.messageType === "TYPE_CALL") return "Call";
  if (msg.messageType === "TYPE_WHATSAPP") return "WhatsApp";
  return msg.messageType ? msg.messageType.replace("TYPE_", "") : null;
}

function getChannelIcon(typeTag: string | null): React.ReactNode {
  switch (typeTag) {
    case "SMS":
      return <MessageSquare className="h-2.5 w-2.5" />;
    case "Email":
      return <Mail className="h-2.5 w-2.5" />;
    case "WhatsApp":
      return <Phone className="h-2.5 w-2.5" />;
    case "Call":
      return <Phone className="h-2.5 w-2.5" />;
    default:
      return <MessageCircle className="h-2.5 w-2.5" />;
  }
}

function getDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContactConversation({
  contactId,
  contactName,
  contactPhone,
  locationId,
}: ContactConversationProps) {
  const [activeChannel, setActiveChannel] = useState<ChannelType>("SMS");
  const [newMessage, setNewMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  // Fetch conversations for this contact using contactId filter
  const { data: convData } = useConversations(
    locationId,
    undefined,
    contactId
  );
  const conversation = convData?.conversations?.[0];

  const { data: msgData, isLoading: msgsLoading } = useMessages(
    conversation?.id || ""
  );
  const messages = Array.isArray(msgData?.messages?.messages)
    ? msgData.messages.messages
    : [];

  // Derive from/to numbers from conversation and messages
  const { fromNumber, toNumber } = useMemo(() => {
    const cPhone = contactPhone || conversation?.phone || "";
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
      fromNumber: locationPhone || "Location number",
      toNumber: cPhone,
    };
  }, [conversation, messages, contactPhone]);

  // Sort oldest first
  const sortedMessages = [...(Array.isArray(messages) ? messages : [])].sort(
    (a, b) =>
      new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
  );

  // Group messages by date for separator rendering
  const messagesWithSeparators = useMemo(() => {
    const result: { type: "separator" | "message"; date?: string; message?: Message }[] = [];
    let lastDate = "";
    for (const msg of sortedMessages) {
      const dateStr = new Date(msg.dateAdded).toDateString();
      if (dateStr !== lastDate) {
        lastDate = dateStr;
        result.push({ type: "separator", date: msg.dateAdded });
      }
      result.push({ type: "message", message: msg });
    }
    return result;
  }, [sortedMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (activeChannel === "Email" && !emailSubject.trim()) return;
    try {
      await sendMessage.mutateAsync({
        type:
          activeChannel === "WhatsApp Bridge"
            ? "WhatsApp"
            : activeChannel === "Internal Comment"
              ? "Note"
              : activeChannel,
        contactId,
        conversationId: conversation?.id,
        message: newMessage.trim(),
        ...(activeChannel === "Email" && emailSubject.trim()
          ? { subject: emailSubject.trim() }
          : {}),
      });
      setNewMessage("");
      setEmailSubject("");
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInternalComment = activeChannel === "Internal Comment";

  const placeholders: Record<ChannelType, string> = {
    SMS: "Type an SMS message...",
    WhatsApp: "Type a WhatsApp message...",
    Email: "Type your email body...",
    "WhatsApp Bridge": "Type a WhatsApp Bridge message...",
    "Internal Comment": "Add an internal note...",
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50/80"
      >
        {msgsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              Send the first message below to start a conversation with{" "}
              {contactName}
            </p>
          </div>
        ) : (
          messagesWithSeparators.map((item, idx) => {
            if (item.type === "separator" && item.date) {
              return (
                <div
                  key={`sep-${item.date}-${idx}`}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider shrink-0">
                    {getDateSeparator(item.date)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              );
            }

            const msg = item.message!;

            if (isActivity(msg)) {
              return (
                <div key={msg.id} className="flex justify-center py-1">
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {msg.body}
                  </span>
                </div>
              );
            }

            const isOutbound = msg.direction === "outbound";
            const typeTag = getMessageTypeTag(msg);

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex py-1",
                  isOutbound ? "justify-end" : "justify-start"
                )}
              >
                <div className="max-w-[75%] space-y-1">
                  {/* Channel tag + direction */}
                  {typeTag && (
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        isOutbound ? "justify-end" : "justify-start"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                          typeTag === "SMS" &&
                            "bg-green-100 text-green-700",
                          typeTag === "Email" &&
                            "bg-purple-100 text-purple-700",
                          typeTag === "WhatsApp" &&
                            "bg-emerald-100 text-emerald-700",
                          typeTag === "Call" &&
                            "bg-orange-100 text-orange-700",
                          !["SMS", "Email", "WhatsApp", "Call"].includes(
                            typeTag
                          ) && "bg-gray-100 text-gray-600"
                        )}
                      >
                        {getChannelIcon(typeTag)}
                        {typeTag}
                      </span>
                      {typeTag === "Email" &&
                        msg.meta?.email?.subject && (
                          <span className="text-[10px] text-gray-400 truncate max-w-[180px]">
                            {msg.meta.email.subject}
                          </span>
                        )}
                    </div>
                  )}
                  {/* Message bubble */}
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm",
                      isOutbound
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                    )}
                  >
                    {msg.body || "(no content)"}
                  </div>
                  {/* Meta line */}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-1",
                      isOutbound ? "justify-end" : "justify-start"
                    )}
                  >
                    {isOutbound ? (
                      <ArrowUpRight className="h-2.5 w-2.5 text-gray-300" />
                    ) : (
                      <ArrowDownLeft className="h-2.5 w-2.5 text-gray-300" />
                    )}
                    <span className="text-[10px] text-gray-400">
                      {formatTimelineTimestamp(msg.dateAdded)}
                    </span>
                    {msg.status && (
                      <span className="text-[10px] text-gray-300">
                        &middot; {msg.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compose area */}
      <div
        className={cn(
          "border-t bg-white",
          isInternalComment ? "border-amber-200" : "border-gray-200"
        )}
      >
        {/* Channel tabs as pills */}
        <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-1.5 overflow-x-auto">
          {CHANNELS.map(({ type, label, icon: Icon, activeColor, color }) => (
            <button
              key={type}
              onClick={() => setActiveChannel(type)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all",
                activeChannel === type ? activeColor : color + " hover:opacity-80"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* From / To line */}
        {activeChannel !== "Internal Comment" && (
          <div className="px-4 py-1.5 flex flex-col gap-0.5 text-[11px] border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-500 w-10">From:</span>
              <span className="text-gray-700 font-mono text-[11px]">
                {activeChannel === "Email"
                  ? conversation?.email || fromNumber
                  : fromNumber}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-500 w-10">To:</span>
              <span className="text-gray-700 font-mono text-[11px]">
                {activeChannel === "Email"
                  ? conversation?.email || toNumber
                  : toNumber}
              </span>
              {contactName && (
                <span className="text-gray-400 text-[10px]">
                  ({contactName})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Internal comment notice */}
        {isInternalComment && (
          <div className="mx-3 mt-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-[11px] text-amber-700">
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
              className="h-8 text-sm border-gray-200"
            />
          </div>
        )}

        {/* Message input */}
        <div
          className={cn(
            "p-3 flex items-center gap-2",
            isInternalComment && "bg-amber-50/40"
          )}
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[activeChannel]}
            className={cn(
              "flex-1",
              isInternalComment &&
                "border-amber-200 bg-amber-50 placeholder:text-amber-400"
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
              "shrink-0",
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
