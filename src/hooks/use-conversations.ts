"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConversationSearchResponse, MessagesResponse, SendMessageInput } from "@/types/conversation";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`/api/ghl/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `Error ${res.status}`);
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
    mutationFn: (data: SendMessageInput) =>
      fetchAPI("conversations/messages/outbound", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
