import type { ChatAnswerSource, ChatMessage } from "@/lib/supabase-api";

export interface ChatAttachmentPreview {
    id: string;
    title?: string | null;
    summary?: string | null;
    fileUrl: string;
    mimeType?: string;
    status?: "uploading" | "ready" | "error";
    citationLabel?: string;
}

export interface AssistantMessage extends ChatMessage {
    id: string;
    metadata?: Record<string, unknown>;
    attachments?: ChatAttachmentPreview[];
    sources?: ChatAnswerSource[];
}
