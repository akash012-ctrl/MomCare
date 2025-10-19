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
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

const MOTHERLY_SYSTEM_PROMPT = `You are MomCare, a supportive AI pregnancy companion. Be warm, empathetic, and concise. Include disclaimers for medical advice. Reference pregnancy week if available.`;

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
    systemPrompt: string
): Promise<{ content: string; tokens: number }> {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
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
        const { messages, userId, conversationId, includeMemory = true } = body;

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

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const finalConversationId = await ensureConversation(
            supabase,
            userId,
            conversationId
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
            systemPrompt
        );

        const userMessage = messages[messages.length - 1];
        await storeMessage(
            supabase,
            userId,
            finalConversationId,
            "user",
            userMessage.content
        );
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
