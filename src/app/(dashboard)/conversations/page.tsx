"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useConversations, useMessages } from "@/hooks/use-conversations";
import { ConversationList } from "@/components/conversations/conversation-list";
import { MessageThread } from "@/components/conversations/message-thread";
import { ContactContextPanel } from "@/components/conversations/contact-context-panel";
import { PanelRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";

export default function ConversationsPage() {
  const { data: session } = useSession();
  const locationId = (session as any)?.locationId || (session as any)?.user?.locationId || "";
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(true);

  const { data: convData, isLoading: convsLoading } = useConversations(locationId, search);
  const { data: msgData, isLoading: msgsLoading } = useMessages(selectedConversation?.id || "");

  const conversations = convData?.conversations || [];
  const messages = Array.isArray(msgData?.messages?.messages)
    ? msgData.messages.messages
    : [];

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 border-t border-gray-200 dark:border-gray-800">
      {/* Conversation list - left panel */}
      <div className={cn(
        "border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col shrink-0",
        "w-[380px] max-md:w-full",
        selectedConversation && "max-md:hidden"
      )}>
        <ConversationList
          conversations={conversations}
          isLoading={convsLoading}
          selectedId={selectedConversation?.id || null}
          onSelect={(conv) => {
            setSelectedConversation(conv);
            setShowContextPanel(true);
          }}
          onSearch={setSearch}
          searchValue={search}
        />
      </div>

      {/* Message thread - center panel */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        !selectedConversation && "max-md:hidden"
      )}>
        {selectedConversation && (
          <div className="absolute right-0 top-0 z-10">
            {/* Context panel toggle is in the header */}
          </div>
        )}
        <MessageThread
          conversation={selectedConversation}
          messages={messages}
          isLoading={msgsLoading}
          onBack={() => setSelectedConversation(null)}
          onToggleContext={() => setShowContextPanel(!showContextPanel)}
          showContextToggle={!!selectedConversation}
          isContextOpen={showContextPanel}
        />
      </div>

      {/* Contact context panel - right panel */}
      {selectedConversation && showContextPanel && (
        <div className="w-[300px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 flex flex-col max-lg:hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Info</span>
            <button
              onClick={() => setShowContextPanel(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ContactContextPanel
              contactId={selectedConversation.contactId}
              locationId={locationId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
