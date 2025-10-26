/**
 * Chat Attachment Upload Function
 * Handles uploading chat attachments (images & PDFs),
 * runs AI summarisation, and stores vector embeddings for retrieval.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.50.0";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AttachmentUploadRequest {
    userId: string;
    conversationId?: string;
    fileName: string;
    fileBase64: string;
    mimeType: string;
}

interface AttachmentResponse {
    success: boolean;
    documentId: string;
    fileUrl: string;
    title?: string | null;
    summary?: string | null;
    keyFindings?: string[];
    metadata?: Record<string, unknown>;
}

const ATTACHMENT_BUCKET = "conversation-files";
const IMAGE_PROMPT = `You are analysing a medical image provided by a pregnant user.
Return concise JSON with the following shape:
{
  "title": string,
  "summary": string,
  "key_findings": string[],
  "recommendations": string[],
  "raw_text": string
}
Focus on clinically relevant observations. If unsure, be explicit about uncertainty.`;

const PDF_PROMPT = `You will receive the full contents of a medical report.
Extract the key information and respond in JSON with this schema:
{
  "title": string,
  "summary": string,
  "key_findings": string[],
  "recommendations": string[],
  "raw_text": string
}
"raw_text" should contain an easily readable transcript of the important sections (trim long tables).`;

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function decodeBase64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function uploadToStorage(
    supabase: ReturnType<typeof createClient>,
    storagePath: string,
    bytes: Uint8Array,
    mimeType: string
): Promise<string> {
    const { error } = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .upload(storagePath, bytes, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        throw error;
    }

    const { data } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
}

async function summarizeImage(
    imageUrl: string,
    mimeType: string,
    openaiApiKey: string
): Promise<Record<string, unknown>> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o",
            temperature: 0.2,
            max_tokens: 600,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: IMAGE_PROMPT,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                                detail: mimeType.includes("png") ? "high" : "low",
                            },
                        },
                    ],
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Image analysis failed: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("Empty response from image analysis");
    }

    try {
        const jsonMatch =
            content.match(/```json\n([\s\S]*?)\n```/) ||
            content.match(/```\n([\s\S]*?)\n```/);
        const cleaned = jsonMatch ? jsonMatch[1] : content;
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Failed to parse image analysis output", content);
        throw new Error("Unable to parse analysis result");
    }
}

async function uploadFileToOpenAI(
    fileBytes: Uint8Array,
    fileName: string,
    mimeType: string,
    openaiApiKey: string
): Promise<string> {
    const formData = new FormData();
    const arrayBuffer = fileBytes.buffer.slice(
        fileBytes.byteOffset,
        fileBytes.byteOffset + fileBytes.byteLength,
    ) as ArrayBuffer;
    const file = new File([arrayBuffer], fileName, { type: mimeType });
    formData.append("file", file);
    formData.append("purpose", "assistants");

    const uploadResponse = await fetch("https://api.openai.com/v1/files", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: formData,
    });

    if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.text();
        throw new Error(`OpenAI file upload failed: ${errorBody}`);
    }

    const payload = await uploadResponse.json();
    return payload.id as string;
}

async function removeOpenAIFile(fileId: string, openaiApiKey: string): Promise<void> {
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${openaiApiKey}`,
        },
    });
}

async function summarizePdf(
    fileBytes: Uint8Array,
    fileName: string,
    mimeType: string,
    openaiApiKey: string
): Promise<Record<string, unknown>> {
    const fileId = await uploadFileToOpenAI(fileBytes, fileName, mimeType, openaiApiKey);

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                temperature: 0.2,
                max_output_tokens: 900,
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: PDF_PROMPT,
                            },
                            {
                                type: "input_file",
                                file_id: fileId,
                            },
                        ],
                    },
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "document_analysis",
                        schema: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                summary: { type: "string" },
                                key_findings: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                recommendations: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                                raw_text: { type: "string" },
                            },
                            required: ["title", "summary", "raw_text"],
                            additionalProperties: false,
                        },
                    },
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`PDF analysis failed: ${errorBody}`);
        }

        const data = await response.json();
        const output = data.output ?? data.choices ?? [];

        let jsonText: string | null = null;

        if (Array.isArray(output) && output.length > 0) {
            const first = output[0];
            if (first?.content?.[0]?.text) {
                jsonText = first.content[0].text;
            } else if (first?.text) {
                jsonText = first.text;
            }
        }

        if (!jsonText && typeof data.output_text === "string") {
            jsonText = data.output_text;
        }

        if (!jsonText) {
            throw new Error("PDF analysis returned empty content");
        }

        return JSON.parse(jsonText);
    } finally {
        await removeOpenAIFile(fileId, openaiApiKey).catch((error) => {
            console.warn("Failed to delete OpenAI file", error);
        });
    }
}

function buildEmbeddingText(payload: Record<string, unknown>): string {
    const title = typeof payload.title === "string" ? payload.title : "";
    const summary = typeof payload.summary === "string" ? payload.summary : "";
    const rawText = typeof payload.raw_text === "string" ? payload.raw_text : "";
    const keyFindings = Array.isArray(payload.key_findings)
        ? payload.key_findings.filter((item) => typeof item === "string").join("\n")
        : "";

    return [title, summary, keyFindings, rawText].filter(Boolean).join("\n\n");
}

async function createEmbedding(
    text: string,
    openaiApiKey: string
): Promise<{ embedding: number[]; tokensUsed?: number }> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Embedding generation failed: ${error}`);
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding as number[] | undefined;
    if (!embedding) {
        throw new Error("No embedding returned");
    }

    return { embedding, tokensUsed: data.usage?.total_tokens as number | undefined };
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
    }

    try {
        const { userId, conversationId, fileName, fileBase64, mimeType } = (await req.json()) as AttachmentUploadRequest;

        if (!userId || !fileName || !fileBase64 || !mimeType) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
            );
        }

        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!openaiApiKey || !supabaseUrl || !supabaseKey) {
            throw new Error("Missing required environment configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const safeName = sanitizeFileName(fileName);
        const storagePath = `${userId}/${Date.now()}-${safeName}`;
        const fileBytes = decodeBase64ToBytes(fileBase64);
        const fileUrl = await uploadToStorage(supabase, storagePath, fileBytes, mimeType);

        let analysis: Record<string, unknown>;
        const metadata: Record<string, unknown> = {
            mimeType,
        };

        if (mimeType.startsWith("image/")) {
            analysis = await summarizeImage(fileUrl, mimeType, openaiApiKey);
            metadata.analysis_source = "image";
        } else if (mimeType === "application/pdf") {
            analysis = await summarizePdf(fileBytes, safeName, mimeType, openaiApiKey);
            metadata.analysis_source = "pdf";
        } else {
            throw new Error(`Unsupported mime type: ${mimeType}`);
        }

        const textForEmbedding = buildEmbeddingText(analysis);
        const { embedding, tokensUsed } = await createEmbedding(textForEmbedding, openaiApiKey);

        const { data: documentRecord, error: docError } = await supabase
            .from("conversation_documents")
            .insert({
                user_id: userId,
                conversation_id: conversationId ?? null,
                storage_path: storagePath,
                file_url: fileUrl,
                mime_type: mimeType,
                title: typeof analysis.title === "string" ? analysis.title : null,
                summary: typeof analysis.summary === "string" ? analysis.summary : null,
                raw_text: typeof analysis.raw_text === "string" ? analysis.raw_text : null,
                metadata: {
                    ...metadata,
                    key_findings: Array.isArray(analysis.key_findings) ? analysis.key_findings : [],
                    recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
                },
            })
            .select("id, title, summary, metadata, file_url")
            .single();

        if (docError) {
            throw docError;
        }

        await supabase.from("document_embeddings").insert({
            document_id: documentRecord.id,
            embedding,
            content: textForEmbedding,
            tokens_used: tokensUsed ?? null,
        });

        const responsePayload: AttachmentResponse = {
            success: true,
            documentId: documentRecord.id,
            fileUrl,
            title: documentRecord.title,
            summary: documentRecord.summary,
            keyFindings: (documentRecord.metadata?.key_findings as string[] | undefined) ?? [],
            metadata: documentRecord.metadata ?? {},
        };

        return new Response(JSON.stringify(responsePayload), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Chat attachment upload failed", error);
        return new Response(
            JSON.stringify({
                error: "Attachment processing failed",
                details: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
    }
});
