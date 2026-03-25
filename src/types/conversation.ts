export interface Conversation {
  id: string;
  locationId: string;
  contactId: string;
  fullName?: string;
  contactName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  lastMessageBody?: string;
  lastMessageType?: string;
  lastMessageDate?: number;
  lastMessageDirection?: string;
  unreadCount?: number;
  type?: string;
  dateAdded?: number;
  dateUpdated?: number;
  tags?: string[];
}

export interface ConversationSearchResponse {
  conversations: Conversation[];
  total: number;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body?: string;
  type?: number;
  messageType?: string;
  locationId: string;
  contactId: string;
  conversationId: string;
  dateAdded: string;
  dateUpdated?: string;
  source?: string;
  from?: string;
  to?: string;
  status?: string;
  contentType?: string;
  attachments?: any[];
  meta?: {
    email?: {
      subject?: string;
      messageIds?: string[];
      direction?: string;
    };
  };
}

export interface MessagesResponse {
  messages: {
    messages: Message[];
    lastMessageId?: string;
    nextPage?: boolean;
  };
}

export type ChannelType = "SMS" | "WhatsApp" | "Email" | "WhatsApp Bridge" | "Internal Comment";

export interface SendMessageInput {
  type: string;
  contactId: string;
  conversationId?: string;
  message: string;
  subject?: string;
}
