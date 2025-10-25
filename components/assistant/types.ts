import type { ChatMessage } from "@/lib/supabase-api";

export interface AssistantMessage extends ChatMessage {
    id: string;
    metadata?: Record<string, unknown>;
}
