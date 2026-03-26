"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConversationSearchResponse, MessagesResponse, SendMessageInput } from "@/types/conversation";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`/api/ghl/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let errorMessage = `Error ${res.status}`;
    try {
      const text = await res.text();
      const parsed = JSON.parse(text);
      errorMessage = parsed.message || parsed.error || parsed.msg || errorMessage;
    } catch {
      // keep default errorMessage
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export function useConversations(locationId: string, query?: string, contactId?: string) {
  return useQuery<ConversationSearchResponse>({
    queryKey: ["conversations", locationId, query, contactId],
    queryFn: () => {
      const params = new URLSearchParams({ locationId, limit: "20" });
      if (query) params.set("query", query);
      if (contactId) params.set("contactId", contactId);
      return fetchAPI(`conversations/search?${params.toString()}`);
    },
    enabled: !!locationId,
  });
}

export function useMessages(conversationId: string) {
  return useQuery<MessagesResponse>({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchAPI(`conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: 10000, // Poll for new messages every 10s
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageInput) => {
      const payload: Record<string, unknown> = {
        type: data.type,
        contactId: data.contactId,
        conversationId: data.conversationId,
      };
      if (data.type === "Email") {
        payload.html = data.message;
        payload.subject = data.subject || "";
      } else {
        payload.message = data.message;
      }
      return fetchAPI("conversations/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
