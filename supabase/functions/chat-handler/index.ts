/**
 * Chat Handler Edge Function
 * Handles AI chat requests and manages conversation flow with memory context
 * 
 * This function:
 * - Receives user messages from the client
 * - Validates input and authentication
 * - Calls the AI model for responses with RAG memory
 * - Stores conversation history with embeddings
 * - Returns streamed responses
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.50.0";

declare const Deno: {
    env: {
        get(name: string): string | undefined;
    };
    serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ChatRequest {
    messages: { role: "user" | "assistant"; content: string }[];
    userId: string;
    conversationId?: string;
    includeMemory?: boolean;
    attachmentIds?: string[];
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

const MOTHERLY_SYSTEM_PROMPT = `You are MomCare, a supportive AI pregnancy companion. Be warm, empathetic, and concise. Include disclaimers for medical advice. Reference pregnancy week if available.`;
const SOURCE_INSTRUCTION = `Use the supplied patient documents when relevant. Cite each reference inline using [S1], [S2], etc., and keep the explanation grounded in the provided evidence.`;

interface AttachmentRecord {
    id: string;
    title: string | null;
    summary: string | null;
    file_url: string;
    mime_type?: string | null;
    metadata?: Record<string, unknown> | null;
}

interface SourceEntry {
    id: string;
    title: string | null;
    summary: string | null;
    fileUrl: string;
    citation: string;
    metadata?: Record<string, unknown> | null;
}

async function requireEnv(name: string, supabase?: ReturnType<typeof createClient>): Promise<string> {
    // Try to get from environment first
    let value = Deno.env.get(name);

    // If not in environment and it's OPENAI_API_KEY, try to get from database
    if (!value && name === "OPENAI_API_KEY" && supabase) {
        try {
            const { data, error } = await supabase.rpc('get_secret', { secret_key: name });
            if (!error && data) {
                value = data;
            }
        } catch (error) {
            console.error(`Failed to get ${name} from database:`, error);
        }
    }

    if (!value) {
        throw new Error(`${name} not configured`);
    }
    return value;
}

async function createQueryEmbedding(text: string, apiKey: string): Promise<number[] | null> {
    if (!text.trim()) return null;

    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text.slice(0, 4000),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("Embedding generation failed", error);
        return null;
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding as number[] | undefined;
    return embedding ?? null;
}

async function fetchAttachmentRecords(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    attachmentIds: string[]
): Promise<AttachmentRecord[]> {
    if (!attachmentIds.length) return [];

    const { data, error } = await supabase
        .from("conversation_documents")
        .select("id,title,summary,file_url,mime_type,metadata")
        .in("id", attachmentIds)
        .eq("user_id", userId);

    if (error) {
        console.error("Failed to load attachment records", error);
        return [];
    }

    return (data ?? []) as AttachmentRecord[];
}

async function matchRelevantDocuments(
    supabase: ReturnType<typeof createClient>,
    params: {
        userId: string;
        conversationId: string;
        embedding: number[] | null;
    }
): Promise<AttachmentRecord[]> {
    if (!params.embedding) return [];

    const { data, error } = await supabase.rpc("match_conversation_documents", {
        p_user_id: params.userId,
        p_conversation_id: params.conversationId,
        p_query_embedding: params.embedding,
        p_match_count: 4,
        p_similarity_threshold: 0.68,
    });

    if (error) {
        console.error("match_conversation_documents failed", error);
        return [];
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.document_id as string,
        title: (row.title as string) ?? null,
        summary: (row.summary as string) ?? null,
        file_url: (row.file_url as string) ?? "",
        metadata: undefined,
    }));
}

function buildSourcesSection(records: AttachmentRecord[]): { prompt: string; sources: SourceEntry[] } {
    if (!records.length) {
        return { prompt: "", sources: [] };
    }

    const sources = records.map((record, index) => {
        const citation = `S${index + 1}`;
        return {
            id: record.id,
            title: record.title,
            summary: record.summary,
            fileUrl: record.file_url,
            citation,
            metadata: record.metadata,
        } satisfies SourceEntry;
    });

    const prompt = sources
        .map((source) => {
            const summary = source.summary ?? "";
            const keyFindings = Array.isArray(source.metadata?.key_findings)
                ? (source.metadata?.key_findings as string[]).join("; ")
                : "";
            const additional = [summary, keyFindings].filter(Boolean).join("\n");
            const label = source.title ?? "Patient document";
            return `${source.citation}. ${label}\n${additional}`.trim();
        })
        .join("\n\n");

    return { prompt, sources };
}

async function getMemoryContext(
    supabase: ReturnType<typeof createClient>,
    userId: string
): Promise<string> {
    try {
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("pregnancy_week,trimester")
            .eq("id", userId)
            .single();

        if (!profile) return "";

        let context = "Context: ";
        if (profile.pregnancy_week) context += `Week ${profile.pregnancy_week}, `;
        if (profile.trimester) context += `${profile.trimester}`;

        return context.trim();
    } catch (error) {
        console.error("Error getting memory context:", error);
        return "";
    }
}

async function ensureConversation(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    conversationId?: string
): Promise<string> {
    if (conversationId) return conversationId;

    const { data, error } = await supabase
        .from("conversations")
        .insert({
            user_id: userId,
            title: "MomCare Assistant",
            topic: "assistant",
        })
        .select("id")
        .single();

    if (error) throw error;
    return data.id;
}

async function storeMessage(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    conversationId: string,
    role: "user" | "assistant",
    content: string
): Promise<void> {
    try {
        await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: userId,
            role,
            content,
            source_type: "chat",
            model_used: role === "assistant" ? "gpt-4o-mini" : null,
        });
    } catch (error) {
        console.error("Error storing message:", error);
    }
}

async function callOpenAI(
    messages: Message[],
    systemPrompt: string,
    supportingContext: string | null,
    openaiApiKey: string
): Promise<{ content: string; tokens: number }> {
    const combinedSystemPrompt = supportingContext
        ? `${systemPrompt}\n\n${SOURCE_INSTRUCTION}\n\nSupporting evidence:\n${supportingContext}`
        : systemPrompt;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: combinedSystemPrompt },
                ...messages,
            ],
            temperature: 0.7,
            top_p: 0.95,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const tokens = data.usage?.total_tokens || 0;

    if (!content) throw new Error("No content in OpenAI response");

    return { content, tokens };
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: CORS_HEADERS,
        });
    }

    try {
        const body = (await req.json()) as ChatRequest;
        const {
            messages,
            userId,
            conversationId,
            includeMemory = true,
            attachmentIds: rawAttachmentIds,
        } = body;

        if (!userId || !messages || messages.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "Missing required fields: userId, messages",
                }),
                {
                    status: 400,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                }
            );
        }

        const attachmentIds = Array.isArray(rawAttachmentIds)
            ? rawAttachmentIds
                .map((id) => (typeof id === "string" ? id.trim() : ""))
                .filter((id) => id.length > 0)
            : [];

        const supabaseUrl = await requireEnv("SUPABASE_URL");
        const supabaseKey = await requireEnv("SUPABASE_SERVICE_ROLE_KEY");

        const supabase = createClient(supabaseUrl, supabaseKey);

        const openaiApiKey = await requireEnv("OPENAI_API_KEY", supabase);

        const finalConversationId = await ensureConversation(
            supabase,
            userId,
            conversationId
        );

        if (attachmentIds.length) {
            const { error: updateError } = await supabase
                .from("conversation_documents")
                .update({ conversation_id: finalConversationId })
                .in("id", attachmentIds)
                .eq("user_id", userId);

            if (updateError) {
                console.warn("Failed to tag attachments with conversation", updateError);
            }
        }

        const userMessage = messages[messages.length - 1];
        const latestUserMessage = [...messages]
            .reverse()
            .find((message) => message.role === "user") ?? messages[messages.length - 1];

        const queryEmbedding = await createQueryEmbedding(
            latestUserMessage?.content ?? "",
            openaiApiKey
        );

        const matchedRecords = await matchRelevantDocuments(supabase, {
            userId,
            conversationId: finalConversationId,
            embedding: queryEmbedding,
        });

        const combinedIds = Array.from(
            new Set([
                ...attachmentIds,
                ...matchedRecords.map((record) => record.id),
            ])
        ).filter((id) => id);

        const attachmentContextRecords = await fetchAttachmentRecords(
            supabase,
            userId,
            combinedIds
        );

        const { prompt: sourcesPrompt, sources } = buildSourcesSection(
            attachmentContextRecords
        );

        let memoryContext = "";
        if (includeMemory) {
            memoryContext = await getMemoryContext(supabase, userId);
        }

        const systemPrompt =
            MOTHERLY_SYSTEM_PROMPT +
            (memoryContext
                ? `\n\nUser Context: ${memoryContext}`
                : "");

        // Only send last 3 messages to reduce token usage
        const recentMessages = messages.slice(-3);

        const { content: assistantMessage, tokens } = await callOpenAI(
            recentMessages,
            systemPrompt,
            sourcesPrompt || null,
            openaiApiKey
        );

        if (userMessage.role === "user") {
            await storeMessage(
                supabase,
                userId,
                finalConversationId,
                "user",
                userMessage.content
            );
        }
        await storeMessage(
            supabase,
            userId,
            finalConversationId,
            "assistant",
            assistantMessage
        );

        return new Response(
            JSON.stringify({
                success: true,
                conversationId: finalConversationId,
                message: assistantMessage,
                tokensUsed: tokens,
                timestamp: new Date().toISOString(),
                sources: sources.map((source) => ({
                    id: source.id,
                    title: source.title,
                    summary: source.summary,
                    fileUrl: source.fileUrl,
                    citation: `[${source.citation}]`,
                    metadata: source.metadata ?? undefined,
                })),
            }),
            {
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Chat handler error:", error);
        return new Response(
            JSON.stringify({
                error: "Chat processing failed",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            }
        );
    }
});
